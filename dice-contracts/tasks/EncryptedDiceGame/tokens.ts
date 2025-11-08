import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import {
  getContractDeployment,
  getSigners,
  validatePositiveIntegerParam,
  logTaskStart,
  logTaskSuccess,
  waitForTransaction,
} from "../common/utils";

/**
 * Token Management Tasks
 * ======================
 * Handle ROLL token minting and balance operations
 */

/**
 * Mint ROLL tokens for testing
 *
 * Usage:
 *   npx hardhat --network localhost task:mint-tokens --amount 1000
 *   npx hardhat --network sepolia task:mint-tokens --amount 500
 */
task("task:mint-tokens", "Mint ROLL tokens for testing")
  .addOptionalParam("address", "Optionally specify the EncryptedDiceGame contract address")
  .addParam("amount", "The amount of ROLL tokens to mint")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const amount = validatePositiveIntegerParam(taskArguments.amount, "amount");

    logTaskStart("mint-tokens", { amount });

    try {
      const deployment = await getContractDeployment(hre, "EncryptedDiceGame", taskArguments.address);

      const signers = await getSigners(hre);
      const contract = await hre.ethers.getContractAt("EncryptedDiceGame", deployment.address);

      console.log(`🪙 Minting ${amount} ROLL tokens...`);

      const tx = await contract.connect(signers[0]).mintTokens(amount);
      await waitForTransaction(hre, tx.hash, "Mint tokens");

      logTaskSuccess(`Minted ${amount} ROLL tokens successfully!`);

      return tx.hash;
    } catch (error) {
      console.error("❌ Failed to mint tokens:", error);
      throw error;
    }
  });

/**
 * Get player's encrypted balance
 *
 * Usage:
 *   npx hardhat --network localhost task:get-balance
 *   npx hardhat --network localhost task:get-balance --player 0x123...
 */
task("task:get-balance", "Get player's encrypted ROLL balance")
  .addOptionalParam("address", "Optionally specify the EncryptedDiceGame contract address")
  .addOptionalParam("player", "Optionally specify the player address (default: first signer)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    logTaskStart("get-balance", { player: taskArguments.player || "first signer" });

    try {
      const deployment = await getContractDeployment(hre, "EncryptedDiceGame", taskArguments.address);

      const signers = await getSigners(hre);
      const playerAddress = taskArguments.player || signers[0].address;
      const contract = await hre.ethers.getContractAt("EncryptedDiceGame", deployment.address);

      console.log(`👤 Getting balance for player: ${playerAddress}`);

      const encryptedBalance = await contract.getBalance(playerAddress);

      console.log(`🔐 Encrypted balance: ${encryptedBalance}`);

      if (encryptedBalance === hre.ethers.ZeroHash) {
        console.log("💰 Clear balance: 0 ROLL");
        return 0;
      }

      // In a real implementation, you would decrypt the balance here
      // For demo purposes, we'll show the encrypted value
      console.log("💰 Balance is encrypted and can only be decrypted by the owner");

      logTaskSuccess("Balance retrieved successfully");

      return encryptedBalance;
    } catch (error) {
      console.error("❌ Failed to get balance:", error);
      throw error;
    }
  });
