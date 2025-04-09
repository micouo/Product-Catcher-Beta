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

// Electronic Dance Music constants
// Music in key of A Minor: A(220.00), B(246.94), C(261.63), D(293.66), E(329.63), F(349.23), G(392.00)
// Higher octave: A(440.00), B(493.88), C(523.25), D(587.33), E(659.25), F(698.46), G(783.99)

// BPM for the electronic dance track (Beauty and a Beat style)
const EDM_BPM = 128;

// Time signatures
const BEAT_DURATION = 60 / EDM_BPM; // Duration of one beat in seconds
const BAR_DURATION = BEAT_DURATION * 4; // 4/4 time signature
const SIXTEENTH_NOTE = BEAT_DURATION / 4; // Duration of a sixteenth note

// Lead melody pattern based on the provided hook
// A - A - C - A - E - D - C - D
// E - E - G - E - A - G - E - C
const LEAD_HOOK_MELODY = [
  // A - A - C - A - E - D - C - D
  220.00, 220.00, 261.63, 220.00, 329.63, 293.66, 261.63, 293.66, 
  // E - E - G - E - A - G - E - C
  329.63, 329.63, 392.00, 329.63, 440.00, 392.00, 329.63, 261.63
];

// Higher octave version for chorus
const LEAD_HOOK_MELODY_HIGH = LEAD_HOOK_MELODY.map(freq => freq * 2);

// Four-on-the-floor kick drum pattern (16th notes)
const KICK_PATTERN = [
  1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, // basic pattern
];

// Snare/clap on beats 2 and 4
const SNARE_PATTERN = [
  0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
];

// Hi-hat 16th notes with variations
const HIHAT_PATTERN_BASIC = [
  0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
];

// Hi-hat with roll variations
const HIHAT_PATTERN_ROLLS = [
  0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.3, 0.3, 0.3, 0.3, 0.5, 0.5, 0.5,
];

// Synth bass patterns - sidechained to the kick
const BASS_PATTERN_VERSE = [
  220.00, 0, 0, 0, 220.00, 0, 0, 0, 220.00, 0, 0, 0, 220.00, 0, 175.00, 196.00,
];

const BASS_PATTERN_CHORUS = [
  220.00, 0, 0, 220.00, 293.66, 0, 0, 293.66, 196.00, 0, 0, 196.00, 246.94, 0, 261.63, 0,
];

// Arpeggiator patterns based on A minor chord progression
const ARP_PATTERN_AM_EM = [
  220.00, 261.63, 329.63, 440.00, 329.63, 261.63, 329.63, 440.00,
  164.81, 196.00, 246.94, 329.63, 246.94, 196.00, 246.94, 329.63,
];

const ARP_PATTERN_F_G = [
  174.61, 220.00, 261.63, 349.23, 261.63, 220.00, 261.63, 349.23,
  196.00, 246.94, 293.66, 392.00, 293.66, 246.94, 293.66, 392.00,
];

// Chord progressions (A minor, F major, C major, G major)
const CHORD_AM = [220.00, 261.63, 329.63]; // A minor (A, C, E)
const CHORD_F = [174.61, 220.00, 261.63, 349.23]; // F major (F, A, C, F)
const CHORD_C = [130.81, 196.00, 261.63, 329.63]; // C major (C, G, C, E)
const CHORD_G = [196.00, 246.94, 293.66, 392.00]; // G major (G, B, D, G)

// Chord progression patterns - AM - F - C - G (common in EDM pop)
const CHORD_PROGRESSION_VERSE = [
  CHORD_AM, 0, 0, 0, CHORD_F, 0, 0, 0, CHORD_C, 0, 0, 0, CHORD_G, 0, 0, 0,
];

const CHORD_PROGRESSION_CHORUS = [
  CHORD_AM, 0, CHORD_AM, 0, CHORD_F, 0, CHORD_F, 0, 
  CHORD_C, 0, CHORD_C, 0, CHORD_G, 0, CHORD_G, 0,
];

// Section durations in beats (4 beats per bar)
const SECTION_DURATIONS = {
  intro: 16, // 4 bars
  verse: 32, // 8 bars
  preChorus: 16, // 4 bars
  chorus: 32, // 8 bars
  bridge: 24, // 6 bars
  finalChorus: 32, // 8 bars
};

