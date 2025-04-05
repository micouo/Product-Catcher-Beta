import React, { useEffect, useRef } from "react";
import cloudImage from "../../assets/cloud.png";
import treeImage from "../../assets/tree 1.png";

interface BackgroundProps {
  width: number;
  height: number;
}

/**
 * A simple background component that renders a continuously scrolling background
 * using the two-image technique for perfect infinite scrolling.
 */
export default function Background({ width, height }: BackgroundProps) {
  // Canvas reference
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Animation frame ID for cleanup
  const animationFrameRef = useRef<number | null>(null);
  
  // Track positions of background elements
  const cloudPositionX = useRef(0);
  const treePositionX = useRef(0);
  const roadPositionX = useRef(0);
  
  // Last timestamp for frame-rate independent animation
  const lastTimeRef = useRef(0);
  
  // Image references
  const cloudImgRef = useRef(new Image());
  const treeImgRef = useRef(new Image());
  const cloudLoaded = useRef(false);
  const treeLoaded = useRef(false);
  
  // Layer speeds
  const CLOUD_SPEED = 0.3;  // Slowest (clouds in background)
  const TREE_SPEED = 1.5;   // Medium (trees on sidewalk)
  const ROAD_SPEED = 2.0;   // Fastest (road markings)
  
  useEffect(() => {
    // Load cloud image
    const cloudImg = cloudImgRef.current;
    cloudImg.src = cloudImage;
    cloudImg.onload = () => {
      cloudLoaded.current = true;
    };
    
    // Load tree image
    const treeImg = treeImgRef.current;
    treeImg.src = treeImage;
    treeImg.onload = () => {
      treeLoaded.current = true;
    };
    
    // Get canvas context
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    /**
     * Main animation loop with the proper two-image technique
     * for perfect infinite scrolling with no snapping
     */
    const animate = (timestamp: number) => {
      // Initialize time on first frame
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }
      
      // Calculate time elapsed since last frame
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      
      // Convert to seconds and apply speed multiplier
      const timeMultiplier = deltaTime / 16.67; // Normalized for 60fps
      
      // Update element positions based on their speeds
      cloudPositionX.current -= CLOUD_SPEED * timeMultiplier;
      treePositionX.current -= TREE_SPEED * timeMultiplier;
      roadPositionX.current -= ROAD_SPEED * timeMultiplier;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw background elements
      drawBackground(ctx);
      
      // Schedule next frame
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Cleanup on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [width, height]);
  
  /**
   * Draw the sky background
   */
  const drawSky = (ctx: CanvasRenderingContext2D) => {
    // Create sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    skyGradient.addColorStop(0, "#4B79A1"); // Deep blue at top
    skyGradient.addColorStop(1, "#79A7D3"); // Lighter blue at horizon
    
    // Fill sky area
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height * 0.6);
  };
  
  /**
   * Draw clouds with the two-image infinite scrolling technique
   */
  const drawClouds = (ctx: CanvasRenderingContext2D) => {
    if (!cloudLoaded.current || !cloudImgRef.current) return;
    
    const cloudImg = cloudImgRef.current;
    const cloudWidth = width;
    const cloudHeight = height * 0.3;
    const cloudY = 30;
    
    // Calculate positions for the two images
    let x1 = cloudPositionX.current % cloudWidth;
    if (x1 > 0) x1 -= cloudWidth; // Ensure the first image starts at or left of origin
    const x2 = x1 + cloudWidth; // Second image immediately follows the first
    
    // Draw first copy
    ctx.drawImage(cloudImg, x1, cloudY, cloudWidth, cloudHeight);
    
    // Draw second copy
    ctx.drawImage(cloudImg, x2, cloudY, cloudWidth, cloudHeight);
    
    // If needed due to speed, draw a third copy
    if (x2 < width) {
      ctx.drawImage(cloudImg, x2 + cloudWidth, cloudY, cloudWidth, cloudHeight);
    }
  };
  
  /**
   * Draw trees with the two-image infinite scrolling technique
   */
  const drawTrees = (ctx: CanvasRenderingContext2D) => {
    if (!treeLoaded.current || !treeImgRef.current) return;
    
    const treeImg = treeImgRef.current;
    const treeSize = 38.5;
    const treeY = height * 0.48;
    const treeSpacing = 300;
    
    // Create a pattern wide enough to fill the screen
    const patternWidth = Math.ceil(width / treeSpacing + 2) * treeSpacing;
    
    // Calculate tree pattern positions
    let x1 = treePositionX.current % patternWidth;
    if (x1 > 0) x1 -= patternWidth;
    const x2 = x1 + patternWidth;
    
    // Draw trees at regular intervals
    const numTrees = Math.ceil(patternWidth / treeSpacing);
    
    // Draw first set of trees
    for (let i = 0; i < numTrees; i++) {
      const x = x1 + i * treeSpacing;
      drawSingleTree(ctx, x, treeY, treeSize);
    }
    
    // Draw second set of trees
    for (let i = 0; i < numTrees; i++) {
      const x = x2 + i * treeSpacing;
      if (x < width) {
        drawSingleTree(ctx, x, treeY, treeSize);
      }
    }
  };
  
  /**
   * Draw a single tree
   */
  const drawSingleTree = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    size: number
  ) => {
    if (!treeImgRef.current) return;
    
    const treeImg = treeImgRef.current;
    const scale = size / Math.min(treeImg.width, treeImg.height) * 3.85;
    const treeWidth = treeImg.width * scale;
    const treeHeight = treeImg.height * scale;
    
    // Draw centered tree
    ctx.drawImage(
      treeImg,
      x - treeWidth / 2,
      y - treeHeight * 0.85,
      treeWidth,
      treeHeight
    );
  };
  
  /**
   * Draw the sidewalk area
   */
  const drawSidewalk = (ctx: CanvasRenderingContext2D) => {
    const sidewalkY = height * 0.6;
    const playerAreaY = height - 202;
    
    // Fill sidewalk area
    ctx.fillStyle = "#A9A9A9";
    ctx.fillRect(0, sidewalkY, width, playerAreaY - sidewalkY);
    
    // Draw horizontal grid lines
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 1;
    
    for (let y = sidewalkY + 20; y < playerAreaY; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw vertical grid lines with two-image technique
    const lineSpacing = 40;
    const patternWidth = Math.ceil(width / lineSpacing + 2) * lineSpacing;
    
    // Calculate vertical line pattern positions
    let x1 = (treePositionX.current * 0.8) % patternWidth; // Grid moves a bit slower than trees
    if (x1 > 0) x1 -= patternWidth;
    
    // Draw vertical lines
    for (let i = 0; i < patternWidth / lineSpacing * 2; i++) {
      const x = x1 + i * lineSpacing;
      if (x >= -lineSpacing && x <= width) {
        ctx.beginPath();
        ctx.moveTo(x, sidewalkY);
        ctx.lineTo(x, playerAreaY);
        ctx.stroke();
      }
    }
  };
  
  /**
   * Draw the road and its markings with the two-image technique
   */
  const drawRoad = (ctx: CanvasRenderingContext2D) => {
    const playerAreaY = height - 202;
    
    // Fill road area
    ctx.fillStyle = "#333333";
    ctx.fillRect(0, playerAreaY, width, height - playerAreaY);
    
    // Draw road markings
    const dashLength = 30;
    const gapLength = 40;
    const patternLength = dashLength + gapLength;
    const patternWidth = Math.ceil(width / patternLength + 4) * patternLength;
    
    // Calculate road marking positions
    let x1 = roadPositionX.current % patternWidth;
    if (x1 > 0) x1 -= patternWidth;
    
    // Set road marking style
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 6;
    
    // Draw center line dashes
    const centerY = playerAreaY + (height - playerAreaY) / 2;
    
    // Draw all visible dashes
    for (let i = 0; i < patternWidth / patternLength * 2; i++) {
      const dashStart = x1 + i * patternLength;
      
      if (dashStart >= -patternLength && dashStart <= width) {
        ctx.beginPath();
        ctx.moveTo(dashStart, centerY);
        ctx.lineTo(dashStart + dashLength, centerY);
        ctx.stroke();
      }
    }
  };
  
  /**
   * Draw the complete background with all elements
   */
  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // Draw sky first (furthest back)
    drawSky(ctx);
    
    // Draw clouds (in sky)
    drawClouds(ctx);
    
    // Draw sidewalk
    drawSidewalk(ctx);
    
    // Draw trees on sidewalk
    drawTrees(ctx);
    
    // Draw road (closest to viewer)
    drawRoad(ctx);
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
