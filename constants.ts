import { ShapeStyle, ToolType } from './types';
import { 
  MousePointer2, 
  Hand, 
  Square, 
  Circle, 
  ArrowRight, 
  Minus, 
  Pencil, 
  Type, 
  Image as ImageIcon, 
  Eraser, 
  Diamond 
} from 'lucide-react';

export const TOOLS: { id: ToolType; icon: any; label: string; key: string }[] = [
  // Group 1: Navigation/Select
  { id: 'hand', icon: Hand, label: 'Pan', key: 'H' },
  { id: 'select', icon: MousePointer2, label: 'Selection', key: '1' },
  // Group 2: Shapes
  { id: 'rectangle', icon: Square, label: 'Rectangle', key: '2' },
  { id: 'diamond', icon: Diamond, label: 'Diamond', key: '3' },
  { id: 'circle', icon: Circle, label: 'Circle', key: '4' },
  { id: 'arrow', icon: ArrowRight, label: 'Arrow', key: '5' },
  { id: 'line', icon: Minus, label: 'Line', key: '6' },
  // Group 3: Draw/Text/etc
  { id: 'scribble', icon: Pencil, label: 'Draw', key: '7' },
  { id: 'text', icon: Type, label: 'Text', key: '8' },
  { id: 'image', icon: ImageIcon, label: 'Image', key: '9' },
  { id: 'eraser', icon: Eraser, label: 'Eraser', key: '0' },
];

export const COLORS = [
  '#000000', // Black
  '#343a40', // Dark Gray
  '#495057', // Gray
  '#c92a2a', // Red
  '#a61e4d', // Pink
  '#862e9c', // Grape
  '#5f3dc4', // Violet
  '#364fc7', // Indigo
  '#1864ab', // Blue
  '#0b7285', // Cyan
  '#087f5b', // Teal
  '#2b8a3e', // Green
  '#5c940d', // Lime
  '#e67700', // Yellow
  '#d9480f', // Orange
];

export const BACKGROUND_COLORS = [
  'transparent',
  '#f8f9fa',
  '#fff5f5',
  '#fff0f6',
  '#f3f0ff',
  '#edf2ff',
  '#e3fafc',
  '#e6fcf5',
  '#ebfbee',
  '#fff9db',
  '#fff4e6',
];

export const FONTS = [
  'Arial',
  'Verdana',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Comic Sans MS',
  'Trebuchet MS',
  'Impact',
  'Lucida Console',
  'Tahoma',
  'Segoe UI',
  'Helvetica',
  'Excalifont' // Placeholder if we had custom fonts
];

export const DEFAULT_STYLE: ShapeStyle = {
  strokeColor: '#000000',
  strokeWidth: 2,
  fillColor: 'transparent',
  opacity: 1,
  strokeStyle: 'solid',
  roughness: 0,
  edges: 'sharp',
  fontFamily: 'Arial',
  startArrowHead: 'none',
  endArrowHead: 'arrow',
  arrowType: 'straight',
};

export const GRID_SIZE = 20;