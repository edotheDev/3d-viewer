import { CustomShaderConfig } from '../types';

export interface ParsedUniformInfo {
  type: string;
  name: string;
  defaultValue?: any;
}

/**
 * Transpiles Godot 4.x / 3.x .gdshader / .tres / .material code or UID shader into Three.js WebGL GLSL.
 */
export function parseGodotShader(
  rawInput: string,
  shaderName: string = 'Godot Custom Shader'
): CustomShaderConfig {
  let source = sanitizeGodotInput(rawInput);

  let isUnshaded = false;
  let isWireframe = false;
  let isTransparent = false;
  let defaultColor = '#00f0ff';
  let defaultColorSecondary = '#8b5cf6';
  let defaultIntensity = 1.0;
  let defaultSpeed = 1.0;
  let defaultScale = 1.0;

  // Check render_mode flags
  const renderModeMatch = source.match(/render_mode\s+([^;]+);/i);
  if (renderModeMatch) {
    const flags = renderModeMatch[1].toLowerCase();
    if (flags.includes('unshaded')) isUnshaded = true;
    if (flags.includes('wireframe')) isWireframe = true;
    if (flags.includes('blend_add') || flags.includes('blend_sub') || flags.includes('blend_mul')) {
      isTransparent = true;
    }
  }

  // Detect canvas_item vs spatial
  const isCanvasItem = /shader_type\s+canvas_item/i.test(source);

  // Extract all uniform declarations & sanitize them for GLSL
  const { uniforms, cleanedSource, customUniformsObj } = extractAndCleanUniforms(source);
  source = cleanedSource;

  // Infer default parameter values from parsed uniforms
  for (const u of uniforms) {
    const lower = u.name.toLowerCase();
    if (lower.includes('albedo') || lower.includes('color_primary') || lower === 'color' || lower.includes('base_color') || lower.includes('town_tint')) {
      if (typeof u.defaultValue === 'string' && u.defaultValue.startsWith('#')) {
        defaultColor = u.defaultValue;
      }
    } else if (lower.includes('secondary') || lower.includes('emission') || lower.includes('accent')) {
      if (typeof u.defaultValue === 'string' && u.defaultValue.startsWith('#')) {
        defaultColorSecondary = u.defaultValue;
      }
    } else if (lower.includes('speed') || lower.includes('velocity')) {
      if (typeof u.defaultValue === 'number') defaultSpeed = u.defaultValue;
    } else if (lower.includes('scale') || lower.includes('freq') || lower.includes('frequency')) {
      if (typeof u.defaultValue === 'number') defaultScale = u.defaultValue;
    } else if (lower.includes('intensity') || lower.includes('energy') || lower.includes('power')) {
      if (typeof u.defaultValue === 'number') defaultIntensity = u.defaultValue;
    }
  }

  // If source already looks like direct GLSL with void main() and no Godot markers
  if (source.includes('void main(') && !source.includes('void fragment(') && !source.includes('shader_type')) {
    return {
      id: `custom_${Date.now()}`,
      name: shaderName,
      description: 'Loaded GLSL custom shader',
      vertexShader: generateDefaultVertexShader(),
      fragmentShader: source,
      uniforms: {
        u_color: defaultColor,
        u_colorSecondary: defaultColorSecondary,
        u_intensity: defaultIntensity,
        u_speed: defaultSpeed,
        u_scale: defaultScale,
        ...customUniformsObj,
      },
      transparent: isTransparent,
      wireframe: isWireframe,
    };
  }

  // Separate functions and global code
  const { vertexBody, fragmentBody, globalHelpers } = parseShaderStructure(source);

  // Generate Vertex Shader
  const transpiledVertex = generateTranspiledVertexShader(vertexBody, globalHelpers, uniforms);
  // Generate Fragment Shader
  const transpiledFragment = generateTranspiledFragmentShader(
    fragmentBody,
    globalHelpers,
    uniforms,
    isUnshaded,
    isCanvasItem
  );

  return {
    id: `gdshader_${Date.now()}`,
    name: shaderName,
    description: `Godot ${isCanvasItem ? 'CanvasItem' : 'Spatial'} Shader (${shaderName})`,
    vertexShader: transpiledVertex,
    fragmentShader: transpiledFragment,
    uniforms: {
      u_color: defaultColor,
      u_colorSecondary: defaultColorSecondary,
      u_intensity: defaultIntensity,
      u_speed: defaultSpeed,
      u_scale: defaultScale,
      ...customUniformsObj,
    },
    transparent: isTransparent,
    wireframe: isWireframe,
  };
}

