import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, CircleDot, Grid3X3, Image as ImageIcon, Box } from 'lucide-react';
import { RenderMode } from '../types';

interface FloatingNavBarProps {
  currentMode: RenderMode;
  onModeChange: (mode: RenderMode) => void;
}

interface ModeItem {
  id: RenderMode;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
}

const MODES: ModeItem[] = [
  {
    id: 'normal',
    label: 'NORMAL',
    sublabel: 'PBR Shading & Textures',
    icon: Sparkles,
    shortcut: '1',
  },
  {
    id: 'clay',
    label: 'CLAY',
    sublabel: 'Uniform Studio Matte',
    icon: CircleDot,
    shortcut: '2',
  },
  {
    id: 'wireframe',
    label: 'WIREFRAME',
    sublabel: 'Mesh Topology',
    icon: Grid3X3,
    shortcut: '3',
  },
  {
    id: 'albedo',
    label: 'ALBEDO',
    sublabel: 'Base Color Unlit',
    icon: ImageIcon,
    shortcut: '4',
  },
  {
    id: 'uv',
    label: 'UV',
    sublabel: 'Checkerboard Coordinates',
    icon: Box,
    shortcut: '5',
  },
];

export const FloatingNavBar: React.FC<FloatingNavBarProps> = ({ currentMode, onModeChange }) => {
  return (
    <nav
      id="floating-render-navbar"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1.5 rounded-full bg-white border border-[#E5E5E5] shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
      role="toolbar"
      aria-label="Material render modes"
    >
      {MODES.map((mode) => {
        const isActive = currentMode === mode.id;
        const Icon = mode.icon;

        return (
          <button
            key={mode.id}
            id={`render-mode-btn-${mode.id}`}
            onClick={() => onModeChange(mode.id)}
            className={`relative group px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-2 font-acid text-xs tracking-wider uppercase focus:outline-none ${
              isActive
                ? 'text-white font-bold'
                : 'text-[#888888] hover:text-[#111111] hover:bg-neutral-100/80'
            }`}
            title={`${mode.label}: ${mode.sublabel} (Press ${mode.shortcut})`}
          >
            {isActive && (
              <motion.div
                layoutId="activeModeIndicator"
                className="absolute inset-0 rounded-full bg-[#111111] shadow-sm"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
              />
            )}

            <Icon className={`w-3.5 h-3.5 relative z-10 transition-colors ${isActive ? 'text-white' : 'text-[#888888] group-hover:text-[#111111]'}`} />
            <span className="relative z-10">{mode.label}</span>

            {/* Shortcut badge */}
            <span
              className={`relative z-10 ml-0.5 px-1.5 py-0.5 text-[9px] font-mono rounded ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-neutral-100 text-[#888888] group-hover:text-[#111111]'
              }`}
            >
              {mode.shortcut}
            </span>

            {/* Hover Tooltip (in Inter Regular) */}
            <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#111111] text-white border border-neutral-700 px-2.5 py-1 rounded-md text-[11px] font-inter normal-case tracking-normal whitespace-nowrap shadow-xl">
              {mode.sublabel}
            </div>
          </button>
        );
      })}
    </nav>
  );
};
