import { CustomShaderConfig } from '../types';

export const DEFAULT_VERTEX_SHADER = `uniform float u_time;
uniform float u_speed;
uniform float u_scale;
uniform float u_intensity;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vViewPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vUv = uv;
  vPosition = position;
  
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const SHADER_PRESETS: CustomShaderConfig[] = [
  {
    id: 'hologram',
    name: 'Hologram Grid',
    description: 'Animated vertical scanline wave with glowing cybernetic grid and fresnel rim.',
    vertexShader: DEFAULT_VERTEX_SHADER,
    fragmentShader: `uniform float u_time;
uniform vec3 u_color;
uniform vec3 u_colorSecondary;
uniform float u_intensity;
uniform float u_speed;
uniform float u_scale;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.5);

  // Scanlines
  float scanline = sin((vPosition.y * 30.0 * u_scale) + (u_time * 4.0 * u_speed)) * 0.5 + 0.5;
  scanline = pow(scanline, 4.0);

  // Grid overlay
  float grid = sin(vUv.x * 40.0 * u_scale) * sin(vUv.y * 40.0 * u_scale);
  grid = smoothstep(0.7, 0.95, grid) * 0.4;

  vec3 col = mix(u_color, u_colorSecondary, fresnel);
  col += vec3(scanline * 0.8) + vec3(grid * 0.5);
  col *= u_intensity;

  float alpha = clamp(fresnel * 0.9 + scanline * 0.4 + grid * 0.2 + 0.2, 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}
`,
    uniforms: {
      u_color: '#00f0ff',
      u_colorSecondary: '#8b5cf6',
      u_intensity: 1.2,
      u_speed: 1.0,
      u_scale: 1.0,
    },
    transparent: true,
  },
  {
    id: 'toon-cel',
    name: 'Toon / Cel Shading',
    description: 'Stepped discrete lighting bands with dark silhouette ink outline rim.',
    vertexShader: DEFAULT_VERTEX_SHADER,
    fragmentShader: `uniform float u_time;
uniform vec3 u_color;
uniform vec3 u_colorSecondary;
uniform float u_intensity;
uniform float u_speed;
uniform float u_scale;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(vec3(1.0, 1.5, 1.0));
  float NdotL = dot(normal, lightDir);

  // Discrete bands
  float lightIntensity;
  if (NdotL > 0.65) lightIntensity = 1.0;
  else if (NdotL > 0.25) lightIntensity = 0.65;
  else if (NdotL > -0.1) lightIntensity = 0.35;
  else lightIntensity = 0.15;

  // Rim silhouette
  vec3 viewDir = normalize(vViewPosition);
  float rim = 1.0 - max(0.0, dot(viewDir, normal));
  rim = smoothstep(0.6, 0.85, rim);

  vec3 base = mix(u_colorSecondary * 0.3, u_color, lightIntensity);
  vec3 finalColor = base + vec3(rim * 0.45);
  finalColor *= u_intensity;

  gl_FragColor = vec4(finalColor, 1.0);
}
`,
    uniforms: {
      u_color: '#f59e0b',
      u_colorSecondary: '#1e293b',
      u_intensity: 1.0,
      u_speed: 1.0,
      u_scale: 1.0,
    },
    transparent: false,
  },
  {
    id: 'iridescence',
    name: 'Rainbow Iridescence',
    description: 'Thin-film optical interference based on view-angle and surface normals.',
    vertexShader: DEFAULT_VERTEX_SHADER,
    fragmentShader: `uniform float u_time;
uniform vec3 u_color;
uniform vec3 u_colorSecondary;
uniform float u_intensity;
uniform float u_speed;
uniform float u_scale;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vViewPosition;

vec3 rainbow(float t) {
  return 0.5 + 0.5 * cos(6.28318 * (vec3(1.0, 1.0, 1.0) * t + vec3(0.0, 0.33, 0.67)));
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float viewAngle = dot(normal, viewDir);

  float phase = (1.0 - viewAngle) * 2.0 * u_scale + (u_time * 0.25 * u_speed);
  vec3 irid = rainbow(phase);

  vec3 col = mix(u_color, irid, 0.85);
  
  // Specular gloss
  vec3 halfVec = normalize(viewDir + normalize(vec3(0.8, 1.0, 0.6)));
  float spec = pow(max(0.0, dot(normal, halfVec)), 32.0);
  col += vec3(spec * 0.6);
  col *= u_intensity;

  gl_FragColor = vec4(col, 1.0);
}
`,
    uniforms: {
      u_color: '#ffffff',
      u_colorSecondary: '#ec4899',
      u_intensity: 1.1,
      u_speed: 1.0,
      u_scale: 1.0,
    },
    transparent: false,
  },
  {
    id: 'normal-vector',
    name: 'Normal Vector Map',
    description: 'Maps geometric surface normals into RGB colorspace for 3D technical art inspection.',
    vertexShader: DEFAULT_VERTEX_SHADER,
    fragmentShader: `uniform float u_time;
