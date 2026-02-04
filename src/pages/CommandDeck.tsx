import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Send, User, Loader2, Eraser, MessageCircle, Wifi, WifiOff, Network } from 'lucide-react';
import { useAgentStore } from '@/lib/store';
import { PageHeader } from '@/components/illustrative/PageHeader';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { chatService } from '@/lib/chat';
import type { Message, ToolCall } from '../../worker/types';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ToolOutput } from '@/components/illustrative/ToolOutput';
import { HandoffProtocol } from '@/components/illustrative/HandoffProtocol';
export function CommandDeck() {
  const personas = useAgentStore((s) => s.personas);
  const activeId = useAgentStore((s) => s.activePersonaId);
  const setActiveId = useAgentStore((s) => s.setActivePersona);
  const mcpServers = useAgentStore((s) => s.mcpServers);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activePersona = useMemo(() => {
    return personas.find((p) => p.id === activeId) || personas[0];
  }, [activeId, personas]);
  const enabledMcpServers = useMemo(() => {
    const enabled = (mcpServers || []).filter((s) => !!s?.enabled && typeof s?.name === 'string' && typeof s?.sseUrl === 'string');
    return enabled.map((s) => ({ name: s.name, sseUrl: s.sseUrl }));
  }, [mcpServers]);
  const enabledMcpNames = useMemo(() => enabledMcpServers.map((s) => s.name), [enabledMcpServers]);
  const scrollToBottom = useCallback((instant = false) => {
    if (!scrollRef.current) return;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
    });
  }, []);
  useEffect(() => {
    const syncSession = async () => {
      setIsSynced(false);
      const latest = await chatService.getMessages();
      if (latest.success && latest.data) {
        setMessages(latest.data.messages);
        if (activePersona) {
          await chatService.updatePersona(activePersona.name, activePersona.avatar, activePersona.systemPrompt);
        }
        setIsSynced(true);
      }
    };
    syncSession();
    // Intentionally keyed on activePersona fields to avoid extra fetches when unrelated persona props change.
  }, [activePersona?.avatar, activePersona?.name, activePersona?.systemPrompt]);
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage, scrollToBottom]);
  const handleAgentHandoff = useCallback(
    async (agent: any) => {
      if (!agent?.id) return;
      const oldName = activePersona?.name || 'Unknown';
      setActiveId(agent.id);
      await chatService.updatePersona(agent.name, agent.avatar, agent.systemPrompt);
      toast.success(`Authority Transferred`, { description: `${agent.name} is now in command.` });
      const bridgeInput = `[SYSTEM: Authority transferred from ${oldName} to ${agent.name}. Summarizing previous context for continuity...]`;
      setInput(bridgeInput);
    },
    [activePersona?.name, setActiveId]
  );
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isProcessing || !activePersona) return;
    setIsSynced(false);
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);
    setStreamingMessage('');
    try {
      const crewNames = personas.map((p) => p.name);
      const response = await chatService.sendMessage(
        input,
        activePersona.modelId,
        (chunk) => setStreamingMessage((prev) => prev + chunk),
        crewNames,
        enabledMcpServers.length > 0 ? enabledMcpServers : undefined
      );
      if (response.success) {
        const latest = await chatService.getMessages();
        if (latest.success && latest.data) setMessages(latest.data.messages);
        setIsSynced(true);
      } else {
        toast.error('Transmission Error', { description: response.error });
      }
    } catch (err) {
      console.error('[CommandDeck] sendMessage crashed:', err);
      toast.error('Aether Link Failed', { description: 'Please try again in a moment.' });
    } finally {
      setIsProcessing(false);
      setStreamingMessage('');
    }
  }, [activePersona, enabledMcpServers, input, isProcessing, personas]);
  const clearChat = useCallback(() => {
    setMessages([]);
    chatService.clearMessages();
  }, []);
  const visibleMessages = useMemo(() => messages.filter((m) => m.role === 'user' || m.role === 'assistant'), [messages]);
  return (
    <AppLayout className="flex flex-col h-screen overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-9rem)] lg:h-[calc(100vh-10rem)] overflow-hidden">
              <div className="flex items-center justify-between mb-6 shrink-0 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <PageHeader title="Command Deck" className="mb-0" />
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all duration-500',
                        isSynced
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-orange-50 text-orange-600 border-orange-100 animate-pulse'
                      )}
                      aria-live="polite"
                    >
                      {isSynced ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                      {isSynced ? 'Link Active' : 'Syncing...'}
                    </div>
                    <HoverCard openDelay={250}>
                      <HoverCardTrigger asChild>
                        <div
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors cursor-default',
                            enabledMcpServers.length > 0
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                              : 'bg-muted/60 text-muted-foreground border-border'
                          )}
                          role="status"
                          aria-label={
                            enabledMcpServers.length > 0 ? `MCP enabled: ${enabledMcpServers.length}` : 'MCP disabled'
                          }
                        >
                          <Network className="h-3 w-3" />
                          {enabledMcpServers.length > 0 ? `MCP: ${enabledMcpServers.length} Active` : 'MCP: Off'}
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-72">
                        <div className="space-y-2">
                          <div className="text-sm font-bold">Active MCP Servers</div>
                          {enabledMcpServers.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              None enabled. Draft and enable servers in <span className="font-semibold">MCP Forge</span>, then send a message
                              again.
                            </p>
                          ) : (
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {enabledMcpNames.map((n) => (
                                <li key={n} className="flex items-center gap-2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                  <span className="truncate">{n}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          <p className="text-2xs text-muted-foreground/80 leading-relaxed">
                            MCP is best-effort. If a server is unreachable, chat still works—tools will simply fail gracefully.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Select value={activeId || ''} onValueChange={(val) => setActiveId(val)}>
                    <SelectTrigger className="w-[220px] bg-background card-illustrative border-primary/20">
                      <SelectValue placeholder="Select Agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {personas.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.avatar} {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={clearChat}
                    className="card-illustrative border-destructive/20 hover:bg-destructive/10"
                    aria-label="Clear chat"
                  >
                    <Eraser className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Card className="flex-1 flex flex-col overflow-hidden card-illustrative border-primary/20 bg-background/50 backdrop-blur-sm relative min-h-0">
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-8">
                    {visibleMessages.length === 0 && !streamingMessage && (
                      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                        <div className="h-24 w-24 rounded-3xl bg-primary/5 flex items-center justify-center text-6xl shadow-inner border-2 border-dashed border-primary/20">
                          {activePersona?.avatar}
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-serif font-bold text-2xl">Awaiting Directives</h3>
                          <p className="text-muted-foreground max-w-sm italic">"{activePersona?.description}"</p>
                        </div>
                      </div>
                    )}
                    <AnimatePresence initial={false}>
                      {visibleMessages.map((m) => {
                        const hasHandoff = m.role === 'assistant' && m.content?.includes('[HANDOFF:');
                        const cleanContent = m.content?.replace(/\[HANDOFF:.*?\]/g, '').trim();
                        return (
                          <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn('flex gap-4', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                          >
                            <div
                              className={cn(
                                'h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm border',
                                m.role === 'user' ? 'bg-primary text-white border-primary' : 'bg-accent border-accent'
                              )}
                            >
                              {m.role === 'user' ? <User className="h-5 w-5" /> : activePersona?.avatar}
                            </div>
                            <div className="flex flex-col gap-3 max-w-[85%]">
                              {(cleanContent || !hasHandoff) && (
                                <div
                                  className={cn(
                                    'rounded-2xl px-5 py-4 shadow-sm relative',
                                    m.role === 'user'
                                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                                      : 'bg-white dark:bg-card border-2 border-primary/10 rounded-tl-none'
                                  )}
                                >
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{cleanContent || m.content}</p>
                                </div>
                              )}
                              {m.toolCalls && m.toolCalls.length > 0 && (
                                <div className="space-y-2">
                                  {m.toolCalls.map((tc: ToolCall) => (
                                    <ToolOutput key={tc.id} toolCall={tc} />
                                  ))}
                                </div>
                              )}
                              {hasHandoff && (
                                <div className="mt-2">
                                  {(() => {
                                    const match = m.content.match(/\[HANDOFF:\s*(.*?)\]/);
                                    const name = match ? match[1].trim() : '';
                                    const agent = personas.find((p) => p.name.toLowerCase().includes(name.toLowerCase()));
                                    if (agent && agent.id !== activeId) {
                                      return <HandoffProtocol suggestedAgent={agent} onAccept={handleAgentHandoff} />;
                                    }
                                    return null;
                                  })()}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    {streamingMessage && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                        <div className="h-10 w-10 rounded-xl bg-accent border border-accent flex items-center justify-center text-xl shrink-0">
                          {activePersona?.avatar}
                        </div>
                        <div className="bg-white dark:bg-card border-2 border-primary/10 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm max-w-[85%]">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{streamingMessage}</p>
                        </div>
                      </motion.div>
                    )}
                    <div ref={scrollRef} className="h-px w-full" />
                  </div>
                </ScrollArea>
                <div className="p-4 border-t bg-background/50 backdrop-blur-md shrink-0">
                  <div className="flex gap-3 max-w-4xl mx-auto items-end">
                    <div className="flex-1 relative">
                      <Input
                        placeholder={activePersona ? `Command ${activePersona.name}...` : 'Command...'}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendMessage();
                        }}
                        className="h-14 bg-background border-2 border-primary/10 focus-visible:ring-primary shadow-inner rounded-2xl pr-12"
                        aria-label="Chat input"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">
                        <MessageCircle className="h-5 w-5" />
                      </div>
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={isProcessing}
                      className="h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shrink-0 flex items-center justify-center"
                      aria-label="Send message"
                    >
                      {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}