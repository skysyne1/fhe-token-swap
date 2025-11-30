"use client";

import { useNavigationWithLoading } from "../hooks/useNavigationWithLoading";
import { BalanceCards } from "./BalanceCards";
import { BreadcrumbNav } from "./BreadcrumbNav";
import { Footer } from "./Footer";
import { GameInterface } from "./GameInterface";
import { LoadingOverlay } from "./LoadingOverlay";
import { Toaster } from "./ui/sonner";

export function SwapPage() {
  const { isLoading, loadingMessage, loadingDescription, showLoading, hideLoading } = useNavigationWithLoading();

  return (
    <div className="min-h-screen bg-background">
      {isLoading && <LoadingOverlay message={loadingMessage} description={loadingDescription} />}

      <main className="container mx-auto px-4">
        <BreadcrumbNav />

        <div className="space-y-8">
          <BalanceCards />
          <GameInterface onShowOverlay={showLoading} onHideOverlay={hideLoading} />
        </div>
      </main>

      <Footer />
      <Toaster position="top-right" />
    </div>
  );
}

// Keep GamePage for backward compatibility
export const GamePage = SwapPage;
