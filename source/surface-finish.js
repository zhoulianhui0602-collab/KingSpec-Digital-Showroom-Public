import * as THREE from 'three';
import finish from './surface-finish.json';

export { finish };

export function makeGlassFinish(object) {
  const role = object.userData.finishRole || (object.userData.zone === 'lid' ? 'lid' : 'auxiliary');
  const profile = finish.glass[role] || finish.glass.auxiliary;
  // Top panes use optical transmission. Side walls and the lower deck use
  // alpha glass so the inset circuitry remains legible through stacked panes.
  const optical = profile.transmission > 0;
  const low = new THREE.MeshPhysicalMaterial({
    ...profile, transmission: 0, opacity: optical ? (role==='deckTop'?.10:.15) : profile.opacity,
    metalness: 0, transparent: true, depthWrite: false,
    side: THREE.FrontSide, envMapIntensity: profile.envMapIntensity,
  });
  const high = optical ? new THREE.MeshPhysicalMaterial({
    ...profile, metalness: 0, transparent: false, depthWrite: true,
    side: THREE.FrontSide, attenuationColor: new THREE.Color('#f4f6f6'),
    attenuationDistance: 12,
  }) : null;
  low.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>',
      'float glassFresnel = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 3.0); diffuseColor.a *= mix(0.3, 1.0, glassFresnel);\n#include <opaque_fragment>');
  };
  low.customProgramCacheKey = () => 'ks-neutral-glass-20261014';
  object.userData.glassOpacity = low.opacity;
  object.userData.opticalOpacity = 1;
  object.userData.physicalGlass = high;
  object.userData.finishRole = role;
  return low;
}

export function makeMetalFinish(role) {
  return new THREE.MeshStandardMaterial(finish.metal[role]);
}

export function setSurfaceTransparency(material, transparent) {
  if (material.transparent !== transparent) {
    material.transparent = transparent;
    material.needsUpdate = true;
  }
}

export function prepareReflectionRoom(environment) {
  environment.traverse(o => {
    if (!o.isMesh) return;
    const m=o.material;
    if (m.isMeshStandardMaterial) m.color.set('#3e494e');
    if (m.emissiveIntensity > 0 && o.position.y > 19) o.scale.set(7,.1,1.4);
  });
}

export function makeDesignedFinish(role, object) {
  const material = new THREE.MeshStandardMaterial(finish.design.materials[role]);
  if (role === 'pcbPulse' || role === 'pcbTrace') {
    // Arc length is stored on the solid conductor vertices, including bends.
    // A compact highlight follows each route. There is no circuit texture.
    const pulse = finish.lighting.pcb;
    const hasFlow = !!object?.geometry.getAttribute('_ks_flow');
    const animation = { time: { value: 0 }, still: { value: 1 } };
    material.userData.pcbAnimation = animation;
    material.onBeforeCompile = shader => {
      shader.uniforms.ksPCBTime = animation.time;
      shader.uniforms.ksPCBStill = animation.still;
      shader.vertexShader = `${hasFlow?'attribute vec3 _ks_flow;':''} varying vec2 vPCBFlow;\n` + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
        `#include <begin_vertex>\nvPCBFlow = ${hasFlow?'_ks_flow.xy':'vec2(0.0)'};`);
      shader.fragmentShader = 'varying vec2 vPCBFlow; uniform float ksPCBTime; uniform float ksPCBStill;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
float pcbDistance = fract(vPCBFlow.x - ksPCBTime / ${pulse.period.toFixed(4)} - vPCBFlow.y + 0.5) - 0.5;
float pcbBand = exp(-pcbDistance * pcbDistance / ${(pulse.width*pulse.width).toFixed(8)});
float pcbEnds = smoothstep(0.0, 0.045, vPCBFlow.x) * (1.0 - smoothstep(0.955, 1.0, vPCBFlow.x));
float pcbWave = pcbBand * pcbEnds;
totalEmissiveRadiance *= mix(${pulse.minimum.toFixed(4)} + pcbWave * ${(pulse.maximum-pulse.minimum).toFixed(4)}, ${pulse.still.toFixed(4)}, ksPCBStill);`);
    };
    material.customProgramCacheKey = () => 'ks-solid-pcb-arc-flow-20261015-'+hasFlow;
  }
  return material;
}
