# 🚀 Zip2Prompt - Interactive AI Code Analysis Platform

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

**Transform your codebase into interactive AI conversations**

Upload your projects and chat with multiple AI models for instant code analysis, documentation, and improvements.

[Features](#-features) • [Quick Start](#-quick-start) • [API Documentation](#-api-documentation) • [Configuration](#-configuration)

</div>

---

## 📋 Overview

**Zip2Prompt** is an interactive platform that revolutionizes how developers analyze and understand codebases. Upload your project as a ZIP file, GitHub repository, or URL, and instantly start chatting with advanced AI models to:

- 🤖 **Chat with AI** about your code using Claude, GPT-4, Gemini, and more
- 🔍 **Analyze** security vulnerabilities, performance bottlenecks, and code quality
- 📚 **Generate** documentation automatically
- 🔄 **Refactor** code with AI-powered suggestions
- 🧪 **Create** test cases and improve coverage
- 💾 **Save** chat history and file selections for future reference

---

## ✨ Features

### 🎯 Core Features

#### **Multiple Input Methods**
- 📦 Upload ZIP files directly
- 🔗 Fetch from any URL
- 🐙 Clone from GitHub repositories (with branch selection)
- 📂 Browse and select specific files from your project

#### **AI-Powered Analysis**
- 🤖 **Multi-Model Support**: Claude 3.5 Sonnet, GPT-4 Turbo, Gemini Pro, Mistral Large
- 💬 **Interactive Chat**: Real-time conversations with AI about your code
- 📊 **Smart Analysis**: Security scans, performance optimization, code quality checks
- 🎯 **Specialized Agents**:
  - 🔒 **Security Analyzer**: Vulnerability detection and OWASP compliance
  - ⚡ **Performance Optimizer**: Bottleneck identification and optimization
  - 📚 **Documentation Generator**: Automatic documentation creation
  - 🔄 **Refactoring Expert**: Clean code suggestions and best practices
  - 🧪 **Testing Agent**: Test case generation and coverage analysis

#### **Smart Project Management**
- 📁 **File Tree Navigation**: Visual hierarchy of your project structure
- ⭐ **Important Files Detection**: Automatically identifies key project files
- 🎯 **File Groups**: Save and load file selections for different contexts
- 🔍 **Code Preview**: Syntax-highlighted preview with copy functionality
- 🎨 **Media Filtering**: Optionally exclude images and videos

#### **Developer Experience**
- 🌙 **Dark/Light Mode**: Beautiful themes for any preference
- 🌐 **Multi-language**: English and Arabic support
- 💾 **Chat History**: All conversations saved and retrievable
- 📋 **Templates**: Pre-built prompts for common tasks
- 📥 **Export**: Download merged content or chat history

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** or **yarn**
- (Optional) **MongoDB Atlas** account for cloud storage
- (Optional) **OpenRouter API Key** for AI features

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/zip2prompt.git
cd zip2prompt

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env and add your API keys (optional for basic usage)
nano .env
```

### Configuration

Edit `.env` file:

```env
# Server
PORT=8080
NODE_ENV=development

# Storage (local or mongodb)
STORAGE_MODE=local

# MongoDB (optional - for cloud storage)
MONGODB_URI=your_mongodb_connection_string

# OpenRouter (optional - for AI features)
OPENROUTER_API_KEY=your_openrouter_api_key

# Security
JWT_SECRET=your-secret-key-change-this
```

### Running the Application

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Visit **http://localhost:8080** in your browser.

---

## 📖 Usage Guide

### Basic Workflow

1. **Upload Your Project**
   - Drag & drop a ZIP file
   - Enter a URL to a ZIP file
   - Clone from GitHub (with branch selection)

2. **Select Files**
   - Browse the file tree
   - Select specific files or entire folders
   - Use "Select Important Files" for quick selection
   - Exclude media files if needed

3. **Choose Your Action**
   - **Extract**: Copy selected file contents to clipboard
   - **Chat with AI**: Ask questions about your code (requires API key)
   - **Run Analysis**: Get automated security/performance reports
   - **Use Agents**: Specialized AI for specific tasks

### AI Chat Features

#### Starting a Conversation

```
1. Select files from your project
2. Click "Chat with AI" button
3. Choose your AI model (Claude, GPT-4, etc.)
4. Type your question or use a template
5. Get instant, context-aware responses
```

#### Example Prompts

- "Explain the architecture of this application"
- "Find security vulnerabilities in the authentication code"
- "Suggest performance improvements for the database queries"
- "Generate documentation for the API endpoints"
- "Write unit tests for the UserService class"

### Specialized AI Agents

#### 🔒 Security Analyzer
Scans for:
- SQL injection vulnerabilities
- XSS attacks
- Authentication issues
- Hard-coded secrets
- OWASP Top 10 compliance

#### ⚡ Performance Optimizer
Identifies:
- Inefficient algorithms
- Database query optimization
- Memory leaks
- Resource bottlenecks

#### 📚 Documentation Generator
Creates:
- Function/method documentation
- API documentation
- README files
- Code comments

---

## 🏗️ Architecture

### Project Structure

```
zip2prompt/
├── server.js              # Main server file
├── config/
│   └── database.js        # Database abstraction (local/MongoDB)
├── utils/
│   └── openrouter.js      # OpenRouter AI integration
├── public/
│   └── index.html         # Frontend application
├── uploads/               # Uploaded ZIP files
├── filegroups/            # Saved file selections
├── prompttemplates/       # Prompt templates
└── data/                  # Local storage (when not using MongoDB)
    ├── projects/
    ├── chats/
    └── users/
```

### Technology Stack

**Backend:**
- Node.js + Hono (Fast web framework)
- MongoDB / Local File Storage
- OpenRouter (Multi-model AI API)
- AdmZip (ZIP file processing)

**Frontend:**
- Alpine.js (Reactive UI)
- Tailwind CSS (Styling)
- Highlight.js (Syntax highlighting)
- Font Awesome (Icons)

---

## 🔌 API Documentation

### File Operations

#### Upload Project
```http
POST /upload
Content-Type: multipart/form-data

Parameters:
- zipFile: File (ZIP file)
- url: String (URL to ZIP file)
- branch: String (GitHub branch name)

Response:
{
  "fileStructure": {...},
  "filename": "project.zip",
  "importantFiles": [...]
}
```

#### Extract Files
```http
POST /extract
Content-Type: multipart/form-data

Parameters:
- filename: String
- files: JSON Array
- summarize: Boolean

Response:
{
  "content": "// Combined file contents..."
}
```

### AI Operations

#### Chat with AI
```http
POST /api/ai/chat
Content-Type: multipart/form-data

Parameters:
- message: String (Your question)
- projectId: String (Optional)
- model: String (AI model ID)
- contextFiles: JSON (Selected files content)

Response:
{
  "response": "AI response...",
  "model": "anthropic/claude-3.5-sonnet",
  "usage": {...}
}
```

#### Get Available Models
```http
GET /api/ai/models

Response:
[
  {
    "id": "anthropic/claude-3.5-sonnet",
    "name": "Claude 3.5 Sonnet",
    "provider": "Anthropic",
    "contextWindow": 200000,
    "recommended": true
  },
  ...
]
```

#### Analyze Project
```http
POST /api/ai/analyze
Content-Type: multipart/form-data

Parameters:
- content: String (Project code)
- type: String (general|security|performance)

Response:
{
  "analysis": "Detailed analysis...",
  "model": "anthropic/claude-3.5-sonnet",
  "usage": {...}
}
```

#### Run AI Agent
```http
POST /api/ai/agent/:type
Content-Type: multipart/form-data

Parameters:
- content: String (Code to analyze)

Types: security, performance, documentation, refactoring, testing

Response:
{
  "result": "Agent analysis...",
  "agent": "security",
  "model": "anthropic/claude-3.5-sonnet"
}
```

---

## ⚙️ Configuration

### Storage Options

#### Local File Storage (Default)
```env
STORAGE_MODE=local
```
- No external dependencies
- All data stored in `./data/` directory
- Perfect for development and single-user setups

#### MongoDB Atlas
```env
STORAGE_MODE=mongodb
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/zip2prompt
```
- Cloud-based storage
- Scalable for multiple users
- Automatic backups and high availability

### AI Configuration

To enable AI features, get an API key from [OpenRouter](https://openrouter.ai/):

```env
OPENROUTER_API_KEY=sk-or-v1-...
DEFAULT_AI_MODEL=anthropic/claude-3.5-sonnet
```

**Supported Models:**
- `anthropic/claude-3.5-sonnet` (Recommended)
- `anthropic/claude-3-opus`
- `openai/gpt-4-turbo`
- `openai/gpt-4`
- `google/gemini-pro-1.5`
- `mistralai/mistral-large`

---

## 🎨 Customization

### Adding Custom Prompt Templates

Edit `prompttemplates/default-templates.json`:

```json
[
  {
    "name": "Code Review",
    "content": "Please review this code and suggest improvements:\n\n"
  },
  {
    "name": "Bug Hunt",
    "content": "Find and explain any bugs in this code:\n\n"
  }
]
```

### File Group Management

Save frequently used file selections:
1. Select your files
2. Enter a group name
3. Click "Save Selection"
4. Load anytime from the dropdown

---

## 🔒 Security

### Best Practices

- **Never commit `.env` file** to version control
- **Use strong JWT secrets** in production
- **Enable HTTPS** for production deployments
- **Rate limit API endpoints** to prevent abuse
- **Validate and sanitize** all user inputs
- **Encrypt sensitive data** in MongoDB

### Environment Variables

All sensitive configuration should be in `.env`:
- API keys
- Database credentials
- JWT secrets
- Session secrets

---

## 🐛 Troubleshooting

### Common Issues

**AI features not working?**
```
✓ Check OPENROUTER_API_KEY is set in .env
✓ Verify API key is valid at openrouter.ai
✓ Check console for error messages
```

**MongoDB connection failed?**
```
✓ Verify MONGODB_URI is correct
✓ Check network connectivity
✓ Whitelist your IP in MongoDB Atlas
✓ Falls back to local storage automatically
```

**Files not uploading?**
```
✓ Check file size limits
✓ Ensure uploads/ directory exists and is writable
✓ Verify ZIP file is not corrupted
```

---

## 🗺️ Roadmap

### Version 1.1 (Coming Soon)
- [ ] Real-time collaboration
- [ ] VS Code extension
- [ ] Browser extension
- [ ] Advanced code navigation
- [ ] Project comparison tools

### Version 1.2
- [ ] Team workspaces
- [ ] User authentication
- [ ] GitHub OAuth integration
- [ ] CI/CD integration
- [ ] Custom AI agent training

### Version 2.0
- [ ] Multi-modal AI (diagrams, flowcharts)
- [ ] Voice input/output
- [ ] Mobile app
- [ ] On-premise deployment option
- [ ] Enterprise features

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 👨‍💻 Author

**Brahim BIDI**

- GitHub: [@zizwar](https://github.com/zizwar)

---

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai/) - Multi-model AI API
- [Hono](https://hono.dev/) - Fast web framework
- [Alpine.js](https://alpinejs.dev/) - Lightweight JavaScript framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- All the amazing open-source projects that made this possible!

---

## 📞 Support

- 📧 Email: support@zip2prompt.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/zip2prompt/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/zip2prompt/discussions)

---

<div align="center">

**Made with ❤️ by developers, for developers**

[⭐ Star us on GitHub](https://github.com/yourusername/zip2prompt) | [🐦 Follow on Twitter](https://twitter.com/yourusername)

</div>
