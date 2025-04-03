import { useState } from 'react';

export default function InstructionsSection() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleInstructions = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
      <div 
        className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 cursor-pointer" 
        onClick={toggleInstructions}
      >
        <h3 className="font-game text-lg text-emerald-500">Game Instructions</h3>
        <button className="text-gray-400 hover:text-white transition p-1">
          <i className={`ri-arrow-${isOpen ? 'up' : 'down'}-s-line text-xl`}></i>
        </button>
      </div>
      
      {isOpen && (
        <div className="p-5 bg-gray-800">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-amber-500 mb-2 flex items-center">
                <i className="ri-gamepad-line mr-2"></i> Controls
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-300 ml-4">
                <li>Use <span className="px-2 py-1 bg-gray-700 rounded text-xs">WASD</span> or arrow keys to move</li>
                <li>Press <span className="px-2 py-1 bg-gray-700 rounded text-xs">SPACE</span> to jump/interact</li>
                <li>Press <span className="px-2 py-1 bg-gray-700 rounded text-xs">E</span> to use items</li>
                <li>Press <span className="px-2 py-1 bg-gray-700 rounded text-xs">ESC</span> to pause the game</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-amber-500 mb-2 flex items-center">
                <i className="ri-trophy-line mr-2"></i> Objective
              </h4>
              <p className="text-gray-300 ml-4">
                Collect all the items and reach the finish line before time runs out. Watch out for obstacles!
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-amber-500 mb-2 flex items-center">
                <i className="ri-information-line mr-2"></i> Tips
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-300 ml-4">
                <li>Special power-ups appear every 30 seconds</li>
                <li>Bonus points for completing levels quickly</li>
                <li>Save your progress by reaching checkpoints</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
