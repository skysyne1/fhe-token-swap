/**
 * EncryptedDiceGame Tasks - Legacy Import
 * ======================================
 *
 * This file now imports all tasks from the organized structure.
 * Tasks have been split into multiple files for better maintainability:
 *
 * - EncryptedDiceGame/address.ts: Contract address utilities
 * - EncryptedDiceGame/tokens.ts: Token minting and balance management
 * - EncryptedDiceGame/swap.ts: ETH ↔ ROLL token swapping
 * - EncryptedDiceGame/game.ts: Game lifecycle (start, resolve, get details)
 * - EncryptedDiceGame/decrypt.ts: Encrypted data decryption
 *
 * All tasks are available with the same commands as before.
 */

// Import all organized tasks
import "./EncryptedDiceGame/";

export {};

/**
 * Usage Documentation
 * ===================
 *
 * All tasks are now organized in separate files for better maintainability.
 * All commands remain the same as before:
 *
 * Contract Info:
 *   npx hardhat --network localhost task:dice-address
 *
 * Token Management:
 *   npx hardhat --network localhost task:mint-tokens --amount 1000
 *   npx hardhat --network localhost task:get-balance
 *
 * Token Swapping:
 *   npx hardhat --network localhost task:swap-eth-for-roll --eth 0.1
 *   npx hardhat --network localhost task:swap-roll-for-eth --roll 1000
 *
 * Game Operations:
 *   npx hardhat --network localhost task:start-game --dice 2 --prediction 0 --stake 100
 *   npx hardhat --network localhost task:resolve-game --gameid 0
 *   npx hardhat --network localhost task:get-game --gameid 0
 *
 * Decryption (player only):
 *   npx hardhat --network localhost task:decrypt-prediction --gameid 0
 *   npx hardhat --network localhost task:decrypt-stake --gameid 0
 *   npx hardhat --network localhost task:decrypt-dice --gameid 0
 */
