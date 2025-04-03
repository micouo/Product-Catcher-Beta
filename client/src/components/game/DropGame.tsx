import { useEffect, useRef, useState } from 'react';

interface GameProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: () => void;
}

interface GameObject {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'product' | 'obstacle';
  speed: number;
}

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 80;
const PLAYER_HEIGHT = 30;
const OBJECT_WIDTH = 40;
const OBJECT_HEIGHT = 40;
const SPAWN_RATE = 1000; // ms between spawns
const PRODUCT_PROBABILITY = 0.7; // 70% chance of product, 30% chance of obstacle

export default function DropGame({ onScoreUpdate, onGameOver }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameObjects, setGameObjects] = useState<GameObject[]>([]);
  const [player, setPlayer] = useState<Player>({
    x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: GAME_HEIGHT - PLAYER_HEIGHT - 20,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  });

  // Game loop with animation frame
  useEffect(() => {
    if (!isPlaying) return;

    let animationFrameId: number;
    let lastSpawnTime = Date.now();
    
    const gameLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      
      // Spawn new objects
      const currentTime = Date.now();
      if (currentTime - lastSpawnTime > SPAWN_RATE) {
        const newObject: GameObject = {
          id: Math.random(),
          x: Math.random() * (GAME_WIDTH - OBJECT_WIDTH),
          y: 0,
          width: OBJECT_WIDTH,
          height: OBJECT_HEIGHT,
          type: Math.random() < PRODUCT_PROBABILITY ? 'product' : 'obstacle',
          speed: 2 + Math.random() * 3, // Random speed between 2-5
        };
        
        setGameObjects(prev => [...prev, newObject]);
        lastSpawnTime = currentTime;
      }
      
      // Update objects positions and check collisions
      setGameObjects(prevObjects => {
        const updatedObjects = prevObjects.map(obj => {
          // Update position
          const updatedObj = { ...obj, y: obj.y + obj.speed };
          
          // Check collision with player
          if (
            updatedObj.y + updatedObj.height >= player.y &&
            updatedObj.y <= player.y + player.height &&
            updatedObj.x + updatedObj.width >= player.x &&
            updatedObj.x <= player.x + player.width
          ) {
            // Handle collision based on object type
            if (updatedObj.type === 'product') {
              setScore(prevScore => {
                const newScore = prevScore + 10;
                if (onScoreUpdate) onScoreUpdate(newScore);
                return newScore;
              });
              return { ...updatedObj, y: GAME_HEIGHT + 100 }; // Move it out of the game area
            } else {
              // If obstacle hits player, reduce lives
              setLives(prevLives => {
                if (prevLives <= 1) {
                  endGame();
                  if (onGameOver) onGameOver();
                }
                return prevLives - 1;
              });
              return { ...updatedObj, y: GAME_HEIGHT + 100 }; // Move it out of the game area
            }
          }
          
          // Remove objects that went below the screen
          if (updatedObj.y > GAME_HEIGHT) {
            // If it's a product that player missed, reduce lives
            if (updatedObj.type === 'product') {
              setLives(prevLives => {
                if (prevLives <= 1) {
                  endGame();
                  if (onGameOver) onGameOver();
                }
                return prevLives - 1;
              });
            }
            return { ...updatedObj, y: GAME_HEIGHT + 100 }; // Flag for removal
          }
          
          return updatedObj;
        });
        
        // Filter out objects that are out of the game area
        return updatedObjects.filter(obj => obj.y <= GAME_HEIGHT + 50);
      });
      
      // Draw player
      drawPlayer(ctx);
      
      // Draw objects
      gameObjects.forEach(obj => {
        drawObject(ctx, obj);
      });
      
      // Draw score and lives
      drawUI(ctx);
      
      // Continue the game loop
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    animationFrameId = requestAnimationFrame(gameLoop);
    
    // Input handler for player movement
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Get the canvas position relative to the viewport
      const rect = canvas.getBoundingClientRect();
      
      // Calculate the mouse position relative to the canvas
      const mouseX = e.clientX - rect.left;
      
      // Update player position, ensuring it stays within the canvas
      setPlayer(prev => ({
        ...prev,
        x: Math.max(0, Math.min(mouseX - prev.width / 2, GAME_WIDTH - prev.width)),
      }));
    };
    
    // Touch handler for mobile
    const handleTouchMove = (e: TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !e.touches[0]) return;
      
      e.preventDefault(); // Prevent scrolling
      
      const rect = canvas.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      
      setPlayer(prev => ({
        ...prev,
        x: Math.max(0, Math.min(touchX - prev.width / 2, GAME_WIDTH - prev.width)),
      }));
    };
    
    // Keyboard handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setPlayer(prev => ({
          ...prev,
          x: Math.max(0, prev.x - 20),
        }));
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        setPlayer(prev => ({
          ...prev,
          x: Math.min(GAME_WIDTH - prev.width, prev.x + 20),
        }));
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, player, gameObjects]);
  
  // Start game
  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setLives(3);
    setGameObjects([]);
  };
  
  // End game
  const endGame = () => {
    setIsPlaying(false);
    setHighScore(prev => Math.max(prev, score));
  };
  
  // Draw player
  const drawPlayer = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#3B82F6'; // Blue color
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw a basket shape
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + player.width / 3, player.y - 10);
    ctx.lineTo(player.x + (player.width * 2) / 3, player.y - 10);
    ctx.lineTo(player.x + player.width, player.y);
    ctx.closePath();
    ctx.fillStyle = '#2563EB'; // Darker blue
    ctx.fill();
  };
  
  // Draw game objects
  const drawObject = (ctx: CanvasRenderingContext2D, obj: GameObject) => {
    if (obj.type === 'product') {
      // Draw a star shape for products
      ctx.fillStyle = '#10B981'; // Emerald color for products
      const centerX = obj.x + obj.width / 2;
      const centerY = obj.y + obj.height / 2;
      const spikes = 5;
      const outerRadius = obj.width / 2;
      const innerRadius = obj.width / 4;
      
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI / spikes) * i;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      // Draw obstacle as a spiky circle
      ctx.fillStyle = '#EF4444'; // Red color for obstacles
      const centerX = obj.x + obj.width / 2;
      const centerY = obj.y + obj.height / 2;
      const spikes = 8;
      const outerRadius = obj.width / 2;
      const innerRadius = obj.width / 3;
      
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI / spikes) * i;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }
  };
  
  // Draw UI elements
  const drawUI = (ctx: CanvasRenderingContext2D) => {
    // Draw score
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 30);
    
    // Draw high score
    ctx.textAlign = 'center';
    ctx.fillText(`High Score: ${highScore}`, GAME_WIDTH / 2, 30);
    
    // Draw lives
    ctx.textAlign = 'right';
    ctx.fillText(`Lives: ${lives}`, GAME_WIDTH - 20, 30);
  };
  
  return (
    <div className="game-container relative">
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="border-2 border-gray-700 bg-gray-900 max-w-full h-auto"
      />
      
      {!isPlaying && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-80">
          <h2 className="text-3xl font-game text-blue-500 mb-4">
            {score > 0 ? 'Game Over!' : 'Product Catcher'}
          </h2>
          {score > 0 && (
            <p className="text-2xl text-white mb-4">Your Score: {score}</p>
          )}
          <button
            onClick={startGame}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-md transition shadow-md flex items-center text-lg"
          >
            <i className="ri-play-fill mr-2"></i> {score > 0 ? 'Play Again' : 'Start Game'}
          </button>
          
          <div className="mt-8 text-gray-300 text-center max-w-md">
            <p className="mb-2"><b>How to Play:</b></p>
            <p className="mb-1">• Catch the green products with your basket</p>
            <p className="mb-1">• Avoid the red obstacles</p>
            <p className="mb-1">• Move using mouse, touch, or arrow keys</p>
            <p className="mb-1">• Missing products costs you a life</p>
          </div>
        </div>
      )}
    </div>
  );
}