uniform vec3 u_color;
uniform vec3 u_colorSecondary;
uniform float u_intensity;
uniform float u_speed;
uniform float u_scale;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vec3 n = normalize(vNormal);
  vec3 normalColor = n * 0.5 + 0.5; // Map [-1, 1] to [0, 1]
  gl_FragColor = vec4(normalColor * u_intensity, 1.0);
}
`,
    uniforms: {
      u_color: '#ffffff',
      u_colorSecondary: '#000000',
      u_intensity: 1.0,
      u_speed: 1.0,
      u_scale: 1.0,
    },
    transparent: false,
  },
  {
    id: 'fresnel-pulse',
    name: 'Fresnel Energy Pulse',
    description: 'Pulsating energy core with bright glowing outer rim silhouette.',
    vertexShader: DEFAULT_VERTEX_SHADER,
    fragmentShader: `uniform float u_time;
uniform vec3 u_color;
uniform vec3 u_colorSecondary;
uniform float u_intensity;
uniform float u_speed;
uniform float u_scale;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 3.0 * u_scale);

  float pulse = sin(u_time * 3.0 * u_speed) * 0.15 + 0.85;
  vec3 glow = mix(u_colorSecondary, u_color, fresnel) * fresnel * pulse * 2.2;
  vec3 core = u_colorSecondary * 0.12;

  vec3 col = (core + glow) * u_intensity;
  gl_FragColor = vec4(col, clamp(fresnel * 1.3 + 0.15, 0.0, 1.0));
}
`,
    uniforms: {
      u_color: '#10b981',
      u_colorSecondary: '#064e3b',
      u_intensity: 1.25,
      u_speed: 1.2,
      u_scale: 1.0,
    },
    transparent: true,
  },
  {
    id: 'heatmap-elevation',
    name: 'Thermal Elevation Heatmap',
    description: 'Dynamic height-based temperature gradient map with animated contour isolines.',
    vertexShader: DEFAULT_VERTEX_SHADER,
    fragmentShader: `uniform float u_time;
uniform vec3 u_color;
uniform vec3 u_colorSecondary;
uniform float u_intensity;
uniform float u_speed;
uniform float u_scale;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

vec3 heatmap(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c1 = vec3(0.05, 0.1, 0.6); // Blue
  vec3 c2 = vec3(0.0, 0.8, 0.8);  // Cyan
  vec3 c3 = vec3(0.1, 0.9, 0.2);  // Green
  vec3 c4 = vec3(0.9, 0.8, 0.1);  // Yellow
  vec3 c5 = vec3(0.9, 0.1, 0.1);  // Red

  if (t < 0.25) return mix(c1, c2, t / 0.25);
  if (t < 0.50) return mix(c2, c3, (t - 0.25) / 0.25);
  if (t < 0.75) return mix(c3, c4, (t - 0.50) / 0.25);
  return mix(c4, c5, (t - 0.75) / 0.25);
}

void main() {
  float height = (vPosition.y + 0.8) * 0.55 * u_scale;
  float wave = sin(height * 8.0 - u_time * 2.0 * u_speed) * 0.06;
  vec3 heat = heatmap(height + wave);

  // Contour lines
  float contour = sin(height * 36.0);
  float line = smoothstep(0.85, 0.96, contour);
  vec3 col = mix(heat, vec3(1.0), line * 0.4) * u_intensity;

  gl_FragColor = vec4(col, 1.0);
}
`,
    uniforms: {
      u_color: '#ef4444',
      u_colorSecondary: '#3b82f6',
      u_intensity: 1.1,
      u_speed: 1.0,
      u_scale: 1.0,
    },
    transparent: false,
  },
  {
    id: 'harmonic-displace',
    name: 'Wave Displace & Glitch',
    description: 'Displaces vertices along normals using multi-harmonic sine waves and chromatic steps.',
    vertexShader: `uniform float u_time;
uniform float u_speed;
uniform float u_scale;
uniform float u_intensity;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vViewPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vUv = uv;
  vPosition = position;

  // Wave displacement along normal
  float wave = sin(position.y * 8.0 * u_scale + u_time * 3.5 * u_speed) * 0.06;
  float wave2 = cos(position.x * 6.0 * u_scale + u_time * 2.5 * u_speed) * 0.04;
  vec3 newPos = position + normal * (wave + wave2);

  vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`,
    fragmentShader: `uniform float u_time;
uniform vec3 u_color;
uniform vec3 u_colorSecondary;
uniform float u_intensity;
uniform float u_speed;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vViewPosition;

void main() {
  vec3 n = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float edge = pow(1.0 - abs(dot(n, viewDir)), 2.0);

  float bands = step(0.5, sin(vPosition.y * 22.0 + u_time * 5.0 * u_speed));
  vec3 col = mix(u_color, u_colorSecondary, bands);
  col += vec3(edge * 0.7);
  gl_FragColor = vec4(col * u_intensity, 1.0);
}
`,
    uniforms: {
      u_color: '#ec4899',
      u_colorSecondary: '#3b82f6',
      u_intensity: 1.15,
      u_speed: 1.0,
      u_scale: 1.0,
    },
    transparent: false,
  },
];
