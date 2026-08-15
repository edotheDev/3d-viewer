import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Box } from 'lucide-react';

interface DropZoneOverlayProps {
  isDragging: boolean;
}

export const DropZoneOverlay: React.FC<DropZoneOverlayProps> = ({ isDragging }) => {
  return (
    <AnimatePresence>
      {isDragging && (
        <motion.div
          id="drag-drop-full-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none bg-black/40 backdrop-blur-md flex items-center justify-center p-8"
        >
          <div className="flex flex-col items-center gap-4 p-8 rounded-3xl border-2 border-dashed border-[#111111] bg-white shadow-[0_25px_50px_rgba(0,0,0,0.15)] max-w-md text-center text-[#111111]">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center text-[#111111] animate-bounce">
              <Upload className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-acid uppercase tracking-wider text-[#111111] font-bold">
                Drop 3D Asset
              </h3>
              <p className="text-xs font-inter text-[#888888]">
                Supports <span className="text-[#111111] font-mono font-bold">.GLB</span>,{' '}
                <span className="text-[#111111] font-mono font-bold">.GLTF</span>, and{' '}
                <span className="text-[#111111] font-mono font-bold">.FBX</span> models
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-[11px] font-inter text-[#111111] border border-[#E5E5E5]">
              <Box className="w-3.5 h-3.5 text-[#111111]" />
              <span>Automatic centering, bounding normalization, and PBR extraction</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
