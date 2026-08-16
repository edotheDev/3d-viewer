import * as THREE from 'three';
import { RenderMode, CustomShaderConfig } from '../types';
import { getUVCheckerTexture } from './uvTexture';
import { SHADER_PRESETS } from './shaderPresets';
import { generateDefaultVertexShader } from './godotShaderParser';

// Store original materials for each mesh to restore in 'normal' mode
const originalMaterialMap = new WeakMap<THREE.Mesh, THREE.Material | THREE.Material[]>();

// Track all active shader materials applied to meshes for uniform animation (e.g. u_time)
const activeShaderMaterials = new Set<THREE.ShaderMaterial>();

// Cached reusable materials for efficiency
let clayMaterial: THREE.MeshLambertMaterial | null = null;
let uvMaterial: THREE.MeshStandardMaterial | null = null;
let fallbackTexture: THREE.CanvasTexture | null = null;

/**
 * Creates a safe 512x512 fallback texture if a mesh does not have its own diffuse map.
 */
function getFallbackTexture(): THREE.CanvasTexture {
  if (!fallbackTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Draw neutral building / architectural surface with subtle grain
    ctx.fillStyle = '#c8ced2';
    ctx.fillRect(0, 0, 512, 512);

    for (let y = 0; y < 512; y += 32) {
      ctx.fillStyle = y % 64 === 0 ? '#b4bac0' : '#d2d7dc';
      ctx.fillRect(0, y, 512, 30);
      ctx.fillStyle = '#8a9299';
      ctx.fillRect(0, y + 30, 512, 2);
    }

    fallbackTexture = new THREE.CanvasTexture(canvas);
    fallbackTexture.wrapS = THREE.RepeatWrapping;
    fallbackTexture.wrapT = THREE.RepeatWrapping;
  }
  return fallbackTexture;
}

function getClayMaterial(): THREE.MeshLambertMaterial {
  if (!clayMaterial) {
    clayMaterial = new THREE.MeshLambertMaterial({
      color: 0xdedee0,
      side: THREE.DoubleSide,
    });
  }
  return clayMaterial;
}

function getUVMaterial(): THREE.MeshStandardMaterial {
  if (!uvMaterial) {
    const texture = getUVCheckerTexture();
    uvMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.4,
      metalness: 0.1,
    });
  }
  return uvMaterial;
}

/**
 * Creates a THREE.ShaderMaterial configured for a specific mesh and shader config.
 */
export function createShaderMaterialForMesh(
  config: CustomShaderConfig,
  meshTexture?: THREE.Texture | null,
  meshColor?: THREE.Color
): THREE.ShaderMaterial {
  const activeConfig = config || SHADER_PRESETS[0];

  const hasTexture = !!meshTexture;
  const boundTexture = meshTexture || getFallbackTexture();

  const uniforms: Record<string, { value: any }> = {
    u_time: { value: 0 },
    u_color: { value: new THREE.Color(activeConfig.uniforms?.u_color || meshColor?.getHexString() || '#d4d8db') },
    u_colorSecondary: { value: new THREE.Color(activeConfig.uniforms?.u_colorSecondary || '#8a9499') },
    u_intensity: { value: activeConfig.uniforms?.u_intensity ?? 1.0 },
    u_speed: { value: activeConfig.uniforms?.u_speed ?? 1.0 },
    u_scale: { value: activeConfig.uniforms?.u_scale ?? 1.0 },
    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    albedo_tex: { value: boundTexture },
    normal_tex: { value: boundTexture },
    u_has_texture: { value: hasTexture ? 1.0 : 0.0 },
    texel_res: { value: activeConfig.uniforms?.texel_res ?? 220.0 },
    levels: { value: activeConfig.uniforms?.levels ?? 7.0 },
    saturation: { value: activeConfig.uniforms?.saturation ?? 0.62 },
    town_tint: { value: new THREE.Color(activeConfig.uniforms?.town_tint || '#9ea8ad') },
    tint_amount: { value: activeConfig.uniforms?.tint_amount ?? 0.20 },
    value_lift: { value: activeConfig.uniforms?.value_lift ?? -0.02 },
    grime_amount: { value: activeConfig.uniforms?.grime_amount ?? 0.34 },
    grime_scale: { value: activeConfig.uniforms?.grime_scale ?? 0.55 },
    damp_rise: { value: activeConfig.uniforms?.damp_rise ?? 2.6 },
    rough_base: { value: activeConfig.uniforms?.rough_base ?? 0.88 },
  };

  // Inject any additional custom uniforms from config
  if (activeConfig.uniforms) {
    for (const [key, val] of Object.entries(activeConfig.uniforms)) {
      if (uniforms[key] === undefined) {
        if (typeof val === 'string' && val.startsWith('#')) {
          uniforms[key] = { value: new THREE.Color(val) };
        } else if (Array.isArray(val)) {
          if (val.length === 2) uniforms[key] = { value: new THREE.Vector2(val[0], val[1]) };
          else if (val.length === 3) uniforms[key] = { value: new THREE.Vector3(val[0], val[1], val[2]) };
          else if (val.length === 4) uniforms[key] = { value: new THREE.Vector4(val[0], val[1], val[2], val[3]) };
          else uniforms[key] = { value: val };
        } else {
          uniforms[key] = { value: val };
        }
      }
    }
  }

  const vertexCode = activeConfig.vertexShader && activeConfig.vertexShader.trim().length > 0
    ? activeConfig.vertexShader
    : generateDefaultVertexShader();

  const fragmentCode = activeConfig.fragmentShader && activeConfig.fragmentShader.trim().length > 0
    ? activeConfig.fragmentShader
    : SHADER_PRESETS[0].fragmentShader;

  try {
    const mat = new THREE.ShaderMaterial({
      vertexShader: vertexCode,
      fragmentShader: fragmentCode,
      uniforms,
      wireframe: !!activeConfig.wireframe,
      transparent: !!activeConfig.transparent,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
    });
    activeShaderMaterials.add(mat);
    return mat;
  } catch (err) {
    console.error('Failed to create ShaderMaterial, falling back to default:', err);
    const fallbackMat = new THREE.ShaderMaterial({
      vertexShader: SHADER_PRESETS[0].vertexShader,
      fragmentShader: SHADER_PRESETS[0].fragmentShader,
      uniforms,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
    });
    activeShaderMaterials.add(fallbackMat);
    return fallbackMat;
  }
}

