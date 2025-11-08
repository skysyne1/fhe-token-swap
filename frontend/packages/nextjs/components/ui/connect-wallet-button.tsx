"use client";

import { ReactNode } from "react";
import { Button } from "./button";
import { cn } from "./utils";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface ConnectWalletButtonProps {
  label?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  className?: string;
  icon?: ReactNode;
  onConnected?: () => void;
}

/**
 * Reusable Connect Wallet Button using RainbowKit
 * Maintains consistent wallet connection across the app
 */
export const ConnectWalletButton = ({
  label = "Connect Wallet",
  size = "default",
  variant = "default",
  className,
  icon,
  onConnected,
}: ConnectWalletButtonProps) => {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;

        // If not connected, show connect button
        if (!connected) {
          return (
            <Button onClick={openConnectModal} size={size} variant={variant} className={cn(className)} type="button">
              {icon}
              {label}
            </Button>
          );
        }

        // If connected and onConnected callback provided, execute it and show different button
        if (connected && onConnected) {
          return (
            <Button onClick={onConnected} size={size} variant={variant} className={cn(className)} type="button">
              {icon}
              {label.replace("Connect Wallet", "Start Game").replace("Start Playing", "Continue Playing")}
            </Button>
          );
        }

        // If connected but no callback, return null
        return null;
      }}
    </ConnectButton.Custom>
  );
};
