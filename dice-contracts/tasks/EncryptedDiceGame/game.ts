import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import {
  getContractDeployment,
  getSigners,
  validateNonNegativeIntegerParam,
  logTaskStart,
  logTaskSuccess,
  waitForTransaction,
  initializeFHEVM,
} from "../common/utils";

/**
 * Game Management Tasks
 * =====================
 * Handle dice game start, resolve, and data retrieval
 */

/**
 * Start a new encrypted dice game
 *
 * Usage:
 *   npx hardhat --network localhost task:start-game --dice 2 --prediction 0 --stake 100
 *   npx hardhat --network sepolia task:start-game --dice 1 --prediction 1 --stake 50
 */
task("task:start-game", "Start a new encrypted dice game")
  .addOptionalParam("address", "Optionally specify the EncryptedDiceGame contract address")
  .addParam("dice", "Number of dice to roll (1-3)")
  .addParam("prediction", "Prediction: 0 for even, 1 for odd")
  .addParam("stake", "Stake amount in ROLL tokens")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const diceCount = parseInt(taskArguments.dice);
    const prediction = parseInt(taskArguments.prediction);
    const stake = validateNonNegativeIntegerParam(taskArguments.stake, "stake");

    if (!Number.isInteger(diceCount) || diceCount < 1 || diceCount > 3) {
      throw new Error(`Argument --dice must be 1, 2, or 3`);
    }
    if (!Number.isInteger(prediction) || (prediction !== 0 && prediction !== 1)) {
      throw new Error(`Argument --prediction must be 0 (even) or 1 (odd)`);
    }

    logTaskStart("start-game", {
      diceCount,
      prediction: prediction === 0 ? "even" : "odd",
      stake,
    });

    try {
      await initializeFHEVM(hre);

      const deployment = await getContractDeployment(hre, "EncryptedDiceGame", taskArguments.address);

      const signers = await getSigners(hre);
      const contract = await hre.ethers.getContractAt("EncryptedDiceGame", deployment.address);

      console.log(
        `🎮 Starting game with ${diceCount} dice, prediction: ${prediction === 0 ? "even" : "odd"}, stake: ${stake} ROLL`,
      );

      // Encrypt prediction and stake using FHEVM
      const encryptedInput = await hre.fhevm.createEncryptedInput(deployment.address, signers[0].address);

      const encryptedPrediction = encryptedInput.add8(prediction);
      const encryptedStake = encryptedInput.add32(stake);
      const encryptedValues = await encryptedInput.encrypt();

      const tx = await contract.connect(signers[0]).startGame(
        diceCount,
        encryptedValues.handles[0], // prediction
        encryptedValues.inputProof,
        encryptedValues.handles[1], // stake
        encryptedValues.inputProof,
      );

      const receipt = await waitForTransaction(hre, tx.hash, "Start game");

      // Extract game ID from events
      let gameId = null;
      if (receipt?.logs) {
        const gameStartedEvent = receipt.logs.find(
          (log: any) => log.topics[0] === hre.ethers.id("GameStarted(uint256,address,uint8,uint256)"),
        );
        if (gameStartedEvent) {
          gameId = hre.ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], gameStartedEvent.topics[1])[0];
          console.log(`🎯 Game ID: ${gameId}`);
        }
      }

      logTaskSuccess(`Game started successfully! ${gameId ? `Game ID: ${gameId}` : ""}`);

      return { txHash: tx.hash, gameId };
    } catch (error) {
      console.error("❌ Failed to start game:", error);
      throw error;
    }
  });

/**
 * Resolve an encrypted dice game
 *
 * Usage:
 *   npx hardhat --network localhost task:resolve-game --gameid 0
 *   npx hardhat --network sepolia task:resolve-game --gameid 1
 */
task("task:resolve-game", "Resolve an encrypted dice game")
  .addOptionalParam("address", "Optionally specify the EncryptedDiceGame contract address")
  .addParam("gameid", "The game ID to resolve")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const gameId = validateNonNegativeIntegerParam(taskArguments.gameid, "gameid");

    logTaskStart("resolve-game", { gameId });

    try {
      const deployment = await getContractDeployment(hre, "EncryptedDiceGame", taskArguments.address);

      const signers = await getSigners(hre);
      const contract = await hre.ethers.getContractAt("EncryptedDiceGame", deployment.address);

      console.log(`🎲 Resolving game ID: ${gameId}...`);

      const tx = await contract.connect(signers[0]).resolveGame(gameId);
      await waitForTransaction(hre, tx.hash, "Resolve game");

      logTaskSuccess(`Game ${gameId} resolved successfully!`);

      return tx.hash;
    } catch (error) {
      console.error("❌ Failed to resolve game:", error);
      throw error;
    }
  });

/**
 * Get game details
 *
 * Usage:
 *   npx hardhat --network localhost task:get-game --gameid 0
 *   npx hardhat --network sepolia task:get-game --gameid 1
 */
task("task:get-game", "Get game details")
  .addOptionalParam("address", "Optionally specify the EncryptedDiceGame contract address")
  .addParam("gameid", "The game ID to query")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const gameId = validateNonNegativeIntegerParam(taskArguments.gameid, "gameid");

    logTaskStart("get-game", { gameId });

    try {
      const deployment = await getContractDeployment(hre, "EncryptedDiceGame", taskArguments.address);

      const signers = await getSigners(hre);
      const contract = await hre.ethers.getContractAt("EncryptedDiceGame", deployment.address);

      const gameData = await contract.getGame(gameId);

      console.log(`\n📋 Game ${gameId} Details:`);
      console.log(`   👤 Player: ${gameData[0]}`);
      console.log(`   🎲 Dice Count: ${gameData[1]}`);
      console.log(`   ⏰ Timestamp: ${new Date(Number(gameData[2]) * 1000).toISOString()}`);
      console.log(`   ✅ Resolved: ${gameData[3]}`);

      logTaskSuccess(`Game ${gameId} details retrieved successfully`);

      return {
        player: gameData[0],
        diceCount: gameData[1],
        timestamp: Number(gameData[2]),
        isResolved: gameData[3],
      };
    } catch (error) {
      console.error("❌ Failed to get game details:", error);
      throw error;
    }
  });
