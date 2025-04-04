import React, { useEffect, useRef, useState } from 'react';

interface BackgroundProps {
  width: number;
  height: number;
}

export default function Background({ width, height }: BackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const scrollOffsetRef = useRef(0);
  const scrollSpeedRef = useRef(0.5); // Pixels per frame - much slower for a subtle effect

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up continuous animation for scrolling background
    const animate = () => {
      if (!ctx) return;
      
      // Update scroll offset using ref to avoid re-renders
      scrollOffsetRef.current = (scrollOffsetRef.current + scrollSpeedRef.current) % 200;
      
      // Draw pixelated shopping district background with scrolling
      ctx.clearRect(0, 0, width, height);
      drawBackground(ctx, width, height, scrollOffsetRef.current);
      
      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    // Cleanup animation on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height]);

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, scrollOffset: number = 0) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    skyGradient.addColorStop(0, '#4B79A1');  // Deep blue at top
    skyGradient.addColorStop(1, '#79A7D3');  // Lighter blue at horizon
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height * 0.6);
    
    // Draw buildings - pixelated style (all elements move at the same speed)
    drawBuildings(ctx, width, height, scrollOffset);
    
    // Calculate the position of the player area (where the white border is)
    const playerAreaY = height - 202; // 2px for the border
    
    // Draw sidewalk - end at the white border line
    ctx.fillStyle = '#A9A9A9'; // Concrete gray
    ctx.fillRect(0, height * 0.6, width, playerAreaY - (height * 0.6));
    
    // Draw sidewalk texture - grid lines with scrolling offset
    drawSidewalkTexture(ctx, width, height, playerAreaY, scrollOffset);
    
    // The street should start where the sidewalk ends
    ctx.fillStyle = '#333333'; // Asphalt dark gray
    ctx.fillRect(0, playerAreaY, width, height - playerAreaY);
    
    // Draw street markings with same scrolling offset for uniform movement
    drawStreetMarkings(ctx, width, height, playerAreaY, scrollOffset);
  };

  const drawBuildings = (ctx: CanvasRenderingContext2D, width: number, height: number, scrollOffset: number = 0) => {
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
    
    // Calculate extra width to ensure seamless scrolling
    const extraWidth = 200; // Draw beyond visible area for seamless scrolling
    
    // Generate buildings with different heights and colors
    // Start offscreen to the left to ensure continuous scrolling
    let xPos = -extraWidth - scrollOffset;
    while (xPos < width + extraWidth) {
      // Ensure consistent building patterns based on absolute position
      const absoluteX = Math.abs(xPos); // Use absolute position for deterministic pattern
      const buildingWidth = ((absoluteX % 3) + 1) * 30 + 50; // 80-140 width
      const buildingHeight = ((absoluteX % 4) + 1) * 30 + (height * 0.2); // Varied heights
      const colorIndex = Math.floor(absoluteX % buildingColors.length);
      
      // Draw building - base structure with pixelated effect
      ctx.fillStyle = buildingColors[colorIndex];
      
      // Draw with pixelated effect by creating grid of squares
      for (let y = height * 0.6 - buildingHeight; y < height * 0.6; y += pixelSize) {
        for (let x = xPos; x < xPos + buildingWidth; x += pixelSize) {
          // Deterministic color variation based on position
          if ((Math.abs(x) + y) % 10 === 0) {
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
      if (absoluteX % 2 === 0) {
        drawStoreSign(ctx, xPos, buildingWidth, height * 0.6 - buildingHeight * 0.3);
      }
      
      xPos += buildingWidth;
    }
  };

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

  const drawSidewalkTexture = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    playerAreaY: number = height * 0.8,
    scrollOffset: number = 0
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
    
    // Draw vertical lines with scrolling - stop at the player area
    // Calculate line positions based on scrollOffset for smooth scrolling
    const lineSpacing = 40; // Space between vertical lines
    const offsetX = scrollOffset % lineSpacing; // Ensure smooth repeat
    
    for (let x = -offsetX; x < width + lineSpacing; x += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, height * 0.6);
      ctx.lineTo(x, playerAreaY);
      ctx.stroke();
    }
  };

  const drawStreetMarkings = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    playerAreaY: number,
    scrollOffset: number = 0
  ) => {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    
    // Create scrolling dashed lines
    const dashLength = 20;
    const gapLength = 15;
    const totalLength = dashLength + gapLength;
    
    // Adjust the dash pattern based on scroll offset
    const dashOffset = scrollOffset % totalLength;
    ctx.setLineDash([dashLength, gapLength]);
    ctx.lineDashOffset = -dashOffset; // Negative for forward movement
    
    // Draw center line in middle of street area (playerAreaY to bottom)
    const centerY = playerAreaY + (height - playerAreaY) / 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    
    // Reset line style
    ctx.setLineDash([]);
  };

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

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0 z-0"
    />
  );
}