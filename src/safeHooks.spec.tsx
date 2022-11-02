import {
  fireEvent,
  render,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react'
import { ethers } from 'ethers'
import React from 'react'

import {
  ProvideSafeBalances,
  ProvideSafeCollectibles,
  useSafeBalances,
  useSafeCollectibles,
} from '../src/safeHooks'

import { NetworkId } from './safe'

const TEST_SAFE = {
  address: '0xCDd6e79fBC90643dC59273500E3A408EfA24d57C',
  network: '5' as NetworkId,
}

describe('safe hooks', () => {
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
        <button onClick={fetch}>fetch</button>
      </div>
    )
  }

  describe('useSafeBalances', () => {
    it('should provide the token balances held in the Safe', async () => {
      const { getByText, getByLabelText } = render(<ListBalances />)
      await waitForElementToBeRemoved(getByText('loading...'), {
        timeout: 5000,
      })
      expect(getByLabelText('ETH')).toHaveValue('0.01')
      expect(getByLabelText('DAI')).toHaveValue('1000000.0')
    })

    it('should use the state provided via context from <ProvideSafeBalances>  when called without arg', async () => {
      const renderSpy = jest.fn()
      const SpyOnBalances = () => {
        const [balances, { loading }] = useSafeBalances()
        renderSpy(balances, loading)
        return null
      }

      render(
        <ProvideSafeBalances {...TEST_SAFE}>
          <SpyOnBalances />
        </ProvideSafeBalances>
      )
      expect(renderSpy).toHaveBeenCalledWith([], true)
      renderSpy.mockClear()

      await waitFor(
        () =>
          expect(renderSpy).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ token: null })]),
            false
          ),
        { timeout: 5000 }
      )
    })
  })

  describe('useSafeCollectibles', () => {
    const ListCollectibles = ({
      address = TEST_SAFE.address,
      network = TEST_SAFE.network,
      lazy = false,
    }) => {
      const [collectibles, { loading, error, fetch }] = useSafeCollectibles({
        address,
        network,
        lazy,
      })

      return (
        <div>
          {loading ? <p>loading...</p> : null}
          {error ? <p role="alert">{error.toString()}</p> : null}
          {collectibles.map((collectible) => (
            <label key={`${collectible.address}-${collectible.id}`}>
              {collectible.tokenName}: {collectible.name}
              <input type="text" readOnly value={collectible.id} />
            </label>
          ))}
          <button onClick={fetch}>fetch</button>
        </div>
      )
    }

    it('should provide the details about collectibles held in the Safe', async () => {
      const { getByText, queryByLabelText, debug } = render(
        <ListCollectibles />
      )
      await waitForElementToBeRemoved(getByText('loading...'), {
        timeout: 5000,
      })
      debug()
      expect(queryByLabelText('ZodiacWands:')).toBeInTheDocument()
    })

    it('should use the state provided via context from <ProvideSafeCollectibles> when called without arg', async () => {
      const renderSpy = jest.fn()
      const SpyOnCollectibles = () => {
        const [collectibles, { loading }] = useSafeCollectibles()
        renderSpy(collectibles, loading)
        return null
      }

      render(
        <ProvideSafeCollectibles {...TEST_SAFE}>
          <SpyOnCollectibles />
        </ProvideSafeCollectibles>
      )
      expect(renderSpy).toHaveBeenCalledWith([], true)
      renderSpy.mockClear()

      await waitFor(
        () =>
          expect(renderSpy).toHaveBeenCalledWith(
            expect.arrayContaining([
              expect.objectContaining({
                address: '0xBe41D6b67D1796A7196f08f43165724E196C15F1',
                id: '4',
              }),
            ]),
            false
          ),
        { timeout: 5000 }
      )
    })
  })

  it('should fetch on mount', () => {
    const { queryByText } = render(<ListBalances />)
    expect(queryByText('loading...')).toBeInTheDocument()
  })

  it('should not fetch directly when passing lazy, but when calling the fetch callback', async () => {
    const { getByText, queryByText, getByLabelText } = render(
      <ListBalances lazy />
    )
    expect(queryByText('loading...')).not.toBeInTheDocument()
    fireEvent.click(getByText('fetch'))
    const loadingIndicator = getByText('loading...')
    await waitForElementToBeRemoved(loadingIndicator, { timeout: 5000 })
    expect(getByLabelText('ETH')).toHaveValue('0.01')
  })

  it('should expose the error if the fetch goes wrong', async () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation()
    const { getByText, getByRole } = render(<ListBalances address="0x0" />)
    const loadingIndicator = getByText('loading...')
    await waitForElementToBeRemoved(loadingIndicator, { timeout: 5000 })
    expect(getByRole('alert')).toHaveTextContent(/Error:/)
    expect(consoleErrorMock).toHaveBeenCalledWith(
      'Safe fetch error',
      expect.any(Error)
    )
    consoleErrorMock.mockRestore()
  })

  it('should not use results of canceled requests', async () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation()

    const { rerender, getByText, queryByLabelText, getByRole } = render(
      <ListBalances />
    )
    await waitForElementToBeRemoved(getByText('loading...'), { timeout: 5000 })
    expect(queryByLabelText('ETH')).toBeInTheDocument()

    // trigger a refetch, and re-render right afterwards
    fireEvent.click(getByText('fetch'))
    rerender(<ListBalances address="0x0" />)

    // previous results are wiped right away
    expect(queryByLabelText('ETH')).not.toBeInTheDocument()

    await waitForElementToBeRemoved(getByText('loading...'), { timeout: 5000 })
    expect(getByRole('alert')).toHaveTextContent(/Error:/)

    // results of the canceled request, will not be applied
    expect(queryByLabelText('ETH')).not.toBeInTheDocument()

    consoleErrorMock.mockRestore()
  })

  it('should reset the loading state when receiving props for a new Safe', async () => {
    const { rerender, queryByText } = render(<ListBalances />)
    expect(queryByText('loading...')).toBeInTheDocument()
    rerender(<ListBalances lazy address="0x0" />)
    expect(queryByText('loading...')).not.toBeInTheDocument()
  })

  it('should reset the error states when receiving props for a new Safe', async () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation()

    const { rerender, getByText, queryByRole } = render(
      <ListBalances address="0x0" />
    )
    await waitForElementToBeRemoved(getByText('loading...'), { timeout: 5000 })
    expect(queryByRole('alert')).toBeInTheDocument()

    // not every props update shall reset the state...
    rerender(<ListBalances lazy address="0x0" />)
    expect(queryByRole('alert')).toBeInTheDocument()

    // ... but when address or network change, state must be reset.
    rerender(<ListBalances lazy address="0x1" />)
    expect(queryByRole('alert')).not.toBeInTheDocument()

    consoleErrorMock.mockRestore()
  })

  it('should share a single state for multiple components when using context', async () => {
    const ListBalances = () => {
      const [balances, { loading }] = useSafeBalances()

      return (
        <div>
          {loading ? <p>loading...</p> : null}
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
        </div>
      )
    }

    // when using lazy context provider and triggering fetch from one component, the data will become available for the other
    const FetchBalances = () => {
      const [, { fetch }] = useSafeBalances()
      return <button onClick={fetch}>fetch from other</button>
    }

    const { queryByText, getByText, getByLabelText } = render(
      <ProvideSafeBalances {...TEST_SAFE} lazy>
        <ListBalances />
        <FetchBalances />
      </ProvideSafeBalances>
    )
    expect(queryByText('loading...')).not.toBeInTheDocument()

    fireEvent.click(getByText('fetch from other'))
    await waitForElementToBeRemoved(getByText('loading...'), { timeout: 5000 })
    expect(getByLabelText('ETH')).toHaveValue('0.01')
  })
})
