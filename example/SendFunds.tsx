import React from 'react'
import { SendFundsTransactionInput } from '../src'
import { AddressInput } from './AddressInput'
import { AmountInput } from './AmountInput'
import { AssetSelect } from './AssetSelect'

type Props = {
  value: SendFundsTransactionInput
  onChange(value: SendFundsTransactionInput): void
}

export const SendFunds: React.FC<Props> = ({ value, onChange }) => {
  return (
    <fieldset>
      <label>
        <span>Asset</span>
        <AssetSelect
          value={value.token}
          onChange={(ev, token) => onChange({ ...value, token })}
        />
      </label>
      <label>
        <span>To</span>
        <AddressInput
          value={value.to}
          onChange={(ev, to) => onChange({ ...value, to })}
        />
      </label>
      <label>
        <span>Amount</span>
        <AmountInput
          token={value.to}
          value={value.amount}
          onChange={(ev, amount) => onChange({ ...value, amount })}
        />
      </label>
    </fieldset>
  )
}
