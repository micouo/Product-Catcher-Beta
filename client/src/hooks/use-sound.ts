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

// Music generation - Cinematic 8-bit adventure theme (featuring a memorable main melody)

// Key: D minor (with modal interchange for sections)
// D minor pentatonic: D(293.66), F(349.23), G(392.00), A(440.00), C(523.25)
// D minor: D(293.66), E(329.63), F(349.23), G(392.00), A(440.00), Bb(466.16), C(523.25)
// Relative major: F major: F(349.23), G(392.00), A(440.00), Bb(466.16), C(523.25), D(587.33), E(659.25)

// Extended multi-section compositions with a memorable main theme
// Each section is 16 beats long (4 bars of 4/4)

// MAIN MELODY - the catchy, memorable theme that will appear in variations
// This melody is designed to be distinctive and recognizable
const MAIN_MELODY = [
  // Intro motif - question phrase
  440.00, 0,      440.00, 523.25, 
  587.33, 523.25, 440.00, 0,
  
  // Answer phrase
  392.00, 0,      392.00, 440.00,
  523.25, 466.16, 392.00, 0,
  
  // Rising motif - builds tension
  349.23, 392.00, 440.00, 466.16,
  523.25, 587.33, 659.25, 698.46,
  
  // Resolve with signature ending phrase
  783.99, 698.46, 659.25, 587.33,
  523.25, 466.16, 440.00, 392.00
];

// MELODY VARIATION 1 - higher octave with different ending
const MELODY_VAR_1 = [
  // Start with same recognizable motif
  440.00 * 2, 0,          440.00 * 2, 523.25 * 2, 
  587.33 * 2, 523.25 * 2, 440.00 * 2, 0,
  
  // Different answer
  392.00 * 2, 440.00 * 2, 523.25 * 2, 587.33 * 2,
  659.25 * 2, 587.33 * 2, 523.25 * 2, 0,
  
  // Descending pattern
  523.25 * 2, 466.16 * 2, 440.00 * 2, 392.00 * 2,
  349.23 * 2, 329.63 * 2, 293.66 * 2, 261.63 * 2,
  
  // Resolve with a twist
  293.66 * 2, 349.23 * 2, 392.00 * 2, 440.00 * 2,
  392.00 * 2, 349.23 * 2, 293.66 * 2, 0
];

// MELODY VARIATION 2 - subdued, mysterious version in lower register
const MELODY_VAR_2 = [
  // Main motif elements but altered
  220.00, 0,      220.00, 261.63, 
  293.66, 261.63, 220.00, 0,
  
  // New direction
  196.00, 220.00, 246.94, 261.63,
  293.66, 329.63, 349.23, 392.00,
  
  // Call back to main melody but in minor key
  349.23, 0,      349.23, 392.00,
  440.00, 466.16, 440.00, 392.00,
  
  // Unresolved ending to create tension
  349.23, 329.63, 311.13, 293.66,
  277.18, 261.63, 246.94, 0
];

// BRIDGE SECTION - contrasting material that provides relief from main theme
const BRIDGE_MELODY = [
  // Spacious, lyrical phrase
  349.23, 0,      392.00, 0,
  440.00, 0,      523.25, 0,
  
  // Continue bridge with rising motif
  587.33, 659.25, 587.33, 523.25,
  587.33, 659.25, 698.46, 783.99,
  
  // Descending pattern
  698.46, 659.25, 587.33, 523.25,
  493.88, 440.00, 392.00, 349.23,
  
  // Lead back to main theme
  392.00, 440.00, 392.00, 349.23,
  392.00, 440.00, 466.16, 0
];

// FINALE MELODY - triumphant closing section
const FINALE_MELODY = [
  // Bold statement of main theme elements
  440.00, 523.25, 587.33, 659.25,
  783.99, 880.00, 987.77, 880.00,
  
  // Echo phrase
  783.99, 659.25, 587.33, 523.25,
  587.33, 659.25, 783.99, 0,
  
  // Grand ascending pattern
  523.25, 587.33, 659.25, 698.46,
  783.99, 880.00, 987.77, 1046.50,
  
  // Final resolution 
  1046.50, 987.77, 880.00, 783.99,
  659.25, 587.33, 523.25, 440.00
];

// BASS LINES - Providing harmonic foundation for each section
// Main theme bass
const BASS_MAIN = [
  293.66/2, 0, 293.66/2, 0, 293.66/2, 0, 293.66/2, 0,
  196.00/2, 0, 196.00/2, 0, 196.00/2, 0, 196.00/2, 0,
  174.61/2, 0, 174.61/2, 0, 174.61/2, 0, 174.61/2, 0,
  196.00/2, 0, 220.00/2, 0, 246.94/2, 0, 261.63/2, 0
];

