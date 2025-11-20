/**
 * WinAnimation Component
 * 
 * This component displays win celebration animations when a player wins.
 * It shows confetti-like coin animations and a count-up display of the win amount.
 * 
 * Features:
 * - Coin confetti animation (50 coins falling from top)
 * - Count-up animation for win amount (4 second duration)
 * - Dynamic win messages based on win amount
 * - Fade-in and scale animations
 * - Fixed overlay covering entire screen
 * 
 * Animation Flow:
 * 1. Component mounts → coins start falling
 * 2. Win amount counts up from 0 to target (4 seconds)
 * 3. Display shown for 5 seconds total
 * 4. Fade out → onAnimationComplete callback
 * 
 * Win Messages:
 * - Based on win amount thresholds
 * - Ranges from "Congratulations!" to "MEGA WIN!"
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Coins } from 'lucide-react';

/**
 * Props interface for WinAnimation component
 * 
 * @param feedback - Object containing win feedback information
 *   - feedbackText: Message to display (e.g., "Congratulations!", "MEGA WIN!")
 *   - winAmount: Total win amount to count up to
 *   - animationType: Type of animation (e.g., "coins")
 * @param onAnimationComplete - Callback when animation finishes
 * @param onCountComplete - Optional callback when count-up completes
 */
interface WinAnimationProps {
  feedback: {
    feedbackText: string;
    winAmount: number;
    animationType?: string;
  };
  onAnimationComplete: () => void;
  onCountComplete?: (amount: number) => void;
}

/**
 * Coin Component
 * 
 * Individual coin in the confetti animation
 * 
 * @param id - Unique identifier for this coin
 * @param onEnded - Callback when coin animation completes
 * 
 * Behavior:
 * - Random horizontal position (0-100%)
 * - Random animation duration (3-5 seconds)
 * - Random delay (0-2 seconds)
 * - Rotates 720 degrees while falling
 * - Fades out as it falls
 */
