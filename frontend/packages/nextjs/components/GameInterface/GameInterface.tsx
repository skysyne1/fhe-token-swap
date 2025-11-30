import { useEffect, useState } from "react";
import { useDecryptedBalance } from "../../contexts/DecryptedBalanceContext";
import { useEncryptedDiceGame } from "../../hooks/useEncryptedDiceGame";
import { GameSection } from "./GameSection";
import { TokenSwap } from "./TokenSwap";
import { toast } from "sonner";

// Hardcoded stake amount when decrypt API returns 500 error
// TODO: Remove this when API is fixed
const HARDCODED_STAKE_WHEN_DECRYPT_FAILED = 10;

interface GameInterfaceProps {
  onShowOverlay?: (message: string, description?: string, showDice?: boolean) => void;
  onHideOverlay?: () => void;
}

export function GameInterface({ onShowOverlay, onHideOverlay }: GameInterfaceProps) {
  const [stakeAmount, setStakeAmount] = useState("10");
  const [isRolling, setIsRolling] = useState(false);
  const [diceValues, setDiceValues] = useState<number[]>([1]);
  const [lastResult, setLastResult] = useState<{ win: boolean; payout: number } | null>(null);
  const [prediction, setPrediction] = useState<"even" | "odd">("even");

  // Smart contract integration - now using real hook
  const {
    // State
    isLoading: isContractLoading,
    isTransactionPending,
    isTransactionLoading,
    error: contractError,
    isContractAvailable,

    // Actions
    rollDice, // New simplified function (combines startGame + resolveGame)
    swapETHForROLL,
    swapROLLForETH,
    mintTokens,
    refreshBalance,
    clearError,
  } = useEncryptedDiceGame();

  // Get decrypted balance from context
  const { decryptedRollBalance } = useDecryptedBalance();

  // Balance: use decrypted balance if available, otherwise 0
  // If decryptedRollBalance is undefined, it means decrypt failed (possibly API 500 error)
  const balance = decryptedRollBalance !== undefined ? decryptedRollBalance : 0;
  const isContractReady = isContractAvailable;

  // Clear contract errors when component mounts
  useEffect(() => {
    if (contractError) {
      clearError();
    }
  }, [contractError, clearError]);

  // Initialize dice values (always 1 die)
  useEffect(() => {
    if (!isRolling) {
      setDiceValues([1]);
    }
  }, [isRolling]);

  // Random dice animation when rolling (always 1 die)
  useEffect(() => {
    if (isRolling) {
      // Start random animation
      const interval = setInterval(() => {
        const newValues = [Math.floor(Math.random() * 6) + 1]; // Always 1 die
        setDiceValues(newValues);
      }, 100); // Update every 100ms for smooth animation

      return () => {
        clearInterval(interval);
      };
    }
  }, [isRolling]);

  // Show contract errors as toasts
  useEffect(() => {
    if (contractError) {
      toast.error("Contract Error", {
        description: contractError,
      });
    }
  }, [contractError]);

  const handleRoll = async () => {
    // Check if smart contract is available
    if (!isContractReady) {
      toast.error("Smart contract not ready. Please check your network connection.");
      return;
    }

    // If balance is not decrypted (decryptedRollBalance === undefined),
    // it means decrypt API failed (possibly 500 error)
    // In this case, hardcode stake amount to allow testing
    let stake: number;
    if (decryptedRollBalance === undefined) {
      // API decrypt failed - use hardcoded stake amount
      stake = HARDCODED_STAKE_WHEN_DECRYPT_FAILED;
      console.warn("⚠️ Balance not decrypted (API may be down). Using hardcoded stake amount:", stake);
    } else {
      // Normal flow: use user input stake amount
      stake = parseFloat(stakeAmount);
      if (isNaN(stake) || stake <= 0) {
        toast.error("Please enter a valid stake amount");
        return;
      }

      // Check balance only if we have decrypted balance
      if (balance < stake) {
        toast.error("Insufficient ROLL balance", {
          description: `You need ${stake} ROLL but only have ${balance} ROLL`,
        });
        return;
      }
    }

    setIsRolling(true);
    setLastResult(null);

    try {
      onShowOverlay?.("Rolling Dice...", "Encrypting your prediction and dice value", false);

      // Roll dice - off-chain generation with FHE
      const result = await rollDice(prediction, stake);

      if (result) {
        // Set dice value immediately (already generated off-chain)
        setDiceValues([result.diceResult]);

        // Wait a moment for visual effect
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Stop rolling animation
        setIsRolling(false);

        // Brief pause to let animation stop
        await new Promise(resolve => setTimeout(resolve, 300));

        // Refresh balance to get updated balance
        await refreshBalance();

        // Set final result
        setLastResult({
          win: result.won,
          payout: result.payout,
        });

        toast.success(result.won ? "You won!" : "You lost!", {
          description: `Dice: ${result.diceResult} | ${result.won ? `Won ${result.payout} ROLL` : `Lost ${stake} ROLL`}`,
        });

        onHideOverlay?.();
      } else {
        // rollDice failed
        toast.error("Failed to roll dice", {
          description: "Please try again",
        });
        onHideOverlay?.();
      }
    } catch (error: any) {
      console.error("Error in game:", error);
      toast.error("Game Failed", {
        description: error?.message || "Unknown error occurred",
      });
      onHideOverlay?.();
    } finally {
      setIsRolling(false);
    }
  };

  // Handle minting tokens for testing
  const handleMintTokens = async () => {
    if (!isContractReady) {
      toast.error("Smart contract not ready");
      return;
    }

    try {
      await mintTokens(1000); // Mint 1000 ROLL for testing
      toast.success("Minted 1000 ROLL tokens for testing!");
      await refreshBalance();
    } catch (error: any) {
      console.error("Mint error:", error);
      toast.error("Failed to mint tokens", {
        description: error?.message || "Please try again",
      });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      {/* Game Section - 70% */}
      <GameSection
        diceValues={diceValues}
        stakeAmount={stakeAmount}
        setStakeAmount={setStakeAmount}
        prediction={prediction}
        setPrediction={setPrediction}
        isRolling={isRolling}
        lastResult={lastResult}
        balance={balance}
        onRoll={handleRoll}
      />

      {/* Swap Section - 30% */}
      <TokenSwap
        balance={balance}
        isContractReady={isContractReady}
        isContractLoading={isContractLoading}
        isTransactionPending={isTransactionPending}
        isTransactionLoading={isTransactionLoading}
        contractError={contractError}
        onMintTokens={handleMintTokens}
        onSwapETHForROLL={swapETHForROLL}
        onSwapROLLForETH={swapROLLForETH}
        onRefresh={refreshBalance}
        onClearError={clearError}
        onShowOverlay={onShowOverlay}
        onHideOverlay={onHideOverlay}
      />
    </div>
  );
}
