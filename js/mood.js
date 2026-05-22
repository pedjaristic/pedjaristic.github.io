/* ============================================================================
   mood.js
   Full-screen background quad that paints the per-project palette.
   Owns its own orthographic scene + camera so it can render independently of
   the main perspective scene.
   ========================================================================= */

import * as THREE from "./vendor/three.module.js";
import { bgVertexShader, bgFragmentShader } from "./shaders.js";

/** Read a CSS custom property from :root and return a THREE.Color. */
function readCssColor(propertyName, fallback = "#000000") {
  const root = document.documentElement;
  const raw = getComputedStyle(root).getPropertyValue(propertyName).trim();
  return new THREE.Color(raw || fallback);
}

export class MoodBackground {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.backgroundColor = new THREE.Color("#000000");
    this.blob1Color = new THREE.Color("#000000");
    this.blob2Color = new THREE.Color("#000000");

    // Scratch colors for blending — avoids per-frame allocations.
    this._nextBg = new THREE.Color();
    this._nextBlob1 = new THREE.Color();
    this._nextBlob2 = new THREE.Color();
    this._currBg = new THREE.Color();
    this._currBlob1 = new THREE.Color();
    this._currBlob2 = new THREE.Color();

    this.baseBlobRadius = 0.65;
    this.secondaryBlobRadiusRatio = 0.78;
    this.baseBlobStrength = 0.9;
    this.noiseStrength = 0.04;

    this.material = new THREE.ShaderMaterial({
      vertexShader: bgVertexShader,
      fragmentShader: bgFragmentShader,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uBackgroundColor: { value: this.backgroundColor },
        uBlob1Color: { value: this.blob1Color },
        uBlob2Color: { value: this.blob2Color },
        uNoiseStrength: { value: this.noiseStrength },
        uBlobRadius: { value: this.baseBlobRadius },
        uBlobRadiusSecondary: {
          value: this.baseBlobRadius * this.secondaryBlobRadiusRatio,
        },
        uBlobStrength: { value: this.baseBlobStrength },
        uTime: { value: 0 },
        uVelocityIntensity: { value: 0 },
      },
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);

    // Smoothed motion response
    this.smoothedVelocity = 0;
    this.targetVelocity = 0;
    this.motionSmoothing = 0.1;
  }

  /** Set the static palette for a project (used by project pages). */
  setPaletteFromProject(project) {
    if (!project?.mood) return;
    this.backgroundColor.copy(readCssColor(project.mood.bg));
    this.blob1Color.copy(readCssColor(project.mood.blob1));
    this.blob2Color.copy(readCssColor(project.mood.blob2));
    this._syncUniforms();
  }

  /**
   * Cross-fade between two project palettes.
   * blend in [0, 1]: 0 = fully `from`, 1 = fully `to`.
   */
  blendPalettes(fromProject, toProject, blend) {
    if (!fromProject?.mood) return;
    const t = Math.max(0, Math.min(1, blend ?? 0));

    this._currBg.copy(readCssColor(fromProject.mood.bg));
    this._currBlob1.copy(readCssColor(fromProject.mood.blob1));
    this._currBlob2.copy(readCssColor(fromProject.mood.blob2));

    if (!toProject?.mood || t <= 0) {
      this.backgroundColor.copy(this._currBg);
      this.blob1Color.copy(this._currBlob1);
      this.blob2Color.copy(this._currBlob2);
    } else {
      this._nextBg.copy(readCssColor(toProject.mood.bg));
      this._nextBlob1.copy(readCssColor(toProject.mood.blob1));
      this._nextBlob2.copy(readCssColor(toProject.mood.blob2));
      this.backgroundColor.copy(this._currBg).lerp(this._nextBg, t);
      this.blob1Color.copy(this._currBlob1).lerp(this._nextBlob1, t);
      this.blob2Color.copy(this._currBlob2).lerp(this._nextBlob2, t);
    }

    this._syncUniforms();
  }

  /** Set the velocity intensity target [0, 1]. Smoothed in update(). */
  setVelocityIntensity(intensity) {
    if (Number.isFinite(intensity)) {
      this.targetVelocity = Math.max(0, Math.min(1, intensity));
    }
  }

  update(time) {
    this.smoothedVelocity +=
      (this.targetVelocity - this.smoothedVelocity) * this.motionSmoothing;
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uVelocityIntensity.value = this.smoothedVelocity;
  }

  /** Render the background. Called by the Engine's tick before the scene. */
  render(renderer) {
    renderer.render(this.scene, this.camera);
  }

  _syncUniforms() {
    this.material.uniforms.uBackgroundColor.value.copy(this.backgroundColor);
    this.material.uniforms.uBlob1Color.value.copy(this.blob1Color);
    this.material.uniforms.uBlob2Color.value.copy(this.blob2Color);
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.scene.clear();
  }
}
