export class GridManager {
  constructor(app) {
    this.app = app;
    this.grid = document.getElementById('iconGrid');
    this.empty = document.getElementById('gridEmpty');
    this.loading = document.getElementById('gridLoading');
    this.pagination = document.getElementById('pagination');

    this.tplIcon = document.getElementById('tpl-icon-card');
    this.tplCommon = document.getElementById('tpl-common-card');
    this.tplPageBtn = document.getElementById('tpl-page-btn');
  }

  render(icons) {
    this.loading.style.display = 'none';

    if (icons.length === 0) {
      this.grid.innerHTML = '';
      this.empty.style.display = '';
      this.pagination.innerHTML = '';
      return;
    }

    this.empty.style.display = 'none';

    const { page, perPage } = this.app.state;
    const totalPages = Math.ceil(icons.length / perPage);
    const start = (page - 1) * perPage;
    const pageIcons = icons.slice(start, start + perPage);

    this.renderGrid(pageIcons);
    this.renderPagination(totalPages, icons.length);
  }

  renderGrid(icons) {
    const isCommon = this.app.state.theme === 'common';
    const frag = document.createDocumentFragment();

    icons.forEach((icon) => {
      frag.appendChild(isCommon ? this.createCommonCard(icon) : this.createIconCard(icon));
    });

    this.grid.innerHTML = '';
    this.grid.appendChild(frag);
  }

  createIconCard(icon) {
    const clone = this.tplIcon.content.cloneNode(true);
    const card = clone.querySelector('.icon-card');
    const img = clone.querySelector('img');
    const name = clone.querySelector('.icon-name');

    card.dataset.name = icon.name;
    img.src = this.getBestImage(icon);
    img.alt = icon.name;
    img.onerror = () => {
      img.src = this.getFallbackImage(icon);
    };
    name.textContent = icon.name;

    if (icon.themes && icon.themes.length > 1) {
      const badges = document.createElement('div');
      badges.className = 'icon-badges';
      if (icon.themes.includes('adwaita')) {
        badges.innerHTML += '<span class="icon-badge adwaita">A</span>';
      }
      if (icon.themes.includes('breeze')) {
        badges.innerHTML += '<span class="icon-badge breeze">B</span>';
      }
      card.appendChild(badges);
    }

    card.addEventListener('click', () => {
      this.app.modal.open(icon);
    });
    return clone;
  }

  createCommonCard(icon) {
    const clone = this.tplCommon.content.cloneNode(true);
    const card = clone.querySelector('.icon-card-common');
    const imgs = clone.querySelectorAll('img');
    const name = clone.querySelector('.icon-name');

    imgs[0].src = this.getThemeImage(icon, 'adwaita');
    imgs[0].alt = `${icon.name} (Adwaita)`;
    imgs[0].onerror = () => {
      imgs[0].style.visibility = 'hidden';
    };

    imgs[1].src = this.getThemeImage(icon, 'breeze');
    imgs[1].alt = `${icon.name} (Breeze)`;
    imgs[1].onerror = () => {
      imgs[1].style.visibility = 'hidden';
    };

    name.textContent = icon.name;

    card.addEventListener('click', () => {
      this.app.modal.open(icon);
    });
    return clone;
  }

  getThemeImage(icon, theme) {
    const data = theme === 'adwaita' ? icon.adwaita : icon.breeze;
    if (!data) return '';

    const sizeOrder = ['scalable', '48', '32', '24', '22', '16', '64', '96', '128', '256'];

    for (const size of sizeOrder) {
      if (data.sizes[size]) {
        if (data.sizes[size].svg) return this.app.getIconUrl(theme, data.sizes[size].svg);
        if (data.sizes[size].png) return this.app.getIconUrl(theme, data.sizes[size].png);
      }
    }

    for (const sizeInfo of Object.values(data.sizes)) {
      if (sizeInfo.svg) return this.app.getIconUrl(theme, sizeInfo.svg);
      if (sizeInfo.png) return this.app.getIconUrl(theme, sizeInfo.png);
    }

    return '';
  }

  getBestImage(icon) {
    const sizeOrder = ['scalable', '48', '32', '24', '22', '16', '64', '96', '128', '256'];
    const themes = icon.themes || ['adwaita', 'breeze'];

    for (const theme of themes) {
      const data =
        theme === 'adwaita'
          ? icon.adwaita || this.app.data.adwaita[icon.name]
          : icon.breeze || this.app.data.breeze[icon.name];

      if (!data) continue;

      for (const size of sizeOrder) {
        if (data.sizes[size]) {
          if (data.sizes[size].svg) return this.app.getIconUrl(theme, data.sizes[size].svg);
          if (data.sizes[size].png) return this.app.getIconUrl(theme, data.sizes[size].png);
        }
      }
    }

    return '';
  }

  getFallbackImage(icon) {
    const themes = icon.themes || ['adwaita', 'breeze'];

    for (const theme of themes) {
      const data =
        theme === 'adwaita'
          ? icon.adwaita || this.app.data.adwaita[icon.name]
          : icon.breeze || this.app.data.breeze[icon.name];

      if (!data) continue;

      for (const sizeInfo of Object.values(data.sizes)) {
        if (sizeInfo.svg) return this.app.getIconUrl(theme, sizeInfo.svg);
        if (sizeInfo.png) return this.app.getIconUrl(theme, sizeInfo.png);
      }
    }

    return '';
  }

  renderPagination(totalPages, totalIcons) {
    if (totalPages <= 1) {
      this.pagination.innerHTML = `<span class="page-info">${totalIcons} icons</span>`;
      return;
    }

    const { page } = this.app.state;
    const frag = document.createDocumentFragment();

    const info = document.createElement('span');
    info.className = 'page-info';
    info.textContent = `${totalIcons} icons`;
    frag.appendChild(info);

    const addBtn = (p, label, active) => {
      const btn = this.tplPageBtn.content.cloneNode(true).querySelector('button');
      btn.textContent = label;
      btn.dataset.page = p;
      if (active) btn.classList.add('active');
      btn.addEventListener('click', () => {
        this.app.state.page = p;
        this.app.render();
        window.scrollTo(0, 0);
      });
      frag.appendChild(btn);
    };

    if (page > 1) addBtn(page - 1, '<');

    const range = this.getPageRange(page, totalPages);
    for (const p of range) {
      if (p === '...') {
        const dots = document.createElement('span');
        dots.className = 'page-info';
        dots.textContent = '...';
        frag.appendChild(dots);
      } else {
        addBtn(p, p, p === page);
      }
    }

    if (page < totalPages) addBtn(page + 1, '>');

    this.pagination.innerHTML = '';
    this.pagination.appendChild(frag);
  }

  getPageRange(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages = [];
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...', total);
    } else if (current >= total - 3) {
      pages.push(1, '...');
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }
    return pages;
  }
}
