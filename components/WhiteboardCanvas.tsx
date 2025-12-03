import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Line, Arrow, Text, Transformer, RegularPolygon, Group, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { CanvasElement, Point, ToolType, ShapeStyle } from '../types';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface WhiteboardCanvasProps {
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  tool: ToolType;
  setTool: (tool: ToolType) => void;
  currentStyle: ShapeStyle;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  isLocked: boolean;
  onContextMenu: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  pendingImage: File | null;
  onImageProcessed: () => void;
}

const URLImage = ({ element, ...baseProps }: { element: CanvasElement } & any) => {
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    
    useEffect(() => {
        if (!element.imageUrl) return;
        const img = new window.Image();
        img.src = element.imageUrl;
        img.onload = () => setImage(img);
    }, [element.imageUrl]);

    return <KonvaImage image={image} {...baseProps} />;
};

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  elements,
  setElements,
  tool,
  setTool,
  currentStyle,
  selectedIds,
  setSelectedIds,
  isLocked,
  onContextMenu,
  pendingImage,
  onImageProcessed
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  
  // Viewport State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<Point>({ x: 0, y: 0 });

  // Text Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [textValue, setTextValue] = useState('');
  const [editingPosition, setEditingPosition] = useState<{ top: number; left: number; width: number; fontSize: number; fontFamily: string }>({ top: 0, left: 0, width: 0, fontSize: 20, fontFamily: 'Arial' });

  // Hover state for smart arrows
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);

  // --- Image Processing ---
  useEffect(() => {
    if (pendingImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataURL = e.target?.result as string;
            if (dataURL) {
                const img = new window.Image();
                img.onload = () => {
                    // Calculate center position
                    const viewportCenterX = (-position.x + window.innerWidth / 2) / scale;
                    const viewportCenterY = (-position.y + window.innerHeight / 2) / scale;
                    
                    // Limit max width/height to reasonable size relative to viewport
                    const maxDim = 500 / scale;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxDim || height > maxDim) {
                        const ratio = width / height;
                        if (width > height) {
                            width = maxDim;
                            height = maxDim / ratio;
                        } else {
                            height = maxDim;
                            width = maxDim * ratio;
                        }
                    }

                    const newElement: CanvasElement = {
                        id: crypto.randomUUID(),
                        type: 'image',
                        x: viewportCenterX - width / 2,
                        y: viewportCenterY - height / 2,
                        width: width,
                        height: height,
                        imageUrl: dataURL,
                        strokeColor: 'transparent',
                        strokeWidth: 0,
                        fillColor: 'transparent',
                        opacity: 1,
                        strokeStyle: 'solid',
                        roughness: 0,
                        edges: 'sharp',
                        fontFamily: 'Arial',
                        rotation: 0,
                        scaleX: 1,
                        scaleY: 1
                    };
                    
                    setElements(prev => [...prev, newElement]);
                    setTool('select');
                    onImageProcessed();
                };
                img.src = dataURL;
            }
        };
        reader.readAsDataURL(pendingImage);
    }
  }, [pendingImage, position, scale]);


  // --- Helpers ---
  const getRelativePointerPosition = () => {
    const node = stageRef.current;
    if (!node) return { x: 0, y: 0 };
    const transform = node.getAbsoluteTransform().copy();
    transform.invert();
    const pos = node.getStage()?.getPointerPosition();
    return pos ? transform.point(pos) : { x: 0, y: 0 };
  };

  const getDashArray = (style: 'solid' | 'dashed' | 'dotted', width: number) => {
      if (style === 'dashed') return [width * 4, width * 2];
      if (style === 'dotted') return [width, width * 2];
      return undefined;
  };

  // --- Geometry Helpers for Arrow Connections ---

  const rotatePoint = (p: Point, center: Point, angleDeg: number): Point => {
      const angleRad = (angleDeg * Math.PI) / 180;
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      const dx = p.x - center.x;
      const dy = p.y - center.y;
      return {
          x: center.x + dx * cos - dy * sin,
          y: center.y + dx * sin + dy * cos
      };
  };

  // Generic intersection solver for center-to-point rays
  // Returns the scaling factor 't' such that center + t * vector is on the boundary
  const getIntersectionT = (type: ToolType, dx: number, dy: number, hw: number, hh: number): number => {
      if (dx === 0 && dy === 0) return 1;
      
      // Avoid division by zero issues by using a small epsilon if dimension is 0
      const safeHw = Math.max(hw, 0.001);
      const safeHh = Math.max(hh, 0.001);

      if (type === 'circle') {
          // Ellipse equation: x^2/a^2 + y^2/b^2 = 1
          // Line: x=t*dx, y=t*dy
          // t = 1 / sqrt((dx/a)^2 + (dy/b)^2)
          return 1 / Math.sqrt(Math.pow(dx / safeHw, 2) + Math.pow(dy / safeHh, 2));
      } else if (type === 'diamond') {
          // Diamond equation: |x|/a + |y|/b = 1
          // t = 1 / (|dx|/a + |dy|/b)
          return 1 / (Math.abs(dx) / safeHw + Math.abs(dy) / safeHh);
      } else {
          // Rectangle (Ray-Box)
          // t = min(a/|dx|, b/|dy|)
          const tx = dx !== 0 ? safeHw / Math.abs(dx) : Infinity;
          const ty = dy !== 0 ? safeHh / Math.abs(dy) : Infinity;
          return Math.min(tx, ty);
      }
  };

  const getConnectionPoint = (element: CanvasElement, fromPoint: Point): Point => {
      // 1. Identify Anchor and Dimensions
      // Circle and Diamond are drawn centered at (x,y) due to offsetX/Y logic in rendering
      // Rect, Text, Image are drawn from top-left (x,y)
      const isCenteredAnchor = element.type === 'circle' || element.type === 'diamond';
      
      // Actual Dimensions
      const width = element.width || 0;
      const height = element.height || 0;
      const scaleX = element.scaleX || 1;
      const scaleY = element.scaleY || 1;
      
      // Half-widths (bounding box radii)
      const hw = Math.abs(width * scaleX) / 2;
      const hh = Math.abs(height * scaleY) / 2;

      // Pivot Point (The (x,y) coordinate of the element)
      const pivot = { x: element.x, y: element.y };

      // 2. Rotate external point into local space (relative to Pivot)
      // Rotate 'fromPoint' around 'pivot' by '-rotation'
      const rotation = element.rotation || 0;
      const unrotatedFrom = rotatePoint(fromPoint, pivot, -rotation);

      // 3. Determine Vector from Visual Center to Point
      // Visual Center relative to Pivot:
      // If Centered Anchor: (0,0)
      // If Corner Anchor: (width*scaleX/2, height*scaleY/2)
      const centerOffset = isCenteredAnchor 
          ? { x: 0, y: 0 } 
          : { x: width * scaleX / 2, y: height * scaleY / 2 };
      
      const visualCenter = { x: pivot.x + centerOffset.x, y: pivot.y + centerOffset.y };
      
      // Vector from Visual Center to Unrotated External Point (in local axis-aligned space)
      const dx = unrotatedFrom.x - visualCenter.x;
      const dy = unrotatedFrom.y - visualCenter.y;

      // 4. Calculate Intersection 't'
      const t = getIntersectionT(element.type, dx, dy, hw, hh);

      // 5. Calculate Intersection Point in Unrotated Space
      const intersectionRel = { x: dx * t, y: dy * t };
      const intersectionUnrotated = { 
          x: visualCenter.x + intersectionRel.x, 
          y: visualCenter.y + intersectionRel.y 
      };

      // 6. Rotate back to Global Space
      return rotatePoint(intersectionUnrotated, pivot, rotation);
  };

  // --- Selection & Transformer ---
  useEffect(() => {
    if (selectedIds.length > 0 && transformerRef.current && stageRef.current) {
      const selectedNodes = selectedIds.map(id => stageRef.current?.findOne('#' + id)).filter((node): node is Konva.Node => !!node);
      
      if (selectedNodes.length > 0) {
        transformerRef.current.nodes(selectedNodes);
        transformerRef.current.getLayer()?.batchDraw();
      } else {
        transformerRef.current.nodes([]);
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedIds, elements]);

  // --- Handlers ---

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.evt.button === 2) return; // Ignore right click for drawing
    if (editingId) {
       handleTextSubmit();
       return;
    }

    const stage = e.target.getStage();
    const pos = getRelativePointerPosition();
    const clickedOnEmpty = e.target === stage;

    if (tool === 'hand' || e.evt.button === 1) {
      setIsDraggingCanvas(true);
      if(stage) {
        setDragStartPos({ x: stage.x(), y: stage.y() });
      }
      return;
    }

    if (tool === 'select') {
      if (clickedOnEmpty) {
        setSelectedIds([]);
      } else {
         const id = e.target.id();
         if (id) {
             if (e.evt.shiftKey) {
                 if (selectedIds.includes(id)) {
                     setSelectedIds(selectedIds.filter(sid => sid !== id));
                 } else {
                     setSelectedIds([...selectedIds, id]);
                 }
             } else {
                 if (!selectedIds.includes(id)) {
                     setSelectedIds([id]);
                 }
             }
         }
      }
      return;
    }

    if (tool === 'eraser') {
        if (!clickedOnEmpty) {
            const id = e.target.id();
            if (id) {
                setElements(prev => prev.filter(el => el.id !== id));
            }
        }
        return;
    }

    // Drawing Logic
    setSelectedIds([]); 
    setIsDrawing(true);
    
    let startBindingId = undefined;
    if (tool === 'arrow') {
        const shape = e.target;
        if (shape !== stage && shape.id()) {
            startBindingId = shape.id();
        }
    }

    const id = crypto.randomUUID();
    
    // For Lines/Arrows/Scribbles, we use x=0,y=0 and absolute points to avoid double-offset issues
    const isLinear = tool === 'arrow' || tool === 'line' || tool === 'scribble';

    const newElement: CanvasElement = {
      id,
      type: tool,
      x: isLinear ? 0 : pos.x,
      y: isLinear ? 0 : pos.y,
      width: 0,
      height: 0,
      scaleX: 1,
      scaleY: 1,
      strokeColor: currentStyle.strokeColor,
      strokeWidth: currentStyle.strokeWidth,
      fillColor: currentStyle.fillColor,
      opacity: currentStyle.opacity,
      strokeStyle: currentStyle.strokeStyle,
      roughness: currentStyle.roughness,
      edges: currentStyle.edges,
      fontFamily: currentStyle.fontFamily,
      startArrowHead: currentStyle.startArrowHead,
      endArrowHead: currentStyle.endArrowHead,
      arrowType: currentStyle.arrowType,
      rotation: 0,
      points: [pos.x, pos.y], 
      text: tool === 'text' ? 'Type here' : '',
      startBindingId,
    };

    setElements(prev => [...prev, newElement]);
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (isDraggingCanvas) return;
    
    if (tool === 'arrow') {
        const shape = e.target;
        // Don't bind to current arrow being drawn (it might block hit test, so we set listening=false during draw, but just in case)
        if (shape && shape !== e.target.getStage() && shape.id()) {
            setHoveredElementId(shape.id());
        } else {
            setHoveredElementId(null);
        }
    }

    if (!isDrawing) return;

    const pos = getRelativePointerPosition();
    const index = elements.length - 1;
    const element = { ...elements[index] };

    if (element.type === 'rectangle' || element.type === 'circle' || element.type === 'text' || element.type === 'diamond') {
      element.width = pos.x - element.x;
      element.height = pos.y - element.y;
    } else if (element.type === 'scribble') {
      element.points = [...(element.points || []), pos.x, pos.y];
    } else if (element.type === 'arrow' || element.type === 'line') {
        // Ensure we have start and end points
        const startX = element.points![0];
        const startY = element.points![1];
        element.points = [startX, startY, pos.x, pos.y];
    }

    const newElements = [...elements];
    newElements[index] = element;
    setElements(newElements);
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (isDraggingCanvas) {
        setIsDraggingCanvas(false);
        return;
    }
    if (!isDrawing) return;

    setIsDrawing(false);
    setHoveredElementId(null);
    
    const index = elements.length - 1;
    if (index < 0) return;
    
    const lastElement = elements[index];
    let elementDeleted = false;
    
    if (lastElement.type === 'arrow') {
         const shape = e.target;
         const stage = e.target.getStage();
         if (shape && shape !== stage && shape.id() && shape.id() !== lastElement.startBindingId) {
             const updatedElement = { ...lastElement, endBindingId: shape.id() };
             setElements(prev => {
                 const copy = [...prev];
                 copy[index] = updatedElement;
                 return copy;
             });
         }
    }

    if (lastElement.type === 'text') {
        startEditing(lastElement);
    } else if (
         (lastElement.type === 'rectangle' || lastElement.type === 'circle' || lastElement.type === 'diamond') && 
         Math.abs(lastElement.width || 0) < 5 && Math.abs(lastElement.height || 0) < 5
    ) {
        setElements(prev => prev.slice(0, -1));
        elementDeleted = true;
    } else if ((lastElement.type === 'arrow' || lastElement.type === 'line') && lastElement.points && lastElement.points.length < 4) {
         // Prevent tiny lines
         const dx = lastElement.points[2] - lastElement.points[0];
         const dy = lastElement.points[3] - lastElement.points[1];
         if (Math.sqrt(dx*dx + dy*dy) < 5) {
             setElements(prev => prev.slice(0, -1));
             elementDeleted = true;
         }
    }

    if (!elementDeleted) {
        if (!isLocked && tool !== 'select' && tool !== 'hand' && tool !== 'eraser') {
            setTool('select');
            if (lastElement.type !== 'text') {
                setSelectedIds([lastElement.id]);
            }
        }
    }
  };

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    updateZoom(newScale, { x: pointer.x, y: pointer.y }, mousePointTo);
  };
  
  const updateZoom = (newScale: number, pointer: {x: number, y: number} | null = null, mousePointTo: {x: number, y: number} | null = null) => {
    const stage = stageRef.current;
    if (!stage) return;
    if (newScale < 0.1) newScale = 0.1;
    if (newScale > 5) newScale = 5;
    setScale(newScale);

    if (pointer && mousePointTo) {
        setPosition({
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale,
        });
    } else {
        const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        const oldScale = stage.scaleX();
        const stageX = stage.x();
        const stageY = stage.y();
        const centerPointOnCanvas = {
            x: (center.x - stageX) / oldScale,
            y: (center.y - stageY) / oldScale,
        };
        setPosition({
            x: center.x - centerPointOnCanvas.x * newScale,
            y: center.y - centerPointOnCanvas.y * newScale,
        });
    }
  };

  const handleZoomButton = (direction: 'in' | 'out') => {
      const scaleBy = 1.2;
      const newScale = direction === 'in' ? scale * scaleBy : scale / scaleBy;
      updateZoom(newScale);
  };

  const handleTransformEnd = () => {
     if(selectedIds.length > 0 && stageRef.current) {
        setElements(prev => prev.map(el => {
            if(selectedIds.includes(el.id)) {
                const node = stageRef.current?.findOne('#' + el.id);
                if(node) {
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    
                    // Reset scale on node to 1
                    node.scaleX(1);
                    node.scaleY(1);
                    
                    const newScaleX = (el.scaleX || 1) * Math.sign(scaleX);
                    const newScaleY = (el.scaleY || 1) * Math.sign(scaleY);

                    return {
                        ...el,
                        x: node.x(),
                        y: node.y(),
                        rotation: node.rotation(),
                        width: (el.type !== 'scribble' && el.type !== 'arrow' && el.type !== 'line') 
                            ? (el.width || 0) * Math.abs(scaleX) 
                            : el.width,
                        height: (el.type !== 'scribble' && el.type !== 'arrow' && el.type !== 'line') 
                            ? (el.height || 0) * Math.abs(scaleY) 
                            : el.height,
                        scaleX: newScaleX,
                        scaleY: newScaleY
                    }
                }
            }
            return el;
        }));
     }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
      const id = e.target.id();
      const updateEl = (el: CanvasElement) => {
          if (el.id === id || selectedIds.includes(el.id)) {
              return { ...el, x: e.target.x(), y: e.target.y() };
          }
          return el;
      }
      setElements(prev => prev.map(updateEl));
  };

  const startEditing = (element: CanvasElement) => {
    setEditingId(element.id);
    setTextValue(element.text || '');
    const stage = stageRef.current;
    if(!stage) return;
    const textNode = stage.findOne('#' + element.id) as Konva.Text;
    if (textNode) {
        const textPos = textNode.getAbsolutePosition();
        setEditingPosition({
            top: textPos.y, 
            left: textPos.x,
            width: textNode.width() * scale,
            fontSize: (element.width && element.width > 20) ? 20 : 16,
            fontFamily: element.fontFamily || 'Arial'
        });
    } else {
        setEditingPosition({
             top: element.y * scale + position.y,
             left: element.x * scale + position.x,
             width: 100 * scale,
             fontSize: 16,
             fontFamily: element.fontFamily || 'Arial'
        });
    }
  };

  const handleTextSubmit = () => {
      if(!editingId) return;
      setElements(prev => prev.map(el => {
          if(el.id === editingId) {
              return { ...el, text: textValue };
          }
          return el;
      }));
      setEditingId(null);
      setTextValue('');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedIds.length > 0 && !editingId) {
        setElements(prev => prev.filter(el => !selectedIds.includes(el.id)));
        setSelectedIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, editingId, setElements, setSelectedIds]);

  const getRenderElement = (el: CanvasElement) => {
      if (el.type === 'arrow' && el.points) {
          let start = { x: el.points[0], y: el.points[1] };
          let end = { x: el.points[2], y: el.points[3] };
          if (el.startBindingId) {
              const target = elements.find(e => e.id === el.startBindingId);
              if (target) start = getConnectionPoint(target, end);
          }
          if (el.endBindingId) {
              const target = elements.find(e => e.id === el.endBindingId);
              if (target) end = getConnectionPoint(target, start);
          }
          
          let points = [start.x, start.y, end.x, end.y];

          // Compute path based on arrowType
          if (el.arrowType === 'elbow') {
             // Step horizontal first: Start -> (MidX, StartY) -> (MidX, EndY) -> End
             const midX = (start.x + end.x) / 2;
             points = [start.x, start.y, midX, start.y, midX, end.y, end.x, end.y];
          } else if (el.arrowType === 'curved') {
             // For quadratic curve in Konva we need [start, control, end]
             // A simple control point offset from midpoint
             const midX = (start.x + end.x) / 2;
             const midY = (start.y + end.y) / 2;
             const diffX = end.x - start.x;
             const diffY = end.y - start.y;
             // Perpendicular offset
             const offsetX = -diffY * 0.2;
             const offsetY = diffX * 0.2;
             points = [start.x, start.y, midX + offsetX, midY + offsetY, end.x, end.y];
          }

          return { ...el, points };
      }
      return el;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#f3f4f6] cursor-crosshair">
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={onContextMenu}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable={tool === 'hand'}
        className={`${tool === 'hand' ? 'cursor-grab active:cursor-grabbing' : tool === 'select' ? 'cursor-default' : 'cursor-crosshair'}`}
      >
        <Layer>
          {elements.map((rawEl, i) => {
             const element = getRenderElement(rawEl);
             const isBeingDrawn = isDrawing && i === elements.length - 1;
             
             // Base Props for all shapes
             const baseProps = {
                 key: element.id,
                 id: element.id,
                 x: element.x,
                 y: element.y,
                 scaleX: element.scaleX || 1, 
                 scaleY: element.scaleY || 1,
                 rotation: element.rotation,
                 opacity: element.opacity,
                 draggable: tool === 'select' && !element.startBindingId && !element.endBindingId,
                 onDragEnd: handleDragEnd,
                 onTransformEnd: handleTransformEnd,
                 listening: !isBeingDrawn,
                 onClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
                     if (tool === 'eraser') { e.cancelBubble = true; }
                     if (tool === 'select') {
                         e.cancelBubble = true;
                         const id = element.id;
                         if (e.evt.shiftKey) {
                             if(selectedIds.includes(id)) setSelectedIds(selectedIds.filter(sid => sid !== id));
                             else setSelectedIds([...selectedIds, id]);
                         } else {
                             setSelectedIds([id]);
                         }
                     }
                 },
                 onTap: (e: Konva.KonvaEventObject<TouchEvent>) => {
                     if (tool === 'select') { e.cancelBubble = true; setSelectedIds([element.id]); }
                 }
             };

             // Shadow/Stroke visual props
             const styleProps = {
                 stroke: element.strokeColor,
                 strokeWidth: element.strokeWidth,
                 dash: getDashArray(element.strokeStyle, element.strokeWidth),
                 shadowColor: hoveredElementId === element.id ? '#3b82f6' : 'black',
                 shadowBlur: hoveredElementId === element.id ? 15 : (element.roughness > 0 ? 5 : 0), 
                 shadowOpacity: hoveredElementId === element.id ? 0.6 : (element.roughness > 0 ? 0.3 : 0),
                 shadowOffset: hoveredElementId === element.id ? {x:0,y:0} : { x: element.roughness, y: element.roughness },
                 hitStrokeWidth: 20,
             };

             if (element.type === 'rectangle') {
               return <Rect {...baseProps} {...styleProps} width={element.width} height={element.height} fill={element.fillColor} cornerRadius={element.edges === 'round' ? 10 : 0} />;
             } else if (element.type === 'diamond') {
                 const w = element.width || 0;
                 const h = element.height || 0;
                 const size = Math.max(Math.abs(w), Math.abs(h));
                 return (
                     <RegularPolygon 
                        {...baseProps}
                        {...styleProps}
                        sides={4}
                        radius={size / 1.414}
                        scaleX={(w / size) * (element.scaleX || 1)} 
                        scaleY={(h / size) * (element.scaleY || 1)}
                        fill={element.fillColor}
                        offsetX={-w/2}
                        offsetY={-h/2}
                     />
                 );
             } else if (element.type === 'circle') {
               return <Circle {...baseProps} {...styleProps} radius={Math.abs((element.width || 0) + (element.height || 0)) / 4} fill={element.fillColor} offsetX={-(element.width || 0)/2} offsetY={-(element.height || 0)/2} />;
             } else if (element.type === 'scribble') {
                 return <Line {...baseProps} {...styleProps} points={element.points} tension={element.edges === 'round' ? 0.5 : 0} lineCap={element.edges === 'round' ? 'round' : 'butt'} lineJoin={element.edges === 'round' ? 'round' : 'miter'} fill={undefined} />;
             } else if (element.type === 'arrow') {
                 const points = element.points || [];
                 const startHead = element.startArrowHead || 'none';
                 const endHead = element.endArrowHead || 'arrow';
                 const dotRadius = element.strokeWidth + 2;
                 const arrowType = element.arrowType || 'straight';
                 const tension = arrowType === 'curved' ? 0.5 : 0;
                 
                 // Dots need to be at actual start/end, which might be different index depending on arrow type geometry
                 const startX = points[0];
                 const startY = points[1];
                 const endX = points[points.length - 2];
                 const endY = points[points.length - 1];

                 return (
                    <Group {...baseProps}>
                        <Arrow 
                            points={points}
                            stroke={styleProps.stroke}
                            strokeWidth={styleProps.strokeWidth}
                            dash={styleProps.dash}
                            fill={element.strokeColor}
                            pointerLength={10}
                            pointerWidth={10}
                            tension={tension}
                            lineCap={element.edges === 'round' ? 'round' : 'butt'}
                            lineJoin={element.edges === 'round' ? 'round' : 'miter'}
                            pointerAtBeginning={startHead === 'arrow'}
                            pointerAtEnding={endHead === 'arrow'}
                            hitStrokeWidth={20}
                            shadowColor={styleProps.shadowColor}
                            shadowBlur={styleProps.shadowBlur}
                            shadowOpacity={styleProps.shadowOpacity}
                            shadowOffset={styleProps.shadowOffset}
                        />
                        {startHead === 'dot' && points.length >= 2 && (
                            <Circle 
                                x={startX} 
                                y={startY} 
                                radius={dotRadius} 
                                fill={element.strokeColor} 
                            />
                        )}
                        {endHead === 'dot' && points.length >= 2 && (
                            <Circle 
                                x={endX} 
                                y={endY} 
                                radius={dotRadius} 
                                fill={element.strokeColor} 
                            />
                        )}
                    </Group>
                 );
             } else if (element.type === 'line') {
                 return <Line {...baseProps} {...styleProps} points={element.points} lineCap={element.edges === 'round' ? 'round' : 'butt'} lineJoin={element.edges === 'round' ? 'round' : 'miter'} />;
             } else if (element.type === 'text') {
                 return <Text {...baseProps} {...styleProps} text={element.text} fontSize={20} fontFamily={element.fontFamily || 'Arial'} fill={element.strokeColor} stroke={undefined} visible={editingId !== element.id} onDblClick={() => startEditing(element)} />;
             } else if (element.type === 'image' && element.imageUrl) {
                 return <URLImage element={element} {...baseProps} />;
             }
             return null;
          })}

          <Transformer ref={transformerRef} boundBoxFunc={(oldBox, newBox) => newBox.width < 5 || newBox.height < 5 ? oldBox : newBox} />
        </Layer>
      </Stage>
      
      {editingId && (
          <textarea
             value={textValue}
             onChange={(e) => setTextValue(e.target.value)}
             onBlur={handleTextSubmit}
             onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextSubmit(); } }}
             autoFocus
             style={{
                 position: 'absolute', top: editingPosition.top, left: editingPosition.left,
                 fontSize: `${20 * scale}px`, lineHeight: 1.2, fontFamily: editingPosition.fontFamily,
                 color: elements.find(e => e.id === editingId)?.strokeColor,
                 border: '1px dashed blue', background: 'rgba(255,255,255,0.8)',
                 padding: '4px', margin: 0, outline: 'none', minWidth: '100px',
                 resize: 'none', overflow: 'hidden', zIndex: 100, transformOrigin: 'top left',
             }}
          />
      )}
      
      <div className="absolute bottom-4 left-4 flex items-center bg-white/90 backdrop-blur rounded-lg shadow border border-gray-200 p-1 gap-2 z-50">
          <button onClick={() => handleZoomButton('out')} className="p-1 hover:bg-gray-100 rounded text-gray-600" title="Zoom Out"><ZoomOut size={16} /></button>
          <span className="text-xs font-medium text-gray-600 w-10 text-center select-none">{Math.round(scale * 100)}%</span>
          <button onClick={() => handleZoomButton('in')} className="p-1 hover:bg-gray-100 rounded text-gray-600" title="Zoom In"><ZoomIn size={16} /></button>
      </div>
    </div>
  );
};
