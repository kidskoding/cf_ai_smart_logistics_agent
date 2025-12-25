# Cloudflare AI Chat Agent

[![Deploy to Cloudflare][cloudflarebutton]]

A production-ready full-stack AI chat application powered by Cloudflare Workers, Durable Objects, and Agents SDK. Features multi-session conversations, tool calling (web search, weather, MCP integration), streaming responses, and a modern React UI with Tailwind CSS and shadcn/ui.

## Features

- **Multi-Session Chat**: Persistent conversations stored in Durable Objects with session management (list, create, delete, rename).
- **AI Integration**: Supports Gemini models via Cloudflare AI Gateway with tool calling and function execution.
- **Tools & Capabilities**:
  - Web search via SerpAPI.
  - Website content fetching.
  - Mock weather lookup.
  - Extensible MCP (Model Context Protocol) server integration.
- **Streaming Responses**: Real-time chat with SSE support.
- **Modern UI**: Responsive React app with dark/light themes, sidebar navigation, and shadcn/ui components.
- **Session Management**: RESTful APIs for sessions (`/api/sessions`).
- **Production-Ready**: TypeScript, error handling, CORS, logging, and Cloudflare observability.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Lucide Icons, Framer Motion.
- **Backend**: Cloudflare Workers, Hono, Agents SDK, Durable Objects, OpenAI SDK.
- **AI**: Cloudflare AI Gateway (Gemini models), SerpAPI, MCP SDK.
- **Build Tools**: Bun, Wrangler, Vite.

## Prerequisites

- [Bun](https://bun.sh/) (package manager).
- [Cloudflare CLI (Wrangler)](https://developers.cloudflare.com/workers/wrangler/installation/).
- Cloudflare account with:
  - AI Gateway configured (for `CF_AI_BASE_URL` and `CF_AI_API_KEY`).
  - SerpAPI key (optional, for web search).
- Node.js types via `bunx wrangler types`.

## Installation

1. Clone the repository:
   ```
   git clone <your-repo-url>
   cd <project-name>
   ```

2. Install dependencies:
   ```
   bun install
   ```

3. Configure environment variables in `wrangler.jsonc`:
   ```json
   "vars": {
     "CF_AI_BASE_URL": "https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai",
     "CF_AI_API_KEY": "{your-ai-gateway-token}",
     "SERPAPI_KEY": "{your-serpapi-key}",
     "OPENROUTER_API_KEY": "{optional}"
   }
   ```

4. Generate Worker types:
   ```
   bun run cf-typegen
   ```

## Running Locally

Start the development server:
```
bun dev
```

- Frontend: http://localhost:3000 (Vite dev server).
- Backend APIs: Proxied through Worker at `/api/*`.
- Test chat: Open app, send messages, switch sessions.

Hot reload works for both frontend and Worker code.

## Usage

### Chat Sessions
- **Create**: `POST /api/sessions` with `{ title, firstMessage }`.
- **List**: `GET /api/sessions`.
- **Delete**: `DELETE /api/sessions/:id`.
- **Rename**: `PUT /api/sessions/:id/title`.

### Chat APIs (per session `/api/chat/:sessionId`)
- **Send Message**: `POST /chat` `{ message, model, stream: true }`.
- **Get State**: `GET /messages`.
- **Clear**: `DELETE /clear`.
- **Switch Model**: `POST /model` `{ model }`.

Available models: Gemini 2.5 Flash/Pro/2.0 Flash.

Example frontend integration (via `src/lib/chat.ts`):
```tsx
const response = await chatService.sendMessage('Hello!', undefined, (chunk) => {
  // Handle streaming chunk
});
```

## Development

- **Frontend**: Edit `src/` – uses Vite + React Router + TanStack Query.
- **Backend**: Edit `worker/userRoutes.ts` for custom routes; `worker/tools.ts` for tools; `worker/chat.ts` for AI logic.
- **TypeScript**: Full type safety with paths mapped (`@/*`, `@shared/*`).
- **Linting**: `bun lint`.
- **Build**: `bun build` (generates `dist/` for Pages).

**Extension Points**:
- Add MCP servers in `worker/mcp-client.ts`.
- Custom tools in `worker/tools.ts`.
- UI components in `src/components/ui`.

## Deployment

1. Build the app:
   ```
   bun build
   ```

2. Deploy to Cloudflare Pages + Workers:
   ```
   bun deploy
   ```
   Or use Wrangler UI / CLI with `wrangler pages deploy dist --project-name=<name>`.

Configure:
- Bind `CHAT_AGENT` and `APP_CONTROLLER` Durable Objects.
- Set vars in Cloudflare dashboard (AI Gateway, SerpAPI).
- Assets handled as SPA via `wrangler.jsonc`.

[cloudflarebutton]

## Contributing

1. Fork and create a PR.
2. Use `bun dev` for local testing.
3. Follow TypeScript + ESLint standards.
4. Update `README.md` for major changes.

## License

MIT License. See [LICENSE](LICENSE) for details.

## Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Agents SDK](https://developers.cloudflare.com/agents/)
- [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/)

Built with ❤️ for the Cloudflare ecosystem.