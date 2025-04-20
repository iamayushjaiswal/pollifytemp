'use client'

import React, { useMemo } from 'react'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { Connection } from '@solana/web3.js'
import {
  SolflareWalletAdapter,
  PhantomWalletAdapter,
} from '@solana/wallet-adapter-wallets'

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css')

export default function AppWalletProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL
    if (!rpcUrl) {
      console.warn('NEXT_PUBLIC_RPC_URL not set, using default devnet endpoint')
      return 'https://api.devnet.solana.com'
    }
    return rpcUrl
  }, [])

  const connection = useMemo(() => new Connection(endpoint, 'confirmed'), [endpoint])

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter({ network }),
      new SolflareWalletAdapter({ network }),
    ],
    [network]
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
