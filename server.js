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

dotenv.config()

const app = new Hono()
const PORT = process.env.PORT || 8080;

app.use('/*', cors())
app.use("/js/*", serveStatic({ root: "./public" }));
app.use("/*", serveStatic({ root: "./public" }));

const uploadsDir = path.join(process.cwd(), 'uploads');
const groupsDir = path.join(process.cwd(), 'filegroups');
const promptTemplatesDir = path.join(process.cwd(), 'prompttemplates');
const configDir = path.join(process.cwd(), 'config');

[uploadsDir, groupsDir, promptTemplatesDir, configDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Default prompt templates
const defaultTemplates = [
  { name: "Code Analysis", content: "Please analyze the following code and provide insights on its architecture, design patterns, and potential improvements:\n\n" },
  { name: "Bug Finding", content: "Please review the following code and identify any bugs, security vulnerabilities, or performance issues:\n\n" },
  { name: "Documentation Generator", content: "Please generate comprehensive documentation for the following code including function descriptions, parameters, and usage examples:\n\n" },
  { name: "Code Refactoring", content: "Please suggest refactoring for the following code to improve its readability, maintainability, and performance:\n\n" }
];

const templateFilePath = path.join(promptTemplatesDir, 'default-templates.json');
if (!fs.existsSync(templateFilePath)) {
  fs.writeFileSync(templateFilePath, JSON.stringify(defaultTemplates, null, 2));
}

// Default config files
const modelsConfigPath = path.join(configDir, 'models.json');
const appConfigPath = path.join(configDir, 'app-config.json');

if (!fs.existsSync(modelsConfigPath)) {
  fs.writeFileSync(modelsConfigPath, JSON.stringify({
    models: [
      { id: "openai/gpt-4.1-mini", name: "GPT-4.1 Mini", provider: "OpenAI", enabled: true },
      { id: "openai/gpt-5.1-codex-mini", name: "GPT-5.1 Codex Mini", provider: "OpenAI", enabled: true }
    ]
  }, null, 2));
}

if (!fs.existsSync(appConfigPath)) {
  fs.writeFileSync(appConfigPath, JSON.stringify({
    maxFileSizeMB: 50,
    defaultModel: "openai/gpt-5.1-codex-mini",
    enableCache: true,
    autoSelectImportant: true,
    streamResponses: true
  }, null, 2));
}

// ============================================
// HELPERS
// ============================================

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
          if (file.name !== '.git') addFilesToZip(filePath, path.join(zipPath, file.name));
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

function identifyImportantFiles(entries) {
  const importantPatterns = [
    /package\.json$/, /composer\.json$/, /requirements\.txt$/, /Gemfile$/,
    /Cargo\.toml$/, /pom\.xml$/, /build\.gradle$/, /\.gitignore$/,
    /docker-compose\.yml$/, /Dockerfile$/, /README\.md$/i,
    /^(main|index|app)\.(js|ts|py|java|go|rb|php)$/,
    /server\.(js|ts)$/, /config\.(js|json|yaml|yml)$/,
    /deno\.json$/, /mod\.ts$/
  ];
  return entries
    .filter(entry => {
      const fileName = path.basename(entry.entryName);
      return importantPatterns.some(p => p.test(fileName) || p.test(entry.entryName));
    })
    .map(e => e.entryName);
}

function summarizeCode(content, filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    let cleanedContent = stripComments(content);
    if (['.js','.ts','.jsx','.tsx'].includes(ext)) cleanedContent = beautify.js(cleanedContent, { indent_size: 2 });
    else if (['.html','.xml'].includes(ext)) cleanedContent = beautify.html(cleanedContent, { indent_size: 2 });
    else if (ext === '.css') cleanedContent = beautify.css(cleanedContent, { indent_size: 2 });
    return cleanedContent;
  } catch {
    return content;
  }
}

function buildFileStructure(entries) {
  const structure = {};
  entries.forEach(entry => {
    const parts = entry.entryName.split('/');
    let current = structure;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        current[part] = { type: 'file', path: entry.entryName };
      } else {
        if (!current[part]) current[part] = { type: 'directory', children: {} };
        current = current[part].children;
      }
    });
  });
  return structure;
}

