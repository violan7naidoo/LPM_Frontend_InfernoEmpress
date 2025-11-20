/**
 * PaylineNumbers Component
 * 
 * This component displays payline number indicators on the left and right sides
 * of the reel grid. It shows which paylines are active and highlights winning paylines.
 * 
 * Features:
 * - Displays numbers 1-5 for all paylines
 * - Highlights active/winning paylines with colored backgrounds
 * - Positions numbers based on payline paths (start/end positions)
 * - Handles overlapping paylines with offset positioning
 * - Responsive sizing for different screen sizes
 * 
 * Layout:
 * - Left side: Numbers positioned based on first reel of each payline
 * - Right side: Numbers positioned based on last reel of each payline
 * - Numbers are absolutely positioned to align with payline paths
 * 
 * Positioning Logic:
 * - Uses payline definition (array of row indices) to determine position
 * - Blends start position (70%) with average position (30%) for better alignment
 * - Adds edge padding (12%) to keep numbers within bounds
 * - Offsets overlapping paylines to prevent visual collision
 */

"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { PAYLINE_COLORS } from "./winning-lines-display";
import { usePaylines, useNumRows } from "@/lib/slot-config";

/**
 * Props interface for PaylineNumbers component
 * 
 * @param winningLines - Array of winning line objects with payline indices
 * @param isSpinning - Whether reels are currently spinning
 * @param numPaylines - Number of active paylines (default: 5)
 * @param children - The reel grid content to wrap
 */
interface PaylineNumbersProps {
  winningLines: Array<{
    paylineIndex: number;
    symbol: string;
    count: number;
    payout: number;
    line: number[];
  }>;
  isSpinning: boolean;
  numPaylines?: number;
  children: ReactNode;
}

