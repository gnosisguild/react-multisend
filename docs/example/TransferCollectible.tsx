import React from 'react'
import {
  TransferCollectibleTransactionInput,
  useMultiSendContext,
} from '../../src'
import { AddressInput } from './AddressInput'
import { CollectibleSelect } from './CollectibleSelect'

type Props = {
  value: TransferCollectibleTransactionInput
  onChange(value: TransferCollectibleTransactionInput): void
}

export const TransferCollectible: React.FC<Props> = ({ value, onChange }) => {
  const { safeAddress } = useMultiSendContext()
  return (
    <fieldset>
      <label>
        <span>Collectible</span>
        <CollectibleSelect
          value={{ address: value.address, tokenId: value.tokenId }}
          onChange={(ev, { address, tokenId }) =>
            onChange({ ...value, address, tokenId, from: safeAddress })
          }
        />
      </label>
      <label>
        <span>To</span> <i>address</i>
        <AddressInput
          value={value.to}
          onChange={(ev, to) => onChange({ ...value, to })}
        />
      </label>
    </fieldset>
  )
}
