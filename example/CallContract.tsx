import { Interface, Result } from '@ethersproject/abi'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { NetworkId } from '../src/safe'
import { AbiFormat, AbiInput } from './AbiInput'
import { AddressInput, validateAddress } from './AddressInput'
import { AmountInput } from './AmountInput'

const EXPLORER_API_URLS = {
  '1': 'https://api.etherscan.io/api',
  '4': 'https://api-rinkeby.etherscan.io/api',
  '100': 'https://blockscout.com/xdai/mainnet/api',
  '73799': 'https://volta-explorer.energyweb.org/api',
  '246': 'https://explorer.energyweb.org/api',
  '137': 'https://api.polygonscan.com/api',
  '56': 'https://api.bscscan.com/api',
  '42161': 'https://api.arbiscan.io/api',
}

type CallContractTransactionInput = {
  to: string // contract address
  value: string
  abi: string
  method: string
  inputValues: { [key: string]: string }
}

type Props = {
  value?: CallContractTransactionInput
  onChange(value: CallContractTransactionInput): void
  network: NetworkId
}

const INITIAL_VALUE = {
  to: '',
  value: '',
  abi: '',
  method: '',
  inputValues: {},
}

const fetchContractAbi = async (
  network: NetworkId,
  contractAddress: string
) => {
  const apiUrl = EXPLORER_API_URLS[network]
  const params = new URLSearchParams({
    module: 'contract',
    action: 'getAbi',
    address: contractAddress,
  })

  const response = await fetch(`${apiUrl}?${params}`)
  if (!response.ok) {
    return ''
  }

  const { result, status } = await response.json()
  return status === 0 ? '' : result
}

export const CallContract: React.FC<Props> = ({
  value = INITIAL_VALUE,
  onChange,
  network,
}) => {
  const updateAbiFunc = (abi: string) => onChange({ ...value, abi })
  const updateAbi = useRef(updateAbiFunc)
  updateAbi.current = updateAbiFunc

  useEffect(() => {
    const address = validateAddress(value.to)
    if (!address) {
      updateAbi.current('')
    } else {
      fetchContractAbi(network, address).then((abi) => {
        updateAbi.current(abi)
      })
    }
  }, [network, value.to])

  const { abi } = value
  const contractInterface = useMemo(() => {
    if (!abi) return new Interface([])
    return new Interface(abi)
  }, [abi])

  // const updateParameterValue = (name: string, paramValue: string) => {
  //   const newInputs = contractInterface.functions[value.method]?.inputs.map(
  //     (input) =>
  //       input.name === name
  //         ? paramValue || '0x0'
  //         : parameterValues[input.name] || '0x0'
  //   )
  //   console.log('update', value.method, newInputs)
  //   contractInterface.encodeFunctionData(value.method, newInputs)
  // }

  const payable = contractInterface.functions[value.method]?.payable || false
  const inputs = contractInterface.functions[value.method]?.inputs || []

  return (
    <fieldset>
      <legend>Call contract</legend>
      <label>
        To
        <AddressInput
          value={value.to}
          onChange={(ev, to) => onChange({ ...value, to })}
        />
      </label>
      <label>
        ABI
        <AbiInput
          value={abi}
          onChange={(ev) => updateAbi.current(ev.target.value)}
          format={AbiFormat.FULL}
        />
      </label>
      <label>
        Method
        <select
          value={value.method}
          onChange={(ev) =>
            onChange({ ...value, method: ev.target.value, inputValues: {} })
          }
        >
          {Object.entries(contractInterface.functions).map(
            ([signature, func]) => (
              <option key={signature} value={signature}>
                {func.name}
              </option>
            )
          )}
        </select>
      </label>
      {payable && (
        <label>
          Value (wei)
          <input
            type="number"
            value={value.value}
            onChange={(ev) => onChange({ ...value, value: ev.target.value })}
          />
        </label>
      )}
      {inputs.length > 0 ? (
        <fieldset>
          {inputs.map((input) => (
            <label key={input.name}>
              {input.name} <span>({input.type})</span>
              <input
                type="text"
                name={input.name}
                value={value.inputValues[input.name] || ''}
                onChange={(ev) =>
                  onChange({
                    ...value,
                    inputValues: {
                      ...value.inputValues,
                      [input.name]: ev.target.value,
                    },
                  })
                }
              />
            </label>
          ))}
        </fieldset>
      ) : null}
    </fieldset>
  )
}
