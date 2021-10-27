import {
  FormatTypes,
  FunctionFragment,
  Interface,
  ParamType,
} from '@ethersproject/abi'
import { getAddress } from '@ethersproject/address'
import {
  CallContractTransactionInput,
  createTransaction,
  TransactionType,
  ValueType,
} from 'ethers-multisend'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { NetworkId } from './safe'

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

export type Props = {
  value?: CallContractTransactionInput
  onChange(value: CallContractTransactionInput): void
  network: NetworkId
  blockExplorerApiKey?: string // Etherscan/block explorer API key
}

const validateAddress = (value: string): string | null => {
  try {
    return getAddress(value)
  } catch (e) {
    return null
  }
}

const fetchContractAbi = async (
  network: NetworkId,
  contractAddress: string,
  blockExplorerApiKey = ''
) => {
  const apiUrl = EXPLORER_API_URLS[network]
  const params = new URLSearchParams({
    module: 'contract',
    action: 'getAbi',
    address: contractAddress,
    apiKey: blockExplorerApiKey,
  })

  const response = await fetch(`${apiUrl}?${params}`)
  if (!response.ok) {
    return ''
  }

  const { result, status } = await response.json()
  if (status === '0') {
    console.error(`Could not fetch contract ABI: ${result}`)
    return ''
  }

  // bring the JSON into ethers.js canonical form
  // (so we don't trigger unnecessary updates when looking at the same ABI in different forms)
  return new Interface(result).format(FormatTypes.json) as string
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
  fetchSuccess: boolean
}

export const useContractCall = ({
  value = createTransaction(TransactionType.callContract),
  onChange,
  network,
  blockExplorerApiKey,
}: Props): ReturnValue => {
  const { to, abi, functionSignature, inputValues } = value

  const [loading, setLoading] = useState(false)
  const [fetchSuccess, setFetchSuccess] = useState(false)

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
    if (address) {
      setLoading(true)
      fetchContractAbi(network, address, blockExplorerApiKey).then((abi) => {
        if (!canceled) {
          updateAbi(abi)
          setFetchSuccess(abi !== '')
          setLoading(false)
        }
      })
    }

    return () => {
      canceled = true
    }
  }, [updateAbi, network, to, blockExplorerApiKey])

  const contractInterface = useMemo(() => {
    if (!abi) return null
    try {
      return new Interface(abi)
    } catch (e) {
      return null
    }
  }, [abi])

  const functions = Object.entries(contractInterface?.functions || [])
    .map(([signature, func]) => ({
      ...func,
      format: func.format,
      signature,
    }))
    .filter((func) => !func.constant) // only list state updating functions

  const selectedFunction = functions.find(
    (f) => f.signature === functionSignature
  )
  const selectedFunctionExists = !!selectedFunction
  const firstFunctionSignature = functions[0]?.signature || ''

  // set selection to first function if the provided functionSignature does not exist
  useEffect(() => {
    if (!selectedFunctionExists) {
      onChangeRef.current({
        ...valueRef.current,
        functionSignature: firstFunctionSignature,
      })
    }
  }, [selectedFunctionExists, firstFunctionSignature])

  const payable = selectedFunction?.payable || false
  const inputTypes = selectedFunction?.inputs

  // reset value field when switching to a non-payable function
  useEffect(() => {
    const { value } = valueRef.current
    if (!payable && value !== '' && value !== '0') {
      onChangeRef.current({
        ...valueRef.current,
        value: '',
      })
    }
  }, [payable])

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

  return {
    functions,
    payable,
    inputs,
    loading,
    fetchSuccess,
  }
}
