import React, { useState } from 'react';
import { ChatLayout } from './components/ChatLayout';
import { MindMap } from './components/MindMap';
import { LandingPage } from './components/LandingPage';
import { Button } from './components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './components/ui/resizable';
import { MessageSquare, Brain, Layout, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import cityBackground from 'figma:asset/730fa92b714c15da4829c85dadb795cb706c3545.png';

interface MindMapNode {
  id: string;
  content: string;
  type: 'sticky-note' | 'text' | 'image' | 'icon' | 'drawing' | 'shape';
  shape?: 'rectangle' | 'circle' | 'sticky-note' | 'line' | 'arrow' | 'star' | 'triangle' | 'pentagon' | 'hexagon' | 'octagon';
  textType?: 'heading' | 'body' | 'comment';
  color: string;
  iconName?: string;
  imageUrl?: string;
  drawingPath?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

type ViewMode = 'split' | 'tabs' | 'chat-fullscreen' | 'mindmap-fullscreen';

export default function App() {
  const [mindMapNodes, setMindMapNodes] = useState<MindMapNode[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [showLanding, setShowLanding] = useState(true);

  const addToMindMap = (content: string) => {
    const newNode: MindMapNode = {
      id: Date.now().toString(),
      content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      type: 'sticky-note',
      shape: 'sticky-note',
      textType: 'body',
      color: 'bg-blue-100 border-blue-300 text-blue-800',
      x: Math.random() * 300 + 100,
      y: Math.random() * 200 + 100,
      width: 200,
      height: 80
    };

    setMindMapNodes(prev => [...prev, newNode]);
  };

  const handleGetStarted = () => {
    setShowLanding(false);
  };

  // Show landing page first with animated transition
  return (
    <AnimatePresence mode="wait">
      {showLanding ? (
        <LandingPage key="landing" onGetStarted={handleGetStarted} />
      ) : (
        <MainApplication 
          key="main"
          viewMode={viewMode}
          setViewMode={setViewMode}
          mindMapNodes={mindMapNodes}
          addToMindMap={addToMindMap}
          setMindMapNodes={setMindMapNodes}
        />
      )}
    </AnimatePresence>
  );
}

// Separate component for the main application to handle animations better
interface MainApplicationProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  mindMapNodes: MindMapNode[];
  addToMindMap: (content: string) => void;
  setMindMapNodes: (nodes: MindMapNode[] | ((prev: MindMapNode[]) => MindMapNode[])) => void;
}

function MainApplication({ 
  viewMode, 
  setViewMode, 
  mindMapNodes, 
  addToMindMap, 
  setMindMapNodes 
}: MainApplicationProps) {

  // Chat Fullscreen Mode - With sidebar for chat navigation
  if (viewMode === 'chat-fullscreen') {
    return (
      <motion.div 
        className="h-screen w-screen flex relative overflow-hidden"
        style={{
          background: `url(${cityBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#f8f4ec'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div 
          className="flex-1 h-full overflow-hidden"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <ChatLayout 
            onAddToMindMap={addToMindMap} 
            onViewModeChange={setViewMode}
            viewMode={viewMode}
            isFullscreen={true}
          />
        </motion.div>
      </motion.div>
    );
  }

  // Mind Map Fullscreen Mode
  if (viewMode === 'mindmap-fullscreen') {
    return (
      <motion.div 
        className="h-screen flex flex-col bg-background"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.header 
          className="flex items-center justify-between px-6 py-4 border-b bg-card"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('split')}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-lg font-medium">Research Mind Map</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('chat-fullscreen')}
              className="h-8 w-8 p-0"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('split')}
              className="h-8 w-8 p-0"
            >
              <Layout className="w-4 h-4" />
            </Button>
          </div>
        </motion.header>

        <motion.div 
          className="flex-1 overflow-hidden"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <MindMap 
            externalNodes={mindMapNodes} 
            onNodesChange={setMindMapNodes}
            hideHeader={true}
          />
        </motion.div>
      </motion.div>
    );
  }

  // Split View Mode with Resizable Panels
  if (viewMode === 'split') {
    return (
      <motion.div 
        className="h-screen flex flex-col relative overflow-hidden"
        style={{
          background: `url(${cityBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#f8f4ec'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div 
          className="flex-1 p-4 overflow-hidden"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={50} minSize={25}>
              <motion.div 
                className="h-full"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <ChatLayout 
                  onAddToMindMap={addToMindMap} 
                  onMaximize={() => setViewMode('chat-fullscreen')}
                />
              </motion.div>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={50} minSize={25}>
              <motion.div 
                className="h-full"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <MindMap 
                  externalNodes={mindMapNodes} 
                  onNodesChange={setMindMapNodes}
                  onMaximize={() => setViewMode('mindmap-fullscreen')}
                />
              </motion.div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </motion.div>
      </motion.div>
    );
  }

  // Tabs Mode (simplified - chat only with back to split option)
  return (
    <motion.div 
      className="h-screen w-screen flex relative overflow-hidden"
      style={{
        background: `url(${cityBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#f8f4ec'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.div 
        className="flex-1 h-full overflow-hidden"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="h-full w-full"
        >
          <ChatLayout 
            onAddToMindMap={addToMindMap}
            onViewToggle={() => setViewMode('split')}
            viewMode={viewMode}
            isTabsMode={true}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}