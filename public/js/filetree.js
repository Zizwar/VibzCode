window.VZ = window.VZ || {};

VZ.filetree = {
  expandedFolders: {},
  fileSearchQuery: '',

  toggleFolder(p) {
    this.expandedFolders[p] = !this.expandedFolders[p];
  },

  toggleFile(filePath) {
    const idx = this.selectedFiles.indexOf(filePath);
    if (idx > -1) this.selectedFiles.splice(idx, 1);
    else this.selectedFiles.push(filePath);
    this.updateTokenCount();
    this.saveSession();
  },

  isFileSelected(filePath) {
    return this.selectedFiles.includes(filePath);
  },

  selectAllFiles() {
    let files = this.getAllFilePaths(this.fileStructure);
    if (this.excludeMediaFiles) files = files.filter(f => !VZ.utils.isMediaFile(f));
    this.selectedFiles = files;
    this.updateTokenCount();
  },

  deselectAllFiles() {
    this.selectedFiles = [];
    this.updateTokenCount();
  },

  selectImportantFiles() {
    this.selectedFiles = [...this.importantFiles];
    this.updateTokenCount();
  },

  getAllFilePaths(structure) {
    const files = [];
    if (!structure) return files;
    for (const [, item] of Object.entries(structure)) {
      if (item.type === 'file') files.push(item.path);
      else if (item.type === 'directory' && item.children)
        files.push(...this.getAllFilePaths(item.children));
    }
    return files;
  },

  getFileCount() {
    return this.getAllFilePaths(this.fileStructure).length;
  },

  renderTree(structure, parentPath, depth) {
    parentPath = parentPath || '';
    depth = depth || 0;
    if (!structure) return '';
    let html = '';
    const entries = Object.entries(structure).sort((a, b) => {
      const da = a[1].type === 'directory' ? 0 : 1;
      const db = b[1].type === 'directory' ? 0 : 1;
      if (da !== db) return da - db;
      return a[0].localeCompare(b[0]);
    });

    for (const [name, item] of entries) {
      const fullPath = parentPath ? parentPath + '/' + name : name;
      const q = this.fileSearchQuery?.toLowerCase();

      if (item.type === 'directory') {
        const childFiles = this.getAllFilePaths(item.children);
        if (q && !childFiles.some(f => f.toLowerCase().includes(q)) && !name.toLowerCase().includes(q)) continue;
        const isExp = this.expandedFolders[fullPath];
        const total = childFiles.length;
        const sel = childFiles.filter(f => this.selectedFiles.includes(f)).length;

        html += '<div style="padding-left:' + (depth * 14) + 'px">'
          + '<div class="flex items-center gap-1 py-0.5 hover:bg-base-300 rounded cursor-pointer" '
          + 'onclick="window._vz.toggleFolder(\'' + fullPath.replace(/'/g, "\\'") + '\')">'
          + '<i class="fas fa-chevron-right text-[10px] w-3.5 text-center transition-transform duration-150'
          + (isExp ? ' rotate-90' : '') + '"></i>'
          + '<i class="fas ' + (isExp ? 'fa-folder-open text-warning' : 'fa-folder text-warning/70') + ' text-sm"></i>'
          + '<span class="text-sm flex-1 truncate">' + this._esc(name) + '</span>'
          + '<span class="text-[10px] opacity-40 pr-1">' + (sel ? sel + '/' : '') + total + '</span>'
          + '</div>';

        if (isExp && item.children) {
          html += this.renderTree(item.children, fullPath, depth + 1);
        }
        html += '</div>';
      } else {
        if (q && !name.toLowerCase().includes(q) && !item.path.toLowerCase().includes(q)) continue;
        const isSel = this.selectedFiles.includes(item.path);
        const isImp = this.importantFiles.includes(item.path);
        const icon = VZ.utils.getFileIcon(item.path);
        const escapedPath = item.path.replace(/'/g, "\\'");

        html += '<div style="padding-left:' + (depth * 14) + 'px">'
          + '<label class="flex items-center gap-1.5 py-0.5 px-1 hover:bg-base-300 rounded cursor-pointer group">'
          + '<input type="checkbox" class="checkbox checkbox-xs checkbox-primary" '
          + (isSel ? 'checked ' : '')
          + 'onchange="window._vz.toggleFile(\'' + escapedPath + '\')" onclick="event.stopPropagation()">'
          + '<i class="' + icon + ' text-xs"></i>'
          + '<span class="text-sm flex-1 truncate' + (isImp ? ' font-semibold' : '') + '">' + this._esc(name) + '</span>'
          + (isImp ? '<i class="fas fa-star text-warning text-[10px]"></i>' : '')
          + '<button class="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 min-h-0 h-5 px-1" '
          + 'onclick="event.preventDefault();event.stopPropagation();window._vz.previewFile(\'' + escapedPath + '\')">'
          + '<i class="fas fa-eye text-[10px]"></i></button>'
          + '</label></div>';
      }
    }
    return html;
  },

  _esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  },

  async previewFile(filePath) {
    if (!this.currentFilename) return;
    try {
      const res = await fetch('/file-preview/' + this.currentFilename + '/' + filePath);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      this.previewContent = data.content;
      this.previewPath = filePath;
      this.showPreview = true;
      this.$nextTick(() => {
        const el = document.getElementById('preview-code');
        if (el) {
          el.textContent = data.content;
          el.removeAttribute('data-highlighted');
          delete el.dataset.highlighted;
          hljs.highlightElement(el);
        }
      });
    } catch (err) {
      VZ.utils.notify('Preview failed', 'error');
    }
  },

  getFileStructureText(structure, prefix) {
    prefix = prefix || '';
    if (!structure) return '';
    let text = '';
    const entries = Object.entries(structure).sort((a, b) => {
      const da = a[1].type === 'directory' ? 0 : 1;
      const db = b[1].type === 'directory' ? 0 : 1;
      if (da !== db) return da - db;
      return a[0].localeCompare(b[0]);
    });
    entries.forEach(([name, item], i) => {
      const isLast = i === entries.length - 1;
      text += prefix + (isLast ? '\u2514\u2500\u2500 ' : '\u251C\u2500\u2500 ') + name + '\n';
      if (item.type === 'directory' && item.children) {
        text += this.getFileStructureText(item.children, prefix + (isLast ? '    ' : '\u2502   '));
      }
    });
    return text;
  }
};