function getMaxFileSize() {
  const mb = parseInt(process.env.MAX_FILE_SIZE_MB || '50');
  return mb * 1024 * 1024;
}

// ============================================
// FILE UPLOAD & MANAGEMENT
// ============================================

app.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('zipFile');
    const url = formData.get('url');
    const branch = formData.get('branch') || 'main';

    let buffer, filename;

    if (file) {
      buffer = await file.arrayBuffer();
      filename = file.name;
    } else if (url) {
      if (url.includes('github.com')) {
        buffer = await fetchFromGitHub(url, branch);
        filename = url.split('/').pop().replace(/\.git$/, '') + '.zip';
      } else {
        buffer = await fetchFileFromUrl(url);
        filename = url.split('/').pop() || 'download.zip';
      }
    } else {
      return c.json({ error: 'No file or URL provided' }, 400);
    }

    // Check file size
    const maxSize = getMaxFileSize();
    if (buffer.byteLength > maxSize) {
      const maxMB = Math.round(maxSize / 1024 / 1024);
      return c.json({ error: `File too large (${Math.round(buffer.byteLength / 1024 / 1024)}MB). Maximum: ${maxMB}MB` }, 413);
    }

    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, Buffer.from(buffer));

    const zip = new AdmZip(Buffer.from(buffer));
    const zipEntries = zip.getEntries();
    const fileStructure = buildFileStructure(zipEntries);
    const importantFiles = identifyImportantFiles(zipEntries);

    return c.json({ fileStructure, filename, importantFiles, size: buffer.byteLength });
  } catch (error) {
    console.error('Error in /upload:', error);
    return c.json({ error: 'Upload failed: ' + error.message }, 500);
  }
});

