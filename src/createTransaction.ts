import { TransactionType } from './types'

export const createTransaction = (type: TransactionType) => {
  switch (type) {
    case 'callContract':
      return {
        type,
        to: '',
        value: '',
        abi: '',
        functionSignature: '',
        inputValues: {},
      }
    case 'sendFunds':
      return { type, token: '', to: '', amount: '' }
    case 'sendCollectible':
      return { type, address: '', id: '', to: '' }
    case 'raw':
      return { type, to: '', value: '', data: '' }
  }

  throw new Error(`Invalid transaction type: ${type}`)
}
