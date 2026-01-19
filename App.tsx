
import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import RightPanel from './components/RightPanel';
import { Pixel, Resolution, ProceduralParams, PatternType, Layer, ShapeType, GradientType } from './types';

const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
};

const lerp = (v0: number, v1: number, t: number) => v0 * (1 - t) + v1 * t;

const createEmptyPixels = (res: number): Pixel[][] => {
  return Array.from({ length: res }, () => 
    Array.from({ length: res }, () => ({ r: 0, g: 0, b: 0, a: 0 }))
  );
};

const seededRandom = (s: number) => {
  const x = Math.sin(s) * 10000;
  return x - Math.floor(x);
};

const App: React.FC = () => {
  const [resolution, setResolution] = useState<Resolution>(16);
  const [pixels, setPixels] = useState<Pixel[][]>(() => createEmptyPixels(16));
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: 'base-procedural',
      name: 'Base Material',
      layerType: 'procedural',
      width: 16,
      height: 16,
      x: 0,
      y: 0,
      opacity: 1,
      visible: true,
      tiling: false
    }
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>('base-procedural');
  const [params, setParams] = useState<ProceduralParams>({
    baseColor: '#ffa500',
    baseColorEnd: '#ff4500',
    gradientType: 'none',
    noiseAmount: 15,
    shadingIntensity: 20,
    contrast: 0,
    borderType: 'darken',
    useCustomBorderColor: false,
    borderColor: '#000000',
    borderSize: 2,
    borderIntensity: 30,
    borderSides: { top: true, bottom: true, left: true, right: true }
  });

  const renderTexture = useCallback(() => {
    const newPixels: Pixel[][] = Array.from({ length: resolution }, () => 
      Array.from({ length: resolution }, () => ({ r: 15, g: 15, b: 20, a: 255 }))
    );

    layers.forEach(layer => {
      if (!layer.visible) return;

      for (let y = 0; y < resolution; y++) {
        for (let x = 0; x < resolution; x++) {
          let layerR = 0, layerG = 0, layerB = 0, layerA = 0;

          if (layer.layerType === 'procedural') {
            const baseStart = hexToRgb(params.baseColor);
            const baseEnd = hexToRgb(params.baseColorEnd);
            let r = baseStart.r, g = baseStart.g, b = baseStart.b;

            // Gradient Calculation
            if (params.gradientType !== 'none') {
              let t = 0;
              if (params.gradientType === 'linear-v') t = y / (resolution - 1);
              else if (params.gradientType === 'linear-h') t = x / (resolution - 1);
              else if (params.gradientType === 'radial') {
                const dx = x - resolution / 2;
                const dy = y - resolution / 2;
                t = Math.min(1, Math.sqrt(dx * dx + dy * dy) / (resolution / 1.5));
              }
              r = lerp(baseStart.r, baseEnd.r, t);
              g = lerp(baseStart.g, baseEnd.g, t);
              b = lerp(baseStart.b, baseEnd.b, t);
            }

            const noise = (Math.random() - 0.5) * params.noiseAmount * 2;
            r += noise; g += noise; b += noise;

            // Edge Occlusion Logic
            const dists = [];
            if (params.borderSides.top) dists.push(y);
            if (params.borderSides.bottom) dists.push(resolution - 1 - y);
            if (params.borderSides.left) dists.push(x);
            if (params.borderSides.right) dists.push(resolution - 1 - x);
            
            if (dists.length > 0) {
              const minDist = Math.min(...dists);
              if (minDist < params.borderSize) {
                const f = 1 - (minDist / params.borderSize);
                const intensity = (params.borderIntensity / 100);
                
                if (params.useCustomBorderColor) {
                  const bCol = hexToRgb(params.borderColor);
                  r = lerp(r, bCol.r, f * intensity);
                  g = lerp(g, bCol.g, f * intensity);
                  b = lerp(b, bCol.b, f * intensity);
                } else {
                  const mod = f * params.borderIntensity;
                  if (params.borderType === 'darken') { r -= mod; g -= mod; b -= mod; }
                  else { r += mod; g += mod; b += mod; }
                }
              }
            }

            const edgeDist = Math.min(x, y, resolution - 1 - x, resolution - 1 - y);
            if (edgeDist < 2) { r -= (2 - edgeDist) * 10; g -= (2 - edgeDist) * 10; b -= (2 - edgeDist) * 10; }

            layerR = Math.min(255, Math.max(0, r));
            layerG = Math.min(255, Math.max(0, g));
            layerB = Math.min(255, Math.max(0, b));
            layerA = 255;
          } else if (layer.layerType === 'pattern') {
            let lx = x - layer.x, ly = y - layer.y;
            if (layer.tiling) {
              lx = ((lx % layer.width) + layer.width) % layer.width;
              ly = ((ly % layer.height) + layer.height) % layer.height;
            }

            if (lx >= 0 && lx < layer.width && ly >= 0 && ly < layer.height) {
              const pRgb = hexToRgb(layer.patternColor || '#000000');
              const scale = layer.patternScale || 3;
              let inPattern = false, patternLocalShade = 0, patternBorderFactor = 0;

              if (layer.patternType === PatternType.STRIPES) {
                const jitter = (layer.patternJitter || 0) > 0 ? seededRandom(ly) * layer.patternJitter! * 5 : 0;
                const val = Math.sin((lx + jitter) / scale);
                if (val > 0) {
                  inPattern = true;
                  patternLocalShade = (val - 0.5) * (layer.patternShading || 0);
                  if (val < (layer.patternBorderWidth || 0.5)) patternBorderFactor = 1;
                }
              } else if (layer.patternType === PatternType.SPOTS) {
                const gridX = Math.floor(lx / 5), gridY = Math.floor(ly / 5);
                const jitterX = (layer.patternJitter || 0) > 0 ? (seededRandom(gridY * 13 + gridX) - 0.5) * layer.patternJitter! * 4 : 0;
                const jitterY = (layer.patternJitter || 0) > 0 ? (seededRandom(gridX * 7 + gridY) - 0.5) * layer.patternJitter! * 4 : 0;
                const dx = (lx % 5) - 2.5 + jitterX, dy = (ly % 5) - 2.5 + jitterY;
                const dist = Math.sqrt(dx * dx + dy * dy), radius = scale / 2;
                if (dist < radius) {
                  inPattern = true;
                  patternLocalShade = (1 - dist / radius - 0.5) * (layer.patternShading || 0) * 2;
                  if (dist > radius - (layer.patternBorderWidth || 0.5)) patternBorderFactor = 1;
                }
              } else if (layer.patternType === PatternType.BRICK) {
                const jitter = (layer.patternJitter || 0) > 0 ? seededRandom(Math.floor(ly / scale)) * layer.patternJitter! * 10 : 0;
                const shift = ((Math.floor(ly / scale) % 2) * (scale / 2)) + jitter;
                const plx = (lx + shift) % scale, ply = ly % scale;
                if (plx < 1 || ply < 1) inPattern = true;
                else {
                  const distToEdge = Math.min(plx - 1, ply - 1, scale - plx, scale - ply);
                  patternLocalShade = (distToEdge / (scale / 2) - 0.5) * (layer.patternShading || 0);
                }
              }

              if (inPattern) {
                layerR = Math.min(255, Math.max(0, pRgb.r + patternLocalShade - patternBorderFactor * (layer.patternBorderIntensity || 0)));
                layerG = Math.min(255, Math.max(0, pRgb.g + patternLocalShade - patternBorderFactor * (layer.patternBorderIntensity || 0)));
                layerB = Math.min(255, Math.max(0, pRgb.b + patternLocalShade - patternBorderFactor * (layer.patternBorderIntensity || 0)));
                layerA = 255;
              }
            }
          } else {
            let lx = x - layer.x, ly = y - layer.y;
            if (layer.tiling) {
              lx = ((lx % layer.width) + layer.width) % layer.width;
              ly = ((ly % layer.height) + layer.height) % layer.height;
            }

            if (layer.layerType === 'image' && layer.pixels) {
              if (lx >= 0 && lx < layer.width && ly >= 0 && ly < layer.height) {
                const lp = layer.pixels[Math.floor(ly)][Math.floor(lx)];
                if (lp) { layerR = lp.r; layerG = lp.g; layerB = lp.b; layerA = lp.a; }
              }
            } else if (layer.layerType === 'shape' && layer.shapeType && layer.color) {
              if (lx >= 0 && lx < layer.width && ly >= 0 && ly < layer.height) {
                const sRgb = hexToRgb(layer.color);
                const halfSize = (layer.size || 8) / 2;
                let inside = false, localShade = 0;
                if (layer.shapeType === ShapeType.RECTANGLE) {
                   inside = true; localShade = (1 - (Math.min(lx, ly, layer.width - 1 - lx, layer.height - 1 - ly) / halfSize)) * (layer.shading || 0) * -1;
                } else if (layer.shapeType === ShapeType.CIRCLE) {
                   const d = Math.sqrt(Math.pow(lx - layer.width/2, 2) + Math.pow(ly - layer.height/2, 2));
                   if (d < halfSize) { inside = true; localShade = (d / halfSize) * (layer.shading || 0) * -1; }
                } else if (layer.shapeType === ShapeType.DIAMOND) {
                   const d = Math.abs(lx - layer.width/2) + Math.abs(ly - layer.height/2);
                   if (d < halfSize) { inside = true; localShade = (d / halfSize) * (layer.shading || 0) * -1; }
                }
                if (inside) {
                  layerR = Math.min(255, Math.max(0, sRgb.r + localShade));
                  layerG = Math.min(255, Math.max(0, sRgb.g + localShade));
                  layerB = Math.min(255, Math.max(0, sRgb.b + localShade));
                  layerA = 255;
                }
              }
            }
          }

          if (layerA > 0) {
            const alpha = (layerA / 255) * layer.opacity;
            newPixels[y][x].r = layerR * alpha + newPixels[y][x].r * (1 - alpha);
            newPixels[y][x].g = layerG * alpha + newPixels[y][x].g * (1 - alpha);
            newPixels[y][x].b = layerB * alpha + newPixels[y][x].b * (1 - alpha);
          }
        }
      }
    });
    setPixels(newPixels);
  }, [resolution, params, layers]);

  useEffect(() => {
    renderTexture();
  }, [resolution, renderTexture]);

  const moveLayer = (id: string, direction: 'up' | 'down') => {
    setLayers(prev => {
      const idx = prev.findIndex(l => l.id === id);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx + 1 : idx - 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  };

  const addLayerFromImage = (dataUrl: string, name: string = 'Imported Layer') => {
    const img = new Image();
    img.onload = () => {
      const w = img.width || 16, h = img.height || 16;
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, w, h).data;
      const pix: Pixel[][] = Array.from({ length: h }, (_, y) => 
        Array.from({ length: w }, (_, x) => ({
          r: data[(y * w + x) * 4], g: data[(y * w + x) * 4 + 1], b: data[(y * w + x) * 4 + 2], a: data[(y * w + x) * 4 + 3]
        }))
      );
      const newId = Math.random().toString(36).substr(2, 9);
      setLayers(prev => [...prev, { id: newId, name, layerType: 'image', pixels: pix, width: w, height: h, x: 0, y: 0, opacity: 1, visible: true, tiling: false }]);
      setActiveLayerId(newId);
    };
    img.src = dataUrl;
  };

  const addShapeLayer = (type: ShapeType) => {
    const newId = Math.random().toString(36).substr(2, 9);
    setLayers(prev => [...prev, { id: newId, name: `Shape: ${type}`, layerType: 'shape', shapeType: type, color: '#ffffff', size: 8, shading: 40, width: resolution, height: resolution, x: 0, y: 0, opacity: 1, visible: true, tiling: false }]);
    setActiveLayerId(newId);
  };

  const addPatternLayer = (type: PatternType) => {
    const newId = Math.random().toString(36).substr(2, 9);
    setLayers(prev => [...prev, { 
      id: newId, 
      name: `Pattern: ${type}`, 
      layerType: 'pattern', 
      patternType: type, 
      patternColor: '#000000', 
      patternScale: 3, 
      patternJitter: 0.1,
      patternShading: 30,
      patternBorderWidth: 0.5,
      patternBorderIntensity: 40,
      width: resolution, 
      height: resolution, 
      x: 0, 
      y: 0, 
      opacity: 0.8, 
      visible: true, 
      tiling: true 
    }]);
    setActiveLayerId(newId);
  };

  const currentCanvasBase64 = () => {
    const canvas = document.createElement('canvas');
    canvas.width = resolution; canvas.height = resolution;
    const ctx = canvas.getContext('2d')!;
    pixels.forEach((row, y) => row.forEach((p, x) => {
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.a / 255})`;
      ctx.fillRect(x, y, 1, 1);
    }));
    return canvas.toDataURL('image/png');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-20 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <div><h1 className="text-lg font-bold tracking-tight">BLOCKSMITH</h1><p className="text-[10px] text-blue-400 font-mono tracking-widest uppercase">Forge v5.0 - Dynamic Shaders</p></div>
        </div>
        <button onClick={() => { const l = document.createElement('a'); l.download = `blocksmith_${resolution}.png`; l.href = currentCanvasBase64(); l.click(); }} className="px-6 py-2 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-full transition-all shadow-lg flex items-center gap-2 text-sm">EXPORT</button>
      </header>
      <main className="flex flex-1 overflow-hidden">
        <Sidebar 
          params={params} 
          setParams={setParams} 
          resolution={resolution} 
          setResolution={(res) => { setPixels(createEmptyPixels(res)); setResolution(res); }} 
          onGenerate={renderTexture} 
          onAddLayer={addLayerFromImage} 
          onAddShape={addShapeLayer}
          onAddPattern={addPatternLayer}
        />
        <Canvas pixels={pixels} resolution={resolution} onPixelClick={() => {}} />
        <RightPanel 
          layers={layers} 
          activeLayerId={activeLayerId} 
          setActiveLayerId={setActiveLayerId} 
          setLayers={setLayers} 
          onMoveLayer={moveLayer} 
          currentCanvasBase64={currentCanvasBase64} 
          onTextureUpdate={(url) => addLayerFromImage(url, 'AI Detail')} 
          resolution={resolution} 
        />
      </main>
      <footer className="h-8 bg-blue-600 flex items-center px-4 justify-between text-[10px] font-bold text-white uppercase tracking-widest flex-shrink-0">
        <div className="flex gap-4"><span>RENDER: SHADER_PIPELINE_V5</span><span>COLOR: RGBA_8888</span></div>
        <div className="flex gap-4"><span>SELECTED: {layers.find(l => l.id === activeLayerId)?.name || 'NONE'}</span><span>BUFFERS: {layers.length}</span></div>
      </footer>
    </div>
  );
};

export default App;
