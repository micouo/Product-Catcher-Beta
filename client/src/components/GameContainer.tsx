import { useState, useEffect } from "react";
import LoadingState from "./LoadingState";
import DropGame from "./game/DropGame";

export default function GameContainer() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentScore, setCurrentScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);

  // Simulate loading time for game assets
  useEffect(() => {
    // In a real app, this would load assets, sounds, etc.
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Handle score updates from the game
  const handleScoreUpdate = (score: number) => {
    setCurrentScore(score);
  };

  // Handle game over event
  const handleGameOver = () => {
    setGameActive(false);
  };

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
          Use your mouse, touch, or arrow keys to move the basket and catch falling products!
        </p>
        
        {/* Responsive control explanation */}
        <div className="mt-2 text-center">
          <span className="inline-block px-3 py-1 bg-gray-700 text-sm text-gray-300 rounded-full mr-2 mb-2">
            <i className="ri-mouse-line mr-1"></i> Mouse
          </span>
          <span className="inline-block px-3 py-1 bg-gray-700 text-sm text-gray-300 rounded-full mr-2 mb-2">
            <i className="ri-keyboard-box-line mr-1"></i> Arrow Keys
          </span>
          <span className="inline-block px-3 py-1 bg-gray-700 text-sm text-gray-300 rounded-full mb-2">
            <i className="ri-smartphone-line mr-1"></i> Touch
          </span>
        </div>
      </div>
    </div>
  );
}
