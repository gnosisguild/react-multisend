import { formatUnits } from '@ethersproject/units'
import React from 'react'
import { useSafeBalances } from '../src'

type Props = {
  token: string | null // ERC20 token contract address, `null` for ETH
  value: string
  onChange(ev: React.ChangeEvent<HTMLInputElement>, value: string): void
}

const ETH_DECIMALS = 18

export const AmountInput: React.FC<Props> = ({ token, value, onChange }) => {
  const [balances] = useSafeBalances()
  const balance = balances.find((b) => b.tokenAddress === token)
  const decimals = balance?.token?.decimals || ETH_DECIMALS

  return (
    <input
      type="number"
      value={value}
      min="0"
      max={
        // don't allow sending more than the Avatar holds
        balance && formatUnits(balance.balance, decimals)
      }
      // step={formatUnits(1, decimals)}
      onChange={(ev) => {
        onChange(ev, ev.target.value)
      }}
    />
  )
}
