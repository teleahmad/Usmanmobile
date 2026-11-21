import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  INTERIOR_HOTSPOTS,
  PanoTab,
  ROAD_LABELS,
  SHOP_CONFIG,
  uvToWorld,
  ViewMode,
  worldToUv,
} from '../config/shopConfig';
import { buildPanoDome } from '../scene/buildPanoDome';
import { buildTerrainAndRoads } from '../scene/buildRoads';
import { buildShopModel, InteractiveShopItem } from '../scene/buildShop';
import {
  createTwilightSkyTexture,
  detectSoftwareGl,
  MonitorPreviewOptions,
} from '../scene/materials';

export interface OverlayDomRefs {
  pinEl: HTMLButtonElement | null;
  roadLabelEls: Record<string, HTMLDivElement | null>;
  shopHotspotEls: Record<string, HTMLDivElement | null>;
  panoHotspotEls: Record<string, HTMLDivElement | null>;
  itemTooltipEl: HTMLDivElement | null;
}

interface ShopViewportProps {
  viewMode: ViewMode;
  panoTab: PanoTab;
  roadDetailsVisible: boolean;
  editPinMode: boolean;
  shopUv: [number, number];
  monitorPreview?: MonitorPreviewOptions;
  overlayDomRef: React.MutableRefObject<OverlayDomRefs>;
  toggleMapTiltRef?: React.MutableRefObject<(() => void) | null>;
  exitShopRef?: React.MutableRefObject<(() => void) | null>;
  enterShopRef?: React.MutableRefObject<(() => void) | null>;
  onShopUvChange: (uv: [number, number]) => void;
  onModeChange: (mode: ViewMode) => void;
  onHoveredItemChange: (itemType: string | null) => void;
  onItemClick: (itemType: string) => void;
  onShutterOpenChange?: (isOpen: boolean) => void;
  onMap3DChange?: (is3D: boolean) => void;
  onInsideShopChange?: (inside: boolean) => void;
  onStartEnterWebsiteFromMonitor?: () => void;
  onEnterWebsiteFromMonitor?: () => void;
}

// Pre-allocated math helpers outside render loop (zero per-frame GC)
const _v3 = new THREE.Vector3();
const _hotspotWorld = new THREE.Vector3();
const _targetGoal = new THREE.Vector3();
const _camGoal = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _hoverRay = new THREE.Raycaster();
const _ndc = new THREE.Vector2();
const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _groundHit = new THREE.Vector3();
const _spherical = new THREE.Spherical();
const _offset = new THREE.Vector3();
const _panRight = new THREE.Vector3();
const _panForward = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _monCenter = new THREE.Vector3();
const _monNormal = new THREE.Vector3();
const _camForward = new THREE.Vector3();
const _toMonitor = new THREE.Vector3();
const _standTarget = new THREE.Vector3();
const _standCam = new THREE.Vector3();

function projectToScreen(
  x: number,
  y: number,
  z: number,
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
): [number, number, boolean] {
  _v3.set(x, y, z).project(camera);
  const inFront = _v3.z < 1 && _v3.z > -1;
  return [((_v3.x + 1) * 0.5) * width, ((1 - _v3.y) * 0.5) * height, inFront];
}

