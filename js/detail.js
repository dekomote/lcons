export class DetailModal {
  constructor(app) {
    this.app = app;
    this.modal = document.getElementById('detailModal');
    this.title = document.getElementById('modalTitle');
    this.preview = document.getElementById('modalPreview');
    this.details = document.getElementById('modalDetails');

    this.tplPreview = document.getElementById('tpl-preview-item');
    this.tplInfo = document.getElementById('tpl-info-section');
    this.tplTheme = document.getElementById('tpl-theme-section');
    this.tplSizeChip = document.getElementById('tpl-size-chip');
    this.tplPaths = document.getElementById('tpl-paths-section');
    this.tplPathRow = document.getElementById('tpl-path-row');
  }

  open(icon) {
    this.title.textContent = icon.name;
    this.renderPreview(icon);
    this.renderDetails(icon);
    this.modal.style.display = '';
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  renderPreview(icon) {
    this.preview.innerHTML = '';
    const themes = icon.themes || ['adwaita', 'breeze'];

    for (const theme of themes) {
      const data = this.getThemeData(icon, theme);
      if (!data) continue;

      const clone = this.tplPreview.content.cloneNode(true);
      const img = clone.querySelector('img');
      const label = clone.querySelector('.preview-label');

      img.src = this.getBestImage(data, theme);
      img.alt = `${icon.name} - ${theme}`;
      label.textContent = theme === 'adwaita' ? 'Adwaita' : 'Breeze';

      this.preview.appendChild(clone);
    }
  }

  renderDetails(icon) {
    this.details.innerHTML = '';
    const themes = icon.themes || ['adwaita', 'breeze'];

    // Info section
    const infoClone = this.tplInfo.content.cloneNode(true);
    infoClone.querySelector('[data-field="name"]').textContent = icon.name;
    infoClone.querySelector('[data-field="category"]').textContent = icon.category || '-';
    infoClone.querySelector('[data-field="themes"]').textContent = themes.join(', ');
    this.details.appendChild(infoClone);

    // Theme sections
    for (const theme of themes) {
      const data = this.getThemeData(icon, theme);
      if (!data) continue;

      const themeClone = this.tplTheme.content.cloneNode(true);
      themeClone.querySelector('[data-field="label"]').textContent = theme === 'adwaita' ? 'ADWAITA' : 'BREEZE';
      themeClone.querySelector('[data-field="category"]').textContent = data.category || '-';

      const sizeGrid = themeClone.querySelector('[data-field="sizes"]');
      for (const [size, files] of Object.entries(data.sizes)) {
        const chip = this.tplSizeChip.content.cloneNode(true);
        chip.querySelector('.size-label').textContent = size;
        chip.querySelector('.size-icons').textContent = Object.keys(files).join(', ');
        sizeGrid.appendChild(chip);
      }

      this.details.appendChild(themeClone);

      // Paths
      if (data.paths && data.paths.length > 0) {
        const pathsClone = this.tplPaths.content.cloneNode(true);
        const pathsContainer = pathsClone.querySelector('[data-field="paths"]');

        data.paths.slice(0, 10).forEach((p) => {
          const row = this.tplPathRow.content.cloneNode(true);
          row.querySelector('.detail-value').textContent = p;
          pathsContainer.appendChild(row);
        });

        if (data.paths.length > 10) {
          const row = this.tplPathRow.content.cloneNode(true);
          row.querySelector('.detail-value').textContent = `... and ${data.paths.length - 10} more`;
          pathsContainer.appendChild(row);
        }

        this.details.appendChild(pathsClone);
      }
    }
  }

  getThemeData(icon, theme) {
    if (theme === 'adwaita') {
      return icon.adwaita || this.app.data.adwaita[icon.name];
    }
    return icon.breeze || this.app.data.breeze[icon.name];
  }

  getBestImage(data, theme) {
    const sizeOrder = ['scalable', '48', '32', '24', '22', '16', '64', '96', '128', '256'];

    for (const size of sizeOrder) {
      if (data.sizes[size]) {
        if (data.sizes[size].svg) {
          return this.app.getIconUrl(theme, data.sizes[size].svg);
        }
        if (data.sizes[size].png) {
          return this.app.getIconUrl(theme, data.sizes[size].png);
        }
      }
    }

    for (const sizeInfo of Object.values(data.sizes)) {
      if (sizeInfo.svg) return this.app.getIconUrl(theme, sizeInfo.svg);
      if (sizeInfo.png) return this.app.getIconUrl(theme, sizeInfo.png);
    }

    return '';
  }
}
