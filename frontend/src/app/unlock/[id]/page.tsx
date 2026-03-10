'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAccount, useConnect, useDisconnect, useWriteContract, useSwitchChain } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { parseAbi } from 'viem'

const USDC_ABI = parseAbi(['function transfer(address to, uint256 amount) returns (bool)'])

export default function UnlockPage() {
  const params = useParams()
  const contentId = params.id as string

  const { address, isConnected, chainId } = useAccount()
  const { connectors, connect, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const { writeContractAsync } = useWriteContract()
  const { switchChainAsync } = useSwitchChain()

  const [content, setContent] = useState<{title: string, text: string} | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isLocked, setIsLocked] = useState(true)

  // Fetch content on mount
  useEffect(() => {
    setMounted(true)
    if (contentId) {
      fetchContent()
    }
  }, [contentId])

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
      
      if (txHash && paymentReq) {
        const payload = {
          x402Version: 2,
          accepted: paymentReq,
          payload: { transaction: txHash }
        }
        headers['PAYMENT-SIGNATURE'] = btoa(JSON.stringify(payload))
      }
      
      const res = await fetch(`http://localhost:3001/api/content/${contentId}`, { 
        headers,
        mode: 'cors'
      })
      
      if (res.status === 402) {
        setIsLocked(true)
        if (txHash) {
            // we tried to pay but server returned 402 still.
            throw new Error("Payment signature rejected by server.")
        }
        setLoading(false)
        return
      }
      
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.statusText}`)
      }
      
      const data = await res.json()
      setContent(data)
      setIsLocked(false)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    setLoading(true)
    setError(null)

    try {
      if (!isConnected) {
        throw new Error("Please connect your wallet first.")
      }

      // 1. Fetch to get the 402 requirements again dynamically
      const res = await fetch(`http://localhost:3001/api/content/${contentId}`, { mode: 'cors' })
      
      if (res.status !== 402) {
        if (res.ok) {
           const data = await res.json()
           setContent(data)
           setIsLocked(false)
           return
        }
        throw new Error(`Unexpected status: ${res.statusText}`)
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

      // 2. Execute the ERC20 transfer
      const tx = await writeContractAsync({
        address: req.asset, // The USDC token address
        abi: USDC_ABI,
        functionName: 'transfer',
        args: [req.payTo, BigInt(req.amount)],
      })

      // 3. Refetch with Tx Hash to unlock
      await fetchContent(tx, req)

    } catch (err: any) {
      setError(err.message || 'Payment failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-blue-500/30 pb-24">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#050505]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-bold text-xl tracking-tight">Velvet</span>
            <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.8)] group-hover:shadow-[0_0_15px_rgba(37,99,235,1)] transition-shadow" />
          </Link>

          {mounted && (
            <div>
              {!isConnected ? (
                <button
                  onClick={handleConnect}
                  className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white rounded-full border border-white/10 transition-colors text-sm font-medium z-10 relative"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono text-gray-400">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                  <button
                    onClick={() => disconnect()}
                    className="text-sm text-gray-500 hover:text-white transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {connectError && (
        <div className="bg-red-500/10 text-red-400 p-4 border-b border-red-500/20 text-center text-sm font-medium mt-16">
          {connectError.message}
        </div>
      )}

      <main className="flex-1 w-full max-w-3xl mx-auto mt-32 px-6">
        <header className="mb-12 space-y-6">
          <div className="inline-block px-3 py-1 bg-white/[0.03] text-gray-400 border border-white/10 text-xs font-semibold tracking-wide rounded-full mb-2">
            Premium Insight #{contentId?.split('-')[0] || 'Exclusive'}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter leading-tight text-white mb-6">
            {content?.title || "Exclusive Access: The Future of Deep-Tech Monetization"}
          </h1>
          <div className="flex items-center gap-4 text-gray-400 border-y border-white/5 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                CR
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-white text-sm">Creator</span>
                <span className="text-xs text-gray-500">Velvet Network</span>
              </div>
            </div>
            <span className="text-gray-600">•</span>
            <span className="font-mono text-xs tracking-wider">MARCH 2026</span>
          </div>
        </header>

        <article className="prose prose-invert prose-lg max-w-none">
          {/* Always visible preview paragraph */}
          <p className="text-gray-300 leading-relaxed text-lg sm:text-xl mb-8 font-medium">
            The landscape of content monetization is shifting rapidly. As Web3 technologies mature, the friction between
            creators and their audiences is dissolving. We're moving away from walled gardens and subscription fatigue,
            towards a model where high-value insight is priced precisely and unlocked instantly via micro-transactions.
          </p>

          {isLocked ? (
            <div className="relative mt-12 w-full pt-12 pb-32">
              {/* Fake obscured text */}
              <div className="absolute inset-0 select-none pointer-events-none overflow-hidden">
                 <p className="text-gray-600 leading-relaxed blur-[6px] mb-6 opacity-40">
                    This represents the profound shift in the payment paradigm. Unlike legacy systems that require complex 
                    stripe integrations or monthly commitments, the x402 protocol establishes a direct point-to-point 
                    economic channel. Creators maintain absolute sovereignty over their pricing.
                 </p>
                 <p className="text-gray-600 leading-relaxed blur-[8px] mb-6 opacity-30">
                    Consider the mechanics: A user encounters a locked resource. The server intercepts the request and responds not with a hard rejection, but with a 402 HTTP status carrying a cryptographic requirement payload. The client's wallet interprets this payload, seamlessly executing a micro-transaction on a low-fee L2 like Base.
                 </p>
                 <p className="text-gray-600 leading-relaxed blur-[10px] opacity-20">
                    The transaction hash is attached to the subsequent request as a bearer token. The server verifies settlement finality on-chain and delivers the payload. Zero accounts. Zero middle-men. Maximum efficiency.
                 </p>
              </div>

              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/90 to-[#050505] pointer-events-none"></div>

              {/* The Unlock Button */}
              <div className="relative z-10 flex flex-col items-center justify-center pt-24 text-center">
                 <div className="rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-md p-8 sm:p-12 w-full max-w-xl shadow-2xl space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-blue-500/20 transition-colors duration-700" />
                    
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-white/10 relative z-10 group-hover:scale-110 transition-transform duration-500">
                      <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>

                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold tracking-tight mb-2">Unlock the Full Email</h3>
                      <p className="text-gray-400 text-sm">Pay with your Coinbase Smart Wallet to instantly read the rest of this insight.</p>
                    </div>
                    
                    {error && (
                      <div className="bg-red-500/10 text-red-400 p-4 border border-red-500/20 rounded-xl text-sm font-medium mt-4 relative z-10">
                        {error}
                      </div>
                    )}

                    <button
                      onClick={handlePayment}
                      disabled={loading}
                      className="w-full mt-6 group/btn relative inline-flex items-center justify-center gap-2 px-8 py-5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none z-10"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          'Unlock for 1.00 USDC'
                        )}
                      </span>
                    </button>
                    {!isConnected && (
                      <p className="pt-2 text-xs text-gray-500 font-medium tracking-wide relative z-10">
                        You will be prompted to connect your wallet first.
                      </p>
                    )}
                 </div>
              </div>
            </div>
          ) : (
            <div className="mt-12 text-white leading-relaxed text-lg sm:text-xl space-y-8 whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-8 duration-1000">
               {content?.text}
            </div>
          )}
        </article>
      </main>
    </div>
  )
}
