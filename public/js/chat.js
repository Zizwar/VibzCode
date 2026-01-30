window.VZ = window.VZ || {};

VZ.chat = {
  chatMessages: [],
  chatInput: '',
  chatLoading: false,
  chatProjectId: null,

  async sendMessage() {
    const msg = this.chatInput.trim();
    if (!msg || this.chatLoading) return;

    this.chatMessages.push({ role: 'user', content: msg });
    this.chatInput = '';
    this.chatLoading = true;
    this.$nextTick(() => this.scrollChatToBottom());

    try {
      const body = {
        message: msg,
        model: this.selectedModel,
        contextFiles: this.mergedContent || '',
        projectId: this.chatProjectId || this.currentFilename,
        enableCache: this.enableCache
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      this.chatMessages.push({
        role: 'assistant',
        content: data.response,
        model: data.model,
        usage: data.usage,
        cached: data.cached
      });

      this.$nextTick(() => {
        this.scrollChatToBottom();
        this.highlightChatCode();
      });
    } catch (err) {
      this.chatMessages.push({
        role: 'assistant',
        content: 'Error: ' + err.message,
        isError: true
      });
    } finally {
      this.chatLoading = false;
      this.$nextTick(() => this.scrollChatToBottom());
    }
  },

  scrollChatToBottom() {
    const el = document.getElementById('chat-messages');
    if (el) el.scrollTop = el.scrollHeight;
  },

  highlightChatCode() {
    document.querySelectorAll('#chat-messages pre code').forEach(el => {
      if (!el.dataset.highlighted) {
        hljs.highlightElement(el);
        el.dataset.highlighted = 'true';
      }
    });
  },

  renderMarkdown(text) {
    if (!text) return '';
    try {
      let html = marked.parse(text);
      html = html.replace(/<pre><code/g,
        '<div class="relative group"><button class="btn btn-ghost btn-xs absolute right-1 top-1 opacity-0 group-hover:opacity-100 z-10 copy-code-btn" onclick="VZ.utils.copyToClipboard(this.parentElement.querySelector(\'code\').textContent).then(()=>{this.textContent=\'Copied!\';setTimeout(()=>this.textContent=\'Copy\',1500)})">Copy</button><pre><code');
      html = html.replace(/<\/code><\/pre>/g, '</code></pre></div>');
      return html;
    } catch {
      return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  },

  clearChat() {
    this.chatMessages = [];
    this.chatProjectId = null;
  },

  async loadChatHistory(projectId) {
    try {
      const res = await fetch('/api/ai/chat/' + projectId);
      const history = await res.json();
      if (Array.isArray(history)) {
        this.chatMessages = history;
        this.chatProjectId = projectId;
      }
    } catch (err) {
      console.error('Load chat history failed:', err);
    }
  },

  async runQuickAction(action) {
    const prompts = {
      explain: 'Explain this code in detail. What does each part do and how does it work?',
      bugs: 'Find any bugs, security issues, or potential problems in this code. Be specific.',
      improve: 'Suggest improvements and optimizations for this code.',
      tests: 'Generate comprehensive unit tests for this code.',
      docs: 'Generate clear documentation for this code.',
      refactor: 'Suggest refactoring to improve code quality and maintainability.'
    };

    if (this.selectedFiles.length === 0) {
      VZ.utils.notify('Select files first', 'warning');
      return;
    }

    if (!this.mergedContent) {
      await this.handleExtract();
    }

    this.currentTab = 'chat';
    this.chatInput = prompts[action] || action;
    await this.sendMessage();
  }
};
