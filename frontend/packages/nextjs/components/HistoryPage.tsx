"use client";

import { useNavigationWithLoading } from "../hooks/useNavigationWithLoading";
import { BreadcrumbNav } from "./BreadcrumbNav";
import { Footer } from "./Footer";
import { GameHistory } from "./GameHistory";
import { LoadingOverlay } from "./LoadingOverlay";
import { Toaster } from "./ui/sonner";

export function HistoryPage() {
  const { isLoading, loadingMessage, loadingDescription } = useNavigationWithLoading();

  return (
    <div className="min-h-screen bg-background">
      {isLoading && <LoadingOverlay message={loadingMessage} description={loadingDescription} showDice={true} />}

      <main className="container mx-auto px-4">
        <BreadcrumbNav />
        <GameHistory />
      </main>

      <Footer />
      <Toaster position="top-right" />
    </div>
  );
}
