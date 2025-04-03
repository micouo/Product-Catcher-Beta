export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 py-6 border-t border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-400 text-sm">
              &copy; {currentYear} Game Portal. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-blue-500 transition">
              <i className="ri-twitter-fill text-xl"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-blue-500 transition">
              <i className="ri-discord-fill text-xl"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-blue-500 transition">
              <i className="ri-youtube-fill text-xl"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-blue-500 transition">
              <i className="ri-github-fill text-xl"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
