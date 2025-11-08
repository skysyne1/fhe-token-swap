"use client";

import { useNavigationWithLoading } from "../hooks/useNavigationWithLoading";
import { Footer } from "./Footer";
import { LandingPage } from "./LandingPage";
import { LoadingOverlay } from "./LoadingOverlay";
import { Toaster } from "./ui/sonner";

export function HomePage() {
  const { isLoading, loadingMessage, loadingDescription } = useNavigationWithLoading();

  return (
    <div className="min-h-screen bg-background">
      {isLoading && <LoadingOverlay message={loadingMessage} description={loadingDescription} showDice={true} />}

      <div className="w-full">
        <LandingPage />
      </div>

      <Footer />
      <Toaster position="top-right" />
    </div>
  );
}
