import { render, waitForElementToBeRemoved } from '@testing-library/react'
import { ethers } from 'ethers'
import { useSafeBalances } from '../src/safeHooks'
import { NetworkId } from './safe'

const TEST_SAFE = {
  address: '0x1076f084A3703E1701a1a97F837906e56370D4f9',
  network: '4' as NetworkId,
}

describe('safe hooks', () => {
  describe('useSafeBalances', () => {
    const ListBalances = ({ lazy = undefined }) => {
      const [balances, { loading, error, fetch }] = useSafeBalances({
        ...TEST_SAFE,
        lazy,
      })

      return (
        <div>
          {loading ? <p>loading...</p> : null}
          {error ? <p>{error.toString()}</p> : null}
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
  })
})
