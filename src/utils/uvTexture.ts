import * as THREE from 'three';

let cachedUVTexture: THREE.CanvasTexture | null = null;

/**
 * Creates a high-fidelity UV checkerboard texture with numbered grid tiles
 * and crosshairs for inspecting UV unwrapping, distortion, and texel density.
 */
export function getUVCheckerTexture(): THREE.CanvasTexture {
  if (cachedUVTexture) {
    return cachedUVTexture;
  }

  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    // Fallback simple texture
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 64;
    fallbackCanvas.height = 64;
    return new THREE.CanvasTexture(fallbackCanvas);
  }

  const gridSize = 8; // 8x8 main tiles
  const tileSize = size / gridSize;

  // Background base
  ctx.fillStyle = '#111318';
  ctx.fillRect(0, 0, size, size);

  // Colors for quadrants
  const colors = [
    { primary: '#ff3366', secondary: '#1e2029', text: '#ffffff' }, // Magenta / Dark
    { primary: '#00e5ff', secondary: '#1e2029', text: '#ffffff' }, // Cyan / Dark
    { primary: '#ffea00', secondary: '#1e2029', text: '#000000' }, // Yellow / Dark
    { primary: '#76ff03', secondary: '#1e2029', text: '#000000' }, // Lime / Dark
  ];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = col * tileSize;
      const y = row * tileSize;
      const isEven = (row + col) % 2 === 0;

      const quadrantIndex = (row < gridSize / 2 ? 0 : 2) + (col < gridSize / 2 ? 0 : 1);
      const palette = colors[quadrantIndex];

      // Base tile color
      ctx.fillStyle = isEven ? palette.primary : palette.secondary;
      ctx.fillRect(x, y, tileSize, tileSize);

      // Sub-grid (4x4 micro cells per tile)
      const subGrid = 4;
      const subTileSize = tileSize / subGrid;
      for (let sr = 0; sr < subGrid; sr++) {
        for (let sc = 0; sc < subGrid; sc++) {
          const sx = x + sc * subTileSize;
          const sy = y + sr * subTileSize;
          const subEven = (sr + sc) % 2 === 0;

          if (isEven && !subEven) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fillRect(sx, sy, subTileSize, subTileSize);
          } else if (!isEven && subEven) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fillRect(sx, sy, subTileSize, subTileSize);
          }
        }
      }

      // Border outline for each main tile
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, tileSize, tileSize);

      // Center crosshair
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + tileSize / 2 - 8, y + tileSize / 2);
      ctx.lineTo(x + tileSize / 2 + 8, y + tileSize / 2);
      ctx.moveTo(x + tileSize / 2, y + tileSize / 2 - 8);
      ctx.lineTo(x + tileSize / 2, y + tileSize / 2 + 8);
      ctx.stroke();

      // Coordinates text (e.g., U1:V1, U8:V8)
      const uLabel = String.fromCharCode(65 + col); // A..H
      const vLabel = (gridSize - row).toString(); // 8..1
      const label = `${uLabel}${vLabel}`;

      ctx.fillStyle = isEven ? (quadrantIndex >= 2 ? '#000000' : '#ffffff') : '#ffffff';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + tileSize / 2, y + tileSize / 2 - 18);

      // UV numerical coordinate
      const uNorm = (col / gridSize).toFixed(2);
      const vNorm = ((gridSize - 1 - row) / gridSize).toFixed(2);
      ctx.font = '11px monospace';
      ctx.fillStyle = isEven ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';
      ctx.fillText(`${uNorm}, ${vNorm}`, x + tileSize / 2, y + tileSize / 2 + 18);
    }
  }

  // Outer border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  cachedUVTexture = texture;
  return cachedUVTexture;
}
