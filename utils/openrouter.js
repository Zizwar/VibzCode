import OpenAI from 'openai';

/**
 * OpenRouter AI Integration
 * Supports multiple AI models through OpenRouter API
 */
class OpenRouterClient {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.defaultModel = process.env.DEFAULT_AI_MODEL || 'anthropic/claude-3.5-sonnet';

    if (!this.apiKey) {
      console.warn('⚠️  OPENROUTER_API_KEY not set. AI chat features will be disabled.');
      this.enabled = false;
      return;
    }

    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: this.apiKey,
      defaultHeaders: {
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:8080',
        'X-Title': 'Zip2Prompt'
      }
    });

    this.enabled = true;
    console.log('✅ OpenRouter client initialized');
  }

  /**
   * Available AI models
   */
  getAvailableModels() {
    return [
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        contextWindow: 200000,
        recommended: true
      },
      {
        id: 'anthropic/claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'Anthropic',
        contextWindow: 200000
      },
      {
        id: 'openai/gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'OpenAI',
        contextWindow: 128000
      },
      {
        id: 'openai/gpt-4',
        name: 'GPT-4',
        provider: 'OpenAI',
        contextWindow: 8192
      },
      {
        id: 'google/gemini-pro-1.5',
        name: 'Gemini Pro 1.5',
        provider: 'Google',
        contextWindow: 1000000
      },
      {
        id: 'mistralai/mistral-large',
        name: 'Mistral Large',
        provider: 'Mistral AI',
        contextWindow: 32000
      }
    ];
  }

  /**
   * Send a chat message to AI
   * @param {Array} messages - Array of message objects [{role, content}]
   * @param {String} model - Model ID
   * @param {Boolean} stream - Enable streaming
   * @returns {Promise} AI response
   */
  async chat(messages, model = null, stream = false) {
    if (!this.enabled) {
      throw new Error('OpenRouter is not configured. Please set OPENROUTER_API_KEY.');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: model || this.defaultModel,
        messages: messages,
        stream: stream,
        temperature: 0.7,
        max_tokens: 4096
      });

      if (stream) {
        return response;
      }

      return {
        content: response.choices[0].message.content,
        model: response.model,
        usage: response.usage,
        finishReason: response.choices[0].finish_reason
      };
    } catch (error) {
      console.error('OpenRouter API Error:', error.message);
      throw new Error(`AI chat failed: ${error.message}`);
    }
  }

  /**
   * Analyze project code with AI
   * @param {String} projectContext - Project files content
   * @param {String} analysisType - Type of analysis (security, performance, general)
   * @returns {Promise} Analysis results
   */
  async analyzeProject(projectContext, analysisType = 'general') {
    const systemPrompts = {
      general: `You are an expert code analyst. Analyze the following project and provide:
1. Technologies and frameworks used
2. Project architecture and structure
3. Code quality assessment
4. Potential improvements`,

      security: `You are a security expert. Analyze the following code for:
1. Security vulnerabilities
2. Hard-coded secrets or credentials
3. Unsafe practices
4. OWASP Top 10 issues
5. Recommendations for fixes`,

      performance: `You are a performance optimization expert. Analyze the code for:
1. Performance bottlenecks
2. Inefficient algorithms or queries
3. Resource usage issues
4. Optimization opportunities
5. Best practices for improvement`
    };

    const messages = [
      {
        role: 'system',
        content: systemPrompts[analysisType] || systemPrompts.general
      },
      {
        role: 'user',
        content: `Project Code:\n\n${projectContext}`
      }
    ];

    return await this.chat(messages);
  }

  /**
   * Generate documentation for code
   * @param {String} codeContent - Code to document
   * @returns {Promise} Generated documentation
   */
  async generateDocumentation(codeContent) {
    const messages = [
      {
        role: 'system',
        content: 'You are a technical documentation expert. Generate comprehensive documentation for the provided code.'
      },
      {
        role: 'user',
        content: `Generate documentation for this code:\n\n${codeContent}`
      }
    ];

    return await this.chat(messages);
  }

  /**
   * AI Agents - Specialized prompts for different tasks
   */
  getAgentPrompt(agentType) {
    const agents = {
      security: {
        name: 'Security Analyzer',
        systemPrompt: `You are a cybersecurity expert specializing in code security analysis.
Your role is to identify vulnerabilities, security risks, and provide actionable fixes.
Focus on OWASP Top 10, authentication issues, injection attacks, and data exposure.`,
        icon: '🔒'
      },
      performance: {
        name: 'Performance Optimizer',
        systemPrompt: `You are a performance optimization expert.
Analyze code for bottlenecks, inefficient algorithms, memory leaks, and optimization opportunities.
Provide specific recommendations with code examples.`,
        icon: '⚡'
      },
      documentation: {
        name: 'Documentation Generator',
        systemPrompt: `You are a technical writer specializing in code documentation.
Generate clear, comprehensive documentation including function descriptions, parameters, examples, and usage guides.`,
        icon: '📚'
      },
      refactoring: {
        name: 'Refactoring Expert',
        systemPrompt: `You are a clean code expert.
Suggest refactoring to improve readability, maintainability, and adherence to best practices.
Apply SOLID principles and design patterns where appropriate.`,
        icon: '🔄'
      },
      testing: {
        name: 'Testing Agent',
        systemPrompt: `You are a test automation expert.
Generate unit tests, integration tests, and suggest test cases.
Focus on edge cases, error handling, and comprehensive coverage.`,
        icon: '🧪'
      }
    };

    return agents[agentType] || agents.security;
  }

  /**
   * Run specialized AI agent
   * @param {String} agentType - Type of agent (security, performance, etc.)
   * @param {String} codeContent - Code to analyze
   * @returns {Promise} Agent analysis
   */
  async runAgent(agentType, codeContent) {
    const agent = this.getAgentPrompt(agentType);

    const messages = [
      {
        role: 'system',
        content: agent.systemPrompt
      },
      {
        role: 'user',
        content: codeContent
      }
    ];

    return await this.chat(messages);
  }
}

// Export singleton instance
export default new OpenRouterClient();
