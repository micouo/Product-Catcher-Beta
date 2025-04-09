import { useEffect, useRef, useState } from 'react';

type SoundType = 'collect' | 'hit' | 'gameOver' | 'start' | 'lose' | 'drift';

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

// ROAD TRIP ADVENTURE MUSIC - A complete musical journey with multiple sections
// Major scales for reference:
// C major: C(261.63), D(293.66), E(329.63), F(349.23), G(392.00), A(440.00), B(493.88)
// F major: F(349.23), G(392.00), A(440.00), Bb(466.16), C(523.25), D(587.33), E(659.25)
// G major: G(392.00), A(440.00), B(493.88), C(523.25), D(587.33), E(659.25), F#(739.99)

// === MAIN THEME (INTRO) - "Road Trip Adventure" [G major] ===
// This is THE memorable, singable main melody that establishes the theme
const MAIN_THEME_MELODY = [
  392.00, 0, 493.88, 0, 587.33, 587.33, 493.88, 0, // G - B - D - D - B
  440.00, 0, 392.00, 0, 493.88, 0, 0, 0,          // A - G - B
  392.00, 0, 493.88, 0, 587.33, 587.33, 659.25, 0, // G - B - D - D - E
  739.99, 739.99, 659.25, 0, 587.33, 0, 0, 0,     // F# - F# - E - D
];

const MAIN_THEME_BASS = [
  392.00, 0, 392.00, 0, 392.00, 0, 392.00, 0,     // G bass
  440.00, 0, 440.00, 0, 493.88, 0, 493.88, 0,     // A - B bass
  392.00, 0, 392.00, 0, 392.00, 0, 392.00, 0,     // G bass
  293.66, 0, 329.63, 0, 392.00, 0, 392.00, 0,     // D - E - G bass
];

const MAIN_THEME_CHORDS = [
  [392.00, 493.88, 587.33], 0, 0, 0, 0, 0, 0, 0,  // G major
  [440.00, 523.25, 659.25], 0, 0, 0, [493.88, 587.33, 739.99], 0, 0, 0, // A minor - B major
  [392.00, 493.88, 587.33], 0, 0, 0, 0, 0, 0, 0,  // G major
  [293.66, 392.00, 587.33], 0, 0, 0, [392.00, 493.88, 587.33], 0, 0, 0, // D major - G major
];

// === VERSE SECTION - "Cruising Down the Highway" [C major] ===
// More relaxed, groove-based section with a funky feel
const VERSE_MELODY_A = [
  523.25, 0, 523.25, 493.88, 523.25, 0, 587.33, 0,  // C - C - B - C - D
  523.25, 493.88, 440.00, 0, 392.00, 440.00, 392.00, 0, // C - B - A - G - A - G
  349.23, 0, 392.00, 0, 440.00, 0, 493.88, 0,      // F - G - A - B 
  523.25, 523.25, 587.33, 523.25, 493.88, 0, 0, 0  // C - C - D - C - B
];

const VERSE_MELODY_B = [
  392.00, 0, 440.00, 0, 493.88, 0, 523.25, 0,      // G - A - B - C
  587.33, 587.33, 659.25, 587.33, 523.25, 0, 493.88, 0, // D - D - E - D - C - B
  523.25, 0, 493.88, 0, 440.00, 0, 392.00, 0,      // C - B - A - G
  349.23, 349.23, 392.00, 440.00, 493.88, 0, 0, 0  // F - F - G - A - B
];

const VERSE_BASS = [
  261.63, 0, 261.63, 0, 261.63, 0, 261.63, 0,      // C bass
  523.25/2, 0, 523.25/2, 0, 523.25/2, 0, 523.25/2, 0, // C bass (octave)
  349.23, 0, 349.23, 0, 349.23, 0, 349.23, 0,      // F bass
  293.66, 0, 293.66, 0, 261.63, 0, 261.63, 0       // D - C bass
];

