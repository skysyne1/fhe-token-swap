import type { TaskArguments } from "hardhat/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * Common utilities for tasks
 */

export interface ContractDeployment {
  address: string;
  abi?: any[];
}

/**
 * Get contract deployment info
 */
export async function getContractDeployment(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  addressOverride?: string,
): Promise<ContractDeployment> {
  const { deployments } = hre;

  if (addressOverride) {
    return { address: addressOverride };
  }

  const deployment = await deployments.get(contractName);
  return {
    address: deployment.address,
    abi: deployment.abi,
  };
}

/**
 * Initialize FHEVM for tasks that need encryption/decryption
 */
export async function initializeFHEVM(hre: HardhatRuntimeEnvironment): Promise<void> {
  await hre.fhevm.initializeCLIApi();
}

/**
 * Get signers for tasks
 */
export async function getSigners(hre: HardhatRuntimeEnvironment) {
  return await hre.ethers.getSigners();
}

/**
 * Validate integer parameter
 */
export function validateIntegerParam(value: string, paramName: string): number {
  const parsed = parseInt(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(`Argument --${paramName} must be an integer`);
  }
  return parsed;
}

/**
 * Validate positive integer parameter
 */
export function validatePositiveIntegerParam(value: string, paramName: string): number {
  const parsed = validateIntegerParam(value, paramName);
  if (parsed <= 0) {
    throw new Error(`Argument --${paramName} must be a positive integer`);
  }
  return parsed;
}

/**
 * Validate non-negative integer parameter
 */
export function validateNonNegativeIntegerParam(value: string, paramName: string): number {
  const parsed = validateIntegerParam(value, paramName);
  if (parsed < 0) {
    throw new Error(`Argument --${paramName} must be a non-negative integer`);
  }
  return parsed;
}

/**
 * Log task execution
 */
export function logTaskStart(taskName: string, params?: Record<string, any>): void {
  console.log(`\n🎯 Executing task: ${taskName}`);
  if (params) {
    console.log(`📋 Parameters:`, params);
  }
}

/**
 * Log task success
 */
export function logTaskSuccess(message: string): void {
  console.log(`✅ ${message}`);
}

/**
 * Log task warning
 */
export function logTaskWarning(message: string): void {
  console.log(`⚠️  ${message}`);
}

/**
 * Log task error
 */
export function logTaskError(message: string): void {
  console.log(`❌ ${message}`);
}

/**
 * Wait for transaction and log result
 */
export async function waitForTransaction(
  hre: HardhatRuntimeEnvironment,
  txHash: string,
  operation: string,
): Promise<any> {
  console.log(`⏳ Waiting for transaction: ${txHash}`);

  const receipt = await hre.ethers.provider.waitForTransaction(txHash);

  if (receipt?.status === 1) {
    logTaskSuccess(`${operation} transaction confirmed`);
  } else {
    logTaskError(`${operation} transaction failed`);
  }

  return receipt;
}
