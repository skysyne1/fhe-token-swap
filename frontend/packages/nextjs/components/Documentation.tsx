import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ArrowRight, BookOpen, CheckCircle2, Eye, Key, Lock, Server, Shield, Zap } from "lucide-react";

export function Documentation() {
  const router = useRouter();

  const handleNavigateToGame = () => {
    router.push("/game");
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-4">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-sm text-primary">Documentation</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#fde047] via-[#fef3c7] to-[#fed7aa] bg-clip-text text-transparent">
          How Encrypted Dice Roll Works
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Learn about FHEVM technology and how we ensure complete privacy and fairness in every dice roll
        </p>
      </div>

      {/* What is FHEVM? */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl font-bold">What is FHEVM?</h2>
        </div>

        <Card className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border-2 border-primary/30 p-8">
          <div className="space-y-6">
            <p className="text-lg text-muted-foreground leading-relaxed">
              <span className="text-primary font-semibold">FHEVM (Fully Homomorphic Encryption Virtual Machine)</span>{" "}
              is a revolutionary blockchain technology that enables computations on encrypted data without ever
              decrypting it. This means your bets, rolls, and results remain completely private throughout the entire
              process.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-primary/10 w-fit">
                  <Key className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">End-to-End Encryption</h3>
                <p className="text-muted-foreground">
                  All game data is encrypted from the moment you place a bet until the result is revealed
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-primary/10 w-fit">
                  <Server className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">On-Chain Privacy</h3>
                <p className="text-muted-foreground">
                  Unlike traditional blockchain, FHEVM keeps your gaming activity private while maintaining transparency
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-primary/10 w-fit">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Provably Fair</h3>
                <p className="text-muted-foreground">
                  All rolls are verifiable on-chain while maintaining complete confidentiality of the process
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* How It Works */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl font-bold">How It Works</h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Step 1 */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6 hover:border-primary/30 transition-all">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#fde047] to-[#fbbf24] flex items-center justify-center text-2xl font-bold text-black">
                  1
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-2xl font-semibold">Connect Your Wallet</h3>
                <p className="text-muted-foreground text-lg">
                  Connect your MetaMask or any Web3 wallet to the Encrypted Dice Roll platform. Your wallet address is
                  never linked to your gaming activity thanks to FHEVM&apos;s privacy layer.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-secondary text-sm">MetaMask</span>
                  <span className="px-3 py-1 rounded-full bg-secondary text-sm">WalletConnect</span>
                  <span className="px-3 py-1 rounded-full bg-secondary text-sm">Coinbase Wallet</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Step 2 */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6 hover:border-primary/30 transition-all">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#fde047] to-[#fbbf24] flex items-center justify-center text-2xl font-bold text-black">
                  2
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-2xl font-semibold">Get ROLL Tokens</h3>
                <p className="text-muted-foreground text-lg">
                  Swap your ETH for ROLL tokens using our built-in token swap interface. The exchange rate is 1 ETH =
                  1,000 ROLL. All swaps are instant and secure.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg">
                  <span className="text-sm">
                    Exchange Rate: <span className="font-semibold text-primary">1 ETH = 1,000 ROLL</span>
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Step 3 */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6 hover:border-primary/30 transition-all">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#fde047] to-[#fbbf24] flex items-center justify-center text-2xl font-bold text-black">
                  3
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-2xl font-semibold">Place Your Bet</h3>
                <p className="text-muted-foreground text-lg">
                  Choose 1-3 dice, enter your bet amount in ROLL tokens, and hit the Roll button. Your bet is encrypted
                  before being sent to the blockchain, ensuring complete privacy.
                </p>
                <div className="grid grid-cols-3 gap-2 max-w-xs">
                  <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <div className="text-2xl mb-1">⚀</div>
                    <div className="text-xs text-muted-foreground">1 Dice</div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <div className="text-2xl mb-1">⚁</div>
                    <div className="text-xs text-muted-foreground">2 Dice</div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 text-center">
                    <div className="text-2xl mb-1">⚂</div>
                    <div className="text-xs text-muted-foreground">3 Dice</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Step 4 */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6 hover:border-primary/30 transition-all">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#fde047] to-[#fbbf24] flex items-center justify-center text-2xl font-bold text-black">
                  4
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-2xl font-semibold">Encrypted Roll</h3>
                <p className="text-muted-foreground text-lg">
                  The dice roll happens on-chain using FHEVM&apos;s encrypted random number generation. The entire
                  process is hidden from everyone, including us, until the result is revealed.
                </p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4 text-primary" />
                  <span>Encrypted throughout entire process</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Step 5 */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6 hover:border-primary/30 transition-all">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#fde047] to-[#fbbf24] flex items-center justify-center text-2xl font-bold text-black">
                  5
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-2xl font-semibold">Instant Results & Payout</h3>
                <p className="text-muted-foreground text-lg">
                  If the sum of your dice is even, you win! Payouts are instant and automatic. Win 1.95x your bet
                  amount. All results are verifiable on-chain while maintaining your privacy.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-500">Even Sum = Win (1.95x)</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <span className="text-sm text-red-500">Odd Sum = Loss</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Privacy Benefits */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Eye className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl font-bold">Privacy Benefits</h2>
        </div>

        <Card className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border-2 border-primary/30 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Complete Anonymity</h3>
                  <p className="text-muted-foreground">
                    Your betting patterns, amounts, and results are never publicly visible on the blockchain
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Protected Gaming History</h3>
                  <p className="text-muted-foreground">Only you can see your complete gaming history and statistics</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">No Front-Running</h3>
                  <p className="text-muted-foreground">
                    Encrypted transactions prevent bots and other players from exploiting your bets
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Verifiable Fairness</h3>
                  <p className="text-muted-foreground">
                    All results can be verified on-chain without revealing sensitive information
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Secure by Design</h3>
                  <p className="text-muted-foreground">
                    FHEVM&apos;s cryptographic guarantees ensure your data stays private forever
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">No Trusted Third Party</h3>
                  <p className="text-muted-foreground">
                    Privacy is guaranteed by mathematics, not by trusting a central authority
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Getting Started */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl font-bold">Getting Started</h2>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Prerequisites</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">A Web3 wallet (MetaMask, WalletConnect, etc.)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Some ETH for gas fees and token swaps</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Basic understanding of blockchain transactions</span>
                </li>
              </ul>
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Quick Start Guide</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    Click &quot;Connect Wallet&quot; and approve the connection in your Web3 wallet
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">Navigate to the Swap page and exchange ETH for ROLL tokens</p>
                </div>
                <div className="flex items-start gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    Go to the Game page, select your dice mode, and place your first bet
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    Watch your results in the History page and track your performance
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleNavigateToGame}
                size="lg"
                className="w-full md:w-auto bg-gradient-to-r from-[#fde047] via-[#fbbf24] to-[#f59e0b] text-black hover:scale-105 transition-transform shadow-lg shadow-primary/30"
              >
                Start Playing Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* FAQ/Important Notes */}
      <Card className="bg-card/30 backdrop-blur-sm border-border/30 p-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Important Notes</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <p>Always ensure you have enough ETH for gas fees before swapping or playing</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <p>ROLL tokens are specific to this platform and can be swapped back to ETH at any time</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <p>
                Game results are determined by encrypted on-chain randomness - no one can predict or manipulate outcomes
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <p>Your private keys never leave your wallet - we cannot access your funds</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <p>This is a demonstration of FHEVM technology - please gamble responsibly</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
