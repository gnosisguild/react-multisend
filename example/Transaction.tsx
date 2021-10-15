import React from 'react'
import {
  createTransaction,
  TransactionInput,
  TransactionType,
  useMultiSendContext,
} from '../src'
import { CallContract } from './CallContract'
import { RawTransaction } from './RawTransaction'
import { SendCollectible } from './SendCollectible'
import { SendFunds } from './SendFunds'
import { TransactionTypeSelect } from './TransactionTypeSelect'

export interface ClassNames {
  transaction?: string
  transactionHeader?: string
  removeTransaction?: string
  dragHandle?: string
  title?: string
  index?: string
}

interface HeaderProps {
  index: number
  value: TransactionInput
  onRemove(): void
  classNames: ClassNames
}

const TransactionHeader: React.FC<HeaderProps> = ({
  index,
  value,
  onRemove,
  classNames,
}) => {
  let title
  switch (value.type) {
    case 'callContract':
      title = 'Call contract'
      break
    case 'sendFunds':
      title = 'Send funds'
      break
    case 'sendCollectible':
      title = 'Send collectible'
      break
    case 'raw':
      title = 'Raw transaction'
      break
  }

  return (
    <div className={classNames.transactionHeader}>
      <button className={classNames.dragHandle} title="drag to move" />
      <div className={classNames.title}>
        <span className={classNames.index}>{index}</span>
        {title}
      </div>
      <button
        onClick={onRemove}
        className={classNames.removeTransaction}
        title="remove"
      />
    </div>
  )
}

interface ContentProps {
  value: TransactionInput
  onChange(value: TransactionInput): void
  classNames: ClassNames
}

const TransactionContent: React.FC<ContentProps> = ({ value, onChange }) => {
  const { network, blockExplorerApiKey } = useMultiSendContext()
  switch (value.type) {
    case 'callContract':
      return (
        <CallContract
          value={value}
          onChange={onChange}
          network={network}
          blockExplorerApiKey={blockExplorerApiKey}
        />
      )
    case 'sendFunds':
      return <SendFunds value={value} onChange={onChange} />
    case 'sendCollectible':
      return <SendCollectible value={value} onChange={onChange} />
    case 'raw':
      return <RawTransaction value={value} onChange={onChange} />
  }
}

interface Props {
  index: number
  value: TransactionInput
  onChange(value: TransactionInput, index: number): void
  onRemove(index: number): void
  classNames: ClassNames
}

export const Transaction: React.FC<Props> = ({
  index,
  value,
  onChange,
  onRemove,
  classNames = {},
}) => {
  const switchType = (newType: TransactionType) => {
    onChange(createTransaction(newType), index)
  }
  const handleChange = (newValue: TransactionInput) => {
    onChange(newValue, index)
  }
  const handleRemove = () => {
    onRemove(index)
  }

  return (
    <div className={classNames.transaction}>
      <TransactionHeader
        index={index}
        value={value}
        onRemove={handleRemove}
        classNames={classNames}
      />
      <TransactionTypeSelect value={value.type} onChange={switchType} />
      <TransactionContent
        value={value}
        onChange={handleChange}
        classNames={classNames}
      />
    </div>
  )
}
