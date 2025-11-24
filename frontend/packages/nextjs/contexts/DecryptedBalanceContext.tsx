"use client";

import { ReactNode, createContext, useContext, useState } from "react";

interface DecryptedBalanceContextType {
  decryptedRollBalance: number | undefined;
  setDecryptedRollBalance: (balance: number | undefined) => void;
  lastDecryptedHandle: string;
  setLastDecryptedHandle: (handle: string) => void;
}

const DecryptedBalanceContext = createContext<DecryptedBalanceContextType | undefined>(undefined);

export function DecryptedBalanceProvider({ children }: { children: ReactNode }) {
  const [decryptedRollBalance, setDecryptedRollBalance] = useState<number | undefined>(undefined);
  const [lastDecryptedHandle, setLastDecryptedHandle] = useState<string>("");

  return (
    <DecryptedBalanceContext.Provider
      value={{
        decryptedRollBalance,
        setDecryptedRollBalance,
        lastDecryptedHandle,
        setLastDecryptedHandle,
      }}
    >
      {children}
    </DecryptedBalanceContext.Provider>
  );
}

export function useDecryptedBalance() {
  const context = useContext(DecryptedBalanceContext);
  if (context === undefined) {
    throw new Error("useDecryptedBalance must be used within a DecryptedBalanceProvider");
  }
  return context;
}
