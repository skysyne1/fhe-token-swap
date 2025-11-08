"use client";

import { useNavigationWithLoading } from "../hooks/useNavigationWithLoading";
import { BreadcrumbNav } from "./BreadcrumbNav";
import { Documentation } from "./Documentation";
import { Footer } from "./Footer";
import { LoadingOverlay } from "./LoadingOverlay";
import { Toaster } from "./ui/sonner";

export function DocsPage() {
  const { isLoading, loadingMessage, loadingDescription } = useNavigationWithLoading();

  return (
    <div className="min-h-screen bg-background">
      {isLoading && <LoadingOverlay message={loadingMessage} description={loadingDescription} showDice={true} />}

      <main className="container mx-auto px-4">
        <BreadcrumbNav />
        <Documentation />
      </main>

      <Footer />
      <Toaster position="top-right" />
    </div>
  );
}
