/**
 * PayTableDialog Component
 * 
 * This component displays a detailed paytable showing all symbol payouts
 * for different bet amounts. It's accessible from the control panel.
 * 
 * Features:
 * - Shows all symbols with their images
 * - Displays payouts for current bet amount (if totalBet provided)
 * - Shows payouts for all bet amounts (if totalBet not provided)
 * - Displays action games (AG) when available
 * - Responsive grid layout (2-5 columns based on screen size)
 * 
 * Layout:
 * - Modal dialog with scrollable content
 * - Grid of symbol cards (2 cols mobile, 3 cols tablet, 5 cols desktop)
 * - Each card shows symbol image, name, and payouts
 * 
 * Data:
 * - Reads from game config (symbol.payout and symbol.actionGames)
 * - Formats bet keys as "1.00", "2.00", etc.
 * - Shows payout counts (2x, 3x, 4x, 5x) based on config
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePaylines, type SymbolId } from '@/lib/slot-config';
import { useSymbols } from '@/lib/symbols';
import { SymbolDisplay } from './symbol-display';
import { Menu } from 'lucide-react';
import { useGameConfig } from '@/hooks/use-game-config';

/**
 * Props interface for PayTableDialog component
 * 
 * @param betPerPayline - Bet amount per payline (currently unused, kept for compatibility)
 * @param totalBet - Total bet amount (R1, R2, R3, or R5)
 *                   If provided, shows payouts for this bet only
 *                   If not provided, shows payouts for all bet amounts
 */
interface PayTableDialogProps {
  betPerPayline?: number;
  totalBet?: number; // Total bet amount (R1, R2, R3, or R5)
}

