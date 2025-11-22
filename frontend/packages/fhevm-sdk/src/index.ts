/**
 * Universal FHEVM SDK
 * Clean, simple implementation that actually works
 */

// Core FHEVM functionality
export * from "./core/index.js";

// Framework adapters - explicit exports to avoid conflicts
export {
  useContract,
  useDecrypt,
  useEncrypt,
  useFhevm,
} from "./adapters/react.js";
