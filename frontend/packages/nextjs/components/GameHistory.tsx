import { useEffect } from "react";
import { useEncryptedDiceGame } from "../hooks/useEncryptedDiceGame";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ArrowDownUp, Calendar, RefreshCw } from "lucide-react";
import { formatEther } from "viem";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface GameHistoryProps {
  // No props needed - data comes from contract
}

export function GameHistory({}: GameHistoryProps) {
  const { swapHistory, isLoading, refresh, isContractAvailable } = useEncryptedDiceGame();

  // Auto-refresh swaps when component mounts
  useEffect(() => {
    if (isContractAvailable) {
      refresh();
    }
  }, [isContractAvailable, refresh]);

  const stats = {
    totalSwaps: swapHistory.length,
    ethToRoll: swapHistory.filter(s => s.direction === "ETH_TO_ROLL").length,
    rollToEth: swapHistory.filter(s => s.direction === "ROLL_TO_ETH").length,
    totalEthSwapped: swapHistory.reduce((sum, s) => sum + s.ethAmount, 0n),
    totalRollSwapped: swapHistory.reduce((sum, s) => sum + s.rollAmount, 0n),
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Swaps</div>
          <div className="text-2xl font-bold">{stats.totalSwaps}</div>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4">
          <div className="text-sm text-muted-foreground mb-1">ETH → ROLL</div>
          <div className="text-2xl font-bold text-blue-500">{stats.ethToRoll}</div>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4">
          <div className="text-sm text-muted-foreground mb-1">ROLL → ETH</div>
          <div className="text-2xl font-bold text-yellow-500">{stats.rollToEth}</div>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4">
          <div className="text-sm text-muted-foreground mb-1">Total ETH Swapped</div>
          <div className="text-2xl font-bold">{formatEther(stats.totalEthSwapped)}</div>
        </Card>
      </div>

      {/* History Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Swap History</h2>
            </div>
            <Button
              onClick={refresh}
              disabled={isLoading || !isContractAvailable}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {!isContractAvailable ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-4xl mb-2">⚠️</div>
              <div>Smart contract not ready</div>
              <div className="text-sm">Please connect wallet and check network</div>
            </div>
          ) : swapHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-4xl mb-2">🔄</div>
              <div>No swaps yet</div>
              <div className="text-sm">Start swapping to see your history!</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Time</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>ETH Amount</TableHead>
                    <TableHead>ROLL Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {swapHistory.map(swap => {
                    const ethAmount = formatEther(swap.ethAmount);
                    const rollAmount = swap.rollAmount.toString();

                    return (
                      <TableRow key={swap.id} className="border-border hover:bg-secondary/30">
                        <TableCell className="text-muted-foreground">
                          {new Date(swap.timestamp * 1000).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              swap.direction === "ETH_TO_ROLL"
                                ? "bg-blue-500/20 text-blue-500"
                                : "bg-yellow-500/20 text-yellow-500"
                            }
                          >
                            <ArrowDownUp className="h-3 w-3 mr-1" />
                            {swap.direction === "ETH_TO_ROLL" ? "ETH → ROLL" : "ROLL → ETH"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">{ethAmount} ETH</TableCell>
                        <TableCell className="font-mono">{rollAmount} ROLL</TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-500">
                            Completed
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>

      {/* Info */}
      <Card className="bg-card/30 backdrop-blur-sm border-border/30 p-4">
        <div className="text-sm text-muted-foreground">
          All swap transactions are stored on-chain and encrypted using FHEVM technology for privacy and transparency.
          🔒
        </div>
      </Card>
    </div>
  );
}
