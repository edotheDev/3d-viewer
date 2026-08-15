import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Code2,
  X,
  Upload,
  Download,
  RotateCcw,
  Sparkles,
  Play,
  Sliders,
  FileCode,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { CustomShaderConfig } from '../types';
import { SHADER_PRESETS, DEFAULT_VERTEX_SHADER } from '../utils/shaderPresets';

interface ShaderEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  shaderConfig: CustomShaderConfig;
  onUpdateShader: (config: CustomShaderConfig) => void;
  onApplyShaderMode: () => void;
}

export const ShaderEditorModal: React.FC<ShaderEditorModalProps> = ({
  isOpen,
  onClose,
  shaderConfig,
  onUpdateShader,
  onApplyShaderMode,
}) => {
  const [activeTab, setActiveTab] = useState<'fragment' | 'vertex' | 'uniforms'>('fragment');
  const [localFrag, setLocalFrag] = useState(shaderConfig.fragmentShader);
  const [localVert, setLocalVert] = useState(shaderConfig.vertexShader || DEFAULT_VERTEX_SHADER);
  const [compileStatus, setCompileStatus] = useState<{ success: boolean; msg?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when shaderConfig preset changes from outside
  React.useEffect(() => {
    setLocalFrag(shaderConfig.fragmentShader);
    setLocalVert(shaderConfig.vertexShader || DEFAULT_VERTEX_SHADER);
  }, [shaderConfig.id, shaderConfig.fragmentShader, shaderConfig.vertexShader]);

  const handleSelectPreset = (preset: CustomShaderConfig) => {
    setLocalFrag(preset.fragmentShader);
    setLocalVert(preset.vertexShader || DEFAULT_VERTEX_SHADER);
    onUpdateShader({
      ...preset,
      uniforms: { ...preset.uniforms },
    });
    setCompileStatus({ success: true, msg: `Loaded preset "${preset.name}"` });
  };

  const handleApplyCode = () => {
    try {
      onUpdateShader({
        ...shaderConfig,
        fragmentShader: localFrag,
        vertexShader: localVert,
      });
      onApplyShaderMode();
      setCompileStatus({ success: true, msg: 'Shader compiled and applied to 3D model!' });
      setTimeout(() => setCompileStatus(null), 3000);
    } catch (err: any) {
      setCompileStatus({ success: false, msg: err?.message || 'Error compiling shader' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.json')) {
        try {
          const parsed = JSON.parse(content);
          if (parsed.fragmentShader) {
            setLocalFrag(parsed.fragmentShader);
            if (parsed.vertexShader) setLocalVert(parsed.vertexShader);
            onUpdateShader({
              id: `custom_${Date.now()}`,
              name: parsed.name || file.name.replace(/\.[^/.]+$/, ''),
              description: parsed.description || 'Imported custom shader',
              vertexShader: parsed.vertexShader || DEFAULT_VERTEX_SHADER,
              fragmentShader: parsed.fragmentShader,
              uniforms: parsed.uniforms || { ...shaderConfig.uniforms },
              transparent: parsed.transparent ?? shaderConfig.transparent,
              wireframe: parsed.wireframe ?? shaderConfig.wireframe,
            });
            setCompileStatus({ success: true, msg: `Loaded shader from ${file.name}` });
          }
        } catch {
          setCompileStatus({ success: false, msg: 'Invalid JSON shader configuration' });
        }
      } else if (fileName.endsWith('.vert')) {
        setLocalVert(content);
        setActiveTab('vertex');
        onUpdateShader({
          ...shaderConfig,
          vertexShader: content,
        });
        setCompileStatus({ success: true, msg: `Loaded vertex shader from ${file.name}` });
      } else {
        // Assume fragment shader (.frag or .glsl)
        setLocalFrag(content);
        setActiveTab('fragment');
        onUpdateShader({
          ...shaderConfig,
          fragmentShader: content,
        });
        setCompileStatus({ success: true, msg: `Loaded fragment shader from ${file.name}` });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportShader = () => {
    const data = JSON.stringify(
      {
        name: shaderConfig.name,
        description: shaderConfig.description,
        vertexShader: localVert,
        fragmentShader: localFrag,
        uniforms: shaderConfig.uniforms,
        transparent: shaderConfig.transparent,
        wireframe: shaderConfig.wireframe,
      },
      null,
      2
    );
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${shaderConfig.id || 'custom'}_shader.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetToDefault = () => {
    handleSelectPreset(SHADER_PRESETS[0]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="shader-editor-modal"
          initial={{ opacity: 0, x: 20, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="fixed top-20 right-6 z-40 w-96 md:w-[440px] p-5 rounded-3xl bg-white border border-[#E5E5E5] shadow-[0_25px_50px_rgba(0,0,0,0.12)] flex flex-col gap-4 max-h-[calc(100vh-140px)] overflow-hidden text-[#111111]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-neutral-100 text-[#111111]">
                <Code2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-sm font-acid uppercase tracking-wider text-[#111111] font-bold leading-tight">
                  GLSL Shader Studio
                </h2>
                <span className="text-[10px] font-inter text-[#888888]">
                  Custom real-time vertex & fragment engine
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#888888] hover:text-[#111111] hover:bg-neutral-100 transition-colors"
              aria-label="Close Shader Editor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Preset Selector */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-acid uppercase tracking-wider text-[#888888] font-bold">
              <span>Curated Presets</span>
              <span className="text-[9px] font-mono text-[#111111] font-normal">
                {SHADER_PRESETS.length} available
              </span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {SHADER_PRESETS.map((preset) => {
                const isSelected = shaderConfig.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-acid uppercase tracking-wider whitespace-nowrap transition-all border shrink-0 ${
                      isSelected
                        ? 'bg-[#111111] text-white border-[#111111] font-bold shadow-xs'
                        : 'bg-[#F7F7F7] text-[#111111] border-[#E5E5E5] hover:border-[#111111]'
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex rounded-full bg-[#F7F7F7] p-1 border border-[#E5E5E5]">
            <button
              onClick={() => setActiveTab('fragment')}
              className={`flex-1 py-1.5 rounded-full text-xs font-acid uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'fragment'
                  ? 'bg-white text-[#111111] font-bold shadow-xs'
                  : 'text-[#888888] hover:text-[#111111]'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Fragment (.frag)</span>
            </button>
            <button
              onClick={() => setActiveTab('vertex')}
              className={`flex-1 py-1.5 rounded-full text-xs font-acid uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'vertex'
                  ? 'bg-white text-[#111111] font-bold shadow-xs'
                  : 'text-[#888888] hover:text-[#111111]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Vertex (.vert)</span>
            </button>
            <button
              onClick={() => setActiveTab('uniforms')}
              className={`flex-1 py-1.5 rounded-full text-xs font-acid uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'uniforms'
                  ? 'bg-white text-[#111111] font-bold shadow-xs'
                  : 'text-[#888888] hover:text-[#111111]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Uniforms</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-[220px]">
            {activeTab === 'fragment' && (
              <div className="flex flex-col gap-1.5 h-full">
                <div className="flex items-center justify-between text-[10px] font-acid uppercase tracking-wider text-[#888888]">
                  <span>GLSL Fragment Shader Code</span>
                  <span className="font-mono text-[9px] text-[#111111]">gl_FragColor output</span>
                </div>
                <textarea
                  value={localFrag}
                  onChange={(e) => setLocalFrag(e.target.value)}
                  placeholder="// Enter GLSL fragment code..."
                  spellCheck={false}
                  className="w-full h-56 p-3 rounded-2xl bg-[#181818] text-[#38bdf8] font-mono text-xs leading-relaxed resize-none border border-[#27272a] focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] select-text"
                />
              </div>
            )}

            {activeTab === 'vertex' && (
              <div className="flex flex-col gap-1.5 h-full">
                <div className="flex items-center justify-between text-[10px] font-acid uppercase tracking-wider text-[#888888]">
                  <span>GLSL Vertex Shader Code</span>
                  <span className="font-mono text-[9px] text-[#111111]">gl_Position output</span>
                </div>
                <textarea
                  value={localVert}
                  onChange={(e) => setLocalVert(e.target.value)}
                  placeholder="// Enter GLSL vertex code..."
                  spellCheck={false}
                  className="w-full h-56 p-3 rounded-2xl bg-[#181818] text-[#a78bfa] font-mono text-xs leading-relaxed resize-none border border-[#27272a] focus:outline-none focus:border-[#a78bfa] focus:ring-1 focus:ring-[#a78bfa] select-text"
                />
              </div>
            )}

            {activeTab === 'uniforms' && (
              <div className="flex flex-col gap-3 text-xs font-inter">
                {/* Color Uniforms */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] flex flex-col gap-2">
                    <span className="text-[10px] font-acid uppercase tracking-wider text-[#888888] font-bold">
                      Primary Tint (u_color)
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={shaderConfig.uniforms.u_color}
                        onChange={(e) =>
                          onUpdateShader({
                            ...shaderConfig,
                            uniforms: { ...shaderConfig.uniforms, u_color: e.target.value },
                          })
                        }
                        className="w-8 h-8 rounded-lg cursor-pointer border border-[#E5E5E5] p-0.5 bg-white"
                      />
                      <span className="font-mono text-xs text-[#111111] uppercase font-medium">
                        {shaderConfig.uniforms.u_color}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] flex flex-col gap-2">
                    <span className="text-[10px] font-acid uppercase tracking-wider text-[#888888] font-bold">
                      Secondary (u_colorSecondary)
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={shaderConfig.uniforms.u_colorSecondary}
                        onChange={(e) =>
                          onUpdateShader({
                            ...shaderConfig,
                            uniforms: { ...shaderConfig.uniforms, u_colorSecondary: e.target.value },
                          })
                        }
                        className="w-8 h-8 rounded-lg cursor-pointer border border-[#E5E5E5] p-0.5 bg-white"
                      />
                      <span className="font-mono text-xs text-[#111111] uppercase font-medium">
                        {shaderConfig.uniforms.u_colorSecondary}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Intensity Slider */}
                <div className="p-3 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-acid uppercase tracking-wider text-[#888888] font-bold">
                      Emission & Intensity (u_intensity)
                    </span>
                    <span className="font-mono text-xs text-[#111111] font-semibold">
                      {shaderConfig.uniforms.u_intensity.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.05"
                    value={shaderConfig.uniforms.u_intensity}
                    onChange={(e) =>
                      onUpdateShader({
                        ...shaderConfig,
                        uniforms: { ...shaderConfig.uniforms, u_intensity: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full accent-[#111111] cursor-pointer"
                  />
                </div>

                {/* Speed Slider */}
                <div className="p-3 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-acid uppercase tracking-wider text-[#888888] font-bold">
                      Oscillation Speed (u_speed)
                    </span>
                    <span className="font-mono text-xs text-[#111111] font-semibold">
                      {shaderConfig.uniforms.u_speed.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="3.0"
                    step="0.1"
                    value={shaderConfig.uniforms.u_speed}
                    onChange={(e) =>
                      onUpdateShader({
                        ...shaderConfig,
                        uniforms: { ...shaderConfig.uniforms, u_speed: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full accent-[#111111] cursor-pointer"
                  />
                </div>

                {/* Scale Slider */}
                <div className="p-3 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-acid uppercase tracking-wider text-[#888888] font-bold">
                      Pattern Frequency (u_scale)
                    </span>
                    <span className="font-mono text-xs text-[#111111] font-semibold">
                      {shaderConfig.uniforms.u_scale.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="4.0"
                    step="0.1"
                    value={shaderConfig.uniforms.u_scale}
                    onChange={(e) =>
                      onUpdateShader({
                        ...shaderConfig,
                        uniforms: { ...shaderConfig.uniforms, u_scale: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full accent-[#111111] cursor-pointer"
                  />
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      onUpdateShader({
                        ...shaderConfig,
                        transparent: !shaderConfig.transparent,
                      })
                    }
                    className={`p-2.5 rounded-xl border text-xs font-acid uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      shaderConfig.transparent
                        ? 'bg-[#111111] text-white border-[#111111] font-bold'
                        : 'bg-white text-[#888888] border-[#E5E5E5] hover:text-[#111111]'
                    }`}
                  >
                    <span>Alpha Blending</span>
                  </button>

                  <button
                    onClick={() =>
                      onUpdateShader({
                        ...shaderConfig,
                        wireframe: !shaderConfig.wireframe,
                      })
                    }
                    className={`p-2.5 rounded-xl border text-xs font-acid uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      shaderConfig.wireframe
                        ? 'bg-[#111111] text-white border-[#111111] font-bold'
                        : 'bg-white text-[#888888] border-[#E5E5E5] hover:text-[#111111]'
                    }`}
                  >
                    <span>Wireframe Mesh</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Compilation Feedback Message */}
          {compileStatus && (
            <div
              className={`p-2.5 rounded-2xl text-xs flex items-center gap-2 ${
                compileStatus.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {compileStatus.success ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span className="truncate">{compileStatus.msg}</span>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[#E5E5E5]">
            <div className="flex items-center gap-2">
              <button
                onClick={handleApplyCode}
                className="flex-1 py-2.5 px-4 rounded-full bg-[#111111] text-white font-acid text-xs uppercase tracking-wider font-bold hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Apply Live Shader</span>
              </button>

              <button
                onClick={handleResetToDefault}
                className="p-2.5 rounded-full bg-neutral-100 text-[#888888] hover:text-[#111111] hover:bg-neutral-200 transition-colors"
                title="Reset to default shader preset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Load / Export buttons */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".glsl,.frag,.vert,.json,.txt"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-3 rounded-full bg-white border border-[#E5E5E5] text-[#111111] font-acid text-[11px] uppercase tracking-wider hover:border-[#111111] transition-all flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Load Shader File (.glsl/.json)</span>
              </button>

              <button
                onClick={handleExportShader}
                className="py-2 px-3 rounded-full bg-white border border-[#E5E5E5] text-[#111111] font-acid text-[11px] uppercase tracking-wider hover:border-[#111111] transition-all flex items-center justify-center gap-1.5"
                title="Export shader config JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
