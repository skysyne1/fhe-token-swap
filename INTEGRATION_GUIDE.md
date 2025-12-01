# FHE Token Swap dApp – Complete Integration Guide

🔄 **Privacy-Preserving Token Swap dApp with Fully Homomorphic Encryption (FHE)**

This document is designed for developers who want to understand the architecture, end-to-end data flow, deployment procedures, and testing of the FHE Token Swap system.

**🔗 Live Demo**: [https://fhe-token-swap.vercel.app](https://fhe-token-swap.vercel.app)  
**📂 Repository**: [https://github.com/skysyne1/fhe-token-swap](https://github.com/skysyne1/fhe-token-swap)  
**🔍 Contract on Sepolia**: [0xe3De829908d1afA66bC6b116C77bC832a351Cb88](https://sepolia.etherscan.io/address/0xe3De829908d1afA66bC6b116C77bC832a351Cb88)

---

## 📋 System Overview

The system consists of:

- **Smart Contract**: `FHETokenSwap.sol` (Solidity + FHEVM)
- **Backend Tasks**: Hardhat tasks for contract interaction (mint, swap, balance...)
- **Frontend**: Next.js + RainbowKit + Wagmi + FHEVM SDK
- **End-to-End Tests**: Automated scripts running the full flow (contracts + frontend)

---

## 🏗 End-to-End Architecture (TEP → TEP)

The architecture is divided into multiple tiers (Tier Entry Point – TEP) from UI to blockchain:

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                           USER / CLIENT TIER                               │
│  - Browser + Next.js UI (GameInterface, TokenSwap, TransferTokens, Docs)   │
│  - RainbowKit modal + MetaMask (signing, network switch Sepolia/Hardhat)   │
│  - React hooks (useEncryptedDiceGame) managing state, history, refresh     │
└──────────────▲─────────────────────────────────────────────────────────────┘
               │
               │ 1. User input (Recipient, Amount, Swap)
               │ 2. Wagmi/RainbowKit prepares tx, opens MetaMask
┌──────────────┴─────────────────────────────────────────────────────────────┐
│                     FRONTEND SERVICE / SDK TIER                            │
│  - FHEVM SDK (initializeFheInstance, useEncrypt)                           │
│  - Encryption/decryption pipeline (client‑side)                            │
│  - Transfer/Swap history loader (getLogs via viem publicClient)            │
│  - DecryptedBalance context (cache handles, refresh logic)                 │
└──────────────▲─────────────────────────────────────────────────────────────┘
               │
               │ 3. Encrypt payload (ROLL amount) + proofs
               │ 4. Submit via wagmi writeContractAsync → RPC
┌──────────────┴─────────────────────────────────────────────────────────────┐
│                   ZAMA FHE INFRA / RELAYER TIER                            │
│  - Coprocessor + Relayer (testnet services)                                │
│  - Processes encryption proofs, relays decrypt requests when needed        │
│  - Downtime can be simulated with local FHEVM mock (Hardhat)              │
└──────────────▲─────────────────────────────────────────────────────────────┘
               │
               │ 5. Tx tới blockchain RPC (Sepolia / Hardhat node)
┌──────────────┴─────────────────────────────────────────────────────────────┐
│                        BLOCKCHAIN / CONTRACT TIER                          │
│  - FHETokenSwap.sol (swap, transfer, mint, treasury, events)              │
│  - State: playerBalance (encrypted euint32), treasury ETH, events          │
│  - Emits: TokensSwapped, TokensTransferred (for history)                   │
│  - Hardhat deployments + addresses autogen (generateTsAbis.ts)            │
└──────────────▲─────────────────────────────────────────────────────────────┘
               │
               │ 6. Events stored on‑chain
               │ 7. Frontend calls publicClient.getLogs → render histories
┌──────────────┴─────────────────────────────────────────────────────────────┐
│                         DEVOPS / TOOLING TIER                              │
│  - dice-contracts (Hardhat): compile, tests, deploy tasks                  │
│  - Test suites separated by domain (TransferE2E, Balance, Treasury, etc.)  │
│  - Scripts: generateTsAbis.ts (ABI + addresses), test-e2e.(sh/ps1)         │
│  - Frontend build (Next.js `npm run build`) + SDK build (`pnpm sdk:build`) │
└────────────────────────────────────────────────────────────────────────────┘
```

**Reading "TEP to TEP"**: each tier receives input from the tier above, processes it, then passes it down; steps **1 → 7** describe an end-to-end transaction from UI to blockchain and back (events → UI).

---

## 🔄 Main Flow (Transfer / Swap TEP)

**User Action**  
User enters recipient address + amount → clicks **Transfer** or **Swap** in UI.

**Wallet Prep**  
Wagmi opens RainbowKit/MetaMask, user signs once per transaction (on-chain tx).

**Encryption**  
Hook `useEncrypt` (FHEVM SDK) encrypts amount, creates proof for FHE functions (`swapROLLForETH`, `transferROLL`, ...).

**Tx Submit**  
Wagmi `writeContractAsync` sends `transferROLL` / `swapROLLForETH` / `swapETHForROLL` with encrypted payload to RPC (Hardhat or Sepolia).

**Contract Logic (FHETokenSwap)**

- Validates input (amount > 0, sufficient treasury ETH, etc.)
- Uses FHE operations (`FHE.add`, `FHE.sub`, `FHE.fromExternal`) to update `playerBalance` (encrypted)
- Emits `TokensSwapped` or `TokensTransferred`

**Post-Tx Sync (Frontend)**  
Hook `useEncryptedDiceGame` waits for receipt → performs refresh:

- `refetchBalance()` → gets new encrypted handle (for decrypt)
- `loadSwapHistory()` & `loadTransferHistory()` → read logs using `publicClient.getLogs` + block timestamp

**UI Update**

- Tab `GameHistory` displays **Swap/Transfer** history, statistics over time
- `GameInterface` / `TokenSwap` / `TransferTokens` update balance, tx status (pending/success/error)

---

## 🧱 Smart Contracts – FHETokenSwap

Main contract: `FHETokenSwap` (inherits `ZamaEthereumConfig`).

### State & Constants

- `ROLL_TOKEN_RATE = 1000` → 1 ETH = 1000 ROLL
- `MAX_MINT` limits the amount of test ROLL that can be minted
- `mapping(address => euint32) public playerBalance` stores ROLL balance encrypted
- Treasury ETH = balance of the contract itself (received from ETH→ROLL swaps and `addTreasuryETH`)

### Main Functions

- `mintTokens(uint256 amount)`  
  Mint ROLL for testing, encrypts `amount` → adds to `playerBalance[msg.sender]`.

- `swapETHForROLL()` (payable)  
  Receives ETH, calculates `rollAmount = (msg.value * ROLL_TOKEN_RATE) / 1 ether`, encrypts and increases `playerBalance`, emits `TokensSwapped`.

- `swapROLLForETH(uint32 rollAmount, externalEuint32 encryptedAmount, bytes amountProof)`  
  Uses encrypted amount + proof to subtract from balance, calculates corresponding ETH and transfers to user, emits `TokensSwapped`.

- `transferROLL(address to, uint32 amount, externalEuint32 encryptedAmount, bytes amountProof)`  
  Transfers encrypted ROLL from sender to recipient, emits `TokensTransferred`.

- `addTreasuryETH()` (onlyOwner, payable)  
  Owner deposits ETH into contract to support ROLL→ETH swaps.

- `getBalance(address player)` / `getPlayerBalance(address player)`  
  Returns `euint32` encrypted balance for frontend to decrypt.

---

## 📱 Frontend Integration

### Hook `useEncryptedDiceGame`

Central hook managing:

- FHEVM initialization (only enabled on Sepolia – `chainId = 11155111`)
- Reading encrypted balance (`getBalance`) and storing in state
- Calling `writeContractAsync` for mint/swap/transfer actions
- Loading history from events:
  - `TokensSwapped` for swap history
  - `TokensTransferred` for transfer history

### Manual Decrypt Flow

- UI displays encrypted balance (FHE handle)
- **"Decrypt Balance"** button:
  - Creates EIP‑712 typed data
  - MetaMask signs **message off‑chain**
  - FHEVM SDK uses signature to decrypt and return plaintext balance
  - Plaintext value is cached in context (`DecryptedBalanceContext`)

Manual decrypt ensures:

- No on‑chain transaction needed
- User controls decryption, consistent with FHEVM privacy model

---

## 🚀 Quick Start

### 1. Start System (all-in-one E2E)

```bash
# Clone project
git clone https://github.com/skysyne1/fhe-token-swap.git
cd fhe-token-swap

# Run automated tests (Linux/Mac)
chmod +x test-e2e.sh
./test-e2e.sh

# Or PowerShell (Windows)
./test-e2e.ps1
```

The `test-e2e` script will:

- Start Hardhat node
- Deploy contracts
- Run some end-to-end checks (contracts + frontend APIs at minimum level, depending on current setup)

---

### 2. Manual Setup

#### Backend (Smart Contracts)

```bash
cd dice-contracts

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Start local network
npx hardhat node

# Deploy contracts (terminal khác)
npx hardhat --network localhost deploy
```

#### Frontend

```bash
cd frontend/packages/nextjs

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:3000`, connect wallet (Hardhat network) and perform mint/swap/transfer on the UI.

---

## 🔧 Hardhat Tasks (dice-contracts)

```bash
# FHETokenSwap contract address
npx hardhat --network localhost task:dice-address

# Token operations
npx hardhat --network localhost task:mint-tokens --amount <amount>
npx hardhat --network localhost task:swap-eth-for-roll --eth <amount>
npx hardhat --network localhost task:swap-roll-for-eth --roll <amount>
npx hardhat --network localhost task:get-balance
```

These tasks are convenient wrappers around the `FHETokenSwap` contract, used to:

- Provide test ROLL
- Swap ETH↔ROLL locally
- Read encrypted balance for debugging

---

## 📱 Frontend Features (Chi tiết)

### 1. Wallet Integration

- ✅ RainbowKit connection UI
- ✅ Tự động detect network (Hardhat ↔ Sepolia)
- ✅ Hiển thị ETH + ROLL balance
- ✅ Real‑time refresh khi tx hoàn tất

### 2. Token Swap Interface

- ✅ Swap ETH → ROLL
- ✅ Swap ROLL → ETH
- ✅ Input validation (amount > 0, đủ balance…)
- ✅ Hiển thị kết quả swap tức thời
- ✅ Xử lý encrypted transaction (ROLL side)

### 3. Token Management

- ✅ Mint ROLL tokens (testing)
- ✅ Swap ETH↔ROLL
- ✅ Track balance (encrypted + decrypted)
- ✅ Thông báo trạng thái giao dịch (pending/success/fail)

### 4. Swap & Transfer History

- ✅ Danh sách swap theo thời gian thực
- ✅ Phân loại direction (ETH→ROLL / ROLL→ETH)
- ✅ Lưu amount & timestamp
- ✅ Bảo vệ privacy (logic đọc từ event, không lộ thông tin ngoài design)

---

## 🔐 Privacy & Security

### FHE Encryption

```solidity
// ROLL amounts are encrypted when swapping ROLL → ETH
euint32 encRollAmount = FHE.fromExternal(encryptedAmount, amountProof);

// Balance is stored encrypted
mapping(address => euint32) public playerBalance;
```

### Access Control

```solidity
// Only owner can add ETH to treasury
modifier onlyOwner() {
    if (msg.sender != owner) revert OnlyOwner();
    _;
}
```

### Decrypt Model

- Only user (or owner in some special cases) can trigger decrypt via EIP‑712
- No public function returns plaintext balance directly on‑chain
- Manual decrypt performed entirely off‑chain, consistent with FHEVM security model

---

## 🧪 Testing

### Unit Tests

```bash
cd dice-contracts
npx hardhat test
```

Main test groups:

- Deployment & init state
- Minting & MAX_MINT constraint
- Swap ETH→ROLL and ROLL→ETH
- Treasury & balance checks
- Transfer ROLL end‑to‑end

### End‑to‑End Tests

```bash
npx hardhat test test/EncryptedDiceGameE2E.ts
```

E2E test simulates a complete user flow on the contract (depending on current tests in repo).

### Integration Tests (Full Suite)

```bash
# Run full test suite
./test-e2e.sh
```

Or on Windows:

```powershell
./test-e2e.ps1
```

---

## 📊 Test Coverage (hiện tại)

- ✅ **Contract Deployment**: Initialization and configuration
- ✅ **Token Operations**: Mint, swap, balance tracking
- ✅ **Swap Lifecycle**: ETH→ROLL và ROLL→ETH swaps
- ✅ **Encryption/Decryption**: Bảo vệ privacy với FHE
- ✅ **Error Handling**: Validation & edge cases (insufficient balance, no ETH, v.v.)
- ✅ **Frontend Integration**: UI/UX + tương tác contract ở mức cần thiết

---

## 🚀 Deployment

### Local Testing

1. Hardhat node running
2. Contracts deployed
3. Frontend connected
4. Manual testing completed (mint, swap, transfer, decrypt)

### Sepolia Testnet

```bash
# Deploy to Sepolia
npx hardhat --network sepolia deploy

# (Nếu cần) kiểm tra địa chỉ contract
npx hardhat --network sepolia task:dice-address
```

Sau khi deploy:

- Update `FHETokenSwap` address in frontend (or confirm it matches autogen file)
- Owner calls `addTreasuryETH()` to fund contract with ETH, enabling ROLL→ETH swap liquidity
- Kết nối frontend tới Sepolia và test full flow trên testnet

### Demo for Reviewers (Zama Developer Program)

- **Network**: Sepolia (chainId 11155111)
- **Contract**: `FHETokenSwap` @ [0xe3De829908d1afA66bC6b116C77bC832a351Cb88](https://sepolia.etherscan.io/address/0xe3De829908d1afA66bC6b116C77bC832a351Cb88)
- **Live Demo**: [https://fhe-token-swap.vercel.app](https://fhe-token-swap.vercel.app)
- **Suggested Steps**:
  1. Connect wallet → Sepolia
  2. Mint test ROLL
  3. Swap ETH → ROLL
  4. Swap ROLL → ETH
  5. Perform a `transferROLL`
  6. Use "Decrypt Balance" button to view plaintext
  7. Open history page to view all swaps/transfers

---

## 📽 Demo Video

🌐 **Live Application**: [https://fhe-token-swap.vercel.app](https://fhe-token-swap.vercel.app)  
🎥 **Demo Video**: [Watch on YouTube](https://youtu.be/AZLC6sKbIzg)

The demo demonstrates: connect wallet, mint, swap ETH↔ROLL, transfer ROLL, decrypt balance and view history.---

## 📈 Monitoring & Analytics

### Contract Events

```solidity
event TokensSwapped(address indexed user, uint256 ethAmount, uint256 rollAmount, bool ethToRoll);
event TokensTransferred(address indexed from, address indexed to, uint256 amount);
```

These events are used by the frontend to:

- Render swap/transfer history
- Statistics for volume, usage frequency, etc. (if expanded in the future)

### Frontend Metrics (Suggestions)

- Token swap volume
- Number of transfers
- Success/failure rate of transactions
- Encryption/relayer errors (if tracked)

---

## 🔮 Future Enhancements

### Phase 2 (Suggestions)

- [ ] More detailed UI for analytics (swap/transfer charts)
- [ ] Add UX warnings for low treasury ETH
- [ ] Support multiple token types or different pools

### Phase 3 (Suggestions)

- [ ] Cross‑chain / multi‑pool support
- [ ] Governance token / reward model
- [ ] Integration with game modes (dice game, betting, etc.) sharing ROLL balance

---

## 📞 Support & Documentation

### Zama FHE Resources

- [Zama Documentation](https://docs.zama.ai/)
- [FHEVM Hardhat Template](https://github.com/zama-ai/fhevm-hardhat-template)
- [Guild.xyz Developer Program](https://guild.xyz/zama/developer-program)

### Technical Support

- GitHub Issues: [https://github.com/skysyne1/fhe-token-swap/issues](https://github.com/skysyne1/fhe-token-swap/issues)
- Developer Discord
- Community Forum

---

## 🎯 System Status

**Current State**: ✅ **FULLY INTEGRATED AND READY**

- ✅ Smart contracts deployed and tested
- ✅ Backend tasks fully operational
- ✅ Frontend integrated with real contract (Hardhat & Sepolia)
- ✅ End‑to‑end testing completed
- ✅ Privacy & security follows FHEVM model
- ✅ Ready for Sepolia demo

**Next Steps**: Stable deployment on Sepolia, demo video recording, add CI tests & production monitoring (if needed).

---

**🔗 Project Links:**

- **Repository**: [https://github.com/skysyne1/fhe-token-swap](https://github.com/skysyne1/fhe-token-swap)
- **Live Demo**: [https://fhe-token-swap.vercel.app](https://fhe-token-swap.vercel.app)
- **Contract on Sepolia**: [0xe3De829908d1afA66bC6b116C77bC832a351Cb88](https://sepolia.etherscan.io/address/0xe3De829908d1afA66bC6b116C77bC832a351Cb88)

---

_Built with ❤️ using Zama FHE technology_
