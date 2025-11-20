'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ReelColumn } from './reel-column';
import { WinningLinesDisplay } from './winning-lines-display';
import { PaylineNumbers } from './payline-numbers';
import { ControlPanel } from './control-panel';
import { AutoplayDialog } from './autoplay-dialog';
import { WinAnimation, getWinningFeedback } from './win-animation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { gameApi, type PlayResponse, type SpinResult } from '@/lib/game-api';
import { 
  useNumReels, 
  useNumRows, 
  useBetAmounts, 
  useFreeSpinsAwarded, 
  useReelStrips,
  usePaylines,
  type SymbolId,
  type WinningLine
} from '@/lib/slot-config';
import { useGameConfig } from '@/hooks/use-game-config';
import useSound from 'use-sound';
import { SOUNDS } from '@/lib/sounds';

interface SlotMachineProps {
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

export function SlotMachine({ betAmount, setBetAmount, betPerPayline, onFreeSpinsStateChange, onActionWheelStateChange, onSessionIdChange, onBalanceUpdateCallback, showActionWheel = false, actionGameSpins = 0, accumulatedActionWin = 0, onActionWheelSpin, onActionWheelSpinTrigger, onFeatureSymbolSelectionStateChange, onFeatureGameWinsStateChange, showFeatureSymbolSelection = false }: SlotMachineProps) {
  // Get config values from hooks
  const numReels = useNumReels();
  const numRows = useNumRows();
  const betAmounts = useBetAmounts();
  const freeSpinsAwarded = useFreeSpinsAwarded();
  const reelStrips = useReelStrips();
  const paylines = usePaylines();
  const { config } = useGameConfig();
  const { toast } = useToast();
  
  // Get scatter symbol for preventing consecutive scatters
  const scatterSymbol = config?.bookSymbol || config?.scatterSymbol || 'Scatter';

  // Generate initial grid (for visual purposes only)
  const generateInitialGrid = useCallback((): SymbolId[][] => {
    if (!config) return [];
    const firstSymbol = Object.keys(config.symbols)[0] as SymbolId;
    return Array(numReels).fill(null).map(() => Array(numRows).fill(firstSymbol));
  }, [numReels, numRows, config]);

  const [grid, setGrid] = useState<SymbolId[][]>(generateInitialGrid);
  useEffect(() => {
    if (!config || reelStrips.length === 0) return;
    // Randomize the grid on the client
    // Prevent consecutive scatter symbols on the same reel
    setGrid(
      Array(numReels)
        .fill(null)
        .map((_, reelIndex) => {
          const reel: SymbolId[] = [];
              const reelStrip = reelStrips[reelIndex] || [];
          
          for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
            let symbol: SymbolId;
            
            if (reelStrip.length > 0) {
              // Get random symbol from strip
              let symbolIndex = Math.floor(Math.random() * reelStrip.length);
              symbol = reelStrip[symbolIndex];
              
              // Prevent consecutive scatter symbols on the same reel
              if (rowIndex > 0 && reel[rowIndex - 1] === scatterSymbol && symbol === scatterSymbol) {
                // Find next non-scatter symbol in the strip
                let attempts = 0;
                let nextIndex = (symbolIndex + 1) % reelStrip.length;
                while (reelStrip[nextIndex] === scatterSymbol && attempts < reelStrip.length) {
                  nextIndex = (nextIndex + 1) % reelStrip.length;
                  attempts++;
                }
                symbol = reelStrip[nextIndex];
              }
            } else {
              symbol = Object.keys(config.symbols)[0] as SymbolId;
            }
            
            reel.push(symbol);
          }
          
          return reel;
        })
    );
  }, [numReels, numRows, reelStrips, config, scatterSymbol]);
  
  // Initialize spinning reels array based on config
  useEffect(() => {
    setSpinningReels(Array(numReels).fill(false));
  }, [numReels]);
  
