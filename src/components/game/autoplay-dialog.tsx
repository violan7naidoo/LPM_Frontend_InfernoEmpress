/**
 * AutoplayDialog Component
 * 
 * This component provides a settings dialog for configuring autoplay functionality.
 * Players can set the number of spins and stop conditions for automatic gameplay.
 * 
 * Features:
 * - Number of spins slider (1-1000)
 * - Stop conditions:
 *   - Stop on any win
 *   - Stop if single win exceeds amount
 *   - Stop on feature (penny spins)
 *   - Stop if total loss exceeds amount
 * - Currency formatting (ZAR)
 * - Validation and start button
 * 
 * Layout:
 * - Modal dialog with form controls
 * - Sliders for numeric values
 * - Checkboxes for boolean options
 * - Start button to begin autoplay
 */

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

/**
 * AutoplaySettings interface
 * 
 * Configuration object for autoplay behavior
 * 
 * @param numberOfSpins - Number of spins to execute automatically (1-1000)
 * @param stopOnAnyWin - Stop autoplay if any win occurs
 * @param stopOnSingleWinExceeds - Stop if a single win exceeds this amount
 * @param stopOnFeature - Stop if penny spins feature is triggered
 * @param stopOnTotalLossExceeds - Stop if total loss exceeds this amount
 */
interface AutoplaySettings {
  numberOfSpins: number;
  stopOnAnyWin: boolean;
  stopOnSingleWinExceeds: number;
  stopOnFeature: boolean;
  stopOnTotalLossExceeds: number;
}

/**
 * Props interface for AutoplayDialog component
 * 
 * @param isOpen - Whether the dialog is open
 * @param onClose - Callback to close the dialog
 * @param onStartAutoplay - Callback to start autoplay with settings
 * @param currentBalance - Current player balance (for validation)
 * @param currentBet - Current bet amount (for validation)
 */
interface AutoplayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAutoplay: (settings: AutoplaySettings) => void;
  currentBalance: number;
  currentBet: number;
}

export function AutoplayDialog({ 
  isOpen, 
  onClose, 
  onStartAutoplay, 
  currentBalance, 
  currentBet 
}: AutoplayDialogProps) {
  const [settings, setSettings] = useState<AutoplaySettings>({
    numberOfSpins: 100,
    stopOnAnyWin: false,
    stopOnSingleWinExceeds: 2000000,
    stopOnFeature: true,
    stopOnTotalLossExceeds: 0.05,
  });

  const handleSliderChange = (key: keyof AutoplaySettings, value: number[]) => {
    setSettings(prev => ({ ...prev, [key]: value[0] }));
  };

  const handleCheckboxChange = (key: keyof AutoplaySettings, checked: boolean) => {
    setSettings(prev => ({ ...prev, [key]: checked }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleStartAutoplay = () => {
    onStartAutoplay(settings);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black/90 border-2 border-primary/50 text-white">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold text-accent uppercase tracking-wider">
            AUTOPLAY
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:text-accent"
          >
            <X className="h-6 w-6" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Number of Autoplays */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-accent uppercase tracking-wide">
              NUMBER OF AUTOPLAYS
            </label>
            <div className="px-2">
              <Slider
                value={[settings.numberOfSpins]}
                onValueChange={(value) => handleSliderChange('numberOfSpins', value)}
                min={1}
                max={1000}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span className="text-accent font-bold">{settings.numberOfSpins}</span>
                <span>1000</span>
              </div>
            </div>
          </div>

          {/* Stop on Any Win */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="stopOnAnyWin"
              checked={settings.stopOnAnyWin}
              onCheckedChange={(checked) => handleCheckboxChange('stopOnAnyWin', checked as boolean)}
              className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <label htmlFor="stopOnAnyWin" className="text-sm font-semibold text-accent uppercase tracking-wide">
              STOP ON ANY WIN
            </label>
          </div>

          {/* Stop if Single Win Exceeds */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-accent uppercase tracking-wide">
              STOP IF SINGLE WIN EXCEEDS
            </label>
            <div className="px-2">
              <Slider
                value={[settings.stopOnSingleWinExceeds]}
                onValueChange={(value) => handleSliderChange('stopOnSingleWinExceeds', value)}
                min={10}
                max={10000000}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>R 10.00</span>
                <span className="text-accent font-bold">
                  {formatCurrency(settings.stopOnSingleWinExceeds)}
                </span>
                <span>R 10M</span>
              </div>
            </div>
          </div>

          {/* Stop on Feature */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="stopOnFeature"
              checked={settings.stopOnFeature}
              onCheckedChange={(checked) => handleCheckboxChange('stopOnFeature', checked as boolean)}
              className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <label htmlFor="stopOnFeature" className="text-sm font-semibold text-accent uppercase tracking-wide">
              STOP ON FEATURE (IF APPLICABLE)
            </label>
          </div>

          {/* Stop if Total Loss Exceeds */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-accent uppercase tracking-wide">
              STOP IF TOTAL LOSS EXCEEDS
            </label>
            <div className="px-2">
              <Slider
                value={[settings.stopOnTotalLossExceeds]}
                onValueChange={(value) => handleSliderChange('stopOnTotalLossExceeds', value)}
                min={0.01}
                max={currentBalance}
                step={0.01}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>R 0.01</span>
                <span className="text-accent font-bold">
                  {formatCurrency(settings.stopOnTotalLossExceeds)}
                </span>
                <span>{formatCurrency(currentBalance)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Start Autoplay Button */}
        <Button
          onClick={handleStartAutoplay}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-3 uppercase tracking-wider"
        >
          START AUTOPLAY
        </Button>
      </DialogContent>
    </Dialog>
  );
}