const Coin = ({ id, onEnded }: { id: number; onEnded: (id: number) => void }) => {
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    setStyle({
      left: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 2 + 3}s`,
      animationDelay: `${Math.random() * 2}s`,
    });

    const timer = setTimeout(() => onEnded(id), 5000); // Duration + Delay
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only depend on id, not onEnded to prevent infinite loops

  return (
    <div
      style={style}
      className="absolute top-[-10%] text-yellow-400 animate-fall"
    >
      <Coins className="w-8 h-8 md:w-12 md:h-12 drop-shadow-lg" style={{ transform: `rotate(${Math.random() * 360}deg)`}}/>
    </div>
  );
};

/**
 * Generate win message based on win amount
 * 
 * @param winAmount - The total win amount
 * @returns Appropriate celebration message
 * 
 * Message thresholds:
 * - ≤ R5: "Congratulations!"
 * - ≤ R10: "Well done!"
 * - ≤ R15: "Nice win!"
 * - ≤ R25: "Great job!"
 * - ≤ R50: "Excellent!"
 * - ≤ R100: "Outstanding!"
 * - ≤ R200: "Incredible!"
 * - ≤ R300: "Amazing!"
 * - > R300: "MEGA WIN!"
 */
const getWinMessage = (winAmount: number): string => {
  if (winAmount <= 5) {
    return 'Congratulations!';
  } else if (winAmount <= 10) {
    return 'Well done!';
  } else if (winAmount <= 15) {
    return 'Nice win!';
  } else if (winAmount <= 25) {
    return 'Great job!';
  } else if (winAmount <= 50) {
    return 'Excellent!';
  } else if (winAmount <= 100) {
    return 'Outstanding!';
  } else if (winAmount <= 200) {
    return 'Incredible!';
  } else if (winAmount <= 300) {
    return 'Amazing!';
  } else {
    return 'MEGA WIN!';
  }
};

export function WinAnimation({ feedback, onAnimationComplete, onCountComplete }: WinAnimationProps) {
  // State for coin confetti animation
  const [coins, setCoins] = useState<number[]>([]);
  
  // State for fade in/out animation
  const [show, setShow] = useState(false);
  
  // State for count-up animation (displays current amount being counted)
  const [displayAmount, setDisplayAmount] = useState(0);

  useEffect(() => {
    // Reset all state when feedback changes (new win)
    setShow(false);
    setDisplayAmount(0);
    setCoins([]);
    
    // Delay showing animation by 500ms for smoother transition
    const showTimer = setTimeout(() => setShow(true), 500);

    /**
     * Initialize coin confetti animation
     * Creates 50 coin elements that will fall from the top
     */
    if (feedback.animationType?.includes('coin') || !feedback.animationType) {
      const newCoins = Array.from({ length: 50 }, (_, i) => i);
      setCoins(newCoins);
    }

    /**
     * Count-up animation for win amount
     * Uses requestAnimationFrame for smooth 60fps counting
     * 
     * Animation details:
     * - Duration: 4 seconds (fixed for all wins)
     * - Easing: Ease-out cubic (starts fast, slows at end)
     * - Updates displayAmount continuously from 0 to targetAmount
     */
    const targetAmount = feedback.winAmount;
    const duration = 4000; // 4 seconds for all wins - slow and satisfying
    const startTime = performance.now();
    let animationFrameId: number | undefined;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic for more natural counting (starts fast, slows at end)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentAmount = targetAmount * easeProgress;
      
      setDisplayAmount(currentAmount);

      if (progress < 1) {
        // Continue animation until complete
        animationFrameId = requestAnimationFrame(animate);
      } else {
        // Animation complete - set final amount
        setDisplayAmount(targetAmount);
        // Notify when counting is complete
        if (onCountComplete) {
          onCountComplete(targetAmount);
        }
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    /**
     * Total animation duration: 5 seconds
     * - 4 seconds: Count-up animation
     * - 1 second: Display at final amount
     * - 500ms: Fade out
     * Then calls onAnimationComplete callback
     */
    const totalDuration = duration + 1000; // Add 1 second for fade out (5 seconds total)
    const animationTimer = setTimeout(() => {
        setShow(false);
        setTimeout(() => {
          onAnimationComplete();
        }, 500);
    }, totalDuration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(animationTimer);
      if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId);
      }
    }
    // Only depend on feedback.winAmount to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback.winAmount, feedback.feedbackText, feedback.animationType]);
  
  const handleCoinEnd = useCallback((id: number) => {
    setCoins(prev => prev.filter(cId => cId !== id));
  }, []);

  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0'} pointer-events-none`}>
      <div className="absolute inset-0 overflow-hidden">
        {(feedback.animationType?.includes('coin') || !feedback.animationType) && coins.map(id => <Coin key={id} id={id} onEnded={handleCoinEnd} />)}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-black/70 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-2xl border-2 border-yellow-400 max-w-[90%] sm:max-w-lg text-center animate-fade-in-scale">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-headline text-yellow-400 drop-shadow-lg leading-tight mb-2">
                {feedback.feedbackText}
            </h2>
            {feedback.winAmount > 0 && (
              <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-yellow-400 drop-shadow-lg">
                  R {displayAmount.toFixed(2)}
              </p>
            )}
        </div>
      </div>
       <style jsx>{`
        @keyframes fall {
          from {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          to {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation-name: fall;
          animation-timing-function: linear;
        }
        @keyframes fade-in-scale {
            0% {
                opacity: 0;
                transform: scale(0.5);
            }
            100% {
                opacity: 1;
                transform: scale(1);
            }
        }
        .animate-fade-in-scale {
            animation: fade-in-scale 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
      `}</style>
    </div>
  );
}

/**
 * Helper function to generate win feedback object
 * 
 * @param winAmount - Total win amount
 * @param winningSymbols - Array of winning symbol IDs (currently unused)
 * @param betAmount - Bet amount (currently unused)
 * @returns Object with feedback text, win amount, and animation type
 * 
 * This function creates the feedback object used by WinAnimation component.
 * Can be extended to customize feedback based on winning symbols or bet amount.
 */
export function getWinningFeedback(winAmount: number, winningSymbols: string[] = [], betAmount: number = 0): {
  feedbackText: string;
  winAmount: number;
  animationType: string;
} {
  const feedbackText = getWinMessage(winAmount);
  const animationType = 'coins'; // Can be extended to support other types (e.g., 'sparks', 'fireworks')
  
  return {
    feedbackText,
    winAmount,
    animationType
  };
}

