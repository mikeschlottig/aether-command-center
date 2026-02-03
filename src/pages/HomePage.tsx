import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, Zap, Shield, Search, Terminal, Sparkles, User } from 'lucide-react';
import { useAgentStore } from '@/lib/store';
import { PageHeader } from '@/components/illustrative/PageHeader';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { chatService } from '@/lib/chat';
import { SessionInfo } from '../../worker/types';
import { formatDistanceToNow } from 'date-fns';
export function HomePage() {
  const personas = useAgentStore((s) => s.personas);
  const skills = useAgentStore((s) => s.skills);
  const setActivePersona = useAgentStore((s) => s.setActivePersona);
  const [recentSessions, setRecentSessions] = React.useState<SessionInfo[]>([]);

  React.useEffect(() => {
    chatService.listSessions().then(res => {
      if (res.success && res.data) {
        setRecentSessions(res.data.slice(0, 3));
      }
    });
  }, []);

  return (
    <AppLayout container>
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <PageHeader
            title="Command Center"
            description="Orchestrate your fleet of digital personas and monitor their activities from a single high-vantage point."
          />
          <Link
            to="/atelier"
            className={cn(buttonVariants({variant: 'default'}), 'shadow-lg px-6 py-6 h-auto text-lg rounded-2xl group flex items-center gap-3')}
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
            Manifest Agent
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-illustrative border-primary/20 bg-primary/5 relative overflow-hidden group">
            <CardHeader className="pb-2">
              <Zap className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="text-xl">Fast Sync</CardTitle>
              <CardDescription>Edge processing enabled</CardDescription>
            </CardHeader>
            <Sparkles className="absolute -right-2 -bottom-2 h-16 w-16 text-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Card>
          <Card className="card-illustrative border-orange-200 bg-orange-50/30">
            <CardHeader className="pb-2">
              <Shield className="h-6 w-6 text-orange-500 mb-2" />
              <CardTitle className="text-xl">Safety Node</CardTitle>
              <CardDescription>Content filtering active</CardDescription>
            </CardHeader>
          </Card>
          <Card className="card-illustrative border-indigo-200 bg-indigo-50/30">
            <CardHeader className="pb-2">
              <Terminal className="h-6 w-6 text-indigo-500 mb-2" />
              <CardTitle className="text-xl">Forged Skills</CardTitle>
              <CardDescription>{skills.length} active modules</CardDescription>
            </CardHeader>
          </Card>
          <Card className="card-illustrative border-emerald-200 bg-emerald-50/30">
            <CardHeader className="pb-2">
              <Search className="h-6 w-6 text-emerald-500 mb-2" />
              <CardTitle className="text-xl">MCP Nexus</CardTitle>
              <CardDescription>Global link active</CardDescription>
            </CardHeader>
          </Card>
        </div>
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-3xl font-serif font-bold">Active Crew</h2>
            <Link to="/atelier" className="text-sm font-bold text-primary hover:underline flex items-center gap-1 group">
              Modify Fleet <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {personas.map((persona) => (
              <Card key={persona.id} className="card-illustrative group overflow-hidden bg-card flex flex-col h-full">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-6">
                  <div className="h-16 w-16 rounded-3xl bg-accent flex items-center justify-center text-4xl shadow-inner border-2 border-primary/5">
                    {persona.avatar}
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-serif">{persona.name}</CardTitle>
                    <Badge variant="outline" className="text-[10px] px-2 py-0 border-primary/20 text-primary">
                      {persona.modelId.split('/').pop()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground line-clamp-3 italic leading-relaxed">
                    "{persona.description}"
                  </p>
                  <div className="space-y-2 flex-1">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 block">Equipped Skills</span>
                    <div className="flex flex-wrap gap-2">
                      {persona.tools.map(tool => (
                        <Badge key={tool} variant="secondary" className="bg-muted text-[10px] uppercase tracking-wider font-bold">
                          {tool.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Link
                    to="/deck"
                    className="w-full mt-4 bg-background border-2 border-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold rounded-xl transition-all h-12 flex items-center justify-center shadow-sm hover:shadow-md"
                    onClick={() => setActivePersona(persona.id)}
                  >
                    Summon to Deck
                  </Link>
                </CardContent>
              </Card>
            ))}
            <Link 
              to="/atelier" 
              className="group flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-primary/20 rounded-3xl hover:bg-primary/5 hover:border-primary/40 transition-all gap-4"
            >
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Plus className="h-8 w-8" />
              </div>
              <span className="font-serif font-bold text-lg">New Manifestation</span>
            </Link>
          </div>
        </section>

        {recentSessions.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-3xl font-serif font-bold">Recent Chronicles</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {recentSessions.map((session) => (
                <Card key={session.id} className="card-illustrative bg-card hover:bg-accent/5 transition-colors group">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base line-clamp-1">{session.title}</h4>
                        <p className="text-xs text-muted-foreground font-medium">
                          Active {formatDistanceToNow(session.lastActive)} ago
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/deck"
                      onClick={() => {
                        chatService.switchSession(session.id);
                        // Attempt to find a matching persona for the active session if stored in state (future)
                      }}
                      className={cn(buttonVariants({ variant: 'outline' }), "rounded-xl border-primary/20 hover:border-primary/40 font-bold group-hover:bg-primary group-hover:text-primary-foreground")}
                    >
                      Re-enter
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <footer className="pt-16 pb-8 border-t text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">System Engine v1.0.4 Online</span>
          </div>
          <div className="max-w-md mx-auto">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Aether Command is a stateful edge orchestrator. All personas and skills are managed on the Cloudflare global network.
            </p>
            <p className="text-xs text-muted-foreground/40 mt-4 font-medium italic">
              Note: AI capacity is shared. Please utilize resources responsibly.
            </p>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
}