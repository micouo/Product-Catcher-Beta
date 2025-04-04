import React, { useEffect, useRef, useState } from 'react';
import cloudImage from '@assets/cloud.png';

interface BackgroundProps {
  width: number;
  height: number;
  playerX?: number; // Optional player X position for parallax effect
  playerY?: number; // Optional player Y position for parallax effect
}

interface BackgroundLayer {
  elements: {
    x: number;
    y: number;
    scale: number;
    originalX: number; // Store the original position for parallax calculations
    originalY: number;
  }[];
  parallaxFactor: number; // How much this layer moves relative to player (0 = static, 1 = moves with player)
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number, elements: any[]) => void;
}

export default function Background({ width, height, playerX = width / 2, playerY = height / 2 }: BackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cloudImgRef = useRef<HTMLImageElement | null>(null);
  const cloudLoadedRef = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Define the background layers with parallax factors
  const layersRef = useRef<BackgroundLayer[]>([]);
  
  // Initialize layers if they haven't been created yet
  const initializeLayers = () => {
    if (layersRef.current.length > 0) return; // Only initialize once
    
    // Layer 1: Sky & Clouds (slow movement)
    layersRef.current.push({
      elements: [
        { x: width * 0.15, y: height * 0.12, scale: 0.2, originalX: width * 0.15, originalY: height * 0.12 },
        { x: width * 0.4, y: height * 0.08, scale: 0.15, originalX: width * 0.4, originalY: height * 0.08 },
        { x: width * 0.7, y: height * 0.15, scale: 0.25, originalX: width * 0.7, originalY: height * 0.15 },
        { x: width * 0.85, y: height * 0.1, scale: 0.18, originalX: width * 0.85, originalY: height * 0.1 }
      ],
      parallaxFactor: 0.05, // Clouds move very slowly
      draw: drawClouds
    });
    
    // Layer 2: Buildings (medium movement)
    layersRef.current.push({
      elements: [], // Building positions are calculated in the draw function
      parallaxFactor: 0.1, // Buildings move a bit faster than clouds
      draw: drawBuildings
    });
    
    // Layer 3: Sidewalk (faster movement)
    layersRef.current.push({
      elements: [],
      parallaxFactor: 0.2, // Sidewalk moves faster than buildings
      draw: drawSidewalk
    });
    
    // Layer 4: Street (fastest movement - closest to player)
    layersRef.current.push({
      elements: [],
      parallaxFactor: 0.3, // Street moves the fastest
      draw: drawStreetLayer
    });
    
    setIsInitialized(true);
  };

  useEffect(() => {
    // Load the cloud image
    if (!cloudImgRef.current) {
      const img = new Image();
      img.src = cloudImage;
      img.onload = () => {
        cloudLoadedRef.current = true;
        
        // Initialize layers after image loads
        initializeLayers();
        
        // Trigger initial render
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            drawBackground(ctx, width, height, playerX, playerY);
          }
        }
      };
      cloudImgRef.current = img;
    } else {
      // Initialize layers if image is already loaded
      initializeLayers();
    }
    
    // Draw background when component mounts or when dimensions or player position change
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    drawBackground(ctx, width, height, playerX, playerY);
    
  }, [width, height, playerX, playerY, isInitialized]);

  // Helper function to adjust color brightness
  const adjustBrightness = (hex: string, factor: number): string => {
    // Convert hex to RGB
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    
    // Adjust brightness
    r = Math.min(255, Math.floor(r * factor));
    g = Math.min(255, Math.floor(g * factor));
    b = Math.min(255, Math.floor(b * factor));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Draw a pixelated sun with rays
  const drawSun = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    const pixelSize = 6; // Larger pixels for more pixelated look
    
    // Draw base pixelated sun circle (no gradients - more pixel art style)
    ctx.fillStyle = '#FFD700'; // Gold color for the sun
    
    // Draw sun using a grid of squares
    for (let px = x - radius; px < x + radius; px += pixelSize) {
      for (let py = y - radius; py < y + radius; py += pixelSize) {
        // Check if pixel is inside the circle
        const distance = Math.sqrt(Math.pow(px - x, 2) + Math.pow(py - y, 2));
        
        if (distance < radius) {
          // Outer part of sun
          if (distance > radius * 0.7) {
            ctx.fillStyle = '#FFC107'; // Darker gold for outer edge
          } 
          // Inner part of sun
          else {
            ctx.fillStyle = '#FFEB3B'; // Brighter yellow for inner part
          }
          
          ctx.fillRect(px, py, pixelSize, pixelSize);
        }
      }
    }
    
    // Draw pixelated sun rays
    ctx.fillStyle = '#FFD700';
    
    const rayCount = 8;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      
      // Draw each ray as a series of small rectangles
      const rayLength = radius * 1.8;
      const rayStart = radius * 1.1;
      
      for (let r = rayStart; r < rayLength; r += pixelSize) {
        const rx = x + Math.cos(angle) * r;
        const ry = y + Math.sin(angle) * r;
        
        ctx.fillRect(rx - pixelSize/2, ry - pixelSize/2, pixelSize, pixelSize);
      }
    }
  };
  
  // Draw clouds using the provided cloud image with parallax
  const drawClouds = (ctx: CanvasRenderingContext2D, width: number, height: number, elements: any[]) => {
    // Check if cloud image is loaded
    if (!cloudImgRef.current || !cloudLoadedRef.current) return;
    
    const cloudImg = cloudImgRef.current;
    
    elements.forEach(cloud => {
      // Calculate size - scale based on the original image dimensions
      const cloudWidth = cloudImg.width * cloud.scale;
      const cloudHeight = cloudImg.height * cloud.scale;
      
      // Draw cloud image centered at the position
      ctx.drawImage(
        cloudImg,
        cloud.x - cloudWidth / 2,  // Center the cloud horizontally
        cloud.y - cloudHeight / 2, // Center the cloud vertically
        cloudWidth,
        cloudHeight
      );
    });
  };

  // Draw windows on buildings
  const drawWindows = (
    ctx: CanvasRenderingContext2D, 
    buildingX: number, 
    buildingY: number, 
    buildingWidth: number, 
    buildingHeight: number,
    pixelSize: number
  ) => {
    const windowSize = pixelSize * 3; // Window size in pixels
    const windowSpacing = pixelSize * 5; // Space between windows
    
    // Calculate number of windows that fit horizontally and vertically
    const windowsPerRow = Math.floor((buildingWidth - windowSpacing) / (windowSize + windowSpacing));
    const windowRows = Math.floor((buildingHeight - windowSpacing) / (windowSize + windowSpacing));
    
    // Horizontal margin to center windows
    const marginX = (buildingWidth - (windowsPerRow * windowSize + (windowsPerRow - 1) * windowSpacing)) / 2;
    
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowsPerRow; col++) {
        const windowX = buildingX + marginX + col * (windowSize + windowSpacing);
        const windowY = buildingY + windowSpacing + row * (windowSize + windowSpacing);
        
        // Deterministically decide if window is lit (yellow) or dark
        if ((row + col + Math.floor(buildingX)) % 3 !== 0) {
          ctx.fillStyle = 'rgba(255, 255, 190, 0.8)'; // Lit window
        } else {
          ctx.fillStyle = 'rgba(50, 50, 80, 0.8)'; // Dark window
        }
        
        ctx.fillRect(windowX, windowY, windowSize, windowSize);
      }
    }
  };

  // Draw decorative store signs on buildings
  const drawStoreSign = (
    ctx: CanvasRenderingContext2D, 
    buildingX: number, 
    buildingWidth: number,
    signY: number
  ) => {
    const signWidth = buildingWidth * 0.7;
    const signHeight = 20;
    const signX = buildingX + (buildingWidth - signWidth) / 2;
    
    // Draw sign background
    ctx.fillStyle = '#FFD54F';
    ctx.fillRect(signX, signY, signWidth, signHeight);
    
    // Draw colored decorative elements on sign deterministically
    const signElements = Math.floor(signWidth / 8);
    for (let i = 0; i < signElements; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = i % 4 === 0 ? '#E63946' : '#2A9D8F';
        ctx.fillRect(signX + i * 8, signY, 6, signHeight);
      }
    }
  };

  // Draw pixelated buildings for the city skyline with parallax support
  const drawBuildings = (ctx: CanvasRenderingContext2D, width: number, height: number, elements: any[]) => {
    const buildingColors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#F8B500', // Yellow
      '#8675A9', // Purple
      '#35A7FF', // Blue
      '#FFD166', // Light yellow
      '#E63946', // Dark red
      '#457B9D', // Dark blue
    ];

    const pixelSize = 4; // Size of each "pixel" to create pixelated effect
    
    // Generate buildings with different heights and colors
    let xPos = 0;
    while (xPos < width) {
      // Use fixed values for a consistent background
      const buildingWidth = ((xPos % 3) + 1) * 30 + 50; // 80-140 width
      const buildingHeight = ((xPos % 4) + 1) * 30 + (height * 0.2); // Varied heights
      const colorIndex = Math.floor(xPos % buildingColors.length);
      
      // Draw building - base structure with pixelated effect
      ctx.fillStyle = buildingColors[colorIndex];
      
      // Draw with pixelated effect by creating grid of squares
      for (let y = height * 0.6 - buildingHeight; y < height * 0.6; y += pixelSize) {
        for (let x = xPos; x < xPos + buildingWidth; x += pixelSize) {
          // Deterministic color variation based on position
          if ((x + y) % 10 === 0) {
            ctx.fillStyle = adjustBrightness(buildingColors[colorIndex], 0.9);
          } else {
            ctx.fillStyle = buildingColors[colorIndex];
          }
          
          const pixelW = Math.min(pixelSize, xPos + buildingWidth - x);
          const pixelH = Math.min(pixelSize, height * 0.6 - y);
          ctx.fillRect(x, y, pixelW, pixelH);
        }
      }
      
      // Draw windows
      drawWindows(ctx, xPos, height * 0.6 - buildingHeight, buildingWidth, buildingHeight, pixelSize);
      
      // Store shop signs on some buildings deterministically
      if (xPos % 2 === 0) {
        drawStoreSign(ctx, xPos, buildingWidth, height * 0.6 - buildingHeight * 0.3);
      }
      
      xPos += buildingWidth;
    }
  };

  // Draw grid pattern on sidewalk
  const drawSidewalkTexture = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    playerAreaY: number = height * 0.8
  ) => {
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 1;
    
    // Draw horizontal lines - stop at the player area
    for (let y = height * 0.65; y < playerAreaY; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw vertical lines - stop at the player area
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, height * 0.6);
      ctx.lineTo(x, playerAreaY);
      ctx.stroke();
    }
  };

  // Draw road markings on street
  const drawStreetMarkings = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    playerAreaY: number
  ) => {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.setLineDash([20, 15]); // Dashed line pattern
    
    // Draw center line in middle of street area (playerAreaY to bottom)
    const centerY = playerAreaY + (height - playerAreaY) / 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    
    // Reset line style
    ctx.setLineDash([]);
  };

  // Standalone Sidewalk drawing function for parallax
  const drawSidewalk = (ctx: CanvasRenderingContext2D, width: number, height: number, elements: any[]) => {
    // Calculate the position of the player area (where the white border is)
    const playerAreaY = height - 202; // 2px for the border
    
    // Draw sidewalk - end at the white border line
    ctx.fillStyle = '#A9A9A9'; // Concrete gray
    ctx.fillRect(0, height * 0.6, width, playerAreaY - (height * 0.6));
    
    // Draw sidewalk texture - grid lines
    drawSidewalkTexture(ctx, width, height, playerAreaY);
  };
  
  // Standalone Street drawing function for parallax
  const drawStreetLayer = (ctx: CanvasRenderingContext2D, width: number, height: number, elements: any[]) => {
    // Calculate the position of the player area (where the white border is)
    const playerAreaY = height - 202; // 2px for the border
    
    // The street should start where the sidewalk ends
    ctx.fillStyle = '#333333'; // Asphalt dark gray
    ctx.fillRect(0, playerAreaY, width, height - playerAreaY);
    
    // Draw street markings
    drawStreetMarkings(ctx, width, height, playerAreaY);
  };
  
  // Draw the entire background scene with parallax effect
  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, playerX: number, playerY: number) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw sky gradient (always static, no parallax)
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    skyGradient.addColorStop(0, '#4B79A1');  // Deep blue at top
    skyGradient.addColorStop(1, '#79A7D3');  // Lighter blue at horizon
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height * 0.6);
    
    // Center point of the canvas
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Get offset from center (how much player has moved from center)
    const offsetX = playerX - centerX;
    const offsetY = playerY - centerY;
    
    // Draw each layer with its parallax effect
    if (layersRef.current.length > 0 && isInitialized) {
      layersRef.current.forEach((layer, index) => {
        // Save the current state
        ctx.save();
        
        // Apply parallax translation to this layer
        // The further the player is from center, the more the layer moves in the opposite direction
        // The parallaxFactor determines how much this layer moves relative to player movement
        const parallaxX = -offsetX * layer.parallaxFactor;
        const parallaxY = -offsetY * layer.parallaxFactor;
        
        // For elements with stored positions (like clouds)
        if (layer.elements.length > 0) {
          // Apply parallax to each element in the layer
          const adjustedElements = layer.elements.map(element => {
            return {
              ...element,
              x: element.originalX + parallaxX,
              y: element.originalY + parallaxY
            };
          });
          
          // Draw this layer with parallax-adjusted elements
          layer.draw(ctx, width, height, adjustedElements);
        } else {
          // For layers without specific elements (like buildings, sidewalk)
          // Translate the entire canvas for drawing
          ctx.translate(parallaxX, parallaxY);
          layer.draw(ctx, width, height, []);
        }
        
        // Restore to original state
        ctx.restore();
      });
    } else {
      // Fallback if layers aren't initialized yet - draw without parallax
      drawClouds(ctx, width, height, []);
      drawBuildings(ctx, width, height, []);
      drawSidewalk(ctx, width, height, []);
      drawStreetLayer(ctx, width, height, []);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0 z-0"
    />
  );
}