/**
 * Sanitizes input that might come from Godot 4 UID comments, .tres / .material / .shader resource files.
 */
function sanitizeGodotInput(input: string): string {
  let text = input.trim();

  // If it's a Godot .tres / .res / .material resource containing code = "..."
  const codeBlockMatch = text.match(/code\s*=\s*"([\s\S]*?)"(?:\s*\[|\s*$)/);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }

  // Remove UID header comments like `// [uid://cbv312...]` or `// uid://...` or `// @uid(...)`
  text = text.replace(/\/\/\s*\[?uid:\/\/[^\r\n]+\]?/gi, '');
  text = text.replace(/\/\/\s*@uid\([^)]+\)/gi, '');
  text = text.replace(/\[gd_resource[^\]]*\]/gi, '');
  text = text.replace(/\[resource\]/gi, '');

  return text.trim();
}

/**
 * Parses all Godot uniforms (including hints & defaults) and produces GLSL-compliant uniform statements.
 */
function extractAndCleanUniforms(source: string): {
  uniforms: ParsedUniformInfo[];
  cleanedSource: string;
  customUniformsObj: Record<string, any>;
} {
  const uniforms: ParsedUniformInfo[] = [];
  const customUniformsObj: Record<string, any> = {};

  // Matches Godot uniforms: uniform <type> <name> [: hint] [= default];
  // Also matches `instance uniform`, `global uniform`
  const uniformDeclRegex = /(?:instance\s+|global\s+)?uniform\s+(vec[234]|float|int|sampler2D|bool|mat4|mat3)\s+([a-zA-Z0-9_]+)(?:\s*:[^=;]+)?(?:\s*=\s*([^;]+))?;/g;

  let cleanedSource = source;
  let match: RegExpExecArray | null;

  while ((match = uniformDeclRegex.exec(source)) !== null) {
    const fullMatch = match[0];
    const type = match[1];
    const name = match[2];
    const rawDefault = match[3]?.trim();

    let parsedVal: any = undefined;

    if (rawDefault) {
      if (type === 'vec3' || type === 'vec4') {
        const hex = parseColorToHex(rawDefault);
        if (hex) {
          parsedVal = hex;
        } else {
          parsedVal = parseVectorDefault(rawDefault, type);
        }
      } else if (type === 'float') {
        parsedVal = parseFloat(rawDefault);
      } else if (type === 'int') {
        parsedVal = parseInt(rawDefault, 10);
      } else if (type === 'bool') {
        parsedVal = rawDefault === 'true';
      }
    } else {
      // Default fallbacks
      if (type === 'vec3' || type === 'vec4') parsedVal = '#00f0ff';
      else if (type === 'float') parsedVal = 1.0;
      else if (type === 'int') parsedVal = 1;
      else if (type === 'bool') parsedVal = true;
    }

    uniforms.push({ type, name, defaultValue: parsedVal });
    if (parsedVal !== undefined && type !== 'sampler2D') {
      customUniformsObj[name] = parsedVal;
    }

    // Replace the Godot uniform line with a clean GLSL uniform line
    const glslUniformLine = `uniform ${type} ${name};`;
    cleanedSource = cleanedSource.replace(fullMatch, glslUniformLine);
  }

  // Also remove remaining Godot headers like `shader_type ...;` and `render_mode ...;` from the body
  cleanedSource = cleanedSource.replace(/shader_type\s+[a-zA-Z0-9_]+;/g, '');
  cleanedSource = cleanedSource.replace(/render_mode\s+[^;]+;/g, '');

  return { uniforms, cleanedSource, customUniformsObj };
}

/**
 * Splits Godot shader into helper code, vertex() body, and fragment() body.
 */
