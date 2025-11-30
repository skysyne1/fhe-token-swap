import { useEffect } from "react";
import { useDecryptedBalance } from "../../contexts/DecryptedBalanceContext";
import { useEncryptedDiceGame } from "../../hooks/useEncryptedDiceGame";
import { TokenSwap } from "./TokenSwap";
import { toast } from "sonner";

interface GameInterfaceProps {
  onShowOverlay?: (message: string, description?: string, showDice?: boolean) => void;
  onHideOverlay?: () => void;
}

export function GameInterface({ onShowOverlay, onHideOverlay }: GameInterfaceProps) {
  // Smart contract integration
  const {
    // State
    isLoading: isContractLoading,
    isTransactionPending,
    isTransactionLoading,
    error: contractError,
    isContractAvailable,

    // Actions
    swapETHForROLL,
    swapROLLForETH,
    mintTokens,
    refreshBalance,
    clearError,
  } = useEncryptedDiceGame();

  // Get decrypted balance from context
  const { decryptedRollBalance } = useDecryptedBalance();

  // Balance: use decrypted balance if available, otherwise 0
  const balance = decryptedRollBalance !== undefined ? decryptedRollBalance : 0;
  const isContractReady = isContractAvailable;

  // Clear contract errors when component mounts
  useEffect(() => {
    if (contractError) {
      clearError();
    }
  }, [contractError, clearError]);

  // Show contract errors as toasts
  useEffect(() => {
    if (contractError) {
      toast.error("Contract Error", {
        description: contractError,
      });
    }
  }, [contractError]);

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
    <div className="w-full max-w-4xl mx-auto">
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
