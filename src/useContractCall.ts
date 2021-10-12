import {
  FormatTypes,
  FunctionFragment,
  Interface,
  ParamType,
} from '@ethersproject/abi'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NetworkId } from './safe'
import { validateAddress } from '../example/AddressInput'

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
type ValueType =
  | string
  | boolean
  | Array<ValueType>
  | { [key: string]: ValueType }

type CallContractTransactionInput = {
  to: string // contract address
  value: string
  abi: string
  functionSignature: string // the function signature in FormatTypes.minimal format
  inputValues: { [key: string]: ValueType }
}

export type Props = {
  value?: CallContractTransactionInput
  onChange(value: CallContractTransactionInput): void
  network: NetworkId
}

export const INITIAL_VALUE = {
  to: '',
  value: '',
  abi: '',
  functionSignature: '',
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

interface Input {
  name: string
  type: string
  baseType: string
  arrayChildren: ParamType
  arrayLength: number
  components: ParamType[]
  value: ValueType
}

type ContractFunction = FunctionFragment & { signature: string }

interface ReturnValue {
  payable: boolean
  inputs: Input[]
  functions: ContractFunction[]
  loading: boolean
  isValidAbi: boolean
  updateAbi(abi: string): void
}

export const useContractCall = ({
  value = INITIAL_VALUE,
  onChange,
  network,
}: Props): ReturnValue => {
  const { to, abi, functionSignature, inputValues } = value

  const [loading, setLoading] = useState(false)

  // create a referentially stable callback to update the ABI
  const valueRef = useRef(value)
  valueRef.current = value
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const updateAbi = useCallback((abi: string) => {
    onChangeRef.current({ ...valueRef.current, abi })
  }, [])

  useEffect(() => {
    let canceled = false

    const address = validateAddress(to)
    if (!address) {
      updateAbi('')
    } else {
      setLoading(true)
      fetchContractAbi(network, address).then((abi) => {
        if (!canceled) {
          updateAbi(abi)
          setLoading(false)
        }
      })
    }

    return () => {
      canceled = true
    }
  }, [updateAbi, network, to])

  const contractInterface = useMemo(() => {
    if (!abi) return new Interface([])
    return new Interface(abi)
  }, [abi])

  // reset selected function if it doesn't exist in the current contract interface
  useEffect(() => {
    if (!contractInterface.functions[valueRef.current.functionSignature]) {
      onChangeRef.current({ ...valueRef.current, functionSignature: '' })
    }
  }, [contractInterface])

  const payable =
    contractInterface.functions[functionSignature]?.payable || false
  const inputTypes = contractInterface.functions[functionSignature]?.inputs

  const inputs = useMemo(
    () =>
      (inputTypes || [])
        .filter((inputType) => !!inputType.name) // don't render fields for unnamed inputs
        .map((inputType) => ({
          name: inputType.name,
          type: inputType.type,
          baseType: inputType.baseType,
          arrayChildren: inputType.arrayChildren,
          arrayLength: inputType.arrayLength,
          components: inputType.components,
          value: inputValues[inputType.name],
        })),
    [inputTypes, inputValues]
  )

  const functions = Object.values(contractInterface.functions || [])
    .filter(
      (func) => !func.constant // only list state updating functions
    )
    .map((func) => ({
      ...func,
      format: func.format,
      signature: func.format(FormatTypes.minimal),
    }))

  return {
    functions,
    payable,
    inputs,
    loading,
    isValidAbi: !!contractInterface,
    updateAbi,
  }
}
