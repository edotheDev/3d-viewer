import React, { useRef } from 'react';
import {
  Camera,
  Upload,
  Layers,
  Sliders,
  RotateCcw,
  ChevronDown,
  Code2,
} from 'lucide-react';
import { SampleModel, ModelStats } from '../types';
import { SAMPLE_MODELS } from '../utils/sampleModels';
import { formatNumber } from '../utils/modelAnalyzer';

interface TopHeaderProps {
  currentModelId: string;
  onSelectSampleModel: (model: SampleModel) => void;
  onFileUpload: (file: File) => void;
  onTakeScreenshot: () => void;
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
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

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
        accept=".glb,.gltf,.fbx"
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
                  <span>Import Custom 3D File</span>
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
          title="Import .glb, .gltf, or .fbx file"
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
          title="GLSL Shader Studio & Editor (S)"
          aria-label="GLSL Shader Studio & Editor"
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

        {/* Dedicated Screenshot Camera Tool Button */}
        <button
          id="btn-capture-screenshot"
          onClick={onTakeScreenshot}
          disabled={isCapturing}
          className={`relative group flex items-center gap-2 px-4 py-2 rounded-full bg-[#111111] hover:bg-neutral-800 text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#111111] transition-all transform active:scale-95 ${
            isCapturing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Capture High-Resolution PNG (Canvas only)"
        >
          <Camera className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
          <span className="font-acid text-xs uppercase tracking-wider font-bold">
            {isCapturing ? 'Capturing...' : 'Capture'}
          </span>
          <span className="hidden lg:inline text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/20 text-white">
            PNG
          </span>
        </button>
      </div>
    </header>
  );
};
