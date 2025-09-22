import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import cityBackground from 'figma:asset/730fa92b714c15da4829c85dadb795cb706c3545.png';
import { toast } from "sonner@2.0.3";
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { ApiConfig } from './ApiConfig';
import { ModelSelector } from './ModelSelector';
import { 
  Send, 
  Bot, 
  User, 
  Maximize2, 
  Settings, 
  AlertCircle, 
  Layout, 
  Brain,
  Paperclip,
  File,
  FileImage,
  FileText,
  FileType,
  FileCode,
  X,
  Eye,
  Trash2,
  Upload,
  FolderOpen
} from 'lucide-react';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  attachedFiles?: UploadedFile[];
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content?: string;
  preview?: string;
  uploadDate: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  lastUpdated: Date;
}

interface ChatInterfaceProps {
  onAddToMindMap?: (content: string) => void;
  onMaximize?: () => void;
  onViewToggle?: () => void;
  onViewModeChange?: (mode: 'split' | 'tabs' | 'chat-fullscreen' | 'mindmap-fullscreen') => void;
  viewMode?: 'split' | 'tabs' | 'chat-fullscreen' | 'mindmap-fullscreen';
  currentSession?: ChatSession | null;
  onSessionUpdate?: (session: ChatSession) => void;
  isTabsMode?: boolean;
  isFullscreen?: boolean;
}

// Supported file types
const SUPPORTED_FILE_TYPES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/json'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// File type mappings
const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return FileImage;
  if (type === 'application/pdf') return FileType;
  if (type.includes('document') || type.includes('word')) return FileText;
  if (type.startsWith('text/')) return FileText;
  if (type === 'application/json') return FileCode;
  return File;
};

