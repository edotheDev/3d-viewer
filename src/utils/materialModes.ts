import * as THREE from 'three';
import { RenderMode } from '../types';
import { getUVCheckerTexture } from './uvTexture';

// Store original materials for each mesh to restore in 'normal' mode
const originalMaterialMap = new WeakMap<THREE.Mesh, THREE.Material | THREE.Material[]>();

// Cached reusable materials for efficiency
let clayMaterial: THREE.MeshStandardMaterial | null = null;
let uvMaterial: THREE.MeshStandardMaterial | null = null;

function getClayMaterial(): THREE.MeshStandardMaterial {
  if (!clayMaterial) {
    clayMaterial = new THREE.MeshStandardMaterial({
      color: 0xdddddf,
      roughness: 0.82,
      metalness: 0.04,
      flatShading: false,
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
  options?: { wireframeColor?: string }
) {
  cacheOriginalMaterials(root);

  const wireColor = options?.wireframeColor || '#4ade80';

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
          // Uniform flat light-gray studio material
          mesh.material = getClayMaterial();
          mesh.castShadow = true;
          mesh.receiveShadow = true;
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
