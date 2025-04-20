'use client'

import { NextPage } from 'next'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { BN } from '@coral-xyz/anchor'
import {
  createPoll,
  getCounter,
  getProvider,
} from '../services/blockchain.service'
import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/navigation'

const Page: NextPage = () => {
  const router = useRouter()
  const { publicKey, sendTransaction, signTransaction } = useWallet()
  const [nextCount, setNextCount] = useState<BN>(new BN(0))
  const [isInitialized, setIsInitialized] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const program = useMemo(
    () => getProvider(publicKey, signTransaction, sendTransaction),
    [publicKey, signTransaction, sendTransaction]
  )

  const [formData, setFormData] = useState({
    description: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    const fetchCounter = async () => {
      if (!program) return
      try {
        const count = await getCounter(program)
        setNextCount(count.add(new BN(1)))
        setIsInitialized(count.gte(new BN(0)))
      } catch (error) {
        console.error('Error fetching counter:', error)
        toast.error('Failed to fetch poll counter')
      }
    }

    fetchCounter()
  }, [program])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!publicKey) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!program) {
      toast.error('Failed to connect to program')
      return
    }

    if (!isInitialized) {
      toast.error('Please initialize the program first')
      router.push('/')
      return
    }

    if (isSubmitting) return

    const { description, startDate, endDate } = formData

    if (!description.trim()) {
      toast.error('Please enter a description')
      return
    }

    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates')
      return
    }

    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000)
    const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000)

    if (startTimestamp >= endTimestamp) {
      toast.error('End date must be after start date')
      return
    }

    setIsSubmitting(true)

    try {
      await toast.promise(
        new Promise<void>(async (resolve, reject) => {
          try {
            const tx = await createPoll(
              program,
              publicKey,
              nextCount,
              description,
              startTimestamp,
              endTimestamp
            )

            setFormData({
              description: '',
              startDate: '',
              endDate: '',
            })

            console.log('Create poll transaction:', tx)
            resolve()
            router.push('/')
          } catch (error) {
            console.error('Create poll failed:', error)
            reject(error)
          }
        }),
        {
          pending: 'Creating poll...',
          success: 'Poll created successfully 👌',
          error: 'Failed to create poll 🤯',
        }
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="h-16"></div>
      <div className="flex flex-col justify-center items-center space-y-6 w-full">
        <h2 className="bg-gray-800 text-white rounded-full px-6 py-2 text-lg font-bold">
          Create Poll
        </h2>

        <form
          className="bg-white border border-gray-300 rounded-2xl
        shadow-lg p-6 w-4/5 md:w-2/5 space-y-6"
          onSubmit={handleSubmit}
        >
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-gray-700"
            >
              Description
            </label>
            <input
              type="text"
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
              focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter poll description"
              required
            />
          </div>

          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-semibold text-gray-700"
            >
              Start Date
            </label>
            <input
              type="datetime-local"
              id="startDate"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
              focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-semibold text-gray-700"
            >
              End Date
            </label>
            <input
              type="datetime-local"
              id="endDate"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
              focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isInitialized}
            className="w-full bg-gray-800 text-white font-bold py-2 px-4 rounded-lg
            hover:bg-gray-900 transition duration-200 disabled:opacity-50
            disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Poll'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Page
