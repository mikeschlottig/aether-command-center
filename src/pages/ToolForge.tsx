import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, FileCode2, Sparkles, ScrollText, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/illustrative/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { WranglerConsole, LogEntry } from '@/components/illustrative/WranglerConsole';
import { useAgentStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
type ToolDefinitionPreview = {
  name: string;
  description: string;
  language: string;
  entry: string;
  hint: string;
};
export function ToolForge(): JSX.Element {
  const skills = useAgentStore((s) => s.skills);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(skills[0]?.id ?? null);
  const selectedSkill = useMemo(() => skills.find((s) => s.id === selectedSkillId) || null, [skills, selectedSkillId]);
  const [toolName, setToolName] = useState<string>('');
  const [toolDescription, setToolDescription] = useState<string>('');
  const [preview, setPreview] = useState<ToolDefinitionPreview | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const idCounterRef = useRef(0);
  const createUniqueId = useCallback((prefix: string) => {
    const maybeUuid =
      typeof globalThis !== 'undefined' &&
      typeof globalThis.crypto !== 'undefined' &&
      typeof globalThis.crypto.randomUUID === 'function'
        ? globalThis.crypto.randomUUID()
        : null;
    if (maybeUuid) return `${prefix}-${maybeUuid}`;
    idCounterRef.current += 1;
    return `${prefix}-${Date.now()}-${idCounterRef.current}`;
  }, []);
  const addLog = useCallback(
    (message: string, type: LogEntry['type'] = 'info') => {
      setLogs((prev) => [...prev, { id: createUniqueId('log'), message, type, timestamp: Date.now() }]);
    },
    [createUniqueId]
  );
  const inferToolNameFromSkill = useCallback((skillName: string) => {
    const base = skillName.replace(/\.(t|j)sx?$/i, '').trim();
    return base.length ? base.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() : 'new_tool';
  }, []);
  const handleSelectSkill = useCallback(
    (id: string) => {
      const skill = skills.find((s) => s.id === id);
      setSelectedSkillId(id);
      setPreview(null);
      if (skill) {
        const inferredName = inferToolNameFromSkill(skill.name);
        setToolName(inferredName);
        setToolDescription(skill.description || `Tool definition for ${skill.name}`);
        addLog(`Selected skill "${skill.name}".`, 'info');
      } else {
        addLog(`Selected skill could not be resolved (id: ${id}).`, 'error');
      }
    },
    [addLog, inferToolNameFromSkill, skills]
  );
  const handleGeneratePreview = useCallback(() => {
    if (!selectedSkill) {
      toast.error('No Skill Selected', { description: 'Choose a skill from the left panel first.' });
      addLog('Preview generation failed: no selected skill.', 'error');
      return;
    }
    const name = toolName.trim();
    if (!name) {
      toast.error('Missing Tool Name', { description: 'Provide a tool name to generate a definition preview.' });
      addLog('Preview generation failed: missing tool name.', 'error');
      return;
    }
    const definition: ToolDefinitionPreview = {
      name,
      description: toolDescription.trim() || `Tool definition bound to ${selectedSkill.name}`,
      language: selectedSkill.language,
      entry: selectedSkill.name,
      hint: 'UI-only preview. Server-side tool registration is not performed in this phase.',
    };
    setPreview(definition);
    addLog(`Generated tool definition preview for "${name}".`, 'success');
  }, [addLog, selectedSkill, toolDescription, toolName]);
  const handleSimulateRegister = useCallback(() => {
    if (!preview) {
      toast.error('No Preview', { description: 'Generate a tool definition preview first.' });
      addLog('Register simulation blocked: no preview.', 'error');
      return;
    }
    addLog(`register_tool --name "${preview.name}" --entry "${preview.entry}"`, 'command');
    addLog(`Binding "${preview.name}" (simulated)...`, 'info');
    addLog(`Tool "${preview.name}" registered locally (UI simulation).`, 'success');
    toast.success('Simulated Register Complete', {
      description: `"${preview.name}" is now ready for future server-side wiring.`,
      icon: <CheckCircle2 className="text-emerald-500" />,
    });
  }, [addLog, preview]);
  const isEmpty = skills.length === 0;
  return (
    <AppLayout container>
      <PageHeader
        title="Tool Forge"
        description="Bind forged scripts into tool-like definitions. This is UI-only in Phase 10—use it to draft and preview what will be registered server-side later."
      />
      {isEmpty ? (
        <Card className="card-illustrative border-primary/10 bg-primary/5">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              No Skills Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tool Forge works from your existing forged scripts. Create your first script in the Skill Forge, then return here.
            </p>
            <Link to="/forge">
              <Button className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                Go to Skill Forge
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <Card className="lg:col-span-2 card-illustrative border-primary/10 bg-background">
            <CardHeader className="space-y-2">
              <CardTitle className="font-serif flex items-center gap-2">
                <FileCode2 className="h-5 w-5 text-primary" />
                Choose a Skill
              </CardTitle>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Select a script to draft a tool definition. Nothing is modified in the Skill Forge.
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {skills.map((skill) => {
                const selected = skill.id === selectedSkillId;
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => handleSelectSkill(skill.id)}
                    className={cn(
                      "w-full text-left rounded-2xl border-2 p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      selected
                        ? "bg-primary/5 border-primary/30 shadow-sm"
                        : "bg-card border-transparent hover:bg-accent/40"
                    )}
                    aria-pressed={selected}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate">{skill.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {skill.description || 'No description provided.'}
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "shrink-0 text-[10px] uppercase font-bold",
                          selected ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}
                      >
                        {skill.language}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
          <div className="lg:col-span-3 space-y-6">
            <Card className="card-illustrative border-primary/10 bg-background">
              <CardHeader className="space-y-2">
                <CardTitle className="font-serif flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  Tool Definition
                </CardTitle>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Draft a human-friendly tool name + description. Generate a preview, then simulate registration (no backend changes).
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold" htmlFor="toolName">
                      Tool Name
                    </label>
                    <Input
                      id="toolName"
                      value={toolName}
                      onChange={(e) => setToolName(e.target.value)}
                      placeholder="e.g. web_oracle"
                      className="bg-background border-2 border-primary/10 rounded-2xl h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold" htmlFor="entry">
                      Entry Skill
                    </label>
                    <Input
                      id="entry"
                      value={selectedSkill?.name ?? ''}
                      readOnly
                      className="bg-muted/30 border-2 border-primary/10 rounded-2xl h-11"
                      aria-readonly="true"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold" htmlFor="toolDesc">
                    Tool Description
                  </label>
                  <Textarea
                    id="toolDesc"
                    value={toolDescription}
                    onChange={(e) => setToolDescription(e.target.value)}
                    placeholder="Describe what this tool does, when to use it, and what it returns."
                    className="min-h-[110px] bg-background border-2 border-primary/10 rounded-2xl"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={handleGeneratePreview}
                    className="rounded-xl border-primary/20 hover:border-primary/40 font-bold"
                  >
                    Generate Preview
                  </Button>
                  <Button
                    onClick={handleSimulateRegister}
                    disabled={!preview}
                    className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md"
                  >
                    Simulate Register Tool
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="card-illustrative border-primary/10 bg-background">
              <CardHeader className="space-y-2">
                <CardTitle className="font-serif flex items-center gap-2">
                  <ScrollText className="h-5 w-5 text-primary" />
                  Preview Output
                </CardTitle>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This is a draft payload that would later become a server-side tool definition.
                </p>
              </CardHeader>
              <CardContent>
                {preview ? (
                  <pre className="text-xs font-mono bg-muted/30 p-4 rounded-xl border border-dashed border-primary/20 overflow-auto">
                    {JSON.stringify(preview, null, 2)}
                  </pre>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    Generate a preview to see the draft tool definition.
                  </div>
                )}
              </CardContent>
            </Card>
            <WranglerConsole logs={logs} onClear={() => setLogs([])} />
          </div>
        </div>
      )}
    </AppLayout>
  );
}