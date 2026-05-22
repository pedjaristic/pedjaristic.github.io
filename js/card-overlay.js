/* ============================================================================
   card-overlay.js
   A single pair of fixed text panels (LEFT title + RIGHT metadata) anchored
   at the viewport edges, plus a transparent hit-area button that overlays
   the dominant plane's screen rect. Content swaps to whichever project is
   "dominant" in the current camera view (blend >= 0.5 -> next plane).

   Hover chrome (corner brackets, inner border/shadow, status text, vertical
   year) is positioned identically to the hit area and revealed on hover
   via CSS. Text scramble animation fires on mouseenter.
   ========================================================================= */

import { scrambleText } from "./text-scramble.js";

const CARD_TEMPLATE_ID = "project-card-template";

export class CardOverlay {
  constructor({ container, gallery, scroll }) {
    this.container = container;
    this.gallery = gallery;
    this.scroll = scroll || null;
    this.element = null;
    this.activeProjectId = null;
    this.activePlaneIndex = -1;
    this._clickHandlers = new Set();
    this._refs = {};
    this._isHovered = false;
    this._scrambleAbort = null;
  }

  init() {
    const template = document.getElementById(CARD_TEMPLATE_ID);
    if (!(template instanceof HTMLTemplateElement)) {
      throw new Error(`Missing <template id="${CARD_TEMPLATE_ID}">`);
    }

    const fragment = template.content.cloneNode(true);
    const root = fragment.querySelector(".project-card");
    if (!root) throw new Error("Card template missing .project-card root");

    root.style.opacity = "0";

    this._refs = {
      index: root.querySelector(".project-card__index"),
      label: root.querySelector(".project-card__label"),
      companyLogo: root.querySelector(".project-card__company-logo"),
      companyName: root.querySelector(".project-card__company-name"),
      tagline: root.querySelector(".project-card__tagline"),
      role: root.querySelector(".project-card__role"),
      scope: root.querySelector(".project-card__scope"),
      hit: root.querySelector(".project-card__hit"),
      hoverChrome: root.querySelector(".project-card__hover-chrome"),
      hoverStatus: root.querySelector(".hover-chrome__status"),
      hoverYear: root.querySelector(".hover-chrome__year"),
      rightPanel: root.querySelector(".project-card__right"),
    };

    if (this._refs.hit) {
      this._refs.hit.addEventListener("click", (event) => {
        event.preventDefault();
        const project = this._getActiveProject();
        if (!project) return;
        this._clickHandlers.forEach((handler) => handler(project, root));
      });

      this._refs.hit.addEventListener("mouseenter", () => {
        this._isHovered = true;
        this._runHoverScramble();
      });

      this._refs.hit.addEventListener("mouseleave", () => {
        this._isHovered = false;
      });
    }

    this.element = root;
    this.container.appendChild(root);
  }

  onCardClick(handler) {
    if (typeof handler !== "function") return () => {};
    this._clickHandlers.add(handler);
    return () => this._clickHandlers.delete(handler);
  }

  update(camera, globalOpacity = 1) {
    if (!this.element) return;
    const blendData = this.gallery.getPlaneBlendData(camera.position.z);
    if (!blendData) return;
    const { currentPlaneIndex, nextPlaneIndex, blend } = blendData;
    const dominantIndex = blend >= 0.5 ? nextPlaneIndex : currentPlaneIndex;
    const project = this.gallery.projects[dominantIndex];
    if (!project) return;

    if (this.activeProjectId !== project.id) {
      this._applyContent(project, dominantIndex);
      this.activeProjectId = project.id;
    }
    this.activePlaneIndex = dominantIndex;

    const opacity = Math.max(0, Math.min(1, globalOpacity));
    this.element.style.opacity = opacity.toFixed(3);
    this.element.style.pointerEvents = opacity > 0.5 ? "auto" : "none";

    this._positionHitArea(camera, opacity);
  }

  setAllOpacity(opacity) {
    if (!this.element) return;
    this.element.style.opacity = String(opacity);
    this.element.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
    if (this._refs.hit) {
      this._refs.hit.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
    }
  }

  _getActiveProject() {
    return this.gallery.projects.find((p) => p.id === this.activeProjectId);
  }

  _applyContent(project, index) {
    const r = this._refs;
    r.index.textContent = String(index + 1).padStart(2, "0");
    r.label.textContent = project.label;

    if (r.companyLogo && project.companyLogo) {
      r.companyLogo.src = project.companyLogo;
      r.companyLogo.alt = project.companyName || "";
    }
    if (r.companyName) {
      r.companyName.textContent = project.companyName || "";
    }

    r.tagline.textContent = project.tagline;
    r.role.textContent = project.role;
    r.scope.textContent = project.scope;

    if (r.hoverStatus) {
      r.hoverStatus.textContent = `Status: ${project.status}`;
    }
    if (r.hoverYear) {
      r.hoverYear.textContent = this._formatVerticalYear(project.year);
    }
  }

  _formatVerticalYear(yearStr) {
    if (!yearStr) return "";
    const parts = yearStr.split(/([–—\-])/);
    return parts
      .map((part) => {
        if (/[–—\-]/.test(part)) return "—";
        return part.match(/.{1,2}/g)?.join("\n") || part;
      })
      .join("\n");
  }

  _runHoverScramble() {
    const project = this._getActiveProject();
    if (!project) return;

    if (this._refs.hoverStatus) {
      scrambleText(this._refs.hoverStatus, `Status: ${project.status}`, 400);
    }
    if (this._refs.hoverYear) {
      scrambleText(
        this._refs.hoverYear,
        this._formatVerticalYear(project.year),
        500
      );
    }
  }

  _positionHitArea(camera, opacity) {
    const hit = this._refs.hit;
    const chrome = this._refs.hoverChrome;
    if (!hit) return;

    const rect = this.gallery.getPlaneScreenRect(
      this.activePlaneIndex,
      camera
    );
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      hit.style.opacity = "0";
      hit.style.pointerEvents = "none";
      if (chrome) chrome.style.display = "none";
      return;
    }

    const isTweening = this.scroll && this.scroll._snapTween !== null;

    const x = `${rect.x}px`;
    const y = `${rect.y}px`;
    const w = `${rect.width}px`;
    const h = `${rect.height}px`;

    hit.style.left = x;
    hit.style.top = y;
    hit.style.width = w;
    hit.style.height = h;
    hit.style.pointerEvents = !isTweening && opacity > 0.5 ? "auto" : "none";
    hit.style.opacity = "1";

    if (chrome) {
      chrome.style.opacity = isTweening ? "0" : "";
      chrome.style.display = "";
      chrome.style.left = x;
      chrome.style.top = y;
      chrome.style.width = w;
      chrome.style.height = h;
    }

  }

  dispose() {
    this.element?.remove();
    this.element = null;
    this._clickHandlers.clear();
  }
}
