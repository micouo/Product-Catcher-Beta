
import { useEffect, useRef } from 'react';
import Sketch from 'react-p5';
import p5Types from 'p5';

interface SnakeGameProps {
  className?: string;
}

export default function SnakeGame({ className }: SnakeGameProps) {
  const snake = useRef<any>(null);
  const gridSize = 40;
  const keysHeld = new Set();
  const laneCount = 5;
  const obstacleSpeed = 4;
  const playAreaHeight = 200;
  const currentSteer = useRef<any>(null);
  const obstacles = useRef<any[]>([]);
  const fallingFood = useRef<any[]>([]);
  const score = useRef<number>(0);
  const gameStarted = useRef<boolean>(false);

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(800, 600).parent(canvasParentRef);
    p5.textFont('Courier New');
    p5.frameRate(60);
    currentSteer.current = p5.createVector(0, 0);
    obstacles.current = [];
    fallingFood.current = [];
    snake.current = new Snake(p5);
  };

  class Snake {
    pos: any;
    vel: any;
    speed: number;

    constructor(p5: p5Types) {
      this.pos = p5.createVector(p5.width/2, p5.height - 100);
      this.vel = p5.createVector(0, 0);
      this.speed = 5;
    }

    update(p5: p5Types) {
      this.vel.x = currentSteer.current.x * this.speed;
      this.vel.y = currentSteer.current.y * this.speed;
      this.pos.add(this.vel);
      
      // Keep snake in bounds
      this.pos.x = p5.constrain(this.pos.x, 0, p5.width);
      this.pos.y = p5.constrain(this.pos.y, p5.height - playAreaHeight, p5.height);
    }

    show(p5: p5Types) {
      p5.fill(0, 255, 0);
      p5.circle(this.pos.x, this.pos.y, gridSize * 0.8);
    }

    eat(food: any, p5: p5Types) {
      const foodPos = p5.createVector(food.x + gridSize/2, food.y + gridSize/2);
      const d = this.pos.dist(foodPos);
      return d < gridSize;
    }

    increaseSpeed() {
      this.speed = Math.min(this.speed + 0.5, 10);
    }
  }

  const drawTitleScreen = (p5: p5Types) => {
    p5.background(30);
    p5.fill(255);
    p5.textSize(32);
    p5.textAlign(p5.CENTER);
    p5.text('Snake Game', p5.width/2, p5.height/2 - 20);
    p5.textSize(16);
    p5.text('Press any key to start', p5.width/2, p5.height/2 + 20);
  };

  const handleInput = () => {
    if (keysHeld.has('a') || keysHeld.has('arrowleft')) currentSteer.current.x = -1;
    else if (keysHeld.has('d') || keysHeld.has('arrowright')) currentSteer.current.x = 1;
    else currentSteer.current.x = 0;
    
    if (keysHeld.has('w') || keysHeld.has('arrowup')) currentSteer.current.y = -1;
    else if (keysHeld.has('s') || keysHeld.has('arrowdown')) currentSteer.current.y = 1;
    else currentSteer.current.y = 0;
  };

  const startGame = (p5: p5Types) => {
    gameStarted.current = true;
    snake.current = new Snake(p5);
    score.current = 0;
    obstacles.current = [];
    fallingFood.current = [];
  };

  const gameOver = (p5: p5Types) => {
    gameStarted.current = false;
    startGame(p5);
  };

  const drawHUD = (p5: p5Types) => {
    p5.fill(255);
    p5.textSize(24);
    p5.textAlign(p5.LEFT);
    p5.text(`Score: ${score.current}`, 20, 40);
  };

  const draw = (p5: p5Types) => {
    if (!gameStarted.current) {
      drawTitleScreen(p5);
      return;
    }

    handleInput();
    p5.background(30);

    p5.stroke(255);
    p5.strokeWeight(2);
    p5.line(0, p5.height - playAreaHeight, p5.width, p5.height - playAreaHeight);
    p5.noStroke();

    // Update and draw obstacles
    for (let i = obstacles.current.length - 1; i >= 0; i--) {
      obstacles.current[i].y += obstacleSpeed;
      p5.fill(200, 0, 0);
      p5.rect(obstacles.current[i].x, obstacles.current[i].y, gridSize, gridSize);
      
      if (snake.current.eat(obstacles.current[i])) {
        gameOver(p5);
      }
      
      if (obstacles.current[i].y > p5.height) {
        obstacles.current.splice(i, 1);
      }
    }

    // Update and draw food
    for (let i = fallingFood.current.length - 1; i >= 0; i--) {
      fallingFood.current[i].y += obstacleSpeed;
      p5.fill(255, 0, 100);
      p5.ellipse(fallingFood.current[i].x + gridSize/2, fallingFood.current[i].y + gridSize/2, gridSize * 0.9);
      
      if (snake.current.eat(fallingFood.current[i], p5)) {
        fallingFood.current.splice(i, 1);
        score.current++;
        snake.current.increaseSpeed();
      } else if (fallingFood.current[i].y > p5.height) {
        fallingFood.current.splice(i, 1);
      }
    }

    // Spawn new obstacles
    if (p5.frameCount % 30 === 0) {
      const lane = Math.floor(p5.random(laneCount));
      const x = lane * (p5.width / laneCount) + (p5.width / laneCount - gridSize) / 2;
      obstacles.current.push({ x, y: -gridSize });
    }

    // Spawn new food
    if (p5.frameCount % 90 === 0) {
      const lane = Math.floor(p5.random(laneCount));
      const x = lane * (p5.width / laneCount) + (p5.width / laneCount - gridSize) / 2;
      fallingFood.current.push({ x, y: -gridSize });
    }

    snake.current.update(p5);
    snake.current.show(p5);
    drawHUD(p5);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted.current) {
        startGame(window._p5);
        return;
      }
      keysHeld.add(e.key.toLowerCase());
    };

    const handleKeyRelease = (e: KeyboardEvent) => {
      keysHeld.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('keyup', handleKeyRelease);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('keyup', handleKeyRelease);
    };
  }, []);

  return (
    <div className={className}>
      <Sketch setup={setup} draw={draw} />
    </div>
  );
}
