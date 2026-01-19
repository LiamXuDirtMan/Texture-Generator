
import React, { useRef, useEffect, useState } from 'react';
import { Pixel, Resolution } from '../types';

interface CanvasProps {
  pixels: Pixel[][];
  resolution: Resolution;
  onPixelClick: (x: number, y: number) => void;
}

const Canvas: React.FC<CanvasProps> = ({ pixels, resolution, onPixelClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan
    ctx.translate(canvas.width / 2 + pos.x, canvas.height / 2 + pos.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-resolution / 2, -resolution / 2);

    // Disable smoothing for pixel art
    ctx.imageSmoothingEnabled = false;

    // Draw pixels - with safety checks for array dimensions
    const currentH = pixels.length;
    for (let y = 0; y < Math.min(currentH, resolution); y++) {
      const row = pixels[y];
      if (!row) continue;
      const currentW = row.length;
      for (let x = 0; x < Math.min(currentW, resolution); x++) {
        const p = row[x];
        if (!p) continue;
        ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.a / 255})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [pixels, resolution, zoom, pos]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else if (e.button === 0) {
      // Future: interactive painting
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setPos(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(Math.max(prev * delta, 0.5), 50));
  };

  return (
    <div className="flex-1 h-full flex items-center justify-center overflow-hidden bg-slate-950 relative pixel-grid">
      <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur rounded px-3 py-1 text-xs font-mono text-slate-400 border border-slate-800">
        Middle Click to Pan • Scroll to Zoom • {resolution}x{resolution}
      </div>
      
      <canvas
        ref={canvasRef}
        width={800}
        height={800}
        className="cursor-crosshair w-full h-full object-contain"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
         <button 
           onClick={() => setZoom(prev => prev * 1.2)} 
           className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white border border-slate-700 shadow-xl"
         >
           +
         </button>
         <button 
           onClick={() => setZoom(prev => prev * 0.8)} 
           className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white border border-slate-700 shadow-xl"
         >
           -
         </button>
         <button 
           onClick={() => { setZoom(1); setPos({ x: 0, y: 0 }); }} 
           className="px-4 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xs font-bold text-white border border-slate-700 shadow-xl"
         >
           RESET VIEW
         </button>
      </div>
    </div>
  );
};

export default Canvas;
