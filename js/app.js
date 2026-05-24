/* ============================================================================
   app.js — SPA entry point.
   Wires together: engine, gallery, scroll, mood, card overlay, intro, nav,
   and the hash router that FLIP-transitions between gallery and project views.
   ========================================================================= */

import { Engine } from "./engine.js";
import { Gallery } from "./gallery.js";
import { ScrollController } from "./scroll.js";
import { MoodBackground } from "./mood.js";
import { CardOverlay } from "./card-overlay.js";
import { IntroLayer } from "./intro.js";
import { Navigation } from "./navigation.js";
import { Router } from "./router.js";
import { projects } from "./data.js";
import { preloadHeroImages } from "./hero-images.js";
import { scrambleText } from "./text-scramble.js";

async function bootstrap() {
  const canvas = document.querySelector(".gallery-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Missing <canvas class='gallery-canvas'> on this page.");
  }

  document.body.classList.add("body--gallery");

  const engine = new Engine(canvas);

  const textures = new Map();
  const firstHero = projects[0].hero;
  const heroUrls = projects.map((p) => p.hero);

  const [firstTexture] = await Promise.all([
    engine.loadTexture(firstHero),
    preloadHeroImages(heroUrls),
  ]);
  if (firstTexture) textures.set(firstHero, firstTexture);

  const gallery = new Gallery(projects, textures);
  gallery.init(engine.scene);
  const updateFilmOffset = () => {
    engine.camera.filmOffset = window.innerWidth <= 768 ? 0 : 4;
    engine.camera.updateProjectionMatrix();
  };
  updateFilmOffset();
  engine.onResize(updateFilmOffset);
  engine.onResize(() => {
    gallery.updatePlaneScale();
    gallery.layoutPlanes();
  });

  const scroll = new ScrollController(engine.camera, gallery, {
    snapDurationMs: 600,
  });
  scroll.init();
  scroll.bindEvents();

  const mood = new MoodBackground();
  mood.setPaletteFromProject(projects[0]);
  engine.scene.userData.backgroundRenderer = (renderer) =>
    mood.render(renderer);

  const overlayContainer = document.querySelector(".gallery-overlay");
  const cardOverlay = new CardOverlay({
    container: overlayContainer,
    gallery,
    scroll,
  });
  cardOverlay.init();

  const intro = new IntroLayer({ scroll, gallery });
  const navigation = new Navigation({ scroll, gallery, cardOverlay, intro });

  // SPA router — owns gallery↔project FLIP transitions
  const router = new Router({ scroll, gallery, cardOverlay, intro, navigation });
  navigation.setRouter(router);
  router.init();

  if (!router.getCurrentProjectId()) {
    intro.playEntrance();
  }

  for (let i = 1; i < projects.length; i++) {
    const project = projects[i];
    engine.loadTexture(project.hero).then((texture) => {
      if (!texture) return;
      textures.set(project.hero, texture);
      gallery.setPlaneTexture(i, texture);
    });
  }

  const scrollIndicator = document.querySelector(".scroll-indicator");
  const scrollText = document.querySelector(".scroll-indicator__text");
  if (scrollText) {
    scrambleText(scrollText, "(scroll)", 800);
  }

  const emailLink = document.querySelector(".status-bar__email");
  if (emailLink) {
    const emailIcon = emailLink.querySelector(".status-bar__icon");
    const emailLabel = emailLink.querySelector(".status-bar__email-label");
    const defaultIcon = "url('/assets/icons/white/Add_Messages.svg')";
    const copiedIcon = "url('/assets/icons/white/Complete.svg')";
    let restoreTimer = null;

    emailLink.addEventListener("click", (e) => {
      e.preventDefault();
      const addr = emailLink.dataset.email;
      if (!addr) return;

      if (restoreTimer) clearTimeout(restoreTimer);

      navigator.clipboard.writeText(addr).then(() => {
        emailIcon.style.setProperty("--icon", copiedIcon);
        emailLink.style.color = "var(--color-accent)";
        scrambleText(emailLabel, "COPIED", 400);

        restoreTimer = setTimeout(() => {
          emailIcon.style.setProperty("--icon", defaultIcon);
          emailLink.style.color = "";
          scrambleText(emailLabel, "EMAIL", 400);
          restoreTimer = null;
        }, 3000);
      });
    });
  }

  engine.onTick((time, camera) => {
    const projectOpen = router.getCurrentProjectId() != null;
    engine.setRenderScene(!projectOpen);

    if (projectOpen) {
      mood.update(time);
      return;
    }

    scroll.update();
    gallery.updatePlaneVisibility(camera.position.z);
    gallery.updatePlaneMotion(scroll.getVelocityIntensity());

    const blendData = gallery.getPlaneBlendData(camera.position.z);
    if (blendData) {
      const from = projects[blendData.currentPlaneIndex];
      const to = projects[blendData.nextPlaneIndex];
      mood.blendPalettes(from, to, blendData.blend);
    }
    mood.setVelocityIntensity(scroll.getVelocityIntensity());
    mood.update(time);

    intro.update(camera);

    const introOpacity = intro.currentOpacity;
    const entryProgress = intro.getEntryProgress(camera.position.z);

    if (!navigation.isTransitioning) {
      const canvasMin = 0.18;
      const canvasReveal = 1 - introOpacity;
      canvas.style.opacity = (canvasMin + (1 - canvasMin) * canvasReveal).toFixed(3);
    }

    const CARD_REVEAL_START = 0.5;
    const CARD_REVEAL_END = 0.85;
    const RETURN_CARD_FADE_MS = 400;
    const cardRevealRaw = Math.max(
      0,
      Math.min(
        1,
        (entryProgress - CARD_REVEAL_START) /
          (CARD_REVEAL_END - CARD_REVEAL_START)
      )
    );

    let cardReveal;
    if (navigation.isTransitioning) {
      cardReveal = 0;
    } else if (navigation._returnFadeStart) {
      const elapsed = performance.now() - navigation._returnFadeStart;
      const fade = Math.min(1, elapsed / RETURN_CARD_FADE_MS);
      cardReveal = fade * cardRevealRaw;
      if (elapsed >= RETURN_CARD_FADE_MS) {
        navigation._returnFadeStart = null;
      }
    } else {
      cardReveal = cardRevealRaw;
    }
    cardOverlay.update(camera, cardReveal);

    if (scrollIndicator) {
      scrollIndicator.style.opacity = String(intro.currentOpacity);
    }
  });

  engine.start();
}

bootstrap().catch((err) => {
  console.error("Portfolio bootstrap failed:", err);
});
