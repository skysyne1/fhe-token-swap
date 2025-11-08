import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  message?: string;
  description?: string;
  showDice?: boolean;
}

export function LoadingOverlay({ message = "Processing...", description, showDice = false }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#2a2a2a] border border-[#404040]/50 rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
        <div className="flex flex-col items-center gap-6">
          {/* Animated Icon */}
          {showDice ? (
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 flex items-center justify-center text-5xl animate-[spin_1s_ease-in-out_infinite]">
                🎲
              </div>
              <div className="absolute inset-0 border-4 border-[#fde047]/20 border-t-[#fde047] rounded-lg animate-spin" />
            </div>
          ) : (
            <div className="relative w-20 h-20">
              <Loader2 className="w-20 h-20 text-[#fde047] animate-spin" strokeWidth={2} />
              <div className="absolute inset-0 bg-gradient-to-r from-[#fde047]/20 to-[#fed7aa]/20 rounded-full blur-xl" />
            </div>
          )}

          {/* Message */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold bg-gradient-to-r from-[#fde047] via-[#fef3c7] to-[#fed7aa] bg-clip-text text-transparent">
              {message}
            </h3>
            {description && <p className="text-sm text-[#a3a3a3]">{description}</p>}
          </div>

          {/* Progress Indicator */}
          <div className="w-full h-1 bg-[#404040] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#fde047] to-[#fed7aa] animate-[shimmer_1.5s_ease-in-out_infinite]"
              style={{ width: "60%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
