import { useSound } from '../hooks/use-sound';
import { useEffect } from 'react';
import { VolumeX, Volume2, Music, Music3 } from 'lucide-react';

interface SoundControlsProps {
  className?: string;
}

export default function SoundControls({ className = '' }: SoundControlsProps) {
  const { 
    soundEnabled, 
    musicEnabled, 
    toggleSound, 
    toggleMusic, 
    initializeAudio 
  } = useSound();

  // Initialize audio on first user interaction
  useEffect(() => {
    const handleInitialInteraction = () => {
      initializeAudio();
      // Remove event listeners after first interaction
      document.removeEventListener('click', handleInitialInteraction);
      document.removeEventListener('keydown', handleInitialInteraction);
      document.removeEventListener('touchstart', handleInitialInteraction);
    };

    document.addEventListener('click', handleInitialInteraction);
    document.addEventListener('keydown', handleInitialInteraction);
    document.addEventListener('touchstart', handleInitialInteraction);

    return () => {
      document.removeEventListener('click', handleInitialInteraction);
      document.removeEventListener('keydown', handleInitialInteraction);
      document.removeEventListener('touchstart', handleInitialInteraction);
    };
  }, [initializeAudio]);

  return (
    <div className={`flex items-center ${className}`}>
      <button
        onClick={toggleSound}
        className="p-2 rounded-full text-white hover:bg-gray-700 transition-colors focus:outline-none mx-1"
        aria-label={soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
        title={soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
      >
        {soundEnabled ? (
          <Volume2 className="w-5 h-5 text-blue-400" />
        ) : (
          <VolumeX className="w-5 h-5 text-gray-400" />
        )}
      </button>

      <button
        onClick={toggleMusic}
        className="p-2 rounded-full text-white hover:bg-gray-700 transition-colors focus:outline-none mx-1"
        aria-label={musicEnabled ? 'Mute music' : 'Unmute music'}
        title={musicEnabled ? 'Mute music' : 'Unmute music'}
      >
        {musicEnabled ? (
          <Music3 className="w-5 h-5 text-blue-400" />
        ) : (
          <Music className="w-5 h-5 text-gray-400" />
        )}
      </button>
    </div>
  );
}