/* ============================================================================
   navigation.js
   Click → router handles the FLIP (the FLIP IS the zoom).
   Return → router handles reverse FLIP, then camera sits at focal view.
   ========================================================================= */

const REVERSE_ZOOM_MS = 600;

function cubicEaseOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

export class Navigation {
  constructor({ scroll, gallery, cardOverlay, intro }) {
    this.scroll = scroll;
    this.gallery = gallery;
    this.cardOverlay = cardOverlay;
    this.intro = intro;
    this.isTransitioning = false;
    this._returnFadeStart = null;
    this._router = null;

    this._unsubscribe = this.cardOverlay.onCardClick((project, cardElement) => {
      this.openProject(project, cardElement);
    });
  }

  setRouter(router) {
    this._router = router;
  }

  openProject(project, cardElement) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.scroll.lock();

    this.intro.forceHide(true);
    this.cardOverlay.setAllOpacity(0);

    if (cardElement) {
      cardElement.style.opacity = "0";
    }

    if (this._router) {
      this._router.showProject(project.id);
    }
  }

  reverseZoomFromProject(projectId) {
    const planeIndex = this.gallery.planes.findIndex(
      (p) => p.userData.project.id === projectId
    );
    if (planeIndex === -1) {
      this.scroll.unlock();
      this.isTransitioning = false;
      return false;
    }

    const targetPlane = this.gallery.planes[planeIndex];
    const focalZ = this.gallery.getPlaneFocalZ(planeIndex);

    this.isTransitioning = true;
    this.scroll.lock();
    this.intro.snapHide();
    this.cardOverlay.setAllOpacity(0);
    this.gallery.forceVisiblePlane(planeIndex);

    const startX = this.gallery.getPlaneTargetX(planeIndex);
    const startZ = targetPlane.position.z + 0.6;
    const endX = 0;
    const endZ = focalZ;

    this.scroll.setCameraX(startX);
    this.scroll.setCameraZ(startZ);

    const focalScroll = this.scroll._scrollFromCameraZ(focalZ);
    this.scroll.scrollTarget = focalScroll;
    this.scroll.scrollCurrent = focalScroll;
    this.scroll.previousScrollCurrent = focalScroll;

    const startTime = performance.now();
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / REVERSE_ZOOM_MS);
      const eased = cubicEaseOut(t);
      this.scroll.setCameraX(startX + (endX - startX) * eased);
      this.scroll.setCameraZ(startZ + (endZ - startZ) * eased);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        this.scroll.setCameraX(0);
        this.scroll.setCameraZ(focalZ);
        this.gallery.releaseForcedPlane();
        this.scroll.unlock();
        this.intro.forceHide(false);
        this.isTransitioning = false;
      }
    };
    requestAnimationFrame(animate);
    return true;
  }

  dispose() {
    this._unsubscribe?.();
  }
}