// Variation bass with walking pattern
const BASS_VAR = [
  293.66/2, 0, 329.63/2, 0, 349.23/2, 0, 329.63/2, 0,
  293.66/2, 0, 261.63/2, 0, 246.94/2, 0, 220.00/2, 0,
  196.00/2, 0, 220.00/2, 0, 246.94/2, 0, 261.63/2, 0,
  293.66/2, 0, 329.63/2, 0, 349.23/2, 0, 392.00/2, 0
];

// Bridge section bass (more open and sparse)
const BASS_BRIDGE = [
  174.61/2, 0, 0, 0, 174.61/2, 0, 0, 0,
  196.00/2, 0, 0, 0, 196.00/2, 0, 0, 0,
  220.00/2, 0, 0, 0, 220.00/2, 0, 0, 0,
  246.94/2, 0, 261.63/2, 0, 293.66/2, 0, 329.63/2, 0
];

// Finale section bass (strong and driving)
const BASS_FINALE = [
  293.66/2, 293.66/2, 293.66/2, 293.66/2, 293.66/2, 293.66/2, 293.66/2, 293.66/2,
  196.00/2, 196.00/2, 196.00/2, 196.00/2, 196.00/2, 196.00/2, 196.00/2, 196.00/2,
  220.00/2, 220.00/2, 220.00/2, 220.00/2, 220.00/2, 220.00/2, 220.00/2, 220.00/2,
  293.66/2, 329.63/2, 349.23/2, 392.00/2, 440.00/2, 392.00/2, 349.23/2, 293.66/2
];

// HARMONIC PADS - Add richness and atmosphere
// Main theme harmony
const HARMONY_MAIN = [
  [293.66, 349.23, 440.00], 0, 0, 0, 0, 0, 0, 0, // Dm
  [196.00, 293.66, 392.00], 0, 0, 0, 0, 0, 0, 0, // Gm
  [174.61, 261.63, 349.23], 0, 0, 0, 0, 0, 0, 0, // F
  [196.00, 293.66, 392.00], 0, 0, 0, 0, 0, 0, 0  // Gm
];

// Bridge section harmony (more colorful)
const HARMONY_BRIDGE = [
  [349.23, 440.00, 523.25], 0, 0, 0, 0, 0, 0, 0, // F
  [392.00, 493.88, 587.33], 0, 0, 0, 0, 0, 0, 0, // G
  [440.00, 523.25, 659.25], 0, 0, 0, 0, 0, 0, 0, // Am
  [493.88, 587.33, 698.46], 0, 0, 0, 0, 0, 0, 0  // Bb
];

// DRUM PATTERNS - Various beat patterns for different sections
// Main theme drums (steady but not intrusive)
const DRUMS_MAIN = [1, 0, 0.5, 0, 1, 0, 0.5, 0, 1, 0, 0.5, 0, 1, 0, 0.5, 0.5];

// Variation drums (more complex)
const DRUMS_VAR = [1, 0.5, 0.5, 0, 1, 0, 0.5, 0.5, 1, 0, 0.5, 0, 1, 0.5, 0.5, 0.5]; 

// Bridge section drums (sparse, atmospheric)
const DRUMS_BRIDGE = [1, 0, 0, 0, 0.5, 0, 0, 0, 1, 0, 0, 0, 0.5, 0, 0.5, 0];

