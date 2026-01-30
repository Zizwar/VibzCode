import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { serveStatic } from "@hono/node-server/serve-static";
import AdmZip from 'adm-zip'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'
import beautify from 'js-beautify'
import stripComments from 'strip-comments'
import dotenv from 'dotenv'
import database from './config/database.js'
import openrouter from './utils/openrouter.js'

// Load environment variables
dotenv.config()

const app = new Hono()

const PORT =8080;
app.use('/*', cors())
app.use("/", serveStatic({ root: "./public" }));

const uploadsDir = path.join(process.cwd(), 'uploads');
const groupsDir = path.join(process.cwd(), 'filegroups');
const promptTemplatesDir = path.join(process.cwd(), 'prompttemplates');

// Create necessary directories if they don't exist
[uploadsDir, groupsDir, promptTemplatesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

// Create default prompt templates if they don't exist
const defaultTemplates = [
  {
    name: "Code Analysis",
    content: "Please analyze the following code and provide insights on its architecture, design patterns, and potential improvements:\n\n"
  },
  {
    name: "Bug Finding",
    content: "Please review the following code and identify any bugs, security vulnerabilities, or performance issues:\n\n"
  },
  {
    name: "Documentation Generator",
    content: "Please generate comprehensive documentation for the following code including function descriptions, parameters, and usage examples:\n\n"
  },
  {
    name: "Code Refactoring",
    content: "Please suggest refactoring for the following code to improve its readability, maintainability, and performance:\n\n"
  }
];

const templateFilePath = path.join(promptTemplatesDir, 'default-templates.json');
if (!fs.existsSync(templateFilePath)) {
  fs.writeFileSync(templateFilePath, JSON.stringify(defaultTemplates, null, 2));
}

async function fetchFileFromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.arrayBuffer();
}

async function fetchFromGitHub(url, branch = 'main') {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'github-'));
  try {
    execSync(`git clone --depth 1 --branch ${branch} ${url} ${tempDir}`, { stdio: 'inherit' });

    const zip = new AdmZip();
    const addFilesToZip = (dir, zipPath = '') => {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
          if (file.name !== '.git') {
            addFilesToZip(filePath, path.join(zipPath, file.name));
          }
        } else {
          zip.addLocalFile(filePath, zipPath);
        }
      }
    };
    addFilesToZip(tempDir);

    return zip.toBuffer();
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

// Detect important files in a project
function identifyImportantFiles(entries) {
  const importantPatterns = [
    /package\.json$/, 
    /composer\.json$/,
    /requirements\.txt$/,
    /Gemfile$/,
    /Cargo\.toml$/,
    /pom\.xml$/,
    /build\.gradle$/,
    /\.gitignore$/,
    /docker-compose\.yml$/,
    /Dockerfile$/,
    /README\.md$/i,
    /^(main|index|app)\.(js|ts|py|java|go|rb|php)$/,
    /server\.(js|ts)$/,
    /config\.(js|json|yaml|yml)$/
  ];
  
  const importantFiles = [];
  
  entries.forEach(entry => {
    const fileName = path.basename(entry.entryName);
    const isImportant = importantPatterns.some(pattern => pattern.test(fileName) || pattern.test(entry.entryName));
    if (isImportant) {
      importantFiles.push(entry.entryName);
    }
  });
  
  return importantFiles;
}

// Summarize code for reducing output size
function summarizeCode(content, filePath) {
  // Simple strategy: remove comments and format consistently
  try {
    // Determine file extension
    const ext = path.extname(filePath).toLowerCase();
    
    // Remove comments based on file type
    let cleanedContent = stripComments(content);
    
    // Basic formatting based on file type
    if (ext === '.js' || ext === '.ts' || ext === '.jsx' || ext === '.tsx') {
      cleanedContent = beautify.js(cleanedContent, { indent_size: 2 });
    } else if (ext === '.html' || ext === '.xml') {
      cleanedContent = beautify.html(cleanedContent, { indent_size: 2 });
    } else if (ext === '.css') {
      cleanedContent = beautify.css(cleanedContent, { indent_size: 2 });
    }
    
    return cleanedContent;
  } catch (error) {
    console.error(`Error summarizing ${filePath}:`, error);
    return content; // Return original content if summarization fails
  }
}

