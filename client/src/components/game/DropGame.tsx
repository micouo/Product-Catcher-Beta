import { useEffect, useRef, useState } from 'react';
import { useSound } from '../../hooks/use-sound';
import Background from './Background';
import car1Image from '../../assets/car1.png';
import pauseImage from '../../assets/pause.png';
import playImage from '../../assets/play.png';
// Import car assets
import car2Image from '../../assets/car2.png';
import car3Image from '../../assets/car3.png';
import car4Image from '../../assets/car4.png';
import car5Image from '../../assets/car5.png';
import car6Image from '../../assets/car6.png';

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

// Helper function to draw rounded rectangles since roundRect may not be available in all browsers
function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

// Store images as refs to avoid re-creating them
// Car images collection
type CarImageMap = {
  [key: string]: HTMLImageElement | null;
};

let carImages: CarImageMap = {
  peppy: null,   // Car 1
  rusty: null,   // Car 2
  turbo: null,   // Car 3
  drift: null,   // Car 4
  blazer: null,  // Car 5
  boss: null     // Car 6
};

let playerImage: HTMLImageElement | null = null;
let pauseButtonImage: HTMLImageElement | null = null;
let playButtonImage: HTMLImageElement | null = null;

// Define pause button constants - these can be easily adjusted
const PAUSE_BUTTON_SIZE = 50; // Size of the button (width and height)
const PAUSE_BUTTON_MARGIN_RIGHT = 20; // Margin from the right edge of the screen
const PAUSE_BUTTON_MARGIN_TOP = 70; // Margin from the top edge of the screen (increased from 20 to 70)
const PAUSE_BUTTON_OPACITY = 0.9; // Opacity of the button

