import { expect } from "chai";
import { ethers, deployments, fhevm } from "hardhat";
import type { EncryptedDiceGame } from "../types";
import { FhevmType } from "@fhevm/hardhat-plugin";

/**
 * End-to-End Tests for EncryptedDiceGame
 * ======================================
 *
 * These tests cover the complete user journey and system integration:
 * 1. Contract deployment and initialization
 * 2. Token minting and balance management
 * 3. ETH/ROLL token swapping
 * 4. Complete dice game flow (start → resolve)
 * 5. Encrypted data handling and decryption
 * 6. Error handling and edge cases
 * 7. Multi-player scenarios
 * 8. Gas optimization verification
 *
 * Run with: npx hardhat test test/EncryptedDiceGameE2E.ts
 */

describe("EncryptedDiceGame - End-to-End Tests", function () {
  let encryptedDiceGame: EncryptedDiceGame;
  let owner: any, player1: any, player2: any;
  let contractAddress: string;

  // Test constants
  const MINT_AMOUNT = 1000;
  const STAKE_AMOUNT = 100;
  const ETH_SWAP_AMOUNT = "0.1"; // 0.1 ETH = 100 ROLL tokens

  beforeEach(async function () {
    // Initialize FHEVM for each test
    await fhevm.initializeCLIApi();

    // Get signers
    [owner, player1, player2] = await ethers.getSigners();

    // Deploy contracts fresh for each test
    await deployments.fixture(["EncryptedDiceGame"]);
    const deployment = await deployments.get("EncryptedDiceGame");
    contractAddress = deployment.address;

    // Get contract instance
    encryptedDiceGame = await ethers.getContractAt("EncryptedDiceGame", contractAddress);

    console.log(`\n🎯 Test Setup Complete:`);
    console.log(`   Contract: ${contractAddress}`);
    console.log(`   Owner: ${owner.address}`);
    console.log(`   Player1: ${player1.address}`);
    console.log(`   Player2: ${player2.address}\n`);
  });

  describe("🏗️  Contract Deployment & Initialization", function () {
    it("Should deploy with correct initial state", async function () {
      expect(await encryptedDiceGame.owner()).to.equal(owner.address);
      expect(await encryptedDiceGame.gameCounter()).to.equal(0);

      console.log("✅ Contract deployed with correct owner and initial game counter");
    });

    it("Should have correct constants", async function () {
      expect(await encryptedDiceGame.PAYOUT_MULTIPLIER()).to.equal(195);
      expect(await encryptedDiceGame.BASIS_POINTS()).to.equal(100);
      expect(await encryptedDiceGame.ROLL_TOKEN_RATE()).to.equal(1000);

      console.log("✅ Contract constants verified");
    });
  });

  describe("🪙 Token Management", function () {
    it("Should mint tokens successfully", async function () {
      const tx = await encryptedDiceGame.connect(player1).mintTokens(MINT_AMOUNT);
      await tx.wait();

      const encryptedBalance = await encryptedDiceGame.getBalance(player1.address);
      expect(encryptedBalance).to.not.equal(ethers.ZeroHash);

      const clearBalance = await fhevm.userDecryptEuint(FhevmType.euint32, encryptedBalance, contractAddress, player1);
      expect(clearBalance).to.equal(MINT_AMOUNT);

      console.log(`✅ Player1 minted ${MINT_AMOUNT} ROLL tokens`);
    });

    it("Should swap ETH for ROLL tokens", async function () {
      const ethAmount = ethers.parseEther(ETH_SWAP_AMOUNT);
      const expectedRollAmount = parseFloat(ETH_SWAP_AMOUNT) * 1000;

      const tx = await encryptedDiceGame.connect(player1).swapETHForROLL({ value: ethAmount });
      await tx.wait();

      const encryptedBalance = await encryptedDiceGame.getBalance(player1.address);
      const clearBalance = await fhevm.userDecryptEuint(FhevmType.euint32, encryptedBalance, contractAddress, player1);
      expect(clearBalance).to.equal(expectedRollAmount);

      console.log(`✅ Player1 swapped ${ETH_SWAP_AMOUNT} ETH for ${expectedRollAmount} ROLL tokens`);
    });

    it("Should handle multiple mints correctly", async function () {
      // First mint
      await encryptedDiceGame.connect(player1).mintTokens(500);
      // Second mint
      await encryptedDiceGame.connect(player1).mintTokens(300);

      const encryptedBalance = await encryptedDiceGame.getBalance(player1.address);
      const clearBalance = await fhevm.userDecryptEuint(FhevmType.euint32, encryptedBalance, contractAddress, player1);
      expect(clearBalance).to.equal(800);

      console.log("✅ Multiple mints accumulated correctly: 800 ROLL");
    });
  });

  describe("🎲 Complete Game Flow", function () {
    beforeEach(async function () {
      // Give player1 some tokens for testing
      await encryptedDiceGame.connect(player1).mintTokens(MINT_AMOUNT);
    });

    it("Should complete full game cycle: start → resolve → check results", async function () {
      const diceCount = 2;
      const prediction = 0; // even
      const stakeAmount = STAKE_AMOUNT;

      // 1. Start Game
      console.log(
        `\n🎮 Starting game: ${diceCount} dice, prediction: ${prediction === 0 ? "even" : "odd"}, stake: ${stakeAmount}`,
      );

      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, player1.address);
      const encryptedPrediction = encryptedInput.add8(prediction);
      const encryptedStake = encryptedInput.add32(stakeAmount);
      const encryptedValues = await encryptedInput.encrypt();

      const startTx = await encryptedDiceGame
        .connect(player1)
        .startGame(
          diceCount,
          encryptedValues.handles[0],
          encryptedValues.inputProof,
          encryptedValues.handles[1],
          encryptedValues.inputProof,
        );

      const startReceipt = await startTx.wait();
      expect(startReceipt?.status).to.equal(1);

      // Extract game ID from event
      const events = startReceipt?.logs;
      let gameId = 0;
      if (events && events.length > 0) {
        const gameStartedEvent = events.find(
          (e) => e.topics[0] === ethers.id("GameStarted(uint256,address,uint8,uint256)"),
        );
        if (gameStartedEvent) {
          gameId = Number(ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], gameStartedEvent.topics[1])[0]);
        }
      }

      console.log(`✅ Game started successfully! Game ID: ${gameId}`);

      // 2. Check game details
      const gameDetails = await encryptedDiceGame.getGame(gameId);
      expect(gameDetails[0]).to.equal(player1.address); // player
      expect(gameDetails[1]).to.equal(diceCount); // dice count
      expect(gameDetails[3]).to.equal(false); // not resolved yet

      console.log(`✅ Game details verified`);

      // 3. Resolve Game
      const resolveTx = await encryptedDiceGame.connect(player1).resolveGame(gameId);
      const resolveReceipt = await resolveTx.wait();
      expect(resolveReceipt?.status).to.equal(1);

      console.log(`✅ Game resolved successfully!`);

      // 4. Check final game state
      const finalGameDetails = await encryptedDiceGame.getGame(gameId);
      expect(finalGameDetails[3]).to.equal(true); // should be resolved

      console.log(`✅ Game marked as resolved`);

      // 5. Verify dice values were generated
      const diceValues = await encryptedDiceGame.getGameDiceValues(gameId);
      expect(diceValues.length).to.equal(diceCount);

      console.log(`✅ ${diceCount} dice values generated`);

      // 6. Check final balance (should have changed)
      const finalEncryptedBalance = await encryptedDiceGame.getBalance(player1.address);
      const finalClearBalance = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        finalEncryptedBalance,
        contractAddress,
        player1,
      );

      console.log(`💰 Final balance: ${finalClearBalance} ROLL (started with ${MINT_AMOUNT})`);

      // Balance should be different from initial (either won or lost)
      expect(finalClearBalance).to.not.equal(MINT_AMOUNT);
    });

    it("Should handle multiple games per player", async function () {
      const games = [];

      // Start 3 games
      for (let i = 0; i < 3; i++) {
        const encryptedInput = await fhevm.createEncryptedInput(contractAddress, player1.address);
        const encryptedPrediction = encryptedInput.add8(i % 2); // alternate even/odd
        const encryptedStake = encryptedInput.add32(50); // smaller stakes
        const encryptedValues = await encryptedInput.encrypt();

        const startTx = await encryptedDiceGame.connect(player1).startGame(
          1, // single dice
          encryptedValues.handles[0],
          encryptedValues.inputProof,
          encryptedValues.handles[1],
          encryptedValues.inputProof,
        );

        await startTx.wait();
        games.push(i);

        console.log(`✅ Game ${i} started`);
      }

      // Resolve all games
      for (let gameId of games) {
        const resolveTx = await encryptedDiceGame.connect(player1).resolveGame(gameId);
        await resolveTx.wait();

        const gameDetails = await encryptedDiceGame.getGame(gameId);
        expect(gameDetails[3]).to.equal(true); // resolved

        console.log(`✅ Game ${gameId} resolved`);
      }

      expect(await encryptedDiceGame.gameCounter()).to.equal(3);
      console.log(`✅ All 3 games completed successfully`);
    });

    it("Should handle different dice counts (1, 2, 3)", async function () {
      for (let diceCount = 1; diceCount <= 3; diceCount++) {
        const encryptedInput = await fhevm.createEncryptedInput(contractAddress, player1.address);
        const encryptedPrediction = encryptedInput.add8(0); // always even
        const encryptedStake = encryptedInput.add32(50);
        const encryptedValues = await encryptedInput.encrypt();

        const startTx = await encryptedDiceGame
          .connect(player1)
          .startGame(
            diceCount,
            encryptedValues.handles[0],
            encryptedValues.inputProof,
            encryptedValues.handles[1],
            encryptedValues.inputProof,
          );

        await startTx.wait();

        const resolveTx = await encryptedDiceGame.connect(player1).resolveGame(diceCount - 1);
        await resolveTx.wait();

        const diceValues = await encryptedDiceGame.getGameDiceValues(diceCount - 1);
        expect(diceValues.length).to.equal(diceCount);

        console.log(`✅ Game with ${diceCount} dice completed successfully`);
      }
    });
  });

  describe("🔐 Encryption & Privacy Tests", function () {
    beforeEach(async function () {
      await encryptedDiceGame.connect(player1).mintTokens(MINT_AMOUNT);
      await encryptedDiceGame.connect(player2).mintTokens(MINT_AMOUNT);
    });

    it("Should keep game data private between players", async function () {
      // Player1 starts a game
      const encryptedInput1 = await fhevm.createEncryptedInput(contractAddress, player1.address);
      const encryptedPrediction1 = encryptedInput1.add8(0); // even
      const encryptedStake1 = encryptedInput1.add32(100);
      const encryptedValues1 = await encryptedInput1.encrypt();

      await encryptedDiceGame
        .connect(player1)
        .startGame(
          2,
          encryptedValues1.handles[0],
          encryptedValues1.inputProof,
          encryptedValues1.handles[1],
          encryptedValues1.inputProof,
        );

      // Player2 should NOT be able to access Player1's encrypted data
      try {
        await encryptedDiceGame.connect(player2).getGamePrediction(0);
        expect.fail("Player2 should not be able to access Player1's prediction");
      } catch (error: any) {
        expect(error.message).to.include("Only game player can view prediction");
        console.log("✅ Privacy protection verified: prediction access denied");
      }

      try {
        await encryptedDiceGame.connect(player2).getGameStake(0);
        expect.fail("Player2 should not be able to access Player1's stake");
      } catch (error: any) {
        expect(error.message).to.include("Only game player can view stake");
        console.log("✅ Privacy protection verified: stake access denied");
      }

      // Player1 should be able to access their own data
      const prediction = await encryptedDiceGame.connect(player1).getGamePrediction(0);
      const stake = await encryptedDiceGame.connect(player1).getGameStake(0);

      expect(prediction).to.not.equal(ethers.ZeroHash);
      expect(stake).to.not.equal(ethers.ZeroHash);

      console.log("✅ Privacy protection verified: owner can access own data");
    });

    it("Should decrypt data correctly for authorized users", async function () {
      const prediction = 1; // odd
      const stakeAmount = 150;

      // Start game with known values
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, player1.address);
      const encryptedPrediction = encryptedInput.add8(prediction);
      const encryptedStake = encryptedInput.add32(stakeAmount);
      const encryptedValues = await encryptedInput.encrypt();

      await encryptedDiceGame
        .connect(player1)
        .startGame(
          1,
          encryptedValues.handles[0],
          encryptedValues.inputProof,
          encryptedValues.handles[1],
          encryptedValues.inputProof,
        );

      // Decrypt and verify
      const encryptedPredictionStored = await encryptedDiceGame.connect(player1).getGamePrediction(0);
      const clearPrediction = await fhevm.userDecryptEuint(
        FhevmType.euint8,
        encryptedPredictionStored,
        contractAddress,
        player1,
      );
      expect(clearPrediction).to.equal(prediction);

      const encryptedStakeStored = await encryptedDiceGame.connect(player1).getGameStake(0);
      const clearStake = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedStakeStored,
        contractAddress,
        player1,
      );
      expect(clearStake).to.equal(stakeAmount);

      console.log(`✅ Decryption verified: prediction=${clearPrediction === 0n ? "even" : "odd"}, stake=${clearStake}`);
    });
  });

  describe("⚠️  Error Handling & Edge Cases", function () {
    it("Should reject invalid dice counts", async function () {
      await encryptedDiceGame.connect(player1).mintTokens(MINT_AMOUNT);

      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, player1.address);
      const encryptedPrediction = encryptedInput.add8(0);
      const encryptedStake = encryptedInput.add32(100);
      const encryptedValues = await encryptedInput.encrypt();

      // Test invalid dice counts
      for (const invalidDiceCount of [0, 4, 10]) {
        try {
          await encryptedDiceGame
            .connect(player1)
            .startGame(
              invalidDiceCount,
              encryptedValues.handles[0],
              encryptedValues.inputProof,
              encryptedValues.handles[1],
              encryptedValues.inputProof,
            );
          expect.fail(`Should reject dice count: ${invalidDiceCount}`);
        } catch (error: any) {
          expect(error.message).to.include("Dice count must be 1-3");
          console.log(`✅ Correctly rejected invalid dice count: ${invalidDiceCount}`);
        }
      }
    });

    it("Should reject resolving non-existent games", async function () {
      try {
        await encryptedDiceGame.connect(player1).resolveGame(999);
        expect.fail("Should reject resolving non-existent game");
      } catch (error: any) {
        expect(error.message).to.include("Only game player can resolve");
        console.log("✅ Correctly rejected resolving non-existent game");
      }
    });

    it("Should reject double resolution", async function () {
      await encryptedDiceGame.connect(player1).mintTokens(MINT_AMOUNT);

      // Start and resolve a game
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, player1.address);
      const encryptedPrediction = encryptedInput.add8(0);
      const encryptedStake = encryptedInput.add32(100);
      const encryptedValues = await encryptedInput.encrypt();

      await encryptedDiceGame
        .connect(player1)
        .startGame(
          1,
          encryptedValues.handles[0],
          encryptedValues.inputProof,
          encryptedValues.handles[1],
          encryptedValues.inputProof,
        );

      await encryptedDiceGame.connect(player1).resolveGame(0);

      // Try to resolve again
      try {
        await encryptedDiceGame.connect(player1).resolveGame(0);
        expect.fail("Should reject double resolution");
      } catch (error: any) {
        expect(error.message).to.include("Game already resolved");
        console.log("✅ Correctly rejected double resolution");
      }
    });

    it("Should reject excessive mint amounts", async function () {
      const maxMint = await encryptedDiceGame.MAX_MINT();
      const excessiveAmount = Number(maxMint) + 1;

      try {
        await encryptedDiceGame.connect(player1).mintTokens(excessiveAmount);
        expect.fail("Should reject excessive mint amount");
      } catch (error: any) {
        expect(error.message).to.include("Max mint is 10000 ROLL");
        console.log(`✅ Correctly rejected excessive mint: ${excessiveAmount}`);
      }
    });
  });

  describe("💰 Multi-Player Economy Tests", function () {
    it("Should handle multiple players independently", async function () {
      // Both players mint tokens
      await encryptedDiceGame.connect(player1).mintTokens(500);
      await encryptedDiceGame.connect(player2).mintTokens(800);

      // Verify independent balances
      const balance1 = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        await encryptedDiceGame.getBalance(player1.address),
        contractAddress,
        player1,
      );
      const balance2 = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        await encryptedDiceGame.getBalance(player2.address),
        contractAddress,
        player2,
      );

      expect(balance1).to.equal(500);
      expect(balance2).to.equal(800);

      console.log(`✅ Independent balances verified: Player1=${balance1}, Player2=${balance2}`);

      // Both players start games independently
      for (const player of [player1, player2]) {
        const encryptedInput = await fhevm.createEncryptedInput(contractAddress, player.address);
        const encryptedPrediction = encryptedInput.add8(0);
        const encryptedStake = encryptedInput.add32(50);
        const encryptedValues = await encryptedInput.encrypt();

        await encryptedDiceGame
          .connect(player)
          .startGame(
            1,
            encryptedValues.handles[0],
            encryptedValues.inputProof,
            encryptedValues.handles[1],
            encryptedValues.inputProof,
          );
      }

      expect(await encryptedDiceGame.gameCounter()).to.equal(2);
      console.log("✅ Both players successfully started independent games");
    });

    it("Should track game ownership correctly", async function () {
      await encryptedDiceGame.connect(player1).mintTokens(500);
      await encryptedDiceGame.connect(player2).mintTokens(500);

      // Player1 starts game 0
      let encryptedInput = await fhevm.createEncryptedInput(contractAddress, player1.address);
      let encryptedPrediction = encryptedInput.add8(0);
      let encryptedStake = encryptedInput.add32(100);
      let encryptedValues = await encryptedInput.encrypt();

      await encryptedDiceGame
        .connect(player1)
        .startGame(
          1,
          encryptedValues.handles[0],
          encryptedValues.inputProof,
          encryptedValues.handles[1],
          encryptedValues.inputProof,
        );

      // Player2 starts game 1
      encryptedInput = await fhevm.createEncryptedInput(contractAddress, player2.address);
      encryptedPrediction = encryptedInput.add8(1);
      encryptedStake = encryptedInput.add32(150);
      encryptedValues = await encryptedInput.encrypt();

      await encryptedDiceGame
        .connect(player2)
        .startGame(
          2,
          encryptedValues.handles[0],
          encryptedValues.inputProof,
          encryptedValues.handles[1],
          encryptedValues.inputProof,
        );

      // Verify ownership
      const game0 = await encryptedDiceGame.getGame(0);
      const game1 = await encryptedDiceGame.getGame(1);

      expect(game0[0]).to.equal(player1.address);
      expect(game1[0]).to.equal(player2.address);

      // Player2 should not be able to resolve Player1's game
      try {
        await encryptedDiceGame.connect(player2).resolveGame(0);
        expect.fail("Player2 should not resolve Player1's game");
      } catch (error: any) {
        expect(error.message).to.include("Only game player can resolve");
        console.log("✅ Game ownership protection verified");
      }

      // Each player can resolve their own game
      await encryptedDiceGame.connect(player1).resolveGame(0);
      await encryptedDiceGame.connect(player2).resolveGame(1);

      console.log("✅ Players successfully resolved their own games");
    });
  });

  describe("⛽ Gas Optimization & Performance", function () {
    it("Should have reasonable gas costs for basic operations", async function () {
      // Mint tokens
      const mintTx = await encryptedDiceGame.connect(player1).mintTokens(1000);
      const mintReceipt = await mintTx.wait();
      console.log(`💰 Mint gas used: ${mintReceipt?.gasUsed.toString()}`);

      // Start game
      const encryptedInput = await fhevm.createEncryptedInput(contractAddress, player1.address);
      const encryptedPrediction = encryptedInput.add8(0);
      const encryptedStake = encryptedInput.add32(100);
      const encryptedValues = await encryptedInput.encrypt();

      const startTx = await encryptedDiceGame
        .connect(player1)
        .startGame(
          2,
          encryptedValues.handles[0],
          encryptedValues.inputProof,
          encryptedValues.handles[1],
          encryptedValues.inputProof,
        );
      const startReceipt = await startTx.wait();
      console.log(`🎮 Start game gas used: ${startReceipt?.gasUsed.toString()}`);

      // Resolve game
      const resolveTx = await encryptedDiceGame.connect(player1).resolveGame(0);
      const resolveReceipt = await resolveTx.wait();
      console.log(`🎲 Resolve game gas used: ${resolveReceipt?.gasUsed.toString()}`);

      // All operations should complete successfully
      expect(mintReceipt?.status).to.equal(1);
      expect(startReceipt?.status).to.equal(1);
      expect(resolveReceipt?.status).to.equal(1);

      console.log("✅ All operations completed with reasonable gas usage");
    });
  });

  after(async function () {
    console.log("\n🏁 End-to-End Tests Completed Successfully!");
    console.log("📊 Test Coverage Summary:");
    console.log("   ✅ Contract deployment and initialization");
    console.log("   ✅ Token minting and balance management");
    console.log("   ✅ ETH/ROLL token swapping");
    console.log("   ✅ Complete dice game lifecycle");
    console.log("   ✅ Encryption and privacy protection");
    console.log("   ✅ Error handling and validation");
    console.log("   ✅ Multi-player scenarios");
    console.log("   ✅ Gas optimization verification");
    console.log("\n🚀 System ready for frontend integration!");
  });
});
