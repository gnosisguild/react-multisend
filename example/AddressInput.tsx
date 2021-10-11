import React from 'react'
import { getAddress } from '@ethersproject/address'

type Props = {
  value: string
  onChange(ev: React.ChangeEvent<HTMLInputElement>, value: string): void
}

export const validateAddress = (value: string): string | null => {
  try {
    return getAddress(value)
  } catch (e) {
    return null
  }
}

export const AddressInput: React.FC<Props> = ({ value, onChange }) => (
  <input
    type="text"
    value={value}
    onChange={(ev) => {
      onChange(ev, ev.target.value)
    }}
    aria-invalid={validateAddress(value) !== null}
  />
)
