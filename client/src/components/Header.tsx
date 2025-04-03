import { Link } from "wouter";

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <div className="text-3xl font-bold font-game text-primary">
              Game<span className="text-secondary">Portal</span>
            </div>
          </div>
          <nav className="flex space-x-6">
            <Link href="/">
              <a className="text-text-main hover:text-primary font-medium">Home</a>
            </Link>
            <Link href="/games">
              <a className="text-text-main hover:text-primary font-medium">Games</a>
            </Link>
            <Link href="/about">
              <a className="text-text-main hover:text-primary font-medium">About</a>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
