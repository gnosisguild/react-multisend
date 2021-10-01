import { BigNumber } from 'ethers'

const API_BASE = {
  1: 'https://gnosis-safe.io/api/v1',
  4: 'https://rinkeby.gnosis-safe.io/api/v1',
  100: 'https://xdai.gnosis-safe.io/api/v1',
  73799: 'https://volta.gnosis-safe.io/api/v1',
  246: 'https://ewc.gnosis-safe.io/api/v1',
  137: 'https://polygon.gnosis-safe.io/api/v1',
  56: 'https://bsc.gnosis-safe.io/api/v1',
  42161: 'https://arbitrum.gnosis-safe.io/api/v1',
}

export type NetworkId = keyof typeof API_BASE

const fetchFromSafeApi = async (
  safeAddress: string,
  networkId: NetworkId,
  endpoint: 'balances' | 'collectibles'
) => {
  const apiBase = API_BASE[networkId]
  const response = await fetch(`${apiBase}safes/${safeAddress}/${endpoint}/`)
  if (!response.ok) {
    throw Error(response.statusText)
  }
  return response.json()
}

type Token = {
  decimals: number
  logoUri: string
  name: string
  symbol: string
}

export type Balance = {
  tokenAddress: string | null
  token: Token | null
  balance: BigNumber
}

type BalanceResponse = {
  tokenAddress: string | null
  token: Token | null
  balance: string
}

export const fetchBalances = async (
  safeAddress: string,
  networkId: NetworkId
): Promise<Balance[]> => {
  const balances: BalanceResponse[] = await fetchFromSafeApi(
    safeAddress,
    networkId,
    'balances'
  )
  return balances.map(entry => ({
    ...entry,
    balance: BigNumber.from(entry.balance),
  }))
}

export type Collectible = {
  address: string
  tokenName: string
  tokenSymbol: string
  logoUri: string
  id: string
  uri: null
  name: string
  description: string
  imageUri: string
  metadata: {
    name: string
    description: string
    image: string
  }
}

export const fetchCollectibles = async (
  safeAddress: string,
  networkId: NetworkId
): Promise<Collectible[]> => {
  const collectibles: Collectible[] = await fetchFromSafeApi(
    safeAddress,
    networkId,
    'collectibles'
  )
  return collectibles
}
