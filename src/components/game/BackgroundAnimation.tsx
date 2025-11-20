/**
 * BackgroundAnimation Component
 * 
 * This component displays an animated background sequence of 242 webp images.
 * The animation loops continuously at 24 FPS.
 * The background is positioned absolutely behind all game content.
 */

'use client';

import { useRef, useEffect, useState } from 'react';

/**
 * BackgroundAnimation - Main Component
 * 
 * Displays a looping animation of 242 background images from
 * /public/animations/Background1/Background_1.webp to Background_242.webp
 * 
 * @param isFreeSpinsMode - Whether currently in free spins mode (not currently used, but kept for future use)
 */
export function BackgroundAnimation({ isFreeSpinsMode = false }: { isFreeSpinsMode?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const animationFrameRef = useRef<number>();
  const currentFrameRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  const totalFrames = 242;
  const fps = 24;
  const frameInterval = 1000 / fps; // ~41.67ms per frame

  // Preload all 242 images
  useEffect(() => {
    // Reset state
    setImagesLoaded(false);
    imagesRef.current = [];
    currentFrameRef.current = 0;
    lastFrameTimeRef.current = 0;
    
    const loadImages = async () => {
      const imagePromises: Promise<HTMLImageElement>[] = [];
      
      for (let i = 1; i <= totalFrames; i++) {
        const img = new Image();
        const promise = new Promise<HTMLImageElement>((resolve, reject) => {
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = `/animations/Background1/Background_${i}.webp`;
        });
        imagePromises.push(promise);
      }
      
      try {
        const loadedImages = await Promise.all(imagePromises);
        imagesRef.current = loadedImages;
        setImagesLoaded(true);
      } catch (error) {
        console.error('Error loading background animation images:', error);
      }
    };
    
    loadImages();
  }, [isFreeSpinsMode]);

  // Animation loop
  useEffect(() => {
    if (!imagesLoaded) return;
    
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match container
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
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
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Calculate aspect ratio and scaling to cover entire canvas
          const imgAspect = currentImage.width / currentImage.height;
          const canvasAspect = canvas.width / canvas.height;
          
          let drawWidth = canvas.width;
          let drawHeight = canvas.height;
          let offsetX = 0;
          let offsetY = 0;
          
          if (imgAspect > canvasAspect) {
            // Image is wider - fit to height, crop width
            drawHeight = canvas.height;
            drawWidth = drawHeight * imgAspect;
            offsetX = (canvas.width - drawWidth) / 2;
          } else {
            // Image is taller - fit to width, crop height
            drawWidth = canvas.width;
            drawHeight = drawWidth / imgAspect;
            offsetY = (canvas.height - drawHeight) / 2;
          }
          
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
  }, [imagesLoaded, frameInterval]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ 
          display: imagesLoaded ? 'block' : 'none',
          objectFit: 'cover'
        }}
      />
    </div>
  );
}

