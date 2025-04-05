import { useEffect, useState, useRef } from 'react';

// Define types for our sounds
type SoundType = 'collect' | 'hit';

/**
 * A minimalist sound system that focuses only on sound effects
 * This avoids the complexity and browser issues with background music
 */
export function useSound() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);

  // Create references to HTML audio elements
  const hitSoundRef = useRef<HTMLAudioElement | null>(null);
  const collectSoundRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize sound elements on mount
  useEffect(() => {
    try {
      // Create the sound elements with correct paths
      hitSoundRef.current = new Audio('/sounds/hit.wav');
      collectSoundRef.current = new Audio('/sounds/pickup.wav');
      
      // Set volume and preload
      if (hitSoundRef.current) {
        hitSoundRef.current.volume = 0.5;
        hitSoundRef.current.preload = 'auto';
      }
      
      if (collectSoundRef.current) {
        collectSoundRef.current.volume = 1.0;
        collectSoundRef.current.preload = 'auto';
      }
      
      console.log('Sound effects initialized successfully');
    } catch (error) {
      console.error('Error initializing sound effects:', error);
    }
    
    // Clean up on unmount
    return () => {
      hitSoundRef.current = null;
      collectSoundRef.current = null;
    };
  }, []);
  
  // Play a sound effect
  const playSound = (type: SoundType) => {
    if (!soundEnabled) return;
    
    try {
      let soundElement: HTMLAudioElement | null = null;
      
      // Get the appropriate sound element
      if (type === 'hit') {
        soundElement = hitSoundRef.current;
      } else if (type === 'collect') {
        soundElement = collectSoundRef.current;
      }
      
      // Play the sound if it exists
      if (soundElement) {
        // Reset to beginning for quick consecutive plays
        soundElement.currentTime = 0;
        
        // Play the sound
        soundElement.play().catch(error => {
          console.error(`Error playing ${type} sound:`, error);
        });
      }
    } catch (error) {
      console.error(`Error playing ${type} sound:`, error);
    }
  };
  
  // Toggle sound effects on/off
  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };
  
  // Toggle music on/off (just a stub for compatibility)
  const toggleMusic = () => {
    setMusicEnabled(prev => !prev);
  };
  
  // For backwards compatibility 
  const startMusic = () => {
    console.log('Music start called (not implemented in simple sound system)');
  };
  const stopMusic = () => {
    console.log('Music stop called (not implemented in simple sound system)');
  };
  const setMusicVolume = () => {
    console.log('Music volume change called (not implemented in simple sound system)');
  };
  // This is important as it is called by components to initialize audio
  const initializeAudio = () => {
    // Create a short silent sound and play it to initialize Web Audio on user interaction
    try {
      const silentSound = new Audio('data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
      silentSound.play().catch(e => console.log('Silent sound play error (expected):', e));
      return true;
    } catch (e) {
      console.error('Error initializing audio:', e);
      return false;
    }
  };
  
  return {
    playSound,
    toggleSound,
    toggleMusic,
    soundEnabled,
    musicEnabled,
    setMusicVolume,
    initializeAudio,
    startMusic,
    stopMusic
  };
}