/**
 * WinningLinesDisplay Component
 * 
 * This component overlays colored lines on the reel grid to highlight winning paylines.
 * It uses SVG paths to draw lines connecting winning symbols across the reels.
 * 
 * Features:
 * - Draws colored lines for each winning payline
 * - Uses different colors for different paylines (from PAYLINE_COLORS)
 * - Responsive SVG rendering (desktop, tablet, mobile)
 * - Glow effects on lines for visual emphasis
 * - Positioned absolutely over the reel grid
 * 
 * Layout:
 * - SVG overlay positioned absolutely over reel grid
 * - ViewBox calculated based on symbol sizes and grid dimensions
 * - Lines drawn using SVG path elements (M = move, L = line)
 * 
 * Responsive:
 * - Desktop (md+): Larger stroke width (5px), stronger glow
 * - Tablet (sm): Medium stroke width (4px), medium glow
 * - Mobile (xs): Smaller stroke width (3px), subtle glow
 */

import type { WinningLine } from "@/lib/slot-config";
import { usePaylines, useNumReels, useNumRows } from "@/lib/slot-config";

/**
 * Color palette for payline highlighting
 * Each payline gets a unique color from this array
 * Colors cycle if there are more paylines than colors
 * 
 * Special: '#FFFF00' (yellow) is reserved for scatter highlights
 */
export const PAYLINE_COLORS = [
  '#FF3366', '#33FF66', '#3366FF', '#FFCC33', '#33CCFF',
  '#FF33CC', '#CCFF33', '#6633FF', '#FF6633', '#33FFCC',
  '#FFFF00' // Special color for scatter highlight
];

/**
 * Props interface for WinningLinesDisplay component
 * 
 * @param winningLines - Array of winning line objects containing payline indices and paths
 */
interface WinningLinesDisplayProps {
  winningLines: WinningLine[];
}

/**
 * Fixed sizes for 1296px vertical cabinet layout
 * 
 * These constants define the symbol and grid dimensions for SVG coordinate calculation.
 * All breakpoints use the same values since we have a fixed layout.
 */
const SYMBOL_WIDTH_MD = 196; // Fixed size for 1296px layout
const SYMBOL_HEIGHT_MD = 196; // Fixed size for 1296px layout
const GAP_MD = 4; // gap-1 (reduced from gap-4 to make borders visible)
const PADDING_MD = 16; // p-4

const SYMBOL_WIDTH_SM = 196; // Same for all breakpoints in fixed layout
const SYMBOL_HEIGHT_SM = 196;
const GAP_SM = 4; // gap-1 (reduced from gap-4 to make borders visible)
const PADDING_SM = 16;

const SYMBOL_WIDTH_XS = 196; // Same for all breakpoints in fixed layout
const SYMBOL_HEIGHT_XS = 196;
const GAP_XS = 4; // gap-1 (reduced from gap-4 to make borders visible)
const PADDING_XS = 16;

/**
 * Calculate SVG coordinates for a specific cell (reel, row) position
 * 
 * @param reel - Reel index (0-4 for 5 reels)
 * @param row - Row index (0-2 for 3 rows)
 * @param screen - Screen size breakpoint ('xs', 'sm', 'md')
 * @returns Object with x and y coordinates in SVG space
 * 
 * Formula:
 * - x = padding + (reel × (symbolWidth + gap)) + (symbolWidth / 2)
 * - y = padding + (row × (symbolHeight + gap)) + (symbolHeight / 2)
 * 
 * Returns center point of the cell for line drawing
 */
const getPointForCell = (reel: number, row: number, screen: 'xs' | 'sm' | 'md') => {
  let symbolWidth, symbolHeight, gap, padding;

  switch(screen) {
    case 'xs':
        symbolWidth = SYMBOL_WIDTH_XS;
        symbolHeight = SYMBOL_HEIGHT_XS;
        gap = GAP_XS;
        padding = PADDING_XS;
        break;
    case 'sm':
        symbolWidth = SYMBOL_WIDTH_SM;
        symbolHeight = SYMBOL_HEIGHT_SM;
        gap = GAP_SM;
        padding = PADDING_SM;
        break;
    case 'md':
    default:
        symbolWidth = SYMBOL_WIDTH_MD;
        symbolHeight = SYMBOL_HEIGHT_MD;
        gap = GAP_MD;
        padding = PADDING_MD;
        break;
  }

  const x = padding + (reel * (symbolWidth + gap)) + (symbolWidth / 2);
  const y = padding + (row * (symbolHeight + gap)) + (symbolHeight / 2);
  return { x, y };
};

/**
 * Generate SVG path string for a payline
 * 
 * @param line - Array of row indices for each reel (e.g., [0, 1, 2, 1, 0])
 * @param screen - Screen size breakpoint ('xs', 'sm', 'md')
 * @returns SVG path string (e.g., "M100,50 L200,100 L300,150...")
 * 
 * Path format:
 * - M = Move to (first point)
 * - L = Line to (subsequent points)
 * - Connects center points of each symbol in the payline
 */
