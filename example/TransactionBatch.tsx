import React from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { nanoid } from 'nanoid'
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
  defaultTransactionType = TransactionType.sendFunds,
  classNames = {},
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleAdd = () => {
    onChange([...value, createTransaction(defaultTransactionType, nanoid())])
  }
  const handleChange = (newValue: TransactionInput, index: number) => {
    onChange([...value.slice(0, index), newValue, ...value.slice(index + 1)])
  }
  const handleRemove = (index: number) => {
    onChange([...value.slice(0, index), ...value.slice(index + 1)])
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over.id) {
      onChange(
        arrayMove(value, value.indexOf(active.id), value.indexOf(over.id))
      )
    }
  }

  return (
    <div className={classNames.container}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={value} strategy={verticalListSortingStrategy}>
          {value.map((transaction, index) => (
            <Transaction
              key={transaction.id}
              index={index}
              value={transaction}
              onChange={handleChange}
              onRemove={handleRemove}
              classNames={classNames}
            />
          ))}
        </SortableContext>
      </DndContext>
      <button className={classNames.addTransaction} onClick={handleAdd}>
        Add Transaction
      </button>
    </div>
  )
}
