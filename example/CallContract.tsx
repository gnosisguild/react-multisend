import React from 'react'
import { AbiFormat, AbiInput } from './AbiInput'
import { AddressInput } from './AddressInput'
import { INITIAL_VALUE, Props, useContractCall } from '../src/useContractCall'

export const CallContract: React.FC<Props> = (props) => {
  const { value = INITIAL_VALUE, onChange } = props
  const { functions, payable, inputs, loading } = useContractCall(props)

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
          value={value.abi}
          onChange={(ev) => onChange({ ...value, abi: ev.target.value })}
          format={AbiFormat.FULL}
        />
      </label>
      <label>
        Method
        <select
          disabled={loading}
          value={value.functionSignature}
          onChange={(ev) =>
            onChange({
              ...value,
              functionSignature: ev.target.value,
              inputValues: {},
            })
          }
        >
          {functions.map((func) => (
            <option key={func.signature} value={func.signature}>
              {func.name}
            </option>
          ))}
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
                value={`${input.value || ''}`}
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
