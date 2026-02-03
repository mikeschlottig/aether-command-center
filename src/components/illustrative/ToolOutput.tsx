import React from 'react';
import { motion } from 'framer-motion';
import { Search, Cloud, Settings, AlertCircle, ExternalLink, MapPin, Wind, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolCall, WeatherResult } from '../../../worker/types';
interface ToolOutputProps {
  toolCall: ToolCall;
}
export function ToolOutput({ toolCall }: ToolOutputProps) {
  const result = toolCall.result as any;
  const renderContent = () => {
    if (!result) return <p className="text-xs italic text-muted-foreground">In progress...</p>;
    if (result.error) return (
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-3 w-3" />
        <span className="text-xs font-medium">{result.error}</span>
      </div>
    );
    switch (toolCall.name) {
      case 'get_weather': {
        const w = result as WeatherResult;
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-primary">
                <MapPin className="h-3 w-3" />
                <span className="text-xs font-bold uppercase tracking-tight">{w.location}</span>
              </div>
              <div className="text-2xl font-serif font-bold">{w.temperature}°C</div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">{w.condition}</p>
            </div>
            <div className="space-y-2 border-l pl-4">
              <div className="flex items-center gap-2 text-xs">
                <Wind className="h-3 w-3 text-blue-400" />
                <span className="text-muted-foreground">Humidity: {w.humidity}%</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Cloud className="h-3 w-3 text-indigo-400" />
                <span className="text-muted-foreground">Stable Sky</span>
              </div>
            </div>
          </div>
        );
      }
      case 'web_search': {
        return (
          <div className="space-y-3">
             <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 uppercase tracking-widest">
               <Search className="h-3 w-3" />
               Knowledge Retreived
             </div>
             <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 italic">
               {result.content || "No textual summaries available."}
             </p>
          </div>
        );
      }
      default:
        return (
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Output Content</div>
            <pre className="text-xs font-mono bg-muted/30 p-2 rounded border border-dashed">
              {typeof result.content === 'string' ? result.content : JSON.stringify(result, null, 2)}
            </pre>
          </div>
        );
    }
  };
  const getIcon = () => {
    switch (toolCall.name) {
      case 'get_weather': return <Cloud className="h-3 w-3" />;
      case 'web_search': return <Search className="h-3 w-3" />;
      default: return <Settings className="h-3 w-3" />;
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card/50 border-2 border-primary/5 rounded-xl p-4 shadow-sm card-illustrative max-w-full overflow-hidden"
    >
      <div className="flex items-center justify-between mb-3 border-b border-primary/5 pb-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {getIcon()}
          </div>
          <span className="text-xs font-bold font-serif">{toolCall.name.replace('_', ' ')}</span>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground/60">ID: {toolCall.id.slice(0, 6)}</div>
      </div>
      {renderContent()}
    </motion.div>
  );
}