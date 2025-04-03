import { useState } from 'react';

interface InstructionItem {
  id: number;
  title: string;
  content: React.ReactNode;
}

export default function InstructionsSection() {
  const [openSection, setOpenSection] = useState<number | null>(null);

  const instructions: InstructionItem[] = [
    {
      id: 1,
      title: "Getting Started",
      content: (
        <>
          <p className="text-gray-600 mb-3">Welcome to our game! Here's how to get started:</p>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Press the Start button to begin</li>
            <li>Use arrow keys to navigate through the game world</li>
            <li>Press Space to interact with elements</li>
            <li>Complete objectives to advance to the next level</li>
          </ol>
        </>
      ),
    },
    {
      id: 2,
      title: "Game Objectives",
      content: (
        <>
          <p className="text-gray-600 mb-3">The main objectives of the game are:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Collect all key items in each level</li>
            <li>Avoid obstacles and enemies</li>
            <li>Reach the exit point before time runs out</li>
            <li>Achieve high scores for bonus content</li>
          </ul>
        </>
      ),
    },
    {
      id: 3,
      title: "Tips & Tricks",
      content: (
        <>
          <p className="text-gray-600 mb-3">Here are some helpful tips to improve your gameplay:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Look for hidden paths and secret areas</li>
            <li>Save power-ups for challenging sections</li>
            <li>Learn enemy movement patterns</li>
            <li>Practice timing for precision jumps</li>
          </ul>
        </>
      ),
    },
  ];

  const toggleSection = (id: number) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <section className="mb-12">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold font-heading mb-4">How to Play</h2>
          
          {/* Accordion for instructions */}
          <div className="space-y-4" id="instructions-accordion">
            {instructions.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button 
                  className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  onClick={() => toggleSection(item.id)}
                >
                  <span className="font-semibold">{item.title}</span>
                  <svg 
                    className={`w-5 h-5 transform transition-transform ${openSection === item.id ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                <div className={`p-4 border-t border-gray-200 ${openSection === item.id ? '' : 'hidden'}`}>
                  {item.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
