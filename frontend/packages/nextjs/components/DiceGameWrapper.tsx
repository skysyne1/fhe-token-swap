"use client";

import { useEffect, useState } from "react";
// InMemoryStorageProvider removed - not needed with new template pattern
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { WagmiProvider, useAccount, useBalance } from "wagmi";
import { HeaderDiceGame } from "~~/components/HeaderDiceGame";
import { BlockieAvatar } from "~~/components/helper";
import { DecryptedBalanceProvider } from "~~/contexts/DecryptedBalanceContext";
import { useEncryptedDiceGame } from "~~/hooks/useEncryptedDiceGame";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

export const diceGameQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

// Internal component to use wagmi hooks
const AppContent = ({ children }: { children: React.ReactNode }) => {
  const { address, isConnected } = useAccount();
  const { data: ethBalanceData } = useBalance({ address });
  const { encryptedBalance } = useEncryptedDiceGame();

  const ethBalance = ethBalanceData ? parseFloat(ethBalanceData.formatted) : 0;
  // For ROLL balance: show -1 if encrypted (user needs to decrypt), 0 if no balance
  const rollBalance = encryptedBalance ? -1 : 0; // -1 indicates encrypted balance exists

  return (
    <div className={`flex flex-col min-h-screen`}>
      <HeaderDiceGame
        walletConnected={isConnected}
        walletAddress={address}
        ethBalance={ethBalance}
        rollBalance={rollBalance}
      />
      <main className="relative flex flex-col flex-1">{children}</main>
    </div>
  );
};

export const DiceGameWrapper = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={diceGameQueryClient}>
        <RainbowKitProvider
          avatar={BlockieAvatar}
          theme={mounted ? (isDarkMode ? darkTheme() : lightTheme()) : lightTheme()}
        >
          <ProgressBar height="3px" color="#fde047" />
          <DecryptedBalanceProvider>
            <AppContent>{children}</AppContent>
          </DecryptedBalanceProvider>
          <Toaster />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