const VERSE_CHORDS = [
  [261.63, 329.63, 392.00], 0, 0, 0, 0, 0, 0, 0,  // C major
  [261.63, 329.63, 523.25], 0, 0, 0, 0, 0, 0, 0,  // C major (spread)
  [349.23, 440.00, 523.25], 0, 0, 0, 0, 0, 0, 0,  // F major
  [293.66, 349.23, 440.00], 0, 0, 0, [261.63, 329.63, 392.00], 0, 0, 0  // D minor - C major
];

// === CHORUS SECTION - "Open Road Calling" [G major - triumphant] ===
// Big, uplifting section with the most memorable hook
const CHORUS_MELODY = [
  392.00, 0, 493.88, 0, 587.33, 587.33, 659.25, 0,  // G - B - D - D - E
  739.99, 0, 659.25, 0, 587.33, 0, 493.88, 0,      // F# - E - D - B
  440.00, 0, 392.00, 0, 440.00, 440.00, 493.88, 0,  // A - G - A - A - B
  587.33, 0, 523.25, 0, 493.88, 0, 0, 0            // D - C - B
];

const CHORUS_BASS = [
  392.00, 0, 392.00, 0, 392.00, 0, 392.00, 0,      // G bass
  392.00, 0, 392.00, 0, 392.00, 0, 493.88, 0,      // G - B bass
  440.00, 0, 440.00, 0, 440.00, 0, 440.00, 0,      // A bass
  587.33/2, 0, 587.33/2, 0, 493.88/2, 0, 493.88/2, 0 // D - B bass
];

const CHORUS_CHORDS = [
  [392.00, 493.88, 587.33], 0, 0, 0, [392.00, 587.33, 659.25], 0, 0, 0, // G - G7
  [392.00, 493.88, 739.99], 0, 0, 0, [493.88, 587.33, 739.99], 0, 0, 0, // G(add13) - B
  [440.00, 523.25, 659.25], 0, 0, 0, [440.00, 587.33, 659.25], 0, 0, 0, // A minor - A7
  [587.33/2, 493.88, 739.99], 0, 0, 0, [493.88, 587.33, 659.25], 0, 0, 0 // D - B7
];

// === BRIDGE SECTION - "City Lights at Night" [C minor - mysterious] ===
// Unexpected change of pace/key, builds tension before final chorus
const BRIDGE_MELODY = [
  523.25, 0, 466.16, 0, 440.00, 440.00, 466.16, 0, // C - Bb - A - A - Bb
  493.88, 0, 523.25, 0, 622.25, 0, 0, 0,          // B - C - Eb
  349.23, 0, 392.00, 0, 415.30, 0, 466.16, 0,     // F - G - G# - Bb
  523.25, 0, 466.16, 0, 440.00, 0, 0, 0           // C - Bb - A
];

const BRIDGE_BASS = [
  261.63, 0, 261.63, 0, 233.08, 0, 233.08, 0,     // C - Bb bass
  246.94, 0, 246.94, 0, 261.63, 0, 261.63, 0,     // B - C bass
  174.61, 0, 174.61, 0, 174.61, 0, 174.61, 0,     // F bass (low)
  261.63, 0, 233.08, 0, 220.00, 0, 220.00, 0      // C - Bb - A bass
];

const BRIDGE_CHORDS = [
  [261.63, 311.13, 415.30], 0, 0, 0, [233.08, 349.23, 466.16], 0, 0, 0, // C minor - Bb major
  [246.94, 369.99, 493.88], 0, 0, 0, [261.63, 311.13, 415.30], 0, 0, 0, // B major - C minor
  [174.61, 261.63, 349.23], 0, 0, 0, [174.61, 277.18, 415.30], 0, 0, 0, // F minor - F7
  [261.63, 311.13, 415.30], 0, 0, 0, [220.00, 277.18, 329.63], 0, 0, 0  // C minor - A diminished
];

