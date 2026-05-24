/* ============================================================================
   hero-images.js
   Decode-cached <img> elements for FLIP proxy handoff. WebGL textures and
   DOM <img> decode separately — preloading here prevents first-click flicker.
   ========================================================================= */

/** @type {Map<string, Promise<HTMLImageElement>>} */
const pending = new Map();

/** @type {Map<string, HTMLImageElement>} */
const pool = new Map();

/** Load and decode a hero URL for DOM use (FLIP proxy). */
export function preloadHeroImage(url) {
  if (!url) return Promise.resolve(null);

  const cached = pool.get(url);
  if (cached) return Promise.resolve(cached);
  if (pending.has(url)) return pending.get(url);

  const load = new Promise((resolve) => {
    const img = new Image();
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;

      const done = () => {
        pool.set(url, img);
        resolve(img);
      };

      if (typeof img.decode === "function") {
        img.decode().then(done).catch(done);
      } else {
        done();
      }
    };

    img.onload = finish;
    img.onerror = () => resolve(null);
    img.src = url;

    if (img.complete && img.naturalWidth) finish();
  });

  pending.set(url, load);
  return load;
}

/** Preload all project hero URLs. Safe to call multiple times. */
export function preloadHeroImages(urls) {
  return Promise.all(urls.map(preloadHeroImage));
}

/** Borrow the decoded <img> for a FLIP proxy (same element, not a new one). */
export function acquireHeroImage(url) {
  return preloadHeroImage(url);
}

/** Return a borrowed <img> to the off-DOM pool after the FLIP completes. */
export function reclaimHeroImage(url, img) {
  if (!url || !(img instanceof HTMLImageElement)) return;
  img.remove();
  pool.set(url, img);
}
