/* ============================================================================
   text-scramble.js
   Lightweight text scramble animation — cycles through random characters
   before settling on the final string. Used by the scroll indicator (on
   page load) and hover chrome (on mouseenter).
   ========================================================================= */

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*()_+-=[]{}|;:,.<>?";
const FRAME_INTERVAL = 30;

/**
 * Scramble text into an element over a given duration.
 * @param {HTMLElement} el     Target element
 * @param {string}      text   Final text to resolve to
 * @param {number}      durationMs  Total animation time (default 500)
 * @returns {function}  Cancel function
 */
export function scrambleText(el, text, durationMs = 500) {
  if (!el || !text) return () => {};

  const length = text.length;
  const startTime = performance.now();
  let frameId = null;

  function tick() {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(1, elapsed / durationMs);
    const resolvedCount = Math.floor(progress * length);

    let output = "";
    for (let i = 0; i < length; i++) {
      if (i < resolvedCount) {
        output += text[i];
      } else if (/\s/.test(text[i])) {
        output += text[i];
      } else {
        output += CHARS[Math.floor(Math.random() * CHARS.length)];
      }
    }

    el.textContent = output;

    if (progress < 1) {
      frameId = setTimeout(tick, FRAME_INTERVAL);
    } else {
      el.textContent = text;
    }
  }

  tick();

  return () => {
    if (frameId != null) clearTimeout(frameId);
  };
}
