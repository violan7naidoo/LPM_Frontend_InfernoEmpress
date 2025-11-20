/**
 * MiddleSection Component
 * 
 * This component displays an animated sequence of 121 images in the middle section of the game.
 * The animation loops continuously at 24 FPS.
 * The paytable has been moved to TopSection.
 * Can also display the Action Wheel when action games are triggered.
 * Can also display the Feature Symbol Selection when free spins are triggered.
 */

'use client';

import { useRef, useEffect, useState } from 'react';
import { ActionWheel, ActionWheelHandle } from './action-wheel';
import { FeatureSymbolSelection } from './feature-symbol-selection';

/**
 * Props interface for MiddleSection component
 */
interface MiddleSectionProps {
  betAmount?: number;
  isFreeSpinsMode?: boolean;
  featureSymbol?: string;
  showActionWheel?: boolean;
  actionGameSpins?: number;
  accumulatedActionWin?: number;
  onActionWheelSpin?: () => Promise<{ result: string; win: number; additionalSpins: number }>;
  onActionWheelComplete?: () => void;
  onActionWheelSpinTriggerReady?: (trigger: () => void) => void;
  onActionWheelWin?: (winAmount: number, result: string, additionalSpins: number, remainingSpins: number) => void;
  showFeatureSymbolSelection?: boolean;
  selectedFeatureSymbol?: string;
  freeSpinsCount?: number;
  onFeatureSymbolSelectionComplete?: () => void;
}

/**
 * MiddleSection - Main Component
 * 
 * Displays the main image from public/middle-section/main.png
 * Or displays the Action Wheel when showActionWheel is true
 */
export function MiddleSection({
  showActionWheel = false,
  actionGameSpins = 0,
  accumulatedActionWin = 0,
  onActionWheelSpin,
  onActionWheelComplete,
  onActionWheelSpinTriggerReady,
  onActionWheelWin,
  showFeatureSymbolSelection = false,
  selectedFeatureSymbol = '',
  freeSpinsCount = 0,
  onFeatureSymbolSelectionComplete,
}: MiddleSectionProps) {
  const actionWheelRef = useRef<ActionWheelHandle>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const animationFrameRef = useRef<number>();
  const currentFrameRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  const totalFrames = 121;
  const fps = 24;
  const frameInterval = 1000 / fps; // ~41.67ms per frame

  // Preload all 121 images
  useEffect(() => {
    if (showFeatureSymbolSelection || showActionWheel) return;
    
    const loadImages = async () => {
      const imagePromises: Promise<HTMLImageElement>[] = [];
      
      for (let i = 1; i <= totalFrames; i++) {
        const img = new Image();
        const promise = new Promise<HTMLImageElement>((resolve, reject) => {
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = `/idle/idle_${i}.webp`;
        });
        imagePromises.push(promise);
      }
      
      try {
        const loadedImages = await Promise.all(imagePromises);
        imagesRef.current = loadedImages;
        setImagesLoaded(true);
      } catch (error) {
        console.error('Error loading idle animation images:', error);
      }
    };
    
    loadImages();
  }, [showFeatureSymbolSelection, showActionWheel]);

  // Animation loop
  useEffect(() => {
    if (!imagesLoaded || showFeatureSymbolSelection || showActionWheel) return;
    
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d', { 
      alpha: true,
      desynchronized: true,
      willReadFrequently: false
    });
    if (!ctx) return;
    
    // Optimize canvas rendering settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Set canvas size to match container with device pixel ratio for crisp rendering
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Animation function
    const animate = (currentTime: number) => {
      if (!imagesLoaded || imagesRef.current.length === 0) return;
      
      // Initialize lastFrameTime on first frame
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = currentTime;
      }
      
      // Calculate elapsed time since last frame
      const elapsed = currentTime - lastFrameTimeRef.current;
      
      // Advance frame if enough time has passed
      if (elapsed >= frameInterval) {
        currentFrameRef.current = (currentFrameRef.current + 1) % totalFrames;
        lastFrameTimeRef.current = currentTime;
        
        // Draw current frame
        const currentImage = imagesRef.current[currentFrameRef.current];
        if (currentImage && currentImage.complete) {
          // Calculate scaling
          const scaleFactor = 0.95;
          const imgAspect = currentImage.width / currentImage.height;
          const canvasAspect = (canvas.width / (window.devicePixelRatio || 1)) / (canvas.height / (window.devicePixelRatio || 1));
          
          let drawWidth, drawHeight, offsetX, offsetY;
          
          if (imgAspect > canvasAspect) {
            // Image is wider - fit to height
            drawHeight = (canvas.height / (window.devicePixelRatio || 1)) * scaleFactor;
            drawWidth = drawHeight * imgAspect;
            offsetX = ((canvas.width / (window.devicePixelRatio || 1)) - drawWidth) / 2;
            offsetY = ((canvas.height / (window.devicePixelRatio || 1)) - drawHeight) / 2;
          } else {
            // Image is taller - fit to width
            drawWidth = (canvas.width / (window.devicePixelRatio || 1)) * scaleFactor;
            drawHeight = drawWidth / imgAspect;
            offsetX = ((canvas.width / (window.devicePixelRatio || 1)) - drawWidth) / 2;
            offsetY = ((canvas.height / (window.devicePixelRatio || 1)) - drawHeight) / 2;
          }
          
          ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
          ctx.drawImage(currentImage, offsetX, offsetY, drawWidth, drawHeight);
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [imagesLoaded, showFeatureSymbolSelection, showActionWheel, frameInterval]);

  return (
    <div 
      ref={containerRef}
      className="flex-[1.4] flex items-center justify-center bg-transparent overflow-visible relative" 
      style={{ marginTop: '-180px' }}
    >
      {showFeatureSymbolSelection ? (
        <div className="w-full h-full flex items-center justify-center">
          <FeatureSymbolSelection
            isOpen={showFeatureSymbolSelection}
            onComplete={onFeatureSymbolSelectionComplete || (() => {})}
            selectedSymbol={selectedFeatureSymbol}
            freeSpinsCount={freeSpinsCount}
          />
        </div>
      ) : showActionWheel ? (
        <ActionWheel
          ref={actionWheelRef}
          isOpen={showActionWheel}
          totalActionSpins={actionGameSpins}
          accumulatedWin={accumulatedActionWin}
          onSpin={onActionWheelSpin || (async () => ({ result: '0', win: 0, additionalSpins: 0 }))}
          onComplete={onActionWheelComplete || (() => {})}
          onSpinTriggerReady={onActionWheelSpinTriggerReady}
          onWin={onActionWheelWin}
        />
      ) : (
        <canvas
          ref={canvasRef}
          className="absolute object-auto"
          style={{ 
            display: imagesLoaded ? 'block' : 'none',
            top: '50px',
            left: 0,
            right: 0,
            width: '100%',
            height: '100%',
            zIndex: 5
          }}
        />
      )}
    </div>
  );
}