/**
 * Slot Configuration Types and Hooks
 * 
 * This module provides TypeScript types and React hooks for accessing
 * slot machine configuration values. All values are loaded from the
 * game configuration JSON file, not hardcoded.
 * 
 * Features:
 * - Type definitions for winning lines and spin results
 * - Custom hooks to access config values
 * - Fallback values for missing config
 * - Support for Book of Ra style (combined wild/scatter)
 */

// Slot configuration types and helpers
// All values are now loaded from config, not hardcoded

import { useGameConfig } from '@/hooks/use-game-config';
import type { SymbolId } from '@/lib/game-config-types';

export type { SymbolId };

/**
 * WinningLine interface
 * 
 * Represents a single winning payline with its details
 * 
 * @param paylineIndex - Index of the payline (0-4 for 5 paylines)
 * @param symbol - The symbol that won (e.g., "Queen", "Scatter")
 * @param count - Number of matching symbols (2, 3, 4, or 5)
 * @param payout - Payout amount for this win
 * @param line - Array of row indices showing the payline path
 */
export interface WinningLine {
  paylineIndex: number;
  symbol: SymbolId;
  count: number;
  payout: number;
  line: number[];
}

/**
 * SpinResult interface
 * 
 * Complete result from a single spin
 * 
 * @param totalWin - Total win amount from all winning lines
 * @param winningLines - Array of all winning paylines
 * @param scatterWin - Scatter win information
 *   - count: Number of scatter symbols
 *   - triggeredFreeSpins: Whether free spins were triggered
 */
export interface SpinResult {
  totalWin: number;
  winningLines: WinningLine[];
  scatterWin: {
    count: number;
    triggeredFreeSpins: boolean;
  };
}

/**
 * Hook to get number of reels from config
 * 
 * @returns Number of reels (default: 5)
 */
export function useNumReels(): number {
  const { config } = useGameConfig();
  return config?.numReels ?? 5;
}

/**
 * Hook to get number of rows from config
 * 
 * @returns Number of rows (default: 3)
 */
export function useNumRows(): number {
  const { config } = useGameConfig();
  return config?.numRows ?? 3;
}

/**
 * Hook to get paylines array from config
 * 
 * @returns Array of payline definitions
 * Each payline is an array of row indices (e.g., [0, 1, 2, 1, 0])
 */
export function usePaylines(): number[][] {
  const { config } = useGameConfig();
  return config?.paylines ?? [];
}

/**
 * Hook to get available bet amounts from config
 * 
 * @returns Array of bet amounts (e.g., [1.00, 2.00, 3.00, 5.00])
 * Default: [1, 2, 3, 5, 10] if not in config
 */
export function useBetAmounts(): number[] {
  const { config } = useGameConfig();
  return config?.betAmounts ?? [1, 2, 3, 5, 10];
}

/**
 * Hook to get number of free spins awarded from config
 * 
 * @returns Number of free spins (default: 10)
 */
export function useFreeSpinsAwarded(): number {
  const { config } = useGameConfig();
  return config?.freeSpinsAwarded ?? 10;
}

/**
 * Hook to get wild symbol ID from config
 * 
 * Supports Book of Ra style where wild and scatter are combined (bookSymbol)
 * 
 * @returns Symbol ID for wild symbol (default: 'Scatter')
 */
export function useWildSymbol(): SymbolId {
  const { config } = useGameConfig();
  if (!config) return 'Scatter' as SymbolId;
  // Check if using Book of Ra style (combined wild/scatter)
  if ('bookSymbol' in config && config.bookSymbol) {
    return config.bookSymbol as SymbolId;
  }
  return (config?.wildSymbol ?? 'Scatter') as SymbolId;
}

/**
 * Hook to get scatter symbol ID from config
 * 
 * Supports Book of Ra style where wild and scatter are combined (bookSymbol)
 * 
 * @returns Symbol ID for scatter symbol (default: 'Scatter')
 */
export function useScatterSymbol(): SymbolId {
  const { config } = useGameConfig();
  if (!config) return 'Scatter' as SymbolId;
  // Check if using Book of Ra style (combined wild/scatter)
  if ('bookSymbol' in config && config.bookSymbol) {
    return config.bookSymbol as SymbolId;
  }
  return (config?.scatterSymbol ?? 'Scatter') as SymbolId;
}

/**
 * Hook to get reel strips from config
 * 
 * Reel strips define which symbols appear on each reel during spinning.
 * If not in config, generates a fallback with all symbols on all reels.
 * 
 * @returns 2D array: [reel][symbolIndex] = SymbolId
 * Example: [[Queen, Stone, ...], [A, K, ...], ...]
 */
export function useReelStrips(): SymbolId[][] {
  const { config } = useGameConfig();
  if (!config) return [];
  
  // Use reel strips from config if available
  if (config.reelStrips && config.reelStrips.length > 0) {
    return config.reelStrips as SymbolId[][];
  }
  
  /**
   * Generate fallback reel strip
   * Creates a simple strip with all symbols repeated on each reel
   * This ensures the game can still function if reel strips aren't configured
   */
  const symbolIds = Object.keys(config.symbols) as SymbolId[];
  return Array(config.numReels).fill(null).map(() => [...symbolIds]);
}

