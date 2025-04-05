import React, { useEffect, useRef } from "react";
import cloudImage from "../../assets/cloud.png";
import treeImage from "../../assets/tree 1.png";

// Constants for animation and parallax effect
const BASE_SCROLL_SPEED = 1; // Base speed for reference
const PARALLAX_LAYERS = {
  CLOUDS: 0.2,  // Clouds move at 20% of the base speed (slowest)
  SKY: 0.0,     // Sky doesn't move
  SIDEWALK: 1.0, // Sidewalk moves at full base speed
  ROAD: 1.5,    // Road moves faster than sidewalk for depth effect
  TREES: 1.0    // Trees move with the sidewalk
};

// Very large cycle to prevent obvious repeating
const BUILDING_CYCLE = 5000;

interface BackgroundProps {
  width: number;
  height: number;
}

export default function Background({ width, height }: BackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const cloudImgRef = useRef<HTMLImageElement | null>(null);
  const cloudLoadedRef = useRef(false);
  const treeImgRef = useRef<HTMLImageElement | null>(null);
  const treeLoadedRef = useRef(false);
  
  // Offsets for scrolling different elements
  const offsetXRef = useRef(0);
  const cloudOffsetsRef = useRef([0, 0, 0, 0]);
  const buildingOffsetRef = useRef(0);
  const sidewalkOffsetRef = useRef(0);
  const roadOffsetRef = useRef(0);
  
  // We'll use the constants defined above for parallax effect
  // This keeps the local reference for the animation function
  const animationFrameIdRef = useRef<number | null>(null);

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
    
    // Load the tree image
    if (!treeImgRef.current) {
      const img = new Image();
      img.src = treeImage;
      img.onload = () => {
        treeLoadedRef.current = true;
      };
      treeImgRef.current = img;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Animation loop function with parallax effect
    const animate = () => {
      // Increment the base offset - this is our "time" value
      offsetXRef.current += BASE_SCROLL_SPEED;
      
      // Update all layer positions based on their parallax factors
      // Each layer moves at a different speed relative to the base speed
      
      // Sidewalk layer - uses negative value for right-to-left movement
      sidewalkOffsetRef.current = -(offsetXRef.current * PARALLAX_LAYERS.SIDEWALK) % width;
      
      // Road markings - using a smaller repeat cycle for more frequent markers
      // Negative sign makes road markings move right-to-left (consistent with sidewalk)
      roadOffsetRef.current = -(offsetXRef.current * PARALLAX_LAYERS.ROAD) % 100;
      
      // Building animation disabled since buildings have been removed
      // Uncomment when building assets are added with proper parallax factor
      // buildingOffsetRef.current = (offsetXRef.current * PARALLAX_LAYERS.SIDEWALK) % BUILDING_CYCLE;
      
      // Cloud layer - each cloud can move at slightly different speeds for more natural look
      cloudOffsetsRef.current = cloudOffsetsRef.current.map((_, index) => {
        // Add slight variation to cloud speeds based on index
        const cloudVariation = 1 + (index * 0.05);
        // Use negative value for right-to-left motion (clouds appear to move opposite direction of travel)
        return -(offsetXRef.current * PARALLAX_LAYERS.CLOUDS * cloudVariation) % (width * 2);
      });
      
      // Redraw the background with updated offsets
      drawBackground(ctx, width, height);
      
      // Continue animation loop
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationFrameIdRef.current = requestAnimationFrame(animate);
    
    // Cleanup animation on unmount
    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
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

  // Draw clouds using the provided cloud image with proper infinite scrolling
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

      // Apply scrolling offset for this cloud
      const cloudXOffset = cloudOffsetsRef.current[index];
      
      // Calculate new x-position with offset (but we now scroll right-to-left)
      // Normalize the x position within the screen width
      const normalizedOffset = cloudXOffset % width;
      
      // We need to draw multiple copies of each cloud to cover the entire scrolling area
      // First copy - the main position
      const pos1 = normalizedOffset;
      
      // Draw main cloud (it could be partially off-screen)
      ctx.drawImage(
        cloudImg,
        cloud.x + pos1, // Base position plus offset
        cloud.y - cloudHeight / 2,
        cloudWidth,
        cloudHeight
      );
      
      // Draw a copy to the left of the first cloud to ensure a seamless loop
      ctx.drawImage(
        cloudImg,
        cloud.x + pos1 - width, // One screen width to the left
        cloud.y - cloudHeight / 2,
        cloudWidth,
        cloudHeight
      );
      
      // Draw a copy to the right of the first cloud to ensure a seamless loop
      ctx.drawImage(
        cloudImg,
        cloud.x + pos1 + width, // One screen width to the right
        cloud.y - cloudHeight / 2,
        cloudWidth,
        cloudHeight
      );
    });
  };

  // Placeholder for future window implementation if needed
  const drawWindows = () => {
    // Windows function has been removed as buildings were removed
  };

  // Placeholder function for potential future store signs
  // Currently not used as requested by user to remove all store signs
  const drawStoreSign = () => {
    // Empty function - store signs have been removed
  };

  // Placeholder for future building implementation with image assets
  const drawBuildings = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    // Buildings have been removed as requested
    // Will be replaced with image assets
  };



  // Draw trees using the provided tree image
  const drawTree = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ) => {
    // Check if tree image is loaded
    if (!treeImgRef.current || !treeLoadedRef.current) return;
    
    const treeImg = treeImgRef.current;
    
    // Calculate the size of the tree image while maintaining aspect ratio
    const scale = size / Math.min(treeImg.width, treeImg.height) * 3.85; // Reduced by additional 5%
    const treeWidth = treeImg.width * scale;
    const treeHeight = treeImg.height * scale;
    
    // Draw tree image centered horizontally and positioned higher up
    ctx.drawImage(
      treeImg,
      x - treeWidth / 2, // Center horizontally
      y - treeHeight * 0.85, // Position slightly higher up
      treeWidth,
      treeHeight
    );
  };

  // Draw grid pattern on sidewalk with infinite scrolling and add trees
  const drawSidewalkTexture = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    playerAreaY: number = height * 0.8,
  ) => {
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 1;
    
    // Apply sidewalk scrolling offset - normalize to prevent very large numbers
    const normalizedOffset = sidewalkOffsetRef.current % width;

    // Draw horizontal lines - stop at the player area
    for (let y = height * 0.65; y < playerAreaY; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw vertical lines with seamless scrolling - stop at the player area
    const verticalLineSpacing = 40;
    
    // Calculate how many lines we need to cover the width plus some overflow
    const totalLines = Math.ceil(width / verticalLineSpacing) + 4; // +4 for safe overlap
    
    // Calculate the starting position based on the normalized offset
    const startPos = (normalizedOffset % verticalLineSpacing) - verticalLineSpacing;
    
    // Draw lines from left to right with the offset applied
    for (let i = 0; i < totalLines; i++) {
      const x = startPos + (i * verticalLineSpacing);
      
      ctx.beginPath();
      ctx.moveTo(x, height * 0.6);
      ctx.lineTo(x, playerAreaY);
      ctx.stroke();
    }
    
    // Add trees along the sidewalk at regular intervals with infinite scrolling
    const treeSpacing = 300; // Space between trees for better visibility
    const treeSize = 38.5; // Fixed size for all trees (reduced by additional 5%)
    const treeY = height * 0.618; // Position trees slightly higher up on the sidewalk
    
    // Calculate how many trees we need to cover the screen width plus some overflow
    const totalTrees = Math.ceil(width / treeSpacing) + 3; // +3 for safe overlap
    
    // Calculate the starting position for the first tree based on normalized offset
    const treeStartPos = (normalizedOffset % treeSpacing) - treeSpacing;
    
    // Draw trees from left to right with the offset applied
    for (let i = 0; i < totalTrees; i++) {
      const x = treeStartPos + (i * treeSpacing);
      drawTree(ctx, x, treeY, treeSize);
    }
  };

  // Draw road markings on street with seamless infinite scrolling
  const drawStreetMarkings = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    playerAreaY: number,
  ) => {
    // Set up the road markings style
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 6;
    
    // Get the normalized road offset for smooth scrolling
    const normalizedOffset = roadOffsetRef.current % 100;
    
    // Set up the dashed line pattern
    const dashPattern = [20, 15]; // [dashLength, gapLength]
    ctx.setLineDash(dashPattern);
    
    // Pass the offset directly since we're already using negative values in the animation loop
    // This creates the illusion of right-to-left movement (car moving forward)
    ctx.lineDashOffset = normalizedOffset;

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
