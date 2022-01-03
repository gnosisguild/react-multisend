import { FormatTypes, Interface } from '@ethersproject/abi'
import { InfuraProvider } from '@ethersproject/providers'
import { render, waitForElementToBeRemoved } from '@testing-library/react'
import React from 'react'

import { fetchContractAbi, Props, useContractCall } from './useContractCall'

import { createTransaction, TransactionType } from '.'

const TEST_CONTRACT_ADDRESS = '0x68970a60fbc4274e1c604efd6e55d700cd0f140c'
const TEST_CONTRACT_ABI = new Interface([
  'constructor()',
  'event OwnerSet(address indexed oldOwner, address indexed newOwner)',
  'function changeOwner(address newOwner)',
  'function functionWithLotsOfParams(string stringParam, address[2] fixedSizeAddressArrayParam, int256[][] int2DArrayParam, tuple(bytes8 bytesMember, bool boolMember) tupleParam, function functionParam)',
  'function getOwner() view returns (address)',
  'function pay(int256 amount) payable',
  'function payWithUnnamedParam(int256, bool confirm) payable',
]).format(FormatTypes.json) as string

describe('useContractCall', () => {
  const TestComponent = (props: Props) => {
    const { loading, payable, inputs, functions } = useContractCall({
      ...props,
      blockExplorerApiKey: process.env.ETHERSCAN_API_KEY,
    })
    return (
      <div>
        {loading && <span>loading...</span>}
        {payable && <span>payable</span>}
        <ul data-testid="functions">
          {functions.map((f) => (
            <li key={f.signature}>{f.name}</li>
          ))}
        </ul>
        {inputs && (
          <form data-testid="inputs">
            {inputs.map((input) => (
              <label key={input.name}>
                <span>
                  {input.name} ({input.type})
                </span>
                <input
                  type="text"
                  name={input.name}
                  value={JSON.stringify(input.value)}
                  readOnly
                />
              </label>
            ))}
          </form>
        )}
      </div>
    )
  }

  it('should fetch the ABI for the contract at the provided address', async () => {
    const onChange = jest.fn()
    const { getByText } = render(
      <TestComponent
        network="4"
        value={{
          ...createTransaction(TransactionType.callContract),
          to: TEST_CONTRACT_ADDRESS,
        }}
        onChange={onChange}
      />
    )
    await waitForElementToBeRemoved(getByText('loading...'), { timeout: 5000 })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        abi: TEST_CONTRACT_ABI,
      })
    )
  })

  it('should return state updating functions only', () => {
    const { getAllByRole, queryByText } = render(
      <TestComponent
        value={{
          ...createTransaction(TransactionType.callContract),
          abi: TEST_CONTRACT_ABI,
        }}
        onChange={jest.fn()}
        network="4"
      />
    )
    const functionItems = getAllByRole('listitem')
    expect(functionItems).toHaveLength(4)
    expect(queryByText('changeOwner')).toBeInTheDocument()
    expect(queryByText('getOwner')).not.toBeInTheDocument()
  })

  it('should initially select the first function on change of the ABI', () => {
    const onChange = jest.fn()
    const { rerender } = render(
      <TestComponent
        network="4"
        value={{
          ...createTransaction(TransactionType.callContract),
          abi: TEST_CONTRACT_ABI,
        }}
        onChange={onChange}
      />
    )

    // ABI is provided in initial render, but no function is selected
    // -> onChange should be triggered after mount, selecting the first function
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        functionSignature: 'changeOwner(address)',
      })
    )

    onChange.mockReset()

    const newAbi = new Interface([
      'function mint(address to, uint256 amount)',
    ]).format(FormatTypes.json) as string

    // update of the ABI without the selected function
    // -> onChange should be triggered, selecting the first function
    rerender(
      <TestComponent
        network="4"
        value={{
          ...createTransaction(TransactionType.callContract),
          functionSignature: 'changeOwner(address)',
          abi: newAbi,
        }}
        onChange={onChange}
      />
    )

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        functionSignature: 'mint(address,uint256)',
      })
    )
  })

  it('should return inputs by merging the param type info read from the ABI with the inputValues of the value', async () => {
    const { getByLabelText } = render(
      <TestComponent
        value={{
          ...createTransaction(TransactionType.callContract),
          abi: TEST_CONTRACT_ABI,
          functionSignature:
            'functionWithLotsOfParams(string,address[2],int256[][],(bytes8,bool),function)',
          inputValues: {
            stringParam: 'foo',
            fixedSizeAddressArrayParam: [
              '0x68970a60fbc4274e1c604efd6e55d700cd0f140c',
              '0x68970a60fbc4274e1c604efd6e55d700cd0f140c',
            ],
          },
        }}
        onChange={jest.fn()}
        network="4"
      />
    )
    expect(getByLabelText('stringParam (string)')).toHaveValue(
      JSON.stringify('foo')
    )
    expect(
      getByLabelText('fixedSizeAddressArrayParam (address[2])')
    ).toHaveValue(
      JSON.stringify([
        '0x68970a60fbc4274e1c604efd6e55d700cd0f140c',
        '0x68970a60fbc4274e1c604efd6e55d700cd0f140c',
      ])
    )
  })

  it('should not include unnamed inputs', () => {
    const { getAllByRole } = render(
      <TestComponent
        value={{
          ...createTransaction(TransactionType.callContract),
          abi: TEST_CONTRACT_ABI,
          functionSignature: 'payWithUnnamedParam(int256,bool)',
          inputValues: {},
        }}
        onChange={jest.fn()}
        network="4"
      />
    )
    expect(getAllByRole('textbox')).toHaveLength(1)
  })

  it('should reset the value when switching from a payable to a non-payable function', () => {
    const onChange = jest.fn()
    const { rerender } = render(
      <TestComponent
        network="4"
        value={{
          ...createTransaction(TransactionType.callContract),
          abi: TEST_CONTRACT_ABI,
          functionSignature: 'pay(int256)',
          value: '1000',
        }}
        onChange={onChange}
      />
    )

    rerender(
      <TestComponent
        network="4"
        value={{
          ...createTransaction(TransactionType.callContract),
          abi: TEST_CONTRACT_ABI,
          functionSignature: 'changeOwner(address)',
          value: '1000',
        }}
        onChange={onChange}
      />
    )

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: '' })
    )
  })

  it('should indicate when ABI is being fetched', async () => {
    const { queryByText, getByText, rerender } = render(
      <TestComponent
        network="4"
        value={{
          ...createTransaction(TransactionType.callContract),
          abi: TEST_CONTRACT_ABI,
        }}
        onChange={jest.fn()}
      />
    )

    expect(queryByText('loading...')).not.toBeInTheDocument()

    rerender(
      <TestComponent
        network="4"
        value={{
          ...createTransaction(TransactionType.callContract),
          to: TEST_CONTRACT_ADDRESS,
        }}
        onChange={jest.fn()}
      />
    )
    await waitForElementToBeRemoved(getByText('loading...'), { timeout: 5000 })
  })

  it('should return whether the selected function is payable', () => {
    const { queryByText, rerender } = render(
      <TestComponent
        network="4"
        value={{
          ...createTransaction(TransactionType.callContract),
          abi: TEST_CONTRACT_ABI,
          functionSignature: 'changeOwner(address)',
        }}
        onChange={jest.fn()}
      />
    )
    expect(queryByText('payable')).not.toBeInTheDocument()

    rerender(
      <TestComponent
        network="4"
        value={{
          ...createTransaction(TransactionType.callContract),
          abi: TEST_CONTRACT_ABI,
          functionSignature: 'pay(int256)',
        }}
        onChange={jest.fn()}
      />
    )
    expect(queryByText('payable')).toBeInTheDocument()
  })

  it('should cancel pending ABI requests when the contract address is updated', async () => {
    const onChange = jest.fn()
    const { getByText, rerender } = render(
      <TestComponent
        network="4"
        value={{
          ...createTransaction(TransactionType.callContract),
          to: TEST_CONTRACT_ADDRESS,
        }}
        onChange={jest.fn()}
      />
    )

    const TEST_TOKEN_CONTRACT_ABI = new Interface([
      'constructor(uint8 _decimals)',
      'event Approval(address indexed owner, address indexed spender, uint256 value)',
      'event Transfer(address indexed from, address indexed to, uint256 value)',
      'function allowance(address owner, address spender) view returns (uint256)',
      'function approve(address spender, uint256 amount) returns (bool)',
      'function balanceOf(address account) view returns (uint256)',
      'function decimals() view returns (uint8)',
      'function decreaseAllowance(address spender, uint256 subtractedValue) returns (bool)',
      'function increaseAllowance(address spender, uint256 addedValue) returns (bool)',
      'function mint(address to, uint256 amount)',
      'function name() view returns (string)',
      'function owner() view returns (address)',
      'function symbol() view returns (string)',
      'function totalSupply() view returns (uint256)',
      'function transfer(address recipient, uint256 amount) returns (bool)',
      'function transferFrom(address sender, address recipient, uint256 amount) returns (bool)',
    ]).format(FormatTypes.json) as string
    const TEST_TOKEN_CONTRACT_ADDRESS =
      '0x8BcD4780Bc643f9C802CF69908ef3D34A59F4e5c'
    rerender(
      <TestComponent
        network="4"
        value={{
          ...createTransaction(TransactionType.callContract),
          to: TEST_TOKEN_CONTRACT_ADDRESS,
        }}
        onChange={jest.fn()}
      />
    )

    await waitForElementToBeRemoved(getByText('loading...'), { timeout: 5000 })

    expect(onChange).not.toHaveBeenCalledWith(
      expect.objectContaining({
        abi: TEST_CONTRACT_ABI,
      })
    )
    expect(onChange).not.toHaveBeenCalledWith(
      expect.objectContaining({
        abi: TEST_TOKEN_CONTRACT_ABI,
      })
    )
  })

  describe('fetchContractAbi', () => {
    const provider = new InfuraProvider(1, process.env.INFURA_API_KEY)

    it('fetches the ABI of verified contracts', async () => {
      expect(
        await fetchContractAbi({
          network: '1',
          contractAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          provider,
          blockExplorerApiKey: process.env.ETHERSCAN_API_KEY,
        })
      ).toMatchInlineSnapshot(
        `"[{\\"type\\":\\"function\\",\\"name\\":\\"name\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[{\\"type\\":\\"string\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"approve\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"guy\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"wad\\"}],\\"outputs\\":[{\\"type\\":\\"bool\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"totalSupply\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[{\\"type\\":\\"uint256\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"transferFrom\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"src\\"},{\\"type\\":\\"address\\",\\"name\\":\\"dst\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"wad\\"}],\\"outputs\\":[{\\"type\\":\\"bool\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"withdraw\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"uint256\\",\\"name\\":\\"wad\\"}],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"decimals\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[{\\"type\\":\\"uint8\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"balanceOf\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\"}],\\"outputs\\":[{\\"type\\":\\"uint256\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"symbol\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[{\\"type\\":\\"string\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"transfer\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"dst\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"wad\\"}],\\"outputs\\":[{\\"type\\":\\"bool\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"deposit\\",\\"constant\\":false,\\"stateMutability\\":\\"payable\\",\\"payable\\":true,\\"inputs\\":[],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"allowance\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\"},{\\"type\\":\\"address\\"}],\\"outputs\\":[{\\"type\\":\\"uint256\\"}]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"Approval\\",\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"src\\",\\"indexed\\":true},{\\"type\\":\\"address\\",\\"name\\":\\"guy\\",\\"indexed\\":true},{\\"type\\":\\"uint256\\",\\"name\\":\\"wad\\",\\"indexed\\":false}]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"Transfer\\",\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"src\\",\\"indexed\\":true},{\\"type\\":\\"address\\",\\"name\\":\\"dst\\",\\"indexed\\":true},{\\"type\\":\\"uint256\\",\\"name\\":\\"wad\\",\\"indexed\\":false}]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"Deposit\\",\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"dst\\",\\"indexed\\":true},{\\"type\\":\\"uint256\\",\\"name\\":\\"wad\\",\\"indexed\\":false}]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"Withdrawal\\",\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"src\\",\\"indexed\\":true},{\\"type\\":\\"uint256\\",\\"name\\":\\"wad\\",\\"indexed\\":false}]}]"`
      )
    })

    it('returns empty string for non-contract addresses', async () => {
      expect(
        await fetchContractAbi({
          network: '1',
          contractAddress: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
          provider,
          blockExplorerApiKey: process.env.ETHERSCAN_API_KEY,
        })
      ).toBe('')
    })

    it('fetches the ABI of the implementation contract if the address of a proxy target is passed', async () => {
      // EIP-1967 beacon proxy
      expect(
        await fetchContractAbi({
          network: '1',
          contractAddress: '0xDd4e2eb37268B047f55fC5cAf22837F9EC08A881',
          provider,
          blockExplorerApiKey: process.env.ETHERSCAN_API_KEY,
        })
      ).toMatchInlineSnapshot(
        `"[{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"Approval\\",\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"owner\\",\\"indexed\\":true},{\\"type\\":\\"address\\",\\"name\\":\\"spender\\",\\"indexed\\":true},{\\"type\\":\\"uint256\\",\\"name\\":\\"value\\",\\"indexed\\":false}]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"ClaimedByFeeCollector\\",\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"to\\",\\"indexed\\":true},{\\"type\\":\\"uint256\\",\\"name\\":\\"amount\\",\\"indexed\\":false}]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"OwnershipTransferred\\",\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"previousOwner\\",\\"indexed\\":true},{\\"type\\":\\"address\\",\\"name\\":\\"newOwner\\",\\"indexed\\":true}]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"Redeemed\\",\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"to\\",\\"indexed\\":true},{\\"type\\":\\"uint256\\",\\"name\\":\\"amount\\",\\"indexed\\":false}]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"Transfer\\",\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"from\\",\\"indexed\\":true},{\\"type\\":\\"address\\",\\"name\\":\\"to\\",\\"indexed\\":true},{\\"type\\":\\"uint256\\",\\"name\\":\\"value\\",\\"indexed\\":false}]},{\\"type\\":\\"function\\",\\"name\\":\\"activationTimestamp\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[{\\"type\\":\\"uint256\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"addMerkleRoot\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"bytes32\\",\\"name\\":\\"_merkleRoot\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"_totalAmount\\"},{\\"type\\":\\"uint8\\",\\"name\\":\\"_v\\"},{\\"type\\":\\"bytes32\\",\\"name\\":\\"_r\\"},{\\"type\\":\\"bytes32\\",\\"name\\":\\"_s\\"}],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"addRecipient\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"_recipient\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"_amount\\"}],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"addRecipients\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address[]\\",\\"name\\":\\"_recipients\\"},{\\"type\\":\\"uint256[]\\",\\"name\\":\\"_amounts\\"}],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"addRecipientsType\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[{\\"type\\":\\"uint8\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"allowance\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"owner\\"},{\\"type\\":\\"address\\",\\"name\\":\\"spender\\"}],\\"outputs\\":[{\\"type\\":\\"uint256\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"approve\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"spender\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"amount\\"}],\\"outputs\\":[{\\"type\\":\\"bool\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"balanceOf\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"account\\"}],\\"outputs\\":[{\\"type\\":\\"uint256\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"claimProjectTokensByFeeCollector\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"claimTokensByMerkleProof\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"bytes32[]\\",\\"name\\":\\"_proof\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"_rootId\\"},{\\"type\\":\\"address\\",\\"name\\":\\"_recipient\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"_amount\\"}],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"decimals\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[{\\"type\\":\\"uint8\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"decreaseAllowance\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"spender\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"subtractedValue\\"}],\\"outputs\\":[{\\"type\\":\\"bool\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"domainSeparator\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[{\\"type\\":\\"bytes32\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"factory\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[{\\"type\\":\\"address\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"increaseAllowance\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"spender\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"addedValue\\"}],\\"outputs\\":[{\\"type\\":\\"bool\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"initialize\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"string\\",\\"name\\":\\"_name\\"},{\\"type\\":\\"string\\",\\"name\\":\\"_symbol\\"},{\\"type\\":\\"uint8\\",\\"name\\":\\"_decimals\\"},{\\"type\\":\\"address\\",\\"name\\":\\"_owner\\"},{\\"type\\":\\"address\\",\\"name\\":\\"_factory\\"},{\\"type\\":\\"address\\",\\"name\\":\\"_redeemToken\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"_activationTimestamp\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"_redeemTimestamp\\"},{\\"type\\":\\"uint8\\",\\"name\\":\\"_type\\"}],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"merkleRoots\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"uint256\\"}],\\"outputs\\":[{\\"type\\":\\"bytes32\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"name\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[{\\"type\\":\\"string\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"overrideFee\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"uint256\\",\\"name\\":\\"_newFee\\"}],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"overridenFee\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[{\\"type\\":\\"uint256\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"owner\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[{\\"type\\":\\"address\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"redeem\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"_recipient\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"_amount\\"}],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"redeemTimestamp\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[{\\"type\\":\\"uint256\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"redeemToken\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[{\\"type\\":\\"address\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"renounceOwnership\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"symbol\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[{\\"type\\":\\"string\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"totalSupply\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[{\\"type\\":\\"uint256\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"transfer\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"recipient\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"amount\\"}],\\"outputs\\":[{\\"type\\":\\"bool\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"transferFrom\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"sender\\"},{\\"type\\":\\"address\\",\\"name\\":\\"recipient\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"amount\\"}],\\"outputs\\":[{\\"type\\":\\"bool\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"transferOwnership\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"newOwner\\"}],\\"outputs\\":[]}]"`
      )

      // GnosisSafeProxy
      expect(
        await fetchContractAbi({
          network: '1',
          contractAddress: '0x0DA0C3e52C977Ed3cBc641fF02DD271c3ED55aFe',
          provider,
          blockExplorerApiKey: process.env.ETHERSCAN_API_KEY,
        })
      ).toMatchInlineSnapshot(
        `"[{\\"type\\":\\"constructor\\",\\"payable\\":false,\\"inputs\\":[]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"AddedOwner\\",\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"owner\\",\\"indexed\\":false}]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"ApproveHash\\",\\"inputs\\":[{\\"type\\":\\"bytes32\\",\\"name\\":\\"approvedHash\\",\\"indexed\\":true},{\\"type\\":\\"address\\",\\"name\\":\\"owner\\",\\"indexed\\":true}]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"ChangedFallbackHandler\\",\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"handler\\",\\"indexed\\":false}]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"ChangedGuard\\",\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"guard\\",\\"indexed\\":false}]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"ChangedThreshold\\",\\"inputs\\":[{\\"type\\":\\"uint256\\",\\"name\\":\\"threshold\\",\\"indexed\\":false}]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"DisabledModule\\",\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"module\\",\\"indexed\\":false}]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"EnabledModule\\",\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"module\\",\\"indexed\\":false}]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"ExecutionFailure\\",\\"inputs\\":[{\\"type\\":\\"bytes32\\",\\"name\\":\\"txHash\\",\\"indexed\\":false},{\\"type\\":\\"uint256\\",\\"name\\":\\"payment\\",\\"indexed\\":false}]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"ExecutionFromModuleFailure\\",\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"module\\",\\"indexed\\":true}]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"ExecutionFromModuleSuccess\\",\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"module\\",\\"indexed\\":true}]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"ExecutionSuccess\\",\\"inputs\\":[{\\"type\\":\\"bytes32\\",\\"name\\":\\"txHash\\",\\"indexed\\":false},{\\"type\\":\\"uint256\\",\\"name\\":\\"payment\\",\\"indexed\\":false}]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"RemovedOwner\\",\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"owner\\",\\"indexed\\":false}]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"SafeReceived\\",\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"sender\\",\\"indexed\\":true},{\\"type\\":\\"uint256\\",\\"name\\":\\"value\\",\\"indexed\\":false}]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"SafeSetup\\",\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"initiator\\",\\"indexed\\":true},{\\"type\\":\\"address[]\\",\\"name\\":\\"owners\\",\\"indexed\\":false},{\\"type\\":\\"uint256\\",\\"name\\":\\"threshold\\",\\"indexed\\":false},{\\"type\\":\\"address\\",\\"name\\":\\"initializer\\",\\"indexed\\":false},{\\"type\\":\\"address\\",\\"name\\":\\"fallbackHandler\\",\\"indexed\\":false}]},{\\"type\\":\\"event\\",\\"anonymous\\":false,\\"name\\":\\"SignMsg\\",\\"inputs\\":[{\\"type\\":\\"bytes32\\",\\"name\\":\\"msgHash\\",\\"indexed\\":true}]},{\\"type\\":\\"function\\",\\"name\\":\\"VERSION\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[{\\"type\\":\\"string\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"addOwnerWithThreshold\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"owner\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"_threshold\\"}],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"approveHash\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"bytes32\\",\\"name\\":\\"hashToApprove\\"}],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"approvedHashes\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\"},{\\"type\\":\\"bytes32\\"}],\\"outputs\\":[{\\"type\\":\\"uint256\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"changeThreshold\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"uint256\\",\\"name\\":\\"_threshold\\"}],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"checkNSignatures\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"bytes32\\",\\"name\\":\\"dataHash\\"},{\\"type\\":\\"bytes\\",\\"name\\":\\"data\\"},{\\"type\\":\\"bytes\\",\\"name\\":\\"signatures\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"requiredSignatures\\"}],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"checkSignatures\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"bytes32\\",\\"name\\":\\"dataHash\\"},{\\"type\\":\\"bytes\\",\\"name\\":\\"data\\"},{\\"type\\":\\"bytes\\",\\"name\\":\\"signatures\\"}],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"disableModule\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"prevModule\\"},{\\"type\\":\\"address\\",\\"name\\":\\"module\\"}],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"domainSeparator\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[{\\"type\\":\\"bytes32\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"enableModule\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"module\\"}],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"encodeTransactionData\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"to\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"value\\"},{\\"type\\":\\"bytes\\",\\"name\\":\\"data\\"},{\\"type\\":\\"uint8\\",\\"name\\":\\"operation\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"safeTxGas\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"baseGas\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"gasPrice\\"},{\\"type\\":\\"address\\",\\"name\\":\\"gasToken\\"},{\\"type\\":\\"address\\",\\"name\\":\\"refundReceiver\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"_nonce\\"}],\\"outputs\\":[{\\"type\\":\\"bytes\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"execTransaction\\",\\"constant\\":false,\\"stateMutability\\":\\"payable\\",\\"payable\\":true,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"to\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"value\\"},{\\"type\\":\\"bytes\\",\\"name\\":\\"data\\"},{\\"type\\":\\"uint8\\",\\"name\\":\\"operation\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"safeTxGas\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"baseGas\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"gasPrice\\"},{\\"type\\":\\"address\\",\\"name\\":\\"gasToken\\"},{\\"type\\":\\"address\\",\\"name\\":\\"refundReceiver\\"},{\\"type\\":\\"bytes\\",\\"name\\":\\"signatures\\"}],\\"outputs\\":[{\\"type\\":\\"bool\\",\\"name\\":\\"success\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"execTransactionFromModule\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"to\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"value\\"},{\\"type\\":\\"bytes\\",\\"name\\":\\"data\\"},{\\"type\\":\\"uint8\\",\\"name\\":\\"operation\\"}],\\"outputs\\":[{\\"type\\":\\"bool\\",\\"name\\":\\"success\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"execTransactionFromModuleReturnData\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"to\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"value\\"},{\\"type\\":\\"bytes\\",\\"name\\":\\"data\\"},{\\"type\\":\\"uint8\\",\\"name\\":\\"operation\\"}],\\"outputs\\":[{\\"type\\":\\"bool\\",\\"name\\":\\"success\\"},{\\"type\\":\\"bytes\\",\\"name\\":\\"returnData\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"getChainId\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[{\\"type\\":\\"uint256\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"getModulesPaginated\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"start\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"pageSize\\"}],\\"outputs\\":[{\\"type\\":\\"address[]\\",\\"name\\":\\"array\\"},{\\"type\\":\\"address\\",\\"name\\":\\"next\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"getOwners\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[{\\"type\\":\\"address[]\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"getStorageAt\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"uint256\\",\\"name\\":\\"offset\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"length\\"}],\\"outputs\\":[{\\"type\\":\\"bytes\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"getThreshold\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[{\\"type\\":\\"uint256\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"getTransactionHash\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"to\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"value\\"},{\\"type\\":\\"bytes\\",\\"name\\":\\"data\\"},{\\"type\\":\\"uint8\\",\\"name\\":\\"operation\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"safeTxGas\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"baseGas\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"gasPrice\\"},{\\"type\\":\\"address\\",\\"name\\":\\"gasToken\\"},{\\"type\\":\\"address\\",\\"name\\":\\"refundReceiver\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"_nonce\\"}],\\"outputs\\":[{\\"type\\":\\"bytes32\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"isModuleEnabled\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"module\\"}],\\"outputs\\":[{\\"type\\":\\"bool\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"isOwner\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"owner\\"}],\\"outputs\\":[{\\"type\\":\\"bool\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"nonce\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[],\\"outputs\\":[{\\"type\\":\\"uint256\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"removeOwner\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"prevOwner\\"},{\\"type\\":\\"address\\",\\"name\\":\\"owner\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"_threshold\\"}],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"requiredTxGas\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"to\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"value\\"},{\\"type\\":\\"bytes\\",\\"name\\":\\"data\\"},{\\"type\\":\\"uint8\\",\\"name\\":\\"operation\\"}],\\"outputs\\":[{\\"type\\":\\"uint256\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"setFallbackHandler\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"handler\\"}],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"setGuard\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"guard\\"}],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"setup\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address[]\\",\\"name\\":\\"_owners\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"_threshold\\"},{\\"type\\":\\"address\\",\\"name\\":\\"to\\"},{\\"type\\":\\"bytes\\",\\"name\\":\\"data\\"},{\\"type\\":\\"address\\",\\"name\\":\\"fallbackHandler\\"},{\\"type\\":\\"address\\",\\"name\\":\\"paymentToken\\"},{\\"type\\":\\"uint256\\",\\"name\\":\\"payment\\"},{\\"type\\":\\"address\\",\\"name\\":\\"paymentReceiver\\"}],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"signedMessages\\",\\"constant\\":true,\\"stateMutability\\":\\"view\\",\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"bytes32\\"}],\\"outputs\\":[{\\"type\\":\\"uint256\\"}]},{\\"type\\":\\"function\\",\\"name\\":\\"simulateAndRevert\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"targetContract\\"},{\\"type\\":\\"bytes\\",\\"name\\":\\"calldataPayload\\"}],\\"outputs\\":[]},{\\"type\\":\\"function\\",\\"name\\":\\"swapOwner\\",\\"constant\\":false,\\"payable\\":false,\\"inputs\\":[{\\"type\\":\\"address\\",\\"name\\":\\"prevOwner\\"},{\\"type\\":\\"address\\",\\"name\\":\\"oldOwner\\"},{\\"type\\":\\"address\\",\\"name\\":\\"newOwner\\"}],\\"outputs\\":[]}]"`
      )
    })
  })
})
