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
          value={{ address: value.address, id: value.id }}
          onChange={(ev, { address, id }) =>
            onChange({ ...value, address, id })
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
