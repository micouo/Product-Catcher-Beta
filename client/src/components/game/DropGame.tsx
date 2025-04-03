import { useEffect, useRef, useState } from 'react';
import { useSound } from '../../hooks/use-sound';

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
  foodType?: string; // for displaying different food emojis
  speed: number;
}

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  movingLeft: boolean;
  movingRight: boolean;
  movingUp: boolean;
  movingDown: boolean;
  boosting: boolean;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 70; // Increased width for dog sprite
const PLAYER_HEIGHT = 45; // Increased height for dog sprite
const PLAYER_SPEED = 5;
const BOOST_MULTIPLIER = 1.8;
const OBJECT_WIDTH = 40;
const OBJECT_HEIGHT = 40;
const BASE_SPAWN_RATE = 1500; // Starting ms between spawns
const MIN_SPAWN_RATE = 600; // Minimum spawn rate (fastest)
const PRODUCT_PROBABILITY = 0.7; // 70% chance of product, 30% chance of obstacle
const PLAYER_AREA_HEIGHT = 200; // Height of the player movement area - increased for more space
const BASE_OBJECT_SPEED = 2; // Starting speed
const MAX_OBJECT_SPEED = 7; // Maximum object speed
const SPEED_INCREASE_INTERVAL = 10000; // Speed increases every 10 seconds

// Food emojis for products
const FOOD_EMOJIS = ["🍕", "🍜", "🌮", "🍳", "☕", "🍦"];

