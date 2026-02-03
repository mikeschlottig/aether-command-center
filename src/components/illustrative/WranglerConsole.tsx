import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
export interface LogEntry {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'command';
  timestamp: number;
}
interface WranglerConsoleProps {
  logs: LogEntry[];
  onClear: () => void;
}
export function WranglerConsole({ logs, onClear }: WranglerConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);
  return (
    <div className="card-illustrative bg-slate-950 border-slate-800 rounded-xl overflow-hidden flex flex-col h-64">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
          <Terminal className="h-3 w-3" />
          <span>wrangler-console v3.10.0</span>
        </div>
        <button 
          onClick={onClear} 
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title="Clear Console"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <ScrollArea className="flex-1 p-4 font-mono text-xs leading-relaxed">
        <div className="space-y-1">
          {logs.length === 0 && (
            <div className="text-slate-600 italic">No output. Waiting for manifestations...</div>
          )}
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2">
              <span className="text-slate-600 shrink-0">
                [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]
              </span>
              {log.type === 'command' && <ChevronRight className="h-3 w-3 text-blue-400 mt-0.5" />}
              <span className={cn(
                "break-all",
                log.type === 'success' && "text-emerald-400",
                log.type === 'error' && "text-rose-400",
                log.type === 'command' && "text-blue-400 font-bold",
                log.type === 'info' && "text-slate-300"
              )}>
                {log.message}
              </span>
            </div>
          ))}
          <div ref={scrollRef} className="h-4 flex items-center">
            <div className="h-3 w-1.5 bg-slate-400 animate-pulse" />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}