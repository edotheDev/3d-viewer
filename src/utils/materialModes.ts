import * as THREE from 'three';
import { RenderMode, CustomShaderConfig } from '../types';
import { getUVCheckerTexture } from './uvTexture';
import { SHADER_PRESETS } from './shaderPresets';

// Store original materials for each mesh to restore in 'normal' mode
const originalMaterialMap = new WeakMap<THREE.Mesh, THREE.Material | THREE.Material[]>();

// Cached reusable materials for efficiency
let clayMaterial: THREE.MeshLambertMaterial | null = null;
let uvMaterial: THREE.MeshStandardMaterial | null = null;
let customShaderMaterial: THREE.ShaderMaterial | null = null;
let currentShaderId: string | null = null;
let currentShaderCodeKey: string | null = null;

function getClayMaterial(): THREE.MeshLambertMaterial {
  if (!clayMaterial) {
    // Pure solid sculpt view without reflections, specular highlights, or env map
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
 * Creates or updates a THREE.ShaderMaterial for the given CustomShaderConfig
 */
export function getCustomShaderMaterial(config?: CustomShaderConfig): THREE.ShaderMaterial {
  const activeConfig = config || SHADER_PRESETS[0];
  const codeKey = `${activeConfig.id}_${activeConfig.vertexShader.length}_${activeConfig.fragmentShader.length}_${JSON.stringify(activeConfig.uniforms)}`;

  if (!customShaderMaterial || currentShaderCodeKey !== codeKey) {
    // Clean up old material if needed
    if (customShaderMaterial) {
      customShaderMaterial.dispose();
    }

    const uniforms: Record<string, { value: any }> = {
      u_time: { value: 0 },
      u_color: { value: new THREE.Color(activeConfig.uniforms?.u_color || '#00f0ff') },
      u_colorSecondary: { value: new THREE.Color(activeConfig.uniforms?.u_colorSecondary || '#8b5cf6') },
      u_intensity: { value: activeConfig.uniforms?.u_intensity ?? 1.0 },
      u_speed: { value: activeConfig.uniforms?.u_speed ?? 1.0 },
      u_scale: { value: activeConfig.uniforms?.u_scale ?? 1.0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    };

    try {
      customShaderMaterial = new THREE.ShaderMaterial({
        vertexShader: activeConfig.vertexShader,
        fragmentShader: activeConfig.fragmentShader,
        uniforms,
        wireframe: !!activeConfig.wireframe,
        transparent: activeConfig.transparent !== false,
        side: THREE.DoubleSide,
        depthWrite: activeConfig.transparent === false,
      });
      currentShaderId = activeConfig.id;
      currentShaderCodeKey = codeKey;
    } catch (err) {
      console.error('Failed to create ShaderMaterial, falling back to basic:', err);
      customShaderMaterial = new THREE.ShaderMaterial({
        vertexShader: SHADER_PRESETS[0].vertexShader,
        fragmentShader: SHADER_PRESETS[0].fragmentShader,
        uniforms,
        side: THREE.DoubleSide,
      });
    }
  } else {
    // Update uniforms values if material exists
    if (customShaderMaterial.uniforms.u_color) {
      customShaderMaterial.uniforms.u_color.value.set(activeConfig.uniforms?.u_color || '#00f0ff');
    }
    if (customShaderMaterial.uniforms.u_colorSecondary) {
      customShaderMaterial.uniforms.u_colorSecondary.value.set(activeConfig.uniforms?.u_colorSecondary || '#8b5cf6');
    }
    if (customShaderMaterial.uniforms.u_intensity) {
      customShaderMaterial.uniforms.u_intensity.value = activeConfig.uniforms?.u_intensity ?? 1.0;
    }
    if (customShaderMaterial.uniforms.u_speed) {
      customShaderMaterial.uniforms.u_speed.value = activeConfig.uniforms?.u_speed ?? 1.0;
    }
    if (customShaderMaterial.uniforms.u_scale) {
      customShaderMaterial.uniforms.u_scale.value = activeConfig.uniforms?.u_scale ?? 1.0;
    }
    customShaderMaterial.wireframe = !!activeConfig.wireframe;
    customShaderMaterial.transparent = activeConfig.transparent !== false;
  }

  return customShaderMaterial;
}

/**
 * Updates dynamic uniforms like u_time every frame
 */
export function updateActiveShaderTime(elapsedTime: number) {
  if (customShaderMaterial && customShaderMaterial.uniforms.u_time) {
    customShaderMaterial.uniforms.u_time.value = elapsedTime;
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

  const wireColor = options?.wireframeColor || '#111111';

  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const originalMat = originalMaterialMap.get(mesh);
      if (!originalMat) return;

      switch (mode) {
        case 'normal': {
          // Restore original PBR materials
          mesh.material = originalMat;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          break;
        }

        case 'clay': {
          // Pure solid sculpt view without reflections, specular highlights, or shadows
          mesh.material = getClayMaterial();
          mesh.castShadow = false;
          mesh.receiveShadow = false;
          break;
        }

        case 'wireframe': {
          // Crisp wireframe material
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
          // Unlit base color map only (MeshBasicMaterial)
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
          // Standard UV checker grid texture
          mesh.material = getUVMaterial();
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          break;
        }

        case 'shader': {
          // Custom GLSL ShaderMaterial
          const shaderMat = getCustomShaderMaterial(options?.customShader);
          mesh.material = shaderMat;
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
