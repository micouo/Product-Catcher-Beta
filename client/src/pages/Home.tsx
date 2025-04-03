import Header from "@/components/Header";
import GameContainer from "@/components/GameContainer";
import GameControls from "@/components/GameControls";
import InstructionsSection from "@/components/InstructionsSection";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <section className="mb-12">
          <div className="mb-6">
            <h1 className="text-3xl font-bold font-heading mb-2">Welcome to the Game</h1>
            <p className="text-gray-600">Get ready for an exciting gaming experience!</p>
          </div>
          
          <GameContainer />
          <GameControls />
        </section>
        
        <InstructionsSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
