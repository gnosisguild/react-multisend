import React from 'react'
import { FormatTypes, Interface } from '@ethersproject/abi'

const EthersAbiFormats = [
  FormatTypes.json,
  FormatTypes.full,
  FormatTypes.minimal,
]
export enum AbiFormat {
  JSON = 0,
  FULL = 1,
  MINIMAL = 2,
}

type Props = {
  value: string
  onChange(ev: React.ChangeEvent<HTMLTextAreaElement>): void
  format: AbiFormat
}

const formatAbi = (value: string, format: AbiFormat): string | null => {
  try {
    const abiInterface = new Interface(value)
    const formatted = abiInterface.format(EthersAbiFormats[format])
    if (typeof formatted === 'string') return formatted
    return formatted.join('\n')
  } catch (e) {
    return null
  }
}

export const AbiInput: React.FC<Props> = ({ value, onChange, format }) => {
  const formatted = formatAbi(value, format)
  return (
    <textarea
      value={formatted || value}
      onChange={onChange}
      aria-invalid={formatted !== null}
    />
  )
}
