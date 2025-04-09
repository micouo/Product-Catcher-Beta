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
  
  // Store pre-generated world elements to prevent on-screen randomization
  // This is crucial for preventing the randomization of assets during gameplay
  const worldPatternsCache = useRef<Map<number, number[]>>(new Map());
  
  // Layer speeds
  const CLOUD_SPEED = 0.3;  // Slowest (clouds in background)
  const BUILDING_SPEED = 0.6; // Medium-slow (buildings in background)
  const TREE_SPEED = 1.5;   // Medium (trees on sidewalk)
  const ROAD_SPEED = 2.0;   // Fastest (road markings)
  const CALGARY_TOWER_SPEED = 0.4; // Slower than buildings to appear in distant background
  const BLUE_RING_SPEED = TREE_SPEED;     // Same as tree/sidewalk speed (anchored to sidewalk)
  
  // Pre-generate world building patterns at the start
  // This is the key to preventing on-screen randomization
  const preGenerateWorldPatterns = () => {
    console.log('Pre-generating world patterns to prevent on-screen randomization');
    
    // Define base building patterns
    const buildingPatterns = [
      [0, 1, 2], // Pattern 1: Building 1, 2, 3
      [2, 0, 1], // Pattern 2: Building 3, 1, 2
      [1, 2, 0]  // Pattern 3: Building 2, 3, 1
    ];
    
    // Generate a wide range of world positions and assign fixed patterns
    // This ensures all randomization happens at startup, not during gameplay
    const worldRange = 10000; // Covers far more positions than we'll need
    const worldSectionSize = 300; // Each section gets a fixed pattern
    
    // For each possible world position, pre-assign a fixed building pattern
    for (let worldPos = -worldRange; worldPos < worldRange; worldPos += worldSectionSize) {
      // Use a deterministic but seemingly random hash function
      // This is based solely on worldPos and will always return the same value
      const hash = Math.abs(((worldPos * 1327) + 2473) % buildingPatterns.length);
      
      // Store the pattern for this world position in our cache
      worldPatternsCache.current.set(worldPos, [...buildingPatterns[hash]]);
    }
  };
  
  useEffect(() => {
    // Call this immediately to set up all patterns before first render
    preGenerateWorldPatterns();
    
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
   * Buildings are organized in fixed patterns to eliminate any snapping effect
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
    
    // ===== EASILY CONFIGURABLE PROPERTIES FOR BUILDINGS =====
    // You can adjust these values to change appearance and placement
    
    // APPEARANCE & SIZING
    const BUILDING_SCALE = width * 0.25;     // Base scale factor for buildings
    
    // POSITIONING
    const SIDEWALK_Y = height * 0.6;         // Sidewalk position
    const BUILDING_Y_OFFSET = 42;            // Baseline vertical adjustment (positive = lower)
    
    // SPACING
    const BETWEEN_BUILDING_GAP = -85;        // Space between buildings within a cluster (negative = overlap)
    const BETWEEN_CLUSTER_GAP = -50;         // Space between building clusters
    
    // PARALLAX EFFECT
    const PARALLAX_FACTOR = 0.8;             // How buildings move relative to sidewalk (lower = more distant feel)
    
    // RENDERING DISTANCE
    const RENDER_BUFFER = 800;               // How far offscreen to render buildings
    
    // END OF CONFIGURATION SECTION
    // ============================================
    
    // Calculate the base Y position for buildings
    const buildingY = SIDEWALK_Y + BUILDING_Y_OFFSET;
    
    // Define the building patterns used throughout the scene
    // Each building has a consistent size and vertical position
    const buildingSizes = [
      { 
        img: building1Img, 
        width: BUILDING_SCALE * 0.6 * 2.4, 
        height: height * 0.6,
        yOffset: 24 // Building 1 vertical offset
      },
      { 
        img: building2Img, 
        width: BUILDING_SCALE * 1.02 * 1.2 * 1.7, 
        height: height * 0.6 * 1.4,
        yOffset: 75 // Building 2 vertical offset
      },
      { 
        img: building3Img, 
        width: BUILDING_SCALE * 0.6 * 2.7, 
        height: height * 0.7,
        yOffset: 34 // Building 3 vertical offset
      }
    ];
    
    // Define fixed building patterns to ensure consistency
    // Each pattern defines the order of buildings in a cluster
    // We'll cycle through these patterns to create variation without randomness
    const buildingPatterns = [
      [0, 1, 2], // Pattern 1: Building 1, 2, 3
      [2, 0, 1], // Pattern 2: Building 3, 1, 2
      [1, 2, 0]  // Pattern 3: Building 2, 3, 1
    ];
    
    // Calculate the width of a single cluster (3 buildings + gaps between them)
    // All clusters will have the same total width regardless of building order
    const clusterWidth = buildingSizes.reduce((sum, building) => sum + building.width, 0) + 
                         BETWEEN_BUILDING_GAP * 2; // 2 gaps between 3 buildings
    
    // Calculate the width of a complete pattern (cluster + gap)
    const patternWidth = clusterWidth + BETWEEN_CLUSTER_GAP;
    
    // Add buffer to prevent pop-in and ensure smooth scrolling
    const visibleWidth = width + RENDER_BUFFER;
    const numClusters = Math.ceil(visibleWidth / patternWidth) + 1;
    
    // Use building position with parallax factor to match trees and sidewalk
    // This ensures the buildings appear fixed relative to the sidewalk
    let baseX = (buildingPositionX.current * PARALLAX_FACTOR) % patternWidth;
    if (baseX > 0) baseX -= patternWidth;
    
    // Create a map to store assigned patterns to specific world positions
    // This ensures that buildings always maintain the same pattern even as they scroll
    // We'll use a very large world section to ensure all visible positions are covered
    const worldExtent = 100000; // Large enough to cover all positions during gameplay
    const worldSectionSize = patternWidth; // Each section gets its own pattern
    
    // World position of the leftmost visible cluster
    // This is the absolute world coordinate (very large number)
    const worldLeftmostPos = Math.floor(buildingPositionX.current / worldSectionSize) * worldSectionSize;
    
    // Draw multiple building clusters to ensure continuous scene
    for (let clusterIndex = 0; clusterIndex < numClusters; clusterIndex++) {
      // Calculate screen position
      const clusterStartX = baseX + (clusterIndex * patternWidth);
      
      // Skip if cluster is completely off-screen (optimization)
      if (clusterStartX > width || clusterStartX + clusterWidth < 0) continue;
      
      // Calculate world position for this specific cluster
      // This ensures each world position always gets the same pattern regardless of scrolling
      const worldPos = Math.floor((worldLeftmostPos + (clusterIndex * worldSectionSize)) / 300) * 300;
      
      // Get the pre-generated pattern from our cache that was created at startup
      // This is the key to preventing visible randomization during gameplay
      let buildingOrder;
      
      if (worldPatternsCache.current.has(worldPos)) {
        // Use the pre-generated pattern from our cache
        buildingOrder = worldPatternsCache.current.get(worldPos)!;
      } else {
        // This should never happen since we pre-generated all patterns
        // But just in case, fallback to a consistent pattern
        const hash = Math.abs(((worldPos * 1327) + 2473) % buildingPatterns.length);
        buildingOrder = buildingPatterns[hash];
        
        // Cache it for future use
        worldPatternsCache.current.set(worldPos, [...buildingPatterns[hash]]);
      }
      
      // Current x position within the cluster
      let currentX = clusterStartX;
      
      // Draw each building in the cluster using the selected pattern
      buildingOrder.forEach((buildingIndex) => {
        const building = buildingSizes[buildingIndex];
        
        // Calculate the exact Y position for this building
        const yPosition = buildingY - building.height + building.yOffset;
            
        // Draw the building
        ctx.drawImage(
          building.img,
          currentX,
          yPosition,
          building.width,
          building.height
        );
        
        // Move to the next building position
        currentX += building.width + BETWEEN_BUILDING_GAP;
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
    
    // ===== EASILY CONFIGURABLE PROPERTIES FOR CALGARY TOWER =====
    // You can adjust these values to change appearance and placement
    
    // APPEARANCE
    const TOWER_SCALE = 2.0;                   // Scale factor for the tower size
    const TOWER_WIDTH = width * 0.2 * TOWER_SCALE;  // Width of the tower
    const TOWER_HEIGHT = height * 0.35 * TOWER_SCALE; // Height of the tower
    
    // POSITIONING
    const TOWER_Y_OFFSET = 40;                 // Vertical position: smaller = higher, larger = lower
    const TOWER_X_OFFSET = -300;               // Fine-tune horizontal position adjustment
    
    // GENERATION FREQUENCY
    const TOWER_SPACING_MULTIPLIER = 3.0;      // Higher number = towers appear less frequently
                                               // Controls how frequently towers appear
    
    // PARALLAX EFFECT
    const PARALLAX_FACTOR = 0.7;               // Controls how much slower the tower moves compared to buildings
                                               // Lower = appears more distant, Higher = moves more with buildings
    
    // END OF CONFIGURATION SECTION
    // ============================================
    
    const towerY = sidewalkY - TOWER_HEIGHT + TOWER_Y_OFFSET;
    
    // Calculate the spacing between towers
    const towerSpacing = width * TOWER_SPACING_MULTIPLIER; 
    
    // Create a wider pattern to ensure towers are spaced appropriately
    const visibleWidth = width * 3;
    const patternWidth = Math.ceil(visibleWidth / towerSpacing) * towerSpacing;
    
    // Apply the parallax effect for a distant background feel
    let x1 = (calgaryTowerPositionX.current * PARALLAX_FACTOR) % patternWidth;
    if (x1 > 0) x1 -= patternWidth;
    
    // Create a consistent world-based pattern for tower placement
    // This ensures towers always appear at the same world positions
    const worldSectionSize = towerSpacing;
    const worldLeftmostPos = Math.floor(calgaryTowerPositionX.current / worldSectionSize) * worldSectionSize;
    
    // Draw towers with proper spacing
    const numTowers = Math.ceil(patternWidth / towerSpacing) + 1;
    
    for (let i = 0; i < numTowers; i++) {
      // Calculate world position for this specific tower
      const worldPos = worldLeftmostPos + (i * worldSectionSize);
      
      // Calculate screen position
      const x = x1 + i * towerSpacing + TOWER_X_OFFSET;
      
      // Only draw if within our visible area with buffer
      if (x > -TOWER_WIDTH && x < width + TOWER_WIDTH) {
        ctx.drawImage(calgaryTowerImg, x, towerY, TOWER_WIDTH, TOWER_HEIGHT);
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
    
    // Create a consistent world-based pattern for ring placement
    // This ensures rings always appear at the same world positions between trees
    const worldSectionSize = ringSpacing;
    const worldLeftmostPos = Math.floor(treePositionX.current / worldSectionSize) * worldSectionSize;
    
    // Draw rings at positions that ensure they're between trees
    const numRings = Math.ceil(patternWidth / ringSpacing) + 1;
    
    for (let i = 0; i < numRings; i++) {
      // Calculate world position for this specific ring
      const worldPos = worldLeftmostPos + (i * worldSectionSize);
      
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
   * Grass is drawn as a single uniform row on top of the sidewalk but behind the trees
   */
  const drawGrass = (ctx: CanvasRenderingContext2D) => {
    if (!grassLoaded.current || !grassImgRef.current) return;
    
    const grassImg = grassImgRef.current;
    const sidewalkY = height * 0.6;
    
    // ===== EASILY CONFIGURABLE PROPERTIES FOR GRASS =====
    // You can adjust these values to change appearance and placement
    
    // APPEARANCE
    const GRASS_WIDTH = width * 0.25;       // Width of each grass patch
    const GRASS_HEIGHT = height * 0.08;     // Height of each grass patch
    
    // POSITIONING
    const GRASS_Y_OFFSET = 20;              // Vertical position: smaller = higher, larger = lower
                                           // Adjust this single value to move grass up or down
    
    // GENERATION SETTINGS
    const GRASS_OVERLAP = 0.3;             // How much each grass patch overlaps (0.3 = 30% overlap)
                                           // Lower values create a more consistent texture
    
    // END OF CONFIGURATION SECTION
    // ============================================
    
    // Calculate the exact Y position for the grass
    const grassY = sidewalkY - GRASS_HEIGHT + GRASS_Y_OFFSET;
    
    // Calculate spacing based on overlap to create a uniform appearance
    const grassSpacing = GRASS_WIDTH * (1 - GRASS_OVERLAP);
    
    // Create an extra-wide pattern to prevent any gaps
    const visibleWidth = width * 5; // 5x screen width for extensive coverage
    const patternWidth = Math.ceil(visibleWidth / grassSpacing) * grassSpacing;
    
    // Use the exact same synchronization as trees for seamless movement
    let x1 = (treePositionX.current) % patternWidth; 
    if (x1 > 0) x1 -= patternWidth;
    
    // Calculate plenty of patches to ensure complete coverage
    const numPatches = Math.ceil(patternWidth / grassSpacing) + 5;
    
    // Draw a single row of grass patches with consistent spacing
    for (let i = 0; i < numPatches; i++) {
      const x = x1 + (i * grassSpacing);
      
      // Use a very large buffer to ensure we never see edges
      if (x > -GRASS_WIDTH * 2 && x < width + GRASS_WIDTH * 2) {
        ctx.drawImage(grassImg, x, grassY, GRASS_WIDTH, GRASS_HEIGHT);
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
