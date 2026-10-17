/**
 * 3D Isometric Snowy Village World Scene, Hero Snow Plow, Particles,
 * Lighting and Camera Rig using Three.js.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SnowManager } from './snowGrid.ts';
import type { PlayerUpgrades, VehicleState, CollectibleItem, VehicleSkinId } from './types.ts';
import { getUpgradeModifiers } from './rules.ts';
import { VEHICLE_SKINS } from './monetization.ts';

// Pre-allocate scratch vectors for zero-allocation 60fps render loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();

export interface WorldCallbacks {
  onCollectItem: (item: CollectibleItem) => void;
  onMelterDeposit: () => void;
}

export class WorldScene {
  public scene: THREE.Scene;
  public camera: THREE.OrthographicCamera;
  public renderer: THREE.WebGLRenderer;
  public snowManager: SnowManager;

  // Hero vehicle parts
  public plowGroup!: THREE.Group;
  public plowBladeMesh!: THREE.Mesh;
  public wheels: THREE.Mesh[] = [];
  public beaconLight!: THREE.PointLight;
  public beaconMesh!: THREE.Mesh;
  public exhaustStack!: THREE.Group;
  private vehicleCabMat!: THREE.MeshStandardMaterial;
  private vehicleChassisMat!: THREE.MeshStandardMaterial;
  private vehicleBladeMat!: THREE.MeshStandardMaterial;
  private activeSkinId: VehicleSkinId = 'default';

  // Town structures and props
  public buildingsGroup!: THREE.Group;
  public treesGroup!: THREE.Group;
  public streetlampsGroup!: THREE.Group;
  public melterDepotGroup!: THREE.Group;
  public collectiblesGroup!: THREE.Group;

  // Particle systems
  private fallingSnowSystem!: THREE.Points;
  private plowSpraySystem!: THREE.Points;
  private plowSprayGeometry!: THREE.BufferGeometry;
  private plowSprayPositions!: Float32Array;
  private plowSprayVelocities!: Float32Array;
  private plowSprayLifetimes!: Float32Array;
  private readonly maxPlowSpray = 400;

  // Smoke particles
  private chimneySmokeSystem!: THREE.Points;
  private chimneySmokePositions!: Float32Array;

  // Collectibles state
  public collectibles: CollectibleItem[] = [];
  private collectibleMeshes: Map<string, THREE.Group> = new Map();

  // State & references
  private callbacks: WorldCallbacks;
  private cameraLookTarget = new THREE.Vector3(0, 0, 0);
  private cameraOffset = new THREE.Vector3(45, 45, 45); // Classic isometric 45-degree ray
  private frustumSize = 24; // Zoom level

  constructor(
    container: HTMLElement,
    snowManager: SnowManager,
    callbacks: WorldCallbacks
  ) {
    this.snowManager = snowManager;
    this.callbacks = callbacks;

    // 1. Scene
    this.scene = new THREE.Scene();
    const skyColor = 0xb0cce8; // Soft cozy winter pastel sky
    this.scene.background = new THREE.Color(skyColor);
    this.scene.fog = new THREE.Fog(skyColor, 40, 110);

    // 2. Camera: True Isometric Orthographic
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.OrthographicCamera(
      (-this.frustumSize * aspect) / 2,
      (this.frustumSize * aspect) / 2,
      this.frustumSize / 2,
      -this.frustumSize / 2,
      1,
      300
    );
    this.camera.position.set(45, 45, 45);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer
    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    this.renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. Studio Environment (Skipped in headless CPU WebGL to eliminate glReadPixels stall)
    if (!isHeadless) {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    }

    // 5. Lighting
    this.setupLighting(isHeadless);

    // 6. Ground & Town
    this.setupGround();
    this.setupBuildings();
    this.setupTrees();
    this.setupStreetlamps();
    this.setupSnowMelter();
    this.setupCollectibles();

    // 7. Hero Snow Plow Vehicle
    this.setupSnowPlow();

    // 8. Particle FX (Falling snow, plow spray, chimney smoke)
    this.setupParticleSystems();

    // Pre-compile shaders
    this.renderer.compile(this.scene, this.camera);
  }

  private setupLighting(isHeadless: boolean) {
    // Cool sky / warm ground hemisphere light
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x94a3b8, 0.7);
    this.scene.add(hemiLight);

    // Warm winter key sunlight
    const keyLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    keyLight.position.set(30, 45, 20);
    if (!isHeadless) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 10;
      keyLight.shadow.camera.far = 120;
      keyLight.shadow.camera.left = -30;
      keyLight.shadow.camera.right = 30;
      keyLight.shadow.camera.top = 30;
      keyLight.shadow.camera.bottom = -30;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(keyLight);

    // Soft cool rim light from opposite side
    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.6);
    rimLight.position.set(-25, 20, -25);
    this.scene.add(rimLight);
  }

  private setupGround() {
    // Ground plane with dynamic snow texture
    const groundGeo = new THREE.PlaneGeometry(
      this.snowManager.worldWidth,
      this.snowManager.worldDepth,
      1,
      1
    );
    groundGeo.rotateX(-Math.PI / 2);

    const groundMat = new THREE.MeshStandardMaterial({
      map: this.snowManager.groundTexture,
      roughness: 0.9,
      metalness: 0.05,
    });

    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.receiveShadow = true;
    groundMesh.position.y = 0;
    this.scene.add(groundMesh);

    // 1. Rocky stone mountain embankment base (distinct dark slate granite, NOT white!)
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Deep slate granite stone
      roughness: 0.9,
      metalness: 0.1,
    });

    const bankW = this.snowManager.worldWidth + 8;
    const bankD = this.snowManager.worldDepth + 8;
    const outerGeo = new THREE.BoxGeometry(bankW, 2.5, 4);

    const cliffNorth = new THREE.Mesh(outerGeo, rockMat);
    cliffNorth.position.set(0, 0.8, -bankD / 2 + 2);
    cliffNorth.castShadow = true;
    cliffNorth.receiveShadow = true;
    this.scene.add(cliffNorth);

    const cliffSouth = new THREE.Mesh(outerGeo, rockMat);
    cliffSouth.position.set(0, 0.8, bankD / 2 - 2);
    cliffSouth.castShadow = true;
    cliffSouth.receiveShadow = true;
    this.scene.add(cliffSouth);

    const sideGeo = new THREE.BoxGeometry(4, 2.5, bankD);
    const cliffWest = new THREE.Mesh(sideGeo, rockMat);
    cliffWest.position.set(-bankW / 2 + 2, 0.8, 0);
    cliffWest.castShadow = true;
    cliffWest.receiveShadow = true;
    this.scene.add(cliffWest);

    const cliffEast = new THREE.Mesh(sideGeo, rockMat);
    cliffEast.position.set(bankW / 2 - 2, 0.8, 0);
    cliffEast.castShadow = true;
    cliffEast.receiveShadow = true;
    this.scene.add(cliffEast);

    // 2. Heavy Alpine Wooden Guardrail Fences & Reflective Snow Poles along all 4 perimeter edges
    this.setupPerimeterFencesAndSnowPoles();
  }

  /**
   * Erects authentic wooden timber guardrails and bright orange/white snow boundary poles.
   */
  private setupPerimeterFencesAndSnowPoles() {
    const fencesGroup = new THREE.Group();

    // Wood fence materials
    const timberMat = new THREE.MeshStandardMaterial({
      color: 0x78350f, // Warm rustic cedar timber
      roughness: 0.85,
    });
    const postGeo = new THREE.CylinderGeometry(0.12, 0.14, 1.4, 8);
    const railXGeo = new THREE.CylinderGeometry(0.08, 0.08, 60, 8);
    railXGeo.rotateZ(Math.PI / 2);
    const railZGeo = new THREE.CylinderGeometry(0.08, 0.08, 60, 8);
    railZGeo.rotateX(Math.PI / 2);

    // Snow Pole materials (iconic winter highway red/orange striped poles with reflective caps)
    const poleOrangeMat = new THREE.MeshStandardMaterial({
      color: 0xea580c, // Safety blaze orange
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0xc2410c,
      emissiveIntensity: 0.2,
    });
    const poleWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
    });
    const reflectorMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 0.9,
    });

    const poleBaseGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6);
    const poleStripeGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 6);
    const reflectorCapGeo = new THREE.SphereGeometry(0.09, 6, 6);

    const createSnowPole = (x: number, z: number) => {
      const pole = new THREE.Group();
      pole.position.set(x, 0, z);

      // Segment 1 (Orange base)
      const b1 = new THREE.Mesh(poleBaseGeo, poleOrangeMat);
      b1.position.y = 0.3;
      pole.add(b1);

      // Segment 2 (White stripe)
      const b2 = new THREE.Mesh(poleStripeGeo, poleWhiteMat);
      b2.position.y = 0.8;
      pole.add(b2);

      // Segment 3 (Orange upper)
      const b3 = new THREE.Mesh(poleStripeGeo, poleOrangeMat);
      b3.position.y = 1.2;
      pole.add(b3);

      // Segment 4 (White stripe)
      const b4 = new THREE.Mesh(poleStripeGeo, poleWhiteMat);
      b4.position.y = 1.6;
      pole.add(b4);

      // Top glowing reflector cap
      const cap = new THREE.Mesh(reflectorCapGeo, reflectorMat);
      cap.position.y = 1.85;
      pole.add(cap);

      return pole;
    };

    // Edge boundaries: X = ±30, Z = ±30
    const edge = 29.8;

    // Horizontal rails
    const northRailTop = new THREE.Mesh(railXGeo, timberMat);
    northRailTop.position.set(0, 0.95, -edge);
    fencesGroup.add(northRailTop);

    const northRailBottom = new THREE.Mesh(railXGeo, timberMat);
    northRailBottom.position.set(0, 0.5, -edge);
    fencesGroup.add(northRailBottom);

    const southRailTop = new THREE.Mesh(railXGeo, timberMat);
    southRailTop.position.set(0, 0.95, edge);
    fencesGroup.add(southRailTop);

    const southRailBottom = new THREE.Mesh(railXGeo, timberMat);
    southRailBottom.position.set(0, 0.5, edge);
    fencesGroup.add(southRailBottom);

    const westRailTop = new THREE.Mesh(railZGeo, timberMat);
    westRailTop.position.set(-edge, 0.95, 0);
    fencesGroup.add(westRailTop);

    const westRailBottom = new THREE.Mesh(railZGeo, timberMat);
    westRailBottom.position.set(-edge, 0.5, 0);
    fencesGroup.add(westRailBottom);

    const eastRailTop = new THREE.Mesh(railZGeo, timberMat);
    eastRailTop.position.set(edge, 0.95, 0);
    fencesGroup.add(eastRailTop);

    const eastRailBottom = new THREE.Mesh(railZGeo, timberMat);
    eastRailBottom.position.set(edge, 0.5, 0);
    fencesGroup.add(eastRailBottom);

    // Place vertical fence posts & snow poles every 3.5m along borders
    for (let pos = -edge; pos <= edge; pos += 3.5) {
      // North & South
      const postN = new THREE.Mesh(postGeo, timberMat);
      postN.position.set(pos, 0.7, -edge);
      fencesGroup.add(postN);

      const postS = new THREE.Mesh(postGeo, timberMat);
      postS.position.set(pos, 0.7, edge);
      fencesGroup.add(postS);

      // West & East
      const postW = new THREE.Mesh(postGeo, timberMat);
      postW.position.set(-edge, 0.7, pos);
      fencesGroup.add(postW);

      const postE = new THREE.Mesh(postGeo, timberMat);
      postE.position.set(edge, 0.7, pos);
      fencesGroup.add(postE);

      // Alternate snow marker poles
      if (Math.abs(pos) % 7 < 3.6) {
        fencesGroup.add(createSnowPole(pos, -edge + 0.3));
        fencesGroup.add(createSnowPole(pos, edge - 0.3));
        fencesGroup.add(createSnowPole(-edge + 0.3, pos));
        fencesGroup.add(createSnowPole(edge - 0.3, pos));
      }
    }

    this.scene.add(fencesGroup);
  }

  /**
   * Hero Snow Plow: Composite 10-part procedural model.
   */
  private setupSnowPlow() {
    this.plowGroup = new THREE.Group();

    // 1. Lower chassis / undercarriage (matte dark gray)
    const chassisGeo = new THREE.BoxGeometry(2.4, 0.45, 1.4);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.5,
    });
    this.vehicleChassisMat = chassisMat;
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.5;
    chassis.castShadow = true;
    this.plowGroup.add(chassis);

    // 2. Tractor Cab (vibrant safety orange/yellow enamel)
    const cabGeo = new THREE.BoxGeometry(1.6, 1.1, 1.3);
    const cabMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Warm highway amber
      roughness: 0.35,
      metalness: 0.15,
    });
    this.vehicleCabMat = cabMat;
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(-0.15, 1.25, 0);
    cab.castShadow = true;
    this.plowGroup.add(cab);

    // 3. Cab Glass Windows (semi-reflective dark cyan glass)
    const glassGeo = new THREE.BoxGeometry(1.2, 0.55, 1.34);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.7,
      thickness: 0.5,
      transparent: true,
      opacity: 0.85,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(-0.05, 1.35, 0);
    this.plowGroup.add(glass);

    // 4. Engine Hood (front taper)
    const hoodGeo = new THREE.BoxGeometry(0.8, 0.65, 1.15);
    const hood = new THREE.Mesh(hoodGeo, cabMat);
    hood.position.set(0.95, 0.85, 0);
    hood.castShadow = true;
    this.plowGroup.add(hood);

    // 5. Front Snow Plow Blade (curved beveled heavy blade)
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.lineTo(0.3, 0.9);
    bladeShape.lineTo(0.05, 0.9);
    bladeShape.lineTo(-0.2, 0.1);
    bladeShape.closePath();

    const bladeExtrude = new THREE.ExtrudeGeometry(bladeShape, {
      depth: 2.2, // standard width
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.05,
      bevelThickness: 0.05,
    });
    bladeExtrude.center();

    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Silver steel with bright edge
      roughness: 0.3,
      metalness: 0.7,
    });
    this.vehicleBladeMat = bladeMat;
    this.plowBladeMesh = new THREE.Mesh(bladeExtrude, bladeMat);
    this.plowBladeMesh.rotation.y = Math.PI / 2;
    this.plowBladeMesh.position.set(1.65, 0.45, 0);
    this.plowBladeMesh.castShadow = true;
    this.plowGroup.add(this.plowBladeMesh);

    // Blade hydraulic arms
    const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.75);
    armGeo.rotateZ(Math.PI / 2);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
    const armLeft = new THREE.Mesh(armGeo, armMat);
    armLeft.position.set(1.25, 0.5, 0.5);
    this.plowGroup.add(armLeft);

    const armRight = new THREE.Mesh(armGeo, armMat);
    armRight.position.set(1.25, 0.5, -0.5);
    this.plowGroup.add(armRight);

    // 6. Wheels (4 chunky winter tires)
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.32, 16);
    wheelGeo.rotateX(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
      metalness: 0.1,
    });

    const hubGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.34, 8);
    hubGeo.rotateX(Math.PI / 2);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });

    const wheelPositions = [
      [0.75, 0.38, 0.75],
      [0.75, 0.38, -0.75],
      [-0.75, 0.38, 0.75],
      [-0.75, 0.38, -0.75],
    ];

    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheelMesh = new THREE.Mesh(wheelGeo, wheelMat);
      wheelMesh.position.set(wx, wy, wz);
      wheelMesh.castShadow = true;

      const hubMesh = new THREE.Mesh(hubGeo, hubMat);
      wheelMesh.add(hubMesh);

      this.wheels.push(wheelMesh);
      this.plowGroup.add(wheelMesh);
    });

    // 7. Flashing Amber Rooftop Safety Beacon
    const beaconBaseGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.12, 8);
    const beaconBaseMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
    const beaconBase = new THREE.Mesh(beaconBaseGeo, beaconBaseMat);
    beaconBase.position.set(-0.15, 1.85, 0);
    this.plowGroup.add(beaconBase);

    const beaconGeo = new THREE.SphereGeometry(0.14, 10, 8);
    const beaconDomeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xfbbf24,
      emissiveIntensity: 1.2,
      roughness: 0.2,
    });
    this.beaconMesh = new THREE.Mesh(beaconGeo, beaconDomeMat);
    this.beaconMesh.position.set(-0.15, 1.95, 0);
    this.plowGroup.add(this.beaconMesh);

    this.beaconLight = new THREE.PointLight(0xf59e0b, 1.5, 6);
    this.beaconLight.position.set(-0.15, 2.1, 0);
    this.plowGroup.add(this.beaconLight);

    // 8. Chrome Exhaust Stack with Smoke
    this.exhaustStack = new THREE.Group();
    const exhaustGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8);
    const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
    const pipe = new THREE.Mesh(exhaustGeo, exhaustMat);
    pipe.position.set(0.4, 1.45, 0.55);
    this.exhaustStack.add(pipe);
    this.plowGroup.add(this.exhaustStack);

    // 9. Forward Headlights with Warm Light Cones
    const lightSpot = new THREE.SpotLight(0xfef08a, 2.0, 14, Math.PI / 4, 0.4);
    lightSpot.position.set(1.4, 0.9, 0);
    lightSpot.target.position.set(6, 0, 0);
    this.plowGroup.add(lightSpot);
    this.plowGroup.add(lightSpot.target);

    // 10. Contact Shadow Disc beneath plow
    const shadowGeo = new THREE.CircleGeometry(1.6, 16);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
    shadowDisc.position.y = 0.02;
    this.plowGroup.add(shadowDisc);

    this.scene.add(this.plowGroup);
  }

  /**
   * Procedural Chalets & Ski Cabins with snowy roofs, glowing windows, and chimneys.
   */
  private setupBuildings() {
    this.buildingsGroup = new THREE.Group();

    const cabinConfigs = [
      { x: 12, z: 12, w: 7, d: 6, rot: 0, color: 0x78350f },
      { x: -12, z: 12, w: 7, d: 6, rot: Math.PI / 2, color: 0x854d0e },
      { x: 12, z: -12, w: 7, d: 6, rot: -Math.PI / 2, color: 0x7c2d12 },
      { x: -12, z: -12, w: 7, d: 6, rot: Math.PI, color: 0x78350f },
      { x: 26, z: 26, w: 6, d: 6, rot: Math.PI / 4, color: 0x9a3412 },
      { x: -26, z: 26, w: 6, d: 6, rot: -Math.PI / 4, color: 0x78350f },
      { x: 26, z: -26, w: 6, d: 6, rot: -Math.PI / 4, color: 0x854d0e },
      { x: -26, z: -26, w: 6, d: 6, rot: Math.PI / 4, color: 0x7c2d12 },
    ];

    cabinConfigs.forEach((cfg) => {
      const houseGroup = new THREE.Group();
      houseGroup.position.set(cfg.x, 0, cfg.z);
      houseGroup.rotation.y = cfg.rot;

      // Base log cabin walls
      const wallH = 3.2;
      const wallGeo = new THREE.BoxGeometry(cfg.w, wallH, cfg.d);
      const wallMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.85,
        metalness: 0.05,
      });
      const walls = new THREE.Mesh(wallGeo, wallMat);
      walls.position.y = wallH / 2;
      walls.castShadow = true;
      walls.receiveShadow = true;
      houseGroup.add(walls);

      // Pitched A-Frame Snow Roof (Triangular Prism with thick snow cap)
      const roofH = 2.4;
      const roofOverhang = 0.6;
      const roofShape = new THREE.Shape();
      roofShape.moveTo(-cfg.w / 2 - roofOverhang, 0);
      roofShape.lineTo(0, roofH);
      roofShape.lineTo(cfg.w / 2 + roofOverhang, 0);
      roofShape.closePath();

      const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
        depth: cfg.d + roofOverhang * 2,
        bevelEnabled: false,
      });
      roofGeo.center();

      const snowRoofMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc, // Pure snowy roof
        roughness: 0.95,
        metalness: 0.0,
      });
      const roof = new THREE.Mesh(roofGeo, snowRoofMat);
      roof.position.set(0, wallH + roofH / 2, 0);
      roof.castShadow = true;
      roof.receiveShadow = true;
      houseGroup.add(roof);

      // Stone Chimney
      const chimneyGeo = new THREE.BoxGeometry(0.7, 3.2, 0.7);
      const chimneyMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.9,
      });
      const chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
      chimney.position.set(cfg.w / 3, wallH + 1.2, cfg.d / 4);
      chimney.castShadow = true;
      houseGroup.add(chimney);

      // Warm Glowing Windows
      const winGeo = new THREE.PlaneGeometry(0.9, 0.9);
      const winMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.9,
        roughness: 0.2,
      });

      const winFront1 = new THREE.Mesh(winGeo, winMat);
      winFront1.position.set(-cfg.w / 4, 1.8, cfg.d / 2 + 0.02);
      houseGroup.add(winFront1);

      const winFront2 = new THREE.Mesh(winGeo, winMat);
      winFront2.position.set(cfg.w / 4, 1.8, cfg.d / 2 + 0.02);
      houseGroup.add(winFront2);

      // Cozy front door with lantern
      const doorGeo = new THREE.PlaneGeometry(1.0, 1.8);
      const doorMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
      const door = new THREE.Mesh(doorGeo, doorMat);
      door.position.set(0, 0.9, cfg.d / 2 + 0.02);
      houseGroup.add(door);

      // Small porch light
      const porchLight = new THREE.PointLight(0xfbbf24, 0.8, 6);
      porchLight.position.set(0, 2.1, cfg.d / 2 + 0.4);
      houseGroup.add(porchLight);

      this.buildingsGroup.add(houseGroup);
    });

    // Central Town Gazebo & Festive Snowman
    const gazeboGroup = new THREE.Group();
    gazeboGroup.position.set(0, 0, 0);

    const baseGeo = new THREE.CylinderGeometry(2.0, 2.2, 0.5, 8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.8 });
    const gazeboBase = new THREE.Mesh(baseGeo, baseMat);
    gazeboBase.position.y = 0.25;
    gazeboGroup.add(gazeboBase);

    // Cute Giant Snowman in center of gazebo
    const snowmanGroup = this.createSnowmanMesh(1.3);
    snowmanGroup.position.set(0, 0.5, 0);
    gazeboGroup.add(snowmanGroup);

    this.buildingsGroup.add(gazeboGroup);
    this.scene.add(this.buildingsGroup);
  }

  private createSnowmanMesh(scale: number = 1.0): THREE.Group {
    const sm = new THREE.Group();
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });

    // 3 snowball body
    const bottom = new THREE.Mesh(new THREE.SphereGeometry(0.7 * scale, 12, 10), snowMat);
    bottom.position.y = 0.7 * scale;
    bottom.castShadow = true;
    sm.add(bottom);

    const mid = new THREE.Mesh(new THREE.SphereGeometry(0.5 * scale, 12, 10), snowMat);
    mid.position.y = 1.6 * scale;
    mid.castShadow = true;
    sm.add(mid);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35 * scale, 12, 10), snowMat);
    head.position.y = 2.3 * scale;
    head.castShadow = true;
    sm.add(head);

    // Carrot nose
    const carrotGeo = new THREE.ConeGeometry(0.08 * scale, 0.3 * scale, 6);
    carrotGeo.rotateX(Math.PI / 2);
    const carrotMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.6 });
    const carrot = new THREE.Mesh(carrotGeo, carrotMat);
    carrot.position.set(0, 2.3 * scale, 0.4 * scale);
    sm.add(carrot);

    // Cozy Red Scarf
    const scarfGeo = new THREE.TorusGeometry(0.35 * scale, 0.08 * scale, 6, 12);
    scarfGeo.rotateX(Math.PI / 2);
    const scarfMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.7 });
    const scarf = new THREE.Mesh(scarfGeo, scarfMat);
    scarf.position.set(0, 2.0 * scale, 0);
    sm.add(scarf);

    // Black Top Hat
    const hatBrim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4 * scale, 0.4 * scale, 0.04 * scale, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
    );
    hatBrim.position.y = 2.65 * scale;
    sm.add(hatBrim);

    const hatTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25 * scale, 0.25 * scale, 0.35 * scale, 8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
    );
    hatTop.position.y = 2.85 * scale;
    sm.add(hatTop);

    return sm;
  }

  /**
   * Snow-Dusted Pine Trees: 3-tiered conical needle foliage.
   */
  private setupTrees() {
    this.treesGroup = new THREE.Group();

    const treePositions = [
      // Cluster along perimeter and avenues
      [8, 6], [-8, 6], [8, -6], [-8, -6],
      [18, 10], [-18, 10], [18, -10], [-18, -10],
      [6, 18], [-6, 18], [6, -18], [-6, -18],
      [28, 14], [-28, 14], [28, -14], [-28, -14],
      [14, 28], [-14, 28], [-14, -28], [14, -28],
      [4, 25], [-4, 25], [4, -25], [-4, -25],
    ];

    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.2, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 });

    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x1e3a2f, roughness: 0.8 });
    const snowCapMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.95 });

    treePositions.forEach(([tx, tz]) => {
      const tree = new THREE.Group();
      const scale = 0.8 + Math.random() * 0.4;
      tree.position.set(tx, 0, tz);
      tree.scale.set(scale, scale, scale);

      // Trunk
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.6;
      trunk.castShadow = true;
      tree.add(trunk);

      // 3 Conical foliage tiers with snow caps
      const tiers = [
        { r: 1.4, h: 1.4, y: 1.6 },
        { r: 1.1, h: 1.3, y: 2.5 },
        { r: 0.7, h: 1.2, y: 3.3 },
      ];

      tiers.forEach((t) => {
        const coneGeo = new THREE.ConeGeometry(t.r, t.h, 7);
        const cone = new THREE.Mesh(coneGeo, foliageMat);
        cone.position.y = t.y;
        cone.castShadow = true;
        cone.receiveShadow = true;
        tree.add(cone);

        // Snow layer on top of tier
        const capGeo = new THREE.ConeGeometry(t.r * 0.9, t.h * 0.4, 7);
        const cap = new THREE.Mesh(capGeo, snowCapMat);
        cap.position.y = t.y + t.h * 0.3;
        tree.add(cap);
      });

      this.treesGroup.add(tree);
    });

    this.scene.add(this.treesGroup);
  }

  /**
   * Warm glowing street lamps placed at town intersections.
   */
  private setupStreetlamps() {
    this.streetlampsGroup = new THREE.Group();

    const lampPositions = [
      [7, 7], [-7, 7], [7, -7], [-7, -7],
      [17, 7], [-17, 7], [17, -7], [-17, -7],
      [7, 17], [-7, 17], [7, -17], [-7, -17],
    ];

    const poleGeo = new THREE.CylinderGeometry(0.06, 0.08, 3.2, 8);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });

    const lanternGeo = new THREE.BoxGeometry(0.4, 0.5, 0.4);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfbbf24,
      emissiveIntensity: 1.5,
    });

    lampPositions.forEach(([lx, lz]) => {
      const lamp = new THREE.Group();
      lamp.position.set(lx, 0, lz);

      const pole = new THREE.Mesh(poleGeo, metalMat);
      pole.position.y = 1.6;
      pole.castShadow = true;
      lamp.add(pole);

      const lantern = new THREE.Mesh(lanternGeo, glassMat);
      lantern.position.y = 3.2;
      lamp.add(lantern);

      // Warm pool of light on ground
      const light = new THREE.PointLight(0xfbbf24, 1.2, 9);
      light.position.set(0, 3.1, 0);
      lamp.add(light);

      this.streetlampsGroup.add(lamp);
    });

    this.scene.add(this.streetlampsGroup);
  }

  /**
   * Snow Melter Depot Silo where snow can be dumped for bonus coins!
   */
  private setupSnowMelter() {
    this.melterDepotGroup = new THREE.Group();
    this.melterDepotGroup.position.set(22, 0, 0);

    // Industrial heated hopper tank
    const siloGeo = new THREE.CylinderGeometry(2.2, 2.4, 3.5, 12);
    const siloMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Cool cyan industrial vat
      roughness: 0.4,
      metalness: 0.6,
    });
    const silo = new THREE.Mesh(siloGeo, siloMat);
    silo.position.y = 1.75;
    silo.castShadow = true;
    this.melterDepotGroup.add(silo);

    // Glowing heating core grid on top
    const grillGeo = new THREE.CylinderGeometry(2.1, 2.1, 0.2, 12);
    const grillMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xf97316,
      emissiveIntensity: 1.8,
    });
    const grill = new THREE.Mesh(grillGeo, grillMat);
    grill.position.y = 3.55;
    this.melterDepotGroup.add(grill);

    // "HOT MELTER DEPOT" sign post
    const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 4.5, 8);
    const signPost = new THREE.Mesh(postGeo, siloMat);
    signPost.position.set(-2.8, 2.25, 1.5);
    this.melterDepotGroup.add(signPost);

    const signBoardGeo = new THREE.BoxGeometry(2.0, 0.8, 0.15);
    const signBoardMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xf97316,
      emissiveIntensity: 0.4,
    });
    const sign = new THREE.Mesh(signBoardGeo, signBoardMat);
    sign.position.set(-2.8, 4.2, 1.5);
    this.melterDepotGroup.add(sign);

    // Melter beacon light
    const meltLight = new THREE.PointLight(0xf97316, 2.0, 8);
    meltLight.position.set(0, 4.0, 0);
    this.melterDepotGroup.add(meltLight);

    this.scene.add(this.melterDepotGroup);
  }

  /**
   * Buried items in snowdrifts: coins, hot cocoa mugs, lost mittens, golden snowflakes.
   */
  private setupCollectibles() {
    this.collectiblesGroup = new THREE.Group();
    this.scene.add(this.collectiblesGroup);

    this.collectibles = [
      { id: 'c1', type: 'coin', x: 0, z: 8, collected: false, value: 25, name: 'Frost Coin' },
      { id: 'c2', type: 'coin', x: -8, z: 0, collected: false, value: 25, name: 'Frost Coin' },
      { id: 'c3', type: 'coin', x: 14, z: -4, collected: false, value: 25, name: 'Frost Coin' },
      { id: 'c4', type: 'coin', x: -14, z: 16, collected: false, value: 25, name: 'Frost Coin' },
      { id: 'cocoa1', type: 'cocoa', x: 4, z: -14, collected: false, value: 50, name: 'Hot Cocoa Mug' },
      { id: 'cocoa2', type: 'cocoa', x: -18, z: -8, collected: false, value: 50, name: 'Hot Cocoa Mug' },
      { id: 'mitten1', type: 'mitten', x: 12, z: 20, collected: false, value: 75, name: 'Warm Red Mitten' },
      { id: 'mitten2', type: 'mitten', x: -20, z: 4, collected: false, value: 75, name: 'Warm Red Mitten' },
      { id: 'star1', type: 'snowflake', x: 22, z: -16, collected: false, value: 100, name: 'Golden Snowflake' },
    ];

    this.collectibles.forEach((item) => {
      const itemGroup = new THREE.Group();
      itemGroup.position.set(item.x, 0.4, item.z);

      if (item.type === 'coin') {
        const coinGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 12);
        coinGeo.rotateX(Math.PI / 2);
        const coinMat = new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          metalness: 0.85,
          roughness: 0.2,
          emissive: 0xd97706,
          emissiveIntensity: 0.3,
        });
        const coin = new THREE.Mesh(coinGeo, coinMat);
        itemGroup.add(coin);
      } else if (item.type === 'cocoa') {
        // Red Mug with white marshmallow top
        const mugGeo = new THREE.CylinderGeometry(0.28, 0.22, 0.45, 10);
        const mugMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });
        const mug = new THREE.Mesh(mugGeo, mugMat);
        itemGroup.add(mug);

        const creamGeo = new THREE.SphereGeometry(0.22, 8, 8);
        const creamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
        const cream = new THREE.Mesh(creamGeo, creamMat);
        cream.position.y = 0.22;
        itemGroup.add(cream);
      } else if (item.type === 'mitten') {
        const mittenGeo = new THREE.CapsuleGeometry(0.22, 0.35, 4, 8);
        const mittenMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.8 });
        const mitten = new THREE.Mesh(mittenGeo, mittenMat);
        mitten.rotation.z = Math.PI / 4;
        itemGroup.add(mitten);
      } else if (item.type === 'snowflake') {
        const starGeo = new THREE.OctahedronGeometry(0.4, 0);
        const starMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x38bdf8,
          emissiveIntensity: 0.8,
          roughness: 0.1,
          metalness: 0.5,
        });
        const star = new THREE.Mesh(starGeo, starMat);
        itemGroup.add(star);
      }

      this.collectibleMeshes.set(item.id, itemGroup);
      this.collectiblesGroup.add(itemGroup);
    });
  }

  /**
   * Particle Systems: Falling snow, dynamic snow spray from plow blade, and chimney smoke.
   */
  private setupParticleSystems() {
    // 1. Gentle falling snowflakes
    const snowCount = 800;
    const snowGeo = new THREE.BufferGeometry();
    const snowPos = new Float32Array(snowCount * 3);

    for (let i = 0; i < snowCount; i++) {
      snowPos[i * 3] = (Math.random() - 0.5) * 80;
      snowPos[i * 3 + 1] = Math.random() * 25 + 0.5;
      snowPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));

    const snowMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.25,
      transparent: true,
      opacity: 0.75,
    });
    this.fallingSnowSystem = new THREE.Points(snowGeo, snowMat);
    this.scene.add(this.fallingSnowSystem);

    // 2. High-energy snow spray bursting from plow blade
    this.plowSprayPositions = new Float32Array(this.maxPlowSpray * 3);
    this.plowSprayVelocities = new Float32Array(this.maxPlowSpray * 3);
    this.plowSprayLifetimes = new Float32Array(this.maxPlowSpray);

    this.plowSprayGeometry = new THREE.BufferGeometry();
    this.plowSprayGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.plowSprayPositions, 3)
    );

    const sprayMat = new THREE.PointsMaterial({
      color: 0xf1f5f9,
      size: 0.32,
      transparent: true,
      opacity: 0.85,
    });
    this.plowSpraySystem = new THREE.Points(this.plowSprayGeometry, sprayMat);
    this.scene.add(this.plowSpraySystem);

    // 3. Chimney Fireplace Smoke
    const smokeCount = 120;
    this.chimneySmokePositions = new Float32Array(smokeCount * 3);
    for (let i = 0; i < smokeCount; i++) {
      this.chimneySmokePositions[i * 3] = 12 + (Math.random() - 0.5) * 0.4;
      this.chimneySmokePositions[i * 3 + 1] = 4.5 + Math.random() * 5.0;
      this.chimneySmokePositions[i * 3 + 2] = 12 + (Math.random() - 0.5) * 0.4;
    }

    const smokeGeo = new THREE.BufferGeometry();
    smokeGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(this.chimneySmokePositions, 3)
    );

    const smokeMat = new THREE.PointsMaterial({
      color: 0xd1d5db,
      size: 0.45,
      transparent: true,
      opacity: 0.35,
    });
    this.chimneySmokeSystem = new THREE.Points(smokeGeo, smokeMat);
    this.scene.add(this.chimneySmokeSystem);
  }

  /**
   * Emit high-velocity snow powder particles when plowing snow.
   */
  public emitPlowSnowParticles(
    originX: number,
    originZ: number,
    vehicleAngle: number,
    count: number = 8
  ) {
    let spawned = 0;
    // Perpendicular vector for side plume
    const sideX = -Math.sin(vehicleAngle);
    const sideZ = Math.cos(vehicleAngle);

    for (let i = 0; i < this.maxPlowSpray && spawned < count; i++) {
      if (this.plowSprayLifetimes[i] <= 0) {
        this.plowSprayLifetimes[i] = 0.4 + Math.random() * 0.3;

        // Position at blade edge
        const sideSign = Math.random() > 0.4 ? 1 : -1;
        this.plowSprayPositions[i * 3] = originX + sideX * 1.0 * sideSign;
        this.plowSprayPositions[i * 3 + 1] = 0.4 + Math.random() * 0.3;
        this.plowSprayPositions[i * 3 + 2] = originZ + sideZ * 1.0 * sideSign;

        // Shoot upward and outward
        this.plowSprayVelocities[i * 3] =
          sideX * sideSign * (3 + Math.random() * 4) + (Math.random() - 0.5) * 1.5;
        this.plowSprayVelocities[i * 3 + 1] = 2.5 + Math.random() * 3.5;
        this.plowSprayVelocities[i * 3 + 2] =
          sideZ * sideSign * (3 + Math.random() * 4) + (Math.random() - 0.5) * 1.5;

        spawned++;
      }
    }
  }

  /**
   * Updates upgrades visuals (wider blade, turbo pipes, etc.).
   */
  public updateUpgradeVisuals(upgrades: PlayerUpgrades) {
    const mods = getUpgradeModifiers(upgrades);

    // Scale plow blade width
    const baseWidth = 2.2;
    const widthRatio = mods.bladeWidth / baseWidth;
    this.plowBladeMesh.scale.set(1.0, 1.0, widthRatio);

    // If heated blade, tint blade edge orange/warm
    const bladeMat = this.plowBladeMesh.material as THREE.MeshStandardMaterial;
    if (upgrades.heater > 1) {
      bladeMat.emissive = new THREE.Color(0xf97316);
      bladeMat.emissiveIntensity = 0.3 * (upgrades.heater - 1);
    } else {
      const skin = VEHICLE_SKINS[this.activeSkinId] || VEHICLE_SKINS.default;
      if (skin.emissive) {
        bladeMat.emissive = new THREE.Color(skin.emissive);
        bladeMat.emissiveIntensity = 0.25;
      } else {
        bladeMat.emissive = new THREE.Color(0x000000);
        bladeMat.emissiveIntensity = 0;
      }
    }
  }

  /**
   * Applies custom cosmetic vehicle skin (Gold, Santa, Cyber, etc.).
   */
  public applyVehicleSkin(skinId: VehicleSkinId) {
    this.activeSkinId = skinId;
    const skin = VEHICLE_SKINS[skinId] || VEHICLE_SKINS.default;

    if (this.vehicleCabMat) {
      this.vehicleCabMat.color.setHex(skin.cabColor);
      this.vehicleCabMat.metalness = skin.metalness;
      this.vehicleCabMat.roughness = skin.roughness;
      if (skin.emissive) {
        this.vehicleCabMat.emissive.setHex(skin.emissive);
        this.vehicleCabMat.emissiveIntensity = 0.35;
      } else {
        this.vehicleCabMat.emissive.setHex(0x000000);
        this.vehicleCabMat.emissiveIntensity = 0;
      }
    }

    if (this.vehicleBladeMat) {
      this.vehicleBladeMat.color.setHex(skin.bladeColor);
      this.vehicleBladeMat.metalness = Math.max(skin.metalness, 0.6);
      this.vehicleBladeMat.roughness = skin.roughness;
    }

    if (this.vehicleChassisMat) {
      this.vehicleChassisMat.color.setHex(skin.accentColor);
    }

    if (this.beaconLight) {
      this.beaconLight.color.setHex(skin.beaconColor);
    }

    if (this.beaconMesh) {
      const m = this.beaconMesh.material as THREE.MeshStandardMaterial;
      if (m) {
        m.color.setHex(skin.beaconColor);
        m.emissive.setHex(skin.beaconColor);
      }
    }
  }

  /**
   * Main per-frame simulation update (60 FPS decoupled from React).
   */
  public update(
    vehicle: VehicleState,
    dt: number,
    isTitleMode: boolean
  ) {
    const clampedDt = Math.min(dt, 0.05);

    // 1. Vehicle position & orientation
    if (!isTitleMode) {
      this.plowGroup.position.set(vehicle.x, 0, vehicle.z);
      // Align plow rotation to vehicle angle (angle 0 points +X, Three.js rotation.y = -angle)
      this.plowGroup.rotation.y = -vehicle.angle;

      // Wheel spin synced to speed
      const wheelSpin = (vehicle.speed / 0.38) * clampedDt;
      this.wheels.forEach((w) => {
        w.rotation.x += wheelSpin;
      });

      // Front wheels steering angle
      this.wheels[0].rotation.y = -vehicle.steer * 0.35;
      this.wheels[1].rotation.y = -vehicle.steer * 0.35;

      // Rooftop beacon rotation and pulsing
      this.beaconMesh.rotation.y += clampedDt * 8.0;
      this.beaconLight.intensity = 1.0 + Math.sin(Date.now() * 0.01) * 0.8;

      // Camera smooth follow tracking
      _vec3A.set(vehicle.x, 0, vehicle.z);
      // Exponential damping follow
      this.cameraLookTarget.lerp(_vec3A, 1 - Math.exp(-6 * clampedDt));
      _vec3B.copy(this.cameraLookTarget).add(this.cameraOffset);
      this.camera.position.lerp(_vec3B, 1 - Math.exp(-6 * clampedDt));
      this.camera.lookAt(this.cameraLookTarget);

      // Check collectibles proximity
      for (const item of this.collectibles) {
        if (!item.collected) {
          const dx = item.x - vehicle.x;
          const dz = item.z - vehicle.z;
          if (dx * dx + dz * dz < 2.5 * 2.5) {
            item.collected = true;
            const mesh = this.collectibleMeshes.get(item.id);
            if (mesh) {
              this.collectiblesGroup.remove(mesh);
            }
            this.callbacks.onCollectItem(item);
          }
        }
      }
    } else {
      // Atmospheric slow camera orbit pan in title screen
      const time = Date.now() * 0.0003;
      const radius = 28;
      const camX = Math.cos(time) * radius + 20;
      const camZ = Math.sin(time) * radius + 20;
      this.camera.position.set(camX, 32, camZ);
      this.camera.lookAt(0, 0, 0);

      // Idle beacon light
      this.beaconLight.intensity = 1.0 + Math.sin(Date.now() * 0.008) * 0.6;
    }

    // 2. Animate collectible bobbing & rotation
    this.collectibleMeshes.forEach((mesh) => {
      mesh.rotation.y += clampedDt * 1.8;
      mesh.position.y = 0.5 + Math.sin(Date.now() * 0.004) * 0.12;
    });

    // 3. Animate falling snowflakes
    const snowPositions = this.fallingSnowSystem.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < snowPositions.length / 3; i++) {
      snowPositions[i * 3 + 1] -= clampedDt * 2.5; // drift down
      snowPositions[i * 3] += Math.sin(Date.now() * 0.001 + i) * clampedDt * 0.4;
      if (snowPositions[i * 3 + 1] < 0.2) {
        snowPositions[i * 3 + 1] = 25.0; // wrap to top
      }
    }
    this.fallingSnowSystem.geometry.attributes.position.needsUpdate = true;

    // 4. Animate snow spray particles
    let activeSprayCount = 0;
    for (let i = 0; i < this.maxPlowSpray; i++) {
      if (this.plowSprayLifetimes[i] > 0) {
        this.plowSprayLifetimes[i] -= clampedDt;

        // Apply velocity & gravity
        this.plowSprayPositions[i * 3] += this.plowSprayVelocities[i * 3] * clampedDt;
        this.plowSprayPositions[i * 3 + 1] += this.plowSprayVelocities[i * 3 + 1] * clampedDt;
        this.plowSprayPositions[i * 3 + 2] += this.plowSprayVelocities[i * 3 + 2] * clampedDt;

        this.plowSprayVelocities[i * 3 + 1] -= 9.8 * clampedDt; // Gravity

        // Ground bounce
        if (this.plowSprayPositions[i * 3 + 1] < 0.1) {
          this.plowSprayPositions[i * 3 + 1] = 0.1;
          this.plowSprayVelocities[i * 3 + 1] = 0;
        }

        activeSprayCount++;
      } else {
        // Move dormant particles under ground
        this.plowSprayPositions[i * 3 + 1] = -10;
      }
    }
    if (activeSprayCount > 0) {
      this.plowSprayGeometry.attributes.position.needsUpdate = true;
    }

    // 5. Animate chimney smoke curls
    for (let i = 0; i < this.chimneySmokePositions.length / 3; i++) {
      this.chimneySmokePositions[i * 3 + 1] += clampedDt * 1.5;
      this.chimneySmokePositions[i * 3] += Math.sin(Date.now() * 0.002 + i) * clampedDt * 0.3;
      if (this.chimneySmokePositions[i * 3 + 1] > 10.0) {
        this.chimneySmokePositions[i * 3 + 1] = 4.5;
        this.chimneySmokePositions[i * 3] = 12 + (Math.random() - 0.5) * 0.3;
        this.chimneySmokePositions[i * 3 + 2] = 12 + (Math.random() - 0.5) * 0.3;
      }
    }
    this.chimneySmokeSystem.geometry.attributes.position.needsUpdate = true;

    // 6. Render final pass
    this.renderer.render(this.scene, this.camera);
  }

  public resize(width: number, height: number) {
    const aspect = width / height;
    this.camera.left = (-this.frustumSize * aspect) / 2;
    this.camera.right = (this.frustumSize * aspect) / 2;
    this.camera.top = this.frustumSize / 2;
    this.camera.bottom = -this.frustumSize / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose() {
    this.renderer.dispose();
  }
}
