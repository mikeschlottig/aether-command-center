import React, { useState, useEffect } from 'react';
import { Terminal, Code2, Rocket, Info, FileCode, Plus, Trash2, CheckCircle2, Cpu, Globe, Database, Play } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { PageHeader } from '@/components/illustrative/PageHeader';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAgentStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { WranglerConsole, LogEntry } from '@/components/illustrative/WranglerConsole';
export function SkillForge() {
  const skills = useAgentStore(s => s.skills);
  const saveSkill = useAgentStore(s => s.saveSkill);
  const deleteSkill = useAgentStore(s => s.deleteSkill);
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const activeSkill = skills.find(s => s.id === activeSkillId);
  useEffect(() => {
    if (activeSkill) {
      setCode(activeSkill.code);
    }
  }, [activeSkillId, activeSkill]);
  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, { id: Date.now().toString(), message, type, timestamp: Date.now() }]);
  };
  const handleSave = () => {
    if (!activeSkillId || !activeSkill) return;
    saveSkill({ ...activeSkill, code });
    addLog(`Saved ${activeSkill.name} to local drafting space.`, 'info');
    toast.success("Script Saved Locally");
  };
  const handleDeploy = () => {
    if (!activeSkill) return;
    setIsDeploying(true);
    addLog(`wrangler deploy ${activeSkill.name} --env production`, 'command');
    addLog(`Gathering edge dependencies...`, 'info');
    setTimeout(() => {
      addLog(`Uploading worker bundle to Cloudflare Global Network...`, 'info');
      setTimeout(() => {
        setIsDeploying(false);
        handleSave();
        addLog(`Successfully manifested ${activeSkill.name} at the edge!`, 'success');
        addLog(`Worker accessible at https://${activeSkill.name.split('.')[0]}.aether.workers.dev`, 'info');
        toast.success("Skill Manifested on Edge", {
          description: "Agents can now utilize this tool.",
          icon: <CheckCircle2 className="text-green-500" />
        });
      }, 1500);
    }, 1000);
  };
  const handlePreview = () => {
    if (!activeSkill) return;
    addLog(`wrangler dev --remote`, 'command');
    addLog(`[Preview] Invoking ${activeSkill.name}...`, 'info');
    setTimeout(() => {
      addLog(`[Response] { "status": "active", "latency": "42ms", "result": "Aether flow stable" }`, 'success');
    }, 800);
  };
  const createNewSkill = () => {
    const id = `skill-${Date.now()}`;
    const newSkill = {
      id,
      name: `skill-${skills.length + 1}.ts`,
      language: 'typescript',
      description: 'A custom edge capability',
      updatedAt: Date.now(),
      code: `export async function handle_request(args: any) {\n  // Implement logic here\n  return { success: true, timestamp: Date.now() };\n}`,
      bindings: { kv: [], d1: [], ai: true }
    };
    saveSkill(newSkill);
    setActiveSkillId(id);
    addLog(`Initialized new workspace: ${newSkill.name}`, 'info');
  };
  return (
    <AppLayout container>
      <PageHeader
        title="Skill Forge"
        description="Write and deploy TypeScript logic that agents use to interact with the world."
      />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-serif font-bold text-lg">Scripts</h3>
              <Button size="icon" variant="ghost" onClick={createNewSkill} className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  onClick={() => setActiveSkillId(skill.id)}
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer",
                    activeSkillId === skill.id
                      ? "bg-primary/5 border-primary shadow-sm"
                      : "bg-background border-transparent hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <FileCode className={cn("h-4 w-4", activeSkillId === skill.id ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-sm font-medium">{skill.name}</span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); deleteSkill(skill.id); if (activeSkillId === skill.id) setActiveSkillId(null); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <Card className="p-4 card-illustrative border-primary/10 bg-primary/5 space-y-4">
            <h4 className="font-serif font-bold flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              Edge Bindings
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border">
                <div className="flex items-center gap-2">
                  <Database className="h-3 w-3 text-orange-500" />
                  <span>D1_STORE</span>
                </div>
                <div className="h-2 w-2 rounded-full bg-green-500" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border">
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3 text-blue-500" />
                  <span>KV_CACHE</span>
                </div>
                <div className="h-2 w-2 rounded-full bg-green-500" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border">
                <div className="flex items-center gap-2">
                  <Rocket className="h-3 w-3 text-purple-500" />
                  <span>AI_GATEWAY</span>
                </div>
                <div className="h-2 w-2 rounded-full bg-green-500" />
              </div>
            </div>
          </Card>
        </div>
        <div className="lg:col-span-3 space-y-6">
          <Card className="card-illustrative border-primary/20 bg-background overflow-hidden relative min-h-[400px]">
            <div className="absolute top-0 left-0 w-full h-10 bg-muted/30 border-b flex items-center px-4 justify-between z-10 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="text-xs text-muted-foreground ml-2 font-mono opacity-70">
                  {activeSkill?.name || 'editor'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={handlePreview} className="h-7 text-xs gap-1">
                  <Play className="h-3 w-3" /> Preview
                </Button>
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">
                  Edge-Runtime v2.4
                </div>
              </div>
            </div>
            <div className="pt-10">
              <Editor
                height="400px"
                defaultLanguage="typescript"
                theme="vs-light"
                value={code}
                onChange={(val) => setCode(val || '')}
                loading={<div className="h-full w-full flex items-center justify-center italic text-muted-foreground">Awakening the Forge...</div>}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  padding: { top: 20 },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  lineNumbers: 'on',
                  roundedSelection: true,
                  scrollbar: { vertical: 'hidden' }
                }}
              />
            </div>
          </Card>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 px-4 text-sm text-muted-foreground font-medium italic">
              <Info className="h-4 w-4" />
              {activeSkill ? `Forge Sync: ${new Date(activeSkill.updatedAt).toLocaleTimeString()}` : 'Select a script'}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSave} className="rounded-xl">Save Local</Button>
              <Button
                onClick={handleDeploy}
                disabled={isDeploying || !activeSkillId}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg relative overflow-hidden"
              >
                {isDeploying ? 'Manifesting...' : 'Deploy to Edge'}
                <Rocket className={cn("h-4 w-4", isDeploying && "animate-bounce")} />
              </Button>
            </div>
          </div>
          <WranglerConsole logs={logs} onClear={() => setLogs([])} />
        </div>
      </div>
    </AppLayout>
  );
}