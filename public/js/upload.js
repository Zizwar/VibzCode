window.VZ = window.VZ || {};

VZ.upload = {
  uploadTab: 'github',
  uploadUrl: '',
  githubUrl: '',
  githubBranch: 'main',
  isDragging: false,
  githubAuth: {
    authenticated: false,
    user: null
  },
  userRepos: [],
  loadingRepos: false,

  async handleFileDrop(e) {
    e.preventDefault();
    this.isDragging = false;
    const file = e.dataTransfer?.files?.[0];
    if (file && file.name.endsWith('.zip')) {
      await this.uploadZipFile(file);
    } else {
      const text = e.dataTransfer?.getData('text/plain');
      if (text && (text.includes('github.com') || text.endsWith('.zip'))) {
        this.githubUrl = text;
        await this.uploadFromGitHub();
      } else {
        VZ.utils.notify('Drop a ZIP file or GitHub URL', 'warning');
      }
    }
  },

  async uploadZipFile(file) {
    this.loading = true;
    try {
      const formData = new FormData();
      formData.append('zipFile', file);
      const res = await fetch('/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      this.processUploadResult(data);
      VZ.utils.notify('Project loaded', 'success');
    } catch (err) {
      VZ.utils.notify(err.message, 'error');
    } finally {
      this.loading = false;
    }
  },

  async uploadFromUrl() {
    if (!this.uploadUrl) return;
    this.loading = true;
    try {
      const formData = new FormData();
      formData.append('url', this.uploadUrl);
      const res = await fetch('/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      this.processUploadResult(data);
      VZ.utils.notify('Project loaded from URL', 'success');
    } catch (err) {
      VZ.utils.notify(err.message, 'error');
    } finally {
      this.loading = false;
    }
  },

  async uploadFromGitHub() {
    const url = this.githubUrl;
    if (!url) return;
    this.loading = true;
    try {
      const formData = new FormData();
      formData.append('url', url);
      formData.append('branch', this.githubBranch);
      const res = await fetch('/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      this.processUploadResult(data);
      VZ.utils.notify('Repository cloned', 'success');
    } catch (err) {
      VZ.utils.notify(err.message, 'error');
    } finally {
      this.loading = false;
    }
  },

  async uploadFromHashUrl(url) {
    this.loading = true;
    try {
      const formData = new FormData();
      formData.append('url', url);
      if (url.includes('github.com')) formData.append('branch', 'main');
      const res = await fetch('/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      this.processUploadResult(data);
      VZ.utils.notify('Project loaded from URL', 'success');
    } catch (err) {
      VZ.utils.notify(err.message, 'error');
    } finally {
      this.loading = false;
    }
  },

  processUploadResult(data) {
    this.fileStructure = data.fileStructure;
    this.currentFilename = data.filename;
    this.importantFiles = data.importantFiles || [];
    this.expandedFolders = {};
    this.selectedFiles = [];
    if (this.fileStructure) {
      Object.keys(this.fileStructure).forEach(key => {
        if (this.fileStructure[key].type === 'directory') {
          this.expandedFolders[key] = true;
        }
      });
    }
    if (this.config.autoSelectImportant && this.importantFiles.length > 0) {
      this.selectedFiles = [...this.importantFiles];
    }
    this.updateTokenCount();
    this.fetchUploads();
    this.saveSession();
  },

  async fetchUploads() {
    try {
      const res = await fetch('/uploads');
      this.uploadedFiles = await res.json();
    } catch (err) {
      console.error('Fetch uploads failed:', err);
    }
  },

  async deleteUpload(filename) {
    try {
      await fetch(`/upload/${filename}`, { method: 'DELETE' });
      this.fetchUploads();
      if (this.currentFilename === filename) {
        this.fileStructure = null;
        this.selectedFiles = [];
        this.currentFilename = null;
      }
      VZ.utils.notify('Deleted', 'success');
    } catch (err) {
      VZ.utils.notify('Delete failed', 'error');
    }
  },

  async reopenProject(filename) {
    this.loading = true;
    try {
      const res = await fetch(`/reopen/${filename}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      this.processUploadResult(data);
    } catch (err) {
      VZ.utils.notify(err.message, 'error');
    } finally {
      this.loading = false;
    }
  },

  // ============================================
  // GITHUB AUTHENTICATION
  // ============================================

  async checkAuthStatus() {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      this.githubAuth = {
        authenticated: data.authenticated || false,
        user: data.user || null
      };
    } catch (err) {
      console.error('Failed to check auth status:', err);
      this.githubAuth = { authenticated: false, user: null };
    }
  },

  loginWithGitHub() {
    window.location.href = '/auth/github';
  },

  async logout() {
    try {
      await fetch('/auth/logout');
      this.githubAuth = { authenticated: false, user: null };
      this.userRepos = [];
      VZ.utils.notify('Logged out', 'success');
    } catch (err) {
      VZ.utils.notify('Logout failed', 'error');
    }
  },

  async fetchUserRepos() {
    if (!this.githubAuth.authenticated) {
      VZ.utils.notify('Please sign in first', 'warning');
      return;
    }

    this.loadingRepos = true;
    try {
      const res = await fetch('/api/repos?per_page=50&type=all');
      if (!res.ok) {
        if (res.status === 401) {
          this.githubAuth = { authenticated: false, user: null };
          VZ.utils.notify('Session expired. Please sign in again.', 'warning');
          return;
        }
        throw new Error('Failed to fetch repositories');
      }
      this.userRepos = await res.json();
      VZ.utils.notify(`Found ${this.userRepos.length} repositories`, 'success');
    } catch (err) {
      VZ.utils.notify(err.message, 'error');
    } finally {
      this.loadingRepos = false;
    }
  },

  async selectRepo(repo) {
    this.githubUrl = repo.clone_url;
    this.githubBranch = repo.default_branch || 'main';
    VZ.utils.notify(`Selected: ${repo.full_name}`, 'info');

    // Auto-clone on selection
    await this.uploadFromGitHub();
  }
};
