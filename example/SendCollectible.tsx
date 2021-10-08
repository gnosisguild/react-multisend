import React from 'react'
import { AddressInput } from './AddressInput'
import { CollectibleSelect } from './CollectibleSelect'

type SendCollectibleTransactionInput = {
  address: string // ERC721 token contract address
  id: string // ID of the NFT
  to: string // address of recipient
}

type Props = {
  value?: SendCollectibleTransactionInput
  onChange(value: SendCollectibleTransactionInput): void
}

const INITIAL_VALUE = {
  address: '',
  id: '',
  to: '',
}

export const SendCollectible: React.FC<Props> = ({
  value = INITIAL_VALUE,
  onChange,
}) => {
  return (
    <fieldset>
      <legend>Send NFT</legend>
      <label>
        Collectible
        <CollectibleSelect
          value={{ address: value.address, id: value.id }}
          onChange={(ev, { address, id }) =>
            onChange({ ...value, address, id })
          }
        />
      </label>
      <label>
        To
        <AddressInput
          value={value.to}
          onChange={(ev, to) => onChange({ ...value, to })}
        />
      </label>
    </fieldset>
  )
}
