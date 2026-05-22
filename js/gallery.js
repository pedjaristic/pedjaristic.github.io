/* ============================================================================
   gallery.js
   Creates one textured plane per project, laid out along the negative Z axis.
   Exposes helpers for opacity blending, mood blending, and screen projection.
   ========================================================================= */

import * as THREE from "./vendor/three.module.js";

const PLANE_GEOMETRY = new THREE.PlaneGeometry(3, 3);

/* --------------------------------------------------------------------------
   Custom shader for per-plane blur via textureLod.
   uBlur drives the mipmap LOD level: 0 = sharp, ~3 = blurred.
   uOpacity drives alpha (replaces material.opacity).
   -------------------------------------------------------------------------- */
const PLANE_VERTEX = /* glsl */ `
uniform mat3 uMapTransform;
uniform float uBlur;
out vec2 vUv;
out vec2 vEdgeUv;

void main() {
  float inflate = uBlur * 0.25;
  vec3 pos = position;
  pos.xy *= 1.0 + inflate;

  vec2 expandedUv = (uv - 0.5) * (1.0 + inflate) + 0.5;
  vUv = (uMapTransform * vec3(expandedUv, 1.0)).xy;
  vEdgeUv = expandedUv;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const PLANE_FRAGMENT = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform float uOpacity;
uniform float uBlur;
in vec2 vUv;
in vec2 vEdgeUv;
out vec4 fragColor;

vec3 linearToSRGB(vec3 c) {
  return mix(c * 12.92, pow(c, vec3(1.0 / 2.4)) * 1.055 - 0.055, step(0.0031308, c));
}

#define GOLDEN_ANGLE 2.39996323

void main() {
  float inflate = uBlur * 0.25;

  if (uBlur < 0.01) {
    vec4 tex = texture(uMap, vUv);
    fragColor = vec4(linearToSRGB(tex.rgb), tex.a * uOpacity);
    return;
  }

  float lod = min(uBlur * 1.2, 3.5);
  float radius = uBlur * 0.06;

  vec4 sum = textureLod(uMap, vUv, lod);
  float totalW = 1.0;

  for (int i = 1; i <= 25; i++) {
    float fi = float(i);
    float r = radius * sqrt(fi / 25.0);
    float theta = fi * GOLDEN_ANGLE;
    vec2 offset = vec2(cos(theta), sin(theta)) * r;
    float w = 1.0 - (fi / 25.0) * 0.5;
    sum += textureLod(uMap, vUv + offset, lod) * w;
    totalW += w;
  }

  vec4 blurred = sum / totalW;

  vec2 edgeDist = min(vEdgeUv, 1.0 - vEdgeUv);
  float halfInflate = max(inflate * 0.5, 0.001);
  float rawFade = smoothstep(-halfInflate, halfInflate * 0.3, edgeDist.x) *
                  smoothstep(-halfInflate, halfInflate * 0.3, edgeDist.y);
  float edgeFade = mix(1.0, rawFade, smoothstep(0.0, 0.08, inflate));

  fragColor = vec4(linearToSRGB(blurred.rgb), blurred.a * uOpacity * edgeFade);
}
`;

/**
 * All planes render as a fixed portrait frame (3:4) regardless of the source
 * image's aspect ratio. Source images are "cover"-cropped via UV transforms
 * so they fill the portrait frame edge-to-edge with center alignment —
 * the same effect as `object-fit: cover` on a CSS <img>, but in WebGL.
 *
 * 0.75 matches the Codrops reference (1500×2000 flower photos).
 */
const PORTRAIT_ASPECT = 0.75;

