import { useEffect, useRef, useState } from "react";
import { useSound } from "../../hooks/use-sound";
import Background from "./Background";
import car1Image from "@assets/car 1.png";
import pauseImage from "@assets/pause.png";
import playImage from "@assets/play.png";
import replayImage from "@assets/replay.png";
// Import car assets
import car2Image from "@assets/car 2.png";
import car3Image from "@assets/car 3.png";
import car4Image from "@assets/car 4.png";
import car5Image from "@assets/car 5.png";
import car6Image from "@assets/car 6.png";
import car7Image from "@assets/car 7.png";
import car8Image from "@assets/car 8.png";
import car9Image from "@assets/car 9.png";

// Import item assets
import toothbrushImage from "@assets/toothbrush.png";
import movieticketImage from "@assets/movieticket.png";
import wineImage from "@assets/wine.png";
import bouquetImage from "@assets/bouquet.png";
import sunImage from "@assets/sun.png";
import dogboneImage from "@assets/dogbone.png";
import coffeeImage from "@assets/coffee.png";
import tacoImage from "@assets/taco.png";
import eggImage from "@assets/egg.png";
import pizzaImage from "@assets/pizza.png";
import icecreamImage from "@assets/icecream.png";
import phoImage from "@assets/pho.png";

// Import obstacle images
import obstacleHailImage from "@assets/obstaclehail.png";
import obstacleSpikeBallImage from "@assets/obstaclespikeball.png";
import heartImage from "@assets/heart.png";

interface GameProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: () => void;
  onGameStart?: () => void;
}

