import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, User, Bot, Loader2, RefreshCcw, Eraser } from 'lucide-react';
import { useAgentStore } from '@/lib/store';
import { PageHeader } from '@/components/illustrative/PageHeader';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { chatService } from '@/lib/chat';
import { Message } from '../../worker/types';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
export function CommandDeck() {
  const personas = useAgentStore((s) => s.personas);
  const activeId = useAgentStore((s) => s.activePersonaId);
  const setActiveId = useAgentStore((s) => s.setActivePersona);
  const activePersona = personas.find(p => p.id === activeId) || personas[0];
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);
    try {
      const response = await chatService.sendMessage(input, activePersona.modelId);
      if (response.success && response.data) {
        setMessages(response.data.messages);
      } else if (response.error) {
        toast.error("Transmission Error", { description: response.error });
      }
    } catch (err) {
      toast.error("Aether Link Failed");
    } finally {
      setIsProcessing(false);
    }
  };
  const clearChat = () => {
    setMessages([]);
    chatService.clearMessages();
  };
  return (
    <AppLayout className="flex flex-col h-screen overflow-hidden">
      <div className="flex-1 flex flex-col p-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <PageHeader 
            title="Command Deck" 
            className="mb-0"
          />
          <div className="flex items-center gap-3">
            <Select value={activeId || ''} onValueChange={setActiveId}>
              <SelectTrigger className="w-[200px] bg-background">
                <SelectValue placeholder="Select Agent" />
              </SelectTrigger>
              <SelectContent>
                {personas.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.avatar} {p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={clearChat}>
              <Eraser className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Card className="flex-1 flex flex-col overflow-hidden card-illustrative border-primary/20 bg-background/50 backdrop-blur-sm relative">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="h-16 w-16 rounded-3xl bg-primary/5 flex items-center justify-center text-4xl">
                    {activePersona.avatar}
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-serif font-bold text-2xl">Awaiting Command</h3>
                    <p className="text-muted-foreground max-w-xs">
                      {activePersona.name} is ready for deployment.
                    </p>
                  </div>
                </div>
              )}
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-4",
                      m.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm",
                      m.role === 'user' ? "bg-primary text-white" : "bg-accent"
                    )}>
                      {m.role === 'user' ? <User className="h-5 w-5" /> : activePersona.avatar}
                    </div>
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-5 py-3 shadow-sm",
                      m.role === 'user' 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-white dark:bg-card border-2 border-primary/10 rounded-tl-none"
                    )}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isProcessing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center text-xl shrink-0">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                  <div className="bg-white dark:bg-card border-2 border-primary/10 rounded-2xl rounded-tl-none px-5 py-3 shadow-sm">
                    <div className="flex gap-1.5 pt-2">
                      <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" />
                      <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]" />
                      <div className="h-2 w-2 rounded-full bg-primary/80 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
          <div className="p-4 border-t bg-background/50 backdrop-blur-md">
            <div className="flex gap-2 max-w-4xl mx-auto">
              <Input
                placeholder={`Message ${activePersona.name}...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="h-12 bg-background border-2 border-primary/10 focus-visible:ring-primary shadow-inner"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isProcessing}
                className="h-12 w-12 rounded-xl btn-gradient shrink-0"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-[10px] text-center mt-3 text-muted-foreground uppercase tracking-widest font-bold">
              Cognition provided by {activePersona.modelId.split('/').pop()}
            </p>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
// Utility function to merge classes locally if not imported
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
// Inline Card component since we're in a single file cat block
function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={cn("rounded-xl border bg-card text-card-foreground shadow", className)}>{children}</div>;
}