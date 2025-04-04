import React, { useEffect, useRef } from 'react';

interface BackgroundProps {
  width: number;
  height: number;
}

export default function Background({ width, height }: BackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasDrawnRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Only draw the background once, unless the dimensions change
    if (!hasDrawnRef.current || canvas.width !== width || canvas.height !== height) {
      // Draw pixelated shopping district background
      drawBackground(ctx, width, height);
      hasDrawnRef.current = true;
    }
  }, [width, height]);

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
  
  // Draw blocky pixelated clouds in the sky
  const drawClouds = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Define cloud positions - set these to fixed values for a consistent background
    const cloudPositions = [
      { x: width * 0.15, y: height * 0.15, size: 40 },
      { x: width * 0.4, y: height * 0.25, size: 30 },
      { x: width * 0.65, y: height * 0.1, size: 50 },
      { x: width * 0.9, y: height * 0.3, size: 35 }
    ];
    
    cloudPositions.forEach(cloud => {
      // Use larger pixels for more blocky clouds
      const pixelSize = 8; // Bigger pixels for blockier look
      
      // Clear fillStyle first
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // Solid white clouds
      
      // Define the core cloud shape as a simple grid
      const cloudWidth = cloud.size * 2;
      const cloudHeight = cloud.size;
      
      // Cloud shape data - 1 means draw a pixel, 0 means skip
      // This creates a blocky cloud shape that looks like classic pixel art
      const cloudShape = [
        [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 0, 0, 0]
      ];
      
      // Calculate the starting position so cloud is centered on its x,y position
      const startX = cloud.x - (cloudShape[0].length * pixelSize) / 2;
      const startY = cloud.y - (cloudShape.length * pixelSize) / 2;
      
      // Draw the cloud pixel by pixel according to the shape data
      for (let row = 0; row < cloudShape.length; row++) {
        for (let col = 0; col < cloudShape[row].length; col++) {
          if (cloudShape[row][col] === 1) {
            // Randomize the shade a bit to add texture, but keep it subtle
            const brightness = 0.95 + Math.random() * 0.05;
            const shade = Math.floor(255 * brightness);
            ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
            
            const x = startX + col * pixelSize;
            const y = startY + row * pixelSize;
            
            // Make some blocks slightly smaller for a more interesting edge
            const blockSize = ((row + col) % 3 === 0) ? 
              pixelSize - 1 : 
              pixelSize;
              
            ctx.fillRect(x, y, blockSize, blockSize);
          }
        }
      }
      
      // Add a few highlight pixels at fixed positions
      ctx.fillStyle = 'rgb(255, 255, 255)';
      const highlightPositions = [
        [1, 1], [2, 2], [3, 1], [2, 3], [4, 2]
      ];
      
      highlightPositions.forEach(pos => {
        const hx = startX + pos[0] * pixelSize;
        const hy = startY + pos[1] * pixelSize;
        ctx.fillRect(hx, hy, pixelSize, pixelSize);
      });
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

  // Draw pixelated buildings for the city skyline
  const drawBuildings = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
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

  // Draw the entire background scene
  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    skyGradient.addColorStop(0, '#4B79A1');  // Deep blue at top
    skyGradient.addColorStop(1, '#79A7D3');  // Lighter blue at horizon
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height * 0.6);
    
    // Draw clouds in the sky
    drawClouds(ctx, width, height);
    
    // Draw buildings - pixelated style
    drawBuildings(ctx, width, height);
    
    // Calculate the position of the player area (where the white border is)
    const playerAreaY = height - 202; // 2px for the border
    
    // Draw sidewalk - end at the white border line
    ctx.fillStyle = '#A9A9A9'; // Concrete gray
    ctx.fillRect(0, height * 0.6, width, playerAreaY - (height * 0.6));
    
    // Draw sidewalk texture - grid lines
    drawSidewalkTexture(ctx, width, height, playerAreaY);
    
    // The street should start where the sidewalk ends
    ctx.fillStyle = '#333333'; // Asphalt dark gray
    ctx.fillRect(0, playerAreaY, width, height - playerAreaY);
    
    // Draw street markings
    drawStreetMarkings(ctx, width, height, playerAreaY);
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