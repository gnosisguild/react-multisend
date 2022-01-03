import { JsonRpcProvider } from '@ethersproject/providers'
import React, { useMemo } from 'react'

import {
  CallContractTransactionInput,
  NetworkId,
  useContractCall,
} from '../../src'

import { AbiFormat, AbiInput } from './AbiInput'
import { AddressInput } from './AddressInput'

const RPC_URLS = {
  '1': 'https://mainnet.infura.io/v3/e301e57e9a51407eb39df231874e0563	',
  '100': 'https://dai.poa.network',
  '4': 'https://rinkey.infura.io/v3/e301e57e9a51407eb39df231874e0563',
  '5': 'https://goerli.infura.io/v3/e301e57e9a51407eb39df231874e0563',
  '10': 'https://mainnet.optimism.io',
  '42220': 'https://forno.celo.org',
  '246': 'https://rpc.energyweb.org',
  '73799': 'https://volta-rpc.energyweb.org',
  '137': 'https://polygon-rpc.com',
  '80001': 'https://rpc-mumbai.maticvigil.com',
  '56': 'https://bsc-dataseed.binance.org',
  '42161': 'https://arb1.arbitrum.io/rpc',
}

interface Props {
  value: CallContractTransactionInput
  onChange(value: CallContractTransactionInput): void
  network: NetworkId
  blockExplorerApiKey?: string
}

export const CallContract: React.FC<Props> = (props) => {
  const { value, onChange, network } = props

  const provider = useMemo(
    () => new JsonRpcProvider(RPC_URLS[network], parseInt(network)),
    [network]
  )

  const { functions, payable, inputs, loading } = useContractCall({
    ...props,
    provider,
  })

  return (
    <fieldset>
      <label>
        <span>Contract</span> <i>address</i>
        <AddressInput
          value={value.to}
          onChange={(ev, to) => onChange({ ...value, to })}
        />
      </label>
      <label>
        <span>ABI</span>
        <AbiInput
          value={value.abi}
          onChange={(ev) => onChange({ ...value, abi: ev.target.value })}
          format={AbiFormat.FULL}
        />
      </label>
      <label>
        <span>Method</span>
        <select
          disabled={loading || !value.abi}
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
          <span>Value (wei)</span>
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
              {input.name} <i>{input.type}</i>
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
