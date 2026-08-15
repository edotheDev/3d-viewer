import React from 'react';
import { Play, Pause, Compass } from 'lucide-react';
import { CameraViewPreset } from '../types';

interface CameraControlsOverlayProps {
  onSelectView: (view: CameraViewPreset) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
}

const VIEW_PRESETS: { id: CameraViewPreset; label: string; short: string }[] = [
  { id: 'front', label: 'Front View', short: 'F' },
  { id: 'back', label: 'Back View', short: 'B' },
  { id: 'top', label: 'Top View', short: 'T' },
  { id: 'left', label: 'Left View', short: 'L' },
  { id: 'right', label: 'Right View', short: 'R' },
  { id: 'isometric', label: 'Isometric', short: 'ISO' },
];

export const CameraControlsOverlay: React.FC<CameraControlsOverlayProps> = ({
  onSelectView,
  autoRotate,
  onToggleAutoRotate,
}) => {
  return (
    <div
      id="camera-preset-controls"
      className="fixed left-6 bottom-6 z-20 hidden md:flex items-center gap-1.5 p-1.5 rounded-full bg-white border border-[#E5E5E5] shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
      role="group"
      aria-label="Camera orientation presets"
    >
      <div className="flex items-center gap-1 pl-2.5 pr-2 border-r border-[#E5E5E5] text-[#888888]">
        <Compass className="w-3.5 h-3.5" />
        <span className="text-[10px] font-acid uppercase tracking-wider font-semibold">View</span>
      </div>

      {VIEW_PRESETS.map((preset) => (
        <button
          key={preset.id}
          id={`cam-preset-btn-${preset.id}`}
          onClick={() => onSelectView(preset.id)}
          className="px-2.5 py-1.5 rounded-full text-[11px] font-acid uppercase tracking-wider font-bold text-[#888888] hover:text-[#111111] hover:bg-neutral-100 transition-colors"
          title={preset.label}
        >
          {preset.short}
        </button>
      ))}

      {/* Auto Rotate Toggle */}
      <button
        id="btn-toggle-auto-rotate"
        onClick={onToggleAutoRotate}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-acid uppercase tracking-wider font-bold transition-all ml-0.5 ${
          autoRotate
            ? 'bg-[#111111] text-white shadow-sm'
            : 'text-[#888888] hover:text-[#111111] hover:bg-neutral-100'
        }`}
        title="Toggle Turntable Auto-Rotation"
      >
        {autoRotate ? <Pause className="w-3 h-3 text-white" /> : <Play className="w-3 h-3 text-[#888888]" />}
        <span>Turntable</span>
      </button>
    </div>
  );
};
