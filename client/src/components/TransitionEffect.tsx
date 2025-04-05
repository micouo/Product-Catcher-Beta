import React, { useState, useEffect } from 'react';

interface TransitionEffectProps {
  isActive: boolean;
  duration?: number;
  onTransitionComplete?: () => void;
  onFlashComplete?: () => void;
  children?: React.ReactNode;
}

/**
 * A component that provides screen fade transition effects
 */
export default function TransitionEffect({
  isActive,
  duration = 1000, // Default 1 second
  onTransitionComplete,
  children
}: TransitionEffectProps) {
  const [opacity, setOpacity] = useState(isActive ? 0 : 1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  useEffect(() => {
    if (isActive && !isTransitioning) {
      // Start transition
      setIsTransitioning(true);
      setOpacity(0);
      
      // Transition in
      const timer = setTimeout(() => {
        setOpacity(1);
        
        // Transition complete
        setTimeout(() => {
          setIsTransitioning(false);
          if (onTransitionComplete) {
            onTransitionComplete();
          }
        }, duration);
      }, 50); // Small delay before starting transition
      
      return () => clearTimeout(timer);
    }
  }, [isActive, duration, onTransitionComplete, isTransitioning]);
  
  return (
    <div 
      className="w-full h-full relative"
      style={{ 
        opacity: opacity,
        transition: `opacity ${duration}ms ease-in-out`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * A component that provides a button flash effect
 */
export function ButtonFlash({
  isActive,
  duration = 500, // Default 500ms for the flash effect
  onFlashComplete,
  children
}: TransitionEffectProps) {
  const [isFlashing, setIsFlashing] = useState(false);
  const [flashCount, setFlashCount] = useState(0);
  
  useEffect(() => {
    if (isActive && !isFlashing) {
      setIsFlashing(true);
      setFlashCount(0);
      
      const flashInterval = setInterval(() => {
        setFlashCount(prev => {
          if (prev >= 5) { // Flash 5 times
            clearInterval(flashInterval);
            setIsFlashing(false);
            if (onFlashComplete) {
              onFlashComplete();
            }
            return prev;
          }
          return prev + 1;
        });
      }, duration / 5);
      
      return () => clearInterval(flashInterval);
    }
  }, [isActive, duration, onFlashComplete, isFlashing]);
  
  // Calculate brightness based on flash count
  const brightness = isFlashing ? (flashCount % 2 === 0 ? 1.5 : 1) : 1;
  
  return (
    <div 
      style={{ 
        filter: `brightness(${brightness})`,
        transition: `filter ${duration / 10}ms ease-in-out` 
      }}
    >
      {children}
    </div>
  );
}