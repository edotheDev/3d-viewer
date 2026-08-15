import { CustomShaderConfig } from '../types';

/**
 * Transpiles Godot 4.x / 3.x .gdshader code into Three.js WebGL GLSL (Vertex + Fragment shaders).
 */
export function parseGodotShader(
  gdshaderSource: string,
  shaderName: string = 'Godot Custom Shader'
): CustomShaderConfig {
  let isUnshaded = false;
  let isWireframe = false;
  let isTransparent = true;
  let defaultColor = '#00f0ff';
  let defaultColorSecondary = '#8b5cf6';
  let defaultIntensity = 1.0;
  let defaultSpeed = 1.0;
  let defaultScale = 1.0;

  // Check render_mode flags
  const renderModeMatch = gdshaderSource.match(/render_mode\s+([^;]+);/i);
  if (renderModeMatch) {
    const flags = renderModeMatch[1].toLowerCase();
    if (flags.includes('unshaded')) isUnshaded = true;
    if (flags.includes('wireframe')) isWireframe = true;
    if (flags.includes('depth_draw_opaque') && !flags.includes('blend_mix')) {
      isTransparent = false;
    }
  }

  // Extract uniform declarations
  // Regex to capture: uniform <type> <name> [: hint] [= default];
  const uniformRegex = /uniform\s+(vec[234]|float|int|sampler2D|bool|mat4)\s+([a-zA-Z0-9_]+)(?:\s*:[^=;]+)?(?:\s*=\s*([^;]+))?;/g;
  let match: RegExpExecArray | null;

  const declaredUniforms: { type: string; name: string; defaultValue?: string }[] = [];
  while ((match = uniformRegex.exec(gdshaderSource)) !== null) {
    const type = match[1];
    const name = match[2];
    const def = match[3]?.trim();
    declaredUniforms.push({ type, name, defaultValue: def });

    // Infer user values
    const lowerName = name.toLowerCase();
    if (lowerName.includes('albedo') || lowerName.includes('color_primary') || lowerName === 'color') {
      if (def) {
        const hex = parseColorToHex(def);
        if (hex) defaultColor = hex;
      }
    } else if (lowerName.includes('secondary') || lowerName.includes('emission') || lowerName.includes('accent')) {
      if (def) {
        const hex = parseColorToHex(def);
        if (hex) defaultColorSecondary = hex;
      }
    } else if (lowerName.includes('speed') || lowerName.includes('velocity')) {
      if (def) {
        const val = parseFloat(def);
        if (!isNaN(val)) defaultSpeed = val;
      }
    } else if (lowerName.includes('scale') || lowerName.includes('freq') || lowerName.includes('frequency')) {
      if (def) {
        const val = parseFloat(def);
        if (!isNaN(val)) defaultScale = val;
      }
    } else if (lowerName.includes('intensity') || lowerName.includes('energy') || lowerName.includes('power')) {
      if (def) {
        const val = parseFloat(def);
        if (!isNaN(val)) defaultIntensity = val;
      }
    }
  }

  // Extract vertex function body
  const vertexBody = extractFunctionBody(gdshaderSource, 'vertex');
  // Extract fragment function body
  const fragmentBody = extractFunctionBody(gdshaderSource, 'fragment');

  // If source already looks like pure GLSL with void main()
  if (gdshaderSource.includes('void main(') && !vertexBody && !fragmentBody) {
    return {
      id: `gd_${Date.now()}`,
      name: shaderName,
      description: 'Loaded GLSL / Godot custom shader',
      vertexShader: `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}`,
      fragmentShader: gdshaderSource,
      uniforms: {
        u_color: defaultColor,
        u_colorSecondary: defaultColorSecondary,
        u_intensity: defaultIntensity,
        u_speed: defaultSpeed,
        u_scale: defaultScale,
      },
      transparent: isTransparent,
      wireframe: isWireframe,
    };
  }

  // Generate Vertex Shader
  const transpiledVertex = generateTranspiledVertexShader(vertexBody, declaredUniforms);
  // Generate Fragment Shader
  const transpiledFragment = generateTranspiledFragmentShader(fragmentBody, declaredUniforms, isUnshaded);

  return {
    id: `gdshader_${Date.now()}`,
    name: shaderName,
    description: `Transpiled from Godot Shader (${shaderName})`,
    vertexShader: transpiledVertex,
    fragmentShader: transpiledFragment,
    uniforms: {
      u_color: defaultColor,
      u_colorSecondary: defaultColorSecondary,
      u_intensity: defaultIntensity,
      u_speed: defaultSpeed,
      u_scale: defaultScale,
    },
    transparent: isTransparent,
    wireframe: isWireframe,
  };
}

/**
 * Extracts the inner code block of `void funcName() { ... }` handling nested braces.
 */
function extractFunctionBody(source: string, funcName: string): string | null {
  const funcRegex = new RegExp(`void\\s+${funcName}\\s*\\(\\s*\\)\\s*\\{`, 'g');
  const match = funcRegex.exec(source);
  if (!match) return null;

  const startIndex = match.index + match[0].length;
  let braceCount = 1;
  let endIndex = startIndex;

  for (let i = startIndex; i < source.length; i++) {
    if (source[i] === '{') braceCount++;
    else if (source[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        endIndex = i;
        break;
      }
    }
  }

  return source.substring(startIndex, endIndex).trim();
}

/**
 * Converts Godot vec4/vec3 color definition string to Hex
 */
