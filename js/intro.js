/* ============================================================================
   intro.js
   Manages the intro DOM layer shown at scroll=0 (camera pulled fully back).
   Fades out smoothly as the user starts scrolling forward into the gallery.

   Opacity is driven by how close the camera is to the intro position:
   - At scrollStart (max camera Z): opacity = 1
   - At first-plane focal Z: opacity = 0
   ========================================================================= */

const INTRO_SELECTOR = ".intro-layer";

export class IntroLayer {
  constructor({ scroll, gallery }) {
    this.scroll = scroll;
    this.gallery = gallery;
    this.element = document.querySelector(INTRO_SELECTOR);
    if (!this.element) {
      throw new Error(`Missing ${INTRO_SELECTOR} element on the page.`);
    }
    this.currentOpacity = 1;
    this.isForcedHidden = false;
  }

  /**
   * Camera-progress 0..1 from entry (camera fully back) to the first
   * plane's focal Z. Used by both the intro fade and the project card
   * reveal so the two ride the same signal and can be windowed apart.
   */
  getEntryProgress(cameraZ) {
    const startZ = this.scroll.maxCameraZ;
    const firstFocalZ = this.gallery.getPlaneFocalZ(0);
    const span = startZ - firstFocalZ;
    if (span <= 0) return 1;
    const progress = (startZ - cameraZ) / span;
    return Math.max(0, Math.min(1, progress));
  }

  /**
   * Intro opacity from camera Z. Intro is fully visible at scroll=0 and
   * fully gone by 30% of the way to the first plane — leaves headroom
   * before the project card reveal kicks in (see app.js) so the two
   * never co-exist on screen.
   */
  getTargetOpacity(cameraZ) {
    if (this.isForcedHidden) return 0;
    const t = this.getEntryProgress(cameraZ);
    const FADE_WINDOW = 0.3;
    const fade = Math.min(1, t / FADE_WINDOW);
    return 1 - fade;
  }

  /**
   * Per-frame: bind opacity directly to camera Z — no extra smoothing
   * layer. The scroll controller already smooths input → camera Z, so the
   * fade rides on a smooth signal. A second smoothing pass here just
   * created a visible tail where the entry text hung over the first
   * project on fast scrolls.
   */
  update(camera) {
    const target = this.getTargetOpacity(camera.position.z);
    this.currentOpacity = target;
    this.element.style.opacity = target.toFixed(3);
    this.element.style.pointerEvents = target > 0.5 ? "auto" : "none";
  }

  /** Force-hide for the click-to-zoom transition. */
  forceHide(isHidden = true) {
    this.isForcedHidden = Boolean(isHidden);
  }

  /**
   * Snap the layer fully hidden — used on reverse-zoom entry so the canvas
   * stays at full opacity from the first frame instead of fading in from
   * the intro's 18% floor.
   */
  snapHide() {
    this.isForcedHidden = true;
    this.currentOpacity = 0;
    this.element.style.opacity = "0";
    this.element.style.pointerEvents = "none";
  }

  /** Subtle staggered fade-in on first paint (home / intro only). */
  playEntrance() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    this.element.classList.add("intro-layer--entering");
  }

  /** Re-enable the intro (used when bringing the home page back after
   *  the user navigates back via the browser, not via reverse-zoom). */
  reset() {
    this.isForcedHidden = false;
    this.currentOpacity = 1;
    this.element.style.opacity = "1";
    this.element.style.pointerEvents = "auto";
  }
}
