/**
 * Universal FHEVM SDK - Consolidated Instance
 * Complete FHEVM functionality in a single file for NPX packages
 * Includes: FHEVM instance, encryption, and decryption
 * Updated for FHEVM 0.9 with RelayerSDK 0.3.0-5
 */

let fheInstance: any = null;

/**
 * Initialize FHEVM instance
 * Uses CDN for browser environments to avoid bundling issues
 * Updated for RelayerSDK 0.3.0-5 (FHEVM 0.9)
 */
export async function initializeFheInstance(options?: { rpcUrl?: string }) {
  // Detect environment
  if (typeof window !== "undefined" && window.ethereum) {
    // Browser environment
    return initializeBrowserFheInstance();
  } else {
    // Node.js environment - use new functionality
    return initializeNodeFheInstance(options?.rpcUrl);
  }
}

/**
 * Initialize FHEVM instance for browser environment
 */
async function initializeBrowserFheInstance() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error(
      "Ethereum provider not found. Please install MetaMask or connect a wallet."
    );
  }

  // Check for both uppercase and lowercase versions of RelayerSDK
  let sdk = (window as any).RelayerSDK || (window as any).relayerSDK;

  if (!sdk) {
    throw new Error(
      'RelayerSDK not loaded. Please include the script tag in your HTML:\n<script src="https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs"></script>'
    );
  }

  const { initSDK, createInstance, SepoliaConfig } = sdk;

  // Initialize SDK with CDN
  await initSDK();
  console.log("✅ FHEVM SDK initialized with CDN");

  const config = { ...SepoliaConfig, network: window.ethereum };

  try {
    fheInstance = await createInstance(config);
    return fheInstance;
  } catch (err) {
    console.error("FHEVM browser instance creation failed:", err);
    throw err;
  }
}

/**
 * Initialize FHEVM instance for Node.js environment
 * REAL FUNCTIONALITY - uses actual RelayerSDK
 */
