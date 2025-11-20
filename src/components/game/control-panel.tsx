/**
 * ControlPanel Component
 * 
 * This component displays the game control panel with bet controls, spin button,
 * and information displays. It's the main user interface for game interaction.
 * 
 * Features:
 * - Bet amount controls (increase/decrease with circular navigation)
 * - Spin button (changes text based on game state)
 * - Balance and win displays
 * - Turbo mode toggle
 * - Autoplay controls
 * - Info dialogs (Pay Table, Game Info, Audio Settings)
 * - Free spins and action game indicators
 * - Responsive layout (desktop and mobile)
 * 
 * Layout:
 * - Desktop: Single horizontal row with all controls
 * - Mobile: Stacked layout with multiple rows
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InfoDialog } from "./info-dialog";
import { Plus, Minus } from "lucide-react";
import { useGameConfig } from '@/hooks/use-game-config';

/**
 * Props interface for ControlPanel component
 * 
 * @param betPerPayline - Bet amount per payline (calculated from totalBet / numPaylines)
 * @param numPaylines - Number of active paylines (always 5 in this game)
 * @param totalBet - Total bet amount (betAmount from parent)
 * @param balance - Current player balance
 * @param lastWin - Last win amount from previous spin
 * @param isSpinning - Whether reels are currently spinning
 * @param onSpin - Callback function to trigger a spin
 * @param onIncreaseBet - Callback to increase bet amount (circular)
 * @param onDecreaseBet - Callback to decrease bet amount (circular)
 * @param freeSpinsRemaining - Number of free spins remaining
 * @param isFreeSpinsMode - Whether currently in free spins mode
 * @param actionGameSpins - Number of action game spins remaining
 * @param isTurboMode - Whether turbo mode is enabled
 * @param onToggleTurbo - Callback to toggle turbo mode
 * @param isMusicEnabled - Whether background music is enabled
 * @param onToggleMusic - Callback to toggle music
 * @param isSfxEnabled - Whether sound effects are enabled
 * @param onToggleSfx - Callback to toggle sound effects
 * @param volume - Current volume level (0-100)
 * @param onVolumeChange - Callback to change volume
 * @param maxPaylines - Maximum number of paylines (from config)
 * @param featureSymbol - Currently selected feature symbol for free spins
 * @param autoplayState - Current autoplay state and settings
 * @param onStartAutoplay - Callback to start autoplay
 * @param onStopAutoplay - Callback to stop autoplay
 * @param onShowAutoplayDialog - Callback to show autoplay settings dialog
 */
interface ControlPanelProps {
  betPerPayline: number;
  numPaylines: number;
  totalBet: number;
  balance: number;
  lastWin: number;
  isSpinning: boolean;
  onSpin: () => void;
  onIncreaseBet: () => void;
  onDecreaseBet: () => void;
  onIncreasePaylines: () => void;
  onDecreasePaylines: () => void;
  freeSpinsRemaining: number;
  isFreeSpinsMode: boolean;
  actionGameSpins: number;
  isTurboMode: boolean;
  onToggleTurbo: () => void;
  isMusicEnabled: boolean;
  onToggleMusic: () => void;
  isSfxEnabled: boolean;
  onToggleSfx: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  maxPaylines: number;
  featureSymbol?: string;
  autoplayState?: {
    isActive: boolean;
    settings: any;
    spinsRemaining: number;
    totalLoss: number;
    originalBalance: number;
  };
  onStartAutoplay?: (settings: any) => void;
  onStopAutoplay?: () => void;
  onShowAutoplayDialog?: () => void;
}

/**
 * InfoDisplay Component
 * 
 * Displays a single information item (Balance, Win, Bet, etc.)
 * Used in the desktop layout of the control panel.
 * 
 * @param label - Display label (e.g., "Balance", "Win")
 * @param value - Value to display (number or string)
 * @param isCurrency - Whether to format as currency (adds "R" prefix)
 */
const InfoDisplay = ({ label, value, isCurrency = true, backgroundImage }: { label: string; value: number | string; isCurrency?: boolean; backgroundImage?: string }) => (
    <div 
        className="flex flex-col items-center justify-center p-0 rounded-md text-center h-full info-display-bg flex-[3] min-w-[120px] relative"
        style={backgroundImage ? {
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
        } : {}}
    >
        <span className="text-4xl uppercase tracking-widest subtle-cyan-text mb-0 relative z-10" style={{ fontFamily: 'Cinzel, serif' }}>{label}</span>
        <span className="text-4xl font-bold cyan-text-glow leading-none relative z-10" style={{ fontFamily: 'Cinzel, serif' }}>
            {isCurrency ? `R${value}` : value}
        </span>
    </div>
);

