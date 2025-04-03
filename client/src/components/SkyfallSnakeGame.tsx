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
          
          // We've moved the input handling to keyPressed for immediate response
          // so we don't need to call handleInput() every frame
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
          p.text("Skyfall Snake", p.width / 2, p.height / 2 - 100);
          p.textSize(p.width / 40);
          p.text("Click to Start", p.width / 2, p.height / 2 - 30);
          p.text("Use WASD or Arrow Keys to Move", p.width / 2, p.height / 2 + 10);
          p.text("Hold SHIFT to Boost (loses health)", p.width / 2, p.height / 2 + 40);
          p.text("Catch the apples, dodge the rocks!", p.width / 2, p.height / 2 + 70);
          
          // Blink "Click Game Area for Keyboard Control" message
          if (Math.floor(p.frameCount / 30) % 2 === 0) {
            p.fill(255, 255, 0);
            p.text("Click Game Area for Keyboard Control", p.width / 2, p.height / 2 + 110);
          }
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
            return false;
          }
          
          const keyLower = p.key.toLowerCase();
          
          // Handle special keys and add to keysHeld
          if (p.keyCode === p.UP_ARROW) {
            keysHeld.add('arrowup');
            // Force immediate direction update with direct call
            currentSteer.set(0, -1);
            currentSteer.normalize();
            snake.setDirection(currentSteer);
            console.log("UP pressed - Direction immediately set to 0,-1");
          } 
          else if (p.keyCode === p.DOWN_ARROW) {
            keysHeld.add('arrowdown');
            currentSteer.set(0, 1);
            currentSteer.normalize();
            snake.setDirection(currentSteer); 
            console.log("DOWN pressed - Direction immediately set to 0,1");
          }
          else if (p.keyCode === p.LEFT_ARROW) {
            keysHeld.add('arrowleft');
            currentSteer.set(-1, 0);
            currentSteer.normalize();
            snake.setDirection(currentSteer);
            console.log("LEFT pressed - Direction immediately set to -1,0");
          }
          else if (p.keyCode === p.RIGHT_ARROW) {
            keysHeld.add('arrowright');
            currentSteer.set(1, 0);
            currentSteer.normalize();
            snake.setDirection(currentSteer);
            console.log("RIGHT pressed - Direction immediately set to 1,0");
          }
          // Handle WASD keys with same immediate direction changes
          else if (keyLower === 'w') {
            keysHeld.add(keyLower);
            currentSteer.set(0, -1);
            currentSteer.normalize();
            snake.setDirection(currentSteer);
            console.log("W pressed - Direction immediately set to 0,-1");
          }
          else if (keyLower === 'a') {
            keysHeld.add(keyLower);
            currentSteer.set(-1, 0);
            currentSteer.normalize();
            snake.setDirection(currentSteer);
            console.log("A pressed - Direction immediately set to -1,0");
          }
          else if (keyLower === 's') {
            keysHeld.add(keyLower);
            currentSteer.set(0, 1);
            currentSteer.normalize();
            snake.setDirection(currentSteer);
            console.log("S pressed - Direction immediately set to 0,1");
          }
          else if (keyLower === 'd') {
            keysHeld.add(keyLower);
            currentSteer.set(1, 0);
            currentSteer.normalize();
            snake.setDirection(currentSteer);
            console.log("D pressed - Direction immediately set to 1,0");
          }
          else {
            // For other keys, just add to keysHeld
            keysHeld.add(keyLower);
          }
          
          // Special handling for boost and reset
          if (p.key === 'Shift' || p.keyCode === p.SHIFT) boost = true;
          if (keyLower === 'r') resetGame();
          
          // Apply the input immediately
          handleInput();
          
          // Prevent default behavior for game keys
          return false;
        };
        
        p.keyReleased = () => {
          const keyLower = p.key.toLowerCase();
          
          // Handle special keys and remove from keysHeld
          if (p.keyCode === p.UP_ARROW) keysHeld.delete('arrowup');
          else if (p.keyCode === p.DOWN_ARROW) keysHeld.delete('arrowdown');
          else if (p.keyCode === p.LEFT_ARROW) keysHeld.delete('arrowleft');
          else if (p.keyCode === p.RIGHT_ARROW) keysHeld.delete('arrowright');
          else keysHeld.delete(keyLower);
          
          if (p.key === 'Shift' || p.keyCode === p.SHIFT) boost = false;
          
          // Prevent default behavior for game keys
          return false;
        };
        
        p.mousePressed = () => {
          if (!gameStarted) {
            startGame();
          }
        };
        
        function handleInput() {
          // We don't need this function anymore since we're handling
          // input directly in keyPressed where we apply the input immediately
          // This is only kept for backwards compatibility
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
            // Don't update if no velocity
            if (this.vel.mag() === 0) return;
            
            // Calculate movement step based on current speed and boost status
            let step = this.vel.copy().normalize().mult(
              boost ? this.speed * this.boostMultiplier : this.speed
            );
            
            // Update head position
            this.head.add(step);
            
            // Check bounds before constraining to allow for direction change at borders
            let hitBoundary = false;
            
            // Store original position for boundary checking
            const originalX = this.head.x;
            const originalY = this.head.y;
            
            // Apply constraints
            this.head.x = p.constrain(this.head.x, 0, p.width);
            this.head.y = p.constrain(this.head.y, p.height - playAreaHeight, p.height);
            
            // Check if we hit a boundary (position was changed by constrain)
            if (originalX !== this.head.x || originalY !== this.head.y) {
              console.log("Hit boundary, please change direction");
              hitBoundary = true;
            }
            
            // Add new segment to track snake's path
            this.segments.push(this.head.copy());
            
            // Maintain snake length
            let effectiveLength = boost ? this.length * 0.97 : this.length;
            while (this.totalDistance() > effectiveLength * gridSize) {
              this.segments.shift();
            }
            
            // Apply boost penalty to length if boosting
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
  
  useEffect(() => {
    // Add global event listeners to better capture keyboard events
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameContainerRef.current) {
        // Capture keys for game control - prevent scrolling with arrows
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
          e.preventDefault();
        }
      }
    };
    
    // Add event listeners to window to ensure keys are captured
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div 
      ref={gameContainerRef} 
      className="w-full rounded-lg overflow-hidden bg-black focus:outline-none focus:ring-2 focus:ring-primary"
      style={{ minHeight: '400px', height: 'calc(min(600px, 70vh))' }}
      tabIndex={0}
      onClick={(e) => {
        // Make sure the container gets focus when clicked
        if (e.currentTarget) {
          e.currentTarget.focus();
        }
      }}
      onFocus={() => console.log('Game container focused')}
    />
  );
};

export default SkyfallSnakeGame;