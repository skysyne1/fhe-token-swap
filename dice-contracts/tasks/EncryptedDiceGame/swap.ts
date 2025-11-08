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
 * Token Swap Tasks
 * ================
 * Handle ETH ↔ ROLL token swapping
 */

/**
 * Swap ETH for ROLL tokens
 *
 * Usage:
 *   npx hardhat --network localhost task:swap-eth-for-roll --eth 0.1
 *   npx hardhat --network sepolia task:swap-eth-for-roll --eth 0.05
 */
task("task:swap-eth-for-roll", "Swap ETH for ROLL tokens")
  .addOptionalParam("address", "Optionally specify the EncryptedDiceGame contract address")
  .addParam("eth", "Amount of ETH to swap")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const ethAmount = parseFloat(taskArguments.eth);
    if (isNaN(ethAmount) || ethAmount <= 0) {
      throw new Error(`Argument --eth must be a positive number`);
    }

    logTaskStart("swap-eth-for-roll", { ethAmount });

    try {
      const deployment = await getContractDeployment(hre, "EncryptedDiceGame", taskArguments.address);

      const signers = await getSigners(hre);
      const contract = await hre.ethers.getContractAt("EncryptedDiceGame", deployment.address);

      const ethWei = hre.ethers.parseEther(ethAmount.toString());
      const expectedRollAmount = ethAmount * 1000; // 1 ETH = 1000 ROLL

      console.log(`💱 Swapping ${ethAmount} ETH for ${expectedRollAmount} ROLL tokens...`);

      const tx = await contract.connect(signers[0]).swapETHForROLL({ value: ethWei });
      await waitForTransaction(hre, tx.hash, "ETH to ROLL swap");

      logTaskSuccess(`Swapped ${ethAmount} ETH for ${expectedRollAmount} ROLL tokens!`);

      return tx.hash;
    } catch (error) {
      console.error("❌ Failed to swap ETH for ROLL:", error);
      throw error;
    }
  });

/**
 * Swap ROLL tokens for ETH
 *
 * Usage:
 *   npx hardhat --network localhost task:swap-roll-for-eth --roll 1000
 *   npx hardhat --network sepolia task:swap-roll-for-eth --roll 500
 */
task("task:swap-roll-for-eth", "Swap ROLL tokens for ETH")
  .addOptionalParam("address", "Optionally specify the EncryptedDiceGame contract address")
  .addParam("roll", "Amount of ROLL tokens to swap")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const rollAmount = validatePositiveIntegerParam(taskArguments.roll, "roll");

    logTaskStart("swap-roll-for-eth", { rollAmount });

    try {
      const deployment = await getContractDeployment(hre, "EncryptedDiceGame", taskArguments.address);

      const signers = await getSigners(hre);
      const contract = await hre.ethers.getContractAt("EncryptedDiceGame", deployment.address);

      const expectedEthAmount = rollAmount / 1000; // 1000 ROLL = 1 ETH

      console.log(`💱 Swapping ${rollAmount} ROLL for ${expectedEthAmount} ETH...`);

      // Note: This requires proper FHEVM encryption in production
      // For demo, we'll use a placeholder encrypted value
      const dummyEncryptedAmount = `0x${rollAmount.toString(16).padStart(64, "0")}`;
      const dummyProof = "0x";

      const tx = await contract.connect(signers[0]).swapROLLForETH(dummyEncryptedAmount, dummyProof);
      await waitForTransaction(hre, tx.hash, "ROLL to ETH swap");

      logTaskSuccess(`Swapped ${rollAmount} ROLL for ${expectedEthAmount} ETH!`);

      return tx.hash;
    } catch (error) {
      console.error("❌ Failed to swap ROLL for ETH:", error);
      throw error;
    }
  });
