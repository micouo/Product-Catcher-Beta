
import { useEffect, useRef } from 'react';
import Sketch from 'react-p5';
import p5Types from 'p5';

interface SnakeGameProps {
  className?: string;
}

export default function SnakeGame({ className }: SnakeGameProps) {
  let snake: any;
  let food: any;
  let gridSize = 40;
  let keysHeld = new Set();
  let boost = false;
  let score = 0;
  let gameStarted = false;
  let obstacles: any[] = [];
  let fallingFood: any[] = [];
  let laneCount = 5;
  let obstacleSpeed = 4;
  let playAreaHeight = 200;
  let currentSteer: any;

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(800, 600).parent(canvasParentRef);
    p5.textFont('Courier New');
    p5.frameRate(60);
    currentSteer = p5.createVector(0, 0);
  };

  const drawTitleScreen = (p5: p5Types) => {
    p5.background(30);
    p5.fill(255);
    p5.textSize(32);
    p5.textAlign(p5.CENTER);
    p5.text('Snake Game', p5.width/2, p5.height/2 - 20);
    p5.textSize(16);
    p5.text('Press any key to start', p5.width/2, p5.height/2 + 20);
  };

  const handleInput = (p5: p5Types) => {
    if (keysHeld.has('a') || keysHeld.has('arrowleft')) currentSteer.x = -1;
    if (keysHeld.has('d') || keysHeld.has('arrowright')) currentSteer.x = 1;
    if (keysHeld.has('w') || keysHeld.has('arrowup')) currentSteer.y = -1;
    if (keysHeld.has('s') || keysHeld.has('arrowdown')) currentSteer.y = 1;
  };

  const startGame = () => {
    gameStarted = true;
    snake = new Snake(p5);
  };

  const resetGame = () => {
    score = 0;
    obstacles = [];
    fallingFood = [];
    snake = new Snake(p5);
  };

  const gameOver = (p5: p5Types) => {
    gameStarted = false;
    resetGame();
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
      this.vel.x = currentSteer.x * this.speed;
      this.vel.y = currentSteer.y * this.speed;
      this.pos.add(this.vel);
      
      // Keep snake in bounds
      this.pos.x = p5.constrain(this.pos.x, 0, p5.width);
      this.pos.y = p5.constrain(this.pos.y, p5.height - playAreaHeight, p5.height);
    }

    show(p5: p5Types) {
      p5.fill(0, 255, 0);
      p5.circle(this.pos.x, this.pos.y, gridSize * 0.8);
    }

    eat(food: any) {
      return this.pos.dist(p5.createVector(food.x + gridSize/2, food.y + gridSize/2)) < gridSize;
    }

    increaseSpeed() {
      this.speed = Math.min(this.speed + 0.5, 10);
    }
  }

  const drawHUD = (p5: p5Types) => {
    p5.fill(255);
    p5.textSize(24);
    p5.textAlign(p5.LEFT);
    p5.text(`Score: ${score}`, 20, 40);
  };

  const draw = (p5: p5Types) => {
    if (!gameStarted) {
      drawTitleScreen(p5);
      return;
    }

    handleInput(p5);
    p5.background(30);

    p5.stroke(255);
    p5.strokeWeight(2);
    p5.line(0, p5.height - playAreaHeight, p5.width, p5.height - playAreaHeight);
    p5.noStroke();

    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].y += obstacleSpeed;
      p5.fill(200, 0, 0);
      p5.rect(obstacles[i].x, obstacles[i].y, gridSize, gridSize);
      if (snake.head.dist(p5.createVector(obstacles[i].x + gridSize/2, obstacles[i].y + gridSize/2)) < gridSize) {
        gameOver(p5);
      }
      if (obstacles[i].y > p5.height) {
        obstacles.splice(i, 1);
      }
    }

    for (let i = fallingFood.length - 1; i >= 0; i--) {
      fallingFood[i].y += obstacleSpeed;
      p5.fill(255, 0, 100);
      p5.ellipse(fallingFood[i].x + gridSize / 2, fallingFood[i].y + gridSize / 2, gridSize * 0.9);
      if (snake.eat(fallingFood[i])) {
        fallingFood.splice(i, 1);
        score++;
        snake.increaseSpeed();
      } else if (fallingFood[i].y > p5.height) {
        fallingFood.splice(i, 1);
      }
    }

    if (p5.frameCount % 30 === 0) {
      let lane = Math.floor(p5.random(laneCount));
      let x = lane * (p5.width / laneCount) + (p5.width / laneCount - gridSize) / 2;
      obstacles.push({ x: x, y: -gridSize });
    }

    if (p5.frameCount % 90 === 0) {
      let lane = Math.floor(p5.random(laneCount));
      let x = lane * (p5.width / laneCount) + (p5.width / laneCount - gridSize) / 2;
      fallingFood.push(p5.createVector(x, -gridSize));
    }

    snake.update(p5);
    snake.show(p5);
    drawHUD(p5);
  };

  // ... Rest of the functions and Snake class implementation
  // Converting all p5 function calls to use the p5 instance passed as parameter

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted) {
        startGame();
        return;
      }

      keysHeld.add(e.key.toLowerCase());
      if (e.key === 'Shift') boost = true;
      if (e.key.toLowerCase() === 'r') resetGame();
    };

    const handleKeyRelease = (e: KeyboardEvent) => {
      keysHeld.delete(e.key.toLowerCase());
      if (e.key === 'Shift') boost = false;
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('keyup', handleKeyRelease);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('keyup', handleKeyRelease);
    };
  }, [gameStarted]);

  return (
    <div className={className}>
      <Sketch setup={setup} draw={draw} />
    </div>
  );
}
