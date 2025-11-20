/**
 * ImageSequenceAnimation Component
 * 
 * This component plays frame-by-frame animations for winning symbols.
 * It loads and displays a sequence of images from the /animations/{symbol}/ folder.
 * 
 * Features:
 * - Frame-by-frame animation (72 frames per symbol)
 * - Smooth 60fps playback using requestAnimationFrame
 * - Looping animation while isPlaying is true
 * - Configurable duration (default: 3 seconds per loop)
 * - Symbol ID to folder name mapping
 * - Optimized frame updates (only updates when frame changes)
 * 
 * Animation Details:
 * - Total frames: 72 per symbol
 * - Frame format: {symbol}_{frameNumber}.webp (e.g., "Queen_1.webp")
 * - Path: /animations/{folderName}/{symbol}_{frame}.webp
 * - Loops continuously while isPlaying is true
 * 
 * Performance:
 * - Uses requestAnimationFrame for smooth 60fps playback
 * - Only updates state when frame number changes
 * - Prevents unnecessary re-renders
 * - Returns null when not playing to save resources
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

/**
 * Props interface for ImageSequenceAnimation component
 * 
 * @param symbolId - The ID of the symbol to animate (e.g., "Queen", "Scatter")
 * @param isPlaying - Whether the animation should play (loops while true)
 * @param duration - Duration in seconds for one complete cycle (default: 3)
 * @param className - Additional CSS classes to apply
 */
interface ImageSequenceAnimationProps {
  symbolId: string;
  isPlaying: boolean;
  duration?: number; // Duration in seconds for one complete cycle
  className?: string;
}

export function ImageSequenceAnimation({ 
  symbolId, 
  isPlaying, 
  duration = 3, 
  className 
}: ImageSequenceAnimationProps) {
  // State for current frame being displayed (1-72)
  const [currentFrame, setCurrentFrame] = useState(1);
  
  // State for animation lifecycle
  const [isAnimating, setIsAnimating] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  // Refs for animation control
  const animationRef = useRef<number>(); // requestAnimationFrame ID
  const startTimeRef = useRef<number>(); // Animation start timestamp
  const lastFrameRef = useRef<number>(0); // Last displayed frame (for optimization)
  
  // Total number of frames in the animation sequence
  const totalFrames = 72;
  
  /**
   * Animation loop function
   * 
   * Calculates which frame to display based on elapsed time and duration.
   * Uses modulo to loop the animation continuously.
   * 
   * @param currentTime - Current timestamp from requestAnimationFrame
   * 
   * Frame calculation:
   * - elapsed = time since animation started (in seconds)
   * - progress = (elapsed / duration) % 1 (loops 0-1)
   * - frame = progress × totalFrames (0-71)
   * - adjustedFrame = frame + 1 (1-72, clamped)
   */
  const animate = useCallback((currentTime: number) => {
    if (!startTimeRef.current || !isPlaying) return;
    
    const elapsed = (currentTime - startTimeRef.current) / 1000;
    const progress = (elapsed / duration) % 1;
    const frame = Math.floor(progress * totalFrames);
    const adjustedFrame = Math.max(1, Math.min(frame + 1, totalFrames));
    
    // Only update if frame actually changed to prevent unnecessary re-renders
    if (adjustedFrame !== lastFrameRef.current) {
      setCurrentFrame(adjustedFrame);
      lastFrameRef.current = adjustedFrame;
    }
    
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [duration, isPlaying]);
  
  useEffect(() => {
    if (isPlaying && !isAnimating) {
      setIsAnimating(true);
      setIsReady(false);
      setCurrentFrame(1);
      lastFrameRef.current = 1;
      
      // Small delay to ensure smooth start
      const timeoutId = setTimeout(() => {
        startTimeRef.current = performance.now();
        setIsReady(true);
        animationRef.current = requestAnimationFrame(animate);
      }, 16); // One frame delay
      
      return () => {
        clearTimeout(timeoutId);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    } else if (!isPlaying && isAnimating) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setIsAnimating(false);
      setIsReady(false);
      setCurrentFrame(0);
      lastFrameRef.current = 0;
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]); // Only depend on isPlaying to prevent infinite loops
  
  /**
   * Generate the image path for a specific frame
   * 
   * @param frame - Frame number (1-72)
   * @returns Path to the frame image (e.g., "/animations/Queen/Queen_1.webp")
   * 
   * Path format: /animations/{folderName}/{symbol}_{frameNumber}.webp
   */
  const getImagePath = (frame: number) => {
    // Clamp frame number to valid range (1-72)
    const frameNumber = Math.max(1, Math.min(frame, totalFrames));
    
    /**
     * Map symbol IDs to their correct folder names
     * 
     * Some symbols have different IDs in code vs folder names.
     * This function ensures we load from the correct folder.
     * 
     * @param id - Symbol ID from config
     * @returns Folder name for animation images
     */
    const getFolderName = (id: string) => {
      const folderMap: Record<string, string> = {
        // Inferno Empress symbols
        'Scatter': 'Scatter',
        'Coin': 'Coin',
        'Crown': 'Crown',
        'Crystals': 'Crystals',
        'Dagger': 'Dagger',
        'Dragon': 'Dragon',
        'Feather': 'Feather',
        'Orb': 'Orb',
        'Ring': 'Ring',
        'Bottle': 'Bottle',
        // Legacy mappings for backwards compatibility
        'SCATTER': 'Scatter',
        'COIN': 'Coin',
        'CROWN': 'Crown',
        'CRYSTALS': 'Crystals',
        'CRYSTAL': 'Crystals',
        'DAGGER': 'Dagger',
        'DRAGON': 'Dragon',
        'FEATHER': 'Feather',
        'ORB': 'Orb',
        'RING': 'Ring',
        'BOTTLE': 'Bottle',
        'BOOK': 'Scatter',
      };
      return folderMap[id] || id;
    };
    
    const folderName = getFolderName(symbolId);
    return `/animations/${folderName}/${folderName}_${frameNumber}.webp`;
  };
  
  if (!isPlaying || !isAnimating || !isReady) {
    return null;
  }
  
  return (
    <div className={`absolute inset-0 z-20 ${className}`}>
        <Image
          key={`${symbolId}-${currentFrame}`}
          src={getImagePath(currentFrame)}
          alt={`${symbolId} animation frame ${currentFrame}`}
          fill
          className="object-cover"
          unoptimized
          priority
          quality={90}
        />
    </div>
  );
}

