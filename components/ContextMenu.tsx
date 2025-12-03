import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
  position: { x: number; y: number } | null;
  onClose: () => void;
  onAction: (action: string) => void;
  selectedCount: number;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ position, onClose, onAction, selectedCount }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!position) return null;

  const MenuItem = ({ label, shortcut, action, danger = false }: { label: string, shortcut?: string, action: string, danger?: boolean }) => (
    <button
      onClick={() => { onAction(action); onClose(); }}
      className={`w-full text-left px-4 py-2 text-sm flex justify-between items-center hover:bg-blue-50 transition-colors ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}`}
    >
      <span>{label}</span>
      {shortcut && <span className="text-gray-400 text-xs ml-4 font-mono">{shortcut}</span>}
    </button>
  );

  const Separator = () => <div className="h-px bg-gray-200 my-1" />;

  return (
    <div 
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-64 z-[60] select-none"
      style={{ top: position.y, left: position.x }}
    >
        <MenuItem label="Cut" shortcut="Cmd+X" action="cut" />
        <MenuItem label="Copy" shortcut="Cmd+C" action="copy" />
        <MenuItem label="Paste" shortcut="Cmd+V" action="paste" />
        
        <Separator />
        
        <MenuItem label="Send backward" shortcut="Cmd+[" action="layer_backward" />
        <MenuItem label="Bring forward" shortcut="Cmd+]" action="layer_forward" />
        <MenuItem label="Send to back" shortcut="Cmd+Opt+[" action="layer_back" />
        <MenuItem label="Bring to front" shortcut="Cmd+Opt+]" action="layer_front" />
        
        <Separator />
        
        <MenuItem label="Flip horizontal" shortcut="Shift+H" action="flip_h" />
        <MenuItem label="Flip vertical" shortcut="Shift+V" action="flip_v" />
        
        <Separator />
        
        <MenuItem label="Duplicate" shortcut="Cmd+D" action="duplicate" />
        <MenuItem label="Delete" shortcut="Del" action="delete" danger />
    </div>
  );
};