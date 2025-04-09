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
  523.25, 0, 587.33, 659.25, 587.33, 523.25, 493.88, 0, // C - D - E - D - C - B
  440.00, 493.88, 523.25, 0, 493.88, 440.00, 392.00, 0, // A - B - C - B - A - G
  349.23, 392.00, 440.00, 493.88, 523.25, 0, 493.88, 0, // F - G - A - B - C - B
  440.00, 392.00, 349.23, 392.00, 440.00, 0, 0, 0       // A - G - F - G - A
];

const VERSE_BASS_A = [
  261.63, 0, 261.63, 0, 261.63, 0, 261.63, 0,     // C bass
  261.63, 0, 261.63, 0, 392.00, 0, 392.00, 0,     // C - G bass
  349.23, 0, 349.23, 0, 293.66, 0, 293.66, 0,     // F - D bass
  261.63, 0, 261.63, 0, 392.00, 0, 392.00, 0,     // C - G bass
];

const VERSE_BASS_B = [
  261.63, 0, 261.63, 0, 392.00, 0, 392.00, 0,     // C - G bass
  349.23, 0, 349.23, 0, 293.66, 0, 293.66, 0,     // F - D bass
  349.23, 0, 349.23, 0, 392.00, 0, 329.63, 0,     // F - G - E bass
  349.23, 0, 293.66, 0, 261.63, 0, 261.63, 0,     // F - D - C bass
];

const VERSE_CHORDS = [
  [261.63, 329.63, 392.00], 0, 0, 0, [261.63, 329.63, 523.25], 0, 0, 0, // C - C7
  [261.63, 329.63, 392.00], 0, 0, 0, [349.23, 440.00, 523.25], 0, 0, 0, // C - F
  [349.23, 440.00, 523.25], 0, 0, 0, [293.66, 349.23, 440.00], 0, 0, 0, // F - D7
  [261.63, 329.63, 392.00], 0, 0, 0, [392.00, 493.88, 587.33], 0, 0, 0, // C - G
];

// === BRIDGE SECTION - "Scenic Overlook" [F major] ===
// More atmospheric, dreamy section with suspended chords
const BRIDGE_MELODY_A = [
  523.25, 0, 587.33, 0, 659.25, 0, 523.25, 0,     // C - D - E - C
  523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 0, // C - D - E - G - E - D - C
  466.16, 0, 523.25, 0, 587.33, 0, 466.16, 0,     // Bb - C - D - Bb
  466.16, 523.25, 466.16, 440.00, 392.00, 349.23, 392.00, 0, // Bb - C - Bb - A - G - F - G
];

const BRIDGE_MELODY_B = [
  659.25, 0, 587.33, 0, 523.25, 0, 466.16, 0,     // E - D - C - Bb
  440.00, 466.16, 523.25, 0, 466.16, 440.00, 392.00, 0, // A - Bb - C - Bb - A - G
  349.23, 0, 440.00, 0, 523.25, 0, 466.16, 0,     // F - A - C - Bb
  440.00, 392.00, 349.23, 0, 0, 0, 0, 0          // A - G - F
];

const BRIDGE_BASS = [
  349.23, 0, 349.23, 0, 349.23, 0, 349.23, 0,     // F bass
  349.23, 0, 349.23, 0, 349.23, 0, 440.00, 0,     // F - A bass
  466.16, 0, 466.16, 0, 466.16, 0, 523.25, 0,     // Bb - C bass
  349.23, 0, 261.63, 0, 293.66, 0, 349.23, 0,     // F - C - D - F bass
];

const BRIDGE_CHORDS = [
  [349.23, 440.00, 523.25], 0, 0, 0, [349.23, 440.00, 587.33], 0, 0, 0, // F - F9
  [349.23, 523.25, 659.25], 0, 0, 0, [349.23, 440.00, 659.25], 0, 0, 0, // Fmaj7 - F6
  [466.16, 587.33, 698.46], 0, 0, 0, [349.23, 523.25, 698.46], 0, 0, 0, // Bb - F/C
  [349.23, 466.16, 587.33], 0, 0, 0, [349.23, 440.00, 523.25], 0, 0, 0, // F7 - F
];

