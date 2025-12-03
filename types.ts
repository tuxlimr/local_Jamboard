export type ToolType = 'select' | 'hand' | 'rectangle' | 'diamond' | 'circle' | 'arrow' | 'line' | 'scribble' | 'text' | 'image' | 'eraser';

export type ArrowHead = 'none' | 'arrow' | 'dot';
export type ArrowType = 'straight' | 'curved' | 'elbow';

export interface Point {
  x: number;
  y: number;
}

export interface CanvasElement {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[]; // For lines/arrows/scribbles
  text?: string;     // For text elements
  
  // Style Props
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  opacity: number; // 0-1
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  roughness: number; // 0 (clean) - 2 (sketchy)
  edges: 'sharp' | 'round';
  fontFamily: string;
  
  rotation: number;
  scaleX?: number; // For flipping (1 or -1 usually)
  scaleY?: number;

  // Arrow specific
  startArrowHead?: ArrowHead;
  endArrowHead?: ArrowHead;
  arrowType?: ArrowType;

  // Connections
  startBindingId?: string;
  endBindingId?: string;
}

export interface AppState {
  elements: CanvasElement[];
  selectedIds: string[];
  tool: ToolType;
  // Viewport state
  scale: number;
  offset: Point;
}

export interface ShapeStyle {
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  opacity: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  roughness: number;
  edges: 'sharp' | 'round';
  fontFamily: string;
  startArrowHead: ArrowHead;
  endArrowHead: ArrowHead;
  arrowType: ArrowType;
}