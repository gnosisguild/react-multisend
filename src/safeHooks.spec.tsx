import {
  render,
  waitForElementToBeRemoved,
  fireEvent,
} from '@testing-library/react'
import { ethers } from 'ethers'
import { useSafeBalances } from '../src/safeHooks'
import { NetworkId } from './safe'

const TEST_SAFE = {
  address: '0x1076f084A3703E1701a1a97F837906e56370D4f9',
  network: '4' as NetworkId,
}

describe('safe hooks', () => {
  describe('useSafeBalances', () => {
    const ListBalances = ({
      address = TEST_SAFE.address,
      network = TEST_SAFE.network,
      lazy = false,
    }) => {
      const [balances, { loading, error, fetch }] = useSafeBalances({
        address,
        network,
        lazy,
      })

      return (
        <div>
          {loading ? <p>loading...</p> : null}
          {error ? <p role="alert">{error.toString()}</p> : null}
          <dl>
            {balances.map((balance) => (
              <label key={balance.tokenAddress}>
                {balance.token?.symbol || 'ETH'}
                <input
                  type="text"
                  readOnly
                  value={ethers.utils.formatEther(balance.balance)}
                />
              </label>
            ))}
          </dl>
          <button onClick={fetch}>fetch</button>
        </div>
      )
    }

    it('should fetch on mount', async () => {
      const { getByText, getByLabelText } = await render(<ListBalances />)
      const loadingIndicator = getByText('loading...')
      await waitForElementToBeRemoved(loadingIndicator)
      expect(getByLabelText('ETH')).toHaveValue('0.1')
    })

    it('should not fetch directly when passing lazy, but when calling the fetch callback', async () => {
      const { getByText, queryByText, getByLabelText } = await render(
        <ListBalances lazy />
      )
      expect(queryByText('loading...')).not.toBeInTheDocument()
      fireEvent.click(getByText('fetch'))
      const loadingIndicator = getByText('loading...')
      await waitForElementToBeRemoved(loadingIndicator)
      expect(getByLabelText('ETH')).toHaveValue('0.1')
    })

    it('should expose the error if the fetch goes wrong', async () => {
      const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation()
      const { getByText, getByRole } = await render(
        <ListBalances address="0x0" />
      )
      const loadingIndicator = getByText('loading...')
      await waitForElementToBeRemoved(loadingIndicator)
      expect(getByRole('alert')).toHaveTextContent(/Error:/)
      expect(consoleErrorMock).toHaveBeenCalledWith(
        'Safe fetch error',
        expect.any(Error)
      )
      consoleErrorMock.mockRestore()
    })

    it('should not use results of canceled requests', async () => {
      const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation()

      const { rerender, getByText, queryByLabelText, getByRole } = await render(
        <ListBalances />
      )
      await waitForElementToBeRemoved(getByText('loading...'))
      expect(queryByLabelText('ETH')).toBeInTheDocument()

      // trigger a refetch, and re-render right afterwards
      fireEvent.click(getByText('fetch'))
      rerender(<ListBalances address="0x0" />)

      // previous results are wiped right away
      expect(queryByLabelText('ETH')).not.toBeInTheDocument()

      await waitForElementToBeRemoved(getByText('loading...'))
      expect(getByRole('alert')).toHaveTextContent(/Error:/)

      // results of the canceled request, will not be applied
      expect(queryByLabelText('ETH')).not.toBeInTheDocument()

      consoleErrorMock.mockRestore()
    })

    it('should reset the loading state when receiving props for a new Safe', async () => {
      const { rerender, queryByText } = await render(<ListBalances />)
      expect(queryByText('loading...')).toBeInTheDocument()
      rerender(<ListBalances lazy address="0x0" />)
      expect(queryByText('loading...')).not.toBeInTheDocument()
    })

    it('should reset the error states when receiving props for a new Safe', async () => {
      const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation()

      const { rerender, getByText, queryByRole } = await render(
        <ListBalances address="0x0" />
      )
      await waitForElementToBeRemoved(getByText('loading...'))
      expect(queryByRole('alert')).toBeInTheDocument()

      // not every props update shall reset the state...
      rerender(<ListBalances lazy address="0x0" />)
      expect(queryByRole('alert')).toBeInTheDocument()

      // ... but when address or network change, state must be reset.
      rerender(<ListBalances lazy address="0x1" />)
      expect(queryByRole('alert')).not.toBeInTheDocument()

      consoleErrorMock.mockRestore()
    })
  })
})
