import { MindMapNode, Connection, ConnectionPoint } from './types';

// Calculate connection points for a node
export const getConnectionPoints = (node: MindMapNode): ConnectionPoint[] => {
  const { x, y, width, height } = node;
  return [
    { id: 'top', x: x + width / 2, y: y, position: 'top' },
    { id: 'right', x: x + width, y: y + height / 2, position: 'right' },
    { id: 'bottom', x: x + width / 2, y: y + height, position: 'bottom' },
    { id: 'left', x: x, y: y + height / 2, position: 'left' }
  ];
};

// Find the closest connection point to a given coordinate
export const findClosestConnectionPoint = (nodes: MindMapNode[], nodeId: string, targetX: number, targetY: number): ConnectionPoint | null => {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return null;

  const points = getConnectionPoints(node);
  let closestPoint = points[0];
  let minDistance = Math.hypot(points[0].x - targetX, points[0].y - targetY);

  for (const point of points) {
    const distance = Math.hypot(point.x - targetX, point.y - targetY);
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = point;
    }
  }

  return closestPoint;
};

// Generate SVG path for different connection types
export const generateConnectionPath = (connection: Connection): string => {
  const { fromX, fromY, toX, toY, type } = connection;

  switch (type) {
    case 'straight':
      return `M ${fromX} ${fromY} L ${toX} ${toY}`;
    
    case 'curved':
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;
      const controlX = midX + (fromY - toY) * 0.3;
      const controlY = midY + (toX - fromX) * 0.3;
      return `M ${fromX} ${fromY} Q ${controlX} ${controlY} ${toX} ${toY}`;
    
    case 'elbow':
      const elbowX = fromX + (toX - fromX) * 0.5;
      return `M ${fromX} ${fromY} L ${elbowX} ${fromY} L ${elbowX} ${toY} L ${toX} ${toY}`;
    
    case 'dotted':
      return `M ${fromX} ${fromY} L ${toX} ${toY}`;
    
    default:
      return `M ${fromX} ${fromY} L ${toX} ${toY}`;
  }
};

// Helper function to get default placeholder text
export const getDefaultPlaceholder = (textType: MindMapNode['textType']) => {
  switch (textType) {
    case 'heading':
      return 'Type your heading...';
    case 'body':
      return 'Type your paragraph...';
    case 'comment':
      return 'Type your comment...';
    default:
      return 'Type your text...';
  }
};

// Helper function to convert global mouse coordinates to canvas coordinates
export const getCanvasCoordinatesFromGlobal = (mapRef: React.RefObject<HTMLDivElement>, clientX: number, clientY: number, zoom: number = 1) => {
  if (!mapRef.current) return { x: 0, y: 0 };
  const rect = mapRef.current.getBoundingClientRect();
  return {
    x: (clientX - rect.left) / zoom,
    y: (clientY - rect.top) / zoom
  };
};

// Helper function to check if mouse coordinates are within the canvas bounds
export const isMouseOverCanvas = (mapRef: React.RefObject<HTMLDivElement>, clientX: number, clientY: number) => {
  if (!mapRef.current) return false;
  const rect = mapRef.current.getBoundingClientRect();
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
};

// Helper function to get canvas coordinates from mouse event
export const getCanvasCoordinates = (mapRef: React.RefObject<HTMLDivElement>, e: React.MouseEvent, zoom: number = 1) => {
  if (!mapRef.current) return { x: 0, y: 0 };
  const rect = mapRef.current.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / zoom,
    y: (e.clientY - rect.top) / zoom
  };
};