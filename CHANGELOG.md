# Changelog

All notable changes to the Zip2Prompt project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] - 2026-02-04

### 🧠 Smart Chat - Major Feature Addition

This release introduces **Smart Chat**, an intelligent AI assistant that understands your project structure and can autonomously fetch and analyze files.

### ✨ Added

#### 🎯 Smart Chat System
- **Intelligent Project Understanding**: AI automatically reads and understands project structure on activation
- **Auto-fetch Important Files**: Automatically loads key files (package.json, README.md, deno.json, requirements.txt, etc.)
- **Natural File Requests**: AI can fetch files on-demand when mentioned in conversation
  - Example: "Let me read server.js" → file is automatically fetched
  - Example: "Check the API routes" → relevant files are identified and loaded
- **Context File Management**:
  - Visual UI showing all loaded files in context
  - Display file size, line count, and extension
  - Ability to remove files from context individually or all at once
  - Real-time context updates

#### 🔍 Smart Understanding Features
- **Folder Queries**: Ask "What's in the components folder?" and get accurate listings
- **File Pattern Recognition**: AI understands file extensions and their purposes
- **Dependency Awareness**: Analyzes files and understands relationships between them
- **Structure-Aware Responses**: Uses project structure to provide better answers

#### 🎨 User Interface Enhancements
- **Smart Chat Toggle Button**: Easy activation/deactivation of Smart Chat mode
- **Context Files Panel**: Expandable panel showing all loaded files
- **Smart Suggestions**: Context-aware question suggestions based on project type
- **Starter Questions**: Quick-start questions for new projects
- **System Messages**: Initial context message showing project overview

#### 📚 Documentation
- **Comprehensive Smart Chat Guide** (`docs/SMART_CHAT_GUIDE.md`):
  - Detailed feature explanations in Arabic and English
  - Practical examples and use cases
  - Advanced techniques and tips
  - Troubleshooting section
- **Quick Start Guide** (`QUICK_START_SMART_CHAT.md`):
  - 30-second quick start tutorial
  - Magic commands reference
  - Golden tips for best usage
  - Complete usage scenario
- **Arabic Documentation** (`SMART_CHAT_AR.md`):
  - Full feature guide in Arabic
  - Examples and use cases
  - UI explanations
  - Tips and troubleshooting

#### 🛠️ Technical Implementation
- **New Module**: `smart-chat.js` - Core smart chat engine
- **Examples Module**: `smart-chat-examples.js` - Pre-built examples and quick actions
- **Enhanced Chat Module**: Updated `chat.js` with Smart Chat integration
- **Server-Side Support**: Enhanced `/api/ai/chat` endpoint with structure awareness
- **Improved Prompting**: Context-aware system prompts for better AI responses

### 🎯 Smart Chat Capabilities

1. **Project Analysis**:
   - "What is this project?" → Analyzes package.json, README, and structure
   - "Explain the architecture" → Reviews structure and key files
   - "What technologies are used?" → Extracts dependencies and configs

2. **File Navigation**:
   - "What's in the src folder?" → Lists all files in src/
   - "Where are the API files?" → Searches and identifies API-related files
   - "Show important files" → Highlights key project files

3. **Code Understanding**:
   - "Read server.js and explain it" → Fetches and analyzes the file
   - "How does authentication work?" → Finds and explains auth files
   - "Explain the routing system" → Identifies and explains route files

4. **Security & Quality**:
   - "Are there security issues?" → Comprehensive security audit
   - "How can I improve performance?" → Performance analysis
   - "Review code quality" → Quality assessment with suggestions

### 🔧 Enhanced Features
- **Smarter System Prompts**: AI receives project structure and file availability info
- **Auto-fetch Logic**: Pattern-based detection of file mentions in AI responses
- **Context Optimization**: Efficient management of loaded files to minimize token usage
- **File Extension Intelligence**: AI understands different file types and their roles

### 📊 Performance Improvements
- Files are fetched on-demand, reducing initial load time
- Context is managed efficiently to optimize token usage
- Structure is parsed once and reused throughout the session

### 🐛 Bug Fixes
- Fixed chat message rendering for system messages
- Improved error handling for file fetch failures
- Better session management for Smart Chat state

### 🎨 UI/UX Improvements
- Context files panel with file management
- Visual indicators for Smart Chat status
- Starter questions for better user onboarding
- Improved empty state with context-aware suggestions

---

## [1.0.0] - 2025-11-02

### 🎉 Major Release - Revolutionary AI-Powered Platform

This is a **major upgrade** from version 0.8.0, transforming Zip2Prompt from a simple file extraction tool to a comprehensive **AI-powered code analysis platform**.

