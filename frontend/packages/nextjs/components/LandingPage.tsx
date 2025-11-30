import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ConnectWalletButton } from "./ui/connect-wallet-button";
import { ArrowDownUp, Lock, Shield, TrendingUp, Zap } from "lucide-react";

export function LandingPage() {
  const router = useRouter();

  const handleNavigate = (page: string) => {
    const routeMap: Record<string, string> = {
      Swap: "/swap",
      History: "/history",
      Docs: "/docs",
    };
    router.push(routeMap[page]);
  };
  return (
    <div className="w-full">
      {/* Hero Section - Full Width */}
      <div className="relative overflow-hidden w-full">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-block mb-6">
            <div className="flex items-center justify-center gap-3 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">Powered by FHEVM Encryption</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-[#fde047] via-[#fef3c7] to-[#fed7aa] bg-clip-text text-transparent">
            FHE Token Swap dApp
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Swap ETH and ROLL tokens with fully encrypted, privacy-preserving transactions using FHEVM technology
          </p>

          {/* Token Swap Display */}
          {/* <div className="flex justify-center gap-8 mb-12 py-8">
            <div className="flex items-center gap-4 p-6 bg-card/50 backdrop-blur-sm border border-primary/30 rounded-xl">
              <Coins className="h-12 w-12 text-[#fde047]" />
              <ArrowDownUp className="h-8 w-8 text-primary" />
              <div className="text-2xl font-bold">ROLL</div>
            </div>  
          </div> */}

          <ConnectWalletButton
            label="Connect Wallet & Start Swapping"
            icon={<ArrowDownUp className="mr-2 h-6 w-6" />}
            size="lg"
            className="h-16 px-12 text-lg bg-gradient-to-r from-[#fde047] via-[#fbbf24] to-[#f59e0b] text-black hover:scale-105 transition-transform shadow-2xl shadow-primary/50"
            onConnected={() => handleNavigate("Swap")}
          />

          <p className="text-sm text-muted-foreground mt-4">
            Connect your wallet to start swapping ETH and ROLL tokens securely
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose FHE Token Swap?</h2>
          <p className="text-muted-foreground text-lg">Privacy-first token swapping with cutting-edge encryption</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card/50 backdrop-blur-sm border-primary/30 p-6 hover:border-primary/50 transition-all">
            <div className="p-3 rounded-lg bg-primary/20 w-fit mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Fully Encrypted</h3>
            <p className="text-muted-foreground">
              All swap transactions are encrypted using FHEVM technology for complete privacy
            </p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-primary/30 p-6 hover:border-primary/50 transition-all">
            <div className="p-3 rounded-lg bg-primary/20 w-fit mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Instant Swaps</h3>
            <p className="text-muted-foreground">Swap ETH and ROLL tokens instantly with on-chain execution</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-primary/30 p-6 hover:border-primary/50 transition-all">
            <div className="p-3 rounded-lg bg-primary/20 w-fit mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure & Transparent</h3>
            <p className="text-muted-foreground">
              All swaps are verifiable on-chain while maintaining transaction privacy
            </p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-primary/30 p-6 hover:border-primary/50 transition-all">
            <div className="p-3 rounded-lg bg-primary/20 w-fit mb-4">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Fixed Rate</h3>
            <p className="text-muted-foreground">1 ETH = 1000 ROLL tokens with no slippage</p>
          </Card>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#fde047] to-[#fbbf24] flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-black">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">Connect Wallet</h3>
            <p className="text-muted-foreground">Connect your Web3 wallet to access the swap interface</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#fde047] to-[#fbbf24] flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-black">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">Choose Direction</h3>
            <p className="text-muted-foreground">Select ETH → ROLL or ROLL → ETH and enter your amount</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#fde047] to-[#fbbf24] flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-black">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">Swap Securely</h3>
            <p className="text-muted-foreground">Complete your encrypted swap transaction and track your history!</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Card className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border-2 border-primary/30 p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Swap?</h2>
          <p className="text-muted-foreground text-lg mb-8">Start swapping tokens with privacy-preserving encryption</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ConnectWalletButton
              label="Start Swapping"
              size="lg"
              className="h-14 px-8 bg-gradient-to-r from-[#fde047] via-[#fbbf24] to-[#f59e0b] text-black hover:scale-105 transition-transform shadow-lg shadow-primary/30"
              onConnected={() => handleNavigate("Swap")}
            />
            <Button
              onClick={() => handleNavigate("Docs")}
              size="lg"
              variant="outline"
              className="h-14 px-8 border-primary/50 hover:bg-primary/10"
            >
              Learn More
            </Button>
          </div>

          {/* Quick Navigation Links */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm">
            <button
              onClick={() => handleNavigate("Swap")}
              className="text-[#a3a3a3] hover:text-[#fde047] transition-colors duration-200"
            >
              Token Swap →
            </button>
            <button
              onClick={() => handleNavigate("History")}
              className="text-[#a3a3a3] hover:text-[#fde047] transition-colors duration-200"
            >
              View History →
            </button>
            <button
              onClick={() => handleNavigate("Docs")}
              className="text-[#a3a3a3] hover:text-[#fde047] transition-colors duration-200"
            >
              Documentation →
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
