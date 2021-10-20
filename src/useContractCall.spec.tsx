import { Interface, FormatTypes } from '@ethersproject/abi'
import { render, waitForElementToBeRemoved } from '@testing-library/react'
import React from 'react'
import { createTransaction, TransactionType } from '.'
import { Props, useContractCall } from './useContractCall'

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
              <label>
                <span>
                  {input.name} ({input.type})
                </span>
                <input
                  type="text"
                  name={input.name}
                  value={JSON.stringify(input.value)}
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
})
