/**
 * Root Layout Component
 * 
 * This is the root layout component for the Next.js application.
 * It wraps all pages and provides global configuration.
 * 
 * Features:
 * - Sets page metadata (title, description)
 * - Loads global CSS styles
 * - Provides GameConfigProvider context
 * - Includes Toaster for notifications
 * - Configures fonts (Playfair Display, PT Sans)
 * 
 * Layout Structure:
 * - html: Dark theme, English language
 * - body: Font configuration, GameConfigProvider wrapper
 * - children: Page content (rendered from page.tsx)
 * - Toaster: Toast notification component
 */

import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { GameConfigProvider } from "@/hooks/use-game-config";

/**
 * Page metadata
 * 
 * Used for SEO and browser tab title
 */
export const metadata: Metadata = {
  title: 'Snow Kingdom',
  description: 'An epic slot game experience in the Snow Kingdom.',
};

/**
 * RootLayout Component
 * 
 * @param children - React children (page content)
 * 
 * Wraps the entire application with:
 * - GameConfigProvider: Loads and provides game configuration
 * - Toaster: Toast notification system
 * - Global styles: CSS from globals.css
 * - Fonts: Google Fonts (Playfair Display, PT Sans)
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // HTML root with dark theme
    <html lang="en" className="dark">
      <head>
        {/* 
          Google Fonts preconnect for performance
          - Preconnects to Google Fonts servers
          - Loads Playfair Display (headings) and PT Sans (body)
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&display=swap" rel="stylesheet" />
      </head>
      {/* 
        Body with font configuration
        - font-body: Uses PT Sans for body text
        - antialiased: Smooth font rendering
        - suppressHydrationWarning: Prevents Next.js hydration warnings
      */}
      <body className="font-body antialiased" suppressHydrationWarning={true}>
        {/* 
          GameConfigProvider wraps entire app
          - Loads game configuration from JSON
          - Provides config to all components via context
          - Must wrap all components that use useGameConfig()
        */}
        <GameConfigProvider>
          {/* Page content (rendered from page.tsx) */}
          {children}
          {/* Toast notification system */}
          <Toaster />
        </GameConfigProvider>
      </body>
    </html>
  );
}

