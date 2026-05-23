import { formatVerticalYear } from "./format-vertical-year.js";

export const HERO_CHROME_SCRIM_VISIBLE_CLASS = "hero-chrome-scrim--visible";

function renderChromeContent(project) {
  return `<span class="hover-chrome__status">Status: ${project.status}</span>
    <span class="hover-chrome__year">${formatVerticalYear(project.year)}</span>`;
}

/** Status + vertical year overlay shared by gallery hover, project hero, and FLIP. */
export function renderHeroChromeHTML(
  project,
  className = "project-page__hero-chrome"
) {
  return `<div class="project-page__hero-chrome-scrim hero-chrome-scrim" aria-hidden="true"></div>
    <div class="${className}" aria-hidden="true">
      ${renderChromeContent(project)}
    </div>`;
}

/** FLIP floater markup — scrim stays hidden until handoff to the project hero. */
export function renderFloaterChromeHTML(project) {
  return `<div class="flip-chrome-floater__scrim hero-chrome-scrim" aria-hidden="true"></div>
    <div class="flip-chrome-floater__content" aria-hidden="true">
      ${renderChromeContent(project)}
    </div>`;
}

export function applyRect(el, rect) {
  el.style.left = `${rect.left ?? rect.x ?? 0}px`;
  el.style.top = `${rect.top ?? rect.y ?? 0}px`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
}

/** Fade the inset scrim in after the image has landed. */
export function settleHeroChrome(container) {
  const scrim = container?.querySelector(".hero-chrome-scrim");
  if (!scrim) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scrim.classList.add(HERO_CHROME_SCRIM_VISIBLE_CLASS);
    });
  });
}

/** Keep a fixed-size chrome layer aligned to a moving FLIP proxy. */
export function trackChromeToProxy(chromeEl, proxyEl, durationMs) {
  const start = performance.now();
  let frameId = null;

  const tick = () => {
    applyRect(chromeEl, proxyEl.getBoundingClientRect());
    if (performance.now() - start < durationMs) {
      frameId = requestAnimationFrame(tick);
    }
  };

  tick();

  return () => {
    if (frameId != null) cancelAnimationFrame(frameId);
  };
}
