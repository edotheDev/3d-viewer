export type RenderMode = 'normal' | 'clay' | 'wireframe' | 'albedo' | 'uv' | 'shader';

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

export interface CustomShaderConfig {
  id: string;
  name: string;
  description: string;
  vertexShader: string;
  fragmentShader: string;
  uniforms: {
    u_time?: number;
    u_color: string; // hex color e.g. '#22d3ee'
    u_colorSecondary: string; // hex color e.g. '#a855f7'
    u_intensity: number;
    u_speed: number;
    u_scale: number;
  };
  wireframe?: boolean;
  transparent?: boolean;
  side?: 'front' | 'back' | 'double';
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
  customShader?: CustomShaderConfig;
}

export type CameraViewPreset = 'front' | 'back' | 'top' | 'bottom' | 'left' | 'right' | 'isometric' | 'reset';