interface GameObject {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "product" | "obstacle";
  itemName?: string; // name of the item to display
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
const ENGINE_SHAKE_INTERVAL = 50; // milliseconds between engine shake frames
const ENGINE_SHAKE_AMOUNT = 1.2; // pixels to shake up and down

// Create an array of item images
interface ItemImage {
  image: HTMLImageElement | null;
  name: string;
}

// Initialize an array of item images
const ITEM_IMAGES: ItemImage[] = [
  { image: null, name: "toothbrush" },
  { image: null, name: "movieticket" },
  { image: null, name: "wine" },
  { image: null, name: "bouquet" },
  { image: null, name: "sun" },
  { image: null, name: "dogbone" },
  { image: null, name: "coffee" },
  { image: null, name: "taco" },
  { image: null, name: "egg" },
  { image: null, name: "pizza" },
  { image: null, name: "icecream" },
  { image: null, name: "pho" }
];

// Helper function to draw rounded rectangles since roundRect may not be available in all browsers
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
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

// Car configuration including dimensions for each car
interface CarConfig {
  image: HTMLImageElement | null;
  width: number; // Individual width for this car
  height: number; // Individual height for this car
  offsetY: number; // Vertical offset (positive = move up, negative = move down)
  description: string; // Car description
}

// Car configuration map with customizable dimensions for each car
let carConfigs: Record<string, CarConfig> = {
  peppy: {
    // Car 1
    image: null,
    width: 140, // Default width
    height: 140, // Default height
    offsetY: 10, // Default vertical offset
    description: "Zippy and cheerful. Always late, always fast.",
  },
  rusty: {
    // Car 2
    image: null,
    width: 150, // Slightly wider
    height: 105,
    offsetY: 8,
    description: "Faded paint, full of charm. Might stall, might win.",
  },
  turbo: {
    // Car 3
    image: null,
    width: 150, // Wider
    height: 105, // Shorter
    offsetY: 12,
    description: "Aggressive and loud. Probably drinks energy drinks.",
  },
  drift: {
    // Car 4
    image: null,
    width: 180,
    height: 125, // Taller
    offsetY: 8,
    description: "Calm under pressure. The road bends to him.",
  },
  blazer: {
    // Car 5
    image: null,
    width: 160,
    height: 115,
    offsetY: 9,
    description: "Burnouts and bravado. Doesn't know what subtle means.",
  },
  boss: {
    // Car 6
    image: null,
    width: 150, // Widest
    height: 130, // Tallest
    offsetY: 5,
    description: "Rich, square, and rolling deep. Power in every pixel.",
  },
  crawler: {
    // Car 7
    image: null,
    width: 160,
    height: 160, // Taller for off-road vehicle
    offsetY: 6,
    description:
      "Tougher than a two-dollar steak. Climbs curbs like mountains.",
  },
  bugsy: {
    // Car 8
    image: null,
    width: 130, // Narrowest
    height: 130,
    offsetY: 8,
    description: "Short-tempered, loud engine. Always parks crooked.",
  },
  phantom: {
    // Car 9
    image: null,
    width: 150,
    height: 135,
    offsetY: 14, // Higher offset to make it look sleeker
    description:
      "Quick, elusive, and always one step ahead. You don't chase it, you follow its tail lights.",
  },
};

// For backward compatibility - create a carImages mapping from carConfigs
let carImages: CarImageMap = Object.fromEntries(
  Object.entries(carConfigs).map(([key, config]) => [key, config.image]),
);

let playerImage: HTMLImageElement | null = null;
let pauseButtonImage: HTMLImageElement | null = null;
let playButtonImage: HTMLImageElement | null = null;
let replayButtonImage: HTMLImageElement | null = null;
let obstacleHailImg: HTMLImageElement | null = null;
let obstacleSpikeBallImg: HTMLImageElement | null = null;
let heartImg: HTMLImageElement | null = null;

// Define button constants - these can be easily adjusted
const BUTTON_SIZE = 50; // Size of the pause button (width and height)
const REPLAY_BUTTON_SIZE = 78; // Size of the replay button - 50% larger than pause button (30% + 20% more)
const BUTTON_MARGIN_RIGHT = 20; // Margin from the right edge of the screen
const BUTTON_MARGIN_TOP = 70; // Margin from the top edge of the screen (increased from 20 to 70)
const BUTTON_OPACITY = 0.9; // Opacity of the button
const BUTTON_SPACING = 20; // Space between buttons (reduced from 60 to 20 to make them closer)

export default function DropGame({ onScoreUpdate, onGameOver, onGameStart }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const lastSpawnTimeRef = useRef<number>(Date.now());
  const gameStartTimeRef = useRef<number>(0);
  const { playSound, initializeAudio } = useSound();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    // Initialize high score from localStorage if available
    const savedHighScore = localStorage.getItem('districtDriverHighScore');
    return savedHighScore ? parseInt(savedHighScore, 10) : 0;
  });
  
  // Initialize saved scores from localStorage
  const [savedScores, setSavedScores] = useState<Array<{
    name: string;
    car: string;
    score: number;
    date: string;
  }>>(() => {
    const saved = localStorage.getItem('districtDriverScores');
    return saved ? JSON.parse(saved) : [];
  });
  const [lives, setLives] = useState(3);
  const [gameObjects, setGameObjects] = useState<GameObject[]>([]);
  const [currentSpawnRate, setCurrentSpawnRate] = useState(BASE_SPAWN_RATE);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [animFrame, setAnimFrame] = useState(0);
  const [lastAnimTime, setLastAnimTime] = useState(0);
  // Engine shake animation
  const [engineShakeOffset, setEngineShakeOffset] = useState(0);
  const [lastEngineShakeTime, setLastEngineShakeTime] = useState(0);
  const [playerImageLoaded, setPlayerImageLoaded] = useState(false);
  const [pauseButtonLoaded, setPauseButtonLoaded] = useState(false);
  const [playButtonLoaded, setPlayButtonLoaded] = useState(false);
  const [replayButtonLoaded, setReplayButtonLoaded] = useState(false);

  // Car selection state
  const [selectedCar, setSelectedCar] = useState<string>("peppy");
  const [playerName, setPlayerName] = useState<string>("Player");
  const [showFullLeaderboard, setShowFullLeaderboard] = useState<boolean>(false);
  const [showMoreInstructions, setShowMoreInstructions] = useState(false);
  const [carImagesLoaded, setCarImagesLoaded] = useState<{
    [key: string]: boolean;
  }>({
    peppy: false,
    rusty: false,
    turbo: false,
    drift: false,
    blazer: false,
    boss: false,
    crawler: false,
    bugsy: false,
    phantom: false,
  });
  const [isPlayerDamaged, setIsPlayerDamaged] = useState(false); // Track damage state for red flash effect
  const [damageFlashTime, setDamageFlashTime] = useState(0); // Track time for the flash effect
  const [damageFlashCount, setDamageFlashCount] = useState(0); // Track flash count for multiple flashes
  
  // Heart flash animation state
  const [heartFlashState, setHeartFlashState] = useState<{active: boolean, startTime: number, lifeLost: number}>({
    active: false,
    startTime: 0,
    lifeLost: 0
  }); // Track heart flash animation
  const [player, setPlayer] = useState<Player>({
    x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: GAME_HEIGHT - PLAYER_HEIGHT - 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: PLAYER_SPEED,
    movingLeft: false,
    movingRight: false,
    movingUp: false,
    movingDown: false,
    boosting: false,
  });

  // Load all car images, item images, and UI button images on component mount
  useEffect(() => {
    // Helper function to load a car image
    const loadCarImage = (carKey: string, imageSrc: string) => {
      if (!carConfigs[carKey].image) {
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
          // Update both our configuration system and legacy system
          carConfigs[carKey].image = img;
          carImages[carKey] = img;

          // Set as initial player image if it's the first car (peppy)
          if (carKey === "peppy") {
            playerImage = img;
            setPlayerImageLoaded(true);
          }

          setCarImagesLoaded((prev) => ({ ...prev, [carKey]: true }));
        };
      }
    };

    // Helper function to load an item image
    const loadItemImage = (index: number, imageSrc: string) => {
      if (!ITEM_IMAGES[index].image) {
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
          ITEM_IMAGES[index].image = img;
        };
      }
    };

    // Load all car images
    loadCarImage("peppy", car1Image); // Car 1
    loadCarImage("rusty", car2Image); // Car 2
    loadCarImage("turbo", car3Image); // Car 3
    loadCarImage("drift", car4Image); // Car 4
    loadCarImage("blazer", car5Image); // Car 5
    loadCarImage("boss", car6Image); // Car 6
    loadCarImage("crawler", car7Image); // Car 7
    loadCarImage("bugsy", car8Image); // Car 8
    loadCarImage("phantom", car9Image); // Car 9

    // Load all item images
    loadItemImage(0, toothbrushImage);
    loadItemImage(1, movieticketImage);
    loadItemImage(2, wineImage);
    loadItemImage(3, bouquetImage);
    loadItemImage(4, sunImage);
    loadItemImage(5, dogboneImage);
    loadItemImage(6, coffeeImage);
    loadItemImage(7, tacoImage);
    loadItemImage(8, eggImage);
    loadItemImage(9, pizzaImage);
    loadItemImage(10, icecreamImage);
    loadItemImage(11, phoImage);

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

    // Load replay button
    if (!replayButtonImage) {
      const img = new Image();
      img.src = replayImage;
      img.onload = () => {
        replayButtonImage = img;
        setReplayButtonLoaded(true);
      };
    }
    
    // Load obstacle images
    if (!obstacleHailImg) {
      const img = new Image();
      img.src = obstacleHailImage;
      img.onload = () => {
        obstacleHailImg = img;
      };
    }
    
    if (!obstacleSpikeBallImg) {
      const img = new Image();
      img.src = obstacleSpikeBallImage;
      img.onload = () => {
        obstacleSpikeBallImg = img;
      };
    }
    
    // Load heart image
    if (!heartImg) {
      const img = new Image();
      img.src = heartImage;
      img.onload = () => {
        heartImg = img;
      };
    }
  }, []);

  // Toggle pause state
  const togglePause = () => {
    // Only allow toggling pause if the game is playing
    if (!isPlaying) return;

    setIsPaused((prev) => !prev);
  };

  // Restart game - bring back to car selection
  const restartGame = () => {
    // End current game session
    if (isPlaying) {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }

    // Reset to initial state
    setIsPlaying(false);
    setIsPaused(false);
    setScore(0);
    setLives(3);
    setGameObjects([]);
    setCurrentSpawnRate(BASE_SPAWN_RATE);
    setSpeedMultiplier(1.0);
    setIsPlayerDamaged(false); // Reset damage effect
    setDamageFlashCount(0); // Reset flash counter
    setEngineShakeOffset(0); // Reset engine shake
    setHeartFlashState({active: false, startTime: 0, lifeLost: 0}); // Reset heart flash state

    // Keep high score
  };
  
  // Function to save score to local storage
  const saveScore = () => {
    if (score <= 0) return; // Don't save zero or negative scores
    
    // Format current date
    const currentDate = new Date();
    const formattedDate = `${currentDate.getMonth() + 1}/${currentDate.getDate()}/${currentDate.getFullYear().toString().substr(-2)}`;
    
    // Create new score entry
    const newScore = {
      name: playerName,
      car: selectedCar,
      score: score,
      date: formattedDate
    };
    
    // Add to saved scores
    const updatedScores = [...savedScores, newScore];
    
    // Sort by score (highest first)
    updatedScores.sort((a, b) => b.score - a.score);
    
    // Keep only top 10 scores
    const topScores = updatedScores.slice(0, 10);
    
    // Update state
    setSavedScores(topScores);
    
    // Save to localStorage
    localStorage.setItem('districtDriverScores', JSON.stringify(topScores));
    
    // Update high score if needed
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('districtDriverHighScore', score.toString());
    }
    
    // Show success feedback
    alert('Score saved successfully!');
  };

  // Background music is handled automatically by the useSound hook
  // when initializeAudio is called on first interaction
  useEffect(() => {
    // Use a small timeout to prevent setState during render
    const timer = setTimeout(() => {
      // Initialize audio after component is fully mounted,
      // which will start playing background music automatically
      initializeAudio();
    }, 100);

    // Clean up
    return () => {
      clearTimeout(timer);
      // Other cleanup will be handled by the useSound hook when component unmounts
    };
  }, []);

  // Game loop - Inside useEffect where it belongs
  useEffect(() => {
    if (!isPlaying) return;

    const gameLoop = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Only update game state if not paused
      if (!isPaused) {
        // Update player position based on direction
        updatePlayerPosition();

        // Spawn new objects periodically
        if (Date.now() - lastSpawnTimeRef.current > currentSpawnRate) {
          const newObject = createGameObject();
          setGameObjects((prev) => [...prev, newObject]);
          lastSpawnTimeRef.current = Date.now();
        }

        // Increase difficulty based on score
        const scoreFactor = score / 10; // Difficulty increase per 10 points

        // Calculate new spawn rate (gets faster as score increases)
        const newSpawnRate = Math.max(
          MIN_SPAWN_RATE,
          BASE_SPAWN_RATE - scoreFactor * 50,
        );

        // Calculate new speed multiplier (increases as score increases)
        const newSpeedMultiplier = Math.min(
          MAX_OBJECT_SPEED / BASE_OBJECT_SPEED,
          1 + scoreFactor * SCORE_SPEED_MULTIPLIER,
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

      // First pass - draw everything except the player

      // Draw player area border
      drawPlayerArea(ctx);

      // Draw objects
      gameObjects.forEach((obj) => {
        drawObject(ctx, obj);
      });

      // Second pass - draw player on top of everything
      drawPlayer(ctx);

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
  }, [
    isPlaying,
    isPaused,
    score,
    currentSpawnRate,
    speedMultiplier,
    gameObjects,
    player,
    isPlayerDamaged,
    damageFlashTime,
    damageFlashCount,
    engineShakeOffset,
    heartFlashState,
    lives
  ]);

  // Function to create game objects - defined outside the useEffect for access by gameLoop
  const createGameObject = (): GameObject => {
    // Calculate dynamic product probability based on score
    // As score increases, reduce product probability (increase obstacles)
    // Minimum probability will be 40% products even at high scores
    const scoreFactor = score / 100; // Reduce by 1% per 100 points
    const productProbability = Math.max(
      0.4,
      BASE_PRODUCT_PROBABILITY - scoreFactor * 0.05,
    );

    const isProduct = Math.random() < productProbability;
    const randomItemIndex = Math.floor(Math.random() * ITEM_IMAGES.length);

    // Apply speed multiplier to make objects faster over time
    const baseSpeed = BASE_OBJECT_SPEED + Math.random() * 3; // Random base speed
    const scaledSpeed = baseSpeed * speedMultiplier; // Apply speed multiplier

    return {
      id: Math.random(),
      x: Math.random() * (GAME_WIDTH - OBJECT_WIDTH),
      y: -OBJECT_HEIGHT, // Start above the canvas
      width: OBJECT_WIDTH,
      height: OBJECT_HEIGHT,
      type: isProduct ? "product" : "obstacle",
      itemName: isProduct ? ITEM_IMAGES[randomItemIndex].name : undefined,
      speed: scaledSpeed,
    };
  };

  // Draw the pause/play button
  const drawPauseButton = (ctx: CanvasRenderingContext2D) => {
    const buttonImg = isPaused ? playButtonImage : pauseButtonImage;
    if (!buttonImg) return;

    // Position button in top-right corner with margin
    const x = GAME_WIDTH - BUTTON_SIZE - BUTTON_MARGIN_RIGHT;
    const y = BUTTON_MARGIN_TOP;

    // Save current state
    ctx.save();

    // Set transparency
    ctx.globalAlpha = BUTTON_OPACITY;

    // Draw button image
    ctx.drawImage(buttonImg, x, y, BUTTON_SIZE, BUTTON_SIZE);

    // Restore context state
    ctx.restore();
  };

  // Draw the replay button
  const drawReplayButton = (ctx: CanvasRenderingContext2D) => {
    if (!replayButtonImage) return;

    // Position button left of the pause button
    const x =
      GAME_WIDTH -
      BUTTON_SIZE -
      REPLAY_BUTTON_SIZE -
      BUTTON_MARGIN_RIGHT -
      BUTTON_SPACING;
    const y = BUTTON_MARGIN_TOP - (REPLAY_BUTTON_SIZE - BUTTON_SIZE) / 2; // Center vertically with pause button

    // Save current state
    ctx.save();

    // Set transparency
    ctx.globalAlpha = BUTTON_OPACITY;

    // Draw button image
    ctx.drawImage(
      replayButtonImage,
      x,
      y,
      REPLAY_BUTTON_SIZE,
      REPLAY_BUTTON_SIZE,
    );

    // Restore context state
    ctx.restore();
  };

  // Handle mouse click for pause and replay buttons
  const handleCanvasClick = (e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Position of pause button (right button)
    const pauseButtonX = GAME_WIDTH - BUTTON_SIZE - BUTTON_MARGIN_RIGHT;
    const pauseButtonY = BUTTON_MARGIN_TOP;

    // Position of replay button (left of pause button)
    const replayButtonX =
      GAME_WIDTH -
      BUTTON_SIZE -
      REPLAY_BUTTON_SIZE -
      BUTTON_MARGIN_RIGHT -
      BUTTON_SPACING;
    const replayButtonY =
      BUTTON_MARGIN_TOP - (REPLAY_BUTTON_SIZE - BUTTON_SIZE) / 2;

    // Check if click is within pause button area
    if (
      clickX >= pauseButtonX &&
      clickX <= pauseButtonX + BUTTON_SIZE &&
      clickY >= pauseButtonY &&
      clickY <= pauseButtonY + BUTTON_SIZE
    ) {
      togglePause();
    }

    // Check if click is within replay button area
    if (
      clickX >= replayButtonX &&
      clickX <= replayButtonX + REPLAY_BUTTON_SIZE &&
      clickY >= replayButtonY &&
      clickY <= replayButtonY + REPLAY_BUTTON_SIZE
    ) {
      restartGame();
    }
  };

  // Set up click event listener for pause and replay buttons
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Add click event listener
    canvas.addEventListener("click", handleCanvasClick);

    // Cleanup
    return () => {
      canvas.removeEventListener("click", handleCanvasClick);
    };
  }, [isPaused, isPlaying]); // Include game state as dependencies for the click handler

  // Handle keyboard controls
  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling behavior for arrow keys during gameplay
      if (isPlaying && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.key)) {
        e.preventDefault();
      }
      
      // Handle each key separately without using else if to allow multiple keys
      switch (e.key) {
        case "Escape":
          // Toggle pause state when pressing Escape key
          togglePause();
          break;
        case "r":
        case "R":
          // Restart game when pressing R key
          restartGame();
          break;
        case "Shift":
          setPlayer((prev) => ({ ...prev, boosting: true }));
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          setPlayer((prev) => ({ ...prev, movingLeft: true }));
          break;
        case "ArrowRight":
        case "d":
        case "D":
          setPlayer((prev) => ({ ...prev, movingRight: true }));
          break;
        case "ArrowUp":
        case "w":
        case "W":
          setPlayer((prev) => ({ ...prev, movingUp: true }));
          break;
        case "ArrowDown":
        case "s":
        case "S":
          setPlayer((prev) => ({ ...prev, movingDown: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Prevent default scrolling behavior for arrow keys during gameplay
      if (isPlaying && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.key)) {
        e.preventDefault();
      }
      
      // Handle each key separately without using else if to allow multiple keys
      switch (e.key) {
        case "Shift":
          setPlayer((prev) => ({ ...prev, boosting: false }));
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          setPlayer((prev) => ({ ...prev, movingLeft: false }));
          break;
        case "ArrowRight":
        case "d":
        case "D":
          setPlayer((prev) => ({ ...prev, movingRight: false }));
          break;
        case "ArrowUp":
        case "w":
        case "W":
          setPlayer((prev) => ({ ...prev, movingUp: false }));
          break;
        case "ArrowDown":
        case "s":
        case "S":
          setPlayer((prev) => ({ ...prev, movingDown: false }));
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

      setPlayer((prev) => ({
        ...prev,
        movingLeft: moveLeft,
        movingRight: moveRight,
        movingUp: moveUp,
        movingDown: moveDown,
      }));
    };

    const handleTouchEnd = () => {
      setPlayer((prev) => ({
        ...prev,
        movingLeft: false,
        movingRight: false,
        movingUp: false,
        movingDown: false,
      }));
    };

    // Add event listeners
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      canvas.addEventListener("touchend", handleTouchEnd);
    }

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);

      if (canvas) {
        canvas.removeEventListener("touchstart", handleTouchStart);
        canvas.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [isPlaying]);

  // Update player position based on movement flags
  const updatePlayerPosition = () => {
    const areaY = GAME_HEIGHT - PLAYER_AREA_HEIGHT;

    setPlayer((prev) => {
      let newX = prev.x;
      let newY = prev.y;

      // Apply horizontal movement
      const currentSpeed = prev.boosting
        ? prev.speed * BOOST_MULTIPLIER
        : prev.speed;

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
        y: newY,
      };
    });
  };

  // Move objects and check collisions
  const moveObjectsAndCheckCollisions = () => {
    setGameObjects((prevObjects) => {
      const updatedObjects = prevObjects.map((obj) => {
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
          if (updatedObj.type === "product") {
            // Play collection sound
            playSound("collect");

            setScore((prevScore) => {
              const newScore = prevScore + 10;
              if (onScoreUpdate) onScoreUpdate(newScore);
              return newScore;
            });
            return { ...updatedObj, y: GAME_HEIGHT + 100 }; // Move it out of the game area
          } else {
            // Play hit sound
            playSound("hit");

            // Activate the damage flash effect
            setIsPlayerDamaged(true);
            setDamageFlashTime(Date.now());
            setDamageFlashCount(0); // Reset flash count to start flashing

            // If obstacle hits player, reduce lives
            setLives((prevLives) => {
              const newLives = prevLives - 1;
              
              // Activate heart flashing animation
              setHeartFlashState({
                active: true,
                startTime: Date.now(),
                lifeLost: prevLives
              });
              
              if (newLives <= 0) {
                playSound("gameOver");
                endGame();
                if (onGameOver) onGameOver();
              }
              return newLives;
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
      return updatedObjects.filter((obj) => obj.y <= GAME_HEIGHT + 50);
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
    // Use a small timeout to ensure the audio context is initialized properly
    setTimeout(() => {
      initializeAudio();
      // Play start sound after a slight delay
      setTimeout(() => {
        playSound("start");
      }, 50);
    }, 50);

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
    setIsPlayerDamaged(false); // Reset damage effect
    setDamageFlashCount(0); // Reset flash counter
    setEngineShakeOffset(0); // Reset engine shake
    setHeartFlashState({active: false, startTime: 0, lifeLost: 0}); // Reset heart flash state

    // Reset timers
    lastSpawnTimeRef.current = Date.now();
    gameStartTimeRef.current = Date.now();
    
    // Notify parent that game has started
    if (onGameStart) {
      onGameStart();
    }
  };

  // End game
  const endGame = () => {
    setIsPlaying(false);
    setHighScore((prev) => Math.max(prev, score));

    // Play game over sound
    playSound("gameOver");
  };

  // Draw player area border
  const drawPlayerArea = (ctx: CanvasRenderingContext2D) => {
    // Save context state to prevent any effects from affecting the border
    ctx.save();

    // Reset any composite operations
    ctx.globalCompositeOperation = "source-over";

    const areaY = GAME_HEIGHT - PLAYER_AREA_HEIGHT;

    // Draw dashed line to show player area
    ctx.setLineDash([10, 5]);
    ctx.strokeStyle = "#FFFFFF"; // White color
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, areaY);
    ctx.lineTo(GAME_WIDTH, areaY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Restore context state
    ctx.restore();

    // No need for background fill as we're now using the sidewalk from the background
  };

  // Draw the player using the pixel art sprite
  const drawPlayer = (ctx: CanvasRenderingContext2D) => {
    // Only animate when the player is moving
    const isMoving =
      player.movingLeft ||
      player.movingRight ||
      player.movingUp ||
      player.movingDown;

    // Update animation frame for bounce effect
    const now = Date.now();
    if (isMoving && now - lastAnimTime > ANIM_INTERVAL) {
      setAnimFrame((prev) => (prev + 1) % 4);
      setLastAnimTime(now);
    }

    // Engine shake animation (runs even when not moving, to show running engine)
    if (!isPaused && now - lastEngineShakeTime > ENGINE_SHAKE_INTERVAL) {
      // Alternate between -1, 0, and 1 for a slight shake effect
      setEngineShakeOffset((prev) =>
        prev === 0
          ? ENGINE_SHAKE_AMOUNT
          : prev === ENGINE_SHAKE_AMOUNT
            ? -ENGINE_SHAKE_AMOUNT
            : 0,
      );
      setLastEngineShakeTime(now);
    }

    // Apply shadow for better visibility
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    // Save context state
    ctx.save();

    // Calculate center position
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;

    // Translate to the player position with engine shake offset
    // Only apply the vertical (y) offset for engine shake
    ctx.translate(centerX, centerY + (isPaused ? 0 : engineShakeOffset));

    // Apply slight rotation based on movement direction
    let rotation = 0;
    if (player.movingLeft) rotation = -0.1;
    if (player.movingRight) rotation = 0.1;

    // Apply rotation only (no bounce scaling effect)
    ctx.rotate(rotation);

    // No need to flip the sprite horizontally anymore as images are already mirrored

    // Get car configuration for the selected car
    const carConfig = carConfigs[selectedCar];

    // Draw the sprite if the selected car image is loaded
    const currentCarImage = carConfig.image;
    if (currentCarImage) {
      // Use the custom dimensions from car configuration
      const drawWidth = carConfig.width;
      const drawHeight = carConfig.height;
      const offsetY = carConfig.offsetY;

      // Check if player is in damaged state (flashing red)
      const now = Date.now();

      // Define flash constants
      const MAX_FLASH_COUNT = 5; // Number of flashes
      const FLASH_DURATION = 50; // Duration of each flash in ms (reduced to make it quicker)
      const TOTAL_FLASH_TIME = FLASH_DURATION * MAX_FLASH_COUNT * 2; // Total flash time (on + off)

      if (isPlayerDamaged && now - damageFlashTime < TOTAL_FLASH_TIME) {
        // Calculate current flash phase
        const elapsedTime = now - damageFlashTime;
        const flashPhase = Math.floor(elapsedTime / FLASH_DURATION);

        // Flash is on for even phases, off for odd phases
        const shouldFlash = flashPhase % 2 === 0;

        // Update flash count if we're at an odd phase (just finished a flash)
        if (
          flashPhase % 2 === 1 &&
          Math.floor(flashPhase / 2) > damageFlashCount
        ) {
          setDamageFlashCount(Math.floor(flashPhase / 2));
        }

        // Draw the car
        ctx.save();

        // Always draw the car first
        ctx.drawImage(
          currentCarImage,
          -drawWidth / 2,
          -drawHeight / 2 - offsetY, // Use the car-specific vertical offset
          drawWidth,
          drawHeight,
        );

        // Apply red tint only during flash phases (even numbers)
        if (shouldFlash) {
          // Apply red overlay with source-atop to prevent affecting outside the car
          ctx.globalCompositeOperation = "source-atop";
          ctx.fillStyle = "rgba(255, 0, 0, 0.7)"; // Semi-transparent red
          ctx.fillRect(
            -drawWidth / 2,
            -drawHeight / 2 - offsetY,
            drawWidth,
            drawHeight,
          );
        }

        ctx.restore();

        // Turn off damage effect after all flashes complete
        if (
          elapsedTime >= TOTAL_FLASH_TIME ||
          damageFlashCount >= MAX_FLASH_COUNT
        ) {
          setIsPlayerDamaged(false);
          setDamageFlashCount(0);
        }
      } else {
        // Draw normally without red tint
        ctx.drawImage(
          currentCarImage,
          -drawWidth / 2,
          -drawHeight / 2 - offsetY, // Use the car-specific vertical offset
          drawWidth,
          drawHeight,
        );

        // Reset damage state after all flash time expires
        if (isPlayerDamaged) {
          setIsPlayerDamaged(false);
          setDamageFlashCount(0);
        }
      }
    } else {
      // Fallback simple colored rectangle if image hasn't loaded yet
      ctx.fillStyle = "#3B82F6"; // Blue color matching the sprite
      ctx.fillRect(
        -player.width / 2,
        -player.height / 2,
        player.width,
        player.height,
      );
    }

    // Restore context state
    ctx.restore();

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  };

  // Draw game objects
  const drawObject = (ctx: CanvasRenderingContext2D, obj: GameObject) => {
    if (obj.type === "product") {
      // Find the item image from the item name
      const itemImage = ITEM_IMAGES.find(item => item.name === obj.itemName)?.image;
      
      if (itemImage) {
        // Draw the item image
        ctx.save();
        
        // Add subtle glow effect for the item
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(255, 255, 255, 0.7)";
        
        // Draw centered image slightly larger for visibility
        const scale = 1.5;
        const drawWidth = obj.width * scale;
        const drawHeight = obj.height * scale;
        const x = obj.x + (obj.width - drawWidth) / 2;
        const y = obj.y + (obj.height - drawHeight) / 2;
        
        ctx.drawImage(itemImage, x, y, drawWidth, drawHeight);
        
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    } else {
      // Draw obstacle using our new obstacle images
      ctx.save();
      
      // Add subtle glow effect for the obstacle
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(255, 0, 0, 0.6)";
      
      // Randomly choose between the two obstacle images
      // Use Math.round() on the object's id to make the choice consistent for each object
      const obstacleImage = Math.round(obj.id * 10) % 2 === 0 
        ? obstacleHailImg 
        : obstacleSpikeBallImg;
      
      // Draw slightly larger for visibility and impact
      const scale = 1.6;
      const drawWidth = obj.width * scale;
      const drawHeight = obj.height * scale;
      const x = obj.x + (obj.width - drawWidth) / 2;
      const y = obj.y + (obj.height - drawHeight) / 2;
      
      // Only draw the image if it's loaded, otherwise draw a fallback shape
      if (obstacleImage) {
        ctx.drawImage(obstacleImage, x, y, drawWidth, drawHeight);
      } else {
        // Fallback to a colored circle if image is not loaded yet
        ctx.fillStyle = "#EF4444"; // Red color for obstacles
        ctx.beginPath();
        ctx.arc(x + drawWidth/2, y + drawHeight/2, Math.min(drawWidth, drawHeight)/2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
  };

  // Draw UI elements
  const drawUI = (ctx: CanvasRenderingContext2D) => {
    // Draw semi-transparent background for UI area
    ctx.fillStyle = "rgba(17, 24, 39, 0.7)";
    ctx.fillRect(0, 0, GAME_WIDTH, 50);

    // Draw score
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${score}`, 20, 30);

    // Draw high score
    ctx.textAlign = "center";
    ctx.fillText(`High Score: ${highScore}`, GAME_WIDTH / 2, 30);

    // Draw lives as heart images
    if (heartImg) {
      const heartSize = 30; // Size of the heart image
      const heartSpacing = 8; // Spacing between hearts
      const startX = GAME_WIDTH - 20 - (heartSize * 3) - (heartSpacing * 2); // Position for 3 hearts
      const heartY = 10; // Vertical position
      
      // Draw empty placeholder hearts first (gray silhouettes)
      ctx.globalAlpha = 0.3;
      for (let i = 0; i < 3; i++) {
        const x = startX + (i * (heartSize + heartSpacing));
        ctx.drawImage(heartImg, x, heartY, heartSize, heartSize);
      }
      
      // Draw active hearts with proper animation
      ctx.globalAlpha = 1.0;
      
      // Flash animation constants
      const FLASH_DURATION = 800; // Total flash animation time in ms
      const FLASH_FREQUENCY = 50; // Time between flashes in ms
      
      for (let i = 0; i < lives; i++) {
        const x = startX + (i * (heartSize + heartSpacing));
        
        // Apply flashing animation to the heart that's being lost
        if (heartFlashState.active && heartFlashState.lifeLost === i + 1) {
          const elapsed = Date.now() - heartFlashState.startTime;
          
          // Flash the heart rapidly
          if (elapsed < FLASH_DURATION) {
            // Toggle visibility based on time to create rapid flashing
            const isVisible = Math.floor(elapsed / FLASH_FREQUENCY) % 2 === 0;
            
            if (isVisible) {
              ctx.drawImage(heartImg, x, heartY, heartSize, heartSize);
            }
            
            // If animation is complete, reset the flash state
            if (elapsed >= FLASH_DURATION) {
              setHeartFlashState({active: false, startTime: 0, lifeLost: 0});
            }
          } else {
            // Animation complete, don't draw this heart anymore
            setHeartFlashState({active: false, startTime: 0, lifeLost: 0});
          }
        } else {
          // Normal heart rendering (no animation)
          ctx.drawImage(heartImg, x, heartY, heartSize, heartSize);
        }
      }
      
      // Reset alpha
      ctx.globalAlpha = 1.0;
    } else {
      // Fallback to text if heart image isn't loaded
      ctx.textAlign = "right";
      ctx.fillText(`Lives: ${lives}`, GAME_WIDTH - 20, 30);
    }

    // Draw game control buttons
    drawPauseButton(ctx);
    drawReplayButton(ctx);

    // Draw controls hint during gameplay
    if (isPlaying) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "Use arrow keys or WASD to move in any direction",
        GAME_WIDTH / 2,
        GAME_HEIGHT - 10,
      );
    }

    // No pause overlay or text, keeping it simple as requested
  };

  return (
    <div className="game-container relative">
      {/* Background Layer - only scrolls when game is playing and not paused */}
      <Background
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        isPaused={isPaused || !isPlaying}
      />

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="border-2 border-gray-700 bg-transparent max-w-full h-auto relative z-10"
      />

      {/* Full Leaderboard Screen */}
      {showFullLeaderboard && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-95 z-30">
          <div className="w-full max-w-4xl bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-3 px-4">
              <h3 className="text-xl text-white font-bold">Full Leaderboard</h3>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-12 gap-2 mb-2 text-gray-300 text-sm px-2 py-2 border-b border-gray-700">
                <div className="col-span-1 font-semibold">#</div>
                <div className="col-span-4 font-semibold">Name</div>
                <div className="col-span-3 font-semibold">Car</div>
                <div className="col-span-2 font-semibold">Score</div>
                <div className="col-span-2 font-semibold">Date</div>
              </div>
              
              <div className="max-h-[500px] overflow-y-auto pr-1">
                {savedScores.length > 0 ? (
                  savedScores.map((savedScore, index) => (
                    <div 
                      key={index}
                      className={`${
                        savedScore.score >= 200 
                          ? 'bg-yellow-900 bg-opacity-40' 
                          : index % 2 === 0 
                            ? 'bg-gray-700' 
                            : 'bg-gray-700 bg-opacity-50'
                      } rounded-md p-2 mb-1 grid grid-cols-12 gap-2 ${
                        savedScore.score >= 200 
                          ? 'text-yellow-200' 
                          : index === 0 
                            ? 'text-gray-200' 
                            : 'text-gray-300'
                      } text-sm`}
                    >
                      <div className="col-span-1">{index + 1}</div>
                      <div className="col-span-4 truncate">{savedScore.name}</div>
                      <div className="col-span-3 capitalize truncate">{savedScore.car}</div>
                      <div className="col-span-2 font-medium">
                        {savedScore.score}{savedScore.score >= 200 && ' 🏆'}
                      </div>
                      <div className="col-span-2">{savedScore.date}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No saved scores yet. Play and save your score to see it here!
                  </div>
                )}
              </div>
              
              <div className="pt-4 flex justify-center">
                <button 
                  onClick={() => setShowFullLeaderboard(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded font-medium transition-colors"
                >
                  Close Leaderboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Start Screen or Game Over Screen */}
      {!isPlaying && !showFullLeaderboard && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-80 z-20">
          <div className="transform scale-[0.9] w-full max-w-4xl flex flex-col items-center">
            <h2 className="text-4xl font-game text-blue-500 mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              {score > 0 ? "Game Over!" : ""}
            </h2>

            {/* GAME OVER SCREEN CONTENT */}
            {score > 0 && (
              <div className="w-full px-4">
                {/* Special reward message for scores over 200 */}
                {score >= 200 ? (
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-lg mb-4">
                    <div className="flex items-center gap-4">
                      {/* QR Code */}
                      <div className="bg-white p-2 rounded-md w-32 h-32 flex items-center justify-center flex-shrink-0">
                        <div className="text-4xl">🏆</div>
                      </div>
                      
                      {/* Reward text */}
                      <div className="flex-1">
                        <h3 className="text-xl text-yellow-300 font-bold mb-2">🎉 Congratulations! 🎉</h3>
                        <p className="text-white text-base mb-2">
                          You won a 5% discount on your next purchase!
                        </p>
                        <p className="text-white text-sm mb-2">
                          Scan this QR Code at any participating shop in the University District
                        </p>
                        <p className="text-yellow-200 text-xs">
                          Code valid until: April 30, 2025
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-yellow-300 text-xl mb-4">
                    Score 200+ points to win a special discount!
                  </p>
                )}
                
                {/* Name Input and Your Score */}
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-300 mb-1">Your Name:</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="flex-grow bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                        placeholder="Enter your name"
                        maxLength={12}
                      />
                      <button 
                        onClick={saveScore}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded font-medium transition-colors"
                        title="Save score to local leaderboard"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xl text-white mb-1">Your Score:</p>
                    <p className="text-3xl font-bold text-blue-400">{score}</p>
                  </div>
                </div>
                
                {/* Compact Leaderboard - Top 3 only */}
                <div className="bg-gray-800 rounded-lg overflow-hidden mb-4">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-2 px-3">
                    <h3 className="text-lg text-white font-bold">Leaderboard (Top 3)</h3>
                  </div>
                  
                  <div className="p-3">
                    <div className="grid grid-cols-12 gap-2 mb-1 text-gray-400 text-xs px-2">
                      <div className="col-span-1 font-semibold">#</div>
                      <div className="col-span-4 font-semibold">Name</div>
                      <div className="col-span-3 font-semibold">Car</div>
                      <div className="col-span-2 font-semibold">Score</div>
                      <div className="col-span-2 font-semibold">Date</div>
                    </div>
                    
                    {/* Current score highlighted */}
                    <div className={`${score >= 200 ? 'bg-yellow-900 bg-opacity-50' : 'bg-blue-900 bg-opacity-50'} rounded-md p-1 mb-1 grid grid-cols-12 gap-2 ${score >= 200 ? 'text-yellow-200' : 'text-white'} text-sm`}>
                      <div className="col-span-1 font-bold">★</div>
                      <div className="col-span-4 font-bold truncate">{playerName}</div>
                      <div className="col-span-3 capitalize truncate">{selectedCar}</div>
                      <div className="col-span-2 font-bold">
                        {score}{score >= 200 && ' 🏆'}
                      </div>
                      <div className="col-span-2">Today</div>
                    </div>
                    
                    {/* Top 3 Saved high scores only */}
                    {savedScores.length > 0 ? (
                      savedScores.slice(0, 3).map((savedScore, index) => (
                        <div 
                          key={index}
                          className={`${
                            savedScore.score >= 200 
                              ? 'bg-yellow-900 bg-opacity-40' 
                              : index % 2 === 0 
                                ? 'bg-gray-700' 
                                : 'bg-gray-700 bg-opacity-50'
                          } rounded-md p-1 mb-1 grid grid-cols-12 gap-2 ${
                            savedScore.score >= 200 
                              ? 'text-yellow-200' 
                              : index === 0 
                                ? 'text-gray-200' 
                                : 'text-gray-300'
                          } text-sm`}
                        >
                          <div className="col-span-1">{index + 1}</div>
                          <div className="col-span-4 truncate">{savedScore.name}</div>
                          <div className="col-span-3 capitalize truncate">{savedScore.car}</div>
                          <div className="col-span-2 font-medium">
                            {savedScore.score}{savedScore.score >= 200 && ' 🏆'}
                          </div>
                          <div className="col-span-2">{savedScore.date}</div>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="bg-gray-700 rounded-md p-1 mb-1 grid grid-cols-12 gap-2 text-gray-200 text-sm">
                          <div className="col-span-1">1</div>
                          <div className="col-span-4 truncate">Champion</div>
                          <div className="col-span-3 capitalize truncate">{selectedCar === 'phantom' ? 'peppy' : 'phantom'}</div>
                          <div className="col-span-2">{highScore}</div>
                          <div className="col-span-2">Today</div>
                        </div>
                        
                        <div className="bg-gray-700 bg-opacity-50 rounded-md p-1 mb-1 grid grid-cols-12 gap-2 text-gray-300 text-sm">
                          <div className="col-span-1">2</div>
                          <div className="col-span-4 truncate">Speedster</div>
                          <div className="col-span-3 truncate">Turbo</div>
                          <div className="col-span-2">{Math.max(160, Math.floor(highScore * 0.8))}</div>
                          <div className="col-span-2">Yesterday</div>
                        </div>
                        
                        <div className="bg-gray-700 bg-opacity-50 rounded-md p-1 grid grid-cols-12 gap-2 text-gray-300 text-sm">
                          <div className="col-span-1">3</div>
                          <div className="col-span-4 truncate">Racer99</div>
                          <div className="col-span-3 truncate">Drift</div>
                          <div className="col-span-2">{Math.max(120, Math.floor(highScore * 0.6))}</div>
                          <div className="col-span-2">04/05/25</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* GAME START SCREEN CONTENT */}
            {score === 0 && (
              <div className="flex flex-col md:flex-row w-full max-w-5xl px-4 gap-8 mb-6">
                {/* Instructions on the left */}
                <div className="flex-1 text-gray-300 text-left">
                  <p className="text-xl font-semibold mb-3 text-blue-400">
                    How to Play:
                  </p>
                  {/* Essential instructions in larger font */}
                  <p className="text-lg font-medium mb-2">
                    Move with arrow keys or WASD
                  </p>
                  <p className="text-lg font-medium mb-3">
                    Hold SHIFT to boost speed
                  </p>
                  
                  {/* Key goal in smaller but emphasized font */}
                  <p className="text-sm mb-3 font-medium text-yellow-300">
                    Hit 200 points to unlock a special discount!
                  </p>
                  
                  {/* Collapsible section for more instructions */}
                  <div className="mb-2">
                    <button 
                      onClick={() => setShowMoreInstructions(!showMoreInstructions)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center focus:outline-none"
                    >
                      {showMoreInstructions ? 'Hide Instructions' : 'More Instructions'} 
                      <span className="ml-1">{showMoreInstructions ? '▲' : '▼'}</span>
                    </button>
                  </div>
                  
                  {/* Collapsible instructions */}
                  {showMoreInstructions && (
                    <div className="bg-gray-800 bg-opacity-60 p-2 rounded-md mt-1 mb-2">
                      <p className="text-sm mb-1">
                        Catch products from the University District in your basket! Each product is worth 10 points.
                      </p>
                      <p className="text-sm mb-1">
                        Avoid the obstacles... each hit will cost a life. You start with 3 lives.
                      </p>
                      <p className="text-sm mb-1">
                        As your score increases, objects move faster and more obstacles appear!
                      </p>
                      <p className="text-sm mb-1">
                        Click the Pause/Play Button to pause/unpause, or press ESC
                      </p>
                      <p className="text-sm mb-1">
                        Click the Replay Button to restart, or press R
                      </p>
                    </div>
                  )}
                </div>

                {/* Car selection on the right - fixed height container */}
                <div className="flex-1 bg-gray-800 rounded-lg p-4 flex flex-col items-center h-[340px]">
                  <p className="text-xl font-semibold mb-4 text-blue-400">
                    Choose Your Car:
                  </p>

                  {/* Car preview area - fixed size container */}
                  <div className="bg-gray-700 rounded-lg w-full h-40 mb-4 flex items-center justify-center relative">
                    {/* Current selected car display - fixed size container for the image */}
                    <div className="w-40 h-32 relative flex justify-center items-center">
                      {/* Fixed size car image display with defined aspect ratio */}
                      <div className="w-40 h-32 relative flex justify-center items-center overflow-hidden">
                        <img
                          src={carImages[selectedCar]?.src}
                          alt={selectedCar}
                          className="max-w-full max-h-full object-contain"
                          style={{ 
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                        />
                      </div>
                    </div>

                    {/* Car selection arrows */}
                    <div className="absolute inset-x-0 flex justify-between items-center px-2">
                      <button
                        onClick={() => {
                          const cars = Object.keys(carImages);
                          const currentIndex = cars.indexOf(selectedCar);
                          const prevIndex =
                            currentIndex <= 0 ? cars.length - 1 : currentIndex - 1;
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
                  <p className="text-lg text-white mb-2 capitalize">
                    {selectedCar}
                  </p>

                  {/* Display car description with fixed height */}
                  <div className="h-16 flex items-center justify-center">
                    <p className="text-sm text-gray-300 text-center px-2">
                      {carConfigs[selectedCar]?.description ||
                        "Choose your car wisely"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons row: Return to Title and Show Leaderboard */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  if (score > 0) {
                    // Reset score but don't start game yet - return to title screen
                    // Update high score if current score is higher
                    if (score > highScore) {
                      setHighScore(score);
                      localStorage.setItem('districtDriverHighScore', score.toString());
                    }
                    setScore(0); // This will trigger the title screen to display
                  } else {
                    // We're on the title screen, so start the game
                    startGame();
                  }
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium py-3 px-8 rounded-md transition shadow-md flex items-center text-lg cursor-pointer hover:opacity-90"
              >
                {score > 0 ? "Return to Title" : "Start Game"}
              </button>
              
              {/* Only show the Show Leaderboard button if we have saved scores */}
              {score > 0 && savedScores.length > 0 && (
                <button
                  onClick={() => setShowFullLeaderboard(true)}
                  className="bg-gradient-to-r from-gray-700 to-gray-800 text-white font-medium py-3 px-8 rounded-md transition shadow-md flex items-center text-lg cursor-pointer hover:opacity-90"
                >
                  Show Leaderboard
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
