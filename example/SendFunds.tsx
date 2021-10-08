import React from 'react'
import { AddressInput } from './AddressInput'
import { AmountInput } from './AmountInput'
import { AssetSelect } from './AssetSelect'

type SendFundsTransactionInput = {
  token: string | null // ERC20 token contract address, `null` for ETH
  to: string // address of recipient
  amount: string
}

type Props = {
  value?: SendFundsTransactionInput
  onChange(value: SendFundsTransactionInput): void
}

const INITIAL_VALUE = {
  token: null, // ETH
  to: '',
  amount: '',
}

export const SendFunds: React.FC<Props> = ({
  value = INITIAL_VALUE,
  onChange,
}) => {
  return (
    <fieldset>
      <legend>Send funds</legend>
      <label>
        Asset
        <AssetSelect
          value={value.token}
          onChange={(ev, token) => onChange({ ...value, token })}
        />
      </label>
      <label>
        To
        <AddressInput
          value={value.to}
          onChange={(ev, to) => onChange({ ...value, to })}
        />
      </label>
      <label>
        Amount
        <AmountInput
          token={value.to}
          value={value.amount}
          onChange={(ev, amount) => onChange({ ...value, amount })}
        />
      </label>
    </fieldset>
  )
}
