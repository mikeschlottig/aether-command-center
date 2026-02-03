import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, User, ArrowRight, Zap, Shield, Search } from 'lucide-react';
import { useAgentStore } from '@/lib/store';
import { PageHeader } from '@/components/illustrative/PageHeader';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
export function HomePage() {
  const personas = useAgentStore((s) => s.personas);
  const setActivePersona = useAgentStore((s) => s.setActivePersona);
  return (
    <AppLayout container>
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <PageHeader 
            title="Command Center" 
            description="Orchestrate your fleet of digital personas and monitor their activities from a single high-vantage point."
          />
          <Button asChild className="btn-gradient shadow-lg">
            <Link to="/atelier" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Manifest New Agent
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-illustrative border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <Zap className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="text-xl">Fast Sync</CardTitle>
              <CardDescription>Edge processing enabled</CardDescription>
            </CardHeader>
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
              <Search className="h-6 w-6 text-indigo-500 mb-2" />
              <CardTitle className="text-xl">Intelligence</CardTitle>
              <CardDescription>Tools ready for invocation</CardDescription>
            </CardHeader>
          </Card>
        </div>
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-2xl font-serif font-bold">Active Crew</h2>
            <Link to="/atelier" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personas.map((persona) => (
              <Card key={persona.id} className="card-illustrative group overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                  <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center text-2xl shadow-inner">
                    {persona.avatar}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{persona.name}</CardTitle>
                    <CardDescription className="line-clamp-1">{persona.modelId.split('/').pop()}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 italic">
                    "{persona.description}"
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {persona.tools.map(tool => (
                      <Badge key={tool} variant="secondary" className="text-[10px] uppercase tracking-wider font-bold opacity-70">
                        {tool.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    onClick={() => setActivePersona(persona.id)}
                    asChild
                  >
                    <Link to="/deck">Summon to Deck</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <footer className="pt-12 border-t text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Aether Command v1.0.0 — Crafted for the edge.
          </p>
          <p className="text-xs text-muted-foreground/50">
            Note: Requests may be limited during peak hours.
          </p>
        </footer>
      </div>
    </AppLayout>
  );
}