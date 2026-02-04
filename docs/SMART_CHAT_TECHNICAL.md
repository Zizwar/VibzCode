# Smart Chat Technical Documentation

## Architecture Overview

Smart Chat is built on a modular architecture that integrates seamlessly with the existing VibZcode platform.

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                       │
│  (index.html - Chat Tab with Smart Chat Controls)       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Frontend Components                     │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   chat.js    │  │smart-chat.js │  │ examples.js  │  │
│  │ (Integration)│  │   (Engine)   │  │  (Helpers)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Backend API                           │
│                                                          │
│  /api/ai/chat          - Enhanced chat endpoint         │
│  /file-preview/...     - File content fetching          │
│  /upload               - Project upload                  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  AI Service Layer                        │
│  (OpenRouter API via utils/openrouter.js)               │
└─────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. smart-chat.js

The main engine that powers Smart Chat functionality.

#### Key Functions:

##### `initializeWithProject(filename, structure)`
```javascript
/**
 * Initializes Smart Chat with a project
 * @param {string} filename - The project ZIP filename
 * @param {object} structure - File structure object
 * @returns {string} Initial context message
 */
```

**Flow:**
1. Clears previous context
2. Extracts all file paths from structure
3. Auto-loads important files (package.json, README, etc.)
4. Builds initial context message with structure overview
5. Returns formatted message for display

##### `fetchAndAddFile(filepath, projectFilename)`
```javascript
/**
 * Fetches a file from the server and adds to context
 * @param {string} filepath - Path of file to fetch
 * @param {string} projectFilename - Project ZIP filename
 * @returns {string} File content
 */
```

**Flow:**
1. Checks if file already in context (cache)
2. Makes API call to `/file-preview/...`
3. Stores content in contextFiles Map
4. Triggers UI update
5. Returns content

##### `parseAndFetchRequestedFiles(aiResponse, projectFilename)`
```javascript
/**
 * Parses AI response to detect file mentions and auto-fetch
 * @param {string} aiResponse - AI's response text
 * @param {string} projectFilename - Project filename
 * @returns {number} Count of files fetched
 */
```

**Patterns Detected:**
- `read/fetch/load/check [filename]`
- `file: [filename]`
- Backtick-wrapped filenames with extensions

**Flow:**
1. Applies regex patterns to detect file mentions
2. Filters for available files not yet in context
3. Fetches all detected files
4. Returns count of fetched files

##### `processUserMessage(message, projectFilename)`
```javascript
/**
 * Pre-processes user message for Smart Chat enhancements
 * @param {string} message - User's message
 * @param {string} projectFilename - Project filename
 * @returns {object} Enhanced message data
 */
```

**Enhancements:**
- Detects folder queries: "What's in X folder?"
- Detects direct file requests: "Read X file"
- Auto-fetches files when explicitly requested
- Adds system hints to help AI respond better

---

### 2. chat.js (Enhanced)

Integrates Smart Chat into the main chat system.

#### New Properties:

```javascript
{
  smartChatEnabled: false,        // Smart Chat toggle state
  showContextFiles: false,        // Context panel visibility
}
```

#### New Methods:

##### `initSmartChat()`
- Initializes Smart Chat with current project
- Loads important files
- Displays initial context message
- Switches to chat tab

##### `toggleSmartChat()`
- Toggles Smart Chat on/off
- Clears context when disabled

##### `updateContextFilesUI()`
- Triggers UI reactivity for context file updates
- Called when files are added/removed

##### `removeContextFile(filepath)`
- Removes a file from context
- Updates UI

##### `addFileToContext(filepath)`
- Manually adds a file to context
- Useful for explicit file loading

#### Modified `sendMessage()`

**New Flow:**
```
1. Check if Smart Chat enabled
2. Process message with smart-chat.js
3. Build enhanced context (structure + files)
4. Send to AI with smart prompt
5. Parse AI response for file mentions
6. Auto-fetch mentioned files
7. Display response
```

---

### 3. smart-chat-examples.js

Provides pre-built examples and quick actions.

#### Data Structures:

```javascript
examples: {
  understanding: [...],    // Project overview questions
  exploration: [...],      // File/folder exploration
  fileReading: [...],      // Direct file requests
  security: [...],         // Security audit questions
  performance: [...],      // Performance analysis
  architecture: [...],     // Architecture questions
  dependencies: [...],     // Dependency management
  testing: [...]          // Testing-related
}

quickActions: [
  {
    id: 'project-overview',
    label: 'نظرة عامة',
    icon: 'fa-info-circle',
    prompt: '...'
  },
  // ... more actions
]
```

#### Helper Functions:

- `getRandomExample(category)` - Random example from category
- `getStarterQuestions()` - Questions for new projects
- `getContextSuggestions(structure)` - Smart suggestions based on structure
- `searchExamples(keyword)` - Search all examples

