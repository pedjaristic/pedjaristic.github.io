/* ============================================================================
   project-view.js
   Renders a project into the #project-view container from data.js.
   ========================================================================= */

import { getProjectById, getNextProject } from "./data.js";

const ARROW_ICON = "url('/assets/icons/white/Arrow 2.svg')";
const EXTERNAL_LINK_ICON = "url('/assets/icons/white/external-link-sharp.svg')";

const DEFAULT_META_FIELDS = [
  { label: "Role", key: "role" },
  { label: "Scope", key: "scope" },
  { label: "Status", key: "status" },
  { label: "Team", key: "team" },
];

const container = () => document.getElementById("project-view");

/** @type {IntersectionObserver | null} */
let videoObserver = null;
const videoPaused = new WeakSet();

function renderMediaItem(m) {
  if (m.type === "video") {
    const poster = m.poster ? ` poster="${m.poster}"` : "";
    return `<video class="project-video" data-src="${m.src}"${poster} muted loop playsinline controls controlsList="nofullscreen nodownload noremoteplayback noplaybackrate" disablePictureInPicture disableRemotePlayback preload="none" data-autoplay-on-scroll aria-label="${m.alt || ""}"></video>`;
  }
  return `<img src="${m.src}" alt="${m.alt || ""}" loading="lazy" />`;
}

function renderArtifact(a) {
  if (a.type === "stats") {
    return `<figure class="supporting-artifact supporting-artifact--stats">
        <dl class="artifact-stats">
          ${a.items
            .map(
              (s) =>
                `<div class="artifact-stats__item">
            <dt class="artifact-stats__value">${s.value}</dt>
            <dd class="artifact-stats__label">${s.label}</dd>
          </div>`
            )
            .join("\n          ")}
        </dl>
      </figure>`;
  }
  if (a.type === "callout") {
    return `<figure class="supporting-artifact supporting-artifact--callout">
        <blockquote class="artifact-callout">${a.text}</blockquote>
      </figure>`;
  }
  return `<figure class="supporting-artifact">
        <div class="supporting-artifact__media">
          <img src="${a.src}" alt="${a.alt}" loading="lazy" />
        </div>
        <figcaption class="supporting-artifact__caption">${a.caption}</figcaption>
      </figure>`;
}

function renderSourceLink(link) {
  if (!link) return "";
  return `<p class="project-section__source">
    <a class="project-section__source-link" href="${link.href}" target="_blank" rel="noopener noreferrer">[<span class="project-section__source-icon" style="--icon: ${EXTERNAL_LINK_ICON}" aria-hidden="true"></span>] ${link.credit}</a>
  </p>`;
}

function renderSectionCopy(s) {
  const titleHtml = s.title
    ? `<h2 class="project-section__title">${s.title}</h2>`
    : "";
  const descHtml = s.description?.length
    ? `<div class="project-section__text project-section__text--overlay">${s.description.map((p) => `<p>${p}</p>`).join("")}</div>`
    : "";
  return `${titleHtml}${descHtml}${renderSourceLink(s.sourceLink)}`;
}

function renderCinematicBlock(s) {
  return `<div class="project-section__cinematic">
      <div class="project-section__backdrop">${renderMediaItem(s.backdrop)}</div>
      <div class="project-section__overlay">${renderSectionCopy(s)}</div>
    </div>`;
}