function parseShaderStructure(source: string): {
  vertexBody: string | null;
  fragmentBody: string | null;
  globalHelpers: string;
} {
  const vertexInfo = findFunction(source, 'vertex');
  const fragmentInfo = findFunction(source, 'fragment');
  const lightInfo = findFunction(source, 'light');

  let globalCode = source;

  const removeRanges: { start: number; end: number }[] = [];
  if (vertexInfo) removeRanges.push({ start: vertexInfo.start, end: vertexInfo.end });
  if (fragmentInfo) removeRanges.push({ start: fragmentInfo.start, end: fragmentInfo.end });
  if (lightInfo) removeRanges.push({ start: lightInfo.start, end: lightInfo.end });

  removeRanges.sort((a, b) => b.start - a.start);

  for (const range of removeRanges) {
    globalCode = globalCode.substring(0, range.start) + '\n' + globalCode.substring(range.end);
  }

  let cleanGlobalHelpers = globalCode
    .replace(/uniform\s+[^;]+;/g, '')
    .replace(/varying\s+[^;]+;/g, '')
    .trim();

  return {
    vertexBody: vertexInfo ? vertexInfo.body : null,
    fragmentBody: fragmentInfo ? fragmentInfo.body : null,
    globalHelpers: cleanGlobalHelpers,
  };
}

function findFunction(
  source: string,
  funcName: string
): { start: number; end: number; body: string } | null {
  const funcRegex = new RegExp(`void\\s+${funcName}\\s*\\(\\s*\\)\\s*\\{`, 'g');
  const match = funcRegex.exec(source);
  if (!match) return null;

  const start = match.index;
  const bodyStart = start + match[0].length;
  let braceCount = 1;
  let end = bodyStart;

  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === '{') braceCount++;
    else if (source[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        end = i + 1;
        break;
      }
    }
  }

  const body = source.substring(bodyStart, end - 1).trim();
  return { start, end, body };
}

/**
 * Generates default vertex shader for Three.js
 */
export function generateDefaultVertexShader(): string {
  return `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`.trim();
}

/**
 * Generates Three.js compatible GLSL vertex shader from Godot vertex() body
 */
function generateTranspiledVertexShader(
  body: string | null,
  globalHelpers: string,
  declaredUniforms: ParsedUniformInfo[]
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
    if (!uniformDeclarations.includes(` ${u.name};`)) {
      uniformDeclarations += `uniform ${u.type} ${u.name};\n`;
    }
  }

  let code = `
${uniformDeclarations}

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

#define PI 3.141592653589793
#define TAU 6.283185307179586
#define E 2.718281828459045

#define texture texture2D
#define textureLod(s, uv, lod) texture2D(s, uv)

${globalHelpers}

void main() {
  vUv = uv;
  vec3 VERTEX = position;
  vec3 NORMAL = normal;
  vec2 UV = uv;
  vec2 UV2 = uv;
  vec4 COLOR = vec4(1.0);
  float TIME = u_time * u_speed;
  mat4 MODEL_MATRIX = modelMatrix;
  mat4 VIEW_MATRIX = viewMatrix;
  mat4 PROJECTION_MATRIX = projectionMatrix;
  mat4 MODELVIEW_MATRIX = modelViewMatrix;
`;

  if (body) {
    let cleanBody = body
      .replace(/\bTIME\b/g, '(u_time * u_speed)')
      .replace(/\bMODEL_MATRIX\b/g, 'modelMatrix')
      .replace(/\bVIEW_MATRIX\b/g, 'viewMatrix')
      .replace(/\bPROJECTION_MATRIX\b/g, 'projectionMatrix')
      .replace(/\bMODELVIEW_MATRIX\b/g, 'modelViewMatrix');

    code += `
  // --- Transpiled Godot vertex() body ---
  ${cleanBody}
  // --------------------------------------
`;
  }

  code += `
  vNormal = normalize(normalMatrix * NORMAL);
  vPosition = VERTEX;
  vec4 worldPos = modelMatrix * vec4(VERTEX, 1.0);
  vWorldPosition = worldPos.xyz;
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
  globalHelpers: string,
  declaredUniforms: ParsedUniformInfo[],
  isUnshaded: boolean,
  isCanvasItem: boolean
): string {
  let uniformDeclarations = `
uniform float u_time;
uniform vec3 u_color;
uniform vec3 u_colorSecondary;
uniform float u_intensity;
uniform float u_speed;
uniform float u_scale;
uniform vec2 u_resolution;
uniform float u_has_texture;
`;

  for (const u of declaredUniforms) {
    if (!uniformDeclarations.includes(` ${u.name};`)) {
      uniformDeclarations += `uniform ${u.type} ${u.name};\n`;
    }
  }

  let code = `
${uniformDeclarations}

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

#define PI 3.141592653589793
#define TAU 6.283185307179586
#define E 2.718281828459045

#define texture texture2D
#define textureLod(s, uv, lod) texture2D(s, uv)

${globalHelpers}

