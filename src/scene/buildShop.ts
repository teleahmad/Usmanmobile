import * as THREE from 'three';
import { SHOP_CONFIG, SHOP_IMAGES } from '../config/shopConfig';
import {
  createBackCabinetTexture,
  createBlisterPackTexture,
  createCementFloorTexture,
  createContactShadowTexture,
  createEasypaisaStandTexture,
  createGreenClothTexture,
  createHangingWallPacksTexture,
  createInteriorMenuBoardTexture,
  createPlasterWallTexture,
  createPosMonitorTexture,
  createQrStandeeTexture,
  createRateListCounterTexture,
  createRetailBoxTexture,
  createReworkStationTexture,
  createRoundTinTexture,
  createSimHangCardTexture,
  createSolarCellTexture,
  createStorefrontLowerPosterTexture,
  createWhiteMarbleTexture,
  RetailIconType,
} from './materials';

export interface InteractiveShopItem extends THREE.Mesh {
  userData: {
    basePos: [number, number, number];
    hoverOffset: [number, number, number];
    itemType: string;
  };
}

export interface BuiltShop {
  shopGroup: THREE.Group;
  shutterGroup: THREE.Group;
  shutterHitTarget: THREE.Mesh;
  warmLight: THREE.PointLight;
  porchLight: THREE.PointLight;
  interactiveItems: InteractiveShopItem[];
  setShutterOpen: (openAmount: number) => void;
}

