import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Loader2, Eraser, Sparkles, MessageCircle } from 'lucide-react';
import { useAgentStore } from '@/lib/store';
import { PageHeader } from '@/components/illustrative/PageHeader';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { chatService } from '@/lib/chat';
import { Message, ToolCall } from '../../worker/types';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ToolOutput } from '@/components/illustrative/ToolOutput';
import { HandoffProtocol } from '@/components/illustrative/HandoffProtocol';
export function CommandDeck() {
  const personas = useAgentStore((s) => s.personas);
  const activeId = useAgentStore((s) => s.activePersonaId);
  const setActiveId = useAgentStore((s) => s.setActivePersona);
  const activePersona = personas.find(p => p.id === activeId) || personas[0];
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  useEffect(() => {
    const syncSession = async () => {
      const latest = await chatService.getMessages();
      if (latest.success && latest.data) {
        setMessages(latest.data.messages);
        // Ensure the backend persona is matched if we have one in state
        const persona = personas.find(p => p.id === activeId);
        if (persona) {
          await chatService.updatePersona(persona.name, persona.avatar, persona.systemPrompt);
        }
      }
    };
    syncSession();
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const handleAgentHandoff = async (agent: AgentPersona) => {
    setActiveId(agent.id);
    await chatService.updatePersona(agent.name, agent.avatar, agent.systemPrompt);
    toast.success(`Authority Transferred`, { description: `${agent.name} is now in command.` });
    
    // Send a trigger message to the new agent
    setInput(`Hello ${agent.name}, I've been referred to you for your specialized expertise. How can you help me with the current task?`);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;
    const persona = personas.find(p => p.id === activeId) || personas[0];
    // Ensure persona is synced before first message
    await chatService.updatePersona(persona.name, persona.avatar, persona.systemPrompt);

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);
    setStreamingMessage('');
    try {
      const response = await chatService.sendMessage(
        input, 
        activePersona.modelId,
        (chunk) => {
          setStreamingMessage(prev => prev + chunk);
        }
      );
      if (response.success) {
        // After streaming finishes or if non-streaming, sync full message list
        const latest = await chatService.getMessages();
        if (latest.success && latest.data) {
          setMessages(latest.data.messages);
        }
      } else if (response.error) {
        toast.error("Transmission Error", { description: response.error });
      }
    } catch (err) {
      toast.error("Aether Link Failed");
      console.error(err);
    } finally {
      setIsProcessing(false);
      setStreamingMessage('');
    }
  };
  const clearChat = () => {
    setMessages([]);
    setStreamingMessage('');
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
              <SelectTrigger className="w-[220px] bg-background card-illustrative border-primary/20">
                <SelectValue placeholder="Select Agent" />
              </SelectTrigger>
              <SelectContent>
                {personas.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.avatar} {p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={clearChat} className="card-illustrative border-destructive/20 hover:bg-destructive/10">
              <Eraser className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Card className="flex-1 flex flex-col overflow-hidden card-illustrative border-primary/20 bg-background/50 backdrop-blur-sm relative">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-8">
              {messages.length === 0 && !streamingMessage && (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                  <div className="h-20 w-20 rounded-3xl bg-primary/5 flex items-center justify-center text-5xl shadow-inner border-2 border-dashed border-primary/20">
                    {activePersona.avatar}
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-serif font-bold text-2xl">Awaiting Directives</h3>
                    <p className="text-muted-foreground max-w-sm italic">
                      "{activePersona.description}"
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
                      "h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm border",
                      m.role === 'user' ? "bg-primary text-white border-primary" : "bg-accent border-accent"
                    )}>
                      {m.role === 'user' ? <User className="h-5 w-5" /> : activePersona.avatar}
                    </div>
                    <div className="flex flex-col gap-3 max-w-[85%]">
                      <div className={cn(
                        "rounded-2xl px-5 py-4 shadow-sm relative",
                        m.role === 'user'
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-white dark:bg-card border-2 border-primary/10 rounded-tl-none"
                      )}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      </div>
                      
                      {m.toolCalls && m.toolCalls.length > 0 && (
                        <div className="space-y-2">
                          {m.toolCalls.map((tc: ToolCall) => (
                            <ToolOutput key={tc.id} toolCall={tc} />
                          ))}
                        </div>
                      )}

                      {m.role === 'assistant' && m.content.includes('[HANDOFF:') && (
                        <div className="mt-2">
                          {(() => {
                            const match = m.content.match(/\[HANDOFF:\s*(.*?)\]/);
                            const suggestedName = match ? match[1].trim() : null;
                            const suggestedAgent = personas.find(p => p.name.toLowerCase().includes(suggestedName?.toLowerCase() || ''));
                            
                            if (suggestedAgent && suggestedAgent.id !== activeId) {
                              return <HandoffProtocol suggestedAgent={suggestedAgent} onAccept={handleAgentHandoff} />;
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {streamingMessage && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-accent border border-accent flex items-center justify-center text-xl shrink-0">
                    {activePersona.avatar}
                  </div>
                  <div className="bg-white dark:bg-card border-2 border-primary/10 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm max-w-[85%]">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{streamingMessage}</p>
                    <div className="flex gap-1.5 mt-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" />
                    </div>
                  </div>
                </motion.div>
              )}
              {isProcessing && !streamingMessage && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-accent border border-accent flex items-center justify-center shrink-0">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                  <div className="bg-white dark:bg-card border-2 border-primary/10 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">
                    <div className="flex gap-1.5">
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
            <div className="flex gap-3 max-w-4xl mx-auto items-end">
              <div className="flex-1 relative">
                <Input
                  placeholder={`Command ${activePersona.name}...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="h-14 bg-background border-2 border-primary/10 focus-visible:ring-primary shadow-inner rounded-2xl pr-12"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">
                  <MessageCircle className="h-5 w-5" />
                </div>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={isProcessing}
                className="h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shrink-0 flex items-center justify-center"
              >
                <Send className="h-6 w-6" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4">
               <Sparkles className="h-3 w-3 text-primary animate-pulse" />
               <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">
                 Core Engine: {activePersona.modelId.split('/').pop()}
               </p>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}