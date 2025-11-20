/**
 * FeatureSymbolSelection Component
 * 
 * This component displays an animated symbol selection screen when free spins are triggered.
 * It shows a spinning animation that cycles through eligible symbols, then reveals the selected
 * expanding symbol for the free spins feature.
 * 
 * Features:
 * - Symbol spinning animation (cycles through all eligible symbols)
 * - 50 spins before stopping on selected symbol
 * - Reveal animation (scale-in and pulse-glow)
 * - Free spins count display
 * - Full-screen overlay with golden theme
 * 
 * Animation Flow:
 * 1. Component opens → symbols start spinning (50 spins)
 * 2. Symbols cycle through all eligible symbols (excluding Scatter)
 * 3. Animation stops on selected symbol
 * 4. Brief pause → reveal animation plays
 * 5. Symbol displayed for 3 seconds → onComplete callback
 * 
 * Eligible Symbols:
 * - All symbols except Scatter (9 symbols total)
 * - Scatter cannot be the expanding symbol
 */

"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useGameConfig } from '@/hooks/use-game-config';

/**
 * Props interface for FeatureSymbolSelection component
 * 
 * @param isOpen - Whether the selection screen is visible
 * @param onComplete - Callback when selection animation completes
 * @param selectedSymbol - The symbol that was selected as the expanding symbol
 * @param freeSpinsCount - Number of free spins awarded
 */
interface FeatureSymbolSelectionProps {
  isOpen: boolean;
  onComplete: () => void;
  selectedSymbol: string;
  freeSpinsCount: number;
}

export function FeatureSymbolSelection({
  isOpen,
  onComplete,
  selectedSymbol,
  freeSpinsCount,
}: FeatureSymbolSelectionProps) {
  const { config } = useGameConfig();
  const [showAnimation, setShowAnimation] = useState(false);
  const [showSymbol, setShowSymbol] = useState(false);
  const [spinningSymbols, setSpinningSymbols] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && config) {
      // Get all eligible symbols (excluding only Scatter - all other 9 symbols are eligible)
      const eligibleSymbols = Object.keys(config.symbols).filter(
        s => s !== 'Scatter'
      );
      
      // Start animation
      setShowAnimation(true);
      setShowSymbol(false);
      
      // Cycle through all symbols in order, then stop on selected symbol
      let currentIndex = 0;
      let spinCount = 0;
      const totalSpins = 50; // Increased spins for longer animation
      const selectedSymbolIndex = eligibleSymbols.indexOf(selectedSymbol);
      
      const spinInterval = setInterval(() => {
        // Cycle through all eligible symbols in order
        const currentSymbol = eligibleSymbols[currentIndex % eligibleSymbols.length];
        setSpinningSymbols([currentSymbol]); // Show only one icon
        currentIndex++;
        spinCount++;
        
        // Stop when we've done enough spins
        if (spinCount >= totalSpins) {
          clearInterval(spinInterval);
          
          // Stop cycling and show the selected symbol
          setSpinningSymbols([selectedSymbol]);
          
          // Brief pause to show the selected symbol stopped, then reveal with animation
          setTimeout(() => {
            setShowAnimation(false); // Stop the spinning animation
            setShowSymbol(true); // This triggers the scale-in and pulse-glow animations
            setTimeout(() => {
              onComplete();
            }, 3000); // Display time after selection animation
          }, 500);
        }
      }, 80); // Faster interval for smoother animation (80ms per symbol)
      
      return () => clearInterval(spinInterval);
    }
  }, [isOpen, selectedSymbol, config, onComplete]);

  if (!isOpen || !config) return null;

  const getSymbolImage = (symbol: string) => {
    const symbolConfig = config.symbols[symbol as keyof typeof config.symbols];
    return symbolConfig?.image || `/images/symbols/${symbol}.png`;
  };

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ transform: 'translateY(50px)' }}>
      <div 
        className="relative flex flex-col items-center justify-center p-6 sm:p-8 md:p-10 rounded-2xl border-4 border-yellow-400 shadow-2xl max-w-4xl w-full mx-4"
        style={{
          backgroundImage: 'url(/images/backround/bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <h2 className="text-4xl sm:text-5xl font-bold text-yellow-200 mb-6 uppercase tracking-wider text-center">
          Penny Spins!
        </h2>
        <p className="text-2xl sm:text-3xl text-yellow-100 mb-8 text-center">
          {freeSpinsCount} Penny Spins Awarded
        </p>
        
        <div className="mb-6">
          <p className="text-xl sm:text-2xl text-yellow-200 mb-6 text-center">
            Selecting Feature Symbol...
          </p>
          
          {showAnimation && !showSymbol && spinningSymbols.length > 0 && (
            <div className="flex items-center justify-center">
              {spinningSymbols.map((symbol, index) => (
                <div
                  key={index}
                  className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-white/20 rounded-lg border-4 border-yellow-400 flex items-center justify-center animate-pulse shadow-2xl transition-all duration-80"
                >
                  {symbol && (
                    <Image
                      src={getSymbolImage(symbol)}
                      alt={symbol}
                      width={200}
                      height={200}
                      className="object-contain"
                      unoptimized
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Show selected symbol when stopped but before reveal animation */}
          {!showAnimation && !showSymbol && spinningSymbols.length > 0 && (
            <div className="flex items-center justify-center">
              {spinningSymbols.map((symbol, index) => (
                <div
                  key={index}
                  className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-white/20 rounded-lg border-4 border-yellow-400 flex items-center justify-center shadow-2xl"
                >
                  {symbol && (
                    <Image
                      src={getSymbolImage(symbol)}
                      alt={symbol}
                      width={200}
                      height={200}
                      className="object-contain"
                      unoptimized
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          
          {showSymbol && (
            <div className="flex flex-col items-center justify-center">
              <p className="text-2xl sm:text-3xl text-yellow-200 mb-6 text-center animate-fade-in">
                Feature Symbol Selected:
              </p>
              <div className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-white/30 rounded-lg border-4 border-yellow-400 flex items-center justify-center shadow-2xl animate-scale-in animate-pulse-glow">
                <Image
                  src={getSymbolImage(selectedSymbol)}
                  alt={selectedSymbol}
                  width={200}
                  height={200}
                  className="object-contain"
                  unoptimized
                />
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-yellow-200 mt-6 uppercase animate-fade-in">
                {selectedSymbol}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

