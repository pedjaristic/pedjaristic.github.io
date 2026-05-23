/* ============================================================================
   shaders.js — GLSL inlined as template-literal strings (no build step).

   Mood background:
     - black base with edge vignette
     - three layered blobs (base wash + two accent steps)
     - velocity-driven brightness lift
     - film grain
   ========================================================================= */

export const bgVertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const bgFragmentShader = /* glsl */ `
varying vec2 vUv;

uniform vec3  uBackgroundColor;
uniform vec3  uBlob1Color;
uniform vec3  uBlob2Color;
uniform float uNoiseStrength;
uniform float uBlobRadius;
uniform float uBlobRadiusSecondary;
uniform float uBlobStrength;
uniform float uTime;
uniform float uVelocityIntensity;

float random(vec2 coord) {
  return fract(sin(dot(coord, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  // Black canvas — color is built up in layers, vignette fades edges back to black.
  vec3 color = vec3(0.0);

  // Slow wave clock — domain warp + radius breathing share this phase.
  float waveTime = uTime * 0.0002;

  // Soft undulation: gently warp UVs so blob edges ripple, not just drift.
  vec2 uv = vUv;
  uv.x += sin(vUv.y * 4.5 + waveTime * 1.1) * 0.022
       + sin(vUv.y * 2.0 - waveTime * 0.65) * 0.012;
  uv.y += cos(vUv.x * 4.0 + waveTime * 0.85) * 0.020
       + cos(vUv.x * 1.8 - waveTime * 0.55) * 0.010;

  float animTime = uTime * 0.00028;

  // Layer 0 — wide base wash (project mid-tone).
  vec2 baseCenter = vec2(
    0.50 + sin(animTime * 0.618) * 0.06,
    0.50 + cos(animTime * 0.927) * 0.05
  );
  float baseRadius = 0.92 * (1.0 + sin(waveTime * 0.55) * 0.04);
  float baseWash = smoothstep(baseRadius, 0.0, distance(uv, baseCenter));
  color = mix(color, uBackgroundColor, baseWash * 0.50);

  // Layer 1 — mid blob (first accent step).
  vec2 blob1Center = vec2(
    0.48 + sin(animTime * 1.000) * 0.11 + sin(animTime * 1.618) * 0.04,
    0.46 + cos(animTime * 0.794) * 0.08 + cos(animTime * 1.272) * 0.03
  );
  float radius1 = uBlobRadius * (1.0 + sin(waveTime * 0.72) * 0.045);
  float blob1 = smoothstep(radius1, 0.0, distance(uv, blob1Center));
  vec3 blob1Soft = mix(uBlob1Color, uBackgroundColor, 0.18);
  color = mix(color, blob1Soft, blob1 * uBlobStrength * 0.62);

  // Layer 2 — tight accent blob (second step, still muted toward base).
  vec2 blob2Center = vec2(
    0.38 + cos(animTime * 0.927) * 0.09 + cos(animTime * 1.414) * 0.03,
    0.54 + sin(animTime * 1.175) * 0.06 + sin(animTime * 0.618) * 0.025
  );
  float radius2 = uBlobRadiusSecondary * (1.0 + cos(waveTime * 0.58 + 1.2) * 0.04);
  float blob2 = smoothstep(radius2, 0.0, distance(uv, blob2Center));
  vec3 blob2Soft = mix(uBlob2Color, uBlob1Color, 0.22);
  color = mix(color, blob2Soft, blob2 * uBlobStrength * 0.48);

  // Layer 3 — small tertiary highlight for extra variance between steps.
  vec2 blob3Center = vec2(
    0.58 + sin(animTime * 0.821) * 0.07,
    0.40 + cos(animTime * 1.053) * 0.05
  );
  float blob3 = smoothstep(0.28, 0.0, distance(uv, blob3Center));
  vec3 blob3Soft = mix(uBlob2Color, vec3(0.0), 0.42);
  color = mix(color, blob3Soft, blob3 * uBlobStrength * 0.28);

  // Broad ambient ripple — very subtle luminance undulation across the field.
  float ambient = sin(uv.x * 3.2 + waveTime * 0.9) * sin(uv.y * 2.8 - waveTime * 0.75);
  color += ambient * 0.010 * (baseWash + blob1 + blob2 + 0.2);

  // Edge vignette — fade to black at edges, keep center readable.
  float edgeDist = length(vUv - 0.5) * 1.30;
  float vignette = 1.0 - smoothstep(0.42, 1.10, edgeDist);
  color *= vignette;

  // Velocity lift — fast scroll subtly brightens the canvas.
  color += uVelocityIntensity * 0.06;

  // Film grain.
  float grain = random(vUv * vec2(1387.13, 947.91)) - 0.5;
  color += grain * uNoiseStrength;

  color = clamp(color, 0.0, 1.0);
  gl_FragColor = vec4(color, 1.0);
}
`;
