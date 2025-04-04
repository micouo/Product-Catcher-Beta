import { useEffect, useRef, useState } from 'react';
import { useSound } from '../../hooks/use-sound';
import Background from './Background';
import { HairStyle } from '../CharacterSelector';

// Import character sprites
import baseIdleSprite from '@assets/base_idle_strip9.png';
import bowlHairSprite from '@assets/bowlhair_idle_strip9.png';
import curlyHairSprite from '@assets/curlyhair_idle_strip9.png';
import longHairSprite from '@assets/longhair_idle_strip9.png';
import mopHairSprite from '@assets/mophair_idle_strip9.png';
import shortHairSprite from '@assets/shorthair_idle_strip9.png';
import spikeyHairSprite from '@assets/spikeyhair_idle_strip9.png';

interface GameProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: () => void;
  selectedHair: HairStyle;
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
const PLAYER_WIDTH = 80; // Width for car sprite
const PLAYER_HEIGHT = 50; // Height for car sprite - slightly smaller for better proportions
const PLAYER_SPEED = 5;
const BOOST_MULTIPLIER = 1.8;
const OBJECT_WIDTH = 40;
const OBJECT_HEIGHT = 40;
const BASE_SPAWN_RATE = 1500; // Starting ms between spawns
const MIN_SPAWN_RATE = 600; // Minimum spawn rate (fastest)
const BASE_PRODUCT_PROBABILITY = 0.7; // Base probability for products (decreases with score)
const PLAYER_AREA_HEIGHT = 200; // Height of the player movement area - increased for more space
const BASE_OBJECT_SPEED = 2; // Starting speed
const MAX_OBJECT_SPEED = 7; // Maximum object speed
const SCORE_SPEED_MULTIPLIER = 0.02; // Speed increases by 2% for every 10 points
const ANIM_INTERVAL = 150; // milliseconds between animation frames

// Food emojis for products
const FOOD_EMOJIS = ["🍕", "🍜", "🌮", "🍳", "☕", "🍦"];

