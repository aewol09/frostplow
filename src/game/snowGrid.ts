/**
 * High-performance Snow Grid and dynamic texture manager.
 * Tracks cleared cells, road layout, obstacles, and generates the dynamic ground texture.
 */

import * as THREE from 'three';

export interface SnowCell {
  x: number; // grid coordinate
  z: number;
  worldX: number;
  worldZ: number;
  isSnowCovered: boolean;
  isRoadOrDriveway: boolean;
}

export interface ObstacleBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  type: 'building' | 'fence' | 'tree' | 'rock' | 'melter';
}

export class SnowManager {
  public readonly gridSize = 100; // 100x100 grid
  public readonly worldWidth = 70; // -35 to +35 in world space
  public readonly worldDepth = 70;
  public readonly cellSize: number;

  // Grid cell data
  private cells: Uint8Array; // 0 = clear, 1 = snow covered, 2 = non-road obstacle
  public totalSnowCells: number = 0;
  public clearedSnowCells: number = 0;

  // Canvas texture for ground rendering
  public groundCanvas: HTMLCanvasElement;
  public groundCtx: CanvasRenderingContext2D;
  public groundTexture: THREE.CanvasTexture;

  // Obstacles for collision detection
  public obstacles: ObstacleBox[] = [];

  constructor() {
    this.cellSize = this.worldWidth / this.gridSize;
    this.cells = new Uint8Array(this.gridSize * this.gridSize);

    // Create 512x512 ground canvas
    this.groundCanvas = document.createElement('canvas');
    this.groundCanvas.width = 512;
    this.groundCanvas.height = 512;
    const ctx = this.groundCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context for snow canvas');
    this.groundCtx = ctx;

    this.groundTexture = new THREE.CanvasTexture(this.groundCanvas);
    this.groundTexture.colorSpace = THREE.SRGBColorSpace;
    this.groundTexture.minFilter = THREE.LinearFilter;
    this.groundTexture.magFilter = THREE.LinearFilter;

    this.initTownLayout();
    this.renderInitialCanvas();
  }

  /**
   * Initializes town roads, driveways, chalets, plaza, and snow cover.
   */
  public initTownLayout() {
    this.obstacles = [];
    this.totalSnowCells = 0;
    this.clearedSnowCells = 0;

    // Define town layout
    // Main cross roads:
    // East-West main boulevard: Z between -6 and +6
    // North-South avenue: X between -6 and +6
    // Outer loop road: X around ±22, Z around ±22
    // Driveways leading to cozy cabins at various corners

    for (let gz = 0; gz < this.gridSize; gz++) {
      for (let gx = 0; gx < this.gridSize; gx++) {
        const wx = (gx / this.gridSize - 0.5) * this.worldWidth;
        const wz = (gz / this.gridSize - 0.5) * this.worldDepth;

        const isMainAvenue = Math.abs(wx) < 5.5;
        const isMainBoulevard = Math.abs(wz) < 5.5;
        const isOuterRing = (Math.abs(wx) > 18 && Math.abs(wx) < 25) || (Math.abs(wz) > 18 && Math.abs(wz) < 25);
        const isCentralPlaza = Math.sqrt(wx * wx + wz * wz) < 11;
        const isDriveway1 = wx > 6 && wx < 18 && Math.abs(wz - 12) < 3.5;
        const isDriveway2 = wx < -6 && wx > -18 && Math.abs(wz + 12) < 3.5;
        const isDriveway3 = wz > 6 && wz < 18 && Math.abs(wx + 12) < 3.5;
        const isDriveway4 = wz < -6 && wz > -18 && Math.abs(wx - 12) < 3.5;

        const isDrivableSnow =
          isMainAvenue ||
          isMainBoulevard ||
          isOuterRing ||
          isCentralPlaza ||
          isDriveway1 ||
          isDriveway2 ||
          isDriveway3 ||
          isDriveway4;

        const idx = gz * this.gridSize + gx;

        // Drivable snow strictly within plow reach of boundaries
        const inBoundary = Math.abs(wx) <= 28.5 && Math.abs(wz) <= 28.5;

        if (isDrivableSnow && inBoundary) {
          this.cells[idx] = 1; // Snow covered
          this.totalSnowCells++;
        } else {
          this.cells[idx] = 0; // Off-road or obstacle
        }
      }
    }

    // Add obstacles (cabins, fences, melter depot)
    // 4 cozy cabins in the quadrant courtyards
    const cabinCoords = [
      { x: 12, z: 12, w: 7, d: 6 },
      { x: -12, z: 12, w: 7, d: 6 },
      { x: 12, z: -12, w: 7, d: 6 },
      { x: -12, z: -12, w: 7, d: 6 },
      // Corner ski chalets
      { x: 26, z: 26, w: 6, d: 6 },
      { x: -26, z: 26, w: 6, d: 6 },
      { x: 26, z: -26, w: 6, d: 6 },
      { x: -26, z: -26, w: 6, d: 6 },
      // Snow Melter Silo Depot in East Plaza
      { x: 22, z: 0, w: 5, d: 5, type: 'melter' as const },
      // Central gazebo / fountain in plaza
      { x: 0, z: 0, w: 3.5, d: 3.5, type: 'building' as const },
    ];

    cabinCoords.forEach((b) => {
      this.obstacles.push({
        minX: b.x - b.w / 2,
        maxX: b.x + b.w / 2,
        minZ: b.z - b.d / 2,
        maxZ: b.z + b.d / 2,
        type: b.type || 'building',
      });
    });
  }

