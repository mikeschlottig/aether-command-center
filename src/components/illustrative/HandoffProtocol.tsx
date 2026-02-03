import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, ArrowRightLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentPersona } from '@/lib/store';
interface HandoffProtocolProps {
  suggestedAgent: AgentPersona;
  onAccept: (agent: AgentPersona) => void;
}
export function HandoffProtocol({ suggestedAgent, onAccept }: HandoffProtocolProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-5 shadow-sm card-illustrative overflow-hidden relative"
    >
      <div className="absolute -right-4 -top-4 opacity-10">
        <Sparkles className="h-24 w-24 text-primary" />
      </div>
      <div className="flex items-start gap-4 relative z-10">
        <div className="h-14 w-14 rounded-2xl bg-white dark:bg-card border-2 border-primary/10 flex items-center justify-center text-3xl shadow-sm shrink-0">
          {suggestedAgent.avatar}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary/60">Aether Handoff Protocol</span>
          </div>
          <div>
            <h4 className="font-serif font-bold text-lg leading-tight">
              Summon {suggestedAgent.name}?
            </h4>
            <p className="text-sm text-muted-foreground italic leading-relaxed">
              "{suggestedAgent.description}"
            </p>
          </div>
          <div className="pt-2">
            <Button 
              onClick={() => onAccept(suggestedAgent)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl h-10 px-6 shadow-md transition-all group"
            >
              Transfer Authority
              <UserPlus className="ml-2 h-4 w-4 group-hover:scale-110 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}