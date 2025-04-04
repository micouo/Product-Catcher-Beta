import { useState, useEffect } from "react";
import LoadingState from "./LoadingState";
import DropGame from "./game/DropGame";
import CharacterSelector, { HairStyle } from "./CharacterSelector";

export default function GameContainer() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentScore, setCurrentScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [selectedHair, setSelectedHair] = useState<HairStyle>('short');
  const [showCharacterSelect, setShowCharacterSelect] = useState(true);

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
    setShowCharacterSelect(true);
  };
  
  // Handle hair style selection
  const handleHairSelect = (hairStyle: HairStyle) => {
    setSelectedHair(hairStyle);
  };
  
  // Handle start game after character selection
  const handleStartGame = () => {
    setShowCharacterSelect(false);
    setGameActive(true);
    // Reset score when starting a new game from character select
    setCurrentScore(0);
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden mb-8">
      {/* Game area */}
      <div id="game-area" className="relative bg-gray-900 flex items-center justify-center border-2 border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="h-80 sm:h-96 md:h-[450px] lg:h-[500px] flex items-center justify-center">
            <LoadingState />
          </div>
        ) : showCharacterSelect ? (
          <div className="h-80 sm:h-96 md:h-[450px] lg:h-[500px] w-full flex items-center justify-center p-4">
            <div className="w-full max-w-3xl">
              <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-6">
                Customize Your Character
              </h1>
              
              <CharacterSelector 
                onSelect={handleHairSelect}
                selectedHair={selectedHair}
              />
              
              <div className="mt-6 text-center">
                <button
                  onClick={handleStartGame}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-md text-lg transition-colors duration-200"
                >
                  Start Game!
                </button>
              </div>
            </div>
          </div>
        ) : (
          <DropGame 
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            selectedHair={selectedHair}
          />
        )}
      </div>

      {/* Game controls and info */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        {!showCharacterSelect && (
          <>
            {/* Current score display */}
            <div className="mb-3 text-center">
              <p className="text-white font-bold">
                Current Score: <span className="text-blue-400">{currentScore}</span>
              </p>
            </div>
            
            {/* Info text */}
            <p className="text-gray-400 text-sm text-center mb-4">
              Move freely in any direction with keyboard or touch to catch products and avoid obstacles!
            </p>
            
            {/* Responsive control explanation */}
            <div className="mt-2 text-center">
              <span className="inline-block px-3 py-1 bg-gray-700 text-sm text-gray-300 rounded-full mr-2 mb-2">
                <i className="ri-arrow-up-down-line mr-1"></i><i className="ri-arrow-left-right-line mr-1"></i> Arrow Keys
              </span>
              <span className="inline-block px-3 py-1 bg-gray-700 text-sm text-gray-300 rounded-full mr-2 mb-2">
                <i className="ri-keyboard-box-line mr-1"></i> WASD Keys
              </span>
              <span className="inline-block px-3 py-1 bg-gray-700 text-sm text-gray-300 rounded-full mb-2">
                <i className="ri-smartphone-line mr-1"></i> Tap Anywhere
              </span>
            </div>
          </>
        )}
        
        {showCharacterSelect && (
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Choose your favorite hairstyle before starting the game!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
