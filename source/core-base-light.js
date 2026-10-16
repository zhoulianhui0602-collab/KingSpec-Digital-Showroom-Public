import * as THREE from 'three';

const bounded = (value, fallback, min, max) =>
  THREE.MathUtils.clamp(Number.isFinite(value) ? value : fallback, min, max);

// A local, floor-level wash around the existing footing. This is independent
// of selective bloom so the same soft edge remains available on mobile.
export function createCoreBaseLight({ model, scene, color = '#e8380d', config = {} }) {
  const footing = model?.getObjectByName('Restored_Core_Footing');
  const inactive = reason => ({
    update() {},
    getStatus: () => ({ enabled: false, reason, meshCount: 0 }),
    dispose() {},
  });
  if (!footing || !scene) return inactive('Core footing unavailable');

  model.updateWorldMatrix(true, true);
  const bounds = new THREE.Box3().setFromObject(footing);
  if (bounds.isEmpty() || ![...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite)) {
    return inactive('Core footing bounds invalid');
  }

  const spread = bounded(config.spread, .62, .1, 1.5);
  const opacity = bounded(config.opacity, .38, 0, 1);
  const period = bounded(config.period, 7, 6, 8);
  // Offset from the footing's lower face: .075 + .022 = .097 in the current
  // GLB, just above the existing glass tabletop at .085. No model moves.
  const height = bounded(config.height, .022, .002, .15);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const planeSize = new THREE.Vector2(size.x + spread * 2, size.z + spread * 2);
  const lightColor = color?.isColor ? color.clone() : new THREE.Color(color);
  const uniforms = {
    uColor: { value: lightColor },
    uHalfSize: { value: new THREE.Vector2(size.x / 2, size.z / 2) },
    uPlaneSize: { value: planeSize },
    uSpread: { value: spread },
    uCorner: { value: Math.min(.10, size.x * .05, size.z * .05) },
    uOpacity: { value: opacity },
    uPeriod: { value: period },
    uTime: { value: 0 },
  };
  const geometry = new THREE.PlaneGeometry(planeSize.x, planeSize.y);
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform vec3 uColor;
      uniform vec2 uHalfSize;
      uniform vec2 uPlaneSize;
      uniform float uSpread;
      uniform float uCorner;
      uniform float uOpacity;
      uniform float uPeriod;
      uniform float uTime;

      float roundedBox(vec2 p, vec2 halfSize, float radius) {
        vec2 q = abs(p) - halfSize + radius;
        return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
      }

      void main() {
        vec2 p = (vUv - .5) * uPlaneSize;
        float distanceToEdge = roundedBox(p, uHalfSize, uCorner);
        // Empty center and a compact falloff keep the light on the four
        // actual edges instead of painting a bright rectangle underneath.
        float outside = smoothstep(-.008, .020, distanceToEdge);
        float d = max(distanceToEdge, 0.0);
        float extent = 1.0 - smoothstep(uSpread * .62, uSpread * .98, d);
        float contact = .68 * exp(-d / (uSpread * .115));
        float wash = .22 * exp(-d / (uSpread * .34));

        // The band leaves the edge once every seven seconds. Its envelope
        // reaches zero at both ends, so the loop never jumps or flashes.
        float phase = fract(uTime / uPeriod);
        float bandCenter = mix(.02, uSpread * .88, phase);
        float width = uSpread * .105;
        float bandDistance = (d - bandCenter) / width;
        float band = exp(-bandDistance * bandDistance);
        float envelope = pow(sin(phase * 3.14159265), 2.0);
        float alpha = uOpacity * outside * extent * (contact + wash + .30 * band * envelope);
        if (alpha < .001) discard;
        gl_FragColor = vec4(uColor, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'CoreBase_DiffusionLight';
  mesh.rotation.x = -Math.PI / 2;
  const worldPosition = new THREE.Vector3(center.x, bounds.min.y + height, center.z);
  scene.updateWorldMatrix(true, false);
  mesh.position.copy(scene.worldToLocal(worldPosition.clone()));
  mesh.renderOrder = 3;
  scene.add(mesh);

  let disposed = false, still = true, wireBlend = 0, entryProgress = 1;
  return {
    update({ time, still: hold = false, wireBlend: wire = 0, entryProgress: entry = 1 } = {}) {
      if (disposed) return;
      still = Boolean(hold);
      // The app's scene clock also stops on pause/reduced motion. Retaining
      // the last uniform handles callers that keep supplying a live clock.
      if (!still && Number.isFinite(time)) uniforms.uTime.value = time;
      wireBlend = bounded(wire, 0, 0, 1);
      entryProgress = bounded(entry, 1, 0, 1);
      const enter = THREE.MathUtils.smoothstep(entryProgress, .15, .85);
      uniforms.uOpacity.value = opacity * THREE.MathUtils.lerp(1, .25, wireBlend) * enter;
      mesh.visible = uniforms.uOpacity.value > .0001;
    },
    getStatus() {
      return {
        enabled: !disposed,
        name: mesh.name,
        meshCount: disposed ? 0 : 1,
        triangles: disposed ? 0 : 2,
        bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() },
        position: worldPosition.toArray(),
        footprint: planeSize.toArray(),
        color: '#' + lightColor.getHexString(),
        spread, height, period,
        baseOpacity: opacity,
        opacity: uniforms.uOpacity.value,
        uniformTime: uniforms.uTime.value,
        still, wireBlend, entryProgress,
        bloom: false,
      };
    },
    dispose() {
      if (disposed) return;
      mesh.removeFromParent();
      geometry.dispose();
      material.dispose();
      disposed = true;
    },
  };
}
