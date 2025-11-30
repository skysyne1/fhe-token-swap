"use client";

import { useCallback, useEffect, useState } from "react";
import { EncryptedDiceGameABI } from "../abi/EncryptedDiceGameABI";
import { getEncryptedDiceGameAddress } from "../abi/EncryptedDiceGameAddresses";
import { useDecryptedBalance } from "../contexts/DecryptedBalanceContext";
import { ethers } from "ethers";
import { initializeFheInstance, useContract, useEncrypt } from "fhevm-sdk";
import { decodeEventLog } from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWalletClient,
  useWriteContract,
} from "wagmi";

// Maximum gas limit to avoid "transaction gas limit too high" error
// Network cap is 16,777,216 (2^24), using 16.6M as safe limit
// With struct optimization, gas should be lower but we set limit to ensure transaction passes

export type GameRecord = {
  id: number;
  diceCount: number;
  prediction: "even" | "odd";
  stake: number;
  result?: number[];
  won?: boolean;
  payout?: number;
  timestamp: number;
  isResolved: boolean;
};

export function useEncryptedDiceGame() {
  const { address: walletAddress, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // FHEVM instance state
  const [isInitialized, setIsInitialized] = useState(false);
  const [fhevmStatus, setFhevmStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  // New FHEVM 0.9 hooks
  const { encrypt, isEncrypting, error: encryptError } = useEncrypt();

  // Initialize FHEVM on component mount
  // According to Zama documentation, FHEVM only works on Sepolia (chainId: 11155111)
  useEffect(() => {
    const initFhevm = async () => {
      // Only initialize if we have a chainId and it's Sepolia
      const SEPOLIA_CHAIN_ID = 11155111;
      if (!chainId) {
        setFhevmStatus("idle");
        return;
      }

      if (chainId !== SEPOLIA_CHAIN_ID) {
        console.warn(
          `⚠️ FHEVM is only supported on Sepolia testnet (chainId: ${SEPOLIA_CHAIN_ID}). ` +
          `Current network chainId: ${chainId}. FHEVM features will not be available.`
        );
        setFhevmStatus("error");
        return;
      }

      try {
        setFhevmStatus("loading");
        await initializeFheInstance({ chainId });
        setIsInitialized(true);
        setFhevmStatus("ready");
        console.log("✅ FHEVM initialized successfully");
      } catch (error) {
        console.error("❌ FHEVM initialization failed:", error);
        setFhevmStatus("error");
      }
    };

    if (typeof window !== "undefined" && window.ethereum) {
      initFhevm();
    }
  }, [chainId]);

  // Contract info
  const contractAddress = chainId ? getEncryptedDiceGameAddress(chainId) : undefined;

  // Auto-clear cache when contract address changes
  const { clearCache } = useDecryptedBalance();

  useEffect(() => {
    const STORAGE_KEY = "fhe-dice-contract-address";

    if (contractAddress) {
      try {
        const savedAddress = localStorage.getItem(STORAGE_KEY);

        if (savedAddress && savedAddress !== contractAddress) {
          console.log("🔄 Contract address changed, clearing cache...");
          console.log("  Old:", savedAddress);
          console.log("  New:", contractAddress);
          clearCache();
        }

        localStorage.setItem(STORAGE_KEY, contractAddress);
      } catch (error) {
        console.warn("Failed to handle contract address change:", error);
      }
    }
  }, [contractAddress, clearCache]);

  // Wagmi hooks
  const { writeContractAsync, data: writeData, isPending: isWritePending } = useWriteContract();
  const { isLoading: isTransactionLoading } = useWaitForTransactionReceipt({
    hash: writeData,
  });

  // Contract hook from new SDK
  const { contract: readContract } = useContract(contractAddress || "", EncryptedDiceGameABI as any);

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameHistory, setGameHistory] = useState<GameRecord[]>([]);
  const [encryptedBalance, setEncryptedBalance] = useState<string>("");
  const [decryptedBalance, setDecryptedBalance] = useState<number | undefined>(undefined);

  // Note: FHEVM initialization is handled by the useEffect above
  // Helper: convert Uint8Array or other types to 0x-prefixed hex string for viem/wagmi
  const toHexString = (value: any): `0x${string}` => {
    if (!value) return "0x" as `0x${string}`;

    if (typeof value === "string") {
      return (value.startsWith("0x") ? value : `0x${value}`) as `0x${string}`;
    }

    if (value instanceof Uint8Array) {
      const hex = Array.from(value)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
      return (`0x${hex}`) as `0x${string}`;
    }

    // Fallback: try toString and wrap
    const str = String(value);
    return (`0x${str.replace(/^0x/, "")}`) as `0x${string}`;
  };

  // Read encrypted balance using new pattern
  const { data: contractBalance, refetch: refetchBalance } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: EncryptedDiceGameABI,
    functionName: "getBalance",
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: Boolean(walletAddress && contractAddress),
    },
  });

  // Update encrypted balance when contract data changes
  useEffect(() => {
    console.log("📊 Contract balance update:", contractBalance);
    if (contractBalance) {
      let balanceStr: string;
      if (typeof contractBalance === "bigint") {
        balanceStr = "0x" + contractBalance.toString(16);
      } else if (typeof contractBalance === "string") {
        balanceStr = contractBalance;
      } else {
        balanceStr = String(contractBalance);
      }
      console.log("💰 Setting encrypted balance:", balanceStr);
      setEncryptedBalance(balanceStr);
    }
  }, [contractBalance]);

  // Monitor transaction state
  useEffect(() => {
    if (writeData) {
      console.log("📝 Transaction hash received:", writeData);
    }
  }, [writeData]);

  // Read game counter
  const { data: gameCounter, refetch: refetchGameCounter } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: EncryptedDiceGameABI,
    functionName: "gameCounter",
    query: {
      enabled: Boolean(contractAddress),
    },
  });

  // Load game history from blockchain using events (playerGames mapping removed for gas optimization)
  useEffect(() => {
    const loadGameHistory = async () => {
      if (!walletAddress || !contractAddress || !publicClient) return;

      try {
        // Query GameStarted events to get all games for this player
        const events = await publicClient.getLogs({
          address: contractAddress as `0x${string}`,
          event: {
            type: "event",
            name: "GameStarted",
            inputs: [
              { type: "uint256", indexed: true, name: "gameId" },
              { type: "address", indexed: true, name: "player" },
              { type: "uint256", indexed: false, name: "timestamp" },
            ],
          },
          args: {
            player: walletAddress as `0x${string}`,
          },
          fromBlock: 0n,
        });

        const gameIds = events.map((event: any) => {
          const gameId = (event.args as any).gameId;
          return typeof gameId === "bigint" ? gameId : BigInt(gameId);
        });

        const games: GameRecord[] = [];

        for (const gameId of gameIds) {
          const gameData = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: EncryptedDiceGameABI,
            functionName: "getGame",
            args: [gameId],
          });

          if (gameData) {
            const gameDataArray = gameData as unknown as any[];
            const [player, timestamp, isResolved] = gameDataArray;

            games.push({
              id: Number(gameId),
              diceCount: 1, // Always 1 die
              prediction: "even", // Default, actual prediction is encrypted
              stake: 0, // Default, actual stake is encrypted
              timestamp: Number(timestamp),
              isResolved: Boolean(isResolved),
            });
          }
        }

        setGameHistory(games.sort((a, b) => b.timestamp - a.timestamp));
      } catch (error) {
        console.error("Failed to load game history:", error);
      }
    };

    loadGameHistory();
  }, [walletAddress, contractAddress, publicClient]);

  // Note: makeBalancePublic removed as function doesn't exist in current ABI

  // Mint tokens for testing
  const mintTokens = useCallback(
    async (amount: number) => {
      console.log("🎯 mintTokens called with:", { amount, contractAddress, walletAddress });

      if (!contractAddress || !walletAddress) {
        console.error("❌ Missing required data:", { contractAddress, walletAddress });
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log("🪙 Calling writeContractAsync...", {
          address: contractAddress,
          functionName: "mintTokens",
          args: [amount],
        });

        const txHash = await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: EncryptedDiceGameABI,
          functionName: "mintTokens",
          args: [BigInt(amount)], // Contract only takes amount, msg.sender is used automatically
        });

        console.log("✅ Mint transaction submitted!", txHash);
      } catch (error: any) {
        console.error("❌ Mint tokens failed:", error);

        // Better error messages
        let errorMessage = "Failed to mint tokens";
        if (error?.message?.includes("rejected")) {
          errorMessage = "Transaction was rejected";
        } else if (error?.message?.includes("insufficient funds")) {
          errorMessage = "Insufficient ETH for gas fees";
        } else if (error?.message?.includes("user denied")) {
          errorMessage = "Transaction was denied by user";
        }

        setError(errorMessage);
        throw error; // Re-throw so handleMintTokens can catch it
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, walletAddress, writeContractAsync],
  );

  // Swap ETH for ROLL tokens
  // Contract uses euint32 with normalized ROLL units (no decimals)
  // Rate: 1 ETH = 1000 ROLL (ROLL has no decimals, 1 ROLL = 1 unit)
  const swapETHForROLL = useCallback(
    async (ethAmount: number) => {
      if (!contractAddress || !walletAddress) return;

      try {
        setIsLoading(true);
        setError(null);

        // Rate: 1 ETH = 1000 ROLL (ROLL without decimals)
        const expectedROLL = ethAmount * 1000;
        console.log(`🔄 Swapping ${ethAmount} ETH for ${expectedROLL} ROLL units`);

        // Contract calculation: rollAmount = (msg.value * ROLL_TOKEN_RATE) / 1e18
        // With msg.value in wei and ROLL_TOKEN_RATE = 1000:
        // For 1 ETH (1e18 wei): rollAmount = (1e18 * 1000) / 1e18 = 1000 ROLL units
        // Max: uint32.max = 4,294,967,295, so max ~4.3M ROLL = ~4,300 ETH

        // Check if expected ROLL amount fits in uint32
        if (expectedROLL > 4294967295) {
          throw new Error(`Amount too large - maximum ~4.3M ROLL (${4294967295 / 1000} ETH) per transaction`);
        }

        // Convert ETH to wei
        const ethAmountWei = BigInt(Math.round(ethAmount * 1e18));
        console.log(`📊 Sending ${ethAmountWei.toString()} wei to contract`);
        console.log(`📊 Expected ROLL: ${expectedROLL} ROLL units (no decimals)`);

        const txHash = await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: EncryptedDiceGameABI,
          functionName: "swapETHForROLL",
          args: [],
          value: ethAmountWei,
        });
        console.log("✅ ETH→ROLL swap transaction submitted!", txHash);
      } catch (error) {
        console.error("Swap ETH for ROLL failed:", error);
        setError("Failed to swap ETH for ROLL");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, walletAddress, writeContractAsync],
  );

  // Swap ROLL for ETH tokens
  const swapROLLForETH = useCallback(
    async (rollAmount: number) => {
      // Validate prerequisites explicitly so we know why MetaMask doesn't open
      if (!contractAddress) {
        const err = new Error("Contract address is not available");
        console.error(err);
        setError(err.message);
        throw err;
      }

      if (!walletAddress) {
        const err = new Error("Wallet not connected");
        console.error(err);
        setError(err.message);
        throw err;
      }

      if (!walletClient) {
        const err = new Error("Wallet client not ready. Please reconnect your wallet.");
        console.error(err);
        setError(err.message);
        throw err;
      }

      if (!isInitialized) {
        const err = new Error("FHEVM not initialized. Please wait a moment and try again.");
        console.error(err);
        setError(err.message);
        throw err;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log(`🔄 Swapping ${rollAmount} ROLL for ETH`);

        // Encrypt ROLL amount
        const encryptedAmount = await encrypt(contractAddress, walletAddress, rollAmount);
        console.log("🔐 Encrypted data structure:", encryptedAmount);

        const txHash = await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: EncryptedDiceGameABI,
          functionName: "swapROLLForETH",
          args: [
            rollAmount, // plaintext rollAmount (uint32)
            toHexString(encryptedAmount.encryptedData), // encrypted handle from FHEVM SDK
            toHexString(encryptedAmount.proof), // proof from encrypted data
          ],
        });

        console.log("✅ ROLL→ETH swap transaction submitted!", txHash);
        // Note: Transaction confirmation will be handled by the component using useWaitForTransactionReceipt
      } catch (error) {
        console.error("Swap ROLL for ETH failed:", error);
        setError("Failed to swap ROLL for ETH");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, walletAddress, walletClient, writeContractAsync, isInitialized, encrypt],
  );

  // Roll dice - simplified with off-chain dice generation
  const rollDice = useCallback(
    async (prediction: "even" | "odd", stakeAmount: number): Promise<{ won: boolean; diceResult: number; payout: number } | null> => {
      if (!contractAddress || !walletAddress || !walletClient || !isInitialized || !publicClient) {
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log("🎲 Rolling dice (off-chain generation with FHE)...");

        // Generate random dice value off-chain (1-6)
        const diceValue = Math.floor(Math.random() * 6) + 1;
        // Calculate dice parity off-chain (0=even, 1=odd)
        const diceParity = diceValue % 2 === 0 ? 0 : 1;
        console.log("🎲 Generated dice value off-chain:", diceValue, "Parity:", diceParity === 0 ? "even" : "odd");

        // Encrypt prediction, dice value, and dice parity with FHE
        const predictionValue = prediction === "even" ? 0 : 1;
        const encryptedPrediction = await encrypt(contractAddress, walletAddress, predictionValue);
        const encryptedDiceValue = await encrypt(contractAddress, walletAddress, diceValue);
        const encryptedDiceParity = await encrypt(contractAddress, walletAddress, diceParity);

        console.log("✅ Encryption completed, submitting transaction...");

        // Submit rollDice transaction with encrypted prediction, dice value, and dice parity
        const txHash = await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: EncryptedDiceGameABI,
          functionName: "rollDice",
          args: [
            toHexString(encryptedPrediction.encryptedData), // encryptedPrediction
            toHexString(encryptedPrediction.proof), // predictionProof
            toHexString(encryptedDiceValue.encryptedData), // encryptedDiceValue
            toHexString(encryptedDiceValue.proof), // diceValueProof
            toHexString(encryptedDiceParity.encryptedData), // encryptedDiceParity
            toHexString(encryptedDiceParity.proof), // diceParityProof
            stakeAmount, // stakeAmount as plaintext uint32
          ],
        });

        console.log("✅ Roll dice transaction submitted! Waiting for confirmation...", txHash);

        // Wait for transaction to be confirmed
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        console.log("✅ Transaction confirmed! Parsing GameResolved event...", receipt);

        // Parse GameResolved event from receipt to get actual results
        const gameResolvedEvent = receipt.logs.find((log) => {
          try {
            const decoded: any = decodeEventLog({
              abi: EncryptedDiceGameABI as any,
              data: log.data,
              topics: log.topics,
            });
            return decoded.eventName === "GameResolved";
          } catch {
            return false;
          }
        });

        if (!gameResolvedEvent) {
          console.error("❌ GameResolved event not found in transaction receipt");
          setError("Failed to find GameResolved event in transaction");
          return null;
        }

        // Calculate win/lose based on dice value and prediction
        // diceParity was already calculated above, reuse it
        const predictionParity = prediction === "even" ? 0 : 1;
        const won = diceParity === predictionParity;
        const payout = won ? stakeAmount * 2 : 0;

        console.log("✅ Game resolved! Dice:", diceValue, "Won:", won, "Payout:", payout);

        return { won, diceResult: diceValue, payout };
      } catch (error) {
        console.error("Roll dice failed:", error);
        setError(encryptError || "Failed to roll dice");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, walletAddress, walletClient, isInitialized, encrypt, encryptError, writeContractAsync, publicClient],
  );

  // Start encrypted game using FHEVM 0.9 pattern (DEPRECATED - use rollDice instead)
  const startGame = useCallback(
    async (prediction: "even" | "odd", stakeAmount: number): Promise<number | null> => {
      if (!contractAddress || !walletAddress || !walletClient || !isInitialized || !publicClient) {
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log("🎲 Starting encrypted game (only prediction encrypted)...");

        // Only encrypt prediction (0 = even, 1 = odd) - this reduces gas cost significantly
        // Stake amount is sent as plaintext (uint32) to reduce gas cost
        const predictionValue = prediction === "even" ? 0 : 1;
        const encryptedPrediction = await encrypt(contractAddress, walletAddress, predictionValue);

        console.log("✅ Encryption completed, submitting transaction...");

        // Submit game transaction
        // Only prediction is encrypted, stake amount is plaintext (uint32)
        // This reduces gas cost by ~50% compared to encrypting both values
        // diceCount removed - always uses 1 die
        const txHash = await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: EncryptedDiceGameABI,
          functionName: "startGame",
          args: [
            toHexString(encryptedPrediction.encryptedData), // encryptedPrediction
            toHexString(encryptedPrediction.proof), // predictionProof
            stakeAmount, // stakeAmount as plaintext uint32
          ],
        });

        console.log("✅ Start game transaction submitted! Waiting for confirmation...", txHash);

        // Wait for transaction to be confirmed
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        console.log("✅ Transaction confirmed! Parsing GameStarted event...", receipt);

        // Parse GameStarted event from receipt to get actual gameId
        const gameStartedEvent = receipt.logs.find((log) => {
          try {
            // Try to decode as GameStarted event
            const decoded: any = decodeEventLog({
              abi: EncryptedDiceGameABI as any,
              data: log.data,
              topics: log.topics,
            });
            return decoded.eventName === "GameStarted";
          } catch {
            return false;
          }
        });

        if (!gameStartedEvent) {
          console.error("❌ GameStarted event not found in transaction receipt");
          setError("Failed to find GameStarted event in transaction");
          return null;
        }

        // Decode the event to get gameId
        const decodedEvent: any = decodeEventLog({
          abi: EncryptedDiceGameABI as any,
          data: gameStartedEvent.data,
          topics: gameStartedEvent.topics,
        });

        const gameId = Number(decodedEvent.args.gameId);
        console.log("✅ Game started with gameId:", gameId);

        return gameId;
      } catch (error) {
        console.error("Start game failed:", error);
        setError(encryptError || "Failed to start game");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, walletAddress, walletClient, isInitialized, encrypt, encryptError, writeContractAsync, publicClient],
  );

  // Validate game exists and belongs to player before resolving
  const validateGame = useCallback(
    async (gameId: number): Promise<boolean> => {
      if (!contractAddress || !walletAddress || !publicClient) {
        console.error("❌ Missing required data for game validation");
        return false;
      }

      try {
        console.log(`🔍 Validating game ${gameId}...`);

        // Call getGame to check if game exists
        const gameData = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: EncryptedDiceGameABI,
          functionName: "getGame",
          args: [BigInt(gameId)],
        });

        if (!gameData) {
          console.error(`❌ Game ${gameId} not found`);
          setError(`Game ${gameId} not found`);
          return false;
        }

        const [player, timestamp, isResolved] = gameData as [string, bigint, boolean];

        // Check if game belongs to current player
        if (player.toLowerCase() !== walletAddress.toLowerCase()) {
          console.error(`❌ Game ${gameId} does not belong to current player`);
          setError(`Game ${gameId} does not belong to you`);
          return false;
        }

        // Check if game is already resolved
        if (isResolved) {
          console.error(`❌ Game ${gameId} is already resolved`);
          setError(`Game ${gameId} is already resolved`);
          return false;
        }

        console.log(`✅ Game ${gameId} is valid and ready to resolve`);
        return true;
      } catch (error) {
        console.error("Game validation failed:", error);
        setError("Failed to validate game");
        return false;
      }
    },
    [contractAddress, walletAddress, publicClient],
  );

  // Resolve game using FHEVM 0.9 self-relaying pattern
  const resolveGame = useCallback(
    async (gameId: number): Promise<void> => {
      if (!contractAddress || !walletAddress || !walletClient) return;

      try {
        setIsLoading(true);
        setError(null);

        console.log("🎲 Resolving game with FHEVM 0.9 self-relaying...");

        // Validate game before resolving
        const isValid = await validateGame(gameId);
        if (!isValid) {
          console.error("❌ Game validation failed, aborting resolve");
          return;
        }

        // Step 1: Call resolveGame to generate encrypted dice values
        // Set gas limit to avoid "transaction gas limit too high" error
        const txHash = await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: EncryptedDiceGameABI,
          functionName: "resolveGame",
          args: [BigInt(gameId)],
        });

        // Note: In a full implementation, you would need to:
        // 1. Get encrypted dice handles from the contract
        // 2. Make them publicly decryptable
        // 3. Use publicDecrypt to get cleartext values
        // 4. Submit cleartext values back with verification signatures

        console.log("✅ Game resolution transaction submitted!", txHash);
      } catch (error) {
        console.error("Resolve game failed:", error);
        setError("Failed to resolve game");
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, walletAddress, walletClient, writeContractAsync, validateGame],
  );

  // Refresh data
  const refresh = useCallback(async () => {
    await Promise.all([refetchBalance(), refetchGameCounter()]);
  }, [refetchBalance, refetchGameCounter]);

  // Auto-refresh on transaction completion
  useEffect(() => {
    if (writeData && !isTransactionLoading) {
      refresh();
    }
  }, [writeData, isTransactionLoading, refresh]);

  return {
    // FHEVM status
    isInitialized,
    fhevmStatus,

    // Loading states
    isLoading: isLoading || isWritePending || isTransactionLoading || isEncrypting,
    isTransactionPending: isWritePending,
    isTransactionLoading,
    error: error || encryptError,

    // Game data
    gameHistory,
    gameCounter: Number(gameCounter || 0),

    // Balance data
    encryptedBalance,

    // Contract info
    contractAddress,
    isContractAvailable: Boolean(contractAddress),
    isContractReady: Boolean(contractAddress && isInitialized),

    // Functions
    mintTokens,
    swapETHForROLL,
    swapROLLForETH,
    rollDice, // New simplified function (combines startGame + resolveGame)
    startGame, // DEPRECATED - use rollDice instead
    resolveGame, // DEPRECATED - use rollDice instead
    refresh,
    refreshBalance: async () => {
      console.log("🔄 Refreshing balance...");
      await refetchBalance();
      console.log("✅ Balance refresh complete");
    },

    // Owner functions
    addTreasuryETH: async (ethAmount: number) => {
      if (!contractAddress || !walletAddress) return;

      try {
        setIsLoading(true);
        setError(null);

        const ethAmountWei = BigInt(Math.round(ethAmount * 1e18));

        const txHash = await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: EncryptedDiceGameABI,
          functionName: "addTreasuryETH" as any,
          args: [],
          value: ethAmountWei as any,
        });

        console.log(`✅ Added ${ethAmount} ETH to contract treasury. Tx hash:`, txHash);
      } catch (error) {
        console.error("Add treasury ETH failed:", error);
        setError("Failed to add ETH to treasury");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },

    // Utils
    clearError: () => setError(null),
  };
}
