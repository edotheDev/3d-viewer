/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { Canvas3D } from './components/Canvas3D';
import { FloatingNavBar } from './components/FloatingNavBar';
import { TopHeader } from './components/TopHeader';
import { CameraControlsOverlay } from './components/CameraControlsOverlay';
import { InspectorModal } from './components/InspectorModal';
import { SettingsModal } from './components/SettingsModal';
import { ShaderEditorModal } from './components/ShaderEditorModal';
import { DropZoneOverlay } from './components/DropZoneOverlay';
import { ToastContainer, ToastMessage } from './components/Toast';
import {
  RenderMode,
  ViewerSettings,
  SampleModel,
  ModelStats,
  CameraViewPreset,
  CustomShaderConfig,
} from './types';
import { SAMPLE_MODELS } from './utils/sampleModels';
import { SHADER_PRESETS } from './utils/shaderPresets';
import { parseGodotShader } from './utils/godotShaderParser';
import { loadModelFromSource, loadModelFromFile } from './utils/modelLoader';
import { analyzeThreeObject, formatNumber } from './utils/modelAnalyzer';
import { captureCanvasScreenshot } from './utils/screenshot';
import { Loader2 } from 'lucide-react';

const BACKGROUND_TONES: Record<string, string> = {
  light: '#F7F7F7',
  neutral: '#EAEAEA',
  studio: '#E0E0E0',
  dark: '#1A1A1A',
  'pure-black': '#000000',
};

const DEFAULT_SETTINGS: ViewerSettings = {
  renderMode: 'normal',
  backgroundTone: 'light',
  environmentPreset: 'studio',
  envIntensity: 1.0,
  lightIntensity: 1.0,
  showGrid: true,
  showShadows: true,
  showAxes: false,
  autoRotate: false,
  rotationSpeed: 1.5,
  fov: 45,
  wireframeColor: '#111111',
  exposure: 1.0,
  transparentBackground: false,
  customShader: SHADER_PRESETS[0],
};