export function PayTableDialog({ betPerPayline = 0.20, totalBet }: PayTableDialogProps) {
  const symbols = useSymbols();
  const paylines = usePaylines();
  const { config } = useGameConfig();
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="rounded-full w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 p-1 bg-black/30 hover:bg-black/50 transition-colors">
          <Menu className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-white" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] bg-background/95 backdrop-blur-sm p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-4 pt-4 sm:px-6 flex-shrink-0">
          <DialogTitle className="font-headline text-accent text-xl sm:text-3xl">Pay Table</DialogTitle>
        </DialogHeader>
        
        {/* Game Information Section */}
        <div className="px-4 pb-4 border-b border-muted-foreground/10">
          <h2 className="font-headline text-white text-2xl sm:text-3xl mb-3">{config?.gameName || 'Frosty Fortunes'}</h2>
          <div className="space-y-1 text-sm sm:text-base text-white">
            <p>{config?.gameName || 'Frosty Fortunes'} is a {config?.numReels || 5}x{config?.numRows || 3} slot game with {config?.maxPaylines || 10} paylines.</p>
            <p>The RTP-rate (return-to-player) is 96.00%.</p>
            <p>Minimum bet: R {config?.betAmounts?.[0]?.toFixed(2) || '0.20'}</p>
            <p>Maximum bet: R {config?.betAmounts?.[config?.betAmounts.length - 1]?.toFixed(2) || '5.00'}</p>
          </div>
        </div>
        
        {/* Combined Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Payouts Section */}
          <div className="mb-6">
            <h3 className="font-headline text-lg sm:text-2xl text-accent mb-3 sm:mb-4">Payouts</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {Object.entries(symbols).map(([symbolId, symbol]) => (
                <div key={symbolId} className="bg-card/50 border border-muted-foreground/20 rounded-lg p-3 hover:bg-card/70 transition-colors">
                  {/* Symbol Image */}
                  <div className="flex justify-center mb-3">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                      <SymbolDisplay symbolId={symbolId as SymbolId} />
                    </div>
                  </div>
                  
                  {/* Symbol Name */}
                  <h4 className="text-center text-xs sm:text-sm font-medium text-muted-foreground mb-3">
                    {symbol.name}
                  </h4>
                  
                  {/* Payouts - Show for current bet or all bets */}
                  <div className="space-y-1">
                    {(() => {
                      // Get payout counts (2, 3, 4, 5) - check what's available in the payout structure
                      const payoutCounts = new Set<number>();
                      if (symbol.payout) {
                        // Get all bet amounts
                        const betAmounts = Object.keys(symbol.payout);
                        betAmounts.forEach(betKey => {
                          const counts = Object.keys(symbol.payout![betKey]).map(Number);
                          counts.forEach(count => payoutCounts.add(count));
                        });
                      }
                      const sortedCounts = Array.from(payoutCounts).sort((a, b) => a - b);
                      
                      // Use counts 2, 3, 4, 5 if available, otherwise default to 3, 4, 5
                      const displayCounts = sortedCounts.length > 0 ? sortedCounts : [3, 4, 5];
                      
                      return displayCounts.map((count) => {
                        // Get payout for current bet amount, or show all bet amounts
                        let payoutDisplay = '-';
                        
                        if (symbol.payout && totalBet) {
                          // Show payout for current bet
                          const betKey = totalBet.toFixed(2);
                          const payoutForBet = symbol.payout[betKey];
                          if (payoutForBet && payoutForBet[count.toString()]) {
                            payoutDisplay = `R ${payoutForBet[count.toString()].toFixed(2)}`;
                          }
                        } else if (symbol.payout) {
                          // Show payouts for all bet amounts
                          const betKeys = Object.keys(symbol.payout).sort();
                          const payouts = betKeys.map(betKey => {
                            const payout = symbol.payout![betKey][count.toString()];
                            return payout ? `R${betKey}: R${payout.toFixed(2)}` : null;
                          }).filter(Boolean);
                          if (payouts.length > 0) {
                            payoutDisplay = payouts.join(', ');
                          }
                        }
                        
                        return (
                          <div key={count} className="flex justify-between items-center text-xs sm:text-sm">
                            <span className="text-muted-foreground">{count}x</span>
                            <span className="font-bold text-accent text-right" style={{ fontSize: '0.7rem' }}>
                              {payoutDisplay}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Special Symbols Section */}
          <div className="border-t border-muted-foreground/10 pt-6 mb-6">
            <h3 className="font-headline text-lg sm:text-2xl text-accent mb-3 sm:mb-4">Special Symbols</h3>
            
            {/* Book Symbol (Wild/Scatter) */}
            <div className="mb-6 p-4 bg-card/30 border border-muted-foreground/20 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20">
                    <SymbolDisplay symbolId={config?.bookSymbol || 'Scatter'} />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white text-lg mb-3">Scatter (Wild & Scatter)</h4>
                  <div className="mb-3">
                    <div className="text-sm text-accent font-bold mb-2">
                      3+ Scatters = {config?.freeSpinsAwarded || 10} Penny Spins
                    </div>
                    {/* Scatter Payouts */}
                    {config?.scatterPayout && (
                      <div className="space-y-1 text-xs sm:text-sm">
                        {(() => {
                          const scatterCounts = new Set<number>();
                          Object.keys(config.scatterPayout).forEach(betKey => {
                            Object.keys(config.scatterPayout![betKey]).map(Number).forEach(count => scatterCounts.add(count));
                          });
                          const sortedCounts = Array.from(scatterCounts).sort((a, b) => a - b);
                          
                          return sortedCounts.map((count) => {
                            let payoutDisplay = '-';
                            if (totalBet) {
                              const betKey = totalBet.toFixed(2);
                              const payoutForBet = config.scatterPayout![betKey];
                              if (payoutForBet && payoutForBet[count.toString()]) {
                                payoutDisplay = `R ${payoutForBet[count.toString()].toFixed(2)}`;
                              }
                            } else {
                              const betKeys = Object.keys(config.scatterPayout).sort();
                              const payouts = betKeys.map(betKey => {
                                const payout = config.scatterPayout![betKey][count.toString()];
                                return payout ? `R${betKey}: R${payout.toFixed(2)}` : null;
                              }).filter(Boolean);
                              if (payouts.length > 0) {
                                payoutDisplay = payouts.join(', ');
                              }
                            }
                            
                            return (
                              <div key={count} className="flex justify-between items-center">
                                <span className="text-muted-foreground">{count}x Scatter:</span>
                                <span className="font-bold text-accent">{payoutDisplay}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The Scatter symbol acts as both a wild and scatter. It substitutes for other symbols to create wins, and landing 3 or more anywhere on the reels awards {config?.freeSpinsAwarded || 10} penny spins with a randomly selected expanding symbol.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Paylines Section */}
          <div className="border-t border-muted-foreground/10 pt-6">
            <h3 className="font-headline text-lg sm:text-2xl text-accent mb-3 sm:mb-4">Paylines</h3>
            <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4">
              Wins are awarded for left-to-right matching symbols on active paylines.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
              {paylines.map((line, index) => (
                <div key={index} className="p-2 border rounded-lg bg-card/50">
                  <p className="text-center font-bold text-accent text-xs sm:text-sm mb-1.5 sm:mb-2">
                    Line {index + 1}
                  </p>
                  <div className="grid grid-cols-5 gap-1">
                    {Array.from({ length: config?.numRows || 3 }).map((_, rowIndex) =>
                      Array.from({ length: config?.numReels || 5 }).map((_, colIndex) => {
                        const isPayline = line[colIndex] === rowIndex;
                        return (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                              isPayline ? 'bg-accent' : 'bg-muted/30'
                            }`}
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

