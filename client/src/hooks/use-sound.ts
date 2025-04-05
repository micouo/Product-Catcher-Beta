import { useEffect, useRef, useState } from 'react';

type SoundType = 'collect' | 'hit' | 'gameOver' | 'start' | 'lose' | 'music';

// Create audio elements lazily when needed
let backgroundMusicElement: HTMLAudioElement | null = null;
let hitSoundElement: HTMLAudioElement | null = null;
let pickupSoundElement: HTMLAudioElement | null = null;

// Audio elements for real sound files - will create these lazily
const audioElements: Partial<Record<SoundType, HTMLAudioElement>> = {};

// Sound generation parameters (for sounds without files)
type SoundConfig = {
  type: string;
  frequency: number;
  duration: number;
  ramp: string;
  notes: number[];
};

const SOUND_CONFIG: Record<string, SoundConfig> = {
  gameOver: {
    type: 'triangle',
    frequency: 220,
    duration: 0.8,
    ramp: 'down',
    notes: [440, 330, 220, 110]
  },
  start: {
    type: 'sine',
    frequency: 440,
    duration: 0.2,
    ramp: 'up',
    notes: [330, 440, 550, 660]
  },
  lose: {
    type: 'square',
    frequency: 200,
    duration: 0.3,
    ramp: 'down',
    notes: [200, 150]
  }
};

