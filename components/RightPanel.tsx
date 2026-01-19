
import React, { useState } from 'react';
import { Layer, ShapeType, PatternType } from '../types';
import AISidebar from './AISidebar';

interface RightPanelProps {
  layers: Layer[];
  activeLayerId: string | null;
  setActiveLayerId: (id: string | null) => void;
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
  currentCanvasBase64: () => string;
  onTextureUpdate: (dataUrl: string) => void;
  resolution: number;
}

const RightPanel: React.FC<RightPanelProps> = ({ 
  layers, activeLayerId, setActiveLayerId, setLayers, onMoveLayer, currentCanvasBase64, onTextureUpdate, resolution 
}) => {
  const [tab, setTab] = useState<'stack' | 'ai'>('stack');

  const updateLayer = (id: string, updates: Partial<Layer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const removeLayer = (id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (activeLayerId === id) setActiveLayerId(null);
  };

  const activeLayer = layers.find(l => l.id === activeLayerId);

  return (
    <div className="w-80 h-full bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden">
      <div className="flex border-b border-slate-800">
        <button onClick={() => setTab('stack')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition ${tab === 'stack' ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>Layer Stack</button>
        <button onClick={() => setTab('ai')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition ${tab === 'ai' ? 'bg-slate-800 text-purple-400 border-b-2 border-purple-400' : 'text-slate-500 hover:text-slate-300'}`}>Gemini AI</button>
      </div>

      {tab === 'stack' ? (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
          <div className="flex flex-col gap-1">
            {[...layers].reverse().map((layer) => (
              <div 
                key={layer.id} 
                onClick={() => setActiveLayerId(layer.id)}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition border ${
                  activeLayerId === layer.id ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex-1 overflow-hidden">
                  <div className="text-[10px] font-black text-slate-300 truncate uppercase">{layer.name}</div>
                  <div className="text-[8px] text-slate-500 uppercase">{layer.layerType}</div>
                </div>
                <div className="flex gap-1 items-center">
                  <button onClick={(e) => { e.stopPropagation(); onMoveLayer(layer.id, 'up'); }} className="p-1 hover:bg-slate-700 rounded text-slate-400"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"/></svg></button>
                  <button onClick={(e) => { e.stopPropagation(); onMoveLayer(layer.id, 'down'); }} className="p-1 hover:bg-slate-700 rounded text-slate-400"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg></button>
                  <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }} className={`p-1 rounded text-[8px] font-black ${layer.visible ? 'text-blue-400' : 'text-slate-600'}`}>{layer.visible ? 'ON' : 'OFF'}</button>
                  {layer.id !== 'base-procedural' && (
                    <button onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }} className="p-1 text-red-500 hover:bg-red-900/20 rounded">×</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {activeLayer && (
            <div className="mt-4 p-4 bg-slate-950/50 rounded-lg border border-slate-800 space-y-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Adjust {activeLayer.name}</h4>
                <button onClick={() => updateLayer(activeLayer.id, { tiling: !activeLayer.tiling })} className={`text-[8px] font-black px-2 py-0.5 rounded ${activeLayer.tiling ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>TILING</button>
              </div>

              {activeLayer.layerType === 'pattern' && (
                <div className="space-y-3 border-b border-slate-800 pb-3">
                   <div className="flex flex-col gap-1">
                      <label className="text-[8px] text-slate-500 uppercase font-black">Type</label>
                      <div className="grid grid-cols-3 gap-1">
                        {[PatternType.STRIPES, PatternType.SPOTS, PatternType.BRICK].map(pt => (
                          <button key={pt} onClick={() => updateLayer(activeLayer.id, { patternType: pt, name: `Pattern: ${pt}` })} className={`py-1 text-[8px] font-black rounded border ${activeLayer.patternType === pt ? 'bg-blue-600 border-blue-400' : 'bg-slate-900 border-slate-700'}`}>{pt.toUpperCase()}</button>
                        ))}
                      </div>
                   </div>
                   <div className="flex flex-col gap-1">
                      <label className="text-[8px] text-slate-500 uppercase font-black">Color</label>
                      <input type="color" value={activeLayer.patternColor} onChange={(e) => updateLayer(activeLayer.id, { patternColor: e.target.value })} className="w-full h-8 bg-slate-800 border-none cursor-pointer rounded" />
                   </div>
                   <div className="flex flex-col gap-1">
                     <label className="text-[8px] text-slate-500 uppercase font-black">Scale: {activeLayer.patternScale}</label>
                     <input type="range" min="1" max="10" step="0.1" value={activeLayer.patternScale} onChange={(e) => updateLayer(activeLayer.id, { patternScale: parseFloat(e.target.value) })} className="w-full accent-blue-500" />
                   </div>
                   <div className="flex flex-col gap-1">
                     <label className="text-[8px] text-slate-500 uppercase font-black">Jitter: {Math.round((activeLayer.patternJitter || 0) * 100)}%</label>
                     <input type="range" min="0" max="1" step="0.05" value={activeLayer.patternJitter} onChange={(e) => updateLayer(activeLayer.id, { patternJitter: parseFloat(e.target.value) })} className="w-full accent-blue-500" />
                   </div>
                   <div className="flex flex-col gap-1">
                     <label className="text-[8px] text-slate-500 uppercase font-black">Pattern Shading: {activeLayer.patternShading}</label>
                     <input type="range" min="0" max="100" value={activeLayer.patternShading} onChange={(e) => updateLayer(activeLayer.id, { patternShading: parseInt(e.target.value) })} className="w-full accent-blue-500" />
                   </div>
                </div>
              )}

              {activeLayer.layerType === 'shape' && (
                <div className="space-y-3 border-b border-slate-800 pb-3">
                   <div className="grid grid-cols-3 gap-1">
                      {Object.values(ShapeType).map(st => (
                        <button key={st} onClick={() => updateLayer(activeLayer.id, { shapeType: st, name: `Shape: ${st}` })} className={`py-1 text-[8px] font-black rounded border ${activeLayer.shapeType === st ? 'bg-blue-600 border-blue-400' : 'bg-slate-900 border-slate-700'}`}>{st.toUpperCase()}</button>
                      ))}
                   </div>
                   <input type="color" value={activeLayer.color} onChange={(e) => updateLayer(activeLayer.id, { color: e.target.value })} className="w-full h-8 bg-slate-800 border-none cursor-pointer rounded" />
                   <div className="flex flex-col gap-1">
                     <label className="text-[8px] text-slate-500 uppercase font-black">Size: {activeLayer.size}</label>
                     <input type="range" min="1" max={resolution} value={activeLayer.size} onChange={(e) => updateLayer(activeLayer.id, { size: parseInt(e.target.value) })} className="w-full accent-blue-500" />
                   </div>
                   <div className="flex flex-col gap-1">
                     <label className="text-[8px] text-slate-500 uppercase font-black">In-Shape Shading: {activeLayer.shading}</label>
                     <input type="range" min="-100" max="100" value={activeLayer.shading} onChange={(e) => updateLayer(activeLayer.id, { shading: parseInt(e.target.value) })} className="w-full accent-blue-500" />
                   </div>
                </div>
              )}

              {activeLayer.layerType !== 'procedural' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] text-slate-500 uppercase font-black">X Pos: {activeLayer.x}</label>
                    <input type="range" min={-resolution} max={resolution} value={activeLayer.x} onChange={(e) => updateLayer(activeLayer.id, { x: parseInt(e.target.value) })} className="w-full accent-blue-500" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] text-slate-500 uppercase font-black">Y Pos: {activeLayer.y}</label>
                    <input type="range" min={-resolution} max={resolution} value={activeLayer.y} onChange={(e) => updateLayer(activeLayer.id, { y: parseInt(e.target.value) })} className="w-full accent-blue-500" />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[8px] text-slate-500 uppercase font-black">Global Opacity: {Math.round(activeLayer.opacity * 100)}%</label>
                <input type="range" min="0" max="1" step="0.05" value={activeLayer.opacity} onChange={(e) => updateLayer(activeLayer.id, { opacity: parseFloat(e.target.value) })} className="w-full accent-blue-500" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <AISidebar currentCanvasBase64={currentCanvasBase64} onTextureUpdate={onTextureUpdate} />
      )}
    </div>
  );
};

export default RightPanel;
