import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchBalances, fetchCollectibles, NetworkId } from './safe'

type Props = {
  address: string
  network: NetworkId
  lazy: boolean
}

type FetchFunction = typeof fetchBalances | typeof fetchCollectibles

const createUseFetch = <F extends FetchFunction>(
  fetchFunction: FetchFunction
) => {
  type Result = ReturnType<F>

  // This hook fetches on mount or when the `address` or `network` values are updated. Results are stored in a local state.
  // When passing `lazy: true`, the request won't be triggered until the returned `fetch` callback is invoked.
  const useFetchFromSafeApi = ({ address, network, lazy }: Props) => {
    const nonce = useRef(0)
    const [result, setResult] = useState<Result[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<Error | null>(null)

    const fetch = useCallback(async () => {
      const thisNonce = nonce.current + 1
      nonce.current = thisNonce

      setLoading(true)
      setError(null)

      try {
        const newResult = (await fetchFunction(address, network)) as Result[]
        if (nonce.current === thisNonce) {
          setResult(newResult)
        }
      } catch (error) {
        if (nonce.current === thisNonce) {
          setError(error as Error)
        }
      } finally {
        if (nonce.current === thisNonce) {
          setLoading(false)
        }
      }
    }, [address, network])

    useEffect(() => {
      if (lazy) return

      fetch()
      return () => {
        // cancel fetch if still running
        nonce.current = nonce.current + 1
      }
    }, [fetch, lazy])

    return [result, { loading, error, fetch }]
  }
}

export const useSafeBalances = createUseFetch(fetchBalances)
export const useSafeCollectibles = createUseFetch(fetchCollectibles)
