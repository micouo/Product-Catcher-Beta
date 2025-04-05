import { useEffect, useRef, useState } from 'react';
import hitSound from '../assets/sounds/hit.wav';
import pickupSound from '../assets/sounds/pickup.wav';

type SoundType = 'collect' | 'hit' | 'gameOver' | 'start' | 'lose';

// Audio elements for real sound files
const audioElements: Partial<Record<SoundType, HTMLAudioElement>> = {
  hit: new Audio(hitSound),
  collect: new Audio(pickupSound),
};

// Set the volume for hit sound (80% of normal volume)
if (audioElements.hit) {
  audioElements.hit.volume = 0.8;
}

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
  const [musicEnabled, setMusicEnabled] = useState<boolean>(false); // Set default to false
  
  // Ref hooks must be in consistent order on every render
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicOscillatorRef = useRef<OscillatorNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const interactionRef = useRef<boolean>(false);
  
  // Initialize audio context on first user interaction
  const initializeAudio = () => {
    if (!interactionRef.current && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        interactionRef.current = true;
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
    // Initialize audio context if needed
    if (!audioContextRef.current) initializeAudio();
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
  
  // Start background music using oscillators
  const startBackgroundMusic = () => {
    if (!audioContextRef.current || !musicEnabled) return;
    
    const context = audioContextRef.current;
    
    // Stop existing music if playing
    if (musicOscillatorRef.current) {
      musicOscillatorRef.current.stop();
      musicOscillatorRef.current = null;
    }
    
    // Create gain node for volume control
    const gainNode = context.createGain();
    gainNode.gain.value = 0.2; // Lower volume for background music
    gainNode.connect(context.destination);
    musicGainRef.current = gainNode;
    
    // Pattern of notes for a simple melody
    const notes = [330, 370, 392, 440, 494, 440, 392, 370];
    const noteDuration = 0.5;
    const now = context.currentTime;
    
    // Play each note in sequence
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, now + index * noteDuration);
      
      oscillator.connect(gainNode);
      
      const startTime = now + index * noteDuration;
      const stopTime = now + (index + 0.9) * noteDuration;
      
      oscillator.start(startTime);
      oscillator.stop(stopTime);
      
      // For the last note, set up the next pattern
      if (index === notes.length - 1) {
        setTimeout(() => {
          if (musicEnabled) startBackgroundMusic();
        }, (stopTime - now) * 1000);
      }
    });
  };

  // Toggle sound effects on/off
  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  // Toggle background music on/off - currently disabled
  const toggleMusic = () => {
    setMusicEnabled(prev => {
      const newState = !prev;
      return newState;
    });
  };

  // Set volume for music
  const setMusicVolume = (volume: number) => {
    if (musicGainRef.current) {
      musicGainRef.current.gain.value = volume;
    }
  };

  // Clean up when the component unmounts
  useEffect(() => {
    return () => {
      if (musicOscillatorRef.current) {
        musicOscillatorRef.current.stop();
        musicOscillatorRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, []);

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