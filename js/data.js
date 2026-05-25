/* ============================================================================
   data.js — project metadata + page content.
   Single source of truth for everything: gallery cards, project pages,
   transitions, and mood palettes. Edit text and images here.
   ========================================================================= */

/**
 * @typedef {Object} ProjectMood
 * @property {string} bg     CSS custom-property name for background color
 * @property {string} blob1  CSS custom-property name for the primary blob
 * @property {string} blob2  CSS custom-property name for the secondary blob
 *
 * @typedef {Object} ProjectArtifact
 * @property {string} [type]    "image" (default), "stats", or "callout"
 * @property {string} [src]     Image / video path (not used for code-rendered types)
 * @property {string} [alt]     Alt text
 * @property {string} [caption] Mono-spaced label shown beneath the artifact
 * @property {Array}  [items]   Data for "stats" type — array of {value, label}
 * @property {string} [text]    Text content for "callout" type
 *
 * @typedef {Object} ProjectWorkstream
 * @property {string} name        Workstream title
 * @property {string} description One-line description
 *
 * @typedef {Object} ProjectBeat
 * @property {string} label   Small label above the beat text
 * @property {string} text    The beat paragraph
 *
 * @typedef {Object} Project
 * @property {string}   id
 * @property {string}   label
 * @property {string}   year
 * @property {string}   tagline
 * @property {string}   role
 * @property {string}   scope
 * @property {string}   status
 * @property {string}   team
 * @property {string}   hero          Path to the hero image
 * @property {string}   heroAlt       Alt text for the hero image
 * @property {string}   thumb         Small thumbnail (reserved)
 * @property {string[]} body          Body paragraphs (one string per <p>)
 * @property {ProjectArtifact[]} artifacts  Supporting images/videos
 * @property {ProjectWorkstream[]} [workstreams] Related workstreams on the same device
 * @property {ProjectBeat|null}  beat       Optional beat section
 * @property {string|null} nextLabel  Label for the next-project link
 * @property {ProjectMood} mood       Mood palette token names
 * @property {string|null} next       ID of the next project in gallery order
 */