// === OUTRO SECTION - "Journey's End" [G major - reflective] ===
// Final resolution, recalls main theme but with closure
const OUTRO_MELODY = [
  392.00, 0, 493.88, 0, 587.33, 0, 659.25, 0,      // G - B - D - E
  739.99, 0, 784.00, 0, 880.00, 0, 0, 0,          // F# - G - A (high)
  587.33, 587.33, 659.25, 659.25, 587.33, 0, 493.88, 0, // D - D - E - E - D - B
  392.00, 392.00, 440.00, 440.00, 493.88, 0, 392.00, 0  // G - G - A - A - B - G (final)
];

const OUTRO_BASS = [
  392.00, 0, 392.00, 0, 392.00, 0, 392.00, 0,      // G bass
  392.00, 0, 392.00, 0, 440.00, 0, 440.00, 0,      // G - A bass
  587.33/2, 0, 659.25/2, 0, 587.33/2, 0, 493.88/2, 0, // D - E - D - B bass
  392.00, 0, 440.00, 0, 493.88/2, 0, 392.00/2, 0   // G - A - B - G bass (final)
];

const OUTRO_CHORDS = [
  [392.00, 493.88, 587.33], 0, 0, 0, [392.00, 587.33, 659.25], 0, 0, 0, // G - G(add9)
  [392.00, 493.88, 739.99], 0, 0, 0, [440.00, 523.25, 659.25], 0, 0, 0, // G(add13) - A minor
  [587.33/2, 493.88, 659.25], 0, 0, 0, [493.88, 587.33, 739.99], 0, 0, 0, // D(add9) - B
  [392.00, 493.88, 587.33], 0, 0, 0, [392.00, 493.88, 587.33, 739.99], 0, 0, 0 // G - Gmaj7 (final)
];

