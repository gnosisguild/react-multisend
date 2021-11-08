import React, { createContext, ReactNode, useContext, useMemo } from 'react'

import { NetworkId } from './safe'
import { ProvideSafeBalances, ProvideSafeCollectibles } from './safeHooks'

interface ContextType {
  network: NetworkId
  safeAddress: string
  blockExplorerApiKey?: string
}
const MultiSendContext = createContext<ContextType>({
  network: '1',
  safeAddress: '',
})

interface Props {
  network: NetworkId
  safeAddress: string
  blockExplorerApiKey?: string
  lazy?: boolean
  children: ReactNode
}

export const ProvideMultiSendContext: React.FC<Props> = ({
  network,
  safeAddress,
  blockExplorerApiKey,
  lazy,
  children,
}) => {
  const packed = useMemo(
    () => ({
      network,
      safeAddress,
      blockExplorerApiKey,
    }),
    [network, safeAddress, blockExplorerApiKey]
  )
  return (
    <MultiSendContext.Provider value={packed}>
      <ProvideSafeBalances network={network} address={safeAddress} lazy={lazy}>
        <ProvideSafeCollectibles
          network={network}
          address={safeAddress}
          lazy={lazy}
        >
          {children}
        </ProvideSafeCollectibles>
      </ProvideSafeBalances>
    </MultiSendContext.Provider>
  )
}

export const useMultiSendContext = (): ContextType =>
  useContext(MultiSendContext)
