/* ============================================================================
   theme.js
   Light / dark mode toggle. Dark is always the first-visit default.
   ========================================================================= */

const STORAGE_KEY = "portfolio-theme";

export function getTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function updateToggleButton(theme) {
  const btn = document.querySelector(".status-bar__theme-toggle");
  if (!btn) return;
  const isLight = theme === "light";
  btn.setAttribute("aria-pressed", String(isLight));
  btn.setAttribute(
    "aria-label",
    isLight ? "Switch to dark mode" : "Switch to light mode"
  );
}

export function setTheme(theme) {
  const next = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* private browsing — preference won't persist */
  }
  updateToggleButton(next);
  window.dispatchEvent(
    new CustomEvent("themechange", { detail: { theme: next } })
  );
}

export function initTheme() {
  let stored = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }

  const theme = stored === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  updateToggleButton(theme);

  const btn = document.querySelector(".status-bar__theme-toggle");
  btn?.addEventListener("click", () => {
    setTheme(getTheme() === "light" ? "dark" : "light");
  });
}
