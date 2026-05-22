/* ============================================================================
   status-bar.js
   Persistent top-of-viewport bar. The breathing pulse is CSS-driven via the
   `status-bar-pulse` keyframe. This module exposes hooks for fading the bar
   during the zoom-to-project transition.
   ========================================================================= */

const STATUS_BAR_SELECTOR = ".status-bar";

export function getStatusBarElement() {
  return document.querySelector(STATUS_BAR_SELECTOR);
}

export function fadeStatusBar(isFading = true) {
  const el = getStatusBarElement();
  if (!el) return;
  el.classList.toggle("is-fading", Boolean(isFading));
}
