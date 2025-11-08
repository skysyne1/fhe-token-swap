import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { ArrowDownUp, Coins } from "lucide-react";
import { toast } from "sonner";

interface TokenSwapProps {
  ethBalance: number;
  rollBalance: number;
  onSwap: (fromToken: "ETH" | "ROLL", amount: number) => void;
  onShowOverlay?: (message: string, description?: string, showDice?: boolean) => void;
  onHideOverlay?: () => void;
}

export function TokenSwap({ ethBalance, rollBalance, onSwap, onShowOverlay, onHideOverlay }: TokenSwapProps) {
  const [fromToken, setFromToken] = useState<"ETH" | "ROLL">("ETH");
  const [fromAmount, setFromAmount] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);

  const exchangeRate = 1000; // 1 ETH = 1000 ROLL
  const toToken = fromToken === "ETH" ? "ROLL" : "ETH";
  const toAmount = fromAmount
    ? fromToken === "ETH"
      ? (parseFloat(fromAmount) * exchangeRate).toFixed(2)
      : (parseFloat(fromAmount) / exchangeRate).toFixed(4)
    : "";

  const fromBalance = fromToken === "ETH" ? ethBalance : rollBalance;

  const handleSwap = async () => {
    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount > fromBalance) {
      toast.error(`Insufficient ${fromToken} balance`);
      return;
    }

    setIsSwapping(true);
    onShowOverlay?.("Swapping Tokens...", "Confirming transaction on blockchain", true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    onSwap(fromToken, amount);
    setFromAmount("");
    setIsSwapping(false);
    onHideOverlay?.();

    toast.success(`Swapped ${amount} ${fromToken} for ${toAmount} ${toToken}`, {
      description: "Transaction completed successfully",
    });
  };

  const handleFlip = () => {
    setFromToken(fromToken === "ETH" ? "ROLL" : "ETH");
    setFromAmount("");
  };

  return (
    <>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Swap Interface */}
        <Card className="bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border-2 border-primary/30 p-6">
          <div className="space-y-4">
            {/* From Token*/}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">From</label>
                <span className="text-sm text-muted-foreground">
                  Balance: {fromBalance.toFixed(fromToken === "ETH" ? 4 : 2)} {fromToken}
                </span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  value={fromAmount}
                  onChange={e => setFromAmount(e.target.value)}
                  className="h-16 text-2xl pr-24 bg-input-background border-border focus:border-primary"
                  placeholder="0.0"
                  disabled={isSwapping}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-secondary px-3 py-2 rounded-lg">
                  {fromToken === "ETH" ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"
                        fill="currentColor"
                        className="text-primary"
                      />
                    </svg>
                  ) : (
                    <Coins className="h-5 w-5 text-primary" />
                  )}
                  <span className="font-semibold">{fromToken}</span>
                </div>
              </div>
              <button
                onClick={() => setFromAmount(fromBalance.toString())}
                className="text-xs px-2 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
              >
                Max
              </button>
            </div>

            {/* Swap Arrow */}
            <div className="flex justify-center">
              <button
                onClick={handleFlip}
                className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-all hover:rotate-180 duration-300 border-2 border-border"
                disabled={isSwapping}
              >
                <ArrowDownUp className="h-6 w-6 text-primary" />
              </button>
            </div>

            {/* To Token */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">To</label>
                <span className="text-sm text-muted-foreground">Rate: 1 ETH = {exchangeRate} ROLL</span>
              </div>
              <div className="relative">
                <Input
                  type="text"
                  value={toAmount}
                  className="h-16 text-2xl pr-24 bg-input-background border-border"
                  placeholder="0.0"
                  disabled
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-secondary px-3 py-2 rounded-lg">
                  {toToken === "ETH" ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"
                        fill="currentColor"
                        className="text-primary"
                      />
                    </svg>
                  ) : (
                    <Coins className="h-5 w-5 text-primary" />
                  )}
                  <span className="font-semibold">{toToken}</span>
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <Button
              onClick={handleSwap}
              disabled={isSwapping || !fromAmount}
              className="w-full h-14 bg-gradient-to-r from-[#fde047] via-[#fbbf24] to-[#f59e0b] text-black text-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 shadow-lg shadow-primary/30"
            >
              Swap Tokens
            </Button>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="bg-card/30 backdrop-blur-sm border-border/30 p-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <div className="font-semibold text-foreground mb-2">Swap Information:</div>
            <div className="flex justify-between">
              <span>Exchange Rate</span>
              <span className="text-foreground">1 ETH = {exchangeRate} ROLL</span>
            </div>
            <div className="flex justify-between">
              <span>Network Fee</span>
              <span className="text-foreground">0.1%</span>
            </div>
            <div className="flex justify-between">
              <span>Slippage</span>
              <span className="text-foreground">0.5%</span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
