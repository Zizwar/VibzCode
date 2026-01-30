import OpenAI from 'openai';

class OpenRouterClient {
  constructor() {
    this.init();
  }

  init() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.defaultModel = process.env.DEFAULT_AI_MODEL || 'openai/gpt-5.1-codex-mini';

    if (!this.apiKey) {
      this.enabled = false;
      return;
    }

    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: this.apiKey,
      defaultHeaders: {
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:8080',
        'X-Title': 'VibZcode'
      }
    });

    this.enabled = true;
  }

  reinit() {
    this.init();
  }

  async chat(messages, model = null) {
    if (!this.enabled) throw new Error('OpenRouter not configured.');

    try {
      const response = await this.client.chat.completions.create({
        model: model || this.defaultModel,
        messages,
        temperature: 0.7,
        max_tokens: 4096
      });

      return {
        content: response.choices[0].message.content,
        model: response.model,
        usage: response.usage,
        finishReason: response.choices[0].finish_reason
      };
    } catch (error) {
      console.error('OpenRouter API Error:', error.message);
      throw new Error(`AI request failed: ${error.message}`);
    }
  }

  async analyzeProject(projectContext, analysisType = 'general') {
    const systemPrompts = {
      general: 'You are an expert code analyst. Analyze the project: technologies, architecture, quality, improvements.',
      security: 'You are a security expert. Find vulnerabilities, hard-coded secrets, unsafe practices, OWASP Top 10 issues.',
      performance: 'You are a performance expert. Find bottlenecks, inefficient code, optimization opportunities.'
    };

    return await this.chat([
      { role: 'system', content: systemPrompts[analysisType] || systemPrompts.general },
      { role: 'user', content: `Project Code:\n\n${projectContext}` }
    ]);
  }

  async generateDocumentation(codeContent) {
    return await this.chat([
      { role: 'system', content: 'Generate comprehensive documentation for the provided code.' },
      { role: 'user', content: `Generate documentation:\n\n${codeContent}` }
    ]);
  }

  getAgentPrompt(agentType) {
    const agents = {
      security: { systemPrompt: 'You are a cybersecurity expert. Identify vulnerabilities and provide fixes. Focus on OWASP Top 10.' },
      performance: { systemPrompt: 'You are a performance expert. Find bottlenecks, memory leaks, and suggest optimizations with code examples.' },
      documentation: { systemPrompt: 'You are a technical writer. Generate clear documentation with function descriptions, parameters, and examples.' },
      refactoring: { systemPrompt: 'You are a clean code expert. Suggest refactoring using SOLID principles and design patterns.' },
      testing: { systemPrompt: 'You are a test automation expert. Generate unit tests focusing on edge cases and comprehensive coverage.' }
    };
    return agents[agentType] || agents.security;
  }

  async runAgent(agentType, codeContent) {
    const agent = this.getAgentPrompt(agentType);
    return await this.chat([
      { role: 'system', content: agent.systemPrompt },
      { role: 'user', content: codeContent }
    ]);
  }
}

export default new OpenRouterClient();