export function useSound() {
  // State hooks must come first
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true); // Set default to true for background music
  const [musicInitialized, setMusicInitialized] = useState<boolean>(false);
  
  // Ref hooks must be in consistent order on every render
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicIntervalRef = useRef<number | null>(null); // Store interval ID instead of oscillator
  const soundBuffers = useRef<{[key: string]: AudioBuffer}>({}); // Sound buffers cache
  
  // Initialize audio context on first user interaction
  const initializeAudio = () => {
    // This is a user-triggered action, so we can create audio elements now
    try {
      // Create the audio context if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Mark that we've had user interaction
      interactionRef.current = true;
      
      // We won't try to create a file-based music element anymore
      // since we're using Web Audio API directly for music
      
      if (!hitSoundElement) {
        hitSoundElement = new Audio('/sounds/hit.wav');
        hitSoundElement.volume = 0.45; // 45% volume
        audioElements.hit = hitSoundElement;
      }
      
      if (!pickupSoundElement) {
        pickupSoundElement = new Audio('/sounds/pickup.wav');
        pickupSoundElement.volume = 1.0;
        audioElements.collect = pickupSoundElement;
      }
      
      // Start background music in response to user interaction
      if (musicEnabled && !musicInitialized) {
        // Use our improved playSound method to play music
        // This must be in response to a user action
        playSound('music');
        setMusicInitialized(true);
      }
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  };
  
  // Create and play a sound
  const playSound = (type: SoundType) => {
    // Skip this check for music - music has its own enabled state
    if (type !== 'music' && !soundEnabled) return;
    
    // Skip this check for sound effects when music is disabled
    if (type === 'music' && !musicEnabled) return;
    
    // Special case for music since we're having issues with file playback
    if (type === 'music') {
      // Very simple tone generation for background ambience
      if (audioContextRef.current && musicEnabled) {
        try {
          // Simple cleanup of previous oscillator if exists
          if (musicOscillatorRef.current) {
            try {
              musicOscillatorRef.current.stop();
              musicOscillatorRef.current = null;
            } catch (e) {
              // Ignore errors
            }
          }
          
          console.log('Creating simplified background music');
          
          // Create a basic oscillator with a simple sine wave
          const ctx = audioContextRef.current;
          
          // Create a gain node for volume control
          const gainNode = ctx.createGain();
          gainNode.gain.value = 0.05; // Very quiet
          gainNode.connect(ctx.destination);
          
          // Create a basic oscillator
          const oscillator = ctx.createOscillator();
          oscillator.type = 'sine';
          oscillator.frequency.value = 220; // A3 note
          oscillator.connect(gainNode);
          oscillator.start();
          
          // Store for later reference
          musicOscillatorRef.current = oscillator;
          musicGainRef.current = gainNode;
          
          console.log('Successfully created background music with Web Audio API');
        } catch (error) {
          console.error('Error creating minimal background music:', error);
        }
      }
      return;
    }
    
    // Regular sound handling for non-music sounds
    if (audioElements[type]) {
      try {
        // Stop and reset the audio to allow replaying the sound immediately
        const audio = audioElements[type];
        if (audio) {
          audio.currentTime = 0;
          
          // Play the sound
          audio.play().catch(err => {
            console.error(`Error playing ${type}:`, err);
            // Fall back to generated sound
            playGeneratedSound(type);
          });
        }
        return;
      } catch (error) {
        console.error('Error playing audio element:', error);
      }
    }
    
    // If no audio element or error, use the generated sound
    playGeneratedSound(type);
  };
  
  // Play a generated sound (for sounds without files)
  const playGeneratedSound = (type: SoundType) => {
    const context = audioContextRef.current;
    if (!context) return;
    
    // Check if we have a config for this sound type
    if (!SOUND_CONFIG[type]) return;
    
    const config = SOUND_CONFIG[type];
    const now = context.currentTime;
    
    // Play a sequence of notes for more interesting sounds
    config.notes.forEach((note: number, index: number) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.type = config.type as OscillatorType;
      oscillator.frequency.setValueAtTime(note, now + index * (config.duration / config.notes.length));
      
      gainNode.gain.setValueAtTime(0.2, now + index * (config.duration / config.notes.length)); // Lower volume for sound effects
      
      if (config.ramp === 'up') {
        gainNode.gain.linearRampToValueAtTime(0, now + (index + 1) * (config.duration / config.notes.length));
      } else {
        gainNode.gain.linearRampToValueAtTime(0, now + (index + 1) * (config.duration / config.notes.length));
      }
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.start(now + index * (config.duration / config.notes.length));
      oscillator.stop(now + (index + 1) * (config.duration / config.notes.length));
    });
  };
  
  // Start background music using the real audio file
  const startBackgroundMusic = () => {
    if (!musicEnabled) return;
    
    try {
      // Create background music element if it doesn't exist
      if (!backgroundMusicElement) {
        backgroundMusicElement = new Audio('/background-music.wav');
        backgroundMusicElement.loop = true;
        backgroundMusicElement.preload = 'auto';
        console.log('Created background music element in startBackgroundMusic (WAV)');
      }
      
      // Set volume before playing
      if (backgroundMusicElement) {
        backgroundMusicElement.volume = 0.3;
        
        // Play the music file (it's set to loop automatically)
        backgroundMusicElement.play().catch(err => {
          console.error('Error playing background music:', err);
        });
      }
    } catch (error) {
      console.error('Error starting background music:', error);
    }
  };

  // Toggle sound effects on/off
  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  // Toggle background music on/off
  const toggleMusic = () => {
    setMusicEnabled(prev => {
      const newState = !prev;
      
      if (newState) {
        // Turn music on using our playSound method
        playSound('music');
      } else {
        // Turn music off
        try {
          if (backgroundMusicElement) {
            backgroundMusicElement.pause();
          }
        } catch (error) {
          console.error('Error pausing background music:', error);
        }
      }
      
      return newState;
    });
  };

  // Set volume for music
  const setMusicVolume = (volume: number) => {
    // Set the volume of the real audio element
    try {
      if (backgroundMusicElement) {
        backgroundMusicElement.volume = Math.max(0, Math.min(1, volume));
      }
    } catch (error) {
      console.error('Error setting music volume:', error);
    }
    
    // Also set the volume for the web audio API (fallback)
    if (musicGainRef.current) {
      musicGainRef.current.gain.value = volume;
    }
  };

  // Clean up when the component unmounts
  useEffect(() => {
    return () => {
      // Stop the background music
      try {
        if (backgroundMusicElement) {
          backgroundMusicElement.pause();
          backgroundMusicElement.currentTime = 0;
        }
      } catch (error) {
        console.error('Error stopping background music:', error);
      }
      
      // Clean up Web Audio API resources
      if (musicOscillatorRef.current) {
        musicOscillatorRef.current.stop();
        musicOscillatorRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, []);

  // Explicitly start the background music
  const startMusic = () => {
    if (musicEnabled) {
      // Use our playSound function which now also handles music
      playSound('music');
    }
  };
  
  // Explicitly stop the background music
  const stopMusic = () => {
    try {
      // Stop file-based music if it exists
      if (backgroundMusicElement) {
        backgroundMusicElement.pause();
        backgroundMusicElement.currentTime = 0;
      }
      
      // Stop Web Audio API music if it exists
      if (musicOscillatorRef.current) {
        try {
          musicOscillatorRef.current.stop();
          musicOscillatorRef.current = null;
        } catch (err) {
          // Ignore errors from stopping oscillators
          console.log('Stopped Web Audio background music');
        }
      }
    } catch (error) {
      console.error('Error stopping background music:', error);
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