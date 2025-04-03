import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="text-lg font-game">Skyfall<span className="text-secondary">Snake</span></span>
            <p className="text-gray-400 text-sm mt-1">© {new Date().getFullYear()} All rights reserved</p>
          </div>
          <div className="flex space-x-6">
            <Link href="/privacy">
              <span className="text-gray-300 hover:text-white transition-colors cursor-pointer">Privacy</span>
            </Link>
            <Link href="/terms">
              <span className="text-gray-300 hover:text-white transition-colors cursor-pointer">Terms</span>
            </Link>
            <Link href="/contact">
              <span className="text-gray-300 hover:text-white transition-colors cursor-pointer">Contact</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
