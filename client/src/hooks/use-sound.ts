import { useEffect, useRef, useState } from 'react';

type SoundType = 'collect' | 'hit' | 'gameOver' | 'start' | 'lose';

// Create a separate audio element for background music
const backgroundMusicElement = new Audio('/background-music.wav');
backgroundMusicElement.loop = true; // Enable looping

// Audio elements for real sound files
const audioElements: Partial<Record<SoundType, HTMLAudioElement>> = {
  hit: new Audio('/sounds/hit.wav'),
  collect: new Audio('/sounds/pickup.wav'),
};

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
  const musicOscillatorRef = useRef<OscillatorNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const interactionRef = useRef<boolean>(false);
  const soundBuffers = useRef<{[key: string]: AudioBuffer}>({}); // Sound buffers cache
  
  // Initialize audio context on first user interaction
  const initializeAudio = () => {
    if (!interactionRef.current && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        interactionRef.current = true;
        
        // Start background music automatically
        if (!musicInitialized) {
          try {
            // Set volume before playing
            backgroundMusicElement.volume = 0.3;
            
            // Play the music file (it's set to loop automatically)
            backgroundMusicElement.play().catch(err => {
              console.error('Error playing background music:', err);
            });
            
            setMusicInitialized(true);
          } catch (error) {
            console.error('Error starting background music:', error);
          }
        }
      } catch (error) {
        console.error('Web Audio API not supported', error);
      }
    }
  };
  
  // Create and play a sound
  const playSound = (type: SoundType) => {
    if (!soundEnabled) return;
    
    // If we have a real audio element for this sound, play it
    if (audioElements[type]) {
      try {
        // Stop and reset the audio to allow replaying the sound immediately
        const audio = audioElements[type];
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(err => {
            console.error('Error playing audio:', err);
            // Fall back to generated sound on error
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
      // Set volume before playing
      backgroundMusicElement.volume = 0.3;
      
      // Play the music file (it's set to loop automatically)
      backgroundMusicElement.play().catch(err => {
        console.error('Error playing background music:', err);
      });
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
        // Turn music on
        startBackgroundMusic();
      } else {
        // Turn music off
        try {
          backgroundMusicElement.pause();
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
      backgroundMusicElement.volume = Math.max(0, Math.min(1, volume));
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
        backgroundMusicElement.pause();
        backgroundMusicElement.currentTime = 0;
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
      startBackgroundMusic();
    }
  };
  
  // Explicitly stop the background music
  const stopMusic = () => {
    try {
      backgroundMusicElement.pause();
      backgroundMusicElement.currentTime = 0;
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
  };
}