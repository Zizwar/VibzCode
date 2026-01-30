window.VZ = window.VZ || {};

document.addEventListener('alpine:init', () => {
  Alpine.data('vibzcode', () => ({
    // UI State
    darkMode: localStorage.getItem('vz-dark') !== 'false',
    currentTab: 'prompt',
    loading: false,
    showPreview: false,
    showSelectedModal: false,
    notifications: [],

    // File State
    fileStructure: null,
    selectedFiles: [],
    currentFilename: null,
    importantFiles: [],
    uploadedFiles: [],
    previewContent: '',
    previewPath: '',

    // Content
    mergedContent: '',
    mainPrompt: '',

    // Options
    selectedModel: '',
    enableCache: true,
    excludeMediaFiles: true,
    summarizeCode: false,
    includeFileStructure: true,

    // Templates & Groups
    promptTemplates: [],
    fileGroups: [],
    selectedTemplate: '',
    groupName: '',

    // Stats
    tokenCount: 0,

    // Mix in all modules
    ...VZ.upload,
    ...VZ.filetree,
    ...VZ.chat,
    ...VZ.configModule,

    init() {
      // Global reference for x-html event handlers (Alpine doesn't process directives in x-html)
      window._vz = this;

      // Theme
      document.documentElement.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');

      // Marked.js config
      if (window.marked) {
        marked.setOptions({ breaks: true, gfm: true });
      }

      // Notifications listener
      window.addEventListener('vz-notify', (e) => {
        const n = e.detail;
        this.notifications.push(n);
        if (n.duration > 0) {
          setTimeout(() => {
            this.notifications = this.notifications.filter(x => x.id !== n.id);
          }, n.duration);
        }
      });

      // Keyboard shortcuts
      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          if (this.currentTab === 'chat') this.sendMessage();
          else this.handleExtract();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          const el = document.getElementById('file-search');
          if (el) el.focus();
        }
      });

      // Load data
      this.loadConfig();
      this.fetchUploads();
      this.fetchTemplates();
      this.fetchFileGroups();
      this.restoreSession();

      // URL hash auto-load
      this.$nextTick(() => this.checkUrlHash());
    },

    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('vz-dark', this.darkMode);
      document.documentElement.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
    },

    checkUrlHash() {
      let url = '';
      // Check hash: /#https://github.com/...
      const hash = window.location.hash.substring(1);
      if (hash && (hash.startsWith('http://') || hash.startsWith('https://'))) {
        url = decodeURIComponent(hash);
      }
      // Check path: /get/https://github.com/...
      if (!url) {
        const m = window.location.pathname.match(/^\/get\/(.+)/);
        if (m) url = decodeURIComponent(m[1]);
      }
      if (url) {
        this.githubUrl = url;
        this.uploadFromHashUrl(url);
      }
    },

    updateTokenCount() {
      let total = VZ.utils.estimateTokens(this.mainPrompt);
      total += VZ.utils.estimateTokens(this.mergedContent);
      this.tokenCount = total;
    },

    formatTokens(n) {
      return VZ.utils.formatTokens(n);
    },

    async handleExtract() {
      if (!this.currentFilename || this.selectedFiles.length === 0) {
        VZ.utils.notify('Select files first', 'warning');
        return;
      }

      this.loading = true;
      try {
        const formData = new FormData();
        formData.append('filename', this.currentFilename);
        formData.append('files', JSON.stringify(this.selectedFiles));
        formData.append('summarize', this.summarizeCode);

        const res = await fetch('/extract', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        let content = '';
        if (this.mainPrompt) content += this.mainPrompt + '\n\n';
        if (this.includeFileStructure && this.fileStructure) {
          content += '## Project Structure\n```\n' + this.getFileStructureText(this.fileStructure) + '```\n\n';
        }
        content += '## Files\n' + data.content;

        this.mergedContent = content;
        this.currentTab = 'output';
        this.updateTokenCount();
        VZ.utils.notify(this.selectedFiles.length + ' files extracted', 'success');
      } catch (err) {
        VZ.utils.notify(err.message, 'error');
      } finally {
        this.loading = false;
      }
    },

    async copyOutput() {
      await VZ.utils.copyToClipboard(this.mergedContent);
      VZ.utils.notify('Copied to clipboard', 'success');
    },

    downloadOutput() {
      const blob = new Blob([this.mergedContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (this.currentFilename || 'vibzcode') + '-output.txt';
      a.click();
      URL.revokeObjectURL(url);
    },

    // Templates
    async fetchTemplates() {
      try {
        const res = await fetch('/prompt-templates');
        this.promptTemplates = await res.json();
      } catch (err) {
        console.error('Fetch templates failed:', err);
      }
    },

    applyTemplate() {
      const t = this.promptTemplates.find(t => t.name === this.selectedTemplate);
      if (t) {
        this.mainPrompt = t.content;
        this.updateTokenCount();
      }
    },

    // File Groups
    async fetchFileGroups() {
      try {
        const res = await fetch('/file-groups');
        this.fileGroups = await res.json();
      } catch (err) {
        console.error('Fetch groups failed:', err);
      }
    },

    async saveFileGroup() {
      if (!this.groupName || this.selectedFiles.length === 0) return;
      try {
        const formData = new FormData();
        formData.append('name', this.groupName);
        formData.append('files', JSON.stringify(this.selectedFiles));
        formData.append('filename', this.currentFilename);
        await fetch('/file-groups', { method: 'POST', body: formData });
        this.groupName = '';
        this.fetchFileGroups();
        VZ.utils.notify('Group saved', 'success');
      } catch (err) {
        VZ.utils.notify('Save group failed', 'error');
      }
    },

    loadFileGroup(group) {
      this.selectedFiles = [...group.files];
      this.updateTokenCount();
      VZ.utils.notify('Group loaded', 'success');
    },

    async deleteFileGroup(name) {
      try {
        await fetch('/file-groups/' + name, { method: 'DELETE' });
        this.fetchFileGroups();
      } catch (err) {
        VZ.utils.notify('Delete failed', 'error');
      }
    },

    // Session persistence
    saveSession() {
      try {
        localStorage.setItem('vz-session', JSON.stringify({
          selectedFiles: this.selectedFiles,
          mainPrompt: this.mainPrompt,
          currentFilename: this.currentFilename,
          selectedModel: this.selectedModel,
          expandedFolders: this.expandedFolders,
          currentTab: this.currentTab
        }));
      } catch {}
    },

    restoreSession() {
      try {
        const s = localStorage.getItem('vz-session');
        if (!s) return;
        const d = JSON.parse(s);
        this.mainPrompt = d.mainPrompt || '';
        if (d.selectedModel) this.selectedModel = d.selectedModel;
        if (d.currentFilename) {
          this.reopenProject(d.currentFilename).then(() => {
            if (d.selectedFiles) this.selectedFiles = d.selectedFiles;
            if (d.expandedFolders) this.expandedFolders = d.expandedFolders;
            this.updateTokenCount();
          }).catch(() => {});
        }
      } catch {}
    }
  }));
});
