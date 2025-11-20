/**
 * BottomSection Component
 * 
 * This component is the container for the slot machine reels and control panel.
 * It takes up the largest portion of the game layout (3/6 of vertical space).
 * 
 * Props:
 * @param betAmount - Current bet amount (e.g., 1.00, 2.00, 3.00, 5.00)
 * @param setBetAmount - Function to update the bet amount
 * @param betPerPayline - Calculated bet per payline (betAmount / numPaylines)
 * 
 * Layout:
 * - flex-[3]: Takes 3/6 of vertical space (largest section)
 * - Contains the SlotMachine component which includes:
 *   - Reel grid (5 reels × 3 rows)
 *   - Control panel (bet controls, spin button, info buttons)
 *   - Win animations and dialogs
 * 
 * Data Flow:
 * - Receives betAmount state from page.tsx
 * - Passes betAmount and setBetAmount down to SlotMachine
 * - SlotMachine handles bet increment/decrement and communicates with backend
 */

'use client';

import { SlotMachine } from './slot-machine';

/**
 * Props interface for BottomSection component
 */
interface BottomSectionProps {
  betAmount: number;
  setBetAmount: (amount: number) => void;
  betPerPayline: number;
  onFreeSpinsStateChange?: (isFreeSpinsMode: boolean, featureSymbol: string) => void;
  onActionWheelStateChange?: (showWheel: boolean, spins: number, accumulatedWin: number) => void;
  onSessionIdChange?: (sessionId: string) => void;
  onBalanceUpdateCallback?: (callback: (balance: number) => void) => void;
  showActionWheel?: boolean;
  actionGameSpins?: number;
  accumulatedActionWin?: number;
  onActionWheelSpin?: () => Promise<{ result: string; win: number; additionalSpins: number }>;
  onActionWheelSpinTrigger?: () => void;
  onFeatureSymbolSelectionStateChange?: (show: boolean, symbol: string, count: number) => void;
  onFeatureGameWinsStateChange?: (showFeatureGameWins: boolean) => void;
  showFeatureSymbolSelection?: boolean;
}

export function BottomSection({ betAmount, setBetAmount, betPerPayline, onFreeSpinsStateChange, onActionWheelStateChange, onSessionIdChange, onBalanceUpdateCallback, showActionWheel, actionGameSpins, accumulatedActionWin, onActionWheelSpin, onActionWheelSpinTrigger, onFeatureSymbolSelectionStateChange, onFeatureGameWinsStateChange, showFeatureSymbolSelection }: BottomSectionProps) {
  return (
    // Main container: flex-[1.9] means this section takes 1.9/4.4 of the vertical space
    // flex flex-col: Vertical flex layout
    // overflow-hidden: Prevents content from spilling outside container
    // justify-end: Aligns content to the bottom so control panel ends at screen bottom
    <div className="flex-[2.3] flex flex-col w-full h-full overflow-hidden justify-end" style={{ marginTop: '0' }}>
      {/* Wrapper for SlotMachine - ensures full width */}
      <div className="w-full">
        {/* 
          SlotMachine Component
          - Main game logic and reel spinning
          - Handles bet controls (circular increment/decrement)
          - Manages spin state and animations
          - Communicates with backend API
          - Displays win animations and feature games
        */}
        <SlotMachine 
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          betPerPayline={betPerPayline}
          onFreeSpinsStateChange={onFreeSpinsStateChange}
          onActionWheelStateChange={onActionWheelStateChange}
          onSessionIdChange={onSessionIdChange}
          onBalanceUpdateCallback={onBalanceUpdateCallback}
          showActionWheel={showActionWheel}
          actionGameSpins={actionGameSpins}
          accumulatedActionWin={accumulatedActionWin}
          onActionWheelSpin={onActionWheelSpin}
          onActionWheelSpinTrigger={onActionWheelSpinTrigger}
          onFeatureSymbolSelectionStateChange={onFeatureSymbolSelectionStateChange}
          onFeatureGameWinsStateChange={onFeatureGameWinsStateChange}
          showFeatureSymbolSelection={showFeatureSymbolSelection}
        />
      </div>
    </div>
  );
}

