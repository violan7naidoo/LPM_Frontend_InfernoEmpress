/**
 * TopSection Component
 * 
 * This component displays the dynamic paytable for the slot game.
 * It shows symbol payouts and action games that update based on the current bet amount.
 * 
 * Structure:
 * - Row 1: Scatter symbol + SUBSTITUTES FOR section (combined in one block)
 * - Row 2: Coin (left) + Crystal (right)
 * - Row 3: Dagger (left) + Dragon (right)
 * - Row 4: Feather,Orb (left) + 1,2,3 (right)
 * - Center: 10 PENNY GAMES feature block (overlay)
 */

'use client';

import { useGameConfig } from '@/hooks/use-game-config';
import Image from 'next/image';
import type { FrontendGameConfig, FrontendSymbolConfig } from '@/lib/game-config-types';

/**
 * Props interface for TopSection component
 * @param betAmount - The current bet amount (e.g., 1.00, 2.00, 3.00, 5.00)
 *                    This value is used to look up bet-specific payouts from the config
 * @param isFreeSpinsMode - Whether currently in free spins mode
 * @param featureSymbol - The expanding symbol selected for free spins (e.g., "K", "Queen")
 */
interface TopSectionProps {
  betAmount: number;
  isFreeSpinsMode?: boolean;
  featureSymbol?: string;
  showActionWheel?: boolean;
  actionGameWinMessage?: string;
  actionGameWinAmount?: number;
  actionGamesFinished?: boolean;
  showFeatureGameWins?: boolean; // Used for other feature game win logic (not currently used for expanding symbol display)
}

/**
 * PayCell Component
 * 
 * Displays a single high-value symbol with its payout information.
 * Used for symbols like Scatter, Coin, Crystal, Dagger, Dragon.
 * 
 * @param symbolId - The ID of the symbol to display (e.g., "Scatter", "Queen")
 * @param betKey - The bet amount formatted as a string key (e.g., "1.00", "2.00")
 *                 Used to look up bet-specific payouts from the config
 * @param config - The game configuration object containing all symbol data
 * @param hidePayouts - Optional array of payout counts to hide (e.g., [2] to hide 2x payouts)
 * 
 * Features:
 * - Displays symbol image on the left
 * - Shows payout amounts for 5x, 4x, 3x, 2x combinations
 * - Displays action games (AG) in red when available
 * - Payout amounts are shown in yellow, AG values in red
 * - Wrapped in a styled background block with yellow border
 */
