import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Home, Search, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { Message, ChatSession } from './ChatInterface';

interface ChatSidebarProps {
  currentSession: ChatSession | null;
  onSelectSession: (session: ChatSession) => void;
  onCreateNewChat: () => void;
  onDeleteSession: (sessionId: string, remainingSessions: ChatSession[]) => void;
  className?: string;
  isTabsMode?: boolean;
}

export function ChatSidebar({ 
  currentSession, 
  onSelectSession, 
  onCreateNewChat, 
  onDeleteSession,
  className = "",
  isTabsMode = false
}: ChatSidebarProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'history'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([]);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // Load ABC Favorite Mono font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=ABC+Favorit+Mono:wght@400;500&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  // Load chat sessions from localStorage
  const loadSessions = () => {
    const savedSessions = localStorage.getItem('chat_sessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        const sessions = parsed.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          lastUpdated: new Date(session.lastUpdated),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChatSessions(sessions);
        setFilteredSessions(sessions);
      } catch (error) {
        console.error('Error loading chat sessions:', error);
      }
    } else {
      setChatSessions([]);
      setFilteredSessions([]);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Save sessions to localStorage when they change
  const saveSessions = (sessions: ChatSession[]) => {
    try {
      localStorage.setItem('chat_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving chat sessions:', error);
    }
  };

  // Update sessions when current session changes
  useEffect(() => {
    if (currentSession && currentSession.messages.length > 0) {
      setChatSessions(prev => {
        const existingIndex = prev.findIndex(s => s.id === currentSession.id);
        let newSessions;
        
        if (existingIndex >= 0) {
          // Update existing session
          newSessions = [...prev];
          newSessions[existingIndex] = {
            ...currentSession,
            lastUpdated: new Date()
          };
        } else {
          // Add new session
          newSessions = [currentSession, ...prev];
        }
        
        saveSessions(newSessions);
        
        // Auto-generate AI title for new sessions or sessions with default titles
        if (currentSession.messages.length >= 2) { // After first exchange
          updateSessionWithAITitle(currentSession);
        }
        
        return newSessions;
      });
    }
  }, [currentSession]);

  // Filter sessions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSessions(chatSessions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = chatSessions.filter(session => {
        // Search in session title
        if (session.title.toLowerCase().includes(query)) {
          return true;
        }
        // Search in message content
        return session.messages.some(message => 
          message.content.toLowerCase().includes(query)
        );
      });
      setFilteredSessions(filtered);
    }
  }, [searchQuery, chatSessions]);

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Find the session to get its title for the confirmation dialog
    const sessionToDelete = chatSessions.find(s => s.id === sessionId);
    const sessionTitle = sessionToDelete?.title || 'this chat';
    
    // Enhanced confirmation dialog with clear warning
    const confirmMessage = `🗑️ DELETE CHAT PERMANENTLY\n\n"${sessionTitle}"\n\n⚠️ This action cannot be undone!\nThe conversation and all ${sessionToDelete?.messages.length || 0} messages will be permanently deleted.\n\nPress OK to confirm deletion.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        // Set deleting state for visual feedback
        setDeletingSessionId(sessionId);
        
        // Add a small delay for better UX
        setTimeout(() => {
          // Update local state immediately
          const updatedSessions = chatSessions.filter(s => s.id !== sessionId);
          setChatSessions(updatedSessions);
          setFilteredSessions(updatedSessions);
          
          // Permanently save to localStorage (overwrites the previous data)
          saveSessions(updatedSessions);
          
          // Call parent callback with the remaining sessions
          onDeleteSession(sessionId, updatedSessions);
          
          // Clear deleting state
          setDeletingSessionId(null);
          
          // Log successful deletion for debugging
          console.log(`Chat session "${sessionTitle}" (${sessionId}) permanently deleted`);
        }, 150);
        
      } catch (error) {
        console.error('Failed to delete chat session:', error);
        
        // Clear deleting state
        setDeletingSessionId(null);
        
        // Show error to user if deletion fails
        alert('Failed to delete the chat. Please try again.');
        
        // Reload sessions from localStorage to ensure consistency
        loadSessions();
      }
    }
  };

  // Enhanced function to permanently clear all chat data (useful for debugging)
  const handleClearAllChats = () => {
    const confirmMessage = `Delete ALL conversations?\n\nThis will permanently delete all ${chatSessions.length} conversations and cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        // Clear all sessions
        setChatSessions([]);
        setFilteredSessions([]);
        
        // Permanently remove from localStorage
        localStorage.removeItem('chat_sessions');
        
        console.log('All chat sessions permanently deleted');
        
      } catch (error) {
        console.error('Failed to clear all chats:', error);
        alert('Failed to delete all chats. Please try again.');
      }
    }
  };

  const handleSelectSession = (session: ChatSession) => {
    // Ensure we switch to home tab when selecting a session
    setActiveTab('home');
    onSelectSession(session);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // AI Title Generation Function
  const generateAITitle = async (session: ChatSession): Promise<string> => {
    const apiKey = localStorage.getItem('openai_api_key');
    if (!apiKey) return session.title; // Fallback to existing title if no API key
    
    try {
      // Get the first few user messages for context
      const userMessages = session.messages
        .filter(m => m.sender === 'user')
        .slice(0, 3) // Take first 3 user messages
        .map(m => m.content)
        .join(' ');
      
      if (!userMessages.trim()) return session.title;
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Generate a short, descriptive title (2-6 words) for this conversation. Be concise and specific. Do not use quotes or special formatting.'
            },
            {
              role: 'user',
              content: `Create a title for this conversation: ${userMessages.substring(0, 500)}`
            }
          ],
          max_tokens: 20,
          temperature: 0.3
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const generatedTitle = data.choices[0]?.message?.content?.trim();
        if (generatedTitle && generatedTitle.length > 0) {
          return generatedTitle;
        }
      }
    } catch (error) {
      console.error('Error generating AI title:', error);
    }
    
    return session.title; // Fallback to existing title
  };

  // Function to update session title with AI generation
  const updateSessionWithAITitle = async (session: ChatSession) => {
    // Only generate if title is still default or very basic
    if (session.title === 'New Research Session' || session.title.includes('...')) {
      const newTitle = await generateAITitle(session);
      if (newTitle !== session.title) {
        const updatedSession = { ...session, title: newTitle };
        
        // Update in sessions array
        setChatSessions(prev => {
          const newSessions = prev.map(s => 
            s.id === session.id ? updatedSession : s
          );
          saveSessions(newSessions);
          return newSessions;
        });
        
        return updatedSession;
      }
    }
    return session;
  };

  const renderHome = () => {
    // Both tabs mode and split mode now show all conversations with scrolling
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h4 
              className="text-sm font-medium text-gray-700"
              style={{ 
                fontFamily: '"ABC Favorit Mono", "Courier New", monospace',
                textTransform: 'lowercase'
              }}
            >
              history
            </h4>
            {chatSessions.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllChats}
                className="h-7 px-2 text-xs hover:bg-destructive/15 hover:text-destructive transition-all duration-200 rounded-md border border-transparent hover:border-destructive/20"
                style={{ 
                  fontFamily: '"ABC Favorit Mono", "Courier New", monospace',
                  textTransform: 'uppercase',
                  fontSize: '11px'
                }}
                title={`Delete all ${chatSessions.length} conversations permanently`}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                clear all
              </Button>
            )}
          </div>
        </div>
        <div className="flex-1 px-4 pb-4 min-h-0">
          <ScrollArea className="h-full">
            {chatSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            ) : (
              <div className="space-y-2 pr-1">
                {chatSessions.map(session => (
                  <div
                    key={session.id}
                    className={`group p-3 rounded-lg transition-all ${
                      deletingSessionId === session.id 
                        ? 'bg-destructive/10 border border-destructive/30 opacity-50 cursor-not-allowed' 
                        : currentSession?.id === session.id 
                          ? 'border border-gray-300/40 shadow-sm' 
                          : 'hover:bg-gray-100/60 border border-transparent hover:border-gray-200/40 cursor-pointer'
                    }`}
                    style={currentSession?.id === session.id ? { backgroundColor: '#e4e0d8' } : {}}
                    onClick={() => deletingSessionId !== session.id && handleSelectSession(session)}
                  >
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-medium text-sm text-gray-800 mb-1 truncate">
                          {session.title.length > 25 ? `${session.title.substring(0, 25)}...` : session.title}
                        </div>
                        <div className="text-xs text-gray-600 flex items-center gap-2">
                          <span>{session.messages.length} message{session.messages.length !== 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>{formatDate(session.lastUpdated)}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          onKeyDown={(e) => {
                            if (e.key === 'Delete' || e.key === 'Backspace') {
                              e.preventDefault();
                              handleDeleteSession(session.id, e as any);
                            }
                          }}
                          className="h-7 w-7 p-0 opacity-80 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 rounded-md focus:ring-1 focus:ring-destructive/40 focus:outline-none text-gray-500 hover:text-destructive flex-shrink-0"
                          title="Delete chat permanently"
                          disabled={deletingSessionId === session.id}
                        >
                          {deletingSessionId === session.id ? (
                            <div className="w-3 h-3 border border-destructive border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    );
  };

  const renderSearch = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-2 flex-shrink-0">
        <div>
          <h3 className="font-medium mb-2">Search Conversations</h3>
          <Input
            placeholder="Search messages and topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex-1 px-4 pb-4 min-h-0">
        <ScrollArea className="h-full">
          {filteredSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No matching conversations found' : 'No conversations to search'}
            </p>
          ) : (
            <div className="space-y-2 pr-1">
              {filteredSessions.map(session => (
                <div
                  key={session.id}
                  className={`group p-3 rounded-lg transition-all ${
                    deletingSessionId === session.id 
                      ? 'bg-destructive/10 border border-destructive/30 opacity-50 cursor-not-allowed' 
                      : currentSession?.id === session.id 
                        ? 'border border-gray-300/40 shadow-sm' 
                        : 'hover:bg-gray-100/60 border border-transparent hover:border-gray-200/40 cursor-pointer'
                  }`}
                  style={currentSession?.id === session.id ? { backgroundColor: '#e4e0d8' } : {}}
                  onClick={() => deletingSessionId !== session.id && handleSelectSession(session)}
                >
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-medium text-sm text-gray-800 mb-1 truncate">
                        {session.title.length > 25 ? `${session.title.substring(0, 25)}...` : session.title}
                      </div>
                      <div className="text-xs text-gray-600 flex items-center gap-2">
                        <span>{session.messages.length} message{session.messages.length !== 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span>{formatDate(session.lastUpdated)}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        onKeyDown={(e) => {
                          if (e.key === 'Delete' || e.key === 'Backspace') {
                            e.preventDefault();
                            handleDeleteSession(session.id, e as any);
                          }
                        }}
                        className="h-7 w-7 p-0 opacity-80 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 rounded-md focus:ring-1 focus:ring-destructive/40 focus:outline-none text-gray-500 hover:text-destructive flex-shrink-0"
                        title="Delete chat permanently"
                        disabled={deletingSessionId === session.id}
                      >
                        {deletingSessionId === session.id ? (
                          <div className="w-3 h-3 border border-destructive border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );



  // Both tabs mode and split mode now use the same simplified layout without history tab
  return (
    <div className={`backdrop-blur-md border-r border-gray-300/50 flex flex-col h-full shadow-lg min-w-[250px] ${className}`} style={{ backgroundColor: 'rgba(248, 244, 236, 0.7)' }}>
      {/* Navigation Tabs with ABC Favorite Mono font */}
      <div className="p-4 border-b border-gray-300/30">
        <div className="flex flex-col gap-1">
          <Button
            variant={activeTab === 'home' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('home')}
            className="justify-start w-full text-left"
            style={{ 
              fontFamily: '"ABC Favorit Mono", "Courier New", monospace',
              fontWeight: activeTab === 'home' ? '500' : '400',
              backgroundColor: activeTab === 'home' ? '#42352f' : 'transparent',
              color: activeTab === 'home' ? 'white' : 'inherit'
            }}
          >
            <Home className="w-4 h-4 mr-2" />
            HOME
            {chatSessions.length > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {chatSessions.length}
              </Badge>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateNewChat}
            className="justify-start w-full text-left"
            style={{ 
              fontFamily: '"ABC Favorit Mono", "Courier New", monospace',
              fontWeight: '400'
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            NEW CHAT
          </Button>
          <Button
            variant={activeTab === 'search' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('search')}
            className="justify-start w-full text-left"
            style={{ 
              fontFamily: '"ABC Favorit Mono", "Courier New", monospace',
              fontWeight: activeTab === 'search' ? '500' : '400'
            }}
          >
            <Search className="w-4 h-4 mr-2" />
            SEARCH CHAT
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'search' && renderSearch()}
      </div>
    </div>
  );
}