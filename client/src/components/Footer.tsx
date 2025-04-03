export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 border-t border-gray-700 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Logo and copyright */}
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <span className="bg-blue-500 p-1 rounded-md mr-2">
                <i className="ri-gamepad-line text-white text-sm"></i>
              </span>
              <span className="font-bold text-white">ProductCatcher</span>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              &copy; {currentYear} ProductCatcher Game. All rights reserved.
            </p>
          </div>
          
          {/* Links */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
                Game
              </h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-blue-400 transition text-sm">
                    How to Play
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-blue-400 transition text-sm">
                    Upcoming Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-blue-400 transition text-sm">
                    Changelog
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
                Support
              </h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-blue-400 transition text-sm">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-blue-400 transition text-sm">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-blue-400 transition text-sm">
                    Feedback
                  </a>
                </li>
              </ul>
            </div>
            
            <div className="col-span-2 sm:col-span-1">
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
                Connect
              </h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-blue-400 transition">
                  <i className="ri-twitter-x-line text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition">
                  <i className="ri-discord-line text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition">
                  <i className="ri-github-line text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition">
                  <i className="ri-instagram-line text-xl"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}