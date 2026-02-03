import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Save, User, Brain, ScrollText, PenTool, Sparkles } from 'lucide-react';
import { useAgentStore } from '@/lib/store';
import { PageHeader } from '@/components/illustrative/PageHeader';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MODELS } from '@/lib/chat';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
const AVATARS = ['🤖', '🧙‍♂️', '🧚', '🦸‍♂️', '👩‍💻', '👨‍🔬', '🦉', '🦊', '🦁'];
const AVAILABLE_TOOLS = [
  { id: 'get_weather', name: 'Weather Watcher', desc: 'Real-time weather data' },
  { id: 'web_search', name: 'Web Oracle', desc: 'Live search and content retrieval' },
];
export function AgentAtelier() {
  const navigate = useNavigate();
  const addPersona = useAgentStore((s) => s.addPersona);
  const [form, setForm] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    modelId: MODELS[0].id,
    avatar: AVATARS[0],
    tools: [] as string[],
  });
  const handleSave = () => {
    if (!form.name || !form.systemPrompt) {
      toast.error("Manifestation Failed", { description: "Name and Soul (Prompt) are required." });
      return;
    }
    addPersona({
      ...form,
      id: uuidv4(),
    });
    toast.success("Persona Manifested", { description: `${form.name} is now part of your crew.` });
    navigate('/');
  };
  return (
    <AppLayout container>
      <PageHeader
        title="Agent Atelier"
        description="Craft the identity, cognition, and capabilities of your digital workers."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <User className="h-5 w-5" />
              <h3 className="font-serif font-bold text-xl">Identity</h3>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Architect-1"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Brief Purpose</Label>
                <Input
                  id="description"
                  placeholder="e.g. Master of distributed systems"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="bg-background"
                />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Brain className="h-5 w-5" />
              <h3 className="font-serif font-bold text-xl">Cognition</h3>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Brain Model</Label>
                <Select
                  value={form.modelId}
                  onValueChange={(val) => setForm({ ...form, modelId: val })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select Brain" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="soul">Soul (System Prompt)</Label>
                <Textarea
                  id="soul"
                  placeholder="Define their personality, constraints, and expertise..."
                  className="min-h-[200px] bg-background"
                  value={form.systemPrompt}
                  onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <PenTool className="h-5 w-5" />
              <h3 className="font-serif font-bold text-xl">Skills (Hands)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AVAILABLE_TOOLS.map((tool) => (
                <div key={tool.id} className="flex items-start space-x-3 p-4 rounded-xl border bg-card">
                  <Checkbox
                    id={tool.id}
                    checked={form.tools.includes(tool.id)}
                    onCheckedChange={(checked) => {
                      if (checked) setForm({ ...form, tools: [...form.tools, tool.id] });
                      else setForm({ ...form, tools: form.tools.filter(t => t !== tool.id) });
                    }}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor={tool.id} className="font-bold cursor-pointer">
                      {tool.name}
                    </Label>
                    <p className="text-xs text-muted-foreground">{tool.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-6 flex justify-end gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg min-w-[140px]" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Manifest
            </Button>
          </div>
        </div>
        <div className="space-y-6">
          <div className="sticky top-8 space-y-6">
            <h3 className="font-serif font-bold text-xl px-2">Avatar Select</h3>
            <div className="grid grid-cols-3 gap-3">
              {AVATARS.map(av => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setForm({ ...form, avatar: av })}
                  className={cn(
                    "h-16 rounded-2xl flex items-center justify-center text-3xl transition-all",
                    form.avatar === av
                      ? "bg-primary text-white scale-110 shadow-lg"
                      : "bg-background border-2 border-transparent hover:border-primary/20"
                  )}
                >
                  {av}
                </button>
              ))}
            </div>
            <div className="p-6 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 space-y-4">
              <Sparkles className="h-8 w-8 text-primary" />
              <h4 className="font-serif font-bold text-lg">Builder Tip</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A specific "Soul" (System Prompt) makes an agent more predictable and specialized. Try giving them a name or a job title in the prompt!
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}