function PayCell({
  symbolId,
  betKey,
  config,
  hidePayouts = [],
  alignRight = false,
  borderImage,
}: {
  symbolId: string;
  betKey: string;
  config: FrontendGameConfig;
  hidePayouts?: number[];
  alignRight?: boolean;
  borderImage?: string;
}) {
  // Retrieve the symbol configuration from the game config
  // Returns null if symbol doesn't exist (prevents rendering errors)
  const symbol = config?.symbols?.[symbolId];
  if (!symbol) return null;

  // Extract bet-specific payout data for this symbol
  // Structure: { "5": 70.00, "4": 20.00, "3": 2.00, "2": 1.00 }
  const payouts = symbol.payout?.[betKey] || {};
  
  // Extract bet-specific action games data for this symbol
  // Structure: { "5": 13, "4": 1 } (action games awarded for specific combinations)
  const actionGames = symbol.actionGames?.[betKey] || {};

  /**
   * formatPayout - Formats and displays a single payout line
   * 
   * @param count - The number of matching symbols (2, 3, 4, or 5)
   * @returns JSX element displaying the payout, or null if hidden
   * 
   * Format: "5x 70.00 + 13AG"
   * - Count (e.g., "5x") in white
   * - Payout amount (e.g., "70.00") in yellow
   * - Action games (e.g., "+ 13AG") in red (only shown if > 0)
   */
  const formatPayout = (count: number) => {
    if (hidePayouts.includes(count)) return null;
    const countKey = count.toString();
    const pay = payouts[countKey] || 0;
    const ag = actionGames[countKey] || 0;
    return (
      <p key={count} className="text-white text-3xl leading-tight">
        {count}x{' '}
        <span className="font-bold" style={{ 
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {pay.toFixed(2)}
        </span>
        {ag > 0 && (
          <span className="text-red-500 font-bold">
            {' '}+ {ag}AG
          </span>
        )}
      </p>
    );
  };

  // Render the paytable cell with symbol image and payout information
  return (
    // Background block: semi-transparent black with yellow border (or custom border image)
    // p-6 = 24px padding, border-4 = 4px border
    // w-[720px]: Fixed width for rows 2, 3, 4 (420px + 200px + 100px)
    // Conditional rounded corners: left blocks round left, right blocks round right, no outer border
    <div 
      className={`bg-black/40 p-6 w-[720px] relative ${
        alignRight 
          ? 'rounded-r-lg rounded-l-none flex justify-end' 
          : 'rounded-l-lg rounded-r-none'
      }`}
      style={{
        border: borderImage ? 'none' : '4px solid rgba(234, 179, 8, 0.5)',
        ...(alignRight ? { marginRight: '25px' } : {})
      }}
    >
      {/* Border image overlay */}
      {borderImage && (
        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            backgroundImage: `url(${borderImage})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 0
          }}
        />
      )}
      {/* Flex container: symbol image on left, payouts on right (or reversed for right-aligned) */}
      <div className={`flex items-center relative z-10 ${alignRight ? 'flex-row-reverse gap-2' : 'gap-8'}`}>
        <Image
          src={symbol.image}
          alt={symbol.name}
          width={160}
          height={160}
          className="object-contain w-40 h-40 flex-shrink-0"
        />
        <div className="text-3xl font-bold leading-tight text-white w-[240px] flex-shrink-0">
          {formatPayout(5)}
          {formatPayout(4)}
          {formatPayout(3)}
          {formatPayout(2)}
        </div>
      </div>
    </div>
  );
}

/**
 * LowPayCell Component
 * 
 * Displays multiple low-value symbols grouped together with shared payout information.
 * Used for symbols (Feather, Orb, 1, 2, 3) that have the same payout structure.
 * 
 * @param symbolIds - Array of symbol IDs to display together (e.g., ["Feather", "Orb"] or ["1", "2", "3"])
 * @param betKey - The bet amount formatted as a string key (e.g., "1.00", "2.00")
 * @param config - The game configuration object containing all symbol data
 * @param hidePayouts - Optional array of payout counts to hide
 * 
 * Features:
 * - Displays multiple overlapping symbol images
 * - Uses payout data from the first symbol (all symbols in group share same payouts)
 * - Shows payouts for 5x, 4x, 3x combinations (no 2x for low-pay symbols)
 * - Symbols are overlapped using negative margin for visual effect
 */
function LowPayCell({
  symbolIds,
  betKey,
  config,
  hidePayouts = [],
  alignRight = false,
  borderImage,
}: {
  symbolIds: string[];
  betKey: string;
  config: FrontendGameConfig;
  hidePayouts?: number[];
  alignRight?: boolean;
  borderImage?: string;
}) {
  // Map symbol IDs to their configuration objects and filter out any null/undefined values
  const symbols = symbolIds.map((id) => config?.symbols?.[id]).filter(Boolean) as FrontendSymbolConfig[];
  if (symbols.length === 0) return null;

  // Low-pay symbols share the same payout structure, so we use the first symbol's data
  // This ensures consistency across all symbols in the group (Feather, Orb, 1, 2, 3)
  const payouts = symbols[0].payout?.[betKey] || {};
  const actionGames = symbols[0].actionGames?.[betKey] || {};

  const formatPayout = (count: number) => {
    if (hidePayouts.includes(count)) return null;
    const countKey = count.toString();
    const pay = payouts[countKey] || 0;
    const ag = actionGames[countKey] || 0;
    return (
      <p key={count} className="text-white text-3xl leading-tight">
        {count}x{' '}
        <span className="font-bold" style={{ 
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {pay.toFixed(2)}
        </span>
        {ag > 0 && (
          <span className="text-red-500 font-bold">
            {' '}+ {ag}AG
          </span>
        )}
      </p>
    );
  };

  return (
    <div 
      className={`bg-black/40 p-6 w-[720px] relative rounded-lg ${
        alignRight 
          ? 'flex justify-end' 
          : ''
      }`}
      style={{
        border: borderImage ? 'none' : '4px solid rgba(234, 179, 8, 0.5)',
        ...(alignRight ? { marginRight: '25px' } : {})
      }}
    >
      {/* Border image overlay */}
      {borderImage && (
        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            backgroundImage: `url(${borderImage})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 0
          }}
        />
      )}
      <div className={`flex items-center relative z-10 ${alignRight ? 'flex-row-reverse gap-1' : 'gap-4'}`}>
        <div className="flex flex-shrink-0">
          {symbols.map((symbol, index) => (
            <Image
              key={symbol.name}
              src={symbol.image}
              alt={symbol.name}
              width={120}
              height={120}
              className="object-contain w-28 h-28"
              style={{ marginLeft: index > 0 ? '-16px' : '0' }}
            />
          ))}
        </div>
        <div className="text-3xl font-bold leading-tight text-white w-[230px] flex-shrink-0">
          {formatPayout(5)}
          {formatPayout(4)}
          {formatPayout(3)}
        </div>
      </div>
    </div>
  );
}

