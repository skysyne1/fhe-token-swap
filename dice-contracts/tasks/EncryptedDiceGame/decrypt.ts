import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import {
  getContractDeployment,
  getSigners,
  validateNonNegativeIntegerParam,
  logTaskStart,
  logTaskSuccess,
  initializeFHEVM,
} from "../common/utils";

/**
 * Decryption Tasks
 * ================
 * Handle encrypted data decryption (only accessible by game owner)
 */

/**
 * Decrypt game prediction (only by game player)
 *
 * Usage:
 *   npx hardhat --network localhost task:decrypt-prediction --gameid 0
 *   npx hardhat --network sepolia task:decrypt-prediction --gameid 1
 */
task("task:decrypt-prediction", "Decrypt game prediction")
  .addOptionalParam("address", "Optionally specify the EncryptedDiceGame contract address")
  .addParam("gameid", "The game ID to decrypt prediction for")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const gameId = validateNonNegativeIntegerParam(taskArguments.gameid, "gameid");

    logTaskStart("decrypt-prediction", { gameId });

    try {
      await initializeFHEVM(hre);

      const deployment = await getContractDeployment(hre, "EncryptedDiceGame", taskArguments.address);

      const signers = await getSigners(hre);
      const contract = await hre.ethers.getContractAt("EncryptedDiceGame", deployment.address);

      console.log(`🔓 Decrypting prediction for game ${gameId}...`);

      const encryptedPrediction = await contract.getGamePrediction(gameId);

      if (encryptedPrediction === hre.ethers.ZeroHash) {
        console.log(`📭 No prediction found for game ${gameId}`);
        return null;
      }

      const clearPrediction = await hre.fhevm.userDecryptEuint(
        FhevmType.euint8,
        encryptedPrediction,
        deployment.address,
        signers[0],
      );

      console.log(`🎯 Game ${gameId} prediction: ${clearPrediction === 0n ? "even" : "odd"} (${clearPrediction})`);

      logTaskSuccess(`Prediction decrypted successfully`);

      return clearPrediction;
    } catch (error) {
      console.error("❌ Failed to decrypt prediction:", error);
      throw error;
    }
  });

/**
 * Decrypt game stake amount (only by game player)
 *
 * Usage:
 *   npx hardhat --network localhost task:decrypt-stake --gameid 0
 *   npx hardhat --network sepolia task:decrypt-stake --gameid 1
 */
task("task:decrypt-stake", "Decrypt game stake amount")
  .addOptionalParam("address", "Optionally specify the EncryptedDiceGame contract address")
  .addParam("gameid", "The game ID to decrypt stake for")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const gameId = validateNonNegativeIntegerParam(taskArguments.gameid, "gameid");

    logTaskStart("decrypt-stake", { gameId });

    try {
      await initializeFHEVM(hre);

      const deployment = await getContractDeployment(hre, "EncryptedDiceGame", taskArguments.address);

      const signers = await getSigners(hre);
      const contract = await hre.ethers.getContractAt("EncryptedDiceGame", deployment.address);

      console.log(`🔓 Decrypting stake for game ${gameId}...`);

      const encryptedStake = await contract.getGameStake(gameId);

      if (encryptedStake === hre.ethers.ZeroHash) {
        console.log(`📭 No stake found for game ${gameId}`);
        return null;
      }

      const clearStake = await hre.fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedStake,
        deployment.address,
        signers[0],
      );

      console.log(`💰 Game ${gameId} stake: ${clearStake} ROLL`);

      logTaskSuccess(`Stake decrypted successfully`);

      return clearStake;
    } catch (error) {
      console.error("❌ Failed to decrypt stake:", error);
      throw error;
    }
  });

/**
 * Decrypt game dice values (only by game player)
 *
 * Usage:
 *   npx hardhat --network localhost task:decrypt-dice --gameid 0
 *   npx hardhat --network sepolia task:decrypt-dice --gameid 1
 */
task("task:decrypt-dice", "Decrypt game dice values")
  .addOptionalParam("address", "Optionally specify the EncryptedDiceGame contract address")
  .addParam("gameid", "The game ID to decrypt dice values for")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const gameId = validateNonNegativeIntegerParam(taskArguments.gameid, "gameid");

    logTaskStart("decrypt-dice", { gameId });

    try {
      await initializeFHEVM(hre);

      const deployment = await getContractDeployment(hre, "EncryptedDiceGame", taskArguments.address);

      const signers = await getSigners(hre);
      const contract = await hre.ethers.getContractAt("EncryptedDiceGame", deployment.address);

      console.log(`🔓 Decrypting dice values for game ${gameId}...`);

      const encryptedDiceValues = await contract.getGameDiceValues(gameId);

      if (!encryptedDiceValues || encryptedDiceValues.length === 0) {
        console.log(`📭 No dice values found for game ${gameId}`);
        return null;
      }

      const clearDiceValues = [];
      for (let i = 0; i < encryptedDiceValues.length; i++) {
        const clearValue = await hre.fhevm.userDecryptEuint(
          FhevmType.euint32,
          encryptedDiceValues[i],
          deployment.address,
          signers[0],
        );
        clearDiceValues.push(Number(clearValue));
      }

      const sum = clearDiceValues.reduce((a, b) => a + b, 0);
      console.log(`🎲 Game ${gameId} dice values: [${clearDiceValues.join(", ")}]`);
      console.log(`📊 Sum: ${sum} (${sum % 2 === 0 ? "even" : "odd"})`);

      logTaskSuccess(`Dice values decrypted successfully`);

      return {
        diceValues: clearDiceValues,
        sum,
        isEven: sum % 2 === 0,
      };
    } catch (error) {
      console.error("❌ Failed to decrypt dice values:", error);
      throw error;
    }
  });

/**
 * Decrypt player's balance (only by the player themselves)
 *
 * Usage:
 *   npx hardhat --network localhost task:decrypt-balance
 *   npx hardhat --network sepolia task:decrypt-balance --player 0x123...
 */
task("task:decrypt-balance", "Decrypt player's ROLL balance")
  .addOptionalParam("address", "Optionally specify the EncryptedDiceGame contract address")
  .addOptionalParam("player", "Optionally specify the player address (default: first signer)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    logTaskStart("decrypt-balance", { player: taskArguments.player || "first signer" });

    try {
      await initializeFHEVM(hre);

      const deployment = await getContractDeployment(hre, "EncryptedDiceGame", taskArguments.address);

      const signers = await getSigners(hre);
      const playerAddress = taskArguments.player || signers[0].address;
      const contract = await hre.ethers.getContractAt("EncryptedDiceGame", deployment.address);

      console.log(`🔓 Decrypting balance for player: ${playerAddress}...`);

      const encryptedBalance = await contract.getBalance(playerAddress);

      if (encryptedBalance === hre.ethers.ZeroHash) {
        console.log(`💰 Clear balance: 0 ROLL`);
        return 0;
      }

      const clearBalance = await hre.fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedBalance,
        deployment.address,
        signers[0],
      );

      // Convert from wei to ROLL tokens (18 decimals)
      const balanceInEth = Number(clearBalance) / 1e18;
      console.log(`💰 Clear balance: ${clearBalance} (${balanceInEth} ROLL tokens)`);

      logTaskSuccess(`Balance decrypted successfully`);

      return clearBalance;
    } catch (error) {
      console.error("❌ Failed to decrypt balance:", error);
      throw error;
    }
  });
