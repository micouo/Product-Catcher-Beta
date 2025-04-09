import { Link } from "wouter";
import SoundControls from './SoundControls';
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
          
          {/* Controls and Navigation */}
          <div className="flex items-center space-x-4">
            <SoundControls className="mr-4" />
            
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <Link href="/">
                    <span className="text-white hover:text-blue-400 transition cursor-pointer">Home</span>
                  </Link>
                </li>
                <li>
                  <a href="#game" className="text-white hover:text-blue-400 transition">
                    Play
                  </a>
                </li>
                <li>
                  <a href="#instructions" className="text-white hover:text-blue-400 transition">
                    How to Play
                  </a>
                </li>
                <li>
                  <a href="#upcoming-features" className="text-white hover:text-blue-400 transition">
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