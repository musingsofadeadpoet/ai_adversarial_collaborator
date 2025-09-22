import React, { useState, useEffect } from 'react';
import { ChatInterface, ChatSession, Message } from './ChatInterface';
import { ChatSidebar } from './ChatSidebar';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './ui/resizable';
import cityBackground from 'figma:asset/730fa92b714c15da4829c85dadb795cb706c3545.png';

interface ChatLayoutProps {
  onAddToMindMap?: (content: string) => void;
  onMaximize?: () => void;
  onViewToggle?: () => void;
  onViewModeChange?: (mode: 'split' | 'tabs' | 'chat-fullscreen' | 'mindmap-fullscreen') => void;
  viewMode?: 'split' | 'tabs' | 'chat-fullscreen' | 'mindmap-fullscreen';
  isTabsMode?: boolean;
  isFullscreen?: boolean;
}

export function ChatLayout({ onAddToMindMap, onMaximize, onViewToggle, onViewModeChange, viewMode, isTabsMode = false, isFullscreen = false }: ChatLayoutProps) {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);

  // Initialize with a default session or load from existing sessions
  useEffect(() => {
    if (!currentSession) {
      // Try to load the most recent session first
      const savedSessions = localStorage.getItem('chat_sessions');
      if (savedSessions) {
        try {
          const sessions = JSON.parse(savedSessions);
          if (sessions.length > 0) {
            const mostRecent = sessions[0];
            const sessionToSelect = {
              ...mostRecent,
              createdAt: new Date(mostRecent.createdAt),
              lastUpdated: new Date(mostRecent.lastUpdated),
              messages: mostRecent.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              }))
            };
            setCurrentSession(sessionToSelect);
            return;
          }
        } catch (error) {
          console.error('Error loading sessions:', error);
        }
      }
      
      // If no sessions exist, create a new one
      createNewChat();
    }
  }, [currentSession]);

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Research Session',
      messages: [
        {
          id: '1',
          content: "Hi there! I'm your adversarial collaborator. Ready to share your current research question with me?",
          sender: 'ai',
          timestamp: new Date()
        }
      ],
      createdAt: new Date(),
      lastUpdated: new Date()
    };
    setCurrentSession(newSession);
  };

  const handleSelectSession = (session: ChatSession) => {
    setCurrentSession(session);
  };

  const handleSessionUpdate = (updatedSession: ChatSession) => {
    setCurrentSession(updatedSession);
  };

  const handleDeleteSession = (sessionId: string, remainingSessions: ChatSession[]) => {
    if (currentSession?.id === sessionId) {
      // If we're deleting the current session, try to select another one
      if (remainingSessions.length > 0) {
        // Select the most recent remaining session
        setCurrentSession(remainingSessions[0]);
      } else {
        // No other sessions exist, create a new one
        setCurrentSession(null);
        setTimeout(() => {
          createNewChat();
        }, 100);
      }
    }
  };

  // Fullscreen mode layout - with resizable sidebar for chat navigation
  if (isFullscreen) {
    return (
      <div className="h-screen w-screen flex relative overflow-hidden">
        {/* City skyline background */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${cityBackground})`,
            backgroundColor: '#f5f1eb' // Fallback color matching the city background
          }}
        />
        
        <div className="h-full w-full relative z-10">
          <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            {/* Resizable sidebar panel - optimized size to show delete buttons */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
              <ChatSidebar
                currentSession={currentSession}
                onSelectSession={handleSelectSession}
                onCreateNewChat={createNewChat}
                onDeleteSession={handleDeleteSession}
                className="h-full"
                isTabsMode={true}
              />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            {/* Main chat area - expanded to fill most of the screen */}
            <ResizablePanel defaultSize={75} minSize={65}>
              <ChatInterface
                onAddToMindMap={onAddToMindMap}
                onMaximize={onMaximize}
                onViewToggle={onViewToggle}
                onViewModeChange={onViewModeChange}
                viewMode={viewMode}
                currentSession={currentSession}
                onSessionUpdate={handleSessionUpdate}
                isFullscreen={true}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    );
  }

  // Tabs mode layout - full width chat like ChatGPT
  if (isTabsMode) {
    return (
      <div className="h-screen w-screen flex relative overflow-hidden">
        {/* City skyline background */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${cityBackground})`,
            backgroundColor: '#f5f1eb' // Fallback color matching the city background
          }}
        />
        
        <div className="h-full w-full flex relative z-10">
          {/* Fixed width sidebar */}
          <div className="w-72 flex-shrink-0">
            <ChatSidebar
              currentSession={currentSession}
              onSelectSession={handleSelectSession}
              onCreateNewChat={createNewChat}
              onDeleteSession={handleDeleteSession}
              className="h-full"
              isTabsMode={true}
            />
          </div>
          
          {/* Main chat area - full width to the right of sidebar */}
          <div className="flex-1 h-full">
            <ChatInterface
              onAddToMindMap={onAddToMindMap}
              onMaximize={onMaximize}
              onViewToggle={onViewToggle}
              viewMode={viewMode}
              currentSession={currentSession}
              onSessionUpdate={handleSessionUpdate}
              isTabsMode={true}
            />
          </div>
        </div>
      </div>
    );
  }

  // Split mode layout - resizable panels
  return (
    <div className="h-full flex relative overflow-hidden">
      {/* City skyline background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${cityBackground})`,
          backgroundColor: '#f5f1eb' // Fallback color matching the city background
        }}
      />
      
      <ResizablePanelGroup direction="horizontal" className="h-full relative z-10">
        <ResizablePanel defaultSize={35} minSize={30} maxSize={45}>
          <ChatSidebar
            currentSession={currentSession}
            onSelectSession={handleSelectSession}
            onCreateNewChat={createNewChat}
            onDeleteSession={handleDeleteSession}
            className="h-full"
          />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={65} minSize={55}>
          <div className="h-full">
            <ChatInterface
              onAddToMindMap={onAddToMindMap}
              onMaximize={onMaximize}
              onViewToggle={onViewToggle}
              onViewModeChange={onViewModeChange}
              viewMode={viewMode}
              currentSession={currentSession}
              onSessionUpdate={handleSessionUpdate}
              isTabsMode={false}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}