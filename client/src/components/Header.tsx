import { Link } from "wouter";
import carIconImage from "@assets/image_1744163026077.png";

export default function Header() {
  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <span className="mr-3 flex items-center">
                  <img src={carIconImage} alt="Car icon" className="h-10 w-auto" />
                </span>
                <span className="font-bold text-xl text-white">District Driver</span>
              </div>
            </Link>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center">
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <Link href="/">
                    <span className="text-white hover:text-blue-400 transition cursor-pointer">Home</span>
                  </Link>
                </li>
                <li>
                  <Link href="/game">
                    <span className="text-white hover:text-blue-400 transition cursor-pointer">Play</span>
                  </Link>
                </li>
                <li>
                  <a 
                    href="/game#instructions"
                    className="text-white hover:text-blue-400 transition cursor-pointer"
                    onClick={(e) => {
                      // Check if already on the game page
                      if (window.location.pathname === '/game') {
                        e.preventDefault();
                        // Scroll to the instructions section
                        document.getElementById('instructions')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    How to Play
                  </a>
                </li>
                <li>
                  <a 
                    href="/game#upcoming-features"
                    className="text-white hover:text-blue-400 transition cursor-pointer"
                    onClick={(e) => {
                      // Check if already on the game page
                      if (window.location.pathname === '/game') {
                        e.preventDefault();
                        // Scroll to the upcoming features section
                        document.getElementById('upcoming-features')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    Coming Soon
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}