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
    // Draw sun glow
    const gradient = ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * 1.5);
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw sun
    ctx.fillStyle = '#FFD700'; // Gold color
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw pixelated core
    ctx.fillStyle = '#FFF9C4'; // Light yellow
    const pixelSize = 5;
    for (let px = x - radius + pixelSize; px < x + radius - pixelSize; px += pixelSize) {
      for (let py = y - radius + pixelSize; py < y + radius - pixelSize; py += pixelSize) {
        // Check if the point is inside the circle
        const distance = Math.sqrt(Math.pow(px - x, 2) + Math.pow(py - y, 2));
        if (distance < radius * 0.7) {
          ctx.fillRect(px, py, pixelSize, pixelSize);
        }
      }
    }
    
    // Draw sun rays
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    
    const rayCount = 8;
    const innerRadius = radius * 1.2;
    const outerRadius = radius * 1.8;
    
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const x1 = x + Math.cos(angle) * innerRadius;
      const y1 = y + Math.sin(angle) * innerRadius;
      const x2 = x + Math.cos(angle) * outerRadius;
      const y2 = y + Math.sin(angle) * outerRadius;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  };
  
  // Draw fluffy clouds in the sky
  const drawClouds = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Define cloud positions - set these to fixed values for a consistent background
    const cloudPositions = [
      { x: width * 0.15, y: height * 0.15, size: 40 },
      { x: width * 0.4, y: height * 0.25, size: 30 },
      { x: width * 0.65, y: height * 0.1, size: 50 },
      { x: width * 0.9, y: height * 0.3, size: 35 }
    ];
    
    cloudPositions.forEach(cloud => {
      // Draw a fluffy cloud made of multiple circles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      
      // Main cloud body
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Additional cloud parts
      const parts = [
        { x: cloud.x - cloud.size * 0.5, y: cloud.y, size: cloud.size * 0.7 },
        { x: cloud.x + cloud.size * 0.5, y: cloud.y, size: cloud.size * 0.8 },
        { x: cloud.x - cloud.size * 0.3, y: cloud.y - cloud.size * 0.4, size: cloud.size * 0.6 },
        { x: cloud.x + cloud.size * 0.3, y: cloud.y - cloud.size * 0.3, size: cloud.size * 0.5 }
      ];
      
      parts.forEach(part => {
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Add slight pixelation effect to clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      const pixelSize = 3;
      
      // Create a square around the cloud and fill with pixels
      const cloudLeft = cloud.x - cloud.size * 1.5;
      const cloudRight = cloud.x + cloud.size * 1.5;
      const cloudTop = cloud.y - cloud.size * 1.5;
      const cloudBottom = cloud.y + cloud.size * 1.5;
      
      for (let px = cloudLeft; px < cloudRight; px += pixelSize * 2) {
        for (let py = cloudTop; py < cloudBottom; py += pixelSize * 2) {
          // Add some randomized pixels for texture
          if (Math.random() > 0.7) {
            ctx.fillRect(px, py, pixelSize, pixelSize);
          }
        }
      }
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
    
    // Draw sun in the sky
    drawSun(ctx, width * 0.85, height * 0.15, 40);
    
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