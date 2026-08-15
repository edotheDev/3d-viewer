/**
 * Triggers a high-resolution screenshot of the WebGL canvas state and initiates download.
 * Supports both transparent background PNGs and solid backdrop composited PNGs.
 */
export async function captureCanvasScreenshot(
  canvas: HTMLCanvasElement,
  modelName: string = 'model',
  renderMode: string = 'normal',
  transparent: boolean = true,
  backgroundColor: string = '#F7F7F7'
): Promise<{ dataUrl: string; filename: string }> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const cleanName = modelName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const suffix = transparent ? 'transparent' : 'solid';
  const filename = `${cleanName}_${renderMode}_${suffix}_${timestamp}.png`;

  return new Promise((resolve, reject) => {
    try {
      if (transparent) {
        // Direct transparent WebGL canvas export with alpha channel
        const dataUrl = canvas.toDataURL('image/png', 1.0);

        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        resolve({ dataUrl, filename });
      } else {
        // Composite onto solid background canvas
        const offscreen = document.createElement('canvas');
        offscreen.width = canvas.width;
        offscreen.height = canvas.height;
        const ctx = offscreen.getContext('2d');

        if (ctx) {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, offscreen.width, offscreen.height);
          ctx.drawImage(canvas, 0, 0);

          const dataUrl = offscreen.toDataURL('image/png', 1.0);

          const link = document.createElement('a');
          link.download = filename;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          resolve({ dataUrl, filename });
        } else {
          // Fallback to raw canvas data
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          const link = document.createElement('a');
          link.download = filename;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          resolve({ dataUrl, filename });
        }
      }
    } catch (err) {
      reject(err);
    }
  });
}

