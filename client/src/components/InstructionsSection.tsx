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
            <h3 className="font-bold text-white">Drive Your Car</h3>
          </div>
          <p className="text-gray-400">
            Use arrow keys or WASD keys to move freely in any direction.
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
            Catch products from the University District in your basket to earn points. Each product is worth 10 points!
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
              <h3 className="font-bold text-white">Win Rewards</h3>
            </div>
            <p className="text-gray-400">
              Hit 200 points to unlock a special discount! You can earn a 5% discount on your next purchase at participating stores in the University District.
            </p>
          </div>
          
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold mr-3">
                5
              </div>
              <h3 className="font-bold text-white">Special Controls</h3>
            </div>
            <p className="text-gray-400">
              Hold SHIFT key to boost your speed! Press ESC to pause/unpause the game, and press R to restart at any time.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}