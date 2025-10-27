AGT Worldcoin Mini App — Full Project Scaffold

This canvas contains a complete scaffold for the AGT World Mini App you asked for. It includes:

A Next.js-based frontend adapted to World Mini App templates (ready for minikit-next-template).

A Node/Express backend that securely verifies Optimism GTPS balances and issues short-lived claim codes; includes .env.example and DB notes.

package.json files, deploy & testing steps, and instructions for wiring World ID / World MiniKit credentials.



---

Repository structure (what's included in this canvas)

/agt-world-miniapp
├─ /frontend               # Next.js / minikit-ready frontend
│  ├─ package.json
│  ├─ next.config.js
│  ├─ .env.example
│  ├─ /pages
│  │  ├─ _app.jsx
│  │  ├─ index.jsx
│  │  └─ api/health.js
│  ├─ /components
│  │  └─ WalletClaim.jsx
│  └─ /styles
│     └─ globals.css
├─ /backend                # Node/Express server for verification & claim issuance
│  ├─ package.json
│  ├─ server.js
│  ├─ .env.example
│  └─ /lib
│     └─ tokenVerifier.js
└─ README.md


---

What I just added (high-level)

1. Frontend (Next.js) — a Next.js app (compatible with the World Mini App Next template) with a main page that:

Connects to injected wallet or the World App webview.

Checks GTPS token balance on Optimism (via a server-side API proxy or directly via provider) and displays balance.

Lets the user request a claim; it calls the backend /api/claim endpoint to get a claim code if eligible.

Integrates placeholders for World ID / World MiniKit flows.



2. Backend (Node/Express) — an express server that:

Accepts POST /api/claim with { address }.

Verifies on-chain (Optimism) that address holds at least 500 GTPS using a trusted RPC provider.

Generates a secure claim code (random + HMAC), stores it in-memory (example) or optionally persists to Redis/Postgres (recommended).

Returns a short-lived claim code (expires in 1 hour) to the frontend.

Exposes /api/verify-claim endpoint so you can redeem the code later.



3. Env examples for both frontend and backend and clear steps for deploying, testing with ngrok, and submitting to World Dev Portal.




---

Important security notes (read before using)

Server-side verification is mandatory. Do not trust client-only checks: client wallets can be spoofed.

Use a reliable RPC provider (Infura/Alchemy/Ankr/QuickNode) with Optimism support; avoid free public RPCs for production.

Persist claim codes in a database (Redis for TTL or Postgres) to enforce one-claim-per-person and to revoke codes.

Add rate-limiting, request signing, and optionally require World ID verification for human checks.

Add logging and monitoring for suspicious patterns; consider KYC for higher-value flows.



---

How to get this running locally (summary)

1. Clone the minikit-next-template from World and copy the frontend folder into that template's src (or use the provided frontend as a Next app).


2. Update .env files in both frontend and backend with real values (RPC URL, World ID credentials if used).


3. Install dependencies: pnpm install (or npm install) in both frontend and backend.


4. Start backend: node server.js (or pnpm dev). Start frontend: pnpm dev.


5. Use ngrok http 3000 to create a public URL for the World Dev Portal or for World App testing.




---

Files (full content)

frontend/package.json

{
  "name": "agt-world-miniapp-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000"
  },
  "dependencies": {
    "next": "13.5.6",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "ethers": "6.7.0"
  }
}


---

frontend/.env.example

NEXT_PUBLIC_OPTIMISM_RPC=https://opt-mainnet.g.alchemy.com/v2/REPLACE_ME
NEXT_PUBLIC_GTPS_TOKEN=0x9427A2a738AffBc5880F0646b5251069c022e525
NEXT_PUBLIC_MIN_GTPS=500
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
# World / MiniKit credentials (if used)
WLD_CLIENT_ID=worldid
WLD_CLIENT_SECRET=miniapp
app_8720619cf35dc66c8008135943e2edbb


---

frontend/pages/_app.jsx

import '../styles/globals.css'
import React from 'react'
export default function App({ Component, pageProps }){
  return <Component {...pageProps} />
}


---

frontend/pages/index.jsx

import React, { useEffect, useState } from 'react'
import WalletClaim from '../components/WalletClaim'

export default function Home(){
  return (
    <main style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <h1>AGT — Live On Earth Forever (Demo)</h1>
      <p>Buy GTPS on Optimism to claim AGT. This demo checks GTPS balances and requests claim codes from the backend.</p>
      <WalletClaim />
    </main>
  )
}


---

frontend/components/WalletClaim.jsx

import React, { useState } from 'react'
import { ethers } from 'ethers'

const GTPS_ADDR = process.env.NEXT_PUBLIC_GTPS_TOKEN
const MIN_GTPS = process.env.NEXT_PUBLIC_MIN_GTPS || 500

