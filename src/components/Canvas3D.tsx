import React, { useRef, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Grid } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ViewerSettings, CameraViewPreset } from '../types';
import { ModelViewerScene } from './ModelViewerScene';

interface Canvas3DProps {
  model: THREE.Object3D | null;
  animations: THREE.AnimationClip[];
  settings: ViewerSettings;
  activePresetView: CameraViewPreset | null;
  onPresetViewHandled: () => void;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
}

// Background color mapping
const BACKGROUND_TONES: Record<string, string> = {
  light: '#F7F7F7',
  neutral: '#EAEAEA',
  studio: '#E0E0E0',
  dark: '#1A1A1A',
  'pure-black': '#000000',
};

// Camera Controller Component inside Canvas to animate presets & auto-rotate
const CameraController: React.FC<{
  activePresetView: CameraViewPreset | null;
  onPresetViewHandled: () => void;
  autoRotate: boolean;
  rotationSpeed: number;
}> = ({ activePresetView, onPresetViewHandled, autoRotate, rotationSpeed }) => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const targetCamPos = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    if (!activePresetView || !controlsRef.current) return;

    const distance = 4.8;
    const target = new THREE.Vector3(0, 0.8, 0);
    controlsRef.current.target.copy(target);

    switch (activePresetView) {
      case 'front':
        targetCamPos.current = new THREE.Vector3(0, 0.8, distance);
        break;
      case 'back':
        targetCamPos.current = new THREE.Vector3(0, 0.8, -distance);
        break;
      case 'top':
        targetCamPos.current = new THREE.Vector3(0, distance + 1.0, 0.001);
        break;
      case 'bottom':
        targetCamPos.current = new THREE.Vector3(0, -distance, 0.001);
        break;
      case 'left':
        targetCamPos.current = new THREE.Vector3(-distance, 0.8, 0);
        break;
      case 'right':
        targetCamPos.current = new THREE.Vector3(distance, 0.8, 0);
        break;
      case 'isometric':
        targetCamPos.current = new THREE.Vector3(3.2, 2.8, 3.2);
        break;
      case 'reset':
      default:
        targetCamPos.current = new THREE.Vector3(3.2, 2.2, 3.8);
        break;
    }

    onPresetViewHandled();
  }, [activePresetView, onPresetViewHandled]);

  useFrame(() => {
    if (targetCamPos.current) {
      camera.position.lerp(targetCamPos.current, 0.1);
      if (camera.position.distanceTo(targetCamPos.current) < 0.02) {
        camera.position.copy(targetCamPos.current);
        targetCamPos.current = null;
      }
      controlsRef.current?.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      autoRotate={autoRotate}
      autoRotateSpeed={rotationSpeed}
      enableDamping
      dampingFactor={0.05}
      minDistance={0.5}
      maxDistance={25}
      target={[0, 0.8, 0]}
    />
  );
};

// Canvas Ready Listener
const CanvasListener: React.FC<{ onCanvasReady: (canvas: HTMLCanvasElement) => void }> = ({
  onCanvasReady,
}) => {
  const { gl } = useThree();
  useEffect(() => {
    if (gl.domElement) {
      onCanvasReady(gl.domElement);
    }
  }, [gl, onCanvasReady]);

  return null;
};

export const Canvas3D: React.FC<Canvas3DProps> = ({
  model,
  animations,
  settings,
  activePresetView,
  onPresetViewHandled,
  onCanvasReady,
}) => {
  const bgColor = BACKGROUND_TONES[settings.backgroundTone] || '#F7F7F7';
  const isLightBg = settings.backgroundTone === 'light' || settings.backgroundTone === 'neutral' || settings.backgroundTone === 'studio';

  return (
    <div
      id="canvas-viewport-container"
      className="relative w-full h-full select-none transition-colors duration-500 overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      <Canvas
        camera={{ position: [3.2, 2.2, 3.8], fov: settings.fov, near: 0.1, far: 1000 }}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: settings.exposure,
        }}
        shadows
      >
        <CanvasListener onCanvasReady={onCanvasReady} />

        <CameraController
          activePresetView={activePresetView}
          onPresetViewHandled={onPresetViewHandled}
          autoRotate={settings.autoRotate}
          rotationSpeed={settings.rotationSpeed}
        />

        {/* Studio Lights */}
        <ambientLight intensity={settings.lightIntensity * (isLightBg ? 0.95 : 0.7)} />
        <directionalLight
          position={[6, 9, 6]}
          intensity={settings.lightIntensity * 1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
          shadow-camera-near={0.5}
          shadow-camera-far={25}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
        />
        <directionalLight
          position={[-6, 4, -5]}
          intensity={settings.lightIntensity * 0.7}
          color={isLightBg ? '#f3f4f6' : '#88a4cc'}
        />
        <directionalLight
          position={[0, -4, 4]}
          intensity={settings.lightIntensity * 0.3}
          color="#ffffff"
        />

        {/* Environment map for realistic PBR reflections (disabled in solid clay & unlit modes) */}
        {settings.renderMode !== 'clay' && settings.renderMode !== 'albedo' && (
          <Suspense fallback={null}>
            <Environment
              preset={settings.environmentPreset as any}
              environmentIntensity={settings.envIntensity}
            />
          </Suspense>
        )}

        {/* 3D Model Hierarchy */}
        <ModelViewerScene
          model={model}
          renderMode={settings.renderMode}
          wireframeColor={settings.wireframeColor}
          customShader={settings.customShader}
          animations={animations}
        />

        {/* Soft Contact Shadows on Ground (hidden in solid clay view for pure clean silhouette) */}
        {settings.showShadows && settings.renderMode !== 'clay' && (
          <ContactShadows
            position={[0, 0.001, 0]}
            opacity={isLightBg ? 0.35 : 0.75}
            scale={12}
            blur={1.8}
            far={4.5}
            resolution={1024}
            color={isLightBg ? '#000000' : '#000000'}
          />
        )}

        {/* Minimalist CAD Floor Grid */}
        {settings.showGrid && (
          <Grid
            position={[0, 0, 0]}
            args={[16, 16]}
            cellSize={0.5}
            cellThickness={0.7}
            cellColor={isLightBg ? '#E5E5E5' : '#334155'}
            sectionSize={2.0}
            sectionThickness={1.2}
            sectionColor={isLightBg ? '#D4D4D4' : '#64748b'}
            fadeDistance={14}
            fadeStrength={1.5}
            infiniteGrid
          />
        )}
      </Canvas>
    </div>
  );
};
