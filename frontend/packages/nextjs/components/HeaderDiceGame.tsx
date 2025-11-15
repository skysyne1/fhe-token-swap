import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { ConnectWalletButton } from "./ui/connect-wallet-button";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { ArrowLeftRight, ChevronDown, Coins, Dices, Home, LogOut, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useAccount, useDisconnect, useSwitchChain } from "wagmi";

interface HeaderProps {
  walletConnected: boolean;
  walletAddress?: string;
  ethBalance?: number;
  rollBalance?: number;
  onDisconnect?: () => void;
}

export function HeaderDiceGame({
  walletConnected,
  walletAddress,
  ethBalance = 0,
  rollBalance = 0,
  onDisconnect,
}: HeaderProps) {
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { chain } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const { openConnectModal } = useConnectModal();

  // Get current page from pathname
  const getCurrentPage = () => {
    if (pathname === "/") return "Home";
    if (pathname === "/game") return "Game";
    if (pathname === "/history") return "History";
    if (pathname === "/docs") return "Docs";
    return "";
  };

  const currentPage = getCurrentPage();

  // Handle navigation using Next.js router
  const handleNavigate = (page: string) => {
    // Check if wallet is connected for pages other than Home
    if (!walletConnected) {
      toast.error("Wallet Required", {
        description: "Please connect your wallet to access this page",
      });
      // Open RainbowKit connect modal
      if (openConnectModal) {
        openConnectModal();
      }
      return;
    }

    const routeMap: Record<string, string> = {
      Home: "/",
      Game: "/game",
      History: "/history",
      Docs: "/docs",
    };
    router.push(routeMap[page]);
  };

  // Get network display name
  const getNetworkName = (chainId: number | undefined) => {
    switch (chainId) {
      case 31337:
        return "Hardhat";
      case 11155111:
        return "Sepolia";
      default:
        return "Unknown";
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowWalletMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDisconnect = () => {
    setShowWalletMenu(false);
    disconnect();
    if (onDisconnect) {
      onDisconnect();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-black/40 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo - Left */}
        <button
          onClick={() => handleNavigate("Home")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity "
        >
          <div className="relative">
            <Dices className="h-8 w-8 text-[#fde047] drop-shadow-[0_0_8px_rgba(253,224,71,0.4)]" />
          </div>
          <span className="bg-gradient-to-r from-[#fde047] via-[#fef3c7] to-[#fed7aa] bg-clip-text text-transparent text-xl font-bold drop-shadow-sm">
            Encrypted Dice Roll
          </span>
        </button>

        {/* Navigation - Center */}
        <nav className="hidden md:flex items-center gap-1">
          {["Home", "Game", "History", "Docs"].map(page => (
            <button
              key={page}
              onClick={() => handleNavigate(page)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                currentPage === page
                  ? "bg-gradient-to-r from-[#fde047]/20 to-[#fed7aa]/20 text-[#fde047] border border-[#fde047]/30 shadow-lg shadow-[#fde047]/10"
                  : "text-[#d4d4d4] hover:bg-[#404040]/50 hover:text-[#fef3c7]"
              }`}
            >
              {page === "Home" && <Home className="h-4 w-4" />}
              {page}
            </button>
          ))}
        </nav>

        {/* Network Indicator & Wallet Button - Right */}
        <div className="flex items-center gap-3">
          {/* Network Indicator */}
          {walletConnected && chain && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#2a2a2a]/50 border border-[#404040]/30 rounded-lg">
              <div className="w-2 h-2 bg-[#fde047] rounded-full shadow-[0_0_6px_rgba(253,224,71,0.6)]"></div>
              <span className="text-sm text-[#ffffff] font-medium">{getNetworkName(chain.id)}</span>
            </div>
          )}

          {/* Wallet Button */}
          <div className="relative" ref={menuRef}>
            {walletConnected ? (
              <div>
                <Button
                  onClick={() => setShowWalletMenu(!showWalletMenu)}
                  onMouseEnter={() => setShowWalletMenu(true)}
                  variant="outline"
                  className="bg-[#2a2a2a] border-[#404040]/50 hover:bg-[#2a2a2a]/80 hover:border-[#fde047]/50 transition-all duration-200"
                >
                  <Wallet className="mr-2 h-4 w-4 text-[#fde047]" />
                  <span className="text-[#ffffff]">
                    {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </span>
                  <ChevronDown
                    className={`ml-2 h-4 w-4 transition-transform duration-200 ${showWalletMenu ? "rotate-180" : ""}`}
                  />
                </Button>

                {/* Wallet Submenu Dropdown */}
                {showWalletMenu && (
                  <div
                    className="absolute right-0 mt-2 w-80 bg-[#2a2a2a] border border-[#404040]/50 rounded-xl shadow-2xl overflow-hidden animate-[slideDown_0.2s_ease-out]"
                    onMouseLeave={() => setShowWalletMenu(false)}
                  >
                    {/* Wallet Address Section */}
                    <div className="p-4 border-b border-[#404040]/50 bg-[#1a1a1a]/50">
                      <p className="text-xs text-[#a3a3a3] mb-2">Connected Wallet</p>
                      <p className="font-mono text-sm text-[#ffffff] break-all">{walletAddress}</p>
                    </div>

                    {/* Balances Section */}
                    <div className="p-4 space-y-3 border-b border-[#404040]/50">
                      {/* Sepolia ETH Balance */}
                      <div className="flex items-center justify-between p-3 bg-[#1a1a1a]/30 rounded-lg border border-[#404040]/30">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#fbbf24]/10 rounded-lg">
                            <svg className="h-5 w-5 text-[#fbbf24]" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"
                                fill="currentColor"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-[#a3a3a3]">{getNetworkName(chain?.id)} ETH</p>
                            <p className="font-semibold text-[#ffffff]">{ethBalance.toFixed(4)}</p>
                          </div>
                        </div>
                      </div>

                      {/* ROLL Token Balance */}
                      <div className="flex items-center justify-between p-3 bg-[#1a1a1a]/30 rounded-lg border border-[#404040]/30">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#fde047]/10 rounded-lg">
                            <Coins className="h-5 w-5 text-[#fde047]" />
                          </div>
                          <div>
                            <p className="text-xs text-[#a3a3a3]">ROLL Token</p>
                            <p className="font-semibold text-[#ffffff]">{rollBalance.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Section */}
                    <div className="p-2">
                      {/* Network Switch Buttons */}
                      {chain?.id !== 31337 && (
                        <button
                          onClick={() => {
                            setShowWalletMenu(false);
                            switchChain?.({ chainId: 31337 });
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#404040]/50 hover:scale-105 transition-all duration-200 text-left group "
                        >
                          <ArrowLeftRight className="h-4 w-4 text-[#fde047] group-hover:text-[#fef3c7]" />
                          <span className="text-sm text-[#ffffff] group-hover:text-[#fef3c7]">Switch to Hardhat</span>
                        </button>
                      )}

                      {chain?.id !== 11155111 && (
                        <button
                          onClick={() => {
                            setShowWalletMenu(false);
                            switchChain?.({ chainId: 11155111 });
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#404040]/50 hover:scale-105 transition-all duration-200 text-left group "
                        >
                          <ArrowLeftRight className="h-4 w-4 text-[#fde047] group-hover:text-[#fef3c7]" />
                          <span className="text-sm text-[#ffffff] group-hover:text-[#fef3c7]">Switch to Sepolia</span>
                        </button>
                      )}

                      <button
                        onClick={handleDisconnect}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 transition-colors text-left "
                      >
                        <LogOut className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-500">Disconnect</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <ConnectWalletButton
                label="Connect Wallet"
                icon={<Wallet className="mr-2 h-4 w-4" />}
                className="bg-gradient-to-r from-[#fde047] to-[#fbbf24] text-black hover:opacity-90 shadow-lg shadow-[#fde047]/30"
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden flex items-center justify-center gap-1 pb-3 px-4">
        {["Home", "Game", "History", "Docs"].map(page => (
          <button
            key={page}
            onClick={() => handleNavigate(page)}
            className={`flex-1 px-3 py-2 rounded-lg transition-all duration-200 text-sm flex items-center justify-center gap-1 ${
              currentPage === page
                ? "bg-gradient-to-r from-[#fde047]/20 to-[#fed7aa]/20 text-[#fde047] border border-[#fde047]/30"
                : "text-[#d4d4d4] hover:bg-[#404040]/50"
            }`}
          >
            {page === "Home" && <Home className="h-3 w-3" />}
            {page}
          </button>
        ))}
      </nav>
    </header>
  );
}