export const ShopViewport: React.FC<ShopViewportProps> = ({
  viewMode,
  panoTab,
  roadDetailsVisible,
  editPinMode,
  shopUv,
  monitorPreview,
  overlayDomRef,
  toggleMapTiltRef,
  exitShopRef,
  enterShopRef,
  onShopUvChange,
  onModeChange,
  onHoveredItemChange,
  onItemClick,
  onShutterOpenChange,
  onMap3DChange,
  onInsideShopChange,
  onStartEnterWebsiteFromMonitor,
  onEnterWebsiteFromMonitor,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);

  // Latest props stored in refs so the WebGL scene stays alive without re-mounting
  const stateRef = useRef({
    viewMode,
    panoTab,
    roadDetailsVisible,
    editPinMode,
    shopUv,
    monitorPreview,
    onShopUvChange,
    onModeChange,
    onHoveredItemChange,
    onItemClick,
    onShutterOpenChange,
    onMap3DChange,
    onInsideShopChange,
    onStartEnterWebsiteFromMonitor,
    onEnterWebsiteFromMonitor,
  });
  stateRef.current = {
    viewMode,
    panoTab,
    roadDetailsVisible,
    editPinMode,
    shopUv,
    monitorPreview,
    onShopUvChange,
    onModeChange,
    onHoveredItemChange,
    onItemClick,
    onShutterOpenChange,
    onMap3DChange,
    onInsideShopChange,
    onStartEnterWebsiteFromMonitor,
    onEnterWebsiteFromMonitor,
  };

  const triggerSyncRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    triggerSyncRef.current?.();
  }, [viewMode, panoTab, roadDetailsVisible, editPinMode, shopUv, monitorPreview]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();

    const width = Math.max(1, container.clientWidth || window.innerWidth);
    const height = Math.max(1, container.clientHeight || window.innerHeight);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    renderer.setSize(width, height, false);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';
    container.appendChild(renderer.domElement);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy() || 1;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3ece6);
    // Distant fog softly fades map boundaries into warm sand horizon
    scene.fog = new THREE.Fog(0xf3ece6, 170, 340);

    // Subtle atmospheric sky dome matching warm sand background for depth
    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(320, 32, 20),
      new THREE.MeshBasicMaterial({
        color: 0xf3ece6,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    );
    scene.add(skyDome);

    const baseMapFov = width / Math.max(1, height) < 1 ? 56 : 38;
    const camera = new THREE.PerspectiveCamera(baseMapFov, width / Math.max(1, height), 0.1, 450);

    // Studio & outdoor reflections via procedural RoomEnvironment (zero impact on ground due to envMapIntensity: 0)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTexture = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    scene.environment = envTexture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // Atmospheric warm/cool lighting rig (golden sun + sky fill + cool rim)
    const hemiLight = new THREE.HemisphereLight(0xfff2dc, 0x3b4d6b, 0.72);
    scene.add(hemiLight);

    const [initSx, initSz] = uvToWorld(stateRef.current.shopUv);
    const sunLight = new THREE.DirectionalLight(0xffd9a0, 0.8);
    sunLight.position.set(initSx - 18, 30, initSz + 15);
    sunLight.target.position.set(initSx, 0, initSz);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.left = -16;
    sunLight.shadow.camera.right = 16;
    sunLight.shadow.camera.top = 16;
    sunLight.shadow.camera.bottom = -16;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 75;
    sunLight.shadow.bias = 0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight, sunLight.target);

    const rimLight = new THREE.DirectionalLight(0x7aa7ff, 0.24);
    rimLight.position.set(initSx + 26, 18, initSz - 24);
    rimLight.castShadow = false;
    scene.add(rimLight);

    // Render lifecycle & shared gesture flags (declared before async builders & mode init to prevent TDZ)
    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;
    let renderBusy = false;
    let renderDirty = false;
    let needsRender = true;
    let twoFingerActive = false;

    // Build terrain, roads, flagship 3D shop, and 360 panorama dome
    const roads = buildTerrainAndRoads(scene, maxAnisotropy, [initSx, initSz], () => {
      needsRender = true;
      requestRender();
    });
    const shop = buildShopModel(
      scene,
      [initSx, initSz],
      maxAnisotropy,
      isSoftwareGl,
      () => {
        needsRender = true;
        requestRender();
      },
      stateRef.current.monitorPreview,
    );
    const pano = buildPanoDome(scene, [initSx, initSz], maxAnisotropy, () => {
      needsRender = true;
      requestRender();
    });

    // Enable raycaster layer 1 for interactive shop products
    _hoverRay.layers.set(1);

    // Damped OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.075;
    controls.screenSpacePanning = false;
    controls.rotateSpeed = 0.72;
    controls.zoomSpeed = 0.9;
    controls.panSpeed = 0.85;

    // Initial high-altitude entry pose that glides cleanly onto the full Hussain Khan Wala map
    camera.position.set(2, 185, 28);
    controls.target.set(2, 0, 6);
    controls.update();

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Animation & mode transition state
    let currentMode: ViewMode = stateRef.current.viewMode;
    let currentShopUv: [number, number] = [...stateRef.current.shopUv];
    let currentMonitorPreview = stateRef.current.monitorPreview;
    let shutterVal = 0;
    let panoOpacityVal = currentMode === 'pano' ? 1 : 0;
    let roadRevealVal = 0;
    let fovTarget = baseMapFov;
    let transitionActive = true;
    let shutterOpened = false;
    let hoveringShutter = false;
    let pointerMovedInShop = false;
    let lastPointerType = 'mouse';
    let isMap3D = false;
    let insideShop = false;
    let exitScrollAccum = 0;
    let monitorApproach = 0;
    let moreZoomAccum = 0;
    let pinchMoreAccum = 0;
    let canEnterOnPinch = false;
    let monitorArrivalTime = 0;
    let enteringWebsite = false;
    let enterTimer: number | null = null;
    let hoveringMonitor = false;
    let pointerScreenX = -999;
    let pointerScreenY = -999;
    let lastHoverCheck = 0;
    let hoveredItem: InteractiveShopItem | null = null;
    let pointerDownPos: [number, number] | null = null;

    function getMonitorPose(outCenter: THREE.Vector3, outNormal: THREE.Vector3) {
      shop.monitorScreen.updateWorldMatrix(true, false);
      shop.monitorScreen.getWorldPosition(outCenter);
      shop.monitorScreen.getWorldQuaternion(_quat);
      outNormal.set(0, 0, 1).applyQuaternion(_quat).normalize();
    }

    function isAimingAtMonitor(ndcVec: THREE.Vector2): boolean {
      _raycaster.setFromCamera(ndcVec, camera);
      if (_raycaster.intersectObject(shop.monitorHitTarget, false).length > 0) {
        return true;
      }
      getMonitorPose(_monCenter, _monNormal);
      _v3.copy(_monCenter).project(camera);
      if (_v3.z <= -1 || _v3.z >= 1) return false;
      return Math.hypot(_v3.x - ndcVec.x, _v3.y - ndcVec.y) < 0.34;
    }

    function isLookingTowardMonitor(): boolean {
      getMonitorPose(_monCenter, _monNormal);
      camera.getWorldDirection(_camForward);
      _toMonitor.copy(_monCenter).sub(camera.position).normalize();
      return _camForward.dot(_toMonitor) > 0.56;
    }

    function applyMonitorApproachGoals(progress: number) {
      const [sx, sz] = uvToWorld(currentShopUv);
      const standX = sx - 0.92;
      const standY = 1.56;
      const standZ = sz + 0.55;
      getMonitorPose(_monCenter, _monNormal);
      _toMonitor.copy(_monCenter).sub(_standTarget.set(standX, standY, standZ)).normalize();
      _standCam.copy(_standTarget).addScaledVector(_toMonitor, -0.08);

      const portrait = camera.aspect < 1;
      const baseFov = portrait ? 72 : 64;

      if (progress > 0.001) {
        const ease = THREE.MathUtils.smoothstep(progress, 0, 1);
        _targetGoal.lerpVectors(_standTarget, _monCenter, ease);
        _v3.copy(_monCenter).addScaledVector(_monNormal, portrait ? 0.78 : 0.56);
        _camGoal.lerpVectors(_standCam, _v3, ease);
        fovTarget = THREE.MathUtils.lerp(baseFov, portrait ? 48 : 42, ease);
        controls.enableRotate = false;
        controls.minDistance = 0.05;
        controls.maxDistance = 5.0;
      } else {
        _targetGoal.copy(_standTarget);
        _camGoal.copy(_standCam);
        fovTarget = baseFov;
        controls.enableRotate = true;
        controls.minDistance = 0.06;
        controls.maxDistance = 0.1;
      }

      transitionActive = true;
      needsRender = true;
      requestRender();
    }

    function triggerEnterHomeFromMonitor() {
      if (enteringWebsite || disposed) return;
      enteringWebsite = true;
      monitorApproach = 1;
      moreZoomAccum = 0;
      pinchMoreAccum = 0;
      canEnterOnPinch = false;
      twoFingerActive = false;
      controls.enabled = false;
      setShutterOpenedState(true);

      if (hoveredItem || hoveringMonitor) {
        hoveredItem = null;
        hoveringMonitor = false;
        stateRef.current.onHoveredItemChange(null);
      }

      stateRef.current.onStartEnterWebsiteFromMonitor?.();

      getMonitorPose(_monCenter, _monNormal);
      _targetGoal.copy(_monCenter);
      _camGoal.copy(_monCenter).addScaledVector(_monNormal, 0.25);
      fovTarget = 30;
      transitionActive = true;
      needsRender = true;
      requestRender();

      if (enterTimer !== null) {
        window.clearTimeout(enterTimer);
      }
      enterTimer = window.setTimeout(() => {
        enterTimer = null;
        if (!disposed) {
          stateRef.current.onEnterWebsiteFromMonitor?.();
        }
      }, 300);
    }

    function setShutterOpenedState(opened: boolean) {
      if (shutterOpened === opened) return;
      shutterOpened = opened;
      stateRef.current.onShutterOpenChange?.(opened);
      needsRender = true;
      requestRender();
    }

    function setInsideShopState(inside: boolean) {
      if (insideShop === inside) return;
      insideShop = inside;
      exitScrollAccum = 0;
      monitorApproach = 0;
      moreZoomAccum = 0;
      pinchMoreAccum = 0;
      canEnterOnPinch = false;
      monitorArrivalTime = 0;
      stateRef.current.onInsideShopChange?.(inside);
      needsRender = true;
      requestRender();
    }

    function configureExteriorControls(mode: ViewMode) {
      if (mode === 'map') {
        controls.enablePan = true;
        // Wheel zoom in Aerial Map mode is handled by our cursor-anchored onWheel handler (like Google Maps)
        controls.enableZoom = false;
        controls.zoomToCursor = true;
        controls.minDistance = 7;
        controls.maxDistance = 220;
        controls.minPolarAngle = 0.04;
        controls.maxPolarAngle = Math.PI * 0.46;
        controls.minAzimuthAngle = -Infinity;
        controls.maxAzimuthAngle = Infinity;
        controls.rotateSpeed = 0.72;
        controls.touches = {
          ONE: THREE.TOUCH.PAN,
          TWO: THREE.TOUCH.DOLLY_PAN,
        };
      } else if (mode === 'shop') {
        controls.enablePan = true;
        // Wheel zoom in 3D Shop mode is handled smoothly by onWheel so zooming in walks directly inside without crossing walls
        controls.enableZoom = false;
        controls.zoomToCursor = true;
        controls.minDistance = 4.2;
        controls.maxDistance = 18;
        controls.minPolarAngle = 0.24;
        controls.maxPolarAngle = Math.PI * 0.485;
        controls.minAzimuthAngle = -Math.PI * 0.9;
        controls.maxAzimuthAngle = -Math.PI * 0.1;
        controls.rotateSpeed = 0.68;
        controls.touches = {
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        };
      }
    }

    // Smoothly glides the camera inside the realistic 3D shop interior for wall-proof 360° look-around!
    function enterShopInterior() {
      if (insideShop || currentMode === 'pano') return;
      const [sx, sz] = uvToWorld(currentShopUv);
      const portrait = camera.aspect < 1;

      twoFingerActive = false;
      controls.enabled = true;
      setShutterOpenedState(true);
      setInsideShopState(true);

      // Stand centered in the open cement customer floor pocket (>1.2m clear of every wall & counter)
      // Shop local (+0.55, 1.56, +0.92) -> World (sx - 0.92, 1.56, sz + 0.55)
      const standX = sx - 0.92;
      const standY = 1.56;
      const standZ = sz + 0.55;
      _targetGoal.set(standX, standY, standZ);
      // Tiny 0.08m orbit radius framing both the repair chair and the left-side marble counter with PC monitor!
      _camGoal.set(standX - 0.028, standY + 0.005, standZ + 0.075);

      fovTarget = portrait ? 72 : 64;
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.enableRotate = true;
      controls.minDistance = 0.06;
      controls.maxDistance = 0.1;
      controls.minPolarAngle = 0.3;
      controls.maxPolarAngle = Math.PI - 0.3;
      controls.minAzimuthAngle = -Infinity;
      controls.maxAzimuthAngle = Infinity;
      controls.rotateSpeed = -0.45;
      controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      };

      transitionActive = true;
      needsRender = true;
      requestRender();
    }

    // Smoothly steps back outside through the open doorway onto Main Bazar right in front of the shop
    function exitShopInterior() {
      if (!insideShop || enteringWebsite) return;
      const [sx, sz] = uvToWorld(currentShopUv);
      const portrait = camera.aspect < 1;

      twoFingerActive = false;
      monitorApproach = 0;
      moreZoomAccum = 0;
      pinchMoreAccum = 0;
      canEnterOnPinch = false;
      monitorArrivalTime = 0;
      controls.enableRotate = true;
      controls.enabled = true;
      setInsideShopState(false);

      // Position outside facing the storefront verandah & open doorway
      if (currentMode === 'map') {
        _camGoal.set(sx - 12.2, 3.2, sz + 1.4);
        _targetGoal.set(sx, 1.4, sz);
        fovTarget = portrait ? 56 : 38;
      } else {
        _camGoal.set(sx - 8.4, 2.55, sz + 1.25);
        _targetGoal.set(sx + 0.35, 1.65, sz);
        fovTarget = portrait ? 56 : 44;
      }
      configureExteriorControls(currentMode);

      transitionActive = true;
      needsRender = true;
      requestRender();
    }

    function applyModeGoals(mode: ViewMode, animateTransition = true) {
      twoFingerActive = false;
      monitorApproach = 0;
      moreZoomAccum = 0;
      pinchMoreAccum = 0;
      canEnterOnPinch = false;
      monitorArrivalTime = 0;
      enteringWebsite = false;
      controls.enableRotate = true;
      controls.enabled = true;
      setInsideShopState(false);
      const [sx, sz] = uvToWorld(currentShopUv);
      const portrait = camera.aspect < 1;

      if (mode === 'map') {
        setShutterOpenedState(false);
        hoveringShutter = false;
        pointerMovedInShop = false;
        // Frame the full village map from north fields down to Masjid Chowk without cropping
        _camGoal.set(2, portrait ? 178 : 156, 26);
        _targetGoal.set(2, 0, 9);
        fovTarget = portrait ? 56 : 38;
        configureExteriorControls('map');
      } else if (mode === 'shop') {
        setShutterOpenedState(false);
        hoveringShutter = false;
        pointerMovedInShop = false;
        // Arrive at a cinematic hero angle in front of Usman Mobile on Main Bazar (-X side) showing full 3D architectural depth
        _camGoal.set(sx - 8.4, 2.55, sz + 1.25);
        _targetGoal.set(sx + 0.35, 1.65, sz);
        fovTarget = portrait ? 56 : 44;
        configureExteriorControls('shop');
      } else {
        // 'pano' mode: center camera inside curved interior sphere
        setShutterOpenedState(true);
        _camGoal.set(sx, 1.6, sz + 0.05);
        _targetGoal.set(sx, 1.6, sz);
        fovTarget = portrait ? 78 : 68;
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.minDistance = 0.04;
        controls.maxDistance = 0.06;
        controls.minPolarAngle = Math.PI * 0.5 - 0.36;
        controls.maxPolarAngle = Math.PI * 0.5 + 0.36;
        controls.minAzimuthAngle = -0.95;
        controls.maxAzimuthAngle = 0.95;
        controls.rotateSpeed = -0.42;
        controls.touches = {
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        };
      }

      if (animateTransition) {
        transitionActive = true;
        needsRender = true;
      } else {
        camera.position.copy(_camGoal);
        controls.target.copy(_targetGoal);
        camera.fov = fovTarget;
        camera.updateProjectionMatrix();
        controls.update();
      }
    }

    applyModeGoals(currentMode, currentMode === 'map');

    const onControlsStart = () => {
      // Cancel scripted transition immediately when user manually orbits/pans/zooms
      transitionActive = false;
    };
    const onControlsChange = () => {
      needsRender = true;
      if (isSoftwareGl) requestRender();
    };
    controls.addEventListener('start', onControlsStart);
    controls.addEventListener('change', onControlsChange);

    // Sync React prop updates into the Three.js scene
    triggerSyncRef.current = () => {
      const next = stateRef.current;
      if (next.viewMode !== currentMode) {
        currentMode = next.viewMode;
        applyModeGoals(currentMode, true);
        if (currentMode !== 'shop' && hoveredItem) {
          hoveredItem = null;
          next.onHoveredItemChange(null);
        }
      }
      if (
        next.shopUv[0] !== currentShopUv[0] ||
        next.shopUv[1] !== currentShopUv[1]
      ) {
        currentShopUv = [...next.shopUv];
        const [sx, sz] = uvToWorld(currentShopUv);
        shop.shopGroup.position.set(sx, 0, sz);
        pano.panoGroup.position.set(sx, 1.6, sz);
        roads.beaconRing.position.set(sx, 0.08, sz);
        sunLight.position.set(sx - 18, 30, sz + 15);
        sunLight.target.position.set(sx, 0, sz);
        applyModeGoals(currentMode, true);
      }
      if (next.monitorPreview && next.monitorPreview !== currentMonitorPreview) {
        currentMonitorPreview = next.monitorPreview;
        shop.updateMonitorPreview(next.monitorPreview);
      }
      pano.setActiveImage(next.panoTab);
      needsRender = true;
      requestRender();
    };

    // Smooth one-tap 2D <-> 3D camera tilt toggle for Aerial Map (just like Apple Maps / Google Maps)
    if (toggleMapTiltRef) {
      toggleMapTiltRef.current = () => {
        if (currentMode !== 'map' || insideShop) return;
        const [sx, sz] = uvToWorld(currentShopUv);
        _offset.copy(camera.position).sub(controls.target);
        _spherical.setFromVector3(_offset);
        if (_spherical.phi < 0.5) {
          // Tilt smoothly into 3D perspective facing the 3D shop & village roads
          _targetGoal.set(
            THREE.MathUtils.lerp(controls.target.x, sx, 0.55),
            0,
            THREE.MathUtils.lerp(controls.target.z, sz, 0.55),
          );
          _spherical.phi = 1.08;
          _spherical.radius = THREE.MathUtils.clamp(_spherical.radius * 0.62, 24, 92);
          _offset.setFromSpherical(_spherical);
          _camGoal.copy(_targetGoal).add(_offset);
        } else {
          // Flatten smoothly back to 2D top-down aerial map
          _targetGoal.copy(controls.target);
          _targetGoal.y = 0;
          _spherical.phi = 0.08;
          _spherical.radius = THREE.MathUtils.clamp(_spherical.radius * 1.25, 45, 165);
          _offset.setFromSpherical(_spherical);
          _camGoal.copy(_targetGoal).add(_offset);
        }
        transitionActive = true;
        needsRender = true;
        requestRender();
      };
    }

    if (exitShopRef) {
      exitShopRef.current = () => {
        exitShopInterior();
      };
    }

    if (enterShopRef) {
      enterShopRef.current = () => {
        enterShopInterior();
      };
    }

    // Apple Maps / Google Maps native 2-finger gesture engine in Aerial Map mode:
    // - 1 finger drag: smooth XZ ground pan (via OrbitControls TOUCH.PAN)
    // - 2 fingers pinch: smooth zoom
    // - 2 fingers drag UP/DOWN: tilt seamlessly between 2D top-down & 3D perspective
    // - 2 fingers twist: rotate map heading around focal point
    let prevTouch0Y = 0;
    let prevTouch1Y = 0;
    let prevTouchDist = 0;
    let prevTouchAngle = 0;
    let prevMidX = 0;
    let prevMidY = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (currentMode === 'pano' || stateRef.current.editPinMode) return;
      if (e.touches.length === 2) {
        e.preventDefault();
        transitionActive = false;
        twoFingerActive = true;
        controls.enabled = false;
        pinchMoreAccum = 0;
        canEnterOnPinch = insideShop && monitorApproach >= 0.96;
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        prevTouch0Y = t0.clientY;
        prevTouch1Y = t1.clientY;
        prevTouchDist = Math.max(10, Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY));
        prevTouchAngle = Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);
        prevMidX = (t0.clientX + t1.clientX) * 0.5;
        prevMidY = (t0.clientY + t1.clientY) * 0.5;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!twoFingerActive || currentMode === 'pano') return;
      if (e.touches.length !== 2) return;
      e.preventDefault();

      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const curDist = Math.max(10, Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY));
      const curAngle = Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);
      const curMidX = (t0.clientX + t1.clientX) * 0.5;
      const curMidY = (t0.clientY + t1.clientY) * 0.5;
      const distRatio = curDist / Math.max(10, prevTouchDist);

      // Inside shop: first 2-finger pinch smoothly zooms up to inspect the counter monitor;
      // only a subsequent pinch-in (once already close) or direct monitor tap enters the Home Page!
      if (insideShop) {
        if (enteringWebsite) return;
        if (Math.abs(distRatio - 1) > 0.002) {
          const facingMonitor = isLookingTowardMonitor();
          if (distRatio > 1.002 && (facingMonitor || monitorApproach > 0)) {
            if (monitorApproach < 0.995) {
              const prevApproach = monitorApproach;
              monitorApproach = THREE.MathUtils.clamp(
                monitorApproach + (distRatio - 1) * 1.15,
                0,
                1,
              );
              pinchMoreAccum = 0;
              if (prevApproach < 0.995 && monitorApproach >= 0.995) {
                monitorArrivalTime = performance.now();
              }
              applyMonitorApproachGoals(monitorApproach);
            } else if (canEnterOnPinch || performance.now() - monitorArrivalTime > 450) {
              pinchMoreAccum += (distRatio - 1) * 1.25;
              if (pinchMoreAccum >= 0.16) {
                triggerEnterHomeFromMonitor();
                return;
              }
            }
          } else if (distRatio < 0.997 && monitorApproach > 0) {
            pinchMoreAccum = 0;
            canEnterOnPinch = false;
            monitorApproach = THREE.MathUtils.clamp(
              monitorApproach - (1 - distRatio) * 1.35,
              0,
              1,
            );
            applyMonitorApproachGoals(monitorApproach);
          } else {
            pinchMoreAccum = 0;
            const nextFov = THREE.MathUtils.clamp(fovTarget / distRatio, 30, 74);
            if (distRatio < 0.992 && fovTarget >= 72.5 && monitorApproach <= 0.01) {
              twoFingerActive = false;
              controls.enabled = true;
              exitShopInterior();
              return;
            }
            fovTarget = nextFov;
            camera.fov = nextFov;
            camera.updateProjectionMatrix();
          }
        }
        prevTouch0Y = t0.clientY;
        prevTouch1Y = t1.clientY;
        prevTouchDist = curDist;
        prevTouchAngle = curAngle;
        prevMidX = curMidX;
        prevMidY = curMidY;
        needsRender = true;
        requestRender();
        return;
      }

      const [sx, sz] = uvToWorld(currentShopUv);
      const camDistToShop = Math.hypot(
        camera.position.x - sx,
        camera.position.y - 1.5,
        camera.position.z - sz,
      );

      // Exterior 3D Shop mode: 2-finger pinch zooms smoothly and automatically glides inside when close
      if (currentMode === 'shop') {
        _offset.copy(camera.position).sub(controls.target);
        _spherical.setFromVector3(_offset);
        if (distRatio > 1.015 && _spherical.radius < 5.6) {
          twoFingerActive = false;
          controls.enabled = true;
          enterShopInterior();
          return;
        }
        if (Math.abs(distRatio - 1) > 0.002) {
          _spherical.radius = THREE.MathUtils.clamp(
            _spherical.radius / distRatio,
            controls.minDistance,
            controls.maxDistance,
          );
          _offset.setFromSpherical(_spherical);
          camera.position.copy(controls.target).add(_offset);
          camera.lookAt(controls.target);
        }
        prevTouch0Y = t0.clientY;
        prevTouch1Y = t1.clientY;
        prevTouchDist = curDist;
        prevTouchAngle = curAngle;
        prevMidX = curMidX;
        prevMidY = curMidY;
        needsRender = true;
        requestRender();
        return;
      }

      const dy0 = t0.clientY - prevTouch0Y;
      const dy1 = t1.clientY - prevTouch1Y;
      const dMidX = curMidX - prevMidX;
      const dMidY = curMidY - prevMidY;

      let dAngle = curAngle - prevTouchAngle;
      if (dAngle > Math.PI) dAngle -= Math.PI * 2;
      if (dAngle < -Math.PI) dAngle += Math.PI * 2;

      _offset.copy(camera.position).sub(controls.target);
      _spherical.setFromVector3(_offset);

      // Auto-enter shop when pinching IN close to the shop in Map mode!
      const targetDistToShop = Math.hypot(controls.target.x - sx, controls.target.z - sz);
      if (distRatio > 1.015 && camDistToShop < 16 && targetDistToShop < 7.5) {
        setShutterOpenedState(true);
        if (camDistToShop < 11.2 || _spherical.radius <= controls.minDistance + 1.2) {
          twoFingerActive = false;
          controls.enabled = true;
          enterShopInterior();
          return;
        }
      }

      // 1. Pinch zoom
      if (Math.abs(distRatio - 1) > 0.002) {
        _spherical.radius = THREE.MathUtils.clamp(
          _spherical.radius / distRatio,
          controls.minDistance,
          controls.maxDistance,
        );
      }

      // 2. Parallel 2-finger vertical slide -> smooth 2D <-> 3D tilt
      const parallelVertical =
        dy0 * dy1 > 0 &&
        Math.abs(dMidY) > 0.5 &&
        Math.abs(dMidY) >= Math.abs(dMidX) * 0.65;
      if (parallelVertical) {
        // Drag 2 fingers UP (dMidY < 0) tilts into 3D; drag 2 fingers DOWN flattens to 2D
        _spherical.phi = THREE.MathUtils.clamp(
          _spherical.phi - dMidY * 0.0062,
          controls.minPolarAngle,
          controls.maxPolarAngle,
        );
      }

      // 3. 2-finger twist -> rotate map compass heading
      if (Math.abs(dAngle) > 0.002 && curDist > 42) {
        _spherical.theta -= dAngle * 0.95;
      }

      // 4. Gentle horizontal midpoint pan when not purely tilting vertically
      if (!parallelVertical && (Math.abs(dMidX) > 0.4 || Math.abs(dMidY) > 0.4)) {
        const panScale =
          (2 * _spherical.radius * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5))) /
          Math.max(1, curH);
        _panRight.set(Math.cos(_spherical.theta), 0, -Math.sin(_spherical.theta));
        _panForward.set(-Math.sin(_spherical.theta), 0, -Math.cos(_spherical.theta));
        controls.target.addScaledVector(_panRight, -dMidX * panScale * 0.65);
        controls.target.addScaledVector(_panForward, dMidY * panScale * 0.65);
        const halfW = SHOP_CONFIG.MAP_W * 0.44;
        const halfH = SHOP_CONFIG.MAP_H * 0.44;
        controls.target.x = THREE.MathUtils.clamp(controls.target.x, -halfW, halfW);
        controls.target.z = THREE.MathUtils.clamp(controls.target.z, -halfH, halfH);
      }

      _offset.setFromSpherical(_spherical);
      camera.position.copy(controls.target).add(_offset);
      camera.lookAt(controls.target);

      prevTouch0Y = t0.clientY;
      prevTouch1Y = t1.clientY;
      prevTouchDist = curDist;
      prevTouchAngle = curAngle;
      prevMidX = curMidX;
      prevMidY = curMidY;

      needsRender = true;
      requestRender();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (twoFingerActive && e.touches.length === 0) {
        twoFingerActive = false;
        controls.enabled = true;
        controls.update();
        needsRender = true;
        requestRender();
      }
    };

    // Pointer interactions: hover raycasting, pin repositioning, shutter open, item WhatsApp click
    const onPointerMove = (e: PointerEvent) => {
      lastPointerType = e.pointerType || 'mouse';
      const rect = renderer.domElement.getBoundingClientRect();
      pointerScreenX = e.clientX - rect.left;
      pointerScreenY = e.clientY - rect.top;
      _ndc.set(
        (pointerScreenX / Math.max(1, rect.width)) * 2 - 1,
        -(pointerScreenY / Math.max(1, rect.height)) * 2 + 1,
      );

      if (currentMode === 'shop') {
        pointerMovedInShop = true;
        if (isSoftwareGl) {
          needsRender = true;
          requestRender();
        }
      }

      // Update ground halo in map mode
      if (currentMode === 'map') {
        _raycaster.setFromCamera(_ndc, camera);
        if (_raycaster.ray.intersectPlane(_groundPlane, _groundHit)) {
          roads.cursorHalo.position.set(_groundHit.x, 0.14, _groundHit.z);
          needsRender = true;
          if (isSoftwareGl) requestRender();
        }
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      lastPointerType = e.pointerType || 'mouse';
      pointerDownPos = [e.clientX, e.clientY];
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!pointerDownPos) return;
      const dist = Math.hypot(
        e.clientX - pointerDownPos[0],
        e.clientY - pointerDownPos[1],
      );
      pointerDownPos = null;
      const tapThreshold = e.pointerType === 'touch' ? 12 : 6;
      if (dist > tapThreshold) return; // Was a drag/orbit/pan, not a tap or click

      const rect = renderer.domElement.getBoundingClientRect();
      _ndc.set(
        ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1,
        -((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1,
      );

      if (insideShop) {
        _raycaster.setFromCamera(_ndc, camera);
        if (_raycaster.intersectObject(shop.monitorHitTarget, false).length > 0) {
          triggerEnterHomeFromMonitor();
          return;
        }
      }

      if (currentMode === 'map' && stateRef.current.editPinMode) {
        _raycaster.setFromCamera(_ndc, camera);
        if (_raycaster.ray.intersectPlane(_groundPlane, _groundHit)) {
          const nextUv = worldToUv(_groundHit.x, _groundHit.z);
          stateRef.current.onShopUvChange(nextUv);
        }
        return;
      }

      // Allow tapping/clicking the shutter directly in BOTH 3D Shop mode AND Aerial Map mode!
      if (currentMode === 'shop' || currentMode === 'map') {
        if (!shutterOpened) {
          _raycaster.setFromCamera(_ndc, camera);
          if (_raycaster.intersectObject(shop.shutterHitTarget, false).length > 0) {
            setShutterOpenedState(true);
            return;
          }
        }
        if (shutterVal > 0.82) {
          _raycaster.setFromCamera(_ndc, camera);
          if (_raycaster.intersectObject(shop.monitorHitTarget, false).length > 0) {
            triggerEnterHomeFromMonitor();
            return;
          }
          _hoverRay.setFromCamera(_ndc, camera);
          const hits = _hoverRay.intersectObjects(shop.interactiveItems, false);
          if (hits.length > 0) {
            const hitMesh = hits[0].object as InteractiveShopItem;
            stateRef.current.onItemClick(hitMesh.userData.itemType);
          }
        }
      }
    };

    const onPointerLeave = () => {
      pointerScreenX = -999;
      pointerScreenY = -999;
      if (hoveredItem) {
        hoveredItem = null;
        stateRef.current.onHoveredItemChange(null);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (insideShop) {
          exitShopInterior();
        } else if (stateRef.current.viewMode === 'pano') {
          stateRef.current.onModeChange('shop');
        } else if (stateRef.current.viewMode === 'shop') {
          stateRef.current.onModeChange('map');
        }
      }
    };

    // Unified wheel zoom handler:
    // - Inside Shop: wall-proof optical FOV zoom (30°..74°), never crosses any wall; scrolling out past wide-angle steps smoothly outside
    // - Aerial Map: Google Maps-style cursor-anchored ground zoom; zooming in right in front of the shop automatically opens shutter/door and walks inside!
    // - 3D Shop Exterior: smooth dolly zoom that automatically glides inside when zooming in past the verandah
    const onWheel = (e: WheelEvent) => {
      if (currentMode === 'pano') return;
      e.preventDefault();

      const rawDelta =
        e.deltaMode === 1
          ? e.deltaY * 18
          : e.deltaMode === 2
            ? e.deltaY * 120
            : e.deltaY;
      const clampedDelta = THREE.MathUtils.clamp(rawDelta, -180, 180);

      // 1. INSIDE THE SHOP:
      // - When cursor is over/near the PC monitor: zoom moves camera right up close to the screen, then more zoom enters Home Page smoothly!
      // - Elsewhere inside shop: wall-proof optical FOV zoom, scrolling out past 73° exits back onto Main Bazar
      if (insideShop) {
        if (enteringWebsite) return;

        const rect = renderer.domElement.getBoundingClientRect();
        pointerScreenX = e.clientX - rect.left;
        pointerScreenY = e.clientY - rect.top;
        _ndc.set(
          (pointerScreenX / Math.max(1, rect.width)) * 2 - 1,
          -(pointerScreenY / Math.max(1, rect.height)) * 2 + 1,
        );

        const targetingMonitor = monitorApproach > 0 || isAimingAtMonitor(_ndc);

        if (clampedDelta < 0 && targetingMonitor) {
          exitScrollAccum = 0;
          if (monitorApproach < 0.995) {
            const prevApproach = monitorApproach;
            monitorApproach = Math.min(1, monitorApproach + (-clampedDelta) * 0.0036);
            moreZoomAccum = 0;
            if (prevApproach < 0.995 && monitorApproach >= 0.995) {
              monitorArrivalTime = performance.now();
            }
            applyMonitorApproachGoals(monitorApproach);
          } else if (performance.now() - monitorArrivalTime > 420) {
            moreZoomAccum += -clampedDelta;
            if (moreZoomAccum >= 75) {
              triggerEnterHomeFromMonitor();
            }
          }
          return;
        }

        if (clampedDelta > 0 && monitorApproach > 0) {
          moreZoomAccum = 0;
          monitorApproach = Math.max(0, monitorApproach - clampedDelta * 0.0042);
          applyMonitorApproachGoals(monitorApproach);
          return;
        }

        moreZoomAccum = 0;
        if (clampedDelta > 0 && fovTarget >= 72.5) {
          exitScrollAccum += clampedDelta;
          if (exitScrollAccum >= 95) {
            exitShopInterior();
          }
        } else {
          exitScrollAccum = 0;
          fovTarget = THREE.MathUtils.clamp(fovTarget + clampedDelta * 0.048, 30, 74);
          needsRender = true;
          requestRender();
        }
        return;
      }

      transitionActive = false;
      const rect = renderer.domElement.getBoundingClientRect();
      pointerScreenX = e.clientX - rect.left;
      pointerScreenY = e.clientY - rect.top;
      _ndc.set(
        (pointerScreenX / Math.max(1, rect.width)) * 2 - 1,
        -(pointerScreenY / Math.max(1, rect.height)) * 2 + 1,
      );

      const [sx, sz] = uvToWorld(currentShopUv);
      const camDistToShop = Math.hypot(
        camera.position.x - sx,
        camera.position.y - 1.5,
        camera.position.z - sz,
      );

      // 2. 3D SHOP EXTERIOR MODE: smooth dolly zoom + automatic walk-inside (and seamless zoom-out back to 3D village map on PC!)
      if (currentMode === 'shop') {
        _offset.copy(camera.position).sub(controls.target);
        const curDist = _offset.length();
        const zoomFactor = Math.exp(clampedDelta * 0.0018);

        if (clampedDelta < 0 && curDist <= 5.4) {
          enterShopInterior();
          return;
        }
        if (clampedDelta < 0 && curDist < 7.8) {
          setShutterOpenedState(true);
        }

        const isDesktop = window.innerWidth >= 768;
        if (clampedDelta > 0 && isDesktop && curDist * zoomFactor >= 15.5) {
          // Seamlessly unlock into 3D Village Map mode while keeping the 3D perspective tilt
          currentMode = 'map';
          setShutterOpenedState(false);
          hoveringShutter = false;
          pointerMovedInShop = false;
          configureExteriorControls('map');
          stateRef.current.onModeChange('map');

          controls.target.y = 0;
          _offset.copy(camera.position).sub(controls.target);
          _spherical.setFromVector3(_offset);
          _spherical.radius = THREE.MathUtils.clamp(
            Math.max(curDist * zoomFactor, 20),
            controls.minDistance,
            controls.maxDistance,
          );
          _spherical.phi = THREE.MathUtils.clamp(_spherical.phi, 0.55, Math.PI * 0.42);
          _offset.setFromSpherical(_spherical);
          camera.position.copy(controls.target).add(_offset);
          camera.lookAt(controls.target);
          controls.update();
          needsRender = true;
          requestRender();
          return;
        }

        const nextDist = THREE.MathUtils.clamp(
          curDist * zoomFactor,
          controls.minDistance,
          controls.maxDistance,
        );
        _offset.setLength(nextDist);
        camera.position.copy(controls.target).add(_offset);
        camera.lookAt(controls.target);
        controls.update();
        needsRender = true;
        requestRender();
        return;
      }

      // 3. AERIAL MAP MODE: cursor-anchored Google Maps zoom + automatic walk-inside when zooming into the shop!
      _raycaster.setFromCamera(_ndc, camera);
      const hitShopDirect =
        camDistToShop < 26 && _raycaster.intersectObject(shop.shopGroup, true).length > 0;
      const hitGround = _raycaster.ray.intersectPlane(_groundPlane, _groundHit);
      if (hitGround) {
        const maxAnchorW = SHOP_CONFIG.MAP_W * 0.56;
        const maxAnchorH = SHOP_CONFIG.MAP_H * 0.56;
        _groundHit.x = THREE.MathUtils.clamp(_groundHit.x, -maxAnchorW, maxAnchorW);
        _groundHit.z = THREE.MathUtils.clamp(_groundHit.z, -maxAnchorH, maxAnchorH);
        _groundHit.y = 0;
      } else {
        _groundHit.copy(controls.target);
        _groundHit.y = 0;
      }

      const cursorDistToShop = Math.hypot(_groundHit.x - sx, _groundHit.z - sz);
      const targetDistToShop = Math.hypot(controls.target.x - sx, controls.target.z - sz);
      const aimingAtShop = hitShopDirect || cursorDistToShop < 6.8 || targetDistToShop < 5.5;

      // Auto-open shutter as user zooms close to the shop in Map mode
      if (clampedDelta < 0 && aimingAtShop && camDistToShop < 17) {
        setShutterOpenedState(true);
      }

      const zoomFactor = Math.exp(clampedDelta * 0.0018);
      _offset.copy(camera.position).sub(controls.target);
      const curDist = _offset.length();

      // Seamless automatic entry into the 3D shop interior without needing to press the "3D Shop" button!
      if (clampedDelta < 0 && aimingAtShop && (camDistToShop < 12.2 || curDist * zoomFactor < 9.2)) {
        enterShopInterior();
        return;
      }

      const nextDist = THREE.MathUtils.clamp(
        curDist * zoomFactor,
        controls.minDistance,
        controls.maxDistance,
      );
      const actualScale = nextDist / Math.max(0.0001, curDist);
      if (Math.abs(actualScale - 1) < 0.0001) return;

      // Scale both camera and target radially toward the cursor's ground point
      camera.position.sub(_groundHit).multiplyScalar(actualScale).add(_groundHit);
      controls.target.sub(_groundHit).multiplyScalar(actualScale).add(_groundHit);
      controls.target.y = 0;

      // Keep map target inside bounds without shifting camera orientation
      const halfW = SHOP_CONFIG.MAP_W * 0.46;
      const halfH = SHOP_CONFIG.MAP_H * 0.46;
      const clampedX = THREE.MathUtils.clamp(controls.target.x, -halfW, halfW);
      const clampedZ = THREE.MathUtils.clamp(controls.target.z, -halfH, halfH);
      const dx = clampedX - controls.target.x;
      const dz = clampedZ - controls.target.z;
      if (dx !== 0 || dz !== 0) {
        controls.target.x = clampedX;
        controls.target.z = clampedZ;
        camera.position.x += dx;
        camera.position.z += dz;
      }

      camera.lookAt(controls.target);
      controls.update();
      roads.cursorHalo.position.set(_groundHit.x, 0.14, _groundHit.z);
      needsRender = true;
      requestRender();
    };

    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', onTouchEnd);
    renderer.domElement.addEventListener('touchcancel', onTouchEnd);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('keydown', onKeyDown);

    // WebGL context loss / restore handling
    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
      needsRender = true;
      requestRender();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    // ResizeObserver for crisp responsive framing
    let curW = width;
    let curH = height;
    let curDpr = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    const syncViewportSize = () => {
      const nw = Math.max(1, container.clientWidth || window.innerWidth);
      const nh = Math.max(1, container.clientHeight || window.innerHeight);
      const ndpr = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      if (nw === curW && nh === curH && ndpr === curDpr) return;
      curW = nw;
      curH = nh;
      curDpr = ndpr;
      camera.aspect = nw / Math.max(1, nh);
      if (insideShop) fovTarget = camera.aspect < 1 ? 72 : 64;
      else if (currentMode === 'map') fovTarget = camera.aspect < 1 ? 56 : 38;
      else if (currentMode === 'shop') fovTarget = camera.aspect < 1 ? 56 : 44;
      else fovTarget = camera.aspect < 1 ? 78 : 68;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(ndpr);
      renderer.setSize(nw, nh, false);
      needsRender = true;
      requestRender();
    };
    const resizeObserver = new ResizeObserver(syncViewportSize);
    resizeObserver.observe(container);
    window.addEventListener('resize', syncViewportSize);

    // Frame pacing & software WebGL coalesced rendering helpers

    function updateDomProjections(
      shutterOpen: number,
      panoVal: number,
      roadAlpha: number,
      camDistToShop: number,
    ) {
      const overlays = overlayDomRef.current;
      const [sx, sz] = uvToWorld(currentShopUv);
      const [, , SH] = SHOP_CONFIG.SHOP_SIZE;
      const hidePinAtCloseRange = insideShop || camDistToShop < 24 || shutterOpen > 0.12;

      // 1. Yellow Map Pin (auto-hides when user zooms close to the 3D shop or opens shutter)
      if (overlays.pinEl) {
        const [px, py, inFront] = projectToScreen(sx, SH + 1.2, sz, camera, curW, curH);
        const visible = currentMode === 'map' && !insideShop && inFront && !hidePinAtCloseRange;
        overlays.pinEl.style.transform = `translate3d(${px}px, ${py}px, 0)`;
        overlays.pinEl.style.opacity = visible ? '1' : '0';
        overlays.pinEl.style.pointerEvents = visible ? 'auto' : 'none';
      }

      // 2. Road & Chowk Labels
      ROAD_LABELS.forEach((lbl) => {
        const el = overlays.roadLabelEls[lbl.id];
        if (!el) return;

        let wx = 0;
        let wz = 0;
        if (lbl.mapCoord) {
          wx = (lbl.mapCoord[0] / SHOP_CONFIG.MAP_REF_W - 0.5) * SHOP_CONFIG.MAP_W;
          wz = (lbl.mapCoord[1] / SHOP_CONFIG.MAP_REF_H - 0.5) * SHOP_CONFIG.MAP_H;
        } else if (lbl.lineIndex !== undefined) {
          const curve = roads.roadCurves[lbl.lineIndex];
          if (!curve) return;
          const pt = curve.getPointAt(lbl.t ?? 0.5);
          wx = pt.x;
          wz = pt.z;
        } else {
          return;
        }

        const [lx, ly, inFront] = projectToScreen(wx, 0.5, wz, camera, curW, curH);
        const show =
          currentMode === 'map' &&
          !hidePinAtCloseRange &&
          stateRef.current.roadDetailsVisible &&
          roadAlpha > 0.4 &&
          inFront &&
          lx > 30 &&
          lx < curW - 30 &&
          ly > 40 &&
          ly < curH - 28;
        el.style.transform = lbl.isChowk
          ? lbl.labelBelow
            ? `translate3d(${lx}px, ${ly}px, 0) translate(-50%, 6px)`
            : `translate3d(${lx}px, ${ly}px, 0) translate(-50%, -100%)`
          : `translate3d(${lx}px, ${ly}px, 0) translate(-50%, -120%)`;
        el.style.opacity = show ? '1' : '0';
      });

      // 3. 360° Interior Panorama Hotspots
      INTERIOR_HOTSPOTS.forEach((hs) => {
        const el = overlays.panoHotspotEls[hs.id];
        if (!el) return;
        const yaw = (hs.panoUv[0] - 0.5) * 2.62;
        const pitch = (0.5 - hs.panoUv[1]) * 1.03;
        const [px, py, inFront] = projectToScreen(
          sx + 40 * Math.sin(yaw) * Math.cos(pitch),
          1.6 + 40 * Math.sin(pitch),
          sz - 40 * Math.cos(yaw) * Math.cos(pitch),
          camera,
          curW,
          curH,
        );
        const show =
          currentMode === 'pano' &&
          stateRef.current.panoTab === 'interior' &&
          panoVal > 0.85 &&
          inFront;
        el.style.transform = `translate3d(${px}px, ${py}px, 0)`;
        el.style.opacity = show ? '1' : '0';
        el.style.pointerEvents = show ? 'auto' : 'none';
      });

      // 5. Hovered item floating product preview card (clamped cleanly inside viewport!)
      if (overlays.itemTooltipEl) {
        const cardW = 248;
        const cardH = 92;
        const tx = Math.min(Math.max(12, pointerScreenX + 18), Math.max(12, curW - cardW - 12));
        const ty = Math.min(Math.max(12, pointerScreenY + 18), Math.max(12, curH - cardH - 12));
        overlays.itemTooltipEl.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      }
    }

    function stepScene(dt: number, elapsed: number): boolean {
      let animating = false;

      // Smoothly clamp map panning within satellite map bounds
      if (currentMode === 'map' && !insideShop && !transitionActive) {
        const halfW = SHOP_CONFIG.MAP_W * 0.46;
        const halfH = SHOP_CONFIG.MAP_H * 0.46;
        controls.target.x = THREE.MathUtils.clamp(controls.target.x, -halfW, halfW);
        controls.target.z = THREE.MathUtils.clamp(controls.target.z, -halfH, halfH);
      }

      // Exponential damping for scripted camera mode glides
      if (transitionActive) {
        const lambda = enteringWebsite
          ? 5.6
          : insideShop && monitorApproach > 0
            ? 4.5
            : insideShop
              ? 6.4
              : 4.2;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoal.x, lambda, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoal.y, lambda, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoal.z, lambda, dt);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetGoal.x, lambda, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetGoal.y, lambda, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetGoal.z, lambda, dt);

        if (
          camera.position.distanceToSquared(_camGoal) < 0.0008 &&
          controls.target.distanceToSquared(_targetGoal) < 0.0008
        ) {
          camera.position.copy(_camGoal);
          controls.target.copy(_targetGoal);
          transitionActive = false;
          if (insideShop && !enteringWebsite && monitorApproach <= 0.001) {
            controls.enableRotate = true;
            controls.minDistance = 0.06;
            controls.maxDistance = 0.1;
          }
        } else {
          animating = true;
        }
      }

      // Smooth FOV interpolation
      if (Math.abs(camera.fov - fovTarget) > 0.05) {
        camera.fov = THREE.MathUtils.damp(camera.fov, fovTarget, 6, dt);
        camera.updateProjectionMatrix();
        animating = true;
      }

      // Camera distance to shop
      const [sx, sz] = uvToWorld(currentShopUv);
      const camDistToShop = Math.hypot(
        camera.position.x - sx,
        camera.position.y - 1.5,
        camera.position.z - sz,
      );

      // Track 2D vs 3D tilt angle in Aerial Map mode for the 2D/3D HUD toggle
      if (currentMode === 'map' && !insideShop) {
        _offset.copy(camera.position).sub(controls.target);
        _spherical.setFromVector3(_offset);
        const next3D = _spherical.phi > 0.5;
        if (next3D !== isMap3D) {
          isMap3D = next3D;
          stateRef.current.onMap3DChange?.(isMap3D);
        }
        // Automatically close shutter when user zooms far back out to village overview
        if (shutterOpened && camDistToShop > 68) {
          setShutterOpenedState(false);
        }
      }

      // Moving mouse cursor onto the closed shutter opens the shop automatically (3D Shop & zoomed-in Aerial Map)
      const canHoverShutter =
        !shutterOpened &&
        !insideShop &&
        pointerScreenX >= 0 &&
        lastPointerType !== 'touch' &&
        ((currentMode === 'shop' && pointerMovedInShop) ||
          (currentMode === 'map' && !stateRef.current.editPinMode && camDistToShop < 56));
      if (canHoverShutter) {
        const now = performance.now();
        if (now - lastHoverCheck > 45) {
          lastHoverCheck = now;
          _raycaster.setFromCamera(_ndc, camera);
          hoveringShutter =
            _raycaster.intersectObject(shop.shutterHitTarget, false).length > 0;
          if (hoveringShutter && !transitionActive) {
            setShutterOpenedState(true);
          }
        }
      } else {
        hoveringShutter = false;
      }

      // Shutter & hinged glass entrance door opening / closing animation
      const shutterTarget =
        currentMode === 'pano' ||
        insideShop ||
        ((currentMode === 'shop' || currentMode === 'map') && shutterOpened)
          ? 1
          : 0;
      if (Math.abs(shutterVal - shutterTarget) > 0.003) {
        shutterVal = THREE.MathUtils.damp(shutterVal, shutterTarget, 4.8, dt);
        animating = true;
      } else {
        shutterVal = shutterTarget;
      }
      shop.setShutterOpen(shutterVal);

      // 360 Panorama fade
      const panoTarget =
        currentMode === 'pano' && stateRef.current.panoTab === 'interior' ? 1 : 0;
      if (Math.abs(panoOpacityVal - panoTarget) > 0.004) {
        panoOpacityVal = THREE.MathUtils.damp(panoOpacityVal, panoTarget, 5.2, dt);
        animating = true;
      } else {
        panoOpacityVal = panoTarget;
      }
      pano.setPanoOpacity(panoOpacityVal);

      // Road visibility & gentle initial fade-in
      if (roadRevealVal < 1) {
        roadRevealVal = Math.min(1, roadRevealVal + dt * 0.9);
        animating = true;
      }
      const roadFadeOut = insideShop
        ? 0.18
        : currentMode === 'map'
          ? 1
          : currentMode === 'shop'
            ? Math.max(0.28, 1 - shutterVal * 0.75)
            : 0;
      const roadAlpha = roadRevealVal * roadFadeOut;
      roads.setRoadOpacity(roadAlpha, stateRef.current.roadDetailsVisible);

      // Map beacon pulse & cursor ground halo
      const showMapGuides =
        currentMode === 'map' && !insideShop && camDistToShop >= 24 && shutterVal < 0.12;
      roads.beaconRing.visible = showMapGuides;
      roads.cursorHalo.visible = showMapGuides;
      if (showMapGuides && !isSoftwareGl) {
        const ringPhase = (elapsed * 0.55) % 1;
        roads.beaconRing.scale.setScalar(1 + ringPhase * 1.4);
        (roads.beaconRing.material as THREE.MeshBasicMaterial).opacity =
          (1 - ringPhase) * 0.78;
        roads.cursorHalo.scale.setScalar(1 + Math.sin(elapsed * 3.2) * 0.1);
        animating = true;
      }

      // Throttled hover raycast on shop products & counter PC monitor
      const shopInspectable =
        !enteringWebsite &&
        (insideShop ||
          currentMode === 'shop' ||
          (currentMode === 'map' && camDistToShop < 48)) &&
        shutterVal > 0.82;
      if (shopInspectable && pointerScreenX >= 0) {
        const now = performance.now();
        if (now - lastHoverCheck > 45) {
          lastHoverCheck = now;
          _hoverRay.setFromCamera(_ndc, camera);
          const hits = _hoverRay.intersectObjects(shop.interactiveItems, false);
          const nextHit = hits.length > 0 ? (hits[0].object as InteractiveShopItem) : null;
          _raycaster.setFromCamera(_ndc, camera);
          const hitMonitor =
            !nextHit && _raycaster.intersectObject(shop.monitorHitTarget, false).length > 0;

          if (nextHit !== hoveredItem || hitMonitor !== hoveringMonitor) {
            hoveredItem = nextHit;
            hoveringMonitor = hitMonitor;
            stateRef.current.onHoveredItemChange(
              nextHit
                ? nextHit.userData.itemType
                : null,
            );
            renderer.domElement.style.cursor = nextHit || hitMonitor ? 'pointer' : 'grab';
          }
        }
      } else {
        if (hoveredItem || hoveringMonitor) {
          hoveredItem = null;
          hoveringMonitor = false;
          stateRef.current.onHoveredItemChange(null);
        }
        renderer.domElement.style.cursor =
          currentMode === 'map' && !insideShop && stateRef.current.editPinMode
            ? 'crosshair'
            : hoveringShutter
              ? 'pointer'
              : 'grab';
      }

      // Smooth shelf, counter & wall item 3D pop-out + warm golden glow on mouse hover!
      for (let i = 0; i < shop.interactiveItems.length; i++) {
        const item = shop.interactiveItems[i];
        const isHot = item === hoveredItem;
        const targetScale = isHot ? 1.16 : 1;
        const [bx, by, bz] = item.userData.basePos;
        const [ox, oy, oz] = item.userData.hoverOffset;
        const tx = bx + (isHot ? ox : 0);
        const ty = by + (isHot ? oy : 0);
        const tz = bz + (isHot ? oz : 0);
        const targetEmissive = isHot ? 0.28 : 0;

        const mats = Array.isArray(item.material)
          ? (item.material as THREE.MeshStandardMaterial[])
          : [item.material as THREE.MeshStandardMaterial];
        const curEmissive = mats[0]?.emissive ? mats[0].emissive.r : 0;

        if (
          Math.abs(item.scale.x - targetScale) > 0.004 ||
          Math.abs(item.position.x - tx) > 0.0015 ||
          Math.abs(item.position.y - ty) > 0.0015 ||
          Math.abs(item.position.z - tz) > 0.0015 ||
          Math.abs(curEmissive - targetEmissive) > 0.004
        ) {
          const nextS = THREE.MathUtils.damp(item.scale.x, targetScale, 12, dt);
          item.scale.setScalar(nextS);
          item.position.x = THREE.MathUtils.damp(item.position.x, tx, 12, dt);
          item.position.y = THREE.MathUtils.damp(item.position.y, ty, 12, dt);
          item.position.z = THREE.MathUtils.damp(item.position.z, tz, 12, dt);
          const nextEm = THREE.MathUtils.damp(curEmissive, targetEmissive, 12, dt);
          for (let m = 0; m < mats.length; m++) {
            if (mats[m]?.emissive) {
              mats[m].emissive.setRGB(nextEm, nextEm * 0.88, nextEm * 0.55);
            }
          }
          animating = true;
        }
      }

      controls.update();
      updateDomProjections(shutterVal, panoOpacityVal, roadAlpha, camDistToShop);
      return animating;
    }

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function requestRender() {
      if (disposed) return;
      if (isSoftwareGl) {
        if (renderBusy) {
          renderDirty = true;
          return;
        }
        renderBusy = true;
        frameId = requestAnimationFrame(() => {
          if (disposed) return;
          renderDirty = false;
          const dt = Math.min(clock.getDelta(), 0.08);
          const animating = stepScene(dt, clock.elapsedTime);
          renderer.render(scene, camera);
          afterDraw(() => {
            renderBusy = false;
            if (disposed) return;
            if (renderDirty || animating || needsRender) {
              needsRender = false;
              requestRender();
            }
          });
        });
      }
    }

    function gpuLoop() {
      if (disposed) return;
      frameId = requestAnimationFrame(gpuLoop);
      const dt = Math.min(clock.getDelta(), 0.05);
      stepScene(dt, clock.elapsedTime);
      renderer.render(scene, camera);
    }

    if (isSoftwareGl) {
      requestRender();
    } else {
      frameId = requestAnimationFrame(gpuLoop);
    }

    return () => {
      disposed = true;
      if (enterTimer !== null) {
        window.clearTimeout(enterTimer);
      }
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', syncViewportSize);
      controls.removeEventListener('start', onControlsStart);
      controls.removeEventListener('change', onControlsChange);
      controls.dispose();

      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchmove', onTouchMove);
      renderer.domElement.removeEventListener('touchend', onTouchEnd);
      renderer.domElement.removeEventListener('touchcancel', onTouchEnd);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      window.removeEventListener('keydown', onKeyDown);
      if (toggleMapTiltRef) {
        toggleMapTiltRef.current = null;
      }
      if (exitShopRef) {
        exitShopRef.current = null;
      }
      if (enterShopRef) {
        enterShopRef.current = null;
      }

      // Thorough disposal of Three.js resources
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => {
            const stdMat = m as THREE.MeshStandardMaterial;
            if (stdMat.map) stdMat.map.dispose();
            m.dispose();
          });
        }
      });
      envTexture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [overlayDomRef]);

  return (
    <div ref={mountRef} className="relative h-full w-full overflow-hidden bg-[#0A1120]">
      {contextLost && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#0A1120]/95 p-6 text-center">
          <div className="max-w-sm rounded-2xl border border-white/15 bg-[#101B35] p-6">
            <h2 className="text-base font-semibold text-white">
              3D Viewport Paused
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Graphics context was suspended. Restoring your 3D shop view automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
