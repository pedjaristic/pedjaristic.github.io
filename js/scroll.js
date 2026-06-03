/* ============================================================================
   scroll.js
   Scroll-jacked navigation — each scroll gesture advances or retreats
   one project. Camera animates between focal positions using eased tweens.

   Index -1 = intro zone (camera pulled back). Index 0..N = project planes.
   ========================================================================= */

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;

export class ScrollController {
  constructor(camera, gallery, options = {}) {
    this.camera = camera;
    this.gallery = gallery;

    this.scrollTarget = 0;
    this.scrollCurrent = 0;
    this.scrollSmoothing = 0.08;
    this.scrollToWorldFactor = 0.01;
    this.invertScroll = false;

    // Velocity (in world-Z units per frame) — still tracked for mood bg
    this.previousScrollCurrent = 0;
    this.rawVelocity = 0;
    this.velocity = 0;
    this.velocityDamping = 0.12;
    this.velocityMax = 1.5;

    this.firstPlaneViewOffset = options.firstPlaneViewOffset ?? 8;
    this.lastPlaneViewOffset = options.lastPlaneViewOffset ?? 4;
    this.cameraStartZ = camera.position.z;
    this.minCameraZ = -Infinity;
    this.maxCameraZ = Infinity;

    // Scroll-jack tween
    this.snapDurationMs = options.snapDurationMs ?? 600;
    this._currentFocalIndex = -1;
    this._snapTween = null;

    // Trackpad — accumulate delta per swipe; impulse gate after snap (v9b).
    this.wheelAdvanceThreshold = options.wheelAdvanceThreshold ?? 80;
    this.wheelImpulseMin = options.wheelImpulseMin ?? 50;
    this.wheelNoiseFloor = options.wheelNoiseFloor ?? 12;
    this._wheelAccum = 0;
    this._wheelAwaitingImpulse = false;

    // Mouse — matches live (pedja.design): one notch advances, 180ms debounce.
    this._wheelGestureTimer = null;

    // Touch gesture tracking
    this._touchY = 0;
    this._touchConsumed = false;
    this._touchThreshold = 30;

    this.isLocked = false;

    this._onWheel = (event) => {
      if (this.isLocked) return;
      event.preventDefault();

      const delta = this._normalizeWheelDelta(event);

      if (this._isMouseWheel(event)) {
        // Live behavior — immediate advance per notch, debounce repeats.
        if (this._snapTween || this._wheelGestureTimer) return;
        if (Math.abs(delta) < 2) return;

        if (delta > 0) this._tryAdvanceNext();
        else this._tryAdvancePrev();

        this._wheelGestureTimer = setTimeout(() => {
          this._wheelGestureTimer = null;
        }, 180);
        return;
      }

      // Trackpad — accumulate to threshold; block during snap.
      if (this._snapTween) return;
      if (Math.abs(delta) < this.wheelNoiseFloor) return;

      if (this._wheelAwaitingImpulse) {
        if (Math.abs(delta) < this.wheelImpulseMin) return;
        this._wheelAwaitingImpulse = false;
        this._wheelAccum = 0;
      } else {
        this._wheelAccum += delta;
      }

      if (Math.abs(this._wheelAccum) < this.wheelAdvanceThreshold) return;

      const direction = this._wheelAccum > 0 ? 1 : -1;
      this._wheelAccum = 0;

      if (direction > 0) this._tryAdvanceNext();
      else this._tryAdvancePrev();
    };

    this._onTouchStart = (event) => {
      this._touchY = event.touches[0]?.clientY ?? 0;
      this._touchConsumed = false;
    };

    this._onTouchMove = (event) => {
      if (this.isLocked || this._touchConsumed || this._snapTween) return;
      event.preventDefault();
      const current = event.touches[0]?.clientY ?? this._touchY;
      const delta = this._touchY - current;
      if (Math.abs(delta) > this._touchThreshold) {
        this._touchConsumed = true;
        if (delta > 0) this._advanceToNext();
        else this._advanceToPrev();
      }
    };

    this._onKeyDown = (event) => {
      if (this.isLocked || this._snapTween) return;
      switch (event.key) {
        case "PageDown":
        case " ":
        case "ArrowDown":
        case "ArrowRight":
          event.preventDefault();
          this._advanceToNext();
          break;
        case "PageUp":
        case "ArrowUp":
        case "ArrowLeft":
          event.preventDefault();
          this._advanceToPrev();
          break;
        case "Home":
          event.preventDefault();
          this._currentFocalIndex = -1;
          this._tweenToFocal(-1);
          break;
        case "End":
          event.preventDefault();
          this._currentFocalIndex = this.gallery.planes.length - 1;
          this._tweenToFocal(this._currentFocalIndex);
          break;
      }
    };
  }