function renderSection(s) {
  const titleHtml = s.title
    ? `<h2 class="project-section__title">${s.title}</h2>`
    : "";
  const descHtml = s.description?.length
    ? `<div class="project-section__text">${s.description.map((p) => `<p>${p}</p>`).join("")}</div>`
    : "";

  if (s.layout === "cinematic-stack") {
    return `<section class="project-section project-section--cinematic-stack">
      ${renderCinematicBlock(s)}
      <figure class="project-section__follow">${renderMediaItem(s.follow)}</figure>
    </section>`;
  }

  if (s.layout === "cinematic") {
    return `<section class="project-section project-section--cinematic">
      ${renderCinematicBlock(s)}
    </section>`;
  }

  if (s.layout === "text-media") {
    return `<section class="project-section project-section--text-media">
      <div class="project-section__copy">${titleHtml}${descHtml}</div>
      <div class="project-section__media">${s.media.map((m) =>
        `<div class="project-section__media-item">${renderMediaItem(m)}</div>`
      ).join("")}</div>
    </section>`;
  }

  if (s.layout === "labeled-grid") {
    const naturalClass = s.mediaFit === "contain" ? " project-section__labeled-grid--natural" : "";
    return `<section class="project-section project-section--labeled-grid">
      ${titleHtml}${descHtml}
      <div class="project-section__labeled-grid${naturalClass}">${s.columns
        .map((col) => {
          const titleBlock = col.title
            ? `<h2 class="project-section__column-title">${col.title}</h2>`
            : "";
          const mediaClass = s.mediaFit === "contain" ? " project-section__media-item--natural" : "";
          const captionBlock = col.caption
            ? `<span class="project-section__caption">${col.caption}</span>`
            : "";
          return `<div class="project-section__column">
        ${titleBlock}
        <div class="project-section__media-item${mediaClass}">${renderMediaItem(col.media)}</div>
        ${captionBlock}
      </div>`;
        })
        .join("")}</div>
    </section>`;
  }

  if (s.layout === "media-quote") {
    return `<section class="project-section project-section--media-quote">
      ${titleHtml}
      <div class="project-section__media-quote">
        <div class="project-section__media-quote-media">${renderMediaItem(s.media)}</div>
        <blockquote class="project-section__quote">${s.quote}</blockquote>
      </div>
    </section>`;
  }

  if (s.layout === "media-grid") {
    const cols = s.columns || 2;
    const naturalClass = s.mediaFit === "contain" ? " project-section__grid--natural" : "";
    const captionsHtml = s.captions?.length
      ? `<div class="project-section__captions project-section__captions--${cols}">${s.captions.map((c) =>
          `<span class="project-section__caption">${c}</span>`
        ).join("")}</div>`
      : "";
    return `<section class="project-section project-section--media-grid${cols === 3 ? " project-section--media-grid-wide" : ""}">
      ${titleHtml}${descHtml}
      <div class="project-section__grid project-section__grid--${cols}${naturalClass}">${s.media.map((m) => {
        const itemClass = s.mediaFit === "contain" ? " project-section__media-item--natural" : "";
        return `<div class="project-section__media-item${itemClass}">${renderMediaItem(m)}</div>`;
      }).join("")}</div>
      ${captionsHtml}
    </section>`;
  }

  if (s.layout === "feature") {
    const captionHtml = s.caption
      ? `<span class="project-section__caption">${s.caption}</span>`
      : "";
    return `<section class="project-section project-section--feature">
      ${titleHtml}${descHtml}
      <div class="project-section__feature-media">${renderMediaItem(s.media)}</div>
      ${captionHtml}
    </section>`;
  }

  return "";
}

function renderHeroMeta(project) {
  const keys = project.metaFields || ["role", "scope", "status", "team"];
  const fields = keys.map((key) => DEFAULT_META_FIELDS.find((f) => f.key === key)).filter(Boolean);
  const layoutClass =
    project.metaLayout === "stack"
      ? " project-page__meta--stack"
      : fields.length <= 3
        ? " project-page__meta--compact"
        : "";

  return `<div class="project-page__meta${layoutClass}" aria-label="Project metadata">
          ${fields
            .map(
              (field) =>
                `<div class="project-page__meta-group">
            <span class="project-page__meta-label">${field.label}</span>
            <span class="project-page__meta-value">${project[field.key]}</span>
          </div>`
            )
            .join("\n          ")}
        </div>`;
}

function renderHeroBrand(project) {
  if (project.companyLogo) {
    return `<img class="project-page__company-logo" src="${project.companyLogo}" alt="${project.companyName || ""}" />`;
  }
  if (project.heroEyebrow) {
    return `<span class="project-page__eyebrow">${project.heroEyebrow}</span>`;
  }
  return `<span class="project-page__year">${project.year}</span>`;
}

function renderHeroTagline(project) {
  if (project.taglineLines?.length) {
    return `<p class="project-page__tagline">${project.taglineLines
      .map((line) => `<span class="project-page__tagline-line">${line}</span>`)
      .join("")}</p>`;
  }
  return `<p class="project-page__tagline">${project.tagline}</p>`;
}

/**
 * Populate the project view with content for `projectId`.
 * Returns the project object, or null if not found.
 */
