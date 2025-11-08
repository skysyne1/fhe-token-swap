/**
 * EncryptedDiceGame Tasks Index
 * =============================
 *
 * This file imports all EncryptedDiceGame tasks to make them available
 * when the tasks directory is loaded by Hardhat.
 *
 * Tasks are organized by functionality:
 * - address.ts: Contract address utilities
 * - tokens.ts: Token minting and balance management
 * - swap.ts: ETH ↔ ROLL token swapping
 * - game.ts: Game lifecycle (start, resolve, get details)
 * - decrypt.ts: Encrypted data decryption
 */

// Import all task modules
import "./address";
import "./tokens";
import "./swap";
import "./game";
import "./decrypt";

export {}; // Ensure this is treated as a module
