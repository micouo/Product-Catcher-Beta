import { useState, useEffect } from "react";
import SnakeGame from "./SnakeGame"; // Assuming SnakeGame component is in the same directory

export default function GameContainer() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleStartClick = () => {
    const button = document.getElementById('start-button') as HTMLButtonElement;
    if (button) {
      button.textContent = 'Game Started!';
      button.classList.add('bg-green-600');
      button.classList.remove('bg-primary');

      // Simulate some game action
      setTimeout(() => {
        button.textContent = 'Start Placeholder';
        button.classList.remove('bg-green-600');
        button.classList.add('bg-primary');
      }, 2000);
    }
  };

  return (
    <div className="bg-game-area rounded-lg shadow-lg overflow-hidden relative" id="game-container">
      {/* Game placeholder with aspect ratio box */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        {/* Game canvas placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Loading state */}
          {isLoading ? (
            <div id="loading-state" className="text-center">
              <div className="loader h-12 w-12 border-4 border-gray-200 rounded-full mx-auto mb-4"></div>
              <p className="text-white font-game text-sm">Loading Game...</p>
            </div>
          ) : (
            /* Game placeholder */
            <SnakeGame className="w-full h-full" />
          )}
        </div>
      </div>
    </div>
  );
}