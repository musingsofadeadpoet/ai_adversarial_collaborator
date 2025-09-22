export interface MindMapNode {
  id: string;
  content: string;
  type: 'sticky-note' | 'text' | 'image' | 'icon' | 'drawing' | 'shape';
  shape?: 'rectangle' | 'circle' | 'sticky-note' | 'line' | 'arrow' | 'star' | 'triangle' | 'pentagon' | 'hexagon' | 'octagon';
  textType?: 'heading' | 'body' | 'comment';
  color: string;
  iconName?: string;
  imageUrl?: string;
  drawingPath?: string;
  drawingBounds?: { minX: number; minY: number; maxX: number; maxY: number };
  // Text formatting properties
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  linkUrl?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Connection {
  id: string;
  type: 'straight' | 'curved' | 'elbow' | 'dotted';
  fromNode?: string; // Optional - allows freeform connectors
  toNode?: string;   // Optional - allows freeform connectors
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromPoint?: ConnectionPoint;
  toPoint?: ConnectionPoint;
}

export interface ConnectionPoint {
  id: string;
  x: number;
  y: number;
  position: 'top' | 'right' | 'bottom' | 'left';
}

export interface DragPreview {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isActive: boolean;
}

export interface DrawingStroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  id: string;
}

export type Tool = 'select' | 'sticky-note' | 'text' | 'connection' | 'icon' | 'image' | 'draw' | 'shape' | 'delete';
export type DrawingTool = 'pen' | 'brush' | 'eraser';

export interface MindMapProps {
  externalNodes?: MindMapNode[];
  onNodesChange?: (nodes: MindMapNode[]) => void;
  onMaximize?: () => void;
  hideHeader?: boolean;
}