export default function DropGame({ onScoreUpdate, onGameOver }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const lastSpawnTimeRef = useRef<number>(Date.now());
  const gameStartTimeRef = useRef<number>(0);
  const { playSound, initializeAudio } = useSound();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameObjects, setGameObjects] = useState<GameObject[]>([]);
  const [currentSpawnRate, setCurrentSpawnRate] = useState(BASE_SPAWN_RATE);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [animFrame, setAnimFrame] = useState(0);
  const [lastAnimTime, setLastAnimTime] = useState(0);
  const [playerImageLoaded, setPlayerImageLoaded] = useState(false);
  const [pauseButtonLoaded, setPauseButtonLoaded] = useState(false);
  const [playButtonLoaded, setPlayButtonLoaded] = useState(false);
  
  // Car selection state
  const [selectedCar, setSelectedCar] = useState<string>('peppy');
  const [carImagesLoaded, setCarImagesLoaded] = useState<{[key: string]: boolean}>({
    peppy: false,
    rusty: false,
    turbo: false,
    drift: false,
    blazer: false,
    boss: false
  });
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
  
  // Load all car images, pause/play buttons on component mount
  useEffect(() => {
    // Load car 1 (Peppy)
    if (!carImages.peppy) {
      const img = new Image();
      img.src = car1Image;
      img.onload = () => {
        carImages.peppy = img;
        playerImage = img; // Set as the initial player image
        setCarImagesLoaded(prev => ({ ...prev, peppy: true }));
        setPlayerImageLoaded(true);
      };
    }
    
    // Load car 2 (Rusty)
    if (!carImages.rusty) {
      const img = new Image();
      img.src = car2Image;
      img.onload = () => {
        carImages.rusty = img;
        setCarImagesLoaded(prev => ({ ...prev, rusty: true }));
      };
    }
    
    // Load car 3 (Turbo)
    if (!carImages.turbo) {
      const img = new Image();
      img.src = car3Image;
      img.onload = () => {
        carImages.turbo = img;
        setCarImagesLoaded(prev => ({ ...prev, turbo: true }));
      };
    }
    
    // Load car 4 (Drift)
    if (!carImages.drift) {
      const img = new Image();
      img.src = car4Image;
      img.onload = () => {
        carImages.drift = img;
        setCarImagesLoaded(prev => ({ ...prev, drift: true }));
      };
    }
    
    // Load car 5 (Blazer)
    if (!carImages.blazer) {
      const img = new Image();
      img.src = car5Image;
      img.onload = () => {
        carImages.blazer = img;
        setCarImagesLoaded(prev => ({ ...prev, blazer: true }));
      };
    }
    
    // Load car 6 (Boss)
    if (!carImages.boss) {
      const img = new Image();
      img.src = car6Image;
      img.onload = () => {
        carImages.boss = img;
        setCarImagesLoaded(prev => ({ ...prev, boss: true }));
      };
    }
    
    // Load pause button
    if (!pauseButtonImage) {
      const img = new Image();
      img.src = pauseImage;
      img.onload = () => {
        pauseButtonImage = img;
        setPauseButtonLoaded(true);
      };
    }
    
    // Load play button
    if (!playButtonImage) {
      const img = new Image();
      img.src = playImage;
      img.onload = () => {
        playButtonImage = img;
        setPlayButtonLoaded(true);
      };
    }
  }, []);
  
  // Toggle pause state
  const togglePause = () => {
    // Only allow toggling pause if the game is playing
    if (!isPlaying) return;
    
    setIsPaused(prev => !prev);
  };
  
  // Game loop - Inside useEffect where it belongs
  useEffect(() => {
    if (!isPlaying) return;
    
    const gameLoop = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      
      // Draw player area border
      drawPlayerArea(ctx);
      
      // Only update game state if not paused
      if (!isPaused) {
        // Update player position based on direction
        updatePlayerPosition();
        
        // Spawn new objects periodically
        if (Date.now() - lastSpawnTimeRef.current > currentSpawnRate) {
          const newObject = createGameObject();
          setGameObjects(prev => [...prev, newObject]);
          lastSpawnTimeRef.current = Date.now();
        }
        
        // Increase difficulty based on score
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
      }
      
      // Always draw everything
      // Draw player
      drawPlayer(ctx);
      
      // Draw objects
      gameObjects.forEach(obj => {
        drawObject(ctx, obj);
      });
      
      // Draw UI elements
      drawUI(ctx);
      
      // No pause overlay or text, keeping it simple as requested
      
      // Continue the game loop
      requestRef.current = requestAnimationFrame(gameLoop);
    };
    
    // Start the animation loop
    requestRef.current = requestAnimationFrame(gameLoop);
    
    // Cleanup
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, isPaused, score, currentSpawnRate, speedMultiplier, gameObjects, player]);
  
  // Function to create game objects - defined outside the useEffect for access by gameLoop
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
    
  // Draw the pause/play button
  const drawPauseButton = (ctx: CanvasRenderingContext2D) => {
    const buttonImg = isPaused ? playButtonImage : pauseButtonImage;
    if (!buttonImg) return;
    
    // Position button in top-right corner with margin
    const x = GAME_WIDTH - PAUSE_BUTTON_SIZE - PAUSE_BUTTON_MARGIN_RIGHT;
    const y = PAUSE_BUTTON_MARGIN_TOP;
    
    // Save current state
    ctx.save();
    
    // Set transparency
    ctx.globalAlpha = PAUSE_BUTTON_OPACITY;
    
    // Draw button image
    ctx.drawImage(buttonImg, x, y, PAUSE_BUTTON_SIZE, PAUSE_BUTTON_SIZE);
    
    // Restore context state
    ctx.restore();
  };
  
  // Handle mouse click for pause button
  const handleCanvasClick = (e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Position of pause button
    const buttonX = GAME_WIDTH - PAUSE_BUTTON_SIZE - PAUSE_BUTTON_MARGIN_RIGHT;
    const buttonY = PAUSE_BUTTON_MARGIN_TOP;
    
    // Check if click is within button area
    if (
      clickX >= buttonX && 
      clickX <= buttonX + PAUSE_BUTTON_SIZE &&
      clickY >= buttonY && 
      clickY <= buttonY + PAUSE_BUTTON_SIZE
    ) {
      togglePause();
    }
  };
  

  
  // Set up click event listener for pause button
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Add click event listener
    canvas.addEventListener('click', handleCanvasClick);
    
    // Cleanup
    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [isPaused]); // Include isPaused as a dependency for the click handler
  
  // Handle keyboard controls
  useEffect(() => {
    if (!isPlaying) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle each key separately without using else if to allow multiple keys
      switch(e.key) {
        case 'Escape':
          // Toggle pause state when pressing Escape key
          togglePause();
          break;
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
  
  // Track selected car changes
  useEffect(() => {
    // This effect runs when selectedCar changes
    // Update the player image based on the selected car
    if (carImages[selectedCar]) {
      playerImage = carImages[selectedCar];
    }
  }, [selectedCar, carImagesLoaded]);

  // Start game
  const startGame = () => {
    // Initialize audio context on game start
    initializeAudio();
    
    // Play start sound
    playSound('start');
    
    // Update player image based on selected car
    playerImage = carImages[selectedCar];
    
    // Reset game state
    setIsPlaying(true);
    setIsPaused(false); // Make sure game starts in unpaused state
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
  
  // Draw the player using the pixel art sprite
  const drawPlayer = (ctx: CanvasRenderingContext2D) => {
    // Only animate when the player is moving
    const isMoving = player.movingLeft || player.movingRight || player.movingUp || player.movingDown;
    
    // Update animation frame for bounce effect
    const now = Date.now();
    if (isMoving && now - lastAnimTime > ANIM_INTERVAL) {
      setAnimFrame((prev) => (prev + 1) % 4);
      setLastAnimTime(now);
    }
    
    // Apply shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    // Save context state
    ctx.save();
    
    // Calculate center position
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    
    // Translate to the player position
    ctx.translate(centerX, centerY);
    
    // Apply slight rotation based on movement direction
    let rotation = 0;
    if (player.movingLeft) rotation = -0.1;
    if (player.movingRight) rotation = 0.1;
    
    // Apply rotation only (no bounce scaling effect)
    ctx.rotate(rotation);
    
    // No need to flip the sprite horizontally anymore as images are already mirrored
    
    // Image is loaded in the useEffect hook on component mount
    
    // Draw the sprite if the selected car image is loaded
    const currentCarImage = carImages[selectedCar];
    if (currentCarImage) {
      // Make the car a good size while maintaining the right proportions
      
      // Set a fixed size that's good for this car sprite
      const drawWidth = player.width * 1.8;
      const drawHeight = drawWidth * 0.9; // Adjust height to be slightly less than width
      
      // Draw with slight vertical offset to center the car properly
      ctx.drawImage(
        currentCarImage, 
        -drawWidth / 2,
        -drawHeight / 2 - 10, // Offset upward to account for the delivery basket on top
        drawWidth, 
        drawHeight
      );
    } else {
      // Fallback simple colored rectangle if image hasn't loaded yet
      ctx.fillStyle = '#3B82F6'; // Blue color matching the sprite
      ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    }
    
    // Restore context state
    ctx.restore();
    
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
    
    // Draw pause button
    drawPauseButton(ctx);
    
    // Draw controls hint during gameplay
    if (isPlaying) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Use arrow keys or WASD to move in any direction', GAME_WIDTH / 2, GAME_HEIGHT - 10);
    }
    
    // No pause overlay or text, keeping it simple as requested
  };
  
  return (
    <div className="game-container relative">
      {/* Background Layer - only scrolls when game is playing and not paused */}
      <Background width={GAME_WIDTH} height={GAME_HEIGHT} isPaused={isPaused || !isPlaying} />
      
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="border-2 border-gray-700 bg-transparent max-w-full h-auto relative z-10"
      />
      
      {!isPlaying && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-80 z-20">
          <h2 className="text-4xl font-game text-blue-500 mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            {score > 0 ? 'Game Over!' : 'District Driver'}
          </h2>
          
          {score > 0 && (
            <p className="text-2xl text-white mb-4">Your Score: {score}</p>
          )}
          
          {/* Game menu content with flex layout for instructions and car selector */}
          <div className="flex flex-col md:flex-row w-full max-w-5xl px-4 gap-8 mb-6">
            {/* Instructions on the left */}
            <div className="flex-1 text-gray-300 text-left">
              <p className="text-xl font-semibold mb-2 text-blue-400">How to Play:</p>
              <p className="mb-1">• Drive your car to catch the tasty food items (🍕, 🍜, 🌮, 🍳, ☕, 🍦)</p>
              <p className="mb-1">• Avoid the red spiky obstacles</p>
              <p className="mb-1">• Use arrow keys or WASD to move freely in any direction</p>
              <p className="mb-1">• Hold SHIFT key for a speed boost!</p>
              <p className="mb-1">• Press ESC key or click the pause button to pause/unpause the game</p>
              <p className="mb-1">• On mobile, tap different screen areas to move in that direction</p>
              <p className="mb-1">• Your car will automatically face the direction you're moving</p>
              <p className="mb-1">• As your score increases, objects move faster and more obstacles appear!</p>
            </div>
            
            {/* Car selection on the right */}
            <div className="flex-1 bg-gray-800 rounded-lg p-4 flex flex-col items-center">
              <p className="text-xl font-semibold mb-4 text-blue-400">Choose Your Car:</p>
              
              {/* Car preview area */}
              <div className="bg-gray-700 rounded-lg w-full h-40 mb-4 flex items-center justify-center relative">
                {/* Current selected car display */}
                <div className="w-40 h-32 relative flex justify-center items-center">
                  <img 
                    src={carImages[selectedCar]?.src} 
                    alt={selectedCar}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Car selection arrows */}
                <div className="absolute inset-x-0 flex justify-between items-center px-2">
                  <button 
                    onClick={() => {
                      const cars = Object.keys(carImages);
                      const currentIndex = cars.indexOf(selectedCar);
                      const prevIndex = currentIndex <= 0 ? cars.length - 1 : currentIndex - 1;
                      setSelectedCar(cars[prevIndex]);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 w-10 h-10 rounded-full flex items-center justify-center text-white"
                  >
                    ←
                  </button>
                  <button 
                    onClick={() => {
                      const cars = Object.keys(carImages);
                      const currentIndex = cars.indexOf(selectedCar);
                      const nextIndex = (currentIndex + 1) % cars.length;
                      setSelectedCar(cars[nextIndex]);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 w-10 h-10 rounded-full flex items-center justify-center text-white"
                  >
                    →
                  </button>
                </div>
              </div>
              
              {/* Display car name */}
              <p className="text-lg text-white mb-4 capitalize">
                {selectedCar}
              </p>
            </div>
          </div>
          
          {/* Start button */}
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium py-3 px-8 rounded-md transition shadow-md flex items-center text-lg cursor-pointer hover:opacity-90"
          >
            {score > 0 ? 'Play Again' : 'Start Game'}
          </button>
        </div>
      )}
    </div>
  );
}