function addBox(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  castShadow = false,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCylinder(
  parent: THREE.Object3D,
  rTop: number,
  rBot: number,
  h: number,
  segs: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  castShadow = false,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, segs), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function buildShopModel(
  scene: THREE.Scene,
  initialPos: [number, number],
  maxAnisotropy: number,
  isSoftwareGl: boolean,
  onSignReady?: () => void,
): BuiltShop {
  const [SW, SD, SH] = SHOP_CONFIG.SHOP_SIZE; // 6.0m wide x 5.0m deep x 3.2m tall
  const DOOR_OPENING_W = 4.25;
  const sidePierW = (SW - DOOR_OPENING_W) / 2;

  const shopGroup = new THREE.Group();
  shopGroup.position.set(initialPos[0], 0, initialPos[1]);
  // Shop sits on east side of Main Bazar facing West (-X) directly onto the road
  // Local +Z = Front entrance (World -X), Local -X = Left wall (World -Z), Local +X = Right wall (World +Z)
  shopGroup.rotation.y = -Math.PI / 2;
  scene.add(shopGroup);

  // Soft grounding contact shadow under the shop footprint
  const contactShadowMat = new THREE.MeshBasicMaterial({
    map: createContactShadowTexture(),
    transparent: true,
    depthWrite: false,
    opacity: 0.6,
  });
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(SW + 3.6, SD + 4.4),
    contactShadowMat,
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0, 0.025, 0.7);
  shopGroup.add(contactShadow);

  // ---------------------------------------------------------------------------
  // REALISTIC PBR MATERIALS (Matched to Actual Shop Photos)
  // ---------------------------------------------------------------------------
  const outerPlasterTex = createPlasterWallTexture('#DCD6CA', maxAnisotropy);
  const wallOuterMat = new THREE.MeshStandardMaterial({
    map: outerPlasterTex,
    roughness: 0.9,
    metalness: 0.0,
  });

  const innerPlasterTex = createPlasterWallTexture('#E4E1DA', maxAnisotropy);
  const wallInnerMat = new THREE.MeshStandardMaterial({
    map: innerPlasterTex,
    roughness: 0.86,
    metalness: 0.0,
  });

  const ceilingTex = createPlasterWallTexture('#B5B2AA', maxAnisotropy);
  const ceilingMat = new THREE.MeshStandardMaterial({
    map: ceilingTex,
    roughness: 0.92,
    metalness: 0.0,
  });

  const cementFloorTex = createCementFloorTexture(maxAnisotropy);
  cementFloorTex.wrapS = THREE.RepeatWrapping;
  cementFloorTex.wrapT = THREE.RepeatWrapping;
  cementFloorTex.repeat.set(2.5, 2.5);
  const floorMat = new THREE.MeshStandardMaterial({
    map: cementFloorTex,
    roughness: 0.62,
    metalness: 0.05,
  });

  const verandahMat = new THREE.MeshStandardMaterial({
    color: 0x8f8c84,
    roughness: 0.88,
    metalness: 0.02,
  });

  const whiteMarbleTex = createWhiteMarbleTexture(maxAnisotropy);
  const whiteMarbleMat = new THREE.MeshStandardMaterial({
    map: whiteMarbleTex,
    roughness: 0.24,
    metalness: 0.08,
  });

  const darkWoodFrameMat = new THREE.MeshStandardMaterial({
    color: 0x382419,
    roughness: 0.56,
    metalness: 0.08,
  });
  const warmWoodTrimMat = new THREE.MeshStandardMaterial({
    color: 0x8d6342,
    roughness: 0.62,
    metalness: 0.05,
  });
  const blueDadoMat = new THREE.MeshStandardMaterial({
    color: 0x2d8cc8,
    roughness: 0.58,
    metalness: 0.04,
  });
  const greenClothTex = createGreenClothTexture(maxAnisotropy);
  greenClothTex.wrapS = THREE.RepeatWrapping;
  greenClothTex.wrapT = THREE.RepeatWrapping;
  greenClothTex.repeat.set(3, 2);
  const greenClothMat = new THREE.MeshStandardMaterial({
    map: greenClothTex,
    roughness: 0.92,
    metalness: 0.0,
  });

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xa4b0be,
    metalness: 0.78,
    roughness: 0.3,
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x222936,
    metalness: 0.62,
    roughness: 0.38,
  });
  const clearGlassMat = new THREE.MeshStandardMaterial({
    color: 0xdcf0ff,
    transparent: true,
    opacity: 0.22,
    roughness: 0.08,
    metalness: 0.25,
    depthWrite: false,
  });
  const tubeLightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff5e4,
    emissiveIntensity: 1.55,
    roughness: 0.2,
    toneMapped: false,
  });

  // ---------------------------------------------------------------------------
  // 1. CONCRETE VERANDAH APRON, STEP, INTERIOR CEMENT FLOOR & CEILING SLAB
  // ---------------------------------------------------------------------------
  // Outer bazaar concrete plinth & verandah slab (extends forward to z = +3.85)
  addBox(shopGroup, SW + 0.8, 0.12, SD + 1.85, verandahMat, 0, 0.06, 0.82, false);
  // Subtle front entrance step curb
  addBox(shopGroup, SW + 0.86, 0.06, 0.26, steelMat, 0, 0.05, SD / 2 + 1.72, false);
  // Smooth troweled interior cement floor
  addBox(shopGroup, SW - 0.16, 0.15, SD - 0.16, floorMat, 0, 0.085, 0, false);

  // Structural shell walls (back, left, right) + interior plaster surfaces
  addBox(shopGroup, SW, SH, 0.22, wallOuterMat, 0, SH / 2, -SD / 2, true);
  addBox(shopGroup, 0.22, SH, SD, wallOuterMat, -SW / 2, SH / 2, 0, true);
  addBox(shopGroup, 0.22, SH, SD, wallOuterMat, SW / 2, SH / 2, 0, true);

  // Clean interior plaster wall faces
  addBox(shopGroup, SW - 0.24, SH - 0.18, 0.03, wallInnerMat, 0, SH / 2, -SD / 2 + 0.12);
  addBox(shopGroup, 0.03, SH - 0.18, SD - 0.24, wallInnerMat, -SW / 2 + 0.12, SH / 2, 0);
  addBox(shopGroup, 0.03, SH - 0.18, SD - 0.24, wallInnerMat, SW / 2 - 0.12, SH / 2, 0);

  // Signature sky-blue lower wainscoting along the back wall & back corners (exact match to real photos!)
  addBox(shopGroup, SW - 0.26, 0.94, 0.035, blueDadoMat, 0, 0.62, -SD / 2 + 0.142);
  addBox(shopGroup, 0.035, 0.94, 1.35, blueDadoMat, SW / 2 - 0.142, 0.62, -SD / 2 + 0.78);
  addBox(shopGroup, 0.035, 0.94, 0.9, blueDadoMat, -SW / 2 + 0.142, 0.62, -SD / 2 + 0.56);

  // Interior ceiling slab + two bright overhead LED tube fixtures
  addBox(shopGroup, SW - 0.2, 0.08, SD - 0.1, ceilingMat, 0, SH - 0.04, 0);
  [-1.25, 1.25].forEach((tx) => {
    addBox(shopGroup, 0.1, 0.04, 1.35, darkMetalMat, tx, SH - 0.1, 0.15);
    addBox(shopGroup, 0.07, 0.03, 1.28, tubeLightMat, tx, SH - 0.125, 0.15);
  });

  // ---------------------------------------------------------------------------
  // 2. FRONT VERANDAH ARCHWAY, PILLARS, SIGNBOARD & FLOODLIGHT (Matching store.jpg!)
  // ---------------------------------------------------------------------------
  // Front wall flanking piers beside the 4.25m recessed entrance opening
  addBox(
    shopGroup,
    sidePierW,
    SH,
    0.24,
    wallOuterMat,
    -(DOOR_OPENING_W + sidePierW) / 2,
    SH / 2,
    SD / 2,
    true,
  );
  addBox(
    shopGroup,
    sidePierW,
    SH,
    0.24,
    wallOuterMat,
    (DOOR_OPENING_W + sidePierW) / 2,
    SH / 2,
    SD / 2,
    true,
  );
  addBox(shopGroup, DOOR_OPENING_W, 0.5, 0.24, wallOuterMat, 0, SH - 0.25, SD / 2, true);

  // Authentic concrete verandah overhang (chajja) & front square verandah pillars (visible in 9d61709f.jpeg!)
  addBox(shopGroup, SW + 0.2, 0.22, 1.25, wallOuterMat, 0, SH + 0.04, SD / 2 + 0.58, true);
  // Verandah side return walls & front pillars
  addBox(shopGroup, 0.34, SH, 0.34, wallOuterMat, -SW / 2 + 0.17, SH / 2, SD / 2 + 1.02, true);
  addBox(shopGroup, 0.34, SH, 0.34, wallOuterMat, SW / 2 - 0.17, SH / 2, SD / 2 + 1.02, true);
  // Verandah upper fascia wall carrying the real Usman Mobile signboard (matching store.jpg!)
  addBox(shopGroup, SW + 0.2, 1.72, 0.24, wallOuterMat, 0, SH + 0.96, SD / 2 + 1.08, true);
  // Concrete top roof ledge cornice above signboard
  addBox(shopGroup, SW + 0.44, 0.14, 0.42, verandahMat, 0, SH + 1.84, SD / 2 + 1.14, true);

  // Real Usman Mobile Repairing Centre signboard mounted cleanly on upper front wall
  const signW = 4.9;
  const signH = 1.54;
  const signY = SH + 0.96;
  const signZ = SD / 2 + 1.21;
  addBox(shopGroup, signW + 0.12, signH + 0.12, 0.08, darkMetalMat, 0, signY, signZ - 0.02, true);
  const signMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  new THREE.TextureLoader().load(SHOP_IMAGES.signboard, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAnisotropy;
    signMat.map = tex;
    signMat.needsUpdate = true;
    onSignReady?.();
  });
  const signFace = new THREE.Mesh(new THREE.PlaneGeometry(signW, signH), signMat);
  signFace.position.set(0, signY, signZ + 0.026);
  shopGroup.add(signFace);

  // Authentic centered overhead LED floodlight lamp mounted right above the signboard (exact match to store.jpg!)
  addBox(shopGroup, 0.06, 0.06, 0.32, darkMetalMat, 0, signY + signH / 2 + 0.16, signZ + 0.12);
  const floodHead = addBox(
    shopGroup,
    0.34,
    0.16,
    0.1,
    steelMat,
    0,
    signY + signH / 2 + 0.12,
    signZ + 0.26,
  );
  floodHead.rotation.x = 0.45;
  const floodFace = addBox(
    shopGroup,
    0.28,
    0.11,
    0.02,
    tubeLightMat,
    0,
    signY + signH / 2 + 0.09,
    signZ + 0.29,
  );
  floodFace.rotation.x = 0.45;

  // Warm verandah porch PointLight illuminating the glass front & sidewalk
  const porchLight = new THREE.PointLight(0xffe7c2, 1.05, 10, 1.5);
  porchLight.position.set(0, SH - 0.25, SD / 2 + 0.72);
  shopGroup.add(porchLight);

  // ---------------------------------------------------------------------------
  // 3. AUTHENTIC WOOD-AND-GLASS STOREFRONT PARTITION & SWINGING GLASS DOOR
  //    (Exact match to store.jpg & 9d61709f.jpeg!)
  // ---------------------------------------------------------------------------
  const partZ = SD / 2 - 0.02;
  const partTopY = SH - 0.5; // 2.70m

  // Outer perimeter wooden frame around the entire 4.25m entrance opening
  addBox(shopGroup, DOOR_OPENING_W, 0.09, 0.12, darkWoodFrameMat, 0, partTopY, partZ);
  addBox(shopGroup, 0.09, partTopY, 0.12, darkWoodFrameMat, -DOOR_OPENING_W / 2 + 0.045, partTopY / 2, partZ);
  addBox(shopGroup, 0.09, partTopY, 0.12, darkWoodFrameMat, DOOR_OPENING_W / 2 - 0.045, partTopY / 2, partZ);
  // Central mullion dividing Left Display Window (-2.12..+0.68) from Right Entrance Door (+0.68..+2.12)
  const doorLeftX = 0.68;
  addBox(shopGroup, 0.09, partTopY, 0.12, darkWoodFrameMat, doorLeftX, partTopY / 2, partZ);

  // --- LEFT SIDE: Large Fixed Glass Display Window + White-Marble Lower Panel + Urdu Poster ---
  const winLeftX = -DOOR_OPENING_W / 2 + 0.09;
  const winW = doorLeftX - 0.045 - winLeftX; // ~2.67m
  const winCenterX = (winLeftX + doorLeftX - 0.045) * 0.5;

  // White-marble top transom strip above window (matching store.jpg!)
  addBox(shopGroup, winW, 0.24, 0.07, whiteMarbleMat, winCenterX, partTopY - 0.16, partZ);
  addBox(shopGroup, winW, 0.06, 0.11, darkWoodFrameMat, winCenterX, partTopY - 0.3, partZ);

  // Horizontal sill divider at waist height (y = 0.96m)
  addBox(shopGroup, winW, 0.07, 0.11, darkWoodFrameMat, winCenterX, 0.96, partZ);
  // Clear glass window pane (y = 0.99..2.37)
  const frontWindowGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(winW - 0.04, 1.38),
    clearGlassMat,
  );
  frontWindowGlass.position.set(winCenterX, 1.68, partZ);
  frontWindowGlass.material.side = THREE.DoubleSide;
  shopGroup.add(frontWindowGlass);

  // Lower opaque white-marble veined base panel under front window (y = 0.14..0.93)
  addBox(shopGroup, winW, 0.8, 0.07, whiteMarbleMat, winCenterX, 0.54, partZ, true);

  // Authentic white-and-red Urdu poster mounted on the outside of the lower-left marble panel (matching store.jpg!)
  const lowerPosterMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.38, 0.76),
    new THREE.MeshStandardMaterial({
      map: createStorefrontLowerPosterTexture(maxAnisotropy),
      roughness: 0.45,
    }),
  );
  lowerPosterMesh.position.set(winCenterX - 0.48, 0.54, partZ + 0.042);
  shopGroup.add(lowerPosterMesh);

  // Hanging 600GB SIM promo cards along the top inside edge of the front glass window (matching 9d61709f.jpeg!)
  const simCardTex = createSimHangCardTexture(maxAnisotropy);
  const simCardMat = new THREE.MeshStandardMaterial({
    map: simCardTex,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });
  [-0.85, -0.52, -0.19, 0.14].forEach((sxOff, idx) => {
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.34), simCardMat);
    card.position.set(winCenterX + sxOff, 2.14, partZ - 0.08);
    card.rotation.y = (idx - 1.5) * 0.08;
    shopGroup.add(card);
  });

  // Tied-back light fabric verandah curtain draped on the far-left edge (matching store.jpg & 9d61709f.jpeg!)
  const curtainMat = new THREE.MeshStandardMaterial({
    color: 0xdce7ea,
    roughness: 0.9,
    metalness: 0.0,
  });
  const curtainMesh = addCylinder(
    shopGroup,
    0.09,
    0.13,
    2.45,
    10,
    curtainMat,
    winLeftX + 0.08,
    1.38,
    partZ + 0.2,
    true,
  );
  curtainMesh.rotation.z = 0.06;

  // --- RIGHT SIDE: Hinged Wood-and-Glass Entrance Door (Swings open inward smoothly!) ---
  const doorRightX = DOOR_OPENING_W / 2 - 0.09;
  const doorW = doorRightX - (doorLeftX + 0.045); // ~1.31m
  const doorH = partTopY - 0.14;

  // Pivot placed on the right door jamb so the door swings cleanly inward into the shop
  const doorPivot = new THREE.Group();
  doorPivot.position.set(doorRightX, 0.14, partZ);
  shopGroup.add(doorPivot);

  const doorCenterX = -doorW / 2;
  // Door vertical stiles & horizontal rails
  addBox(doorPivot, 0.08, doorH, 0.07, darkWoodFrameMat, -0.04, doorH / 2, 0, true);
  addBox(doorPivot, 0.08, doorH, 0.07, darkWoodFrameMat, -doorW + 0.04, doorH / 2, 0, true);
  addBox(doorPivot, doorW, 0.08, 0.07, darkWoodFrameMat, doorCenterX, doorH - 0.04, 0);
  addBox(doorPivot, doorW, 0.09, 0.07, darkWoodFrameMat, doorCenterX, 1.48, 0);
  addBox(doorPivot, doorW, 0.08, 0.07, darkWoodFrameMat, doorCenterX, 0.62, 0);
  // Lower brown wood kick panel (matching 9d61709f.jpeg!)
  addBox(doorPivot, doorW - 0.12, 0.56, 0.045, warmWoodTrimMat, doorCenterX, 0.31, 0);
  // Upper & middle clear glass panes
  const doorGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(doorW - 0.14, doorH - 0.7),
    clearGlassMat,
  );
  doorGlass.position.set(doorCenterX, 1.56, 0);
  doorGlass.material.side = THREE.DoubleSide;
  doorPivot.add(doorGlass);
  // Chrome door lock & handle on latch edge
  addBox(doorPivot, 0.05, 0.16, 0.12, steelMat, -doorW + 0.1, 1.12, 0);

  // ---------------------------------------------------------------------------
  // 4. MOTORIZED SLATTED STEEL SHUTTER (Rolls down in front of glass storefront)
  // ---------------------------------------------------------------------------
  // Overhead shutter roller drum box
  addBox(shopGroup, DOOR_OPENING_W + 0.24, 0.28, 0.28, darkMetalMat, 0, SH - 0.44, SD / 2 + 0.22, true);
  addBox(shopGroup, 0.08, SH - 0.44, 0.12, darkMetalMat, -DOOR_OPENING_W / 2 - 0.03, (SH - 0.44) / 2 + 0.1, SD / 2 + 0.22);
  addBox(shopGroup, 0.08, SH - 0.44, 0.12, darkMetalMat, DOOR_OPENING_W / 2 + 0.03, (SH - 0.44) / 2 + 0.1, SD / 2 + 0.22);

  const shutterGroup = new THREE.Group();
  shutterGroup.position.set(0, 0.12, SD / 2 + 0.22);
  shopGroup.add(shutterGroup);

  const shutterSlatMat = new THREE.MeshStandardMaterial({
    color: 0x9aa4b2,
    metalness: 0.72,
    roughness: 0.34,
  });
  const shutterGrooveMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.55,
    roughness: 0.45,
  });
  const slatCount = 13;
  for (let i = 0; i < slatCount; i++) {
    const sy = 0.12 + i * 0.2;
    addBox(shutterGroup, DOOR_OPENING_W, 0.145, 0.075, shutterSlatMat, 0, sy, 0, true);
    addBox(shutterGroup, DOOR_OPENING_W - 0.08, 0.02, 0.015, shutterGrooveMat, 0, sy - 0.055, 0.045);
  }
  addBox(shutterGroup, DOOR_OPENING_W + 0.04, 0.12, 0.1, darkMetalMat, 0, 0.07, 0.01, true);

  // Stationary invisible hover/tap target aligned with the front shutter doorway
  const shutterHitTarget = new THREE.Mesh(
    new THREE.PlaneGeometry(DOOR_OPENING_W + 0.4, SH - 0.35),
    new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }),
  );
  shutterHitTarget.position.set(0, (SH - 0.35) / 2 + 0.1, SD / 2 + 0.32);
  shopGroup.add(shutterHitTarget);

  // ---------------------------------------------------------------------------
  // 5. REALISTIC 360° INTERIOR (100% Faithful to Real Shop Photos + Branded Interactive Stock)
  // ---------------------------------------------------------------------------
  const interactiveItems: InteractiveShopItem[] = [];

  const registerInteractive = (
    mesh: THREE.Mesh,
    itemType: string,
    hoverOffset: [number, number, number],
  ) => {
    const item = mesh as unknown as InteractiveShopItem;
    item.layers.enable(1);
    item.userData = {
      basePos: [mesh.position.x, mesh.position.y, mesh.position.z],
      hoverOffset,
      itemType,
    };
    interactiveItems.push(item);
    return item;
  };

  // Shared high-res retail textures (one GPU texture per SKU, unique material instance per interactive mesh for individual hover glow)
  const makeBoxMaterials = (
    frontTex: THREE.CanvasTexture,
    sideColor: number,
    faces: ('px' | 'pz')[] = ['px', 'pz'],
  ) => {
    const sideMat = () =>
      new THREE.MeshStandardMaterial({
        color: sideColor,
        roughness: 0.38,
        metalness: 0.06,
      });
    const frontMat = () =>
      new THREE.MeshStandardMaterial({
        map: frontTex,
        roughness: 0.28,
        metalness: 0.06,
      });
    return [
      faces.includes('px') ? frontMat() : sideMat(), // +X
      sideMat(), // -X
      sideMat(), // +Y
      sideMat(), // -Y
      faces.includes('pz') ? frontMat() : sideMat(), // +Z
      sideMat(), // -Z
    ];
  };

  // Pre-generate crisp product packaging textures (shared across instances)
  const texHandsfreeBox = createRetailBoxTexture(
    'RONIN R-9',
    'SUPER BASS HANDSFREE',
    '3.5MM · HD MIC',
    '#F8FAFC',
    '#16A34A',
    'handsfree',
    maxAnisotropy,
  );
  const texCableBox = createRetailBoxTexture(
    'TURBO 65W',
    'TYPE-C FAST CABLE',
    '6A · 1.2M BRAIDED',
    '#F8FAFC',
    '#0284C7',
    'cable',
    maxAnisotropy,
  );
  const texPlay1Box = createRetailBoxTexture(
    'PLAY 1',
    'DUAL SIM FEATURE',
    '3000mAh · TORCH',
    '#FEF08A',
    '#CA8A04',
    'keypad',
    maxAnisotropy,
  );
  const texAirpodsBox = createRetailBoxTexture(
    'AIRPODS PRO',
    'WIRELESS EARBUDS',
    'BT 5.3 · 24H CASE',
    '#F8FAFC',
    '#1D4ED8',
    'airpods',
    maxAnisotropy,
  );
  const texSmartphoneBox = createRetailBoxTexture(
    'TECNO SPARK',
    '128GB · PTA APPROVED',
    '5000mAh · 50MP',
    '#0F172A',
    '#0D9488',
    'smartphone',
    maxAnisotropy,
    false,
  );
  const texSpeakerBox = createRetailBoxTexture(
    'JBL BASS',
    'BLUETOOTH SPEAKER',
    'RGB · USB · 8H',
    '#1E293B',
    '#DC2626',
    'speaker',
    maxAnisotropy,
    false,
  );
  const texPowerBankBox = createRetailBoxTexture(
    '20,000mAh',
    '22.5W POWER BANK',
    'LED % · DUAL USB',
    '#FFFBEB',
    '#EA580C',
    'powerbank',
    maxAnisotropy,
  );
  const texWatchBox = createRetailBoxTexture(
    'ULTRA WATCH',
    'AMOLED CALLING',
    'BT CALL · STRAPS',
    '#111827',
    '#4F46E5',
    'watch',
    maxAnisotropy,
    false,
  );
  const texChargerBox = createRetailBoxTexture(
    '67W TURBO',
    'SUPER FAST CHARGER',
    'SMART IC · PD',
    '#F8FAFC',
    '#D97706',
    'charger',
    maxAnisotropy,
  );
  const texBatteryBox = createRetailBoxTexture(
    'ORIGINAL',
    '5000mAh BATTERY',
    'ZERO-CYCLE LI-ION',
    '#ECFDF5',
    '#059669',
    'battery',
    maxAnisotropy,
  );
  const texLcdBox = createRetailBoxTexture(
    'ORIGINAL LCD',
    'AMOLED & IPS PANEL',
    'SAME-DAY FITTING',
    '#EFF6FF',
    '#0369A1',
    'lcd',
    maxAnisotropy,
  );

  // 5A. LEFT WALL (-X): Authentic Hanging Accessory Rails + Wire Mesh Grid + Branded 3D Blister Packs
  const leftWallPacksPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(3.85, 1.55),
    new THREE.MeshStandardMaterial({
      map: createHangingWallPacksTexture(maxAnisotropy),
      transparent: true,
      roughness: 0.45,
      metalness: 0.05,
    }),
  );
  leftWallPacksPlane.rotation.y = Math.PI / 2;
  leftWallPacksPlane.position.set(-SW / 2 + 0.16, 2.02, 0.12);
  shopGroup.add(leftWallPacksPlane);

  // Interactive 3D branded blister packs protruding naturally off the left wall rails & wire mesh
  const blisterSkus: {
    itemType: string;
    title: string;
    sub: string;
    cardBg: string;
    accent: string;
    icon: RetailIconType;
    sideCol: number;
  }[] = [
    { itemType: 'Type-C Data Cable', title: '65W TYPE-C', sub: '6A FAST CABLE', cardBg: '#FFF7ED', accent: '#EA580C', icon: 'cable', sideCol: 0xfed7aa },
    { itemType: 'Fast Charger', title: '33W CHARGER', sub: 'TURBO ADAPTER', cardBg: '#FEFCE8', accent: '#CA8A04', icon: 'charger', sideCol: 0xfef08a },
    { itemType: 'Handsfree', title: 'RONIN R-9', sub: 'SUPER BASS', cardBg: '#F0FDF4', accent: '#16A34A', icon: 'handsfree', sideCol: 0xbbf7d0 },
    { itemType: 'AirPods Pro', title: 'TWS BUDS', sub: 'BT 5.3 AUDIO', cardBg: '#EFF6FF', accent: '#2563EB', icon: 'airpods', sideCol: 0xbfdbfe },
    { itemType: 'Tempered Glass', title: '9D GLASS', sub: 'FULL GLUE 9H', cardBg: '#F5F3FF', accent: '#7C3AED', icon: 'glass', sideCol: 0xddd6fe },
    { itemType: 'Phone Cover', title: 'MAGSAFE', sub: 'SHOCKPROOF', cardBg: '#FDF2F8', accent: '#DB2777', icon: 'cover', sideCol: 0xfbcfe8 },
    { itemType: 'Fast Charger', title: '67W PD PRO', sub: 'ORIGINAL IC', cardBg: '#FEF2F2', accent: '#DC2626', icon: 'charger', sideCol: 0xfecaca },
  ];
  const blisterTextures = blisterSkus.map((sku) =>
    createBlisterPackTexture(sku.title, sku.sub, sku.cardBg, sku.accent, sku.icon, maxAnisotropy),
  );

  const leftRowYs = [2.46, 2.02, 1.58];
  leftRowYs.forEach((ry, rowIdx) => {
    for (let k = 0; k < 7; k++) {
      const skuIdx =
        rowIdx === 1 && k < 4
          ? k % 2 === 0
            ? 1
            : 0
          : k >= 5
            ? 4 + ((rowIdx + k) % 2)
            : (rowIdx * 2 + k) % blisterSkus.length;
      const sku = blisterSkus[skuIdx];
      const pack = new THREE.Mesh(
        new THREE.BoxGeometry(0.036, 0.27, 0.175),
        makeBoxMaterials(blisterTextures[skuIdx], sku.sideCol, ['px']),
      );
      const pz = 1.66 - k * 0.48;
      pack.position.set(-SW / 2 + 0.195, ry, pz);
      shopGroup.add(pack);
      registerInteractive(pack, sku.itemType, [0.09, 0.015, 0]);
    }
  });

  // Realistic Open-Frame 4-Post Back-Left Corner Steel Parts & Display Rack (replaces plain grey column!)
  const cornerRack = new THREE.Group();
  cornerRack.position.set(-SW / 2 + 0.42, 0.16, -SD / 2 + 0.44);
  shopGroup.add(cornerRack);
  const rackW = 0.56;
  const rackD = 0.68;
  const rackH = 2.24;
  // 4 slim vertical corner posts so the rack looks genuinely open and architectural
  [-rackW / 2 + 0.02, rackW / 2 - 0.02].forEach((px) => {
    [-rackD / 2 + 0.02, rackD / 2 - 0.02].forEach((pz) => {
      addBox(cornerRack, 0.036, rackH, 0.036, darkMetalMat, px, rackH / 2, pz, true);
    });
  });
  // 5 horizontal steel shelves
  const cornerShelfYs = [0.22, 0.72, 1.22, 1.72, 2.22];
  cornerShelfYs.forEach((sy) => {
    addBox(cornerRack, rackW, 0.032, rackD, steelMat, 0, sy, 0, true);
  });
  // Stocked labeled interactive boxes on the open steel shelves (LCDs, Batteries, Chargers, Speakers, Power Banks!)
  const cornerStock: {
    y: number;
    z: number;
    w: number;
    h: number;
    d: number;
    tex: THREE.CanvasTexture;
    col: number;
    type: string;
  }[] = [
    { y: 0.87, z: -0.14, w: 0.34, h: 0.28, d: 0.26, tex: texLcdBox, col: 0x0369a1, type: 'LCD Display' },
    { y: 0.87, z: 0.16, w: 0.34, h: 0.28, d: 0.24, tex: texBatteryBox, col: 0x059669, type: 'Original Battery' },
    { y: 1.37, z: -0.14, w: 0.32, h: 0.28, d: 0.24, tex: texChargerBox, col: 0xd97706, type: 'Fast Charger' },
    { y: 1.37, z: 0.16, w: 0.32, h: 0.28, d: 0.24, tex: texAirpodsBox, col: 0x1d4ed8, type: 'AirPods Pro' },
    { y: 1.87, z: -0.14, w: 0.34, h: 0.28, d: 0.24, tex: texSmartphoneBox, col: 0x0f172a, type: 'Smartphone' },
    { y: 1.87, z: 0.16, w: 0.34, h: 0.28, d: 0.24, tex: texWatchBox, col: 0x1e293b, type: 'Smartwatch' },
    { y: 2.38, z: -0.16, w: 0.34, h: 0.28, d: 0.26, tex: texSpeakerBox, col: 0x991b1b, type: 'Bluetooth Speaker' },
    { y: 2.38, z: 0.16, w: 0.34, h: 0.28, d: 0.24, tex: texPowerBankBox, col: 0xea580c, type: 'Power Bank' },
  ];
  cornerStock.forEach((st) => {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(st.w, st.h, st.d),
      makeBoxMaterials(st.tex, st.col, ['px', 'pz']),
    );
    box.position.set(0.03, st.y, st.z);
    cornerRack.add(box);
    registerInteractive(box, st.type, [0.06, 0.02, 0.06]);
  });

  // Crisp Framed Interior Repair Lab & Service Menu Board mounted on upper back-left plaster wall!
  const menuBoardFrame = addBox(shopGroup, 1.34, 1.0, 0.04, darkMetalMat, -1.62, 2.24, -SD / 2 + 0.155);
  const menuBoardFace = new THREE.Mesh(
    new THREE.PlaneGeometry(1.26, 0.92),
    new THREE.MeshStandardMaterial({
      map: createInteriorMenuBoardTexture(maxAnisotropy),
      roughness: 0.32,
      metalness: 0.06,
    }),
  );
  menuBoardFace.position.set(0, 0, 0.024);
  menuBoardFrame.add(menuBoardFace);
  registerInteractive(menuBoardFace, 'Repair Bench', [0, 0, 0.04]);

  // 5B. FRONT-LEFT WHITE-MARBLE GLASS SHOWCASE COUNTER (Hero Centerpiece!)
  const counterGroup = new THREE.Group();
  counterGroup.position.set(-1.32, 0.16, 0.96);
  shopGroup.add(counterGroup);

  const counterLen = 2.68;
  const counterDepth = 0.72;
  addBox(counterGroup, counterDepth, 0.64, counterLen, whiteMarbleMat, 0, 0.32, 0, true);
  addBox(counterGroup, counterDepth + 0.02, 0.035, counterLen + 0.02, warmWoodTrimMat, 0, 0.655, 0);
  // Warm under-glass LED showcase light strip illuminating all counter products!
  addBox(counterGroup, 0.03, 0.018, counterLen - 0.12, tubeLightMat, counterDepth / 2 - 0.05, 1.025, 0);
  // Clear glass top & glass customer-facing vitrine walls
  addBox(counterGroup, counterDepth + 0.04, 0.03, counterLen + 0.04, clearGlassMat, 0, 1.05, 0);
  addBox(counterGroup, 0.02, 0.38, counterLen, clearGlassMat, counterDepth / 2, 0.85, 0);
  addBox(counterGroup, counterDepth, 0.38, 0.02, clearGlassMat, 0, 0.85, -counterLen / 2);
  // Black aluminum top showcase trim & corner mullions
  addBox(counterGroup, counterDepth + 0.05, 0.04, 0.04, darkMetalMat, 0, 1.045, counterLen / 2);
  addBox(counterGroup, counterDepth + 0.05, 0.04, 0.04, darkMetalMat, 0, 1.045, -counterLen / 2);
  addBox(counterGroup, 0.04, 0.04, counterLen + 0.05, darkMetalMat, counterDepth / 2, 1.045, 0);
  addBox(counterGroup, 0.04, 0.04, counterLen + 0.05, darkMetalMat, -counterDepth / 2, 1.045, 0);
  [-counterLen / 2, counterLen / 2].forEach((cz) => {
    addBox(counterGroup, 0.04, 0.4, 0.04, darkMetalMat, counterDepth / 2, 0.85, cz);
    addBox(counterGroup, 0.04, 0.4, 0.04, darkMetalMat, -counterDepth / 2, 0.85, cz);
  });

  // Inside the glass vitrine: Branded RONIN R-9 Handsfree & 65W Type-C boxes + Printed Round TWS Earbud Tins!
  const tinSpecs: [string, string, string, number][] = [
    ['TWS BUDS', 'BT 5.3', '#1D4ED8', 0x1e3a8a],
    ['BASS PRO', 'SUPER HD', '#DC2626', 0x991b1b],
    ['FAST USB', '65W PD', '#0284C7', 0x075985],
    ['AIRPODS', 'ANC PRO', '#0F172A', 0x1e293b],
    ['RONIN', 'R-9 MIC', '#059669', 0x065f46],
    ['MAG BUDS', '24H PLAY', '#7C3AED', 0x5b21b6],
  ];
  const tinTextures = tinSpecs.map(([t1, t2, bg]) =>
    createRoundTinTexture(t1, t2, bg, maxAnisotropy),
  );

  for (let i = 0; i < 8; i++) {
    const bz = 1.05 - i * 0.24;
    const isHandsfree = i % 2 === 0;
    const boxItem = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.23, 0.19),
      makeBoxMaterials(
        isHandsfree ? texHandsfreeBox : texCableBox,
        isHandsfree ? 0xeefbf3 : 0xeff6ff,
        ['px', 'pz'],
      ),
    );
    boxItem.position.set(0.21, 0.785, bz);
    counterGroup.add(boxItem);
    registerInteractive(
      boxItem,
      isHandsfree ? 'Handsfree' : 'Type-C Data Cable',
      [0.04, 0.055, 0],
    );

    // Printed colorful metal earbud/cable tins right behind them, angled toward customer eyes!
    const tinIdx = i % tinSpecs.length;
    const [, , , tinBodyCol] = tinSpecs[tinIdx];
    const tinSideMat = new THREE.MeshStandardMaterial({
      color: tinBodyCol,
      roughness: 0.28,
      metalness: 0.45,
    });
    const tinLidMat = new THREE.MeshStandardMaterial({
      map: tinTextures[tinIdx],
      roughness: 0.22,
      metalness: 0.35,
    });
    const tin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.082, 0.082, 0.052, 18),
      [tinSideMat, tinLidMat, tinSideMat],
    );
    tin.position.set(0.01, 0.785, bz);
    tin.rotation.z = -(Math.PI / 2 - 0.4); // Faces +X & slightly upward straight toward the customer!
    counterGroup.add(tin);
    registerInteractive(tin, 'AirPods Pro', [0.035, 0.055, 0]);
  }

  // Yellow "PLAY 1" phone box, "TECNO SPARK" smartphone box & "AIRPODS PRO" box at the back end of the glass vitrine!
  const play1Box = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.28, 0.19),
    makeBoxMaterials(texPlay1Box, 0xfef08a, ['px', 'pz']),
  );
  play1Box.position.set(0.18, 0.81, -0.92);
  counterGroup.add(play1Box);
  registerInteractive(play1Box, 'PLAY 1 Mobile', [0.04, 0.055, 0]);

  const phoneBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.25, 0.16),
    makeBoxMaterials(texSmartphoneBox, 0x0f172a, ['px', 'pz']),
  );
  phoneBox.position.set(0.18, 0.795, -1.14);
  counterGroup.add(phoneBox);
  registerInteractive(phoneBox, 'Smartphone', [0.04, 0.055, 0]);

  const budsBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.22, 0.16),
    makeBoxMaterials(texAirpodsBox, 0xe2e8f0, ['px', 'pz']),
  );
  budsBox.position.set(-0.06, 0.78, -1.04);
  counterGroup.add(budsBox);
  registerInteractive(budsBox, 'AirPods Pro', [0.035, 0.055, 0]);

  // On top of the glass counter:
  // 1) Black Desktop LCD Monitor near front window with crisp POS & Repair Lab interface!
  const monGroup = new THREE.Group();
  monGroup.position.set(0.05, 1.07, 0.78);
  monGroup.rotation.y = 0.24;
  counterGroup.add(monGroup);
  addBox(monGroup, 0.18, 0.02, 0.22, darkMetalMat, 0, 0.01, 0);
  addBox(monGroup, 0.05, 0.16, 0.06, darkMetalMat, -0.02, 0.09, 0);
  addBox(monGroup, 0.05, 0.38, 0.5, darkMetalMat, 0, 0.32, 0, true);
  const posScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.45, 0.32),
    new THREE.MeshBasicMaterial({ map: createPosMonitorTexture(maxAnisotropy) }),
  );
  posScreen.position.set(-0.028, 0.32, 0);
  posScreen.rotation.y = -Math.PI / 2;
  monGroup.add(posScreen);

  // 2) Interactive Blue QR Payment Standee ("SCAN TO PAY · EASYPAISA / RAAST") on top of counter
  const qrStand = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.24, 0.16),
    darkMetalMat,
  );
  qrStand.position.set(0.08, 1.19, -0.82);
  qrStand.rotation.y = -0.35;
  counterGroup.add(qrStand);
  const qrFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.15, 0.22),
    new THREE.MeshStandardMaterial({
      map: createQrStandeeTexture(maxAnisotropy),
      roughness: 0.25,
    }),
  );
  qrFace.position.set(0.095, 1.19, -0.82);
  qrFace.rotation.y = Math.PI / 2 - 0.35;
  counterGroup.add(qrFace);
  registerInteractive(qrFace, 'Easypaisa & JazzCash', [0.03, 0.04, 0]);

  // 3) Flat white QR payment stickers under the glass top
  [-0.25, 0.28].forEach((qz) => {
    const sticker = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 0.18),
      new THREE.MeshBasicMaterial({ color: 0xf8fafc }),
    );
    sticker.rotation.x = -Math.PI / 2;
    sticker.position.set(0.1, 1.068, qz);
    counterGroup.add(sticker);
  });

  // White-marble wood-framed low swing gate connecting counter end to the back counter
  const gateGroup = new THREE.Group();
  gateGroup.position.set(-0.92, 0.16, -0.42);
  gateGroup.rotation.y = -0.25;
  shopGroup.add(gateGroup);
  addBox(gateGroup, 0.88, 0.84, 0.05, warmWoodTrimMat, 0.44, 0.44, 0, true);
  addBox(gateGroup, 0.78, 0.74, 0.06, whiteMarbleMat, 0.44, 0.44, 0);

  // 5C. BACK WALL (-Z): Full Dark-Brown Wood Display Shelving Cabinet + Branded Top Boxes + CCTV Camera
  const cabinetW = 3.2;
  const cabinetH = 1.62;
  const cabinetX = 0.85;
  const cabinetY = 1.94;
  const cabinetZ = -SD / 2 + 0.26;
  addBox(shopGroup, cabinetW + 0.08, cabinetH + 0.08, 0.24, darkWoodFrameMat, cabinetX, cabinetY, cabinetZ, true);
  const cabinetFace = new THREE.Mesh(
    new THREE.PlaneGeometry(cabinetW, cabinetH),
    new THREE.MeshStandardMaterial({
      map: createBackCabinetTexture(maxAnisotropy),
      roughness: 0.44,
      metalness: 0.06,
    }),
  );
  cabinetFace.position.set(cabinetX, cabinetY, cabinetZ + 0.125);
  shopGroup.add(cabinetFace);

  // 8 Branded Interactive 3D Product Boxes perched along the top & front ledges of the back wooden cabinet!
  const topShowcaseSpecs: {
    tex: THREE.CanvasTexture;
    col: number;
    type: string;
  }[] = [
    { tex: texSpeakerBox, col: 0x991b1b, type: 'Bluetooth Speaker' },
    { tex: texPowerBankBox, col: 0xea580c, type: 'Power Bank' },
    { tex: texWatchBox, col: 0x312e81, type: 'Smartwatch' },
    { tex: texAirpodsBox, col: 0x1d4ed8, type: 'AirPods Pro' },
    { tex: texChargerBox, col: 0xd97706, type: 'Fast Charger' },
    { tex: texPlay1Box, col: 0xfef08a, type: 'PLAY 1 Mobile' },
    { tex: texBatteryBox, col: 0x059669, type: 'Original Battery' },
    { tex: texSmartphoneBox, col: 0x0f172a, type: 'Smartphone' },
  ];
  topShowcaseSpecs.forEach((spec, i) => {
    const bx = cabinetX - 1.32 + i * 0.38;
    const item = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.26, 0.17),
      makeBoxMaterials(spec.tex, spec.col, ['pz']),
    );
    item.position.set(bx, cabinetY + cabinetH / 2 + 0.17, cabinetZ + 0.04);
    shopGroup.add(item);
    registerInteractive(item, spec.type, [0, 0.04, 0.1]);
  });

  // Interactive protruding hero boxes along the middle shelf of the back cabinet so customers can click shelves too!
  const midShelfSpecs: { x: number; y: number; tex: THREE.CanvasTexture; col: number; type: string }[] = [
    { x: cabinetX - 1.05, y: cabinetY + 0.2, tex: texAirpodsBox, col: 0x1d4ed8, type: 'AirPods Pro' },
    { x: cabinetX - 0.15, y: cabinetY + 0.2, tex: texChargerBox, col: 0xd97706, type: 'Fast Charger' },
    { x: cabinetX + 0.78, y: cabinetY + 0.2, tex: texSpeakerBox, col: 0x991b1b, type: 'Bluetooth Speaker' },
    { x: cabinetX - 0.7, y: cabinetY - 0.22, tex: texHandsfreeBox, col: 0x16a34a, type: 'Handsfree' },
    { x: cabinetX + 0.35, y: cabinetY - 0.22, tex: texBatteryBox, col: 0x059669, type: 'Original Battery' },
  ];
  midShelfSpecs.forEach((ms) => {
    const shelfBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.25, 0.08),
      makeBoxMaterials(ms.tex, ms.col, ['pz']),
    );
    shelfBox.position.set(ms.x, ms.y, cabinetZ + 0.155);
    shopGroup.add(shelfBox);
    registerInteractive(shelfBox, ms.type, [0, 0.02, 0.09]);
  });

  // White Bullet CCTV Security Camera mounted high on back wall above the wooden cabinet
  const cctvMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35 });
  addBox(shopGroup, 0.08, 0.08, 0.14, cctvMat, cabinetX - 0.55, SH - 0.28, -SD / 2 + 0.2);
  const cctvBody = addCylinder(
    shopGroup,
    0.045,
    0.052,
    0.18,
    12,
    cctvMat,
    cabinetX - 0.55,
    SH - 0.33,
    -SD / 2 + 0.31,
  );
  cctvBody.rotation.x = Math.PI / 2 + 0.35;
  addCylinder(
    shopGroup,
    0.032,
    0.032,
    0.02,
    12,
    darkMetalMat,
    cabinetX - 0.55,
    SH - 0.36,
    -SD / 2 + 0.4,
  ).rotation.x = Math.PI / 2 + 0.35;

  // 5D. BACK-LEFT CORNER REPAIR WORKBENCH + SMD HOT-AIR STATION + MAROON TECHNICIAN CHAIR
  const repairDesk = new THREE.Group();
  repairDesk.position.set(-1.55, 0.16, -SD / 2 + 0.62);
  shopGroup.add(repairDesk);
  addBox(repairDesk, 1.08, 0.05, 0.7, warmWoodTrimMat, 0, 0.72, 0, true);
  [-0.48, 0.48].forEach((lx) => {
    [-0.29, 0.29].forEach((lz) => {
      addBox(repairDesk, 0.045, 0.72, 0.045, darkMetalMat, lx, 0.36, lz);
    });
  });
  // Realistic SMD 858D Hot-Air Rework Station with glowing 380°C digital display (clickable!)
  const reworkBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.19, 0.2),
    makeBoxMaterials(createReworkStationTexture(maxAnisotropy), 0x1e293b, ['pz', 'px']),
  );
  reworkBox.position.set(-0.24, 0.84, -0.14);
  repairDesk.add(reworkBox);
  registerInteractive(reworkBox, 'Repair Bench', [0, 0.05, 0.06]);

  // Blue ESD Anti-Static Silicone Repair Mat + Open Smartphone + Precision Screwdriver Rack
  const repairMatMesh = addBox(
    repairDesk,
    0.42,
    0.018,
    0.3,
    new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.65 }),
    0.18,
    0.754,
    0.08,
  );
  registerInteractive(repairMatMesh, 'Repair Bench', [0, 0.04, 0.04]);
  addBox(repairDesk, 0.11, 0.016, 0.19, darkMetalMat, 0.16, 0.77, 0.08);
  addBox(repairDesk, 0.09, 0.018, 0.16, new THREE.MeshStandardMaterial({ color: 0x065f46 }), 0.16, 0.774, 0.08);
  // Articulated desk inspection lamp above repair mat
  addCylinder(repairDesk, 0.014, 0.014, 0.42, 8, steelMat, 0.42, 0.94, -0.2);
  addBox(repairDesk, 0.18, 0.035, 0.12, darkMetalMat, 0.32, 1.14, -0.08);
  addBox(repairDesk, 0.14, 0.014, 0.08, tubeLightMat, 0.32, 1.115, -0.08);

  // 5D-2. REVOLVING EXECUTIVE OFFICE CHAIR SEATED AT THE REPAIR COUNTER
  const chairPosX = -1.26;
  const chairPosZ = -SD / 2 + 1.28; // -1.22
  const chairStation = new THREE.Group();
  chairStation.position.set(chairPosX, 0.16, chairPosZ);
  shopGroup.add(chairStation);

  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x1b202b,
    roughness: 0.46,
    metalness: 0.14,
  });
  const leatherAccentMat = new THREE.MeshStandardMaterial({
    color: 0x263145,
    roughness: 0.52,
    metalness: 0.08,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd1d8e0,
    roughness: 0.18,
    metalness: 0.9,
  });

  // Stationary 5-star caster-wheel base on the cement floor
  addCylinder(chairStation, 0.032, 0.036, 0.24, 14, darkMetalMat, 0, 0.18, 0, true);
  addCylinder(chairStation, 0.022, 0.022, 0.18, 14, chromeMat, 0, 0.36, 0);
  for (let spoke = 0; spoke < 5; spoke++) {
    const ang = (spoke * Math.PI * 2) / 5;
    const armGroup = new THREE.Group();
    armGroup.rotation.y = ang;
    chairStation.add(armGroup);
    const legBar = addBox(armGroup, 0.036, 0.028, 0.28, darkMetalMat, 0, 0.075, 0.14);
    legBar.rotation.x = 0.12;
    const wheel = addCylinder(armGroup, 0.026, 0.026, 0.032, 10, darkMetalMat, 0, 0.028, 0.27);
    wheel.rotation.z = Math.PI / 2;
  }

  // Revolving chair upper assembly neatly facing the repair workbench
  const workYaw = Math.atan2(-1.55 - chairPosX, -1.88 - chairPosZ) + Math.PI * 2;
  const chairSwivel = new THREE.Group();
  chairSwivel.rotation.y = workYaw;
  chairStation.add(chairSwivel);

  addBox(chairSwivel, 0.48, 0.075, 0.46, leatherMat, 0, 0.47, 0.02, true);
  const frontBolster = addCylinder(chairSwivel, 0.038, 0.038, 0.48, 14, leatherMat, 0, 0.47, 0.25);
  frontBolster.rotation.z = Math.PI / 2;
  const backSpine = addBox(chairSwivel, 0.06, 0.42, 0.04, chromeMat, 0, 0.62, -0.22);
  backSpine.rotation.x = -0.14;
  const backCushion = addBox(chairSwivel, 0.46, 0.56, 0.075, leatherMat, 0, 0.84, -0.21, true);
  backCushion.rotation.x = -0.09;
  const lumbarPad = addBox(chairSwivel, 0.36, 0.18, 0.05, leatherAccentMat, 0, 0.68, -0.17);
  lumbarPad.rotation.x = -0.09;
  const headRest = addBox(chairSwivel, 0.28, 0.15, 0.07, leatherAccentMat, 0, 1.17, -0.24, true);
  headRest.rotation.x = -0.05;
  [-0.26, 0.26].forEach((ax) => {
    addBox(chairSwivel, 0.03, 0.2, 0.035, chromeMat, ax, 0.57, -0.02);
    addBox(chairSwivel, 0.055, 0.035, 0.32, leatherMat, ax, 0.68, 0.02, true);
  });

  // 5E. BACK-RIGHT & RIGHT SIDE: DARK-WOOD L-COUNTER WITH EMERALD-GREEN CLOTH & RATE-LIST POSTERS
  const rateListMat = new THREE.MeshStandardMaterial({
    map: createRateListCounterTexture(maxAnisotropy),
    roughness: 0.62,
  });
  const backCounterW = 2.75;
  addBox(shopGroup, backCounterW, 0.86, 0.76, darkWoodFrameMat, 1.42, 0.59, -0.68, true);
  const rateListFace = new THREE.Mesh(
    new THREE.PlaneGeometry(backCounterW - 0.04, 0.82),
    rateListMat,
  );
  rateListFace.position.set(1.42, 0.59, -0.295);
  shopGroup.add(rateListFace);
  addBox(shopGroup, backCounterW + 0.05, 0.06, 0.82, greenClothMat, 1.42, 1.04, -0.68);
  addBox(shopGroup, backCounterW + 0.05, 0.12, 0.03, greenClothMat, 1.42, 0.99, -0.28);

  // Interactive Easypaisa / JazzCash Acrylic Stand on top of the green-cloth counter!
  const epStand = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.22, 0.035),
    makeBoxMaterials(createEasypaisaStandTexture(maxAnisotropy), 0x0f172a, ['pz']),
  );
  epStand.position.set(0.75, 1.18, -0.52);
  epStand.rotation.y = -0.24;
  shopGroup.add(epStand);
  registerInteractive(epStand, 'Easypaisa & JazzCash', [0, 0.04, 0.06]);

  // Matching green-cloth covered side customer bench along right wall
  addBox(shopGroup, 0.62, 0.52, 1.42, darkWoodFrameMat, SW / 2 - 0.46, 0.42, 0.82, true);
  addBox(shopGroup, 0.66, 0.07, 1.46, greenClothMat, SW / 2 - 0.46, 0.7, 0.82);

  // ---------------------------------------------------------------------------
  // 6. ROOFTOP PARAPET & TILTED SOLAR PANEL ARRAY (Great Aerial Presence!)
  // ---------------------------------------------------------------------------
  const roofGroup = new THREE.Group();
  roofGroup.position.set(0, SH, 0);
  shopGroup.add(roofGroup);

  const roofDeckMat = new THREE.MeshStandardMaterial({
    color: 0x626b78,
    roughness: 0.86,
    metalness: 0.08,
  });
  addBox(roofGroup, SW + 0.24, 0.14, SD + 0.2, roofDeckMat, 0, 0.07, 0, true);
  addBox(roofGroup, SW + 0.24, 0.34, 0.16, wallOuterMat, 0, 0.24, -SD / 2 - 0.02, true);
  addBox(roofGroup, 0.16, 0.34, SD + 0.2, wallOuterMat, -SW / 2 - 0.04, 0.24, 0, true);
  addBox(roofGroup, 0.16, 0.34, SD + 0.2, wallOuterMat, SW / 2 + 0.04, 0.24, 0, true);

  const solarTex = createSolarCellTexture(maxAnisotropy);
  const solarSurfaceMat = new THREE.MeshStandardMaterial({
    map: solarTex,
    roughness: 0.18,
    metalness: 0.72,
  });
  const solarBackingMat = new THREE.MeshStandardMaterial({
    color: 0xc2cedb,
    roughness: 0.36,
    metalness: 0.74,
  });
  const rack = new THREE.Group();
  rack.position.set(0, 0.18, -0.3);
  rack.rotation.x = -0.2;
  roofGroup.add(rack);
  [-1.35, 1.35].forEach((rx) => {
    const leg = addBox(rack, 0.1, 0.8, 0.1, steelMat, rx, 0.4, 0, true);
    leg.rotation.x = -0.2;
    addBox(rack, 0.46, 0.07, 0.3, darkMetalMat, rx, 0.05, 0.05, true);
  });
  addBox(rack, 3.4, 0.06, 1.65, solarBackingMat, 0, 0.82, 0, true);
  const solarFace = new THREE.Mesh(new THREE.PlaneGeometry(3.32, 1.58), solarSurfaceMat);
  solarFace.rotation.x = -Math.PI / 2;
  solarFace.position.set(0, 0.855, 0);
  rack.add(solarFace);

  // Main warm interior ceiling PointLight (bright, natural daylight-balanced showroom illumination!)
  const warmLight = new THREE.PointLight(0xfff1dc, 1.2, 15, 1.35);
  warmLight.position.set(0.15, SH - 0.45, 0.2);
  shopGroup.add(warmLight);

  // Subtle fill light near back wall so wooden display cabinet & blue wainscoting stay crisp and luminous
  if (!isSoftwareGl) {
    const backFillLight = new THREE.PointLight(0xdcebff, 0.85, 10, 1.5);
    backFillLight.position.set(0.4, 2.35, -1.2);
    shopGroup.add(backFillLight);
  }

  const closedShutterY = 0.12;
  const openShutterY = SH - 0.56;

  const setShutterOpen = (openAmount: number) => {
    const t = THREE.MathUtils.clamp(openAmount, 0, 1);
    shutterGroup.position.y = THREE.MathUtils.lerp(closedShutterY, openShutterY, t);
    shutterGroup.scale.y = THREE.MathUtils.lerp(1, 0.07, t);
    shutterGroup.visible = t < 0.985;
    // Gently swing the real hinged glass entrance door open inward once shutter starts lifting!
    const doorT = THREE.MathUtils.smoothstep(t, 0.22, 0.92);
    doorPivot.rotation.y = -doorT * 1.32; // Swings ~76 degrees inward cleanly along the right side
    warmLight.intensity = THREE.MathUtils.lerp(1.1, 2.75, t);
    porchLight.intensity = THREE.MathUtils.lerp(1.05, 1.55, t);
  };

  return {
    shopGroup,
    shutterGroup,
    shutterHitTarget,
    warmLight,
    porchLight,
    interactiveItems,
    setShutterOpen,
  };
}