const getPathForLine = (line: number[], screen: 'xs' | 'sm' | 'md') => {
  // Draw lines across the entire grid (all reels)
  // Maps each reel's row index to SVG coordinates
  const points = line
    .map((row, reel) => getPointForCell(reel, row, screen));
  
  if (points.length === 0) return '';
  
  // Generate path: M for first point, L for subsequent points
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
};

/**
 * Calculate SVG viewBox dimensions
 * 
 * @param screen - Screen size breakpoint ('xs', 'sm', 'md')
 * @param numReels - Number of reels (5)
 * @param numRows - Number of rows (3)
 * @returns ViewBox string (e.g., "0 0 1000 600")
 * 
 * ViewBox defines the coordinate system for the SVG
 * Formula: width = (symbolWidth × numReels) + (gap × (numReels - 1)) + (padding × 2)
 */
const getViewBox = (screen: 'xs' | 'sm' | 'md', numReels: number, numRows: number) => {
    let symbolWidth, symbolHeight, gap, padding;

    switch(screen) {
        case 'xs':
            symbolWidth = SYMBOL_WIDTH_XS;
            symbolHeight = SYMBOL_HEIGHT_XS;
            gap = GAP_XS;
            padding = PADDING_XS;
            break;
        case 'sm':
            symbolWidth = SYMBOL_WIDTH_SM;
            symbolHeight = SYMBOL_HEIGHT_SM;
            gap = GAP_SM;
            padding = PADDING_SM;
            break;
        case 'md':
        default:
            symbolWidth = SYMBOL_WIDTH_MD;
            symbolHeight = SYMBOL_HEIGHT_MD;
            gap = GAP_MD;
            padding = PADDING_MD;
            break;
    }
    const width = symbolWidth * numReels + gap * (numReels - 1) + padding * 2;
    const height = symbolHeight * numRows + gap * (numRows - 1) + padding * 2;
    return `0 0 ${width} ${height}`;
}




export function WinningLinesDisplay({ winningLines }: WinningLinesDisplayProps) {
  // Load configuration values from hooks
  const paylines = usePaylines();
  const numReels = useNumReels();
  const numRows = useNumRows();

  return (
    <>
      {/* 
        Desktop SVG (md and above)
        - Larger stroke width (5px) for better visibility
        - Stronger glow effect (5px blur)
        - Hidden on smaller screens
      */}
      <svg
        className="absolute inset-0 pointer-events-none hidden md:block"
        viewBox={getViewBox('md', numReels, numRows)}
        preserveAspectRatio="xMidYMid meet"
      >
        {winningLines.map((line) => {
          // Validate payline index
          if (line.paylineIndex < 0 || line.paylineIndex >= paylines.length) return null;
          
          // Generate SVG path for this payline
          const path = getPathForLine(paylines[line.paylineIndex], 'md');
          if (!path) return null; // Skip if no path (all points filtered out)
          
          // Get color for this payline (cycles through PAYLINE_COLORS array)
          const lineColor = PAYLINE_COLORS[line.paylineIndex % PAYLINE_COLORS.length];
          
          return (
            <path
              key={line.paylineIndex}
              d={path}
              stroke={lineColor}
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                  filter: `drop-shadow(0 0 5px ${lineColor})`,
              }}
            />
          );
        })}
      </svg>
      
      {/* 
        Tablet SVG (sm to md)
        - Medium stroke width (4px)
        - Medium glow effect (3px blur)
        - Hidden on mobile and desktop
      */}
       <svg
        className="absolute inset-0 pointer-events-none hidden sm:block md:hidden"
        viewBox={getViewBox('sm', numReels, numRows)}
        preserveAspectRatio="xMidYMid meet"
      >
        {winningLines.map((line) => {
          if (line.paylineIndex < 0 || line.paylineIndex >= paylines.length) return null;
          const path = getPathForLine(paylines[line.paylineIndex], 'sm');
          if (!path) return null;
          const lineColor = PAYLINE_COLORS[line.paylineIndex % PAYLINE_COLORS.length];
          return (
            <path
              key={line.paylineIndex}
              d={path}
              stroke={lineColor}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                  filter: `drop-shadow(0 0 3px ${lineColor})`,
              }}
            />
          );
        })}
      </svg>
      
      {/* 
        Mobile SVG (xs only)
        - Smaller stroke width (3px) for mobile screens
        - Subtle glow effect (2px blur)
        - Hidden on larger screens
      */}
       <svg
        className="absolute inset-0 pointer-events-none sm:hidden"
        viewBox={getViewBox('xs', numReels, numRows)}
        preserveAspectRatio="xMidYMid meet"
      >
        {winningLines.map((line) => {
          if (line.paylineIndex < 0 || line.paylineIndex >= paylines.length) return null;
          const path = getPathForLine(paylines[line.paylineIndex], 'xs');
          if (!path) return null;
          const lineColor = PAYLINE_COLORS[line.paylineIndex % PAYLINE_COLORS.length];
          return (
            <path
              key={line.paylineIndex}
              d={path}
              stroke={lineColor}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                  filter: `drop-shadow(0 0 2px ${lineColor})`,
              }}
            />
          );
        })}
      </svg>
    </>
  );
}
