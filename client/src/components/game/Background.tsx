import React, { useEffect, useRef } from "react";
import cloudImage from "@assets/cloud.png";

interface BackgroundProps {
  width: number;
  height: number;
}

export default function Background({ width, height }: BackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const cloudImgRef = useRef<HTMLImageElement | null>(null);
  const cloudLoadedRef = useRef(false);
  
  // Offsets for scrolling different elements
  const offsetXRef = useRef(0);
  const cloudOffsetsRef = useRef([0, 0, 0, 0]);
  const buildingOffsetRef = useRef(0);
  const sidewalkOffsetRef = useRef(0);
  const roadOffsetRef = useRef(0);
  
  // Animation speed (pixels per frame)
  const SCROLL_SPEED = 1;
  const CLOUD_SPEED = 0.2; // Clouds move slower

  useEffect(() => {
    // Load the cloud image
    if (!cloudImgRef.current) {
      const img = new Image();
      img.src = cloudImage;
      img.onload = () => {
        cloudLoadedRef.current = true;
      };
      cloudImgRef.current = img;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Animation loop function
    const animate = () => {
      // ALL ELEMENTS move to the RIGHT (using same direction for consistency)
      
      // We'll use a larger cycle width for building offset to prevent visual gaps
      const buildingCycleWidth = width * 5;
      
      // For road and sidewalk
      sidewalkOffsetRef.current = (sidewalkOffsetRef.current + SCROLL_SPEED) % width;
      roadOffsetRef.current = (roadOffsetRef.current + SCROLL_SPEED) % 100; // Road markings repeat more frequently
      
      // For buildings, use same direction (moving right) but with a larger cycle
      buildingOffsetRef.current = (buildingOffsetRef.current + SCROLL_SPEED) % buildingCycleWidth;
      
      // For clouds, move to the right (same direction as everything else)
      cloudOffsetsRef.current = cloudOffsetsRef.current.map(offset => 
        (offset + CLOUD_SPEED) % width
      );
      
      // Redraw the background with updated offsets
      drawBackground(ctx, width, height);
      
      // Continue animation loop
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    // Cleanup animation on unmount
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
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
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  // Draw a pixelated sun with rays
  const drawSun = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
  ) => {
    const pixelSize = 6; // Larger pixels for more pixelated look

    // Draw base pixelated sun circle (no gradients - more pixel art style)
    ctx.fillStyle = "#FFD700"; // Gold color for the sun

    // Draw sun using a grid of squares
    for (let px = x - radius; px < x + radius; px += pixelSize) {
      for (let py = y - radius; py < y + radius; py += pixelSize) {
        // Check if pixel is inside the circle
        const distance = Math.sqrt(Math.pow(px - x, 2) + Math.pow(py - y, 2));

        if (distance < radius) {
          // Outer part of sun
          if (distance > radius * 0.7) {
            ctx.fillStyle = "#FFC107"; // Darker gold for outer edge
          }
          // Inner part of sun
          else {
            ctx.fillStyle = "#FFEB3B"; // Brighter yellow for inner part
          }

          ctx.fillRect(px, py, pixelSize, pixelSize);
        }
      }
    }

    // Draw pixelated sun rays
    ctx.fillStyle = "#FFD700";

    const rayCount = 8;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;

      // Draw each ray as a series of small rectangles
      const rayLength = radius * 1.8;
      const rayStart = radius * 1.1;

      for (let r = rayStart; r < rayLength; r += pixelSize) {
        const rx = x + Math.cos(angle) * r;
        const ry = y + Math.sin(angle) * r;

        ctx.fillRect(
          rx - pixelSize / 2,
          ry - pixelSize / 2,
          pixelSize,
          pixelSize,
        );
      }
    }
  };

  // Draw clouds using the provided cloud image
  const drawClouds = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    // Check if cloud image is loaded
    if (!cloudImgRef.current || !cloudLoadedRef.current) return;

    // Define cloud positions with varied y-coordinates and scales
    const cloudPositions = [
      { y: height * 0.12, scale: 0.2, speedFactor: 1.0 },
      { y: height * 0.08, scale: 0.15, speedFactor: 0.8 },
      { y: height * 0.10, scale: 0.18, speedFactor: 1.2 },
      { y: height * 0.15, scale: 0.2, speedFactor: 0.9 },
      { y: height * 0.05, scale: 0.17, speedFactor: 1.1 }, // Added fifth cloud
    ];

    const cloudImg = cloudImgRef.current;
    
    // Get the overall cloud offset for this frame
    const baseOffset = cloudOffsetsRef.current[0];
    
    // Calculate x-spacing between clouds for more natural distribution
    const cloudSpacing = width / 3;
    
    // Draw multiple layers of clouds for infinite scrolling effect
    for (let layer = -1; layer <= 1; layer++) {
      cloudPositions.forEach((cloud, index) => {
        // Calculate size based on the original image dimensions
        const cloudWidth = cloudImg.width * cloud.scale;
        const cloudHeight = cloudImg.height * cloud.scale;
        
        // Calculate a unique starting position for each cloud
        // This creates a deterministic but varied pattern
        const baseX = (index * cloudSpacing) % width;
        
        // Apply individual speed factor to create parallax
        const cloudOffset = baseOffset * cloud.speedFactor;
        
        // Calculate final x position with offset
        // For LEFT-TO-RIGHT scrolling, ADD the offset to x position
        // Include the layer offset to create multiple layers of clouds
        const xPos = baseX + cloudOffset + (layer * width);
        
        // Only draw clouds that are at least partially visible
        if (xPos + cloudWidth >= 0 && xPos <= width) {
          // Draw cloud image
          ctx.drawImage(
            cloudImg,
            xPos,
            cloud.y - cloudHeight / 2,
            cloudWidth,
            cloudHeight,
          );
        }
      });
    }
  };

  // Draw windows on buildings
  const drawWindows = (
    ctx: CanvasRenderingContext2D,
    buildingX: number,
    buildingY: number,
    buildingWidth: number,
    buildingHeight: number,
    pixelSize: number,
    seedValue: number, // Add seed value parameter to keep windows stable during animation
  ) => {
    const windowSize = pixelSize * 3; // Window size in pixels
    const windowSpacing = pixelSize * 5; // Space between windows

    // Calculate number of windows that fit horizontally and vertically
    const windowsPerRow = Math.floor(
      (buildingWidth - windowSpacing) / (windowSize + windowSpacing),
    );
    const windowRows = Math.floor(
      (buildingHeight - windowSpacing) / (windowSize + windowSpacing),
    );

    // Horizontal margin to center windows
    const marginX =
      (buildingWidth -
        (windowsPerRow * windowSize + (windowsPerRow - 1) * windowSpacing)) /
      2;

    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowsPerRow; col++) {
        const windowX =
          buildingX + marginX + col * (windowSize + windowSpacing);
        const windowY =
          buildingY + windowSpacing + row * (windowSize + windowSpacing);

        // Use the provided seed value to determine window lighting
        // This prevents window lights from flickering during animation
        if ((row + col + (seedValue || 0) + Math.floor(row/2)) % 3 !== 0) {
          ctx.fillStyle = "rgba(255, 255, 190, 0.8)"; // Lit window
        } else {
          ctx.fillStyle = "rgba(50, 50, 80, 0.8)"; // Dark window
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
    signY: number,
  ) => {
    const signWidth = buildingWidth * 0.6;
    const signHeight = 15;
    const signX = buildingX + (buildingWidth - signWidth) / 2;

    // Draw sign background (using neutral colors instead of the yellow block)
    ctx.fillStyle = "#455A64"; // Dark blue-gray
    ctx.fillRect(signX, signY, signWidth, signHeight);

    // Add a simple white border
    ctx.strokeStyle = "#EEEEEE";
    ctx.lineWidth = 1;
    ctx.strokeRect(signX, signY, signWidth, signHeight);
    
    // Add simple dots to simulate text/logo without being too colorful
    const dotCount = Math.floor(signWidth / 10);
    const dotSize = 3;
    const dotY = signY + signHeight/2 - dotSize/2;
    
    for (let i = 0; i < dotCount; i++) {
      // Create a pattern of small dots to simulate text
      if (i % 3 !== 0) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(
          signX + 5 + i * 10, 
          dotY, 
          dotSize, 
          dotSize
        );
      }
    }
  };

  // Draw pixelated buildings for the city skyline
  const drawBuildings = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    const buildingColors = [
      "#FF6B6B", // Red
      "#4ECDC4", // Teal
      "#F8B500", // Yellow
      "#8675A9", // Purple
      "#35A7FF", // Blue
      "#FFD166", // Light yellow
      "#E63946", // Dark red
      "#457B9D", // Dark blue
    ];

    const pixelSize = 4; // Size of each "pixel" to create pixelated effect
    
    // Apply scrolling offset
    const offset = buildingOffsetRef.current;

    // Calculate base position for infinite building generation
    // We wrap the building offset around a large value to create a continuous loop
    // While also shifting the baseline to create new building patterns
    const buildingCycle = 5000; // A very large cycle to prevent obvious repeating
    const wrappedOffset = offset % buildingCycle;
    
    // We'll always generate buildings in a window around the current view
    // By using modulo arithmetic, we create a continuous stream of buildings
    // that appears unique over long distances
    const viewDistance = width * 1.5; // How far to render beyond screen edges
    const startPos = -viewDistance;
    const endPos = width + viewDistance;
    
    // Generate buildings at consistent intervals
    const buildingSpacing = 80; // Distance between building centers
    
    // Calculate the first visible building position
    let currentPos = startPos - (wrappedOffset % buildingSpacing);
    
    // Generate buildings to fill the view
    while (currentPos < endPos) {
      // Calculate absolute position (for deterministic building generation)
      // This uses the overall offset to create a "world position" that stays consistent
      const absPos = currentPos + Math.floor(offset / buildingCycle) * buildingCycle;
      
      // Create a deterministic seed based on the absolute position
      // This ensures each position always generates the same building
      const seed = Math.abs(Math.floor(absPos / buildingSpacing)); 
      
      // Use the seed to generate consistent building parameters
      const buildingWidth = ((seed % 3) + 1) * 30 + 50; // 80-140 width
      const buildingHeight = ((seed % 4) + 1) * 30 + height * 0.2; // Varied heights
      const colorIndex = Math.floor(seed % buildingColors.length);

      // The visible position is the current position plus the fraction part of the offset
      const xPos = currentPos + (wrappedOffset % buildingSpacing);

      // Only draw if the building is at least partially visible
      if (xPos + buildingWidth >= 0 && xPos <= width) {
        // Draw building - base structure with pixelated effect
        ctx.fillStyle = buildingColors[colorIndex];

        // Draw with pixelated effect by creating grid of squares
        for (
          let y = height * 0.6 - buildingHeight;
          y < height * 0.6;
          y += pixelSize
        ) {
          for (let x = xPos; x < xPos + buildingWidth; x += pixelSize) {
            // Deterministic color variation based on position
            if ((seed + Math.floor(y)) % 10 === 0) {
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
        drawWindows(
          ctx,
          xPos,
          height * 0.6 - buildingHeight,
          buildingWidth,
          buildingHeight,
          pixelSize,
          seed, // Pass the seed value to keep window lights stable during animation
        );

        // Store shop signs on some buildings deterministically
        if (seed % 2 === 0) {
          drawStoreSign(
            ctx,
            xPos,
            buildingWidth,
            height * 0.6 - buildingHeight * 0.3,
          );
        }
      }
      
      // Move to the next building position
      currentPos += buildingSpacing;
    }
  };

  // Draw grid pattern on sidewalk
  const drawSidewalkTexture = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    playerAreaY: number = height * 0.8,
  ) => {
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 1;
    
    // Apply sidewalk scrolling offset
    const offset = sidewalkOffsetRef.current;

    // Draw horizontal lines - stop at the player area
    for (let y = height * 0.65; y < playerAreaY; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw vertical lines with scrolling effect - stop at the player area
    // Draw more lines than needed to allow for seamless scrolling
    const verticalLineSpacing = 40;
    for (let x = -verticalLineSpacing + (offset % verticalLineSpacing); 
         x < width + verticalLineSpacing; 
         x += verticalLineSpacing) {
      
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
    playerAreaY: number,
  ) => {
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 6;
    
    // Apply road markings scrolling offset
    const offset = roadOffsetRef.current;
    
    // Use a dash pattern that will create a moving dashed line effect
    const dashLength = 20;
    const gapLength = 15;
    const dashPattern = [dashLength, gapLength];
    ctx.setLineDash(dashPattern);
    
    // Offset the dash pattern to create movement
    ctx.lineDashOffset = -offset;

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
  const drawBackground = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    skyGradient.addColorStop(0, "#4B79A1"); // Deep blue at top
    skyGradient.addColorStop(1, "#79A7D3"); // Lighter blue at horizon
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height * 0.6);

    // Draw clouds in the sky
    drawClouds(ctx, width, height);

    // Draw buildings - pixelated style
    drawBuildings(ctx, width, height);

    // Calculate the position of the player area (where the white border is)
    const playerAreaY = height - 202; // 2px for the border

    // Draw sidewalk - end at the white border line
    ctx.fillStyle = "#A9A9A9"; // Concrete gray
    ctx.fillRect(0, height * 0.6, width, playerAreaY - height * 0.6);

    // Draw sidewalk texture - grid lines
    drawSidewalkTexture(ctx, width, height, playerAreaY);

    // The street should start where the sidewalk ends
    ctx.fillStyle = "#333333"; // Asphalt dark gray
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
