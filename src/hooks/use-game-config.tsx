/**
 * useGameConfig Hook
 * 
 * This hook provides game configuration context to all components.
 * It loads the game configuration from /public/config/{gameId}.json and
 * makes it available throughout the application via React Context.
 * 
 * Features:
 * - Loads config from JSON file on mount
 * - Validates required config fields
 * - Provides loading and error states
 * - Supports gameId from URL params or environment variable
 * - Context-based state management
 * 
 * Usage:
 * ```tsx
 * const { config, loading, error } = useGameConfig();
 * ```
 * 
 * Provider:
 * Must be wrapped in <GameConfigProvider> at the root level (in layout.tsx)
 */

'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import type { FrontendGameConfig, FrontendSymbolConfig } from '@/lib/game-config-types';

/**
 * GameConfigContextType interface
 * 
 * Defines the shape of the context value provided by GameConfigProvider
 * 
 * @param config - The loaded game configuration (null while loading)
 * @param loading - Whether the config is currently being loaded
 * @param error - Error message if config loading failed (null if successful)
 * @param gameId - The current game ID being used
 */
interface GameConfigContextType {
  config: FrontendGameConfig | null;
  loading: boolean;
  error: string | null;
  gameId: string;
}

/**
 * React Context for game configuration
 * 
 * Provides game config to all components in the component tree
 * Components access it via useGameConfig() hook
 */
const GameConfigContext = createContext<GameConfigContextType | undefined>(undefined);

/**
 * Get gameId from various sources
 * 
 * Priority order:
 * 1. URL query parameter (?gameId=...)
 * 2. Environment variable (NEXT_PUBLIC_GAME_ID)
 * 3. Default value ('BOOK_OF_RA')
 * 
 * @returns The game ID to use for loading configuration
 */
function getGameId(): string {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const gameIdParam = urlParams.get('gameId');
    if (gameIdParam) return gameIdParam;
  }
  
  return process.env.NEXT_PUBLIC_GAME_ID || 'INFERNO_EMPRESS';
}

/**
 * GameConfigProvider Component
 * 
 * React Context Provider that loads and provides game configuration
 * to all child components. Must wrap the application root.
 * 
 * @param children - React children components
 * 
 * Behavior:
 * - Loads config from /public/config/{gameId}.json on mount
 * - Validates required fields (numReels, numRows, symbols, paylines)
 * - Manages loading and error states
 * - Re-loads config if gameId changes
 */
export function GameConfigProvider({ children }: { children: ReactNode }) {
  // State for game configuration
  const [config, setConfig] = useState<FrontendGameConfig | null>(null);
  
  // State for loading status
  const [loading, setLoading] = useState(true);
  
  // State for error messages
  const [error, setError] = useState<string | null>(null);
  
  // Get gameId once on mount (from URL params, env var, or default)
  const [gameId] = useState(getGameId());

  /**
   * Load game configuration from JSON file
   * 
   * Fetches config from /public/config/{gameId}.json
   * Validates required fields and handles errors
   * 
   * Re-runs when gameId changes
   */
  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        setError(null);
        
        // Load config from public/config/{gameId}.json
        // Path is relative to public folder, so /config/... maps to public/config/...
        const response = await fetch(`/config/${gameId}.json`);
        
        if (!response.ok) {
          throw new Error(`Failed to load game config for: ${gameId}`);
        }
        
        const loadedConfig: FrontendGameConfig = await response.json();
        
        /**
         * Validate required configuration fields
         * Ensures config has all necessary data for the game to function
         */
        if (!loadedConfig.numReels || !loadedConfig.numRows || !loadedConfig.symbols || !loadedConfig.paylines) {
          throw new Error('Invalid game configuration: missing required fields');
        }
        
        setConfig(loadedConfig);
      } catch (err) {
        console.error('Error loading game config:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, [gameId]);

  return (
    <GameConfigContext.Provider value={{ config, loading, error, gameId }}>
      {children}
    </GameConfigContext.Provider>
  );
}

/**
 * useGameConfig Hook
 * 
 * Custom hook to access game configuration from context
 * 
 * @returns GameConfigContextType object with config, loading, error, and gameId
 * @throws Error if used outside of GameConfigProvider
 * 
 * Usage:
 * ```tsx
 * const { config, loading, error } = useGameConfig();
 * 
 * if (loading) return <Loading />;
 * if (error) return <Error message={error} />;
 * if (!config) return null;
 * 
 * // Use config...
 * ```
 */
export function useGameConfig() {
  const context = useContext(GameConfigContext);
  if (context === undefined) {
    throw new Error('useGameConfig must be used within a GameConfigProvider');
  }
  return context;
}

/**
 * Helper function to get all symbol IDs from config
 * 
 * @param config - Game configuration object
 * @returns Array of symbol ID strings
 */
export function getSymbolIds(config: FrontendGameConfig): string[] {
  return Object.keys(config.symbols);
}

/**
 * Helper function to get a specific symbol's configuration
 * 
 * @param config - Game configuration object
 * @param symbolId - The ID of the symbol to retrieve
 * @returns Symbol configuration object, or undefined if not found
 */
export function getSymbolConfig(config: FrontendGameConfig, symbolId: string): FrontendSymbolConfig | undefined {
  return config.symbols[symbolId];
}