  init() {
    this._updateBounds();
    this.cameraStartZ = this.maxCameraZ;
    this.camera.position.z = this.cameraStartZ;
    this.scrollTarget = 0;
    this.scrollCurrent = 0;
    this.previousScrollCurrent = 0;
    this._currentFocalIndex = -1;
  }

  bindEvents() {
    document.addEventListener("wheel", this._onWheel, {
      passive: false,
      capture: true,
    });
    window.addEventListener("touchstart", this._onTouchStart, { passive: true });
    window.addEventListener("touchmove", this._onTouchMove, { passive: false });
    window.addEventListener("keydown", this._onKeyDown);
  }

  unbindEvents() {
    document.removeEventListener("wheel", this._onWheel, { capture: true });
    window.removeEventListener("touchstart", this._onTouchStart);
    window.removeEventListener("touchmove", this._onTouchMove);
    window.removeEventListener("keydown", this._onKeyDown);
    if (this._wheelGestureTimer) {
      clearTimeout(this._wheelGestureTimer);
      this._wheelGestureTimer = null;
    }
  }

  /** Line/page mode or legacy ±120 wheelDeltaY — not trackpad momentum. */
  _isMouseWheel(event) {
    if (event.deltaMode === 1 || event.deltaMode === 2) return true;
    if (
      typeof event.wheelDeltaY === "number" &&
      Math.abs(event.wheelDeltaY) >= 120
    ) {
      return true;
    }
    return false;
  }

  _tryAdvanceNext() {
    const maxIdx = this.gallery.planes.length - 1;
    if (this._currentFocalIndex >= maxIdx) return false;
    this._currentFocalIndex++;
    this._tweenToFocal(this._currentFocalIndex);
    return true;
  }

  _tryAdvancePrev() {
    if (this._currentFocalIndex <= -1) return false;
    this._currentFocalIndex--;
    this._tweenToFocal(this._currentFocalIndex);
    return true;
  }

  lock() {
    this.isLocked = true;
    this._snapTween = null;
    const scroll = this._scrollFromCameraZ(this.camera.position.z);
    this.scrollTarget = scroll;
    this.scrollCurrent = scroll;
    this.previousScrollCurrent = scroll;
    this.velocity = 0;
    this.rawVelocity = 0;
    this._wheelAccum = 0;
  }

  unlock() {
    this.isLocked = false;
    this._wheelAccum = 0;
    this._wheelAwaitingImpulse = false;
    this._syncFocalIndex();
  }

  /** Align scroll state to the camera after external repositioning (e.g. return FLIP). */
  syncToCamera() {
    const scroll = this._scrollFromCameraZ(this.camera.position.z);
    this.scrollTarget = scroll;
    this.scrollCurrent = scroll;
    this.previousScrollCurrent = scroll;
    this.velocity = 0;
    this.rawVelocity = 0;
    this._snapTween = null;
    this._wheelAccum = 0;
    this._wheelAwaitingImpulse = false;
    this._syncFocalIndex();
  }

  setCameraZ(z) {
    this.camera.position.z = z;
  }

  setCameraX(x) {
    this.camera.position.x = x;
  }

