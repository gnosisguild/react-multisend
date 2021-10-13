import { Interface, FormatTypes } from '@ethersproject/abi'
import { render, waitForElementToBeRemoved } from '@testing-library/react'
import React from 'react'
import { INITIAL_VALUE, Props, useContractCall } from './useContractCall'

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
    const { loading } = useContractCall(props)
    return <div>{loading && <span>loading...</span>}</div>
  }

  it('should fetch the ABI for the contract at the provided address', async () => {
    const onChange = jest.fn()
    const { getByText } = render(
      <TestComponent
        network="4"
        value={{ ...INITIAL_VALUE, to: TEST_CONTRACT_ADDRESS }}
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
    const ListFunctionNames = () => {
      const { functions } = useContractCall({
        value: { ...INITIAL_VALUE, abi: TEST_CONTRACT_ABI },
        onChange: jest.fn(),
        network: '4',
      })
      return (
        <ul>
          {functions.map((f) => (
            <li>{f.name}</li>
          ))}
        </ul>
      )
    }

    const { getAllByRole, queryByText } = render(<ListFunctionNames />)
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
        value={{ ...INITIAL_VALUE, abi: TEST_CONTRACT_ABI }}
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
          ...INITIAL_VALUE,
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
    const InputForm = () => {
      const { inputs } = useContractCall({
        value: {
          to: '',
          value: '',
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
        },
        onChange: jest.fn(),
        network: '4',
      })

      return (
        <form>
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
      )
    }

    const { getByLabelText } = render(<InputForm />)
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

  it.todo('should not include unnamed inputs')

  it.todo('should indicate when ABI is being fetched')
  it.todo('should indicate if the provided ABI value is invalid')
  it.todo(
    'should cancel pending ABI requests when the contract address is updated'
  )
})