export class Gallery {
  constructor(projects, textures, options = {}) {
    this.projects = projects;
    this.textures = textures; // Map<string, THREE.Texture>
    this.planes = [];

    this.planeGap = options.planeGap ?? 5;
    this.mobileBreakpoint = options.mobileBreakpoint ?? 768;

    // Plane scale is uniform across all projects — we crop to a fixed
    // portrait frame, so source aspect ratio no longer drives plane width.
    // Numbers match the Codrops reference for compositional parity.
    this.desktopPlaneScale = options.desktopPlaneScale ?? 1;
    this.mobilePlaneScale = options.mobilePlaneScale ?? 0.7;

    // Alternating X offsets — planes swing left/right as we move through Z
    // so the next plane peeks out from beside the current one.
    this.baseXSpread = options.baseXSpread ?? 0.5;
    this.baseXCenter = options.baseXCenter ?? 0;
    this.mobileXSpreadFactor = 0.35;

    this.planeFadeSampleOffset = 1;
    this.planeFadeSmoothing = 0.14;
    this.blurSmoothing = 0.3;

    this.peekOpacityFloor = options.peekOpacityFloor ?? 0.25;
    this.peekBlurMax = options.peekBlurMax ?? 1.0;

    // Parallax (pointer-driven)
    this.parallaxAmountX = 0.16;
    this.parallaxAmountY = 0.08;
    this.parallaxSmoothing = 0.08;
    this.pointerTarget = new THREE.Vector2(0, 0);
    this.pointerCurrent = new THREE.Vector2(0, 0);

    // Subtle breath driven by scroll velocity
    this.breathTiltAmount = 0.045;
    this.breathScaleAmount = 0;
    this.breathSmoothing = 0.14;
    this.breathIntensity = 0;
    this.targetBreathIntensity = 0;

    this._onPointerMove = (event) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = (event.clientY / window.innerHeight) * 2 - 1;
      this.pointerTarget.set(x, -y);
    };
    this._onPointerLeave = () => this.pointerTarget.set(0, 0);
  }

  init(scene) {
    this.projects.forEach((project, index) => {
      const texture = this.textures.get(project.hero) || null;
      const imageAspect =
        texture?.image?.width && texture.image.height
          ? texture.image.width / texture.image.height
          : 1;

      // Cover-crop the texture into the portrait frame. Each project owns
      // a unique texture (one URL → one Texture in engine.loadTextures), so
      // mutating .repeat/.offset here is safe.
      if (texture) {
        applyCoverCrop(texture, imageAspect, PORTRAIT_ASPECT);
        texture.updateMatrix();
      }

      const texMatrix = texture ? texture.matrix : new THREE.Matrix3();

      const material = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        uniforms: {
          uMap: { value: texture },
          uMapTransform: { value: texMatrix },
          uOpacity: { value: index === 0 ? 1.0 : 0.0 },
          uBlur: { value: index === 0 ? 0.0 : this.peekBlurMax },
        },
        vertexShader: PLANE_VERTEX,
        fragmentShader: PLANE_FRAGMENT,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(PLANE_GEOMETRY, material);
      mesh.userData = {
        project,
        baseY: 0,
        // Alternate left/right so the back plane peeks out from beside
        // the current one. Even indices go left, odd indices go right.
        baseX: (index % 2 === 0 ? -this.baseXSpread : this.baseXSpread) + this.baseXCenter,
      };
      scene.add(mesh);
      this.planes.push(mesh);
    });

    this.updatePlaneScale();
    this.layoutPlanes();

    window.addEventListener("pointermove", this._onPointerMove, {
      passive: true,
    });
    window.addEventListener("pointerleave", this._onPointerLeave, {
      passive: true,
    });
  }

  /** Apply a hero texture to a plane after progressive background load. */
  setPlaneTexture(planeIndex, texture) {
    const plane = this.planes[planeIndex];
    const project = this.projects[planeIndex];
    if (!plane || !project || !texture) return;

    this.textures.set(project.hero, texture);

    const imageAspect =
      texture.image?.width && texture.image.height
        ? texture.image.width / texture.image.height
        : 1;

    applyCoverCrop(texture, imageAspect, PORTRAIT_ASPECT);
    texture.updateMatrix();

    plane.material.uniforms.uMap.value = texture;
    plane.material.uniforms.uMapTransform.value = texture.matrix;
  }

  /**
   * Apply a uniform portrait scale to every plane. Plane geometry is 3×3
   * world units; scaling by `s` gives a (3·s·PORTRAIT_ASPECT) × (3·s) box.
   * No per-image aspect math — cropping happens in UV space instead.
   */
  updatePlaneScale() {
    const isMobile = window.innerWidth <= this.mobileBreakpoint;
    const baseScale = isMobile ? this.mobilePlaneScale : this.desktopPlaneScale;

    for (const plane of this.planes) {
      plane.userData.currentScale = baseScale;
      plane.scale.set(baseScale * PORTRAIT_ASPECT, baseScale, 1);
    }
  }

  layoutPlanes() {
    const xSpread = this.getXSpreadFactor();
    this.planes.forEach((plane, index) => {
      const baseX = (plane.userData.baseX ?? 0) * xSpread;
      plane.position.set(baseX, 0, -index * this.planeGap);
    });
  }

  /** Reduce x-spread on mobile so planes don't fall off the screen. */
  getXSpreadFactor() {
    const isMobile = window.innerWidth <= this.mobileBreakpoint;
    return isMobile ? this.mobileXSpreadFactor : 1;
  }

  /** Get camera-Z position centered on plane `index`. */
  getPlaneFocalZ(index) {
    const safeIndex = Math.max(0, Math.min(this.planes.length - 1, index));
    return this.planes[safeIndex].position.z + this.planeGap; // viewed from +Z
  }

  /** Distance-along-the-rail (z range bounds). */
  getDepthRange() {
    if (!this.planes.length) return { nearestZ: 0, deepestZ: 0 };
    const zs = this.planes.map((p) => p.position.z);
    return { nearestZ: Math.max(...zs), deepestZ: Math.min(...zs) };
  }

  /**
   * Map cameraZ → blend info: which plane the camera is between, and a 0–1
   * blend factor for the transition. Sample point sits ahead of the camera
   * so a plane is fully visible *as the camera approaches it*, not after.
   */
  getPlaneBlendData(cameraZ) {
    if (!this.planes.length) return null;
    const planeGap = Math.max(this.planeGap, 0.0001);
    const firstPlaneZ = this.planes[0].position.z;
    const lastPlaneIndex = this.planes.length - 1;
    const sampledZ = cameraZ - planeGap * this.planeFadeSampleOffset;
    const normalized = Math.max(
      0,
      Math.min(lastPlaneIndex, (firstPlaneZ - sampledZ) / planeGap)
    );
    const currentPlaneIndex = Math.floor(normalized);
    const nextPlaneIndex = Math.min(currentPlaneIndex + 1, lastPlaneIndex);
    const blend = normalized - currentPlaneIndex;
    return { currentPlaneIndex, nextPlaneIndex, blend };
  }

  /**
   * Symmetric cross-fade — current = (1 - blend), next = (blend).
   * The "peek" effect that signals depth comes from the X-offsets on
   * adjacent planes (they sit at different X positions, so during a
   * transition the back plane visibly emerges from beside the front one).
   *
   * When `forcedVisibleIndex` is set (during the click-to-zoom transition),
   * the cross-fade is suspended and that single plane is pinned at full
   * opacity — otherwise the camera would zoom past the focal point and
   * the texture would dissolve toward the next project mid-zoom.
   */
  updatePlaneVisibility(cameraZ) {
    if (this.forcedVisibleIndex != null) {
      this.planes.forEach((plane, index) => {
        const u = plane.material.uniforms;
        u.uOpacity.value = index === this.forcedVisibleIndex ? 1 : 0;
        u.uBlur.value = 0;
      });
      return;
    }

    const data = this.getPlaneBlendData(cameraZ);
    if (!data) return;
    const { currentPlaneIndex, nextPlaneIndex, blend } = data;

    this.planes.forEach((plane, index) => {
      let target = 0;
      if (index === currentPlaneIndex) target = 1 - blend;
      if (index === nextPlaneIndex) target = Math.max(target, blend);

      if ((index === currentPlaneIndex + 1 || index === nextPlaneIndex + 1) && target < this.peekOpacityFloor) {
        target = this.peekOpacityFloor;
      }

      const u = plane.material.uniforms;
      const currentOpacity = Number.isFinite(u.uOpacity.value) ? u.uOpacity.value : 0;
      u.uOpacity.value = currentOpacity + (target - currentOpacity) * this.planeFadeSmoothing;

      let targetBlur;
      if (index === currentPlaneIndex) {
        targetBlur = blend * this.peekBlurMax;
      } else if (index === nextPlaneIndex) {
        targetBlur = (1 - blend) * this.peekBlurMax;
      } else {
        targetBlur = this.peekBlurMax;
      }
      const currentBlur = Number.isFinite(u.uBlur.value) ? u.uBlur.value : this.peekBlurMax;
      u.uBlur.value = currentBlur + (targetBlur - currentBlur) * this.blurSmoothing;
    });
  }

  /** Pin a single plane to full opacity (used during click-to-zoom). */
  forceVisiblePlane(index) {
    this.forcedVisibleIndex = index;
  }

  /** Release the pin and resume normal cross-fade behavior. */
  releaseForcedPlane() {
    this.forcedVisibleIndex = null;
  }

  /** World-space X for a plane after applying the mobile-aware spread. */
  getPlaneTargetX(planeIndex) {
    const plane = this.planes[planeIndex];
    if (!plane) return 0;
    return (plane.userData.baseX ?? 0) * this.getXSpreadFactor();
  }

  /** Subtle motion: parallax from pointer, breath from velocity. */
  updatePlaneMotion(velocityNormalized = 0) {
    // During click-to-zoom we force parallax + breath to 0 so the camera
    // travels straight at the plane instead of orbiting around a moving
    // target. Without this, the image drifts off-center mid-zoom.
    if (this.forcedVisibleIndex != null) {
      this.pointerTarget.set(0, 0);
      velocityNormalized = 0;
    }

    this.pointerCurrent.lerp(this.pointerTarget, this.parallaxSmoothing);

    this.targetBreathIntensity = Math.max(0, Math.min(1, velocityNormalized));
    this.breathIntensity +=
      (this.targetBreathIntensity - this.breathIntensity) * this.breathSmoothing;

    const xSpread = this.getXSpreadFactor();

    this.planes.forEach((plane, index) => {
      const opacity = plane.material.uniforms?.uOpacity?.value ?? 0;
      const depthInfluence = 1 + index * 0.05;
      const parallaxInfluence = opacity * depthInfluence;

      const baseX = (plane.userData.baseX ?? 0) * xSpread;
      plane.position.x =
        baseX + this.pointerCurrent.x * this.parallaxAmountX * parallaxInfluence;
      plane.position.y =
        this.pointerCurrent.y * this.parallaxAmountY * parallaxInfluence;

      const breath = this.breathIntensity * opacity;
      plane.rotation.x = -this.pointerCurrent.y * this.breathTiltAmount * breath;
      plane.rotation.y = this.pointerCurrent.x * this.breathTiltAmount * breath;

      const baseScale = plane.userData.currentScale || 1;
      const pulse = 1 + this.breathScaleAmount * breath;
      plane.scale.set(baseScale * PORTRAIT_ASPECT * pulse, baseScale * pulse, 1);
    });
  }

  /** Project a plane's world position to NDC, then to screen pixels. */
  projectPlaneToScreen(planeIndex, camera) {
    const plane = this.planes[planeIndex];
    if (!plane) return null;
    const vector = new THREE.Vector3();
    plane.getWorldPosition(vector);
    vector.project(camera);
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
    return { x, y, depth: vector.z };
  }

  /**
   * Project a plane's world-space bounding box to screen pixels. Used to
   * size the click-to-open hit area so it stays anchored to the image as
   * the plane parallaxes, breathes, and zooms.
   *
   * Returns { x, y, width, height } in viewport pixels (top-left origin),
   * or null if the plane is missing.
   */
  getPlaneScreenRect(planeIndex, camera) {
    const plane = this.planes[planeIndex];
    if (!plane) return null;

    const center = new THREE.Vector3();
    plane.getWorldPosition(center);

    // Plane geometry is 3×3 world units, scaled by plane.scale. Half-extents
    // in world space drive the projected pixel dimensions.
    const halfWorldX = 1.5 * plane.scale.x;
    const halfWorldY = 1.5 * plane.scale.y;

    const centerNdc = center.clone().project(camera);
    const edgeRightNdc = new THREE.Vector3(
      center.x + halfWorldX,
      center.y,
      center.z
    ).project(camera);
    const edgeTopNdc = new THREE.Vector3(
      center.x,
      center.y + halfWorldY,
      center.z
    ).project(camera);

    const cx = (centerNdc.x * 0.5 + 0.5) * window.innerWidth;
    const cy = (-centerNdc.y * 0.5 + 0.5) * window.innerHeight;

    const halfPxX = Math.abs((edgeRightNdc.x - centerNdc.x) * 0.5 * window.innerWidth);
    const halfPxY = Math.abs((edgeTopNdc.y - centerNdc.y) * 0.5 * window.innerHeight);

    return {
      x: cx - halfPxX,
      y: cy - halfPxY,
      width: halfPxX * 2,
      height: halfPxY * 2,
      depth: centerNdc.z,
    };
  }

  dispose() {
    window.removeEventListener("pointermove", this._onPointerMove);
    window.removeEventListener("pointerleave", this._onPointerLeave);
    for (const plane of this.planes) {
      plane.material.dispose();
      const tex = plane.material.uniforms?.uMap?.value;
      if (tex) tex.dispose();
    }
    this.planes = [];
  }
}

/**
 * Center-crop a texture to a target aspect ratio by adjusting its UV
 * `repeat` and `offset` — the GPU-side equivalent of `object-fit: cover`.
 *
 *   imageAspect > targetAspect  → image is wider → trim left + right
 *   imageAspect < targetAspect  → image is taller → trim top + bottom
 */
function applyCoverCrop(texture, imageAspect, targetAspect) {
  if (!texture || !Number.isFinite(imageAspect) || imageAspect <= 0) return;
  if (imageAspect > targetAspect) {
    const repeatX = targetAspect / imageAspect;
    texture.repeat.set(repeatX, 1);
    texture.offset.set((1 - repeatX) / 2, 0);
  } else {
    const repeatY = imageAspect / targetAspect;
    texture.repeat.set(1, repeatY);
    texture.offset.set(0, (1 - repeatY) / 2);
  }
  texture.needsUpdate = true;
}
