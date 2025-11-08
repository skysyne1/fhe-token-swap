"use client";

import { useEffect, useState } from "react";
import { InMemoryStorageProvider } from "@fhevm-sdk";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { WagmiProvider, useAccount } from "wagmi";
import { HeaderDiceGame } from "~~/components/HeaderDiceGame";
import { BlockieAvatar } from "~~/components/helper";
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

  return (
    <div className={`flex flex-col min-h-screen`}>
      <HeaderDiceGame
        walletConnected={isConnected}
        walletAddress={address}
        ethBalance={0} // TODO: Implement actual balance fetching
        rollBalance={0} // TODO: Implement actual balance fetching
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
    <InMemoryStorageProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={diceGameQueryClient}>
          <RainbowKitProvider
            avatar={BlockieAvatar}
            theme={mounted ? (isDarkMode ? darkTheme() : lightTheme()) : lightTheme()}
          >
            <ProgressBar height="3px" color="#fde047" />
            <AppContent>{children}</AppContent>
            <Toaster />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </InMemoryStorageProvider>
  );
};
