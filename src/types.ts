export type ValueType =
  | string
  | boolean
  | Array<ValueType>
  | { [key: string]: ValueType }

export interface CallContractTransactionInput {
  type: 'callContract'
  to: string // contract address
  value: string // amount of wei to send
  abi: string // ABI as JSON string
  functionSignature: string
  inputValues: { [key: string]: ValueType }
}

export interface SendFundsTransactionInput {
  type: 'sendFunds'
  token: string | null // ERC20 token contract address, `null` for ETH
  to: string // address of recipient
  amount: string
}

export interface SendCollectibleTransactionInput {
  type: 'sendCollectible'
  address: string // ERC721 token contract address
  id: string // ID of the NFT
  to: string // address of recipient
}

export interface RawTransactionInput {
  type: 'raw'
  to: string // target address
  value: string // amount of wei to send
  data: string // TODO how does it need to be encoded
}

export type TransactionInput =
  | CallContractTransactionInput
  | SendFundsTransactionInput
  | SendCollectibleTransactionInput
  | RawTransactionInput

export type TransactionType = TransactionInput['type']
