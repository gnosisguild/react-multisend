import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { nanoid } from 'nanoid'
import {
  createTransaction,
  TransactionInput,
  TransactionType,
  useMultiSendContext,
} from '../src'
import { CallContract } from './CallContract'
import { RawTransaction } from './RawTransaction'
import { TransferCollectible } from './TransferCollectible'
import { TransferFunds } from './TransferFunds'
import { TransactionTypeSelect } from './TransactionTypeSelect'
import { DraggableSyntheticListeners } from '@dnd-kit/core'

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
  dragListeners: DraggableSyntheticListeners
  dragAttributes: {
    role?: string
    roleDescription?: string
    tabIndex?: number
  }
}

const TransactionHeader: React.FC<HeaderProps> = ({
  index,
  value,
  onRemove,
  classNames,
  dragListeners,
  dragAttributes,
}) => {
  let title
  switch (value.type) {
    case TransactionType.callContract:
      title = 'Call contract'
      break
    case TransactionType.transferFunds:
      title = 'Transfer funds'
      break
    case TransactionType.transferCollectible:
      title = 'Transfer collectible'
      break
    case TransactionType.raw:
      title = 'Raw transaction'
      break
  }

  return (
    <div className={classNames.transactionHeader}>
      <button
        className={classNames.dragHandle}
        title="drag to move"
        {...dragListeners}
        {...dragAttributes}
      />
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
    case TransactionType.callContract:
      return (
        <CallContract
          value={value}
          onChange={onChange}
          network={network}
          blockExplorerApiKey={blockExplorerApiKey}
        />
      )
    case TransactionType.transferFunds:
      return <TransferFunds value={value} onChange={onChange} />
    case TransactionType.transferCollectible:
      return <TransferCollectible value={value} onChange={onChange} />
    case TransactionType.raw:
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: value.id })

  const switchType = (newType: TransactionType) => {
    onChange(createTransaction(newType, nanoid()), index)
  }
  const handleChange = (newValue: TransactionInput) => {
    onChange(newValue, index)
  }
  const handleRemove = () => {
    onRemove(index)
  }
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : undefined,
  }
  return (
    <div className={classNames.transaction} ref={setNodeRef} style={style}>
      <TransactionHeader
        index={index}
        value={value}
        onRemove={handleRemove}
        classNames={classNames}
        dragListeners={listeners}
        dragAttributes={attributes}
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