/**
 * Updates dynamic uniforms like u_time every frame across all active meshes
 */
export function updateActiveShaderTime(elapsedTime: number) {
  for (const mat of activeShaderMaterials) {
    if (mat.uniforms && mat.uniforms.u_time) {
      mat.uniforms.u_time.value = elapsedTime;
    }
  }
}

/**
 * Stores the initial materials of all meshes inside an Object3D.
 */
export function cacheOriginalMaterials(root: THREE.Object3D) {
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (!originalMaterialMap.has(mesh)) {
        originalMaterialMap.set(mesh, mesh.material);
      }
    }
  });
}

/**
 * Applies the selected RenderMode to all meshes in the scene hierarchy.
 */
export function applyRenderMode(
  root: THREE.Object3D,
  mode: RenderMode,
  options?: {
    wireframeColor?: string;
    customShader?: CustomShaderConfig;
  }
) {
  cacheOriginalMaterials(root);
  activeShaderMaterials.clear();

  const wireColor = options?.wireframeColor || '#111111';
  const activeShaderConfig = options?.customShader || SHADER_PRESETS[0];

  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const originalMat = originalMaterialMap.get(mesh);
      if (!originalMat) return;

      switch (mode) {
        case 'normal': {
          mesh.material = originalMat;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          break;
        }

        case 'clay': {
          mesh.material = getClayMaterial();
          mesh.castShadow = false;
          mesh.receiveShadow = false;
          break;
        }

        case 'wireframe': {
          if (Array.isArray(originalMat)) {
            mesh.material = originalMat.map(
              () =>
                new THREE.MeshStandardMaterial({
                  wireframe: true,
                  color: new THREE.Color(wireColor),
                  roughness: 0.5,
                  metalness: 0.1,
                })
            );
          } else {
            mesh.material = new THREE.MeshStandardMaterial({
              wireframe: true,
              color: new THREE.Color(wireColor),
              roughness: 0.5,
              metalness: 0.1,
            });
          }
          mesh.castShadow = false;
          mesh.receiveShadow = false;
          break;
        }

        case 'albedo': {
          if (Array.isArray(originalMat)) {
            mesh.material = originalMat.map((mat) => createAlbedoMaterial(mat));
          } else {
            mesh.material = createAlbedoMaterial(originalMat);
          }
          mesh.castShadow = false;
          mesh.receiveShadow = false;
          break;
        }

        case 'uv': {
          mesh.material = getUVMaterial();
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          break;
        }

        case 'shader': {
          if (Array.isArray(originalMat)) {
            mesh.material = originalMat.map((mat) => {
              const anyMat = mat as any;
              return createShaderMaterialForMesh(
                activeShaderConfig,
                anyMat.map || null,
                anyMat.color || null
              );
            });
          } else {
            const anyMat = originalMat as any;
            mesh.material = createShaderMaterialForMesh(
              activeShaderConfig,
              anyMat.map || null,
              anyMat.color || null
            );
          }
          mesh.castShadow = false;
          mesh.receiveShadow = false;
          break;
        }
      }
    }
  });
}

function createAlbedoMaterial(sourceMat: THREE.Material): THREE.MeshBasicMaterial {
  const sourceAny = sourceMat as any;
  const basicMat = new THREE.MeshBasicMaterial({
    color: sourceAny.color ? sourceAny.color.clone() : new THREE.Color(0xffffff),
    map: sourceAny.map || null,
    alphaMap: sourceAny.alphaMap || null,
    transparent: sourceMat.transparent,
    opacity: sourceMat.opacity,
    side: sourceMat.side,
  });
  return basicMat;
}
