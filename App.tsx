import React, { useState, useEffect, useCallback } from 'react';
import { WhiteboardCanvas } from './components/WhiteboardCanvas';
import { Toolbar } from './components/Toolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ContextMenu } from './components/ContextMenu';
import { CanvasElement, ToolType, ShapeStyle } from './types';
import { DEFAULT_STYLE, TOOLS } from './constants';
import Konva from 'konva';

const App: React.FC = () => {
  // --- State ---
  const [elements, setElements] = useState<CanvasElement[]>([]);
  // History Stack
  const [history, setHistory] = useState<CanvasElement[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);

  const [tool, setTool] = useState<ToolType>('rectangle');
  const [isToolLocked, setIsToolLocked] = useState(false);
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentStyle, setCurrentStyle] = useState<ShapeStyle>(DEFAULT_STYLE);

  // Context Menu & Clipboard
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number, y: number } | null>(null);
  const [clipboard, setClipboard] = useState<CanvasElement[]>([]);

  // --- Undo/Redo Logic ---
  const saveHistory = useCallback((newElements: CanvasElement[]) => {
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push(newElements);
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
  }, [history, historyStep]);

  const undo = () => {
      if (historyStep > 0) {
          const prevStep = historyStep - 1;
          setHistoryStep(prevStep);
          setElements(history[prevStep]);
      }
  };

  const redo = () => {
      if (historyStep < history.length - 1) {
          const nextStep = historyStep + 1;
          setHistoryStep(nextStep);
          setElements(history[nextStep]);
      }
  };

  const handleCanvasMouseUp = () => {
     const lastState = history[historyStep];
     if (JSON.stringify(lastState) !== JSON.stringify(elements)) {
         saveHistory(elements);
     }
  };

  // --- Context Menu Handlers ---
  const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault();
      // Only show if clicking on canvas or shape (though shape click is handled, we bubble up in canvas)
      // Set position based on clientX/Y
      setContextMenuPos({ x: e.evt.clientX, y: e.evt.clientY });
  };

  const handleContextMenuAction = (action: string) => {
      if (action === 'cut') {
          copySelection();
          deleteSelection();
      } else if (action === 'copy') {
          copySelection();
      } else if (action === 'paste') {
          pasteClipboard();
      } else if (action.startsWith('layer_')) {
          const dir = action.replace('layer_', '') as 'back' | 'backward' | 'forward' | 'front';
          moveLayer(dir);
      } else if (action === 'duplicate') {
          duplicateSelection();
      } else if (action === 'delete') {
          deleteSelection();
      } else if (action === 'flip_h') {
          flipSelection('horizontal');
      } else if (action === 'flip_v') {
          flipSelection('vertical');
      }
  };

  // --- Action Implementations ---
  const deleteSelection = () => {
      if (selectedIds.length === 0) return;
      setElements(prev => prev.filter(el => !selectedIds.includes(el.id)));
      setSelectedIds([]);
  };

  const copySelection = () => {
      const selectedElements = elements.filter(el => selectedIds.includes(el.id));
      if (selectedElements.length > 0) {
          setClipboard(selectedElements);
      }
  };

  const pasteClipboard = () => {
      if (clipboard.length === 0) return;
      const newElements = clipboard.map(el => ({
          ...el,
          id: crypto.randomUUID(),
          x: el.x + 20,
          y: el.y + 20,
      }));
      setElements(prev => [...prev, ...newElements]);
      setSelectedIds(newElements.map(e => e.id));
  };

  const duplicateSelection = () => {
      if (selectedIds.length === 0) return;
      const selectedElements = elements.filter(el => selectedIds.includes(el.id));
      const newElements = selectedElements.map(el => ({
          ...el,
          id: crypto.randomUUID(),
          x: el.x + 20,
          y: el.y + 20,
      }));
      setElements(prev => [...prev, ...newElements]);
      setSelectedIds(newElements.map(e => e.id));
  };

  const flipSelection = (direction: 'horizontal' | 'vertical') => {
      setElements(prev => prev.map(el => {
          if (selectedIds.includes(el.id)) {
              if (direction === 'horizontal') {
                  return { ...el, scaleX: (el.scaleX || 1) * -1 };
              } else {
                  return { ...el, scaleY: (el.scaleY || 1) * -1 };
              }
          }
          return el;
      }));
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const activeTag = document.activeElement?.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

        // Copy/Paste/Cut/Duplicate
        if ((e.ctrlKey || e.metaKey)) {
            if (e.key === 'c') copySelection();
            if (e.key === 'v') pasteClipboard();
            if (e.key === 'x') { copySelection(); deleteSelection(); }
            if (e.key === 'd') { e.preventDefault(); duplicateSelection(); }
            
            // Layers: Cmd+[, Cmd+], Cmd+Shift+[, Cmd+Shift+]
            // Browser might use Option as Alt
            // Mapping: [ is Send Backward, ] is Bring Forward
            if (e.key === '[' || e.key === ']') {
                 e.preventDefault();
                 const isShift = e.shiftKey || e.altKey; // Handling both Option(Alt) and Shift for back/front
                 const dir = e.key === '[' 
                    ? (isShift ? 'back' : 'backward') 
                    : (isShift ? 'front' : 'forward');
                 moveLayer(dir);
            }
        }
        
        // Tool switching (0-9)
        const matchedTool = TOOLS.find(t => t.key === e.key.toUpperCase());
        if (matchedTool) {
            setTool(matchedTool.id);
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            const allIds = elements.map(el => el.id);
            setSelectedIds(allIds);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements, selectedIds, clipboard]);

  // --- Style Updates ---
  const handleStyleChange = (updates: Partial<ShapeStyle>) => {
      const newStyle = { ...currentStyle, ...updates };
      setCurrentStyle(newStyle);

      if (selectedIds.length > 0) {
          setElements(prev => prev.map(el => {
              if (selectedIds.includes(el.id)) {
                  return { ...el, ...updates };
              }
              return el;
          }));
      }
  };

  useEffect(() => {
      if (selectedIds.length > 0) {
          const lastSelectedId = selectedIds[selectedIds.length - 1];
          const el = elements.find(e => e.id === lastSelectedId);
          if (el) {
              setCurrentStyle({
                  strokeColor: el.strokeColor,
                  strokeWidth: el.strokeWidth,
                  fillColor: el.fillColor,
                  opacity: el.opacity,
                  strokeStyle: el.strokeStyle,
                  roughness: el.roughness,
                  edges: el.edges || 'sharp',
                  fontFamily: el.fontFamily || 'Arial',
              });
          }
      }
  }, [selectedIds, elements]);

  // --- Layer Management ---
  const moveLayer = (action: 'back' | 'backward' | 'forward' | 'front') => {
      if (selectedIds.length === 0) return;
      
      let newElements = [...elements];
      const selectedIndices = selectedIds.map(id => newElements.findIndex(el => el.id === id)).sort((a, b) => a - b);
      
      if (selectedIndices.some(i => i === -1)) return;

      if (action === 'back') {
          const selectedEls = selectedIndices.map(i => newElements[i]);
          newElements = newElements.filter((_, i) => !selectedIndices.includes(i));
          newElements.unshift(...selectedEls);
      } else if (action === 'front') {
          const selectedEls = selectedIndices.map(i => newElements[i]);
          newElements = newElements.filter((_, i) => !selectedIndices.includes(i));
          newElements.push(...selectedEls);
      } else if (action === 'backward') {
           for (let i of selectedIndices) {
               if (i > 0) {
                   const temp = newElements[i-1];
                   newElements[i-1] = newElements[i];
                   newElements[i] = temp;
               }
           }
      } else if (action === 'forward') {
           for (let i of selectedIndices.reverse()) {
               if (i < newElements.length - 1) {
                   const temp = newElements[i+1];
                   newElements[i+1] = newElements[i];
                   newElements[i] = temp;
               }
           }
      }
      
      setElements(newElements);
      saveHistory(newElements);
  };

  return (
    <div className="font-sans text-gray-900" onMouseUp={handleCanvasMouseUp}>
      <Toolbar 
        activeTool={tool} 
        setTool={setTool}
        undo={undo}
        redo={redo}
        canUndo={historyStep > 0}
        canRedo={historyStep < history.length - 1}
        isLocked={isToolLocked}
        onToggleLock={() => setIsToolLocked(!isToolLocked)}
      />
      
      <PropertiesPanel 
        currentStyle={currentStyle}
        onChange={handleStyleChange}
        selectedElementIds={selectedIds}
        onMoveLayer={moveLayer}
      />

      <WhiteboardCanvas 
        elements={elements}
        setElements={setElements}
        tool={tool}
        setTool={setTool}
        currentStyle={currentStyle}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        isLocked={isToolLocked}
        onContextMenu={handleContextMenu}
      />

      <ContextMenu 
        position={contextMenuPos} 
        onClose={() => setContextMenuPos(null)} 
        onAction={handleContextMenuAction}
        selectedCount={selectedIds.length}
      />
    </div>
  );
};

export default App;