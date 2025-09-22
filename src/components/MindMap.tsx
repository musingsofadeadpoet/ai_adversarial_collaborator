import React, { useState, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { 
  X, Plus, MousePointer, Square, Circle, StickyNote, 
  Type, MessageSquare, ArrowRight, Star, Triangle, Image as ImageIcon,
  Palette, Undo, Redo, ZoomIn, ZoomOut, Move, Trash2, Pencil,
  Heart, Lightbulb, Target, Flag, Bookmark, Mail, Phone, Home,
  User, Calendar, Clock, MapPin, Wifi, Battery, Camera, Music,
  Smile, ThumbsUp, Coffee, Car, Plane, Gift, Bell, Settings,
  Minus, ArrowUp, ArrowDown, ArrowLeft, ArrowUpRight, ArrowDownLeft,
  CornerDownRight, MoreHorizontal, Pentagon, Hexagon, Octagon,
  Eraser, Brush, PenTool, Droplet, Waves, ChevronDown, Maximize2,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Link2, Hash, Eye, Info
} from 'lucide-react';

// Import our extracted modules
import { colorOptions, drawingColors, textTypes, connectionTypes, shapeTypes, iconOptions } from './MindMap/constants';
import { MindMapNode, Connection, ConnectionPoint, DragPreview, DrawingStroke, Tool, DrawingTool, MindMapProps } from './MindMap/types';
import { 
  getConnectionPoints, 
  findClosestConnectionPoint, 
  generateConnectionPath, 
  getDefaultPlaceholder,
  getCanvasCoordinates,
  getCanvasCoordinatesFromGlobal,
  isMouseOverCanvas
} from './MindMap/utils';

export function MindMap({ externalNodes = [], onNodesChange, onMaximize, hideHeader = false }: MindMapProps) {
  const [nodes, setNodes] = useState<MindMapNode[]>([...externalNodes]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  const [selectedShape, setSelectedShape] = useState<MindMapNode['shape']>('rectangle');
  const [selectedTextType, setSelectedTextType] = useState<MindMapNode['textType']>('body');
  // FIXED: Initialize with Yellow color instead of first color
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].value); // This should be Yellow
  const [selectedIcon, setSelectedIcon] = useState('lightbulb');
  const [selectedConnectionType, setSelectedConnectionType] = useState('straight');
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [newNodeContent, setNewNodeContent] = useState('');
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [enableConnectorPoints, setEnableConnectorPoints] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  // ENHANCED: Connection preview with direction and size indicators
  const [connectionPreview, setConnectionPreview] = useState<{
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    fromNodeId?: string | null;
    toNodeId?: string | null;
    distance?: number;
    angle?: number;
  } | null>(null);
  const [isDraggingConnection, setIsDraggingConnection] = useState(false);
  const [connectionDragStart, setConnectionDragStart] = useState<{ nodeId: string | null; x: number; y: number } | null>(null);

  // ENHANCED: Connection dragging and editing states
  const [draggedConnection, setDraggedConnection] = useState<string | null>(null);
  const [connectionDragType, setConnectionDragType] = useState<'from' | 'to' | 'whole' | 'fromHandle' | 'toHandle' | null>(null);
  const [connectionDragOffset, setConnectionDragOffset] = useState({ x: 0, y: 0 });

  // Drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [drawingStrokes, setDrawingStrokes] = useState<DrawingStroke[]>([]);
  const [drawingHistory, setDrawingHistory] = useState<DrawingStroke[][]>([]);
  const [drawingHistoryIndex, setDrawingHistoryIndex] = useState(-1);
  const [showDrawingToolbar, setShowDrawingToolbar] = useState(false);
  const [currentDrawingTool, setCurrentDrawingTool] = useState<DrawingTool>('pen');
  const [brushSize, setBrushSize] = useState(3);
  const [drawingColor, setDrawingColor] = useState('#000000');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // Mind map undo/redo states
  const [mindMapHistory, setMindMapHistory] = useState<{nodes: MindMapNode[], connections: Connection[]}[]>([]);
  const [mindMapHistoryIndex, setMindMapHistoryIndex] = useState(-1);

  // Eraser state
  const [eraserPosition, setEraserPosition] = useState<{ x: number; y: number } | null>(null);
  const [hasErasingStarted, setHasErasingStarted] = useState(false);

  // Drag-to-create states
  const [dragPreview, setDragPreview] = useState<DragPreview>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isActive: false
  });
  const [isCreatingByDrag, setIsCreatingByDrag] = useState(false);

  // Dialog states
  const [isStickyNotePickerOpen, setIsStickyNotePickerOpen] = useState(false);
  const [isTextPickerOpen, setIsTextPickerOpen] = useState(false);
  const [isConnectionPickerOpen, setIsConnectionPickerOpen] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isShapePickerOpen, setIsShapePickerOpen] = useState(false);
  const [activeShapeTab, setActiveShapeTab] = useState<MindMapNode['shape']>('sticky-note');

  // Text formatting toolbar states
  const [editingFormattingToolbarPosition, setEditingFormattingToolbarPosition] = useState({ x: 0, y: 0 });
  const [isInteractingWithToolbar, setIsInteractingWithToolbar] = useState(false);

  // Resize handle states
  const [resizingNode, setResizingNode] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null>(null);
  const [resizeStartPosition, setResizeStartPosition] = useState({ x: 0, y: 0 });
  const [resizeStartDimensions, setResizeStartDimensions] = useState({ width: 0, height: 0, x: 0, y: 0 });

  const mapRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDraggingRef = useRef(false);

  const updateNodes = useCallback((newNodes: MindMapNode[]) => {
    setNodes(newNodes);
    onNodesChange?.(newNodes);
  }, [onNodesChange]);

  // Save current state to history
  const saveMindMapState = useCallback(() => {
    const currentState = { nodes: [...nodes], connections: [...connections] };
    const newHistory = mindMapHistory.slice(0, mindMapHistoryIndex + 1);
    newHistory.push(currentState);
    
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setMindMapHistoryIndex(newHistory.length - 1);
    }
    
    setMindMapHistory(newHistory);
    if (newHistory.length <= 50) {
      setMindMapHistoryIndex(newHistory.length - 1);
    }
  }, [nodes, connections, mindMapHistory, mindMapHistoryIndex]);

  // Undo mind map action
  const undoMindMap = useCallback(() => {
    if (mindMapHistoryIndex > 0) {
      const newIndex = mindMapHistoryIndex - 1;
      const previousState = mindMapHistory[newIndex];
      setNodes(previousState.nodes);
      setConnections(previousState.connections);
      setMindMapHistoryIndex(newIndex);
      onNodesChange?.(previousState.nodes);
    }
  }, [mindMapHistory, mindMapHistoryIndex, onNodesChange]);

  // Redo mind map action
  const redoMindMap = useCallback(() => {
    if (mindMapHistoryIndex < mindMapHistory.length - 1) {
      const newIndex = mindMapHistoryIndex + 1;
      const nextState = mindMapHistory[newIndex];
      setNodes(nextState.nodes);
      setConnections(nextState.connections);
      setMindMapHistoryIndex(newIndex);
      onNodesChange?.(nextState.nodes);
    }
  }, [mindMapHistory, mindMapHistoryIndex, onNodesChange]);

  // ENHANCED: Clear connection state with preview cleanup
  const clearConnectionState = useCallback(() => {
    setConnectingFrom(null);
    setConnectionPreview(null); // Re-enabled for better UX
    setIsDraggingConnection(false);
    setConnectionDragStart(null);
    setHoveredNode(null);
    // DON'T automatically switch to select tool - let user continue using connection tool
    // setSelectedTool('select');
  }, []);

  // FIXED: Create connection - preserves exact drag start position when appropriate
  const createConnection = (fromNodeId: string | null, toNodeId: string | null, fromX: number, fromY: number, toX: number, toY: number, preserveExactStart: boolean = false) => {
    if (fromNodeId && toNodeId && fromNodeId === toNodeId) return; // Can't connect to self

    let finalFromX = fromX;
    let finalFromY = fromY;
    let finalToX = toX;
    let finalToY = toY;
    let fromPoint: ConnectionPoint | null = null;
    let toPoint: ConnectionPoint | null = null;

    // Handle from node - only snap to center if NOT preserving exact start position
    if (fromNodeId && !preserveExactStart) {
      const fromNode = nodes.find(n => n.id === fromNodeId);
      if (fromNode) {
        if (enableConnectorPoints) {
          fromPoint = findClosestConnectionPoint(nodes, fromNodeId, toX, toY);
          if (fromPoint) {
            finalFromX = fromPoint.x;
            finalFromY = fromPoint.y;
          } else {
            finalFromX = fromNode.x + fromNode.width / 2;
            finalFromY = fromNode.y + fromNode.height / 2;
          }
        } else {
          finalFromX = fromNode.x + fromNode.width / 2;
          finalFromY = fromNode.y + fromNode.height / 2;
        }
      }
    }
    // If preserveExactStart is true, keep the fromX, fromY as provided

    // Handle to node
    if (toNodeId) {
      const toNode = nodes.find(n => n.id === toNodeId);
      if (toNode) {
        if (enableConnectorPoints) {
          toPoint = findClosestConnectionPoint(nodes, toNodeId, finalFromX, finalFromY);
          if (toPoint) {
            finalToX = toPoint.x;
            finalToY = toPoint.y;
          } else {
            finalToX = toNode.x + toNode.width / 2;
            finalToY = toNode.y + toNode.height / 2;
          }
        } else {
          finalToX = toNode.x + toNode.width / 2;
          finalToY = toNode.y + toNode.height / 2;
        }
      }
    }

    const newConnection: Connection = {
      id: Date.now().toString(),
      type: selectedConnectionType as Connection['type'],
      fromNode: fromNodeId || undefined,
      toNode: toNodeId || undefined,
      fromX: finalFromX,
      fromY: finalFromY,
      toX: finalToX,
      toY: finalToY,
      fromPoint: enableConnectorPoints ? fromPoint : undefined,
      toPoint: enableConnectorPoints ? toPoint : undefined
    };

    saveMindMapState();
    setConnections(prev => [...prev, newConnection]);
    
    // Clear all connection states
    clearConnectionState();
  };

  // Remove connection
  const removeConnection = (connectionId: string) => {
    saveMindMapState();
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    if (selectedConnection === connectionId) {
      setSelectedConnection(null);
    }
  };

  // Update connection position
  const updateConnectionPosition = (connectionId: string, updates: Partial<Connection>) => {
    setConnections(prev => prev.map(conn => 
      conn.id === connectionId ? { ...conn, ...updates } : conn
    ));
  };

  const saveDrawingState = () => {
    const newHistory = drawingHistory.slice(0, drawingHistoryIndex + 1);
    newHistory.push([...drawingStrokes]);
    setDrawingHistory(newHistory);
    setDrawingHistoryIndex(newHistory.length - 1);
  };

  const undoDrawing = () => {
    if (drawingHistoryIndex > 0) {
      setDrawingHistoryIndex(drawingHistoryIndex - 1);
      setDrawingStrokes([...drawingHistory[drawingHistoryIndex - 1]]);
    } else if (drawingHistoryIndex === 0) {
      setDrawingHistoryIndex(-1);
      setDrawingStrokes([]);
    }
  };

  const redoDrawing = () => {
    if (drawingHistoryIndex < drawingHistory.length - 1) {
      setDrawingHistoryIndex(drawingHistoryIndex + 1);
      setDrawingStrokes([...drawingHistory[drawingHistoryIndex + 1]]);
    }
  };

  // Smooth erasing function
  const applyHoverErasing = (eraserPoint: { x: number; y: number }) => {
    if (!eraserPoint) return;

    let hasChanges = false;
    const newStrokes: DrawingStroke[] = [];
    
    for (const stroke of drawingStrokes) {
      const filteredPoints = stroke.points.filter(point => {
        const distance = Math.sqrt(
          Math.pow(point.x - eraserPoint.x, 2) + Math.pow(point.y - eraserPoint.y, 2)
        );
        return distance > brushSize / 2;
      });

      if (filteredPoints.length === 0) {
        hasChanges = true;
      } else if (filteredPoints.length !== stroke.points.length) {
        hasChanges = true;
        
        const segments: { x: number; y: number }[][] = [];
        let currentSegment: { x: number; y: number }[] = [];
        
        for (let i = 0; i < stroke.points.length; i++) {
          const point = stroke.points[i];
          if (filteredPoints.includes(point)) {
            currentSegment.push(point);
          } else {
            if (currentSegment.length > 1) {
              segments.push([...currentSegment]);
            }
            currentSegment = [];
          }
        }
        
        if (currentSegment.length > 1) {
          segments.push(currentSegment);
        }
        
        segments.forEach((segment, index) => {
          if (segment.length > 1) {
            newStrokes.push({
              ...stroke,
              points: segment,
              id: `${stroke.id}_segment_${index}_${Date.now()}`
            });
          }
        });
      } else {
        newStrokes.push(stroke);
      }
    }
    
    if (hasChanges) {
      setDrawingStrokes(newStrokes);
      
      if (!hasErasingStarted) {
        saveDrawingState();
        setHasErasingStarted(true);
      }
    }
  };

  // DEBUGGED: Create node from drag with detailed logging and color application
  const createNodeFromDrag = () => {
    if (!dragPreview.isActive) return;

    const { startX, startY, currentX, currentY } = dragPreview;
    
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.max(Math.abs(currentX - startX), 50);
    const height = Math.max(Math.abs(currentY - startY), 30);

    let content = newNodeContent;
    let nodeType: MindMapNode['type'] = 'sticky-note';

    if (selectedTool === 'text') {
      nodeType = 'text';
      content = content || getDefaultPlaceholder(selectedTextType);
    } else if (selectedTool === 'sticky-note') {
      nodeType = 'sticky-note';
      content = content || 'New note';
    }

    // DEBUG: Log the selected color to verify it's correct
    console.log('Creating node with selectedColor:', selectedColor);
    console.log('Color options:', colorOptions);
    console.log('Selected tool:', selectedTool, 'Node type:', nodeType);

    const newNode: MindMapNode = {
      id: Date.now().toString(),
      content,
      type: nodeType,
      shape: nodeType === 'sticky-note' ? selectedShape : undefined,
      textType: nodeType === 'text' ? selectedTextType : undefined,
      // FIXED: Always use transparent background for all text types
      color: nodeType === 'text' ? 'bg-transparent border-transparent text-gray-900' : selectedColor,
      fontSize: nodeType === 'text' && selectedTextType === 'heading' ? 18 : 14,
      fontWeight: nodeType === 'text' && selectedTextType === 'heading' ? 'bold' : 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'center',
      textColor: '#1f2937',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      x,
      y,
      width,
      height
    };

    console.log('Created node with color:', newNode.color);

    saveMindMapState();
    updateNodes([...nodes, newNode]);
    setNewNodeContent('');
    setDragPreview({ startX: 0, startY: 0, currentX: 0, currentY: 0, isActive: false });
    setIsCreatingByDrag(false);
    setIsAddingNode(false);
    setSelectedTool('select');
  };

  // DEBUGGED: Add node with proper color application
  const addNode = (x: number, y: number, nodeType: MindMapNode['type'] = 'sticky-note') => {
    if (selectedTool !== 'icon') return;

    console.log('Adding icon node with selectedColor:', selectedColor);

    const newNode: MindMapNode = {
      id: Date.now().toString(),
      content: '',
      type: nodeType,
      // FIXED: Use the selectedColor that was set from the picker
      color: selectedColor,
      iconName: nodeType === 'icon' ? selectedIcon : undefined,
      x,
      y,
      width: 60,
      height: 60
    };

    console.log('Created icon node with color:', newNode.color);

    saveMindMapState();
    updateNodes([...nodes, newNode]);
    setNewNodeContent('');
    setIsAddingNode(false);
    setSelectedTool('select');
  };

  const removeNode = (nodeId: string) => {
    saveMindMapState();
    updateNodes(nodes.filter(node => node.id !== nodeId));
    setConnections(prev => prev.filter(conn => 
      (conn.fromNode !== nodeId && conn.toNode !== nodeId) || 
      (!conn.fromNode && !conn.toNode)
    ));
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
  };

  const deleteSelectedObject = () => {
    if (selectedNode) {
      const node = nodes.find(n => n.id === selectedNode);
      if (node && node.type !== 'drawing') {
        removeNode(selectedNode);
      }
    } else if (selectedConnection) {
      removeConnection(selectedConnection);
    }
  };

  const updateNodeContent = (nodeId: string, content: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node && node.content !== content) {
      saveMindMapState();
    }
    updateNodes(nodes.map(node => 
      node.id === nodeId ? { ...node, content } : node
    ));
  };

  const updateNodeFormatting = (nodeId: string, formatting: Partial<MindMapNode>) => {
    console.log('📋 updateNodeFormatting called:', { nodeId, formatting });
    
    // First save the current state for undo
    saveMindMapState();
    
    // Update the nodes with the new formatting
    const updatedNodes = nodes.map(node => 
      node.id === nodeId ? { ...node, ...formatting } : node
    );
    
    console.log('📋 Updated nodes with formatting:', formatting);
    updateNodes(updatedNodes);
  };

  // Text formatting functions
  const toggleBold = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const newWeight = node.fontWeight === 'bold' ? 'normal' : 'bold';
    updateNodeFormatting(nodeId, { fontWeight: newWeight });
  };

  const toggleItalic = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const newStyle = node.fontStyle === 'italic' ? 'normal' : 'italic';
    updateNodeFormatting(nodeId, { fontStyle: newStyle });
  };

  const toggleUnderline = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const newDecoration = node.textDecoration === 'underline' ? 'none' : 'underline';
    updateNodeFormatting(nodeId, { textDecoration: newDecoration });
  };

  const changeTextAlign = (nodeId: string, alignment: 'left' | 'center' | 'right') => {
    updateNodeFormatting(nodeId, { textAlign: alignment });
  };

  const changeFontSize = (nodeId: string, size: number) => {
    console.log('🎯 changeFontSize called:', { nodeId, size });
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
      console.log('❌ Node not found for font size change:', nodeId);
      return;
    }
    
    console.log('📝 Before update - Current node fontSize:', node.fontSize, 'New size:', size);
    
    // Use callback to ensure we get the latest state
    setNodes(prev => {
      const updatedNodes = prev.map(n => 
        n.id === nodeId ? { ...n, fontSize: size } : n
      );
      console.log('✅ Nodes updated with new fontSize:', size);
      // Trigger external update with the new nodes
      onNodesChange?.(updatedNodes);
      return updatedNodes;
    });
    
    // Also call the updateNodeFormatting for consistency
    updateNodeFormatting(nodeId, { fontSize: size });
    
    console.log('🔄 Font size change completed');
  };

  const changeTextColor = (nodeId: string, color: string) => {
    updateNodeFormatting(nodeId, { textColor: color });
  };

  const addLink = (nodeId: string, url: string) => {
    updateNodeFormatting(nodeId, { 
      linkUrl: url,
      textDecoration: 'underline',
      textColor: '#2563eb' // blue-600
    });
  };

  const removeLink = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    updateNodeFormatting(nodeId, { 
      linkUrl: undefined,
      textDecoration: 'none',
      textColor: node.textColor || '#1f2937' // restore original color
    });
  };

  const calculateEditingToolbarPosition = (node: MindMapNode) => {
    if (!mapRef.current) return { x: window.innerWidth / 2, y: 100 };
    
    const rect = mapRef.current.getBoundingClientRect();
    const nodeScreenX = rect.left + (node.x * zoom) + (node.width * zoom) / 2;
    const nodeScreenY = rect.top + (node.y * zoom);
    
    // Calculate position relative to viewport for the toolbar
    const toolbarWidth = 400; // Approximate toolbar width
    const toolbarHeight = 40; // Approximate toolbar height
    
    let x = nodeScreenX;
    let y = nodeScreenY - toolbarHeight - 10; // Position above the node
    
    // Keep toolbar within viewport bounds
    if (x + toolbarWidth > window.innerWidth - 20) {
      x = window.innerWidth - toolbarWidth - 20;
    }
    if (x < 20) {
      x = 20;
    }
    
    // If toolbar would be above viewport, position it below the node
    if (y < 20) {
      y = nodeScreenY + (node.height * zoom) + 10;
    }
    
    return { x, y };
  };

  const exitEditMode = () => {
    setEditingNode(null);
    setIsInteractingWithToolbar(false);
  };

  // Smart exit edit mode that checks if user is interacting with toolbar
  const handleTextareaBlur = () => {
    // Delay the exit to allow toolbar interactions to register
    setTimeout(() => {
      if (!isInteractingWithToolbar) {
        exitEditMode();
      }
    }, 150);
  };

  // Function to check if point is near connection line
  const isPointNearConnection = (connection: Connection, x: number, y: number, threshold: number = 10) => {
    const { fromX, fromY, toX, toY } = connection;
    
    // Calculate distance from point to line segment
    const A = x - fromX;
    const B = y - fromY;
    const C = toX - fromX;
    const D = toY - fromY;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return false; // Line has no length

    const param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = fromX;
      yy = fromY;
    } else if (param > 1) {
      xx = toX;
      yy = toY;
    } else {
      xx = fromX + param * C;
      yy = fromY + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= threshold;
  };

  const handleMapMouseDown = (e: React.MouseEvent) => {
    if (!mapRef.current || isDraggingRef.current) return;

    const { x, y } = getCanvasCoordinates(mapRef, e, zoom);

    // FIXED: CONNECTION TOOL - Start exactly where user clicks/drags
    if (selectedTool === 'connection') {
      const clickedNode = nodes.find(node => 
        x >= node.x && x <= node.x + node.width &&
        y >= node.y && y <= node.y + node.height
      );

      if (clickedNode) {
        // FIXED: Start dragging from EXACT mouse position, not node center
        setIsDraggingConnection(true);
        setConnectionDragStart({ 
          nodeId: clickedNode.id, 
          x: x, // Use exact mouse position
          y: y  // Use exact mouse position
        });
        
        // Clear any previous connection state
        setConnectingFrom(null);
      } else {
        // Start freeform connection from empty space (exact position)
        setIsDraggingConnection(true);
        setConnectionDragStart({ 
          nodeId: null, 
          x, 
          y 
        });
        setConnectingFrom(null);
      }
      
      e.preventDefault();
      return;
    }

    // ENHANCED: Handle connection dragging and handle selection for select tool
    if (selectedTool === 'select') {
      // Check if clicking on connection handles first
      const selectedConn = connections.find(c => c.id === selectedConnection);
      if (selectedConn) {
        const fromHandleDistance = Math.sqrt(Math.pow(x - selectedConn.fromX, 2) + Math.pow(y - selectedConn.fromY, 2));
        const toHandleDistance = Math.sqrt(Math.pow(x - selectedConn.toX, 2) + Math.pow(y - selectedConn.toY, 2));
        
        if (fromHandleDistance <= 8) {
          setDraggedConnection(selectedConn.id);
          setConnectionDragType('fromHandle');
          setConnectionDragOffset({ x, y });
          e.preventDefault();
          return;
        }
        
        if (toHandleDistance <= 8) {
          setDraggedConnection(selectedConn.id);
          setConnectionDragType('toHandle');
          setConnectionDragOffset({ x, y });
          e.preventDefault();
          return;
        }
      }
      
      // Check if clicking on a connection line
      const clickedConnection = connections.find(conn => 
        isPointNearConnection(conn, x, y, 8)
      );

      if (clickedConnection) {
        setSelectedConnection(clickedConnection.id);
        setSelectedNode(null);
        setDraggedConnection(clickedConnection.id);
        setConnectionDragType('whole');
        setConnectionDragOffset({ x, y });
        e.preventDefault();
        return;
      }
    }

    // Handle drawing tool
    if (selectedTool === 'draw') {
      if (currentDrawingTool !== 'eraser') {
        setIsDrawing(true);
        
        if (drawingStrokes.length === 0) {
          setDrawingHistory([]);
          setDrawingHistoryIndex(-1);
        }
        
        const newStroke: DrawingStroke = {
          id: Date.now().toString(),
          points: [{ x, y }],
          color: drawingColor,
          width: brushSize
        };
        setCurrentStroke(newStroke);
      }
      e.preventDefault();
      return;
    }

    // Start drag-to-create for sticky notes and text
    if ((selectedTool === 'sticky-note' || selectedTool === 'text') && isAddingNode) {
      setIsCreatingByDrag(true);
      setDragPreview({
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
        isActive: true
      });
      e.preventDefault();
    } else if (selectedTool === 'icon') {
      addNode(x, y, 'icon');
    } else {
      exitEditMode();
      setSelectedNode(null);
      setSelectedConnection(null);
    }
  };

  const handleMapMouseMove = (e: React.MouseEvent) => {
    if (!mapRef.current) return;

    const { x, y } = getCanvasCoordinates(mapRef, e, zoom);

    // ENHANCED: Handle various types of connection dragging
    if (draggedConnection && connectionDragType) {
      const connection = connections.find(c => c.id === draggedConnection);
      if (connection) {
        if (connectionDragType === 'whole') {
          // Move entire connection
          const deltaX = x - connectionDragOffset.x;
          const deltaY = y - connectionDragOffset.y;
          
          updateConnectionPosition(draggedConnection, {
            fromX: connection.fromX + deltaX,
            fromY: connection.fromY + deltaY,
            toX: connection.toX + deltaX,
            toY: connection.toY + deltaY
          });
          
          setConnectionDragOffset({ x, y });
        } else if (connectionDragType === 'fromHandle') {
          // Resize from start point
          updateConnectionPosition(draggedConnection, {
            fromX: x,
            fromY: y
          });
        } else if (connectionDragType === 'toHandle') {
          // Resize from end point
          updateConnectionPosition(draggedConnection, {
            toX: x,
            toY: y
          });
        }
      }
      return;
    }

    // ENHANCED: Connection dragging with live preview and measurements
    if (isDraggingConnection && connectionDragStart) {
      const fromX = connectionDragStart.x;
      const fromY = connectionDragStart.y;
      
      // Calculate distance and angle for display
      const distance = Math.sqrt(Math.pow(x - fromX, 2) + Math.pow(y - fromY, 2));
      const angle = Math.atan2(y - fromY, x - fromX) * (180 / Math.PI);
      
      // Find potential target node
      const targetNode = nodes.find(node => {
        const buffer = 10;
        return x >= (node.x - buffer) && 
               x <= (node.x + node.width + buffer) &&
               y >= (node.y - buffer) && 
               y <= (node.y + node.height + buffer) &&
               node.id !== connectionDragStart.nodeId;
      });
      
      // Update preview with enhanced information
      setConnectionPreview({
        fromX,
        fromY,
        toX: x,
        toY: y,
        fromNodeId: connectionDragStart.nodeId,
        toNodeId: targetNode?.id || null,
        distance: Math.round(distance),
        angle: Math.round(angle)
      });
      
      // Update hover state
      setHoveredNode(targetNode?.id || null);
      return;
    }

    // Click-to-click connection mode with preview
    if (connectingFrom && !isDraggingConnection) {
      // Show preview for click-to-click mode
      const fromNode = nodes.find(n => n.id === connectingFrom);
      if (fromNode) {
        const fromX = fromNode.x + fromNode.width / 2;
        const fromY = fromNode.y + fromNode.height / 2;
        const distance = Math.sqrt(Math.pow(x - fromX, 2) + Math.pow(y - fromY, 2));
        const angle = Math.atan2(y - fromY, x - fromX) * (180 / Math.PI);
        
        setConnectionPreview({
          fromX,
          fromY,
          toX: x,
          toY: y,
          fromNodeId: connectingFrom,
          toNodeId: null,
          distance: Math.round(distance),
          angle: Math.round(angle)
        });
      }
      return;
    }

    // Handle resize dragging
    if (resizingNode && resizeHandle) {
      handleResizeMove(e);
      return;
    }

    // Handle drawing
    if (isDrawing && selectedTool === 'draw' && currentDrawingTool !== 'eraser') {
      if (currentStroke) {
        const updatedStroke = {
          ...currentStroke,
          points: [...currentStroke.points, { x, y }]
        };
        setCurrentStroke(updatedStroke);
      }
      return;
    }

    // Handle eraser
    if (selectedTool === 'draw' && currentDrawingTool === 'eraser') {
      setEraserPosition({ x, y });
      applyHoverErasing({ x, y });
      return;
    }

    // Handle drag-to-create preview
    if (isCreatingByDrag && dragPreview.isActive) {
      setDragPreview(prev => ({
        ...prev,
        currentX: x,
        currentY: y
      }));
    }

    // Handle node dragging - Allow unlimited movement in all directions for all node types
    if (!draggedNode || selectedTool !== 'select' || !isDraggingRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    // Calculate position without any constraints for smooth dragging
    const canvasX = (e.clientX - rect.left - dragOffset.x) / zoom;
    const canvasY = (e.clientY - rect.top - dragOffset.y) / zoom;

    setDragPosition({ x: canvasX, y: canvasY });
  };

  const handleMapMouseUp = () => {
    // Handle connection drag completion
    if (draggedConnection) {
      if (connectionDragType === 'whole') {
        saveMindMapState();
      }
      setDraggedConnection(null);
      setConnectionDragType(null);
      setConnectionDragOffset({ x: 0, y: 0 });
      return;
    }

    // IMPROVED connection drag completion - much more reliable
    if (isDraggingConnection && connectionDragStart && mapRef.current) {
      // Get current mouse position for connection completion using the most recent event
      const rect = mapRef.current.getBoundingClientRect();
      let x, y;
      
      // Try to get coordinates from the most recent mouse position
      if (window.event && 'clientX' in window.event && 'clientY' in window.event) {
        x = ((window.event as MouseEvent).clientX - rect.left) / zoom;
        y = ((window.event as MouseEvent).clientY - rect.top) / zoom;
      } else {
        // Fallback to stored position
        x = connectionDragStart.x;
        y = connectionDragStart.y;
      }
      
      const fromX = connectionDragStart.x;
      const fromY = connectionDragStart.y;
      
      // Find target node with improved hit detection
      const targetNode = nodes.find(node => {
        // Add small buffer for easier targeting
        const buffer = 5;
        return x >= (node.x - buffer) && 
               x <= (node.x + node.width + buffer) &&
               y >= (node.y - buffer) && 
               y <= (node.y + node.height + buffer) &&
               node.id !== connectionDragStart.nodeId;
      });
      
      const fromNodeId = connectionDragStart.nodeId || null;
      const toNodeId = targetNode ? targetNode.id : null;
      
      // Calculate minimum drag distance for freeform connections
      const dragDistance = Math.hypot(x - fromX, y - fromY);
      const minDragDistance = 15; // Reduced from 20 for easier use
      
      // ALWAYS create connection if:
      // 1. We have at least one node involved, OR
      // 2. We dragged far enough for freeform connection
      if (fromNodeId || toNodeId || dragDistance > minDragDistance) {
        createConnection(fromNodeId, toNodeId, fromX, fromY, x, y);
      } else {
        // Only clear state if it was a very short drag (likely accidental)
        clearConnectionState();
      }
      return;
    }

    // Handle resize completion
    if (resizingNode) {
      handleResizeEnd();
      return;
    }

    // Handle drawing completion
    if (isDrawing && selectedTool === 'draw' && currentDrawingTool !== 'eraser') {
      if (currentStroke && currentStroke.points.length > 1) {
        const newStrokes = [...drawingStrokes, currentStroke];
        setDrawingStrokes(newStrokes);
        saveDrawingState();
        setCurrentStroke(null);
      }
      return;
    }

    // Handle drag-to-create completion
    if (isCreatingByDrag && dragPreview.isActive) {
      createNodeFromDrag();
      return;
    }

    // Handle node dragging completion for all node types including images
    if (draggedNode && isDraggingRef.current) {
      const draggedNodeData = nodes.find(n => n.id === draggedNode);
      if (draggedNodeData && (draggedNodeData.x !== dragPosition.x || draggedNodeData.y !== dragPosition.y)) {
        saveMindMapState();
      }
      updateNodes(nodes.map(node => 
        node.id === draggedNode 
          ? { ...node, x: dragPosition.x, y: dragPosition.y }
          : node
      ));
    }
    
    setDraggedNode(null);
    isDraggingRef.current = false;
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    
    if (selectedTool === 'delete') {
      removeNode(nodeId);
      return;
    }

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setSelectedNode(nodeId);
    setSelectedConnection(null);
    
    if (selectedTool === 'connection') {
      // SIMPLIFIED connection start from node - always use center point
      const startX = node.x + node.width / 2;
      const startY = node.y + node.height / 2;
      
      setIsDraggingConnection(true);
      setConnectionDragStart({ nodeId, x: startX, y: startY });
      setConnectingFrom(null); // Clear any previous state
      
      return;
    }
    
    if (selectedTool === 'select') {
      // Enable dragging for all node types including images
      setDraggedNode(nodeId);
      isDraggingRef.current = true;
      
      if (mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect();
        const nodeScreenX = rect.left + (node.x * zoom);
        const nodeScreenY = rect.top + (node.y * zoom);
        
        setDragOffset({
          x: e.clientX - nodeScreenX,
          y: e.clientY - nodeScreenY
        });
        setDragPosition({ x: node.x, y: node.y });
      }
    }
  };

  const handleNodeDoubleClick = (nodeId: string) => {
    setEditingNode(nodeId);
    setSelectedNode(nodeId);
    
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      const position = calculateEditingToolbarPosition(node);
      setEditingFormattingToolbarPosition(position);
    }
  };

  const handleNodeMouseEnter = (nodeId: string) => {
    if (selectedTool === 'connection') {
      setHoveredNode(nodeId);
    }
  };

  const handleNodeMouseLeave = () => {
    if (selectedTool === 'connection') {
      setHoveredNode(null);
    }
  };

  // Enhanced connection click handler with better hit detection
  const handleConnectionClick = (e: React.MouseEvent, connectionId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (selectedTool === 'delete') {
      removeConnection(connectionId);
    } else {
      setSelectedConnection(connectionId);
      setSelectedNode(null);
    }
  };

  // DEBUGGED: Handle tool selection with proper color setting
  const handleToolSelection = (tool: Tool, options?: any) => {
    if (tool === 'draw') {
      setSelectedTool(tool);
      setShowDrawingToolbar(true);
      return;
    }

    if (showDrawingToolbar) {
      setShowDrawingToolbar(false);
      if (drawingStrokes.length > 0) {
        finishDrawing();
      }
    }

    setEraserPosition(null);

    // Clear connection state when switching away from connection tool
    if (selectedTool === 'connection' && tool !== 'connection') {
      clearConnectionState();
    }
    
    // FORCE DISABLE connector points when selecting connection tool to prevent blue dots
    if (tool === 'connection') {
      setEnableConnectorPoints(false);
    }

    setSelectedTool(tool);
    if (tool === 'sticky-note' && options) {
      // DEBUG: Log the color selection
      console.log('Sticky note tool selected with options:', options);
      console.log('Setting selectedShape to:', options.shape);
      console.log('Setting selectedColor to:', options.color);
      
      setSelectedShape(options.shape);
      setSelectedColor(options.color); // This should set the color properly
      setIsAddingNode(true);
      setIsStickyNotePickerOpen(false);
      
      // DEBUG: Verify the state was set
      console.log('State after setting - selectedColor should be:', options.color);
    } else if (tool === 'text' && options) {
      setSelectedTextType(options.textType);
      setIsAddingNode(true);
      setIsTextPickerOpen(false);
    } else if (tool === 'icon' && options) {
      setSelectedIcon(options.icon);
      setIsAddingNode(true);
      setIsIconPickerOpen(false);
    } else if (tool === 'connection' && options) {
      setSelectedConnectionType(options.type);
      setIsConnectionPickerOpen(false);
    }
  };

  // IMPROVED image upload with better sizing and positioning
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        
        // Create image element to get natural dimensions
        const img = new Image();
        img.onload = () => {
          // Smart sizing algorithm for better default sizes
          const maxSize = 250; // Slightly smaller max for better canvas fit
          const minSize = 80;  // Larger minimum for better visibility
          let width = img.naturalWidth;
          let height = img.naturalHeight;
          
          // Calculate optimal size based on image dimensions
          const aspectRatio = width / height;
          
          // Scale down if image is too large, maintaining aspect ratio
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              width = maxSize;
              height = maxSize / aspectRatio;
            } else {
              height = maxSize;
              width = maxSize * aspectRatio;
            }
          }
          
          // Scale up if image is too small
          if (width < minSize && height < minSize) {
            if (width > height) {
              width = minSize;
              height = minSize / aspectRatio;
            } else {
              height = minSize;
              width = minSize * aspectRatio;
            }
          }
          
          // Smart positioning - center in viewport if possible
          let x = 100;
          let y = 100;
          
          if (mapRef.current) {
            const rect = mapRef.current.getBoundingClientRect();
            const centerX = (rect.width / zoom - width) / 2;
            const centerY = (rect.height / zoom - height) / 2;
            
            // Use center if it's reasonable, otherwise default position
            if (centerX > 0 && centerY > 0) {
              x = Math.max(50, centerX);
              y = Math.max(50, centerY);
            }
          }
          
          const newNode: MindMapNode = {
            id: Date.now().toString(),
            content: '',
            type: 'image',
            color: 'bg-transparent border-transparent',
            imageUrl,
            x: Math.round(x),
            y: Math.round(y),
            width: Math.round(width),
            height: Math.round(height)
          };
          
          saveMindMapState();
          updateNodes([...nodes, newNode]);
          
          // Auto-select the new image for immediate manipulation
          setSelectedNode(newNode.id);
        };
        
        img.onerror = () => {
          console.error('Failed to load image');
          // Could add user notification here
        };
        
        img.src = imageUrl;
      };
      
      reader.onerror = () => {
        console.error('Failed to read file');
        // Could add user notification here
      };
      
      reader.readAsDataURL(file);
    }
    
    // Clear the input value to allow uploading the same file again
    if (event.target) {
      event.target.value = '';
    }
    
    // Keep on select tool for immediate interaction with the uploaded image
    setSelectedTool('select');
  };

  const createDrawingNode = (strokes: DrawingStroke[]) => {
    if (strokes.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    strokes.forEach(stroke => {
      stroke.points.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });

    const padding = 10;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const pathsData = strokes.map(stroke => {
      if (stroke.points.length < 2) return null;
      
      let path = `M ${stroke.points[0].x - minX} ${stroke.points[0].y - minY}`;
      for (let i = 1; i < stroke.points.length; i++) {
        path += ` L ${stroke.points[i].x - minX} ${stroke.points[i].y - minY}`;
      }
      
      return {
        path,
        color: stroke.color,
        width: stroke.width
      };
    }).filter(p => p !== null);

    const drawingNode: MindMapNode = {
      id: Date.now().toString(),
      content: JSON.stringify(pathsData),
      type: 'drawing',
      color: 'bg-transparent border-transparent',
      drawingPath: '',
      drawingBounds: { minX, minY, maxX, maxY },
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };

    saveMindMapState();
    updateNodes([...nodes, drawingNode]);
  };

  const finishDrawing = () => {
    if (drawingStrokes.length > 0) {
      createDrawingNode(drawingStrokes);
      setDrawingStrokes([]);
      setDrawingHistory([]);
      setDrawingHistoryIndex(-1);
    }
    setIsDrawing(false);
    setCurrentStroke(null);
    setShowDrawingToolbar(false);
    setSelectedTool('select');
    setEraserPosition(null);
    setHasErasingStarted(false);
  };

  // IMPROVED resize handle functions - smoother and more intuitive
  const handleResizeStart = (e: React.MouseEvent, nodeId: string, handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w') => {
    e.stopPropagation();
    e.preventDefault(); // Prevent any default behavior
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const { x, y } = getCanvasCoordinates(mapRef, e, zoom);
    setResizingNode(nodeId);
    setResizeHandle(handle);
    setResizeStartPosition({ x, y });
    setResizeStartDimensions({ 
      width: node.width, 
      height: node.height, 
      x: node.x, 
      y: node.y 
    });
    
    // Add cursor style to body for better feedback
    document.body.style.cursor = `${handle}-resize`;
  };

  const handleResizeMove = (e: React.MouseEvent) => {
    if (!resizingNode || !resizeHandle) return;

    const { x, y } = getCanvasCoordinates(mapRef, e, zoom);
    const deltaX = x - resizeStartPosition.x;
    const deltaY = y - resizeStartPosition.y;
    
    const node = nodes.find(n => n.id === resizingNode);
    if (!node) return;

    let newWidth = resizeStartDimensions.width;
    let newHeight = resizeStartDimensions.height;
    let newX = resizeStartDimensions.x;
    let newY = resizeStartDimensions.y;

    // Determine minimum sizes based on node type
    const minWidth = node.type === 'image' ? 30 : 50;
    const minHeight = node.type === 'image' ? 30 : 30;
    
    // For images, maintain aspect ratio when using corner handles
    const maintainAspectRatio = node.type === 'image' && ['nw', 'ne', 'sw', 'se'].includes(resizeHandle);
    
    if (maintainAspectRatio) {
      const aspectRatio = resizeStartDimensions.width / resizeStartDimensions.height;
      
      switch (resizeHandle) {
        case 'nw':
          // Use the smaller of the two deltas to maintain aspect ratio
          const nwScale = Math.min(
            (resizeStartDimensions.width - deltaX) / resizeStartDimensions.width,
            (resizeStartDimensions.height - deltaY) / resizeStartDimensions.height
          );
          newWidth = Math.max(minWidth, resizeStartDimensions.width * nwScale);
          newHeight = Math.max(minHeight, resizeStartDimensions.height * nwScale);
          newX = resizeStartDimensions.x + (resizeStartDimensions.width - newWidth);
          newY = resizeStartDimensions.y + (resizeStartDimensions.height - newHeight);
          break;
        case 'ne':
          const neScale = Math.min(
            (resizeStartDimensions.width + deltaX) / resizeStartDimensions.width,
            (resizeStartDimensions.height - deltaY) / resizeStartDimensions.height
          );
          newWidth = Math.max(minWidth, resizeStartDimensions.width * neScale);
          newHeight = Math.max(minHeight, resizeStartDimensions.height * neScale);
          newY = resizeStartDimensions.y + (resizeStartDimensions.height - newHeight);
          break;
        case 'sw':
          const swScale = Math.min(
            (resizeStartDimensions.width - deltaX) / resizeStartDimensions.width,
            (resizeStartDimensions.height + deltaY) / resizeStartDimensions.height
          );
          newWidth = Math.max(minWidth, resizeStartDimensions.width * swScale);
          newHeight = Math.max(minHeight, resizeStartDimensions.height * swScale);
          newX = resizeStartDimensions.x + (resizeStartDimensions.width - newWidth);
          break;
        case 'se':
          const seScale = Math.min(
            (resizeStartDimensions.width + deltaX) / resizeStartDimensions.width,
            (resizeStartDimensions.height + deltaY) / resizeStartDimensions.height
          );
          newWidth = Math.max(minWidth, resizeStartDimensions.width * seScale);
          newHeight = Math.max(minHeight, resizeStartDimensions.height * seScale);
          break;
      }
    } else {
      // Standard resize without aspect ratio constraint
      switch (resizeHandle) {
        case 'nw':
          newWidth = Math.max(minWidth, resizeStartDimensions.width - deltaX);
          newHeight = Math.max(minHeight, resizeStartDimensions.height - deltaY);
          newX = resizeStartDimensions.x + (resizeStartDimensions.width - newWidth);
          newY = resizeStartDimensions.y + (resizeStartDimensions.height - newHeight);
          break;
        case 'ne':
          newWidth = Math.max(minWidth, resizeStartDimensions.width + deltaX);
          newHeight = Math.max(minHeight, resizeStartDimensions.height - deltaY);
          newY = resizeStartDimensions.y + (resizeStartDimensions.height - newHeight);
          break;
        case 'sw':
          newWidth = Math.max(minWidth, resizeStartDimensions.width - deltaX);
          newHeight = Math.max(minHeight, resizeStartDimensions.height + deltaY);
          newX = resizeStartDimensions.x + (resizeStartDimensions.width - newWidth);
          break;
        case 'se':
          newWidth = Math.max(minWidth, resizeStartDimensions.width + deltaX);
          newHeight = Math.max(minHeight, resizeStartDimensions.height + deltaY);
          break;
        case 'n':
          newHeight = Math.max(minHeight, resizeStartDimensions.height - deltaY);
          newY = resizeStartDimensions.y + (resizeStartDimensions.height - newHeight);
          break;
        case 's':
          newHeight = Math.max(minHeight, resizeStartDimensions.height + deltaY);
          break;
        case 'e':
          newWidth = Math.max(minWidth, resizeStartDimensions.width + deltaX);
          break;
        case 'w':
          newWidth = Math.max(minWidth, resizeStartDimensions.width - deltaX);
          newX = resizeStartDimensions.x + (resizeStartDimensions.width - newWidth);
          break;
      }
    }

    // Update nodes with smooth animation
    updateNodes(nodes.map(node => 
      node.id === resizingNode 
        ? { ...node, width: Math.round(newWidth), height: Math.round(newHeight), x: Math.round(newX), y: Math.round(newY) }
        : node
    ));
  };

  const handleResizeEnd = () => {
    if (resizingNode) {
      saveMindMapState();
    }
    setResizingNode(null);
    setResizeHandle(null);
    
    // Restore default cursor
    document.body.style.cursor = 'default';
  };

  const renderShapePreview = (shape: MindMapNode['shape'], color: string, size: 'sm' | 'lg' = 'lg') => {
    const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-16 h-12';
    const cornerRadius = shape === 'circle' ? 'rounded-full' : 'rounded-lg';
    
    const bgColor = colorOptions.find(c => c.value === color)?.bgColor || '#f3f4f6';

    return (
      <div 
        className={`${sizeClasses} ${cornerRadius} border-2 flex items-center justify-center`}
        style={{ 
          backgroundColor: bgColor,
          borderColor: color.includes('border-') ? color.split('border-')[1].split(' ')[0] : '#d1d5db'
        }}
      >
        {size === 'lg' && shape === 'sticky-note' && (
          <div className="w-3 h-3 bg-current opacity-20 rounded-sm"></div>
        )}
      </div>
    );
  };

  const renderDragPreview = () => {
    if (!dragPreview.isActive) return null;

    const { startX, startY, currentX, currentY } = dragPreview;
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    const bgColor = colorOptions.find(c => c.value === selectedColor)?.bgColor || '#f3f4f6';
    const borderColor = selectedColor.includes('border-') ? selectedColor.split('border-')[1].split(' ')[0] : '#d1d5db';

    return (
      <div
        className="absolute border-2 border-dashed pointer-events-none"
        style={{
          left: x * zoom,
          top: y * zoom,
          width: width * zoom,
          height: height * zoom,
          backgroundColor: bgColor + '50',
          borderColor: borderColor,
          zIndex: 999
        }}
      >
        <div className="w-full h-full flex items-center justify-center text-xs opacity-70">
          {selectedTool === 'text' ? 'Text' : 'Note'}
        </div>
      </div>
    );
  };

  const renderDrawingStrokes = () => {
    const allStrokes = currentStroke ? [...drawingStrokes, currentStroke] : drawingStrokes;

    return (
      <svg
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          width: '100%',
          height: '100%',
          zIndex: 998
        }}
      >
        {allStrokes.map((stroke, index) => (
          <path
            key={`stroke-${index}`}
            d={stroke.points.length < 2 ? '' : 
              `M ${stroke.points[0].x * zoom} ${stroke.points[0].y * zoom} ` +
              stroke.points.slice(1).map(p => `L ${p.x * zoom} ${p.y * zoom}`).join(' ')
            }
            stroke={stroke.color}
            strokeWidth={stroke.width * zoom}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
        
        {currentDrawingTool === 'eraser' && selectedTool === 'draw' && eraserPosition && (
          <circle
            cx={eraserPosition.x * zoom}
            cy={eraserPosition.y * zoom}
            r={(brushSize / 2) * zoom}
            fill="white"
            stroke="black"
            strokeWidth="2"
          />
        )}
      </svg>
    );
  };

  const renderDrawingToolbar = () => {
    if (!showDrawingToolbar) return null;

    return (
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 border border-gray-200 rounded-lg shadow-lg px-3 py-2 flex items-center gap-2 z-50" style={{ backgroundColor: '#42352f' }}>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={undoDrawing}
          disabled={drawingHistoryIndex < 0}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={redoDrawing}
          disabled={drawingHistoryIndex >= drawingHistory.length - 1}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-200 mx-1"></div>

        <Button
          variant={currentDrawingTool === 'pen' ? 'default' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setCurrentDrawingTool('pen')}
          title="Pen"
        >
          <PenTool className="w-4 h-4" />
        </Button>

        <Button
          variant={currentDrawingTool === 'brush' ? 'default' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setCurrentDrawingTool('brush')}
          title="Brush"
        >
          <Brush className="w-4 h-4" />
        </Button>

        <Button
          variant={currentDrawingTool === 'eraser' ? 'default' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setCurrentDrawingTool('eraser')}
          title="Eraser"
        >
          <Eraser className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-200 mx-1"></div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">
            {currentDrawingTool === 'eraser' ? 'Eraser' : 'Size'}
          </span>
          <Slider
            value={[brushSize]}
            onValueChange={(value) => setBrushSize(value[0])}
            max={20}
            min={1}
            step={1}
            className="w-16 h-4"
          />
          <span className="text-xs text-gray-600 w-4 text-center">{brushSize}</span>
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1"></div>

        {currentDrawingTool !== 'eraser' && (
          <>
            <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
              <PopoverTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 gap-1"
                  title="Color"
                >
                  <div 
                    className="w-4 h-4 rounded border-2 border-gray-300"
                    style={{ backgroundColor: drawingColor }}
                  />
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3" align="center">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Drawing Colors</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {drawingColors.map((color) => (
                      <Button
                        key={color.name}
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 rounded border-2 ${
                          drawingColor === color.color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color.color }}
                        onClick={() => {
                          setDrawingColor(color.color);
                          setIsColorPickerOpen(false);
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
          </>
        )}

        <Button
          onClick={finishDrawing}
          variant="destructive"
          size="sm"
          className="h-8 px-3 text-xs"
        >
          Done drawing
        </Button>
      </div>
    );
  };



  // FIXED: Function to get proper border color that's darker than background
  const getBorderColor = (colorInfo: any): string => {
    if (!colorInfo) return '#d1d5db';
    
    // Create darker border colors based on the background color
    const colorMap: { [key: string]: string } = {
      '#fef3c7': '#f59e0b', // Yellow - darker yellow border
      '#fed7aa': '#ea580c', // Orange - darker orange border  
      '#d9f99d': '#65a30d', // Green Light - darker lime border
      '#dcfce7': '#16a34a', // Green - darker green border
      '#cffafe': '#0891b2', // Blue Light - darker cyan border
      '#dbeafe': '#2563eb', // Blue - darker blue border
      '#e9d5ff': '#9333ea', // Purple Light - darker purple border
      '#fce7f3': '#ec4899', // Pink - darker pink border
      '#ffe4e6': '#f43f5e', // Rose - darker rose border
      '#ffffff': '#d1d5db', // White - gray border
      '#f3f4f6': '#9ca3af', // Gray - darker gray border
      '#1f2937': '#111827'  // Black - darker black border
    };
    
    return colorMap[colorInfo.bgColor] || '#d1d5db';
  };

  // FIXED: Render node with proper sticky note styling and folded corner effect
  const renderNode = (node: MindMapNode) => {
    const isSelected = selectedNode === node.id;
    const isEditing = editingNode === node.id;
    const isDragging = draggedNode === node.id;
    
    const isTextNode = node.type === 'text';
    const isStickyNote = node.type === 'sticky-note';
    const isTransparent = isTextNode; // Always transparent for all text nodes
    
    // DEBUG: Log node color for debugging
    console.log('Rendering node:', node.id, 'with color:', node.color, 'type:', node.type);
    
    // FIXED: Get color information from constants
    const colorInfo = colorOptions.find(c => c.value === node.color);
    console.log('Color info found:', colorInfo);
    
    const baseClasses = isTransparent 
      ? 'absolute cursor-pointer transition-all duration-200'
      : 'absolute cursor-pointer transition-all duration-200';
    const selectedClasses = isSelected ? 'ring-2 ring-primary shadow-lg' : (isTransparent ? '' : 'shadow-md hover:shadow-lg');
    
    const shapeClasses = {
      rectangle: 'rounded-lg',
      circle: 'rounded-full',
      'sticky-note': 'rounded-lg',
      line: 'rounded-none',
      arrow: 'rounded-lg',
      star: 'rounded-lg',
      triangle: 'rounded-lg',
      pentagon: 'rounded-lg',
      hexagon: 'rounded-lg',
      octagon: 'rounded-lg'
    };

    const currentX = isDragging ? dragPosition.x : node.x;
    const currentY = isDragging ? dragPosition.y : node.y;

    // FIXED: Enhanced styling for sticky notes with proper borders and folded corner
    const style: React.CSSProperties = {
      left: currentX * zoom,
      top: currentY * zoom,
      width: node.width * zoom,
      height: node.height * zoom,
      transform: `scale(${isDragging ? 1.05 : 1})`,
      zIndex: isDragging ? 1000 : 1,
      transition: isDragging ? 'none' : 'all 0.2s ease',
      // Apply colors using CSS styles
      backgroundColor: colorInfo?.bgColor || '#ffffff',
      borderColor: getBorderColor(colorInfo),
      borderWidth: isStickyNote ? '1px' : '2px',
      borderStyle: 'solid',
      color: colorInfo ? (colorInfo.value.includes('text-') ? 
        colorInfo.value.split('text-')[1].split(' ')[0] : '#1f2937') : '#1f2937',
      // Add box shadow for depth (like real sticky notes)
      boxShadow: isStickyNote ? `2px 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)` : 
        '0 2px 4px rgba(0, 0, 0, 0.1)',
      // Add subtle paper texture for sticky notes
      ...(isStickyNote && {
        backgroundImage: `linear-gradient(45deg, transparent 98%, rgba(0,0,0,0.02) 100%),
                         radial-gradient(circle at 30% 40%, rgba(255,255,255,0.3) 1px, transparent 1px),
                         radial-gradient(circle at 70% 80%, rgba(255,255,255,0.2) 1px, transparent 1px)`,
        backgroundSize: '100% 100%, 20px 20px, 30px 30px'
      })
    };

    const renderContent = () => {
      if (node.type === 'drawing') {
        try {
          const pathsData = JSON.parse(node.content);
          return (
            <svg
              className="w-full h-full"
              viewBox={`0 0 ${node.width} ${node.height}`}
              preserveAspectRatio="none"
            >
              {pathsData.map((pathData: any, index: number) => (
                <path
                  key={index}
                  d={pathData.path}
                  stroke={pathData.color}
                  strokeWidth={pathData.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ))}
            </svg>
          );
        } catch {
          const selectedColorOption = colorOptions.find(c => c.value === selectedColor);
          return (
            <svg
              className="w-full h-full"
              viewBox={`0 0 ${node.width} ${node.height}`}
              preserveAspectRatio="none"
            >
              <path
                d={node.drawingPath}
                stroke={selectedColorOption?.drawColor || '#000000'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          );
        }
      } else if (node.type === 'image' && node.imageUrl) {
        return (
          <ImageWithFallback
            src={node.imageUrl}
            alt="Mind map image"
            className={`w-full h-full object-contain transition-all duration-200 ${
              isDragging ? 'opacity-90' : 'opacity-100'
            }`}
            style={{ 
              imageRendering: 'auto',
              userSelect: 'none', // Prevent text selection during drag
              pointerEvents: 'none' // Let parent handle all mouse events
            }}
          />
        );
      } else if (node.type === 'icon' && node.iconName) {
        const IconComponent = iconOptions.find(icon => icon.name === node.iconName)?.icon || Lightbulb;
        return <IconComponent className="w-8 h-8" />;
      } else if (isEditing) {
        const editingStyle: React.CSSProperties = {
          fontSize: node.fontSize ? `${node.fontSize}px` : '14px',
          fontWeight: node.fontWeight || 'normal',
          fontStyle: node.fontStyle || 'normal',
          textDecoration: node.textDecoration || 'none',
          textAlign: node.textAlign || 'center',
          color: node.textColor || '#1f2937',
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          padding: '4px',
          margin: '0',
          lineHeight: '1.4'
        };

        return (
          <Textarea
            value={node.content}
            onChange={(e) => updateNodeContent(node.id, e.target.value)}
            onBlur={handleTextareaBlur}
            onFocus={() => setIsInteractingWithToolbar(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                exitEditMode();
              }
            }}
            className={`w-full h-full resize-none border-none bg-transparent ${
              node.textType && !node.fontSize ? textTypes[node.textType].style : ''
            }`}
            style={editingStyle}
            autoFocus
            placeholder="Type your text..."
          />
        );
      } else {
        const textStyle: React.CSSProperties = {
          fontSize: node.fontSize ? `${node.fontSize}px` : '14px',
          fontWeight: node.fontWeight || 'normal',
          fontStyle: node.fontStyle || 'normal',
          textDecoration: node.textDecoration || 'none',
          textAlign: node.textAlign || 'center',
          color: node.textColor || '#1f2937',
          lineHeight: '1.4',
          backgroundColor: node.backgroundColor && node.backgroundColor !== 'transparent' ? node.backgroundColor : undefined,
          borderColor: node.borderColor && node.borderColor !== 'transparent' ? node.borderColor : undefined,
          borderWidth: node.borderWidth ? `${node.borderWidth}px` : undefined,
          borderStyle: node.borderWidth && node.borderWidth > 0 ? 'solid' : 'none',
          padding: node.backgroundColor && node.backgroundColor !== 'transparent' ? '8px' : undefined,
          borderRadius: node.backgroundColor && node.backgroundColor !== 'transparent' ? '4px' : undefined
        };

        // If the node has a link, make it clickable
        if (node.linkUrl) {
          return (
            <a
              href={node.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`break-words cursor-pointer hover:opacity-80 ${
                node.textType && !node.fontSize ? textTypes[node.textType].style : 'text-sm'
              }`}
              style={{
                ...textStyle,
                display: 'block',
                textDecoration: node.textDecoration || 'underline',
                color: node.textColor || '#2563eb'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {node.content}
            </a>
          );
        }

        return (
          <p 
            className={`break-words ${
              node.textType && !node.fontSize ? textTypes[node.textType].style : 'text-sm'
            }`}
            style={textStyle}
          >
            {node.content}
          </p>
        );
      }
    };

    // Special handling for drawing nodes
    if (node.type === 'drawing') {
      return (
        <div
          key={node.id}
          className={`absolute cursor-pointer transition-all duration-200 ${
            isSelected ? 'ring-2 ring-primary' : ''
          } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={style}
          onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
        >
          {renderContent()}
          
          {isSelected && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                removeNode(node.id);
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      );
    }

    // For text nodes, always use transparent styling
    if (isTextNode) {
      return (
        <div
          key={node.id}
          className={`${baseClasses} ${selectedClasses} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            ...style,
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            boxShadow: 'none'
          }}
          onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
          onDoubleClick={() => handleNodeDoubleClick(node.id)}
        >
          {renderContent()}
          
          {isSelected && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  removeNode(node.id);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
              
              {node.type === 'text' && (
                <>
                  <div
                    className="absolute -top-1 -left-1 w-3 h-3 bg-primary border border-white rounded-sm cursor-nw-resize z-10"
                    onMouseDown={(e) => handleResizeStart(e, node.id, 'nw')}
                  />
                  <div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-primary border border-white rounded-sm cursor-ne-resize z-10"
                    onMouseDown={(e) => handleResizeStart(e, node.id, 'ne')}
                  />
                  <div
                    className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary border border-white rounded-sm cursor-sw-resize z-10"
                    onMouseDown={(e) => handleResizeStart(e, node.id, 'sw')}
                  />
                  <div
                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary border border-white rounded-sm cursor-se-resize z-10"
                    onMouseDown={(e) => handleResizeStart(e, node.id, 'se')}
                  />
                </>
              )}
            </>
          )}
        </div>
      );
    }

    // FIXED: Enhanced sticky note rendering with folded corner effect
    if (isStickyNote) {
      return (
        <div
          key={node.id}
          className={`${baseClasses} ${selectedClasses} ${
            node.shape ? shapeClasses[node.shape] : 'rounded-lg'
          } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} relative overflow-hidden`}
          style={style}
          onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
          onDoubleClick={() => handleNodeDoubleClick(node.id)}
        >
          {/* Main content area */}
          <div className="relative p-3 h-full flex items-center justify-center">
            {renderContent()}
          </div>
          
          {/* FIXED: Folded corner effect (bottom-right corner) */}
          <div 
            className="absolute bottom-0 right-0 w-4 h-4"
            style={{
              background: `linear-gradient(135deg, transparent 50%, ${getBorderColor(colorInfo)} 50%)`,
              clipPath: 'polygon(100% 0, 100% 100%, 0 100%)'
            }}
          />
          
          {isSelected && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  removeNode(node.id);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
              
              <div
                className="absolute -top-1 -left-1 w-3 h-3 bg-primary border border-white rounded-sm cursor-nw-resize z-10"
                onMouseDown={(e) => handleResizeStart(e, node.id, 'nw')}
              />
              <div
                className="absolute -top-1 -right-1 w-3 h-3 bg-primary border border-white rounded-sm cursor-ne-resize z-10"
                onMouseDown={(e) => handleResizeStart(e, node.id, 'ne')}
              />
              <div
                className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary border border-white rounded-sm cursor-sw-resize z-10"
                onMouseDown={(e) => handleResizeStart(e, node.id, 'sw')}
              />
              <div
                className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary border border-white rounded-sm cursor-se-resize z-10"
                onMouseDown={(e) => handleResizeStart(e, node.id, 'se')}
              />
            </>
          )}
        </div>
      );
    }

    // IMPROVED image nodes - better drag/resize experience
    if (node.type === 'image') {
      return (
        <div
          key={node.id}
          className={`${baseClasses} ${selectedClasses} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} rounded-lg overflow-hidden relative group`}
          style={{
            ...style,
            // Smooth transitions for better UX
            transition: isDragging ? 'none' : 'all 0.15s ease-out',
            // Better shadow for depth
            boxShadow: isDragging ? '0 8px 25px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.1)',
          }}
          onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
          onDoubleClick={() => handleNodeDoubleClick(node.id)}
        >
          {renderContent()}
          
          {/* Hover overlay for better visual feedback */}
          <div className={`absolute inset-0 bg-blue-500 opacity-0 transition-opacity duration-200 pointer-events-none ${
            isSelected ? 'opacity-10' : 'group-hover:opacity-5'
          }`} />
          
          {isSelected && (
            <>
              {/* Delete button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-3 -right-3 h-7 w-7 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full z-20 shadow-lg transition-all duration-200 hover:scale-110"
                onClick={(e) => {
                  e.stopPropagation();
                  removeNode(node.id);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
              
              {/* Enhanced resize handles - larger and more visible */}
              <div
                className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize z-10 shadow-md hover:bg-blue-600 transition-colors"
                onMouseDown={(e) => handleResizeStart(e, node.id, 'nw')}
                title="Resize (maintains aspect ratio)"
              />
              <div
                className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-ne-resize z-10 shadow-md hover:bg-blue-600 transition-colors"
                onMouseDown={(e) => handleResizeStart(e, node.id, 'ne')}
                title="Resize (maintains aspect ratio)"
              />
              <div
                className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-sw-resize z-10 shadow-md hover:bg-blue-600 transition-colors"
                onMouseDown={(e) => handleResizeStart(e, node.id, 'sw')}
                title="Resize (maintains aspect ratio)"
              />
              <div
                className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-se-resize z-10 shadow-md hover:bg-blue-600 transition-colors"
                onMouseDown={(e) => handleResizeStart(e, node.id, 'se')}
                title="Resize (maintains aspect ratio)"
              />
              
              {/* Side handles for free resize */}
              <div
                className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-green-500 border-2 border-white rounded-full cursor-n-resize z-10 shadow-md hover:bg-green-600 transition-colors"
                onMouseDown={(e) => handleResizeStart(e, node.id, 'n')}
                title="Resize height"
              />
              <div
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-green-500 border-2 border-white rounded-full cursor-s-resize z-10 shadow-md hover:bg-green-600 transition-colors"
                onMouseDown={(e) => handleResizeStart(e, node.id, 's')}
                title="Resize height"
              />
              <div
                className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-green-500 border-2 border-white rounded-full cursor-w-resize z-10 shadow-md hover:bg-green-600 transition-colors"
                onMouseDown={(e) => handleResizeStart(e, node.id, 'w')}
                title="Resize width"
              />
              <div
                className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-green-500 border-2 border-white rounded-full cursor-e-resize z-10 shadow-md hover:bg-green-600 transition-colors"
                onMouseDown={(e) => handleResizeStart(e, node.id, 'e')}
                title="Resize width"
              />
            </>
          )}
        </div>
      );
    }

    // Standard Card rendering for other node types
    return (
      <Card
        key={node.id}
        className={`${baseClasses} ${selectedClasses} ${
          node.shape ? shapeClasses[node.shape] : 'rounded-lg'
        } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={style}
        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
        onDoubleClick={() => handleNodeDoubleClick(node.id)}
      >
        <CardContent className="p-3 h-full flex items-center justify-center">
          {renderContent()}
        </CardContent>
        
        {isSelected && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                removeNode(node.id);
              }}
            >
              <X className="w-3 h-3" />
            </Button>
            
            {(node.type === 'text' || node.type === 'sticky-note') && (
              <>
                <div
                  className="absolute -top-1 -left-1 w-3 h-3 bg-primary border border-white rounded-sm cursor-nw-resize z-10"
                  onMouseDown={(e) => handleResizeStart(e, node.id, 'nw')}
                />
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-primary border border-white rounded-sm cursor-ne-resize z-10"
                  onMouseDown={(e) => handleResizeStart(e, node.id, 'ne')}
                />
                <div
                  className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary border border-white rounded-sm cursor-sw-resize z-10"
                  onMouseDown={(e) => handleResizeStart(e, node.id, 'sw')}
                />
                <div
                  className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary border border-white rounded-sm cursor-se-resize z-10"
                  onMouseDown={(e) => handleResizeStart(e, node.id, 'se')}
                />
              </>
            )}
          </>
        )}
      </Card>
    );
  };

  // Save initial state on mount and clear any connection artifacts
  React.useEffect(() => {
    if (mindMapHistory.length === 0) {
      const initialState = { nodes: [...nodes], connections: [...connections] };
      setMindMapHistory([initialState]);
      setMindMapHistoryIndex(0);
    }
    
    // Force clear all connection-related state that might cause blue dots
    setConnectingFrom(null);
    // setConnectionPreview(null); // Disabled to prevent green line artifacts
    setIsDraggingConnection(false);
    setConnectionDragStart(null);
    setHoveredNode(null);
    setDraggedConnection(null);
    setConnectionDragType(null);
    setConnections([]);
    
    // DISABLE CONNECTOR POINTS to prevent any blue dots
    setEnableConnectorPoints(false);
  }, []);

  // DEBUG: Add effect to log selectedColor changes
  React.useEffect(() => {
    console.log('selectedColor changed to:', selectedColor);
  }, [selectedColor]);

  // Handle keyboard shortcuts for text formatting
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editingNode) return;
      
      // Check for formatting shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            toggleBold(editingNode);
            break;
          case 'i':
            e.preventDefault();
            toggleItalic(editingNode);
            break;
          case 'u':
            e.preventDefault();
            toggleUnderline(editingNode);
            break;
        }
      }
    };

    if (editingNode) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingNode, toggleBold, toggleItalic, toggleUnderline]);

  // Global event handlers
  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // ENHANCED: Handle various connection dragging types
      if (draggedConnection && connectionDragType && mapRef.current) {
        const canvasCoords = getCanvasCoordinatesFromGlobal(mapRef, e.clientX, e.clientY, zoom);
        const connection = connections.find(c => c.id === draggedConnection);
        if (connection) {
          if (connectionDragType === 'whole') {
            // Move entire connection
            const deltaX = canvasCoords.x - connectionDragOffset.x;
            const deltaY = canvasCoords.y - connectionDragOffset.y;
            
            updateConnectionPosition(draggedConnection, {
              fromX: connection.fromX + deltaX,
              fromY: connection.fromY + deltaY,
              toX: connection.toX + deltaX,
              toY: connection.toY + deltaY
            });
            
            setConnectionDragOffset(canvasCoords);
          } else if (connectionDragType === 'fromHandle') {
            // Resize from start point
            updateConnectionPosition(draggedConnection, {
              fromX: canvasCoords.x,
              fromY: canvasCoords.y
            });
          } else if (connectionDragType === 'toHandle') {
            // Resize from end point
            updateConnectionPosition(draggedConnection, {
              toX: canvasCoords.x,
              toY: canvasCoords.y
            });
          }
        }
        return;
      }

      // ENHANCED: Handle connection dragging with live preview
      if (isDraggingConnection && connectionDragStart && mapRef.current) {
        const canvasCoords = getCanvasCoordinatesFromGlobal(mapRef, e.clientX, e.clientY, zoom);
        const fromX = connectionDragStart.x;
        const fromY = connectionDragStart.y;
        
        // Calculate distance and angle for display
        const distance = Math.sqrt(Math.pow(canvasCoords.x - fromX, 2) + Math.pow(canvasCoords.y - fromY, 2));
        const angle = Math.atan2(canvasCoords.y - fromY, canvasCoords.x - fromX) * (180 / Math.PI);
        
        // Find potential target node
        const potentialTarget = nodes.find(node => {
          const buffer = 10;
          return canvasCoords.x >= (node.x - buffer) && 
                 canvasCoords.x <= (node.x + node.width + buffer) &&
                 canvasCoords.y >= (node.y - buffer) && 
                 canvasCoords.y <= (node.y + node.height + buffer) &&
                 node.id !== connectionDragStart.nodeId;
        });
        
        // Update preview with enhanced information
        setConnectionPreview({
          fromX,
          fromY,
          toX: canvasCoords.x,
          toY: canvasCoords.y,
          fromNodeId: connectionDragStart.nodeId,
          toNodeId: potentialTarget?.id || null,
          distance: Math.round(distance),
          angle: Math.round(angle)
        });
        
        // Update hover state
        setHoveredNode(potentialTarget?.id || null);
        return;
      }

      // Handle click-to-click connection mode
      if (connectingFrom && !isDraggingConnection) {
        // Connection mode active but no visual preview
        return;
      }

      if (selectedTool === 'draw' && currentDrawingTool === 'eraser') {
        if (isMouseOverCanvas(mapRef, e.clientX, e.clientY) && mapRef.current) {
          const canvasCoords = getCanvasCoordinatesFromGlobal(mapRef, e.clientX, e.clientY, zoom);
          setEraserPosition(canvasCoords);
          applyHoverErasing(canvasCoords);
        } else {
          setEraserPosition(null);
        }
        return;
      }

      // IMPROVED global resize handling with better performance
      if (resizingNode && resizeHandle && mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect();
        const canvasX = (e.clientX - rect.left) / zoom;
        const canvasY = (e.clientY - rect.top) / zoom;
        
        const deltaX = canvasX - resizeStartPosition.x;
        const deltaY = canvasY - resizeStartPosition.y;
        
        const node = nodes.find(n => n.id === resizingNode);
        if (!node) return;

        let newWidth = resizeStartDimensions.width;
        let newHeight = resizeStartDimensions.height;
        let newX = resizeStartDimensions.x;
        let newY = resizeStartDimensions.y;

        // Determine minimum sizes based on node type
        const minWidth = node.type === 'image' ? 30 : 50;
        const minHeight = node.type === 'image' ? 30 : 30;
        
        // For images, maintain aspect ratio when using corner handles
        const maintainAspectRatio = node.type === 'image' && ['nw', 'ne', 'sw', 'se'].includes(resizeHandle);
        
        if (maintainAspectRatio) {
          const aspectRatio = resizeStartDimensions.width / resizeStartDimensions.height;
          
          switch (resizeHandle) {
            case 'nw':
              const nwScale = Math.max(
                minWidth / resizeStartDimensions.width,
                minHeight / resizeStartDimensions.height,
                Math.min(
                  (resizeStartDimensions.width - deltaX) / resizeStartDimensions.width,
                  (resizeStartDimensions.height - deltaY) / resizeStartDimensions.height
                )
              );
              newWidth = resizeStartDimensions.width * nwScale;
              newHeight = resizeStartDimensions.height * nwScale;
              newX = resizeStartDimensions.x + (resizeStartDimensions.width - newWidth);
              newY = resizeStartDimensions.y + (resizeStartDimensions.height - newHeight);
              break;
            case 'ne':
              const neScale = Math.max(
                minWidth / resizeStartDimensions.width,
                minHeight / resizeStartDimensions.height,
                Math.min(
                  (resizeStartDimensions.width + deltaX) / resizeStartDimensions.width,
                  (resizeStartDimensions.height - deltaY) / resizeStartDimensions.height
                )
              );
              newWidth = resizeStartDimensions.width * neScale;
              newHeight = resizeStartDimensions.height * neScale;
              newY = resizeStartDimensions.y + (resizeStartDimensions.height - newHeight);
              break;
            case 'sw':
              const swScale = Math.max(
                minWidth / resizeStartDimensions.width,
                minHeight / resizeStartDimensions.height,
                Math.min(
                  (resizeStartDimensions.width - deltaX) / resizeStartDimensions.width,
                  (resizeStartDimensions.height + deltaY) / resizeStartDimensions.height
                )
              );
              newWidth = resizeStartDimensions.width * swScale;
              newHeight = resizeStartDimensions.height * swScale;
              newX = resizeStartDimensions.x + (resizeStartDimensions.width - newWidth);
              break;
            case 'se':
              const seScale = Math.max(
                minWidth / resizeStartDimensions.width,
                minHeight / resizeStartDimensions.height,
                Math.min(
                  (resizeStartDimensions.width + deltaX) / resizeStartDimensions.width,
                  (resizeStartDimensions.height + deltaY) / resizeStartDimensions.height
                )
              );
              newWidth = resizeStartDimensions.width * seScale;
              newHeight = resizeStartDimensions.height * seScale;
              break;
          }
        } else {
          // Standard resize without aspect ratio constraint
          switch (resizeHandle) {
            case 'nw':
              newWidth = Math.max(minWidth, resizeStartDimensions.width - deltaX);
              newHeight = Math.max(minHeight, resizeStartDimensions.height - deltaY);
              newX = resizeStartDimensions.x + (resizeStartDimensions.width - newWidth);
              newY = resizeStartDimensions.y + (resizeStartDimensions.height - newHeight);
              break;
            case 'ne':
              newWidth = Math.max(minWidth, resizeStartDimensions.width + deltaX);
              newHeight = Math.max(minHeight, resizeStartDimensions.height - deltaY);
              newY = resizeStartDimensions.y + (resizeStartDimensions.height - newHeight);
              break;
            case 'sw':
              newWidth = Math.max(minWidth, resizeStartDimensions.width - deltaX);
              newHeight = Math.max(minHeight, resizeStartDimensions.height + deltaY);
              newX = resizeStartDimensions.x + (resizeStartDimensions.width - newWidth);
              break;
            case 'se':
              newWidth = Math.max(minWidth, resizeStartDimensions.width + deltaX);
              newHeight = Math.max(minHeight, resizeStartDimensions.height + deltaY);
              break;
            case 'n':
              newHeight = Math.max(minHeight, resizeStartDimensions.height - deltaY);
              newY = resizeStartDimensions.y + (resizeStartDimensions.height - newHeight);
              break;
            case 's':
              newHeight = Math.max(minHeight, resizeStartDimensions.height + deltaY);
              break;
            case 'e':
              newWidth = Math.max(minWidth, resizeStartDimensions.width + deltaX);
              break;
            case 'w':
              newWidth = Math.max(minWidth, resizeStartDimensions.width - deltaX);
              newX = resizeStartDimensions.x + (resizeStartDimensions.width - newWidth);
              break;
          }
        }

        // Throttle updates for performance
        const now = Date.now();
        if (!window.lastResizeUpdate || now - window.lastResizeUpdate > 16) { // ~60fps
          updateNodes(nodes.map(n => 
            n.id === resizingNode 
              ? { ...n, width: Math.round(newWidth), height: Math.round(newHeight), x: Math.round(newX), y: Math.round(newY) }
              : n
          ));
          (window as any).lastResizeUpdate = now;
        }
        return;
      }

      // IMPROVED node dragging with throttling for performance
      if (!draggedNode || !mapRef.current || selectedTool !== 'select' || !isDraggingRef.current) return;

      const rect = mapRef.current.getBoundingClientRect();
      // Allow unlimited movement for all node types including images
      const x = (e.clientX - rect.left - dragOffset.x) / zoom;
      const y = (e.clientY - rect.top - dragOffset.y) / zoom;

      // Throttle drag updates for better performance (especially for images)
      const now = Date.now();
      if (!window.lastDragUpdate || now - window.lastDragUpdate > 8) { // ~120fps for smoother dragging
        setDragPosition({ x: Math.round(x), y: Math.round(y) });
        (window as any).lastDragUpdate = now;
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      // Handle connection drag completion
      if (draggedConnection) {
        if (connectionDragType === 'whole') {
          saveMindMapState();
        }
        setDraggedConnection(null);
        setConnectionDragType(null);
        setConnectionDragOffset({ x: 0, y: 0 });
        return;
      }

      // IMPROVED connection completion on global mouse up
      if (isDraggingConnection && connectionDragStart && mapRef.current) {
        const canvasCoords = getCanvasCoordinatesFromGlobal(mapRef, e.clientX, e.clientY, zoom);
        const fromX = connectionDragStart.x;
        const fromY = connectionDragStart.y;
        
        // Improved target node detection with buffer
        const targetNode = nodes.find(node => {
          const buffer = 5; // Small buffer for easier targeting
          return canvasCoords.x >= (node.x - buffer) && 
                 canvasCoords.x <= (node.x + node.width + buffer) &&
                 canvasCoords.y >= (node.y - buffer) && 
                 canvasCoords.y <= (node.y + node.height + buffer) &&
                 node.id !== connectionDragStart.nodeId;
        });
        
        const fromNodeId = connectionDragStart.nodeId || null;
        const toNodeId = targetNode ? targetNode.id : null;
        
        // Calculate drag distance
        const dragDistance = Math.hypot(canvasCoords.x - fromX, canvasCoords.y - fromY);
        const minDragDistance = 15; // Minimum distance for freeform connections
        
        // Create connection with more lenient conditions
        if (fromNodeId || toNodeId || dragDistance > minDragDistance) {
          // Adjust target coordinates if connecting to a node
          const finalToX = targetNode ? (targetNode.x + targetNode.width / 2) : canvasCoords.x;
          const finalToY = targetNode ? (targetNode.y + targetNode.height / 2) : canvasCoords.y;
          
          createConnection(fromNodeId, toNodeId, fromX, fromY, finalToX, finalToY);
        } else {
          clearConnectionState();
        }
        return;
      }

      if (resizingNode) {
        handleResizeEnd();
        return;
      }

      if (draggedNode && isDraggingRef.current) {
        const draggedNodeData = nodes.find(n => n.id === draggedNode);
        if (draggedNodeData && (draggedNodeData.x !== dragPosition.x || draggedNodeData.y !== dragPosition.y)) {
          saveMindMapState();
        }
        // Update position for all node types including images without constraints
        updateNodes(nodes.map(node => 
          node.id === draggedNode 
            ? { ...node, x: dragPosition.x, y: dragPosition.y }
            : node
        ));
      }
      
      setDraggedNode(null);
      isDraggingRef.current = false;
      
      if (isCreatingByDrag && dragPreview.isActive) {
        createNodeFromDrag();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingNode) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoMindMap();
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redoMindMap();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedObject();
        return;
      }

      if (e.key === 'Escape' && selectedTool === 'draw' && (isDrawing || drawingStrokes.length > 0)) {
        finishDrawing();
      }

      // Clear connection state on Escape
      if (e.key === 'Escape' && selectedTool === 'connection') {
        clearConnectionState();
      }
    };

    if ((selectedTool === 'draw' && currentDrawingTool === 'eraser') || draggedNode || isCreatingByDrag || resizingNode || isDraggingConnection || draggedConnection) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [draggedNode, dragOffset, zoom, dragPosition, nodes, updateNodes, isCreatingByDrag, dragPreview, selectedTool, isDrawing, drawingStrokes, currentDrawingTool, brushSize, hasErasingStarted, resizingNode, isDraggingConnection, editingNode, selectedNode, selectedConnection, draggedConnection, connectionDragType, connectionDragOffset]);

  return (
    <div className="flex h-full bg-background border rounded-lg overflow-hidden">
      {/* Complete Toolbar */}
      <div className="w-16 flex flex-col items-center py-4 space-y-1" style={{ backgroundColor: '#42352f' }}>
        {/* Select Tool */}
        <Button
          variant={selectedTool === 'select' ? 'default' : 'ghost'}
          size="sm"
          className="w-12 h-12 p-0 text-white hover:bg-gray-700"
          onClick={() => handleToolSelection('select')}
          title="Select"
        >
          <MousePointer className="w-5 h-5" />
        </Button>

        {/* Sticky Notes */}
        <Dialog open={isStickyNotePickerOpen} onOpenChange={setIsStickyNotePickerOpen}>
          <DialogTrigger asChild>
            <Button
              variant={selectedTool === 'sticky-note' ? 'default' : 'ghost'}
              size="sm"
              className="w-12 h-12 p-0 text-white hover:bg-gray-700"
              title="Sticky notes"
            >
              <StickyNote className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Sticky notes</DialogTitle>
              <DialogDescription>
                Capture ideas quickly, and organize them by shape or color. Drag to create custom sizes. Select notes to resize them with the handles that appear.
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeShapeTab} onValueChange={(value) => setActiveShapeTab(value as MindMapNode['shape'])}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sticky-note">Square</TabsTrigger>
                <TabsTrigger value="rectangle">Rectangle</TabsTrigger>
                <TabsTrigger value="circle">Circle</TabsTrigger>
              </TabsList>

              {(['sticky-note', 'rectangle', 'circle'] as const).map((shapeType) => (
                <TabsContent key={shapeType} value={shapeType} className="mt-4">
                  <div className="grid grid-cols-4 gap-3">
                    {colorOptions.map((color) => (
                      <Button
                        key={`${shapeType}-${color.name}`}
                        variant="ghost"
                        className="h-auto p-2 hover:bg-muted/50 flex flex-col items-center gap-2"
                        onClick={() => {
                          // DEBUG: Log what we're clicking
                          console.log('Color button clicked:', color.name, color.value);
                          handleToolSelection('sticky-note', { shape: shapeType, color: color.value });
                        }}
                      >
                        {renderShapePreview(shapeType, color.value)}
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Text */}
        <Dialog open={isTextPickerOpen} onOpenChange={setIsTextPickerOpen}>
          <DialogTrigger asChild>
            <Button
              variant={selectedTool === 'text' ? 'default' : 'ghost'}
              size="sm"
              className="w-12 h-12 p-0 text-white hover:bg-gray-700"
              title="Text"
            >
              <Type className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Text</DialogTitle>
              <DialogDescription>
                Say more with rich-text paragraphs. Add headings for organization. Drag to create custom text boxes.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-4">
              {Object.entries(textTypes).map(([type, config]) => (
                <Button
                  key={type}
                  variant="ghost"
                  className="h-24 flex flex-col items-center gap-2 hover:bg-muted/50"
                  onClick={() => handleToolSelection('text', { textType: type })}
                >
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                    <config.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm">{config.label}</span>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Connections & Shapes */}
        <Dialog open={isConnectionPickerOpen} onOpenChange={setIsConnectionPickerOpen}>
          <DialogTrigger asChild>
            <Button
              variant={selectedTool === 'connection' ? 'default' : 'ghost'}
              size="sm"
              className="w-12 h-12 p-0 text-white hover:bg-gray-700"
              title="Shapes and connectors"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Shapes and arrow connectors</DialogTitle>
              <DialogDescription>
                Add shapes and use arrow connectors to create diagrams. All connections automatically include start circles and end arrows.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Arrow Connectors</h3>
                <div className="grid grid-cols-4 gap-2">
                  {connectionTypes.map((conn) => (
                    <Button
                      key={conn.type}
                      variant="ghost"
                      className="h-12 flex flex-col items-center justify-center hover:bg-muted/50 gap-1"
                      onClick={() => handleToolSelection('connection', { type: conn.type })}
                    >
                      <conn.icon className="w-5 h-5" />
                      <span className="text-xs">{conn.label}</span>
                    </Button>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Enable connector points</span>
                    <Button
                      variant="ghost" 
                      size="sm"
                      className="h-6 w-6 p-0"
                      title="When enabled, blue circles will appear on shapes for precise connections. When disabled, you can connect freely to any position."
                    >
                      <Info className="w-4 h-4" />
                    </Button>
                  </div>
                  <Switch 
                    checked={enableConnectorPoints} 
                    onCheckedChange={setEnableConnectorPoints}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Shapes</h3>
                <div className="grid grid-cols-4 gap-2">
                  {shapeTypes.map((shape) => (
                    <Button
                      key={shape.shape}
                      variant="ghost"
                      className="h-12 flex items-center justify-center hover:bg-muted/50"
                      onClick={() => {
                        setSelectedShape(shape.shape);
                        setSelectedTool('shape');
                        setIsConnectionPickerOpen(false);
                      }}
                    >
                      <shape.icon className="w-6 h-6" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Icons */}
        <Dialog open={isIconPickerOpen} onOpenChange={setIsIconPickerOpen}>
          <DialogTrigger asChild>
            <Button
              variant={selectedTool === 'icon' ? 'default' : 'ghost'}
              size="sm"
              className="w-12 h-12 p-0 text-white hover:bg-gray-700"
              title="Icons"
            >
              <Star className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Icons</DialogTitle>
              <DialogDescription>
                Add visual elements to enhance your mind map.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-6 gap-2">
              {iconOptions.map((icon) => (
                <Button
                  key={icon.name}
                  variant="ghost"
                  className="h-12 w-12 p-0 hover:bg-muted/50"
                  onClick={() => handleToolSelection('icon', { icon: icon.name })}
                >
                  <icon.icon className="w-6 h-6" />
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Upload */}
        <Button
          variant={selectedTool === 'image' ? 'default' : 'ghost'}
          size="sm"
          className="w-12 h-12 p-0 text-white hover:bg-gray-700"
          onClick={() => fileInputRef.current?.click()}
          title="Image"
        >
          <ImageIcon className="w-5 h-5" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Drawing */}
        <Button
          variant={selectedTool === 'draw' ? 'default' : 'ghost'}
          size="sm"
          className="w-12 h-12 p-0 text-white hover:bg-gray-700"
          onClick={() => handleToolSelection('draw')}
          title="Draw"
        >
          <Pencil className="w-5 h-5" />
        </Button>

        <div className="w-8 h-px bg-gray-600 my-2"></div>

        {/* Delete */}
        <Button
          variant={selectedTool === 'delete' ? 'default' : 'ghost'}
          size="sm"
          className="w-12 h-12 p-0 text-white hover:bg-gray-700"
          onClick={() => handleToolSelection('delete')}
          title="Delete"
        >
          <Trash2 className="w-5 h-5" />
        </Button>

        <div className="w-8 h-px bg-gray-600 my-2"></div>

        {/* Undo */}
        <Button
          variant="ghost"
          size="sm"
          className="w-12 h-12 p-0 text-white hover:bg-gray-700"
          onClick={undoMindMap}
          disabled={mindMapHistoryIndex <= 0}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-5 h-5" />
        </Button>

        {/* Redo */}
        <Button
          variant="ghost"
          size="sm"
          className="w-12 h-12 p-0 text-white hover:bg-gray-700"
          onClick={redoMindMap}
          disabled={mindMapHistoryIndex >= mindMapHistory.length - 1}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-5 h-5" />
        </Button>

        <div className="flex-1"></div>

        {/* Zoom Controls */}
        <Button
          variant="ghost"
          size="sm"
          className="w-12 h-12 p-0 text-white hover:bg-gray-700"
          onClick={() => setZoom(Math.min(zoom + 0.1, 2))}
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="w-12 h-12 p-0 text-white hover:bg-gray-700"
          onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Drawing Toolbar */}
        {renderDrawingToolbar()}

        {/* Enhanced Text Formatting Toolbar - Complete Professional Version */}
        {editingNode && (() => {
          const node = nodes.find(n => n.id === editingNode);
          if (!node || (node.type !== 'text' && node.type !== 'sticky-note')) return null;
          
          const toolbarPosition = calculateEditingToolbarPosition(node);
          
          return (
            <div 
              className="fixed bg-white border border-gray-200 rounded-lg shadow-2xl flex items-center gap-1"
              style={{
                left: Math.max(10, toolbarPosition.x - 200),
                top: Math.max(10, toolbarPosition.y - 60),
                zIndex: 999999,
                pointerEvents: 'auto',
                padding: '6px 8px',
                fontSize: '14px'
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsInteractingWithToolbar(true);
              }}
              onMouseEnter={() => setIsInteractingWithToolbar(true)}
              onMouseLeave={() => setIsInteractingWithToolbar(false)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsInteractingWithToolbar(true);
              }}
            >
              {/* Font Size Input with Dropdown */}
              <div className="relative" title="Font Size">
                <Popover>
                  <PopoverTrigger asChild>
                    <button 
                      className="flex items-center h-7 min-w-16 border border-gray-300 rounded bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors px-2 gap-1"
                      onMouseEnter={() => setIsInteractingWithToolbar(true)}
                      onMouseLeave={() => setIsInteractingWithToolbar(false)}
                    >
                      <span className="text-sm text-gray-700">{node.fontSize || 14}</span>
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-32 p-2"
                    style={{ zIndex: 1000001 }}
                    onMouseEnter={() => setIsInteractingWithToolbar(true)}
                    onMouseLeave={() => setIsInteractingWithToolbar(false)}
                  >
                    <div className="space-y-2">
                      {/* Custom input field */}
                      <div className="border-b border-gray-200 pb-2">
                        <input
                          type="number"
                          value={node.fontSize || 14}
                          onChange={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const size = parseInt(e.target.value) || 14;
                            if (size >= 6 && size <= 72) {
                              console.log('📝 Font size input changed to:', size);
                              changeFontSize(editingNode, size);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.stopPropagation();
                            }
                          }}
                          onFocus={() => setIsInteractingWithToolbar(true)}
                          onBlur={() => {
                            setTimeout(() => setIsInteractingWithToolbar(false), 200);
                          }}
                          className="w-full h-7 px-2 text-sm border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="6"
                          max="72"
                          placeholder="Custom size"
                        />
                      </div>
                      
                      {/* Preset size options */}
                      <div className="max-h-32 overflow-y-auto">
                        {[6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 48, 72].map(size => (
                          <button
                            key={size}
                            className={`w-full px-2 py-1 text-left text-sm hover:bg-gray-100 rounded flex items-center justify-between transition-colors ${
                              (node.fontSize || 14) === size ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('📋 Font size selected from dropdown:', size);
                              changeFontSize(editingNode, size);
                            }}
                          >
                            <span>{size}px</span>
                            {(node.fontSize || 14) === size && (
                              <span className="text-blue-700">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Separator */}
              <div className="w-px h-5 bg-gray-300 mx-2" />

              {/* Bold Button */}
              <button
                className={`h-7 w-7 rounded flex items-center justify-center transition-colors ${
                  node.fontWeight === 'bold' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'hover:bg-gray-100 border border-transparent'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsInteractingWithToolbar(true);
                  toggleBold(editingNode);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsInteractingWithToolbar(true);
                }}
                title="Bold (Ctrl+B)"
              >
                <Bold className="w-4 h-4" />
              </button>
              
              {/* Italic Button */}
              <button
                className={`h-7 w-7 rounded flex items-center justify-center transition-colors ${
                  node.fontStyle === 'italic' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'hover:bg-gray-100 border border-transparent'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleItalic(editingNode);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                title="Italic (Ctrl+I)"
              >
                <Italic className="w-4 h-4" />
              </button>
              
              {/* Underline Button */}
              <button
                className={`h-7 w-7 rounded flex items-center justify-center transition-colors ${
                  node.textDecoration === 'underline' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'hover:bg-gray-100 border border-transparent'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleUnderline(editingNode);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                title="Underline (Ctrl+U)"
              >
                <Underline className="w-4 h-4" />
              </button>

              {/* Separator */}
              <div className="w-px h-5 bg-gray-300 mx-2" />
              
              {/* Text Alignment */}
              <button
                className={`h-7 w-7 rounded flex items-center justify-center transition-colors ${
                  node.textAlign === 'left' || !node.textAlign
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'hover:bg-gray-100 border border-transparent'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  changeTextAlign(editingNode, 'left');
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                title="Align Left"
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              
              <button
                className={`h-7 w-7 rounded flex items-center justify-center transition-colors ${
                  node.textAlign === 'center'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'hover:bg-gray-100 border border-transparent'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  changeTextAlign(editingNode, 'center');
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                title="Align Center"
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              
              <button
                className={`h-7 w-7 rounded flex items-center justify-center transition-colors ${
                  node.textAlign === 'right'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'hover:bg-gray-100 border border-transparent'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  changeTextAlign(editingNode, 'right');
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                title="Align Right"
              >
                <AlignRight className="w-4 h-4" />
              </button>

              {/* Separator */}
              <div className="w-px h-5 bg-gray-300 mx-2" />

              {/* Text Color Picker */}
              <div className="relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={`h-7 w-7 rounded flex items-center justify-center transition-colors hover:bg-gray-100 border border-transparent relative`}
                      title="Text Color"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-3 text-gray-700 mb-0.5">A</div>
                        <div 
                          className="w-4 h-1 rounded-sm"
                          style={{ backgroundColor: node.textColor || '#000000' }}
                        />
                      </div>
                      <ChevronDown className="w-2 h-2 absolute -bottom-0.5 -right-0.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-64 p-3"
                    style={{ zIndex: 1000000 }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Text Color</h4>
                      <div className="grid grid-cols-8 gap-2">
                        {[
                          '#000000', '#1f2937', '#374151', '#6b7280',
                          '#dc2626', '#ea580c', '#d97706', '#ca8a04',
                          '#65a30d', '#16a34a', '#059669', '#0891b2',
                          '#0284c7', '#2563eb', '#4f46e5', '#7c3aed',
                          '#a21caf', '#be185d', '#e11d48', '#f43f5e',
                          '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db'
                        ].map(color => (
                          <button
                            key={color}
                            className={`w-6 h-6 rounded border-2 hover:scale-110 transition-transform ${
                              node.textColor === color ? 'border-gray-800 ring-2 ring-blue-300' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              changeTextColor(editingNode, color);
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Link Tool */}
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    className={`h-7 w-7 rounded flex items-center justify-center transition-colors ${
                      node.linkUrl 
                        ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                        : 'hover:bg-gray-100 border border-transparent'
                    }`}
                    title="Add/Edit Link"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <Link2 className="w-4 h-4" />
                  </button>
                </DialogTrigger>
                <DialogContent 
                  className="sm:max-w-md"
                  style={{ zIndex: 1000000 }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <DialogHeader>
                    <DialogTitle>Add Link</DialogTitle>
                    <DialogDescription>
                      Make this text clickable by adding a URL
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="https://example.com"
                      defaultValue={node.linkUrl || ''}
                      className="w-full"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const target = e.target as HTMLInputElement;
                          if (target.value.trim()) {
                            addLink(editingNode, target.value.trim());
                          }
                          // Close dialog
                          const dialog = e.currentTarget.closest('[role="dialog"]');
                          const closeButton = dialog?.querySelector('[data-radix-dialog-close]') as HTMLButtonElement;
                          closeButton?.click();
                        }
                      }}
                    />
                    <div className="flex gap-2 justify-end">
                      {node.linkUrl && (
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            removeLink(editingNode);
                          }}
                        >
                          Remove Link
                        </Button>
                      )}
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          const input = e.currentTarget.parentElement?.parentElement?.querySelector('input') as HTMLInputElement;
                          if (input?.value.trim()) {
                            addLink(editingNode, input.value.trim());
                          }
                          // Close dialog
                          const dialog = e.currentTarget.closest('[role="dialog"]');
                          const closeButton = dialog?.querySelector('[data-radix-dialog-close]') as HTMLButtonElement;
                          closeButton?.click();
                        }}
                      >
                        Add Link
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Separator */}
              <div className="w-px h-5 bg-gray-300 mx-2" />

              {/* Close/Done Button */}
              <button
                className="h-7 w-7 rounded flex items-center justify-center transition-colors hover:bg-gray-100 border border-transparent"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsInteractingWithToolbar(false);
                  exitEditMode();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                title="Done Editing"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })()}

        {/* DEBUGGED: Add debug info in header when not hidden */}
        {!hideHeader && (
          <div className="p-3 border-b bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-medium">Research Mind Map</h2>
                <Badge variant="secondary" className="text-xs">
                  {nodes.length} nodes
                </Badge>

                {mindMapHistory.length > 1 && (
                  <Badge variant="outline" className="text-xs">
                    History: {mindMapHistoryIndex + 1}/{mindMapHistory.length}
                  </Badge>
                )}
                {selectedTool === 'draw' && (
                  <Badge variant="outline" className="text-xs">
                    Drawing Mode • {currentDrawingTool.charAt(0).toUpperCase() + currentDrawingTool.slice(1)}
                    {currentDrawingTool === 'eraser' && ` (${brushSize}px)`}
                  </Badge>
                )}
                {editingNode && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    Editing Mode • Use toolbar above
                  </Badge>
                )}
                {(selectedNode || selectedConnection) && !editingNode && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    {selectedConnection ? 'Connection' : 'Object'} Selected • Press Delete to remove
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground">
                  Zoom: {Math.round(zoom * 100)}%
                </div>
                {onMaximize && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMaximize}
                    title="Open in fullscreen"
                    className="h-8 w-8 p-0"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {isAddingNode && (selectedTool === 'sticky-note' || selectedTool === 'text') && (
              <div className="mt-3 flex gap-2">
                <Input
                  placeholder="Enter content..."
                  value={newNodeContent}
                  onChange={(e) => setNewNodeContent(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  autoFocus
                  className="flex-1"
                />
                <Button 
                  onClick={() => {
                    setIsAddingNode(false);
                    setSelectedTool('select');
                  }} 
                  variant="outline" 
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Canvas */}
        <div 
          ref={mapRef}
          className="flex-1 relative overflow-auto bg-gray-50 select-none"
          onMouseDown={handleMapMouseDown}
          onMouseMove={handleMapMouseMove}
          onMouseUp={handleMapMouseUp}
          onMouseLeave={handleMapMouseUp}
          style={{ 
            cursor: (selectedTool === 'sticky-note' || selectedTool === 'text') && isAddingNode ? 'crosshair' : 
                   selectedTool === 'icon' ? 'crosshair' :
                   selectedTool === 'connection' ? 'crosshair' :
                   selectedTool === 'delete' ? 'not-allowed' : 
                   selectedTool === 'draw' ? (currentDrawingTool === 'eraser' ? 'none' : 'crosshair') :
                   draggedNode || draggedConnection ? 'grabbing' : 'default' 
          }}
        >
          {/* SVG Layer for connections and connection points */}
          <svg 
            className="absolute inset-0"
            style={{ 
              width: '100%', 
              height: '100%',
              zIndex: 10,
              pointerEvents: 'none'
            }}
          >
            <defs>
              {/* Only arrowhead markers - no blue dots */}
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon
                  points="0 0, 8 3, 0 6"
                  fill="#000000"
                  stroke="#000000"
                  strokeWidth="1"
                  strokeLinejoin="miter"
                />
              </marker>
              
              <marker
                id="freeform-arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon
                  points="0 0, 8 3, 0 6"
                  fill="#000000"
                  stroke="#000000"
                  strokeWidth="1"
                  strokeLinejoin="miter"
                />
              </marker>
              
              <marker
                id="preview-arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon
                  points="0 0, 8 3, 0 6"
                  fill="#10b981"
                  stroke="#10b981"
                  strokeWidth="1"
                  strokeLinejoin="miter"
                />
              </marker>
              
              <marker
                id="blue-preview-arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon
                  points="0 0, 8 3, 0 6"
                  fill="#3b82f6"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  strokeLinejoin="miter"
                />
              </marker>
            </defs>

            {/* ENHANCED: Render connections with resize handles */}
            {connections.map(connection => {
              const path = generateConnectionPath(connection);
              const isDotted = connection.type === 'dotted';
              const isFreeform = !connection.fromNode || !connection.toNode;
              const isSelected = selectedConnection === connection.id;
              
              return (
                <g key={connection.id}>
                  {/* Invisible wider path for easier clicking */}
                  <path
                    d={path}
                    stroke="transparent"
                    strokeWidth="12"
                    fill="none"
                    style={{
                      pointerEvents: 'auto',
                      cursor: selectedTool === 'delete' ? 'not-allowed' : 
                              selectedTool === 'select' ? 'grab' : 'default'
                    }}
                    onClick={(e) => handleConnectionClick(e, connection.id)}
                    transform={`scale(${zoom})`}
                    transformOrigin="0 0"
                  />
                  
                  {/* Visible path */}
                  <path
                    d={path}
                    stroke={isSelected ? "#2563eb" : "#000000"}
                    strokeWidth={isSelected ? "3" : "2"}
                    fill="none"
                    strokeDasharray={isDotted ? "5,5" : "none"}
                    markerEnd={isFreeform ? "url(#freeform-arrowhead)" : "url(#arrowhead)"}
                    style={{ pointerEvents: 'none' }}
                    transform={`scale(${zoom})`}
                    transformOrigin="0 0"
                  />
                  
                  {/* ENHANCED: Resize handles for selected connections */}
                  {isSelected && selectedTool === 'select' && (
                    <g>
                      {/* From handle */}
                      <circle
                        cx={connection.fromX * zoom}
                        cy={connection.fromY * zoom}
                        r="6"
                        fill="#2563eb"
                        stroke="white"
                        strokeWidth="2"
                        style={{
                          pointerEvents: 'auto',
                          cursor: 'crosshair'
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const { x, y } = getCanvasCoordinates(mapRef, e.nativeEvent, zoom);
                          setDraggedConnection(connection.id);
                          setConnectionDragType('fromHandle');
                          setConnectionDragOffset({ x, y });
                        }}
                      />
                      
                      {/* To handle */}
                      <circle
                        cx={connection.toX * zoom}
                        cy={connection.toY * zoom}
                        r="6"
                        fill="#10b981"
                        stroke="white"
                        strokeWidth="2"
                        style={{
                          pointerEvents: 'auto',
                          cursor: 'crosshair'
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const { x, y } = getCanvasCoordinates(mapRef, e.nativeEvent, zoom);
                          setDraggedConnection(connection.id);
                          setConnectionDragType('toHandle');
                          setConnectionDragOffset({ x, y });
                        }}
                      />
                      
                      {/* Distance and angle info for selected connection */}
                      {(() => {
                        const distance = Math.sqrt(
                          Math.pow(connection.toX - connection.fromX, 2) + 
                          Math.pow(connection.toY - connection.fromY, 2)
                        );
                        const angle = Math.atan2(
                          connection.toY - connection.fromY, 
                          connection.toX - connection.fromX
                        ) * (180 / Math.PI);
                        
                        return (
                          <g>
                            {/* Info background */}
                            <rect
                              x={(connection.fromX + connection.toX) / 2 * zoom - 30}
                              y={(connection.fromY + connection.toY) / 2 * zoom - 30}
                              width="60"
                              height="20"
                              fill="rgba(37, 99, 235, 0.9)"
                              rx="4"
                              style={{ pointerEvents: 'none' }}
                            />
                            
                            {/* Distance and angle text */}
                            <text
                              x={(connection.fromX + connection.toX) / 2 * zoom}
                              y={(connection.fromY + connection.toY) / 2 * zoom - 16}
                              textAnchor="middle"
                              fill="white"
                              fontSize="10"
                              fontFamily="system-ui"
                              fontWeight="500"
                              style={{ pointerEvents: 'none' }}
                            >
                              {Math.round(distance)}px • {Math.round(angle)}°
                            </text>
                          </g>
                        );
                      })()}
                    </g>
                  )}
                </g>
              );
            })}

            {/* ENHANCED: Connection Preview with Direction and Size Info */}
            {connectionPreview && (
              <g>
                {/* Preview line */}
                <path
                  d={`M ${connectionPreview.fromX * zoom} ${connectionPreview.fromY * zoom} L ${connectionPreview.toX * zoom} ${connectionPreview.toY * zoom}`}
                  stroke={connectionPreview.toNodeId ? "#10b981" : "#3b82f6"}
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="8,4"
                  markerEnd={connectionPreview.toNodeId ? "url(#preview-arrowhead)" : "url(#blue-preview-arrowhead)"}
                  opacity="0.7"
                  style={{ pointerEvents: 'none' }}
                />
                
                {/* Distance and angle indicators */}
                {connectionPreview.distance !== undefined && connectionPreview.distance > 30 && (
                  <g>
                    {/* Distance label background */}
                    <rect
                      x={(connectionPreview.fromX + connectionPreview.toX) / 2 * zoom - 25}
                      y={(connectionPreview.fromY + connectionPreview.toY) / 2 * zoom - 12}
                      width="50"
                      height="24"
                      fill="rgba(0, 0, 0, 0.8)"
                      rx="4"
                      style={{ pointerEvents: 'none' }}
                    />
                    
                    {/* Distance text */}
                    <text
                      x={(connectionPreview.fromX + connectionPreview.toX) / 2 * zoom}
                      y={(connectionPreview.fromY + connectionPreview.toY) / 2 * zoom + 4}
                      textAnchor="middle"
                      fill="white"
                      fontSize="10"
                      fontFamily="system-ui"
                      style={{ pointerEvents: 'none' }}
                    >
                      {connectionPreview.distance}px
                    </text>
                    
                    {/* Angle indicator */}
                    <text
                      x={(connectionPreview.fromX + connectionPreview.toX) / 2 * zoom}
                      y={(connectionPreview.fromY + connectionPreview.toY) / 2 * zoom - 18}
                      textAnchor="middle"
                      fill={connectionPreview.toNodeId ? "#10b981" : "#3b82f6"}
                      fontSize="9"
                      fontFamily="system-ui"
                      fontWeight="500"
                      style={{ pointerEvents: 'none' }}
                    >
                      {connectionPreview.angle}°
                    </text>
                  </g>
                )}
                
                {/* Connection point indicators */}
                <circle
                  cx={connectionPreview.fromX * zoom}
                  cy={connectionPreview.fromY * zoom}
                  r="4"
                  fill={connectionPreview.fromNodeId ? "#10b981" : "#3b82f6"}
                  stroke="white"
                  strokeWidth="2"
                  style={{ pointerEvents: 'none' }}
                />
                
                <circle
                  cx={connectionPreview.toX * zoom}
                  cy={connectionPreview.toY * zoom}
                  r="4"
                  fill={connectionPreview.toNodeId ? "#10b981" : "#3b82f6"}
                  stroke="white"
                  strokeWidth="2"
                  style={{ pointerEvents: 'none' }}
                />
              </g>
            )}

            {/* COMPLETE REMOVAL: All connection points and visual feedback dots */}
            {/* 
              ALL CONNECTION POINT RENDERING COMPLETELY DISABLED:
              - No blue dots on nodes
              - No connection points circles  
              - No visual preview elements
              - No hover indicators
              - No connection guide dots or lines
            */}
          </svg>

          <div style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
            {nodes.map(node => (
              <div
                key={node.id}
                onMouseEnter={() => handleNodeMouseEnter(node.id)}
                onMouseLeave={handleNodeMouseLeave}
                className={`${selectedTool === 'connection' ? 'cursor-crosshair' : ''} relative`}
                style={{
                  transition: isDraggingConnection ? 'all 0.2s ease' : 'none'
                }}
              >
                {renderNode(node)}
                
                {/* All resize handle dots completely removed */}
              </div>
            ))}
            {renderDragPreview()}
          </div>
          {renderDrawingStrokes()}

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-muted-foreground">
                <p className="text-sm">Use the toolbar to add sticky notes, text, images, and connections</p>
                <p className="text-xs mt-1">
                  Double-click any note to <strong>edit and format text</strong> • Drag to move • Drag to create custom sizes • Select to resize • Press Delete to remove
                </p>
                <p className="text-xs mt-1 text-blue-600">
                  💡 Double-click notes to access font size, bold/italic/underline, colors, and more formatting options!
                </p>
              </div>
            </div>
          )}

          {/* Help messages */}
          {(isAddingNode && (selectedTool === 'sticky-note' || selectedTool === 'text')) && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-card border rounded-lg p-2 shadow-lg">
              <p className="text-xs text-muted-foreground">
                Drag to create a {selectedTool === 'sticky-note' ? 'sticky note' : 'text box'} with custom size
              </p>
            </div>
          )}

          {selectedTool === 'icon' && isAddingNode && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-card border rounded-lg p-2 shadow-lg">
              <p className="text-xs text-muted-foreground">
                Click anywhere to place your icon
              </p>
            </div>
          )}

          {selectedTool === 'draw' && !showDrawingToolbar && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-card border rounded-lg p-2 shadow-lg">
              <p className="text-xs text-muted-foreground">
                {currentDrawingTool === 'eraser' 
                  ? 'Eraser active - white circle appears only when hovering over the drawing area'
                  : 'Click and drag to draw • Use the toolbar above for more options'
                }
              </p>
            </div>
          )}



          {selectedTool === 'connection' && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-card border rounded-lg p-3 shadow-lg max-w-lg">
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  🔗 Enhanced Connection Tool
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Drag from nodes or empty space • See live distance & angle • Select connections to resize with blue/green handles
                </p>
              </div>
            </div>
          )}

          {editingNode && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg max-w-md">
              <div className="text-center">
                <p className="text-sm text-blue-700 font-medium">
                  ✨ Text Formatting Mode
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Use the toolbar above for: font size, <strong>bold</strong> (Ctrl+B), <em>italic</em> (Ctrl+I), <u>underline</u> (Ctrl+U), alignment, colors, and links
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  Press Enter or click outside to finish editing • Click ✕ in toolbar to close
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}