app.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('zipFile')
    const url = formData.get('url')
    const branch = formData.get('branch') || 'main'

    let buffer;
    let filename;
    if (file) {
      buffer = await file.arrayBuffer()
      filename = file.name;
    } else if (url) {
      if (url.includes('github.com')) {
        buffer = await fetchFromGitHub(url, branch);
        filename = url.split('/').pop() + '.zip';
      } else {
        buffer = await fetchFileFromUrl(url);
        filename = url.split('/').pop();
      }
    } else {
      return c.json({ error: 'No file or URL provided' }, 400)
    }

    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, Buffer.from(buffer));

    const zip = new AdmZip(Buffer.from(buffer))
    const zipEntries = zip.getEntries()
    const fileStructure = buildFileStructure(zipEntries)
    const importantFiles = identifyImportantFiles(zipEntries)
    
    return c.json({ fileStructure, filename, importantFiles })
  } catch (error) {
    console.error('Error in /upload:', error)
    return c.json({ error: 'Internal server error: ' + error.message }, 500)
  }
})

app.get('/file-preview/:filename/:filepath(*)', async (c) => {
  try {
    const filename = c.req.param('filename');
    const filepath = c.req.param('filepath');
    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return c.json({ error: 'File not found' }, 404);
    }

    const zip = new AdmZip(filePath);
    const entry = zip.getEntry(filepath);
    
    if (!entry) {
      return c.json({ error: 'File not found in ZIP' }, 404);
    }
    
    const content = entry.getData().toString('utf8');
    return c.json({ content });
  } catch (error) {
    console.error('Error in /file-preview:', error);
    return c.json({ error: 'Internal server error: ' + error.message }, 500);
  }
});

app.get('/reopen/:filename', async (c) => {
  try {
    const filename = c.req.param('filename');
    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return c.json({ error: 'File not found' }, 404);
    }

    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();
    const fileStructure = buildFileStructure(zipEntries);
    const importantFiles = identifyImportantFiles(zipEntries);
    
    return c.json({ fileStructure, filename, importantFiles });
  } catch (error) {
    console.error('Error in /reopen:', error);
    return c.json({ error: 'Internal server error: ' + error.message }, 500);
  }
});

app.post('/extract', async (c) => {
  try {
    const formData = await c.req.formData()
    const filesString = formData.get('files')
    const filename = formData.get('filename')
    const summarize = formData.get('summarize') === 'true'

    if (!filename || !filesString) return c.json({ error: 'Missing filename or file list' }, 400)
    const files = JSON.parse(filesString)

    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      return c.json({ error: 'File not found' }, 404);
    }

    const zip = new AdmZip(filePath)
    const extractedContent = files.map(file => {
      const entry = zip.getEntry(file)
      if (entry) {
        let content = entry.getData().toString('utf8')
        if (file.endsWith('.json')) {
          try {
            const jsonObj = JSON.parse(content)
            content = JSON.stringify(jsonObj, null, 2)
          } catch (e) {
            console.error('Error parsing JSON:', e)
          }
        }
        
        // Apply summarization if requested
        if (summarize) {
          content = summarizeCode(content, file);
        }
        
        return `// ${file}\n${content}`
      }
      return `// ${file}\nFile not found in the ZIP archive.`
    }).join('\n\n')
    return c.json({ content: extractedContent })
  } catch (error) {
    console.error('Error in /extract:', error)
    return c.json({ error: 'Internal server error: ' + error.message }, 500)
  }
})

app.get('/uploads', (c) => {
  const files = fs.readdirSync(uploadsDir);
  return c.json(files);
});

