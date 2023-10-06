import { getAddress } from '@ethersproject/address'
import { BigNumber } from '@ethersproject/bignumber'

const API_BASE = {
  '1': 'https://safe-transaction-mainnet.safe.global',
  '5': 'https://safe-transaction-goerli.safe.global',
  '100': 'https://safe-transaction-gnosis-chain.safe.global',
  '73799': 'https://safe-transaction-volta.safe.global',
  '246': 'https://safe-transaction-ewc.safe.global',
  '137': 'https://safe-transaction-polygon.safe.global',
  '56': 'https://safe-transaction-bsc.safe.global',
  '42161': 'https://safe-transaction-arbitrum.safe.global',
}

export type NetworkId = keyof typeof API_BASE

const fetchFromSafeApi = async (
  safeAddress: string,
  networkId: NetworkId,
  endpoint: 'balances' | 'collectibles',
  version: 1 | 2 = 1
) => {
  const apiBase = API_BASE[networkId]
  const response = await fetch(
    `${apiBase}/api/v${version}/safes/${getAddress(safeAddress)}/${endpoint}/`
  )
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
  return balances.map((entry) => ({
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
  const page = await fetchFromSafeApi(safeAddress, networkId, 'collectibles', 2)
  return page.results as Collectible[]
}
