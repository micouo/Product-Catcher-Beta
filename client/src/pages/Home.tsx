import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import homepageImage from "@assets/homepage.png";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  
  const [isReady, setIsReady] = useState(false);
  
  // Initialize animation after component mounts
  useEffect(() => {
    // Set a short delay to ensure initial rendering is complete
    const timer = setTimeout(() => {
      setIsReady(true);
      
      // Force a small scroll to trigger the animation if the page is already visible
      if (window.scrollY === 0) {
        window.scrollTo(0, 10);
        setTimeout(() => window.scrollTo(0, 0), 100);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Scroll-based animations
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  // Transform values based on scroll - elements will appear from under the image position
  const titleOpacity = useTransform(scrollYProgress, [0, 0.15], [0, 1]);
  const titleY = useTransform(scrollYProgress, [0, 0.15], [-50, 0]);
  
  const descriptionOpacity = useTransform(scrollYProgress, [0.05, 0.2], [0, 1]);
  const descriptionY = useTransform(scrollYProgress, [0.05, 0.2], [-50, 0]);
  
  const buttonOpacity = useTransform(scrollYProgress, [0.1, 0.25], [0, 1]);
  const buttonY = useTransform(scrollYProgress, [0.1, 0.25], [-50, 0]);
  
  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen flex flex-col">
      <Header />
      <main ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col items-center justify-center relative">
        <div className="text-center w-full max-w-5xl">
          {/* Hero image from the assets */}
          <div className="mb-8 relative" ref={imageRef}>
            <img 
              src={homepageImage} 
              alt="District Driver Game" 
              className="w-full h-auto rounded-lg shadow-2xl border border-gray-700"
            />
          </div>
          
          {/* Main title - animated */}
          {isReady && (
            <motion.h1 
              ref={titleRef}
              className="text-4xl sm:text-5xl md:text-6xl font-game text-blue-600 mb-6 px-4 py-2"
              style={{ 
                opacity: titleOpacity,
                y: titleY
              }}
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              District Driver
            </motion.h1>
          )}
          
          {/* Description - animated */}
          {isReady && (
            <motion.p 
              ref={descriptionRef}
              className="text-gray-300 max-w-2xl mx-auto mb-10 text-lg"
              style={{ 
                opacity: descriptionOpacity,
                y: descriptionY
              }}
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Race through the busy streets of the University District! Collect items, dodge obstacles, 
              and earn discounts at local shops.
            </motion.p>
          )}
          
          {/* Play Now button - animated */}
          {isReady && (
            <motion.div
              ref={buttonRef}
              style={{ 
                opacity: buttonOpacity,
                y: buttonY
              }}
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link href="/game">
                <div className="inline-block px-12 py-5 text-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg 
                  shadow-lg hover:from-blue-700 hover:to-purple-700 transition duration-300 transform hover:scale-105 cursor-pointer">
                  Play Now
                </div>
              </Link>
            </motion.div>
          )}
          
          {/* Game Features section - adds more content for scrolling */}
          <div className="mt-24 mb-16">
            <h2 className="text-3xl font-bold text-blue-500 mb-12">Game Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <motion.div 
                className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Fast-Paced Action</h3>
                <p className="text-gray-400">
                  Test your reflexes in this exciting arcade-style game with smooth controls and challenging gameplay.
                </p>
              </motion.div>
              
              {/* Feature 2 */}
              <motion.div 
                className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Earn Real Rewards</h3>
                <p className="text-gray-400">
                  Score 200+ points to unlock exclusive 5% discounts at participating University District stores.
                </p>
              </motion.div>
              
              {/* Feature 3 */}
              <motion.div 
                className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Compete for High Scores</h3>
                <p className="text-gray-400">
                  Challenge your friends and compete for the top spot on our global leaderboard.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
