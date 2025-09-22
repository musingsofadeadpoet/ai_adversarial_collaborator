import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { ChevronDown, Zap, Brain, Sparkles, Rocket, Star } from 'lucide-react';

interface ModelSelectorProps {
  currentModel: string;
  onModelChange: (model: string) => void;
  className?: string;
}

const models = [
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and efficient',
    icon: Zap
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'Advanced reasoning',
    icon: Brain
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Faster GPT-4 variant',
    icon: Rocket
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Latest multimodal model',
    icon: Sparkles
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Cost-effective GPT-4o',
    icon: Star
  }
];

export function ModelSelector({ currentModel, onModelChange, className = "" }: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState(currentModel);

  useEffect(() => {
    setSelectedModel(currentModel);
  }, [currentModel]);

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    onModelChange(modelId);
    localStorage.setItem('openai_model', modelId);
  };

  const currentModelData = models.find(m => m.id === selectedModel) || models[3]; // Default to GPT-4o
  const Icon = currentModelData.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`h-7 px-2 text-xs bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 ${className}`}
        >
          <Icon className="w-3 h-3 mr-1.5" />
          {currentModelData.name}
          <ChevronDown className="w-3 h-3 ml-1.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {models.map((model) => {
          const ModelIcon = model.icon;
          return (
            <DropdownMenuItem 
              key={model.id}
              onClick={() => handleModelSelect(model.id)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <ModelIcon className="w-4 h-4" />
              <div className="flex-1">
                <div className="font-medium text-sm">{model.name}</div>
                <div className="text-xs text-muted-foreground">{model.description}</div>
              </div>
              {selectedModel === model.id && (
                <div className="w-2 h-2 bg-primary rounded-full" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}