/**
 * TopSection - Main Component
 * 
 * This is the main paytable display component for the slot game.
 * It renders a 4x2 grid layout showing all symbol payouts that update dynamically
 * based on the current bet amount.
 * 
 * Data Flow:
 * 1. Receives betAmount as prop from parent (page.tsx)
 * 2. Loads game config using useGameConfig hook
 * 3. Formats betAmount to betKey (e.g., 2.00 -> "2.00")
 * 4. Filters and organizes symbols by type (scatter, high-pay, low-pay)
 * 5. Renders paytable grid with dynamic payout values
 * 
 * Layout Structure:
 * - Container: flex-[1.5] (takes 1.5/6 of vertical space in game container)
 * - Grid: 2 columns, 4 rows with spacing
 * - Overlay: "10 PENNY GAMES" block positioned absolutely in center
 */
export function TopSection({ betAmount, isFreeSpinsMode = false, featureSymbol, showActionWheel = false, actionGameWinMessage, actionGameWinAmount, actionGamesFinished = false, showFeatureGameWins = false }: TopSectionProps) {
  // Load game configuration from context/hook
  // This contains all symbol data, payouts, and action games
  const { config } = useGameConfig();

  // Show loading/empty state if config hasn't loaded yet
  if (!config) {
    return (
      <div
        className="flex-[1.5] flex items-center justify-center bg-black/20 border-b-2 border-primary/30"
        style={{
          background:
            'radial-gradient(circle, rgba(0,20,50,0.8) 0%, rgba(0,10,30,0.8) 100%)',
        }}
      ></div>
    );
  }

  // Convert bet amount to string key format used in config (e.g., 2.00 -> "2.00")
  // This key is used to look up bet-specific payouts from the config
  const betKey = betAmount.toFixed(2);
  
  // Get the scatter/book symbol ID from config (defaults to 'Scatter' if not found)
  const scatterSymbol = config.bookSymbol || 'Scatter';

  /**
   * Filter and organize symbols by type
   * 
   * High-pay symbols: All symbols except scatter and low-pay symbols
   * These are the premium symbols (Coin, Crown, Crystals, Dagger, Dragon)
   */
  const highPaySymbols = Object.keys(config.symbols).filter(
    (id) =>
      id !== scatterSymbol &&
      !['Bottle', 'Feather', 'Orb', 'Ring'].includes(id)
  );

  /**
   * Extract specific symbol IDs for the paytable layout
   * Uses find() to locate by name, with fallback to array index, then to default string
   * This ensures we always have valid symbol IDs even if config structure changes
   */
  const coinSymbol = highPaySymbols.find(id => id === 'Coin') || highPaySymbols[0] || 'Coin';
  const crownSymbol = highPaySymbols.find(id => id === 'Crown') || highPaySymbols[1] || 'Crown';
  const crystalsSymbol = highPaySymbols.find(id => id === 'Crystals') || highPaySymbols.find(id => id === 'Crystal') || highPaySymbols[2] || 'Crystals';
  const daggerSymbol = highPaySymbols.find(id => id === 'Dagger') || highPaySymbols[3] || 'Dagger';
  const dragonSymbol = highPaySymbols.find(id => id === 'Dragon') || highPaySymbols[4] || 'Dragon';

  /**
   * Collect substitute symbols - these are the high-pay symbols that can act as wilds
   * Used in the "SUBSTITUTES FOR" section to show which symbols can replace others
   */
  const substituteSymbols = [coinSymbol, crownSymbol, crystalsSymbol, daggerSymbol, dragonSymbol].filter(Boolean);

  return (
    /**
     * Main Container
     * - flex-[1.5]: Takes 1.5/6.5 of the vertical space in the game container (increased height)
     * - relative: Allows absolute positioning of the "10 PENNY GAMES" overlay
     * - Background: Dark blue radial gradient for visual depth
     * - pt-0: No top padding to fill space under title
     * - pb-4: Bottom padding to keep content within section
     * - No horizontal padding to stretch paytable edge-to-edge
     * - overflow-hidden: Prevents content from overflowing into other sections
     */
    <div
     className="flex-[1.0] flex items-start justify-start bg-transparent pt-0 pb-0 relative overflow-visible px-0"
      style={{
        width: '100%',
        minWidth: '100%',
        transform: 'translateY(20px)',
        zIndex: 10,
      }}
    >
      {/* 
        Paytable Grid Container
        - grid-cols-2: 2 columns layout
        - gap-x-6: 24px horizontal gap between columns (reduced from 48px)
        - gap-y-4: 16px vertical gap between rows (reduced from 24px)
        - w-full: Full width to extend to extreme edges
        - relative: Allows absolute positioning of center overlay
        - scale-75: Scales down the entire paytable to 75% to fit within top section
        - origin-top: Scales from top to position at the very top of the section
        - z-10: Ensure paytable appears above middle section content
        - No horizontal padding/margin to extend to edges
      */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 relative z-10 scale-75 origin-top-left" style={{ width: '133.33%', minWidth: '133.33%', maxWidth: 'none' }}>
        {/* 
          Row 1 (Top): Scatter and SUBSTITUTES FOR combined in one long block
          - col-span-2: Spans both columns of the grid
          - This creates a single wide block at the top
        */}
        <div 
          className="col-span-2 bg-black/40 rounded-lg p-6 relative"
          style={{
            border: 'none',
            position: 'relative',
            marginLeft: '25px',
            marginRight: '35px'
          }}
        >
          {/* Border image overlay */}
          <div
            className="absolute inset-0 pointer-events-none rounded-lg"
            style={{
              backgroundImage: 'url(/frame/scatter-block.png)',
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              zIndex: 0
            }}
          />
          {/* Content wrapper with z-index to appear above border */}
          <div className="relative z-10 flex items-center justify-between gap-8">
            {/* Scatter section on left side of the block */}
            <div className="flex items-center gap-8">
              {/* 
                IIFE (Immediately Invoked Function Expression) to render Scatter symbol
                This inline rendering is used because we need custom logic (hiding 2x payout)
                that differs from the standard PayCell component
              */}
              {(() => {
                const symbol = config?.symbols?.[scatterSymbol];
                if (!symbol) return null;
                const payouts = symbol.payout?.[betKey] || {};
                const actionGames = symbol.actionGames?.[betKey] || {};
                const formatPayout = (count: number) => {
                  if (count === 2) return null;
                  const countKey = count.toString();
                  const pay = payouts[countKey] || 0;
                  const ag = actionGames[countKey] || 0;
                  return (
                    <p key={count} className="text-white text-3xl leading-tight">
                      {count}x{' '}
                      <span className="font-bold" style={{ 
                        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}>
                        {pay.toFixed(2)}
                      </span>
                      {ag > 0 && (
                        <span className="text-red-500 font-bold">
                          {' '}+ {ag}AG
                        </span>
                      )}
                    </p>
                  );
                };
                return (
                  <>
                    <Image
                      src={symbol.image}
                      alt={symbol.name}
                      width={160}
                      height={160}
                      className="object-contain w-40 h-40"
                    />
                    <div className="text-3xl font-bold leading-tight text-white">
                      {formatPayout(5)}
                      {formatPayout(4)}
                      {formatPayout(3)}
                    </div>
                  </>
                );
              })()}
            </div>
            {/* 
              SUBSTITUTES FOR section on right side of the block
              - items-center: Centers the text above the symbols
              - Shows which symbols can act as wilds/substitutes
            */}
            <div className="flex flex-col gap-4 items-center">
              <p className="text-blue-400 font-bold text-4xl" style={{ fontFamily: 'Cinzel, serif' }}>SUBSTITUTES FOR</p>
              <div className="flex gap-2">
                {substituteSymbols.slice(0, 4).map((symbolId) => {
                  const symbol = config.symbols[symbolId];
                  if (!symbol) return null;
                  return (
                    <Image
                      key={symbolId}
                      src={symbol.image}
                      alt={symbol.name}
                      width={80}
                      height={80}
                      className="object-contain w-20 h-20"
                    />
                  );
                })}
              </div>
              <div className="flex gap-2">
                {['Ring', 'Bottle', 'Feather', 'Orb'].map((symbolId) => {
                  const symbol = config.symbols[symbolId];
                  if (!symbol) return null;
                  return (
                    <Image
                      key={symbolId}
                      src={symbol.image}
                      alt={symbol.name}
                      width={60}
                      height={60}
                      className="object-contain w-14 h-14"
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 
          Row 2: Coin (left) and Crown (right)
          - Left block: Starts at left edge
          - Right block: Aligned to right edge with space in middle
        */}
        <div className="w-full" style={{ marginLeft: '25px' }}>
          <PayCell symbolId={coinSymbol} betKey={betKey} config={config} alignRight={false} borderImage="/frame/left-block.png" />
        </div>
        <div className="w-full flex justify-end" style={{ paddingLeft: '300px', marginRight: '25px' }}>
          <PayCell symbolId={crownSymbol} betKey={betKey} config={config} alignRight={true} borderImage="/frame/right-block.png" />
        </div>

        {/* 
          Row 3: Crystals (left) and Dagger (right)
          - Left block: Starts at left edge
          - Right block: Aligned to right edge with space in middle
          - Matches BookOfRa structure: Wolf (left) and Leopard (right)
        */}
        <div className="w-full" style={{ marginLeft: '25px' }}>
          <PayCell symbolId={crystalsSymbol} betKey={betKey} config={config} alignRight={false} borderImage="/frame/left-block.png" />
        </div>
        <div className="w-full flex justify-end" style={{ paddingLeft: '300px', marginRight: '25px' }}>
          <PayCell symbolId={daggerSymbol} betKey={betKey} config={config} alignRight={true} borderImage="/frame/right-block.png" />
        </div>

        {/* 
          Row 4 (Bottom): Low-pay symbols
          - Left: Ring and Bottle symbols grouped together (starts at left edge) - matches BookOfRa's A+K structure (2 symbols)
          - Right: Feather and Orb symbols grouped together (aligned to right edge with space in middle) - matches BookOfRa's Q+J+10 structure (3 symbols)
          - LowPayCell handles multiple symbols with shared payouts
          - Note: In BookOfRa, Row 4 has A+K (left, 2 symbols) and Q+J+10 (right, 3 symbols)
          - Since InfernoEmpress has 4 low-pay symbols total, using 2 left + 2 right to match the visual structure
        */}
        <div className="w-full" style={{ marginLeft: '25px' }}>
          <LowPayCell
            symbolIds={['Ring', 'Bottle']}
            betKey={betKey}
            config={config}
            alignRight={false}
            borderImage="/frame/left-block.png"
          />
        </div>
        <div className="w-full flex justify-end" style={{ paddingLeft: '300px', marginRight: '25px' }}>
          <LowPayCell
            symbolIds={['Feather', 'Orb']}
            betKey={betKey}
            config={config}
            alignRight={true}
            borderImage="/frame/right-block.png"
          />
        </div>

        {/* 
          Middle block - "10 PENNY GAMES" / Feature Symbol / Action Games
          - Positioned absolutely within the grid to sit between left and right blocks
          - Does not affect grid flow
        */}
        <div className="col-span-2 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none" style={{ marginTop: '100px', marginLeft: '35px' }}>
          <div className="flex flex-col items-center justify-center bg-black/40 rounded-lg p-8 w-[500px] h-[550px] relative pointer-events-auto" style={{ border: 'none' }}>
            {/* Border image overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'url(/frame/middle-block.png)',
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                zIndex: 0
              }}
            />
            {actionGamesFinished ? (
              <p className="font-bold text-3xl relative z-10" style={{ 
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>ACTION GAMES FINISHED</p>
            ) : showActionWheel && actionGameWinMessage ? (
              <>
                <p className="font-bold text-2xl sm:text-3xl md:text-4xl mb-4 text-center relative z-10" style={{ 
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {actionGameWinMessage}
                </p>
                {actionGameWinAmount && actionGameWinAmount > 0 && (
                  <p className="font-bold text-3xl sm:text-4xl md:text-5xl relative z-10" style={{ 
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    R {actionGameWinAmount.toFixed(2)}
                  </p>
                )}
              </>
            ) : isFreeSpinsMode && featureSymbol ? (
              // Show expanding symbol during free spins (not just after expansion)
              <>
                <p className="font-bold text-2xl mb-4 relative z-10" style={{ 
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>EXPANDING SYMBOL</p>
                {config?.symbols?.[featureSymbol]?.image ? (
                  <div className="relative w-80 h-80 flex items-center justify-center z-10">
                    <Image
                      src={config.symbols[featureSymbol].image}
                      alt={featureSymbol}
                      width={320}
                      height={320}
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <p className="font-bold text-4xl mt-4 relative z-10" style={{ 
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>{featureSymbol}</p>
                )}
              </>
            ) : showActionWheel ? (
              <p className="font-bold text-3xl relative z-10" style={{ 
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>ACTION GAMES</p>
            ) : (
              <>
                <p className="font-bold text-3xl relative z-10" style={{ 
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>10 PENNY GAMES</p>
                <p className="font-bold text-3xl relative z-10" style={{ 
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>+</p>
                <p className="font-bold text-3xl relative z-10" style={{ 
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>SPECIAL EXPANDING SYMBOL</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
