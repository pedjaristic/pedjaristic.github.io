/* ============================================================================
   router.js
   Single-motion FLIP transition. The image smoothly grows from its gallery
   position to its project-page hero position (or shrinks on reverse).
   No WebGL zoom — the FLIP IS the zoom.
   ========================================================================= */

import { renderProject, clearProject } from "./project-view.js";
import { getProjectById } from "./data.js";
import { fadeStatusBar } from "./status-bar.js";

const FLIP_MS = 700;

export class Router {
  constructor({ scroll, gallery, cardOverlay, intro, navigation }) {
    this.scroll = scroll;
    this.gallery = gallery;
    this.cardOverlay = cardOverlay;
    this.intro = intro;
    this.navigation = navigation;

    this._galleryEls = null;
    this._projectView = null;
    this._currentProjectId = null;
    this._transitioning = false;
    this._proxy = null;
  }

  init() {
    this._projectView = document.getElementById("project-view");
    this._galleryEls = {
      canvas: document.querySelector(".gallery-canvas"),
      overlay: document.querySelector(".gallery-overlay"),
      vignette: document.querySelector(".gallery-vignette"),
      intro: document.querySelector(".intro-layer"),
      scrollIndicator: document.querySelector(".scroll-indicator"),
    };

    this._projectView.addEventListener("click", (e) => {
      const nextLink = e.target.closest("[data-project-next]");
      if (nextLink) {
        e.preventDefault();
        this.showProject(nextLink.dataset.projectNext, true);
        return;
      }
      const homeLink = e.target.closest("[data-project-home]");
      if (homeLink) {
        e.preventDefault();
        this.showGallery(this._currentProjectId);
      }
    });

    document.querySelector(".status-bar__home").addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!this._currentProjectId) return;
      e.preventDefault();
      this.showGallery(this._currentProjectId);
    });

    window.addEventListener("popstate", () => {
      const id = this._readHash();
      if (id && getProjectById(id)) {
        this._showProjectImmediate(id);
      } else {
        this._showGalleryImmediate();
      }
    });

    const initialId = this._readHash();
    if (initialId && getProjectById(initialId)) {
      this._showProjectImmediate(initialId);
    }
  }

  getCurrentProjectId() {
    return this._currentProjectId;
  }

  /* -------------------------------------------------------------------------
     Forward: gallery → project
     One motion: image grows from gallery plane rect to hero rect.
     ------------------------------------------------------------------------- */

  showProject(projectId, fromProject = false) {
    if (this._transitioning) return;
    this._transitioning = true;

    const project = getProjectById(projectId);
    if (!project) { this._transitioning = false; return; }

    if (fromProject) {
      this._transitioning = true;
      this.navigation.isTransitioning = true;

      this._projectView.style.transition = "opacity 300ms ease";
      this._projectView.style.opacity = "0";

      setTimeout(() => {
        renderProject(projectId);
        this._projectView.scrollTop = 0;
        this._projectView.classList.add("project-page--entering-from-project");

        this._projectView.style.transition = "opacity 200ms ease";
        this._projectView.style.opacity = "1";

        this._currentProjectId = projectId;
        history.pushState({ projectId }, "", `#${projectId}`);
        document.title = `${project.label} — Pedja Ristic`;

        this._transitioning = false;
        this.navigation.isTransitioning = false;

        setTimeout(() => {
          this._projectView.classList.remove("project-page--entering-from-project");
        }, 1000);
      }, 150);

      return;
    }

    // 1. Measure where the image IS right now (gallery plane on screen)
    const planeIndex = this.gallery.planes.findIndex(
      (p) => p.userData.project.id === projectId
    );
    const fromRect = this.gallery.getPlaneScreenRect(planeIndex, this.scroll.camera);

    // 2. Render project view with background visible immediately.
    //    The "entering" class hides content elements (they stagger in later).
    renderProject(projectId);
    this._projectView.style.transition = "none";
    this._projectView.style.opacity = "1";
    this._projectView.hidden = false;
    this._projectView.scrollTop = 0;
    this._projectView.classList.add("project-page--entering");

    const heroEl = this._projectView.querySelector(".project-page__hero");
    const toRect = heroEl.getBoundingClientRect();

    // 3. Position proxy at the FINAL rect (hero), then apply inverse transform
    //    so it visually appears at the START rect (gallery plane).
    //    Animating transform is GPU-composited = buttery smooth.
    const proxy = this._createProxy(project.hero, toRect);

    const scaleX = fromRect.width / toRect.width;
    const scaleY = fromRect.height / toRect.height;
    const fromCx = (fromRect.x ?? fromRect.left) + fromRect.width / 2;
    const fromCy = (fromRect.y ?? fromRect.top) + fromRect.height / 2;
    const toCx = toRect.left + toRect.width / 2;
    const toCy = toRect.top + toRect.height / 2;

    proxy.style.transformOrigin = "center center";
    proxy.style.transform = `translate(${fromCx - toCx}px, ${fromCy - toCy}px) scale(${scaleX}, ${scaleY})`;

    // 4. Hide gallery (project view's background already covers it visually)
    this._hideGallery();

    // 5. Update state
    this._currentProjectId = projectId;
    history.pushState({ projectId }, "", `#${projectId}`);
    document.title = `${project.label} — Pedja Ristic`;

    // 6. Animate to identity transform (proxy lands at hero position).
    //    Completion timeout inside the double-rAF so it's synchronized with
    //    when the CSS transition actually starts (same fix as the reverse path).
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        proxy.style.transition = `transform ${FLIP_MS}ms var(--ease-flip)`;
        proxy.style.transform = "translate(0, 0) scale(1, 1)";

        // 7. When FLIP finishes: reveal real hero, remove proxy.
        //    Content stagger animations are already playing (CSS delays from frame 0).
        setTimeout(() => {
          proxy.remove();
          this._proxy = null;
          heroEl.style.visibility = "visible";
          this.navigation.isTransitioning = false;
          this._transitioning = false;
        }, FLIP_MS + 20);
      });
    });

    // Clean up entering class after all stagger animations complete
    setTimeout(() => {
      this._projectView.classList.remove("project-page--entering");
    }, 1550);
  }

  /* -------------------------------------------------------------------------
     Reverse: project → gallery
     One motion: image shrinks from hero rect back to gallery plane rect.
     ------------------------------------------------------------------------- */

  showGallery(fromProjectId) {
    if (this._transitioning) return;
    this._transitioning = true;

    const project = fromProjectId ? getProjectById(fromProjectId) : null;

    // 1. Scroll to top so the hero is in-viewport, then measure its rect
    this._projectView.scrollTop = 0;
    const heroEl = this._projectView.querySelector(".project-page__hero");
    const fromRect = heroEl ? heroEl.getBoundingClientRect() : null;

    // 2. Position gallery at focal view (hidden) so we can measure target
    this.navigation.isTransitioning = true;
    this.scroll.lock();

    const planeIndex = fromProjectId
      ? this.gallery.planes.findIndex((p) => p.userData.project.id === fromProjectId)
      : -1;

    if (planeIndex !== -1) {
      const focalZ = this.gallery.getPlaneFocalZ(planeIndex);
      this.scroll.setCameraX(0);
      this.scroll.setCameraZ(focalZ);
      const focalScroll = this.scroll._scrollFromCameraZ(focalZ);
      this.scroll.scrollTarget = focalScroll;
      this.scroll.scrollCurrent = focalScroll;
      this.scroll.previousScrollCurrent = focalScroll;
      this.intro.snapHide();
      this.cardOverlay.setAllOpacity(0);

      // Hide ALL planes during the FLIP so only the mood background is
      // visible through the canvas — prevents the "double image" where
      // the Three.js focal plane appears at its resting position while
      // the proxy is still mid-animation. -1 matches no valid index.
      this.gallery.forceVisiblePlane(-1);

      // Zero parallax before measuring toRect — pointerCurrent may still carry
      // the pre-transition parallax offset. After 700ms updatePlaneMotion will
      // have lerped it to ~0; measure now so proxy lands at the same position
      // the plane will actually be at when the canvas is revealed.
      this.gallery.pointerCurrent.set(0, 0);
      this.gallery.updatePlaneMotion(0);
    }

    this._revealGallery();
    this._setGalleryOpacity(0);

    // 3. Get the plane's screen rect (where the proxy will land).
    //    Camera was just repositioned — update matrices before projecting.
    this.scroll.camera.updateMatrixWorld();
    const toRect = planeIndex !== -1
      ? this.gallery.getPlaneScreenRect(planeIndex, this.scroll.camera)
      : null;

    if (fromRect && toRect && project) {
      // 4. Render proxy at HERO size (crisp) and animate DOWN to gallery plane.
      //    Proxy starts at hero rect with no transform, then shrinks+moves to plane.
      const proxy = this._createProxy(project.hero, fromRect);

      const endScaleX = toRect.width / fromRect.width;
      const endScaleY = toRect.height / fromRect.height;
      const fromCx = fromRect.left + fromRect.width / 2;
      const fromCy = fromRect.top + fromRect.height / 2;
      const toCx = (toRect.x ?? toRect.left) + toRect.width / 2;
      const toCy = (toRect.y ?? toRect.top) + toRect.height / 2;
      const endDx = toCx - fromCx;
      const endDy = toCy - fromCy;

      proxy.style.transformOrigin = "center center";
      proxy.style.transform = "translate(0, 0) scale(1, 1)";

      // 5. Hide project view immediately (proxy covers the hero)
      this._projectView.hidden = true;
      this._projectView.style.opacity = "0";
      clearProject();

      // 6. Animate proxy to gallery plane position (shrinks + moves).
      //    Simultaneously fade the gallery in behind the proxy so the
      //    canvas is already visible when the proxy is removed — no snap.
      //    The completion timeout lives INSIDE the double-rAF so it starts
      //    counting from when the CSS transition actually begins — not from
      //    when showGallery was called. Without this, the ~33ms rAF delay
      //    causes the timeout to fire before the transition finishes,
      //    removing the proxy mid-animation and creating a visible snap.
      const distance = Math.sqrt(endDx * endDx + endDy * endDy);
      const dynamicMs = Math.max(500, Math.min(900, FLIP_MS * (distance / 400)));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          proxy.style.transition = `transform ${dynamicMs}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
          proxy.style.transform = `translate(${endDx}px, ${endDy}px) scale(${endScaleX}, ${endScaleY})`;

          this._setGalleryOpacity(1, dynamicMs);

          const HANDOFF_MS = 120;
          setTimeout(() => {
            this.gallery.forceVisiblePlane(planeIndex);
            const focalPlane = this.gallery.planes[planeIndex];
            if (focalPlane.material.uniforms) {
              focalPlane.material.uniforms.uOpacity.value = 1;
              focalPlane.material.uniforms.uBlur.value = 0;
            }

            proxy.style.transition = `opacity ${HANDOFF_MS}ms ease`;
            proxy.style.opacity = "0";

            setTimeout(() => {
              this._setGalleryOpacity(1);
              proxy.remove();
              this._proxy = null;

              this._currentProjectId = null;
              history.pushState(null, "", window.location.pathname);
              document.title = "Pedja Ristic — Portfolio";
              fadeStatusBar(false);

              this.gallery.releaseForcedPlane();
              this.scroll.unlock();
              this.intro.snapHide();
              this.intro.forceHide(false);
              this.navigation._returnFadeStart = performance.now();
              this.navigation.isTransitioning = false;
              this._transitioning = false;
            }, HANDOFF_MS + 20);
          }, dynamicMs + 20);
        });
      });
    } else {
      this._showGalleryImmediate();
    }
  }

  /* -- Immediate (popstate / deep-link) ----------------------------------- */

  _showProjectImmediate(projectId) {
    renderProject(projectId);
    this._projectView.style.transition = "none";
    this._projectView.style.opacity = "1";
    this._projectView.hidden = false;
    this._projectView.scrollTop = 0;
    this._hideGallery();
    this._currentProjectId = projectId;
    document.title = `${getProjectById(projectId).label} — Pedja Ristic`;
  }

  _showGalleryImmediate() {
    this._projectView.style.transition = "none";
    this._projectView.style.opacity = "0";
    this._projectView.hidden = true;
    clearProject();
    this._revealGallery();
    this._setGalleryOpacity(1);
    this.scroll.unlock();
    this.navigation.isTransitioning = false;
    this._transitioning = false;
    this._currentProjectId = null;
    document.title = "Pedja Ristic — Portfolio";
  }

  /* -- Proxy --------------------------------------------------------------- */

  _createProxy(src, rect) {
    const proxy = document.createElement("div");
    proxy.className = "flip-proxy";
    const x = rect.left ?? rect.x ?? 0;
    const y = rect.top ?? rect.y ?? 0;
    proxy.style.left = `${x}px`;
    proxy.style.top = `${y}px`;
    proxy.style.width = `${rect.width}px`;
    proxy.style.height = `${rect.height}px`;
    proxy.innerHTML = `<img src="${src}" alt="" />`;
    document.body.appendChild(proxy);
    this._proxy = proxy;
    return proxy;
  }

  /* -- Gallery visibility -------------------------------------------------- */

  _setGalleryOpacity(value, durationMs = 0) {
    // intro and scrollIndicator manage their own opacity via intro.js and the
    // tick loop — forcing them here causes a one-frame flash at transition end.
    const managed = new Set(["canvas", "overlay", "vignette"]);
    for (const [key, el] of Object.entries(this._galleryEls)) {
      if (!el || !managed.has(key)) continue;
      el.style.transition = durationMs > 0 ? `opacity ${durationMs}ms ease` : "none";
      el.style.opacity = String(value);
    }
  }

  _hideGallery() {
    for (const [key, el] of Object.entries(this._galleryEls)) {
      if (!el) continue;
      if (key === "canvas") continue;
      el.style.visibility = "hidden";
    }
    this.gallery.planes.forEach((p) => { p.visible = false; });
    this.scroll.lock();
  }

  _revealGallery() {
    for (const el of Object.values(this._galleryEls)) {
      if (el) el.style.visibility = "";
    }
    this.gallery.planes.forEach((p) => { p.visible = true; });
  }

  _readHash() {
    return window.location.hash.replace("#", "").trim() || null;
  }
}
