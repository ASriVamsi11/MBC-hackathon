# Base Bets - Prediction Market Challenges

A Web3 application for creating conditional escrows on Polymarket prediction markets, built on Base Sepolia with account abstraction for gasless transactions.

**Live Network**: Base Sepolia (84532)
**Smart Contract**: `0xdD41Cab7a9Bf25724253Caf5e7e32497C643BE9d`
**Frontend URL**: http://localhost:3000
**Backend API**: http://localhost:3001

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [System Components](#system-components)
- [Setup Instructions](#setup-instructions)
- [Running Locally](#running-locally)
- [Smart Contract](#smart-contract)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

Conditional Escrow enables two users to place bets on Polymarket outcomes with the following flow:

1. **User A** creates a challenge, specifying:
   - Beneficiary (User B's address)
   - Amount to stake (amountA)
   - Counterparty's required stake (amountB)
   - Polymarket condition ID
   - Expected outcome (Yes/No)

2. **User B** accepts the challenge by:
   - Confirming they accept the terms
   - Depositing their stake (amountB)

3. **Oracle Service** automatically resolves the bet:
   - Polls Polymarket for market outcome
   - Calls smart contract to distribute USDC to winner
   - Winner receives total stake (amountA + amountB)

### Why Symmetric Escrow?

The contract uses a **symmetric escrow pattern** where both parties lock equal-weighted stakes. This prevents User A from changing their stake amount after User B accepts, ensuring fair terms for both parties.

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Port 3000)                     │
│                    Next.js + React + Wagmi                      │
│  - Create challenges                                            │
│  - View my challenges                                           │
│  - Accept/decline challenges                                    │
│  - View leaderboard & stats                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    Web3 Provider
              (Coinbase Wallet + OnchainKit)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Smart Contracts (Base Sepolia)                     │
│              ConditionalEscrow.sol + USDC                       │
│  - createEscrow() - Lock User A's stake                         │
│  - acceptEscrow() - Lock User B's stake                         │
│  - resolveEscrow() - Distribute to winner                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    ┌───────┐      ┌──────────┐     ┌──────────┐
    │Oracle │      │  Event   │     │Polymarket│
    │Service│      │ Indexer  │     │   API    │
    └───────┘      └──────────┘     └──────────┘
        │                │
        └────────────────┼────────────────┐
                         ▼
          ┌─────────────────────────────┐
          │  Backend API (Port 3001)    │
          │  Express.js + Node.js       │
          │  - /api/leaderboard         │
          │  - /api/profile/:address    │
          │  - /api/stats               │
          │  - /api/activity            │
          └─────────────────────────────┘
                         │
                         ▼
                    Frontend
               (Leaderboard, Stats, Profiles)
```

### Data Flow

1. **Create Challenge**:
   - User A connects wallet (Coinbase Smart Wallet)
   - Frontend calls `createEscrow()` on smart contract
   - Paymaster sponsors gas fees (ERC-4337)
   - Escrow is created, User A's stake transferred
   - Frontend polls contract to get escrow ID
   - Event emitted: `EscrowCreated`

2. **Accept Challenge**:
   - User B sees notification of pending challenge
   - Frontend calls `acceptEscrow()` with escrow ID
   - User B's stake transferred to contract
   - Event emitted: `BeneficiaryAccepted`

3. **Resolution**:
   - Oracle service polls Polymarket every 60 seconds
   - When market resolves, oracle calls `resolveEscrow()`
   - Winner's address determined based on market outcome
   - USDC transferred to winner (amountA + amountB)
   - Event emitted: `EscrowResolved`

---

## System Components

### 1. Frontend (escrow-app)

**Technology**: Next.js 16, React 19, TypeScript, Tailwind CSS, Wagmi
**Port**: 3000
**Blockchain Integration**: Coinbase Wallet + OnchainKit + Viem

**Key Directories**:
```
escrow-app/src/
├── app/                   # Next.js pages
│   ├── create/           # Create challenge form
│   ├── my-escrows/       # User's challenges
│   ├── challenge/[id]/   # Challenge details
│   ├── leaderboard/      # Global rankings
│   ├── profile/          # User profile
│   └── api/              # Backend API proxy
├── hooks/                # Custom React hooks
│   ├── useContract()     # Interact with escrow contract
│   └── useFetchEscrows() # Fetch user's escrows with polling
├── components/           # Reusable UI components
│   ├── ChallengeCard.tsx
│   ├── Header.tsx
│   └── ...
└── lib/                  # Utilities
    ├── contracts.ts      # ABI & contract addresses
    └── utils.ts          # Helper functions
```

**Real-Time Updates**:
- `useFetchEscrows` hook polls contract every 10 seconds
- Automatically detects new challenges without page refresh
- Filters escrows relevant to current user

**ERC-4337 Integration**:
- Uses Coinbase Paymaster for gasless transactions
- OnchainKit handles account abstraction
- Users see "sponsored gas" transactions in wallet

### 2. Backend (Oracle Service)

**Technology**: Express.js, Node.js, TypeScript, Viem
**Port**: 3001
**Services**: REST API, Event Indexer, Oracle Loop

**Key Services**:

```
src/
├── index.ts              # Main entry point
├── services/
│   ├── oracle.ts        # Market resolution logic
│   ├── polymarket.ts    # Polymarket API integration
│   ├── escrow.ts        # Contract interactions
│   └── leaderboard.ts   # Ranking calculations
├── api/                 # Express routes
│   ├── routes/          # REST endpoints
│   └── middleware/      # CORS, error handling
└── workers/
    └── event-indexer.ts # Listens to contract events
```

**REST API Endpoints**:
- `GET /health` - Service health check
- `GET /api/leaderboard` - Global rankings
- `GET /api/activity` - Recent activities
- `GET /api/profile/:address` - User stats
- `GET /api/stats` - Global statistics

**Oracle Loop**:
- Runs every 60 seconds
- Checks Polymarket for resolved markets
- Calls `resolveEscrow()` on matching escrows
- Logs resolution results

**Event Indexer**:
- Listens to `EscrowCreated`, `EscrowResolved`, `BeneficiaryAccepted` events
- Stores event data for leaderboard/activity feed
- Calculates user statistics (total won, total lost, win rate)

### 3. Smart Contracts

**Technology**: Solidity 0.8.20, Hardhat, Base Sepolia
**Main Contract**: ConditionalEscrow.sol

**Key Data Structures**:

```solidity
struct Escrow {
    address depositor;           // User A (creates challenge)
    address beneficiary;         // User B (accepts challenge)
    uint256 amountA;             // User A's stake
    uint256 amountB;             // User B's required stake
    string marketId;             // Polymarket condition ID
    bool expectedOutcomeYes;     // Expected market outcome
    Status status;               // Active=0, Resolved=1, Refunded=2
    uint256 createdAt;           // Timestamp
    bool beneficiaryAccepted;    // Acceptance flag
}
```

**Key Functions**:

```solidity
// User A creates challenge
createEscrow(
    address beneficiary,
    uint256 amountA,
    uint256 amountB,
    string marketId,
    bool expectedOutcomeYes
) -> uint256 escrowId

// User B accepts challenge
acceptEscrow(uint256 escrowId)

// Oracle resolves based on market outcome
resolveEscrow(
    uint256 escrowId,
    bool marketResolvedYes,
    address resolver
)

// Emergency refund if timeout reached
emergencyRefund(uint256 escrowId)
```

**Events**:
```solidity
EscrowCreated(uint256 indexed escrowId, address indexed depositor, address indexed beneficiary, ...)
BeneficiaryAccepted(uint256 indexed escrowId, address indexed beneficiary)
EscrowResolved(uint256 indexed escrowId, address indexed recipient, uint256 amount, bool marketResolvedYes)
```

---

## Setup Instructions

### Prerequisites

- **Node.js**: v18+ (check with `node --version`)
- **Git**: Latest version
- **Wallet**: Coinbase Wallet or MetaMask with Base Sepolia added
- **USDC on Base Sepolia**: Get from faucet for testing

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/MBC-hackathon.git
cd MBC-hackathon
```

### Step 2: Install Dependencies

#### Frontend
```bash
cd escrow-app
npm install
```

#### Backend
```bash
cd ../backend
npm install
```

#### Contracts
```bash
cd ../contracts
npm install
```

### Step 3: Configure Environment Variables

#### Frontend (`escrow-app/.env.local`)

```env
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_CONTRACT_ADDRESS=0xdD41Cab7a9Bf25724253Caf5e7e32497C643BE9d
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_coinbase_api_key
NEXT_PUBLIC_PAYMASTER_URL=https://api.developer.coinbase.com/rpc/v1/base-sepolia/your_paymaster_url
```

#### Backend (`backend/.env`)

```env
ESCROW_ADDRESS=0xdD41Cab7a9Bf25724253Caf5e7e32497C643BE9d
BASE_SEPOLIA_RPC=https://sepolia.base.org
ORACLE_PRIVATE_KEY=your_oracle_private_key
POLYMARKET_API_URL=https://gamma-api.polymarket.com
CHECK_INTERVAL=60000
LOG_LEVEL=info
PORT=3001
```

#### Contracts (`contracts/.env`)

```env
PRIVATE_KEY=your_deployment_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
RESOLVER_ADDRESS=0x0929e5ce0006c1f3f4071639cc09ec2243c608e4
```

### Step 4: Get Test USDC

1. Visit [Base Sepolia Faucet](https://www.coinbase.com/faucet)
2. Connect wallet and claim testnet tokens
3. Get USDC from the token faucet

### Step 5: Add Base Sepolia to Wallet

**Chain ID**: 84532
**RPC URL**: https://sepolia.base.org
**Currency**: ETH
**Block Explorer**: https://sepolia.basescan.org

---

## Running Locally

### Start All Services (Recommended)

Open 3 terminal windows and run these commands from the project root:

**Terminal 1 - Frontend**:
```bash
cd escrow-app
npm run dev
# Frontend running at http://localhost:3000
```

**Terminal 2 - Backend**:
```bash
cd backend
npm run dev
# Backend API running at http://localhost:3001
```

**Terminal 3 - Contract Development** (optional):
```bash
cd contracts
npm run compile
npm run deploy:base-sepolia
```

### Verify Services are Running

```bash
# Frontend
curl http://localhost:3000

# Backend
curl http://localhost:3001/health

# Check contract on Base Sepolia
curl https://sepolia.base.org -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["0xdD41Cab7a9Bf25724253Caf5e7e32497C643BE9d"]}'
```

### Test the Flow

1. **Open Frontend**: http://localhost:3000
2. **Connect Wallet**: Click "Connect" → Choose Coinbase/MetaMask → Approve
3. **Create Challenge**:
   - Go to `/create`
   - Select a Polymarket outcome
   - Enter beneficiary address (use another account for testing)
   - Set stakes (e.g., 10 USDC each)
   - Click "Create Challenge"
   - Approve USDC spending (no gas fee with paymaster)
   - See transaction confirm on-chain
4. **Accept Challenge** (from second account):
   - Go to `/my-escrows`
   - See pending challenge from User A
   - Click "Accept"
   - Approve USDC spending
   - Confirm transaction
5. **Monitor Resolution**:
   - Go to `/my-escrows` → "Active"
   - Wait for market to resolve
   - Oracle service resolves within 60 seconds
   - Winner receives payout

---

## Smart Contract

### Deployment

#### Deploy to Base Sepolia

```bash
cd contracts
npm run deploy:base-sepolia
```

This will:
1. Compile contracts
2. Deploy ConditionalEscrow and MockUSDC
3. Output contract addresses
4. Verify on Etherscan

#### Deploy to Local Network

```bash
# Terminal 1: Start Hardhat node
npx hardhat node

# Terminal 2: Deploy locally
npm run deploy:localhost
```

### Compile & Test

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Check contract size
npm run size
```

### Contract Interactions

#### Using Hardhat Console

```bash
npx hardhat console --network baseSepolia

// Get contract instance
const escrow = await ethers.getContractAt("ConditionalEscrow", "0xdD41Cab7a9Bf25724253Caf5e7e32497C643BE9d");

// Read escrow count
const count = await escrow.escrowCount();
console.log("Total escrows:", count);

// Get specific escrow
const escrowData = await escrow.getEscrow(0);
console.log("Escrow 0:", escrowData);

// Get user stats
const stats = await escrow.getUserStats("0xYourAddress");
console.log("Stats:", stats);
```

---

## Key Features

### 1. Symmetric Escrow Pattern

Both parties lock equal-weighted stakes:
- User A locks `amountA` when creating challenge
- User B locks `amountB` when accepting
- Winner receives both amounts
- Prevents amount manipulation after acceptance

### 2. Two-Step Acceptance Flow

1. User A creates challenge and stakes `amountA`
2. Notification sent to User B
3. User B reviews and accepts, staking `amountB`
4. Both amounts now locked until market resolves

### 3. Automated Oracle Resolution

- Oracle service monitors Polymarket 24/7
- Automatically detects market resolutions
- Calls smart contract to distribute funds
- No manual intervention needed

### 4. ERC-4337 Gasless Transactions

- Coinbase Paymaster sponsors all gas fees
- Users see "sponsored" transactions in wallet
- Reduces friction for non-technical users
- Account abstraction enables seamless UX

### 5. Real-Time Notifications

- Frontend polls contract every 10 seconds
- New challenges appear instantly for beneficiary
- Status updates reflect on-chain state
- No page refresh needed

### 6. Social Features

- User leaderboard (wins, total winnings)
- Activity feed (recent challenges, resolutions)
- User profiles (stats, history)
- Search users

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | Next.js | 16.0.6 | Framework |
| Frontend | React | 19 | UI Library |
| Frontend | TypeScript | 5.5 | Type Safety |
| Frontend | Wagmi | 2.19.5 | Web3 Hooks |
| Frontend | Viem | 2.40.4 | Web3 Client |
| Frontend | OnchainKit | 1.1.2 | Account Abstraction |
| Frontend | Tailwind CSS | 4.1.17 | Styling |
| Backend | Express.js | 4.22.1 | REST API |
| Backend | Node.js | 18+ | Runtime |
| Backend | TypeScript | 5.x | Type Safety |
| Backend | Viem | 2.41.2 | Web3 Client |
| Blockchain | Solidity | 0.8.20 | Smart Contracts |
| Blockchain | Hardhat | 2.27.1 | Development |
| Blockchain | Base Sepolia | - | Test Network |
| External | Polymarket API | - | Market Data |

---

## Deployment

### Frontend Deployment (Vercel)

```bash
cd escrow-app

# Build for production
npm run build

# Test production build locally
npm run start

# Deploy to Vercel
# Option 1: Connect GitHub repo to Vercel
# Option 2: Use Vercel CLI
npx vercel
```

### Backend Deployment (Railway/Heroku)

```bash
cd backend

# Build
npm run build

# Create Procfile (for Heroku)
echo "web: npm run start" > Procfile

# Deploy to Railway
railway link
railway deploy

# Or deploy to Heroku
heroku create your-app-name
heroku config:set ESCROW_ADDRESS=0xdD41...
git push heroku main
```

### Contract Deployment (Already on Base Sepolia)

Current deployment: `0xdD41Cab7a9Bf25724253Caf5e7e32497C643BE9d`

To deploy to new network:
```bash
cd contracts
npm run deploy:baseSepolia  # For Base Sepolia
npm run deploy:baseMainnet # For Base Mainnet (production)
```

---

## Troubleshooting

### Frontend Issues

**"Transaction preview unavailable. Unable to estimate asset changes"**
- Cause: ABI mismatch with contract
- Solution: Verify contract address and ABI in `escrow-app/src/lib/contracts.ts`

**"Wallet not connecting"**
- Ensure Base Sepolia is added to wallet
- Check `NEXT_PUBLIC_CHAIN_ID=84532`
- Verify Coinbase Wallet or MetaMask is installed

**"Challenges not appearing on other account"**
- Check backend is running (`npm run dev` in backend/)
- Verify `useFetchEscrows` polling is active (check browser console)
- Ensure both accounts on same network (Base Sepolia)

**"Transaction shows 'pending' forever"**
- Check Base Sepolia RPC is responsive: https://sepolia.base.org
- Verify transaction on [Base Sepolia Explorer](https://sepolia.basescan.org)
- Check wallet for error messages

### Backend Issues

**"Oracle service not resolving markets"**
- Check backend is running on port 3001
- Verify `ORACLE_PRIVATE_KEY` is valid and funded
- Check Polymarket API connectivity: `curl https://gamma-api.polymarket.com/health`
- Check contract `resolveEscrow()` transaction on Etherscan

**"Event indexer not working"**
- Verify contract address in `.env`
- Check contract has events to index
- Review backend logs for errors

**"CORS errors from frontend"**
- Ensure backend `.env` has `CORS_ORIGIN=http://localhost:3000`
- Check backend is running and accessible

### Contract Issues

**"Contract deployment fails"**
- Verify private key is funded with ETH on Base Sepolia
- Check `ETHERSCAN_API_KEY` is correct for verification
- Ensure Solidity version matches (0.8.20)

**"resolveEscrow() fails"**
- Ensure escrow status is still "Active"
- Verify market exists on Polymarket
- Check resolver address is set correctly

**"Insufficient balance for gas**
- Fund account with ETH from Base Sepolia faucet
- Note: With paymaster, users don't pay gas on frontend
- Backend oracle account needs ETH for resolver calls

---

## Development Workflow

### Adding a New Feature

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes across frontend/backend/contracts as needed
3. Test locally with all 3 services running
4. Commit with clear message: `git commit -m "Add feature X"`
5. Push branch: `git push origin feature/my-feature`
6. Open pull request for review

### Making Contract Changes

1. Edit `contracts/contracts/ConditionalEscrow.sol`
2. Update ABI in `escrow-app/src/lib/contracts.ts`
3. Recompile: `cd contracts && npm run compile`
4. Deploy: `npm run deploy:baseSepolia`
5. Update `CONTRACT_ADDRESS` in environment variables
6. Test with frontend

### Debugging

**Frontend**:
```bash
# Check browser console (F12)
# Check network requests (Network tab)
# Check wallet transactions in explorer
```

**Backend**:
```bash
# Check logs for errors
tail -f backend/logs/*.log
# Set LOG_LEVEL=debug in .env for verbose output
```

**Contract**:
```bash
# View events on Etherscan
# Verify contract on Etherscan: https://sepolia.basescan.org/address/0xdD41...
# Check gas usage and transaction details
```

---

## Support & Resources

- **Base Docs**: https://docs.base.org
- **Polymarket API**: https://polymarket.com/api
- **Coinbase Smart Wallet**: https://www.coinbase.com/smart-wallet
- **Hardhat Docs**: https://hardhat.org/hardhat-runner/docs/getting-started
- **Next.js Docs**: https://nextjs.org/docs
- **Wagmi Docs**: https://wagmi.sh

---

## License

This project is built during the MBC Hackathon.

---

## Project Structure Summary

```
MBC-hackathon/
├── escrow-app/              # Next.js Frontend
│   ├── src/
│   │   ├── app/            # Pages and routes
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks (useContract, useFetchEscrows)
│   │   └── lib/            # Utilities and contract ABI
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.js
│   └── .env.local
├── backend/                 # Express Oracle Service
│   ├── src/
│   │   ├── index.ts        # Entry point
│   │   ├── services/       # Business logic
│   │   ├── api/            # REST routes
│   │   └── workers/        # Event indexer
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── contracts/              # Hardhat Smart Contracts
│   ├── contracts/          # Solidity source
│   │   ├── ConditionalEscrow.sol
│   │   └── MockUSDC.sol
│   ├── scripts/            # Deployment scripts
│   ├── hardhat.config.ts
│   ├── package.json
│   └── .env
└── README.md               # This file
```

---

**Version**: 1.0.0
**Last Updated**: December 2024
**Network**: Base Sepolia (84532)
