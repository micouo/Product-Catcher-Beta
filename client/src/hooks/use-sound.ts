import { useEffect, useRef, useState } from 'react';

type SoundType = 'collect' | 'hit' | 'gameOver' | 'start' | 'lose';

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

// Music generation - 8-bit funky patterns
// F major scale frequencies: F(349.23), G(392.00), A(440.00), Bb(466.16), C(523.25), D(587.33), E(659.25)
const FUNKY_BASS_PATTERN = [349.23, 0, 349.23, 0, 392.00, 0, 349.23, 0, 440.00, 349.23, 0, 349.23, 0, 392.00, 349.23, 0];
const FUNKY_MELODY_PATTERN = [
  0, 523.25, 587.33, 659.25, 
  523.25, 0, 0, 0, 
  466.16, 523.25, 466.16, 0, 
  440.00, 0, 392.00, 0
];
const FUNKY_DRUM_PATTERN = [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0];

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
  const activeOscillators = useRef<OscillatorNode[]>([]);
  const audioNodesTimers = useRef<any[]>([]);
  
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
      
      // Create audio elements if they don't exist yet
      if (!backgroundMusicElement) {
        backgroundMusicElement = new Audio('/background-music.mp3');
        backgroundMusicElement.loop = true;
        backgroundMusicElement.volume = 0.3;
        // Preload the audio
        backgroundMusicElement.preload = 'auto';
      }
      
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
      if (musicEnabled && !musicInitialized && backgroundMusicElement) {
        // Play the music (must be in response to a user action)
        backgroundMusicElement.play()
          .then(() => {
            console.log('Background music started successfully');
            setMusicInitialized(true);
          })
          .catch(err => {
            console.error('Error playing background music:', err);
          });
      }
    } catch (error) {
      console.error('Error initializing audio:', error);
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
  
  // Generate 8-bit music using Web Audio API
  const startBackgroundMusic = () => {
    if (!musicEnabled) return;
    
    try {
      // Clean up any previous music first
      stopMusic();
      
      // Use Web Audio API instead of an audio file
      console.log('Starting 8-bit funky background music');
      
      // Make sure we have an audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const context = audioContextRef.current;
      
      // Setup parameters for our 8-bit music
      const bpm = 120; // Beats per minute
      const noteDuration = 60 / bpm / 2; // Duration of a single 8th note in seconds
      const now = context.currentTime;
      
      // Create master volume
      const masterGain = context.createGain();
      masterGain.gain.value = 0.2; // Master volume
      masterGain.connect(context.destination);
      
      // Schedule the bass pattern
      FUNKY_BASS_PATTERN.forEach((frequency, index) => {
        if (frequency === 0) return; // Skip rests
        
        const noteTime = now + index * noteDuration;
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(frequency / 2, noteTime); // Lower octave for bass
        
        gainNode.gain.setValueAtTime(0.25, noteTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, noteTime + noteDuration * 0.9);
        
        oscillator.connect(gainNode);
        gainNode.connect(masterGain);
        
        // Track the oscillator for clean shutdown
        activeOscillators.current.push(oscillator);
        
        oscillator.start(noteTime);
        oscillator.stop(noteTime + noteDuration);
      });
      
      // Schedule the melody pattern
      FUNKY_MELODY_PATTERN.forEach((frequency, index) => {
        if (frequency === 0) return; // Skip rests
        
        const noteTime = now + index * noteDuration;
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, noteTime);
        
        gainNode.gain.setValueAtTime(0.15, noteTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, noteTime + noteDuration * 0.8);
        
        oscillator.connect(gainNode);
        gainNode.connect(masterGain);
        
        // Track the oscillator for clean shutdown
        activeOscillators.current.push(oscillator);
        
        oscillator.start(noteTime);
        oscillator.stop(noteTime + noteDuration);
      });
      
      // Schedule drum sounds (kick drum)
      FUNKY_DRUM_PATTERN.forEach((hit, index) => {
        if (hit === 0) return; // Skip rests
        
        const noteTime = now + index * noteDuration;
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(120, noteTime);
        oscillator.frequency.exponentialRampToValueAtTime(40, noteTime + 0.05);
        
        gainNode.gain.setValueAtTime(0.5, noteTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.1);
        
        oscillator.connect(gainNode);
        gainNode.connect(masterGain);
        
        // Track the oscillator for clean shutdown
        activeOscillators.current.push(oscillator);
        
        oscillator.start(noteTime);
        oscillator.stop(noteTime + 0.1);
      });
      
      // Schedule the next pattern after this one finishes
      // This creates an infinite loop of music
      const timerId = setTimeout(() => {
        if (musicEnabled) {
          startBackgroundMusic();
        }
      }, noteDuration * FUNKY_BASS_PATTERN.length * 1000);
      
      // Track the timer ID for clean shutdown
      audioNodesTimers.current.push(timerId);
      
      // Store this for volume control
      musicGainRef.current = masterGain;
      
      setMusicInitialized(true);
      
    } catch (error) {
      console.error('Error starting 8-bit background music:', error);
    }
  };

  // Toggle sound effects on/off
  const toggleSound = () => {
    setSoundEnabled(prev => {
      console.log("Sound toggled to:", !prev);
      return !prev;
    });
  };

  // Toggle background music on/off
  const toggleMusic = () => {
    setMusicEnabled(prev => {
      const newState = !prev;
      console.log("Music toggled to:", newState);
      
      if (newState) {
        // Turn music on
        startBackgroundMusic();
      } else {
        // Turn music off - use stopMusic to clean up all audio resources
        stopMusic();
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
      
      // Clean up active oscillators
      activeOscillators.current.forEach(osc => {
        try {
          osc.stop();
        } catch (e) {
          // Ignore already stopped oscillators
        }
      });
      
      // Clear any pending timers
      audioNodesTimers.current.forEach(timer => {
        clearTimeout(timer);
      });
      
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
      // Stop HTML audio element if it exists
      if (backgroundMusicElement) {
        backgroundMusicElement.pause();
        backgroundMusicElement.currentTime = 0;
      }
      
      // Clean up Web Audio API oscillators
      activeOscillators.current.forEach(osc => {
        try {
          osc.stop();
        } catch (e) {
          // Ignore already stopped oscillators
        }
      });
      
      // Clear oscillator array
      activeOscillators.current = [];
      
      // Clean up any pending timers
      audioNodesTimers.current.forEach(timer => {
        clearTimeout(timer);
      });
      
      // Clear timer array
      audioNodesTimers.current = [];
      
      console.log('Stopped all audio');
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