  update() {
    if (this.isLocked) return;

    this._updateBounds();

    // Tween drives both scrollTarget and scrollCurrent directly —
    // bypasses the lerp so the easing curve is the only smoothing.
    if (this._snapTween) {
      const elapsed = performance.now() - this._snapTween.startTime;
      const t = Math.min(1, elapsed / this._snapTween.duration);
      const eased = this._easeOutCubic(t);
      const pos =
        this._snapTween.startScroll +
        (this._snapTween.endScroll - this._snapTween.startScroll) * eased;
      this.scrollTarget = pos;
      this.scrollCurrent = pos;
      if (t >= 1) {
        this.scrollTarget = this._snapTween.endScroll;
        this.scrollCurrent = this._snapTween.endScroll;
        this._snapTween = null;
        this._syncFocalIndex();
        this._wheelAccum = 0;
        this._wheelAwaitingImpulse = true;
      }
    } else {
      this.scrollCurrent = lerp(
        this.scrollCurrent,
        this.scrollTarget,
        this.scrollSmoothing
      );
    }

    const minScroll = this._scrollFromCameraZ(this.maxCameraZ);
    const maxScroll = this._scrollFromCameraZ(this.minCameraZ);
    this.scrollTarget = clamp(this.scrollTarget, minScroll, maxScroll);
    this.scrollCurrent = clamp(this.scrollCurrent, minScroll, maxScroll);

    // Velocity — still tracked for mood background brightness
    this.rawVelocity = this.scrollCurrent - this.previousScrollCurrent;
    this.velocity = lerp(this.velocity, this.rawVelocity, this.velocityDamping);
    this.velocity = clamp(this.velocity, -this.velocityMax, this.velocityMax);
    if (Math.abs(this.velocity) < 0.0001) this.velocity = 0;
    this.previousScrollCurrent = this.scrollCurrent;

    const nextZ = this._cameraZFromScroll(this.scrollCurrent);
    this.camera.position.z = clamp(nextZ, this.minCameraZ, this.maxCameraZ);
  }

  getVelocityIntensity() {
    return clamp(Math.abs(this.velocity) / Math.max(this.velocityMax, 0.0001), 0, 1);
  }

  _advanceToNext() {
    this._tryAdvanceNext();
  }

  _advanceToPrev() {
    this._tryAdvancePrev();
  }

  _tweenToFocal(index) {
    const targetZ =
      index === -1 ? this.maxCameraZ : this.gallery.getPlaneFocalZ(index);
    const targetScroll = this._scrollFromCameraZ(targetZ);
    this._snapTween = {
      startScroll: this.scrollCurrent,
      endScroll: targetScroll,
      startTime: performance.now(),
      duration: this.snapDurationMs,
    };
  }

  goToIntro() {
    if (this.isLocked) return;
    this._currentFocalIndex = -1;
    this._tweenToFocal(-1);
  }

  /** Re-derive focal index from current camera position (after zoom transitions). */
  _syncFocalIndex() {
    const currentZ = this.camera.position.z;
    const firstFocalZ = this.gallery.getPlaneFocalZ(0);
    if (currentZ > firstFocalZ + this.gallery.planeGap * 0.3) {
      this._currentFocalIndex = -1;
      return;
    }
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < this.gallery.planes.length; i++) {
      const d = Math.abs(currentZ - this.gallery.getPlaneFocalZ(i));
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    this._currentFocalIndex = bestIdx;
  }

  _easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  _updateBounds() {
    const { nearestZ, deepestZ } = this.gallery.getDepthRange();
    this.maxCameraZ = nearestZ + this.firstPlaneViewOffset;
    this.minCameraZ = deepestZ + this.lastPlaneViewOffset;
    if (this.minCameraZ > this.maxCameraZ) this.minCameraZ = this.maxCameraZ;
  }

  _cameraZFromScroll(scrollAmount) {
    return this.cameraStartZ - scrollAmount * this.scrollToWorldFactor;
  }

  _scrollFromCameraZ(cameraZ) {
    if (this.scrollToWorldFactor === 0) return 0;
    return (this.cameraStartZ - cameraZ) / this.scrollToWorldFactor;
  }

  _normalizeWheelDelta(event) {
    if (event.deltaMode === 1) return event.deltaY * 16;
    if (event.deltaMode === 2) return event.deltaY * window.innerHeight;
    return event.deltaY;
  }
}
