import { useEffect, useRef, useState } from 'react';
import hitSound from '../assets/sounds/hit.wav';
import pickupSound from '../assets/sounds/pickup.wav';

type SoundType = 'collect' | 'hit' | 'gameOver' | 'start' | 'lose' | 'music';

// Audio elements for real sound files
const audioElements: Partial<Record<SoundType, HTMLAudioElement>> = {
  hit: new Audio(hitSound),
  collect: new Audio(pickupSound),
  music: new Audio('/background-music.wav'),
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
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true); // Default music to enabled
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [isFading, setIsFading] = useState<boolean>(false);
  
  // Ref hooks must be in consistent order on every render
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicOscillatorRef = useRef<OscillatorNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const interactionRef = useRef<boolean>(false);
  const soundBuffers = useRef<{[key: string]: AudioBuffer}>({}); // Sound buffers cache
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  
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
  
  // Play background music with looping
  const playBackgroundMusic = (fadeIn = false) => {
    if (!musicEnabled) return;
    
    // Initialize the music if not already done
    if (!backgroundMusicRef.current) {
      backgroundMusicRef.current = audioElements.music || null;
      
      if (backgroundMusicRef.current) {
        // Set up looping
        backgroundMusicRef.current.loop = true;
        
        // Set initial volume (will be faded in if requested)
        backgroundMusicRef.current.volume = fadeIn ? 0 : 0.6; // 60% volume as requested
        
        // Set up ended event to replay (as a backup for loop)
        backgroundMusicRef.current.addEventListener('ended', () => {
          if (backgroundMusicRef.current) {
            backgroundMusicRef.current.currentTime = 0;
            backgroundMusicRef.current.play().catch(err => console.error('Error restarting background music:', err));
          }
        });
      }
    }
    
    // Play the music
    if (backgroundMusicRef.current && !isMusicPlaying) {
      backgroundMusicRef.current.play()
        .then(() => {
          setIsMusicPlaying(true);
          
          // Fade in if requested
          if (fadeIn) {
            setIsFading(true);
            fadeAudioIn(backgroundMusicRef.current!, 0.6, 1000);
          }
        })
        .catch(err => console.error('Error playing background music:', err));
    }
  };
  
  // Stop background music
  const stopBackgroundMusic = (fadeOut = false) => {
    if (backgroundMusicRef.current && isMusicPlaying) {
      if (fadeOut) {
        setIsFading(true);
        fadeAudioOut(backgroundMusicRef.current, 1000)
          .then(() => {
            if (backgroundMusicRef.current) {
              backgroundMusicRef.current.pause();
              backgroundMusicRef.current.currentTime = 0;
            }
            setIsMusicPlaying(false);
            setIsFading(false);
          });
      } else {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current.currentTime = 0;
        setIsMusicPlaying(false);
      }
    }
  };
  
  // Pause background music (without resetting)
  const pauseBackgroundMusic = () => {
    if (backgroundMusicRef.current && isMusicPlaying) {
      backgroundMusicRef.current.pause();
      setIsMusicPlaying(false);
    }
  };
  
  // Resume background music
  const resumeBackgroundMusic = () => {
    if (backgroundMusicRef.current && !isMusicPlaying && musicEnabled) {
      backgroundMusicRef.current.play()
        .then(() => setIsMusicPlaying(true))
        .catch(err => console.error('Error resuming background music:', err));
    }
  };
  
  // Helper function to fade audio in
  const fadeAudioIn = (audio: HTMLAudioElement, targetVolume: number, duration: number) => {
    const startVolume = audio.volume;
    const volumeChange = targetVolume - startVolume;
    const startTime = performance.now();
    
    const fadeStep = () => {
      const currentTime = performance.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      audio.volume = startVolume + volumeChange * progress;
      
      if (progress < 1) {
        requestAnimationFrame(fadeStep);
      } else {
        setIsFading(false);
      }
    };
    
    requestAnimationFrame(fadeStep);
  };
  
  // Helper function to fade audio out
  const fadeAudioOut = (audio: HTMLAudioElement, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      const startVolume = audio.volume;
      const startTime = performance.now();
      
      const fadeStep = () => {
        const currentTime = performance.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        audio.volume = startVolume * (1 - progress);
        
        if (progress < 1) {
          requestAnimationFrame(fadeStep);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(fadeStep);
    });
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
        playBackgroundMusic();
      } else if (backgroundMusicRef.current) {
        stopBackgroundMusic();
      }
      
      return newState;
    });
  };

  // Set volume for music
  const setMusicVolume = (volume: number) => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.volume = volume;
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
    isMusicPlaying,
    isFading,
    setMusicVolume,
    initializeAudio,
    playBackgroundMusic,
    stopBackgroundMusic,
    pauseBackgroundMusic,
    resumeBackgroundMusic,
  };
}