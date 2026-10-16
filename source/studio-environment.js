import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import studioHDR from './assets/environments/studio-neutral-1k.hdr';

// Decode the embedded Radiance file, then prefilter it once for physically
// based reflections. Keeping it embedded preserves the standalone delivery.
export function applyStudioEnvironment(renderer, scene, intensity, rotation) {
  const bytes = Uint8Array.from(atob(studioHDR), c => c.charCodeAt(0));
  const parsed = new HDRLoader().parse(bytes.buffer);
  const texture = new THREE.DataTexture(parsed.data, parsed.width, parsed.height, THREE.RGBAFormat, parsed.type);
  texture.colorSpace = THREE.LinearSRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.flipY = true;
  texture.needsUpdate = true;
  const generator = new THREE.PMREMGenerator(renderer);
  let environment;
  try {
    environment = generator.fromEquirectangular(texture);
  } finally {
    texture.dispose();
    generator.dispose();
  }
  scene.environment = environment.texture;
  scene.environmentIntensity = intensity;
  scene.environmentRotation.y = rotation;
  return {
    type: 'Radiance HDR / PMREM', source: 'studio-neutral-1k.hdr',
    original: 'models/tex/hdr-light-studio_01.exr',
    width: parsed.width, height: parsed.height, bytes: bytes.length,
    intensity, rotation, embedded: true,
  };
}
