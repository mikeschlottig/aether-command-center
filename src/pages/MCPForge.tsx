import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Plus, Network, Info, Trash2, Link2Off, Link2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/illustrative/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { WranglerConsole, LogEntry } from '@/components/illustrative/WranglerConsole';
import { useAgentStore } from '@/lib/store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
export function MCPForge(): JSX.Element {
  const mcpServers = useAgentStore((s) => s.mcpServers);
  const addMcpServer = useAgentStore((s) => s.addMcpServer);
  const toggleMcpServerEnabled = useAgentStore((s) => s.toggleMcpServerEnabled);
  const removeMcpServer = useAgentStore((s) => s.removeMcpServer);
  const [name, setName] = useState('');
  const [sseUrl, setSseUrl] = useState('');
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
  const canSubmit = useMemo(() => name.trim().length > 0 && sseUrl.trim().length > 0, [name, sseUrl]);
  const validateUrl = useCallback((raw: string): { ok: true; url: URL } | { ok: false } => {
    try {
      const url = new URL(raw);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return { ok: false };
      return { ok: true, url };
    } catch {
      return { ok: false };
    }
  }, []);
  const handleAdd = useCallback(() => {
    const cleanName = name.trim();
    const cleanUrl = sseUrl.trim();
    if (!cleanName || !cleanUrl) {
      toast.error('Missing Fields', { description: 'Server name and SSE URL are required.' });
      addLog('Add blocked: missing required fields.', 'error');
      return;
    }
    const validated = validateUrl(cleanUrl);
    if (!validated.ok) {
      toast.error('Invalid URL', { description: 'Provide a valid http(s) SSE endpoint URL.' });
      addLog(`Invalid URL rejected: "${cleanUrl}".`, 'error');
      return;
    }
    const id = createUniqueId('mcp');
    addMcpServer({
      id,
      name: cleanName,
      sseUrl: validated.url.toString(),
      enabled: true,
      createdAt: Date.now(),
    });
    addLog(`Drafted MCP server "${cleanName}" (${validated.url.toString()}).`, 'success');
    addLog(`Enabled drafts are sent with Command Deck requests (best-effort).`, 'info');
    setName('');
    setSseUrl('');
  }, [addLog, addMcpServer, createUniqueId, name, sseUrl, validateUrl]);
  const handleToggle = useCallback(
    (id: string, nextEnabled: boolean) => {
      toggleMcpServerEnabled(id);
      addLog(`${nextEnabled ? 'Enabled' : 'Disabled'} MCP draft server (id: ${id.slice(0, 8)}).`, 'info');
    },
    [addLog, toggleMcpServerEnabled]
  );
  const handleRemove = useCallback(
    (id: string, serverName: string) => {
      removeMcpServer(id);
      addLog(`Removed MCP draft server "${serverName}" (id: ${id.slice(0, 8)}).`, 'command');
    },
    [addLog, removeMcpServer]
  );
  return (
    <AppLayout container>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <PageHeader
          title="MCP Forge"
          description="Draft MCP server connections locally. Enabled drafts are sent with Command Deck requests, and the Worker will attempt to connect at runtime (best-effort)."
        />
        <Link to="/deck" className="shrink-0">
          <Button className="rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg h-12 px-6 gap-2">
            Go to Command Deck
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-10">
        <Card className="lg:col-span-2 card-illustrative border-primary/10 bg-background">
          <CardHeader className="space-y-2">
            <CardTitle className="font-serif flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add MCP Server
            </CardTitle>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Provide an SSE endpoint for an MCP server. These drafts are persisted locally and included with Command Deck chat requests.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mcpName" className="font-bold">
                Server Name
              </Label>
              <Input
                id="mcpName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aether Nexus"
                className="bg-background border-2 border-primary/10 rounded-2xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mcpUrl" className="font-bold">
                SSE URL
              </Label>
              <Input
                id="mcpUrl"
                value={sseUrl}
                onChange={(e) => setSseUrl(e.target.value)}
                placeholder="https://example.com/sse"
                className="bg-background border-2 border-primary/10 rounded-2xl h-11"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
              />
              <p className="text-2xs text-muted-foreground">
                Tip: use a full URL with <span className="font-mono">https://</span>.
              </p>
            </div>
            <Button
              onClick={handleAdd}
              disabled={!canSubmit}
              className="w-full rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md h-11"
            >
              Draft Connection
            </Button>
            <Card className="border-2 border-dashed border-primary/20 bg-primary/5 rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-serif flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Important Disclaimer
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-2">
                <p>
                  Enabled drafts are <span className="font-bold">sent with your Command Deck messages</span>. The Worker will attempt to connect
                  to these servers at runtime to discover tools.
                </p>
                <p>
                  Availability depends on reachability and server correctness. If a server is offline, chat still works—remote tools will simply
                  fail gracefully.
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
        <div className="lg:col-span-3 space-y-6">
          <Card className="card-illustrative border-primary/10 bg-background">
            <CardHeader className="space-y-2">
              <CardTitle className="font-serif flex items-center gap-2">
                <Network className="h-5 w-5 text-primary" />
                Draft Servers
              </CardTitle>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Toggle drafts on/off, then test immediately in the Command Deck.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {mcpServers.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/5 border-2 border-dashed border-primary/20 flex items-center justify-center text-primary">
                    <Link2Off className="h-6 w-6" />
                  </div>
                  <div className="text-sm text-muted-foreground">No MCP drafts yet. Add one to start mapping your MCP Nexus.</div>
                </div>
              ) : (
                mcpServers.map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      'rounded-2xl border-2 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors',
                      s.enabled ? 'bg-emerald-50/40 border-emerald-100' : 'bg-muted/30 border-primary/10'
                    )}
                  >
                    <div className="min-w-0">
                      <div className="font-bold flex items-center gap-2 min-w-0">
                        <Link2 className={cn('h-4 w-4', s.enabled ? 'text-emerald-600' : 'text-muted-foreground')} />
                        <span className="truncate">{s.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono break-all mt-1">{s.sseUrl}</div>
                      <div className="text-2xs text-muted-foreground mt-1">Created {new Date(s.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-3 justify-end shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {s.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <Switch checked={s.enabled} onCheckedChange={(checked) => handleToggle(s.id, checked)} aria-label={`Toggle ${s.name}`} />
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl border-primary/20 hover:border-primary/40 hover:bg-destructive/10"
                        onClick={() => handleRemove(s.id, s.name)}
                        aria-label={`Remove ${s.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <WranglerConsole logs={logs} onClear={() => setLogs([])} />
        </div>
      </div>
    </AppLayout>
  );
}