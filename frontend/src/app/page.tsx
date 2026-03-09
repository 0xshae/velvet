'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useWriteContract, useSwitchChain } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { parseAbi } from 'viem'

const USDC_ABI = parseAbi(['function transfer(address to, uint256 amount) returns (bool)'])

export default function Home() {
  const { address, isConnected, chainId } = useAccount()
  const { connectors, connect, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const { writeContractAsync } = useWriteContract()
  const { switchChainAsync } = useSwitchChain()
  
  const [content, setContent] = useState<{title: string, text: string} | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleConnect = () => {
    setError(null)
    try {
      const coinbaseConnector = connectors.find(c => c.id.toLowerCase().includes('coinbase') || c.name.toLowerCase().includes('coinbase'))
      if (coinbaseConnector) {
        connect({ connector: coinbaseConnector })
      } else if (connectors.length > 0) {
        connect({ connector: connectors[0] })
      } else {
        setError("No wallet connectors found. Please refresh or install a wallet.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to initiate connection.")
    }
  }

  const fetchContent = async (txHash?: string, paymentReq?: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const headers: HeadersInit = {}
      
      // If we have a transaction hash, we append it to the payment signature header
      if (txHash && paymentReq) {
        // The x402 protocol schema for PaymentPayloadV2 expects:
        // x402Version: 2, accepted: <PaymentRequirement>, payload: { transaction: ... }
        const payload = {
          x402Version: 2,
          accepted: paymentReq,
          payload: { transaction: txHash }
        }
        headers['PAYMENT-SIGNATURE'] = btoa(JSON.stringify(payload))
      }
      
      const res = await fetch('http://localhost:3001/api/content/1', { 
        headers,
        mode: 'cors'
      })
      
      if (res.status === 402) {
        if (!isConnected) {
          setError("Please connect your wallet first.")
          setLoading(false)
          return
        }
        
        // Switch chain if needed
        if (chainId !== baseSepolia.id) {
          await switchChainAsync({ chainId: baseSepolia.id })
        }
        
        const paymentRequiredB64 = res.headers.get('PAYMENT-REQUIRED')
        if (!paymentRequiredB64) {
          throw new Error("Missing PAYMENT-REQUIRED header")
        }
        
        const paymentRequired = JSON.parse(atob(paymentRequiredB64))
        const req = paymentRequired.accepts[0]
        
        // Execute the ERC20 transfer
        const tx = await writeContractAsync({
          address: req.asset, // The USDC token address
          abi: USDC_ABI,
          functionName: 'transfer',
          args: [req.payTo, BigInt(req.amount)],
        })
        
        // Refetch with Tx Hash
        await fetchContent(tx, req)
        return
      }
      
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.statusText}`)
      }
      
      const data = await res.json()
      setContent(data)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-xl mx-auto space-y-8 bg-neutral-900/50 p-8 rounded-2xl border border-neutral-800 shadow-xl backdrop-blur-sm">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Velvet
          </h1>
          <p className="text-neutral-400">The seamless email paywall app using Coinbase x402</p>
        </div>

        <div className="flex flex-col items-center justify-center gap-4">
          {!mounted ? (
            <div className="h-12 w-32 bg-neutral-800 animate-pulse rounded-full"></div>
          ) : !isConnected ? (
            <div className="flex flex-col items-center">
              <button
                onClick={handleConnect}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 transition-colors rounded-full font-medium"
              >
                Connect Smart Wallet
              </button>
              {connectError && (
                <p className="mt-4 text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20">
                  {connectError.message}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-sm font-mono text-neutral-400 bg-neutral-900 px-3 py-1 rounded-lg border border-neutral-800">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button
                onClick={() => disconnect()}
                className="text-sm text-neutral-500 hover:text-white transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {content ? (
          <div className="bg-neutral-800/50 p-6 rounded-xl border border-emerald-500/20 space-y-4 mt-8">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold uppercase tracking-wider">Unlocked</span>
            </div>
            <h2 className="text-2xl font-bold">{content.title}</h2>
            <p className="text-neutral-300 leading-relaxed">{content.text}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <button
              onClick={() => fetchContent()}
              disabled={loading}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)]"
            >
              {loading ? 'Processing...' : 'Read Premium Content for 1.00 USDC'}
            </button>
            {error && (
              <p className="mt-4 text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
