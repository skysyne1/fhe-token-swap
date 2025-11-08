// hooks/useNavigationWithLoading.tsx
import { useState } from "react";

// This hook is only for loading data, not for navigation
export function useNavigationWithLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [loadingDescription, setLoadingDescription] = useState("Preparing data");
  const [showDice, setShowDice] = useState(true);

  // Show loading for data operations (blockchain calls, API calls, etc.)
  const showLoading = (message: string, description?: string, showDiceAnimation = true) => {
    setLoadingMessage(message);
    setLoadingDescription(description || "");
    setShowDice(showDiceAnimation);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  return {
    isLoading,
    loadingMessage,
    loadingDescription,
    showDice,
    showLoading,
    hideLoading,
  };
}