async function initializeNodeFheInstance(rpcUrl?: string) {
  try {
    console.log("🚀 Initializing REAL FHEVM Node.js instance...");

    // Use eval to prevent webpack from analyzing these imports
    const relayerSDKModule = await eval('import("@zama-fhe/relayer-sdk/node")');
    const { createInstance, SepoliaConfig, generateKeypair } = relayerSDKModule;

    // Create an EIP-1193 compatible provider for Node.js
    const ethersModule = await eval('import("ethers")');
    const provider = new ethersModule.ethers.JsonRpcProvider(
      rpcUrl || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
    );

    // Create EIP-1193 provider wrapper
    const eip1193Provider = {
      request: async ({
        method,
        params,
      }: {
        method: string;
        params: any[];
      }) => {
        switch (method) {
          case "eth_chainId":
            return "0xaa36a7"; // Sepolia chain ID
          case "eth_accounts":
            return ["---YOUR-ADDRESS-HERE---"];
          case "eth_requestAccounts":
            return ["---YOUR-ADDRESS-HERE---"];
          case "eth_call":
            // Use the real provider for blockchain calls
            return await provider.call(params[0]);
          case "eth_sendTransaction":
            // Use the real provider for transactions
            return await provider.broadcastTransaction(params[0]);
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
      },
      on: () => {},
      removeListener: () => {},
    };

    const config = {
      ...SepoliaConfig,
      network: eip1193Provider,
    };

    fheInstance = await createInstance(config);
    console.log("✅ REAL FHEVM Node.js instance created successfully!");
    return fheInstance;
  } catch (err) {
    console.error("FHEVM Node.js instance creation failed:", err);
    throw err;
  }
}

export function getFheInstance() {
  return fheInstance;
}

/**
 * Decrypt a single encrypted value using EIP-712 user decryption (matches showcase API)
 */
export async function decryptValue(
  encryptedBytes: string,
  contractAddress: string,
  signer: any
): Promise<number> {
  const fhe = getFheInstance();
  if (!fhe)
    throw new Error(
      "FHE instance not initialized. Call initializeFheInstance() first."
    );

  try {
    console.log("🔐 Using EIP-712 user decryption for handle:", encryptedBytes);

    // Get initialized FHE instance
    const fhe = getFheInstance();
    if (!fhe) {
      throw new Error(
        "FHE instance not initialized. Call initializeFheInstance() first."
      );
    }

    // Use EIP-712 user decryption instead of public decryption
    const keypair = fhe.generateKeypair();
    const handleContractPairs = [
      {
        handle: encryptedBytes,
        contractAddress: contractAddress,
      },
    ];

    const startTimeStamp = Math.floor(Date.now() / 1000).toString();
    const durationDays = "10";
    const contractAddresses = [contractAddress];

    const eip712 = fhe.createEIP712(
      keypair.publicKey,
      contractAddresses,
      startTimeStamp,
      durationDays
    );

    const signature = await signer.signTypedData(
      eip712.domain,
      {
        UserDecryptRequestVerification:
          eip712.types.UserDecryptRequestVerification,
      },
      eip712.message
    );

    const result = await fhe.userDecrypt(
      handleContractPairs,
      keypair.privateKey,
      keypair.publicKey,
      signature.replace("0x", ""),
      contractAddresses,
      await signer.getAddress(),
      startTimeStamp,
      durationDays
    );

    return Number(result[encryptedBytes]);
  } catch (error: any) {
    // Check for relayer/network error
    if (
      error?.message?.includes("Failed to fetch") ||
      error?.message?.includes("NetworkError")
    ) {
      throw new Error(
        "Decryption service is temporarily unavailable. Please try again later."
      );
    }
    throw error;
  }
}

/**
 * Batch decrypt multiple encrypted values using EIP-712 user decryption
 */
export async function batchDecryptValues(
  handles: string[],
  contractAddress: string,
  signer: any
): Promise<Record<string, number>> {
  const fhe = getFheInstance();
  if (!fhe)
    throw new Error(
      "FHE instance not initialized. Call initializeFheInstance() first."
    );

  try {
    console.log("🔐 Using EIP-712 batch user decryption for handles:", handles);

    const keypair = fhe.generateKeypair();
    const handleContractPairs = handles.map((handle) => ({
      handle,
      contractAddress: contractAddress,
    }));

    const startTimeStamp = Math.floor(Date.now() / 1000).toString();
    const durationDays = "10";
    const contractAddresses = [contractAddress];

    const eip712 = fhe.createEIP712(
      keypair.publicKey,
      contractAddresses,
      startTimeStamp,
      durationDays
    );

    const signature = await signer.signTypedData(
      eip712.domain,
      {
        UserDecryptRequestVerification:
          eip712.types.UserDecryptRequestVerification,
      },
      eip712.message
    );

    const result = await fhe.userDecrypt(
      handleContractPairs,
      keypair.privateKey,
      keypair.publicKey,
      signature.replace("0x", ""),
      contractAddresses,
      await signer.getAddress(),
      startTimeStamp,
      durationDays
    );

    // Convert result to numbers
    const decryptedValues: Record<string, number> = {};
    for (const handle of handles) {
      decryptedValues[handle] = Number(result[handle]);
    }

    return decryptedValues;
  } catch (error: any) {
    if (
      error?.message?.includes("Failed to fetch") ||
      error?.message?.includes("NetworkError")
    ) {
      throw new Error(
        "Decryption service is temporarily unavailable. Please try again later."
      );
    }
    throw error;
  }
}

/**
 * Encrypt values using FHEVM
 *
 * 📝 BIT SIZE SUPPORT:
 * FHEVM supports different bit sizes for encrypted values. If your contract uses a different bit size
 * than the default 32-bit, you can use the appropriate method:
 * - add8(value)   - for 8-bit values (0-255)
 * - add16(value) - for 16-bit values (0-65535)
 * - add32(value) - for 32-bit values (0-4294967295) - DEFAULT
 * - add64(value) - for 64-bit values (0-18446744073709551615)
 * - add128(value) - for 128-bit values
 * - add256(value) - for 256-bit values
 *
 * Example: If your contract expects 8-bit values, replace add32() with add8()
 */
export async function encryptValue(
  contractAddress: string,
  address: string,
  plainDigits: number[]
) {
  const relayer = getFheInstance();
  if (!relayer) throw new Error("FHEVM not initialized");

  const inputHandle = relayer.createEncryptedInput(contractAddress, address);
  for (const d of plainDigits) {
    inputHandle.add8(d);
  }

  const ciphertextBlob = await inputHandle.encrypt();
  return ciphertextBlob;
}

/**
 * Create encrypted input for contract interaction (matches showcase API)
 */
export async function createEncryptedInput(
  contractAddress: string,
  userAddress: string,
  value: number
) {
  const fhe = getFheInstance();
  if (!fhe)
    throw new Error(
      "FHE instance not initialized. Call initializeFheInstance() first."
    );

  console.log(
    `🔐 Creating encrypted input for contract ${contractAddress}, user ${userAddress}, value ${value}`
  );

  const inputHandle = fhe.createEncryptedInput(contractAddress, userAddress);
  inputHandle.add32(value);
  const result = await inputHandle.encrypt();

  console.log("✅ Encrypted input created successfully");
  console.log("🔍 Encrypted result structure:", result);

  // The FHEVM SDK returns an object with handles and inputProof
  // We need to extract the correct values for the contract
  if (result && typeof result === "object") {
    // If result has handles array, use the first handle
    if (
      result.handles &&
      Array.isArray(result.handles) &&
      result.handles.length > 0
    ) {
      return {
        encryptedData: result.handles[0],
        proof: result.inputProof,
      };
    }
    // If result has encryptedData and proof properties
    else if (result.encryptedData && result.proof) {
      return {
        encryptedData: result.encryptedData,
        proof: result.proof,
      };
    }
    // Fallback: use the result as-is
    else {
      return {
        encryptedData: result,
        proof: result,
      };
    }
  }

  // If result is not an object, use it directly
  return {
    encryptedData: result,
    proof: result,
  };
}

/**
 * Public decryption for a single handle
 * Returns the decrypted number value
 * @param {string} encryptedBytes - Single handle to decrypt
 * @returns {Promise<number>} Decrypted number value
 */
export async function publicDecrypt(encryptedBytes: string): Promise<number> {
  const fhe = getFheInstance();
  if (!fhe)
    throw new Error(
      "FHE instance not initialized. Call initializeFheInstance() first."
    );

  try {
    let handle = encryptedBytes;
    if (
      typeof handle === "string" &&
      handle.startsWith("0x") &&
      handle.length === 66
    ) {
      console.log("🔓 Calling publicDecrypt with handle:", handle);
      const result = await fhe.publicDecrypt([handle]);
      console.log("🔓 publicDecrypt returned:", result);

      // SDK 0.3.0-5 returns: {clearValues: {...}, abiEncodedClearValues: '...', decryptionProof: '...'}
      let decryptedValue;

      if (result && typeof result === "object") {
        // Check for SDK 0.3.0-5 format with clearValues
        if (result.clearValues && typeof result.clearValues === "object") {
          // The decrypted value is in clearValues[handle] as a BigInt
          decryptedValue = result.clearValues[handle];
          console.log("🔓 Extracted from clearValues:", decryptedValue);
          console.log("🔓 Value type:", typeof decryptedValue);
          console.log("🔓 Is BigInt?", typeof decryptedValue === "bigint");
        } else if (Array.isArray(result)) {
          // Legacy array format
          decryptedValue = result[0];
          console.log("🔓 Extracted from array:", decryptedValue);
        } else {
          // Try direct handle lookup (legacy format)
          decryptedValue = result[handle] || Object.values(result)[0];
          console.log("🔓 Extracted from object:", decryptedValue);
        }
      } else {
        // Direct value
        decryptedValue = result;
        console.log("🔓 Direct value:", decryptedValue);
      }

      // Convert BigInt or number to regular number
      let numberValue;
      if (typeof decryptedValue === "bigint") {
        numberValue = Number(decryptedValue);
        console.log("🔓 Converted BigInt to number:", numberValue);
      } else {
        numberValue = Number(decryptedValue);
        console.log("🔓 Converted to number:", numberValue);
      }

      if (isNaN(numberValue)) {
        console.error("❌ Decryption returned NaN. Raw value:", decryptedValue);
        console.error("❌ Full response structure:", {
          hasClearValues: !!result?.clearValues,
          hasAbiEncoded: !!result?.abiEncodedClearValues,
          hasProof: !!result?.decryptionProof,
          clearValuesKeys: result?.clearValues
            ? Object.keys(result.clearValues)
            : [],
        });
        throw new Error(`Decryption returned invalid value: ${decryptedValue}`);
      }

      console.log("🔓 Final number value:", numberValue);
      return numberValue;
    } else {
      throw new Error("Invalid ciphertext handle for decryption");
    }
  } catch (error: any) {
    console.error("❌ Decryption error:", error);
    if (
      error?.message?.includes("Failed to fetch") ||
      error?.message?.includes("NetworkError")
    ) {
      throw new Error(
        "Decryption service is temporarily unavailable. Please try again later."
      );
    }
    throw error;
  }
}

/**
 * Get contract instance with ethers
 */
export function getContract(address: string, abi: any, signerOrProvider: any) {
  const { ethers } = require("ethers");
  return new ethers.Contract(address, abi, signerOrProvider);
}

/**
 * Get provider instance
 */
export function getProvider(rpcUrl?: string) {
  const { ethers } = require("ethers");
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  } else if (rpcUrl) {
    return new ethers.JsonRpcProvider(rpcUrl);
  }
  throw new Error("No provider available");
}

/**
 * Get signer instance
 */
export async function getSigner() {
  const { ethers } = require("ethers");
  if (typeof window !== "undefined" && window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    return await provider.getSigner();
  }
  throw new Error("No signer available - MetaMask required");
}

/**
 * Initialize FHEVM for React/Next.js apps
 */
export async function initializeFhevm(options?: { rpcUrl?: string }) {
  return initializeFheInstance(options);
}

/**
 * Generic encrypt function for the hooks
 */
export async function encrypt(
  value: number | boolean | string,
  contractAddress: string,
  userAddress: string
) {
  const numValue = typeof value === "number" ? value : Number(value);
  return createEncryptedInput(contractAddress, userAddress, numValue);
}
