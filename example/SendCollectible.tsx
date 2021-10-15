import React from 'react'
import { SendCollectibleTransactionInput } from '../src'
import { AddressInput } from './AddressInput'
import { CollectibleSelect } from './CollectibleSelect'

type Props = {
  value: SendCollectibleTransactionInput
  onChange(value: SendCollectibleTransactionInput): void
}

export const SendCollectible: React.FC<Props> = ({ value, onChange }) => {
  return (
    <fieldset>
      <label>
        <span>Collectible</span>
        <CollectibleSelect
          value={{ address: value.address, tokenId: value.tokenId }}
          onChange={(ev, { address, tokenId }) =>
            onChange({ ...value, address, tokenId })
          }
        />
      </label>
      <label>
        <span>To</span>
        <AddressInput
          value={value.to}
          onChange={(ev, to) => onChange({ ...value, to })}
        />
      </label>
    </fieldset>
  )
}
