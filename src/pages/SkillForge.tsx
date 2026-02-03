import React, { useState, useEffect } from 'react';
import { Terminal, Code2, Rocket, Info, FileCode, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { PageHeader } from '@/components/illustrative/PageHeader';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAgentStore, CustomSkill } from '@/lib/store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
export function SkillForge() {
  const skills = useAgentStore(s => s.skills);
  const saveSkill = useAgentStore(s => s.saveSkill);
  const deleteSkill = useAgentStore(s => s.deleteSkill);
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const activeSkill = skills.find(s => s.id === activeSkillId);
  
  useEffect(() => {
    if (activeSkill) {
      setCode(activeSkill.code);
    }
  }, [activeSkillId, skills]);
  const handleSave = () => {
    if (!activeSkillId) return;
    const currentSkill = skills.find(s => s.id === activeSkillId);
    if (!currentSkill) return;
    saveSkill({
      ...currentSkill,
      code,
    });
    toast.success("Script Saved Locally");
  };
  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      handleSave();
      toast.success("Skill Manifested on Edge", {
        description: "Your agents can now utilize this tool in the Command Deck.",
        icon: <CheckCircle2 className="text-green-500" />
      });
    }, 2000);
  };
  const createNewSkill = () => {
    const id = `skill-${Date.now()}`;
    const newSkill: CustomSkill = {
      id,
      name: 'new-skill.ts',
      language: 'typescript',
      description: 'A custom edge capability',
      updatedAt: Date.now(),
      code: `export async function handle_request(args: any) {\n  // Implement logic here\n  return { success: true };\n}`
    };
    saveSkill(newSkill);
    setActiveSkillId(id);
  };
  return (
    <AppLayout container>
      <PageHeader
        title="Skill Forge"
        description="Write and deploy TypeScript logic that agents can use as 'Hands' to interact with the physical and digital world."
      />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-serif font-bold text-lg">Scripts</h3>
            <Button size="icon" variant="ghost" onClick={createNewSkill}>
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
                {skills.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      const wasActive = activeSkillId === skill.id;
                      deleteSkill(skill.id);
                      if (wasActive && skills.length === 1) {
                        setActiveSkillId(null);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-3 space-y-6">
          <Card className="card-illustrative border-primary/20 bg-background overflow-hidden relative min-h-[500px]">
            <div className="absolute top-0 left-0 w-full h-10 bg-muted/30 border-b flex items-center px-4 justify-between z-10 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="text-xs text-muted-foreground ml-2 font-mono opacity-70">
                  {activeSkill?.name || 'editor'}
                </span>
              </div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">
                Edge-Runtime v2.4
              </div>
            </div>
            <div className="pt-10 h-full">
              <Editor
                height="500px"
                defaultLanguage="typescript"
                theme="vs-light"
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  padding: { top: 20 },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </Card>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 px-4 text-sm text-muted-foreground font-medium italic">
              <Info className="h-4 w-4" />
              {activeSkill ? `Last forged: ${new Date(activeSkill.updatedAt).toLocaleTimeString()}` : 'Select a script'}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSave}>Save Locally</Button>
              <Button 
                onClick={handleDeploy}
                disabled={isDeploying || !activeSkillId} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg relative overflow-hidden"
              >
                {isDeploying ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Rocket className="h-4 w-4" />
                    </motion.div>
                    Manifesting...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Deploy to Edge
                  </>
                )}
                {isDeploying && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-1 bg-white/30"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2 }}
                  />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}