import React from 'react'
import { createTransaction, TransactionInput, TransactionType } from '../src'
import { Transaction, ClassNames as TransactionClassNames } from './Transaction'

interface ClassNames extends TransactionClassNames {
  container?: string
  addTransaction?: string
}

interface Props {
  value: TransactionInput[]
  onChange(value: TransactionInput[]): void
  defaultTransactionType?: TransactionType
  classNames?: ClassNames
}

export const TransactionBatch: React.FC<Props> = ({
  value,
  onChange,
  defaultTransactionType = 'sendFunds',
  classNames = {},
}) => {
  const handleAdd = () => {
    onChange([...value, createTransaction(defaultTransactionType)])
  }
  const handleChange = (newValue: TransactionInput, index: number) => {
    onChange([...value.slice(0, index), newValue, ...value.slice(index + 1)])
  }
  const handleRemove = (index: number) => {
    onChange([...value.slice(0, index), ...value.slice(index + 1)])
  }
  return (
    <div className={classNames.container}>
      {value.map((transaction, index) => (
        <Transaction
          key={index}
          index={index}
          value={transaction}
          onChange={handleChange}
          onRemove={handleRemove}
          classNames={classNames}
        />
      ))}

      <button className={classNames.addTransaction} onClick={handleAdd}>
        Add Transaction
      </button>
    </div>
  )
}
