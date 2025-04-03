import Header from "@/components/Header";
import GameContainer from "@/components/GameContainer";
import InstructionsSection from "@/components/InstructionsSection";
import FeaturePreview from "@/components/FeaturePreview";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen flex flex-col">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {/* Game title section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-game bg-gradient-to-r from-blue-500 to-emerald-500 text-transparent bg-clip-text mb-4">
            Product Catcher Challenge
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Test your reflexes in this addictive dropping game! Catch the falling products with your basket 
            while avoiding dangerous obstacles. How high can you score?
          </p>
        </div>

        <div id="game">
          <GameContainer />
        </div>
        
        <div id="instructions">
          <InstructionsSection />
        </div>
        
        <div id="upcoming-features">
          <FeaturePreview />
        </div>
      </main>
      <Footer />
    </div>
  );
}
