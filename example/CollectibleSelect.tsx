import React from 'react'
import { Collectible, useSafeCollectibles } from '../src'

type CollectibleInput = {
  address: string // ERC721 token contract address
  id: string // ID of the NFT
}

type Props = {
  value: CollectibleInput
  onChange(
    ev: React.ChangeEvent<HTMLSelectElement>,
    value: CollectibleInput
  ): void
}

const groupByAddress = (collectibles: Collectible[]) => {
  const map = new Map<string, Collectible[]>()
  collectibles.forEach((collectible) => {
    const key = collectible.address
    const collection = map.get(key)
    if (!collection) {
      map.set(key, [collectible])
    } else {
      collection.push(collectible)
    }
  })
  return [...map.values()]
}

const serializeValue = (value: CollectibleInput) =>
  `${value.address}/${value.id}`
const parseValue = (serialized: string): CollectibleInput => {
  const [address, id] = serialized.split('/')
  return { address, id }
}

export const CollectibleSelect: React.FC<Props> = ({ value, onChange }) => {
  const [collectibles] = useSafeCollectibles()
  const groups = groupByAddress(collectibles)

  return (
    <select
      value={serializeValue(value)}
      onChange={(ev) => {
        console.log(ev.target.value)
        onChange(ev, parseValue(ev.target.value))
      }}
    >
      {groups.map((group) => (
        <optgroup key={group[0].address} label={group[0].tokenName}>
          {group.map((collectible) => (
            <option key={collectible.id} value={serializeValue(collectible)}>
              {collectible.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
