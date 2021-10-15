export type ValueType =
  | string
  | boolean
  | Array<ValueType>
  | { [key: string]: ValueType }

export enum TransactionType {
  sendFunds = 'sendFunds',
  sendCollectible = 'sendCollectible',
  callContract = 'callContract',
  raw = 'raw',
}
export interface CallContractTransactionInput {
  type: TransactionType.callContract
  id: string // not relevant for encoding the final transaction
  to: string // contract address
  value: string // amount of wei to send
  abi: string // ABI as JSON string
  functionSignature: string
  inputValues: { [key: string]: ValueType }
}

export interface SendFundsTransactionInput {
  type: TransactionType.sendFunds
  id: string // not relevant for encoding the final transaction
  token: string | null // ERC20 token contract address, `null` for ETH
  to: string // address of recipient
  amount: string
}

export interface SendCollectibleTransactionInput {
  type: TransactionType.sendCollectible
  id: string // not relevant for encoding the final transaction
  address: string // ERC721 contract address
  tokenId: string // ID of the NFT
  to: string // address of recipient
}

export interface RawTransactionInput {
  type: TransactionType.raw
  id: string // not relevant for encoding the final transaction
  to: string // target address
  value: string // amount of wei to send
  data: string // TODO how does it need to be encoded
}

export type TransactionInput =
  | CallContractTransactionInput
  | SendFundsTransactionInput
  | SendCollectibleTransactionInput
  | RawTransactionInput
