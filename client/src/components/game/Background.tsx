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

    // Variables for smooth timing
    const lastTimeRef = useRef<number>(0);
    const targetFPS = 60;
    const timeStep = 1000 / targetFPS; // Time per frame in ms
    
    // Animation loop function with smooth parallax effect
    const animate = (timestamp: number) => {
      // Calculate delta time for smooth animation regardless of frame rate
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      
      // Use a smoothing factor based on target frame rate
      // This ensures consistent speed regardless of actual FPS
      const smoothFactor = Math.min(deltaTime / timeStep, 2.0);
      const frameSpeed = BASE_SCROLL_SPEED * smoothFactor;
      
      // Increment the base offset - this is our "time" value
      offsetXRef.current += frameSpeed;
      
      // Update layers with precise calculations for smooth, continuous scrolling
      
      // Sidewalk layer - continuous wrapping based on screen width
      sidewalkOffsetRef.current = (offsetXRef.current * PARALLAX_LAYERS.SIDEWALK) % width;
      
      // Road markings - smaller repeat cycle for more frequent markers with continuous motion
      const roadPatternLength = 70; // Combined length of dash+gap
      roadOffsetRef.current = (offsetXRef.current * PARALLAX_LAYERS.ROAD) % roadPatternLength;
      
      // Building animation disabled since buildings have been removed
      // Add back when building assets are ready using PARALLAX_LAYERS.SIDEWALK factor
      
      // Cloud layers - each with individual speed for natural parallax effect
      // Using larger cycle values to prevent noticeable repetition
      cloudOffsetsRef.current = cloudOffsetsRef.current.map((_, index) => {
        // Create varied speeds with smooth transitions
        const layerVariation = 1.0 + (index * 0.08); // Subtle variation between layers
        return (offsetXRef.current * PARALLAX_LAYERS.CLOUDS * layerVariation) % (width * 3);
      });
      
      // Redraw the background with updated offsets
      drawBackground(ctx, width, height);
      
      // Continue animation loop with timestamp for timing calculations
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

  // Draw clouds using the provided cloud image with perfect looping
  const drawClouds = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    // Check if cloud image is loaded
    if (!cloudImgRef.current || !cloudLoadedRef.current) return;

    const cloudImg = cloudImgRef.current;
    
    // Define cloud patterns - each pattern has its own properties and spacing
    const cloudPatterns = [
      // Pattern 1: Large clouds at upper level
      { yPos: height * 0.12, scale: 0.2, spacing: width * 0.8, offset: cloudOffsetsRef.current[0] },
      // Pattern 2: Medium clouds at middle level
      { yPos: height * 0.08, scale: 0.15, spacing: width * 0.65, offset: cloudOffsetsRef.current[1] },
      // Pattern 3: Small clouds at lower level
      { yPos: height * 0.15, scale: 0.18, spacing: width * 0.9, offset: cloudOffsetsRef.current[2] },
    ];
    
    // Draw each cloud pattern with continuous scrolling
    cloudPatterns.forEach(pattern => {
      // Calculate base dimensions for clouds in this pattern
      const cloudWidth = cloudImg.width * pattern.scale;
      const cloudHeight = cloudImg.height * pattern.scale;
      
      // Calculate how many clouds we need for this pattern to fill the screen plus buffer
      const totalClouds = Math.ceil(width / pattern.spacing) + 2;
      
      // Calculate precise offset for perfect continuous looping
      const patternOffset = pattern.offset % pattern.spacing;
      
      // Draw the clouds in this pattern with continuous seamless scrolling
      for (let i = -1; i < totalClouds; i++) {
        const x = (i * pattern.spacing) - patternOffset;
        
        // Draw the cloud at the calculated position
        ctx.drawImage(
          cloudImg,
          x,
          pattern.yPos - cloudHeight / 2,
          cloudWidth,
          cloudHeight
        );
      }
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

    // Draw vertical lines with seamless continuous scrolling
    const verticalLineSpacing = 40;
    
    // Calculate how many lines we need to cover the screen width plus extra buffer
    const totalLines = Math.ceil(width / verticalLineSpacing) + 4; // +4 for buffer
    
    // Calculate the base position offset from the reference point
    const baseOffset = offset % verticalLineSpacing;
    
    // Draw the set of vertical lines that cover the entire viewport plus buffer
    for (let i = -2; i < totalLines; i++) {
      const x = (i * verticalLineSpacing) - baseOffset;
      
      ctx.beginPath();
      ctx.moveTo(x, height * 0.6);
      ctx.lineTo(x, playerAreaY);
      ctx.stroke();
    }
    
    // Add trees along the sidewalk with perfect looping
    const treeSpacing = 300; // Space between trees
    const treeSize = 38.5; // Fixed size for trees (reduced)
    const treeY = height * 0.618; // Position trees higher up on sidewalk
    
    // Calculate number of trees needed to fill screen plus buffer for seamless transition
    const totalTrees = Math.ceil(width / treeSpacing) + 4; // +4 for buffer
    
    // Calculate base position for trees, ensuring smooth continuous movement
    const treeBaseOffset = offset % treeSpacing;
    
    // Draw trees in a continuous loop pattern
    for (let i = -2; i < totalTrees; i++) {
      const x = (i * treeSpacing) - treeBaseOffset;
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
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 6;
    
    // Get the road offset for scrolling
    const offset = roadOffsetRef.current;
    
    // Continuous scrolling approach for road markings
    // Instead of using setLineDash which can cause subtle visual jumps,
    // we'll manually draw the dash pattern for perfect control
    
    const dashLength = 30; // Length of each dash
    const gapLength = 40;  // Length of gap between dashes
    const patternLength = dashLength + gapLength; // Total length of one dash+gap pattern
    
    // Calculate how many dashes needed to cover the width plus buffer
    const totalDashes = Math.ceil(width / patternLength) + 4; // +4 for buffer
    
    // Calculate the base offset (precise position within pattern cycle)
    const baseOffset = offset % patternLength;
    
    // Draw center line in middle of street area
    const centerY = playerAreaY + (height - playerAreaY) / 2;
    
    // Draw the dashes manually for pixel-perfect control
    for (let i = -2; i < totalDashes; i++) {
      // Calculate starting position of this dash
      const dashStart = (i * patternLength) - baseOffset;
      
      // Draw only the dash part (not the gap)
      ctx.beginPath();
      ctx.moveTo(dashStart, centerY);
      ctx.lineTo(dashStart + dashLength, centerY);
      ctx.stroke();
    }
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
