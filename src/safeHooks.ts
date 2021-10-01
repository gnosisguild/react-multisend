import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Balance,
  Collectible,
  fetchBalances,
  fetchCollectibles,
  NetworkId,
} from './safe'

type Props = {
  address: string
  network: NetworkId
  lazy?: boolean
}

type FetchFunction = typeof fetchBalances | typeof fetchCollectibles

const createUseFetch = <Result>(fetchFunction: FetchFunction) => {
  // This hook fetches on mount or when the `address` or `network` values are updated. Results are stored in a local state.
  // When passing `lazy: true`, the request won't be triggered until the returned `fetch` callback is invoked.
  const useFetchFromSafeApi = ({
    address,
    network,
    lazy,
  }: Props): [
    Result[],
    {
      loading: boolean
      error: null | Error
      fetch: () => Promise<Result[]>
    }
  ] => {
    const nonce = useRef(0)
    const [result, setResult] = useState<Result[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<Error | null>(null)

    const fetch = useCallback(async () => {
      const thisNonce = nonce.current + 1
      nonce.current = thisNonce

      setLoading(true)
      setError(null)

      try {
        const newResult = (await fetchFunction(
          address,
          network
        )) as unknown as Result[]
        if (nonce.current === thisNonce) {
          setResult(newResult)
        }
        return newResult
      } catch (error) {
        if (nonce.current === thisNonce) {
          setError(error as Error)
        }
        throw error
      } finally {
        if (nonce.current === thisNonce) {
          setLoading(false)
        }
      }
    }, [address, network])

    useEffect(() => {
      if (lazy) return

      fetch().catch((e) => {
        // we already make the error available in the state, so we will just swallow it here
        console.error('Safe fetch error', e)
      })

      return () => {
        // cancel fetch if still running
        nonce.current = nonce.current + 1
      }
    }, [fetch, lazy])

    return [result, { loading, error, fetch }]
  }

  return useFetchFromSafeApi
}

export const useSafeBalances = createUseFetch<Balance>(fetchBalances)
export const useSafeCollectibles =
  createUseFetch<Collectible>(fetchCollectibles)
