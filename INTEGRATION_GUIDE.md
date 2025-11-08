# FHE Dice Game - Complete Integration Guide

🎲 **Encrypted Dice Rolling Game với Fully Homomorphic Encryption (FHE)**

## 📋 Tổng quan hệ thống

Hệ thống bao gồm:

- **Smart Contract**: EncryptedDiceGame.sol (Solidity + FHEVM)
- **Backend Tasks**: Hardhat tasks để tương tác với contract
- **Frontend**: Next.js + RainbowKit + Wagmi
- **End-to-End Tests**: Automated testing suite

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                    FHE DICE GAME SYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────┐ │
│  │   FRONTEND      │    │   SMART CONTRACT │    │ FHEVM   │ │
│  │   (Next.js)     │◄──►│   (Hardhat)      │◄──►│ Network │ │
│  │                 │    │                  │    │         │ │
│  │ • RainbowKit    │    │ • EncryptedDice  │    │ • FHE   │ │
│  │ • Wagmi         │    │ • FHECounter     │    │ • Oracle│ │
│  │ • FheVM SDK     │    │                  │    │         │ │
│  └─────────────────┘    └──────────────────┘    └─────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Khởi động hệ thống

```bash
# Clone project
git clone <repository-url>
cd fhe-dice-game

# Run automated tests (Linux/Mac)
chmod +x test-e2e.sh
./test-e2e.sh

# Hoặc PowerShell (Windows)
./test-e2e.ps1
```

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

## 🎮 Luồng chơi game

### Bước 1: Wallet Connection

```typescript
// Tự động xử lý bởi RainbowKit
const { address, isConnected } = useAccount();
```

### Bước 2: Mint/Swap Tokens

```bash
# Mint tokens cho testing
npx hardhat --network localhost task:mint-tokens --amount 1000

# Hoặc swap ETH → ROLL
npx hardhat --network localhost task:swap-eth-for-roll --eth 0.1
```

### Bước 3: Start Game

```bash
# Start game: 2 dice, prediction even, stake 100 ROLL
npx hardhat --network localhost task:start-game --dice 2 --prediction 0 --stake 100
```

### Bước 4: Resolve Game

```bash
# Resolve game với ID 0
npx hardhat --network localhost task:resolve-game --gameid 0
```

### Bước 5: Check Results

```bash
# Xem game details
npx hardhat --network localhost task:get-game --gameid 0

# Check balance
npx hardhat --network localhost task:get-balance
```

## 🔧 Available Tasks

### Contract Tasks

```bash
# Địa chỉ contract
npx hardhat --network localhost task:dice-address

# Token operations
npx hardhat --network localhost task:mint-tokens --amount <amount>
npx hardhat --network localhost task:swap-eth-for-roll --eth <amount>
npx hardhat --network localhost task:get-balance

# Game operations
npx hardhat --network localhost task:start-game --dice <1-3> --prediction <0|1> --stake <amount>
npx hardhat --network localhost task:resolve-game --gameid <id>
npx hardhat --network localhost task:get-game --gameid <id>

# Decryption (chỉ cho game owner)
npx hardhat --network localhost task:decrypt-prediction --gameid <id>
npx hardhat --network localhost task:decrypt-stake --gameid <id>
```

## 📱 Frontend Features

### 1. Wallet Integration

- ✅ RainbowKit connection UI
- ✅ Network switching (Hardhat ↔ Sepolia)
- ✅ Balance display (ETH + ROLL)
- ✅ Real-time updates

### 2. Game Interface

- ✅ Dice count selection (1-3)
- ✅ Even/Odd prediction
- ✅ Stake input với validation
- ✅ Real-time game results
- ✅ 3D dice animation

### 3. Token Management

- ✅ Mint ROLL tokens (testing)
- ✅ ETH ↔ ROLL swapping
- ✅ Balance tracking
- ✅ Transaction confirmations

### 4. Game History

- ✅ Real-time game list
- ✅ Win/Loss tracking
- ✅ Profit/Loss calculations
- ✅ Privacy protection

## 🔐 Privacy & Security

### FHE Encryption

```solidity
// Prediction và stake được encrypt
euint8 prediction = FHE.fromExternal(encryptedPrediction, predictionProof);
euint32 stakeAmount = FHE.fromExternal(encryptedStake, stakeProof);

// Game results được compute trên encrypted data
ebool won = FHE.eq(isEven, predictedEven);
```

### Access Control

```solidity
// Chỉ game owner mới xem được encrypted data
require(games[gameId].player == msg.sender, "Only game player can view");
```

## 🧪 Testing

### Unit Tests

```bash
cd dice-contracts
npx hardhat test
```

### End-to-End Tests

```bash
npx hardhat test test/EncryptedDiceGameE2E.ts
```

### Integration Tests

```bash
# Run full test suite
./test-e2e.sh
```

## 📊 Test Coverage

- ✅ **Contract Deployment**: Khởi tạo và cấu hình
- ✅ **Token Operations**: Mint, swap, balance tracking
- ✅ **Game Lifecycle**: Start → resolve → results
- ✅ **Encryption/Decryption**: FHE privacy protection
- ✅ **Error Handling**: Validation và edge cases
- ✅ **Multi-player**: Independent game sessions
- ✅ **Frontend Integration**: UI/UX và contract interaction

## 🚀 Deployment

### Local Testing

1. Hardhat node running
2. Contracts deployed
3. Frontend connected
4. Manual testing completed

### Sepolia Testnet

```bash
# Deploy to Sepolia
npx hardhat --network sepolia deploy

# Update contract addresses
# Update CONTRACT_ADDRESSES in useEncryptedDiceGame.ts

# Test on testnet
npx hardhat --network sepolia task:dice-address
```

### Production Checklist

- [ ] Contract security audit
- [ ] Gas optimization
- [ ] Frontend build optimization
- [ ] Error monitoring setup
- [ ] User documentation

## 📈 Monitoring & Analytics

### Contract Events

```solidity
event GameStarted(uint256 indexed gameId, address indexed player, uint8 diceCount, uint256 timestamp);
event GameResolved(uint256 indexed gameId, address indexed player, uint256 timestamp);
event TokensSwapped(address indexed user, uint256 ethAmount, uint256 rollAmount, bool ethToRoll);
```

### Frontend Metrics

- Game completion rate
- Token swap volume
- User retention
- Error frequency

## 🔮 Future Enhancements

### Phase 2

- [ ] Multiplayer tournaments
- [ ] NFT rewards
- [ ] Advanced betting strategies
- [ ] Mobile app

### Phase 3

- [ ] Cross-chain support
- [ ] Governance token
- [ ] Decentralized tournaments
- [ ] AI-powered game modes

## 📞 Support & Documentation

### Zama FHE Resources

- [Zama Documentation](https://docs.zama.ai/)
- [FHEVM Hardhat Template](https://github.com/zama-ai/fhevm-hardhat-template)
- [Guild.xyz Developer Program](https://era.guild.xyz/zama/developer-program)

### Technical Support

- GitHub Issues
- Developer Discord
- Community Forum

---

## 🎯 System Status

**Current State**: ✅ **FULLY INTEGRATED AND READY**

- ✅ Smart contracts deployed and tested
- ✅ Backend tasks implemented and working
- ✅ Frontend integrated with real contract calls
- ✅ End-to-end testing completed
- ✅ Privacy and security verified
- ✅ Ready for Sepolia deployment

**Next Steps**: Deploy to Sepolia testnet and complete production testing.

---

_Built with ❤️ using Zama FHE technology_