app.get('/file-preview/:filename/:filepath{.+}', async (c) => {
  try {
    const filename = c.req.param('filename');
    const filepath = c.req.param('filepath');
    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) return c.json({ error: 'File not found' }, 404);

    const zip = new AdmZip(filePath);
    const entry = zip.getEntry(filepath);
    if (!entry) return c.json({ error: 'File not found in ZIP' }, 404);

    return c.json({ content: entry.getData().toString('utf8') });
  } catch (error) {
    console.error('Error in /file-preview:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/reopen/:filename', async (c) => {
  try {
    const filename = c.req.param('filename');
    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) return c.json({ error: 'File not found' }, 404);

    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();
    return c.json({
      fileStructure: buildFileStructure(zipEntries),
      filename,
      importantFiles: identifyImportantFiles(zipEntries)
    });
  } catch (error) {
    console.error('Error in /reopen:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/extract', async (c) => {
  try {
    const formData = await c.req.formData();
    const filesString = formData.get('files');
    const filename = formData.get('filename');
    const summarize = formData.get('summarize') === 'true';

    if (!filename || !filesString) return c.json({ error: 'Missing filename or file list' }, 400);
    const files = JSON.parse(filesString);

    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) return c.json({ error: 'File not found' }, 404);

    const zip = new AdmZip(filePath);
    const extractedContent = files.map(file => {
      const entry = zip.getEntry(file);
      if (!entry) return `// ${file}\nFile not found in the ZIP archive.`;
      let content = entry.getData().toString('utf8');
      if (file.endsWith('.json')) {
        try { content = JSON.stringify(JSON.parse(content), null, 2); } catch {}
      }
      if (summarize) content = summarizeCode(content, file);
      return `// ${file}\n${content}`;
    }).join('\n\n');

    return c.json({ content: extractedContent });
  } catch (error) {
    console.error('Error in /extract:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/uploads', (c) => {
  return c.json(fs.readdirSync(uploadsDir));
});

app.delete('/upload/:filename', (c) => {
  const filename = c.req.param('filename');
  const filePath = path.join(uploadsDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return c.json({ message: 'Deleted' });
  }
  return c.json({ error: 'File not found' }, 404);
});

// ============================================
// PROMPT TEMPLATES
// ============================================

app.get('/prompt-templates', (c) => {
  try {
    if (fs.existsSync(templateFilePath)) {
      return c.json(JSON.parse(fs.readFileSync(templateFilePath, 'utf8')));
    }
    return c.json(defaultTemplates);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// FILE GROUPS
// ============================================

app.post('/file-groups', async (c) => {
  try {
    const formData = await c.req.formData();
    const name = formData.get('name');
    const filesString = formData.get('files');
    const filename = formData.get('filename');
    if (!name || !filesString || !filename) return c.json({ error: 'Missing fields' }, 400);

    const groupData = { name, filename, files: JSON.parse(filesString), createdAt: new Date().toISOString() };
    const groupFilePath = path.join(groupsDir, `${name.replace(/[^a-z0-9]/gi, '_')}.json`);
    fs.writeFileSync(groupFilePath, JSON.stringify(groupData, null, 2));
    return c.json({ message: 'Saved', id: path.basename(groupFilePath, '.json') });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get('/file-groups', (c) => {
  try {
    const groups = fs.readdirSync(groupsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => JSON.parse(fs.readFileSync(path.join(groupsDir, f), 'utf8')));
    return c.json(groups);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/file-groups/:name', (c) => {
  try {
    const name = c.req.param('name');
    const filePath = path.join(groupsDir, `${name}.json`);
    if (fs.existsSync(filePath)) { fs.unlinkSync(filePath); return c.json({ message: 'Deleted' }); }
    return c.json({ error: 'Not found' }, 404);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// APP CONFIG API
// ============================================

app.get('/api/config', (c) => {
  try {
    return c.json(JSON.parse(fs.readFileSync(appConfigPath, 'utf8')));
  } catch {
    return c.json({ maxFileSizeMB: 50, defaultModel: 'openai/gpt-5.1-codex-mini', enableCache: true, autoSelectImportant: true });
  }
});

app.put('/api/config', async (c) => {
  try {
    const body = await c.req.json();
    fs.writeFileSync(appConfigPath, JSON.stringify(body, null, 2));
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get('/api/config/models', (c) => {
  try {
    return c.json(JSON.parse(fs.readFileSync(modelsConfigPath, 'utf8')));
  } catch {
    return c.json({ models: [] });
  }
});

app.put('/api/config/models', async (c) => {
  try {
    const body = await c.req.json();
    fs.writeFileSync(modelsConfigPath, JSON.stringify(body, null, 2));
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Environment config (dev only)
app.get('/api/config/env', (c) => {
  return c.json({
    STORAGE_MODE: process.env.STORAGE_MODE || 'local',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? '********' : '',
    DEFAULT_AI_MODEL: process.env.DEFAULT_AI_MODEL || '',
    MAX_FILE_SIZE_MB: process.env.MAX_FILE_SIZE_MB || '50',
  });
});

app.put('/api/config/env', async (c) => {
  try {
    const body = await c.req.json();
    const envPath = path.join(process.cwd(), '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    for (const [key, value] of Object.entries(body)) {
      if (value === '********') continue; // Skip masked values
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
      process.env[key] = value;
    }
    fs.writeFileSync(envPath, envContent);

    // Reinitialize openrouter if API key changed
    if (body.OPENROUTER_API_KEY && body.OPENROUTER_API_KEY !== '********') {
      openrouter.reinit();
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// AI CHAT
// ============================================

app.get('/api/ai/models', (c) => {
  try {
    const configModels = JSON.parse(fs.readFileSync(modelsConfigPath, 'utf8'));
    return c.json(configModels.models || []);
  } catch {
    return c.json([]);
  }
});

app.post('/api/ai/chat', async (c) => {
  try {
    if (!openrouter.enabled) {
      return c.json({ error: 'AI not configured. Set OPENROUTER_API_KEY in Settings > API.' }, 503);
    }

    const body = await c.req.json();
    const { message, model, contextFiles, projectId, enableCache } = body;

    if (!message) return c.json({ error: 'Message is required' }, 400);

    // Get chat history
    let chatHistory = [];
    if (projectId) {
      chatHistory = await database.getChatHistory(projectId);
    }

    // Build messages with optional prompt caching
    const messages = [];

    // System message
    messages.push({
      role: 'system',
      content: 'You are VibZcode AI assistant. You help analyze, explain, and improve code. Be concise and precise. Use markdown formatting.'
    });

    // Context files (with cache_control if enabled)
    if (contextFiles) {
      const contextMsg = {
        role: 'user',
        content: enableCache ? [
          { type: 'text', text: `Project files for context:\n\n${contextFiles}`, cache_control: { type: 'ephemeral' } }
        ] : `Project files for context:\n\n${contextFiles}`
      };
      messages.push(contextMsg);
      messages.push({ role: 'assistant', content: 'I have the project files. What would you like to know?' });
    }

    // Chat history
    chatHistory.forEach(msg => {
      messages.push({ role: msg.role, content: msg.content });
    });

    // Current message
    messages.push({ role: 'user', content: message });

    const response = await openrouter.chat(messages, model);

    // Save to history
    if (projectId) {
      await database.saveChatMessage(projectId, { role: 'user', content: message });
      await database.saveChatMessage(projectId, { role: 'assistant', content: response.content, model: response.model });
    }

    return c.json({
      response: response.content,
      model: response.model,
      usage: response.usage,
      cached: response.usage?.cache_read_input_tokens > 0
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    return c.json({ error: 'AI chat failed: ' + error.message }, 500);
  }
});

app.get('/api/ai/chat/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    return c.json(await database.getChatHistory(projectId));
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// AI ANALYSIS & AGENTS
// ============================================

app.post('/api/ai/analyze', async (c) => {
  try {
    if (!openrouter.enabled) return c.json({ error: 'AI not configured' }, 503);
    const formData = await c.req.formData();
    const projectContent = formData.get('content');
    const analysisType = formData.get('type') || 'general';
    if (!projectContent) return c.json({ error: 'Content required' }, 400);

    const analysis = await openrouter.analyzeProject(projectContent, analysisType);
    return c.json({ analysis: analysis.content, model: analysis.model, usage: analysis.usage });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.post('/api/ai/agent/:type', async (c) => {
  try {
    if (!openrouter.enabled) return c.json({ error: 'AI not configured' }, 503);
    const agentType = c.req.param('type');
    const formData = await c.req.formData();
    const codeContent = formData.get('content');
    if (!codeContent) return c.json({ error: 'Content required' }, 400);

    const result = await openrouter.runAgent(agentType, codeContent);
    return c.json({ result: result.content, agent: agentType, model: result.model });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get('/api/ai/agents', (c) => {
  return c.json([
    { id: 'security', name: 'Security Analyzer', icon: 'shield' },
    { id: 'performance', name: 'Performance Optimizer', icon: 'zap' },
    { id: 'documentation', name: 'Documentation Generator', icon: 'book' },
    { id: 'refactoring', name: 'Refactoring Expert', icon: 'recycle' },
    { id: 'testing', name: 'Testing Agent', icon: 'flask' }
  ]);
});

// ============================================
// PROJECTS
// ============================================

app.get('/api/projects', async (c) => {
  try {
    return c.json(await database.getProjects('default'));
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// SPA FALLBACK - serve index.html for /get/* routes
// ============================================

app.get('/get/*', (c) => {
  const indexPath = path.join(process.cwd(), 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    return c.html(fs.readFileSync(indexPath, 'utf8'));
  }
  return c.text('Not found', 404);
});

// ============================================
// START SERVER
// ============================================

await database.connect();

serve({ fetch: app.fetch, port: PORT });

console.log('VibZcode server running on http://localhost:' + PORT);
console.log('Storage:', process.env.STORAGE_MODE || 'local');
console.log('AI:', openrouter.enabled ? 'Enabled' : 'Disabled (set OPENROUTER_API_KEY)');
console.log('Max upload:', (process.env.MAX_FILE_SIZE_MB || 50) + 'MB');

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await database.close();
  process.exit(0);
});