  const [spinningReels, setSpinningReels] = useState<boolean[]>([]);
  const [balance, setBalance] = useState(500); // Start at 500
  const [numPaylines] = useState(5); // Always 5 paylines (static)
  const totalBet = betAmount; // Total bet is the bet amount selected
  const [lastWin, setLastWin] = useState(0);
  const [winningLines, setWinningLines] = useState<WinningLine[]>([]);
  const [baseGameWinningLines, setBaseGameWinningLines] = useState<WinningLine[]>([]);
  const [featureGameWinningLines, setFeatureGameWinningLines] = useState<WinningLine[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [freeSpinsRemaining, setFreeSpinsRemaining] = useState(0);
  const [featureSymbol, setFeatureSymbol] = useState<string>('');
  const [pendingActionSpins, setPendingActionSpins] = useState(0);
  const [wasInFreeSpinsMode, setWasInFreeSpinsMode] = useState(false);
  const [bouncingReels, setBouncingReels] = useState<boolean[]>(Array(numReels).fill(false));
  const [expandingReels, setExpandingReels] = useState<boolean[]>(Array(numReels).fill(false));
  const [reelsToExpand, setReelsToExpand] = useState<number[]>([]); // Track which reels are expanded
  const [showFeatureGameWins, setShowFeatureGameWins] = useState(false);
  const [isTurboMode, setIsTurboMode] = useState(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const [isSfxEnabled, setIsSfxEnabled] = useState(true);
  const [volume, setVolume] = useState(50);
  
  // Sound configuration
  const soundConfig = useMemo(() => ({
    soundEnabled: isSfxEnabled,
    volume: volume / 100, // Convert 0-100 to 0-1
  }), [isSfxEnabled, volume]);

  const musicConfig = useMemo(() => ({
    soundEnabled: isMusicEnabled,
    volume: volume / 100, // Convert 0-100 to 0-1
  }), [isMusicEnabled, volume]);

  // Sound hooks
  const [playBgMusic, { stop: stopBgMusic }] = useSound(SOUNDS.background, {
    ...musicConfig,
    loop: true
  });
  const [playSpinSound, { stop: stopSpinSound }] = useSound(SOUNDS.spin, {
    ...soundConfig,
    loop: true, // Loop while spinning
  });
  const [playReelStopSound] = useSound(SOUNDS.reelStop, { ...soundConfig, loop: false });
  const [playWinSound] = useSound(SOUNDS.win, soundConfig);
  const [playBigWinSound] = useSound(SOUNDS.bigWin, soundConfig);
  const [playFreeSpinsTriggerSound] = useSound(SOUNDS.featureTrigger, soundConfig);
  const [playClickSound] = useSound(SOUNDS.click, soundConfig);
  const [playFreeSpinsMusic, { stop: stopFreeSpinsMusic }] = useSound(SOUNDS.freeSpinsMusic, {
    ...musicConfig,
    loop: true
  });
  
  // Background music management
  const isFreeSpinsMode = useMemo(() => freeSpinsRemaining > 0, [freeSpinsRemaining]);

  // Notify parent component when free spins state changes
  useEffect(() => {
    if (onFreeSpinsStateChange) {
      onFreeSpinsStateChange(isFreeSpinsMode, featureSymbol);
    }
  }, [isFreeSpinsMode, featureSymbol, onFreeSpinsStateChange]);

  // Notify parent component when feature game wins state changes
  useEffect(() => {
    if (onFeatureGameWinsStateChange) {
      onFeatureGameWinsStateChange(showFeatureGameWins);
    }
  }, [showFeatureGameWins, onFeatureGameWinsStateChange]);

  // Expose balance update callback to parent (use ref to avoid render issues)
  useEffect(() => {
    if (onBalanceUpdateCallback) {
      onBalanceUpdateCallback(setBalance);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onBalanceUpdateCallback]); // setBalance is stable, no need to include it
  
  useEffect(() => {
    // If music is disabled, stop all music
    if (!isMusicEnabled) {
      stopBgMusic();
      stopFreeSpinsMusic();
      return;
    }

    // If in free spins mode, play the free spins music
    // Otherwise, play the normal background music
    if (isFreeSpinsMode) {
      stopBgMusic();
      playFreeSpinsMusic();
    } else {
      stopFreeSpinsMusic();
      playBgMusic();
    }

    // Cleanup function to stop all music when the component unmounts
    return () => {
      stopBgMusic();
      stopFreeSpinsMusic();
    };
  }, [isFreeSpinsMode, isMusicEnabled, playBgMusic, stopBgMusic, playFreeSpinsMusic, stopFreeSpinsMusic]);
  
  // Autoplay state
  type AutoplaySettings = {
    numberOfSpins: number;
    stopOnAnyWin: boolean;
    stopOnSingleWinExceeds: number;
    stopOnFeature: boolean;
    stopOnTotalLossExceeds: number;
  };
  
  type AutoplayState = {
    isActive: boolean;
    settings: AutoplaySettings | null;
    spinsRemaining: number;
    totalLoss: number;
    originalBalance: number;
  };
  
  const [autoplayState, setAutoplayState] = useState<AutoplayState>({
    isActive: false,
    settings: null,
    spinsRemaining: 0,
    totalLoss: 0,
    originalBalance: 0,
  });
  
  const [showAutoplayDialog, setShowAutoplayDialog] = useState(false);
  const [winningFeedback, setWinningFeedback] = useState<{
    feedbackText: string;
    winAmount: number;
    animationType: string;
  } | null>(null);

  // Use ref to track if spin was cancelled (allows immediate cancellation)
  const spinCancelledRef = useRef(false);
  const currentSpinRef = useRef<Promise<any> | null>(null);

  const isSpinning = useMemo(() => spinningReels.some(s => s), [spinningReels]);
  
  // Comprehensive animation state - tracks all animations that should prevent spinning
  const isAnimating = useMemo(() => {
    return (
      isSpinning || // Reels are spinning
      winningFeedback !== null || // Win animation is playing
      expandingReels.some(r => r) || // Reels are expanding
      bouncingReels.some(r => r) || // Reels are bouncing
      showFeatureSymbolSelection || // Feature symbol selection is active
      showActionWheel || // Action wheel is active
      showFeatureGameWins // Feature game wins are being displayed (expansion phase)
    );
  }, [isSpinning, winningFeedback, expandingReels, bouncingReels, showFeatureSymbolSelection, showActionWheel, showFeatureGameWins]);
  
  const handleWinAnimationComplete = useCallback(() => {
    setWinningFeedback(null);
  }, []);
  
  const handleWinCountComplete = useCallback((amount: number) => {
    // Called when the count-up animation completes
    // Can be used to update lastWin if needed
  }, []);

  // Handlers for bet and paylines
  const handleIncreaseBet = useCallback(() => {
    if (!config) return;
    playClickSound();
    const currentIndex = config.betAmounts.indexOf(betAmount);
    if (currentIndex === -1) {
      // If betAmount not found, set to first value
      setBetAmount(config.betAmounts[0]);
      return;
    }
    // Circular: if at last index, wrap to first
    const nextIndex = (currentIndex + 1) % config.betAmounts.length;
    setBetAmount(config.betAmounts[nextIndex]);
  }, [betAmount, config, playClickSound]);

  const handleDecreaseBet = useCallback(() => {
    if (!config) return;
    playClickSound();
    const currentIndex = config.betAmounts.indexOf(betAmount);
    if (currentIndex === -1) {
      // If betAmount not found, set to first value
      setBetAmount(config.betAmounts[0]);
      return;
    }
    // Circular: if at first index, wrap to last
    const prevIndex = currentIndex === 0 
      ? config.betAmounts.length - 1 
      : currentIndex - 1;
    setBetAmount(config.betAmounts[prevIndex]);
  }, [betAmount, config, playClickSound]);

  // Paylines are static at 5 - no handlers needed
  const handleIncreasePaylines = useCallback(() => {
    // No-op: paylines are static at 5
  }, []);

  const handleDecreasePaylines = useCallback(() => {
    // No-op: paylines are static at 5
  }, []);

  // Autoplay functions
  const startAutoplay = useCallback((settings: AutoplaySettings) => {
    setAutoplayState({
      isActive: true,
      settings,
      spinsRemaining: settings.numberOfSpins,
      totalLoss: 0,
      originalBalance: balance,
    });
    toast({
      title: "Autoplay Started",
      description: `${settings.numberOfSpins} spins will be executed automatically.`,
    });
  }, [balance, toast]);

  const stopAutoplay = useCallback(() => {
    setAutoplayState({
      isActive: false,
      settings: null,
      spinsRemaining: 0,
      totalLoss: 0,
      originalBalance: 0,
    });
    toast({
      title: "Autoplay Stopped",
      description: "Automatic spinning has been stopped.",
    });
  }, [toast]);

  const checkAutoplayStopConditions = useCallback((spinResult: SpinResult): boolean => {
    if (!autoplayState.isActive || !autoplayState.settings) return false;
    
    const { settings } = autoplayState;
    
    // Stop if any win and setting is enabled
    if (settings.stopOnAnyWin && spinResult.totalWin > 0) {
      return true;
    }
    
    // Stop if single win exceeds threshold
    if (spinResult.totalWin > settings.stopOnSingleWinExceeds) {
      return true;
    }
    
    // Stop on feature (free spins)
    if (settings.stopOnFeature && spinResult.scatterWin.triggeredFreeSpins) {
      return true;
    }
    
    // Stop if total loss exceeds threshold
    const currentLoss = autoplayState.originalBalance - balance;
    if (currentLoss > settings.stopOnTotalLossExceeds) {
      return true;
    }
    
    return false;
  }, [autoplayState, balance]);

  // Initialize game session
  useEffect(() => {
    if (!config) return;
    const initializeGame = async () => {
      try {
        const newSessionId = `session-${Date.now()}`;
        setSessionId(newSessionId);
        if (onSessionIdChange) {
          onSessionIdChange(newSessionId);
        }
        // Get initial session state
        try {
          const sessionResponse = await gameApi.getSession(newSessionId);
          // Get balance from session (already in Rands)
          // If balance is 0 or not set, use default of 500
          const balanceFromSession = sessionResponse.player.balance;
          setBalance(balanceFromSession > 0 ? balanceFromSession : 500);
          setFreeSpinsRemaining(sessionResponse.freeSpins);
          setFeatureSymbol(sessionResponse.featureSymbol);
          // Update action wheel state via callback
          if (onActionWheelStateChange) {
            const accumulatedWin = sessionResponse.player.accumulatedActionGameWin ?? 0;
            onActionWheelStateChange(sessionResponse.actionGameSpins > 0, sessionResponse.actionGameSpins, accumulatedWin);
          }
        } catch {
          // Session will be created on first spin, balance defaults to 500
          setBalance(500);
        }
      } catch (error) {
        console.error('Failed to initialize game:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to game server. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    initializeGame();
  }, [toast, config]);

  const spin = useCallback(async () => {
    // In free spins mode, wait for all animations. In standard games, allow interrupting animations
    if (isFreeSpinsMode && isAnimating) return;
    // In standard games, only block if reels are actually spinning (not during win animations, expanding, etc.)
    if (!isFreeSpinsMode && isSpinning) return;
    if (!sessionId) return;

    // Check balance on frontend for quick response
    // Allow spinning during free spins even if balance is low
    if (balance < totalBet && freeSpinsRemaining === 0 && actionGameSpins === 0) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: "You don't have enough balance to place that bet.",
      });
      return;
    }

    // Cancel any ongoing spin promise immediately
    spinCancelledRef.current = true;
    
    // IMMEDIATELY clear all animation states BEFORE any delays
    // In standard games, this allows interrupting win animations, expanding reels, etc.
    // Clear these synchronously so the button becomes enabled immediately
    setLastWin(0);
    setWinningLines([]);
    setBaseGameWinningLines([]);
    setFeatureGameWinningLines([]);
    setShowFeatureGameWins(false);
    setReelsToExpand([]);
    setWinningFeedback(null);
    setExpandingReels(Array(numReels).fill(false));
    setBouncingReels(Array(numReels).fill(false));
    setSpinningReels(Array(numReels).fill(false));
    
    // Wait a tiny bit to ensure previous spin's state updates are processed
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Reset cancellation flag for this new spin
    spinCancelledRef.current = false;

    // Play spin sound
    stopSpinSound();
    playSpinSound();

    // Asynchronously start reels one by one to ensure staggering
    const startDelay = isTurboMode ? 0 : 10;
    const startReelsSequentially = async () => {
      for (let i = 0; i < numReels; i++) {
        // Check if spin was cancelled
        if (spinCancelledRef.current) return;
        
        setSpinningReels(prev => {
          const newSpinning = [...prev];
          newSpinning[i] = true;
          return newSpinning;
        });
        await new Promise(resolve => setTimeout(resolve, startDelay));
      }
    };

    startReelsSequentially();
    
    // Track when spinning started for minimum spin duration
    const spinStartTime = Date.now();
    
    // Store the current spin promise so we can track it
    const spinPromise = (async () => {

    try {
        // Check if spin was cancelled before API call
        if (spinCancelledRef.current) return null;
        
      // Call Backend API directly (bet amounts are in Rands)
        // CRITICAL: During free spins, do NOT send actionGameSpins to backend
        // Action games should accumulate during free spins and only be consumed after free spins complete
        // If we send actionGameSpins during free spins, the backend treats it as an action game spin
        // and skips decrementing free spins
      const response: PlayResponse = await gameApi.playGame({
        sessionId: sessionId,
        betAmount: totalBet, // Total bet in Rands
        numPaylines: numPaylines,
        betPerPayline: betPerPayline, // Bet per payline in Rands (totalBet / numPaylines)
        actionGameSpins: (!isFreeSpinsMode && actionGameSpins > 0) ? actionGameSpins : undefined,
        gameId: config?.gameId || 'INFERNO_EMPRESS',
      });

      // Grid structure: 5 reels (columns) x 3 rows
      // originalGrid[reelIndex][rowIndex] where:
      // - reelIndex: 0-4 (5 reels/columns from left to right)
      // - rowIndex: 0-2 (3 rows from top to bottom)
      // Example: originalGrid[0][2] = symbol at Reel 0 (leftmost), Row 2 (bottom)
      const originalGrid = response.player.results.grid;
      let finalGrid = originalGrid;
      
      // Identify which reels should expand - use backend's expandedSymbols data
      // The backend tells us which reels should expand based on its win calculation logic
      const reelsToExpandArray: number[] = [];
      if (response.player.results.expandedSymbols && response.player.results.expandedSymbols.length > 0 && response.featureSymbol) {
        // Get unique reel indices from backend's expandedSymbols
        // Backend sends: [{"reel":1,"row":2},{"reel":2,"row":2},...] indicating which reels (columns) should expand
        // Note: reel index in backend matches our column index (0-4 for 5 reels)
        const uniqueReels = new Set(
          response.player.results.expandedSymbols.map((exp: { reel: number; row: number }) => exp.reel)
        );
        reelsToExpandArray.push(...Array.from(uniqueReels));
        
        console.log(`[FREE SPINS] Expansion detected: ${reelsToExpandArray.length} reels to expand:`, reelsToExpandArray);
        console.log(`[FREE SPINS] Feature symbol:`, response.featureSymbol);
        console.log(`[FREE SPINS] Expanded symbols from backend:`, response.player.results.expandedSymbols);
        
        // Create final grid with entire reels (columns) filled with feature symbol
        // When a reel expands, all 3 rows in that column become the feature symbol
        finalGrid = originalGrid.map((reel, reelIndex) => 
          reelsToExpandArray.includes(reelIndex)
            ? Array(numRows).fill(response.featureSymbol)
            : reel
        );
      } else {
        console.log(`[FREE SPINS] No expansion: expandedSymbols=`, response.player.results.expandedSymbols, `featureSymbol=`, response.featureSymbol);
      }
      
      // Store expanded reels for highlighting (set after we have the data)
      setReelsToExpand(reelsToExpandArray);
      
      // Separate base game wins from feature game wins
      const allWinningLines = response.player.results.winningLines as WinningLine[];
      
      // In free spins mode, we need to separate base game and feature game wins
      let baseGameLines: WinningLine[] = [];
      let featureGameLines: WinningLine[] = [];
      
      if (isFreeSpinsMode && response.featureSymbol) {
        // Base game: all wins from winningLines (backend already excludes feature symbol wins)
        // Filter to only include active paylines
        baseGameLines = allWinningLines.filter(line => 
          line.paylineIndex === -1 || line.paylineIndex < numPaylines
        );
        
        // Feature game: use featureGameWinningLines from backend (wins after expansion)
        if (response.player.results.featureGameWinningLines) {
          featureGameLines = (response.player.results.featureGameWinningLines as WinningLine[]).filter(line => 
            line.paylineIndex === -1 || line.paylineIndex < numPaylines
          );
        }
      } else {
        // Normal game: all wins are base game wins
        baseGameLines = allWinningLines.filter(line => 
          line.paylineIndex === -1 || line.paylineIndex < numPaylines
        );
      }
      
      const newWinningLines = baseGameLines;

        // Check if spin was cancelled
        if (spinCancelledRef.current) return null;

      // Ensure minimum spin time so animation looks good
      const minSpinTime = isTurboMode ? 200 : 600;
      const elapsedTime = Date.now() - spinStartTime;
      const remainingTime = Math.max(0, minSpinTime - elapsedTime);
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
        
        // Check again after delay
        if (spinCancelledRef.current) return null;

      // Animate reels stopping one by one
      // IMPORTANT: Keep winning lines cleared during reel stopping to maintain anticipation
      setWinningLines([]);
      setShowFeatureGameWins(false);
      
      const stopBaseDelay = isTurboMode ? 5 : 40;
      const stopIncrementDelay = isTurboMode ? 2 : 20;
      const gridUpdateDelay = isTurboMode ? 2 : 20;
      
      for (let i = 0; i < numReels; i++) {
          // Check if spin was cancelled before each reel stop
          if (spinCancelledRef.current) {
            // Reset all reels to not spinning if cancelled
            setSpinningReels(Array(numReels).fill(false));
            return null;
          }
          
        await new Promise(resolve => setTimeout(resolve, stopBaseDelay + i * stopIncrementDelay));
          
          // Check again after delay
          if (spinCancelledRef.current) {
            setSpinningReels(Array(numReels).fill(false));
            return null;
          }

        // Update grid with ORIGINAL symbols first (before expansion)
        setGrid(prevGrid => {
          const updatedGrid = [...prevGrid];
          updatedGrid[i] = originalGrid[i];
          return updatedGrid;
        });

        // Small delay to ensure grid update completes
        await new Promise(resolve => setTimeout(resolve, gridUpdateDelay));
        
        // Play reel stop sound
        playReelStopSound();
        
        // Trigger bounce animation for this reel
        setBouncingReels(prev => {
          const newBouncing = [...prev];
          newBouncing[i] = true;
          return newBouncing;
        });
        
        // Reset bounce after animation
        setTimeout(() => {
          setBouncingReels(prev => {
            const newBouncing = [...prev];
            newBouncing[i] = false;
            return newBouncing;
          });
        }, 300);
        
        setSpinningReels(prev => {
          const newSpinning = [...prev];
          newSpinning[i] = false;
          return newSpinning;
        });
      }

      // Stop spin sound when all reels have stopped
      stopSpinSound();
        
        // Check if spin was cancelled
        if (spinCancelledRef.current) return null;

      // Wait a moment after all reels stop to let the grid settle
      await new Promise(resolve => setTimeout(resolve, isTurboMode ? 200 : 500));
        
        // Check again after delay
        if (spinCancelledRef.current) return null;

      // Show base game wins first (if in free spins mode)
      if (isFreeSpinsMode) {
        // Add scatter win to base game if applicable
        if (response.player.results.scatterWin.triggeredFreeSpins || response.player.results.scatterWin.count > 0) {
          // Only show scatter in base game if feature symbol is NOT scatter
          if (response.featureSymbol !== 'Scatter') {
            const scatterLine: WinningLine = {
              paylineIndex: -1,
              symbol: 'Scatter',
              count: response.player.results.scatterWin.count,
              payout: 0,
              line: [],
            };
            baseGameLines.push(scatterLine);
          }
        }
        
        // PHASE 1: Show base game grid and wins FIRST (if any)
        // Ensure grid is stable and showing original symbols (already set during reel stop)
        // Base game wins should persist until expansion or next spin (like normal game)
        
        // PHASE 2: Expansion animation
        // Queen, Stone, Leopard, Wolf: expand with 2+ reels
        // Card symbols (10, J, K, Q, A) and all other symbols: expand with 3+ reels
        const expansionThreshold = (response.featureSymbol === 'Queen' || response.featureSymbol === 'Stone' || response.featureSymbol === 'Leopard' || response.featureSymbol === 'Wolf') ? 2 : 3;
        
        // CRITICAL: Set expanding reels state EARLY if expansion will happen
        // This ensures isAnimating stays true throughout, preventing autoplay from starting a new spin
        if (reelsToExpandArray.length >= expansionThreshold && response.featureSymbol) {
          // Mark all reels that will expand as expanding IMMEDIATELY
          // This keeps isAnimating true and prevents autoplay from starting
          setExpandingReels(prev => {
            const newExpanding = Array(numReels).fill(false);
            reelsToExpandArray.forEach(reelIndex => {
              newExpanding[reelIndex] = true;
            });
            return newExpanding;
          });
        }
        
        if (baseGameLines.length > 0) {
          setWinningLines(baseGameLines);
          setBaseGameWinningLines(baseGameLines);
          // Base game wins will stay visible until expansion happens or next spin
        } else {
          // Even if no base game wins, wait a bit to show the grid
          await new Promise(resolve => setTimeout(resolve, isTurboMode ? 500 : 1000));
        }
        
        if (reelsToExpandArray.length >= expansionThreshold && response.featureSymbol) {
          // Keep base game wins visible during expansion - don't clear them
          // They'll stay visible alongside feature game wins after expansion
          setShowFeatureGameWins(false);
          
          // Wait a moment before expansion starts to build anticipation
          // This gives time to see base game wins with borders
          // isAnimating is already true because expandingReels was set above
          await new Promise(resolve => setTimeout(resolve, isTurboMode ? 500 : 1000));
          
          // Check if spin was cancelled before expansion
          if (spinCancelledRef.current) {
            setExpandingReels(Array(numReels).fill(false));
            return null;
          }
          
          // Animate expansion for each reel that needs to expand
          // CRITICAL: expandingReels is already set to true for all reels above (line 682-688)
          // This ensures isAnimating stays true throughout the expansion animation
          for (const reelIndex of reelsToExpandArray) {
            // Check if spin was cancelled before each expansion
            if (spinCancelledRef.current) {
              // Reset expanding states
              setExpandingReels(Array(numReels).fill(false));
              return null;
            }
            // Reel is already marked as expanding (set above), no need to set again
            
            // Wait before updating grid to show expansion animation
            await new Promise(resolve => setTimeout(resolve, isTurboMode ? 100 : 300));
            
            // Check again after delay
            if (spinCancelledRef.current) {
              setExpandingReels(Array(numReels).fill(false));
              return null;
            }
            
            // Update the grid to show expanded symbol for this entire reel
            setGrid(prevGrid => {
              const updatedGrid = prevGrid.map((reel, idx) => 
                idx === reelIndex 
                  ? Array(numRows).fill(response.featureSymbol)
                  : reel
              );
              return updatedGrid;
            });
            
            // Keep expanding state for longer so animation is visible
            await new Promise(resolve => setTimeout(resolve, isTurboMode ? 200 : 400));
            
            // Check again after delay
            if (spinCancelledRef.current) {
              setExpandingReels(Array(numReels).fill(false));
              return null;
            }
            
            // DO NOT clear expanding state here - keep it true until all animations complete
            // This ensures isAnimating stays true and autoplay waits
          }
          
          // Wait after all expansions complete - ensure grid is fully updated and expansion animation is done
          await new Promise(resolve => setTimeout(resolve, isTurboMode ? 500 : 1000));
          
          // Check if spin was cancelled before showing feature wins
          if (spinCancelledRef.current) {
            setExpandingReels(Array(numReels).fill(false));
            return null;
          }
          
          // PHASE 3: Show feature game wins ONLY AFTER expansion is complete
          // When expansion happens, ONLY show feature game wins (hide base game wins)
          // CRITICAL: Clear base game wins immediately when expansion completes
          // This ensures borders only show on expanded reels, not on base game wins
          setShowFeatureGameWins(true);
          
          // NOW clear expanding reels - expansion animation is complete
          // showFeatureGameWins will keep isAnimating true until feature wins are displayed
          setExpandingReels(Array(numReels).fill(false));
          
          if (featureGameLines.length > 0) {
            // Store feature game winning lines separately
            setFeatureGameWinningLines(featureGameLines);
            // Clear base game wins and show ONLY feature game wins
            // Base game wins are paid but borders/animations should only show on expanded reels
            setWinningLines(featureGameLines);
            
            // Wait additional time to show feature game wins before allowing next spin
            // This ensures expansion animation and feature wins are fully visible
            // CRITICAL: This delay prevents autoplay from starting the next spin too quickly
            await new Promise(resolve => setTimeout(resolve, isTurboMode ? 1000 : 2000));
            
            // Check if spin was cancelled after showing feature wins
            if (spinCancelledRef.current) return null;
            
            // Clear showFeatureGameWins to allow next spin, but borders will remain visible
            // because getWinningLineIndices checks reelsToExpand and featureGameLines directly
            setShowFeatureGameWins(false);
          } else {
            // If no feature game wins, clear all winning lines
            // This ensures no borders show after expansion if there are no feature wins
            setWinningLines([]);
            setFeatureGameWinningLines([]);
            
            // Still wait a bit to ensure expansion animation is visible
            await new Promise(resolve => setTimeout(resolve, isTurboMode ? 500 : 1000));
            
            // Check if spin was cancelled
            if (spinCancelledRef.current) return null;
            
            // If no feature game wins, we can clear the flag since there are no borders to show
            setShowFeatureGameWins(false);
          }
          
          // CRITICAL: Do NOT clear showFeatureGameWins here if there are feature game wins
          // Keep it true so borders remain visible on all expanded reels until next spin starts
          // The flag will be cleared at the start of the next spin (line 443)
        } else {
          // If no expansion, just ensure we're using the original grid (no changes needed)
          // Grid is already set to originalGrid above
          setShowFeatureGameWins(false);
        }
      } else {
        // Normal game: show all wins including scatter
      if (response.player.results.scatterWin.triggeredFreeSpins) {
        const scatterLine: WinningLine = {
          paylineIndex: -1,
            symbol: 'Scatter',
          count: response.player.results.scatterWin.count,
          payout: 0,
          line: [],
        };
        newWinningLines.push(scatterLine);
      }
      setWinningLines(newWinningLines);
        // Winning lines will stay visible until next spin starts (no delay needed)
      }
      
        // Check if spin was cancelled before updating state
        if (spinCancelledRef.current) return null;
        
        // Track if we were in free spins mode before this spin
        const previousFreeSpins = freeSpinsRemaining;
      
      // Update state from response (values are already in Rands)
      setBalance(response.player.balance);
      // Use player.freeSpinsRemaining which is the decremented value from backend
      setFreeSpinsRemaining(response.player.freeSpinsRemaining);
      setFeatureSymbol(response.player.featureSymbol);
      setLastWin(response.player.lastWin);

      // Handle action game wins - use backend's accumulated value if available
      // Backend tracks AccumulatedActionGameWin in session state
      const backendAccumulatedWin = response.player.accumulatedActionGameWin ?? 0;
      
      // Update action wheel state via callback
      // CRITICAL: During free spins, action games should accumulate but NOT be displayed
      // Only update action wheel state when NOT in free spins mode, or when free spins just completed
      if (isFreeSpinsMode) {
        // During free spins: accumulate action games but don't show them
        // Only update state if action games were triggered (to accumulate the count)
        if (response.player.results.actionGameTriggered) {
          console.log(`[ACTION GAME] Accumulated during free spins: R${backendAccumulatedWin}, Total spins: ${response.actionGameSpins}`);
          // Update state but keep showActionWheel = false (don't show wheel during free spins)
          if (onActionWheelStateChange) {
            onActionWheelStateChange(false, response.actionGameSpins, backendAccumulatedWin);
          }
        }
        // If action games were NOT triggered, don't update the state at all during free spins
        // This prevents the count from changing when it shouldn't
      } else if (!isFreeSpinsMode && response.player.results.actionGameTriggered) {
        // Base game: if free spins also triggered, wait; otherwise show wheel immediately
        if (!response.player.results.scatterWin.triggeredFreeSpins) {
          // No free spins triggered, show wheel immediately
          // Use backend's accumulated value to persist across all action game sessions
          if (onActionWheelStateChange) {
            onActionWheelStateChange(true, response.actionGameSpins, backendAccumulatedWin);
          }
        } else {
          // Free spins triggered, use backend's accumulated value (don't show wheel yet)
          if (onActionWheelStateChange) {
            onActionWheelStateChange(false, response.actionGameSpins, backendAccumulatedWin);
          }
        }
      } else {
        // Not in free spins and no action games triggered: only update if we're not in free spins mode
        // This ensures action games don't get updated during free spins
        if (!isFreeSpinsMode && onActionWheelStateChange) {
          onActionWheelStateChange(false, response.actionGameSpins, backendAccumulatedWin);
        }
      }

      // Check if free spins just completed
      if (previousFreeSpins > 0 && response.player.freeSpinsRemaining === 0) {
        console.log(`[FREE SPINS] Free spins completed! Previous: ${previousFreeSpins}, Current: ${response.player.freeSpinsRemaining}`);
        console.log(`[ACTION WHEEL] Checking trigger conditions - Action spins: ${response.actionGameSpins}, Accumulated win: ${backendAccumulatedWin}`);
        setWasInFreeSpinsMode(true);
        // Free spins just ended, check if we have action spins or accumulated wins
        // Backend already has accumulated actionGameSpins in response.actionGameSpins
        if (response.actionGameSpins > 0 || backendAccumulatedWin > 0) {
          console.log(`[ACTION WHEEL] Triggering action wheel - Spins: ${response.actionGameSpins}, Win: R${backendAccumulatedWin}`);
          if (onActionWheelStateChange) {
            onActionWheelStateChange(true, response.actionGameSpins, backendAccumulatedWin);
          }
        } else {
          console.log(`[ACTION WHEEL] No action wheel trigger - no spins or accumulated wins`);
        }
      } else if (response.player.freeSpinsRemaining > 0) {
        setWasInFreeSpinsMode(false);
        console.log(`[FREE SPINS] Still in free spins mode - Remaining: ${response.player.freeSpinsRemaining}`);
      }

      // Show feature symbol selection animation if free spins were triggered (only if NOT already in free spins)
      // When retriggering free spins, the feature symbol doesn't change, so no animation needed
      if (response.player.results.scatterWin.triggeredFreeSpins && response.featureSymbol && !isFreeSpinsMode) {
        playFreeSpinsTriggerSound();
        // Notify parent to show feature symbol selection in MiddleSection
        if (onFeatureSymbolSelectionStateChange) {
          onFeatureSymbolSelectionStateChange(true, response.featureSymbol, response.freeSpins);
        }
        // Don't show toast - the animation will handle it
      } else {
        // Show other notifications
      if (response.player.results.actionGameTriggered && !isFreeSpinsMode && !response.player.results.scatterWin.triggeredFreeSpins) {
        toast({
          title: 'Action Game!',
          description: `You won ${response.actionGameSpins} action game spins!`,
        });
      }

      if (response.player.lastWin > 0) {
          // Play win sound - big win for wins > 5x bet, regular win otherwise
          if (response.player.lastWin > totalBet * 5) {
            playBigWinSound();
          } else {
            playWinSound();
          }
          
          // Get winning symbols for the win animation
          const winningSymbols = [...new Set(
            (response.player.results.winningLines || []).map((l: WinningLine) => l.symbol)
          )];
          
          // Generate and show win animation
          const feedback = getWinningFeedback(
            response.player.lastWin,
            winningSymbols,
            totalBet
          );
          setWinningFeedback(feedback);
          
          // Don't show toast - the animation will handle it
        }
      }


      // Return spin result for autoplay logic
      return response.player.results;
    } catch (error) {
        // Only show error if spin wasn't cancelled
        if (!spinCancelledRef.current) {
      console.error("Failed to fetch spin result:", error);
      stopSpinSound(); // Stop spin sound on error
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect to game server",
      });
        }
      setSpinningReels(Array(numReels).fill(false));
      return null;
    }
    })();
    
    // Store the current spin promise
    currentSpinRef.current = spinPromise;
    
    // Return the promise
    return spinPromise;
  }, [isAnimating, balance, totalBet, numPaylines, betPerPayline, freeSpinsRemaining, actionGameSpins, sessionId, isTurboMode, numReels, numRows, toast, betAmount, playSpinSound, stopSpinSound, playReelStopSound, playWinSound, playBigWinSound, playFreeSpinsTriggerSound, getWinningFeedback]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = event.key.toUpperCase();

      // "S" key - Spin (reels or action wheel)
      if (key === 'S') {
        event.preventDefault();
        // If action wheel is open, spin the wheel instead of reels
        if (showActionWheel && onActionWheelSpinTrigger && actionGameSpins > 0) {
          // Trigger action wheel spin animation and backend call
          onActionWheelSpinTrigger();
        } else if (!isAnimating && sessionId && !showActionWheel) {
          // Only spin reels if action wheel is NOT open and no animations are active
          // Check if button would be disabled
          if (balance >= totalBet || freeSpinsRemaining > 0 || actionGameSpins > 0) {
            spin();
          }
        }
      }

      // "T" key - Toggle Turbo
      if (key === 'T') {
        event.preventDefault();
        setIsTurboMode(prev => !prev);
        playClickSound();
      }

      // "A" key - Auto Spin (show autoplay dialog)
      if (key === 'A') {
        event.preventDefault();
        if (!autoplayState.isActive) {
          setShowAutoplayDialog(true);
        } else {
          // If autoplay is active, stop it
          stopAutoplay();
        }
      }

      // Arrow Up key - Increase Bet
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (!isSpinning && !isFreeSpinsMode) {
          handleIncreaseBet();
        }
      }

      // Arrow Down key - Decrease Bet
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (!isSpinning && !isFreeSpinsMode) {
          handleDecreaseBet();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAnimating, sessionId, balance, totalBet, freeSpinsRemaining, actionGameSpins, spin, playClickSound, autoplayState.isActive, stopAutoplay, isFreeSpinsMode, handleIncreaseBet, handleDecreaseBet, showActionWheel, onActionWheelSpinTrigger]);

