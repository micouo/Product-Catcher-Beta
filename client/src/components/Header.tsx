import { Link } from "wouter";

export default function Header() {
  return (
    <header className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <i className="ri-gamepad-line text-3xl text-blue-500 mr-3"></i>
          <h1 className="text-xl sm:text-2xl font-game text-blue-500 tracking-wider">GAME PORTAL</h1>
        </div>
        <nav>
          <ul className="flex space-x-4 text-sm">
            <li>
              <Link href="/">
                <a className="py-2 px-3 rounded hover:bg-gray-700 transition">Home</a>
              </Link>
            </li>
            <li>
              <Link href="/games">
                <a className="py-2 px-3 rounded hover:bg-gray-700 transition">Games</a>
              </Link>
            </li>
            <li>
              <Link href="/about">
                <a className="py-2 px-3 rounded hover:bg-gray-700 transition">About</a>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
