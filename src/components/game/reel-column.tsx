/**
 * ReelColumn Component
 * 
 * This component represents a single vertical reel column in the slot machine.
 * It handles the spinning animation and displays symbols in a vertical stack.
 * 
 * Features:
 * - Spinning animation with configurable duration
 * - Bounce animation when reel stops (non-turbo mode)
 * - Expanding animation for feature games
 * - Winning line highlighting
 * - Seamless loop animation using duplicated reel strip
 * 
 * Layout:
 * - Fixed height based on numRows and symbol size (259px per symbol)
 * - Symbols stacked vertically with no gaps
 * - Overflow visible to allow animations
 * 
 * Animation States:
 * - isSpinning: Continuous spinning animation
 * - isStopping: Bounce effect when reel stops
 * - isExpanding: Scale animation for expanding reels
 * - isExpanded: Shows yellow border on all symbols
 */

'use client';

import type { SymbolId } from '@/lib/slot-config';
import { SymbolDisplay } from './symbol-display';
import { cn } from '@/lib/utils';
import { useNumRows, useReelStrips } from '@/lib/slot-config';
import { useState, useEffect } from 'react';

/**
 * Props interface for ReelColumn component
 * 
 * @param symbols - Array of symbol IDs to display (final result after spin)
 * @param isSpinning - Whether this reel is currently spinning
 * @param reelIndex - Index of this reel (0-4 for 5 reels)
 * @param winningLineIndicesForColumn - Array of winning payline indices for each row
 * @param isTurboMode - Whether turbo mode is enabled (affects bounce animation)
 * @param shouldBounce - Whether to trigger bounce animation (synced with reel stop sound)
 * @param isExpanding - Whether this reel is currently expanding (feature game)
 * @param isExpanded - Whether this entire reel is expanded (shows yellow border on all symbols)
 */
interface ReelColumnProps {
  symbols: SymbolId[];
  isSpinning: boolean;
  reelIndex: number;
  winningLineIndicesForColumn: number[][];
  isTurboMode?: boolean;
  shouldBounce?: boolean;
  isExpanding?: boolean;
  isExpanded?: boolean; // True if this entire reel is expanded (should show yellow border on all symbols)
}

export function ReelColumn({ symbols, isSpinning, reelIndex, winningLineIndicesForColumn, isTurboMode = false, shouldBounce = false, isExpanding = false, isExpanded = false }: ReelColumnProps) {
    // Get configuration values from hooks
    const numRows = useNumRows();
    const reelStrips = useReelStrips();
    const reelStrip = reelStrips[reelIndex] || [];
    
    // State for bounce animation (triggered when reel stops)
    const [isStopping, setIsStopping] = useState(false);
    
    // Container height calculated based on numRows and symbol size
    const [containerHeight, setContainerHeight] = useState<number>(0);

    /**
     * Handle bounce animation when reel stops
     * - Only triggers in non-turbo mode
     * - Synced with reel stop sound effect
     * - 300ms bounce duration
     */
    useEffect(() => {
        if (shouldBounce && !isTurboMode) {
            // Trigger bounce when shouldBounce is true (synced with reel stop sound)
            setIsStopping(true);
            const timer = setTimeout(() => setIsStopping(false), 300);
            return () => clearTimeout(timer);
        } else if (!isSpinning && isTurboMode) {
            // No bounce animation for turbo mode (faster gameplay)
            setIsStopping(false);
        }
    }, [shouldBounce, isTurboMode, isSpinning]);

    /**
     * Calculate container height based on numRows and symbol size
     * 
     * Fixed layout calculation for 1296px wide game container:
     * - 5 reels total
     * - 1296px / 5 = 259.2px per reel width
     * - Symbol height: 259px (fixed to match reel width)
     * - No gaps between symbols (gap = 0)
     * - No extra padding (borderPadding = 0)
     * 
     * Formula: (numRows × symbolHeight) + (gaps) + (padding)
     */
    useEffect(() => {
        // Fixed symbol size for vertical cabinet layout (1296px wide)
        // Calculation: 1296px / 5 reels = 259.2px per symbol
        const symbolHeightFixed = 259; // Fixed size for 1296px layout
        const gap = 0; // No gap between symbols
        const borderPadding = 0; // No extra padding
        
        // Fixed height calculation for vertical cabinet
        const height = (numRows * symbolHeightFixed) + ((numRows - 1) * gap) + borderPadding;
        setContainerHeight(height);
    }, [numRows]);

    /**
     * Determine which symbols to display
     * 
     * When spinning:
     * - Duplicate reel strip for seamless loop animation
     * - Shows all symbols from reel strip twice for continuous scrolling
     * 
     * When stopped:
     * - Shows final result symbols (from props)
     * - These are the symbols that landed after the spin
     */
    const displaySymbols = isSpinning 
        ? (reelStrip.length > 0 ? [...reelStrip, ...reelStrip] : [])
        : (symbols || []);

    return (
        <div 
            className="overflow-visible contain-paint"
            style={{ height: containerHeight > 0 ? `${containerHeight}px` : 'auto' }}
        >
            <div
                className={cn(
                    'flex flex-col gap-0 transform-gpu will-change-transform relative',
                    isSpinning && 'animate-reel-spin',
                    isStopping && 'animate-reel-bounce',
                    isExpanding && 'animate-expand-reel'
                )}
                style={{
                    animationDuration: isSpinning ? `3s` : undefined,
                    transformOrigin: isExpanding ? 'center center' : undefined,
                    minHeight: containerHeight > 0 ? `${containerHeight}px` : 'auto',
                } as React.CSSProperties}
            >
                {displaySymbols && displaySymbols.length > 0 
                    ? displaySymbols.slice(0, isSpinning ? (reelStrip.length > 0 ? reelStrip.length * 2 : 0) : numRows).map((symbolId, i) => (
                    <SymbolDisplay 
                        key={i} 
                        symbolId={symbolId} 
                        className="w-full h-[259px] flex-shrink-0"
                        winningLineIndices={winningLineIndicesForColumn[i]} // Show winning line highlights on all reels, including expanded ones
                        isExpandedReel={isExpanded} // Pass flag to show yellow border
                    />
                    ))
                    : null}
            </div>
        </div>
    );
}

