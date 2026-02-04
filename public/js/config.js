window.VZ = window.VZ || {};

VZ.configModule = {
  showSettings: false,
  config: {
    maxFileSizeMB: 50,
    defaultModel: 'openai/gpt-5.1-codex-mini',
    enableCache: true,
    autoSelectImportant: true,
    streamResponses: true
  },
  models: [],
  newModelId: '',
  newModelName: '',
  newModelProvider: '',
  envConfig: {},
  tempApiKey: '',
  tempMaxFileSize: null,
  tempDefaultModel: '',
  showApiKey: false,

  enabledModels() {
    return (this.models || []).filter(m => m.enabled);
  },

  async loadConfig() {
    try {
      const [configRes, modelsRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/config/models')
      ]);
      if (configRes.ok) this.config = await configRes.json();
      if (modelsRes.ok) {
        const data = await modelsRes.json();
        this.models = data.models || data;
      }
      this.selectedModel = this.config.defaultModel || (this.models[0]?.id) || '';
      this.enableCache = this.config.enableCache !== false;
    } catch (err) {
      console.error('Load config failed:', err);
    }
  },

  async saveConfig() {
    try {
      await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.config)
      });
      VZ.utils.notify('Settings saved', 'success');
    } catch (err) {
      VZ.utils.notify('Save failed', 'error');
    }
  },

  async addModel() {
    if (!this.newModelId || !this.newModelName) return;
    this.models.push({
      id: this.newModelId,
      name: this.newModelName,
      provider: this.newModelProvider || 'Custom',
      enabled: true
    });
    await this.saveModels();
    this.newModelId = '';
    this.newModelName = '';
    this.newModelProvider = '';
  },

  async removeModel(modelId) {
    this.models = this.models.filter(m => m.id !== modelId);
    await this.saveModels();
  },

  async toggleModelEnabled(modelId) {
    const model = this.models.find(m => m.id === modelId);
    if (model) {
      model.enabled = !model.enabled;
      await this.saveModels();
    }
  },

  async saveModels() {
    try {
      await fetch('/api/config/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ models: this.models })
      });
      VZ.utils.notify('Models updated', 'success');
    } catch (err) {
      VZ.utils.notify('Save models failed', 'error');
    }
  },

  async fetchEnvConfig() {
    try {
      const res = await fetch('/api/config/env');
      if (res.ok) {
        this.envConfig = await res.json();
        // Load API key into temp field on first open
        if (this.envConfig.OPENROUTER_API_KEY && !this.tempApiKey) {
          this.tempApiKey = this.envConfig.OPENROUTER_API_KEY;
        }
        // Load other values
        if (this.envConfig.MAX_FILE_SIZE_MB && !this.tempMaxFileSize) {
          this.tempMaxFileSize = parseInt(this.envConfig.MAX_FILE_SIZE_MB);
        }
        if (this.envConfig.DEFAULT_AI_MODEL && !this.tempDefaultModel) {
          this.tempDefaultModel = this.envConfig.DEFAULT_AI_MODEL;
        }
      }
    } catch (err) {
      console.error('Fetch env failed:', err);
    }
  },

  async updateEnvConfig(key, value) {
    try {
      // Don't send empty values
      if (value === '' || !value) {
        VZ.utils.notify('Please enter a value', 'warning');
        return;
      }

      await fetch('/api/config/env', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });

      // Update local config with new value
      this.envConfig[key] = value;

      VZ.utils.notify('Updated', 'success');

      // Clear temp variables and reload if needed
      if (key === 'OPENROUTER_API_KEY') {
        this.showApiKey = false;
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else if (key === 'MAX_FILE_SIZE_MB') {
        // Keep the value visible after save
      } else if (key === 'DEFAULT_AI_MODEL') {
        // Keep the value visible after save
      }
    } catch (err) {
      VZ.utils.notify('Update failed', 'error');
    }
  }
};
