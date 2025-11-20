/**
 * Sound Effects Configuration
 * 
 * This module defines all sound effect file paths used in the game.
 * 
 * IMPORTANT:
 * You must add your own audio files to the `public/sounds/` directory.
 * You can find free sound effects and music on websites like:
 * - Pixabay (https://pixabay.com/music/)
 * - Freesound (https://freesound.org/)
 * 
 * File Format:
 * - Recommended: WAV or MP3
 * - Place files in: public/sounds/
 * - Paths are relative to public folder
 * 
 * Usage:
 * ```tsx
 * import { SOUNDS } from '@/lib/sounds';
 * import useSound from 'use-sound';
 * 
 * const [playWin] = useSound(SOUNDS.win);
 * playWin();
 * ```
 */

// IMPORTANT:
// You must add your own audio files to the `public/sounds/` directory.
// You can find free sound effects and music on websites like Pixabay or Freesound.

/**
 * SOUNDS constant
 * 
 * Object containing paths to all sound effect files
 * 
 * @param background - Looping background music (plays continuously)
 * @param spin - Sound for when reels start spinning (loops while spinning)
 * @param reelStop - Sound for each reel stopping (plays once per reel)
 * @param win - Standard win sound (plays for regular wins)
 * @param bigWin - Exciting sound for big wins (plays for large wins)
 * @param click - UI button click sound (plays on button interactions)
 * @param featureTrigger - Sound for triggering bonus features (free spins, etc.)
 * @param freeSpinsMusic - Background music during free spins (loops during feature)
 */
export const SOUNDS = {
  background: '/sounds/background-music.wav', // Looping background music
  spin: '/sounds/reel-spin.wav',              // Sound for when the reels start spinning
  reelStop: '/sounds/reel-stop.wav',          // Sound for each reel stopping
  win: '/sounds/win.wav',                     // Standard win sound
  bigWin: '/sounds/big-win.wav',              // Exciting sound for a big win
  click: '/sounds/click.wav',                 // For UI button clicks
  featureTrigger: '/sounds/feature-trigger.wav', // Sound for triggering a bonus feature
  freeSpinsMusic: '/sounds/free-spins-music.wav', // Free spins background music
};

