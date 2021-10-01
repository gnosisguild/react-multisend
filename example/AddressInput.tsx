import React, { useState } from 'react'
import { getAddress } from '@ethersproject/address'

type Props = {
  value: string
  defaultValue: string
  onChange: React.ChangeEventHandler<HTMLInputElement>
}

export const AddressInput: React.FC<Props> = ({
  value,
  defaultValue,
  onChange,
}) => {
  const [address, setAddress] = useState(value || defaultValue)
  // const [ensName, setEnsName] = useState<string | null>(null)

  const handleChange = event => {
    const { value } = event.target
    setAddress(value)
    try {
      console.log('VALID', getAddress(value))
    } catch (e) {
      
    }
    
  }

  const isValidAddress = true
  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        aria-invalid={!isValidAddress}
      />
    </div>
  )
}