export default function App() {
  // State
  const [settings, setSettings] = useState<ViewerSettings>(DEFAULT_SETTINGS);
  const [currentModel, setCurrentModel] = useState<THREE.Object3D | null>(null);
  const [animations, setAnimations] = useState<THREE.AnimationClip[]>([]);
  const [currentModelInfo, setCurrentModelInfo] = useState<{
    id: string;
    name: string;
    format: 'glb' | 'gltf' | 'fbx';
    fileSizeStr?: string;
  }>({
    id: SAMPLE_MODELS[0].id,
    name: SAMPLE_MODELS[0].name,
    format: SAMPLE_MODELS[0].format,
  });

  const [stats, setStats] = useState<ModelStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isFlashActive, setIsFlashActive] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShaderEditorOpen, setIsShaderEditorOpen] = useState<boolean>(false);
  const [activePresetView, setActivePresetView] = useState<CameraViewPreset | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Toast Helpers
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load a model from URL or Sample
  const handleLoadSampleModel = useCallback(
    async (sample: SampleModel) => {
      setIsLoading(true);
      setLoadingProgress(10);
      try {
        const result = await loadModelFromSource(sample.url, sample.format, (p) =>
          setLoadingProgress(p)
        );

        setCurrentModel(result.scene);
        setAnimations(result.animations);
        setCurrentModelInfo({
          id: sample.id,
          name: sample.name,
          format: result.format,
        });

        const computedStats = analyzeThreeObject(
          result.scene,
          result.format,
          'Standard Preset',
          result.animations.length
        );
        setStats(computedStats);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load remote model, switching to procedural drone fallback:', err);
        // Seamless fallback to procedural model
        try {
          const fallback = await loadModelFromSource('procedural:cyber-drone', 'glb');
          setCurrentModel(fallback.scene);
          setAnimations(fallback.animations);
          setCurrentModelInfo({
            id: 'procedural-cyber-drone',
            name: 'Orbital Recon Drone (Procedural)',
            format: 'glb',
          });
          const fallbackStats = analyzeThreeObject(
            fallback.scene,
            'glb',
            'Procedural',
            0
          );
          setStats(fallbackStats);
          addToast({
            type: 'info',
            title: 'Sample Asset Loaded',
            description: 'Rendered built-in procedural asset',
          });
        } catch (fallbackErr) {
          console.error(fallbackErr);
        }
        setIsLoading(false);
      }
    },
    [addToast]
  );

  // Load model or shader from custom uploaded file
  const handleLoadCustomFile = useCallback(
    async (file: File) => {
      const fileName = file.name;
      const ext = fileName.split('.').pop()?.toLowerCase();

      // Check if it is a shader file (.gdshader, .shader, .tres, .material, .glsl, .frag, .vert, .json, .txt)
      const isShaderExtension =
        ext === 'gdshader' ||
        ext === 'shader' ||
        ext === 'tres' ||
        ext === 'material' ||
        ext === 'glsl' ||
        ext === 'frag' ||
        ext === 'vert' ||
        ext === 'json';

      if (isShaderExtension || ext === 'txt') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (!content) return;

          // Check if it is JSON config
          if (ext === 'json') {
            try {
              const parsed = JSON.parse(content);
              if (parsed.fragmentShader || parsed.vertexShader) {
                setSettings((prev) => ({
                  ...prev,
                  customShader: {
                    id: `custom_${Date.now()}`,
                    name: parsed.name || fileName.replace(/\.[^/.]+$/, ''),
                    description: parsed.description || 'Imported shader config',
                    vertexShader: parsed.vertexShader || prev.customShader.vertexShader,
                    fragmentShader: parsed.fragmentShader || content,
                    uniforms: parsed.uniforms || prev.customShader.uniforms,
                    transparent: parsed.transparent ?? prev.customShader.transparent,
                    wireframe: parsed.wireframe ?? prev.customShader.wireframe,
                  },
                  renderMode: 'shader',
                }));
                addToast({
                  type: 'success',
                  title: 'Shader Config Loaded',
                  description: `Loaded ${fileName} and active in Shader Mode`,
                });
                return;
              }
            } catch {
              // Not JSON, continue checking
            }
          }

          // Check if it's Godot shader code, UID shader, or raw shader
          const isGodotShader =
            ext === 'gdshader' ||
            ext === 'shader' ||
            ext === 'tres' ||
            ext === 'material' ||
            content.includes('shader_type') ||
            content.includes('uid://') ||
            content.includes('void fragment(') ||
            content.includes('void vertex(') ||
            content.includes('render_mode');

          if (isGodotShader) {
            try {
              const shaderConfig = parseGodotShader(content, fileName.replace(/\.[^/.]+$/, ''));
              setSettings((prev) => ({
                ...prev,
                customShader: shaderConfig,
                renderMode: 'shader',
              }));
              addToast({
                type: 'success',
                title: 'Godot Shader Loaded',
                description: `Transpiled & running live on 3D model!`,
              });
              return;
            } catch (err: any) {
              addToast({
                type: 'error',
                title: 'Godot Shader Parse Error',
                description: err?.message || 'Invalid Godot shader syntax',
              });
              return;
            }
          }

          if (ext === 'vert') {
            setSettings((prev) => ({
              ...prev,
              customShader: {
                ...prev.customShader,
                vertexShader: content,
              },
              renderMode: 'shader',
            }));
            addToast({
              type: 'success',
              title: 'Vertex Shader Loaded',
              description: `Loaded ${fileName} and active in Shader Mode`,
            });
            return;
          }

          if (ext === 'frag' || ext === 'glsl' || isShaderExtension) {
            setSettings((prev) => ({
              ...prev,
              customShader: {
                ...prev.customShader,
                fragmentShader: content,
              },
              renderMode: 'shader',
            }));
            addToast({
              type: 'success',
              title: 'Custom Shader Loaded',
              description: `Loaded ${fileName} and active in Shader Mode`,
            });
            return;
          }
        };
        reader.readAsText(file);
        return;
      }

      // Check 3D Model Formats
      if (ext !== 'glb' && ext !== 'gltf' && ext !== 'fbx') {
        addToast({
          type: 'error',
          title: 'Unsupported File Format',
          description: 'Please upload a 3D model (.glb, .gltf, .fbx) or shader (.gdshader, .glsl, .tres).',
        });
        return;
      }

      setIsLoading(true);
      setLoadingProgress(30);

      try {
        const result = await loadModelFromFile(file, (p) => setLoadingProgress(p));
        setCurrentModel(result.scene);
        setAnimations(result.animations);

        const sizeKb = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        setCurrentModelInfo({
          id: `custom-${Date.now()}`,
          name: fileName.replace(/\.[^/.]+$/, ''),
          format: result.format,
          fileSizeStr: sizeKb,
        });

        const computedStats = analyzeThreeObject(
          result.scene,
          result.format,
          sizeKb,
          result.animations.length
        );
        setStats(computedStats);

        addToast({
          type: 'success',
          title: '3D Asset Imported',
          description: `${fileName} (${formatNumber(computedStats.triangles)} triangles)`,
        });
      } catch (err) {
        console.error('File load error:', err);
        addToast({
          type: 'error',
          title: 'Error Loading 3D Model',
          description: 'Could not parse the selected file. Ensure textures are embedded.',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [addToast]
  );

  // Initialize initial sample model on startup
  useEffect(() => {
    handleLoadSampleModel(SAMPLE_MODELS[0]);
  }, [handleLoadSampleModel]);

  // Material Mode Switch
  const handleModeChange = useCallback((mode: RenderMode) => {
    setSettings((prev) => ({ ...prev, renderMode: mode }));
    const titles: Record<RenderMode, string> = {
      normal: 'Normal PBR Mode: Full materials & textures enabled',
      clay: 'Clay Mode: Solid matte sculpt view (no reflections or shadows)',
      wireframe: 'Wireframe Mode: Mesh topology analysis',
      albedo: 'Albedo Mode: Unlit base color texture map',
      uv: 'UV Mode: Checkerboard mapping projection',
      shader: 'Custom Shader Engine: GLSL real-time shading active',
    };
    addToast({
      title: `${mode.toUpperCase()} MODE ACTIVE`,
      description: titles[mode],
      type: 'info',
    });
  }, [addToast]);

  // Update Settings Partial
  const handleUpdateSettings = useCallback((newSettings: Partial<ViewerSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const handleUpdateCustomShader = useCallback((config: CustomShaderConfig) => {
    setSettings((prev) => ({ ...prev, customShader: config }));
  }, []);

  // Screenshot Capture Handler
  const handleTakeScreenshot = useCallback(
    async (transparentOverride?: boolean) => {
      if (!canvasRef.current || isCapturing) return;

      setIsCapturing(true);
      setIsFlashActive(true);

      // Trigger flash animation
      setTimeout(() => setIsFlashActive(false), 200);

      // Default to transparent unless specified
      const isTransparent = transparentOverride !== undefined ? transparentOverride : true;
      const bgColor = BACKGROUND_TONES[settings.backgroundTone] || '#F7F7F7';

      try {
        const { dataUrl, filename } = await captureCanvasScreenshot(
          canvasRef.current,
          currentModelInfo.name,
          settings.renderMode,
          isTransparent,
          bgColor
        );

        addToast({
          type: 'screenshot',
          title: isTransparent ? 'Transparent PNG Exported' : 'High-Res Capture Saved',
          description: filename,
          thumbnail: dataUrl,
        });
      } catch (err) {
        console.error('Screenshot error:', err);
        addToast({
          type: 'error',
          title: 'Screenshot Failed',
          description: 'Unable to capture WebGL context.',
        });
      } finally {
        setIsCapturing(false);
      }
    },
    [isCapturing, currentModelInfo.name, settings.renderMode, settings.backgroundTone, addToast]
  );

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key) {
        case '1':
          handleModeChange('normal');
          break;
        case '2':
          handleModeChange('clay');
          break;
        case '3':
          handleModeChange('wireframe');
          break;
        case '4':
          handleModeChange('albedo');
          break;
        case '5':
          handleModeChange('uv');
          break;
        case '6':
          handleModeChange('shader');
          break;
        case 's':
        case 'S':
          setIsShaderEditorOpen((prev) => !prev);
          break;
        case 'c':
        case 'C':
          if (e.shiftKey) {
            handleTakeScreenshot(false); // Solid backdrop
          } else {
            handleTakeScreenshot(true); // Transparent PNG
          }
          break;
        case 'r':
        case 'R':
          setActivePresetView('reset');
          break;
        case ' ':
          e.preventDefault();
          setSettings((prev) => ({ ...prev, autoRotate: !prev.autoRotate }));
          break;
        case 'i':
        case 'I':
          setIsInspectorOpen((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleModeChange, handleTakeScreenshot]);

  // Drag & Drop Listeners
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (!e.relatedTarget || (e.relatedTarget as HTMLElement).nodeName === 'HTML') {
        setIsDragging(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleLoadCustomFile(e.dataTransfer.files[0]);
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleLoadCustomFile]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#F7F7F7] text-[#111111]">
      {/* Flash Shutter Effect on Screenshot */}
      <div
        className={`fixed inset-0 z-50 pointer-events-none bg-white transition-opacity duration-200 ${
          isFlashActive ? 'opacity-90' : 'opacity-0'
        }`}
      />

      {/* 3D WebGL Canvas Viewport */}
      <Canvas3D
        model={currentModel}
        animations={animations}
        settings={settings}
        activePresetView={activePresetView}
        onPresetViewHandled={() => setActivePresetView(null)}
        onCanvasReady={(canvas) => {
          canvasRef.current = canvas;
        }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div
          id="model-loading-indicator"
          className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/20 backdrop-blur-xs pointer-events-none"
        >
          <div className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-white border border-[#E5E5E5] shadow-[0_20px_40px_rgba(0,0,0,0.08)] text-[#111111]">
            <Loader2 className="w-8 h-8 text-[#111111] animate-spin" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-acid uppercase tracking-wider text-[#111111] font-bold">
                Preparing 3D Assets
              </span>
              <span className="text-xs font-inter text-[#888888]">
                Parsing geometry & extracting texture buffers...
              </span>
            </div>
            {loadingProgress > 0 && loadingProgress < 100 && (
              <div className="w-48 h-1.5 rounded-full bg-[#E5E5E5] overflow-hidden mt-2">
                <div
                  className="h-full bg-[#111111] transition-all duration-200"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Header & Model Selector */}
      <TopHeader
        currentModelId={currentModelInfo.id}
        onSelectSampleModel={handleLoadSampleModel}
        onFileUpload={handleLoadCustomFile}
        onTakeScreenshot={handleTakeScreenshot}
        onToggleInspector={() => {
          setIsInspectorOpen(!isInspectorOpen);
          if (isSettingsOpen) setIsSettingsOpen(false);
          if (isShaderEditorOpen) setIsShaderEditorOpen(false);
        }}
        onToggleSettings={() => {
          setIsSettingsOpen(!isSettingsOpen);
          if (isInspectorOpen) setIsInspectorOpen(false);
          if (isShaderEditorOpen) setIsShaderEditorOpen(false);
        }}
        onToggleShaderEditor={() => {
          setIsShaderEditorOpen(!isShaderEditorOpen);
          if (isInspectorOpen) setIsInspectorOpen(false);
          if (isSettingsOpen) setIsSettingsOpen(false);
        }}
        onResetCamera={() => setActivePresetView('reset')}
        isInspectorOpen={isInspectorOpen}
        isSettingsOpen={isSettingsOpen}
        isShaderEditorOpen={isShaderEditorOpen}
        stats={stats}
        currentModelName={currentModelInfo.name}
        isCapturing={isCapturing}
      />

      {/* Floating Center Bottom Navigation Bar for Render Modes */}
      <FloatingNavBar
        currentMode={settings.renderMode}
        onModeChange={handleModeChange}
        onOpenShaderEditor={() => setIsShaderEditorOpen(true)}
        activeShaderName={settings.customShader?.name}
      />

      {/* Bottom Left Camera Presets & Turntable */}
      <CameraControlsOverlay
        onSelectView={(view) => setActivePresetView(view)}
        autoRotate={settings.autoRotate}
        onToggleAutoRotate={() =>
          setSettings((prev) => ({ ...prev, autoRotate: !prev.autoRotate }))
        }
      />

      {/* Slide-out Modals */}
      <InspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        stats={stats}
        modelName={currentModelInfo.name}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      <ShaderEditorModal
        isOpen={isShaderEditorOpen}
        onClose={() => setIsShaderEditorOpen(false)}
        shaderConfig={settings.customShader || SHADER_PRESETS[0]}
        onUpdateShader={handleUpdateCustomShader}
        onApplyShaderMode={() => handleModeChange('shader')}
      />

      {/* Drag and Drop Zone Fullscreen Prompt */}
      <DropZoneOverlay isDragging={isDragging} />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </main>
  );
}
