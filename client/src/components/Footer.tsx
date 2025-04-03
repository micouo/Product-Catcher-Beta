import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="text-lg font-game">Game<span className="text-secondary">Portal</span></span>
            <p className="text-gray-400 text-sm mt-1">© {new Date().getFullYear()} All rights reserved</p>
          </div>
          <div className="flex space-x-6">
            <Link href="/privacy">
              <a className="text-gray-300 hover:text-white transition-colors">Privacy</a>
            </Link>
            <Link href="/terms">
              <a className="text-gray-300 hover:text-white transition-colors">Terms</a>
            </Link>
            <Link href="/contact">
              <a className="text-gray-300 hover:text-white transition-colors">Contact</a>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
