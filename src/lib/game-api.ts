/**
 * Game API Service
 * 
 * This module provides a service class for communicating with the backend API.
 * It handles all HTTP requests to the game server for spins, sessions, and action games.
 * 
 * Features:
 * - Play game (spin reels)
 * - Action game spins
 * - Session management (get, reset)
 * - Error handling
 * - Type-safe request/response interfaces
 * 
 * Base URL: http://localhost:5001 (configurable)
 * 
 * Usage:
 * ```tsx
 * import { gameApi } from '@/lib/game-api';
 * 
 * const response = await gameApi.playGame({
 *   sessionId: '...',
 *   betAmount: 2.00,
 *   numPaylines: 5
 * });
 * ```
 */

// Direct Backend API Service for Frontend (no RGS layer)
const BACKEND_BASE_URL = 'http://localhost:5001';
const DEFAULT_GAME_ID = 'INFERNO_EMPRESS';

/**
 * Get game ID from various sources
 * 
 * Priority:
 * 1. URL query parameter (?gameId=...)
 * 2. Environment variable (NEXT_PUBLIC_GAME_ID)
 * 3. Default value ('BOOK_OF_RA')
 * 
 * @returns Game ID string
 */
function getGameId(): string {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const gameIdParam = urlParams.get('gameId');
    if (gameIdParam) return gameIdParam;
  }
  return process.env.NEXT_PUBLIC_GAME_ID || DEFAULT_GAME_ID;
}

export interface PlayRequest {
  sessionId: string;
  betAmount: number;
  numPaylines?: number;
  betPerPayline?: number;
  actionGameSpins?: number;
  gameId?: string;
  lastResponse?: any;
}

export interface PlayResponse {
  sessionId: string;
  player: {
    balance: number;
    freeSpinsRemaining: number;
    lastWin: number;
    results: SpinResult;
    actionGameSpins: number;
    featureSymbol: string;
    accumulatedActionGameWin?: number;
  };
  game: {
    balance: number;
    freeSpinsRemaining: number;
    lastWin: number;
    results: SpinResult;
    actionGameSpins: number;
    featureSymbol: string;
    accumulatedActionGameWin?: number;
  };
  freeSpins: number;
  actionGameSpins: number;
  featureSymbol: string;
}

export interface SpinResult {
  totalWin: number;
  winningLines: Array<{
    paylineIndex: number;
    symbol: string;
    count: number;
    payout: number;
    line: number[];
  }>;
  scatterWin: {
    count: number;
    triggeredFreeSpins: boolean;
  };
  grid: string[][];
  actionGameTriggered: boolean;
  actionGameSpins: number;
  actionGameWin: number;
  featureSymbol: string;
  expandedSymbols: Array<{
    reel: number;
    row: number;
  }>;
  expandedWin: number;
  featureGameWinningLines?: Array<{
    paylineIndex: number;
    symbol: string;
    count: number;
    payout: number;
    line: number[];
  }>;
}

export interface ActionGameSpinRequest {
  sessionId: string;
}

export interface ActionGameSpinResponse {
  sessionId: string;
  result: {
    win: number;
    additionalSpins: number;
    wheelResult: string;
  };
  remainingSpins: number;
  accumulatedWin: number;
  totalActionSpins: number;
  balance: number;
}

export interface SessionResponse {
  sessionId: string;
  player: {
    balance: number;
    freeSpinsRemaining: number;
    lastWin: number;
    results: SpinResult;
    actionGameSpins: number;
    featureSymbol: string;
    accumulatedActionGameWin?: number;
  };
  game: {
    balance: number;
    freeSpinsRemaining: number;
    lastWin: number;
    results: SpinResult;
    actionGameSpins: number;
    featureSymbol: string;
    accumulatedActionGameWin?: number;
  };
  freeSpins: number;
  actionGameSpins: number;
  featureSymbol: string;
}

/**
 * GameApiService Class
 * 
 * Service class for making API requests to the backend game server.
 * Provides methods for all game operations.
 */
class GameApiService {
  /**
   * Generic HTTP request method
   * 
   * @param endpoint - API endpoint path (e.g., '/play', '/session/123')
   * @param method - HTTP method ('GET' or 'POST')
   * @param body - Request body (for POST requests)
   * @returns Promise resolving to response data of type T
   * @throws Error if request fails
   * 
   * Handles:
   * - JSON serialization of request body
   * - Error parsing and throwing
   * - Response JSON parsing
   */
  private async makeRequest<T>(endpoint: string, method: 'GET' | 'POST', body?: any): Promise<T> {
    const url = `${BACKEND_BASE_URL}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body && method === 'POST') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Play game (spin reels)
   * 
   * Sends a spin request to the backend and returns the result.
   * 
   * @param request - Play request object
   *   - sessionId: Current session ID
   *   - betAmount: Bet amount (e.g., 2.00)
   *   - numPaylines: Number of active paylines
   *   - betPerPayline: Bet per payline (optional)
   *   - actionGameSpins: Remaining action game spins (optional)
   *   - gameId: Game ID (optional, uses default if not provided)
   * @returns Promise resolving to play response with spin results
   */
  async playGame(request: PlayRequest): Promise<PlayResponse> {
    const gameIdToUse = request.gameId || getGameId();
    return this.makeRequest<PlayResponse>(
      '/play',
      'POST',
      {
        ...request,
        gameId: gameIdToUse,
      }
    );
  }

  /**
   * Spin action game wheel
   * 
   * Executes a single action game spin when player has action game spins remaining.
   * 
   * @param request - Action game spin request
   *   - sessionId: Current session ID
   * @returns Promise resolving to action game result
   */
  async spinActionGame(request: ActionGameSpinRequest): Promise<ActionGameSpinResponse> {
    return this.makeRequest<ActionGameSpinResponse>(
      '/action-game/spin',
      'POST',
      request
    );
  }

  /**
   * Get session state
   * 
   * Retrieves current session state from the backend.
   * 
   * @param sessionId - Session ID to retrieve
   * @returns Promise resolving to session response
   */
  async getSession(sessionId: string): Promise<SessionResponse> {
    return this.makeRequest<SessionResponse>(
      `/session/${sessionId}`,
      'GET'
    );
  }

  /**
   * Reset session
   * 
   * Resets the session state (balance, free spins, etc.) to initial values.
   * 
   * @param sessionId - Session ID to reset
   * @returns Promise resolving to reset confirmation
   */
  async resetSession(sessionId: string): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(
      `/session/${sessionId}/reset`,
      'POST'
    );
  }
}

/**
 * Exported singleton instance of GameApiService
 * 
 * Use this instance throughout the application to make API calls.
 * Example: await gameApi.playGame({ ... })
 */
export const gameApi = new GameApiService();