export function PaylineNumbers({ winningLines, isSpinning, numPaylines = 5, children }: PaylineNumbersProps) {
  // Load configuration values from hooks
  const paylines = usePaylines();
  const numRows = useNumRows();
  
  /**
   * Extract active payline indices from winning lines
   * - Filters out invalid indices (-1 or >= numPaylines)
   * - Gets unique payline indices that have wins
   * - Used to highlight which paylines are currently winning
   */
  const activePaylines = [...new Set(winningLines.map(line => line.paylineIndex).filter(index => index !== -1 && index < numPaylines))];
  
  /**
   * Create array of all payline numbers (1-5)
   * - Always shows all 5 paylines
   * - Active paylines are highlighted with colored backgrounds
   * - Inactive paylines are shown with muted styling
   */
  const paylineNumbers = Array.from({ length: 5 }, (_, i) => i + 1);
  
  /**
   * Convert row index to percentage position for vertical positioning
   * 
   * @param rowIndex - Row index (0 = top, 1 = middle, 2 = bottom)
   * @param edgePadding - Percentage of space to reserve at top/bottom (default: 12%)
   * 
   * Logic:
   * - Row 0 → ~12% from top
   * - Row 1 → ~50% (middle)
   * - Row 2 → ~88% from top
   * 
   * Edge padding prevents numbers from being cut off at screen edges
   */
  const getRowPosition = (rowIndex: number, edgePadding: number = 0.12): string => {
    if (numRows === 1) return '50%';
    // Clamp to valid range [0, numRows - 1]
    const clampedIndex = Math.max(0, Math.min(rowIndex, numRows - 1));
    // Calculate base position (0 to 1)
    const basePosition = clampedIndex / (numRows - 1);
    // Add padding to keep numbers within bounds
    // edgePadding represents the percentage of space to reserve at top and bottom
    // For example, 0.12 = 12% padding means positions range from 12% to 88% instead of 0% to 100%
    const paddedPosition = edgePadding + (basePosition * (1 - (edgePadding * 2)));
    return `${paddedPosition * 100}%`;
  };
  
  /**
   * Calculate the average row position for a payline
   * Used to position numbers closer to the actual payline path
   * 
   * @param payline - Array of row indices for each reel
   * @returns Average row index (can be decimal for blended positioning)
   * 
   * Example: Payline [0, 1, 2, 1, 0] → average = 0.8
   */
  const getAverageRowPosition = (payline: number[]): number => {
    if (payline.length === 0) return 0;
    const sum = payline.reduce((acc, row) => acc + row, 0);
    return sum / payline.length;
  };
  
  /**
   * Group paylines by their start/end positions to handle overlaps
   * 
   * When multiple paylines start/end at the same row, they need offset positioning
   * to prevent visual collision. This grouping identifies which paylines share positions.
   * 
   * - leftGroups: Groups paylines by their starting row (first reel)
   * - rightGroups: Groups paylines by their ending row (last reel)
   */
  const leftGroups = new Map<number, number[]>();
  const rightGroups = new Map<number, number[]>();
  
  paylineNumbers.forEach((number) => {
    const paylineIndex = number - 1;
    const payline = paylines[paylineIndex];
    if (!payline || payline.length === 0) return;
    
    const leftRow = payline[0];
    const rightRow = payline[payline.length - 1];
    
    if (!leftGroups.has(leftRow)) {
      leftGroups.set(leftRow, []);
    }
    leftGroups.get(leftRow)!.push(paylineIndex);
    
    if (!rightGroups.has(rightRow)) {
      rightGroups.set(rightRow, []);
    }
    rightGroups.get(rightRow)!.push(paylineIndex);
  });
  
  // Sort groups by their average position to position numbers more intelligently
  const sortGroupByPosition = (group: number[], isLeft: boolean): number[] => {
    return [...group].sort((a, b) => {
      const paylineA = paylines[a];
      const paylineB = paylines[b];
      if (!paylineA || !paylineB) return 0;
      
      // Use average position of the payline path for better positioning
      const avgA = getAverageRowPosition(paylineA);
      const avgB = getAverageRowPosition(paylineB);
      return avgA - avgB;
    });
  };
  
  /**
   * Calculate offset for paylines that share the same position
   * 
   * When multiple paylines start/end at the same row, they need to be offset
   * vertically to prevent overlapping. This function calculates the offset
   * for each payline in a group.
   * 
   * @param paylineIndex - Index of the payline to calculate offset for
   * @param group - Array of payline indices that share the same position
   * @param isLeft - Whether calculating for left side (true) or right side (false)
   * @param maxOffset - Maximum offset in pixels (default: 40px)
   * @returns Vertical offset in pixels (can be negative or positive)
   * 
   * Spacing:
   * - Each number is 40-56px tall (responsive)
   * - Minimum 30px spacing between numbers
   * - Numbers are centered around the base position
   */
  const getOffset = (paylineIndex: number, group: number[], isLeft: boolean, maxOffset: number = 40): number => {
    const sortedGroup = sortGroupByPosition(group, isLeft);
    const indexInGroup = sortedGroup.indexOf(paylineIndex);
    const totalInGroup = sortedGroup.length;
    
    if (totalInGroup === 1) return 0;
    
    // Calculate spacing based on number of overlapping paylines
    // For 2 paylines: spread 40px apart
    // For 3 paylines: spread 60px apart
    // For 4+ paylines: spread even more
    const totalSpread = maxOffset * Math.max(1, totalInGroup - 1);
    const spacing = totalSpread / Math.max(1, totalInGroup - 1);
    
    // Center the group around the base position
    const centerOffset = -(totalSpread / 2);
    return centerOffset + (indexInGroup * spacing);
  };

  return (
    <div className="flex items-center justify-center w-full h-full relative">
      {/* Left side payline numbers */}
      <div className="absolute left-0 sm:left-1 md:left-2 top-0 bottom-0 w-8 sm:w-9 md:w-10 flex flex-col justify-between items-center z-10">
        {paylineNumbers.map((number) => {
          const paylineIndex = number - 1;
          const isActive = activePaylines.includes(paylineIndex);
          const paylineColor = PAYLINE_COLORS[paylineIndex % PAYLINE_COLORS.length];
          
          // Get the payline definition (array of row indices for each reel)
          const payline = paylines[paylineIndex];
          if (!payline || payline.length === 0) return null;
          
          // Left side position: based on first reel (index 0) of the payline
          // But also consider the average position of the payline path for better alignment
          const leftRowIndex = payline[0];
          const avgRowPosition = getAverageRowPosition(payline);
          // Use a blend of start position and average position (70% start, 30% average)
          // But ensure we don't go below 0 or above numRows-1
          const blendedRowPosition = Math.max(0, Math.min(
            leftRowIndex * 0.7 + avgRowPosition * 0.3,
            numRows - 1
          ));
          const leftPosition = getRowPosition(blendedRowPosition);
          const leftGroup = leftGroups.get(leftRowIndex) || [];
          const leftOffset = getOffset(paylineIndex, leftGroup, true);
          
          // Ensure the final position stays within bounds by clamping the offset
          // The number is now larger (w-10 h-10 = 40px, md:w-14 md:h-14 = 56px), so we need more space
          // With edgePadding of 12%, we have more space, but still clamp offset to be safe
          // Reduce max offset when we're at the edges (row 0 or row 2)
          const isAtEdge = leftRowIndex === 0 || leftRowIndex === numRows - 1;
          const maxOffsetFromEdge = isAtEdge ? 30 : 40; // Less offset at edges, more in middle
          const clampedLeftOffset = Math.max(-maxOffsetFromEdge, Math.min(leftOffset, maxOffsetFromEdge));
          
          return (
            <div
              key={`left-${number}`}
              className={cn(
                "w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-base sm:text-lg md:text-xl font-bold transition-all duration-300 absolute",
                isActive ? "text-white shadow-lg animate-pulse" : paylineIndex < numPaylines ? "bg-black/50 text-muted-foreground border-2 border-primary/30" : "bg-black/20 text-muted-foreground/50 border-2 border-primary/10 opacity-50"
              )}
              style={{
                ...(isActive ? {
                  backgroundColor: paylineColor,
                  boxShadow: `0 0 15px ${paylineColor}50, 0 0 30px ${paylineColor}30`
                } : {}),
                top: leftPosition,
                transform: `translateY(calc(-50% + ${clampedLeftOffset}px))`
              }}
            >
              {number}
            </div>
          );
        })}
      </div>

      {/* Grid content */}
      <div className="flex-1 w-full h-full">
        {children}
      </div>

      {/* Right side payline numbers */}
      <div className="absolute right-0 sm:right-1 md:right-2 top-0 bottom-0 w-8 sm:w-9 md:w-10 flex flex-col justify-between items-center z-10">
        {paylineNumbers.map((number) => {
          const paylineIndex = number - 1;
          const isActive = activePaylines.includes(paylineIndex);
          const paylineColor = PAYLINE_COLORS[paylineIndex % PAYLINE_COLORS.length];
          
          // Get the payline definition (array of row indices for each reel)
          const payline = paylines[paylineIndex];
          if (!payline || payline.length === 0) return null;
          
          // Right side position: based on last reel of the payline
          // But also consider the average position of the payline path for better alignment
          const rightRowIndex = payline[payline.length - 1];
          const avgRowPosition = getAverageRowPosition(payline);
          // Use a blend of end position and average position (70% end, 30% average)
          // But ensure we don't go below 0 or above numRows-1
          const blendedRowPosition = Math.max(0, Math.min(
            rightRowIndex * 0.7 + avgRowPosition * 0.3,
            numRows - 1
          ));
          const rightPosition = getRowPosition(blendedRowPosition);
          const rightGroup = rightGroups.get(rightRowIndex) || [];
          const rightOffset = getOffset(paylineIndex, rightGroup, false);
          
          // Ensure the final position stays within bounds by clamping the offset
          // The number is now larger (w-10 h-10 = 40px, md:w-14 md:h-14 = 56px), so we need more space
          // Reduce max offset when we're at the edges (row 0 or row 2)
          const isAtEdge = rightRowIndex === 0 || rightRowIndex === numRows - 1;
          const maxOffsetFromEdge = isAtEdge ? 30 : 40; // Less offset at edges, more in middle
          const clampedRightOffset = Math.max(-maxOffsetFromEdge, Math.min(rightOffset, maxOffsetFromEdge));
          
          return (
            <div
              key={`right-${number}`}
              className={cn(
                "w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-base sm:text-lg md:text-xl font-bold transition-all duration-300 absolute",
                isActive ? "text-white shadow-lg animate-pulse" : paylineIndex < numPaylines ? "bg-black/50 text-muted-foreground border-2 border-primary/30" : "bg-black/20 text-muted-foreground/50 border-2 border-primary/10 opacity-50"
              )}
              style={{
                ...(isActive ? {
                  backgroundColor: paylineColor,
                  boxShadow: `0 0 15px ${paylineColor}50, 0 0 30px ${paylineColor}30`
                } : {}),
                top: rightPosition,
                transform: `translateY(calc(-50% + ${clampedRightOffset}px))`
              }}
            >
              {number}
            </div>
          );
        })}
      </div>
    </div>
  );
}

