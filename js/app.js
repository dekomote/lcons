import { GridManager } from './grid.js';
import { DetailModal } from './detail.js';

class App {
  constructor() {
    this.state = {
      theme: 'all', // all | adwaita | breeze | common
      category: 'all',
      size: 'all',
      search: '',
      page: 1,
      perPage: 150,
    };

    this.data = {
      adwaita: {},
      breeze: {},
      common: [],
      meta: {},
    };

    this.grid = new GridManager(this);
    this.modal = new DetailModal(this);

    this.init();
  }

  async init() {
    this.bindControls();
    await this.loadData();
  }

  bindControls() {
    // Search
    const search = document.getElementById('search');
    let debounce;
    search.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        this.state.search = search.value.trim().toLowerCase();
        this.state.page = 1;
        this.render();
      }, 200);
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', (e) => {
      const btn = e.target.closest('.theme-btn');
      if (!btn) return;
      document.querySelectorAll('.theme-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      this.state.theme = btn.dataset.theme;
      this.state.page = 1;
      this.render();
    });

    // Category filter
    document.getElementById('categoryFilter').addEventListener('click', (e) => {
      const btn = e.target.closest('.cat-btn');
      if (!btn) return;
      document.querySelectorAll('.cat-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      this.state.category = btn.dataset.category;
      this.state.page = 1;
      this.render();
    });

    // Size filter
    document.getElementById('sizeFilter').addEventListener('click', (e) => {
      const btn = e.target.closest('.size-btn');
      if (!btn) return;
      document.querySelectorAll('.size-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      this.state.size = btn.dataset.size;
      this.state.page = 1;
      this.render();
    });

    // Modal close
    document.getElementById('modalClose').addEventListener('click', () => this.modal.close());
    document.getElementById('modalBackdrop').addEventListener('click', () => this.modal.close());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.modal.close();
    });
  }

  async loadData() {
    try {
      const [adwaitaRes, breezeRes, commonRes, metaRes] = await Promise.all([
        fetch('data/adwaita-icons.json'),
        fetch('data/breeze-icons.json'),
        fetch('data/common-icons.json'),
        fetch('data/meta.json'),
      ]);

      this.data.adwaita = await adwaitaRes.json();
      this.data.breeze = await breezeRes.json();
      this.data.common = await commonRes.json();
      this.data.meta = await metaRes.json();

      this.buildFilters();
      this.updateStats();
      this.render();
    } catch (err) {
      document.getElementById('gridLoading').innerHTML =
        'ERROR LOADING ICON DATA - RUN download-icons.sh THEN python3 preprocess.py';
      console.error('Failed to load icon data:', err);
    }
  }

  buildFilters() {
    const { categories } = this.data.meta;
    const catFilter = document.getElementById('categoryFilter');
    catFilter.innerHTML = '<button class="cat-btn active" data-category="all">all</button>';
    categories.forEach((cat) => {
      catFilter.innerHTML += `<button class="cat-btn" data-category="${cat}">${cat}</button>`;
    });

    // Collect all unique sizes
    const sizes = new Set();
    for (const icons of [this.data.adwaita, this.data.breeze]) {
      for (const info of Object.values(icons)) {
        for (const s of Object.keys(info.sizes)) {
          sizes.add(s);
        }
      }
    }

    const sizeFilter = document.getElementById('sizeFilter');
    sizeFilter.innerHTML = '<button class="size-btn active" data-size="all">all sizes</button>';
    [...sizes]
      .sort((a, b) => {
        // Put symbolic first for visibility
        if (a === 'symbolic') return -1;
        if (b === 'symbolic') return 1;
        // Numeric sort
        const na = parseInt(a);
        const nb = parseInt(b);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return a.localeCompare(b);
      })
      .forEach((s) => {
        sizeFilter.innerHTML += `<button class="size-btn" data-size="${s}">${s}</button>`;
      });
  }

  updateStats() {
    const { counts } = this.data.meta;
    document.getElementById('stats').innerHTML = `
      <span class="stat">ADWAITA:${counts.adwaita}</span>
      <span class="stat" style="margin:0 0.5rem;">BREEZE:${counts.breeze}</span>
      <span class="stat">COMMON:${counts.common}</span>
    `;
  }

  getFilteredIcons() {
    let icons = [];

    switch (this.state.theme) {
      case 'adwaita':
        icons = Object.entries(this.data.adwaita).map(([name, info]) => ({
          name,
          ...info,
          themes: ['adwaita'],
        }));
        break;

      case 'breeze':
        icons = Object.entries(this.data.breeze).map(([name, info]) => ({
          name,
          ...info,
          themes: ['breeze'],
        }));
        break;

      case 'common':
        icons = this.data.common.map((item) => ({
          name: item.name,
          category: item.adwaita.category || item.breeze.category,
          sizes: { ...item.adwaita.sizes, ...item.breeze.sizes },
          themes: ['adwaita', 'breeze'],
          adwaita: item.adwaita,
          breeze: item.breeze,
        }));
        break;

      default: // 'all'
        const merged = {};
        for (const [name, info] of Object.entries(this.data.adwaita)) {
          merged[name] = { name, ...info, themes: ['adwaita'] };
        }
        for (const [name, info] of Object.entries(this.data.breeze)) {
          if (merged[name]) {
            merged[name].themes.push('breeze');
            merged[name].breeze = info;
          } else {
            merged[name] = { name, ...info, themes: ['breeze'] };
          }
        }
        icons = Object.values(merged);
    }

    // Filter by search
    if (this.state.search) {
      icons = icons.filter((i) => i.name.toLowerCase().includes(this.state.search));
    }

    // Filter by category
    if (this.state.category !== 'all') {
      icons = icons.filter((i) => i.category === this.state.category);
    }

    // Filter by size
    if (this.state.size !== 'all') {
      icons = icons.filter((i) => this.state.size in i.sizes);
    }

    return icons;
  }

  render() {
    this.grid.render(this.getFilteredIcons());
  }

  getIconUrl(theme, path) {
    if (theme === 'adwaita') {
      return `icons/adwaita-icon-theme/Adwaita/${path}`;
    }
    return `icons/breeze-icons/icons/${path}`;
  }
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