// === CHORUS SECTION - "Open Road Freedom" [G major] ===
// Triumphant, uplifting section with the catchiest melody
const CHORUS_MELODY_A = [
  392.00, 440.00, 493.88, 587.33, 659.25, 587.33, 493.88, 0, // G - A - B - D - E - D - B
  440.00, 493.88, 587.33, 659.25, 739.99, 0, 0, 0,         // A - B - D - E - F#
  587.33, 659.25, 587.33, 493.88, 440.00, 493.88, 440.00, 392.00, // D - E - D - B - A - B - A - G
  493.88, 440.00, 392.00, 0, 392.00, 0, 0, 0               // B - A - G - G
];

const CHORUS_MELODY_B = [
  587.33, 659.25, 739.99, 659.25, 587.33, 493.88, 587.33, 0, // D - E - F# - E - D - B - D
  659.25, 739.99, 880.00, 0, 739.99, 659.25, 587.33, 0,    // E - F# - G - F# - E - D
  440.00, 493.88, 587.33, 493.88, 440.00, 392.00, 440.00, 0, // A - B - D - B - A - G - A
  587.33, 493.88, 440.00, 392.00, 392.00, 0, 0, 0          // D - B - A - G - G
];

const CHORUS_BASS = [
  392.00, 0, 392.00, 0, 392.00, 0, 392.00, 0,     // G bass
  293.66, 0, 293.66, 0, 293.66, 0, 329.63, 0,     // D - E bass
  392.00, 0, 392.00, 0, 440.00, 0, 493.88, 0,     // G - A - B bass
  261.63, 0, 293.66, 0, 392.00, 0, 0, 0,          // C - D - G bass
];

const CHORUS_CHORDS = [
  [392.00, 493.88, 587.33], 0, 0, 0, [392.00, 493.88, 659.25], 0, 0, 0, // G - G/E
  [293.66, 440.00, 587.33], 0, 0, 0, [293.66, 392.00, 493.88], 0, 0, 0, // D7 - D
  [392.00, 493.88, 587.33], 0, 0, 0, [440.00, 523.25, 659.25], 0, 0, 0, // G - Am
  [261.63, 329.63, 392.00], 0, 0, 0, [392.00, 493.88, 587.33], 0, 0, 0, // C - G
];

// === OUTRO SECTION - "Journey's End" [G major] ===
// Final section that brings back main theme elements with a conclusive feel
const OUTRO_MELODY = [
  392.00, 0, 493.88, 0, 587.33, 0, 659.25, 0,     // G - B - D - E
  739.99, 659.25, 587.33, 493.88, 587.33, 493.88, 440.00, 392.00, // F# - E - D - B - D - B - A - G
  392.00, 493.88, 587.33, 659.25, 587.33, 493.88, 440.00, 392.00, // G - B - D - E - D - B - A - G
  392.00, 440.00, 493.88, 392.00, 392.00, 392.00, 0, 0    // G - A - B - G - G - G
];

const OUTRO_BASS = [
  392.00, 0, 392.00, 0, 392.00, 0, 392.00, 0,     // G bass
  293.66, 0, 329.63, 0, 349.23, 0, 392.00, 0,     // D - E - F - G bass
  392.00, 0, 349.23, 0, 329.63, 0, 293.66, 0,     // G - F - E - D bass
  261.63, 0, 293.66, 0, 392.00, 0, 392.00, 0,     // C - D - G - G bass
];

const OUTRO_CHORDS = [
  [392.00, 493.88, 587.33], 0, 0, 0, [392.00, 493.88, 659.25], 0, 0, 0, // G - G/E
  [293.66, 440.00, 587.33], 0, 0, 0, [349.23, 440.00, 587.33], 0, 0, 0, // D7 - F
  [392.00, 587.33, 739.99], 0, 0, 0, [293.66, 440.00, 587.33], 0, 0, 0, // G7 - D
  [261.63, 392.00, 523.25], 0, 0, 0, [392.00, 493.88, 587.33], 0, 0, 0, // C - G
];