app.delete('/upload/:filename', (c) => {
  const filename = c.req.param('filename');
  const filePath = path.join(uploadsDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return c.json({ message: 'File deleted successfully' });
  } else {
    return c.json({ error: 'File not found' }, 404);
  }
});

// Get prompt templates
app.get('/prompt-templates', (c) => {
  try {
    const templateFilePath = path.join(promptTemplatesDir, 'default-templates.json');
    if (fs.existsSync(templateFilePath)) {
      const templates = JSON.parse(fs.readFileSync(templateFilePath, 'utf8'));
      return c.json(templates);
    } else {
      return c.json(defaultTemplates);
    }
  } catch (error) {
    console.error('Error getting prompt templates:', error);
    return c.json({ error: 'Internal server error: ' + error.message }, 500);
  }
});

// Save file group
app.post('/file-groups', async (c) => {
  try {
    const formData = await c.req.formData();
    const name = formData.get('name');
    const filesString = formData.get('files');
    const filename = formData.get('filename');
    
    if (!name || !filesString || !filename) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    const groupData = {
      name,
      filename,
      files: JSON.parse(filesString),
      createdAt: new Date().toISOString()
    };
    
    const groupFilePath = path.join(groupsDir, `${name.replace(/[^a-z0-9]/gi, '_')}.json`);
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    
    return c.json({ message: 'Group saved successfully', id: path.basename(groupFilePath, '.json') });
  } catch (error) {
    console.error('Error saving file group:', error);
    return c.json({ error: 'Internal server error: ' + error.message }, 500);
  }
});

// Get file groups
app.get('/file-groups', (c) => {
  try {
    const files = fs.readdirSync(groupsDir);
    const groups = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const content = fs.readFileSync(path.join(groupsDir, file), 'utf8');
        return JSON.parse(content);
      });
    return c.json(groups);
  } catch (error) {
    console.error('Error getting file groups:', error);
    return c.json({ error: 'Internal server error: ' + error.message }, 500);
  }
});

// Delete file group
app.delete('/file-groups/:name', (c) => {
  try {
    const name = c.req.param('name');
    const groupFilePath = path.join(groupsDir, `${name}.json`);
    
    if (fs.existsSync(groupFilePath)) {
      fs.unlinkSync(groupFilePath);
      return c.json({ message: 'Group deleted successfully' });
    } else {
      return c.json({ error: 'Group not found' }, 404);
    }
  } catch (error) {
    console.error('Error deleting file group:', error);
    return c.json({ error: 'Internal server error: ' + error.message }, 500);
  }
});

function buildFileStructure(entries) {
  const structure = {}
  entries.forEach(entry => {
    const path = entry.entryName.split('/')
    let current = structure
    path.forEach((part, index) => {
      if (index === path.length - 1) {
        current[part] = {
          type: 'file',
          path: entry.entryName
        }
      } else {
        if (!current[part]) {
          current[part] = {
            type: 'directory',
            children: {}
          }
        }
        current = current[part].children
      }
    })
  })
  return structure
}

// ============================================
// AI CHAT ENDPOINTS
// ============================================

// Get available AI models
app.get('/api/ai/models', (c) => {
  try {
    if (!openrouter.enabled) {
      return c.json({ error: 'AI features are not enabled. Please configure OPENROUTER_API_KEY.' }, 503);
    }
    const models = openrouter.getAvailableModels();
    return c.json(models);
  } catch (error) {
    console.error('Error getting AI models:', error);
    return c.json({ error: 'Failed to get AI models' }, 500);
  }
});

