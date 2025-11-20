/**
 * Symbols Configuration Hook
 * 
 * This module provides a hook to access symbol configurations from the game config.
 * Symbols are loaded dynamically from the config file, not hardcoded.
 * 
 * Features:
 * - Returns all symbols as a Record (object)
 * - Type-safe symbol access
 * - Returns empty object if config not loaded
 */

// Symbols configuration - now loaded from config
export type SymbolId = string; // Dynamic based on config

// Hook to get symbols from config
import { useGameConfig } from '@/hooks/use-game-config';
import type { FrontendSymbolConfig } from '@/lib/game-config-types';

/**
 * useSymbols Hook
 * 
 * Returns all symbol configurations from the game config.
 * 
 * @returns Record of symbol ID to symbol configuration
 *   Format: { "Queen": { name: "Queen", image: "...", ... }, ... }
 *   Returns empty object {} if config not loaded
 * 
 * Usage:
 * ```tsx
 * const symbols = useSymbols();
 * const queenSymbol = symbols['Queen'];
 * ```
 */
export function useSymbols(): Record<string, FrontendSymbolConfig> {
  const { config } = useGameConfig();
  if (!config) return {};
  
  /**
   * Convert config symbols to the expected format
   * Creates a new object with all symbols from config
   * This ensures type safety and provides a clean API
   */
  const symbols: Record<string, FrontendSymbolConfig> = {};
  Object.keys(config.symbols).forEach((key) => {
    symbols[key] = config.symbols[key];
  });
  
  return symbols;
}

