import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Layers, Box, Maximize2, FileCode, Cpu, Sparkles } from 'lucide-react';
import { ModelStats } from '../types';
import { formatNumber } from '../utils/modelAnalyzer';

interface InspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: ModelStats | null;
  modelName: string;
}

export const InspectorModal: React.FC<InspectorModalProps> = ({
  isOpen,
  onClose,
  stats,
  modelName,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="inspector-drawer-panel"
          initial={{ opacity: 0, x: 20, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="fixed top-20 right-6 z-40 w-84 p-5 rounded-3xl bg-white border border-[#E5E5E5] shadow-[0_20px_40px_rgba(0,0,0,0.08)] flex flex-col gap-4 max-h-[calc(100vh-160px)] overflow-y-auto text-[#111111]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#111111]" />
              <h2 className="text-sm font-acid uppercase tracking-wider text-[#111111] font-bold">
                Asset Inspector
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#888888] hover:text-[#111111] hover:bg-neutral-100 transition-colors"
              aria-label="Close Inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Asset Title */}
          <div className="p-3 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5]">
            <div className="text-[10px] font-acid uppercase tracking-widest text-[#888888] font-bold">
              Active Object
            </div>
            <div className="text-xs font-acid text-[#111111] font-bold truncate mt-0.5">
              {modelName}
            </div>
          </div>

          {stats ? (
            <div className="flex flex-col gap-3 font-inter text-xs">
              {/* Geometry Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] flex flex-col gap-1">
                  <span className="text-[10px] font-acid uppercase tracking-wider text-[#888888] font-bold">
                    Triangles
                  </span>
                  <span className="font-mono text-sm text-[#111111] font-semibold">
                    {formatNumber(stats.triangles)}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] flex flex-col gap-1">
                  <span className="text-[10px] font-acid uppercase tracking-wider text-[#888888] font-bold">
                    Vertices
                  </span>
                  <span className="font-mono text-sm text-[#111111] font-semibold">
                    {formatNumber(stats.vertices)}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] flex flex-col gap-1">
                  <span className="text-[10px] font-acid uppercase tracking-wider text-[#888888] font-bold">
                    Mesh Nodes
                  </span>
                  <span className="font-mono text-sm text-[#111111] font-semibold">
                    {stats.meshes}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] flex flex-col gap-1">
                  <span className="text-[10px] font-acid uppercase tracking-wider text-[#888888] font-bold">
                    Material Slots
                  </span>
                  <span className="font-mono text-sm text-[#111111] font-semibold">
                    {stats.materials}
                  </span>
                </div>
              </div>

              {/* Bounding Box Dimensions */}
              <div className="p-3 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-[10px] font-acid uppercase tracking-wider text-[#888888] font-bold">
                  <Maximize2 className="w-3 h-3 text-[#111111]" />
                  <span>Bounding Box (Meters)</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center font-mono text-[11px]">
                  <div className="p-1.5 rounded-lg bg-white border border-[#E5E5E5] text-[#111111]">
                    <span className="text-[#888888] mr-1 text-[9px]">X</span>
                    {stats.dimensions.x}m
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-[#E5E5E5] text-[#111111]">
                    <span className="text-[#888888] mr-1 text-[9px]">Y</span>
                    {stats.dimensions.y}m
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-[#E5E5E5] text-[#111111]">
                    <span className="text-[#888888] mr-1 text-[9px]">Z</span>
                    {stats.dimensions.z}m
                  </div>
                </div>
              </div>

              {/* Features info */}
              <div className="p-3 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] flex flex-col gap-2">
                <div className="flex items-center justify-between text-[#111111]">
                  <span className="text-[10px] font-acid uppercase tracking-wider text-[#888888] font-bold">
                    File Format
                  </span>
                  <span className="font-mono uppercase text-[#111111] font-bold">
                    .{stats.format}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#111111]">
                  <span className="text-[10px] font-acid uppercase tracking-wider text-[#888888] font-bold">
                    Rigged Animations
                  </span>
                  <span className="font-mono text-[#111111]">
                    {stats.hasAnimations ? `${stats.animationCount} Clip(s)` : 'None'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-[#888888] text-xs">Analyzing asset topology...</div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
