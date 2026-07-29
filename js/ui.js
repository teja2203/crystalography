/* ===== CrystalLens UI Management ===== */

/**
 * Central UI manager handling all DOM interactions, notifications, modals, and state.
 */
export class UIManager {
    constructor() {
        this.elements = new Map();
        this._events = {};
        this.state = {
            theme: 'dark',
            sidebarOpen: true,
            currentView: 'dashboard',
            currentModule: null,
            currentTab: 'learn',
            progress: {},
            bookmarks: [],
            notifications: []
        };

        this._cacheElements();
        this._setupEventListeners();
        this._loadState();
        if (window.innerWidth <= 768) {
            this.state.sidebarOpen = false;
        }
        this._applyTheme();
        this._syncSidebarState();
    }

    _cacheElements() {
        const ids = [
            'loading-screen', 'sidebar', 'sidebar-toggle', 'menu-btn',
            'main-content', 'page-container', 'breadcrumb',
            'search-input', 'module-list', 'module-container',
            'module-badge', 'module-title', 'module-description',
            'module-visual', 'module-content', 'content-panel',
            'three-container', 'three-canvas', 'hero-canvas',
            'lab-canvas', 'lab-three-container',
            'view-dashboard', 'view-module', 'view-lab',
            'view-quiz', 'view-bookmarks',
            'theme-toggle', 'bookmarks-btn',
            'hero-start', 'hero-3d',
            'roadmap', 'quick-grid',
            'progress-percent', 'progress-bar-fill',
            'stat-modules', 'stat-progress', 'stat-quizzes', 'stat-time',
            'progress-ring-circle', 'progress-ring-text',
            'math-modal', 'math-modal-title', 'math-modal-body', 'math-modal-close',
            'notification-container', 'toast-container',
            'visual-controls', 'anim-speed', 'atom-size', 'atom-transparency',
            'reset-camera-btn', 'toggle-exploded',
            'lab-structure', 'lab-axes', 'lab-labels', 'lab-unitcell',
            'lab-lattice-points', 'lab-bonds', 'lab-transparent',
            'lab-exploded', 'lab-cross-section', 'lab-slice',
            'quiz-title', 'quiz-content', 'quiz-progress-fill',
            'quiz-counter', 'quiz-prev', 'quiz-next', 'quiz-submit',
            'roadmap-collapse'
        ];

        for (const id of ids) {
            const el = document.getElementById(id);
            if (el) this.elements.set(id, el);
        }
    }

