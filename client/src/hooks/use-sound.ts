import { useEffect, useRef, useState } from 'react';

type SoundType = 'collect' | 'hit' | 'gameOver' | 'start' | 'lose';

// Sound file paths - using real sound files when available
const SOUND_FILES: Record<SoundType, string> = {
  // Use the actual sound files provided
  collect: '/sounds/pickup.wav', // Use pickup.wav for collect sound
  hit: '/sounds/hit.wav',        // Use hit.wav for hit sound
  
  // We don't have files for these, so they'll use generated sounds
  gameOver: '',
  start: '',
  lose: ''
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
  const [musicEnabled, setMusicEnabled] = useState<boolean>(false); // Set default to false
  
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
        
        // Music is disabled by default, so we don't start it here
        // if (musicEnabled) {
        //   startBackgroundMusic();
        // }
      } catch (error) {
        console.error('Web Audio API not supported', error);
      }
    }
  };
  
  // Create and play a sound
  const playSound = (type: SoundType) => {
    if (!soundEnabled) return;
    
    // Initialize audio context if needed
    if (!audioContextRef.current) initializeAudio();
    const context = audioContextRef.current;
    if (!context) return;
    
    // If we have a sound file for this type, play it
    if (SOUND_FILES[type] && SOUND_FILES[type] !== '') {
      playAudioFile(type);
    } else {
      // Otherwise, use the generated sound
      playGeneratedSound(type);
    }
  };
  
  // Play a sound from a file
  const playAudioFile = (type: SoundType) => {
    const context = audioContextRef.current;
    if (!context) return;

    const soundFile = SOUND_FILES[type];
    if (!soundFile) return;
    
    // Check if we've already loaded this sound
    if (soundBuffers.current[type]) {
      // Play from cache
      const source = context.createBufferSource();
      source.buffer = soundBuffers.current[type];
      source.connect(context.destination);
      source.start();
      return;
    }
    
    // Need to load the sound
    fetch(soundFile)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        // Cache the decoded audio
        soundBuffers.current[type] = audioBuffer;
        
        // Play it
        const source = context.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(context.destination);
        source.start();
      })
      .catch(error => {
        console.error('Error loading sound file:', error);
        // Fallback to generated sound if file loading fails
        playGeneratedSound(type);
      });
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
    // Since we've disabled music, just toggle the state but don't play music
    setMusicEnabled(prev => {
      const newState = !prev;
      // Comment out music playback for now
      /*
      if (newState) {
        initializeAudio();
        startBackgroundMusic();
      } else if (musicOscillatorRef.current) {
        musicOscillatorRef.current.stop();
        musicOscillatorRef.current = null;
      }
      */
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