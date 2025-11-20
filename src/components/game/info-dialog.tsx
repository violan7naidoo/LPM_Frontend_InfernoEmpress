/**
 * InfoDialog Component
 * 
 * This component displays game rules and information in a modal dialog.
 * It provides players with instructions on how to play the game.
 * 
 * Features:
 * - Game information (name, RTP, bet limits)
 * - How to Play section
 * - Special Features explanation
 * - Paylines information
 * - Turbo Mode explanation
 * - Responsible Gaming guidelines
 * 
 * Layout:
 * - Modal dialog with scrollable content
 * - Responsive sizing (95vw width, 90vh height)
 * - Sections organized in cards with borders
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Info } from 'lucide-react';
import { useGameConfig } from '@/hooks/use-game-config';
import { usePaylines } from '@/lib/slot-config';
import { SymbolDisplay } from './symbol-display';

interface InfoDialogProps {
  totalBet?: number;
  isMusicEnabled?: boolean;
  onToggleMusic?: () => void;
  isSfxEnabled?: boolean;
  onToggleSfx?: () => void;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
}

export function InfoDialog({ 
  totalBet,
  isMusicEnabled = true,
  onToggleMusic,
  isSfxEnabled = true,
  onToggleSfx,
  volume = 50,
  onVolumeChange
}: InfoDialogProps = {} as InfoDialogProps) {
  const { config } = useGameConfig();
  const paylines = usePaylines();
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="rounded-full !p-0 bg-black/30 hover:bg-black/50 transition-colors" style={{ padding: 0, width: '90px', height: '90px', minWidth: '90px', minHeight: '90px' }}>
          <Info style={{ width: '70px', height: '70px', minWidth: '70px', minHeight: '70px' }} className="text-white" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] bg-background/95 backdrop-blur-sm p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-4 pt-4 sm:px-6 flex-shrink-0">
          <DialogTitle className="font-headline text-accent text-xl sm:text-3xl">Game Rules & Pay Table</DialogTitle>
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
          {/* Game Rules Section */}
          <div className="mb-6">
            <h3 className="font-headline text-lg sm:text-2xl text-accent mb-3 sm:mb-4">How to Play</h3>
            
            <div className="space-y-4 text-sm sm:text-base text-muted-foreground">
              <div className="p-4 bg-card/30 border border-muted-foreground/20 rounded-lg">
                <h4 className="font-bold text-white mb-2">Basic Gameplay</h4>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Select your bet per payline using the + and - buttons</li>
                  <li>Choose the number of paylines (1 to {config?.maxPaylines || 10})</li>
                  <li>Click the SPIN button to start the reels</li>
                  <li>Wins are awarded for matching symbols on active paylines</li>
                  <li>Symbols must appear from left to right on a payline</li>
                </ul>
              </div>

              <div className="p-4 bg-card/30 border border-muted-foreground/20 rounded-lg">
                <h4 className="font-bold text-white mb-2">Special Features</h4>
                <ul className="space-y-2 list-disc list-inside">
                  <li><strong>Book Symbol:</strong> Acts as both wild and scatter. Substitutes for other symbols and triggers penny spins when 3+ appear</li>
                  <li><strong>Penny Spins:</strong> Landing 3+ Book symbols awards {config?.freeSpinsAwarded || 10} penny spins with an expanding symbol</li>
                  <li><strong>Expanding Symbol:</strong> During penny spins, one symbol is randomly selected to expand and cover entire reels</li>
                  <li><strong>Action Game:</strong> Triggered by 5 {config?.actionGameTriggers ? Object.values(config.actionGameTriggers)[0]?.symbol : 'ARCHAEOLOGIST'} symbols</li>
                </ul>
              </div>

              <div className="p-4 bg-card/30 border border-muted-foreground/20 rounded-lg">
                <h4 className="font-bold text-white mb-2">Paylines</h4>
                <ul className="space-y-2 list-disc list-inside">
                  <li>You can select 1 to {config?.maxPaylines || 10} paylines</li>
                  <li>Paylines run from left to right across the reels</li>
                  <li>Wins are awarded for 3 or more matching symbols</li>
                  <li>Higher symbol counts award bigger payouts</li>
                  <li>Total bet = Number of Paylines × Bet Per Payline</li>
                </ul>
              </div>

              <div className="p-4 bg-card/30 border border-muted-foreground/20 rounded-lg">
                <h4 className="font-bold text-white mb-2">Turbo Mode</h4>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Enable TURBO for faster reel spinning</li>
                  <li>Reduces animation time for quicker gameplay</li>
                  <li>All game mechanics remain the same</li>
                </ul>
              </div>

              <div className="p-4 bg-card/30 border border-muted-foreground/20 rounded-lg">
                <h4 className="font-bold text-white mb-2">Responsible Gaming</h4>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Set time and money limits before playing</li>
                  <li>Never chase losses</li>
                  <li>Take regular breaks from gaming</li>
                  <li>Gaming should be fun, not a way to make money</li>
                </ul>
              </div>
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

          {/* Audio Settings Section */}
          <div className="border-t border-muted-foreground/10 pt-6 mb-6">
            <h3 className="font-headline text-lg sm:text-2xl text-accent mb-3 sm:mb-4">Audio Settings</h3>
            
            <div className="space-y-6">
              {/* Volume Control */}
              <div className="space-y-3">
                <h4 className="font-headline text-white text-lg">Volume</h4>
                <div className="space-y-2">
                  <Slider
                    value={[volume ?? 50]}
                    onValueChange={(value) => onVolumeChange?.(value[0])}
                    max={100}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>0</span>
                    <span className="font-bold text-accent">{volume ?? 50}</span>
                    <span>100</span>
                  </div>
                </div>
              </div>

              {/* Music Toggle */}
              <div className="flex items-center justify-between p-4 bg-card/30 border border-muted-foreground/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="music-enabled"
                    checked={isMusicEnabled ?? true}
                    onCheckedChange={onToggleMusic}
                    className="w-5 h-5"
                  />
                  <label htmlFor="music-enabled" className="text-white font-medium">
                    Music Enabled
                  </label>
                </div>
              </div>

              {/* SFX Toggle */}
              <div className="flex items-center justify-between p-4 bg-card/30 border border-muted-foreground/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="sfx-enabled"
                    checked={isSfxEnabled ?? true}
                    onCheckedChange={onToggleSfx}
                    className="w-5 h-5"
                  />
                  <label htmlFor="sfx-enabled" className="text-white font-medium">
                    SFX Enabled
                  </label>
                </div>
              </div>

              {/* SFX Explanation */}
              <div className="p-3 bg-card/20 border border-muted-foreground/10 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  SFX includes reel spinning, win sounds, scatter effects, button clicks, and all game sound effects.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