### ✨ Added

#### 🤖 AI Integration
- **OpenRouter Integration**: Multi-model AI support through OpenRouter API
- **Interactive AI Chat**: Real-time conversations with AI models about your code
- **Multiple AI Models Support**:
  - Claude 3.5 Sonnet (Anthropic) - Recommended
  - Claude 3 Opus (Anthropic)
  - GPT-4 Turbo (OpenAI)
  - GPT-4 (OpenAI)
  - Gemini Pro 1.5 (Google)
  - Mistral Large (Mistral AI)
- **Chat History**: Persistent conversation storage and retrieval
- **Context-Aware Responses**: AI receives selected file contents as context

#### 🎯 Specialized AI Agents
- **Security Analyzer** 🔒: Vulnerability detection and OWASP compliance checking
- **Performance Optimizer** ⚡: Bottleneck identification and optimization suggestions
- **Documentation Generator** 📚: Automatic documentation creation
- **Refactoring Expert** 🔄: Clean code suggestions and best practices
- **Testing Agent** 🧪: Test case generation and coverage analysis

#### 📊 AI-Powered Analysis
- **Project Analysis**: Automatic detection of technologies, frameworks, and architecture
- **Security Scanning**: Identify security vulnerabilities and hard-coded secrets
- **Performance Analysis**: Find performance bottlenecks and optimization opportunities
- **Code Quality Assessment**: Evaluate code quality and suggest improvements

#### 💾 Storage System
- **Dual Storage Support**: Local file storage and MongoDB integration
- **Database Abstraction Layer**: Seamlessly switch between local and MongoDB storage
- **MongoDB Ready**: Pre-configured for MongoDB Atlas (currently using local storage)
- **Project Management**: Save and retrieve project data with metadata
- **Chat Persistence**: Store conversation history per project

#### 🏗️ Architecture Improvements
- **Modular Structure**: Separated concerns with `/config` and `/utils` directories
- **Database Module** (`config/database.js`): Unified interface for storage operations
- **OpenRouter Module** (`utils/openrouter.js`): AI integration with multiple models
- **Environment Configuration**: `.env` file support for sensitive data
- **Graceful Shutdown**: Proper cleanup of database connections

#### 🔌 New API Endpoints
- `GET /api/ai/models` - List available AI models
- `POST /api/ai/chat` - Send message to AI and get response
- `GET /api/ai/chat/:projectId` - Retrieve chat history
- `POST /api/ai/analyze` - Analyze project with AI
- `POST /api/ai/agent/:type` - Run specialized AI agent
- `GET /api/ai/agents` - List available AI agents
- `GET /api/projects` - Get all saved projects

#### 📦 Dependencies
- `mongodb@^6.0.0` - MongoDB database driver
- `openai@^4.0.0` - OpenRouter AI integration (OpenAI-compatible API)
- `dotenv@^16.0.0` - Environment variable management
- `bcrypt@^5.1.0` - Password hashing (prepared for future auth)
- `jsonwebtoken@^9.0.0` - JWT token generation (prepared for future auth)

### 🔄 Changed

#### Package Information
- **Version**: Bumped from `0.8.0` to `1.0.0`
- **Description**: Updated to reflect new AI capabilities
- **Keywords**: Added AI-related keywords (ai, code-analysis, openrouter, claude)
- **Scripts**: Added `dev` script with auto-reload (`node --watch server.js`)

#### Server Enhancements
- **Startup Messages**: Enhanced logging with emoji indicators
- **Status Display**: Shows storage mode and AI feature status on startup
- **Error Handling**: Improved error messages and fallback mechanisms
- **Database Connection**: Initialize connection before serving

### 🛠️ Technical Improvements

#### Code Quality
- **Better Organization**: Separated business logic into modules
- **Type Safety**: Better parameter validation
- **Error Handling**: Comprehensive try-catch blocks with meaningful messages
- **Async/Await**: Modern asynchronous code patterns

#### Performance
- **Database Indexing**: Automatic index creation for MongoDB collections
- **Lazy Loading**: Database connection only when needed
- **Caching Ready**: Structure prepared for Redis integration

#### Security
- **Environment Variables**: Sensitive data moved to `.env` file
- **API Key Protection**: Never exposed in frontend
- **JWT Ready**: Infrastructure for authentication prepared
- **Input Validation**: Enhanced validation for all endpoints

### 📚 Documentation

#### New Files
- **README.md**: Complete rewrite with comprehensive documentation
  - Feature showcase with examples
  - API documentation with curl examples
  - Architecture explanation
  - Configuration guide
  - Troubleshooting section
  - Roadmap for future versions