---

## API Enhancements

### POST /api/ai/chat

**Enhanced Request Body:**
```json
{
  "message": "User's question",
  "model": "openai/gpt-4",
  "contextFiles": "File contents...",
  "projectId": "project-id",
  "enableCache": true,
  "smartChat": true,           // NEW: Smart Chat flag
  "fileStructure": "tree..."   // NEW: File structure text
}
```

**Enhanced System Prompt (when smartChat=true):**
```
You are VibZcode Smart AI Assistant - an intelligent code analysis assistant.

## Your Role
- Analyze code with deep understanding
- Help developers understand their projects
- Provide actionable insights and improvements
- Be concise but thorough

## Available Data
**Project Structure:**
[structure tree]

**Context Files:** Available in the conversation

## Communication Style
- Use markdown formatting
- Provide code examples when helpful
- Be direct and precise
- If you need to see a file, mention it naturally

Remember: You're helping developers build better software!
```

---

## Data Flow

### 1. Smart Chat Initialization

```
User clicks "Smart Chat Off"
    │
    ▼
toggleSmartChat()
    │
    ▼
initSmartChat()
    │
    ├─► VZ.smartChat.initializeWithProject()
    │       │
    │       ├─► extractFilePaths(structure)
    │       ├─► Auto-load important files
    │       │       └─► fetchAndAddFile() for each
    │       │               └─► GET /file-preview/:filename/:filepath
    │       └─► buildInitialContext()
    │
    └─► Display system message with context
```

### 2. User Sends Message

```
User types message
    │
    ▼
sendMessage()
    │
    ├─► IF smartChatEnabled:
    │       │
    │       ├─► processUserMessage()
    │       │       ├─► Check for folder queries
    │       │       ├─► Check for file requests
    │       │       └─► Auto-fetch if needed
    │       │
    │       └─► Build enhanced context
    │               └─► buildContextSummary()
    │
    ├─► POST /api/ai/chat
    │       │
    │       └─► AI processes with enhanced prompt
    │
    ├─► Receive AI response
    │
    ├─► IF smartChatEnabled:
    │       └─► parseAndFetchRequestedFiles()
    │               ├─► Regex pattern matching
    │               └─► Auto-fetch mentioned files
    │
    └─► Display response
```

### 3. Context File Management

```
User clicks file icon
    │
    ▼
showContextFiles = true
    │
    ▼
Display context panel
    │
    ├─► For each file in VZ.smartChat.contextFiles:
    │       └─► Show: path, lines, size
    │
    └─► User can:
            ├─► Click X → removeContextFile()
            └─► Click trash → clearContext()
```

---

## State Management

### Global State (VZ.smartChat)

```javascript
{
  contextFiles: Map<filepath, content>,  // Loaded files
  structureLoaded: boolean,              // Structure ready?
  availableFiles: string[],              // All available files
  importantFiles: string[]               // Important file list
}
```

### Component State (Alpine.js)

```javascript
{
  smartChatEnabled: boolean,    // Smart Chat active?
  showContextFiles: boolean,    // Context panel visible?
  chatMessages: Array,          // All messages
  chatInput: string,            // Current input
  chatLoading: boolean          // Loading state
}
```

---

## File Detection Patterns

### Auto-load Important Files

```javascript
const autoLoadFiles = [
  'package.json',
  'README.md',
  'readme.md',
  'deno.json',
  'requirements.txt',
  'Cargo.toml',
  'composer.json',
  'pom.xml'
];
```

### AI Response Parsing