    _setupEventListeners() {
        this.get('sidebar-toggle')?.addEventListener('click', () => this.toggleSidebar());
        this.get('menu-btn')?.addEventListener('click', () => this.toggleSidebar());
        this.get('theme-toggle')?.addEventListener('click', () => this.toggleTheme());
        this.get('hero-start')?.addEventListener('click', () => this.emit('navigate', { view: 'module', param: 1 }));
        this.get('hero-3d')?.addEventListener('click', () => this.emit('navigate', { view: 'lab' }));
        this.get('bookmarks-btn')?.addEventListener('click', () => this.emit('navigate', { view: 'bookmarks' }));

        this.get('search-input')?.addEventListener('input', (e) => {
            this._onSearch(e.target.value);
        });

        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.emit('view-change', btn.dataset.view);
            });
        });

        document.querySelectorAll('.content-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.content-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.emit('tab-change', tab.dataset.tab);
            });
        });

        this.get('math-modal-close')?.addEventListener('click', () => this.closeModal());
        this.get('math-modal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });

        this.get('quiz-prev')?.addEventListener('click', () => this.emit('quiz-prev'));
        this.get('quiz-next')?.addEventListener('click', () => this.emit('quiz-next'));
        this.get('quiz-submit')?.addEventListener('click', () => this.emit('quiz-submit'));

        this.get('roadmap-collapse')?.addEventListener('click', () => {
            document.querySelectorAll('.roadmap-item.expanded').forEach(el => {
                el.classList.remove('expanded');
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
            if (e.key === 'b' && e.ctrlKey) {
                e.preventDefault();
                this.emit('toggle-bookmarks');
            }
        });
    }

    _loadState() {
        try {
            const saved = localStorage.getItem('crystallens_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            }
        } catch {}
    }

    _saveState() {
        try {
            localStorage.setItem('crystallens_state', JSON.stringify(this.state));
        } catch {}
    }

    _applyTheme() {
        document.documentElement.setAttribute('data-theme', this.state.theme);
    }

    get(id) {
        return this.elements.get(id) || null;
    }

    toggleSidebar() {
        this.state.sidebarOpen = !this.state.sidebarOpen;
        this._syncSidebarState();
        this.emit('sidebar-toggle', this.state.sidebarOpen);
    }

    _syncSidebarState() {
        const sidebar = this.get('sidebar');
        sidebar?.classList.toggle('collapsed', !this.state.sidebarOpen);
        sidebar?.classList.toggle('open', this.state.sidebarOpen);
    }

    toggleTheme() {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        this._applyTheme();
        this._saveState();
        this.emit('theme-change', this.state.theme);
    }

    navigate(view, param = null) {
        this.state.currentView = view;
        
        // Hide all views instantly
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
        });
        
        const viewId = `view-${view}`;
        const viewEl = document.getElementById(viewId);
        if (viewEl) {
            // Force reflow to restart the CSS animation on .view.active
            void viewEl.offsetWidth;
            viewEl.classList.add('active');
            const container = viewEl.closest('.page-container');
            if (container) container.scrollTop = 0;
        }

        this._updateBreadcrumb(view, param);
        window.dispatchEvent(new Event('resize'));
    }

    _updateBreadcrumb(view, param) {
        const breadcrumb = this.get('breadcrumb');
        if (!breadcrumb) return;

        const labels = {
            dashboard: 'Dashboard',
            module: param ? `Module ${param}` : 'Module',
            lab: '3D Crystal Lab',
            quiz: 'Quiz',
            bookmarks: 'Bookmarks'
        };

        const label = labels[view] || 'Dashboard';
        breadcrumb.innerHTML = `<span class="breadcrumb-item">Dashboard</span>
            ${view !== 'dashboard' ? `<span class="breadcrumb-sep">/</span><span class="breadcrumb-item active">${label}</span>` : '<span class="breadcrumb-item active">Dashboard</span>'}`;
    }

    notify(message, type = 'info', duration = 3000) {
        const container = this.get('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8L7 11L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            error: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5 5L11 11M11 5L5 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
            info: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 7V11M8 5.5V5.51" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
        };

        notification.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
        container.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(40px)';
            notification.style.transition = 'all 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    showMathModal(title, steps) {
        const modal = this.get('math-modal');
        const titleEl = this.get('math-modal-title');
        const body = this.get('math-modal-body');
        if (!modal || !body) return;

        if (titleEl) titleEl.textContent = title;
        body.innerHTML = steps.map((step, i) => `
            <div class="math-step">
                <div class="math-step-label">Step ${i + 1}</div>
                <div class="math-step-content">${step}</div>
            </div>
            ${i < steps.length - 1 ? '<div class="derivation-arrow"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M8 13L12 9M8 13L4 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' : ''}
        `).join('');

        modal.classList.add('show');
    }

    closeModal() {
        this.get('math-modal')?.classList.remove('show');
    }

    updateProgress(percent) {
        this.state.progress.overall = percent;
        this._saveState();

        const fill = this.get('progress-bar-fill');
        const text = this.get('progress-percent');
        if (fill) fill.style.width = `${percent}%`;
        if (text) text.textContent = `${Math.round(percent)}%`;

        const stat = this.get('stat-progress');
        if (stat) stat.textContent = `${Math.round(percent)}%`;
    }

    setModuleProgress(percent) {
        const circle = this.get('progress-ring-circle');
        const text = this.get('progress-ring-text');
        if (circle) {
            const circumference = 125.6;
            const offset = circumference - (percent / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        }
        if (text) text.textContent = `${Math.round(percent)}%`;
    }

    updateStats({ modules, progress, quizzes, time } = {}) {
        if (modules !== undefined) {
            const el = this.get('stat-modules');
            if (el) el.textContent = modules;
        }
        if (quizzes !== undefined) {
            const el = this.get('stat-quizzes');
            if (el) el.textContent = quizzes;
        }
        if (time !== undefined) {
            const el = this.get('stat-time');
            if (el) el.textContent = time;
        }
    }

    _onSearch(query) {
        query = query.toLowerCase().trim();
        if (!query) {
            document.querySelectorAll('.module-item').forEach(el => { el.style.display = ''; });
            return;
        }
        document.querySelectorAll('.module-item').forEach(el => {
            el.style.display = el.textContent.toLowerCase().includes(query) ? '' : 'none';
        });
    }

    hideLoading() {
        const loading = this.get('loading-screen');
        if (loading) {
            loading.classList.add('hidden');
            setTimeout(() => loading.remove(), 600);
        }
    }

    setLoadingProgress(percent) {
        const bar = document.querySelector('.loading-progress');
        const status = document.querySelector('.loading-status');
        if (bar) bar.style.width = `${Math.min(percent, 100)}%`;
        if (status) {
            const msgs = [
                'Initializing 3D Engine...',
                'Loading Crystal Structures...',
                'Preparing Visualizations...',
                'Setting up Learning Modules...',
                'Almost Ready...'
            ];
            const idx = Math.min(Math.floor(percent / 25), 4);
            status.textContent = msgs[idx];
        }
    }

    on(event, callback) {
        if (!this._events) this._events = {};
        if (!this._events[event]) this._events[event] = [];
        this._events[event].push(callback);
        return () => {
            this._events[event] = this._events[event].filter(cb => cb !== callback);
        };
    }

    emit(event, data) {
        if (!this._events || !this._events[event]) return;
        for (const cb of this._events[event]) {
            cb(data);
        }
    }
}
