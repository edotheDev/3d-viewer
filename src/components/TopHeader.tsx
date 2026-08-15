import React, { useRef, useState } from 'react';
import {
  Camera,
  Upload,
  Layers,
  Sliders,
  RotateCcw,
  ChevronDown,
  Code2,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { SampleModel, ModelStats } from '../types';
import { SAMPLE_MODELS } from '../utils/sampleModels';
import { formatNumber } from '../utils/modelAnalyzer';

interface TopHeaderProps {
  currentModelId: string;
  onSelectSampleModel: (model: SampleModel) => void;
  onFileUpload: (file: File) => void;
  onTakeScreenshot: (transparent?: boolean) => void;
  onToggleInspector: () => void;
  onToggleSettings: () => void;
  onToggleShaderEditor: () => void;
  onResetCamera: () => void;
  isInspectorOpen: boolean;
  isSettingsOpen: boolean;
  isShaderEditorOpen: boolean;
  stats: ModelStats | null;
  currentModelName: string;
  isCapturing: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentModelId,
  onSelectSampleModel,
  onFileUpload,
  onTakeScreenshot,
  onToggleInspector,
  onToggleSettings,
  onToggleShaderEditor,
  onResetCamera,
  isInspectorOpen,
  isSettingsOpen,
  isShaderEditorOpen,
  stats,
  currentModelName,
  isCapturing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScreenshotMenuOpen, setIsScreenshotMenuOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <header
      id="app-top-header"
      className="fixed top-5 inset-x-6 z-30 flex items-center justify-between pointer-events-none"
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf,.fbx,.gdshader,.glsl,.frag,.vert,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Left Wing: Model Brand & Library Selector */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="relative">
          <button
            id="model-selector-dropdown-btn"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-[#E5E5E5] text-xs font-acid uppercase tracking-wider text-[#111111] font-bold hover:border-[#111111] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
          >
            <span className="w-2 h-2 rounded-full bg-[#111111]" />
            <span className="max-w-[140px] truncate sm:max-w-[200px]">{currentModelName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#888888]" />
          </button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 mt-2 w-72 p-2 rounded-2xl bg-white border border-[#E5E5E5] z-50 shadow-[0_20px_40px_rgba(0,0,0,0.08)] flex flex-col gap-1">
                <div className="px-3 py-1.5 text-[10px] font-acid uppercase tracking-widest text-[#888888]">
                  Preset Assets
                </div>
                {SAMPLE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    id={`sample-model-option-${model.id}`}
                    onClick={() => {
                      onSelectSampleModel(model);
                      setIsDropdownOpen(false);
                    }}
                    className={`flex items-start justify-between p-2.5 rounded-xl text-left transition-colors ${
                      currentModelId === model.id
                        ? 'bg-[#111111] text-white'
                        : 'hover:bg-neutral-100 text-[#111111]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-acid tracking-wide font-semibold">{model.name}</div>
                      <div className={`text-[10px] font-inter ${currentModelId === model.id ? 'text-zinc-300' : 'text-[#888888]'}`}>
                        {model.category}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                        currentModelId === model.id ? 'bg-white/20 text-white' : 'bg-neutral-100 text-[#888888]'
                      }`}
                    >
                      {model.format}
                    </span>
                  </button>
                ))}

                <div className="my-1 border-t border-[#E5E5E5]" />

                <button
                  id="dropdown-upload-btn"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setIsDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 w-full p-2.5 rounded-xl text-xs font-acid uppercase tracking-wider text-[#111111] font-bold hover:bg-neutral-100 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import 3D Asset or .gdshader</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Quick Upload Button */}
        <button
          id="quick-upload-asset-btn"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-[#E5E5E5] text-xs font-acid uppercase tracking-wider text-[#111111] hover:border-[#111111] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
          title="Import .glb, .gltf, .fbx, or .gdshader file"
        >
          <Upload className="w-3.5 h-3.5 text-[#888888]" />
          <span className="hidden sm:inline">Import</span>
        </button>
      </div>

      {/* Center Wing: Geometry Stat Badge (Inter Regular for values) */}
      {stats && (
        <div
          id="center-stat-badge"
          className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-[#E5E5E5] shadow-[0_4px_12px_rgba(0,0,0,0.03)] pointer-events-auto text-[11px] font-inter text-[#111111]"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[#888888] font-acid uppercase text-[10px] tracking-wider">Tris</span>
            <span className="font-mono text-[#111111] font-medium">{formatNumber(stats.triangles)}</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-[#E5E5E5]" />
          <div className="flex items-center gap-1.5">
            <span className="text-[#888888] font-acid uppercase text-[10px] tracking-wider">Verts</span>
            <span className="font-mono text-[#111111] font-medium">{formatNumber(stats.vertices)}</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-[#E5E5E5]" />
          <div className="flex items-center gap-1.5">
            <span className="text-[#888888] font-acid uppercase text-[10px] tracking-wider">Format</span>
            <span className="font-mono uppercase text-[#111111] font-semibold">{stats.format}</span>
          </div>
        </div>
      )}

      {/* Right Wing: Screenshot Camera Button & Controls */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Reset View */}
        <button
          id="btn-reset-camera-orbit"
          onClick={onResetCamera}
          className="p-2.5 rounded-full bg-white border border-[#E5E5E5] text-[#111111] hover:bg-neutral-100 hover:border-[#111111] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
          title="Reset Orbit Camera"
          aria-label="Reset Orbit Camera"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Model Inspector Drawer Toggle */}
        <button
          id="btn-toggle-inspector-drawer"
          onClick={onToggleInspector}
          className={`p-2.5 rounded-full border transition-all shadow-[0_4px_12px_rgba(0,0,0,0.03)] ${
            isInspectorOpen
              ? 'bg-[#111111] text-white border-[#111111]'
              : 'bg-white border-[#E5E5E5] text-[#111111] hover:bg-neutral-100 hover:border-[#111111]'
          }`}
          title="Model Geometry & Materials Inspector (I)"
          aria-label="Model Geometry & Materials Inspector"
        >
          <Layers className="w-3.5 h-3.5" />
        </button>

        {/* GLSL Shader Studio Drawer Toggle */}
        <button
          id="btn-toggle-shader-studio"
          onClick={onToggleShaderEditor}
          className={`p-2.5 rounded-full border transition-all shadow-[0_4px_12px_rgba(0,0,0,0.03)] ${
            isShaderEditorOpen
              ? 'bg-[#111111] text-white border-[#111111]'
              : 'bg-white border-[#E5E5E5] text-[#111111] hover:bg-neutral-100 hover:border-[#111111]'
          }`}
          title="GLSL & Godot Shader Studio (S)"
          aria-label="GLSL & Godot Shader Studio"
        >
          <Code2 className="w-3.5 h-3.5" />
        </button>

        {/* Environment & Lighting Settings Toggle */}
        <button
          id="btn-toggle-viewer-settings"
          onClick={onToggleSettings}
          className={`p-2.5 rounded-full border transition-all shadow-[0_4px_12px_rgba(0,0,0,0.03)] ${
            isSettingsOpen
              ? 'bg-[#111111] text-white border-[#111111]'
              : 'bg-white border-[#E5E5E5] text-[#111111] hover:bg-neutral-100 hover:border-[#111111]'
          }`}
          title="Lighting & Environment Settings"
          aria-label="Lighting & Environment Settings"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {/* Dedicated Screenshot Camera Tool with Transparent PNG dropdown */}
        <div className="relative">
          <div className="flex items-center rounded-full bg-[#111111] text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#111111]">
            <button
              id="btn-capture-screenshot"
              onClick={() => onTakeScreenshot(true)}
              disabled={isCapturing}
              className={`group flex items-center gap-1.5 pl-3.5 pr-2 py-2 hover:bg-neutral-800 rounded-l-full transition-all ${
                isCapturing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Download Transparent PNG cutout (C)"
            >
              <Camera className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
              <span className="font-acid text-xs uppercase tracking-wider font-bold">
                {isCapturing ? 'Saving...' : 'Capture'}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/20 text-white font-semibold">
                PNG
              </span>
            </button>

            <button
              id="btn-screenshot-options"
              onClick={() => setIsScreenshotMenuOpen(!isScreenshotMenuOpen)}
              className="p-2 hover:bg-neutral-800 rounded-r-full border-l border-white/20 transition-colors"
              title="Screenshot Export Options"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Screenshot Format Options Dropdown */}
          {isScreenshotMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsScreenshotMenuOpen(false)}
              />
              <div className="absolute right-0 top-12 z-50 w-64 p-2 rounded-2xl bg-white border border-[#E5E5E5] shadow-[0_20px_40px_rgba(0,0,0,0.12)] flex flex-col gap-1 text-[#111111] animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] font-acid uppercase tracking-wider text-[#888888] font-bold">
                  PNG Export Options
                </div>
                <button
                  onClick={() => {
                    onTakeScreenshot(true);
                    setIsScreenshotMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl text-left hover:bg-neutral-100 transition-colors text-[#111111]"
                >
                  <Sparkles className="w-4 h-4 text-cyan-600 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-acid uppercase tracking-wider font-bold">
                      Transparent PNG (Alpha)
                    </span>
                    <span className="text-[10px] font-inter text-[#888888]">
                      Clean alpha cutout without background
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onTakeScreenshot(false);
                    setIsScreenshotMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl text-left hover:bg-neutral-100 transition-colors text-[#111111]"
                >
                  <ImageIcon className="w-4 h-4 text-[#111111] shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-acid uppercase tracking-wider font-bold">
                      Solid Canvas PNG
                    </span>
                    <span className="text-[10px] font-inter text-[#888888]">
                      Includes current canvas backdrop tone
                    </span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
