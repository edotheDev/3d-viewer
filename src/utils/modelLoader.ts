import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { createProceduralDrone, createProceduralMechaCore } from './sampleModels';

export interface LoadedModelResult {
  scene: THREE.Group | THREE.Object3D;
  animations: THREE.AnimationClip[];
  mixer?: THREE.AnimationMixer;
  format: 'glb' | 'gltf' | 'fbx';
}

const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
gltfLoader.setDRACOLoader(dracoLoader);

const fbxLoader = new FBXLoader();

/**
 * Normalizes and centers a 3D model so it fits neatly into the viewer
 * with its base at y = 0.
 */
export function normalizeModelTransform(object: THREE.Object3D, targetSize: number = 3.0) {
  object.position.set(0, 0, 0);
  object.rotation.set(0, 0, 0);
  object.scale.set(1, 1, 1);
  object.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);

  const center = new THREE.Vector3();
  box.getCenter(center);

  // Compute maximum dimension
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = maxDim > 0 ? targetSize / maxDim : 1;

  object.scale.setScalar(scale);

  // Recompute box after scaling to ground it
  object.updateMatrixWorld(true);
  const scaledBox = new THREE.Box3().setFromObject(object);
  const scaledCenter = new THREE.Vector3();
  scaledBox.getCenter(scaledCenter);

  // Center horizontally and rest bottom on y = 0
  object.position.x = -scaledCenter.x;
  object.position.y = -scaledBox.min.y;
  object.position.z = -scaledCenter.z;

  object.updateMatrixWorld(true);
}

/**
 * Loads a model from a URL or procedural generator.
 */
export async function loadModelFromSource(
  url: string,
  format: 'glb' | 'gltf' | 'fbx' = 'glb',
  onProgress?: (percent: number) => void
): Promise<LoadedModelResult> {
  // Check for procedural models
  if (url === 'procedural:cyber-drone') {
    const drone = createProceduralDrone();
    normalizeModelTransform(drone);
    return { scene: drone, animations: [], format: 'glb' };
  }

  if (url === 'procedural:mecha-core') {
    const core = createProceduralMechaCore();
    normalizeModelTransform(core);
    return { scene: core, animations: [], format: 'glb' };
  }

  if (format === 'fbx' || url.toLowerCase().endsWith('.fbx')) {
    return new Promise((resolve, reject) => {
      fbxLoader.load(
        url,
        (fbx) => {
          normalizeModelTransform(fbx);
          resolve({
            scene: fbx,
            animations: fbx.animations || [],
            format: 'fbx',
          });
        },
        (xhr) => {
          if (xhr.lengthComputable && onProgress) {
            onProgress(Math.round((xhr.loaded / xhr.total) * 100));
          }
        },
        (err) => reject(err)
      );
    });
  }

  // GLTF / GLB Loader
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => {
        normalizeModelTransform(gltf.scene);
        resolve({
          scene: gltf.scene,
          animations: gltf.animations || [],
          format: 'glb',
        });
      },
      (xhr) => {
        if (xhr.lengthComputable && onProgress) {
          onProgress(Math.round((xhr.loaded / xhr.total) * 100));
        }
      },
      (err) => reject(err)
    );
  });
}

/**
 * Loads a model from a user-uploaded File (.glb, .gltf, .fbx).
 */
export async function loadModelFromFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<LoadedModelResult> {
  const fileName = file.name.toLowerCase();
  const isFbx = fileName.endsWith('.fbx');
  const format: 'glb' | 'gltf' | 'fbx' = isFbx ? 'fbx' : fileName.endsWith('.gltf') ? 'gltf' : 'glb';

  const buffer = await file.arrayBuffer();

  if (isFbx) {
    return new Promise((resolve, reject) => {
      try {
        const fbx = fbxLoader.parse(buffer, '');
        normalizeModelTransform(fbx);
        resolve({
          scene: fbx,
          animations: fbx.animations || [],
          format: 'fbx',
        });
      } catch (err) {
        reject(err);
      }
    });
  } else {
    return new Promise((resolve, reject) => {
      gltfLoader.parse(
        buffer,
        '',
        (gltf) => {
          normalizeModelTransform(gltf.scene);
          resolve({
            scene: gltf.scene,
            animations: gltf.animations || [],
            format,
          });
        },
        (err) => reject(err)
      );
    });
  }
}