function parseColorToHex(valStr: string): string | null {
  try {
    const match = valStr.match(/vec[34]\s*\(([^)]+)\)/);
    if (!match) return null;
    const parts = match[1].split(',').map((p) => parseFloat(p.trim()));
    if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      const r = Math.min(255, Math.max(0, Math.round(parts[0] * 255)));
      const g = Math.min(255, Math.max(0, Math.round(parts[1] * 255)));
      const b = Math.min(255, Math.max(0, Math.round(parts[2] * 255)));
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
  } catch {
    // Ignore error
  }
  return null;
}

/**
 * Generates Three.js compatible GLSL vertex shader from Godot vertex() body
 */
function generateTranspiledVertexShader(
  body: string | null,
  declaredUniforms: { type: string; name: string }[]
): string {
  let uniformDeclarations = `
uniform float u_time;
uniform vec3 u_color;
uniform vec3 u_colorSecondary;
uniform float u_intensity;
uniform float u_speed;
uniform float u_scale;
uniform vec2 u_resolution;
`;

  // Append user uniforms if any
  for (const u of declaredUniforms) {
    if (u.type !== 'sampler2D' && !uniformDeclarations.includes(` ${u.name};`)) {
      uniformDeclarations += `uniform ${u.type} ${u.name};\n`;
    }
  }

  let code = `
${uniformDeclarations}

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;

#define PI 3.14159265359
#define TAU 6.28318530718

void main() {
  vUv = uv;
  vec3 VERTEX = position;
  vec3 NORMAL = normal;
  vec2 UV = uv;
  float TIME = u_time * u_speed;
`;

  if (body) {
    // Replace Godot-specific terms
    let cleanBody = body
      .replace(/\bTIME\b/g, '(u_time * u_speed)')
      .replace(/\bMODEL_MATRIX\b/g, 'modelMatrix')
      .replace(/\bVIEW_MATRIX\b/g, 'viewMatrix')
      .replace(/\bPROJECTION_MATRIX\b/g, 'projectionMatrix');

    code += `
  // --- Godot vertex() logic ---
  ${cleanBody}
  // ----------------------------
`;
  }

  code += `
  vNormal = normalize(normalMatrix * NORMAL);
  vPosition = VERTEX;
  vec4 mvPosition = modelViewMatrix * vec4(VERTEX, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

  return code.trim();
}

/**
 * Generates Three.js compatible GLSL fragment shader from Godot fragment() body
 */
function generateTranspiledFragmentShader(
  body: string | null,
  declaredUniforms: { type: string; name: string }[],
  isUnshaded: boolean
): string {
  let uniformDeclarations = `
uniform float u_time;
uniform vec3 u_color;
uniform vec3 u_colorSecondary;
uniform float u_intensity;
uniform float u_speed;
uniform float u_scale;
uniform vec2 u_resolution;
`;

  for (const u of declaredUniforms) {
    if (u.type !== 'sampler2D' && !uniformDeclarations.includes(` ${u.name};`)) {
      uniformDeclarations += `uniform ${u.type} ${u.name};\n`;
    }
  }

  let code = `
${uniformDeclarations}

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;

#define PI 3.14159265359
#define TAU 6.28318530718

// Fallback texture function if sampler2D is used without texture buffer
vec4 textureSample(sampler2D s, vec2 uvCoord) {
  return vec4(1.0);
}

void main() {
  vec2 UV = vUv * u_scale;
  vec3 VERTEX = vPosition;
  vec3 NORMAL = normalize(vNormal);
  vec3 VIEW = normalize(vViewPosition);
  float TIME = u_time * u_speed;
  vec2 SCREEN_UV = gl_FragCoord.xy / u_resolution;

  // Godot spatial output registers
  vec3 ALBEDO = u_color;
  float ALPHA = 1.0;
  vec3 EMISSION = vec3(0.0);
  float METALLIC = 0.0;
  float ROUGHNESS = 0.5;
  float SPECULAR = 0.5;
`;

  if (body) {
    let cleanBody = body
      .replace(/\bTIME\b/g, '(u_time * u_speed)')
      .replace(/\btexture\s*\(/g, 'textureSample(')
      .replace(/\btextureLod\s*\(/g, 'textureSample(')
      .replace(/\bFRAGCOORD\b/g, 'gl_FragCoord');

    code += `
  // --- Godot fragment() logic ---
  ${cleanBody}
  // ------------------------------
`;
  } else {
    code += `
  // Default spatial representation
  ALBEDO = mix(u_color, u_colorSecondary, 0.5 + 0.5 * sin(vPosition.y * 3.0 + u_time * u_speed));
  EMISSION = ALBEDO * 0.2 * u_intensity;
`;
  }

  if (isUnshaded) {
    code += `
  gl_FragColor = vec4(ALBEDO + EMISSION * u_intensity, ALPHA);
}
`;
  } else {
    code += `
  // PBR / Lighting approximation
  vec3 lightDir = normalize(vec3(0.6, 1.2, 0.8));
  float diff = max(dot(NORMAL, lightDir), 0.0) * 0.75 + 0.25;
  vec3 halfDir = normalize(lightDir + VIEW);
  float specPower = mix(16.0, 128.0, 1.0 - clamp(ROUGHNESS, 0.0, 1.0));
  float spec = pow(max(dot(NORMAL, halfDir), 0.0), specPower) * mix(SPECULAR * 0.3, 1.0, METALLIC);
  float fresnel = pow(1.0 - max(dot(NORMAL, VIEW), 0.0), 3.0);

  vec3 diffuseColor = ALBEDO * diff;
  vec3 specularColor = vec3(spec);
  vec3 emissionColor = EMISSION * u_intensity;
  vec3 rimColor = fresnel * u_colorSecondary * 0.35 * u_intensity;

  vec3 finalRgb = diffuseColor + specularColor + emissionColor + rimColor;
  gl_FragColor = vec4(finalRgb, ALPHA);
}
`;
  }

  return code.trim();
}
