
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';

interface AISidebarProps {
  currentCanvasBase64: () => string;
  onTextureUpdate: (dataUrl: string) => void;
}

const AISidebar: React.FC<AISidebarProps> = ({ currentCanvasBase64, onTextureUpdate }) => {
  const [prompt, setPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleEdit = async () => {
    if (!prompt) return;
    setIsEditing(true);
    try {
      const currentImg = currentCanvasBase64();
      const result = await geminiService.editTexture(currentImg, prompt);
      if (result) onTextureUpdate(result);
    } catch (e) {
      alert("Failed to edit with AI");
    } finally {
      setIsEditing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const result = await geminiService.generateNewTexture(prompt);
      if (result) onTextureUpdate(result);
    } catch (e) {
      alert("Failed to generate with AI");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
      <div className="bg-gradient-to-br from-indigo-900/30 to-blue-900/30 border border-indigo-500/20 rounded-xl p-4">
        <h2 className="text-xs font-black text-indigo-400 mb-2 flex items-center gap-2 uppercase tracking-widest">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
          Gemini Intelligence
        </h2>
        <p className="text-[10px] text-slate-400 leading-relaxed italic">
          "Make it look like rusted iron" or "Add tiger stripes".
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your vision..."
          className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-bold focus:ring-1 focus:ring-blue-500 outline-none resize-none"
        />

        <div className="flex flex-col gap-2">
          <button
            onClick={handleEdit}
            disabled={isEditing || isGenerating}
            className="py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-black text-[10px] tracking-widest uppercase transition-all"
          >
            {isEditing ? 'WORKING...' : 'TRANSFORM BASE'}
          </button>
          <button
            onClick={handleGenerate}
            disabled={isEditing || isGenerating}
            className="py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg font-black text-[10px] tracking-widest uppercase border border-slate-700 transition-all"
          >
            {isGenerating ? 'WORKING...' : 'GENERATE NEW'}
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Presets</h3>
        <div className="flex flex-wrap gap-1">
          {['Retro', 'Moss', 'Rust', 'Neon', 'Burnt'].map(tag => (
            <button
              key={tag}
              onClick={() => setPrompt(prev => prev + " " + tag)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[8px] font-bold text-slate-400 rounded-full border border-slate-700"
            >
              +{tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AISidebar;
