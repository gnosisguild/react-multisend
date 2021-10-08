import { useSafeBalances } from '../src'

type Props = {
  value?: string // ERC20 token contract address, `null` for ETH
  onChange(ev: React.ChangeEvent<HTMLSelectElement>, value: string | null): void
}

export const AssetSelect: React.FC<Props> = ({ value, onChange }) => {
  const [balances] = useSafeBalances()

  return (
    <select
      value={value || ''}
      onChange={(ev) => {
        onChange(ev, value)
      }}
    >
      {balances.map((balance) => (
        <option key={balance.tokenAddress} value={balance.tokenAddress}>
          {balance.token ? balance.token.symbol : 'ETH'} (
          {balance.token ? balance.token.name : 'Ether'})
        </option>
      ))}
    </select>
  )
}
