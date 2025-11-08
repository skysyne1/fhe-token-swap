import { useRouter } from "next/navigation";
import { Dices, Github, MessageCircle } from "lucide-react";

export function Footer() {
  const router = useRouter();

  const handleNavigate = (page: string) => {
    const routeMap: Record<string, string> = {
      Game: "/game",
      History: "/history",
      Docs: "/docs",
    };
    router.push(routeMap[page]);
  };
  return (
    <footer className="w-full border-t border-[#404040] bg-[#1a1a1a] mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Dices className="h-6 w-6 text-[#fde047] drop-shadow-[0_0_8px_rgba(253,224,71,0.4)]" />
              <span className="text-[#fde047] font-bold">Encrypted Dice Roll</span>
            </div>
            <p className="text-sm text-[#a3a3a3] leading-relaxed">Privacy-first dice gaming with FHEVM encryption</p>
          </div>

          {/* Game Links */}
          <div className="space-y-4">
            <h3 className="text-[#ffffff] font-semibold">Game</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleNavigate("Game")}
                  className="text-sm text-[#a3a3a3] hover:text-[#fde047] transition-colors duration-200"
                >
                  Play Dice
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigate("History")}
                  className="text-sm text-[#a3a3a3] hover:text-[#fde047] transition-colors duration-200"
                >
                  Game History
                </button>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-[#ffffff] font-semibold">Resources</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleNavigate("Docs")}
                  className="text-sm text-[#a3a3a3] hover:text-[#fde047] transition-colors duration-200"
                >
                  Documentation
                </button>
              </li>
              <li>
                <a
                  href="https://docs.zama.ai/fhevm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#a3a3a3] hover:text-[#fde047] transition-colors duration-200"
                >
                  About FHEVM
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h3 className="text-[#ffffff] font-semibold">Connect</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#a3a3a3] hover:text-[#fde047] transition-colors duration-200"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://discord.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#a3a3a3] hover:text-[#fde047] transition-colors duration-200"
                >
                  <MessageCircle className="h-4 w-4" />
                  Discord
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="border-t border-[#333333]">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-[#a3a3a3]">© 2024 Encrypted Dice Roll. Built with FHEVM technology</p>
        </div>
      </div>
    </footer>
  );
}
