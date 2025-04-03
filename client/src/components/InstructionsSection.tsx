import { useState } from 'react';

export default function InstructionsSection() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">How To Play</h2>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-blue-400 hover:text-blue-300 transition"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      </div>
      
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${expanded ? '' : 'md:grid-rows-1'}`}>
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
              1
            </div>
            <h3 className="font-bold text-white">Move Your Basket</h3>
          </div>
          <p className="text-gray-400">
            Use arrow keys or A/D keys to move the basket. On mobile, tap the left or right side of the screen to move in that direction.
          </p>
        </div>
        
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold mr-3">
              2
            </div>
            <h3 className="font-bold text-white">Catch Products</h3>
          </div>
          <p className="text-gray-400">
            Catch the green star-shaped products in your basket to earn points. Each product is worth 10 points!
          </p>
        </div>
        
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold mr-3">
              3
            </div>
            <h3 className="font-bold text-white">Avoid Obstacles</h3>
          </div>
          <p className="text-gray-400">
            Avoid the red spiky obstacles. Hitting them will cost you a life! You start with 3 lives.
          </p>
        </div>
      </div>
      
      {expanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold mr-3">
                4
              </div>
              <h3 className="font-bold text-white">Watch Your Lives</h3>
            </div>
            <p className="text-gray-400">
              Missing a product will also cost you a life! The game ends when you run out of lives. Try to get the highest score possible!
            </p>
          </div>
          
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold mr-3">
                5
              </div>
              <h3 className="font-bold text-white">Beat Your High Score</h3>
            </div>
            <p className="text-gray-400">
              Your high score is saved during your session. Challenge yourself to beat your own records each time you play!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}