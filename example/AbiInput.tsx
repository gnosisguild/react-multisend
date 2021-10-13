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
  onChange(ev: React.ChangeEvent<HTMLTextAreaElement>, value: string): void
  format: AbiFormat
}

const formatAbi = (value: string, format: AbiFormat): string | null => {
  if (!value) return null
  const abiInterface = new Interface(value)
  const formatted = abiInterface.format(EthersAbiFormats[format])
  if (typeof formatted === 'string') return formatted
  return formatted.join('\n')
}

const parseAbi = (value: string): string => {
  if (!value) return ''

  let input
  try {
    // try if the value is JSON format
    input = JSON.parse(value)
  } catch (e) {
    // it's not JSON, so maybe it's human readable format
    input = value.split('\n')
  }

  try {
    const abiInterface = new Interface(input)
    return abiInterface.format(FormatTypes.json) as string
  } catch (e) {
    return ''
  }
}

export const AbiInput: React.FC<Props> = ({ value, onChange, format }) => {
  const formatted = formatAbi(value, format)
  return (
    <textarea
      value={formatted || value}
      onChange={(ev) => {
        onChange(ev, parseAbi(ev.target.value))
      }}
      aria-invalid={formatted !== null}
    />
  )
}