/** @type {Project[]} */
export const projects = [
  {
    id: "rayban",
    label: "Ray-Ban Display",
    year: "2024 - 2026",
    tagline: "Native messaging on the first pair of Ray-Ban's with a display.",
    taglineLines: [
      "Native messaging on the first",
      "pair of Ray-Ban's with a display.",
    ],
    role: "Design Lead",
    scope: "Messaging / Calling",
    status: "Shipped - 2025",
    team: "Reality Labs · Core Apps Design · PM · Eng",
    companyLogo: "assets/meta logo.png",
    companyName: "Meta",
    metaFields: ["role", "scope", "status"],
    metaLayout: "stack",
    hero: "assets/rayban-carousel.jpg",
    heroAlt: "Ray-Ban Meta Display messaging interface",
    thumb: "assets/Images/Ray Ban/thumb-rayban.png",
    bodyLabel: "[IMPACT]",
    body: [
      "Owned end-to-end design across <strong>11+ high-impact messaging features,</strong> shaping core thread, reply, search, and notification experiences. Designed against a glasses-native input model: look, tap, pinch, on a 600×600-pixel display to <strong>ship for Day 1.</strong>",
    ],
    sections: [
      {
        title: "Core Messaging",
        layout: "cinematic-stack",
        description: [
          "End-to-end from IA through to pixel-level handoff, across a glasses-native input model where the primary gestures are look, tap, and pinch.",
          "Thread view built for peripheral reading. Density tuned through user testing against various backgrounds.",
        ],
        backdrop: {
          type: "video",
          src: "assets/Images/Ray Ban/messaging core.mp4",
          alt: "Core messaging on Ray-Ban Display",
        },
        follow: {
          type: "image",
          src: "assets/Images/Ray Ban/core-messaging.png",
          alt: "Core messaging interface on Ray-Ban Display",
        },
      },
      {
        title: "Multi-Media Message",
        layout: "media-grid",
        columns: 2,
        description: [
          "Bundled multi-photo and multi-video message primitive, decluttering the thread for ease of use. <strong>Prioritized and shipped for Day 1</strong> product launch.",
        ],
        media: [
          { type: "video", src: "assets/Images/Ray Ban/before.mp4", alt: "Single media in message threads" },
          { type: "video", src: "assets/Images/Ray Ban/after.mp4", alt: "Multi media in message threads" },
        ],
        captions: ["Single media in message threads.", "Multi media in message threads."],
      },
      {
        title: "Contact Search",
        layout: "cinematic",
        description: [
          "An initial limitation of the glasses was displaying only one recent thread per contact.",
          "I conceptualized and shipped Contact Search which enabled users to search not only their contacts but also their message threads. This feature was <strong>prioritized by Mark Zuckerberg after seeing my proposal</strong>, to ensure it made it into the product for Day 1.",
        ],
        backdrop: {
          type: "video",
          src: "assets/Images/Ray Ban/contact-hero.mp4",
          alt: "Contact search interface on Ray-Ban Display",
        },
      },
      {
        title: null,
        layout: "media-grid",
        columns: 3,
        description: [],
        media: [
          { type: "video", src: "assets/Images/Ray Ban/handwriting.mp4", alt: "Contact search with EMG" },
          { type: "video", src: "assets/Images/Ray Ban/post-day1.mp4", alt: "Tabbed structure for post Day 1" },
          { type: "video", src: "assets/Images/Ray Ban/peek edu.mp4", alt: "First time user education" },
        ],
        captions: ["Contact search with EMG.", "Tabbed structure for post Day 1.", "First-time user education."],
      },
    ],
    artifacts: [],
    workstreams: [],
    beat: null,
    nextLabel: "Next Project",
    mood: {
      bg: "--mood-rayban-bg",
      blob1: "--mood-rayban-blob1",
      blob2: "--mood-rayban-blob2",
    },
    next: "orion",
  },
  {
    id: "orion",
    label: "Project Orion",
    year: "2023 - 2025",
    tagline: "Co-presence as the next communication primitive.",
    taglineLines: [
      "Co-presence as the next",
      "communication primitive.",
    ],
    role: "Design Lead",
    scope: "Co-presence / Calling / Instagram",
    status: "Shipped - 2025",
    team: "Reality Labs · Core Apps · Core UX · PM · Eng",
    companyLogo: "assets/meta logo.png",
    companyName: "Meta",
    metaFields: ["role", "scope", "status"],
    metaLayout: "stack",
    hero: "assets/orion-carousel.png",
    heroAlt: "Orion AR glasses co-presence concept",
    thumb: "assets/Images/Orion/thumb-orion.png",
    bodyLabel: "[IMPACT]",
    body: [
      "Led design across <strong>3 workstreams</strong> on Meta's first true AR glasses, revealed at Connect 2024. <strong>Co-presence, Calling, and Instagram in AR</strong> all shipped as flagship press demos, <strong>presented on stage by Mark Zuckerberg</strong> to a live global audience. Defined system patterns adopted across the platform: exclusive mode apps, shared origin, spatial grabber logic.",
    ],
    sections: [
      {
        title: "Co-Presence",
        layout: "cinematic",
        description: [
          "A new co-presence primitive. A shared augmented world. Two pairs of glasses can see and interact with the same digital objects. I owned the end-to-end experience for both local and remote co-presence, creating a new spatial connection modality.",
        ],
        backdrop: {
          type: "video",
          src: "assets/Images/Orion/Copresence hero.mp4",
          alt: "Co-presence on Orion AR glasses",
        },
        sourceLink: {
          credit: "The Verge",
          href: "https://www.theverge.com/24253908/meta-orion-ar-glasses-demo-mark-zuckerberg-interview",
        },
      },
      {
        layout: "labeled-grid",
        columns: [
          {
            title: "Remote",
            media: {
              type: "video",
              src: "assets/Images/Orion/remote.mp4",
              alt: "Remote co-presence on Orion",
            },
            caption:
              "Co-presence connects you to other AR glasses users. Be together even when you're apart, through the magic of avatars.",
          },
          {
            title: "Local",
            media: {
              type: "video",
              src: "assets/Images/Orion/local.mp4",
              alt: "Local co-presence on Orion",
            },
            caption:
              "Co-presence works seamlessly when two AR glasses users are in proximity. You can connect, share, and interact with the same augmented world.",
          },
        ],
      },
      {
        title: "Calling",
        layout: "cinematic",
        description: [
          "Bringing baseline calling experiences into augmented reality. Positioning, anchor logic, follow mode, and more. I conceptualized and delivered comprehensive design across the calling experience.",
        ],
        backdrop: {
          type: "video",
          src: "assets/Images/Orion/Calling hero.mp4",
          alt: "Calling on Orion AR glasses",
        },
      },
      {
        layout: "media-grid",
        columns: 2,
        description: [],
        media: [
          {
            type: "video",
            src: "assets/Images/Orion/calling.mp4",
            alt: "Multi person calling on Orion",
          },
          {
            type: "video",
            src: "assets/Images/Orion/calling2.mp4",
            alt: "Person calling someone at work on Orion",
          },
        ],
        captions: [
          "Multitasking surfaces calling as a 2D window so users can multitask and stay in a shared session.",
          "On-the-go mode lets you take your call with you wherever you go while still physically hands-free.",
        ],
      },
      {
        title: "Instagram",
        layout: "cinematic",
        description: [
          "Owned Reels and IG AR, Meta's first AR Instagram experience on Orion. Feed, Reels, comments, and sharing, translated in the most intuitive way for glasses.",
        ],
        backdrop: {
          type: "video",
          src: "assets/Images/Orion/IG Hero.mp4",
          alt: "Instagram on Orion AR glasses",
        },
        sourceLink: {
          credit: "Marques Brownlee",
          href: "https://www.youtube.com/watch?v=G0eKzU_fV00&t=105s",
        },
      },
      {
        layout: "media-grid",
        columns: 2,
        description: [],
        media: [
          {
            type: "video",
            src: "assets/Images/Orion/IG Reels.mp4",
            alt: "Instagram Reels in AR on Orion",
          },
          {
            type: "video",
            src: "assets/Images/Orion/IG Feed.mp4",
            alt: "Instagram Feed in AR on Orion",
          },
        ],
        captions: ["Instagram Reels in AR", "Instagram Feed in AR"],
      },
    ],
    artifacts: [],
    workstreams: [],
    beat: null,
    nextLabel: "Next Project",
    mood: {
      bg: "--mood-orion-bg",
      blob1: "--mood-orion-blob1",
      blob2: "--mood-orion-blob2",
    },
    next: "quest",
  },
  {
    id: "quest",
    label: "Spatial Music",
    year: "2022 - 2023",
    tagline: "Your music, in the room with you.",
    taglineLines: [
      "Your music, in the",
      "room with you.",
    ],
    role: "Design Lead",
    scope: "Spatial Music",
    status: "Deprioritized",
    team: "Solo design · Creative Engineering · iHeartRadio",
    companyLogo: "assets/meta logo.png",
    companyName: "Meta",
    metaFields: ["role", "scope", "status"],
    metaLayout: "stack",
    hero: "assets/Images/Spatial Music/quest-3-18.webp",
    heroAlt: "Spatial Music on Meta Quest mixed reality",
    thumb: "assets/Images/Spatial Music/thumb-music.png",
    bodyLabel: "[IMPACT]",
    body: [
      "Led design solo on Spatial Music for Meta Quest, <strong>in partnership with iHeartRadio</strong>. End-to-end redesign approved at executive level with <strong>Mark Zuckerberg and the CEO and CTO of iHeartRadio.</strong>",
      "The MR experience was deprioritized before launch as Meta shifted from MR to AR glasses. The system-level concept of a componentized spatial app was later adopted across <strong>20+ VR experiences</strong>.",
    ],
    sections: [
      {
        title: "iHeartRadio Spatial Music",
        layout: "cinematic",
        description: [
          "Created a fully spatial MR-compliant music app. Each component of the app can be segmented from the play bar, visualizer, and album / playlist covers to give each user a bespoke experience.",
        ],
        backdrop: {
          type: "video",
          src: "assets/Images/Spatial Music/music hero.mp4",
          alt: "iHeart Radio Spatial Music on Meta Quest",
        },
      },
      {
        layout: "labeled-grid",
        columns: [
          {
            title: "Before",
            media: {
              type: "image",
              src: "assets/Images/Spatial Music/Before.png",
              alt: "Previous Spatial Music design",
            },
            caption: "Previous design.",
          },
          {
            title: "After",
            media: {
              type: "image",
              src: "assets/Images/Spatial Music/After.png",
              alt: "Redesigned Spatial Music interface",
            },
            caption: "Redesign.",
          },
        ],
      },
      {
        title: "Spatial Visualizer",
        layout: "feature",
        media: {
          type: "video",
          src: "assets/Images/Spatial Music/visualizer proto.mp4",
          alt: "Spatial visualizer on Meta Quest mixed reality",
        },
        caption: "Modeled, prototyped, and implemented the spatial visualizer component. This was called out as <strong>the standout feature by C-suite leadership</strong>.",
      },
    ],
    artifacts: [],
    workstreams: [],
    beat: null,
    nextLabel: "Next Project",
    mood: {
      bg: "--mood-quest-bg",
      blob1: "--mood-quest-blob1",
      blob2: "--mood-quest-blob2",
    },
    next: "facebook",
  },
  {
    id: "facebook",
    label: "Facebook News Feed",
    year: "2020",
    tagline: "The care reaction; a new gesture for 2.9B people.",
    taglineLines: [
      "The care reaction; a new",
      "gesture for 2.9B people.",
    ],
    role: "Design Lead",
    scope: "News Feed",
    status: "Shipped",
    team: "News Feed Experiences · Art · PM · Eng",
    companyLogo: "assets/meta logo.png",
    companyName: "Meta",
    metaFields: ["role", "scope", "status"],
    metaLayout: "stack",
    hero: "assets/care-carousel.jpg",
    heroAlt: "Facebook Care reaction among Like and Love reactions",
    thumb: "assets/Images/Care Reaction/thumb-care.png",
    bodyLabel: "[IMPACT]",
    body: [
      "Conceptualized and led the design of the <strong>Care reaction.</strong> <strong>Facebook's first new reaction in five years,</strong> shipped to <strong>2.9B+ users in six weeks</strong> during the first months of COVID-19.",
      "Designed system-wide propagation across <strong>Feed, Comments, Stories, Live, and Messenger.</strong> NUX built on social proof, people discovered the reaction by seeing others use it. Planned as a temporary COVID response; <strong>now a permanent fixture.</strong>",
    ],
    sections: [
      {
        title: "Care Reaction",
        layout: "cinematic",
        description: [
          "First new primitive in a system trained on the existing five for five years. Appeared correctly across Feed, Comments, Stories, Live, Messenger, and dozens of lesser-known surfaces.",
          "Designed every engineering diff for pixel-level fidelity across all surfaces.",
        ],
        backdrop: {
          type: "video",
          src: "assets/Images/Care Reaction/Care Hero.mp4",
          alt: "Care reaction animated on Facebook",
        },
      },
      {
        title: "Early Concept",
        layout: "media-quote",
        media: {
          type: "image",
          src: "assets/Images/Care Reaction/early-concept.png",
          alt: "Early Care reaction concept sketches",
        },
        quote:
          "We need something that says 'I'm here for you.' The Love reaction feels too heavy but Like feels like not enough. - MZ",
      },
      {
        title: "Visual Refinement",
        layout: "media-grid",
        columns: 2,
        mediaFit: "contain",
        description: [
          "I created a range of variations which led us to two final outcomes vetted by Mark Zuckerberg.",
        ],
        media: [
          {
            type: "image",
            src: "assets/Images/Care Reaction/variations 1.png",
            alt: "Care reaction variations in the reaction bar",
          },
          {
            type: "image",
            src: "assets/Images/Care Reaction/variations 2.png",
            alt: "Care reaction hug explorations",
          },
        ],
      },
      {
        title: "App-Wide Testing",
        layout: "media-grid",
        columns: 2,
        mediaFit: "contain",
        description: [
          "In Feed, the reaction had to read at a glance. Between design and rollout, after rigorously testing two contenders the hugging face was <strong>overwhelmingly preferred by 71% of users</strong>.",
        ],
        media: [
          {
            type: "image",
            src: "assets/Images/Care Reaction/V1.png",
            alt: "Care reaction testing, purple heart variant",
          },
          {
            type: "image",
            src: "assets/Images/Care Reaction/V2.png",
            alt: "Care reaction testing, hugging face variant",
          },
        ],
      },
    ],
    artifacts: [],
    workstreams: [],
    beat: null,
    nextLabel: "Back to start",
    mood: {
      bg: "--mood-facebook-bg",
      blob1: "--mood-facebook-blob1",
      blob2: "--mood-facebook-blob2",
    },
    next: null,
  },
];

/** Look up a project by id. Returns undefined if not found. */
export function getProjectById(id) {
  return projects.find((p) => p.id === id);
}

/** Look up the project that follows the given id in the gallery order. */
export function getNextProject(id) {
  const project = getProjectById(id);
  if (!project || !project.next) return null;
  return getProjectById(project.next);
}