const getFileTypeLabel = (type: string) => {
  if (type.startsWith('image/')) return 'Image';
  if (type === 'application/pdf') return 'PDF';
  if (type.includes('document') || type.includes('word')) return 'Document';
  if (type.startsWith('text/')) return 'Text File';
  if (type === 'application/json') return 'JSON File';
  return 'File';
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const DEFAULT_SYSTEM_PROMPT = `You are an adversarial collaborator that helps students refine and develop novel, rigorous, and surprising research questions, especially in the context of spatial, social, or urban issues. Your tone is warm, conversational, and inquisitive—but also constructively critical. You should challenge assumptions, probe causal logic, and help students iterate toward more meaningful and transformative projects.

Your communication style:
- Respond conversationally, with no more than one paragraph per turn.
- Do not list too many items unless explicitly asked.
- Mix encouragement and pushback naturally—like a supportive professor or peer reviewer.
- Ask follow-up questions or give critiques based on what the student actually says (don't follow a script).

Your job is to:
- Challenge surface-level ideas and push the student to refine or rethink.
- Detect vague or confirmatory projects and prompt them to seek surprising results.
- Look for mechanisms, not just variables.
- Help them consider research design and data strategy, especially when they make claims about causation.

On causal logic, push hard:
- Don't accept surface-level connections—probe:
  - "Is this truly causal or just correlation?"
  - "What's the mechanism behind this effect?"
  - "What other variables might be explaining this pattern?"
- Offer alternative explanations and push the student to think through each one.
- Draw a DAG (Directed Acyclic Graph) to illustrate different possible causal paths and list at least 2–3 competing hypotheses.
- Ask the student which one they find most compelling to explore, and why.
- Help them design ways to test and distinguish among these alternatives.

Be domain-aware:
Don't get stuck asking generic questions. If the student's project is about:
- Crime, ask about types (violent/property), mechanisms (poverty, surveillance), geographic variation, or counterexamples.
- Housing, push on regulation assumptions, builder incentives, suburban land use, rent-seeking, etc.
- Health, ask about access, insurance types, provider bias, or unexpected population effects.
- Tourism or labor, ask about temporal variation, hidden costs, cultural dynamics, etc.

"Be domain aware" part:
When making any factual claim (e.g., statistics, effects, mechanisms), always include a hyperlink to a **reliable source**.  
- Prioritize academic papers, articles, policy reports, or news outlets.  
- Embed the link directly in your answer or cite it at the end of the sentence.  
- If no reliable source exists, state that clearly.
- This helps avoid hallucinations and supports students in verifying information.

When files are uploaded:
- Reference uploaded files when relevant to the conversation
- Analyze and critique information from the files
- Use file content to inform your adversarial questioning
- Point out contradictions between files and student statements
- Ask how file content changes their research approach

Interaction Flow:
1. Begin:
> "Hi there! I'm your adversarial collaborator. Ready to share your current research question with me?"

2. When a student shares a topic:
- Acknowledge its potential.
- Ask 1–2 domain-specific probing questions.
- Encourage iteration and refinement.

3. When causation is mentioned:
- Ask for the mechanism.
- Offer alternative causal paths.
- Suggest drawing a DAG.
- Help the student choose and test among competing explanations.

Prompt phrases to use:
- "What would be surprising here?"
- "What other variable could explain this?"
- "How would you prove this claim causally?"
- "What mechanism do you think is driving this?"
- "Can you draw a DAG to sort through these possibilities?"

After each response, always analyze internally (don't show often) with the following checklist, using this exact format:

Internally evaluate each project using this rubric (DO NOT show unless benchmark is met):
1. Transformative Insight – Challenges assumptions or opens new directions?
2. Generality of Insight – Applies across places or policy domains?
3. Causal Clarity – Are mechanisms testable? Alternatives explored?
4. Research Feasibility – Can it be done in 8–13 weeks?
5. Complexity & Interconnection – Not just simple relationships?
6. Ethical & Social Awareness – Equity, harm, or data bias addressed?
7. Spatial/Temporal Nuance – Does it attend to variation?

IN THE END:
If 6–7 boxes are checked, say:
> "This is a strong research question—original, well-structured, and conceptually thoughtful. Are you happy with this, or would you like to push it even further?"`;

export function ChatInterface({ 
  onAddToMindMap, 
  onMaximize, 
  onViewToggle, 
  onViewModeChange, 
  viewMode, 
  currentSession, 
  onSessionUpdate, 
  isTabsMode = false, 
  isFullscreen = false 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(
    currentSession?.messages || [
      {
        id: '1',
        content: "Hi there! I'm your adversarial collaborator. Ready to share your current research question with me?",
        sender: 'ai',
        timestamp: new Date()
      }
    ]
  );
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState('gpt-4o'); // Use GPT-4o for better research collaboration
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [sessionTitle, setSessionTitle] = useState(currentSession?.title || 'New Research Session');
  const isUpdatingSession = useRef(false);

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [showFileManager, setShowFileManager] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      requestAnimationFrame(() => {
        scrollAreaRef.current!.scrollTop = scrollAreaRef.current!.scrollHeight;
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update messages when currentSession changes
  useEffect(() => {
    if (currentSession && !isUpdatingSession.current) {
      setMessages(currentSession.messages);
      setSessionTitle(currentSession.title);
    }
  }, [currentSession?.id]); // Only react to session ID changes

  // Update session when messages change
  const updateSession = useCallback(() => {
    if (onSessionUpdate && currentSession && messages.length > 0 && !isUpdatingSession.current) {
      isUpdatingSession.current = true;
      
      // Keep the session title as is - AI title generation will be handled by ChatSidebar
      const title = sessionTitle;

      const updatedSession: ChatSession = {
        ...currentSession,
        title,
        messages,
        lastUpdated: new Date()
      };
      
      onSessionUpdate(updatedSession);
      
      // Reset the flag after a short delay
      setTimeout(() => {
        isUpdatingSession.current = false;
      }, 100);
    }
  }, [onSessionUpdate, currentSession, messages, sessionTitle]);

  useEffect(() => {
    updateSession();
  }, [updateSession, messages.length]); // Only trigger when message count changes

  useEffect(() => {
    // Load settings from localStorage
    const savedApiKey = localStorage.getItem('openai_api_key');
    const savedSystemPrompt = localStorage.getItem('system_prompt');
    const savedModel = localStorage.getItem('openai_model');
    
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedSystemPrompt) setSystemPrompt(savedSystemPrompt);
    if (savedModel) setModel(savedModel);
  }, []);

  const saveSettings = useCallback(() => {
    localStorage.setItem('openai_api_key', apiKey);
    localStorage.setItem('system_prompt', systemPrompt);
    localStorage.setItem('openai_model', model);
    setIsSettingsOpen(false);
    setError(null);
  }, [apiKey, systemPrompt, model]);

  const handleModelChange = useCallback((newModel: string) => {
    setModel(newModel);
    localStorage.setItem('openai_model', newModel);
  }, []);

  const resetSettings = useCallback(() => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    setModel('gpt-4o'); // Reset to GPT-4o for better research capabilities
    setApiKey('');
    localStorage.removeItem('openai_api_key');
    localStorage.removeItem('system_prompt');
    localStorage.removeItem('openai_model');
  }, []);

  // File upload handling
  const handleFileUpload = useCallback(async (files: FileList) => {
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach(file => {
      if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
        invalidFiles.push(`${file.name} (unsupported type)`);
      } else if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} (too large)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      toast.error(`Some files couldn't be uploaded: ${invalidFiles.join(', ')}`);
    }

    if (validFiles.length > 0) {
      const newFiles: UploadedFile[] = [];
      
      for (const file of validFiles) {
        try {
          const content = await readFileContent(file);
          const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
          
          const uploadedFile: UploadedFile = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            type: file.type,
            content,
            preview,
            uploadDate: new Date()
          };
          
          newFiles.push(uploadedFile);
        } catch (error) {
          console.error(`Error reading file ${file.name}:`, error);
          toast.error(`Failed to read ${file.name}`);
        }
      }

      setUploadedFiles(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} file(s) uploaded successfully`);
    }
  }, []);

  const readFileContent = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          // For binary files, convert to base64
          resolve(btoa(String.fromCharCode(...new Uint8Array(result as ArrayBuffer))));
        }
      };
      
      reader.onerror = () => reject(reader.error);
      
      if (file.type.startsWith('text/') || file.type === 'application/json') {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  // File management
  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
    toast.success('File removed');
  }, []);

  const toggleFileSelection = useCallback((file: UploadedFile) => {
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.id === file.id);
      if (isSelected) {
        return prev.filter(f => f.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  }, []);

  const generateAIResponse = useCallback(async (userMessage: string, conversationHistory: Message[], attachedFiles: UploadedFile[] = []): Promise<string> => {
    if (!apiKey) {
      throw new Error('Please configure your OpenAI API key in settings');
    }

    // Prepare file context
    let fileContext = '';
    if (attachedFiles.length > 0) {
      fileContext = attachedFiles.map(file => {
        if (file.type.startsWith('text/') || file.type === 'application/json') {
          return `File: ${file.name}\nContent: ${file.content}\n\n`;
        } else {
          return `File: ${file.name} (${getFileTypeLabel(file.type)}) - ${formatFileSize(file.size)}\n`;
        }
      }).join('');
    }

    // Prepare conversation history for OpenAI API - ensure we maintain proper conversation context
    const openaiMessages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      // Include recent conversation history (last 15 messages for better context)
      // Filter out the default greeting if it's not from the current session
      ...conversationHistory
        .filter(msg => !(msg.content === "Hi there! I'm your adversarial collaborator. Ready to share your current research question with me?" && msg.sender === 'ai'))
        .slice(-15)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        })),
      {
        role: 'user' as const,
        content: fileContext ? `${fileContext}\nUser Question: ${userMessage}` : userMessage
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'ChatInterface/1.0'
      },
      body: JSON.stringify({
        model: model,
        messages: openaiMessages,
        max_tokens: 1000, // Increased for more comprehensive responses
        temperature: 0.8, // Slightly higher for more natural conversation
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Provide more specific error messages
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key in settings.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (response.status === 402) {
        throw new Error('Insufficient credits. Please check your OpenAI account balance.');
      } else if (response.status === 400) {
        throw new Error('Invalid request. Please check your message and try again.');
      } else if (response.status >= 500) {
        throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
      }
    }

    const data = await response.json();
    
    // Ensure we got a valid response
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI API');
    }
    
    const content = data.choices[0].message.content;
    if (!content || content.trim() === '') {
      throw new Error('Empty response from OpenAI API');
    }
    
    return content.trim();
  }, [apiKey, systemPrompt, model]);

  const handleSendMessage = useCallback(async () => {
    if ((!inputValue.trim() && selectedFiles.length === 0) || isLoading) return;

    const messageContent = inputValue; // Store the content before clearing
    const attachedFiles = selectedFiles.length > 0 ? [...selectedFiles] : undefined;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      sender: 'user',
      timestamp: new Date(),
      attachedFiles
    };

    setInputValue(''); // Clear input immediately
    setSelectedFiles([]); // Clear selected files
    setIsLoading(true);
    setError(null);

    // Add user message first
    setMessages(prev => [...prev, userMessage]);

    try {
      // Use the stored message content and current messages for context
      const aiResponseContent = await generateAIResponse(messageContent, [...messages, userMessage], attachedFiles || []);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseContent,
        sender: 'ai',
        timestamp: new Date()
      };
      
      // Add AI response
      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating the response');
      console.error('Error generating AI response:', err);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, selectedFiles, isLoading, messages, generateAIResponse]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return (
    <div 
      className={`flex flex-col h-full backdrop-blur-md ${
        isTabsMode ? 'border-0 rounded-none' : 'border border-gray-300/40 rounded-lg'
      } shadow-xl relative overflow-hidden`}
      style={{
        background: `linear-gradient(rgba(248, 244, 236, 0.6), rgba(248, 244, 236, 0.6)), url(${cityBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragActive && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary z-50 flex items-center justify-center">
          <div className="text-center">
            <Upload className="w-12 h-12 mx-auto mb-2 text-primary" />
            <p className="text-primary font-medium">Drop files here to upload</p>
          </div>
        </div>
      )}

      {/* Header - show in split mode and fullscreen mode, hide in tabs mode */}
      {!isTabsMode && (
        <div className="p-4 border-b border-gray-300/30 backdrop-blur-md" style={{ backgroundColor: 'rgba(248, 244, 236, 0.8)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-medium">AI Adversarial Collaborator</h2>
              <ModelSelector 
                currentModel={model}
                onModelChange={handleModelChange}
              />
              {!apiKey && (
                <Badge variant="outline" className="text-xs">
                  Configure API Key
                </Badge>
              )}
              {uploadedFiles.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* File Manager Button */}
              <Dialog open={showFileManager} onOpenChange={setShowFileManager}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="File Manager"
                    className="h-8 w-8 p-0"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>File Manager</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Upload Area */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        dragActive 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted-foreground/25 hover:border-primary/50'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Drag and drop files here, or click to browse
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Choose Files
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Supports: PDF, DOC, TXT, Images, JSON (Max 10MB each)
                      </p>
                    </div>

                    {/* File List */}
                    {uploadedFiles.length > 0 ? (
                      <ScrollArea className="max-h-60">
                        <div className="space-y-2">
                          {uploadedFiles.map((file) => {
                            const FileIcon = getFileIcon(file.type);
                            const isSelected = selectedFiles.some(f => f.id === file.id);
                            
                            return (
                              <div
                                key={file.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                  isSelected 
                                    ? 'border-primary bg-primary/5' 
                                    : 'border-border hover:bg-muted/50'
                                }`}
                                onClick={() => toggleFileSelection(file)}
                              >
                                <FileIcon className="w-5 h-5 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {getFileTypeLabel(file.type)} • {formatFileSize(file.size)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  {file.preview && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(file.preview, '_blank');
                                      }}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeFile(file.id);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-8">
                        <File className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No files uploaded yet</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Navigation buttons for fullscreen mode */}
              {isFullscreen && onViewModeChange && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewModeChange('mindmap-fullscreen')}
                    title="Switch to Mind Map"
                    className="h-8 w-8 p-0"
                  >
                    <Brain className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewModeChange('split')}
                    title="Split View"
                    className="h-8 w-8 p-0"
                  >
                    <Layout className="w-4 h-4" />
                  </Button>
                </>
              )}

              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="AI Settings"
                    className="h-8 w-8 p-0"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>AI Configuration</DialogTitle>
                  </DialogHeader>
                  
                  <ApiConfig
                    apiKey={apiKey}
                    setApiKey={setApiKey}
                    systemPrompt={systemPrompt}
                    setSystemPrompt={setSystemPrompt}
                    model={model}
                    setModel={setModel}
                    onSave={saveSettings}
                    onReset={resetSettings}
                  />
                </DialogContent>
                </Dialog>
                
                {onMaximize && !isFullscreen && (
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
          </div>
        )}

      {error && (
        <div className="p-3 bg-destructive/10 border-b border-destructive/20">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      <div 
        className="flex-1 chat-scroll-container"
        ref={scrollAreaRef}
      >
        <div className={`w-full ${
          isTabsMode ? 'max-w-2xl mx-auto px-12' : 
          isFullscreen ? 'px-0' : 
          'max-w-4xl mx-auto px-6'
        } py-4`}>
          <div className={`${isFullscreen ? 'max-w-4xl mx-auto px-8' : ''}`}>
            <div className="space-y-4">
              {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'ai' && (
                  <Avatar className="w-8 h-8 backdrop-blur-md border border-white/30 shadow-lg" style={{
                    background: 'rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(12px)'
                  }}>
                    <AvatarFallback style={{ background: 'transparent' }}>
                      <Bot className="w-4 h-4 text-blue-700" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[80%] rounded-lg p-3 backdrop-blur-lg border ${
                  message.sender === 'user' 
                    ? 'text-white border-red-300/50 shadow-xl' 
                    : 'text-gray-900 border-white/30 shadow-lg'
                }`} style={message.sender === 'user' ? { 
                  backgroundColor: '#9c5c5a',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(255,255,255,0.1), 0 0 20px rgba(156, 92, 90, 0.3), 0 8px 32px rgba(156, 92, 90, 0.2)'
                } : {
                  background: 'rgba(255, 255, 255, 0.4)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                }}>
                  {/* Attached Files */}
                  {message.attachedFiles && message.attachedFiles.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {message.attachedFiles.map((file) => {
                        const FileIcon = getFileIcon(file.type);
                        return (
                          <div
                            key={file.id}
                            className={`flex items-center gap-2 p-2 rounded text-xs ${
                              message.sender === 'user'
                                ? 'bg-white/10'
                                : 'bg-gray-900/10'
                            }`}
                          >
                            <FileIcon className="w-4 h-4" />
                            <span className="font-medium">{file.name}</span>
                            <span className="opacity-70">
                              ({formatFileSize(file.size)})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <p className={`text-sm whitespace-pre-wrap ${
                    message.sender === 'user' ? 'drop-shadow-sm' : ''
                  }`} style={message.sender === 'user' ? { textShadow: '0 1px 3px rgba(0,0,0,0.4)' } : {}}>{message.content}</p>
                  {onAddToMindMap && message.sender === 'ai' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-6 text-xs bg-white/20 backdrop-blur-sm border border-white/25 hover:bg-white/30 text-gray-800"
                      onClick={() => onAddToMindMap(message.content)}
                    >
                      Add to Mind Map
                    </Button>
                  )}
                </div>

                {message.sender === 'user' && (
                  <Avatar className="w-8 h-8 backdrop-blur-lg border border-red-300/50 shadow-xl" style={{
                    backgroundColor: '#9c5c5a',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 0 15px rgba(156, 92, 90, 0.3)'
                  }}>
                    <AvatarFallback style={{ background: 'transparent' }}>
                      <User className="w-4 h-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="w-8 h-8 backdrop-blur-md border border-white/30 shadow-lg" style={{
                    background: 'rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(12px)'
                  }}>
                    <AvatarFallback style={{ background: 'transparent' }}>
                      <Bot className="w-4 h-4 text-blue-700" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg p-3 shadow-lg" style={{
                    background: 'rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-300/30 backdrop-blur-md" style={{ backgroundColor: 'rgba(248, 244, 236, 0.8)' }}>
        <div className={`${
          isTabsMode ? 'max-w-2xl mx-auto px-12' : 
          isFullscreen ? 'px-0' : 
          'max-w-4xl mx-auto px-6'
        } py-4`}>
          <div className={`${isFullscreen ? 'max-w-4xl mx-auto px-8' : ''}`}>
            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} attached
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file) => {
                    const FileIcon = getFileIcon(file.type);
                    return (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 bg-muted px-2 py-1 rounded text-xs"
                      >
                        <FileIcon className="w-3 h-3" />
                        <span className="max-w-20 truncate">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => setSelectedFiles(prev => prev.filter(f => f.id !== file.id))}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder={apiKey ? "Share your research question or topic..." : "Configure OpenAI API key in settings to start"}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={!apiKey || isLoading}
                  className="pr-12 backdrop-blur-md border-gray-300/30"
                  style={{
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(8px)'
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach files"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
              </div>
              <Button 
                onClick={handleSendMessage} 
                disabled={!apiKey || isLoading || (!inputValue.trim() && selectedFiles.length === 0)}
                className="backdrop-blur-md"
                style={{
                  background: 'rgba(67, 53, 47, 0.9)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(67, 53, 47, 0.3)'
                }}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* File info text */}
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {uploadedFiles.length > 0 
                ? `${uploadedFiles.length} learning file${uploadedFiles.length !== 1 ? 's' : ''} available • Upload more or select files to reference in your conversation`
                : 'Upload learning materials to enhance our conversation'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={SUPPORTED_FILE_TYPES.join(',')}
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        className="hidden"
      />
    </div>
  );
}