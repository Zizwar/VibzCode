/**
 * Smart Chat Examples & Quick Actions
 * أمثلة وإجراءات سريعة للدردشة الذكية
 */

window.VZ = window.VZ || {};

VZ.smartChatExamples = {
  /**
   * Example questions categorized by use case
   */
  examples: {
    understanding: [
      "ما هو هذا المشروع؟",
      "What is this project about?",
      "اشرح البنية العامة للكود",
      "Explain the overall code structure",
      "ما هي التقنيات المستخدمة؟",
      "What technologies are used?"
    ],

    exploration: [
      "ماذا يوجد في مجلد src؟",
      "What's in the components folder?",
      "أين ملفات API؟",
      "Where are the API files?",
      "اعرض الملفات المهمة",
      "Show important files"
    ],

    fileReading: [
      "اقرأ ملف package.json",
      "Read package.json",
      "افتح server.js واشرحه",
      "Open and explain server.js",
      "أرني محتوى README",
      "Show me the README content"
    ],

    security: [
      "هل يوجد مشاكل أمنية؟",
      "Are there any security issues?",
      "راجع التوثيق والترخيص",
      "Review authentication and authorization",
      "تحقق من التعامل مع البيانات الحساسة",
      "Check handling of sensitive data"
    ],

    performance: [
      "كيف يمكن تحسين الأداء؟",
      "How can I improve performance?",
      "هل يوجد استعلامات قاعدة بيانات بطيئة؟",
      "Are there any slow database queries?",
      "اقترح تحسينات للكود",
      "Suggest code optimizations"
    ],

    architecture: [
      "اشرح معماريةالمشروع",
      "Explain the project architecture",
      "كيف تتصل المكونات ببعضها؟",
      "How do components connect to each other?",
      "ما هو نمط التصميم المستخدم؟",
      "What design pattern is used?"
    ],

    dependencies: [
      "ما هي المكتبات الخارجية المستخدمة؟",
      "What external libraries are used?",
      "اشرح التبعيات في package.json",
      "Explain dependencies in package.json",
      "هل هناك تبعيات قديمة تحتاج تحديث؟",
      "Are there outdated dependencies?"
    ],

    testing: [
      "هل يوجد اختبارات؟",
      "Are there any tests?",
      "اقترح اختبارات لملف X",
      "Suggest tests for file X",
      "ما هي تغطية الاختبارات؟",
      "What's the test coverage?"
    ]
  },

  /**
   * Quick action templates
   */
  quickActions: [
    {
      id: 'project-overview',
      label: 'نظرة عامة',
      icon: 'fa-info-circle',
      prompt: 'أعطني نظرة عامة شاملة عن هذا المشروع: ما هو، ما التقنيات المستخدمة، البنية الأساسية، والملفات الرئيسية.'
    },
    {
      id: 'security-audit',
      label: 'فحص أمني',
      icon: 'fa-shield-halved',
      prompt: 'قم بفحص أمني شامل للمشروع. ابحث عن: ثغرات OWASP Top 10، بيانات حساسة مكشوفة، مشاكل في التوثيق، وأي مخاطر أمنية أخرى.'
    },
    {
      id: 'code-quality',
      label: 'جودة الكود',
      icon: 'fa-code-compare',
      prompt: 'راجع جودة الكود في المشروع. ركز على: قابلية القراءة، الصيانة، التكرار، مبادئ SOLID، وأفضل الممارسات.'
    },
    {
      id: 'performance-analysis',
      label: 'تحليل الأداء',
      icon: 'fa-gauge-high',
      prompt: 'حلل أداء المشروع. ابحث عن: عمليات بطيئة، استعلامات غير محسّنة، تسريبات ذاكرة محتملة، وفرص التحسين.'
    },
    {
      id: 'documentation',
      label: 'توثيق',
      icon: 'fa-book',
      prompt: 'راجع التوثيق الموجود واقترح تحسينات. اذكر الأجزاء غير الموثقة والتي تحتاج توضيح.'
    },
    {
      id: 'dependencies-check',
      label: 'فحص التبعيات',
      icon: 'fa-cubes',
      prompt: 'افحص التبعيات في المشروع. اذكر: النسخ القديمة، الثغرات الأمنية المعروفة، والتبعيات غير المستخدمة.'
    },
    {
      id: 'api-endpoints',
      label: 'نقاط API',
      icon: 'fa-route',
      prompt: 'استخرج جميع نقاط API (endpoints) في المشروع واشرح كل منها: المسار، الطريقة (GET/POST/..)، المعاملات، والوظيفة.'
    },
    {
      id: 'folder-structure',
      label: 'بنية المجلدات',
      icon: 'fa-folder-tree',
      prompt: 'اشرح بنية المجلدات والملفات في المشروع. وضح الغرض من كل مجلد رئيسي والنمط المستخدم في التنظيم.'
    }
  ],

  /**
   * Get random example from category
   */
  getRandomExample(category) {
    const examples = this.examples[category];
    if (!examples || examples.length === 0) return null;
    return examples[Math.floor(Math.random() * examples.length)];
  },

  /**
   * Get all categories
   */
  getCategories() {
    return Object.keys(this.examples);
  },

  /**
   * Search examples by keyword
   */
  searchExamples(keyword) {
    const results = [];
    const lowerKeyword = keyword.toLowerCase();

    for (const [category, examples] of Object.entries(this.examples)) {
      const matches = examples.filter(ex =>
        ex.toLowerCase().includes(lowerKeyword)
      );
      if (matches.length > 0) {
        results.push({ category, examples: matches });
      }
    }

    return results;
  },

  /**
   * Suggest next question based on conversation
   */
  suggestNextQuestion(chatHistory) {
    if (chatHistory.length === 0) {
      return this.examples.understanding[0]; // "ما هو هذا المشروع؟"
    }

    const lastMessage = chatHistory[chatHistory.length - 1];

    // Simple logic to suggest relevant questions
    if (lastMessage.content.includes('project')) {
      return this.getRandomExample('exploration');
    } else if (lastMessage.content.includes('folder') || lastMessage.content('مجلد')) {
      return this.getRandomExample('fileReading');
    } else if (lastMessage.content.includes('security') || lastMessage.content.includes('أمن')) {
      return this.getRandomExample('security');
    } else {
      // Random suggestion
      const categories = this.getCategories();
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      return this.getRandomExample(randomCategory);
    }
  },

  /**
   * Get starter questions for new projects
   */
  getStarterQuestions() {
    return [
      "ما هو هذا المشروع؟",
      "اشرح البنية الأساسية",
      "ما هي الملفات المهمة؟",
      "هل يوجد مشاكل يجب الانتباه لها؟"
    ];
  },

  /**
   * Context-aware suggestions
   */
  getContextSuggestions(fileStructure) {
    const suggestions = [];

    if (!fileStructure) return suggestions;

    // Check for common folders
    const folders = this.extractFolders(fileStructure);

    if (folders.includes('src') || folders.includes('source')) {
      suggestions.push("ماذا يوجد في مجلد src؟");
    }

    if (folders.includes('components')) {
      suggestions.push("اشرح المكونات الرئيسية");
    }

    if (folders.includes('api') || folders.includes('routes')) {
      suggestions.push("ما هي نقاط API المتاحة؟");
    }

    if (folders.includes('tests') || folders.includes('__tests__')) {
      suggestions.push("راجع الاختبارات الموجودة");
    }

    if (folders.includes('config') || folders.includes('configuration')) {
      suggestions.push("اشرح ملفات الإعدادات");
    }

    return suggestions;
  },

  /**
   * Extract folder names from structure
   */
  extractFolders(structure, folders = []) {
    for (const [name, node] of Object.entries(structure)) {
      if (node.type === 'directory') {
        folders.push(name);
        if (node.children) {
          this.extractFolders(node.children, folders);
        }
      }
    }
    return folders;
  }
};
