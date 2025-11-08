import { useEffect } from "react";
import { useEncryptedDiceGame } from "../hooks/useEncryptedDiceGame";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Calendar, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface GameHistoryProps {
  // No props needed - data comes from contract
}

export function GameHistory({}: GameHistoryProps) {
  const { gameHistory, isLoading, refresh, isContractAvailable } = useEncryptedDiceGame();

  // Auto-refresh games when component mounts
  useEffect(() => {
    if (isContractAvailable) {
      refresh();
    }
  }, [isContractAvailable, refresh]);

  const stats = {
    totalGames: gameHistory.length,
    wins: gameHistory.filter(g => g.won === true).length,
    losses: gameHistory.filter(g => g.won === false).length,
    totalWagered: gameHistory.reduce((sum, g) => sum + (g.stake || 0), 0),
    netProfit: gameHistory.reduce((sum, g) => {
      const stake = g.stake || 0;
      const payout = g.won ? stake * 1.95 : 0;
      return sum + (payout - stake);
    }, 0),
  };

  const winRate = stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Games</div>
          <div className="text-2xl font-bold">{stats.totalGames}</div>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4">
          <div className="text-sm text-muted-foreground mb-1">Win Rate</div>
          <div className="text-2xl font-bold text-green-500">{winRate.toFixed(1)}%</div>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Wagered</div>
          <div className="text-2xl font-bold">{stats.totalWagered.toFixed(0)}</div>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4">
          <div className="text-sm text-muted-foreground mb-1">Net Profit</div>
          <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
            {stats.netProfit >= 0 ? "+" : ""}
            {stats.netProfit.toFixed(2)}
          </div>
        </Card>
      </div>

      {/* History Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Game History</h2>
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
          ) : gameHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-4xl mb-2">🎲</div>
              <div>No games played yet</div>
              <div className="text-sm">Start rolling to see your history!</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Time</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Dice</TableHead>
                    <TableHead>Sum</TableHead>
                    <TableHead>Stake</TableHead>
                    <TableHead>Prediction</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead className="text-right">Profit/Loss</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gameHistory
                    .slice()
                    .reverse()
                    .map(game => {
                      const sum = (game.result || []).reduce((a: number, b: number) => a + b, 0);
                      const stake = game.stake || 0;
                      const payout = game.won ? stake * 1.95 : 0;
                      const profitLoss = payout - stake;

                      return (
                        <TableRow key={game.id} className="border-border hover:bg-secondary/30">
                          <TableCell className="text-muted-foreground">
                            {new Date(game.timestamp * 1000).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-secondary/50">
                              {game.diceCount} {game.diceCount === 1 ? "Die" : "Dice"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {(game.result || []).map((val: number, i: number) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center justify-center w-6 h-6 text-xs bg-white text-black rounded border border-gray-300"
                                >
                                  {val}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                sum % 2 === 0 ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                              }
                            >
                              {sum} {sum % 2 === 0 ? "Even" : "Odd"}
                            </Badge>
                          </TableCell>
                          <TableCell>{stake.toFixed(2)} ROLL</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                game.prediction === "even"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                              }
                            >
                              {game.prediction?.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={game.won ? "default" : "destructive"}
                              className={game.won ? "bg-green-500" : ""}
                            >
                              {game.won ? "Win" : "Loss"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div
                              className={`flex items-center justify-end gap-1 ${profitLoss >= 0 ? "text-green-500" : "text-red-500"}`}
                            >
                              {profitLoss >= 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              <span className="font-semibold">
                                {profitLoss >= 0 ? "+" : ""}
                                {profitLoss.toFixed(2)} ROLL
                              </span>
                            </div>
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
          All game results are stored on-chain and encrypted using FHEVM technology for fairness and transparency. 🔒
        </div>
      </Card>
    </div>
  );
}