export function renderProject(projectId) {
  const el = container();
  if (!el) return null;

  const project = getProjectById(projectId);
  if (!project) return null;

  if (el.innerHTML) releaseProjectVideos(el);

  const next = getNextProject(projectId);

  el.innerHTML = `
    <a class="project-page__back" href="#" data-project-home aria-label="Back to gallery">
      <span class="project-page__back-icon" style="--icon: ${ARROW_ICON}" aria-hidden="true"></span>
    </a>

    <div class="project-page__hero-band">
      <figure class="project-page__hero">
        <img src="${project.hero}" alt="${project.heroAlt}" />
      </figure>

      <header class="project-page__header">
        ${renderHeroBrand(project)}
        <h1 class="project-page__title">${project.label}</h1>
        ${renderHeroTagline(project)}
        ${renderHeroMeta(project)}
      </header>
    </div>

    <section class="project-page__body">
      ${project.bodyLabel ? `<span class="project-page__body-label">${project.bodyLabel}</span>` : ""}
      ${project.body.map((p) => `<p>${p}</p>`).join("\n      ")}
    </section>

    ${
      project.sections?.length
        ? project.sections.map((s) => renderSection(s)).join("\n    ")
        : ""
    }

    ${
      project.artifacts?.length
        ? `<section class="project-page__supporting" aria-label="Supporting work">
      ${project.artifacts.map((a) => renderArtifact(a)).join("\n      ")}
    </section>`
        : ""
    }

    ${
      project.workstreams && project.workstreams.length
        ? `<section class="project-page__workstreams" aria-label="Related workstreams">
      <h2 class="project-page__workstreams-heading">Also on ${project.label}</h2>
      <ol class="project-page__workstreams-list">
        ${project.workstreams
          .map(
            (w) =>
              `<li><strong>${w.name}</strong> — ${w.description}</li>`
          )
          .join("\n        ")}
      </ol>
    </section>`
        : ""
    }

    ${
      project.beat
        ? `<section class="project-page__beat" aria-label="${project.beat.label}">
      <p class="project-page__beat-label">${project.beat.label}</p>
      <p class="project-page__beat-text">${project.beat.text}</p>
    </section>`
        : ""
    }

    <nav class="project-page__next" aria-label="Next project">
      <span class="project-page__next-label">${project.nextLabel || "Next Project"}</span>
      ${
        next
          ? `<a class="project-page__next-link" href="#${next.id}" data-project-next="${next.id}"><span class="project-page__next-text">${next.label}</span><span class="project-page__next-arrow" style="--icon: ${ARROW_ICON}" aria-hidden="true"></span></a>`
          : `<a class="project-page__next-link" href="#" data-project-home><span class="project-page__next-text">All projects</span><span class="project-page__next-arrow" style="--icon: ${ARROW_ICON}" aria-hidden="true"></span></a>`
      }
    </nav>
  `;

  el.dataset.projectId = projectId;
  el.scrollTop = 0;

  initVideoAutoplay(el);

  return project;
}

function loadVideoSource(video) {
  const src = video.dataset.src;
  if (!src || video.dataset.loaded === "true") return Promise.resolve(video);
  video.src = src;
  video.load();
  video.dataset.loaded = "true";
  return new Promise((resolve) => {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      resolve(video);
      return;
    }
    const done = () => {
      video.removeEventListener("loadeddata", done);
      video.removeEventListener("error", done);
      resolve(video);
    };
    video.addEventListener("loadeddata", done, { once: true });
    video.addEventListener("error", done, { once: true });
  });
}

function playVideoIfAllowed(video) {
  if (!videoPaused.has(video)) {
    video.play().catch(() => {});
  }
}

function initVideoAutoplay(root) {
  if (videoObserver) {
    videoObserver.disconnect();
    videoObserver = null;
  }

  const videos = root.querySelectorAll("video[data-autoplay-on-scroll]");
  if (!videos.length) return;

  videos.forEach((v) => {
    v.addEventListener("pause", () => {
      if (!v.ended) videoPaused.add(v);
    });
    v.addEventListener("play", () => {
      videoPaused.delete(v);
    });
  });

  videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const v = entry.target;
        if (entry.isIntersecting) {
          loadVideoSource(v).then(() => playVideoIfAllowed(v));
        } else if (!v.paused) {
          v.pause();
          videoPaused.delete(v);
        }
      });
    },
    { threshold: 0.15, rootMargin: "400px 0px", root }
  );

  videos.forEach((v) => videoObserver.observe(v));

  const firstCinematic = root.querySelector(
    ".project-section--cinematic .project-section__backdrop video[data-autoplay-on-scroll], .project-section--cinematic-stack .project-section__backdrop video[data-autoplay-on-scroll]"
  );
  if (firstCinematic) {
    loadVideoSource(firstCinematic).then(() => playVideoIfAllowed(firstCinematic));
  }
}

function releaseProjectVideos(root) {
  if (videoObserver) {
    videoObserver.disconnect();
    videoObserver = null;
  }

  root.querySelectorAll("video").forEach((v) => {
    v.pause();
    v.removeAttribute("src");
    delete v.dataset.loaded;
    v.load();
  });
}

/** Reset the project view to empty and clear mood styles. */
export function clearProject() {
  const el = container();
  if (el) {
    if (el.innerHTML) releaseProjectVideos(el);
    el.innerHTML = "";
    delete el.dataset.projectId;
  }
  document.body.style.background = "";
  if (el) el.style.background = "";
  document.documentElement.style.removeProperty("--page-accent");
  document.documentElement.style.removeProperty("--page-canvas");
}
