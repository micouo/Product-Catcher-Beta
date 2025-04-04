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
  
  // Draw modern pixel art clouds with outlines
  const drawClouds = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Define cloud positions - set these to fixed values for a consistent background
    const cloudPositions = [
      { x: width * 0.15, y: height * 0.15, size: 30 },
      { x: width * 0.4, y: height * 0.25, size: 25 },
      { x: width * 0.65, y: height * 0.1, size: 40 },
      { x: width * 0.9, y: height * 0.3, size: 35 }
    ];
    
    // Define a set of cloud shapes (in pixel grid format) for more detailed pixel art
    const cloudShapes = [
      // A medium cloud shape (width: 12, height: 7 grid cells)
      [
        [0,0,0,0,1,1,1,1,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,1,1,1,1,0,0]
      ],
      // A smaller cloud shape (width: 10, height: 6 grid cells)
      [
        [0,0,1,1,1,1,0,0,0,0],
        [0,1,1,1,1,1,1,1,0,0],
        [1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,1,1,0],
        [0,0,0,1,1,1,1,0,0,0]
      ],
      // A larger cloud shape (width: 14, height: 8 grid cells)
      [
        [0,0,0,0,1,1,1,1,1,1,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,1,1,1,1,1,0,0,0]
      ]
    ];
    
    cloudPositions.forEach((cloud, index) => {
      // Use a consistent pixel size to match the car sprite's style
      const pixelSize = 5;
      
      // Select a cloud shape based on the cloud index (mod by number of shapes)
      const cloudShape = cloudShapes[index % cloudShapes.length];
      const shapeHeight = cloudShape.length;
      const shapeWidth = cloudShape[0].length;
      
      // Calculate top-left position to center the cloud shape at the cloud position
      const startX = Math.round(cloud.x - (shapeWidth * pixelSize / 2));
      const startY = Math.round(cloud.y - (shapeHeight * pixelSize / 2));
      
      // Scale factor based on the cloud size to make varieties
      const scale = cloud.size / 30;
      
      // Draw the cloud pixels
      for (let y = 0; y < shapeHeight; y++) {
        for (let x = 0; x < shapeWidth; x++) {
          // Skip empty pixels in the cloud shape
          if (cloudShape[y][x] === 0) continue;
          
          // Scaled pixel positions
          const px = startX + x * pixelSize * scale;
          const py = startY + y * pixelSize * scale;
          const pSize = pixelSize * scale;
          
          // Determine if this is an edge pixel by checking its neighbors
          let isEdge = false;
          
          // Check if on the edge of the shape
          if (x === 0 || y === 0 || x === shapeWidth-1 || y === shapeHeight-1) {
            isEdge = true;
          } else {
            // Check surrounding pixels - if any neighbor is 0, this is an edge
            if (cloudShape[y-1][x] === 0 || 
                cloudShape[y+1][x] === 0 ||
                cloudShape[y][x-1] === 0 || 
                cloudShape[y][x+1] === 0) {
              isEdge = true;
            }
          }
          
          // First draw the pixel fill - slight variation for visual interest
          // Pick a shade based on position for subtle detail
          const lightVariation = ((x + y) % 3) * 5;
          ctx.fillStyle = `rgb(${248 - lightVariation}, ${248 - lightVariation}, ${255 - lightVariation})`;
          ctx.fillRect(px, py, pSize, pSize);
          
          // Then draw a dark border if it's an edge pixel
          if (isEdge) {
            ctx.fillStyle = 'rgba(50, 80, 130, 0.6)'; // Semi-transparent blue-gray outline
            
            // Draw thinner border lines on edges
            const borderWidth = Math.max(1, Math.floor(pSize / 4));
            
            // Check which sides need borders (by checking neighbor cells)
            // Top border
            if (y === 0 || (y > 0 && cloudShape[y-1][x] === 0)) {
              ctx.fillRect(px, py, pSize, borderWidth);
            }
            
            // Bottom border
            if (y === shapeHeight-1 || (y < shapeHeight-1 && cloudShape[y+1][x] === 0)) {
              ctx.fillRect(px, py + pSize - borderWidth, pSize, borderWidth);
            }
            
            // Left border
            if (x === 0 || (x > 0 && cloudShape[y][x-1] === 0)) {
              ctx.fillRect(px, py, borderWidth, pSize);
            }
            
            // Right border
            if (x === shapeWidth-1 || (x < shapeWidth-1 && cloudShape[y][x+1] === 0)) {
              ctx.fillRect(px + pSize - borderWidth, py, borderWidth, pSize);
            }
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

  // Draw modern pixel art buildings for the city skyline
  const drawBuildings = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const buildingColors = [
      { main: '#FF6B6B', shadow: '#D14848', highlight: '#FF9494', outline: '#333333' }, // Red
      { main: '#4ECDC4', shadow: '#36A39B', highlight: '#7EEAE4', outline: '#333333' }, // Teal
      { main: '#F8B500', shadow: '#D19A00', highlight: '#FFCF57', outline: '#333333' }, // Yellow
      { main: '#8675A9', shadow: '#6E5E8C', highlight: '#A696C1', outline: '#333333' }, // Purple
      { main: '#35A7FF', shadow: '#1E85D1', highlight: '#75C5FF', outline: '#333333' }, // Blue
      { main: '#FFD166', shadow: '#D1A842', highlight: '#FFE19C', outline: '#333333' }, // Light yellow
      { main: '#E63946', shadow: '#BC2F3A', highlight: '#F16E79', outline: '#333333' }, // Dark red
      { main: '#457B9D', shadow: '#355F7A', highlight: '#709DC0', outline: '#333333' }  // Dark blue
    ];

    const pixelSize = 5; // Match the cloud pixel size for consistency
    
    // Generate buildings with different heights and colors
    let xPos = 0;
    while (xPos < width) {
      // Use fixed values for a consistent background
      const buildingWidth = ((xPos % 3) + 1) * 35 + 45; // 80-150 width
      const buildingHeight = ((xPos % 4) + 1) * 30 + (height * 0.2); // Varied heights
      const colorIndex = Math.floor(xPos % buildingColors.length);
      const colors = buildingColors[colorIndex];
      
      // Starting y-position for the building (top)
      const buildingTop = height * 0.6 - buildingHeight;
      
      // Draw building main body using slightly larger pixel blocks
      for (let y = buildingTop; y < height * 0.6; y += pixelSize) {
        for (let x = xPos; x < xPos + buildingWidth; x += pixelSize) {
          const isRightEdge = x + pixelSize >= xPos + buildingWidth;
          const isLeftEdge = x <= xPos + pixelSize;
          const isTopEdge = y <= buildingTop + pixelSize;
          const isBottomEdge = y + pixelSize >= height * 0.6;
          
          // Check if we're at a window position - draw windows differently
          const windowSpacing = pixelSize * 5;
          const relX = x - xPos;
          const relY = y - buildingTop;
          
          const isWindowX = (relX % (pixelSize * 6)) < (pixelSize * 3); 
          const isWindowY = (relY % (pixelSize * 8)) < (pixelSize * 4);
          const isWindow = isWindowX && isWindowY && relY > pixelSize * 8; // No windows at the very top
          
          // Outline pixels - dark border around the edges
          if (isLeftEdge || isRightEdge || isTopEdge) {
            ctx.fillStyle = colors.outline;
            ctx.fillRect(x, y, pixelSize, pixelSize);
          } 
          // Window pixels
          else if (isWindow) {
            // Randomly determine if window is lit or dark based on position
            const isLit = ((x + y) * 7) % 13 > 5;
            
            if (isLit) {
              // Lit window with its own outline
              ctx.fillStyle = '#FFEB99'; // Warm yellow light
              ctx.fillRect(x, y, pixelSize, pixelSize);
              
              // Add thin dark border around the window
              ctx.fillStyle = '#333333';
              ctx.fillRect(x, y, pixelSize, 1); // Top border
              ctx.fillRect(x, y, 1, pixelSize); // Left border
              ctx.fillRect(x + pixelSize - 1, y, 1, pixelSize); // Right border
              ctx.fillRect(x, y + pixelSize - 1, pixelSize, 1); // Bottom border
            } else {
              // Dark window with its own outline
              ctx.fillStyle = '#2A324B'; // Dark blue-gray
              ctx.fillRect(x, y, pixelSize, pixelSize);
              
              // Add thin dark border around the window
              ctx.fillStyle = '#111111';
              ctx.fillRect(x, y, pixelSize, 1);
              ctx.fillRect(x, y, 1, pixelSize);
              ctx.fillRect(x + pixelSize - 1, y, 1, pixelSize);
              ctx.fillRect(x, y + pixelSize - 1, pixelSize, 1);
            }
          }
          // Building wall pixels - main color with some variation for depth
          else {
            // Deterministic color variation for visual interest
            // Left side of building gets shadows, right side gets highlights
            if (x < xPos + buildingWidth * 0.3) {
              ctx.fillStyle = colors.shadow;
            } else if (x > xPos + buildingWidth * 0.7) {
              ctx.fillStyle = colors.highlight;
            } else {
              ctx.fillStyle = colors.main;
            }
            
            ctx.fillRect(x, y, pixelSize, pixelSize);
          }
        }
      }
      
      // Draw a shop sign on some buildings
      if (xPos % 2 === 0) {
        // Position sign
        const signY = buildingTop + buildingHeight * 0.25;
        const signWidth = buildingWidth * 0.6;
        const signHeight = pixelSize * 5;
        const signX = xPos + (buildingWidth - signWidth) / 2;
        
        // Outline the sign
        ctx.fillStyle = '#222222';
        ctx.fillRect(signX - 1, signY - 1, signWidth + 2, signHeight + 2);
        
        // Fill the sign
        ctx.fillStyle = '#FFDD1F'; // Bright yellow for signs
        ctx.fillRect(signX, signY, signWidth, signHeight);
        
        // Add decorative stripes to the sign
        const stripeColors = ['#E63946', '#2A9D8F', '#E63946']; // Alternate colors
        const stripeWidth = pixelSize * 2;
        const stripeCount = Math.floor(signWidth / stripeWidth / 2);
        
        for (let i = 0; i < stripeCount; i++) {
          ctx.fillStyle = stripeColors[i % stripeColors.length];
          ctx.fillRect(
            signX + i * stripeWidth * 2, 
            signY + pixelSize,
            stripeWidth, 
            signHeight - pixelSize * 2
          );
        }
      }
      
      xPos += buildingWidth + pixelSize * 2; // Add spacing between buildings
    }
  };

  // Draw pixelated sidewalk
  const drawSidewalkTexture = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    playerAreaY: number = height * 0.8
  ) => {
    const pixelSize = 5; // Consistent with other pixel sizes
    
    // Base sidewalk color
    ctx.fillStyle = '#A9A9A9'; // Concrete gray
    ctx.fillRect(0, height * 0.6, width, playerAreaY - (height * 0.6));
    
    // Draw pixel grid pattern on the sidewalk
    for (let y = height * 0.6; y < playerAreaY; y += pixelSize) {
      for (let x = 0; x < width; x += pixelSize) {
        // Create a checker pattern with slight color variation
        if ((Math.floor(x / (pixelSize * 2)) + Math.floor(y / (pixelSize * 2))) % 2 === 0) {
          ctx.fillStyle = '#989898'; // Slightly darker square
          ctx.fillRect(x, y, pixelSize, pixelSize);
        }
        
        // Add sidewalk tile borders (darker lines) every few pixels
        if (x % (pixelSize * 6) === 0 || y % (pixelSize * 6) === 0) {
          ctx.fillStyle = '#777777'; // Darker line for tile border
          ctx.fillRect(x, y, pixelSize, 1); // Horizontal line
          ctx.fillRect(x, y, 1, pixelSize); // Vertical line
        }
      }
    }
    
    // Draw curb/edge line at the top of the sidewalk
    ctx.fillStyle = '#555555';
    ctx.fillRect(0, height * 0.6, width, pixelSize);
    
    // Draw occasional details on the sidewalk - drain covers, etc.
    for (let x = pixelSize * 15; x < width; x += pixelSize * 40) {
      // Draw drain cover
      ctx.fillStyle = '#555555'; // Dark gray for drain
      ctx.fillRect(x, height * 0.6 + pixelSize * 5, pixelSize * 4, pixelSize * 2);
      
      // Draw drain grate lines
      ctx.fillStyle = '#333333'; // Near black for grate lines
      for (let lineX = 0; lineX < 4; lineX++) {
        ctx.fillRect(x + lineX * pixelSize, height * 0.6 + pixelSize * 5, 1, pixelSize * 2);
      }
    }
  };

  // Draw road markings on street
  const drawStreetMarkings = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    playerAreaY: number
  ) => {
    const pixelSize = 5; // Consistent pixel size
    
    // Draw the road base color
    ctx.fillStyle = '#333333'; // Asphalt dark gray
    ctx.fillRect(0, playerAreaY, width, height - playerAreaY);
    
    // Add road texture with subtle pixel pattern
    for (let y = playerAreaY; y < height; y += pixelSize) {
      for (let x = 0; x < width; x += pixelSize) {
        // Create very subtle variation in road color
        if ((x + y) % 11 === 0) {
          ctx.fillStyle = '#3A3A3A'; // Slightly lighter asphalt
          ctx.fillRect(x, y, pixelSize, pixelSize);
        } else if ((x + y) % 17 === 0) {
          ctx.fillStyle = '#2A2A2A'; // Slightly darker asphalt
          ctx.fillRect(x, y, pixelSize, pixelSize);
        }
      }
    }
    
    // Draw center line in the middle of street area - pixelated dashed line
    const centerY = playerAreaY + (height - playerAreaY) / 2;
    const lineHeight = pixelSize;
    
    ctx.fillStyle = '#FFFFFF'; // White line
    
    // Draw dashed lines as individual pixel blocks
    const dashLength = pixelSize * 4;
    const gapLength = pixelSize * 3;
    const totalPattern = dashLength + gapLength;
    
    for (let x = 0; x < width; x += totalPattern) {
      ctx.fillRect(x, centerY - Math.floor(lineHeight/2), dashLength, lineHeight);
    }
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
    
    // Draw sidewalk with texture
    drawSidewalkTexture(ctx, width, height, playerAreaY);
    
    // Draw street with markings
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