export default function DropGame({ onScoreUpdate, onGameOver }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const lastSpawnTimeRef = useRef<number>(Date.now());
  const gameStartTimeRef = useRef<number>(0);
  const { playSound, initializeAudio } = useSound();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameObjects, setGameObjects] = useState<GameObject[]>([]);
  const [currentSpawnRate, setCurrentSpawnRate] = useState(BASE_SPAWN_RATE);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [player, setPlayer] = useState<Player>({
    x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: GAME_HEIGHT - PLAYER_HEIGHT - 20,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: PLAYER_SPEED,
    movingLeft: false,
    movingRight: false,
    movingUp: false,
    movingDown: false,
    boosting: false,
  });
  
  // Game loop with animation frame
  useEffect(() => {
    if (!isPlaying) return;
    
    // Function to create game objects
    const createGameObject = (): GameObject => {
      const isProduct = Math.random() < PRODUCT_PROBABILITY;
      const randomFoodIndex = Math.floor(Math.random() * FOOD_EMOJIS.length);
      
      // Apply speed multiplier to make objects faster over time
      const baseSpeed = BASE_OBJECT_SPEED + Math.random() * 3; // Random base speed
      const scaledSpeed = baseSpeed * speedMultiplier; // Apply speed multiplier
      
      return {
        id: Math.random(),
        x: Math.random() * (GAME_WIDTH - OBJECT_WIDTH),
        y: -OBJECT_HEIGHT, // Start above the canvas
        width: OBJECT_WIDTH,
        height: OBJECT_HEIGHT,
        type: isProduct ? 'product' : 'obstacle',
        foodType: isProduct ? FOOD_EMOJIS[randomFoodIndex] : undefined,
        speed: scaledSpeed,
      };
    };
    
    const gameLoop = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      
      // Draw player area border
      drawPlayerArea(ctx);
      
      // Update player position based on direction
      updatePlayerPosition();
      
      // Spawn new objects periodically
      if (Date.now() - lastSpawnTimeRef.current > currentSpawnRate) {
        const newObject = createGameObject();
        setGameObjects(prev => [...prev, newObject]);
        lastSpawnTimeRef.current = Date.now();
      }
      
      // Increase difficulty over time
      const gameTime = Date.now() - gameStartTimeRef.current;
      const timeIntervals = Math.floor(gameTime / SPEED_INCREASE_INTERVAL);
      
      // Update spawn rate and speed multiplier every interval
      if (timeIntervals > 0) {
        // Calculate new spawn rate (gets faster over time)
        const newSpawnRate = Math.max(
          MIN_SPAWN_RATE,
          BASE_SPAWN_RATE - (timeIntervals * 100)
        );
        
        // Calculate new speed multiplier (increases over time)
        const newSpeedMultiplier = Math.min(
          MAX_OBJECT_SPEED / BASE_OBJECT_SPEED,
          1 + (timeIntervals * 0.2)
        );
        
        // Only update if values have changed
        if (newSpawnRate !== currentSpawnRate) {
          setCurrentSpawnRate(newSpawnRate);
        }
        
        if (newSpeedMultiplier !== speedMultiplier) {
          setSpeedMultiplier(newSpeedMultiplier);
        }
      }
      
      // Move existing objects and check collisions
      moveObjectsAndCheckCollisions();
      
      // Draw player
      drawPlayer(ctx);
      
      // Draw objects
      gameObjects.forEach(obj => {
        drawObject(ctx, obj);
      });
      
      // Draw UI elements
      drawUI(ctx);
      
      // Continue the game loop
      requestRef.current = requestAnimationFrame(gameLoop);
    };
    
    // Start the game loop
    requestRef.current = requestAnimationFrame(gameLoop);
    
    // Cleanup on unmount or when game stops
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, player, gameObjects, currentSpawnRate, speedMultiplier]);
  
  // Handle keyboard controls
  useEffect(() => {
    if (!isPlaying) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle each key separately without using else if to allow multiple keys
      switch(e.key) {
        case 'Shift':
          setPlayer(prev => ({ ...prev, boosting: true }));
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setPlayer(prev => ({ ...prev, movingLeft: true }));
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setPlayer(prev => ({ ...prev, movingRight: true }));
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          setPlayer(prev => ({ ...prev, movingUp: true }));
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setPlayer(prev => ({ ...prev, movingDown: true }));
          break;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // Handle each key separately without using else if to allow multiple keys
      switch(e.key) {
        case 'Shift':
          setPlayer(prev => ({ ...prev, boosting: false }));
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setPlayer(prev => ({ ...prev, movingLeft: false }));
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setPlayer(prev => ({ ...prev, movingRight: false }));
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          setPlayer(prev => ({ ...prev, movingUp: false }));
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setPlayer(prev => ({ ...prev, movingDown: false }));
          break;
      }
    };
    
    // Handle touch controls
    const handleTouchStart = (e: TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !e.touches[0]) return;
      
      e.preventDefault(); // Prevent scrolling
      
      const rect = canvas.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      const touchY = e.touches[0].clientY - rect.top;
      
      // Calculate movement directions based on touch position relative to center
      const centerX = GAME_WIDTH / 2;
      const centerY = GAME_HEIGHT / 2;
      
      const moveLeft = touchX < centerX;
      const moveRight = touchX >= centerX;
      const moveUp = touchY < centerY;
      const moveDown = touchY >= centerY;
      
      setPlayer(prev => ({
        ...prev,
        movingLeft: moveLeft,
        movingRight: moveRight,
        movingUp: moveUp,
        movingDown: moveDown
      }));
    };
    
    const handleTouchEnd = () => {
      setPlayer(prev => ({
        ...prev,
        movingLeft: false,
        movingRight: false,
        movingUp: false,
        movingDown: false
      }));
    };
    
    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd);
    }
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      
      if (canvas) {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isPlaying, playSound]);
  
  // Update player position based on movement flags
  const updatePlayerPosition = () => {
    const areaY = GAME_HEIGHT - PLAYER_AREA_HEIGHT;
    
    setPlayer(prev => {
      let newX = prev.x;
      let newY = prev.y;
      
      // Apply horizontal movement
      const currentSpeed = prev.boosting ? prev.speed * BOOST_MULTIPLIER : prev.speed;
      
      if (prev.movingLeft) newX -= currentSpeed;
      if (prev.movingRight) newX += currentSpeed;
      
      // Apply vertical movement
      if (prev.movingUp) newY -= currentSpeed;
      if (prev.movingDown) newY += currentSpeed;
      
      // Clamp to game bounds
      newX = Math.max(0, Math.min(GAME_WIDTH - prev.width, newX));
      newY = Math.max(areaY, Math.min(GAME_HEIGHT - prev.height, newY));
      
      return {
        ...prev,
        x: newX,
        y: newY
      };
    });
  };
  
  // Move objects and check collisions
  const moveObjectsAndCheckCollisions = () => {
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
            // Play collection sound
            playSound('collect');
            
            setScore(prevScore => {
              const newScore = prevScore + 10;
              if (onScoreUpdate) onScoreUpdate(newScore);
              return newScore;
            });
            return { ...updatedObj, y: GAME_HEIGHT + 100 }; // Move it out of the game area
          } else {
            // Play hit sound
            playSound('hit');
            
            // If obstacle hits player, reduce lives
            setLives(prevLives => {
              if (prevLives <= 1) {
                playSound('gameOver');
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
          // Just silently remove objects that go below the screen
          // No sound or penalty for missed products
          return { ...updatedObj, y: GAME_HEIGHT + 100 }; // Flag for removal
        }
        
        return updatedObj;
      });
      
      // Filter out objects that are out of the game area
      return updatedObjects.filter(obj => obj.y <= GAME_HEIGHT + 50);
    });
  };
  
  // Start game
  const startGame = () => {
    // Initialize audio context on game start
    initializeAudio();
    
    // Play start sound
    playSound('start');
    
    // Reset game state
    setIsPlaying(true);
    setScore(0);
    setLives(3);
    setGameObjects([]);
    setCurrentSpawnRate(BASE_SPAWN_RATE);
    setSpeedMultiplier(1.0);
    
    // Reset timers
    lastSpawnTimeRef.current = Date.now();
    gameStartTimeRef.current = Date.now();
  };
  
  // End game
  const endGame = () => {
    setIsPlaying(false);
    setHighScore(prev => Math.max(prev, score));
    
    // Play game over sound
    playSound('gameOver');
  };
  
  // Draw player area border
  const drawPlayerArea = (ctx: CanvasRenderingContext2D) => {
    const areaY = GAME_HEIGHT - PLAYER_AREA_HEIGHT;
    
    // Draw dashed line to show player area
    ctx.setLineDash([10, 5]);
    ctx.strokeStyle = '#4B5563'; // Gray color
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, areaY);
    ctx.lineTo(GAME_WIDTH, areaY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Add subtle background for player area
    ctx.fillStyle = 'rgba(55, 65, 81, 0.2)'; // Slightly visible gray
    ctx.fillRect(0, areaY, GAME_WIDTH, PLAYER_AREA_HEIGHT);
  };
  
  // Draw player as a dog sprite
  const drawPlayer = (ctx: CanvasRenderingContext2D) => {
    const centerX = player.x + player.width / 2;
    const bottomY = player.y + player.height;
    
    // Body dimensions
    const bodyWidth = player.width * 0.8;
    const bodyHeight = player.height * 0.6;
    const headRadius = player.height * 0.4;
    
    // Colors
    const bodyColor = '#8B4513'; // Brown
    const earColor = '#6B3311'; // Darker brown
    const faceColor = '#D2B48C'; // Tan
    const noseColor = '#000000'; // Black
    
    // Draw body (oval shape)
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      bottomY - bodyHeight / 2,
      bodyWidth / 2,
      bodyHeight / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Draw head (circle)
    ctx.fillStyle = faceColor;
    ctx.beginPath();
    ctx.arc(
      centerX,
      player.y + headRadius,
      headRadius,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Draw ears
    ctx.fillStyle = earColor;
    // Left ear
    ctx.beginPath();
    ctx.ellipse(
      centerX - headRadius * 0.8,
      player.y + headRadius * 0.4,
      headRadius * 0.5,
      headRadius * 0.7,
      -Math.PI / 4,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Right ear
    ctx.beginPath();
    ctx.ellipse(
      centerX + headRadius * 0.8,
      player.y + headRadius * 0.4,
      headRadius * 0.5,
      headRadius * 0.7,
      Math.PI / 4,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Draw eyes
    ctx.fillStyle = '#000000';
    // Left eye
    ctx.beginPath();
    ctx.arc(
      centerX - headRadius * 0.4,
      player.y + headRadius * 0.8,
      headRadius * 0.15,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Right eye
    ctx.beginPath();
    ctx.arc(
      centerX + headRadius * 0.4,
      player.y + headRadius * 0.8,
      headRadius * 0.15,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Draw nose
    ctx.fillStyle = noseColor;
    ctx.beginPath();
    ctx.arc(
      centerX,
      player.y + headRadius * 1.3,
      headRadius * 0.2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Draw mouth
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      centerX,
      player.y + headRadius * 1.5,
      headRadius * 0.3,
      0.1 * Math.PI,
      0.9 * Math.PI
    );
    ctx.stroke();
    
    // Draw tail (curved line)
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = headRadius * 0.3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX - bodyWidth / 2, bottomY - bodyHeight / 3);
    
    // Create a wagging animation based on time
    const wagAngle = Math.sin(Date.now() / 200) * 0.3; // Subtle wagging
    const tailEnd = {
      x: centerX - bodyWidth * 0.8 * Math.cos(wagAngle),
      y: bottomY - bodyHeight - bodyHeight * 0.5 * Math.sin(wagAngle)
    };
    
    ctx.quadraticCurveTo(
      centerX - bodyWidth,
      bottomY - bodyHeight / 2,
      tailEnd.x,
      tailEnd.y
    );
    ctx.stroke();
    
    // Draw paws (two front circles)
    ctx.fillStyle = faceColor;
    // Left paw
    ctx.beginPath();
    ctx.arc(
      centerX - bodyWidth * 0.3,
      bottomY - 2,
      headRadius * 0.25,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Right paw
    ctx.beginPath();
    ctx.arc(
      centerX + bodyWidth * 0.3,
      bottomY - 2,
      headRadius * 0.25,
      0,
      Math.PI * 2
    );
    ctx.fill();
  };
  
  // Draw game objects
  const drawObject = (ctx: CanvasRenderingContext2D, obj: GameObject) => {
    if (obj.type === 'product') {
      const centerX = obj.x + obj.width / 2;
      const centerY = obj.y + obj.height / 2;
      
      // Draw food emoji
      ctx.font = `${obj.width * 0.8}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Draw the food emoji
      ctx.fillText(obj.foodType || '🍕', centerX, centerY);
      
      // Add subtle glow effect for the emoji
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(obj.foodType || '🍕', centerX, centerY);
      ctx.shadowBlur = 0;
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
      
      // Add glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#EF4444';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  };
  
  // Draw UI elements
  const drawUI = (ctx: CanvasRenderingContext2D) => {
    // Draw semi-transparent background for UI area
    ctx.fillStyle = 'rgba(17, 24, 39, 0.7)';
    ctx.fillRect(0, 0, GAME_WIDTH, 50);
    
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
    
    // Draw controls hint during gameplay
    if (isPlaying) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Use arrow keys or WASD to move in any direction', GAME_WIDTH / 2, GAME_HEIGHT - 10);
    }
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
            {score > 0 ? 'Game Over!' : 'Doggy Product Catcher'}
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
            <p className="mb-1">• Help your dog catch the tasty food items (🍕, 🍜, 🌮, 🍳, ☕, 🍦)</p>
            <p className="mb-1">• Avoid the red spiky obstacles</p>
            <p className="mb-1">• Use arrow keys or WASD to move freely in any direction</p>
            <p className="mb-1">• Hold SHIFT key for a speed boost!</p>
            <p className="mb-1">• On mobile, tap different screen areas to move in that direction</p>
            <p className="mb-1">• The dog wags its tail when happy!</p>
            <p className="mb-1">• Objects get faster as the game progresses - test your reflexes!</p>
          </div>
        </div>
      )}
    </div>
  );
}