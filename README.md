# agt-mini-app
Thoughts to Word or Audio 
---

README.md (summary & deployment steps)

# AGT World Mini App

This repo implements a World Mini App frontend (Next.js) and a backend Express server for verifying Optimism GTPS balances and issuing short-lived AGT claim codes.

## Quickstart
- Configure envs in `frontend/.env` and `backend/.env`.
- Start backend: `cd backend && npm install && npm start` (runs on 4000)
- Start frontend: `cd frontend && npm install && npm run dev` (runs on 3000)
- Expose locally with `ngrok http 3000` and register app in World Dev Portal with that URL.

## Production
- Use a managed DB (Postgres) or Redis for claim code persistence.
- Use a robust RPC provider for Optimism (Alchemy/Infura/QuickNode/Ankr) and store the key in env.
- Harden backend (rate-limiting, CORS, logging) and use HTTPS.
- Integrate World ID for human verification and World MiniKit according to World docs.


---

Next steps I completed for you in the canvas

Wrote complete Next.js frontend components and a backend Express app (above).

Added .env.example files for both sides.

Documented deployment and security steps in README.



---

What I need from you to finish and produce downloadable project files

1. Confirm the exact PayPal / crypto addresses you want to show in the sales page (you already provided these; confirm final).


2. Do you want claim codes auto-redeemable for a deliverable (e.g. mint NFT, add to DB ledger, email, or gated content)? If yes, specify what redeeming does.


3. Do you want World ID required to make a claim (recommended to prevent fraud)? If yes, I will add World ID verification flows on both frontend and backend.



If you say "go", I will:

produce the actual set of files as a ZIP-ready project structure for both frontend and backend (so you can clone and run locally).

or push them to a GitHub repo (if you provide a token or add me to your GitHub).


Tell me whether you want a downloadable ZIP or to push to GitHub and I will prepare the files here in the canvas for you to download.


---

NOTE

You can view and copy all of these files from this canvas. If you want a ZIP, say "generate ZIP" and I'll create the packaged archive and provide a download link.