// Send chat message to AI
app.post('/api/ai/chat', async (c) => {
  try {
    if (!openrouter.enabled) {
      return c.json({ error: 'AI features are not enabled. Please configure OPENROUTER_API_KEY.' }, 503);
    }

    const formData = await c.req.formData();
    const message = formData.get('message');
    const projectId = formData.get('projectId');
    const model = formData.get('model');
    const contextFiles = formData.get('contextFiles');

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Build context from selected files
    let contextContent = '';
    if (contextFiles) {
      const files = JSON.parse(contextFiles);
      contextContent = `\n\nProject Context:\n${files}`;
    }

    // Get chat history
    let chatHistory = [];
    if (projectId) {
      chatHistory = await database.getChatHistory(projectId);
    }

    // Build messages array
    const messages = [
      ...chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message + contextContent
      }
    ];

    // Get AI response
    const response = await openrouter.chat(messages, model);

    // Save to chat history
    if (projectId) {
      await database.saveChatMessage(projectId, {
        role: 'user',
        content: message
      });
      await database.saveChatMessage(projectId, {
        role: 'assistant',
        content: response.content,
        model: response.model
      });
    }

    return c.json({
      response: response.content,
      model: response.model,
      usage: response.usage
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    return c.json({ error: 'AI chat failed: ' + error.message }, 500);
  }
});

// Get chat history
app.get('/api/ai/chat/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const history = await database.getChatHistory(projectId);
    return c.json(history);
  } catch (error) {
    console.error('Error getting chat history:', error);
    return c.json({ error: 'Failed to get chat history' }, 500);
  }
});

// ============================================
// AI ANALYSIS ENDPOINTS
// ============================================

// Analyze project with AI
app.post('/api/ai/analyze', async (c) => {
  try {
    if (!openrouter.enabled) {
      return c.json({ error: 'AI features are not enabled. Please configure OPENROUTER_API_KEY.' }, 503);
    }

    const formData = await c.req.formData();
    const projectContent = formData.get('content');
    const analysisType = formData.get('type') || 'general';

    if (!projectContent) {
      return c.json({ error: 'Project content is required' }, 400);
    }

    const analysis = await openrouter.analyzeProject(projectContent, analysisType);

    return c.json({
      analysis: analysis.content,
      model: analysis.model,
      usage: analysis.usage
    });
  } catch (error) {
    console.error('Error analyzing project:', error);
    return c.json({ error: 'Analysis failed: ' + error.message }, 500);
  }
});

// Run AI agent
app.post('/api/ai/agent/:type', async (c) => {
  try {
    if (!openrouter.enabled) {
      return c.json({ error: 'AI features are not enabled. Please configure OPENROUTER_API_KEY.' }, 503);
    }

    const agentType = c.req.param('type');
    const formData = await c.req.formData();
    const codeContent = formData.get('content');

    if (!codeContent) {
      return c.json({ error: 'Code content is required' }, 400);
    }

    const result = await openrouter.runAgent(agentType, codeContent);

    return c.json({
      result: result.content,
      agent: agentType,
      model: result.model
    });
  } catch (error) {
    console.error('Error running AI agent:', error);
    return c.json({ error: 'Agent failed: ' + error.message }, 500);
  }
});

// Get available agents
app.get('/api/ai/agents', (c) => {
  const agents = [
    { id: 'security', name: 'Security Analyzer', icon: '🔒' },
    { id: 'performance', name: 'Performance Optimizer', icon: '⚡' },
    { id: 'documentation', name: 'Documentation Generator', icon: '📚' },
    { id: 'refactoring', name: 'Refactoring Expert', icon: '🔄' },
    { id: 'testing', name: 'Testing Agent', icon: '🧪' }
  ];
  return c.json(agents);
});

// ============================================
// PROJECT MANAGEMENT ENDPOINTS
// ============================================

// Get all projects
app.get('/api/projects', async (c) => {
  try {
    const projects = await database.getProjects('default');
    return c.json(projects);
  } catch (error) {
    console.error('Error getting projects:', error);
    return c.json({ error: 'Failed to get projects' }, 500);
  }
});

// Initialize database connection
await database.connect();

serve({
  fetch: app.fetch,
  port: PORT
})

console.log('🚀 Server is running on http://localhost:' + PORT)
console.log('📦 Storage Mode:', process.env.STORAGE_MODE || 'local')
console.log('🤖 AI Features:', openrouter.enabled ? 'Enabled' : 'Disabled (Set OPENROUTER_API_KEY to enable)')

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await database.close();
  process.exit(0);
});