  /**
   * Initial canvas paint: asphalt/cobblestone roads under a fresh blanket of fluffy snow.
   */
  public renderInitialCanvas() {
    const ctx = this.groundCtx;
    const w = this.groundCanvas.width;
    const h = this.groundCanvas.height;

    // Draw base cleared road / cobblestone layer
    ctx.fillStyle = '#1e293b'; // Dark wintry asphalt
    ctx.fillRect(0, 0, w, h);

    // Draw road markings & sidewalk borders
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // Draw fresh winter snow blanket on top
    ctx.fillStyle = '#f8fafc'; // Crisp pure snow
    ctx.fillRect(0, 0, w, h);

    // Draw distinct dark stone road perimeter border so boundary is obvious even under snow
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    // Diagonal hazard curbs on perimeter corners
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, w - 40, h - 40);

    // Add subtle procedural snow sparkle noise
    for (let i = 0; i < 2000; i++) {
      const nx = Math.random() * w;
      const ny = Math.random() * h;
      const shade = Math.random() > 0.5 ? '#ffffff' : '#f1f5f9';
      ctx.fillStyle = shade;
      ctx.fillRect(nx, ny, 1.5, 1.5);
    }

    this.groundTexture.needsUpdate = true;
  }

  /**
   * Sweeps snow along the plow blade segment and salt radius.
   * Returns number of fresh cells cleared this frame.
   */
  public sweepSnow(
    vehicleX: number,
    vehicleZ: number,
    vehicleAngle: number,
    bladeWidth: number,
    saltRadius: number
  ): number {
    let newlyClearedCount = 0;

    // The blade is positioned in front of vehicle center
    const bladeOffsetFront = 1.6; // 1.6 units in front of tractor pivot
    const fx = vehicleX + Math.cos(vehicleAngle) * bladeOffsetFront;
    const fz = vehicleZ + Math.sin(vehicleAngle) * bladeOffsetFront;

    // Blade perpendicular vector
    const perpX = -Math.sin(vehicleAngle);
    const perpZ = Math.cos(vehicleAngle);

    const halfW = bladeWidth / 2;
    const p1x = fx - perpX * halfW;
    const p1z = fz - perpZ * halfW;
    const p2x = fx + perpX * halfW;
    const p2z = fz + perpZ * halfW;

    // Sample along the blade line segment
    const bladeSamples = Math.ceil(bladeWidth * 3);
    for (let i = 0; i <= bladeSamples; i++) {
      const t = i / bladeSamples;
      const sampleX = p1x + (p2x - p1x) * t;
      const sampleZ = p1z + (p2z - p1z) * t;

      if (this.clearCellAtWorld(sampleX, sampleZ)) {
        newlyClearedCount++;
      }
    }

    // If salt spreader is active, also clear in radius behind the plow
    if (saltRadius > 0) {
      const rearOffset = -1.2;
      const rx = vehicleX + Math.cos(vehicleAngle) * rearOffset;
      const rz = vehicleZ + Math.sin(vehicleAngle) * rearOffset;
      const saltSteps = Math.ceil(saltRadius * 2);
      for (let sx = -saltSteps; sx <= saltSteps; sx++) {
        for (let sz = -saltSteps; sz <= saltSteps; sz++) {
          const dist = Math.sqrt(sx * sx + sz * sz) * 0.5;
          if (dist <= saltRadius) {
            if (this.clearCellAtWorld(rx + sx * 0.5, rz + sz * 0.5)) {
              newlyClearedCount++;
            }
          }
        }
      }
    }

    if (newlyClearedCount > 0) {
      // Draw cleared blade swath onto canvas texture
      this.drawPlowSwathOnCanvas(p1x, p1z, p2x, p2z, bladeWidth, saltRadius, vehicleX, vehicleZ);
    }

    return newlyClearedCount;
  }

  private clearCellAtWorld(wx: number, wz: number): boolean {
    const gx = Math.floor(((wx / this.worldWidth) + 0.5) * this.gridSize);
    const gz = Math.floor(((wz / this.worldDepth) + 0.5) * this.gridSize);

    if (gx < 0 || gx >= this.gridSize || gz < 0 || gz >= this.gridSize) {
      return false;
    }

    const idx = gz * this.gridSize + gx;
    if (this.cells[idx] === 1) {
      this.cells[idx] = 0;
      this.clearedSnowCells++;
      return true;
    }
    return false;
  }

  /**
   * Draws cleared tracks directly to 2D canvas texture with soft edges.
   */
  private drawPlowSwathOnCanvas(
    p1x: number,
    p1z: number,
    p2x: number,
    p2z: number,
    bladeWidth: number,
    saltRadius: number,
    vehX: number,
    vehZ: number
  ) {
    const ctx = this.groundCtx;
    const w = this.groundCanvas.width;
    const h = this.groundCanvas.height;

    // Convert world coords to canvas pixel coords
    const c1x = ((p1x / this.worldWidth) + 0.5) * w;
    const c1y = ((p1z / this.worldDepth) + 0.5) * h;
    const c2x = ((p2x / this.worldWidth) + 0.5) * w;
    const c2y = ((p2z / this.worldDepth) + 0.5) * h;

    // Draw scraped asphalt stroke
    ctx.save();
    ctx.strokeStyle = '#1e293b'; // Cleared dark asphalt
    ctx.lineWidth = (bladeWidth / this.worldWidth) * w * 0.85;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c1x, c1y);
    ctx.lineTo(c2x, c2y);
    ctx.stroke();

    // Subtle tire track marks
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    const vcx = ((vehX / this.worldWidth) + 0.5) * w;
    const vcy = ((vehZ / this.worldDepth) + 0.5) * h;
    ctx.beginPath();
    ctx.arc(vcx, vcy, 2, 0, Math.PI * 2);
    ctx.stroke();

    // If salt spreader
    if (saltRadius > 0) {
      const cr = (saltRadius / this.worldWidth) * w;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.beginPath();
      ctx.arc(vcx, vcy, cr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    this.groundTexture.needsUpdate = true;
  }

  /**
   * Checks collision with town buildings, trees, and rocks.
   * Returns true if collided, plus pushes back vehicle.
   */
  public checkObstacleCollision(
    x: number,
    z: number,
    radius: number = 1.1
  ): { collided: boolean; pushX: number; pushZ: number; isMelter: boolean } {
    let pushX = 0;
    let pushZ = 0;
    let collided = false;
    let isMelter = false;

    for (const ob of this.obstacles) {
      // Find closest point on AABB to circle center
      const closestX = Math.max(ob.minX, Math.min(x, ob.maxX));
      const closestZ = Math.max(ob.minZ, Math.min(z, ob.maxZ));

      const dx = x - closestX;
      const dz = z - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        collided = true;
        if (ob.type === 'melter') {
          isMelter = true;
        }
        const dist = Math.sqrt(distSq) || 0.001;
        const overlap = radius - dist;
        pushX += (dx / dist) * overlap;
        pushZ += (dz / dist) * overlap;
      }
    }

    return { collided, pushX, pushZ, isMelter };
  }

  public reset() {
    this.initTownLayout();
    this.renderInitialCanvas();
  }
}
