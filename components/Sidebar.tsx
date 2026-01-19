
import React from 'react';
import { ProceduralParams, PatternType, Resolution, ShapeType, GradientType } from '../types';

interface SidebarProps {
  params: ProceduralParams;
  setParams: React.Dispatch<React.SetStateAction<ProceduralParams>>;
  resolution: Resolution;
  setResolution: (res: Resolution) => void;
  onGenerate: () => void;
  onAddLayer: (dataUrl: string, name: string) => void;
  onAddShape: (type: ShapeType) => void;
  onAddPattern: (type: PatternType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  params, setParams, resolution, setResolution, onGenerate, onAddLayer, onAddShape, onAddPattern
}) => {
  const handleChange = (key: keyof ProceduralParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const toggleSide = (side: keyof ProceduralParams['borderSides']) => {
    setParams(prev => ({
      ...prev,
      borderSides: {
        ...prev.borderSides,
        [side]: !prev.borderSides[side]
      }
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => { if (re.target?.result) onAddLayer(re.target.result as string, file.name); };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-80 h-full bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
      <div>
        <h2 className="text-sm font-black mb-4 flex items-center gap-2 text-slate-400 uppercase tracking-widest">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Dimensions
        </h2>
        <div className="grid grid-cols-4 gap-1">
          {[16, 32, 64, 128].map((res) => (
            <button
              key={res}
              onClick={() => setResolution(res as Resolution)}
              className={`py-2 rounded text-[10px] font-black transition ${
                resolution === res ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {res}x
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <label className="flex flex-col items-center justify-center h-14 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Upload Texture Overlay</div>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => onAddShape(ShapeType.RECTANGLE)}
            className="flex flex-col items-center justify-center h-12 border border-slate-700 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-[9px] font-black text-slate-300 uppercase"
          >
            + Shape
          </button>
          <button 
            onClick={() => onAddPattern(PatternType.STRIPES)}
            className="flex flex-col items-center justify-center h-12 border border-slate-700 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-[9px] font-black text-slate-300 uppercase"
          >
            + Pattern
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-3">Material Base</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[8px] text-slate-500 font-bold uppercase">Color A</label>
                <input type="color" value={params.baseColor} onChange={(e) => handleChange('baseColor', e.target.value)} className="w-full h-8 rounded bg-slate-800 border-none cursor-pointer" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] text-slate-500 font-bold uppercase">Color B</label>
                <input type="color" value={params.baseColorEnd} onChange={(e) => handleChange('baseColorEnd', e.target.value)} className="w-full h-8 rounded bg-slate-800 border-none cursor-pointer" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-500 font-bold uppercase">Gradient Mode</label>
              <select 
                value={params.gradientType} 
                onChange={(e) => handleChange('gradientType', e.target.value as GradientType)} 
                className="w-full h-8 rounded bg-slate-800 border-slate-700 px-2 text-[10px] font-bold"
              >
                <option value="none">Solid (Color A)</option>
                <option value="linear-v">Linear Vertical</option>
                <option value="linear-h">Linear Horizontal</option>
                <option value="radial">Radial</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-500 font-bold uppercase">Base Noise: {params.noiseAmount}%</label>
              <input type="range" min="0" max="100" value={params.noiseAmount} onChange={(e) => handleChange('noiseAmount', parseInt(e.target.value))} className="w-full" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-3">Edge Details</h3>
          <div className="grid grid-cols-2 gap-1 mb-3">
            {(['top', 'bottom', 'left', 'right'] as const).map(s => (
              <button key={s} onClick={() => toggleSide(s)} className={`py-1 text-[8px] font-black border rounded ${params.borderSides[s] ? 'bg-orange-600 border-orange-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{s.toUpperCase()}</button>
            ))}
          </div>
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[9px] text-slate-500 font-bold uppercase">Custom Edge Color</label>
                <input 
                  type="checkbox" 
                  checked={params.useCustomBorderColor} 
                  onChange={(e) => handleChange('useCustomBorderColor', e.target.checked)} 
                />
              </div>
              {params.useCustomBorderColor ? (
                 <input type="color" value={params.borderColor} onChange={(e) => handleChange('borderColor', e.target.value)} className="w-full h-8 rounded bg-slate-800 border-none cursor-pointer" />
              ) : (
                <select value={params.borderType} onChange={(e) => handleChange('borderType', e.target.value)} className="w-full h-8 rounded bg-slate-800 border-slate-700 px-2 text-[10px] font-bold">
                  <option value="darken">Darken Edges</option>
                  <option value="lighten">Highlight Edges</option>
                </select>
              )}
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-500 font-bold uppercase">Thickness: {params.borderSize}</label>
              <input type="range" min="1" max="12" value={params.borderSize} onChange={(e) => handleChange('borderSize', parseInt(e.target.value))} className="w-full" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-500 font-bold uppercase">Falloff: {params.borderIntensity}</label>
              <input type="range" min="0" max="200" value={params.borderIntensity} onChange={(e) => handleChange('borderIntensity', parseInt(e.target.value))} className="w-full" />
            </div>
          </div>
        </div>
      </div>

      <button onClick={onGenerate} className="mt-auto py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-lg shadow-xl shadow-indigo-900/40 transition-all text-xs uppercase tracking-widest">
        FORCE RE-CALC
      </button>
    </div>
  );
};

export default Sidebar;
