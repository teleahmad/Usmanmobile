import * as THREE from 'three';
import { ROAD_LABELS, ROAD_LINES, SHOP_CONFIG, SHOP_IMAGES } from '../config/shopConfig';
import {
  createEnhancedSatelliteTexture,
  createLampPoolTexture,
  createRoadRibbonTexture,
} from './materials';

export interface BuiltRoads {
  groundMesh: THREE.Mesh;
  roadGroup: THREE.Group;
  roadCurves: THREE.CatmullRomCurve3[];
  beaconRing: THREE.Mesh;
  cursorHalo: THREE.Mesh;
  setRoadOpacity: (alpha: number, visible: boolean) => void;
}

function createRoadRibbonGeometry(
  curve: THREE.CatmullRomCurve3,
  width: number,
  yOffset: number,
): THREE.BufferGeometry {
  const length = curve.getLength();
  const steps = Math.max(150, Math.floor(length * 4.5));
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t).normalize();
    const nx = -tan.z;
    const nz = tan.x;

    // Gentle width taper at very ends so roads terminate smoothly
    const endTaper =
      Math.min(1, t / 0.025) * Math.min(1, (1 - t) / 0.025);
    const halfW = (width * (0.65 + 0.35 * endTaper)) / 2;

    positions.push(
      p.x + nx * halfW,
      yOffset,
      p.z + nz * halfW,
      p.x - nx * halfW,
      yOffset,
      p.z - nz * halfW,
    );
    uvs.push(0, (t * length) / 5, 1, (t * length) / 5);
    if (i < steps) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function buildTerrainAndRoads(
  scene: THREE.Scene,
  maxAnisotropy: number,
  initialShopPos: [number, number],
  onMapTextureReady?: () => void,
): BuiltRoads {
  const { MAP_W, MAP_H, MAP_REF_W, MAP_REF_H } = SHOP_CONFIG;

  // Extended surrounding horizon earth plane matching the satellite map perimeter
  const horizonSkirt = new THREE.Mesh(
    new THREE.PlaneGeometry(540, 540),
    new THREE.MeshStandardMaterial({
      color: 0xf3ece6,
      roughness: 1.0,
      metalness: 0.0,
      envMapIntensity: 0.0,
    }),
  );
  horizonSkirt.rotation.x = -Math.PI / 2;
  horizonSkirt.position.y = -0.04;
  horizonSkirt.receiveShadow = false;
  scene.add(horizonSkirt);

  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e283c,
    roughness: 1.0,
    metalness: 0.0,
    envMapIntensity: 0.0,
  });
  const groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(MAP_W, MAP_H),
    groundMaterial,
  );
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = 0;
  groundMesh.receiveShadow = false;
  scene.add(groundMesh);

  // Upscale, sharpen & vignette-feather the satellite imagery cleanly on load
  const imgLoader = new THREE.ImageLoader();
  imgLoader.load(SHOP_IMAGES.aerialMap, (img) => {
    const enhancedTex = createEnhancedSatelliteTexture(img, maxAnisotropy);
    groundMaterial.map = enhancedTex;
    // Slight neutral albedo scaling keeps roofs crisp and unclipped under directional + hemisphere lighting
    groundMaterial.color.setHex(0xe2e4e8);
    groundMaterial.needsUpdate = true;
    onMapTextureReady?.();
  });

  const roadGroup = new THREE.Group();
  scene.add(roadGroup);

  const uvToMapPoint = (p: [number, number]) =>
    new THREE.Vector3(
      (p[0] / MAP_REF_W - 0.5) * MAP_W,
      0,
      (p[1] / MAP_REF_H - 0.5) * MAP_H,
    );

  const roadCurves: THREE.CatmullRomCurve3[] = [];
  const fadeMaterials: THREE.Material[] = [];

  const mainRoadTex = createRoadRibbonTexture(true, maxAnisotropy);
  const streetRoadTex = createRoadRibbonTexture(false, maxAnisotropy);

  const mainAsphaltMat = new THREE.MeshBasicMaterial({
    map: mainRoadTex,
    transparent: true,
    opacity: 0.96,
    toneMapped: false,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const streetAsphaltMat = new THREE.MeshBasicMaterial({
    map: streetRoadTex,
    transparent: true,
    opacity: 0.92,
    toneMapped: false,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const mainCurbMat = new THREE.MeshBasicMaterial({
    color: 0xff4d4d,
    transparent: true,
    opacity: 0.92,
    toneMapped: false,
  });
  const streetCurbMat = new THREE.MeshBasicMaterial({
    color: 0xfde047,
    transparent: true,
    opacity: 0.86,
    toneMapped: false,
  });
  fadeMaterials.push(mainAsphaltMat, streetAsphaltMat, mainCurbMat, streetCurbMat);

  const dashMatricesMain: THREE.Matrix4[] = [];
  const dashMatricesStreet: THREE.Matrix4[] = [];
  const dummy = new THREE.Object3D();

  ROAD_LINES.forEach((spec) => {
    // Centripetal Catmull-Rom prevents spline overshoot and produces silky-smooth curves
    const curve = new THREE.CatmullRomCurve3(
      spec.points.map(uvToMapPoint),
      false,
      'centripetal',
      0.35,
    );
    roadCurves.push(curve);

    const surfaceY = spec.isMain ? 0.085 : 0.055;
    const ribbonWidth = spec.isMain ? spec.width * 1.15 : spec.width * 1.08;
    const asphaltGeo = createRoadRibbonGeometry(curve, ribbonWidth, surfaceY);
    const roadMesh = new THREE.Mesh(
      asphaltGeo,
      spec.isMain ? mainAsphaltMat : streetAsphaltMat,
    );
    roadMesh.renderOrder = spec.isMain ? 2 : 1;
    roadGroup.add(roadMesh);

    // Crisp raised shoulder rails along Main Bazar and Streets
    [-1, 1].forEach((side) => {
      const railSamples = 96;
      const shoulderPts: THREE.Vector3[] = [];
      for (let idx = 0; idx <= railSamples; idx++) {
        const u = idx / railSamples;
        const pt = curve.getPointAt(u);
        const tan = curve.getTangentAt(u).normalize();
        shoulderPts.push(
          new THREE.Vector3(
            pt.x - tan.z * (spec.width * 0.44) * side,
            surfaceY + 0.02,
            pt.z + tan.x * (spec.width * 0.44) * side,
          ),
        );
      }
      const curbCurve = new THREE.CatmullRomCurve3(
        shoulderPts,
        false,
        'centripetal',
        0.35,
      );
      const curbGeo = new THREE.TubeGeometry(
        curbCurve,
        140,
        spec.isMain ? 0.068 : 0.044,
        8,
        false,
      );
      const curbMesh = new THREE.Mesh(
        curbGeo,
        spec.isMain ? mainCurbMat : streetCurbMat,
      );
      curbMesh.renderOrder = 3;
      roadGroup.add(curbMesh);
    });

    // Arc-length uniform center lane dashes
    const spacing = spec.isMain ? 3.2 : 3.8;
    const count = Math.max(4, Math.floor(curve.getLength() / spacing));
    for (let n = 0; n < count; n++) {
      const u = (n + 0.4) / count;
      if (u <= 0.02 || u >= 0.98) continue;
      const p = curve.getPointAt(u);
      const tan = curve.getTangentAt(u);
      dummy.position.set(p.x, surfaceY + 0.018, p.z);
      dummy.rotation.set(0, Math.atan2(tan.x, tan.z), 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      if (spec.isMain) dashMatricesMain.push(dummy.matrix.clone());
      else dashMatricesStreet.push(dummy.matrix.clone());
    }
  });

  // Instanced high-contrast centre-line dashes
  const mainDashMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.92,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const streetDashMat = new THREE.MeshBasicMaterial({
    color: 0xfffbeb,
    transparent: true,
    opacity: 0.76,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  fadeMaterials.push(mainDashMat, streetDashMat);

  if (dashMatricesMain.length > 0) {
    const mainDashes = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.22, 0.016, 1.18),
      mainDashMat,
      dashMatricesMain.length,
    );
    dashMatricesMain.forEach((mat, i) => mainDashes.setMatrixAt(i, mat));
    mainDashes.instanceMatrix.needsUpdate = true;
    mainDashes.computeBoundingSphere();
    mainDashes.renderOrder = 4;
    roadGroup.add(mainDashes);
  }

  if (dashMatricesStreet.length > 0) {
    const streetDashes = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.14, 0.014, 0.85),
      streetDashMat,
      dashMatricesStreet.length,
    );
    dashMatricesStreet.forEach((mat, i) => streetDashes.setMatrixAt(i, mat));
    streetDashes.instanceMatrix.needsUpdate = true;
    streetDashes.computeBoundingSphere();
    streetDashes.renderOrder = 4;
    roadGroup.add(streetDashes);
  }

  // Crisp ground intersection discs at each named Chowk along Main Bazar
  const chowkOuterMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.94,
    toneMapped: false,
    depthWrite: false,
  });
  const chowkInnerMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    transparent: true,
    opacity: 0.96,
    toneMapped: false,
    depthWrite: false,
  });
  fadeMaterials.push(chowkOuterMat, chowkInnerMat);

  ROAD_LABELS.forEach((lbl) => {
    if (!lbl.isChowk || !lbl.mapCoord) return;
    const pt = uvToMapPoint(lbl.mapCoord);
    const outer = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.55, 32),
      chowkOuterMat,
    );
    outer.rotation.x = -Math.PI / 2;
    outer.position.set(pt.x, 0.115, pt.z);
    outer.renderOrder = 5;
    roadGroup.add(outer);

    const inner = new THREE.Mesh(
      new THREE.CircleGeometry(1.1, 32),
      chowkInnerMat,
    );
    inner.rotation.x = -Math.PI / 2;
    inner.position.set(pt.x, 0.11, pt.z);
    inner.renderOrder = 5;
    roadGroup.add(inner);
  });

  // Instanced warm street lamps along Main Bazar + soft atmospheric ground light pools
  const mainCurve = roadCurves[0];
  const lampCount = 8;
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x4b596b,
    metalness: 0.75,
    roughness: 0.35,
    transparent: true,
    opacity: 1,
  });
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffe8b0,
    emissive: 0xffbc58,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    transparent: true,
    opacity: 1,
  });
  const lampPoolMat = new THREE.MeshBasicMaterial({
    map: createLampPoolTexture(),
    transparent: true,
    opacity: 0.68,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  fadeMaterials.push(poleMat, bulbMat, lampPoolMat);

  const poles = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.05, 0.085, 3.1, 8),
    poleMat,
    lampCount,
  );
  const arms = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.65, 0.065, 0.065),
    poleMat,
    lampCount,
  );
  const bulbs = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.16, 10, 8),
    bulbMat,
    lampCount,
  );
  const lampPoolGeo = new THREE.PlaneGeometry(5.2, 5.2);
  lampPoolGeo.rotateX(-Math.PI / 2);
  const lampPools = new THREE.InstancedMesh(lampPoolGeo, lampPoolMat, lampCount);

  for (let i = 0; i < lampCount; i++) {
    const u = (i + 1) / (lampCount + 1);
    const p = mainCurve.getPointAt(u);
    const tan = mainCurve.getTangentAt(u).normalize();
    const side = i % 2 === 0 ? 1 : -1;
    const x = p.x - tan.z * 2.35 * side;
    const z = p.z + tan.x * 2.35 * side;
    const yaw = Math.atan2(tan.z * side, -tan.x * side);

    dummy.position.set(x, 1.55, z);
    dummy.rotation.set(0, yaw, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    poles.setMatrixAt(i, dummy.matrix);

    const armOffsetX = Math.cos(yaw) * 0.26;
    const armOffsetZ = -Math.sin(yaw) * 0.26;
    dummy.position.set(x + armOffsetX, 3.06, z + armOffsetZ);
    dummy.rotation.set(0, yaw, 0);
    dummy.updateMatrix();
    arms.setMatrixAt(i, dummy.matrix);

    const bulbOffsetX = Math.cos(yaw) * 0.54;
    const bulbOffsetZ = -Math.sin(yaw) * 0.54;
    dummy.position.set(x + bulbOffsetX, 2.98, z + bulbOffsetZ);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    bulbs.setMatrixAt(i, dummy.matrix);

    // Subtle warm additive glow pool on the road surface below each streetlamp
    dummy.position.set(x + bulbOffsetX * 0.9, 0.095, z + bulbOffsetZ * 0.9);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    lampPools.setMatrixAt(i, dummy.matrix);
  }

  [poles, arms, bulbs, lampPools].forEach((inst) => {
    inst.instanceMatrix.needsUpdate = true;
    inst.computeBoundingSphere();
    roadGroup.add(inst);
  });

  // Animated shop beacon ring on aerial map
  const beaconRing = new THREE.Mesh(
    new THREE.RingGeometry(3.6, 3.95, 64),
    new THREE.MeshBasicMaterial({
      color: 0xffc531,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  beaconRing.rotation.x = -Math.PI / 2;
  beaconRing.position.set(initialShopPos[0], 0.08, initialShopPos[1]);
  scene.add(beaconRing);

  // Interactive pointer halo on ground
  const cursorHalo = new THREE.Mesh(
    new THREE.RingGeometry(0.45, 0.65, 36),
    new THREE.MeshBasicMaterial({
      color: 0x71b7ff,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  cursorHalo.rotation.x = -Math.PI / 2;
  cursorHalo.position.set(initialShopPos[0], 0.14, initialShopPos[1]);
  scene.add(cursorHalo);

  const baseOpacities = fadeMaterials.map((m) => m.opacity);

  const setRoadOpacity = (alpha: number, visible: boolean) => {
    roadGroup.visible = visible && alpha > 0.02;
    if (!roadGroup.visible) return;
    fadeMaterials.forEach((mat, idx) => {
      mat.opacity = baseOpacities[idx] * alpha;
    });
  };

  return {
    groundMesh,
    roadGroup,
    roadCurves,
    beaconRing,
    cursorHalo,
    setRoadOpacity,
  };
}
