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

// Music generation - Extended 8-bit funky-jazz patterns with multiple sections
// F major scale frequencies: F(349.23), G(392.00), A(440.00), Bb(466.16), C(523.25), D(587.33), E(659.25)
// Eb major scale frequencies: Eb(311.13), F(349.23), G(392.00), Ab(415.30), Bb(466.16), C(523.25), D(587.33)
// C major scale frequencies: C(261.63), D(293.66), E(329.63), F(349.23), G(392.00), A(440.00), B(493.88)

// Bass patterns (3 different patterns for variety)
const BASS_PATTERN_A = [349.23, 0, 349.23, 0, 392.00, 0, 349.23, 0, 440.00, 349.23, 0, 349.23, 0, 392.00, 349.23, 0];
const BASS_PATTERN_B = [311.13, 0, 311.13, 0, 349.23, 0, 392.00, 0, 349.23, 311.13, 0, 311.13, 0, 349.23, 392.00, 0];
const BASS_PATTERN_C = [261.63, 0, 329.63, 0, 261.63, 0, 329.63, 0, 293.66, 0, 349.23, 0, 293.66, 0, 261.63, 0];

// Melody patterns (4 different patterns for variety)
const MELODY_PATTERN_A = [
  0, 523.25, 587.33, 659.25, 
  523.25, 0, 0, 0, 
  466.16, 523.25, 466.16, 0, 
  440.00, 0, 392.00, 0
];
const MELODY_PATTERN_B = [
  659.25, 587.33, 523.25, 0, 
  587.33, 523.25, 466.16, 0,
  523.25, 466.16, 440.00, 0,
  466.16, 440.00, 392.00, 0
];
const MELODY_PATTERN_C = [
  523.25, 0, 587.33, 0,
  523.25, 587.33, 659.25, 0,
  587.33, 659.25, 783.99, 0,
  659.25, 0, 587.33, 0
];
const MELODY_PATTERN_D = [
  0, 0, 392.00, 440.00,
  466.16, 523.25, 466.16, 440.00,
  392.00, 349.23, 0, 0,
  392.00, 440.00, 466.16, 523.25
];

// Jazz chord fills (played occasionally for harmonic depth)
const JAZZ_CHORD_PATTERN_A = [
  [349.23, 440.00, 523.25], 0, 0, 0,  // F major
  0, 0, 0, 0,
  [415.30, 523.25, 622.25], 0, 0, 0,  // Ab major
  0, 0, 0, 0
];
const JAZZ_CHORD_PATTERN_B = [
  0, 0, 0, 0,
  [349.23, 440.00, 523.25], 0, 0, 0,  // F major
  0, 0, 0, 0,
  [329.63, 392.00, 493.88], 0, 0, 0,  // E minor
];