  // Autoplay effect - handles automatic spinning with stop conditions
  useEffect(() => {
    if (!autoplayState.isActive || !autoplayState.settings) return;
    
    if (autoplayState.spinsRemaining <= 0) {
      stopAutoplay();
      return;
    }
    
    // Stop autoplay if balance is insufficient (only check in base game, not during free spins)
    if (balance < totalBet && !isFreeSpinsMode && actionGameSpins === 0) {
      stopAutoplay();
      toast({
        title: "Autoplay Stopped",
        description: "Insufficient balance to continue autoplay.",
      });
      return;
    }
    
    // Wait for all animations to complete before starting next spin
    // This includes: spinning, winning animations, expanding reels, bouncing reels, feature symbol selection
    // Autoplay works during free spins - removed !isFreeSpinsMode condition
    // CRITICAL: Only start timer if NOT animating - if isAnimating becomes true, this effect will re-run
    // and the cleanup function will cancel the timer
    if (!isAnimating && (balance >= totalBet || isFreeSpinsMode || actionGameSpins > 0)) {
      const timer = setTimeout(() => {
        // Double-check isAnimating one more time before spinning
        // If isAnimating changed during the delay, this effect will have re-run and cancelled this timer
        // But add an extra safety check just in case
        if (!isAnimating) {
        spin().then((spinResult) => {
          if (spinResult && checkAutoplayStopConditions(spinResult)) {
            stopAutoplay();
            return;
          }
          
          // Decrement spins remaining
          setAutoplayState(prev => ({
            ...prev,
            spinsRemaining: prev.spinsRemaining - 1,
          }));
        });
        }
        // If isAnimating is true, skip this spin - the effect will re-run when animations complete
      }, isTurboMode ? 500 : 1000); // Delay between spins
      
      return () => clearTimeout(timer);
    }
  }, [autoplayState, isAnimating, balance, totalBet, isFreeSpinsMode, actionGameSpins, isTurboMode, spin, checkAutoplayStopConditions, stopAutoplay, toast]);

