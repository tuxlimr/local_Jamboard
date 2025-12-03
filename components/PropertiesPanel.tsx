import React from 'react';
import { ShapeStyle } from '../types';
import { COLORS, BACKGROUND_COLORS, FONTS } from '../constants';
import { 
  Minus, 
  MoreHorizontal, 
  ArrowDownToLine, 
  ArrowDown, 
  ArrowUp, 
  ArrowUpToLine,
  Type
} from 'lucide-react';

interface PropertiesPanelProps {
  currentStyle: ShapeStyle;
  onChange: (updates: Partial<ShapeStyle>) => void;
  selectedElementIds: string[];
  onMoveLayer: (action: 'back' | 'backward' | 'forward' | 'front') => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  currentStyle,
  onChange,
  selectedElementIds,
  onMoveLayer
}) => {
  return (
    <div className="fixed top-20 left-4 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-[240px] z-40 max-h-[85vh] overflow-y-auto select-none">
      
      {/* --- Stroke Color --- */}
      <div className="mb-4">
        <label className="text-xs text-gray-500 font-semibold mb-2 block">Stroke</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onChange({ strokeColor: color })}
              className={`w-6 h-6 rounded-md border border-gray-200 transition-all hover:scale-110 focus:outline-none ${
                currentStyle.strokeColor === color ? 'ring-2 ring-blue-500 ring-offset-1' : ''
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
          {/* Transparent for Stroke */}
          <button
              onClick={() => onChange({ strokeColor: 'transparent' })}
              className={`w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center transition-all hover:scale-110 focus:outline-none bg-white ${
                currentStyle.strokeColor === 'transparent' ? 'ring-2 ring-blue-500 ring-offset-1' : ''
              }`}
              title="Transparent"
            >
              <div className="w-[1px] h-4 bg-red-500 transform rotate-45"></div>
            </button>
        </div>
      </div>

      {/* --- Background Color --- */}
      <div className="mb-4">
        <label className="text-xs text-gray-500 font-semibold mb-2 block">Background</label>
        <div className="flex flex-wrap gap-2">
           <button
              onClick={() => onChange({ fillColor: 'transparent' })}
              className={`w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center transition-all hover:scale-110 focus:outline-none bg-white ${
                currentStyle.fillColor === 'transparent' ? 'ring-2 ring-blue-500 ring-offset-1' : ''
              }`}
              title="Transparent"
            >
               <div className="w-4 h-4 border border-gray-300 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwYXRoIGQ9Ik0wIDBoNHY0SDB6IiBmaWxsPSIjZWVlIi8+PHBhdGggZD0iTTQgNGg0djRINHoiIGZpbGw9IiNlZWUiLz48L3N2Zz4=')]"></div>
            </button>
          {BACKGROUND_COLORS.filter(c => c !== 'transparent').map((color) => (
            <button
              key={color}
              onClick={() => onChange({ fillColor: color })}
              className={`w-6 h-6 rounded-md border border-gray-200 transition-all hover:scale-110 focus:outline-none ${
                currentStyle.fillColor === color ? 'ring-2 ring-blue-500 ring-offset-1' : ''
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className="h-px bg-gray-100 my-4" />

      {/* --- Font Family --- */}
       <div className="mb-4">
        <label className="text-xs text-gray-500 font-semibold mb-2 block">Font Family</label>
        <div className="relative">
            <select
            value={currentStyle.fontFamily}
            onChange={(e) => onChange({ fontFamily: e.target.value })}
            className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-xs py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            >
            {FONTS.map((font) => (
                <option key={font} value={font}>
                {font}
                </option>
            ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <Type size={12} />
            </div>
        </div>
      </div>

      {/* --- Stroke Width --- */}
      <div className="mb-4">
        <label className="text-xs text-gray-500 font-semibold mb-2 block">Stroke width</label>
        <div className="flex gap-2">
            {[2, 4, 8].map((width) => (
                <button
                    key={width}
                    onClick={() => onChange({ strokeWidth: width })}
                    className={`flex-1 h-8 rounded-md flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors ${currentStyle.strokeWidth === width ? 'bg-blue-100 ring-1 ring-blue-500 text-blue-700' : 'text-gray-600'}`}
                    title={`Width ${width}`}
                >
                    <div className="bg-current rounded-full" style={{ height: Math.min(6, width), width: '50%' }}></div>
                </button>
            ))}
        </div>
      </div>

      {/* --- Stroke Style --- */}
      <div className="mb-4">
        <label className="text-xs text-gray-500 font-semibold mb-2 block">Stroke style</label>
        <div className="flex gap-2">
             <button
                onClick={() => onChange({ strokeStyle: 'solid' })}
                className={`flex-1 h-8 rounded-md flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors ${currentStyle.strokeStyle === 'solid' ? 'bg-blue-100 ring-1 ring-blue-500 text-blue-700' : 'text-gray-600'}`}
                title="Solid"
            >
                <div className="w-1/2 h-0.5 bg-current"></div>
            </button>
            <button
                onClick={() => onChange({ strokeStyle: 'dashed' })}
                className={`flex-1 h-8 rounded-md flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors ${currentStyle.strokeStyle === 'dashed' ? 'bg-blue-100 ring-1 ring-blue-500 text-blue-700' : 'text-gray-600'}`}
                title="Dashed"
            >
                <div className="w-1/2 h-0.5 border-b-2 border-dashed border-current"></div>
            </button>
             <button
                onClick={() => onChange({ strokeStyle: 'dotted' })}
                className={`flex-1 h-8 rounded-md flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors ${currentStyle.strokeStyle === 'dotted' ? 'bg-blue-100 ring-1 ring-blue-500 text-blue-700' : 'text-gray-600'}`}
                title="Dotted"
            >
                <div className="w-1/2 h-0.5 border-b-2 border-dotted border-current"></div>
            </button>
        </div>
      </div>

       {/* --- Sloppiness --- */}
       <div className="mb-4">
        <label className="text-xs text-gray-500 font-semibold mb-2 block">Sloppiness</label>
        <div className="flex gap-2">
             <button
                onClick={() => onChange({ roughness: 0 })}
                className={`flex-1 h-8 rounded-md flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors ${currentStyle.roughness === 0 ? 'bg-blue-100 ring-1 ring-blue-500 text-blue-700' : 'text-gray-600'}`}
                title="None"
            >
                <Minus size={16} />
            </button>
            <button
                onClick={() => onChange({ roughness: 1 })}
                className={`flex-1 h-8 rounded-md flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors ${currentStyle.roughness === 1 ? 'bg-blue-100 ring-1 ring-blue-500 text-blue-700' : 'text-gray-600'}`}
                title="Low"
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10c2-2 4 2 6 0s4-2 6 0" /></svg>
            </button>
             <button
                onClick={() => onChange({ roughness: 2.5 })}
                className={`flex-1 h-8 rounded-md flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors ${currentStyle.roughness === 2.5 ? 'bg-blue-100 ring-1 ring-blue-500 text-blue-700' : 'text-gray-600'}`}
                title="High"
            >
                 <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12c1-3 3 3 5 0s3-3 5 0s3 3 5 0" /></svg>
            </button>
        </div>
      </div>

      {/* --- Edges --- */}
      <div className="mb-4">
        <label className="text-xs text-gray-500 font-semibold mb-2 block">Edges</label>
        <div className="flex gap-2">
             <button
                onClick={() => onChange({ edges: 'sharp' })}
                className={`w-10 h-8 rounded-md flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors ${currentStyle.edges === 'sharp' ? 'bg-blue-100 ring-1 ring-blue-500 text-blue-700' : 'text-gray-600'}`}
                title="Sharp"
            >
                <div className="w-4 h-4 border-2 border-current rounded-none"></div>
            </button>
            <button
                onClick={() => onChange({ edges: 'round' })}
                className={`w-10 h-8 rounded-md flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors ${currentStyle.edges === 'round' ? 'bg-blue-100 ring-1 ring-blue-500 text-blue-700' : 'text-gray-600'}`}
                title="Round"
            >
                 <div className="w-4 h-4 border-2 border-current rounded-md"></div>
            </button>
        </div>
      </div>

      {/* --- Opacity --- */}
      <div className="mb-6">
        <label className="text-xs text-gray-500 font-semibold mb-2 flex justify-between">
            <span>Opacity</span>
            <span>{Math.round(currentStyle.opacity * 100)}%</span>
        </label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={currentStyle.opacity}
          onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* --- Layers --- */}
      {selectedElementIds.length > 0 && (
          <div className="mb-2">
            <label className="text-xs text-gray-500 font-semibold mb-2 block">Layers</label>
            <div className="flex gap-2">
                 <button onClick={() => onMoveLayer('back')} className="flex-1 h-8 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-600 flex items-center justify-center" title="Send to Back">
                     <ArrowDownToLine size={16} />
                 </button>
                 <button onClick={() => onMoveLayer('backward')} className="flex-1 h-8 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-600 flex items-center justify-center" title="Send Backward">
                     <ArrowDown size={16} />
                 </button>
                 <button onClick={() => onMoveLayer('forward')} className="flex-1 h-8 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-600 flex items-center justify-center" title="Bring Forward">
                     <ArrowUp size={16} />
                 </button>
                 <button onClick={() => onMoveLayer('front')} className="flex-1 h-8 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-600 flex items-center justify-center" title="Bring to Front">
                     <ArrowUpToLine size={16} />
                 </button>
            </div>
          </div>
      )}

    </div>
  );
};