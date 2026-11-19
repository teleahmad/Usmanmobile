import * as THREE from 'three';
import { SHOP_IMAGES } from '../config/shopConfig';

export interface BuiltPanoDome {
  panoGroup: THREE.Group;
  setPanoOpacity: (opacity: number) => void;
  setActiveImage: (tab: 'interior' | 'storefront') => void;
}

export function buildPanoDome(
  scene: THREE.Scene,
  initialPos: [number, number],
  maxAnisotropy: number,
  onReady?: () => void,
): BuiltPanoDome {
  const panoGroup = new THREE.Group();
  panoGroup.position.set(initialPos[0], 1.6, initialPos[1]);
  panoGroup.visible = false;
  scene.add(panoGroup);

  // Ambient architectural backdrop dome prevents raw dark edges when panning near panorama limits
  const backdropMat = new THREE.MeshBasicMaterial({
    color: 0x111c33,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
    fog: false,
  });
  const backdropDome = new THREE.Mesh(
    new THREE.SphereGeometry(42, 32, 24),
    backdropMat,
  );
  backdropDome.renderOrder = 998;
  panoGroup.add(backdropDome);

  const photoMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
    fog: false,
  });

  const loader = new THREE.TextureLoader();
  let interiorTex: THREE.Texture | null = null;
  let storefrontTex: THREE.Texture | null = null;

  loader.load(SHOP_IMAGES.interiorWide, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAnisotropy;
    interiorTex = tex;
    if (!photoMat.map) {
      photoMat.map = tex;
      photoMat.needsUpdate = true;
    }
    onReady?.();
  });

  loader.load(SHOP_IMAGES.storefront, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAnisotropy;
    storefrontTex = tex;
  });

  const sphereGeo = new THREE.SphereGeometry(
    40,
    48,
    32,
    Math.PI * 1.5 - 1.31,
    2.62,
    Math.PI / 2 - 0.515,
    1.03,
  );
  sphereGeo.scale(-1, 1, 1);

  const photoMesh = new THREE.Mesh(sphereGeo, photoMat);
  photoMesh.renderOrder = 1000;
  panoGroup.add(photoMesh);

  const setPanoOpacity = (opacity: number) => {
    const clamped = THREE.MathUtils.clamp(opacity, 0, 1);
    backdropMat.opacity = clamped * 0.96;
    photoMat.opacity = clamped;
    panoGroup.visible = clamped > 0.004;
  };

  const setActiveImage = (tab: 'interior' | 'storefront') => {
    const next = tab === 'storefront' ? storefrontTex : interiorTex;
    if (next && photoMat.map !== next) {
      photoMat.map = next;
      photoMat.needsUpdate = true;
    }
  };

  return {
    panoGroup,
    setPanoOpacity,
    setActiveImage,
  };
}
