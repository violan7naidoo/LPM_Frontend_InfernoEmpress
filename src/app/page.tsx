/**
 * Home Page Component (Main Game Page)
 * 
 * This is the main entry point for the slot game application.
 * It manages the top-level game state and renders the three main sections.
 * 
 * Responsibilities:
 * - Manages betAmount state (lifted from slot-machine for sharing)
 * - Calculates betPerPayline (betAmount / numPaylines)
 * - Renders game layout (TopSection, MiddleSection, BottomSection)
 * - Passes state down to child components
 * 
 * Layout Structure:
 * - TopSection: Action Games Wheel (placeholder)
 * - MiddleSection: Dynamic paytable (receives betAmount)
 * - BottomSection: Slot machine and controls (receives betAmount, setBetAmount)
 * 
 * State Management:
 * - betAmount: Managed here, passed down as props
 * - betPerPayline: Calculated here, passed to BottomSection
 * - numPaylines: Static value (always 5)
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { TopSection } from "@/components/game/TopSection";
import { MiddleSection } from "@/components/game/MiddleSection";
import { BottomSection } from "@/components/game/BottomSection";
import { BackgroundAnimation } from "@/components/game/BackgroundAnimation";
import { useBetAmounts } from '@/lib/slot-config';
import { gameApi } from '@/lib/game-api';

export default function Home() {
  // Get available bet amounts from config (e.g., [1.00, 2.00, 3.00, 5.00])
  const betAmounts = useBetAmounts();
  
  /**
   * Preload all animation images into browser cache early
   * This prevents lag when animations start playing
   */
  useEffect(() => {
    const preloadImages = async () => {
      const imagePromises: Promise<void>[] = [];
      
      // Preload idle animation images (121 images)
      for (let i = 1; i <= 121; i++) {
        const img = document.createElement('img');
        const promise = new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Continue even if some images fail
          img.src = `/idle/idle_${i}.webp`;
        });
        imagePromises.push(promise);
      }
      
      // Preload Background1 images (242 images)
      for (let i = 1; i <= 242; i++) {
        const img = document.createElement('img');
        const promise = new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = `/animations/Background1/Background_${i}.webp`;
        });
        imagePromises.push(promise);
      }
      
      // Load all images in parallel (browser will cache them)
      // Don't wait for all to complete - let them load in background
      Promise.all(imagePromises).then(() => {
        console.log('Animation images preloaded into cache');
      }).catch(() => {
        // Silently handle errors
      });
    };
    
    // Start preloading immediately on mount
    preloadImages();
  }, []); // Run once on mount
  
  /**
   * betAmount state - lifted from slot-machine.tsx to enable sharing
   * 
   * Initialized to first bet amount from config (or 1.00 as fallback)
   * This state is shared between:
   * - MiddleSection: Displays payouts for current bet
   * - BottomSection: Passed to SlotMachine for bet controls
   */
  const [betAmount, setBetAmount] = useState(betAmounts[0] || 1.00);
  
  /**
   * Free spins state - managed here to share with MiddleSection
   * - isFreeSpinsMode: Whether currently in free spins mode
   * - featureSymbol: The expanding symbol selected for free spins
   */
  const [isFreeSpinsMode, setIsFreeSpinsMode] = useState(false);
  const [featureSymbol, setFeatureSymbol] = useState<string>('');

  /**
   * Action wheel state - managed here to share with MiddleSection
   * - showActionWheel: Whether to show the action wheel
   * - actionGameSpins: Number of action game spins available
   * - accumulatedActionWin: Total accumulated wins from action games
   */
  const [showActionWheel, setShowActionWheel] = useState(false);
  const [actionGameSpins, setActionGameSpins] = useState(0);
  const [accumulatedActionWin, setAccumulatedActionWin] = useState(0);
  const [sessionId, setSessionId] = useState<string>('');
  const balanceUpdateRef = useRef<((balance: number) => void) | null>(null);
  const actionWheelSpinTriggerRef = useRef<(() => void) | null>(null);
  const [actionGameWinMessage, setActionGameWinMessage] = useState<string>('');
  const [actionGameWinAmount, setActionGameWinAmount] = useState<number>(0);
  const [actionGamesFinished, setActionGamesFinished] = useState(false);
  const [showFeatureSymbolSelection, setShowFeatureSymbolSelection] = useState(false);
  const [selectedFeatureSymbol, setSelectedFeatureSymbol] = useState<string>('');
  const [freeSpinsCount, setFreeSpinsCount] = useState<number>(0);
  const [showFeatureGameWins, setShowFeatureGameWins] = useState(false);

  /**
   * Callback to handle free spins state changes from SlotMachine
   */
  const handleFreeSpinsStateChange = (isFreeSpins: boolean, symbol: string) => {
    setIsFreeSpinsMode(isFreeSpins);
    setFeatureSymbol(symbol);
  };

  /**
   * Callback to handle action wheel state changes from SlotMachine
   */
  const handleActionWheelStateChange = (showWheel: boolean, spins: number, accumulatedWin: number) => {
    setShowActionWheel(showWheel);
    setActionGameSpins(spins);
    setAccumulatedActionWin(accumulatedWin);
  };

  // Store the pending balance update from action wheel spins
  const pendingBalanceUpdateRef = useRef<number | null>(null);

  /**
   * Handler for action wheel spin
   */
  const handleActionWheelSpin = async () => {
    if (!sessionId) {
      throw new Error('No session ID');
    }

    const response = await gameApi.spinActionGame({
      sessionId,
    });

    // Update state from response
    setActionGameSpins(response.remainingSpins);
    setAccumulatedActionWin(response.accumulatedWin);
    // Keep wheel visible even if remainingSpins is 0 - let handleActionWheelWin handle closing
    // This ensures the final spin result is visible before closing
    if (response.remainingSpins > 0) {
      setShowActionWheel(true);
    }
    // If remainingSpins is 0, keep showActionWheel as is (don't close yet)

    // Store balance but DON'T update it yet - wait for green segment and win message
    pendingBalanceUpdateRef.current = response.balance;

    return {
      result: response.result.wheelResult,
      win: response.result.win,
      additionalSpins: response.result.additionalSpins,
    };
  };

  /**
   * Handler for action wheel completion
   * Note: accumulatedActionWin is NOT reset here - it persists across all action game sessions
   * throughout the entire game session, accumulating all action game wins from the beginning
   */
  const handleActionWheelComplete = () => {
    setShowActionWheel(false);
    setActionGameSpins(0);
    // DO NOT reset accumulatedActionWin - it should persist across all action game sessions
    // Balance has already been updated by backend during the last wheel spin
  };

  /**
   * Handler for feature symbol selection state changes from SlotMachine
   */
  const handleFeatureSymbolSelectionStateChange = (show: boolean, symbol: string, count: number) => {
    setShowFeatureSymbolSelection(show);
    setSelectedFeatureSymbol(symbol);
    setFreeSpinsCount(count);
  };

  /**
   * Handler for feature symbol selection completion
   */
  const handleFeatureSymbolSelectionComplete = () => {
    setShowFeatureSymbolSelection(false);
    setSelectedFeatureSymbol('');
    setFreeSpinsCount(0);
  };

  /**
   * Handler for action wheel win notifications
   * Shows message in TopSection expanding symbol div
   * Updates balance AFTER win message is displayed (green segment is already shown at this point)
   */
  const handleActionWheelWin = (winAmount: number, result: string, additionalSpins: number, remainingSpins: number) => {
    let message = '';
    let displayAmount = winAmount;

    if (result === 'R10') {
      message = 'Action Game Win!';
      displayAmount = 10;
    } else if (result === '6spins') {
      message = '6 Additional Spins!';
      displayAmount = 0; // Will show message only, no amount
    } else {
      message = 'No Win This Spin';
      displayAmount = 0;
    }

    setActionGameWinMessage(message);
    setActionGameWinAmount(displayAmount);

    // Update balance AFTER win message is displayed in TopSection
    // The green segment is already shown at this point (from action-wheel.tsx)
    // Wait a brief moment to ensure the message is visible
    setTimeout(() => {
      if (pendingBalanceUpdateRef.current !== null && balanceUpdateRef.current) {
        balanceUpdateRef.current(pendingBalanceUpdateRef.current);
        pendingBalanceUpdateRef.current = null;
      }
    }, 200);

    // Check if this was the final spin using remainingSpins from the callback
    // Wait for the win message to be displayed, then show "Action Games Finished"
    setTimeout(() => {
      // Check if this was the final spin (remainingSpins will be 0 after this spin)
      if (remainingSpins === 0) {
        // Clear win message and show finished message
        setActionGameWinMessage('');
        setActionGameWinAmount(0);
        setActionGamesFinished(true);
        
        // Keep the action wheel visible until finished message is shown
        // Don't close showActionWheel yet - let it stay visible
        
        // Close action games after showing finished message for 2 seconds
        setTimeout(() => {
          handleActionWheelComplete();
          setActionGamesFinished(false);
        }, 2000);
      } else {
        // Not final spin, just clear message after 3 seconds
        setTimeout(() => {
          setActionGameWinMessage('');
          setActionGameWinAmount(0);
        }, 3000);
      }
    }, 2000); // Wait 2 seconds to show the win message first
  };

  // Don't auto-close - let handleActionWheelWin handle the closing after showing final result
  
  /**
   * Static configuration
   * - numPaylines: Always 5 paylines (fixed for this game)
   * - betPerPayline: Calculated as betAmount divided by numPaylines
   *   Used for display purposes and passed to control panel
   */
  const numPaylines = 5; // Always 5 paylines (static)
  const betPerPayline = betAmount / numPaylines;

  return (
    <div className="game-container relative">
      {/* Background Animation */}
      <BackgroundAnimation isFreeSpinsMode={isFreeSpinsMode} />
      
      {/* Game Title at the top */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-center z-20" style={{ height: '200px', transform: 'translateY(60px)' }}>
        <Image
          src="/title/title.png"
          alt="Inferno Empress"
          width={1496}
          height={150}
          className="object-contain"
          style={{ 
            width: '100%',
            height: 'auto',
            transform: 'scale(0.2)'
          }}
          unoptimized
          priority
        />
      </div>
      
      <TopSection 
        betAmount={betAmount} 
        isFreeSpinsMode={isFreeSpinsMode}
        featureSymbol={featureSymbol}
        showActionWheel={showActionWheel}
        actionGameWinMessage={actionGameWinMessage}
        actionGameWinAmount={actionGameWinAmount}
        actionGamesFinished={actionGamesFinished}
        showFeatureGameWins={showFeatureGameWins}
      />
      <MiddleSection 
        showActionWheel={showActionWheel}
        actionGameSpins={actionGameSpins}
        accumulatedActionWin={accumulatedActionWin}
        onActionWheelSpin={handleActionWheelSpin}
        onActionWheelComplete={handleActionWheelComplete}
        onActionWheelSpinTriggerReady={(trigger) => { actionWheelSpinTriggerRef.current = trigger; }}
        onActionWheelWin={handleActionWheelWin}
        showFeatureSymbolSelection={showFeatureSymbolSelection}
        selectedFeatureSymbol={selectedFeatureSymbol}
        freeSpinsCount={freeSpinsCount}
        onFeatureSymbolSelectionComplete={handleFeatureSymbolSelectionComplete}
      />
      <BottomSection 
        betAmount={betAmount} 
        setBetAmount={setBetAmount} 
        betPerPayline={betPerPayline} 
        onFreeSpinsStateChange={handleFreeSpinsStateChange}
        onActionWheelStateChange={handleActionWheelStateChange}
        onSessionIdChange={setSessionId}
        onBalanceUpdateCallback={(callback) => { balanceUpdateRef.current = callback; }}
        showActionWheel={showActionWheel}
        actionGameSpins={actionGameSpins}
        accumulatedActionWin={accumulatedActionWin}
        onActionWheelSpin={handleActionWheelSpin}
        onActionWheelSpinTrigger={() => { actionWheelSpinTriggerRef.current?.(); }}
        onFeatureSymbolSelectionStateChange={handleFeatureSymbolSelectionStateChange}
        onFeatureGameWinsStateChange={setShowFeatureGameWins}
        showFeatureSymbolSelection={showFeatureSymbolSelection}
      />
    </div>
  );
}