  // For spinning reels, show the reel strip for animation (matching original behavior)
  const getReelSymbols = (reelIndex: number): SymbolId[] => {
    if (spinningReels[reelIndex]) {
      // Return the full reel strip for spinning animation
      return reelStrips[reelIndex] || [];
    }
    return grid[reelIndex] || [];
  };

  const getWinningLineIndices = (reelIndex: number, rowIndex: number): number[] => {
    if (winningLines.length === 0) return [];

    // Only show feature game wins AFTER expansion is complete (showFeatureGameWins is true)
    // This ensures borders don't appear before the expansion animation
    // Queen, Stone, Leopard, Wolf: expand with 2+ reels
    // All other symbols: expand with 3+ reels
    const expansionThreshold = (featureSymbol === 'Queen' || featureSymbol === 'Stone' || featureSymbol === 'Leopard' || featureSymbol === 'Wolf') ? 2 : 3;
    const isShowingFeatureGameWins = isFreeSpinsMode && showFeatureGameWins && reelsToExpand.length >= expansionThreshold;
    const gridSymbol = grid[reelIndex]?.[rowIndex];

    // SPECIAL CASE: When showing feature game wins OR when expanded reels have feature game winning lines,
    // show borders on ALL positions of expanded reels
    // This is because after expansion, the entire reel is filled with the feature symbol
    // Keep borders visible even after showFeatureGameWins is cleared (for next spin button)
    if (isFreeSpinsMode && reelsToExpand.includes(reelIndex) && featureSymbol) {
      // Find all feature game winning lines (lines for the feature symbol)
      const featureGameLines = winningLines.filter(line => 
        line.paylineIndex !== -1 && line.symbol === featureSymbol && line.paylineIndex < numPaylines
      );
      // If there are feature game winning lines, show borders on all positions of expanded reels
      if (featureGameLines.length > 0) {
        // Return all payline indices for feature game wins
        // This ensures ALL positions on expanded reels show borders
        return featureGameLines.map(line => line.paylineIndex);
      }
    }

    return winningLines.reduce((acc, line, lineIndex) => {
      // When showing feature game wins, skip processing (already handled above)
      if (isFreeSpinsMode && isShowingFeatureGameWins) {
        return acc;
      }

      // Only show winning lines for active paylines (0 to numPaylines-1)
      if (line.paylineIndex !== -1) {
        // Regular payline wins
        // Check if this payline is active and matches the position
        if (line.paylineIndex < numPaylines && line.line[reelIndex] === rowIndex) {
          // Base game wins (before expansion) or normal game: show borders normally
          // Only show borders on positions that are part of the winning line AND within the winning count
          // The condition line.line[reelIndex] === rowIndex already ensures this position is on the line
          // CRITICAL: Only show borders on the first N reels that match, where N = line.count
          // AND the symbol at that position must match the winning symbol OR be a scatter (scatters can substitute)
          // For example, if count=3 and symbol=K, only show borders on reels 0, 1, 2 where symbol=K or Scatter
          if (reelIndex < line.count && (gridSymbol === line.symbol || gridSymbol === scatterSymbol)) {
              acc.push(line.paylineIndex);
          }
        }
      } else if (line.paylineIndex === -1) {
        // Scatter wins: only highlight if count >= 3 (actual scatter win)
        // 1-2 scatters don't win anything, so don't highlight them
        // In free spins, only show scatter borders if feature symbol is NOT scatter
        // AND only if we're not showing feature game wins (before expansion)
        if (line.count >= 3 && gridSymbol === line.symbol) {
          if (!isFreeSpinsMode || (featureSymbol !== 'Scatter' && !isShowingFeatureGameWins)) {
          acc.push(10); // Special index for scatter
          }
        }
      }
      return acc;
    }, [] as number[]);
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col w-full h-full min-h-0">
        <div className="flex flex-col items-center justify-center flex-1 w-full min-h-0 overflow-hidden">
          <div className={`flex flex-col items-center gap-2 p-3 rounded-2xl bg-card/50 border-2 md:border-4 shadow-2xl w-full h-full relative flex-1 min-h-0 border-transparent`}>
            <div className="relative w-full h-full flex justify-center items-center">
              <PaylineNumbers 
                winningLines={winningLines} 
                isSpinning={isSpinning}
                numPaylines={numPaylines}
              >
                <div 
                  className="grid gap-0 p-0 bg-black/30 rounded-lg relative w-full h-full"
                  style={{ 
                    gridTemplateColumns: `repeat(${numReels}, minmax(0, 1fr))`,
                    maxWidth: '1296px',
                    margin: '0 auto',
                    marginTop: '50px' 
                  }}
                >
                  {config && numReels > 0 && Array.from({ length: numReels }).map((_, i) => (
                    <ReelColumn
                      key={i}
                      symbols={getReelSymbols(i)}
                      isSpinning={spinningReels[i]}
                      reelIndex={i}
                      winningLineIndicesForColumn={
                        Array(numRows).fill(0).map((_, j) => getWinningLineIndices(i, j))
                      }
                      isTurboMode={isTurboMode}
                      shouldBounce={bouncingReels[i]}
                      isExpanding={expandingReels[i]}
                      isExpanded={showFeatureGameWins && reelsToExpand.includes(i)} // Only show yellow border when winning lines are displayed
                    />
                  ))}
                  
                  {!isSpinning && winningLines.length > 0 && (
                    <WinningLinesDisplay 
                      winningLines={winningLines.filter(l => l.paylineIndex !== -1)} 
                    />
                  )}
                </div>
              </PaylineNumbers>
            </div>
          </div>
        </div>

        {/* Control Panel - positioned at bottom */}
        <div className="w-full flex-shrink-0 mt-2">
        <ControlPanel
        betPerPayline={betPerPayline}
        numPaylines={numPaylines}
        totalBet={totalBet}
        balance={balance}
        lastWin={lastWin}
        isSpinning={isFreeSpinsMode ? isAnimating : isSpinning}
        onSpin={showActionWheel ? (() => {}) : spin}
        onIncreaseBet={handleIncreaseBet}
        onDecreaseBet={handleDecreaseBet}
        onIncreasePaylines={handleIncreasePaylines}
        onDecreasePaylines={handleDecreasePaylines}
        freeSpinsRemaining={freeSpinsRemaining}
        isFreeSpinsMode={isFreeSpinsMode}
        actionGameSpins={actionGameSpins}
        isTurboMode={isTurboMode}
        onToggleTurbo={() => setIsTurboMode(!isTurboMode)}
        isMusicEnabled={isMusicEnabled}
        onToggleMusic={() => setIsMusicEnabled(!isMusicEnabled)}
        isSfxEnabled={isSfxEnabled}
        onToggleSfx={() => setIsSfxEnabled(!isSfxEnabled)}
        volume={volume}
        onVolumeChange={setVolume}
        maxPaylines={config?.maxPaylines || 5}
        featureSymbol={featureSymbol}
        autoplayState={autoplayState}
        onStartAutoplay={startAutoplay}
        onStopAutoplay={stopAutoplay}
        onShowAutoplayDialog={() => setShowAutoplayDialog(true)}
        />
        </div>
      </div>

      {/* Autoplay Dialog */}
      <AutoplayDialog
        isOpen={showAutoplayDialog}
        onClose={() => setShowAutoplayDialog(false)}
        onStartAutoplay={startAutoplay}
        currentBalance={balance}
        currentBet={betAmount}
      />

      {/* Win Animation */}
      {winningFeedback && (
        <WinAnimation
          feedback={winningFeedback}
          onAnimationComplete={handleWinAnimationComplete}
          onCountComplete={handleWinCountComplete}
        />
      )}
    </>
  );
}
