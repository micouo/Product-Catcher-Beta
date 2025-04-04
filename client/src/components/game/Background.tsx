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
      
      // Sidewalk layer
      sidewalkOffsetRef.current = (offsetXRef.current * PARALLAX_LAYERS.SIDEWALK) % width;
      
      // Road markings - using a smaller repeat cycle for more frequent markers
      roadOffsetRef.current = (offsetXRef.current * PARALLAX_LAYERS.ROAD) % 100;
      
      // Building animation disabled since buildings have been removed
      // Uncomment when building assets are added with proper parallax factor
      // buildingOffsetRef.current = (offsetXRef.current * PARALLAX_LAYERS.SIDEWALK) % BUILDING_CYCLE;
      
      // Cloud layer - each cloud can move at slightly different speeds for more natural look
      cloudOffsetsRef.current = cloudOffsetsRef.current.map((_, index) => {
        // Add slight variation to cloud speeds based on index
        const cloudVariation = 1 + (index * 0.05);
        return (offsetXRef.current * PARALLAX_LAYERS.CLOUDS * cloudVariation) % (width * 2);
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

  // Draw grid pattern on sidewalk and add bushes
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
    
    // Add trees along the sidewalk at regular intervals
    // Trees should scroll with the sidewalk but maintain fixed size
    const treeSpacing = 300; // Space between trees for better visibility
    const treeSize = 38.5; // Fixed size for all trees (reduced by additional 5%)
    const treeY = height * 0.618; // Position trees slightly higher up on the sidewalk
    
    // Apply sidewalk scrolling offset
    // Calculate positions to place trees, accounting for the scrolling offset
    for (let x = -treeSpacing + (offset % treeSpacing); x < width + treeSpacing; x += treeSpacing) {
      // Draw trees with fixed size (no variation)
      drawTree(ctx, x, treeY, treeSize);
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
