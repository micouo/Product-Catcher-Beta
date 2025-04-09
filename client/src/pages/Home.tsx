import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import homepageImage from "@assets/homepage.png";

export default function Home() {
  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen flex flex-col">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col items-center justify-center">
        <div className="text-center w-full max-w-5xl">
          {/* Hero image from the assets */}
          <div className="mb-8">
            <img 
              src={homepageImage} 
              alt="District Driver Game" 
              className="w-full h-auto rounded-lg shadow-2xl border border-gray-700"
            />
          </div>
          
          {/* Main title and CTA */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-game text-blue-600 mb-6 px-4 py-2">
            District Driver
          </h1>
          
          <p className="text-gray-300 max-w-2xl mx-auto mb-10 text-lg">
            Race through the busy streets of the University District! Collect items, dodge obstacles, 
            and earn discounts at local shops.
          </p>
          
          {/* Play Now button */}
          <Link href="/game">
            <div className="inline-block px-12 py-5 text-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg 
              shadow-lg hover:from-blue-700 hover:to-purple-700 transition duration-300 transform hover:scale-105 cursor-pointer">
              Play Now
            </div>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
