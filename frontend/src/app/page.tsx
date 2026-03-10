'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CreateDashboard() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contentId, setContentId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const API_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/api/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: content,
          price: '1.00'
        })
      })

      if (!res.ok) {
        throw new Error('Failed to generate Velvet link')
      }

      const data = await res.json()
      setContentId(data.contentId)
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating content.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (contentId) {
      navigator.clipboard.writeText(`http://localhost:3000/unlock/${contentId}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#050505]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-bold text-xl tracking-tight">Velvet</span>
            <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.8)] group-hover:shadow-[0_0_15px_rgba(37,99,235,1)] transition-shadow" />
          </Link>
          <div className="text-sm font-medium text-gray-300">Creator Dashboard</div>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-6 max-w-3xl mx-auto">
        <header className="mb-12 text-center flex flex-col items-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter mb-4 leading-tight">
            Draft your premium{" "}
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-transparent bg-clip-text">insight.</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-xl">
            Create gated content. Unlocked instantly with Coinbase Smart Wallets.
          </p>
        </header>

        {!contentId ? (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-700">
            <div className="space-y-2">
              <label htmlFor="content" className="block text-sm font-medium tracking-wide text-gray-400 ml-1">
                Premium Email Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your exclusive alpha here..."
                className="w-full h-80 bg-white/[0.02] text-white border border-white/10 rounded-3xl p-6 text-lg focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.04] transition-colors resize-none placeholder:text-gray-600 backdrop-blur-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="price" className="block text-sm font-medium tracking-wide text-gray-400 ml-1">
                Price (USDC on Base)
              </label>
              <input
                type="text"
                id="price"
                value="1.00 USDC"
                disabled
                className="w-full bg-white/[0.01] text-gray-500 border border-white/5 rounded-2xl p-4 text-center text-lg cursor-not-allowed focus:outline-none"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl border border-red-500/20 text-sm font-medium text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="w-full group relative inline-flex items-center justify-center gap-2 px-8 py-5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
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
                  'Generate Velvet Link'
                )}
              </span>
            </button>
          </form>
        ) : (
          <div className="rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-sm p-8 sm:p-12 text-center space-y-8 animate-in zoom-in-95 duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
            
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="space-y-2 relative z-10">
              <h2 className="text-3xl font-bold tracking-tight">Content Locked & Ready</h2>
              <p className="text-gray-400">Share this link to instantly monetize your insight.</p>
            </div>

            <div className="bg-[#050505] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 relative z-10">
              <div className="w-full text-gray-300 text-sm sm:text-base font-mono truncate px-2 select-all text-left">
                http://localhost:3000/unlock/{contentId}
              </div>
              <button
                onClick={copyToClipboard}
                className="w-full sm:w-auto shrink-0 bg-white text-black hover:bg-gray-200 font-semibold text-sm py-3 px-6 rounded-full transition-colors flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy Link
                  </>
                )}
              </button>
            </div>

            <div className="pt-4 relative z-10">
              <button
                onClick={() => {
                  setContentId(null)
                  setContent('')
                }}
                className="text-sm font-medium text-gray-500 hover:text-white transition-colors"
              >
                Create another link →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
