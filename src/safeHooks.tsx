import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Balance,
  Collectible,
  fetchBalances,
  fetchCollectibles,
  NetworkId,
} from './safe'

type HookReturnValue<Result> = [
  Result[],
  {
    loading: boolean
    error: null | Error
    fetch: () => Promise<Result[]>
  }
]

const SafeBalancesContext = createContext<HookReturnValue<Balance> | null>(null)
const SafeCollectiblesContext =
  createContext<HookReturnValue<Collectible> | null>(null)

type Props = {
  address: string
  network: NetworkId
  lazy?: boolean
}

type FetchFunction = typeof fetchBalances | typeof fetchCollectibles

const createUseFetch = <Result,>(
  fetchFunction: FetchFunction,
  context: React.Context<HookReturnValue<Result> | null>,
  typeName: string
) => {
  // This hook fetches on mount or when the `address` or `network` values are updated. Results are stored in a local state.
  // When passing `lazy: true`, the request won't be triggered until the returned `fetch` callback is invoked.
  const useFetchFromSafeApi = (
    props?: Props
  ): [
    Result[],
    {
      loading: boolean
      error: null | Error
      fetch: () => Promise<Result[]>
    }
    // (We don't annotate with HookReturnValue<Result>, because VSCode IntelliSense would show this alias instead of the expanded tuple.)
  ] => {
    const { address, network, lazy } = props || {}
    const hasProps = !!props
    const contextValue = useContext(context)

    const nonce = useRef(0)
    const [results, setResults] = useState<Result[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<Error | null>(null)

    const fetch = useCallback(async () => {
      if (!address || !network) return

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
          setResults(newResult)
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
      // throw away the previous results when we receive props for a different Safe
      setResults([])
      setLoading(false)
      setError(null)
    }, [address, network])

    useEffect(() => {
      if (lazy || !hasProps) return

      fetch().catch((e) => {
        // we make the error available via state, so we will just swallow it here
        console.error('Safe fetch error', e)
      })

      return () => {
        // cancel fetch if still running
        nonce.current = nonce.current + 1
      }
    }, [fetch, hasProps, lazy])

    const localValue = useMemo(
      () => [results, { loading, error, fetch }] as HookReturnValue<Result>,
      [results, loading, error, fetch]
    )

    if (hasProps) return localValue
    if (contextValue) return contextValue

    throw new Error(
      `When calling the useSafe${typeName}() hook without an argument, your component must have a <ProvideSafe${typeName}> provider as a parent.`
    )
  }

  return useFetchFromSafeApi
}

export const useSafeBalances = createUseFetch<Balance>(
  fetchBalances,
  SafeBalancesContext,
  'Balances'
)

export const useSafeCollectibles = createUseFetch<Collectible>(
  fetchCollectibles,
  SafeCollectiblesContext,
  'Collectibles'
)

export const ProvideSafeBalances: React.FC<
  Props & { children?: React.ReactNode }
> = ({ children, ...hookProps }) => {
  const value = useSafeBalances(hookProps)
  return (
    <SafeBalancesContext.Provider value={value}>
      {children}
    </SafeBalancesContext.Provider>
  )
}

export const ProvideSafeCollectibles: React.FC<
  Props & { children?: React.ReactNode }
> = ({ children, ...hookProps }) => {
  const value = useSafeCollectibles(hookProps)
  return (
    <SafeCollectiblesContext.Provider value={value}>
      {children}
    </SafeCollectiblesContext.Provider>
  )
}
