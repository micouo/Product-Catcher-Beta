import { useState, useEffect } from 'react';
import { Button } from './ui/button';

// Import base character
import baseIdleSprite from '@assets/base_idle_strip9.png';

// Import hair styles
import bowlHairSprite from '@assets/bowlhair_idle_strip9.png';
import curlyHairSprite from '@assets/curlyhair_idle_strip9.png';
import longHairSprite from '@assets/longhair_idle_strip9.png';
import mopHairSprite from '@assets/mophair_idle_strip9.png';
import shortHairSprite from '@assets/shorthair_idle_strip9.png';
import spikeyHairSprite from '@assets/spikeyhair_idle_strip9.png';

// Define hairstyle options
export type HairStyle = 'none' | 'bowl' | 'curly' | 'long' | 'mop' | 'short' | 'spikey';

export interface HairStyleOption {
  id: HairStyle;
  name: string;
  sprite: string;
}

const hairStyles: HairStyleOption[] = [
  { id: 'none', name: 'No Hair', sprite: '' },
  { id: 'bowl', name: 'Bowl Cut', sprite: bowlHairSprite },
  { id: 'curly', name: 'Curly Hair', sprite: curlyHairSprite },
  { id: 'long', name: 'Long Hair', sprite: longHairSprite },
  { id: 'mop', name: 'Mop Top', sprite: mopHairSprite },
  { id: 'short', name: 'Short Hair', sprite: shortHairSprite },
  { id: 'spikey', name: 'Spikey Hair', sprite: spikeyHairSprite },
];

interface CharacterSelectorProps {
  onSelect: (hairStyle: HairStyle) => void;
  selectedHair: HairStyle;
}

export default function CharacterSelector({ onSelect, selectedHair }: CharacterSelectorProps) {
  // State for animation frame
  const [animFrame, setAnimFrame] = useState(0);
  
  // Start the animation
  useEffect(() => {
    const animInterval = setInterval(() => {
      setAnimFrame((prev) => (prev + 1) % 9); // 9 frames in the sprite sheet
    }, 150); // Update every 150ms
    
    return () => clearInterval(animInterval);
  }, []);
  
  // Constants for sprite rendering
  const SPRITE_SIZE = 24; // Size of each sprite in the sheet
  const DISPLAY_SIZE = 100; // Size to display the character
  
  // Function to render character preview
  const renderCharacterPreview = (hairStyle: HairStyle) => {
    const hairOption = hairStyles.find(h => h.id === hairStyle);
    
    return (
      <div className="relative" style={{ width: DISPLAY_SIZE, height: DISPLAY_SIZE }}>
        {/* Base character sprite */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            style={{
              width: DISPLAY_SIZE,
              height: DISPLAY_SIZE,
              backgroundImage: `url(${baseIdleSprite})`,
              backgroundPosition: `-${animFrame * SPRITE_SIZE}px 0px`,
              backgroundSize: `${9 * DISPLAY_SIZE}px ${DISPLAY_SIZE}px`,
              imageRendering: 'pixelated',
            }}
          />
        </div>
        
        {/* Hair style overlay (if selected) */}
        {hairOption && hairOption.sprite && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              style={{
                width: DISPLAY_SIZE,
                height: DISPLAY_SIZE,
                backgroundImage: `url(${hairOption.sprite})`,
                backgroundPosition: `-${animFrame * SPRITE_SIZE}px 0px`,
                backgroundSize: `${9 * DISPLAY_SIZE}px ${DISPLAY_SIZE}px`,
                imageRendering: 'pixelated',
              }}
            />
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-xl max-h-[350px] overflow-y-auto">      
      {/* Choose Hair Style */}
      <h3 className="text-lg text-gray-300 mb-2 text-center">Choose Hair Style</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {hairStyles.map((hairStyle) => (
          <Button 
            key={hairStyle.id}
            variant={selectedHair === hairStyle.id ? "default" : "outline"}
            className="flex flex-col items-center p-2 h-auto"
            onClick={() => onSelect(hairStyle.id)}
          >
            <div className="mb-1 h-14 w-14 flex items-center justify-center">
              {hairStyle.id !== 'none' ? 
                <div className="relative" style={{ width: 48, height: 48 }}>
                  {/* Show mini character with this hair */}
                  <div className="absolute inset-0">
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        backgroundImage: `url(${baseIdleSprite})`,
                        backgroundPosition: `0px 0px`,
                        backgroundSize: `${9 * 48}px ${48}px`,
                        imageRendering: 'pixelated',
                      }}
                    />
                  </div>
                  <div className="absolute inset-0">
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        backgroundImage: `url(${hairStyle.sprite})`,
                        backgroundPosition: `0px 0px`,
                        backgroundSize: `${9 * 48}px ${48}px`,
                        imageRendering: 'pixelated',
                      }}
                    />
                  </div>
                </div>
              : 
                <div className="relative" style={{ width: 48, height: 48 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      backgroundImage: `url(${baseIdleSprite})`,
                      backgroundPosition: `0px 0px`,
                      backgroundSize: `${9 * 48}px ${48}px`,
                      imageRendering: 'pixelated',
                    }}
                  />
                </div>
              }
            </div>
            <span className="text-xs">{hairStyle.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}