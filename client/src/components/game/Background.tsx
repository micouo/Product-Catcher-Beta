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
    
    // Clouds using multi-layer approach with different sizes and speeds
    // Reduced cloud sizes significantly based on user feedback
    const cloudLayers = [
      { y: 40, width: width * 0.6, height: height * 0.15, speed: 1.0, offsetMultiplier: 1.0 },
      { y: 80, width: width * 0.4, height: height * 0.1, speed: 1.2, offsetMultiplier: 1.2 },
      { y: 20, width: width * 0.5, height: height * 0.12, speed: 0.8, offsetMultiplier: 0.8 }
    ];
    
    // Draw each cloud layer with its own parameters
    cloudLayers.forEach(layer => {
      // Calculate positions for the current layer with independent speed
      // Using layer-specific speed multiplier for varied parallax effect
      let layerPositionX = cloudPositionX.current * layer.offsetMultiplier;
      
      // Calculate positions for the two images
      let x1 = layerPositionX % layer.width;
      if (x1 > 0) x1 -= layer.width; // Ensure the first image starts at or left of origin
      const x2 = x1 + layer.width; // Second image immediately follows the first
      
      // Draw first copy of cloud layer
      ctx.drawImage(cloudImg, x1, layer.y, layer.width, layer.height);
      
      // Draw second copy of cloud layer
      ctx.drawImage(cloudImg, x2, layer.y, layer.width, layer.height);
      
      // If needed due to speed, draw a third copy
      if (x2 < width) {
        ctx.drawImage(cloudImg, x2 + layer.width, layer.y, layer.width, layer.height);
      }
    });
  };
  
  /**
   * Draw trees with the two-image infinite scrolling technique
   */
  const drawTrees = (ctx: CanvasRenderingContext2D) => {
    if (!treeLoaded.current || !treeImgRef.current) return;
    
    const treeImg = treeImgRef.current;
    const treeSize = 38.5;
    // Position trees properly on the sidewalk - tree trunks should be on the sidewalk
    const sidewalkY = height * 0.6;
    const treeY = sidewalkY + 20; // Position tree trunk base higher on the sidewalk
    const treeSpacing = 300;
    
    // Create a pattern wide enough to fill the screen plus extra buffer
    // Adding extra width to ensure trees are created well before they enter the viewport
    const visibleWidth = width + 600; // Add 600px buffer to the right
    const patternWidth = Math.ceil(visibleWidth / treeSpacing + 2) * treeSpacing;
    
    // Calculate tree pattern positions
    let x1 = treePositionX.current % patternWidth;
    if (x1 > 0) x1 -= patternWidth;
    const x2 = x1 + patternWidth;
    
    // Draw trees at regular intervals with extended range
    const numTrees = Math.ceil(patternWidth / treeSpacing);
    
    // Draw first set of trees
    for (let i = 0; i < numTrees; i++) {
      const x = x1 + i * treeSpacing;
      // Only draw if within our extended visible area (including off-screen buffer)
      if (x > -100 && x < width + 600) {
        drawSingleTree(ctx, x, treeY, treeSize);
      }
    }
    
    // Draw second set of trees if needed
    for (let i = 0; i < numTrees; i++) {
      const x = x2 + i * treeSpacing;
      // Only draw if within our extended visible area (including off-screen buffer)
      if (x > -100 && x < width + 600) {
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
    // Increased vertical offset to position tree higher on sidewalk
    ctx.drawImage(
      treeImg,
      x - treeWidth / 2,
      y - treeHeight * 0.95, // Increased from 0.85 to 0.95 for higher placement
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
    // Add extra buffer width to ensure lines are created well before they enter viewport
    const visibleWidth = width + 600;
    const patternWidth = Math.ceil(visibleWidth / lineSpacing + 2) * lineSpacing;
    
    // Calculate vertical line pattern positions (align with tree movement)
    let x1 = (treePositionX.current * 0.8) % patternWidth; // Grid moves a bit slower than trees
    if (x1 > 0) x1 -= patternWidth;
    
    // Draw vertical lines with extended range
    for (let i = 0; i < patternWidth / lineSpacing * 2; i++) {
      const x = x1 + i * lineSpacing;
      // Only draw if within extended visible area (with buffer)
      if (x > -100 && x < width + 600) {
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
    
    // Add extra buffer width to ensure road markings are created well before they enter viewport
    const visibleWidth = width + 600;
    const patternWidth = Math.ceil(visibleWidth / patternLength + 4) * patternLength;
    
    // Calculate road marking positions
    let x1 = roadPositionX.current % patternWidth;
    if (x1 > 0) x1 -= patternWidth;
    
    // Set road marking style
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 6;
    
    // Draw center line dashes
    const centerY = playerAreaY + (height - playerAreaY) / 2;
    
    // Draw all dashes with extended range
    for (let i = 0; i < patternWidth / patternLength * 2; i++) {
      const dashStart = x1 + i * patternLength;
      
      // Only draw if within our extended visible area (with buffer)
      if (dashStart > -100 && dashStart < width + 600) {
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