// Varied drum patterns
const DRUM_PATTERN_A = [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0];
const DRUM_PATTERN_B = [1, 0, 0.5, 0, 1, 0, 0.5, 0, 1, 0, 0.5, 0, 1, 0.5, 0.5, 0];
const DRUM_PATTERN_C = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0.5, 0.5, 1, 0, 0.5, 0.5];

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
  
  // Random integer between min and max (inclusive)
  const randomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  
  // Choose a specific pattern sequence based on current time
  // This ensures the music has longer, more varied sequences
  const getPatternForSection = (patternType: string, sectionIndex: number) => {
    switch (patternType) {
      case 'bass':
        // Alternate between different bass patterns in a more complex sequence
        if (sectionIndex % 4 === 0) return BASS_PATTERN_A; 
        if (sectionIndex % 4 === 1) return BASS_PATTERN_B;
        if (sectionIndex % 4 === 2) return BASS_PATTERN_C;
        return BASS_PATTERN_A;
      
      case 'melody':
        // Create more varied melody sequences
        if (sectionIndex % 8 === 0) return MELODY_PATTERN_A;
        if (sectionIndex % 8 === 1) return MELODY_PATTERN_B;
        if (sectionIndex % 8 === 2) return MELODY_PATTERN_C;
        if (sectionIndex % 8 === 3) return MELODY_PATTERN_D;
        if (sectionIndex % 8 === 4) return MELODY_PATTERN_B;
        if (sectionIndex % 8 === 5) return MELODY_PATTERN_A;
        if (sectionIndex % 8 === 6) return MELODY_PATTERN_D;
        return MELODY_PATTERN_C;
        
      case 'chord':
        // Add occasional jazz chords for harmonic interest
        if (sectionIndex % 4 === 0) return JAZZ_CHORD_PATTERN_A;
        if (sectionIndex % 4 === 2) return JAZZ_CHORD_PATTERN_B;
        return []; // No chords in other sections
      
      case 'drums':
        // Alternate drum patterns for rhythmic variety
        if (sectionIndex % 3 === 0) return DRUM_PATTERN_A;
        if (sectionIndex % 3 === 1) return DRUM_PATTERN_B;
        return DRUM_PATTERN_C;
      
      default:
        return [];
    }
  };
  
  // Generate 8-bit music using Web Audio API
  const startBackgroundMusic = () => {
    if (!musicEnabled) return;
    
    try {
      // Clean up any previous music first
      stopMusic();
      
      // Use Web Audio API for procedural music generation
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
      
      // Generate a random starting section to add variety
      const startingSection = randomInt(0, 15);
      
      // Define how many sections to play before looping (creates a longer, more varied piece)
      const sectionsToPlay = 4; // This creates a 4x longer composition before looping
      
      // Schedule multiple sections of music to create a longer, more varied composition
      for (let section = 0; section < sectionsToPlay; section++) {
        const currentSection = (startingSection + section) % 16; // Cycle through 16 different pattern combinations
        const sectionTime = now + section * (noteDuration * 16); // Each section is 16 notes long
        
        // Get appropriate patterns for this section
        const bassPattern = getPatternForSection('bass', currentSection);
        const melodyPattern = getPatternForSection('melody', currentSection);
        const chordPattern = getPatternForSection('chord', currentSection);
        const drumPattern = getPatternForSection('drums', currentSection);
        
        // Schedule the bass pattern for this section
        bassPattern.forEach((frequency, index) => {
          if (frequency === 0) return; // Skip rests
          
          const noteTime = sectionTime + index * noteDuration;
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
        
        // Schedule the melody pattern for this section
        melodyPattern.forEach((frequency, index) => {
          if (frequency === 0) return; // Skip rests
          
          const noteTime = sectionTime + index * noteDuration;
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();
          
          // Use different oscillator types for variety
          oscillator.type = (currentSection % 2 === 0) ? 'triangle' : 'sine';
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
        
        // Schedule the jazz chord patterns for harmonic depth
        chordPattern.forEach((chord, index) => {
          if (chord === 0) return; // Skip rests
          
          const noteTime = sectionTime + index * noteDuration;
          
          // Each chord is an array of frequencies to play simultaneously
          if (Array.isArray(chord)) {
            chord.forEach(frequency => {
              const oscillator = context.createOscillator();
              const gainNode = context.createGain();
              
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(frequency, noteTime);
              
              gainNode.gain.setValueAtTime(0.08, noteTime); // Lower volume for chords
              gainNode.gain.exponentialRampToValueAtTime(0.01, noteTime + noteDuration * 1.5);
              
              oscillator.connect(gainNode);
              gainNode.connect(masterGain);
              
              // Track the oscillator for clean shutdown
              activeOscillators.current.push(oscillator);
              
              oscillator.start(noteTime);
              oscillator.stop(noteTime + noteDuration * 1.5);
            });
          }
        });
        
        // Schedule drum sounds for this section
        drumPattern.forEach((hit, index) => {
          if (hit === 0) return; // Skip rests
          
          const noteTime = sectionTime + index * noteDuration;
          
          // Create kick drum
          if (hit === 1) {
            const kickOsc = context.createOscillator();
            const kickGain = context.createGain();
            
            kickOsc.type = 'sine';
            kickOsc.frequency.setValueAtTime(120, noteTime);
            kickOsc.frequency.exponentialRampToValueAtTime(40, noteTime + 0.05);
            
            kickGain.gain.setValueAtTime(0.5, noteTime);
            kickGain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.1);
            
            kickOsc.connect(kickGain);
            kickGain.connect(masterGain);
            
            // Track the oscillator for clean shutdown
            activeOscillators.current.push(kickOsc);
            
            kickOsc.start(noteTime);
            kickOsc.stop(noteTime + 0.1);
          }
          
          // Create hi-hat for smaller hit values (adding more complex rhythm)
          if (hit === 0.5) {
            const hihatOsc = context.createOscillator();
            const hihatGain = context.createGain();
            const hihatFilter = context.createBiquadFilter();
            
            hihatOsc.type = 'square';
            hihatOsc.frequency.setValueAtTime(800, noteTime);
            
            hihatFilter.type = 'highpass';
            hihatFilter.frequency.value = 7000;
            
            hihatGain.gain.setValueAtTime(0.2, noteTime);
            hihatGain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.03);
            
            hihatOsc.connect(hihatFilter);
            hihatFilter.connect(hihatGain);
            hihatGain.connect(masterGain);
            
            // Track the oscillator for clean shutdown
            activeOscillators.current.push(hihatOsc);
            
            hihatOsc.start(noteTime);
            hihatOsc.stop(noteTime + 0.03);
          }
        });
      }
      
      // Schedule the next batch of patterns after all sections finish
      // This creates an extended musical structure before repeating
      const totalDuration = sectionsToPlay * 16 * noteDuration;
      const timerId = setTimeout(() => {
        if (musicEnabled) {
          startBackgroundMusic();
        }
      }, totalDuration * 1000);
      
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