export default function DropGame({ onScoreUpdate, onGameOver, selectedHair }: GameProps) {
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
  const [animFrame, setAnimFrame] = useState(0);
  const [lastAnimTime, setLastAnimTime] = useState(0);
  const [gameInitialized, setGameInitialized] = useState(false);
  
  // Auto-start the game when component is mounted
  useEffect(() => {
    if (!gameInitialized) {
      // Short delay to allow assets to load before starting
      const startTimer = setTimeout(() => {
        startGame();
        setGameInitialized(true);
        if (onScoreUpdate) onScoreUpdate(0); // Initialize parent score
      }, 500);
      
      return () => clearTimeout(startTimer);
    }
  }, [gameInitialized, onScoreUpdate, startGame]);
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
      // Calculate dynamic product probability based on score
      // As score increases, reduce product probability (increase obstacles)
      // Minimum probability will be 40% products even at high scores
      const scoreFactor = score / 100; // Reduce by 1% per 100 points
      const productProbability = Math.max(0.4, BASE_PRODUCT_PROBABILITY - (scoreFactor * 0.05));
      
      const isProduct = Math.random() < productProbability;
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
      
      // Draw background first
      // Note: The background is now rendered separately as its own canvas element
      
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
      
      // Increase difficulty based on score
      // Calculate score-based difficulty 
      const scoreFactor = score / 10; // Difficulty increase per 10 points
      
      // Calculate new spawn rate (gets faster as score increases)
      const newSpawnRate = Math.max(
        MIN_SPAWN_RATE,
        BASE_SPAWN_RATE - (scoreFactor * 50)
      );
      
      // Calculate new speed multiplier (increases as score increases)
      const newSpeedMultiplier = Math.min(
        MAX_OBJECT_SPEED / BASE_OBJECT_SPEED,
        1 + (scoreFactor * SCORE_SPEED_MULTIPLIER)
      );
      
      // Only update if values have changed
      if (newSpawnRate !== currentSpawnRate) {
        setCurrentSpawnRate(newSpawnRate);
      }
      
      if (newSpeedMultiplier !== speedMultiplier) {
        setSpeedMultiplier(newSpeedMultiplier);
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
  }, [isPlaying, player, gameObjects, currentSpawnRate, speedMultiplier, animFrame, lastAnimTime]);
  
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
    ctx.strokeStyle = '#FFFFFF'; // White color with opacity
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, areaY);
    ctx.lineTo(GAME_WIDTH, areaY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // No need for background fill as we're now using the sidewalk from the background
  };
  
  // Draw player using character sprites
  const drawPlayer = (ctx: CanvasRenderingContext2D) => {
    // Constants for sprite rendering
    const SPRITE_SIZE = 24; // Size of each sprite in the sheet
    const SPRITE_SCALE = 3; // Scale up the sprite for better visibility
    const DISPLAYED_WIDTH = SPRITE_SIZE * SPRITE_SCALE;
    const DISPLAYED_HEIGHT = SPRITE_SIZE * SPRITE_SCALE;
    
    // Only animate when the player is moving or every few seconds
    const isMoving = player.movingLeft || player.movingRight || player.movingUp || player.movingDown;
    
    // Update animation frame
    const now = Date.now();
    if ((isMoving && now - lastAnimTime > ANIM_INTERVAL) || (now - lastAnimTime > ANIM_INTERVAL * 3)) {
      setAnimFrame((prev) => (prev + 1) % 9); // 9 frames in the sprite sheet
      setLastAnimTime(now);
    }
    
    // Calculate which hair sprite to use
    let hairSprite = '';
    switch(selectedHair) {
      case 'bowl':
        hairSprite = bowlHairSprite;
        break;
      case 'curly':
        hairSprite = curlyHairSprite;
        break;
      case 'long':
        hairSprite = longHairSprite;
        break;
      case 'mop':
        hairSprite = mopHairSprite;
        break;
      case 'short':
        hairSprite = shortHairSprite;
        break;
      case 'spikey':
        hairSprite = spikeyHairSprite;
        break;
      default:
        hairSprite = '';
    }
    
    // Apply shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Save context state
    ctx.save();
    
    // Center of the player position
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    
    // Calculate offset to center the character sprite
    const offsetX = centerX - DISPLAYED_WIDTH / 2;
    const offsetY = centerY - DISPLAYED_HEIGHT / 2;
    
    // Draw base character sprite
    if (baseIdleSprite) {
      // Create a temporary canvas for the sprite and apply any transformations
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = DISPLAYED_WIDTH;
      tempCanvas.height = DISPLAYED_HEIGHT;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // Draw the base sprite to the temp canvas
        const baseImg = new Image();
        baseImg.src = baseIdleSprite;
        
        if (baseImg.complete) {
          // Draw the correct frame from the sprite sheet
          tempCtx.drawImage(
            baseImg, 
            animFrame * SPRITE_SIZE, 0, // Source x, y (specific frame in sprite sheet)
            SPRITE_SIZE, SPRITE_SIZE,   // Source width, height (single sprite size)
            0, 0,                       // Destination x, y (on temp canvas)
            DISPLAYED_WIDTH, DISPLAYED_HEIGHT  // Destination width, height (scaled up)
          );
        }
        
        // If there's a hair style selected, draw it over the base
        if (hairSprite) {
          const hairImg = new Image();
          hairImg.src = hairSprite;
          
          if (hairImg.complete) {
            // Draw the correct frame from the sprite sheet
            tempCtx.drawImage(
              hairImg, 
              animFrame * SPRITE_SIZE, 0, // Source x, y (specific frame in sprite sheet)
              SPRITE_SIZE, SPRITE_SIZE,   // Source width, height (single sprite size)
              0, 0,                       // Destination x, y (on temp canvas)
              DISPLAYED_WIDTH, DISPLAYED_HEIGHT  // Destination width, height (scaled up)
            );
          }
        }
        
        // Apply slight scaling for animation bounce effect
        const bounceScale = 1 + Math.sin(animFrame * Math.PI / 4) * 0.05;
        
        // Get the movement direction for sprite transformation
        let rotation = 0;
        let flipX = false;
        
        if (player.movingLeft) {
          flipX = true;
        } else if (player.movingRight) {
          flipX = false;
        }
        
        // Apply the final transform and draw to the main canvas
        ctx.save();
        if (flipX) {
          // Flip horizontally if moving left
          ctx.translate(offsetX + DISPLAYED_WIDTH, offsetY);
          ctx.scale(-1, 1);
          ctx.drawImage(tempCanvas, 0, 0);
        } else {
          // Normal orientation
          ctx.drawImage(tempCanvas, offsetX, offsetY);
        }
        ctx.restore();
      }
    }
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
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
      {/* Background Layer */}
      <Background width={GAME_WIDTH} height={GAME_HEIGHT} />
      
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="border-2 border-gray-700 bg-transparent max-w-full h-auto relative z-10"
      />
      
      {!isPlaying && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-80 z-20">
          <h2 className="text-3xl font-game text-blue-500 mb-4">
            {score > 0 ? 'Game Over!' : 'Speed Racer Food Delivery'}
          </h2>
          {score > 0 && (
            <p className="text-2xl text-white mb-4">Your Score: {score}</p>
          )}
          <button
            onClick={startGame}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-md transition shadow-md flex items-center text-lg cursor-pointer"
          >
            <i className="ri-play-fill mr-2"></i> {score > 0 ? 'Play Again' : 'Start Game'}
          </button>
          
          <div className="mt-8 text-gray-300 text-center max-w-md">
            <p className="mb-2"><b>How to Play:</b></p>
            <p className="mb-1">• Drive your car to catch the tasty food items (🍕, 🍜, 🌮, 🍳, ☕, 🍦)</p>
            <p className="mb-1">• Avoid the red spiky obstacles</p>
            <p className="mb-1">• Use arrow keys or WASD to move freely in any direction</p>
            <p className="mb-1">• Hold SHIFT key for a speed boost!</p>
            <p className="mb-1">• On mobile, tap different screen areas to move in that direction</p>
            <p className="mb-1">• Your car will automatically face the direction you're moving</p>
            <p className="mb-1">• As your score increases, objects move faster and more obstacles appear!</p>
          </div>
        </div>
      )}
    </div>
  );
}
