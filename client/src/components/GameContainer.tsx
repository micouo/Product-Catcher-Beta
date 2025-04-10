import { useState, useEffect } from "react";
import LoadingState from "./LoadingState";
import DropGame from "./game/DropGame";
import { useSound } from "../hooks/use-sound";

export default function GameContainer() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentScore, setCurrentScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const { initializeAudio, startMusic } = useSound();
  const [isGameFocused, setIsGameFocused] = useState(false);

  // Simulate loading time for game assets
  useEffect(() => {
    // In a real app, this would load assets, sounds, etc.
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Initialize audio after loading completes
      initializeAudio();
      
      // Small delay to ensure audio context is ready
      setTimeout(() => {
        startMusic();
      }, 100);
    }, 1500);
    
    return () => {
      clearTimeout(timer);
    };
  }, [initializeAudio, startMusic]);

  // Handle score updates from the game
  const handleScoreUpdate = (score: number) => {
    setCurrentScore(score);
    // Ensure game is marked as active when score updates are happening
    if (!gameActive && score > 0) {
      setGameActive(true);
    }
  };

  // Handle game over event
  const handleGameOver = () => {
    setGameActive(false);
  };
  
  // Handle game start event
  const handleGameStart = () => {
    setGameActive(true);
  };
  
  // Add an event listener for the first user interaction
  useEffect(() => {
    const startAudioOnInteraction = () => {
      // Initialize audio and start music on first user interaction
      initializeAudio();
      startMusic();
      
      // Remove the event listeners after first interaction
      document.removeEventListener('click', startAudioOnInteraction);
      document.removeEventListener('keydown', startAudioOnInteraction);
      document.removeEventListener('touchstart', startAudioOnInteraction);
    };
    
    // Add event listeners for user interaction
    document.addEventListener('click', startAudioOnInteraction);
    document.addEventListener('keydown', startAudioOnInteraction);
    document.addEventListener('touchstart', startAudioOnInteraction);
    
    return () => {
      // Clean up event listeners
      document.removeEventListener('click', startAudioOnInteraction);
      document.removeEventListener('keydown', startAudioOnInteraction);
      document.removeEventListener('touchstart', startAudioOnInteraction);
    };
  }, [initializeAudio, startMusic]);
  
  // Prevent arrow keys from scrolling the page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling behavior for arrow keys
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.key)) {
        e.preventDefault();
      }
    };
    
    // Add global event listener when game is active
    if (!isLoading && gameActive) {
      document.addEventListener('keydown', handleKeyDown);
      setIsGameFocused(true);
    } else {
      setIsGameFocused(false);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLoading, gameActive]);

  return (
    <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden mb-8">
      {/* Game area */}
      <div id="game-area" className="relative bg-gray-900 flex items-center justify-center border-2 border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="h-80 sm:h-96 md:h-[450px] lg:h-[500px] flex items-center justify-center">
            <LoadingState />
          </div>
        ) : (
          <DropGame 
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onGameStart={handleGameStart}
          />
        )}
      </div>

      {/* Game controls and info */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        {/* Current score display */}
        <div className="mb-3 text-center">
          <p className="text-white font-bold">
            Current Score: <span className="text-blue-400">{currentScore}</span>
          </p>
        </div>
        
        {/* Info text */}
        <p className="text-gray-400 text-sm text-center mb-4">
          Drive your car to catch University District products! Score 200+ points for a 5% discount reward!
        </p>
        
        {/* Responsive control explanation */}
        <div className="mt-2 text-center">
          <span className="inline-block px-3 py-1 bg-gray-700 text-sm text-gray-300 rounded-full mr-2 mb-2">
            <i className="ri-arrow-up-down-line mr-1"></i><i className="ri-arrow-left-right-line mr-1"></i> Arrow Keys
          </span>
          <span className="inline-block px-3 py-1 bg-gray-700 text-sm text-gray-300 rounded-full mr-2 mb-2">
            <i className="ri-keyboard-box-line mr-1"></i> WASD Keys
          </span>
          <span className="inline-block px-3 py-1 bg-gray-700 text-sm text-gray-300 rounded-full mr-2 mb-2">
            <i className="ri-speed-line mr-1"></i> SHIFT for Boost
          </span>
        </div>
      </div>
    </div>
  );
}
