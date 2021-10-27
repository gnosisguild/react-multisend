import React from 'react'

import { useSafeBalances } from '../../src'

type Props = {
  value: string | null // ERC20 token contract address, `null` for ETH
  onChange(
    ev: React.ChangeEvent<HTMLSelectElement>,
    value: string | null,
    decimals: number
  ): void
}

const ETH_DECIMALS = 18

export const AssetSelect: React.FC<Props> = ({ value, onChange }) => {
  const [balances] = useSafeBalances()

  return (
    <select
      value={value || ''}
      onChange={(ev) => {
        const tokenAddress = ev.target.value || null
        const balance = balances.find((b) => b.tokenAddress === tokenAddress)
        const decimals = balance?.token?.decimals || ETH_DECIMALS
        onChange(ev, tokenAddress, decimals)
      }}
    >
      {balances.map((balance) => (
        <option key={balance.tokenAddress} value={balance.tokenAddress || ''}>
          {balance.token ? balance.token.name : 'Ether'} (
          {balance.token ? balance.token.symbol : 'ETH'})
        </option>
      ))}
    </select>
  )
}