```javascript
const filePatterns = [
  // Pattern 1: Action + filename
  /(?:read|fetch|load|check|examine|analyze)\s+([^\s]+\.(?:js|ts|jsx|tsx|py|go|java|rb|php|css|html|json|md|txt|yaml|yml|toml|xml))/gi,

  // Pattern 2: file: syntax
  /file:\s*([^\s]+)/gi,

  // Pattern 3: Backtick code
  /`([^`]+\.(?:js|ts|jsx|tsx|py|go|java|rb|php|css|html|json|md|txt|yaml|yml|toml|xml))`/gi
];
```

---

## Performance Considerations

### 1. Lazy Loading
- Files are fetched only when needed
- Structure is parsed once and cached
- Context files are kept in memory for instant access

### 2. Token Optimization
- Only loaded files are sent to AI
- Users can remove unnecessary files from context
- Cache control for repeated contexts (when enabled)

### 3. Request Optimization
- File content is cached in Map (no repeated fetches)
- Parallel auto-fetching when AI mentions multiple files
- Debouncing on UI updates

---

## Error Handling

### File Fetch Errors

```javascript
try {
  await fetchAndAddFile(filepath, projectFilename);
} catch (error) {
  console.error('Failed to fetch file:', filepath, error);
  // Fail silently, don't interrupt conversation
}
```

### AI Response Errors

```javascript
try {
  const response = await fetch('/api/ai/chat', {...});
  const data = await response.json();
  if (data.error) throw new Error(data.error);
} catch (err) {
  chatMessages.push({
    role: 'assistant',
    content: 'Error: ' + err.message,
    isError: true
  });
}
```

---

## Extension Points

### Adding New File Patterns

In `smart-chat.js`:

```javascript
const filePatterns = [
  // Add new pattern here
  /your-custom-pattern/gi
];
```

### Adding New Quick Actions

In `smart-chat-examples.js`:

```javascript
quickActions: [
  {
    id: 'your-action',
    label: 'Your Label',
    icon: 'fa-your-icon',
    prompt: 'Your detailed prompt...'
  }
]
```

### Custom File Auto-loading

In `smart-chat.js` `initializeWithProject()`:

```javascript
const autoLoadFiles = [
  'package.json',
  'your-custom-file.config'  // Add here
];
```

---

## Testing Scenarios

### 1. Basic Flow Test

```javascript
// 1. Load project
await uploadProject('test-project.zip');

// 2. Enable Smart Chat
await toggleSmartChat();

// 3. Verify initial state
assert(VZ.smartChat.structureLoaded === true);
assert(VZ.smartChat.contextFiles.size > 0);

// 4. Send message
await sendMessage("What is this project?");

// 5. Verify AI response
assert(chatMessages.length > 1);
```

### 2. File Auto-fetch Test

```javascript
// 1. Initialize Smart Chat
await initSmartChat();

// 2. AI mentions file
const aiResponse = "Let me read server.js...";

// 3. Parse response
const fetchCount = await parseAndFetchRequestedFiles(
  aiResponse,
  'project.zip'
);

// 4. Verify fetch
assert(fetchCount === 1);
assert(VZ.smartChat.contextFiles.has('server.js'));
```

### 3. Folder Query Test

```javascript
// 1. Ask about folder
await sendMessage("What's in the src folder?");

// 2. Verify processing
const processed = await processUserMessage(
  "What's in the src folder?",
  'project.zip'
);

// 3. Check enhancement
assert(processed.enhanced === true);
assert(processed.message.includes('Found'));
```

---

## Security Considerations

### 1. File Path Validation

Always validate file paths to prevent directory traversal:

```javascript
// Server-side validation
const filepath = c.req.param('filepath');
if (filepath.includes('..') || filepath.startsWith('/')) {
  return c.json({ error: 'Invalid file path' }, 400);
}
```

### 2. Content Sanitization

File content is escaped before display:

```javascript
// In HTML rendering
x-text="msg.content"  // Auto-escaped by Alpine.js
```

### 3. API Key Protection

OpenRouter API key is never exposed to client:

```javascript
// Server-side only
const apiKey = process.env.OPENROUTER_API_KEY;
```

---

## Future Enhancements

### Planned Features

1. **Advanced Search**
   - Full-text search across all files
   - Regex pattern matching
   - Search history

2. **File Relationships**
   - Dependency graph visualization
   - Import/export tracking
   - Component hierarchy

3. **Smart Caching**
   - Persistent context across sessions
   - LRU cache for frequently accessed files
   - Compressed storage

4. **Collaborative Features**
   - Share Smart Chat sessions
   - Export conversation with context
   - Team insights

---

## Troubleshooting

### Smart Chat Button Disabled

**Cause:** No project loaded or structure not available

**Solution:**
```javascript
// Check state
console.log('Current filename:', this.currentFilename);
console.log('File structure:', this.fileStructure);

// If null, upload a project first
```

### Files Not Auto-fetching

**Cause:** Pattern not matching or file not in availableFiles

**Solution:**
```javascript
// Check available files
console.log('Available:', VZ.smartChat.availableFiles);

// Check patterns
console.log('AI response:', aiResponse);

// Manually add pattern if needed
```

### Context Panel Not Updating

**Cause:** UI reactivity not triggered

**Solution:**
```javascript
// Force update
this.$nextTick(() => {
  this.showContextFiles = true;
});

// Or call
this.updateContextFilesUI();
```

---

## Contributing

When contributing to Smart Chat:

1. **Add Tests**: For new file patterns or detection logic
2. **Update Docs**: Keep this technical doc and user guides in sync
3. **Follow Patterns**: Use existing code style and structure
4. **Error Handling**: Always handle errors gracefully
5. **Performance**: Consider token usage and API calls

---

## Glossary

- **Context Files**: Files loaded into AI's working memory
- **File Structure**: Tree representation of project files
- **Smart Prompt**: Enhanced system prompt with structure awareness
- **Auto-fetch**: Automatic file loading based on AI mentions
- **Pattern Matching**: Regex-based detection of file references

---

**Maintainers:** VibZcode Team
**Last Updated:** 2026-02-04
**Version:** 2.1.0
