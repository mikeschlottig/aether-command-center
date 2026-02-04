# Cloudflare AI Chat Agent Template

[![[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/mikeschlottig/aether-command-center)]](https://deploy.workers.cloudflare.com)

A production-ready Cloudflare Workers template for building AI-powered chat applications. Features persistent chat sessions via Durable Objects, streaming responses, tool calling (web search, weather, MCP integration), and a modern React frontend with shadcn/ui.

## ✨ Features

- **AI-Powered Chat**: Integrated with Cloudflare AI Gateway (supports Gemini models like `gemini-2.5-flash`).
- **Persistent Sessions**: Durable Objects manage chat history and state across requests.
- **Tool Calling**: Built-in tools for web search (SerpAPI), weather, and extensible MCP (Model Context Protocol) tools.
- **Streaming Responses**: Real-time streaming for natural chat experience.
- **Session Management**: Create, list, update, and delete chat sessions via REST API.
- **Modern UI**: React 18 with Tailwind CSS, shadcn/ui components, dark mode, and responsive design.
- **Type-Safe**: Full TypeScript support with proper types for Workers and frontend.
- **Production-Ready**: CORS, error handling, logging, and Cloudflare observability.

## 🛠️ Tech Stack

- **Backend**: Cloudflare Workers, Durable Objects, Hono, Agents SDK, OpenAI SDK
- **AI**: Cloudflare AI Gateway (Gemini models)
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query
- **Tools**: SerpAPI (search), MCP SDK, Web Workers compatibility
- **Build Tools**: Bun, Wrangler, Vite

## 🚀 Quick Start

1. **Clone & Install**:
   ```bash
   git clone <your-repo>
   cd <your-repo>
   bun install
   ```

2. **Configure Environment** (edit `wrangler.jsonc`):
   ```json
   "vars": {
     "CF_AI_BASE_URL": "https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai",
     "CF_AI_API_KEY": "{your_ai_token}",
     "SERPAPI_KEY": "{your_serpapi_key}",
     "OPENROUTER_API_KEY": "{optional_openrouter_key}"
   }
   ```

3. **Development**:
   ```bash
   bun dev
   ```
   Open `http://localhost:3000` (or `PORT=3000 bun dev`).

4. **Deploy**:
   ```bash
   bun deploy
   ```

## 📦 Installation

This project uses **Bun** for fast installs and scripts.

```bash
bun install
```

Generate types:
```bash
bun cf-typegen
```

## 💻 Usage

### Backend API

- **Chat Sessions**:
  - `POST /api/sessions` - Create new session
  - `GET /api/sessions` - List sessions
  - `DELETE /api/sessions/:id` - Delete session
  - `PUT /api/sessions/:id/title` - Update title

- **Chat** (per sessionId):
  - `POST /api/chat/:sessionId/chat` - Send message (supports `stream: true`)
  - `GET /api/chat/:sessionId/messages` - Get chat state
  - `DELETE /api/chat/:sessionId/clear` - Clear messages
  - `POST /api/chat/:sessionId/model` - Update model

### Frontend

- Replace `src/pages/HomePage.tsx` with your chat UI.
- Uses `src/lib/chat.ts` for API integration.
- Chat service auto-manages sessions.

Example chat component integration:
```tsx
import { chatService } from '@/lib/chat';

const sendMessage = async (message: string) => {
  const result = await chatService.sendMessage(message, undefined, (chunk) => {
    console.log('Chunk:', chunk);
  });
};
```

## 🔧 Development

- **Local Dev**: `bun dev` (Workers + Vite dev server).
- **Build**: `bun build` (produces `dist/` for assets).
- **Preview**: `bun preview`.
- **Lint**: `bun lint`.
- **Type Check**: Included in tsconfig setups.

Hot reload works for both frontend (`src/`) and worker (`worker/`).

**Edit Points**:
- Custom routes: `worker/userRoutes.ts`
- Chat logic: `worker/chat.ts`, `worker/tools.ts`
- UI: `src/pages/`, `src/components/`
- Sessions: `worker/app-controller.ts`

**DO NOT EDIT**:
- `worker/index.ts`, `worker/core-utils.ts` (core routing).

## ☁️ Deployment

Deploy to Cloudflare Workers with Pages for assets.

1. **Configure** `wrangler.jsonc` with your vars (AI Gateway, API keys).
2. **Deploy**:
   ```bash
   bun deploy
   ```
   Or use the button:

   [![[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/mikeschlottig/aether-command-center)]](https://deploy.workers.cloudflare.com)

3. **Custom Domain**: `wrangler pages deploy dist --project-name <name>`.
4. **Environment Vars**: Set in Wrangler dashboard or CLI.

**Required Secrets**:
- `CF_AI_BASE_URL`: Your AI Gateway endpoint.
- `CF_AI_API_KEY`: Cloudflare API token (@cloudflare > AI > Tokens).
- `SERPAPI_KEY`: For web search (optional).

**Migrations**: Auto-handled via `wrangler.jsonc`.

## ⚙️ Configuration

- **AI Models**: Edit `MODELS` in `src/lib/chat.ts`.
- **Tools**: Extend `worker/tools.ts` or add MCP servers in `worker/mcp-client.ts`.
- **UI Theme**: Tailwind config in `tailwind.config.js`.
- **Sidebar**: Customize `src/components/app-sidebar.tsx`.

## 🤝 Contributing

1. Fork & PR.
2. Use `bun dev` for testing.
3. Follow TypeScript & ESLint rules.

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

## 🚀 Next Steps

- Add custom tools in `worker/tools.ts`.
- Build your chat UI in `src/pages/HomePage.tsx`.
- Integrate MCP servers for advanced tools.
- Deploy with one click!

Built with ❤️ for Cloudflare Workers. Questions? Check Workers Discord.