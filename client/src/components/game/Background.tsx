import React, { useEffect, useRef } from "react";
import cloudImage from "../../assets/cloud.png";
import treeImage from "../../assets/tree 1.png";
import building1Image from "../../assets/building 1.png";
import building2Image from "../../assets/building 2.png";
import building3Image from "../../assets/building 3.png";
import grassImage from "../../assets/grass.png";
import calgaryTowerImage from "../../assets/calgary-tower.png";
import blueRingImage from "../../assets/blue-ring.png";

interface BackgroundProps {
  width: number;
  height: number;
  isPaused?: boolean;
}

/**
 * A simple background component that renders a continuously scrolling background
 * using the two-image technique for perfect infinite scrolling.
 */
export default function Background({ width, height, isPaused = false }: BackgroundProps) {
  // Canvas reference
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Animation frame ID for cleanup
  const animationFrameRef = useRef<number | null>(null);
  
  // Track positions of background elements
  const cloudPositionX = useRef(0);
  const buildingPositionX = useRef(0);
  const treePositionX = useRef(0);
  const roadPositionX = useRef(0);
  const calgaryTowerPositionX = useRef(0);
  const blueRingPositionX = useRef(0);
  
  // Last timestamp for frame-rate independent animation
  const lastTimeRef = useRef(0);
  
  // Image references
  const cloudImgRef = useRef(new Image());
  const treeImgRef = useRef(new Image());
  const grassImgRef = useRef(new Image());
  const building1ImgRef = useRef(new Image());
  const building2ImgRef = useRef(new Image());
  const building3ImgRef = useRef(new Image());
  const calgaryTowerImgRef = useRef(new Image());
  const blueRingImgRef = useRef(new Image());
  const cloudLoaded = useRef(false);
  const treeLoaded = useRef(false);
  const grassLoaded = useRef(false);
  const building1Loaded = useRef(false);
  const building2Loaded = useRef(false);
  const building3Loaded = useRef(false);
  const calgaryTowerLoaded = useRef(false);
  const blueRingLoaded = useRef(false);
  
  // Layer speeds
  const CLOUD_SPEED = 0.3;  // Slowest (clouds in background)
  const BUILDING_SPEED = 0.6; // Medium-slow (buildings in background)
  const TREE_SPEED = 1.5;   // Medium (trees on sidewalk)
  const ROAD_SPEED = 2.0;   // Fastest (road markings)
  const CALGARY_TOWER_SPEED = 0.4; // Slower than buildings to appear in distant background
  const BLUE_RING_SPEED = TREE_SPEED;     // Same as tree/sidewalk speed (anchored to sidewalk)
  
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
    
    // Load grass image
    const grassImg = grassImgRef.current;
    grassImg.src = grassImage;
    grassImg.onload = () => {
      grassLoaded.current = true;
    };
    
    // Load building images
    const building1Img = building1ImgRef.current;
    building1Img.src = building1Image;
    building1Img.onload = () => {
      building1Loaded.current = true;
    };
    
    const building2Img = building2ImgRef.current;
    building2Img.src = building2Image;
    building2Img.onload = () => {
      building2Loaded.current = true;
    };
    
    const building3Img = building3ImgRef.current;
    building3Img.src = building3Image;
    building3Img.onload = () => {
      building3Loaded.current = true;
    };
    
    // Load Calgary Tower image
    const calgaryTowerImg = calgaryTowerImgRef.current;
    calgaryTowerImg.src = calgaryTowerImage;
    calgaryTowerImg.onload = () => {
      calgaryTowerLoaded.current = true;
    };
    
    // Load Blue Ring image
    const blueRingImg = blueRingImgRef.current;
    blueRingImg.src = blueRingImage;
    blueRingImg.onload = () => {
      blueRingLoaded.current = true;
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
      
      // Only update positions if not paused
      if (!isPaused) {
        // Update element positions based on their speeds
        cloudPositionX.current -= CLOUD_SPEED * timeMultiplier;
        buildingPositionX.current -= BUILDING_SPEED * timeMultiplier;
        treePositionX.current -= TREE_SPEED * timeMultiplier;
        roadPositionX.current -= ROAD_SPEED * timeMultiplier;
        calgaryTowerPositionX.current -= CALGARY_TOWER_SPEED * timeMultiplier;
        blueRingPositionX.current -= BLUE_RING_SPEED * timeMultiplier;
      }
      
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
  }, [width, height, isPaused]);
  
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
    // Cloud sizes increased by another 20% (now 38% larger than original)
    // Horizontal offsets maintained to distribute clouds evenly across the screen
    const cloudLayers = [
      { y: 40, width: width * 0.187, height: height * 0.208, speed: 1.0, offsetMultiplier: 1.0, xOffset: width * 0.1 }, // 20% larger
      { y: 80, width: width * 0.121, height: height * 0.138, speed: 1.2, offsetMultiplier: 1.2, xOffset: width * 0.4 }, // 20% larger
      { y: 20, width: width * 0.155, height: height * 0.166, speed: 0.8, offsetMultiplier: 0.8, xOffset: width * 0.7 }  // 20% larger
    ];
    
    // Draw each cloud layer with its own parameters
    cloudLayers.forEach(layer => {
      // Calculate positions for the current layer with independent speed
      // Using layer-specific speed multiplier for varied parallax effect
      let layerPositionX = cloudPositionX.current * layer.offsetMultiplier;
      
      // Modified cloud rendering to ensure continuous generation of clouds
      // We'll use repeating patterns with modulo, but ensure the spacing is large enough
      // to prevent visible patterns while still ensuring continuous cloud coverage
      
      // Create a wider section for better cloud distribution and visual diversity
      const sectionWidth = width * 3.0; // Wider section for more natural-looking spacing
      
      // Calculate the base position for our cloud pattern
      let baseX = layerPositionX % sectionWidth;
      if (baseX > 0) baseX -= sectionWidth;
      
      // Much larger buffer to ensure clouds are always generated before entering viewport
      const buffer = width * 2.5;
      
      // Draw more copies to ensure continuous coverage regardless of scroll speed
      // This ensures clouds are always present even if several move off-screen
      const numCopiesNeeded = Math.ceil((width + 2 * buffer) / sectionWidth) + 2;
      
      // Draw multiple copies with proper spacing to ensure continuous coverage
      for (let i = 0; i < numCopiesNeeded; i++) {
        // Position clouds with varying offsets plus their layer-specific offset
        const xPos = baseX + (i * sectionWidth) + layer.xOffset;
        
        // Draw if within our greatly extended buffer area
        if (xPos < width + buffer && xPos > -buffer) {
          ctx.drawImage(cloudImg, xPos, layer.y, layer.width, layer.height);
          
          // Add a second cloud within each section at a different position for variety
          // This creates more natural-looking cloud distribution
          const secondCloudOffset = sectionWidth * 0.4; // Position second cloud at 40% of section
          // Secondary cloud also increased by another 20% (from 0.92 to 1.1 = 38% larger than original)
          ctx.drawImage(cloudImg, xPos + secondCloudOffset, layer.y + 10, layer.width * 1.1, layer.height * 1.1);
        }
      }
    });
  };
  
  /**
   * Draw trees with the two-image infinite scrolling technique
   * Trees must move at exactly the same speed as the sidewalk grid
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
    
    // IMPORTANT: Use the exact same scroll speed as the sidewalk grid
    // This ensures trees appear fixed to the sidewalk rather than moving independently
    // Using treePositionX.current directly with no multiplier for perfect synchronization
    let x1 = (treePositionX.current) % patternWidth; // Direct 1:1 mapping for perfect sync
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
    
    // Calculate vertical line pattern positions - this speed is synchronized with the trees 
    // Using treePositionX.current directly with no multiplier for perfect synchronization
    let x1 = (treePositionX.current) % patternWidth; // Direct 1:1 matching for perfect sync
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
   * Draw buildings with the two-image infinite scrolling technique
   * Buildings are between clouds and sidewalk in the background
   * Buildings are organized in tight clusters of 3 with small gaps between clusters
   */
  const drawBuildings = (ctx: CanvasRenderingContext2D) => {
    // Check if all building images are loaded
    if (!building1Loaded.current || !building1ImgRef.current ||
        !building2Loaded.current || !building2ImgRef.current ||
        !building3Loaded.current || !building3ImgRef.current) return;
    
    // Get building images
    const building1Img = building1ImgRef.current;
    const building2Img = building2ImgRef.current;
    const building3Img = building3ImgRef.current;
    
    // Define building settings
    const sidewalkY = height * 0.6; // Same as sidewalk Y position
    const buildingY = sidewalkY + 42; // Move buildings 5px down to completely eliminate any gap
    
    // Define building sizes - much larger scale for much closer appearance
    const buildingScale = width * 0.25; // Dramatically increased base scale for buildings (more than 2x)
    const buildingSizes = [
      { 
        img: building1Img, 
        width: buildingScale * 0.6 * 2.4, 
        height: height * 0.6,
        yOffset: 24 // Building 1 vertical offset (0 = default position)
      },
      { 
        img: building2Img, 
        width: buildingScale * 1.02 * 1.2 * 1.7, 
        height: height * 0.6 * 1.4,
        yOffset: 80 // Building 2 vertical offset - lower number = higher position
      },
      { 
        img: building3Img, 
        width: buildingScale * 0.6 * 2.7, 
        height: height * 0.7,
        yOffset: 34 // Building 3 vertical offset (0 = default position)
      }
    ];
    
    // Create building clusters with specific spacing
    const betweenBuildingGap = -85; // 2px between buildings in a cluster
    const betweenClusterGap = -50; // 30px between clusters
    
    // Calculate the width of a single cluster (3 buildings + gaps between them)
    const clusterWidth = buildingSizes.reduce((sum, building) => sum + building.width, 0) + 
                         betweenBuildingGap * 1; // 2 gaps between 3 buildings
    
    // Calculate the width of a complete pattern (cluster + gap)
    const patternWidth = clusterWidth + betweenClusterGap;
    
    // Add buffer to prevent pop-in
    const visibleWidth = width + 800;
    const numClusters = Math.ceil(visibleWidth / patternWidth) + 1;
    
    // Use building position with 0.8 multiplier to match trees and sidewalk
    // This ensures the buildings appear fixed relative to the sidewalk
    let baseX = (buildingPositionX.current * 0.8) % patternWidth;
    if (baseX > 0) baseX -= patternWidth;
    
    // Draw multiple building clusters to ensure continuous scene
    for (let clusterIndex = 0; clusterIndex < numClusters; clusterIndex++) {
      const clusterStartX = baseX + (clusterIndex * patternWidth);
      
      // Skip if cluster is completely off-screen
      if (clusterStartX > width || clusterStartX + clusterWidth < 0) continue;
      
      // For each cluster, generate a random order of buildings (if outside visible area)
      // Or use pseudo-random but consistent placement for visible buildings
      let buildingOrder = [0, 1, 2]; // Default order
      
      // Use a deterministic "random" order based on cluster position
      // This ensures the same cluster always has the same buildings
      // while still giving variation between clusters
      const seed = Math.abs(Math.floor(clusterStartX / 1000));
      if (seed % 3 === 0) buildingOrder = [2, 0, 1];
      else if (seed % 3 === 1) buildingOrder = [1, 2, 0];
      
      // Current x position within the cluster
      let currentX = clusterStartX;
      
      // Draw each building in the cluster
      buildingOrder.forEach((buildingIndex) => {
        const building = buildingSizes[buildingIndex];
        
        // Draw the building with individual vertical positioning
        // Use each building's specific yOffset for precise vertical positioning
        const yPosition = buildingY - building.height + building.yOffset;
            
        ctx.drawImage(
          building.img,
          currentX,
          yPosition,
          building.width,
          building.height
        );
        
        // Move to the next building position
        currentX += building.width + betweenBuildingGap;
      });
    }
  };

  /**
   * Draw the Calgary Tower in the background between building clusters
   * Calgary Tower is positioned behind buildings but in front of clouds
   */
  const drawCalgaryTower = (ctx: CanvasRenderingContext2D) => {
    if (!calgaryTowerLoaded.current || !calgaryTowerImgRef.current) return;
    
    const calgaryTowerImg = calgaryTowerImgRef.current;
    
    // Position the Calgary Tower in the background
    const sidewalkY = height * 0.6;
    
    // EASILY CONFIGURABLE PROPERTIES FOR CALGARY TOWER
    const towerScale = 2; // Scale factor for the tower (adjust as needed)
    const towerWidth = width * 0.2 * towerScale; // 10% of screen width by default
    const towerHeight = height * 0.35 * towerScale; // 35% of screen height by default
    const towerYOffset = 40; // Vertical position: smaller = higher, larger = lower
    const towerXOffset = -300; // Horizontal position: positive = right, negative = left
    const towerY = sidewalkY - towerHeight + towerYOffset;
    
    // Use a much larger spacing to ensure the tower appears less frequently
    // Making it slower to regenerate as requested
    const towerSpacing = width * 2; // 4x screen width spacing between towers
    
    // Create a much wider pattern to ensure towers are spaced far apart
    const visibleWidth = width * 3;
    const patternWidth = Math.ceil(visibleWidth / towerSpacing) * towerSpacing;
    
    // Use the calgary tower's own position tracker for a slower, distant effect
    // The tower scrolls slower than buildings to appear farther away in the background
    let x1 = (calgaryTowerPositionX.current) % patternWidth;
    if (x1 > 0) x1 -= patternWidth;
    
    // Draw towers with very large spacing to avoid having multiple on screen at once
    const numTowers = Math.ceil(patternWidth / towerSpacing) + 1;
    
    for (let i = 0; i < numTowers; i++) {
      // Apply the X offset to tower positioning
      const x = x1 + i * towerSpacing + towerXOffset;
      
      // Only draw if within our visible area with buffer
      if (x > -towerWidth && x < width + towerWidth) {
        ctx.drawImage(calgaryTowerImg, x, towerY, towerWidth, towerHeight);
      }
    }
  };
  
  /**
   * Draw the Blue Ring between trees
   * Blue Ring is layered in front of the grass and sidewalk but behind the trees
   */
  const drawBlueRing = (ctx: CanvasRenderingContext2D) => {
    if (!blueRingLoaded.current || !blueRingImgRef.current) return;
    
    const blueRingImg = blueRingImgRef.current;
    
    // Position the Blue Ring on the sidewalk between trees
    const sidewalkY = height * 0.6;
    
    // ===== EASILY CONFIGURABLE PROPERTIES FOR BLUE RING =====
    // You can adjust these values to change appearance and placement

    // APPEARANCE
    const RING_SCALE = 2;                   // Scale factor for the ring size
    const RING_WIDTH = width * 0.15 * RING_SCALE;  // Width of the ring
    const RING_HEIGHT = height * 0.2 * RING_SCALE; // Height of the ring
    
    // POSITIONING
    const RING_Y_OFFSET = 30;                 // Vertical position: smaller = higher, larger = lower
    const RING_X_OFFSET = -120;                  // Fine-tune horizontal position adjustment
    
    // GENERATION FREQUENCY
    const RING_SPACING_MULTIPLIER = 4.0;      // Higher number = rings appear less frequently
                                             // Value is multiplied by tree spacing to ensure rings appear between trees
    
    // END OF CONFIGURATION SECTION
    // ============================================
    
    const ringY = sidewalkY - RING_HEIGHT + RING_Y_OFFSET;
    
    // Get the tree spacing so we can sync the rings with the tree pattern
    const treeSpacing = 300; // This must match the value in drawTrees
    
    // Make the ring spacing a multiple of the tree spacing to ensure it's between trees
    // Trees are spaced at regular intervals, so we place rings at positions that ensure they're between trees
    const ringSpacing = treeSpacing * RING_SPACING_MULTIPLIER;
    
    // Create a much wider pattern for the rings
    const visibleWidth = width * 3;
    const patternWidth = Math.ceil(visibleWidth / ringSpacing) * ringSpacing;
    
    // Anchor the Blue Ring to the sidewalk movement for consistency (same as trees)
    let x1 = (treePositionX.current) % patternWidth;
    if (x1 > 0) x1 -= patternWidth;
    
    // Draw rings at positions that ensure they're between trees
    const numRings = Math.ceil(patternWidth / ringSpacing) + 1;
    
    for (let i = 0; i < numRings; i++) {
      // Calculate the base position using the ring spacing
      const basePos = x1 + i * ringSpacing;
      
      // Position the ring exactly halfway between trees
      // treeSpacing/2 puts it halfway between trees, then add offset for fine-tuning
      const x = basePos + (treeSpacing / 2) + RING_X_OFFSET;
      
      // Only draw if within our visible area with buffer
      if (x > -RING_WIDTH && x < width + RING_WIDTH) {
        ctx.drawImage(blueRingImg, x, ringY, RING_WIDTH, RING_HEIGHT);
      }
    }
  };
  
  /**
   * Draw grass on the sidewalk with the two-image infinite scrolling technique
   * Grass is drawn on top of the sidewalk but behind the trees
   */
  const drawGrass = (ctx: CanvasRenderingContext2D) => {
    if (!grassLoaded.current || !grassImgRef.current) return;
    
    const grassImg = grassImgRef.current;
    const sidewalkY = height * 0.6;
    
    // ===== EASILY CONFIGURABLE PROPERTIES FOR GRASS =====
    // You can adjust these values to change appearance and placement
    
    // APPEARANCE
    const GRASS_WIDTH = width * 0.2;        // Width of each grass patch
    const GRASS_HEIGHT = height * 0.08;     // Height of each grass patch
    
    // POSITIONING
    const GRASS_Y_OFFSET = 20;              // Vertical position: smaller = higher, larger = lower
                                           // Adjust this value to move all grass rows up or down together
    
    // GENERATION SETTINGS
    const GRASS_OVERLAP = 0.75;            // How much each grass patch overlaps (0.5 = 50% overlap)
                                           // Higher values create more dense coverage with no gaps
    
    const BUFFER_MULTIPLIER = 6;           // Increase this to prevent gaps at the edges
                                           // Higher values ensure consistent grass appearance
    
    // ROWS CONFIGURATION
    // Each row has same width but can be configured with different heights and offsets  
    const GRASS_ROWS = [
      { yOffset: 0,   heightScale: 1.0 },  // Bottom row (no offset)
      { yOffset: -4,  heightScale: 1.0 },  // Middle row (slightly higher)
      { yOffset: -8,  heightScale: 1.0 }   // Top row (highest)
    ];
    
    // END OF CONFIGURATION SECTION
    // ============================================
    
    // Base Y position for all grass (sidewalk with offset adjustment)
    const baseGrassY = sidewalkY - GRASS_HEIGHT + GRASS_Y_OFFSET;
    
    // Create extremely dense grass coverage with minimal spacing
    // Using aggressive overlap to ensure no gaps appear
    const grassSpacing = GRASS_WIDTH * (1 - GRASS_OVERLAP); // e.g., 75% overlap = 25% spacing
    
    // Extra-wide visible width with substantial buffer to prevent any gaps
    const visibleWidth = width * BUFFER_MULTIPLIER; 
    const patternWidth = Math.ceil(visibleWidth / grassSpacing) * grassSpacing;
    
    // Use the same exact synchronization as trees for grass movement (perfect sync)
    let x1 = (treePositionX.current) % patternWidth; 
    if (x1 > 0) x1 -= patternWidth;
    
    // Calculate a very large number of patches to ensure complete coverage
    const numPatches = Math.ceil(patternWidth / grassSpacing) + 10; // Extra patches for safety
    
    // Extended buffer for off-screen drawing to prevent any possible gaps
    const bufferWidth = GRASS_WIDTH * BUFFER_MULTIPLIER;
    
    // Draw multiple rows of grass with consistent positioning
    GRASS_ROWS.forEach((row) => {
      // Calculate this row's Y position based on base position and row-specific offset
      const rowY = baseGrassY + row.yOffset;
      
      // Calculate this row's height with any scaling
      const rowHeight = GRASS_HEIGHT * row.heightScale;
      
      // Draw all patches for this row
      for (let i = 0; i < numPatches; i++) {
        const x = x1 + (i * grassSpacing);
        
        // Only draw if within our extended visible area (with large buffer)
        if (x > -bufferWidth && x < width + bufferWidth) {
          ctx.drawImage(grassImg, x, rowY, GRASS_WIDTH, rowHeight);
        }
      }
    });
  };

  /**
   * Draw the complete background with all elements
   */
  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // Draw sky first (furthest back)
    drawSky(ctx);
    
    // Draw clouds (in sky)
    drawClouds(ctx);
    
    // Draw Calgary Tower (between clouds and buildings)
    drawCalgaryTower(ctx);
    
    // Draw buildings (behind sidewalk)
    drawBuildings(ctx);
    
    // Draw sidewalk
    drawSidewalk(ctx);
    
    // Draw grass on the sidewalk (but behind trees)
    drawGrass(ctx);
    
    // Draw Blue Ring (in front of grass/sidewalk but behind trees)
    drawBlueRing(ctx);
    
    // Draw trees on sidewalk (in front of grass and Blue Ring)
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
