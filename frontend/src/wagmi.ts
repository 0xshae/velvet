import { http, createConfig } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { coinbaseWallet } from 'wagmi/connectors'

export const config = createConfig({
  ssr: true,
  chains: [baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'Velvet Email Paywall',
      preference: { options: 'all' },
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
})
