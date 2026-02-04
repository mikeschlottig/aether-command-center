import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
export interface MCPServerConfig {
  name: string;
  sseUrl: string;
}
type NormalizedServer = MCPServerConfig;
const MAX_SERVERS = 6;
const MAX_NAME_LEN = 80;
const MAX_URL_LEN = 2048;
export class MCPManager {
  private clients: Map<string, Client> = new Map();
  private toolMap: Map<string, string> = new Map();
  private initialized = false;
  private servers: NormalizedServer[] = [];
  private signature = '';
  private normalizeServers(configs: MCPServerConfig[]): NormalizedServer[] {
    const out: NormalizedServer[] = [];
    const seen = new Set<string>();
    const slice = Array.isArray(configs) ? configs.slice(0, MAX_SERVERS) : [];
    for (const s of slice) {
      const name = typeof s?.name === 'string' ? s.name.trim() : '';
      const sseUrl = typeof s?.sseUrl === 'string' ? s.sseUrl.trim() : '';
      if (!name || !sseUrl) continue;
      if (name.length > MAX_NAME_LEN || sseUrl.length > MAX_URL_LEN) continue;
      let normalizedUrl = '';
      try {
        const url = new URL(sseUrl);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;
        normalizedUrl = url.toString();
      } catch {
        continue;
      }
      const key = `${name}|${normalizedUrl}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ name, sseUrl: normalizedUrl });
    }
    out.sort((a, b) => {
      const nameCmp = a.name.localeCompare(b.name);
      if (nameCmp !== 0) return nameCmp;
      return a.sseUrl.localeCompare(b.sseUrl);
    });
    return out;
  }
  private computeSignature(servers: NormalizedServer[]): string {
    // Stable signature that only changes when (name,url) changes.
    return JSON.stringify(servers.map((s) => ({ name: s.name, sseUrl: s.sseUrl })));
  }
  private reset(): void {
    // Best-effort close existing clients to avoid dangling connections.
    for (const client of this.clients.values()) {
      try {
        (client as any)?.close?.();
      } catch (e) {
        console.warn('[MCPManager] Failed to close MCP client (non-fatal):', e);
      }
    }
    this.clients.clear();
    this.toolMap.clear();
    this.initialized = false;
  }
  setServers(configs: MCPServerConfig[]): void {
    const normalized = this.normalizeServers(configs || []);
    const nextSig = this.computeSignature(normalized);
    if (nextSig === this.signature) return;
    this.signature = nextSig;
    this.servers = normalized;
    // Reset internal caches so that toolMap and clients do not become stale across updates.
    this.reset();
  }
  async initialize() {
    if (this.initialized) return;
    if (this.servers.length === 0) {
      this.initialized = true;
      return;
    }
    for (const serverConfig of this.servers) {
      try {
        const transport = new SSEClientTransport(new URL(serverConfig.sseUrl));
        const client = new Client(
          { name: 'cloudflare-agent', version: '1.0.0' },
          { capabilities: {} }
        );
        await client.connect(transport);
        this.clients.set(serverConfig.name, client);
        const toolsResult = await client.listTools();
        if (toolsResult?.tools) {
          for (const tool of toolsResult.tools) {
            this.toolMap.set(tool.name, serverConfig.name);
          }
        }
      } catch (error) {
        console.error(`Failed to connect to MCP server ${serverConfig.name}:`, error);
        // Non-fatal: continue, allowing other MCP servers and built-in tools to work.
      }
    }
    this.initialized = true;
  }
  async getToolDefinitions() {
    await this.initialize();
    const allTools: any[] = [];
    if (this.clients.size === 0) return allTools;
    for (const [serverName, client] of this.clients.entries()) {
      try {
        const toolsResult = await client.listTools();
        if (toolsResult?.tools) {
          for (const tool of toolsResult.tools) {
            allTools.push({
              type: 'function' as const,
              function: {
                name: tool.name,
                description: tool.description || '',
                parameters: tool.inputSchema || {
                  type: 'object',
                  properties: {},
                  required: [],
                },
              },
            });
          }
        }
      } catch (error) {
        console.error(`Error getting tools from ${serverName}:`, error);
        // Non-fatal: skip this server.
      }
    }
    return allTools;
  }
  async executeTool(toolName: string, args: Record<string, unknown>): Promise<string> {
    await this.initialize();
    const serverName = this.toolMap.get(toolName);
    if (!serverName) {
      throw new Error(`Tool ${toolName} not found in any MCP server`);
    }
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Client for server ${serverName} not available`);
    }
    try {
      const result = await client.callTool({
        name: toolName,
        arguments: args,
      });
      if (result.isError) {
        throw new Error(
          `Tool execution failed: ${
            Array.isArray(result.content) ? result.content.map((c: any) => c.text).join('\n') : 'Unknown error'
          }`
        );
      }
      if (Array.isArray(result.content)) {
        return result.content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
          .join('\n');
      }
      return 'No content returned';
    } catch (error) {
      throw new Error(`Tool execution failed: ${String(error)}`);
    }
  }
}
export const mcpManager = new MCPManager();