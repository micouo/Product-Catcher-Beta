import React, { useEffect, useRef } from "react";
import cloudImage from "../../assets/cloud.png";
import treeImage from "../../assets/tree 1.png";

// Constants for animation and parallax effect
const BASE_SCROLL_SPEED = 0.8; // Slightly reduced base speed for smoother motion
const PARALLAX_LAYERS = {
  CLOUDS: 0.2,  // Clouds move at 20% of the base speed (slowest)
  SKY: 0.0,     // Sky doesn't move
  SIDEWALK: 1.0, // Sidewalk moves at full base speed
  ROAD: 1.5,    // Road moves faster than sidewalk for depth effect
  TREES: 1.0    // Trees move with the sidewalk
};

interface BackgroundProps {
  width: number;
  height: number;
}

export default function Background({ width, height }: BackgroundProps) {
  // Canvas and animation refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  
  // Image loading refs
  const cloudImgRef = useRef<HTMLImageElement | null>(null);
  const cloudLoadedRef = useRef(false);
  const treeImgRef = useRef<HTMLImageElement | null>(null);
  const treeLoadedRef = useRef(false);
  
  // Animation timing refs
  const lastTimeRef = useRef<number>(0); 
  
  // Parallax position tracking refs
  const offsetXRef = useRef(0);
  const cloudOffsets = useRef([0, 0, 0]);
  const sidewalkOffsetRef = useRef(0);
  const roadOffsetRef = useRef(0);

  useEffect(() => {
    // Load the cloud image
    if (!cloudImgRef.current) {
      const cloudImg = new Image();
      cloudImg.src = cloudImage;
      cloudImg.onload = () => {
        cloudLoadedRef.current = true;
      };
      cloudImgRef.current = cloudImg;
    }
    
    // Load the tree image
    if (!treeImgRef.current) {
      const treeImg = new Image();
      treeImg.src = treeImage;
      treeImg.onload = () => {
        treeLoadedRef.current = true;
      };
      treeImgRef.current = treeImg;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    /**
     * Main animation loop with frame-rate independent timing
     */
    const animate = (timestamp: number) => {
      // Initialize time tracking on first frame 
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }
      
      // Calculate time since last frame for smooth animation regardless of frame rate
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      
      // Target a consistent 60 FPS experience, even if actual frame rate differs
      const targetFPS = 60;
      const timeStep = 1000 / targetFPS;
      
      // Create a smoothing factor to ensure consistent animation speed 
      // regardless of actual frame rate
      const smoothFactor = Math.min(deltaTime / timeStep, 2.0);
      const frameSpeed = BASE_SCROLL_SPEED * smoothFactor;
      
      // Update global offset - this is our baseline "clock" value
      offsetXRef.current += frameSpeed;
      
      // Calculate layer-specific offsets using precise modulo to prevent drift
      
      // Sidewalk and trees layer (moves at 100% of base speed)
      sidewalkOffsetRef.current = (offsetXRef.current * PARALLAX_LAYERS.SIDEWALK) % (width * 0.5);
      
      // Road markings (moves at 150% of base speed)
      const roadPatternLength = 70; // Combined length of dash+gap
      roadOffsetRef.current = (offsetXRef.current * PARALLAX_LAYERS.ROAD) % roadPatternLength;
      
      // Update cloud positions with varied speeds for more natural parallax
      // Using large repeat lengths to prevent noticeable pattern repetition
      cloudOffsets.current = cloudOffsets.current.map((_, index) => {
        // Each cloud layer moves at slightly different speed 
        const layerVariation = 1.0 + (index * 0.1);
        return (offsetXRef.current * PARALLAX_LAYERS.CLOUDS * layerVariation) % (width * 1.5);
      });
      
      // Draw the complete scene with updated positions
      drawBackground(ctx, width, height);
      
      // Schedule next frame
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };
    
    // Start the animation loop
    animationFrameIdRef.current = requestAnimationFrame(animate);
    
    // Cleanup animation on component unmount
    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [width, height]);
  
  /**
   * Draws clouds using the cloud image with seamless scrolling
   */
  const drawClouds = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    // Skip if image isn't loaded yet
    if (!cloudImgRef.current || !cloudLoadedRef.current) return;

    const cloudImg = cloudImgRef.current;
    
    // Define cloud patterns with different heights, sizes and spacings
    const cloudPatterns = [
      // Large clouds at top level
      { yPos: height * 0.12, scale: 0.2, spacing: width * 0.8, offset: cloudOffsets.current[0] },
      // Medium clouds at middle level (moves slightly faster)
      { yPos: height * 0.08, scale: 0.15, spacing: width * 0.65, offset: cloudOffsets.current[1] },
      // Small clouds at bottom layer (moves fastest)
      { yPos: height * 0.15, scale: 0.18, spacing: width * 0.9, offset: cloudOffsets.current[2] },
    ];
    
    // Draw each cloud pattern
    cloudPatterns.forEach(pattern => {
      // Calculate cloud dimensions based on scale and image size
      const cloudWidth = cloudImg.width * pattern.scale;
      const cloudHeight = cloudImg.height * pattern.scale;
      
      // Calculate number of clouds needed plus buffer
      const totalClouds = Math.ceil(width / pattern.spacing) + 2;
      
      // Calculate precise pattern offset for this layer
      const patternOffset = pattern.offset % pattern.spacing;
      
      // Draw clouds in a continuous repeating pattern
      for (let i = -1; i < totalClouds; i++) {
        const x = (i * pattern.spacing) - patternOffset;
        
        // Draw cloud at calculated position
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

  /**
   * Draws a tree at the specified position
   */
  const drawTree = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    size: number
  ) => {
    // Skip if image isn't loaded yet
    if (!treeImgRef.current || !treeLoadedRef.current) return;
    
    const treeImg = treeImgRef.current;
    
    // Calculate dimensions maintaining aspect ratio
    const scale = size / Math.min(treeImg.width, treeImg.height) * 3.85;
    const treeWidth = treeImg.width * scale;
    const treeHeight = treeImg.height * scale;
    
    // Draw centered tree image
    ctx.drawImage(
      treeImg,
      x - treeWidth / 2, // Center horizontally
      y - treeHeight * 0.85, // Position higher up
      treeWidth,
      treeHeight
    );
  };

  /**
   * Draws the sidewalk texture with grid and trees
   */
  const drawSidewalkTexture = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    playerAreaY: number,
  ) => {
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 1;
    
    // Get current sidewalk offset
    const offset = sidewalkOffsetRef.current;

    // Draw horizontal lines
    for (let y = height * 0.65; y < playerAreaY; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw vertical lines with continuous scrolling
    const verticalLineSpacing = 40;
    const totalLines = Math.ceil(width / verticalLineSpacing) + 4;
    const baseOffset = offset % verticalLineSpacing;
    
    for (let i = -2; i < totalLines; i++) {
      const x = (i * verticalLineSpacing) - baseOffset;
      
      ctx.beginPath();
      ctx.moveTo(x, height * 0.6);
      ctx.lineTo(x, playerAreaY);
      ctx.stroke();
    }
    
    // Add trees with continuous scrolling
    const treeSpacing = 300;
    const treeSize = 38.5;
    const treeY = height * 0.618;
    
    const totalTrees = Math.ceil(width / treeSpacing) + 4;
    const treeOffset = offset % treeSpacing;
    
    for (let i = -2; i < totalTrees; i++) {
      const x = (i * treeSpacing) - treeOffset;
      drawTree(ctx, x, treeY, treeSize);
    }
  };

  /**
   * Draws the street markings with continuous scrolling
   */
  const drawStreetMarkings = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    playerAreaY: number,
  ) => {
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 6;
    
    // Get current road offset
    const offset = roadOffsetRef.current;
    
    // Manually draw dashes for precise control (better than setLineDash)
    const dashLength = 30;
    const gapLength = 40;
    const patternLength = dashLength + gapLength;
    
    const totalDashes = Math.ceil(width / patternLength) + 4;
    const baseOffset = offset % patternLength;
    
    // Draw center line of road
    const centerY = playerAreaY + (height - playerAreaY) / 2;
    
    // Draw dashes with continuous scrolling
    for (let i = -2; i < totalDashes; i++) {
      const dashStart = (i * patternLength) - baseOffset;
      
      ctx.beginPath();
      ctx.moveTo(dashStart, centerY);
      ctx.lineTo(dashStart + dashLength, centerY);
      ctx.stroke();
    }
  };

  /**
   * Empty placeholder for future building implementation
   */
  const drawBuildings = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    // Buildings implementation removed
    // Will be replaced with image assets in the future
  };

  /**
   * Draws the complete background scene
   */
  const drawBackground = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    // Clear previous frame
    ctx.clearRect(0, 0, width, height);

    // Draw sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    skyGradient.addColorStop(0, "#4B79A1"); // Deep blue at top
    skyGradient.addColorStop(1, "#79A7D3"); // Lighter blue at horizon
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height * 0.6);

    // Draw clouds
    drawClouds(ctx, width, height);

    // Draw buildings (placeholder for now)
    drawBuildings(ctx, width, height);

    // Calculate player area position
    const playerAreaY = height - 202;

    // Draw sidewalk
    ctx.fillStyle = "#A9A9A9"; // Concrete gray
    ctx.fillRect(0, height * 0.6, width, playerAreaY - height * 0.6);

    // Draw sidewalk texture and trees
    drawSidewalkTexture(ctx, width, height, playerAreaY);

    // Draw street
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
