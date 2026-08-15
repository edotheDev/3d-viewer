import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sliders, Sun, Eye, Grid as GridIcon, Palette } from 'lucide-react';
import { ViewerSettings, BackgroundTone, EnvironmentPreset } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ViewerSettings;
  onUpdateSettings: (newSettings: Partial<ViewerSettings>) => void;
}

const BG_OPTIONS: { id: BackgroundTone; label: string; color: string }[] = [
  { id: 'light', label: 'Light', color: '#F7F7F7' },
  { id: 'neutral', label: 'Neutral', color: '#EAEAEA' },
  { id: 'studio', label: 'Studio', color: '#E0E0E0' },
  { id: 'dark', label: 'Dark', color: '#1A1A1A' },
  { id: 'pure-black', label: 'Black', color: '#000000' },
];

const ENV_PRESETS: { id: EnvironmentPreset; label: string }[] = [
  { id: 'studio', label: 'Studio' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'warehouse', label: 'Warehouse' },
  { id: 'city', label: 'City' },
  { id: 'dawn', label: 'Dawn' },
  { id: 'night', label: 'Night' },
];

const WIREFRAME_COLORS = [
  { id: '#111111', label: 'Charcoal', bg: '#111111' },
  { id: '#888888', label: 'Slate', bg: '#888888' },
  { id: '#2563eb', label: 'Blue', bg: '#2563eb' },
  { id: '#16a34a', label: 'Green', bg: '#16a34a' },
  { id: '#dc2626', label: 'Red', bg: '#dc2626' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="settings-drawer-panel"
          initial={{ opacity: 0, x: 20, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="fixed top-20 right-6 z-40 w-84 p-5 rounded-3xl bg-white border border-[#E5E5E5] shadow-[0_20px_40px_rgba(0,0,0,0.08)] flex flex-col gap-4 max-h-[calc(100vh-160px)] overflow-y-auto text-[#111111]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#111111]" />
              <h2 className="text-sm font-acid uppercase tracking-wider text-[#111111] font-bold">
                Environment & Lighting
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#888888] hover:text-[#111111] hover:bg-neutral-100 transition-colors"
              aria-label="Close Settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-4 text-xs font-inter">
            {/* Background Tone */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-acid uppercase tracking-wider text-[#888888] font-bold">
                Backdrop Canvas
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {BG_OPTIONS.map((bg) => (
                  <button
                    key={bg.id}
                    id={`bg-option-btn-${bg.id}`}
                    onClick={() => onUpdateSettings({ backgroundTone: bg.id })}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                      settings.backgroundTone === bg.id
                        ? 'border-[#111111] bg-neutral-100 font-bold'
                        : 'border-[#E5E5E5] hover:border-[#111111] bg-white'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-[#E5E5E5] shadow-xs"
                      style={{ backgroundColor: bg.color }}
                    />
                    <span className="text-[9px] font-acid uppercase tracking-tight text-[#111111]">
                      {bg.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* HDRI Preset */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-acid uppercase tracking-wider text-[#888888] font-bold">
                HDRI Reflection Map
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {ENV_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    id={`env-preset-btn-${preset.id}`}
                    onClick={() => onUpdateSettings({ environmentPreset: preset.id })}
                    className={`py-2 px-1 rounded-xl text-center font-acid text-[10px] uppercase tracking-wider border transition-all ${
                      settings.environmentPreset === preset.id
                        ? 'bg-[#111111] text-white border-[#111111] font-bold'
                        : 'bg-white text-[#111111] border-[#E5E5E5] hover:border-[#111111]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Light Intensity Slider */}
            <div className="p-3 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] flex flex-col gap-2">
              <div className="flex justify-between items-center text-[#111111]">
                <span className="text-[10px] font-acid uppercase tracking-wider text-[#888888] font-bold">
                  Studio Lighting
                </span>
                <span className="font-mono text-[11px] text-[#111111] font-semibold">{settings.lightIntensity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={settings.lightIntensity}
                onChange={(e) => onUpdateSettings({ lightIntensity: parseFloat(e.target.value) })}
                className="w-full accent-[#111111] cursor-pointer"
              />
            </div>

            {/* Exposure Slider */}
            <div className="p-3 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] flex flex-col gap-2">
              <div className="flex justify-between items-center text-[#111111]">
                <span className="text-[10px] font-acid uppercase tracking-wider text-[#888888] font-bold">
                  Camera Exposure
                </span>
                <span className="font-mono text-[11px] text-[#111111] font-semibold">{settings.exposure.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={settings.exposure}
                onChange={(e) => onUpdateSettings({ exposure: parseFloat(e.target.value) })}
                className="w-full accent-[#111111] cursor-pointer"
              />
            </div>

            {/* Wireframe Color */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-acid uppercase tracking-wider text-[#888888] font-bold">
                Wireframe Tone
              </span>
              <div className="flex items-center gap-2">
                {WIREFRAME_COLORS.map((c) => (
                  <button
                    key={c.id}
                    id={`wireframe-color-${c.label.toLowerCase()}`}
                    onClick={() => onUpdateSettings({ wireframeColor: c.id })}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      settings.wireframeColor === c.id
                        ? 'border-[#111111] scale-110 shadow-sm'
                        : 'border-transparent hover:scale-105 opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.bg }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                id="toggle-grid-btn"
                onClick={() => onUpdateSettings({ showGrid: !settings.showGrid })}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  settings.showGrid
                    ? 'border-[#111111] bg-[#111111] text-white font-bold'
                    : 'border-[#E5E5E5] bg-white text-[#888888] hover:text-[#111111] hover:border-[#111111]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <GridIcon className="w-3.5 h-3.5" />
                  <span className="font-acid uppercase text-[10px] tracking-wider">Ground Grid</span>
                </div>
                <span className="font-mono text-[9px] uppercase">{settings.showGrid ? 'On' : 'Off'}</span>
              </button>

              <button
                id="toggle-shadows-btn"
                onClick={() => onUpdateSettings({ showShadows: !settings.showShadows })}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  settings.showShadows
                    ? 'border-[#111111] bg-[#111111] text-white font-bold'
                    : 'border-[#E5E5E5] bg-white text-[#888888] hover:text-[#111111] hover:border-[#111111]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span className="font-acid uppercase text-[10px] tracking-wider">Shadows</span>
                </div>
                <span className="font-mono text-[9px] uppercase">{settings.showShadows ? 'On' : 'Off'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
