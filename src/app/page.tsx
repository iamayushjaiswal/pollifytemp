'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  fetchAllPolls,
  getCounter,
  getProvider,
  getReadonlyProvider,
  initialize,
} from '../app/services/blockchain.service'
import Link from 'next/link'
import { Poll } from './utils/interfaces'
import { BN } from '@coral-xyz/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import { toast } from 'react-toastify'

export default function Page() {
  const [polls, setPolls] = useState<Poll[]>([])
  const { publicKey, signTransaction, sendTransaction, connected } = useWallet()
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const programReadOnly = useMemo(() => getReadonlyProvider(), [])

  const program = useMemo(
    () => {
      if (!publicKey || !signTransaction || !sendTransaction) {
        return null
      }
      return getProvider(publicKey, signTransaction, sendTransaction)
    },
    [publicKey, signTransaction, sendTransaction]
  )

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const pollsData = await fetchAllPolls(programReadOnly)
      setPolls(pollsData as any)
      const count = await getCounter(programReadOnly)
      setIsInitialized(count.gte(new BN(0)))
    } catch (error) {
      console.error('Error fetching data:', error)
      setIsInitialized(false)
      toast.error('Failed to fetch data from blockchain')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!programReadOnly) return
    fetchData()
  }, [programReadOnly])

  const handleInit = async () => {
    if (!publicKey || !program) {
      toast.error('Please connect your wallet first')
      return
    }

    if (isInitialized) {
      toast.info('Program is already initialized')
      return
    }

    try {
      await toast.promise(
        new Promise<void>(async (resolve, reject) => {
          try {
            const tx = await initialize(program, publicKey)
            console.log('Initialization transaction:', tx)
            await fetchData()
            resolve()
          } catch (error) {
            console.error('Initialization failed:', error)
            reject(error)
          }
        }),
        {
          pending: 'Initializing program...',
          success: 'Program initialized successfully 👌',
          error: 'Initialization failed 🤯',
        }
      )
    } catch (error) {
      console.error('Initialization error:', error)
      toast.error('Failed to initialize program')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center py-10">
      {!connected && (
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Welcome to Pollify</h2>
          <p className="text-gray-600">Please connect your wallet to continue</p>
        </div>
      )}

      {connected && !isInitialized && (
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Initialize Program</h2>
          <p className="text-gray-600 mb-4">The program needs to be initialized before you can create polls</p>
          <button
            onClick={handleInit}
            className="bg-gray-800 text-white rounded-full px-6 py-2 text-lg font-bold hover:bg-gray-900 transition-colors"
          >
            Initialize
          </button>
        </div>
      )}

      {isInitialized && (
        <>
          <h2 className="bg-gray-800 text-white rounded-full px-6 py-2 text-lg font-bold mb-8">
            {polls.length > 0 ? 'List of Polls' : 'No Polls Yet'}
          </h2>
          {polls.length === 0 && (
            <p className="text-gray-600 mb-8">We don&apos;t have any polls yet, be the first to create one.</p>
          )}
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-4/5">
        {polls.map((poll) => (
          <div
            key={poll.publicKey}
            className="bg-white border border-gray-300 rounded-xl shadow-lg p-6 space-y-4"
          >
            <h3 className="text-lg font-semibold text-gray-800">
              {poll.description.length > 20
                ? poll.description.slice(0, 25) + '...'
                : poll.description}
            </h3>
            <div className="text-sm text-gray-600">
              <p>
                <span className="font-semibold">Starts:</span>{' '}
                {new Date(poll.start).toLocaleString()}
              </p>
              <p>
                <span className="font-semibold">Ends:</span>{' '}
                {new Date(poll.end).toLocaleString()}
              </p>
              <p>
                <span className="font-semibold">Candidates:</span>{' '}
                {poll.candidates}
              </p>
            </div>

            <div className="w-full">
              <Link
                href={`/polls/${poll.publicKey}`}
                className="bg-black text-white font-bold py-2 px-4 rounded-lg
              hover:bg-gray-900 transition duration-200 w-full block text-center"
              >
                View Poll
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
