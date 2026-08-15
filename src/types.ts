export type RenderMode = 'normal' | 'clay' | 'wireframe' | 'albedo' | 'uv';

export type BackgroundTone = 'dark' | 'studio' | 'neutral' | 'light' | 'pure-black';

export type EnvironmentPreset = 'studio' | 'sunset' | 'warehouse' | 'city' | 'dawn' | 'night' | 'apartment';

export interface ModelStats {
  triangles: number;
  vertices: number;
  meshes: number;
  materials: number;
  textures: number;
  hasAnimations: boolean;
  animationCount: number;
  dimensions: {
    x: number;
    y: number;
    z: number;
  };
  fileSize?: string;
  format: 'glb' | 'gltf' | 'fbx' | 'obj';
}

export interface SampleModel {
  id: string;
  name: string;
  category: string;
  url: string;
  format: 'glb' | 'gltf' | 'fbx';
  thumbnail?: string;
  author?: string;
  scale?: number;
}

export interface ViewerSettings {
  renderMode: RenderMode;
  backgroundTone: BackgroundTone;
  environmentPreset: EnvironmentPreset;
  envIntensity: number;
  lightIntensity: number;
  showGrid: boolean;
  showShadows: boolean;
  showAxes: boolean;
  autoRotate: boolean;
  rotationSpeed: number;
  fov: number;
  wireframeColor: string;
  wireframeThickness?: number;
  exposure: number;
  transparentBackground: boolean;
}

export type CameraViewPreset = 'front' | 'back' | 'top' | 'bottom' | 'left' | 'right' | 'isometric' | 'reset';
