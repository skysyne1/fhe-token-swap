import { expect } from "chai";
import { ethers, deployments, fhevm } from "hardhat";
import type { FHETokenSwap } from "../types";
import { FhevmType } from "@fhevm/hardhat-plugin";

/**
 * End-to-End Tests for Transfer Flow
 * ===================================
 *
 * These tests cover the complete transfer flow:
 * 1. FHEVM initialization
 * 2. Token minting for multiple users
 * 3. Encrypted transfer operations
 * 4. Balance verification
 * 5. Error handling
 *
 * Run with: npx hardhat test test/TransferE2E.test.ts
 */

describe("Transfer Flow - End-to-End Tests", function () {
  let encryptedDiceGame: FHETokenSwap;
  let owner: any, player1: any, player2: any;
  let contractAddress: string;

  // Test constants
  const MINT_AMOUNT = 1000;
  const TRANSFER_AMOUNT = 200;

  beforeEach(async function () {
    // Initialize FHEVM for each test
    await fhevm.initializeCLIApi();

    // Get signers
    [owner, player1, player2] = await ethers.getSigners();

    // Deploy contracts fresh for each test
    await deployments.fixture(["EncryptedDiceGame"]);
    const deployment = await deployments.get("FHETokenSwap");
    contractAddress = deployment.address;

    // Get contract instance - use FHETokenSwap as contract name
    encryptedDiceGame = await ethers.getContractAt("FHETokenSwap", contractAddress);

    console.log(`\n🎯 Test Setup Complete:`);
    console.log(`   Contract: ${contractAddress}`);
    console.log(`   Player1: ${player1.address}`);
    console.log(`   Player2: ${player2.address}\n`);
  });

  describe("🔄 Transfer Operations", function () {
    beforeEach(async function () {
      // Mint tokens for both players
      await encryptedDiceGame.connect(player1).mintTokens(MINT_AMOUNT);
      await encryptedDiceGame.connect(player2).mintTokens(500);
    });

    it("Should transfer tokens correctly", async function () {
      console.log(`\n🔄 Testing transfer: ${TRANSFER_AMOUNT} ROLL from Player1 → Player2`);

      // Get initial balances
      const initialBalance1 = await encryptedDiceGame.getBalance(player1.address);
      const initialBalance2 = await encryptedDiceGame.getBalance(player2.address);

      const initialClear1 = await fhevm.userDecryptEuint(FhevmType.euint32, initialBalance1, contractAddress, player1);
      const initialClear2 = await fhevm.userDecryptEuint(FhevmType.euint32, initialBalance2, contractAddress, player2);

      console.log(`   Initial balances: Player1=${initialClear1}, Player2=${initialClear2}`);

      // Create encrypted input for transfer
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, player1.address);
      const encryptedAmount = encryptedInput.add32(TRANSFER_AMOUNT);
      const encryptedValues = await encryptedInput.encrypt();

      // Transfer tokens
      const tx = await encryptedDiceGame
        .connect(player1)
        .transferROLL(player2.address, TRANSFER_AMOUNT, encryptedValues.handles[0], encryptedValues.inputProof);
      const receipt = await tx.wait();

      expect(receipt?.status).to.equal(1);
      console.log(`✅ Transfer transaction confirmed`);

      // Verify final balances
      const finalBalance1 = await encryptedDiceGame.getBalance(player1.address);
      const finalBalance2 = await encryptedDiceGame.getBalance(player2.address);

      const finalClear1 = await fhevm.userDecryptEuint(FhevmType.euint32, finalBalance1, contractAddress, player1);
      const finalClear2 = await fhevm.userDecryptEuint(FhevmType.euint32, finalBalance2, contractAddress, player2);

      console.log(`   Final balances: Player1=${finalClear1}, Player2=${finalClear2}`);

      // Verify balances (convert BigInt to Number for comparison)
      expect(Number(finalClear1)).to.equal(Number(initialClear1) - TRANSFER_AMOUNT);
      expect(Number(finalClear2)).to.equal(Number(initialClear2) + TRANSFER_AMOUNT);

      console.log(`✅ Transfer verified: ${TRANSFER_AMOUNT} ROLL transferred successfully`);
    });

    it("Should emit TokensTransferred event", async function () {
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, player1.address);
      const encryptedAmount = encryptedInput.add32(TRANSFER_AMOUNT);
      const encryptedValues = await encryptedInput.encrypt();

      await expect(
        encryptedDiceGame
          .connect(player1)
          .transferROLL(player2.address, TRANSFER_AMOUNT, encryptedValues.handles[0], encryptedValues.inputProof),
      )
        .to.emit(encryptedDiceGame, "TokensTransferred")
        .withArgs(player1.address, player2.address, TRANSFER_AMOUNT);

      console.log(`✅ TokensTransferred event emitted correctly`);
    });

    it("Should reject zero address", async function () {
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, player1.address);
      const encryptedAmount = encryptedInput.add32(TRANSFER_AMOUNT);
      const encryptedValues = await encryptedInput.encrypt();

      await expect(
        encryptedDiceGame
          .connect(player1)
          .transferROLL(ethers.ZeroAddress, TRANSFER_AMOUNT, encryptedValues.handles[0], encryptedValues.inputProof),
      ).to.be.revertedWith("Invalid recipient address");

      console.log(`✅ Correctly rejected zero address`);
    });

    it("Should reject self-transfer", async function () {
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, player1.address);
      const encryptedAmount = encryptedInput.add32(TRANSFER_AMOUNT);
      const encryptedValues = await encryptedInput.encrypt();

      await expect(
        encryptedDiceGame
          .connect(player1)
          .transferROLL(player1.address, TRANSFER_AMOUNT, encryptedValues.handles[0], encryptedValues.inputProof),
      ).to.be.revertedWith("Cannot transfer to yourself");

      console.log(`✅ Correctly rejected self-transfer`);
    });

    it("Should reject zero amount", async function () {
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, player1.address);
      const encryptedAmount = encryptedInput.add32(0);
      const encryptedValues = await encryptedInput.encrypt();

      await expect(
        encryptedDiceGame
          .connect(player1)
          .transferROLL(player2.address, 0, encryptedValues.handles[0], encryptedValues.inputProof),
      ).to.be.revertedWith("Amount must be greater than 0");

      console.log(`✅ Correctly rejected zero amount`);
    });
  });

  describe("💰 Balance Verification", function () {
    it("Should maintain correct balances after multiple transfers", async function () {
      // Setup: Mint tokens
      await encryptedDiceGame.connect(player1).mintTokens(1000);
      await encryptedDiceGame.connect(player2).mintTokens(500);

      // Transfer 1: Player1 → Player2 (200 ROLL)
      const encryptedInput1 = await fhevm.createEncryptedInput(contractAddress, player1.address);
      const encryptedAmount1 = encryptedInput1.add32(200);
      const encryptedValues1 = await encryptedInput1.encrypt();

      const tx1 = await encryptedDiceGame
        .connect(player1)
        .transferROLL(player2.address, 200, encryptedValues1.handles[0], encryptedValues1.inputProof);
      await tx1.wait();

      // Verify balance after first transfer
      const balance1AfterFirst = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        await encryptedDiceGame.getBalance(player1.address),
        contractAddress,
        player1,
      );
      const balance2AfterFirst = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        await encryptedDiceGame.getBalance(player2.address),
        contractAddress,
        player2,
      );

      // Player1: 1000 - 200 = 800
      // Player2: 500 + 200 = 700
      expect(Number(balance1AfterFirst)).to.equal(800);
      expect(Number(balance2AfterFirst)).to.equal(700);

      console.log(`✅ After first transfer: Player1=${balance1AfterFirst}, Player2=${balance2AfterFirst}`);

      // Transfer 2: Player2 → Player1 (100 ROLL)
      // Create new encrypted input for player2
      const encryptedInput2 = await fhevm.createEncryptedInput(contractAddress, player2.address);
      const encryptedAmount2 = encryptedInput2.add32(100);
      const encryptedValues2 = await encryptedInput2.encrypt();

      const tx2 = await encryptedDiceGame
        .connect(player2)
        .transferROLL(player1.address, 100, encryptedValues2.handles[0], encryptedValues2.inputProof);
      await tx2.wait();

      // Verify final balances - decrypt player1 first
      const finalBalance1 = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        await encryptedDiceGame.getBalance(player1.address),
        contractAddress,
        player1,
      );

      // Verify final balance for player2
      const finalBalance2 = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        await encryptedDiceGame.getBalance(player2.address),
        contractAddress,
        player2,
      );

      // Player1: 1000 - 200 + 100 = 900
      // Player2: 500 + 200 - 100 = 600
      expect(Number(finalBalance1)).to.equal(900);
      expect(Number(finalBalance2)).to.equal(600);

      console.log(`✅ Multiple transfers verified: Player1=${finalBalance1}, Player2=${finalBalance2}`);
    });
  });

  after(async function () {
    console.log("\n🏁 Transfer Flow Tests Completed Successfully!");
  });
});
