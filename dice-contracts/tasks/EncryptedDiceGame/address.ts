import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { getContractDeployment, logTaskStart, logTaskSuccess } from "../common/utils";

/**
 * Contract Address Task
 * ====================
 * Get the deployed EncryptedDiceGame contract address
 *
 * Usage:
 *   npx hardhat --network localhost task:dice-address
 *   npx hardhat --network sepolia task:dice-address
 */

task("task:dice-address", "Prints the EncryptedDiceGame contract address").setAction(async function (
  _taskArguments: TaskArguments,
  hre,
) {
  logTaskStart("dice-address");

  try {
    const deployment = await getContractDeployment(hre, "EncryptedDiceGame");

    console.log(`📍 EncryptedDiceGame contract address: ${deployment.address}`);
    logTaskSuccess("Contract address retrieved successfully");

    return deployment.address;
  } catch (error) {
    console.error("❌ Failed to get contract address:", error);
    throw error;
  }
});
