# Velvet: Email Paywall App

Velvet is a premium, minimalist email paywall application built with the **Coinbase x402 Protocol**. It allows creators to lock text content behind a crypto paywall and allows users to instantly unlock that content using a Coinbase Smart Wallet.

## Prerequisites
- Node.js (v18+ recommended)
- A Coinbase Smart Wallet (or browser wallet) funded with **Base Sepolia Testnet ETH** (for gas) and **Base Sepolia Testnet USDC** (for the 1.00 USDC payment).

## Project Structure
The repository is split into two primary folders:
1. `backend/`: An Express.js server that uses `@x402/express` to intercept requests, store content, and validate Coinbase Smart Wallet payments.
2. `frontend/`: A Next.js 15 (App Router) React application styled with brutally clean TailwindCSS and wired to Wagmi + Viem.

---

## How to Run the App

### 1. Start the Backend
The backend runs an Express API on port `3001`. It holds the `contentVault` and enforces the 402 payment requirements.

```bash
cd backend
npm install
node server.js
```
*You should see `Velvet Express Backend listening on port 3001`.*

### 2. Start the Frontend
The frontend runs the Next.js React application on port `3000`.

Open a **new terminal tab**:
```bash
cd frontend
npm install
npm run dev
```
*Wait for it to compile, then open `http://localhost:3000` in your browser.*

---

## How to Use the App

### Step 1: Create Content
1. Navigate to the Creator Dashboard at [http://localhost:3000/create](http://localhost:3000/create).
2. Type your secret premium email content into the large text area.
3. Click **Generate Velvet Link**.
4. The app will securely POST your content to the backend and return a shiny new URL. Click **Copy to Clipboard**.

### Step 2: Buy / Unlock Content
1. Open a new incognito window (or use your current browser) and navigate to the copied URL (e.g., `http://localhost:3000/unlock/[your-id]`).
2. You will see the Buyer Storefront with a heavily blurred, locked paragraph.
3. Click **Connect Wallet** in the top right and connect your Coinbase Smart Wallet.
4. Click the massive blue **Unlock for 1.00 USDC** button floating over the text.
5. Approve the 1.00 USDC transfer on Base Sepolia in your wallet popup.
6. Once the transaction processes, the Next.js app sends the signature hash back to the server, receives the 200 OK, and instantly removes the blur to reveal the full content!