// === DRUM PATTERNS ===
// Basic driving beat pattern for main sections
const DRUM_PATTERN_MAIN = [1, 0, 0.6, 0, 1, 0, 0.6, 0, 1, 0, 0.6, 0, 1, 0.3, 0.3, 0.6];

// Funky groove pattern for verse sections
const DRUM_PATTERN_VERSE = [1, 0, 0.4, 0, 1, 0, 0.4, 0.6, 1, 0, 0.4, 0, 1, 0.6, 0.4, 0.3];

// Atmospheric, lighter pattern for bridge
const DRUM_PATTERN_BRIDGE = [0.7, 0, 0.3, 0, 0.5, 0, 0.3, 0, 0.7, 0, 0.3, 0, 0.5, 0, 0.2, 0.2];

// Energetic pattern for chorus
const DRUM_PATTERN_CHORUS = [1, 0, 0.4, 0.4, 1, 0.3, 0.6, 0, 1, 0, 0.4, 0.4, 1, 0.6, 0.3, 0.6];

// Fill pattern for transitions between sections
const DRUM_PATTERN_FILL = [1, 0.5, 0.7, 0.5, 0.7, 0.5, 0.7, 0.5, 0.7, 0.5, 0.7, 0.5, 0.7, 0.8, 0.9, 1];

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
  },
  drift: {
    type: 'sawtooth',
    frequency: 120,
    duration: 0.35,
    ramp: 'down',
    notes: [180, 160, 190, 150, 170, 130]
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
  const driftCooldownRef = useRef<boolean>(false); // Cooldown tracking for drift sound effect
  
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
    
    // Special handling for drift sound with cooldown
    if (type === 'drift') {
      // If on cooldown, don't play the sound
      if (driftCooldownRef.current) return;
      
      // Set cooldown flag
      driftCooldownRef.current = true;
      
      // Remove cooldown after 5 seconds
      setTimeout(() => {
        driftCooldownRef.current = false;
      }, 5000);
      
      console.log('Playing drift sound effect');
    }
    
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
  
  // Get musical patterns based on the musical section and pattern type
  // Creates a complete musical journey with defined sections
  const getPatternForSection = (patternType: string, sectionIndex: number): any[] => {
    // Determine which musical section we're in
    // The song structure follows: INTRO → VERSE → CHORUS → BRIDGE → CHORUS → OUTRO
    const normalizedIndex = sectionIndex % 20; // Complete song cycle is 20 sections
    
    // Map the section index to a musical section
    let musicalSection: string;
    if (normalizedIndex < 3) {
      musicalSection = 'intro'; // First 3 sections are intro
    } else if (normalizedIndex < 7) {
      musicalSection = 'verse'; // Next 4 sections are verse
    } else if (normalizedIndex < 10) {
      musicalSection = 'chorus'; // Next 3 sections are chorus
    } else if (normalizedIndex < 14) {
      musicalSection = 'bridge'; // Next 4 sections are bridge
    } else if (normalizedIndex < 17) {
      musicalSection = 'chorus'; // Next 3 sections are chorus again
    } else {
      musicalSection = 'outro'; // Last 3 sections are outro
    }
    
    // Now return the appropriate pattern for the current musical section and pattern type
    switch (patternType) {
      case 'melody':
        switch (musicalSection) {
          case 'intro':
            return MAIN_THEME_MELODY;
          case 'verse':
            return normalizedIndex % 2 === 0 ? VERSE_MELODY_A : VERSE_MELODY_B;
          case 'bridge':
            return normalizedIndex % 2 === 0 ? BRIDGE_MELODY_A : BRIDGE_MELODY_B;
          case 'chorus':
            return normalizedIndex % 2 === 0 ? CHORUS_MELODY_A : CHORUS_MELODY_B;
          case 'outro':
            return OUTRO_MELODY;
          default:
            return MAIN_THEME_MELODY; // Fallback to main theme
        }
        
      case 'bass':
        switch (musicalSection) {
          case 'intro':
            return MAIN_THEME_BASS;
          case 'verse':
            return normalizedIndex % 2 === 0 ? VERSE_BASS_A : VERSE_BASS_B;
          case 'bridge':
            return BRIDGE_BASS;
          case 'chorus':
            return CHORUS_BASS;
          case 'outro':
            return OUTRO_BASS;
          default:
            return MAIN_THEME_BASS; // Fallback to main theme
        }
        
      case 'chord':
        switch (musicalSection) {
          case 'intro':
            return MAIN_THEME_CHORDS;
          case 'verse':
            return VERSE_CHORDS;
          case 'bridge':
            return BRIDGE_CHORDS;
          case 'chorus':
            return CHORUS_CHORDS;
          case 'outro':
            return OUTRO_CHORDS;
          default:
            return MAIN_THEME_CHORDS; // Fallback to main theme
        }
        
      case 'drums':
        // Choose drum pattern based on musical section for rhythmic variation
        switch (musicalSection) {
          case 'intro':
            return DRUM_PATTERN_MAIN;
          case 'verse':
            return DRUM_PATTERN_VERSE;
          case 'bridge':
            return DRUM_PATTERN_BRIDGE;
          case 'chorus':
            return DRUM_PATTERN_CHORUS;
          case 'outro':
            // Alternate between main pattern and fill pattern in outro
            return normalizedIndex % 2 === 0 ? DRUM_PATTERN_MAIN : DRUM_PATTERN_FILL;
          default:
            return DRUM_PATTERN_MAIN; // Fallback to main pattern
        }
        
      default:
        return [];
    }
  };
  
  // Generate 8-bit music using Web Audio API with our Road Trip Adventure theme
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
      
      // Setup parameters for our Road Trip Adventure music
      const bpm = 120; // Beats per minute
      const noteDuration = 60 / bpm / 2; // Duration of a single 8th note in seconds
      const now = context.currentTime;
      
      // Create master volume
      const masterGain = context.createGain();
      masterGain.gain.value = 0.2; // Master volume
      masterGain.connect(context.destination);
      
      // Generate a random starting point in our song structure
      // This adds variety each time the player starts the game
      const startingSection = randomInt(0, 19); // Our total song cycle is 20 sections
      
      // Define how many sections to play before looping (creates a longer composition)
      // This will create a ~2 minute song before looping
      const sectionsToPlay = 10; // Play 10 sections = roughly 2 minutes of music
      
      // Schedule multiple sections of music to create a complete musical composition
      for (let section = 0; section < sectionsToPlay; section++) {
        // Calculate the current musical section, preserving our song structure
        const currentSection = (startingSection + section) % 20; // Cycle through our 20-section song structure
        const sectionTime = now + section * (noteDuration * 32); // Each section is 32 notes long (doubled for more space)
        
        // Get patterns for the current musical section
        // Our getPatternForSection function returns the appropriate pattern based on 
        // the section index and the song structure (INTRO → VERSE → CHORUS → BRIDGE → CHORUS → OUTRO)
        const bassPattern = getPatternForSection('bass', currentSection);
        const melodyPattern = getPatternForSection('melody', currentSection);
        const chordPattern = getPatternForSection('chord', currentSection);
        const drumPattern = getPatternForSection('drums', currentSection);
        
        // Schedule the bass pattern for this section 
        bassPattern.forEach((value: number | number[], index: number) => {
          // Skip rests and non-numeric values
          if (value === 0 || Array.isArray(value)) return;
          
          const frequency = value as number;
          const noteTime = sectionTime + index * noteDuration;
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();
          
          // Bass sounds better with a square wave for 8-bit music
          oscillator.type = 'square';
          
          // Lower octave for bass
          oscillator.frequency.setValueAtTime(frequency / 2, noteTime);
          
          // Envelope for the bass note
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
        melodyPattern.forEach((value: number | number[], index: number) => {
          // Skip rests and non-numeric values
          if (value === 0 || Array.isArray(value)) return;
          
          const frequency = value as number;
          const noteTime = sectionTime + index * noteDuration;
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();
          
          // Vary the oscillator type based on the musical section for tonal variety
          // Determine which musical section we're in for oscillator type choice
          const normalizedIndex = currentSection % 20;
          let oscillatorType: OscillatorType = 'triangle'; // Default type
          
          if (normalizedIndex < 3) {
            // Intro - brighter sound
            oscillatorType = 'triangle';
          } else if (normalizedIndex < 7) {
            // Verse - smoother sound
            oscillatorType = 'sine';
          } else if (normalizedIndex < 10) {
            // Chorus - more pronounced sound
            oscillatorType = 'square';
          } else if (normalizedIndex < 14) {
            // Bridge - dreamier sound
            oscillatorType = 'sine';
          } else if (normalizedIndex < 17) {
            // Chorus again - more pronounced sound
            oscillatorType = 'square';
          } else {
            // Outro - memorable triangle sound
            oscillatorType = 'triangle';
          }
          
          oscillator.type = oscillatorType;
          oscillator.frequency.setValueAtTime(frequency, noteTime);
          
          // Different envelope for melody notes
          gainNode.gain.setValueAtTime(0.15, noteTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, noteTime + noteDuration * 0.8);
          
          oscillator.connect(gainNode);
          gainNode.connect(masterGain);
          
          // Track the oscillator for clean shutdown
          activeOscillators.current.push(oscillator);
          
          oscillator.start(noteTime);
          oscillator.stop(noteTime + noteDuration);
        });
        
        // Schedule the chord patterns for harmonic depth
        chordPattern.forEach((value: number | number[], index: number) => {
          if (value === 0) return; // Skip rests
          
          const noteTime = sectionTime + index * noteDuration;
          
          // Each chord is an array of frequencies to play simultaneously
          if (Array.isArray(value)) {
            value.forEach(frequency => {
              const oscillator = context.createOscillator();
              const gainNode = context.createGain();
              
              // Chords sound better with sine waves for a smoother harmonic blend
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(frequency, noteTime);
              
              // Lower volume for chords to prevent overwhelming the mix
              gainNode.gain.setValueAtTime(0.08, noteTime);
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
        
        // Schedule enhanced drum sounds for this section
        drumPattern.forEach((value: number | number[], index: number) => {
          // Skip rests and non-numeric values
          if (value === 0 || Array.isArray(value)) return;
          
          const hit = value as number;
          if (hit === 0) return; // Skip rests
          
          const noteTime = sectionTime + index * noteDuration;
          
          // Create kick drum for primary beats
          if (hit >= 0.9) {
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
          
          // Create snare drum for secondary beats
          if (hit >= 0.5 && hit < 0.9) {
            const snareOsc = context.createOscillator();
            const snareNoise = context.createOscillator(); // For the noise component
            const snareGain = context.createGain();
            const snareFilter = context.createBiquadFilter();
            
            snareOsc.type = 'triangle';
            snareOsc.frequency.setValueAtTime(180, noteTime);
            
            snareNoise.type = 'square';
            snareNoise.frequency.setValueAtTime(randomInt(150, 250), noteTime);
            
            snareFilter.type = 'bandpass';
            snareFilter.frequency.value = 1000;
            snareFilter.Q.value = 0.8;
            
            snareGain.gain.setValueAtTime(0.3, noteTime);
            snareGain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.1);
            
            snareOsc.connect(snareGain);
            snareNoise.connect(snareFilter);
            snareFilter.connect(snareGain);
            snareGain.connect(masterGain);
            
            // Track the oscillators for clean shutdown
            activeOscillators.current.push(snareOsc);
            activeOscillators.current.push(snareNoise);
            
            snareOsc.start(noteTime);
            snareOsc.stop(noteTime + 0.1);
            snareNoise.start(noteTime);
            snareNoise.stop(noteTime + 0.1);
          }
          
          // Create hi-hat for lighter accents (adding more complex rhythm)
          if (hit > 0 && hit < 0.5) {
            const hihatOsc = context.createOscillator();
            const hihatGain = context.createGain();
            const hihatFilter = context.createBiquadFilter();
            
            hihatOsc.type = 'square';
            hihatOsc.frequency.setValueAtTime(800, noteTime);
            
            hihatFilter.type = 'highpass';
            hihatFilter.frequency.value = 7000;
            
            hihatGain.gain.setValueAtTime(0.2 * hit, noteTime); // Scale volume by hit intensity
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
      const totalDuration = sectionsToPlay * 32 * noteDuration;
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