void main() {
  vec2 UV = vUv * u_scale;
  vec2 UV2 = vUv * u_scale;
  vec3 VERTEX = vPosition;
  vec3 NORMAL = normalize(vNormal);
  vec3 VIEW = normalize(vViewPosition);
  float TIME = u_time * u_speed;
  vec2 SCREEN_UV = gl_FragCoord.xy / max(u_resolution, vec2(1.0, 1.0));
  vec2 POINT_COORD = gl_PointCoord;
  vec4 COLOR = vec4(1.0);
  vec3 CAMERA_POSITION_WORLD = cameraPosition;
  vec3 NODE_POSITION_WORLD = vec3(0.0);
  vec3 WORLD_POSITION = vWorldPosition;

  // Godot spatial output registers
  vec3 ALBEDO = u_color;
  float ALPHA = 1.0;
  vec3 EMISSION = vec3(0.0);
  float METALLIC = 0.0;
  float ROUGHNESS = 0.5;
  float SPECULAR = 0.5;
  vec3 NORMAL_MAP = vec3(0.5, 0.5, 1.0);
  float NORMAL_MAP_DEPTH = 1.0;
`;

  if (body) {
    let cleanBody = body
      .replace(/\bTIME\b/g, '(u_time * u_speed)')
      .replace(/\bFRAGCOORD\b/g, 'gl_FragCoord')
      .replace(/\bCOLOR\b/g, 'COLOR')
      .replace(/\bSCREEN_UV\b/g, '(gl_FragCoord.xy / max(u_resolution, vec2(1.0)))')
      .replace(/\(INV_VIEW_MATRIX\s*\*\s*vec4\(\s*VERTEX\s*,\s*1\.0\s*\)\)\.xyz/g, 'vWorldPosition')
      .replace(/INV_VIEW_MATRIX\s*\*\s*vec4\(\s*VERTEX\s*,\s*1\.0\s*\)/g, 'vec4(vWorldPosition, 1.0)');

    code += `
  // --- Transpiled Godot fragment() body ---
  ${cleanBody}
  // ----------------------------------------
`;

    if (isCanvasItem) {
      code += `
  // CanvasItem color mapping
  ALBEDO = COLOR.rgb;
  ALPHA = COLOR.a;
`;
    }
  } else {
    code += `
  ALBEDO = mix(u_color, u_colorSecondary, 0.5 + 0.5 * sin(vPosition.y * 4.0 + u_time * u_speed));
  EMISSION = ALBEDO * 0.3 * u_intensity;
`;
  }

  code += `
  ALPHA = clamp(ALPHA, 0.15, 1.0);
`;

  if (isUnshaded) {
    code += `
  vec3 finalColor = ALBEDO + EMISSION * u_intensity;
  gl_FragColor = vec4(finalColor, ALPHA);
}
`;
  } else {
    code += `
  // Enhanced PBR Shading Approximation
  vec3 lightDir1 = normalize(vec3(0.6, 1.2, 0.8));
  vec3 lightDir2 = normalize(vec3(-0.6, 0.5, -0.7));
  
  float diff1 = max(dot(NORMAL, lightDir1), 0.0) * 0.75 + 0.25;
  float diff2 = max(dot(NORMAL, lightDir2), 0.0) * 0.35;
  
  vec3 halfDir = normalize(lightDir1 + VIEW);
  float specPower = mix(16.0, 128.0, 1.0 - clamp(ROUGHNESS, 0.0, 1.0));
  float spec = pow(max(dot(NORMAL, halfDir), 0.0), specPower) * mix(SPECULAR * 0.4, 1.0, METALLIC);
  float fresnel = pow(1.0 - max(dot(NORMAL, VIEW), 0.0), 3.0);

  vec3 diffuse = ALBEDO * (diff1 + diff2);
  vec3 specular = vec3(spec);
  vec3 emission = EMISSION * u_intensity;
  vec3 rim = fresnel * u_colorSecondary * 0.3 * u_intensity;

  vec3 finalRgb = diffuse + specular + emission + rim;
  gl_FragColor = vec4(finalRgb, ALPHA);
}
`;
  }

  return code.trim();
}

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
    // Ignore
  }
  return null;
}

function parseVectorDefault(valStr: string, type: string): any {
  try {
    const match = valStr.match(/vec[234]\s*\(([^)]+)\)/);
    if (match) {
      const nums = match[1].split(',').map((n) => parseFloat(n.trim()));
      return nums;
    }
  } catch {
    // Ignore
  }
  return undefined;
}
