/**
 * VibZcode Smart Chat System
 * Intelligent AI chat that understands project structure and auto-fetches files
 */

window.VZ = window.VZ || {};

VZ.smartChat = {
  // Context management
  contextFiles: new Map(), // filepath -> content
  structureLoaded: false,
  availableFiles: [],

  /**
   * Initialize smart chat with project structure
   */
  async initializeWithProject(filename, structure) {
    this.contextFiles.clear();
    this.structureLoaded = false;
    this.availableFiles = this.extractFilePaths(structure);

    // Auto-load important files
    const importantFiles = this.importantFiles || [];
    const autoLoadFiles = ['package.json', 'README.md', 'readme.md', 'deno.json', 'requirements.txt', 'Cargo.toml', 'composer.json', 'pom.xml'];

    for (const file of this.availableFiles) {
      const basename = file.split('/').pop().toLowerCase();
      if (autoLoadFiles.some(pattern => basename === pattern.toLowerCase()) || importantFiles.includes(file)) {
        await this.fetchAndAddFile(file, filename);
      }
    }

    this.structureLoaded = true;
    return this.buildInitialContext(structure);
  },

  /**
   * Extract all file paths from structure recursively
   */
  extractFilePaths(structure, prefix = '') {
    let paths = [];
    for (const [name, node] of Object.entries(structure)) {
      const path = prefix ? `${prefix}/${name}` : name;
      if (node.type === 'file') {
        paths.push(node.path || path);
      } else if (node.children) {
        paths.push(...this.extractFilePaths(node.children, path));
      }
    }
    return paths;
  },

  /**
   * Build initial context message with structure overview
   */
  buildInitialContext(structure) {
    const structureText = this.getFileStructureText(structure);
    const contextFilesText = Array.from(this.contextFiles.keys()).join('\n- ');

    return `# Project Context

## File Structure
\`\`\`
${structureText}
\`\`\`

## Loaded Files
${contextFilesText ? '- ' + contextFilesText : 'No files loaded yet'}

## Available Commands
You can ask me to:
- "What's in the components folder?" - I'll search the structure
- "Show me the main file" - I'll fetch and analyze it
- "Read package.json" - I'll load and show its content
- "What is this project?" - I'll analyze key files
- "Explain the code structure" - I'll give you an overview

**Note:** I can automatically fetch any file you need. Just ask!`;
  },

  /**
   * Get file structure as text (copied from app.js)
   */
  getFileStructureText(structure, indent = '') {
    let text = '';
    const entries = Object.entries(structure);
    entries.forEach(([name, node], i) => {
      const isLast = i === entries.length - 1;
      const prefix = isLast ? '└── ' : '├── ';
      const childIndent = indent + (isLast ? '    ' : '│   ');

      if (node.type === 'directory' && node.children) {
        text += indent + prefix + name + '/\n';
        text += this.getFileStructureText(node.children, childIndent);
      } else {
        text += indent + prefix + name + '\n';
      }
    });
    return text;
  },

  /**
   * Fetch file content and add to context
   */
  async fetchAndAddFile(filepath, projectFilename) {
    if (this.contextFiles.has(filepath)) {
      return this.contextFiles.get(filepath);
    }

    try {
      const res = await fetch(`/file-preview/${projectFilename}/${filepath}`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      this.contextFiles.set(filepath, data.content);

      // Trigger UI update
      if (window._vz && window._vz.updateContextFilesUI) {
        window._vz.updateContextFilesUI();
      }

      return data.content;
    } catch (error) {
      console.error('Failed to fetch file:', filepath, error);
      throw error;
    }
  },

  /**
   * Parse AI response to detect file requests
   * Looks for patterns like:
   * - "Let me read <filepath>"
   * - "I'll fetch <filepath>"
   * - "Loading <filepath>"
   */
  async parseAndFetchRequestedFiles(aiResponse, projectFilename) {
    const filePatterns = [
      /(?:read|fetch|load|check|examine|analyze)\s+([^\s]+\.(?:js|ts|jsx|tsx|py|go|java|rb|php|css|html|json|md|txt|yaml|yml|toml|xml))/gi,
      /file:\s*([^\s]+)/gi,
      /`([^`]+\.(?:js|ts|jsx|tsx|py|go|java|rb|php|css|html|json|md|txt|yaml|yml|toml|xml))`/gi
    ];

    const requestedFiles = new Set();

    for (const pattern of filePatterns) {
      let match;
      while ((match = pattern.exec(aiResponse)) !== null) {
        const filepath = match[1];
        if (this.availableFiles.includes(filepath) && !this.contextFiles.has(filepath)) {
          requestedFiles.add(filepath);
        }
      }
    }

    // Fetch all requested files
    for (const filepath of requestedFiles) {
      try {
        await this.fetchAndAddFile(filepath, projectFilename);
      } catch (error) {
        console.warn('Could not auto-fetch:', filepath);
      }
    }

    return requestedFiles.size;
  },

  /**
   * Build enhanced system prompt for smart AI
   */
  getSmartSystemPrompt(structure) {
    const fileList = this.availableFiles.slice(0, 100).join(', ');
    const hasMoreFiles = this.availableFiles.length > 100;

    return `You are VibZcode Smart AI Assistant - an intelligent code analysis assistant with deep understanding of project structures.

## Your Capabilities
1. **File System Awareness**: You have access to the complete project structure
2. **Auto-fetch Files**: When you need to see a file's content, mention it naturally and it will be fetched automatically
3. **Smart Analysis**: Analyze code patterns, dependencies, and architecture
4. **Context Memory**: Remember files you've seen and build upon that knowledge

## Available Files in Project
${fileList}${hasMoreFiles ? `... and ${this.availableFiles.length - 100} more files` : ''}

## How to Request Files
When you need to see a file, just mention it naturally:
- "Let me read package.json"
- "I'll check the main.js file"
- "Looking at src/components/App.tsx"

The file will be automatically fetched and added to your context.

## Response Style
- Be concise but thorough
- Use markdown formatting
- When explaining code, use code blocks with syntax highlighting
- If a file is not in your context yet, request it naturally
- Always consider file extensions and project type

## Current Context
- Total files available: ${this.availableFiles.length}
- Files loaded in context: ${this.contextFiles.size}
- Structure: ${this.structureLoaded ? 'Available' : 'Not loaded'}

Remember: You're helping developers understand and improve their code. Be helpful, precise, and proactive!`;
  },

  /**
   * Build context summary for message
   */
  buildContextSummary() {
    if (this.contextFiles.size === 0) return '';

    let summary = '\n\n## Context Files\n';
    for (const [filepath, content] of this.contextFiles) {
      const ext = filepath.split('.').pop();
      const lines = content.split('\n').length;
      summary += `\n### ${filepath}\n\`\`\`${ext}\n${content}\n\`\`\`\n`;
    }
    return summary;
  },

  /**
   * Process user message and prepare for AI
   */
  async processUserMessage(message, projectFilename) {
    // Check if user is asking about specific folders/paths
    const folderQuestions = [
      /what(?:'s| is) in (?:the )?([^\s?]+) (?:folder|directory)/i,
      /show me (?:the )?([^\s?]+) (?:folder|directory)/i,
      /list files in ([^\s?]+)/i
    ];

    for (const pattern of folderQuestions) {
      const match = message.match(pattern);
      if (match) {
        const folderPath = match[1];
        const filesInFolder = this.availableFiles.filter(f => f.startsWith(folderPath + '/'));
        if (filesInFolder.length > 0) {
          return {
            enhanced: true,
            message: message + `\n\n[System: Found ${filesInFolder.length} files in ${folderPath}: ${filesInFolder.slice(0, 20).join(', ')}${filesInFolder.length > 20 ? '...' : ''}]`
          };
        }
      }
    }

    // Check if user is asking to read a specific file
    const fileRequest = message.match(/(?:read|show|open|display)\s+([^\s]+\.(?:js|ts|jsx|tsx|py|go|java|rb|php|css|html|json|md|txt|yaml|yml|toml|xml))/i);
    if (fileRequest) {
      const filepath = fileRequest[1];
      if (this.availableFiles.includes(filepath)) {
        try {
          const content = await this.fetchAndAddFile(filepath, projectFilename);
          return {
            enhanced: true,
            message: message,
            autoLoaded: filepath
          };
        } catch (error) {
          return { enhanced: false, message, error: `Could not load ${filepath}` };
        }
      }
    }

    return { enhanced: false, message };
  },

  /**
   * Remove file from context
   */
  removeFromContext(filepath) {
    this.contextFiles.delete(filepath);
    if (window._vz && window._vz.updateContextFilesUI) {
      window._vz.updateContextFilesUI();
    }
  },

  /**
   * Clear all context
   */
  clearContext() {
    this.contextFiles.clear();
    this.structureLoaded = false;
    this.availableFiles = [];
    if (window._vz && window._vz.updateContextFilesUI) {
      window._vz.updateContextFilesUI();
    }
  },

  /**
   * Get context files as array for UI
   */
  getContextFilesArray() {
    return Array.from(this.contextFiles.keys()).map(filepath => ({
      path: filepath,
      size: new Blob([this.contextFiles.get(filepath)]).size,
      lines: this.contextFiles.get(filepath).split('\n').length,
      ext: filepath.split('.').pop()
    }));
  }
};
