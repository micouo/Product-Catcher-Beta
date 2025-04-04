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
      // For road and sidewalk (keep as is)
      sidewalkOffsetRef.current = (sidewalkOffsetRef.current + SCROLL_SPEED) % width;
      roadOffsetRef.current = (roadOffsetRef.current + SCROLL_SPEED) % 100; // Road markings repeat more frequently
      
      // For buildings, use same direction (moving right)
      buildingOffsetRef.current = (buildingOffsetRef.current + SCROLL_SPEED) % (width * 2);
      
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

    // Define cloud positions - set these to fixed values for a consistent background
    const cloudPositions = [
      { x: width * 0.15, y: height * 0.12, scale: 0.2 },
      { x: width * 0.4, y: height * 0.08, scale: 0.15 },
      { x: width * 0.85, y: height * 0.1, scale: 0.18 },
      { x: width * 0.65, y: height * 0.15, scale: 0.2 }, // Added fourth cloud
    ];

    const cloudImg = cloudImgRef.current;

    // Draw each cloud with its own offset to create a parallax effect
    cloudPositions.forEach((cloud, index) => {
      // Calculate size - scale based on the original image dimensions
      const cloudWidth = cloudImg.width * cloud.scale;
      const cloudHeight = cloudImg.height * cloud.scale;

      // Apply scrolling offset for this cloud - wrap around when out of view
      const cloudXOffset = cloudOffsetsRef.current[index];
      
      // For LEFT-TO-RIGHT scrolling, ADD the offset to x position
      // As offset increases, cloud appears to move left-to-right
      const xPos = (cloud.x - cloudWidth / 2) + cloudXOffset;
      
      // Draw cloud image centered at the position
      ctx.drawImage(
        cloudImg,
        xPos, // Apply cloud offset for scrolling
        cloud.y - cloudHeight / 2, // Vertical position stays the same
        cloudWidth,
        cloudHeight,
      );
      
      // Draw duplicate cloud for seamless scrolling (when first cloud moves off screen)
      ctx.drawImage(
        cloudImg,
        xPos - width, // Draw a second cloud one screen-width to the left
        cloud.y - cloudHeight / 2,
        cloudWidth,
        cloudHeight,
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
    const signWidth = buildingWidth * 0.7;
    const signHeight = 20;
    const signX = buildingX + (buildingWidth - signWidth) / 2;

    // Draw sign background
    ctx.fillStyle = "#FFD54F";
    ctx.fillRect(signX, signY, signWidth, signHeight);

    // Draw colored decorative elements on sign deterministically
    const signElements = Math.floor(signWidth / 8);
    for (let i = 0; i < signElements; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = i % 4 === 0 ? "#E63946" : "#2A9D8F";
        ctx.fillRect(signX + i * 8, signY, 6, signHeight);
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

    // Generate buildings with different heights and colors
    // Start one width before the visible area to ensure smooth scrolling
    const startPos = -width;  
    const endPos = width * 2; // Draw extra buildings beyond screen to ensure seamless scrolling
    
    // Generate a deterministic sequence of buildings spanning 3x the screen width
    for (let basePos = startPos; basePos < endPos; basePos += 100) {
      // For LEFT-TO-RIGHT scrolling, ADD the offset to position
      // As offset increases, buildings appear to move left-to-right
      const xPos = basePos + offset;
      
      // Since buildings have different widths, we need to calculate each one deterministically
      const seed = Math.abs(Math.floor(basePos / 100)); // Deterministic seed based on position
      
      // Use the seed to generate consistent building parameters
      const buildingWidth = ((seed % 3) + 1) * 30 + 50; // 80-140 width
      const buildingHeight = ((seed % 4) + 1) * 30 + height * 0.2; // Varied heights
      const colorIndex = Math.floor(seed % buildingColors.length);

      // Skip buildings completely outside visible area
      if (xPos + buildingWidth < 0 || xPos > width) continue;

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
          if ((Math.abs(basePos) + y) % 10 === 0) {
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
