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
      if (res.ok) this.envConfig = await res.json();
    } catch (err) {
      console.error('Fetch env failed:', err);
    }
  },

  async updateEnvConfig(key, value) {
    try {
      await fetch('/api/config/env', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });
      VZ.utils.notify('Updated', 'success');
    } catch (err) {
      VZ.utils.notify('Update failed', 'error');
    }
  }
};