// Finale drums (driving, energetic)
const DRUMS_FINALE = [1, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5];
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
  
  // Choose a specific pattern for each musical section, creating a complex multi-part composition
  // This ensures the music has an extended form that doesn't feel repetitive
  const getPatternForSection = (patternType: string, sectionIndex: number) => {
    // Create a musical structure like this:
    // Intro → Main Theme → Variation 1 → Bridge → Main Theme → Variation 2 → Finale
    // This creates a true song structure with a memorable theme that appears multiple times

    // Determine which part of the music we're in based on section progression
    const musicPart = Math.floor(sectionIndex / 2) % 7; // 7 distinct parts to the music
    
    switch (patternType) {
      case 'melody':
        // Create a coherent musical journey
        switch(musicPart) {
          case 0: return MELODY_VAR_2; // Start with mysterious intro
          case 1: return MAIN_MELODY;  // Introduce main theme
          case 2: return MELODY_VAR_1; // First variation in higher register
          case 3: return BRIDGE_MELODY; // Bridge section for contrast
          case 4: return MAIN_MELODY;  // Return to main theme for familiarity
          case 5: return MELODY_VAR_2; // Second variation in lower register for tension
          case 6: return FINALE_MELODY; // End with triumphant finale
        }
        return MAIN_MELODY; // Default to main theme
      
      case 'bass':
        // Bass patterns match the melodic structure
        switch(musicPart) {
          case 0: return BASS_BRIDGE; // Sparse intro bass
          case 1: return BASS_MAIN;   // Foundational main theme bass
          case 2: return BASS_VAR;    // Walking bass for variation
          case 3: return BASS_BRIDGE; // Open bridge bass
          case 4: return BASS_MAIN;   // Return to main theme bass
          case 5: return BASS_VAR;    // More movement for second variation
          case 6: return BASS_FINALE; // Strong finale bass
        }
        return BASS_MAIN; // Default to main bass
      
      case 'harmony':
        // Add harmonic richness to certain sections
        switch(musicPart) {
          case 1: return HARMONY_MAIN;   // Harmonic support for main theme
          case 3: return HARMONY_BRIDGE; // Colorful bridge harmonies
          case 4: return HARMONY_MAIN;   // Return to main harmonies 
          case 6: return HARMONY_MAIN;   // Strong harmonies for finale
        }
        return []; // No harmony in other sections for contrast
      
      case 'drums':
        // Percussion matches the overall energy of each section
        switch(musicPart) {
          case 0: return DRUMS_BRIDGE; // Sparse intro drums
          case 1: return DRUMS_MAIN;   // Steady main theme drums
          case 2: return DRUMS_VAR;    // More complex variation drums
          case 3: return DRUMS_BRIDGE; // Sparse bridge percussion
          case 4: return DRUMS_MAIN;   // Return to main drums
          case 5: return DRUMS_VAR;    // Complex second variation
          case 6: return DRUMS_FINALE; // Energetic finale drums
        }
        return DRUMS_MAIN; // Default to main rhythm
      
      default:
        return [];
    }
  };
  
  // Generate cinematic 8-bit music with a memorable melody using Web Audio API
  const startBackgroundMusic = () => {
    if (!musicEnabled) return;
    
    try {
      // Clean up any previous music first
      stopMusic();
      
      // Use Web Audio API for procedural music generation
      console.log('Starting memorable adventure theme music');
      
      // Make sure we have an audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const context = audioContextRef.current;
      
      // Setup parameters for our 8-bit music
      const bpm = 110; // Beats per minute (slightly slower for more cinematic feel)
      const noteDuration = 60 / bpm / 2; // Duration of a single 8th note in seconds
      const now = context.currentTime;
      
      // Create master volume
      const masterGain = context.createGain();
      masterGain.gain.value = 0.2; // Master volume
      masterGain.connect(context.destination);
      
      // Define how many sections to play before looping
      // A larger number creates a truly extended musical composition that won't feel repetitive
      const sectionsToPlay = 14; // This creates a full musical composition with multiple movements
      
      // Schedule multiple sections of music to create an extended composition
      for (let section = 0; section < sectionsToPlay; section++) {
        const sectionTime = now + section * (noteDuration * 32); // Each section is 32 notes long (extended sections)
        
        // Get appropriate patterns for this section based on our musical form
        const melodyPattern = getPatternForSection('melody', section);
        const bassPattern = getPatternForSection('bass', section);
        const harmonyPattern = getPatternForSection('harmony', section);
        const drumPattern = getPatternForSection('drums', section);
        
        // Schedule the bass pattern for this section
        bassPattern.forEach((frequency: number, index: number) => {
          if (frequency === 0) return; // Skip rests
          
          const noteTime = sectionTime + index * noteDuration;
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();
          
          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(typeof frequency === 'number' ? frequency / 2 : 0, noteTime); // Lower octave for bass
          
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
        melodyPattern.forEach((frequency: number, index: number) => {
          if (frequency === 0) return; // Skip rests
          
          const noteTime = sectionTime + index * noteDuration;
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();
          
          // Use different oscillator types for variety
          oscillator.type = (section % 2 === 0) ? 'triangle' : 'sine';
          oscillator.frequency.setValueAtTime(typeof frequency === 'number' ? frequency : 0, noteTime);
          
          gainNode.gain.setValueAtTime(0.15, noteTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, noteTime + noteDuration * 0.8);
          
          oscillator.connect(gainNode);
          gainNode.connect(masterGain);
          
          // Track the oscillator for clean shutdown
          activeOscillators.current.push(oscillator);
          
          oscillator.start(noteTime);
          oscillator.stop(noteTime + noteDuration);
        });
        
        // Schedule harmony patterns for richness and atmosphere
        harmonyPattern.forEach((chord: any, index: number) => {
          if (chord === 0) return; // Skip rests
          
          const noteTime = sectionTime + index * noteDuration;
          
          // Each chord is an array of frequencies to play simultaneously
          if (Array.isArray(chord)) {
            chord.forEach((frequency: number) => {
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
        drumPattern.forEach((hit: number, index: number) => {
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
      // Use 32 notes per section (longer sections) × sectionsToPlay total sections
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