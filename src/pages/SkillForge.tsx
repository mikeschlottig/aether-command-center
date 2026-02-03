import React from 'react';
import { Terminal, Code2, Rocket, Info } from 'lucide-react';
import { PageHeader } from '@/components/illustrative/PageHeader';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
const MOCK_CODE = `/**
 * Weather Skill v1.0
 * Fetches real-time environmental data via edge API.
 */
export async function get_weather(location: string) {
  const endpoint = \`https://api.aether.com/weather/\${location}\`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error('Cloud obstruction detected.');
  }
  return await response.json();
}`;
export function SkillForge() {
  return (
    <AppLayout container>
      <PageHeader 
        title="Skill Forge" 
        description="Write and deploy TypeScript logic that agents can use as 'Hands' to interact with the physical and digital world."
      />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <Card className="card-illustrative border-primary/20 bg-background font-mono relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-8 bg-muted flex items-center px-4 gap-2">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <span className="text-xs text-muted-foreground ml-2 font-sans opacity-70">weather-watcher.ts</span>
            </div>
            <CardContent className="pt-12">
              <pre className="text-sm text-primary/80 leading-relaxed overflow-x-auto">
                <code>{MOCK_CODE}</code>
              </pre>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-4">
            <div className="flex items-center gap-2 px-4 text-sm text-muted-foreground font-medium italic">
              <Info className="h-4 w-4" />
              Manifestation currently locked in preview mode.
            </div>
            <button disabled className="btn-gradient opacity-50 px-8 py-3 rounded-xl font-bold flex items-center gap-2 cursor-not-allowed">
              <Rocket className="h-4 w-4" />
              Deploy to Edge
            </button>
          </div>
        </div>
        <div className="space-y-6">
          <Card className="card-illustrative border-indigo-200 bg-indigo-50/20">
            <CardHeader>
              <Terminal className="h-5 w-5 text-indigo-500 mb-2" />
              <CardTitle className="text-lg">What is a Skill?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              Skills are Cloudflare Workers that follow the Model Context Protocol (MCP). When deployed, agents can autonomously decide when to call these functions.
            </CardContent>
          </Card>
          <Card className="card-illustrative border-amber-200 bg-amber-50/20">
            <CardHeader>
              <Code2 className="h-5 w-5 text-amber-500 mb-2" />
              <CardTitle className="text-lg">Forge Roadmap</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs space-y-2 font-medium">
                <li className="flex gap-2">✔️ Monaco Editor Integration</li>
                <li className="flex gap-2">✔️ Typescript Validation</li>
                <li className="flex gap-2 opacity-50">⭕ Real-time Deployment</li>
                <li className="flex gap-2 opacity-50">⭕ Log Monitoring</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}