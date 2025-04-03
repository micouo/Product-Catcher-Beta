import { Link } from "wouter";

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <div className="text-3xl font-bold font-game text-primary">
              Skyfall<span className="text-secondary">Snake</span>
            </div>
          </div>
          <nav className="flex space-x-6">
            <Link href="/">
              <span className="text-text-main hover:text-primary font-medium cursor-pointer">Home</span>
            </Link>
            <Link href="/how-to-play">
              <span className="text-text-main hover:text-primary font-medium cursor-pointer">How to Play</span>
            </Link>
            <Link href="/about">
              <span className="text-text-main hover:text-primary font-medium cursor-pointer">About</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