- **CHANGELOG.md**: This file - detailed version history

- **.env.example**: Template for environment configuration
  - All required and optional variables
  - Comments explaining each setting
  - Default values where applicable

#### Code Documentation
- **Inline Comments**: JSDoc-style comments for functions
- **Module Headers**: Clear descriptions of each module's purpose
- **API Comments**: Documented all new endpoints

### 🔧 Configuration

#### Environment Variables
```env
PORT=8080                          # Server port
NODE_ENV=development               # Environment
STORAGE_MODE=local                 # local or mongodb
MONGODB_URI=                       # MongoDB connection string
OPENROUTER_API_KEY=               # OpenRouter API key
JWT_SECRET=                        # JWT secret for auth
DEFAULT_AI_MODEL=                  # Default AI model
```

#### Storage Modes
- **Local Mode** (Default): No external dependencies, perfect for development
- **MongoDB Mode**: Cloud storage, ready for MongoDB Atlas integration

### 🎨 Infrastructure

#### Directory Structure
```
zip2prompt/
├── config/              # Configuration modules
│   └── database.js     # Database abstraction layer
├── utils/              # Utility modules
│   └── openrouter.js   # AI integration
├── data/               # Local storage directory
│   ├── projects/       # Project metadata
│   ├── chats/          # Chat histories
│   └── users/          # User data (future)
└── [existing dirs]
```

### 🚀 Deployment Ready

#### Production Considerations
- Environment-based configuration
- Graceful shutdown handling
- Database connection pooling
- Error logging and monitoring ready
- Scalable architecture

### 📱 User Experience

#### Unchanged Features (Still Available)
- ZIP file upload (drag & drop)
- URL-based upload
- GitHub repository cloning
- File tree navigation
- File selection and grouping
- Code preview with syntax highlighting
- Media file filtering
- Dark/Light mode
- Multi-language support (English/Arabic)
- Prompt templates
- File groups management

### 🔮 Future Ready

#### Prepared Infrastructure For
- User authentication system (bcrypt + JWT)
- Team collaboration features
- Real-time updates (WebSocket ready)
- Caching layer (Redis integration ready)
- Rate limiting
- Analytics and monitoring

### 📈 Breaking Changes

#### API Changes
- Server now requires environment configuration for AI features
- MongoDB connection string format must match MongoDB Atlas standard
- New API endpoints use `/api/` prefix for better organization

#### File Structure
- Added `config/` and `utils/` directories
- `.env` file now required (use `.env.example` as template)
- `data/` directory created for local storage mode

### ⚠️ Migration Notes

#### From 0.8.0 to 1.0.0

1. **Install New Dependencies**:
   ```bash
   npm install
   ```

2. **Create Environment File**:
   ```bash
   cp .env.example .env
   ```

3. **Configure Storage** (Optional):
   - For local storage: No changes needed
   - For MongoDB: Add MONGODB_URI to .env

4. **Add AI Features** (Optional):
   - Get OpenRouter API key from https://openrouter.ai/
   - Add OPENROUTER_API_KEY to .env

5. **Start Server**:
   ```bash
   npm start
   ```

### 🐛 Bug Fixes

- Fixed file upload error handling
- Improved ZIP extraction for large files
- Better memory management for large projects
- Fixed GitHub cloning issues with private repos

### 🔒 Security

- API keys now stored in environment variables
- Added input validation for all endpoints
- Prepared infrastructure for authentication
- Database queries parameterized to prevent injection

---

## [0.8.0] - 2024-XX-XX

### Added
- File group management
- Prompt templates
- Code summarization
- Important files detection
- GitHub repository cloning
- URL-based file upload

### Changed
- Improved UI with Tailwind CSS
- Enhanced file tree navigation
- Better mobile responsiveness

---

## [0.7.0] - 2024-XX-XX

### Added
- Dark mode support
- Multi-language support (Arabic)
- File preview with syntax highlighting
- Drag and drop upload

---

## [0.6.0] - 2024-XX-XX

### Added
- Basic ZIP file upload
- File structure visualization
- File selection and extraction
- Content merging

---

## Legend

- 🎉 Major Feature
- ✨ New Feature
- 🔄 Change
- 🐛 Bug Fix
- 🔒 Security
- 📚 Documentation
- 🔧 Configuration
- ⚠️ Breaking Change
- 🚀 Performance

---

## Links

- [Repository](https://github.com/yourusername/zip2prompt)
- [Issues](https://github.com/yourusername/zip2prompt/issues)
- [Documentation](./README.md)
