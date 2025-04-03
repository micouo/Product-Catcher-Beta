import { useState, useEffect } from "react";
import SkyfallSnakeGame from "./SkyfallSnakeGame";

export default function GameContainer() {
  const [isLoading, setIsLoading] = useState(true);
  const [gameReady, setGameReady] = useState(false);

  useEffect(() => {
    // Simulate loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleStartClick = () => {
    setGameReady(true);
  };

  return (
    <div className="bg-game-area rounded-lg shadow-lg overflow-hidden relative" id="game-container">
      {isLoading ? (
        // Loading state
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div id="loading-state" className="text-center">
              <div className="h-12 w-12 border-4 border-t-primary border-gray-200 rounded-full mx-auto mb-4 animate-spin"></div>
              <p className="text-white font-game text-sm">Loading Skyfall Snake Game...</p>
            </div>
          </div>
        </div>
      ) : gameReady ? (
        // Game is active
        <SkyfallSnakeGame />
      ) : (
        // Start game prompt
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <svg className="w-24 h-24 mb-4 text-primary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"></path>
            </svg>
            <h2 className="font-game text-lg mb-2">Skyfall Snake Game</h2>
            <p className="text-gray-300 text-center max-w-md px-4">
              Dodge obstacles, collect apples, and see how long you can survive!
            </p>
            <button 
              id="start-button" 
              className="mt-6 px-6 py-3 bg-primary hover:bg-primary/90 rounded font-game text-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              onClick={handleStartClick}
            >
              Start Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
