import { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { ArrowDownUp, Coins } from "lucide-react";
import { toast } from "sonner";

interface TokenSwapProps {
  balance: number;
  isContractReady: boolean;
  isContractLoading: boolean;
  contractError: string | null;
  onMintTokens: () => void;
  onSwapETHForROLL: (amount: number) => Promise<void>;
  onRefresh: () => Promise<void>;
  onClearError: () => void;
}

export function TokenSwap({
  balance,
  isContractReady,
  isContractLoading,
  contractError,
  onMintTokens,
  onSwapETHForROLL,
  onRefresh,
  onClearError,
}: TokenSwapProps) {
  const [fromToken, setFromToken] = useState<"ETH" | "ROLL">("ETH");
  const [swapAmount, setSwapAmount] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);

  const exchangeRate = 1000; // 1 ETH = 1000 ROLL
  const toToken = fromToken === "ETH" ? "ROLL" : "ETH";
  const toAmount = swapAmount
    ? fromToken === "ETH"
      ? (parseFloat(swapAmount) * exchangeRate).toFixed(2)
      : (parseFloat(swapAmount) / exchangeRate).toFixed(4)
    : "";

  // Use real balance from contract
  const fromBalance = fromToken === "ETH" ? 0 : balance; // ETH balance would come from wagmi

  const handleSwap = async () => {
    const amount = parseFloat(swapAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!isContractReady) {
      toast.error("Smart contract not ready. Please check your network connection.");
      return;
    }

    setIsSwapping(true);

    try {
      if (fromToken === "ETH") {
        // Use smart contract for ETH to ROLL swap
        await onSwapETHForROLL(amount);
        toast.success(`Swapped ${amount} ETH for ${amount * exchangeRate} ROLL`, {
          description: "Transaction confirmed on blockchain",
        });

        // Refresh balance
        await onRefresh();
      } else {
        toast.error("ROLL to ETH swap not yet implemented");
        // Would implement ROLL to ETH swap here
      }

      setSwapAmount("");
    } catch (error: any) {
      console.error("Swap error:", error);
      toast.error("Swap failed", {
        description: error?.message || "Please try again",
      });
    } finally {
      setIsSwapping(false);
    }
  };

  const handleFlipTokens = () => {
    setFromToken(fromToken === "ETH" ? "ROLL" : "ETH");
    setSwapAmount("");
  };

  return (
    <div className="flex-[3]">
      <Card className="bg-gradient-to-br from-[#2a2a2a]/60 to-[#1a1a1a]/40 backdrop-blur-sm border-2 border-[#fde047]/30 p-6 shadow-2xl shadow-[#fde047]/10 lg:sticky lg:top-24">
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <ArrowDownUp className="h-5 w-5 text-[#fde047] drop-shadow-[0_0_6px_rgba(253,224,71,0.4)]" />
            <h3 className="font-semibold text-[#fde047]">Token Swap</h3>
          </div>

          {/* Balance & Testing Controls */}
          <div className="space-y-3">
            {/* Current Balance Display */}
            <div className="p-4 bg-[#1a1a1a]/50 border border-[#404040]/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#d4d4d4]">Your ROLL Balance</span>
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-[#fde047]" />
                  <span className="font-bold text-[#ffffff] text-lg">{balance.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Testing Controls - Only show if contract ready */}
            {isContractReady && (
              <Button
                onClick={onMintTokens}
                disabled={isContractLoading}
                className="w-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white"
                size="sm"
              >
                {isContractLoading ? "Minting..." : "🪙 Mint 1000 ROLL (Testing)"}
              </Button>
            )}
          </div>

          {/* Contract Status */}
          {!isContractReady && (
            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <p className="text-sm text-orange-400">⚠️ Smart contract not ready - Check network connection</p>
            </div>
          )}

          {contractError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">❌ {contractError}</p>
              <Button onClick={onClearError} size="sm" variant="outline" className="mt-2 text-xs">
                Clear Error
              </Button>
            </div>
          )}

          {/* From Token */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm text-[#d4d4d4]">From</label>
              <span className="text-sm text-[#a3a3a3]">
                Balance: {fromBalance.toFixed(fromToken === "ETH" ? 4 : 2)} {fromToken}
              </span>
            </div>
            <div className="relative">
              <Input
                type="number"
                value={swapAmount}
                onChange={e => setSwapAmount(e.target.value)}
                className="h-14 text-xl pr-24 bg-[#2a2a2a] border-[#404040] focus:border-[#fde047] text-[#ffffff] placeholder:text-[#a3a3a3]"
                placeholder="0.0"
                disabled={isSwapping}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-[#404040] px-3 py-2 rounded-lg">
                {fromToken === "ETH" ? (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"
                      fill="currentColor"
                      className="text-[#fde047]"
                    />
                  </svg>
                ) : (
                  <Coins className="h-5 w-5 text-[#fde047]" />
                )}
                <span className="font-semibold text-[#ffffff]">{fromToken}</span>
              </div>
            </div>
            <button
              onClick={() => setSwapAmount(fromBalance.toString())}
              className="text-xs px-2 py-1 rounded bg-[#fde047]/20 text-[#fde047] hover:bg-[#fde047]/30 transition-colors border border-[#fde047]/30"
            >
              Max
            </button>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center">
            <button
              onClick={handleFlipTokens}
              className="p-2 rounded-full bg-[#404040] hover:bg-[#fde047]/20 transition-all hover:rotate-180 duration-300 border-2 border-[#404040] hover:border-[#fde047]/50"
              disabled={isSwapping}
            >
              <ArrowDownUp className="h-6 w-6 text-[#fde047]" />
            </button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-[#d4d4d4]">To</label>
              <span className="text-sm text-[#a3a3a3]">Rate: 1 ETH = {exchangeRate} ROLL</span>
            </div>
            <div className="relative">
              <Input
                type="text"
                value={toAmount}
                className="h-14 text-xl pr-24 bg-[#2a2a2a] border-[#404040] text-[#ffffff]"
                placeholder="0.0"
                disabled
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-[#404040] px-3 py-2 rounded-lg">
                {toToken === "ETH" ? (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"
                      fill="currentColor"
                      className="text-[#fde047]"
                    />
                  </svg>
                ) : (
                  <Coins className="h-5 w-5 text-[#fde047]" />
                )}
                <span className="font-semibold text-[#ffffff]">{toToken}</span>
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <Button
            onClick={handleSwap}
            disabled={isSwapping || !swapAmount}
            className="w-full h-12 bg-gradient-to-r from-[#fde047] via-[#fbbf24] to-[#f59e0b] text-black hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 shadow-lg shadow-[#fde047]/30"
          >
            Swap Tokens
          </Button>
        </div>
      </Card>
    </div>
  );
}