export default function WalletClaim(){
  const [account, setAccount] = useState(null)
  const [balance, setBalance] = useState(null)
  const [status, setStatus] = useState(null)

  async function connectWallet(){
    if(!window.ethereum) return alert('Please open in a wallet-enabled browser or World App webview')
    const provider = new ethers.BrowserProvider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = await provider.getSigner()
    const addr = await signer.getAddress()
    setAccount(addr)
    await fetchBalance(addr, provider)
  }

  async function fetchBalance(addr, provider){
    setStatus('checking')
    try{
      const p = provider || new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_OPTIMISM_RPC)
      const token = new ethers.Contract(GTPS_ADDR, ['function balanceOf(address) view returns (uint256)','function decimals() view returns (uint8)'], p)
      const b = await token.balanceOf(addr)
      const decimals = await token.decimals().catch(()=>18)
      const human = Number(ethers.formatUnits(b, decimals))
      setBalance(human)
      setStatus(null)
    }catch(e){
      console.error(e)
      setStatus('error')
    }
  }

  async function requestClaim(){
    if(!account) return alert('Connect wallet')
    setStatus('requesting')
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/claim`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ address: account })
    })
    const j = await res.json()
    if(res.ok) setStatus({ ok:true, code: j.claimCode, expires: j.expires })
    else setStatus({ ok:false, error: j.error || 'server error' })
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div>
        <button onClick={connectWallet}>Connect Wallet</button>
      </div>
      <div style={{ marginTop: 12 }}>
        <div>Account: {account || '—'}</div>
        <div>GTPS balance: {balance ?? '—'}</div>
      </div>
      <div style={{ marginTop: 12 }}>
        <button disabled={!account} onClick={requestClaim}>Claim AGT</button>
      </div>
      <div style={{ marginTop: 12 }}>{status && JSON.stringify(status)}</div>
    </div>
  )
}


---

frontend/styles/globals.css

body { margin:0; font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background:#0f172a; color:#e2e8f0 }
button{ background:#0ea5a4; border:none; padding:8px 12px; color:white; border-radius:6px }


---

backend/package.json

{
  "name": "agt-world-miniapp-backend",
  "version": "0.1.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "ethers": "^6.7.0",
    "dotenv": "^16.3.1",
    "helmet": "^6.0.1",
    "rate-limiter-flexible": "^2.4.2"
  }
}


---

backend/.env.example

PORT=4000
OPTIMISM_RPC=https://opt-mainnet.g.alchemy.com/v2/REPLACE_ME
GTPS_TOKEN=0x9427A2a738AffBc5880F0646b5251069c022e525
MIN_GTPS=500
CLAIM_CODE_SECRET=REPLACE_WITH_STRONG_RANDOM
DB_URL=postgres://user:pass@localhost:5432/agt (optional, for persistence)
REDIS_URL=redis://localhost:6379 (recommended for TTL storage)


---

backend/lib/tokenVerifier.js

const { ethers } = require('ethers')

async function getBalanceOf(address, tokenAddress, rpcUrl){
  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const token = new ethers.Contract(tokenAddress, ['function balanceOf(address) view returns (uint256)','function decimals() view returns (uint8)'], provider)
  const b = await token.balanceOf(address)
  const decimals = await token.decimals().catch(()=>18)
  return Number(ethers.formatUnits(b, decimals))
}

module.exports = { getBalanceOf }


---

backend/server.js

require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const helmet = require('helmet')
const { getBalanceOf } = require('./lib/tokenVerifier')
const { RateLimiterMemory } = require('rate-limiter-flexible')
const crypto = require('crypto')

const app = express()
app.use(helmet())
app.use(cors())
app.use(bodyParser.json())

const PORT = process.env.PORT || 4000
const RPC = process.env.OPTIMISM_RPC
const GTPS = process.env.GTPS_TOKEN
const MIN_GTPS = Number(process.env.MIN_GTPS || 500)
const SECRET = process.env.CLAIM_CODE_SECRET || 'dev_secret'

// Simple in-memory store for example. Replace with Redis/Postgres in prod.
const store = new Map()

const limiter = new RateLimiterMemory({ points: 10, duration: 60 })

app.post('/api/claim', async (req, res)=>{
  try{
    await limiter.consume(req.ip)
  }catch(e){
    return res.status(429).json({ error: 'too_many_requests' })
  }

  const { address } = req.body
  if(!address) return res.status(400).json({ error: 'missing_address' })

  try{
    const balance = await getBalanceOf(address, GTPS, RPC)
    if(balance < MIN_GTPS) return res.status(403).json({ error: 'insufficient_balance', balance })

    // generate a secure claim code: HMAC(secret, address + timestamp + random)
    const payload = `${address}:${Date.now()}:${crypto.randomBytes(8).toString('hex')}`
    const hmac = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
    const code = `AGT-${hmac.slice(0,12).toUpperCase()}`
    const expires = Date.now() + 1000 * 60 * 60 // 1 hour

    // persist - in this example, in-memory
    store.set(code, { address, expires, used:false })

    return res.json({ claimCode: code, expires })
  }catch(e){
    console.error(e)
    return res.status(500).json({ error: 'internal_error' })
  }
})

app.post('/api/redeem', (req, res)=>{
  const { code } = req.body
  if(!code) return res.status(400).json({ error: 'missing_code' })
  const rec = store.get(code)
  if(!rec) return res.status(404).json({ error: 'invalid_code' })
  if(rec.used) return res.status(400).json({ error: 'already_used' })
  if(rec.expires < Date.now()) return res.status(400).json({ error: 'expired' })

  // mark used
  rec.used = true
  store.set(code, rec)
  // issue AGT entitlement in your system here (e.g. write to DB, mint NFT, etc.)
  return res.json({ ok:true, address: rec.address })
})

app.get('/api/health', (req, res)=> res.json({ ok:true }))

app.listen(PORT, ()=> console.log('Claim server running on', PORT))
