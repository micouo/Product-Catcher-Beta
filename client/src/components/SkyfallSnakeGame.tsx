import { useEffect, useRef } from 'react';
import p5 from 'p5';

interface SnakeSegment {
  x: number;
  y: number;
  copy(): SnakeSegment;
  dist(other: SnakeSegment): number;
}

interface Obstacle {
  x: number;
  y: number;
}

interface SnakeClass {
  head: p5.Vector;
  segments: p5.Vector[];
  length: number;
  speed: number;
  maxSpeed: number;
  speedIncrease: number;
  boostMultiplier: number;
  vel: p5.Vector;
  
  setDirection(dir: p5.Vector): void;
  update(): void;
  increaseSpeed(): void;
  totalDistance(): number;
  eat(pos: p5.Vector): boolean;
  endGame(): boolean;
  show(): void;
}

const SkyfallSnakeGame = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Only create the p5 instance once
    if (gameContainerRef.current && !gameContainerRef.current.hasChildNodes()) {
      const sketch = (p: p5) => {
        let snake: SnakeClass;
        let food: p5.Vector;
        let gridSize = 40;
        let keysHeld = new Set<string>();
        let boost = false;
        let score = 0;
        let gameStarted = false;
        let obstacles: Obstacle[] = [];
        let fallingFood: p5.Vector[] = [];
        let laneCount = 5;
        let obstacleSpeed = 4;
        let playAreaHeight = 200;
        let currentSteer: p5.Vector;
        
        p.setup = () => {
          // Make the canvas responsive to container
          const containerWidth = gameContainerRef.current?.clientWidth || 800;
          const containerHeight = Math.min(600, window.innerHeight - 100);
          const canvas = p.createCanvas(containerWidth, containerHeight);
          if (gameContainerRef.current) {
            canvas.parent(gameContainerRef.current);
          }
          
          p.textFont('Courier New');
          p.frameRate(60);
          currentSteer = p.createVector(0, 0);
        };
        
        p.draw = () => {
          if (!gameStarted) {
            drawTitleScreen();
            return;
          }
          
          handleInput();
          p.background(30);
          
          p.stroke(255);
          p.strokeWeight(2);
          p.line(0, p.height - playAreaHeight, p.width, p.height - playAreaHeight);
          p.noStroke();
          
          // Draw rocks (obstacles)
          for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].y += obstacleSpeed;
            p.fill(120);
            p.ellipse(obstacles[i].x + gridSize/2, obstacles[i].y + gridSize/2, gridSize * 0.9, gridSize * 0.9);
            if (snake.head.dist(p.createVector(obstacles[i].x + gridSize/2, obstacles[i].y + gridSize/2)) < gridSize) {
              gameOver();
            }
            if (obstacles[i].y > p.height) {
              obstacles.splice(i, 1);
            }
          }
          
          // Draw apples (falling food)
          for (let i = fallingFood.length - 1; i >= 0; i--) {
            fallingFood[i].y += obstacleSpeed;
            p.fill(255, 0, 0);
            p.ellipse(fallingFood[i].x + gridSize / 2, fallingFood[i].y + gridSize / 2, gridSize * 0.9);
            p.fill(34, 139, 34);
            p.rect(fallingFood[i].x + gridSize / 2 - 2, fallingFood[i].y + gridSize / 2 - 15, 4, 8);
            if (snake.eat(fallingFood[i])) {
              fallingFood.splice(i, 1);
              score++;
              snake.increaseSpeed();
            } else if (fallingFood[i].y > p.height) {
              fallingFood.splice(i, 1);
            }
          }
          
          // Spawn rocks
          if (p.frameCount % 30 === 0) {
            let lane = Math.floor(p.random(laneCount));
            let x = lane * (p.width / laneCount) + (p.width / laneCount - gridSize) / 2;
            obstacles.push({ x: x, y: -gridSize });
          }
          
          // Spawn apples
          if (p.frameCount % 90 === 0) {
            let lane = Math.floor(p.random(laneCount));
            let x = lane * (p.width / laneCount) + (p.width / laneCount - gridSize) / 2;
            fallingFood.push(p.createVector(x, -gridSize));
          }
          
          snake.update();
          snake.show();
          drawHUD();
        };
        
        function drawTitleScreen() {
          p.background(0);
          p.fill(255);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(p.width / 20);
          p.text("Mico's Skyfall Snake ;)", p.width / 2, p.height / 2 - 100);
          p.textSize(p.width / 40);
          p.text("Click to Start", p.width / 2, p.height / 2 - 30);
          p.text("Use WASD or Arrow Keys to Move", p.width / 2, p.height / 2 + 10);
          p.text("Hold SHIFT to Boost (loses health)", p.width / 2, p.height / 2 + 40);
          p.text("Catch the apples, dodge the rocks!", p.width / 2, p.height / 2 + 80);
        }
        
        function gameOver() {
          p.background(150, 0, 0);
          p.noLoop();
          p.fill(255);
          p.textSize(48);
          p.textAlign(p.CENTER, p.CENTER);
          p.text("GAME OVER\nPress R to Restart", p.width / 2, p.height / 2);
        }
        
        p.keyPressed = () => {
          if (!gameStarted) {
            startGame();
            return;
          }
          
          keysHeld.add(p.key.toLowerCase());
          if (p.key === 'Shift') boost = true;
          if (p.key.toLowerCase() === 'r') resetGame();
        };
        
        p.keyReleased = () => {
          keysHeld.delete(p.key.toLowerCase());
          if (p.key === 'Shift') boost = false;
        };
        
        p.mousePressed = () => {
          if (!gameStarted) {
            startGame();
          }
        };
        
        function handleInput() {
          currentSteer.set(0, 0);
          if (keysHeld.has('a') || keysHeld.has('arrowleft')) currentSteer.x = -1;
          if (keysHeld.has('d') || keysHeld.has('arrowright')) currentSteer.x = 1;
          if (keysHeld.has('w') || keysHeld.has('arrowup')) currentSteer.y = -1;
          if (keysHeld.has('s') || keysHeld.has('arrowdown')) currentSteer.y = 1;
          
          if (currentSteer.mag() > 0) {
            snake.setDirection(currentSteer);
          }
        }
        
        function resetGame() {
          score = 0;
          snake = new Snake();
          obstacles = [];
          fallingFood = [];
          p.loop();
        }
        
        function startGame() {
          gameStarted = true;
          snake = new Snake();
          obstacles = [];
          fallingFood = [];
        }
        
        function drawHUD() {
          p.fill(255);
          p.noStroke();
          p.textSize(24);
          p.textAlign(p.LEFT, p.TOP);
          p.text(`Score: ${score}`, 20, 20);
          p.text(`Health: ${snake.length.toFixed(0)}`, 20, 50);
          if (boost) {
            p.fill(255, 100, 100);
            p.text("BOOSTING!", 20, 80);
          }
        }
        
        class Snake implements SnakeClass {
          head: p5.Vector;
          segments: p5.Vector[];
          length: number;
          speed: number;
          maxSpeed: number;
          speedIncrease: number;
          boostMultiplier: number;
          vel: p5.Vector;
          
          constructor() {
            this.head = p.createVector(p.width / 2, p.height - playAreaHeight / 2);
            this.segments = [this.head.copy()];
            this.length = 1;
            this.speed = 4;
            this.maxSpeed = 8;
            this.speedIncrease = 0.2;
            this.boostMultiplier = 1.5;
            this.vel = p.createVector(0, 0);
          }
          
          setDirection(dir: p5.Vector): void {
            this.vel = dir.copy().normalize();
          }
          
          update(): void {
            if (this.vel.mag() === 0) return;
            
            let step = this.vel.copy().normalize().mult(
              boost ? this.speed * this.boostMultiplier : this.speed
            );
            
            this.head.add(step);
            this.head.x = p.constrain(this.head.x, 0, p.width);
            this.head.y = p.constrain(this.head.y, p.height - playAreaHeight, p.height);
            
            this.segments.push(this.head.copy());
            
            let effectiveLength = boost ? this.length * 0.97 : this.length;
            while (this.totalDistance() > effectiveLength * gridSize) {
              this.segments.shift();
            }
            
            if (boost) {
              this.length = Math.max(1, this.length - 0.01);
            }
          }
          
          increaseSpeed(): void {
            this.speed = Math.min(this.speed + this.speedIncrease, this.maxSpeed);
            this.length += 1;
          }
          
          totalDistance(): number {
            let d = 0;
            for (let i = 1; i < this.segments.length; i++) {
              d += p5.Vector.dist(this.segments[i], this.segments[i - 1]);
            }
            return d;
          }
          
          eat(pos: p5.Vector): boolean {
            return this.head.dist(pos) < gridSize * 0.9;
          }
          
          endGame(): boolean {
            for (let i = 0; i < this.segments.length - gridSize; i++) {
              if (this.head.dist(this.segments[i]) < gridSize / 2) return true;
            }
            return false;
          }
          
          show(): void {
            for (let i = 0; i < this.segments.length; i++) {
              let seg = this.segments[i];
              let alpha = p.map(i, 0, this.segments.length, 100, 255);
              let green = p.map(i, 0, this.segments.length, 180, 90);
              p.fill(0, green, 0, alpha);
              p.noStroke();
              p.ellipse(seg.x, seg.y, gridSize * 0.9);
            }
            
            // Draw snake head
            p.fill(0, 255, 0);
            p.stroke(0);
            p.strokeWeight(2);
            p.ellipse(this.head.x, this.head.y, gridSize);
            
            // Draw eyes
            p.fill(0);
            p.ellipse(this.head.x - 5, this.head.y - 5, 5);
            p.ellipse(this.head.x + 5, this.head.y - 5, 5);
          }
        }
      };
      
      new p5(sketch);
      
      // Cleanup
      return () => {
        if (gameContainerRef.current && gameContainerRef.current.hasChildNodes()) {
          while (gameContainerRef.current.firstChild) {
            gameContainerRef.current.removeChild(gameContainerRef.current.firstChild);
          }
        }
      };
    }
  }, []);
  
  return (
    <div 
      ref={gameContainerRef} 
      className="w-full rounded-lg overflow-hidden bg-black"
      style={{ minHeight: '400px', height: 'calc(min(600px, 70vh))' }}
      tabIndex={0}
    />
  );
};

export default SkyfallSnakeGame;