/**
 * Utility Functions
 * 
 * This module provides utility functions used throughout the application.
 * 
 * Main function: cn() - Combines and merges CSS class names
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * cn() - Class Name Utility
 * 
 * Combines and merges CSS class names, with Tailwind CSS conflict resolution.
 * This is a wrapper around clsx and twMerge that handles:
 * - Conditional classes
 * - Tailwind class conflicts (e.g., "p-2" and "p-4" → "p-4")
 * - Array and object class inputs
 * 
 * @param inputs - Class name inputs (strings, arrays, objects, or combinations)
 * @returns Merged class name string
 * 
 * Usage:
 * ```tsx
 * cn('base-class', condition && 'conditional-class', { 'object-class': true })
 * // Returns: "base-class conditional-class object-class"
 * 
 * cn('p-2', 'p-4') // Tailwind conflict resolution
 * // Returns: "p-4" (p-4 overrides p-2)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

