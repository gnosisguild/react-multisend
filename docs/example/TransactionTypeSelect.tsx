import React from 'react'

import { TransactionType } from '../../src'

interface Props {
  value: TransactionType
  onChange(value: TransactionType): void
}

export const TransactionTypeSelect: React.FC<Props> = ({ value, onChange }) => {
  return (
    <label>
      <span>Transaction type</span>
      <select
        value={value}
        onChange={(ev) => onChange(ev.target.value as TransactionType)}
      >
        <option value={TransactionType.transferFunds}>Transfer funds</option>
        <option value={TransactionType.transferCollectible}>
          Transfer collectible
        </option>
        <option value={TransactionType.callContract}>Call contract</option>
        <option value={TransactionType.raw}>Raw transaction</option>
      </select>
    </label>
  )
}
