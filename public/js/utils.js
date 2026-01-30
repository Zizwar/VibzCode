window.VZ = window.VZ || {};

VZ.utils = {
  estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  },

  formatTokens(count) {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  },

  formatFileSize(bytes) {
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  },

  isMediaFile(filePath) {
    const exts = ['.png','.jpg','.jpeg','.gif','.bmp','.svg','.ico','.webp',
      '.mp4','.webm','.ogg','.mp3','.wav','.flac','.woff','.woff2','.ttf','.eot',
      '.pdf','.zip','.tar','.gz','.rar','.exe','.dll','.so','.dylib','.pyc','.o'];
    const ext = '.' + filePath.toLowerCase().split('.').pop();
    return exts.includes(ext);
  },

  getFileIcon(filePath) {
    const ext = filePath.toLowerCase().split('.').pop();
    const icons = {
      js:'fab fa-js text-yellow-400', ts:'fab fa-js text-blue-400',
      jsx:'fab fa-react text-cyan-400', tsx:'fab fa-react text-cyan-400',
      py:'fab fa-python text-green-400', html:'fab fa-html5 text-orange-400',
      css:'fab fa-css3-alt text-blue-400', json:'fas fa-cog text-gray-400',
      md:'fas fa-file-alt text-gray-400', yml:'fas fa-file-code text-purple-400',
      yaml:'fas fa-file-code text-purple-400', sh:'fas fa-terminal text-green-400',
      sql:'fas fa-database text-blue-400', go:'fas fa-code text-cyan-400',
      rs:'fas fa-code text-orange-400', java:'fab fa-java text-red-400',
      php:'fab fa-php text-indigo-400', vue:'fab fa-vuejs text-green-400',
      rb:'fas fa-gem text-red-400', toml:'fas fa-cog text-gray-400',
      lock:'fas fa-lock text-gray-500', env:'fas fa-key text-yellow-500'
    };
    return icons[ext] || 'fas fa-file text-base-content/50';
  },

  getLanguage(filePath) {
    const ext = filePath.toLowerCase().split('.').pop();
    const langs = {
      js:'javascript', ts:'typescript', jsx:'javascript', tsx:'typescript',
      py:'python', html:'html', css:'css', json:'json', md:'markdown',
      yml:'yaml', yaml:'yaml', sh:'bash', sql:'sql', go:'go',
      rs:'rust', java:'java', rb:'ruby', php:'php', xml:'xml',
      toml:'toml', ini:'ini', env:'bash'
    };
    return langs[ext] || 'plaintext';
  },

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    }
  },

  notify(msg, type = 'info', duration = 3000) {
    const id = Date.now() + Math.random();
    window.dispatchEvent(new CustomEvent('vz-notify', {
      detail: { id, msg, type, duration }
    }));
    return id;
  }
};
