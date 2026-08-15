import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RenderMode } from '../types';
import { applyRenderMode } from '../utils/materialModes';

interface ModelViewerSceneProps {
  model: THREE.Object3D | null;
  renderMode: RenderMode;
  wireframeColor: string;
  animations: THREE.AnimationClip[];
  isPlayingAnimation?: boolean;
}

export const ModelViewerScene: React.FC<ModelViewerSceneProps> = ({
  model,
  renderMode,
  wireframeColor,
  animations,
  isPlayingAnimation = true,
}) => {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  // Set up animations if available
  useEffect(() => {
    if (!model || animations.length === 0) {
      mixerRef.current = null;
      return;
    }

    const mixer = new THREE.AnimationMixer(model);
    animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.play();
    });
    mixerRef.current = mixer;

    return () => {
      mixer.stopAllAction();
    };
  }, [model, animations]);

  // Handle animation frames
  useFrame((_, delta) => {
    if (mixerRef.current && isPlayingAnimation) {
      mixerRef.current.update(delta);
    }
  });

  // Apply material render mode whenever mode or wireframeColor changes
  useEffect(() => {
    if (model) {
      applyRenderMode(model, renderMode, { wireframeColor });
    }
  }, [model, renderMode, wireframeColor]);

  if (!model) return null;

  return <primitive object={model} />;
};
