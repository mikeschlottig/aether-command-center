import React, { useMemo } from 'react';
import { BookOpen, Sparkles, Clock, CheckCircle2, Shield, Wand2, Handshake } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/illustrative/PageHeader';
import { useAgentStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
type LearningModule = {
  id: string;
  title: string;
  description: string;
  estMinutes: number;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
};
const MODULES: LearningModule[] = [
  {
    id: 'prompt-craft',
    title: 'Prompt Craft',
    description:
      'Write precise system prompts: role, constraints, success criteria, and structured output. Learn how to reduce ambiguity and increase repeatability.',
    estMinutes: 10,
    icon: Wand2,
    tag: 'Foundations',
  },
  {
    id: 'tool-etiquette',
    title: 'Tool Etiquette',
    description:
      'When to call tools, how to validate arguments, and how to summarize results. Learn what “tool results are not truth” means in practice.',
    estMinutes: 8,
    icon: Sparkles,
    tag: 'Tools',
  },
  {
    id: 'edge-safety',
    title: 'Edge Safety',
    description:
      'Reliability patterns: input validation, timeouts, error states, and user-friendly fallbacks. Avoid runtime crashes and brittle integrations.',
    estMinutes: 12,
    icon: Shield,
    tag: 'Reliability',
  },
  {
    id: 'handoff-protocol',
    title: 'Handoff Protocol',
    description:
      'Recognize when to hand off to a different persona, preserve context, and avoid duplicate work. Learn how to signal and accept handoffs cleanly.',
    estMinutes: 7,
    icon: Handshake,
    tag: 'Coordination',
  },
];
export function AgentLearningCenter(): JSX.Element {
  const learningProgress = useAgentStore((s) => s.learningProgress);
  const toggleLearningModule = useAgentStore((s) => s.toggleLearningModule);
  const setLearningModuleCompleted = useAgentStore((s) => s.setLearningModuleCompleted);
  const completedCount = useMemo(() => {
    let count = 0;
    for (const m of MODULES) {
      if (learningProgress?.[m.id]?.completed) count += 1;
    }
    return count;
  }, [learningProgress]);
  const pct = useMemo(() => {
    if (MODULES.length === 0) return 0;
    return Math.round((completedCount / MODULES.length) * 100);
  }, [completedCount]);
  return (
    <AppLayout container>
      <PageHeader
        title="Agent Learning Center"
        description="A small curriculum for better agents: prompts, tool usage, edge safety, and smooth handoffs. Progress is stored locally."
      />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-10">
        <Card className="lg:col-span-2 card-illustrative border-primary/10 bg-primary/5">
          <CardHeader className="space-y-2">
            <CardTitle className="font-serif flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Progress Summary
            </CardTitle>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mark modules complete as you go. You can toggle completion any time.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-background/70 border border-primary/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Completed</div>
                  <div className="text-2xl font-serif font-bold">
                    {completedCount} / {MODULES.length}
                  </div>
                </div>
                <Badge className="rounded-xl bg-primary text-primary-foreground border-primary/20">{pct}%</Badge>
              </div>
              <div className="mt-4">
                <Progress value={pct} className="h-2" />
              </div>
            </div>
            <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-background/60 p-4 space-y-2">
              <div className="text-sm font-bold">Tip</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If an agent keeps failing a tool call, adjust the prompt or switch personas. Handoffs are a feature, not a failure.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="rounded-xl border-primary/20 hover:border-primary/40 font-bold"
                onClick={() => {
                  for (const mod of MODULES) setLearningModuleCompleted(mod.id, false);
                }}
              >
                Reset Progress
              </Button>
              <Button
                className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                onClick={() => {
                  for (const mod of MODULES) setLearningModuleCompleted(mod.id, true);
                }}
              >
                Mark All Complete
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3 card-illustrative border-primary/10 bg-background">
          <CardHeader className="space-y-2">
            <CardTitle className="font-serif flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Modules
            </CardTitle>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Expand a module to read details and mark it complete.
            </p>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {MODULES.map((m) => {
                const completed = !!learningProgress?.[m.id]?.completed;
                const Icon = m.icon;
                return (
                  <AccordionItem key={m.id} value={m.id} className="border-b border-primary/10">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <div
                          className={cn(
                            "h-10 w-10 rounded-xl border flex items-center justify-center shrink-0",
                            completed ? "bg-emerald-50 border-emerald-200" : "bg-muted/30 border-primary/10"
                          )}
                        >
                          <Icon className={cn("h-5 w-5", completed ? "text-emerald-700" : "text-muted-foreground")} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold truncate">{m.title}</span>
                            {completed && (
                              <Badge className="rounded-lg bg-emerald-600 text-white border-emerald-700">
                                Complete
                              </Badge>
                            )}
                            <Badge variant="secondary" className="rounded-lg text-[10px] uppercase tracking-wider font-bold">
                              {m.tag}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3" />
                            ~{m.estMinutes} min
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                      <div className="space-y-4 pl-1">
                        <p className="text-sm text-muted-foreground leading-relaxed">{m.description}</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            className={cn(
                              "rounded-xl font-bold",
                              completed
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-primary hover:bg-primary/90 text-primary-foreground"
                            )}
                            onClick={() => toggleLearningModule(m.id)}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {completed ? 'Mark Incomplete' : 'Mark Complete'}
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl border-primary/20 hover:border-primary/40 font-bold"
                            onClick={() => setLearningModuleCompleted(m.id, true)}
                            disabled={completed}
                          >
                            Quick Complete
                          </Button>
                        </div>
                        {learningProgress?.[m.id]?.completedAt && (
                          <div className="text-xs text-muted-foreground">
                            Completed on {new Date(learningProgress[m.id]!.completedAt!).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}