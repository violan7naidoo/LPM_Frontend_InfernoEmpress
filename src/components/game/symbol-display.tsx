/**
 * SymbolDisplay Component
 * 
 * This component renders a single symbol in the reel grid.
 * It handles both static symbol display and animated sequences for winning symbols.
 * 
 * Features:
 * - Static symbol image display
 * - Image sequence animation for winning symbols
 * - Winning line highlighting with colored borders
 * - Expanded reel highlighting (yellow border)
 * - Pulse animation fallback when no sequence available
 * 
 * Visual States:
 * - Normal: Static symbol image, no border
 * - Winning: Colored border matching payline color, animation plays
 * - Expanded Reel: Yellow border on all symbols in expanded reel
 * 
 * Animation Priority:
 * 1. Image sequence animation (if available and symbol is winning)
 * 2. Pulse animation (if no sequence available)
 * 3. Static image (normal state)
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSymbols, type SymbolId } from '@/lib/symbols';
import { cn } from '@/lib/utils';
import { PAYLINE_COLORS } from './winning-lines-display';
import { ImageSequenceAnimation } from './image-sequence-animation';

/**
 * Props interface for SymbolDisplay component
 * 
 * @param symbolId - The ID of the symbol to display (e.g., "Scatter", "Queen", "A")
 * @param className - Additional CSS classes to apply
 * @param winningLineIndices - Array of payline indices that pass through this symbol
 * @param isExpandedReel - Whether this symbol is part of an expanded reel (shows yellow border)
 */
interface SymbolDisplayProps {
  symbolId: SymbolId;
  className?: string;
  winningLineIndices?: number[];
  isExpandedReel?: boolean; // True if this symbol is part of an expanded reel (should show yellow border)
}

export function SymbolDisplay({ symbolId, className, winningLineIndices = [], isExpandedReel = false }: SymbolDisplayProps) {
  // Load symbol configuration from context
  const symbols = useSymbols();
  const symbol = symbols[symbolId];
  
  /**
   * Determine if this symbol is part of a winning combination
   * - Has winning line indices (part of a winning payline), OR
   * - Is part of an expanded reel (feature game)
   */
  const isWinning = winningLineIndices.length > 0 || isExpandedReel;

  // Return null if symbol doesn't exist (prevents rendering errors)
  if (!symbol) {
    return null;
  }
  
  /**
   * Check if animation should play
   * Currently plays animation for all winning symbols
   * Future: Could check if animation frames exist for this symbol
   */
  const hasAnimation = isWinning;

  /**
   * Determine border color for winning symbols
   * - Expanded reels: Always yellow (#FFFF00)
   * - Winning paylines: Use payline color from PAYLINE_COLORS array
   * - Normal symbols: No border (undefined)
   */
  const borderColor = isExpandedReel 
    ? '#FFFF00' // Yellow for expanded reels
    : (isWinning ? PAYLINE_COLORS[winningLineIndices[0] % PAYLINE_COLORS.length] : undefined);

  return (
    <div
      className={cn(
        'aspect-square w-full h-full flex items-center justify-center bg-black/30 rounded-lg p-2 transition-all duration-300 relative overflow-visible',
        // Apply border and shadow styles directly
        isWinning && 'border-2',
        // Use the fallback pulse animation ONLY if animation isn't playing
        isWinning && !hasAnimation && 'animate-pulse-win',
        className
      )}
      style={{
        borderColor: borderColor,
        boxShadow: isWinning ? `0 0 10px ${borderColor}` : undefined
      }}
    >
      {/* 
        Inner container for image with overflow-hidden to prevent image overflow
        - absolute inset-0: Fills the parent container
        - overflow-hidden: Clips content to container bounds
        - rounded-lg: Matches parent border radius
      */}
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        {/* 
          Image sequence animation - rendered when symbol is winning
          - Plays frame-by-frame animation from /animations/{symbol}/ folder
          - Loops continuously while isWinning is true
          - Duration: 3 seconds per loop
          - Overlays the static image when playing
        */}
        {hasAnimation && (
          <ImageSequenceAnimation
            symbolId={symbolId}
            isPlaying={isWinning}
            duration={3} // Loop every 3 seconds - will keep looping while isWinning is true
            className="absolute inset-0"
          />
        )}

        {/* 
          Static symbol image - always present as fallback
          - Visible when animation is not playing
          - Hidden (opacity-0) when animation is playing
          - Uses Next.js Image component for optimization
        */}
        {symbol.image ? (
          <Image 
            src={symbol.image} 
            alt={symbolId.toLowerCase()} 
            fill
            sizes="196px"
            className={cn(
              "object-contain drop-shadow-lg transition-opacity duration-300",
              // If animation is playing, the image is hidden; otherwise, it's visible.
              hasAnimation ? 'opacity-0' : 'opacity-100'
            )}
            unoptimized={process.env.NODE_ENV !== 'production'}
          />
        ) : (
          // Fallback: Show symbol ID as text if image is missing
          <div className="w-full h-full flex items-center justify-center text-white">
            {symbolId}
          </div>
        )}
      </div>
    </div>
  );
}

SymbolDisplay.displayName = 'SymbolDisplay';

