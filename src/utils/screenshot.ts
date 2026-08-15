/**
 * Triggers a clean screenshot of the WebGL canvas state and initiates download.
 */
export async function captureCanvasScreenshot(
  canvas: HTMLCanvasElement,
  modelName: string = 'model',
  renderMode: string = 'normal',
  transparent: boolean = false
): Promise<{ dataUrl: string; filename: string }> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const cleanName = modelName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const filename = `${cleanName}_${renderMode}_${timestamp}.png`;

  return new Promise((resolve, reject) => {
    try {
      // Ensure canvas has rendered
      const dataUrl = canvas.toDataURL('image/png', 1.0);

      // Create download link
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      resolve({ dataUrl, filename });
    } catch (err) {
      reject(err);
    }
  });
}