/**
 * MobileInfoDisplay Component
 * 
 * Mobile-optimized version of InfoDisplay with smaller text and full width.
 * Used in the mobile layout of the control panel.
 * 
 * @param label - Display label (e.g., "Balance", "Win")
 * @param value - Value to display (number or string)
 * @param isCurrency - Whether to format as currency (adds "R" prefix)
 */
const MobileInfoDisplay = ({ label, value, isCurrency = true }: { label: string; value: number | string; isCurrency?: boolean }) => (
    <div className="flex flex-col items-center justify-center p-1 rounded-md w-full text-center min-h-[48px] info-display-bg">
        <span className="text-[10px] uppercase tracking-widest subtle-cyan-text" style={{ fontFamily: 'Cinzel, serif' }}>{label}</span>
        <span className="text-base font-bold cyan-text-glow" style={{ fontFamily: 'Cinzel, serif' }}>
            {isCurrency ? `R${value}` : value}
        </span>
    </div>
);

export function ControlPanel({
  betPerPayline,
  numPaylines,
  totalBet,
  balance,
  lastWin,
  isSpinning,
  onSpin,
  onIncreaseBet,
  onDecreaseBet,
  onIncreasePaylines,
  onDecreasePaylines,
  freeSpinsRemaining,
  isFreeSpinsMode,
  actionGameSpins,
  isTurboMode,
  onToggleTurbo,
  isMusicEnabled,
  onToggleMusic,
  isSfxEnabled,
  onToggleSfx,
  volume,
  onVolumeChange,
  maxPaylines,
  featureSymbol,
  autoplayState,
  onStartAutoplay,
  onStopAutoplay,
  onShowAutoplayDialog,
}: ControlPanelProps) {
  // Load game configuration (kept for potential future use)
  const { config } = useGameConfig();

  return (
    <Card className="w-full h-full p-0 shadow-2xl control-panel-card backdrop-blur">
        {/* Desktop layout - single horizontal line */}
        <div className="hidden sm:flex items-stretch justify-between gap-0 h-full min-h-[120px] md:min-h-[140px] lg:min-h-[160px]">
            {/* Balance */}
            <InfoDisplay label="Balance" value={(balance ?? 0).toFixed(2)} backgroundImage="/frame/frame-balance.png" />
            
            {/* Bet Amount */}
            {!isFreeSpinsMode && (
                <div 
                    className="flex flex-col items-center justify-center p-0 rounded-md text-center h-full info-display-bg flex-[3] min-w-[120px] relative"
                    style={{
                        backgroundImage: 'url(/frame/frame-bet.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }}
                >
                    <span className="text-4xl uppercase tracking-widest subtle-cyan-text mb-0 relative z-10" style={{ fontFamily: 'Cinzel, serif',  marginTop: '25px' }}>Bet</span>
                    <div className="flex items-center gap-1 justify-center w-full relative z-10">
                        <Button variant="ghost" size="icon" className="h-16 w-16 md:h-20 md:w-20 hover:text-cyan-200 bet-button-icon !p-0" onClick={onIncreaseBet} disabled={isSpinning} style={{ padding: 0 }}>
                            <Plus style={{ width: '60px', height: '60px', minWidth: '80px', minHeight: '80px', marginTop: '-15px' }} />
                        </Button>
                        <span className="text-4xl font-bold px-1 cyan-text-glow leading-none" style={{ fontFamily: 'Cinzel, serif', marginTop: '-15px' }}>
                            R{totalBet.toFixed(2)}
                        </span>
                        <Button variant="ghost" size="icon" className="h-16 w-16 md:h-20 md:w-20 hover:text-cyan-200 bet-button-icon !p-0" onClick={onDecreaseBet} disabled={isSpinning} style={{ padding: 0 }}>
                            <Minus style={{ width: '60px', height: '60px', minWidth: '80px', minHeight: '80px', marginTop: '-15px' }} />
                        </Button>
                    </div>
                </div>
            )}
            {isFreeSpinsMode && (
                <div 
                    className="flex flex-col items-center justify-center p-0 rounded-md text-center h-full flex-[3] min-w-[120px] relative"
                    style={{
                        backgroundImage: 'url(/frame/frame-bet.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }}
                >
                    <div className="flex flex-col items-center justify-center p-0 rounded-md text-center h-full w-full relative" style={{ background: 'transparent' }}>
                        <span className="text-4xl uppercase tracking-widest subtle-cyan-text mb-0 relative z-10" style={{ fontFamily: 'Cinzel, serif' }}>Penny Spins</span>
                        <span className="text-4xl font-bold cyan-text-glow leading-none relative z-10" style={{ fontFamily: 'Cinzel, serif' }}>
                            {freeSpinsRemaining}
                        </span>
                    </div>
                </div>
            )}
            {actionGameSpins > 0 && !isFreeSpinsMode && (
                <div 
                    className="flex flex-col items-center justify-center p-0 rounded-md text-center h-full flex-[3] min-w-[120px] relative"
                    style={{
                        backgroundImage: 'url(/frame/frame-bet.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }}
                >
                    <div className="flex flex-col items-center justify-center p-0 rounded-md text-center h-full w-full relative" style={{ background: 'transparent' }}>
                        <span className="text-4xl uppercase tracking-widest subtle-cyan-text mb-0 relative z-10" style={{ fontFamily: 'Cinzel, serif' }}>Action Spins</span>
                        <span className="text-4xl font-bold cyan-text-glow leading-none relative z-10" style={{ fontFamily: 'Cinzel, serif' }}>
                            {actionGameSpins}
                        </span>
                    </div>
                </div>
            )}

            {/* Win */}
            <InfoDisplay label="Win" value={(lastWin ?? 0).toFixed(2)} backgroundImage="/frame/frame-win.png" />
        
            {/* Info and Audio Settings */}
            <div 
                className="flex items-center justify-center gap-0 rounded-md text-center h-full info-display-bg flex-[1] min-w-[120px] relative"
                style={{
                    backgroundImage: 'url(/frame/frame-icon.png)',
                    backgroundSize: '90% 90%',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                <InfoDialog 
                  totalBet={totalBet}
                  isMusicEnabled={isMusicEnabled}
                  onToggleMusic={onToggleMusic}
                  isSfxEnabled={isSfxEnabled}
                  onToggleSfx={onToggleSfx}
                  volume={volume}
                  onVolumeChange={onVolumeChange}
                />
            </div>
        </div>

        {/* Mobile layout */}
        <div className="sm:hidden space-y-2 mt-2">
            {/* Top row: Win, Bet */}
            <div className="flex gap-2">
                <div className="flex-1">
                    <MobileInfoDisplay label="Win" value={(lastWin ?? 0).toFixed(2)} />
                </div>
                {!isFreeSpinsMode && (
                    <>
                        <div className="flex-1">
                            <div className="flex flex-col items-center justify-center p-1 rounded-md text-center min-h-[48px] info-display-bg">
                                <span className="text-[8px] uppercase tracking-widest subtle-cyan-text" style={{ fontFamily: 'Cinzel, serif' }}>Bet</span>
                                <div className="flex items-center gap-0.5 justify-center w-full mt-0.5">
                                    <Button variant="ghost" size="icon" className="h-4 w-4 hover:text-cyan-200 bet-button-icon" onClick={onIncreaseBet} disabled={isSpinning}>
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                    <span className="text-sm font-bold px-1 cyan-text-glow" style={{ fontFamily: 'Cinzel, serif' }}>
                                        R{totalBet.toFixed(2)}
                                    </span>
                                    <Button variant="ghost" size="icon" className="h-4 w-4 hover:text-cyan-200 bet-button-icon" onClick={onDecreaseBet} disabled={isSpinning}>
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
                {isFreeSpinsMode && (
                    <div className="flex-1">
                        <MobileInfoDisplay label="Penny Spins" value={freeSpinsRemaining} isCurrency={false} />
                    </div>
                )}
                {actionGameSpins > 0 && !isFreeSpinsMode && (
                    <div className="flex-1">
                        <MobileInfoDisplay label="Action Spins" value={actionGameSpins} isCurrency={false} />
                    </div>
                )}
            </div>

            {/* Bottom row: Balance and Pay Table/Music */}
            <div className="flex gap-2">
                <div className="flex-1">
                    <MobileInfoDisplay label="Balance" value={(balance ?? 0).toFixed(2)} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-center gap-0 p-0 rounded-md text-center min-h-[48px] info-display-bg">
                    <InfoDialog 
                      totalBet={totalBet}
                      isMusicEnabled={isMusicEnabled}
                      onToggleMusic={onToggleMusic}
                      isSfxEnabled={isSfxEnabled}
                      onToggleSfx={onToggleSfx}
                      volume={volume}
                      onVolumeChange={onVolumeChange}
                    />
                    </div>
                </div>
            </div>
        </div>
    </Card>
  );
}

