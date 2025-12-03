import React, { useRef } from 'react';
import { TOOLS } from '../constants';
import { ToolType } from '../types';
import { Lock, Library } from 'lucide-react';

interface ToolbarProps {
  activeTool: ToolType;
  setTool: (tool: ToolType) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isLocked: boolean;
  onToggleLock: () => void;
  onImageUpload: (file: File) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  activeTool, 
  setTool,
  undo,
  redo,
  canUndo,
  canRedo,
  isLocked,
  onToggleLock,
  onImageUpload
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToolClick = (toolId: ToolType) => {
    if (toolId === 'image') {
      fileInputRef.current?.click();
    } else {
      setTool(toolId);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
    // Reset value so same file can be selected again
    if (e.target) e.target.value = '';
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-md border border-gray-200 p-1 flex items-center gap-1 z-50 select-none">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange} 
      />

      {/* Lock Button */}
      <button
        onClick={onToggleLock}
        className={`relative flex items-center justify-center w-9 h-9 rounded-md transition-colors ${
          isLocked ? 'bg-violet-100 text-violet-700' : 'text-gray-600 hover:bg-gray-100'
        }`}
        title="Keep selected tool active"
      >
        <Lock size={16} />
      </button>

      {/* Separator */}
      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Tools */}
      {TOOLS.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;
        
        return (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            className={`relative flex items-center justify-center w-9 h-9 rounded-md transition-all ${
              isActive
                ? 'bg-violet-100 text-violet-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title={`${tool.label} (${tool.key})`}
          >
            <Icon size={18} />
            <span className="absolute bottom-0.5 right-1 text-[9px] font-medium opacity-60">
              {tool.key}
            </span>
          </button>
        );
      })}

      {/* Separator */}
      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Libraries / Extra */}
      <button
        className="relative flex items-center justify-center w-9 h-9 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
        title="Library"
      >
        <Library size={18} />
      </button>

    </div>
  );
};