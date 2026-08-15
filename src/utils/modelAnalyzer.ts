import * as THREE from 'three';
import { ModelStats } from '../types';

export function analyzeThreeObject(
  object: THREE.Object3D,
  format: 'glb' | 'gltf' | 'fbx' | 'obj' = 'glb',
  fileSizeStr?: string,
  animationCount: number = 0
): ModelStats {
  let triangles = 0;
  let vertices = 0;
  let meshes = 0;
  const uniqueMaterials = new Set<string>();
  const uniqueTextures = new Set<string>();

  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);

  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      meshes++;
      const mesh = child as THREE.Mesh;
      const geometry = mesh.geometry;

      if (geometry) {
        if (geometry.index) {
          triangles += geometry.index.count / 3;
        } else if (geometry.attributes.position) {
          triangles += geometry.attributes.position.count / 3;
        }

        if (geometry.attributes.position) {
          vertices += geometry.attributes.position.count;
        }
      }

      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat) => {
          if (mat) {
            uniqueMaterials.add(mat.uuid);

            // Check for textures in common material slots
            const matAny = mat as any;
            const mapSlots = [
              'map',
              'normalMap',
              'roughnessMap',
              'metalnessMap',
              'aoMap',
              'emissiveMap',
              'bumpMap',
              'displacementMap',
              'alphaMap',
              'specularMap',
            ];

            for (const slot of mapSlots) {
              if (matAny[slot] && matAny[slot].isTexture) {
                uniqueTextures.add(matAny[slot].uuid);
              }
            }
          }
        });
      }
    }
  });

  return {
    triangles: Math.round(triangles),
    vertices: Math.round(vertices),
    meshes,
    materials: uniqueMaterials.size,
    textures: uniqueTextures.size,
    hasAnimations: animationCount > 0,
    animationCount,
    dimensions: {
      x: Number(size.x.toFixed(3)),
      y: Number(size.y.toFixed(3)),
      z: Number(size.z.toFixed(3)),
    },
    fileSize: fileSizeStr || 'Embedded',
    format,
  };
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}
