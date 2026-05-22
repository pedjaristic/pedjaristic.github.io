/* ============================================================================
   engine.js
   Three.js renderer + scene + camera + resize handling + RAF loop.

   Mirrors the Codrops reference architecture but with our naming and only the
   features we need. Background paint and gallery updates happen in the
   `onTick` callback passed into `start()`.
   ========================================================================= */

import * as THREE from "./vendor/three.module.js";

const DEFAULT_CAMERA_Z = 6;
const FOV_DEGREES = 45;
const NEAR = 0.1;
const FAR = 100;

export class Engine {
  constructor(canvas) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("Engine requires a valid <canvas> element.");
    }

    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(FOV_DEGREES, 1, NEAR, FAR);
    this.camera.position.set(0, 0, DEFAULT_CAMERA_Z);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // We render the background quad and the main scene separately each frame.
    this.renderer.autoClear = false;

    this.isRunning = false;
    this.animationFrameRequestId = null;
    this.tickCallbacks = new Set();
    this.resizeCallbacks = new Set();
    this.renderScene = true;

    this.handleResize = () => this.resize();
    this.tick = this.tick.bind(this);
  }

  /** Register a per-frame callback. Returns an unsubscribe function. */
  onTick(callback) {
    if (typeof callback !== "function") return () => {};
    this.tickCallbacks.add(callback);
    return () => this.tickCallbacks.delete(callback);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.resize();
    window.addEventListener("resize", this.handleResize, { passive: true });
    this.tick();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameRequestId !== null) {
      cancelAnimationFrame(this.animationFrameRequestId);
      this.animationFrameRequestId = null;
    }
    window.removeEventListener("resize", this.handleResize);
  }

  resize() {
    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    // Notify any subsystem that scales itself off the viewport.
    for (const handler of this.resizeCallbacks) {
      handler(width, height);
    }
  }

  /** Register a resize callback. Returns an unsubscribe function. */
  onResize(callback) {
    if (typeof callback !== "function") return () => {};
    this.resizeCallbacks.add(callback);
    return () => this.resizeCallbacks.delete(callback);
  }

  /** Toggle main scene render (planes). Mood background always renders. */
  setRenderScene(enabled) {
    this.renderScene = enabled;
  }

  /** Load a single texture from a URL. */
  async loadTexture(url) {
    const loader = new THREE.TextureLoader();
    try {
      const texture = await loader.loadAsync(url);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    } catch (err) {
      console.warn(`Failed to load texture: ${url}`, err);
      return null;
    }
  }

  /** Loads textures from URLs. Returns a Map of {url -> THREE.Texture}. */
  async loadTextures(urls) {
    const loader = new THREE.TextureLoader();
    const loaded = new Map();
    await Promise.all(
      urls.map(async (url) => {
        try {
          const texture = await loader.loadAsync(url);
          texture.colorSpace = THREE.SRGBColorSpace;
          loaded.set(url, texture);
        } catch (err) {
          console.warn(`Failed to load texture: ${url}`, err);
        }
      })
    );
    return loaded;
  }

  tick() {
    if (!this.isRunning) return;
    this.animationFrameRequestId = requestAnimationFrame(this.tick);

    const time = performance.now();

    // Each registered subsystem updates its own state (scroll, gallery, mood).
    for (const callback of this.tickCallbacks) {
      callback(time, this.camera);
    }

    this.renderer.clear(true, true, true);

    // First: background (orthographic full-screen quad). It owns its own
    // scene + camera and renders itself when called by the gallery subsystem.
    const bgRenderer = this.scene.userData.backgroundRenderer;
    if (typeof bgRenderer === "function") {
      bgRenderer(this.renderer);
    }
    this.renderer.clearDepth();

    if (this.renderScene) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
