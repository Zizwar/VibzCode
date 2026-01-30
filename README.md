# VibZcode

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

**AI-powered code exploration and analysis platform**

Upload projects from GitHub, ZIP, or URL — browse files, extract content, and chat with AI models about your code.

[Features](#features) &bull; [Quick Start](#quick-start) &bull; [API](#api-reference) &bull; [Configuration](#configuration) &bull; [Contributing](#contributing)

</div>

---

## Features

### Project Loading
- Clone from **GitHub** repositories with branch selection
- Fetch from any **URL** (ZIP files)
- **Drag & drop** ZIP file upload
- **URL hash loading** — open repos via `vibzcode.com/#https://github.com/user/repo`
- File size limit enforcement (configurable)

### File Explorer
- Interactive **file tree** with folder expand/collapse
- **Smart detection** of important files (package.json, Dockerfile, main entry points, etc.)
- File **search/filter** with keyboard shortcut (`Ctrl+K`)
- **Syntax-highlighted preview** modal for any file
- **File groups** — save and reload file selections
- Media file filtering

### AI Chat
- Multi-model support via [OpenRouter](https://openrouter.ai/) (GPT, Grok, and more)
- **Prompt caching** (`cache_control: ephemeral`) to reduce token costs on repeated context
- **Quick actions**: Explain, Find Bugs, Improve, Generate Tests, Documentation, Refactor
- Markdown rendering with syntax highlighting and code copy buttons
- Chat history persistence per project
- **Specialized agents**: Security analysis, performance optimization, documentation generation, refactoring, testing

### Prompt & Output
- Prompt **templates** for common tasks
- Automatic **file structure** inclusion in output
- Code **summarization** option (strips comments, formats code)
- **Token estimation** display
- Copy to clipboard or download as file

### UI/UX
- **DaisyUI** component library on Tailwind CSS
- Dark and light theme toggle
- Fully **responsive** — works on mobile and desktop
- **Session persistence** via localStorage
- Keyboard shortcuts (`Ctrl+Enter` to extract/send, `Ctrl+K` to search)
- Toast notifications

### Configuration from UI
- **Models management** — add, remove, enable/disable AI models from settings
- **App config** — default model, cache toggle, auto-select important files
- **Environment variables** — update API keys and limits without restarting

---

## Quick Start

### Prerequisites

- **Node.js** 18+
- **npm**
- (Optional) MongoDB for cloud storage
- (Optional) [OpenRouter API key](https://openrouter.ai/) for AI features

### Installation

```bash
git clone https://github.com/Zizwar/zip2prompt.git
cd zip2prompt
npm install
```

### Environment Setup

Create a `.env` file:

```env
PORT=8080
STORAGE_MODE=local
MAX_FILE_SIZE_MB=50

# Optional — enables AI chat
OPENROUTER_API_KEY=sk-or-v1-...
DEFAULT_AI_MODEL=openai/gpt-5.1-codex-mini

# Optional — MongoDB instead of local file storage
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vibzcode
```

### Run

```bash
# Development
npm run dev

# Production
npm start
```

Open **http://localhost:8080** in your browser.

---

## Usage

1. **Load a project** — paste a GitHub URL and click Clone, drop a ZIP, or enter a direct URL
2. **Browse & select files** — use the file tree in the sidebar; important files are auto-selected
3. **Extract** — click Extract to merge selected files into a single output with file structure
4. **Chat with AI** — switch to the Chat tab, ask questions about the code with full file context
5. **Quick actions** — use Explain, Bugs, Improve, Tests, Docs, or Refactor buttons for one-click analysis

### URL-based Loading

Open a project directly via URL:

```
https://vibzcode.com/#https://github.com/user/repo
https://vibzcode.com/get/https://github.com/user/repo
```

---

## Project Structure

```
vibzcode/
├── server.js                 # Hono server with all API routes
├── config/
│   ├── database.js           # Storage abstraction (local/MongoDB)
│   ├── models.json           # AI model registry
│   └── app-config.json       # App settings
├── utils/
│   └── openrouter.js         # OpenRouter API client
├── public/
│   ├── index.html            # SPA entry point (DaisyUI + Alpine.js)
│   └── js/
│       ├── app.js            # Alpine.js component registration & init
│       ├── upload.js          # Upload/clone module
│       ├── filetree.js        # File tree rendering & selection
│       ├── chat.js            # AI chat module
│       ├── config.js          # Settings/models management
│       └── utils.js           # Shared utilities
├── uploads/                  # Stored ZIP files
├── filegroups/               # Saved file selections
├── prompttemplates/          # Prompt templates
└── data/                     # Local storage (projects, chats)
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Server | Node.js, Hono |
| Frontend | Alpine.js, DaisyUI (Tailwind CSS) |
| AI | OpenRouter (multi-model) |
| ZIP handling | AdmZip |
| Syntax highlighting | Highlight.js |
| Markdown | Marked.js |
| Icons | Font Awesome 6 |
| Storage | Local filesystem or MongoDB |

---

## API Reference

### File Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload` | Upload ZIP, clone from GitHub, or fetch from URL |
| `GET` | `/uploads` | List uploaded projects |
| `GET` | `/reopen/:filename` | Reopen a previously uploaded project |
| `GET` | `/file-preview/:filename/:filepath` | Preview a single file from a project |
| `POST` | `/extract` | Extract and merge selected files |
| `DELETE` | `/upload/:filename` | Delete an uploaded project |

### AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/chat` | Send a message with file context (JSON body) |
| `GET` | `/api/ai/chat/:projectId` | Get chat history for a project |
| `GET` | `/api/ai/models` | List available AI models |
| `POST` | `/api/ai/analyze` | Run project analysis |
| `POST` | `/api/ai/agent/:type` | Run a specialized agent |
| `GET` | `/api/ai/agents` | List available agents |

### Configuration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/config` | Get app configuration |
| `PUT` | `/api/config` | Update app configuration |
| `GET` | `/api/config/models` | Get model registry |
| `PUT` | `/api/config/models` | Update model registry |
| `GET` | `/api/config/env` | Get environment config (API key masked) |
| `PUT` | `/api/config/env` | Update environment variables |

### Templates & Groups

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/prompt-templates` | List prompt templates |
| `GET` | `/file-groups` | List saved file groups |
| `POST` | `/file-groups` | Save a file group |
| `DELETE` | `/file-groups/:name` | Delete a file group |

---

## Configuration

### Storage

**Local** (default) — no dependencies, data stored in `./data/`:

```env
STORAGE_MODE=local
```

**MongoDB** — cloud storage, scalable:

```env
STORAGE_MODE=mongodb
MONGODB_URI=mongodb+srv://...
```

### AI Models

Models are managed from the UI (Settings > Models tab) and stored in `config/models.json`. Default models include GPT-4.1 Mini, GPT-5 Mini, GPT-5.1 Codex Mini, Grok 4.1 Fast, Grok 3 Mini, Grok Code Fast, and Arcee Coder Large.

To add models programmatically:

```json
{
  "models": [
    { "id": "openai/gpt-4.1-mini", "name": "GPT-4.1 Mini", "provider": "OpenAI", "enabled": true }
  ]
}
```

### Prompt Caching

When enabled (default), context files are sent with `cache_control: { type: "ephemeral" }`. This reduces token costs when the same file context is used across multiple messages in a conversation.

Toggle from the UI or in `config/app-config.json`:

```json
{ "enableCache": true }
```

---

## Docker

```bash
docker build -t vibzcode .
docker run -p 8080:8080 -e OPENROUTER_API_KEY=sk-or-... vibzcode
```

Or with docker-compose:

```bash
docker-compose up
```

---

## Troubleshooting

**AI features not working?**
- Verify `OPENROUTER_API_KEY` is set (check Settings > API in the UI)
- Ensure the key is valid at [openrouter.ai](https://openrouter.ai/)
- Check server logs for error details

**MongoDB connection failed?**
- Verify `MONGODB_URI` is correct
- Whitelist your IP in MongoDB Atlas
- The app falls back to local storage automatically

**Large files rejected?**
- Increase `MAX_FILE_SIZE_MB` in `.env` or Settings > API
- Default limit is 50MB

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## License

ISC

---

## Acknowledgments

- [OpenRouter](https://openrouter.ai/) — multi-model AI API
- [Hono](https://hono.dev/) — fast web framework
- [Alpine.js](https://alpinejs.dev/) — lightweight reactive framework
- [DaisyUI](https://daisyui.com/) — Tailwind CSS component library
- [Highlight.js](https://highlightjs.org/) — syntax highlighting
- [Marked.js](https://marked.js.org/) — markdown parser