export function useSound() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicInitialized, setMusicInitialized] = useState(false);
  
  // Refs to hold Audio API objects
  const audioContextRef = useRef<AudioContext | null>(null);
  const effectsAudioContextRef = useRef<AudioContext | null>(null); // Separate context for sound effects
  const musicOscillatorRef = useRef<OscillatorNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const activeOscillators = useRef<OscillatorNode[]>([]);
  const audioNodesTimers = useRef<(number | NodeJS.Timeout)[]>([]);
  
  // This gets called on first user interaction to bypass autoplay policies
  const initializeAudio = () => {
    console.log("Initializing audio system...");
    
    try {
      // Create audio context for background music if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Create separate audio context for sound effects to avoid interrupting music
      if (!effectsAudioContextRef.current) {
        effectsAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Try to load audio files if available
      try {
        // Load the hit sound if not already loaded
        if (!hitSoundElement) {
          hitSoundElement = new Audio('/hit.wav');
          hitSoundElement.preload = 'auto';
        }
        
        // Load the pickup sound if not already loaded
        if (!pickupSoundElement) {
          pickupSoundElement = new Audio('/pickup.wav');
          pickupSoundElement.preload = 'auto';
        }
      } catch (e) {
        console.error('Error loading sound files, will use generated sounds instead:', e);
      }
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  };
  
  // Function to clear everything and start clean
  const resetAudio = () => {
    // Stop all active oscillators
    activeOscillators.current.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Ignore already stopped oscillators
      }
    });
    
    // Clear oscillator array
    activeOscillators.current = [];
    
    // Clear all timers
    audioNodesTimers.current.forEach(timer => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    
    // Clear timer array
    audioNodesTimers.current = [];
    
    // Close and recreate contexts if needed
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {
        console.error('Error closing audio context:', e);
      }
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };
  
  // Function to play a sound effect by type
  const playSound = (type: SoundType) => {
    if (!soundEnabled) return;
    
    try {
      switch (type) {
        case 'hit':
          // Try to use the pre-loaded audio element if available
          if (hitSoundElement) {
            hitSoundElement.currentTime = 0;
            hitSoundElement.play().catch(err => {
              console.error('Error playing hit sound:', err);
              // Fallback to generated sound
              playGeneratedSound(type);
            });
          } else {
            playGeneratedSound(type);
          }
          break;
          
        case 'collect':
          // Try to use the pre-loaded audio element if available
          if (pickupSoundElement) {
            pickupSoundElement.currentTime = 0;
            pickupSoundElement.play().catch(err => {
              console.error('Error playing pickup sound:', err);
              // Fallback to generated sound
              playGeneratedSound(type);
            });
          } else {
            playGeneratedSound(type);
          }
          break;
          
        case 'gameOver':
          playGeneratedSound(type);
          break;
          
        case 'start':
          playGeneratedSound(type);
          break;
          
        case 'lose':
          playGeneratedSound(type);
          break;
          
        case 'drift':
          playGeneratedSound(type);
          break;
          
        default:
          console.warn(`Unknown sound type: ${type}`);
      }
    } catch (error) {
      console.error(`Error playing sound of type ${type}:`, error);
    }
  };
  
  // Generate and play procedural sounds
  const playGeneratedSound = (type: SoundType) => {
    if (!soundEnabled || !effectsAudioContextRef.current) return;
    
    try {
      let config: SoundConfig;
      
      // Configure different sound types
      switch (type) {
        case 'hit':
          config = {
            type: 'sawtooth',
            frequency: 150,
            duration: 0.15,
            ramp: 'exponential',
            notes: [150, 100, 50]
          };
          break;
          
        case 'collect':
          config = {
            type: 'triangle',
            frequency: 523.25, // C5
            duration: 0.15,
            ramp: 'linear',
            notes: [523.25, 659.25, 783.99] // C5, E5, G5 (C major chord)
          };
          break;
          
        case 'gameOver':
          config = {
            type: 'triangle',
            frequency: 493.88, // B4
            duration: 0.2,
            ramp: 'linear',
            notes: [493.88, 440.00, 349.23, 329.63] // B4, A4, F4, E4 (descending)
          };
          break;
          
        case 'start':
          config = {
            type: 'square',
            frequency: 523.25, // C5
            duration: 0.1,
            ramp: 'linear',
            notes: [392.00, 493.88, 523.25, 659.25] // G4, B4, C5, E5 (ascending)
          };
          break;
          
        case 'lose':
          config = {
            type: 'sawtooth',
            frequency: 311.13, // Eb4
            duration: 0.25,
            ramp: 'exponential',
            notes: [311.13, 293.66, 261.63, 233.08] // Eb4, D4, C4, Bb3 (descending)
          };
          break;
          
        case 'drift':
          config = {
            type: 'square',
            frequency: 220.00, // A3
            duration: 0.08,
            ramp: 'linear',
            notes: [220.00, 277.18, 329.63, 220.00] // A3, C#4, E4, A3 (A major arpeggio)
          };
          break;
          
        default:
          config = {
            type: 'sine',
            frequency: 440,
            duration: 0.1,
            ramp: 'linear',
            notes: [440]
          };
      }
      
      let oscillatorType: OscillatorType = 'triangle'; // Default type
      
      // Map string to OscillatorType
      if (config.type === 'sine' || config.type === 'square' || 
          config.type === 'sawtooth' || config.type === 'triangle') {
        oscillatorType = config.type;
      }
      
      // Create sound on the effects audio context to avoid interrupting music
      const context = effectsAudioContextRef.current;
      
      // Create a gain node for volume control
      const gainNode = context.createGain();
      gainNode.connect(context.destination);
      
      // Initial volume
      gainNode.gain.value = 0.15;
      
      // Play each note in sequence
      let noteTime = 0;
      
      config.notes.forEach((freq, index) => {
        const oscillator = context.createOscillator();
        oscillator.type = oscillatorType;
        oscillator.frequency.value = freq;
        oscillator.connect(gainNode);
        
        oscillator.start(context.currentTime + noteTime);
        oscillator.stop(context.currentTime + noteTime + config.duration);
        
        // Ramp down volume for each note
        const rampTime = context.currentTime + noteTime + config.duration - 0.05;
        if (config.ramp === 'exponential') {
          gainNode.gain.exponentialRampToValueAtTime(0.001, rampTime);
        } else {
          gainNode.gain.linearRampToValueAtTime(0.001, rampTime);
        }
        
        noteTime += config.duration;
      });
    } catch (error) {
      console.error(`Error playing generated sound of type ${type}:`, error);
    }
  };
  
  // Define the stopMusic function early so it can be called from within startBackgroundMusic
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
        // Clear both timeout and interval timers
        clearTimeout(timer);
        clearInterval(timer);
      });
      
      // Clear timer array
      audioNodesTimers.current = [];
      
      console.log('Stopped all audio');
    } catch (error) {
      console.error('Error stopping background music:', error);
    }
  };
  
  // Generate and play the background music
  const startBackgroundMusic = () => {
    // Prevent running this multiple times simultaneously
    if (musicInitialized && activeOscillators.current.length > 0) {
      console.log("Background music already playing, not restarting");
      return;
    }
    
    // Ensure music is enabled
    if (!musicEnabled) {
      return;
    }
    
    console.log("Starting 8-bit funky background music");
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const context = audioContextRef.current;
      
      // Master gain node for overall volume
      const masterGain = context.createGain();
      masterGain.gain.value = 0.2; // Set a comfortable volume
      masterGain.connect(context.destination);
      
      // Create a compressor for better dynamics
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      compressor.connect(masterGain);
      
      // Note duration and current time reference
      const noteDuration = 0.15; // Adjust for tempo
      const now = context.currentTime;
      
      // Define note scheduling function first so it can be used in schedulePattern
      const scheduleNote = (frequency: number, wavetype: OscillatorType, noteTime: number, gainNode: GainNode) => {
        const oscillator = context.createOscillator();
        oscillator.type = wavetype;
        oscillator.frequency.value = frequency;
        oscillator.connect(gainNode);
        
        // Add a slight decay to each note
        const noteGain = context.createGain();
        noteGain.gain.value = 1;
        noteGain.gain.setValueAtTime(1, noteTime);
        noteGain.gain.exponentialRampToValueAtTime(0.01, noteTime + noteDuration * 0.95);
        noteGain.connect(gainNode);
        
        oscillator.connect(noteGain);
        
        // Schedule the note
        oscillator.start(noteTime);
        oscillator.stop(noteTime + noteDuration);
        
        // Track active oscillators for cleanup
        activeOscillators.current.push(oscillator);
      };
      
      // Define pattern scheduling function using the scheduleNote function
      const schedulePattern = (pattern: (number | number[] | 0)[], wavetype: OscillatorType, volume: number, startTime: number) => {
        // Create a gain node for this pattern
        const gainNode = context.createGain();
        gainNode.gain.value = volume;
        gainNode.connect(compressor);
        
        // Play each note or chord in the pattern
        pattern.forEach((note, index) => {
          if (note === 0) return; // Skip rests
          
          // Calculate the time for this note
          const noteTime = startTime + index * noteDuration;
          
          if (Array.isArray(note)) {
            // It's a chord, schedule each note in the chord
            note.forEach(freq => {
              scheduleNote(freq, wavetype, noteTime, gainNode);
            });
          } else {
            // It's a single note
            scheduleNote(note, wavetype, noteTime, gainNode);
          }
        });
      };
      
      // We'll play a full "song" with multiple sections
      // This creates an extended musical journey before repeating
      
      // Intro section (1)
      const sectionsToPlay = 5; // Intro, Verse, Chorus, Bridge, Outro
      
      // Schedule all the patterns to play in sequence
      let currentTime = now;
      
      // Section 1: Intro (Main Theme)
      schedulePattern(MAIN_THEME_MELODY, 'triangle', 0.12, currentTime);
      schedulePattern(MAIN_THEME_BASS, 'sine', 0.08, currentTime);
      schedulePattern(MAIN_THEME_CHORDS, 'square', 0.04, currentTime);
      currentTime += 32 * noteDuration;
      
      // Section 2: Verse
      schedulePattern(VERSE_MELODY_A, 'triangle', 0.12, currentTime);
      schedulePattern(VERSE_BASS, 'sine', 0.08, currentTime);
      schedulePattern(VERSE_CHORDS, 'square', 0.04, currentTime);
      currentTime += 32 * noteDuration;
      
      // Section 3: Chorus
      schedulePattern(CHORUS_MELODY, 'triangle', 0.14, currentTime);
      schedulePattern(CHORUS_BASS, 'sine', 0.08, currentTime);
      schedulePattern(CHORUS_CHORDS, 'square', 0.05, currentTime);
      currentTime += 32 * noteDuration;
      
      // Section 4: Bridge
      schedulePattern(BRIDGE_MELODY, 'triangle', 0.12, currentTime);
      schedulePattern(BRIDGE_BASS, 'sine', 0.08, currentTime);
      schedulePattern(BRIDGE_CHORDS, 'sawtooth', 0.03, currentTime);
      currentTime += 32 * noteDuration;
      
      // Section 5: Outro
      schedulePattern(OUTRO_MELODY, 'triangle', 0.14, currentTime);
      schedulePattern(OUTRO_BASS, 'sine', 0.08, currentTime);
      schedulePattern(OUTRO_CHORDS, 'square', 0.05, currentTime);
      

      
      // Calculate the total duration of the music sequence
      const totalDuration = sectionsToPlay * 32 * noteDuration;
      
      // Set up a timer just before the expected end of the music
      const timeUntilCheck = Math.max((totalDuration * 1000) - 5000, 10000); // Check 5 seconds before expected end
      
      // Primary looping mechanism - timer that fires once near the end 
      const loopingTimer = setTimeout(() => {
        console.log('Music loop timer fired, checking if music needs to restart');
        
        // Create a single interval that checks if the music needs to be restarted
        const checkInterval = setInterval(() => {
          // Check if music has stopped or if we're past the expected end time
          const currentTime = Date.now();
          const expectedEndTime = (now + totalDuration) * 1000;
          const timeRemaining = expectedEndTime - currentTime;
          
          console.log(`Music remaining time: ${Math.round(timeRemaining / 1000)}s`);
          
          if (musicEnabled && (
              activeOscillators.current.length === 0 || 
              currentTime > expectedEndTime
          )) {
            console.log('Music has ended, restarting');
            
            // Clear this interval since we're about to restart music
            clearInterval(checkInterval);
            
            // Stop any remaining sounds
            stopMusic();
            
            // Start fresh music after a small delay
            setTimeout(() => {
              if (musicEnabled) {
                startBackgroundMusic();
              }
            }, 200);
          }
        }, 1000); // Check every second
        
        // Store the interval ID for cleanup
        audioNodesTimers.current.push(checkInterval);
        
      }, timeUntilCheck);
      
      // Fallback timer in case the checking mechanism fails
      const fallbackTimer = setTimeout(() => {
        console.log('Music fallback timer triggered, restarting music');
        if (musicEnabled) {
          stopMusic();
          setTimeout(() => startBackgroundMusic(), 200);
        }
      }, totalDuration * 1000 + 3000); // Wait until after the music should have ended
      
      // Store timer IDs for cleanup
      audioNodesTimers.current.push(loopingTimer);
      audioNodesTimers.current.push(fallbackTimer);
      
      // Store the gain node for volume control
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
        // Clear both timeout and interval timers
        clearTimeout(timer);
        clearInterval(timer);
      });
      
      // Clean up Web Audio API resources
      if (musicOscillatorRef.current) {
        musicOscillatorRef.current.stop();
        musicOscillatorRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
      
      if (effectsAudioContextRef.current) {
        effectsAudioContextRef.current.close().catch(console.error);
      }
    };
  }, []);
  
  // Explicitly start the background music
  const startMusic = () => {
    if (musicEnabled) {
      startBackgroundMusic();
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