// Sound effect configs
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
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);
  const [musicInitialized, setMusicInitialized] = useState<boolean>(false);
  
  // Ref hooks must be in consistent order on every render
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const interactionRef = useRef<boolean>(false);
  const soundBuffers = useRef<{[key: string]: AudioBuffer}>({}); // Sound buffers cache
  const activeOscillators = useRef<OscillatorNode[]>([]);
  const activeAudioNodes = useRef<AudioNode[]>([]);
  const audioNodesTimers = useRef<any[]>([]);
  const driftCooldownRef = useRef<boolean>(false); // Cooldown tracking for drift sound effect
  
  // Initialize audio context on first user interaction
  const initializeAudio = () => {
    try {
      // Create the audio context if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Mark that we've had user interaction
      interactionRef.current = true;
      
      // Create audio elements if they don't exist yet
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
        startBackgroundMusic();
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
  
  // Random float between min and max
  const randomFloat = (min: number, max: number) => {
    return min + Math.random() * (max - min);
  };
  
  // Create a white noise buffer (for risers, sweeps, etc.)
  const createNoiseBuffer = (context: AudioContext, duration: number) => {
    const sampleRate = context.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = context.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    return buffer;
  };
  
  // Create a frequency sweep (for risers and downlifters)
  const createFrequencySweep = (
    context: AudioContext, 
    startFreq: number, 
    endFreq: number,
    startTime: number, 
    duration: number,
    type: OscillatorType = 'sawtooth'
  ) => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFreq, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + duration * 0.1);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
    
    oscillator.connect(gainNode);
    
    return { oscillator, gainNode };
  };
  
  // Create a synth pad with multiple oscillators for a rich sound
  const createSynthPad = (
    context: AudioContext,
    chord: number[],
    startTime: number,
    duration: number
  ) => {
    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];
    
    // Create 2 oscillators per note for richness
    chord.forEach(note => {
      // Main oscillator
      const osc1 = context.createOscillator();
      const gain1 = context.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.value = note;
      
      gain1.gain.setValueAtTime(0, startTime);
      gain1.gain.linearRampToValueAtTime(0.1 / chord.length, startTime + 0.2);
      gain1.gain.linearRampToValueAtTime(0.08 / chord.length, startTime + duration - 0.5);
      gain1.gain.linearRampToValueAtTime(0, startTime + duration);
      
      osc1.connect(gain1);
      
      // Detune oscillator for richness
      const osc2 = context.createOscillator();
      const gain2 = context.createGain();
      
      osc2.type = 'triangle';
      osc2.frequency.value = note;
      osc2.detune.value = randomInt(-10, 10); // Slight detune for richness
      
      gain2.gain.setValueAtTime(0, startTime);
      gain2.gain.linearRampToValueAtTime(0.05 / chord.length, startTime + 0.3);
      gain2.gain.linearRampToValueAtTime(0.04 / chord.length, startTime + duration - 0.5);
      gain2.gain.linearRampToValueAtTime(0, startTime + duration);
      
      osc2.connect(gain2);
      
      oscillators.push(osc1, osc2);
      gainNodes.push(gain1, gain2);
    });
    
    return { oscillators, gainNodes };
  };
  
  // Create a kick drum sound
  const createKick = (
    context: AudioContext,
    startTime: number,
    volume: number = 0.8
  ) => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(150, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, startTime + 0.05);
    
    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
    
    oscillator.connect(gainNode);
    
    return { oscillator, gainNode };
  };
  
  // Create a snare/clap sound
  const createSnareClap = (
    context: AudioContext,
    startTime: number,
    volume: number = 0.5
  ) => {
    // Noise component (body of the snare/clap)
    const noiseBuffer = createNoiseBuffer(context, 0.2);
    const noiseSource = context.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    
    // Filter to shape the noise
    const noiseFilter = context.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 2000;
    noiseFilter.Q.value = 1;
    
    // Envelope for the noise
    const noiseGain = context.createGain();
    noiseGain.gain.setValueAtTime(0, startTime);
    noiseGain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
    
    // Connect the noise components
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    
    // Body tone component
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.type = 'triangle';
    oscillator.frequency.value = 250;
    
    gainNode.gain.setValueAtTime(volume * 0.7, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.08);
    
    oscillator.connect(gainNode);
    
    return { noiseSource, noiseGain, oscillator, gainNode };
  };
  
  // Create a hi-hat sound
  const createHiHat = (
    context: AudioContext,
    startTime: number,
    volume: number = 0.2,
    duration: number = 0.08
  ) => {
    // Noise source
    const noiseBuffer = createNoiseBuffer(context, 0.2);
    const noiseSource = context.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    
    // High-pass filter for hi-hat tone
    const filter = context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;
    
    // Envelope for short attack/decay
    const gainNode = context.createGain();
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    noiseSource.connect(filter);
    filter.connect(gainNode);
    
    return { noiseSource, gainNode };
  };
  
  // Create a synth bass sound with sidechain effect
  const createSidechainedBass = (
    context: AudioContext,
    frequency: number,
    startTime: number,
    duration: number,
    volume: number = 0.4
  ) => {
    // Create oscillator for bass
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    // Rich saw-based sound
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = frequency;
    
    // Filter to shape the bass tone
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    filter.Q.value = 8;
    
    // Add slight resonance sweep
    filter.frequency.setValueAtTime(100, startTime);
    filter.frequency.exponentialRampToValueAtTime(500, startTime + 0.05);
    filter.frequency.exponentialRampToValueAtTime(400, startTime + duration);
    
    // Sidechain envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(volume * 0.9, startTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.2);
    
    // Connect the components
    oscillator.connect(filter);
    filter.connect(gainNode);
    
    return { oscillator, filter, gainNode };
  };
  
  // Create saw-based lead synth with glide effect
  const createSynthLead = (
    context: AudioContext,
    noteFrequencies: number[],
    startTime: number, 
    noteDuration: number,
    volume: number = 0.3
  ) => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    // Saw wave for bright sound
    oscillator.type = 'sawtooth';
    
    // Set initial frequency and schedule note changes with glide
    oscillator.frequency.setValueAtTime(noteFrequencies[0], startTime);
    
    // Schedule each note
    noteFrequencies.forEach((freq, index) => {
      const noteTime = startTime + index * noteDuration;
      
      // Start of note has a slight glide effect
      if (index > 0) {
        // Create portamento/glide effect
        oscillator.frequency.setTargetAtTime(
          freq, 
          noteTime, 
          0.03 // Time constant for glide
        );
      }
      
      // Volume envelope for each note
      gainNode.gain.setValueAtTime(0, noteTime);
      gainNode.gain.linearRampToValueAtTime(volume, noteTime + 0.02);
      
      // Slight decay within the note
      gainNode.gain.linearRampToValueAtTime(
        volume * 0.8, 
        noteTime + noteDuration * 0.7
      );
      
      // Release at end of note (if not the last note)
      if (index < noteFrequencies.length - 1) {
        gainNode.gain.linearRampToValueAtTime(0.1, noteTime + noteDuration * 0.9);
      }
    });
    
    // Final release
    gainNode.gain.linearRampToValueAtTime(
      0, 
      startTime + noteFrequencies.length * noteDuration
    );
    
    // Connect audio path
    oscillator.connect(gainNode);
    
    return { oscillator, gainNode };
  };
  
  // Create arpeggiator with pluck sound
  const createArpeggiator = (
    context: AudioContext,
    noteFrequencies: number[],
    startTime: number,
    noteDuration: number,
    volume: number = 0.15
  ) => {
    const nodes: { oscillator: OscillatorNode, gain: GainNode }[] = [];
    
    // Create a separate oscillator for each note to get the pluck effect
    noteFrequencies.forEach((freq, index) => {
      if (freq === 0) return; // Skip rests
      
      const noteTime = startTime + index * noteDuration;
      
      // Create oscillator and gain nodes
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      // Triangle wave for pluck base
      oscillator.type = 'triangle';
      oscillator.frequency.value = freq;
      
      // Create a very quick attack and decay for pluck sound
      gainNode.gain.setValueAtTime(0, noteTime);
      gainNode.gain.linearRampToValueAtTime(volume, noteTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.001, noteTime + noteDuration * 0.8);
      
      // Connect
      oscillator.connect(gainNode);
      
      // Schedule playback
      oscillator.start(noteTime);
      oscillator.stop(noteTime + noteDuration);
      
      nodes.push({ oscillator, gain: gainNode });
    });
    
    return nodes;
  };
  
  // Create a percussion effect like a riser or downlifter
  const createPercussionEffect = (
    context: AudioContext,
    effectType: 'riser' | 'downlifter',
    startTime: number,
    duration: number
  ) => {
    // Create a noise component
    const noiseBuffer = createNoiseBuffer(context, duration);
    const noiseSource = context.createBufferSource();
    const noiseGain = context.createGain();
    const filter = context.createBiquadFilter();
    
    noiseSource.buffer = noiseBuffer;
    
    // Filter settings depends on effect type
    if (effectType === 'riser') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, startTime);
      filter.frequency.exponentialRampToValueAtTime(15000, startTime + duration);
      filter.Q.value = 3;
      
      noiseGain.gain.setValueAtTime(0, startTime);
      noiseGain.gain.linearRampToValueAtTime(0.3, startTime + duration * 0.8);
      noiseGain.gain.linearRampToValueAtTime(0.5, startTime + duration);
    } else {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(15000, startTime);
      filter.frequency.exponentialRampToValueAtTime(300, startTime + duration);
      filter.Q.value = 2;
      
      noiseGain.gain.setValueAtTime(0.5, startTime);
      noiseGain.gain.linearRampToValueAtTime(0, startTime + duration);
    }
    
    // Connect
    noiseSource.connect(filter);
    filter.connect(noiseGain);
    
    return { noiseSource, filter, noiseGain };
  };
  
  // Generate a full electronic dance track using Web Audio API
  const startBackgroundMusic = () => {
    if (!musicEnabled) return;
    
    try {
      // Clean up any previous music first
      stopMusic();
      
      console.log('Starting high-energy electronic pop music');
      
      // Make sure we have an audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const context = audioContextRef.current;
      const now = context.currentTime;
      
      // Create master volume
      const masterGain = context.createGain();
      masterGain.gain.value = 0.25; // Master volume (moderate level)
      masterGain.connect(context.destination);
      
      // Store for volume control
      musicGainRef.current = masterGain;
      
      // Calculate section timings
      const sectionTimes = {
        intro: now,
        verse: now + SECTION_DURATIONS.intro * BEAT_DURATION,
        preChorus: now + (SECTION_DURATIONS.intro + SECTION_DURATIONS.verse) * BEAT_DURATION,
        chorus: now + (SECTION_DURATIONS.intro + SECTION_DURATIONS.verse + SECTION_DURATIONS.preChorus) * BEAT_DURATION,
        bridge: now + (SECTION_DURATIONS.intro + SECTION_DURATIONS.verse + SECTION_DURATIONS.preChorus + 
                     SECTION_DURATIONS.chorus) * BEAT_DURATION,
        finalChorus: now + (SECTION_DURATIONS.intro + SECTION_DURATIONS.verse + SECTION_DURATIONS.preChorus + 
                     SECTION_DURATIONS.chorus + SECTION_DURATIONS.bridge) * BEAT_DURATION,
        end: now + (SECTION_DURATIONS.intro + SECTION_DURATIONS.verse + SECTION_DURATIONS.preChorus + 
                  SECTION_DURATIONS.chorus + SECTION_DURATIONS.bridge + SECTION_DURATIONS.finalChorus) * BEAT_DURATION
      };
      
      // Total duration of the track in seconds
      const totalDuration = (Object.values(SECTION_DURATIONS).reduce((sum, val) => sum + val, 0)) * BEAT_DURATION;
      
      // ===== 1. INTRO SECTION =====
      // Filtered intro with reverb-heavy riser
      {
        // Intro soft lead melody - start with filtered version of the lead hook
        const { oscillator, gainNode } = createSynthLead(
          context, 
          LEAD_HOOK_MELODY.slice(0, 8), // First half of hook
          sectionTimes.intro + BEAT_DURATION * 4, // Start after a bar
          BEAT_DURATION / 2, // Eighth notes
          0.15 // Lower volume for intro
        );
        
        // Add filter for that "filtered intro" sound
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, sectionTimes.intro);
        filter.frequency.linearRampToValueAtTime(5000, sectionTimes.verse);
        filter.Q.value = 2;
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(masterGain);
        
        // Reverb effect for the intro
        const convolver = context.createConvolver();
        const reverbBuffer = context.createBuffer(2, context.sampleRate * 3, context.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
          const data = reverbBuffer.getChannelData(channel);
          for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * 1.5));
          }
        }
        convolver.buffer = reverbBuffer;
        
        // Connect some of the filtered sound to the reverb
        const reverbSend = context.createGain();
        reverbSend.gain.value = 0.4;
        filter.connect(reverbSend);
        reverbSend.connect(convolver);
        convolver.connect(masterGain);
        
        // Start the oscillator
        oscillator.start(sectionTimes.intro);
        oscillator.stop(sectionTimes.verse);
        
        // Add a subtle kick to establish rhythm
        for (let i = 0; i < 16; i++) {
          const beat = i % 4;
          if (beat === 0) { // Kick on beats 1, 5, 9, 13
            const kickTime = sectionTimes.intro + i * BEAT_DURATION;
            const { oscillator, gainNode } = createKick(context, kickTime, 0.4);
            oscillator.connect(gainNode);
            gainNode.connect(masterGain);
            
            oscillator.start(kickTime);
            oscillator.stop(kickTime + 0.2);
            
            activeOscillators.current.push(oscillator);
          }
        }
        
        // Add a riser effect leading to the verse
        const riser = createPercussionEffect(
          context, 
          'riser', 
          sectionTimes.intro + SECTION_DURATIONS.intro * BEAT_DURATION - 4 * BEAT_DURATION, // Start 4 beats before verse
          4 * BEAT_DURATION // 4 beats long
        );
        
        riser.noiseSource.connect(riser.filter);
        riser.filter.connect(riser.noiseGain);
        riser.noiseGain.connect(masterGain);
        
        riser.noiseSource.start(sectionTimes.intro + SECTION_DURATIONS.intro * BEAT_DURATION - 4 * BEAT_DURATION);
        riser.noiseSource.stop(sectionTimes.verse);
        
        // Track for cleanup
        activeOscillators.current.push(oscillator);
        activeAudioNodes.current.push(gainNode, filter, convolver, reverbSend, riser.noiseGain, riser.filter);
      }
      
      // ===== 2. VERSE SECTION =====
      // Minimal synths, punchy kick, pluck arps
      {
        // Punchy kick pattern
        for (let i = 0; i < SECTION_DURATIONS.verse; i++) {
          const beat = i % 4;
          if (beat === 0) { // Four-on-the-floor kick pattern
            const kickTime = sectionTimes.verse + i * BEAT_DURATION;
            const { oscillator, gainNode } = createKick(context, kickTime, 0.7);
            oscillator.connect(gainNode);
            gainNode.connect(masterGain);
            
            oscillator.start(kickTime);
            oscillator.stop(kickTime + 0.2);
            
            activeOscillators.current.push(oscillator);
          }
        }
        
        // Light hi-hats on 16th notes
        for (let i = 0; i < SECTION_DURATIONS.verse * 4; i++) {
          const hiHatTime = sectionTimes.verse + i * SIXTEENTH_NOTE;
          const { noiseSource, gainNode } = createHiHat(
            context, 
            hiHatTime, 
            i % 4 === 0 ? 0.2 : 0.1, // Accent on downbeats
            0.05
          );
          
          noiseSource.connect(gainNode);
          gainNode.connect(masterGain);
          
          noiseSource.start(hiHatTime);
          noiseSource.stop(hiHatTime + 0.1);
          
          activeAudioNodes.current.push(gainNode);
        }
        
        // Minimal bass - create a sidechained bass pattern
        for (let bar = 0; bar < SECTION_DURATIONS.verse / 4; bar++) {
          for (let i = 0; i < 16; i++) {
            const freq = BASS_PATTERN_VERSE[i];
            if (freq === 0) continue; // Skip rests
            
            const noteTime = sectionTimes.verse + (bar * 4 * BEAT_DURATION) + (i * SIXTEENTH_NOTE);
            const { oscillator, filter, gainNode } = createSidechainedBass(
              context,
              freq,
              noteTime,
              SIXTEENTH_NOTE * 3, // Note duration
              0.3
            );
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(masterGain);
            
            oscillator.start(noteTime);
            oscillator.stop(noteTime + SIXTEENTH_NOTE * 3.5);
            
            activeOscillators.current.push(oscillator);
            activeAudioNodes.current.push(filter, gainNode);
          }
        }
        
        // Arpeggiator pattern (16th notes)
        for (let bar = 0; bar < SECTION_DURATIONS.verse / 4; bar++) {
          // Alternate between A minor/E minor and F/G arps
          const arpPattern = bar % 2 === 0 ? ARP_PATTERN_AM_EM : ARP_PATTERN_F_G;
          
          const arpNodes = createArpeggiator(
            context,
            arpPattern,
            sectionTimes.verse + (bar * 4 * BEAT_DURATION),
            SIXTEENTH_NOTE,
            0.1
          );
          
          // Connect each node to master
          arpNodes.forEach(({ oscillator, gain }) => {
            gain.connect(masterGain);
            activeOscillators.current.push(oscillator);
            activeAudioNodes.current.push(gain);
          });
        }
        
        // Add occasional snare hits
        for (let i = 0; i < SECTION_DURATIONS.verse; i++) {
          const beat = i % 4;
          if (beat === 2) { // Snare on beats 3, 7, 11, etc.
            const snareTime = sectionTimes.verse + i * BEAT_DURATION;
            const { noiseSource, noiseGain, oscillator, gainNode } = createSnareClap(context, snareTime, 0.3);
            
            noiseSource.connect(noiseGain);
            noiseGain.connect(masterGain);
            oscillator.connect(gainNode);
            gainNode.connect(masterGain);
            
            noiseSource.start(snareTime);
            noiseSource.stop(snareTime + 0.2);
            oscillator.start(snareTime);
            oscillator.stop(snareTime + 0.1);
            
            activeOscillators.current.push(oscillator);
            activeAudioNodes.current.push(noiseGain, gainNode);
          }
        }
      }
      
      // ===== 3. PRE-CHORUS SECTION =====
      // Build tension with riser, filtered chords and gated effect
      {
        // Create a rising filter sweep for tension
        const sweep = createFrequencySweep(
          context,
          200,
          8000,
          sectionTimes.preChorus,
          SECTION_DURATIONS.preChorus * BEAT_DURATION * 0.9,
          'sawtooth'
        );
        
        sweep.oscillator.connect(sweep.gainNode);
        sweep.gainNode.connect(masterGain);
        
        sweep.oscillator.start(sectionTimes.preChorus);
        sweep.oscillator.stop(sectionTimes.chorus);
        
        activeOscillators.current.push(sweep.oscillator);
        activeAudioNodes.current.push(sweep.gainNode);
        
        // Create filtered chord progression
        for (let i = 0; i < 4; i++) {
          const chordTime = sectionTimes.preChorus + i * 4 * BEAT_DURATION;
          
          // Alternate between Am and F chords
          const chord = i % 2 === 0 ? CHORD_AM : CHORD_F;
          
          const { oscillators, gainNodes } = createSynthPad(
            context,
            chord,
            chordTime,
            4 * BEAT_DURATION,
          );
          
          // Create a common filter for the chord
          const filter = context.createBiquadFilter();
          filter.type = 'lowpass';
          
          // Filter sweep increases as we approach the chorus
          const startFreq = 500 + i * 500; // Each chord iteration gets brighter
          filter.frequency.setValueAtTime(startFreq, chordTime);
          filter.frequency.linearRampToValueAtTime(startFreq + 2000, chordTime + 4 * BEAT_DURATION);
          filter.Q.value = 4;
          
          // Connect oscillators to gains, then to filter, then to master
          gainNodes.forEach((gain, idx) => {
            gain.connect(filter);
            activeAudioNodes.current.push(gain);
          });
          
          filter.connect(masterGain);
          activeAudioNodes.current.push(filter);
          
          // Create volume gate effect for chord stabs (faster as we approach chorus)
          const gateRate = 2 + i; // Increasing gate speed
          for (let j = 0; j < 4 * gateRate; j++) {
            const gateTime = chordTime + j * (BEAT_DURATION / gateRate);
            const gateEndTime = gateTime + (BEAT_DURATION / gateRate) * 0.7;
            
            // Connect and start oscillators
            oscillators.forEach((osc, idx) => {
              osc.start(chordTime);
              osc.stop(chordTime + 4 * BEAT_DURATION);
              activeOscillators.current.push(osc);
            });
          }
        }
        
        // Continuous kick drum build
        for (let i = 0; i < SECTION_DURATIONS.preChorus; i++) {
          const kickTime = sectionTimes.preChorus + i * BEAT_DURATION;
          const { oscillator, gainNode } = createKick(context, kickTime, 0.6 + (i / SECTION_DURATIONS.preChorus) * 0.3);
          
          oscillator.connect(gainNode);
          gainNode.connect(masterGain);
          
          oscillator.start(kickTime);
          oscillator.stop(kickTime + 0.2);
          
          activeOscillators.current.push(oscillator);
          activeAudioNodes.current.push(gainNode);
        }
        
        // Add rising white noise sweep
        const riser = createPercussionEffect(
          context,
          'riser',
          sectionTimes.preChorus + SECTION_DURATIONS.preChorus * BEAT_DURATION * 0.5, // Start halfway through
          SECTION_DURATIONS.preChorus * BEAT_DURATION * 0.5 // Last until chorus
        );
        
        riser.noiseSource.connect(riser.filter);
        riser.filter.connect(riser.noiseGain);
        riser.noiseGain.connect(masterGain);
        
        riser.noiseSource.start(sectionTimes.preChorus + SECTION_DURATIONS.preChorus * BEAT_DURATION * 0.5);
        riser.noiseSource.stop(sectionTimes.chorus);
        
        activeAudioNodes.current.push(riser.filter, riser.noiseGain);
      }
      
      // ===== 4. CHORUS DROP SECTION =====
      // Full synth lead melody, sidechained bass, full drums
      {
        // Full energy lead synth with the main hook melody
        const { oscillator, gainNode } = createSynthLead(
          context,
          LEAD_HOOK_MELODY.concat(LEAD_HOOK_MELODY), // Double the hook for the full chorus
          sectionTimes.chorus,
          BEAT_DURATION / 2, // Eighth notes for chorus lead
          0.4 // Full volume for chorus
        );
        
        // Add slight distortion for edge
        const waveshaper = context.createWaveShaper();
        const curve = new Float32Array(2);
        curve[0] = -1;
        curve[1] = 1;
        waveshaper.curve = curve;
        waveshaper.oversample = '4x';
        
        oscillator.connect(waveshaper);
        waveshaper.connect(gainNode);
        gainNode.connect(masterGain);
        
        oscillator.start(sectionTimes.chorus);
        oscillator.stop(sectionTimes.bridge);
        
        activeOscillators.current.push(oscillator);
        activeAudioNodes.current.push(gainNode, waveshaper);
        
        // Full rhythm section - kick
        for (let i = 0; i < SECTION_DURATIONS.chorus; i++) {
          const beat = i % 4;
          if (beat === 0) { // Four-on-the-floor
            const kickTime = sectionTimes.chorus + i * BEAT_DURATION;
            const { oscillator, gainNode } = createKick(context, kickTime, 0.9);
            
            oscillator.connect(gainNode);
            gainNode.connect(masterGain);
            
            oscillator.start(kickTime);
            oscillator.stop(kickTime + 0.2);
            
            activeOscillators.current.push(oscillator);
            activeAudioNodes.current.push(gainNode);
          }
        }
        
        // Snare/clap on beats 2 and 4
        for (let i = 0; i < SECTION_DURATIONS.chorus; i++) {
          const beat = i % 4;
          if (beat === 1 || beat === 3) { // Beats 2 and 4
            const snareTime = sectionTimes.chorus + i * BEAT_DURATION;
            const { noiseSource, noiseGain, oscillator, gainNode } = createSnareClap(context, snareTime, 0.5);
            
            noiseSource.connect(noiseGain);
            noiseGain.connect(masterGain);
            oscillator.connect(gainNode);
            gainNode.connect(masterGain);
            
            noiseSource.start(snareTime);
            noiseSource.stop(snareTime + 0.2);
            oscillator.start(snareTime);
            oscillator.stop(snareTime + 0.1);
            
            activeOscillators.current.push(oscillator);
            activeAudioNodes.current.push(noiseGain, gainNode);
          }
        }
        
        // Hi-hats with rolls (16th notes)
        for (let bar = 0; bar < SECTION_DURATIONS.chorus / 4; bar++) {
          // Use roll pattern toward end of each 2-bar section
          const patternToUse = bar % 2 === 1 ? HIHAT_PATTERN_ROLLS : HIHAT_PATTERN_BASIC;
          
          for (let i = 0; i < 16; i++) {
            const hiHatTime = sectionTimes.chorus + (bar * 4 * BEAT_DURATION) + (i * SIXTEENTH_NOTE);
            
            // Use different volumes for accent patterns
            const volume = patternToUse[i] || 0;
            if (volume === 0) continue;
            
            const { noiseSource, gainNode } = createHiHat(context, hiHatTime, volume, 0.04);
            
            noiseSource.connect(gainNode);
            gainNode.connect(masterGain);
            
            noiseSource.start(hiHatTime);
            noiseSource.stop(hiHatTime + 0.1);
            
            activeAudioNodes.current.push(gainNode);
          }
        }
        
        // Heavy sidechained bass for chorus
        for (let bar = 0; bar < SECTION_DURATIONS.chorus / 4; bar++) {
          for (let i = 0; i < 16; i++) {
            const freq = BASS_PATTERN_CHORUS[i];
            if (freq === 0) continue; // Skip rests
            
            const noteTime = sectionTimes.chorus + (bar * 4 * BEAT_DURATION) + (i * SIXTEENTH_NOTE);
            const { oscillator, filter, gainNode } = createSidechainedBass(
              context,
              freq,
              noteTime,
              SIXTEENTH_NOTE * 3.5, // Longer sustain for chorus
              0.5 // Louder bass for chorus
            );
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(masterGain);
            
            oscillator.start(noteTime);
            oscillator.stop(noteTime + SIXTEENTH_NOTE * 4);
            
            activeOscillators.current.push(oscillator);
            activeAudioNodes.current.push(filter, gainNode);
          }
        }
        
        // Add chorus chord stabs
        for (let i = 0; i < SECTION_DURATIONS.chorus / 4; i++) {
          const chordStartTime = sectionTimes.chorus + i * 4 * BEAT_DURATION;
          
          // Use the chorus chord progression (AM - F - C - G)
          for (let j = 0; j < 4; j++) {
            const chord = [CHORD_AM, CHORD_F, CHORD_C, CHORD_G][j];
            const chordTime = chordStartTime + j * BEAT_DURATION;
            
            // Create a short chord stab
            const { oscillators, gainNodes } = createSynthPad(
              context,
              chord,
              chordTime,
              BEAT_DURATION * 0.7, // Short stab
            );
            
            // Add a filter for tonal shaping
            const filter = context.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 2000;
            filter.Q.value = 1;
            
            // Connect oscillators through gain nodes to filter to master
            gainNodes.forEach(gain => {
              gain.connect(filter);
              activeAudioNodes.current.push(gain);
            });
            
            filter.connect(masterGain);
            activeAudioNodes.current.push(filter);
            
            // Start oscillators
            oscillators.forEach(osc => {
              osc.start(chordTime);
              osc.stop(chordTime + BEAT_DURATION * 0.8);
              activeOscillators.current.push(osc);
            });
          }
        }
      }
      
      // ===== 5. BRIDGE SECTION =====
      // Strip back to pads and arp, reintroduce melody slowly
      {
        // Atmospheric pad chords
        for (let i = 0; i < 3; i++) { // 3 chord changes in bridge
          const chordStartTime = sectionTimes.bridge + i * 8 * BEAT_DURATION;
          
          // Alternate between Fm and C chords for bridge
          const chord = i % 2 === 0 ? [349.23, 415.30, 523.25] : [261.63, 329.63, 392.00]; // F minor and C major
          
          const { oscillators, gainNodes } = createSynthPad(
            context,
            chord,
            chordStartTime,
            8 * BEAT_DURATION, // Long pad
            // Longer durations for bridge pads
          );
          
          // Add a filter
          const filter = context.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(500, chordStartTime);
          filter.frequency.linearRampToValueAtTime(2000, chordStartTime + 8 * BEAT_DURATION);
          
          // Connect
          gainNodes.forEach(gain => {
            gain.connect(filter);
            activeAudioNodes.current.push(gain);
          });
          
          filter.connect(masterGain);
          activeAudioNodes.current.push(filter);
          
          // Start oscillators
          oscillators.forEach(osc => {
            osc.start(chordStartTime);
            osc.stop(chordStartTime + 8 * BEAT_DURATION);
            activeOscillators.current.push(osc);
          });
        }
        
        // Sparse arpeggiator that gradually gets more complex
        for (let bar = 0; bar < SECTION_DURATIONS.bridge / 4; bar++) {
          // As bridge progresses, arp gets more notes
          let arpNotes;
          if (bar < 2) {
            // Sparse in beginning
            arpNotes = [ARP_PATTERN_AM_EM[0], 0, ARP_PATTERN_AM_EM[2], 0, 
                        ARP_PATTERN_AM_EM[4], 0, ARP_PATTERN_AM_EM[6], 0];
          } else if (bar < 4) {
            // More notes in middle
            arpNotes = ARP_PATTERN_AM_EM.slice(0, 8);
          } else {
            // Full pattern at end
            arpNotes = ARP_PATTERN_AM_EM;
          }
          
          const arpStartTime = sectionTimes.bridge + bar * 4 * BEAT_DURATION;
          
          const arpNodes = createArpeggiator(
            context,
            arpNotes,
            arpStartTime,
            SIXTEENTH_NOTE,
            0.1 + (bar / (SECTION_DURATIONS.bridge / 4)) * 0.2 // Gets louder
          );
          
          // Connect
          arpNodes.forEach(({ oscillator, gain }) => {
            gain.connect(masterGain);
            activeAudioNodes.current.push(gain);
          });
        }
        
        // Gradual reintroduction of beat elements
        for (let i = 0; i < SECTION_DURATIONS.bridge; i++) {
          const beatTime = sectionTimes.bridge + i * BEAT_DURATION;
          const progressionRatio = i / SECTION_DURATIONS.bridge; // 0 to 1 as bridge progresses
          
          // Start with just occasional kicks, then build up
          if (i % 4 === 0 || (progressionRatio > 0.5 && i % 2 === 0)) {
            const { oscillator, gainNode } = createKick(
              context, 
              beatTime, 
              0.3 + progressionRatio * 0.6 // Volume increases
            );
            
            oscillator.connect(gainNode);
            gainNode.connect(masterGain);
            
            oscillator.start(beatTime);
            oscillator.stop(beatTime + 0.2);
            
            activeOscillators.current.push(oscillator);
            activeAudioNodes.current.push(gainNode);
          }
          
          // Add snares in second half
          if (progressionRatio > 0.5 && (i % 4 === 2)) {
            const { noiseSource, noiseGain, oscillator, gainNode } = createSnareClap(
              context, 
              beatTime, 
              0.3 + (progressionRatio - 0.5) * 0.6 // Gradually increase volume
            );
            
            noiseSource.connect(noiseGain);
            noiseGain.connect(masterGain);
            oscillator.connect(gainNode);
            gainNode.connect(masterGain);
            
            noiseSource.start(beatTime);
            noiseSource.stop(beatTime + 0.2);
            oscillator.start(beatTime);
            oscillator.stop(beatTime + 0.1);
            
            activeOscillators.current.push(oscillator);
            activeAudioNodes.current.push(noiseGain, gainNode);
          }
        }
        
        // Melody returns in second half of bridge
        const bridgeHalfway = sectionTimes.bridge + SECTION_DURATIONS.bridge * BEAT_DURATION * 0.5;
        const { oscillator, gainNode } = createSynthLead(
          context,
          LEAD_HOOK_MELODY_HIGH.slice(0, 8), // Just first half of melody
          bridgeHalfway,
          BEAT_DURATION / 2, // Eighth notes
          0.2 // Lower volume than chorus
        );
        
        // Add filter for tonal variation
        const filter = context.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3000;
        filter.Q.value = 3;
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(masterGain);
        
        oscillator.start(bridgeHalfway);
        oscillator.stop(sectionTimes.finalChorus);
        
        activeOscillators.current.push(oscillator);
        activeAudioNodes.current.push(gainNode, filter);
        
        // Add rising riser towards end of bridge
        const riser = createPercussionEffect(
          context,
          'riser',
          sectionTimes.finalChorus - 4 * BEAT_DURATION, // 4 beats before final chorus
          4 * BEAT_DURATION
        );
        
        riser.noiseSource.connect(riser.filter);
        riser.filter.connect(riser.noiseGain);
        riser.noiseGain.connect(masterGain);
        
        riser.noiseSource.start(sectionTimes.finalChorus - 4 * BEAT_DURATION);
        riser.noiseSource.stop(sectionTimes.finalChorus);
        
        activeAudioNodes.current.push(riser.filter, riser.noiseGain);
      }
      
      // ===== 6. FINAL CHORUS SECTION =====
      // Similar to first chorus but with extra energy and effects
      {
        // Full energy lead synth with the main hook melody but higher octave
        const { oscillator, gainNode } = createSynthLead(
          context,
          LEAD_HOOK_MELODY_HIGH.concat(LEAD_HOOK_MELODY_HIGH), // Higher octave for climax
          sectionTimes.finalChorus,
          BEAT_DURATION / 2, // Eighth notes
          0.5 // Full volume for final chorus
        );
        
        // Add distortion for final chorus intensity
        const waveshaper = context.createWaveShaper();
        const distortionAmount = 10;
        const curve = new Float32Array(context.sampleRate);
        for (let i = 0; i < curve.length; i++) {
          const x = (i * 2) / curve.length - 1;
          curve[i] = Math.sign(x) * (1 - Math.exp(-3 * Math.abs(x)));
        }
        waveshaper.curve = curve;
        waveshaper.oversample = '4x';
        
        // Create a blend of clean and distorted signals
        const cleanGain = context.createGain();
        cleanGain.gain.value = 0.6;
        
        const distortGain = context.createGain();
        distortGain.gain.value = 0.4;
        
        oscillator.connect(cleanGain);
        oscillator.connect(waveshaper);
        waveshaper.connect(distortGain);
        
        cleanGain.connect(gainNode);
        distortGain.connect(gainNode);
        gainNode.connect(masterGain);
        
        oscillator.start(sectionTimes.finalChorus);
        oscillator.stop(sectionTimes.end);
        
        activeOscillators.current.push(oscillator);
        activeAudioNodes.current.push(gainNode, waveshaper, cleanGain, distortGain);
        
        // Full rhythm section with more energy
        for (let i = 0; i < SECTION_DURATIONS.finalChorus; i++) {
          const beatTime = sectionTimes.finalChorus + i * BEAT_DURATION;
          
          // Every beat gets a kick
          const { oscillator, gainNode } = createKick(context, beatTime, 1.0);
          
          oscillator.connect(gainNode);
          gainNode.connect(masterGain);
          
          oscillator.start(beatTime);
          oscillator.stop(beatTime + 0.2);
          
          activeOscillators.current.push(oscillator);
          activeAudioNodes.current.push(gainNode);
          
          // Beats 2 and 4 get snare
          if (i % 4 === 1 || i % 4 === 3) {
            const { noiseSource, noiseGain, oscillator: snareOsc, gainNode: snareGain } = createSnareClap(
              context,
              beatTime,
              0.7
            );
            
            noiseSource.connect(noiseGain);
            noiseGain.connect(masterGain);
            snareOsc.connect(snareGain);
            snareGain.connect(masterGain);
            
            noiseSource.start(beatTime);
            noiseSource.stop(beatTime + 0.2);
            snareOsc.start(beatTime);
            snareOsc.stop(beatTime + 0.1);
            
            activeOscillators.current.push(snareOsc);
            activeAudioNodes.current.push(noiseGain, snareGain);
          }
        }
        
        // Intense hi-hats with rolls throughout
        for (let bar = 0; bar < SECTION_DURATIONS.finalChorus / 4; bar++) {
          for (let i = 0; i < 16; i++) {
            // Use different volumes and patterns for more energy
            let volume = 0.3;
            
            // Create more rolls and variations
            if (i % 4 === 0) volume = 0.4; // Accent on main beats
            if (bar % 2 === 1 && i >= 8 && i < 12) volume = 0.15; // Quieter for tension
            if (bar % 4 === 3 && i >= 12) volume = 0.5; // Louder for climax
            
            const hiHatTime = sectionTimes.finalChorus + (bar * 4 * BEAT_DURATION) + (i * SIXTEENTH_NOTE);
            
            const { noiseSource, gainNode } = createHiHat(
              context,
              hiHatTime,
              volume,
              0.03 // Shorter for more intensity
            );
            
            noiseSource.connect(gainNode);
            gainNode.connect(masterGain);
            
            noiseSource.start(hiHatTime);
            noiseSource.stop(hiHatTime + 0.08);
            
            activeAudioNodes.current.push(gainNode);
          }
        }
        
        // Maximum energy bass pattern
        for (let bar = 0; bar < SECTION_DURATIONS.finalChorus / 4; bar++) {
          for (let i = 0; i < 16; i++) {
            // Use same pattern as first chorus but with more energy
            const freq = BASS_PATTERN_CHORUS[i];
            if (freq === 0) continue; // Skip rests
            
            const noteTime = sectionTimes.finalChorus + (bar * 4 * BEAT_DURATION) + (i * SIXTEENTH_NOTE);
            
            // Create a more aggressive bass sound for the final chorus
            const { oscillator, filter, gainNode } = createSidechainedBass(
              context,
              freq,
              noteTime,
              SIXTEENTH_NOTE * 3.5,
              0.7 // Maximum volume
            );
            
            // Add a second oscillator for extra thickness
            const oscillator2 = context.createOscillator();
            oscillator2.type = 'square';
            oscillator2.frequency.value = freq * 0.5; // One octave down
            
            const gainNode2 = context.createGain();
            gainNode2.gain.setValueAtTime(0, noteTime);
            gainNode2.gain.linearRampToValueAtTime(0.2, noteTime + 0.02);
            gainNode2.gain.linearRampToValueAtTime(0.1, noteTime + SIXTEENTH_NOTE * 2);
            gainNode2.gain.linearRampToValueAtTime(0, noteTime + SIXTEENTH_NOTE * 3.5);
            
            oscillator.connect(filter);
            oscillator2.connect(filter); // Both oscillators through same filter
            filter.connect(gainNode);
            gainNode.connect(masterGain);
            
            oscillator.start(noteTime);
            oscillator.stop(noteTime + SIXTEENTH_NOTE * 4);
            oscillator2.start(noteTime);
            oscillator2.stop(noteTime + SIXTEENTH_NOTE * 4);
            
            activeOscillators.current.push(oscillator, oscillator2);
            activeAudioNodes.current.push(filter, gainNode, gainNode2);
          }
        }
        
        // Add chord progression but with more aggressive stabs
        for (let i = 0; i < SECTION_DURATIONS.finalChorus / 4; i++) {
          const chordStartTime = sectionTimes.finalChorus + i * 4 * BEAT_DURATION;
          
          // Faster chord changes - every half beat
          for (let j = 0; j < 8; j++) {
            const chordIndex = j % 4;
            const chord = [CHORD_AM, CHORD_F, CHORD_C, CHORD_G][chordIndex];
            const chordTime = chordStartTime + j * BEAT_DURATION / 2;
            
            // Create a very short stab
            const { oscillators, gainNodes } = createSynthPad(
              context,
              chord,
              chordTime,
              BEAT_DURATION * 0.3, // Very short stab
            );
            
            // Add a bandpass filter for tonal shaping
            const filter = context.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 2500;
            filter.Q.value = 2;
            
            // Connect
            gainNodes.forEach(gain => {
              gain.connect(filter);
              activeAudioNodes.current.push(gain);
            });
            
            filter.connect(masterGain);
            activeAudioNodes.current.push(filter);
            
            // Start oscillators
            oscillators.forEach(osc => {
              osc.start(chordTime);
              osc.stop(chordTime + BEAT_DURATION * 0.4);
              activeOscillators.current.push(osc);
            });
          }
        }
        
        // Add some risers and FX throughout
        for (let i = 0; i < 4; i++) {
          const riserStartTime = sectionTimes.finalChorus + i * 8 * BEAT_DURATION;
          
          // Create an upward or downward sweep based on position
          const direction = i % 2 === 0 ? 'riser' : 'downlifter';
          
          const effect = createPercussionEffect(
            context,
            direction as 'riser' | 'downlifter',
            riserStartTime,
            4 * BEAT_DURATION
          );
          
          effect.noiseSource.connect(effect.filter);
          effect.filter.connect(effect.noiseGain);
          effect.noiseGain.connect(masterGain);
          
          effect.noiseSource.start(riserStartTime);
          effect.noiseSource.stop(riserStartTime + 4 * BEAT_DURATION);
          
          activeAudioNodes.current.push(effect.filter, effect.noiseGain);
        }
      }
      
      // Schedule the track to loop seamlessly
      const timerId = setTimeout(() => {
        if (musicEnabled) {
          startBackgroundMusic();
        }
      }, totalDuration * 1000);
      
      // Track the timer ID for clean shutdown
      audioNodesTimers.current.push(timerId);
      
      setMusicInitialized(true);
      
    } catch (error) {
      console.error('Error creating electronic pop music:', error);
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
    // Set the volume for the web audio API
    if (musicGainRef.current) {
      musicGainRef.current.gain.value = Math.max(0, Math.min(1, volume)) * 0.25;
    }
  };
  
  // Clean up when the component unmounts
  useEffect(() => {
    return () => {
      stopMusic();
      
      // Clean up Web Audio API resources
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
      // Clean up Web Audio API oscillators
      activeOscillators.current.forEach(osc => {
        try {
          osc.stop();
        } catch (e) {
          // Ignore already stopped oscillators
        }
      });
      
      // Clean up audio nodes
      activeAudioNodes.current = [];
      
      // Clean up oscillators array
      activeOscillators.current = [];
      
      // Clean up any pending timers
      audioNodesTimers.current.forEach(timer => {
        clearTimeout(timer);
      });
      
      // Clear timer array
      audioNodesTimers.current = [];
      
      console.log('Stopped all audio');
    } catch (error) {
      console.error('Error stopping electronic pop music:', error);
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