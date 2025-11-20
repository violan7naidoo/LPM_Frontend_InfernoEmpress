/**
 * Frontend Game Configuration Types
 * 
 * TypeScript type definitions for the game configuration structure.
 * These types match the structure of the backend JSON config files
 * located in /public/config/{gameId}.json
 * 
 * Purpose:
 * - Type safety for configuration data
 * - IntelliSense support in IDE
 * - Documentation of config structure
 * - Validation of config shape
 */

// Frontend Game Configuration Types
// Matches the structure of backend JSON configs

/**
 * FrontendGameConfig interface
 * 
 * Main game configuration structure loaded from JSON
 * 
 * @param gameId - Optional game identifier
 * @param gameName - Display name of the game
 * @param numReels - Number of reels (typically 5)
 * @param numRows - Number of rows (typically 3)
 * @param betAmounts - Available bet amounts (e.g., [1.00, 2.00, 3.00, 5.00])
 * @param freeSpinsAwarded - Number of free spins when feature is triggered
 * @param wildSymbol - Legacy: Wild symbol ID (optional)
 * @param scatterSymbol - Legacy: Scatter symbol ID (optional)
 * @param bookSymbol - Book of Ra style: Combined wild/scatter symbol
 * @param maxPaylines - Maximum number of paylines
 * @param actionGameTriggers - Action game trigger configurations
 * @param actionGameWheel - Action game wheel configurations
 * @param symbols - Record of all symbol configurations
 * @param paylines - Array of payline definitions (row indices per reel)
 * @param reelStrips - Optional: Reel strips for spinning animation
 * @param scatterPayout - Optional: Bet-specific scatter payouts
 * @param scatterActionGames - Optional: Bet-specific scatter action games
 */
export interface FrontendGameConfig {
  gameId?: string;
  gameName: string;
  numReels: number;
  numRows: number;
  betAmounts: number[];
  freeSpinsAwarded: number;
  
  // Legacy fields (for backward compatibility)
  wildSymbol?: string;
  scatterSymbol?: string;
  
  // Book of Ra specific fields
  bookSymbol?: string; // Combined wild/scatter symbol
  maxPaylines?: number;
  actionGameTriggers?: Record<string, ActionGameTrigger>;
  actionGameWheel?: Record<string, number>;
  
  symbols: Record<string, FrontendSymbolConfig>;
  paylines: number[][];
  reelStrips?: string[][]; // Optional: reel strips for spinning animation
  scatterPayout?: Record<string, Record<string, number>>; // Bet-specific scatter payouts
  scatterActionGames?: Record<string, Record<string, number>>; // Bet-specific scatter action games
}

/**
 * FrontendSymbolConfig interface
 * 
 * Configuration for a single symbol
 * 
 * @param name - Display name of the symbol (e.g., "Queen", "Scatter")
 * @param image - Path to symbol image (e.g., "/images/symbols/Queen.png")
 * @param payout - Bet-specific payout structure
 *   Format: { "betAmount": { "count": payout } }
 *   Example: { "1.00": { "3": 1.00, "4": 5.00, "5": 70.00 }, "2.00": {...} }
 * @param actionGames - Bet-specific action games structure
 *   Format: { "betAmount": { "count": actionGames } }
 *   Example: { "1.00": { "5": 13 }, "2.00": { "5": 33 } }
 */
export interface FrontendSymbolConfig {
  name: string;
  image: string;
  // Bet-specific payouts: key is bet amount (e.g., "1.00"), value is count -> payout in Rands
  payout?: Record<string, Record<string, number>>; // e.g., {"1.00": {"3": 1.00, "4": 5.00}, "2.00": {...}}
  actionGames?: Record<string, Record<string, number>>; // Bet-specific action games
}

/**
 * ActionGameTrigger interface
 * 
 * Configuration for action game triggers
 * 
 * @param symbol - Symbol that triggers the action game
 * @param count - Number of symbols required to trigger
 * @param baseWin - Base win amount when triggered
 * @param actionSpins - Number of action game spins awarded
 */
export interface ActionGameTrigger {
  symbol: string;
  count: number;
  baseWin: number;
  actionSpins: number;
}

/**
 * SymbolId type
 * 
 * Type alias for symbol identifier strings
 * Examples: "Queen", "Scatter", "A", "K", "10"
 */
export type SymbolId = string;

