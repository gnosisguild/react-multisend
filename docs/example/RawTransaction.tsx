import React from 'react'
import { RawTransactionInput } from '../../src'
import { AddressInput } from './AddressInput'

interface Props {
  value: RawTransactionInput
  onChange(value: RawTransactionInput): void
}

export const RawTransaction: React.FC<Props> = ({ value, onChange }) => (
  <div>
    <label>
      <span>To</span> <i>address</i>
      <AddressInput
        value={value.to}
        onChange={(ev, to) => onChange({ ...value, to })}
      />
    </label>
    <label>
      <span>Value (wei)</span>
      <input
        type="number"
        value={value.value}
        onChange={(ev) => onChange({ ...value, value: ev.target.value })}
      />
    </label>
    <label>
      <span>Data</span>
      <textarea
        value={value.data}
        onChange={(ev) => onChange({ ...value, data: ev.target.value })}
      />
    </label>
  </div>
)
