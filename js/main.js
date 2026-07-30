/* ===== CrystalLens — Main Application Entry Point ===== */
import { UIManager } from './ui.js';
import { SceneManager } from './scene.js';
import { buildModuleList, buildRoadmap, buildQuickGrid, renderModuleContent, getModuleContent, MODULES } from './navigation.js';
import { CrystalVisualizer } from './crystals/crystalSystems.js';
import { QuizEngine } from './quiz/quizEngine.js';
import { CrystalBuilder } from './animations/builder.js';
import { MillerMath } from './math/millerMath.js';
import { StepAnimator } from './animations/stepAnimator.js';
import * as THREE from 'three';

class CrystalLensApp {
    constructor() {
        this.ui = new UIManager();
        this.activeScene = null;
        this.heroScene = null;
        this.labScene = null;
        this.moduleScene = null;
        this.crystalVis = new CrystalVisualizer();
        this.currentModuleId = null;
        this.moduleProgress = {};
        this.learningTime = 0;
        this.timerInterval = null;
        this.quizEngine = new QuizEngine();
        this.quizEngine.onUpdate = (qe) => this._onQuizUpdate(qe);

        this._init();
    }

    async _init() {
        this._simulateLoading();
        this._setupEvents();
        this._buildNavigation();
        this._initHeroScene();
        this._startTimer();
    }

    _simulateLoading() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5 + Math.random() * 10;
            if (progress > 100) progress = 100;
            this.ui.setLoadingProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    this.ui.hideLoading();
                }, 300);
            }
        }, 200);
    }

    _setupEvents() {
        // Navigation events
        this.ui.on('navigate', ({ view, param }) => {
            this._handleNavigation(view, param);
        });

        // Module selection from sidebar/roadmap
        window.addEventListener('module-select', (e) => {
            const { moduleId } = e.detail;
            this._openModule(moduleId);
        });

        // View changes (orbit, top, side, front)
        this.ui.on('view-change', (view) => {
            if (this.moduleScene) {
                this.moduleScene.setView(view);
            }
        });

        // Tab changes (learn, math, practice, summary)
        this.ui.on('tab-change', (tab) => {
            this._renderContentTab(tab);
        });

        // Visual controls
        this.ui.get('anim-speed')?.addEventListener('input', (e) => {
            const speed = parseInt(e.target.value) / 100;
            if (this.moduleScene) {
                this.moduleScene.controls.autoRotateSpeed = speed * 2;
            }
        });

        this.ui.get('atom-size')?.addEventListener('input', (e) => {
            const size = parseInt(e.target.value) / 100;
            if (this.moduleScene) {
                this._updateAtomSize(size);
            }
        });

        this.ui.get('atom-transparency')?.addEventListener('input', (e) => {
            const trans = parseInt(e.target.value) / 100;
            if (this.moduleScene) {
                this._updateTransparency(trans);
            }
        });

        this.ui.get('reset-camera-btn')?.addEventListener('click', () => {
            if (this.moduleScene) this.moduleScene.resetCamera();
        });

        this.ui.get('toggle-exploded')?.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            btn.classList.toggle('active');
            const exploded = btn.classList.contains('active');
            this._toggleExplodedView(exploded);
        });

        // Lab controls
        this.ui.get('lab-structure')?.addEventListener('change', (e) => {
            this._updateLabStructure(e.target.value);
        });

        // Lab toggles
        ['lab-axes', 'lab-labels', 'lab-unitcell', 'lab-lattice-points', 
         'lab-bonds', 'lab-transparent', 'lab-exploded', 'lab-cross-section'].forEach(id => {
            this.ui.get(id)?.addEventListener('change', () => {
                this._updateLabVisuals();
            });
        });

        this.ui.get('lab-slice')?.addEventListener('input', () => {
            this._updateLabVisuals();
        });

        // Lab repeat buttons
        document.querySelectorAll('.lab-repeat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.lab-repeat-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._updateLabStructure(this.ui.get('lab-structure')?.value || 'fcc');
            });
        });

        // Quiz navigation
        this.ui.on('quiz-prev', () => this._quizPrev());
        this.ui.on('quiz-next', () => this._quizNext());
        this.ui.on('quiz-submit', () => this._quizSubmit());

        // Quiz option clicks delegated
        document.addEventListener('click', (e) => {
            if (this.ui.state.currentView !== 'quiz') return;
            const opt = e.target.closest('.quiz-option');
            if (opt && !opt.disabled) {
                const answer = parseInt(opt.dataset.opt);
                this._handleQuizAnswer(answer);
            }
        });
    }

    _buildNavigation() {
        // Build sidebar
        const moduleList = this.ui.get('module-list');
        if (moduleList) {
            buildModuleList(moduleList, null, {});
        }

        // Build roadmap
        const roadmap = this.ui.get('roadmap');
        if (roadmap) {
            buildRoadmap(roadmap, {});
        }

        // Build quick grid
        const quickGrid = this.ui.get('quick-grid');
        if (quickGrid) {
            buildQuickGrid(quickGrid);
        }

        // Update stats with animation
        this.ui.updateStats({
            modules: '20',
            progress: '0%',
            quizzes: '0',
            time: '0m'
        });

        // Animate stat cards with stagger
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, i) => {
            card.classList.add('stagger-item');
            card.style.animationDelay = `${i * 0.1}s`;
        });
        const statsContainer = statCards[0]?.parentElement;
        if (statsContainer) {
            requestAnimationFrame(() => statsContainer.classList.add('stagger-children'));
        }
    }

    _handleNavigation(view, param) {
        if (view === 'module' && param) {
            this._openModule(param);
        } else if (view === 'lab') {
            this._openLab();
        } else if (view === 'quiz') {
            this._openQuiz();
        } else if (view === 'bookmarks') {
            this.ui.navigate('bookmarks');
        } else {
            this.ui.navigate('dashboard');
        }
    }

    _openModule(moduleId) {
        this.currentModuleId = moduleId;
        const mod = MODULES.find(m => m.id === moduleId);
        if (!mod) return;

        // Update UI
        this.ui.navigate('module', moduleId);
        
        const badge = this.ui.get('module-badge');
        const title = this.ui.get('module-title');
        const desc = this.ui.get('module-description');

        if (badge) {
            badge.textContent = `Module ${String(moduleId).padStart(2, '0')}`;
            badge.style.background = this._hexToRgba(mod.color, 0.15);
            badge.style.color = mod.color;
        }
        if (title) title.textContent = mod.title;
        if (desc) desc.textContent = mod.desc;

        // Update sidebar active state
        document.querySelectorAll('.module-item').forEach(item => {
            item.classList.toggle('active', parseInt(item.dataset.moduleId) === moduleId);
        });

        // Set module progress
        const progress = this.moduleProgress[moduleId] || 0;
        this.ui.setModuleProgress(progress);

        // Render content
        this._renderContentTab('learn');

        // Initialize 3D visualization after the module canvas is visible
        requestAnimationFrame(() => this._renderModuleScene(moduleId));
    }

    _renderContentTab(tab) {
        if (!this.currentModuleId) return;
        const panel = this.ui.get('content-panel');
        if (!panel) return;

        // Lock height during transition to prevent jump
        panel.style.minHeight = panel.offsetHeight + 'px';
        panel.style.overflow = 'hidden';

        // Fade out old content
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(8px)';
        panel.style.transition = 'all 0.2s ease';
        
        setTimeout(() => {
            panel.innerHTML = renderModuleContent(this.currentModuleId, tab);
            
            // Force reflow then fade in
            void panel.offsetWidth;
            panel.style.opacity = '1';
            panel.style.transform = 'translateY(0)';

            // Release height lock after transition
            setTimeout(() => {
                panel.style.minHeight = '';
                panel.style.overflow = '';
            }, 300);

            // Add event listeners for practice questions
            if (tab === 'practice') {
                document.querySelectorAll('.practice-option').forEach(opt => {
                    opt.addEventListener('click', () => this._handlePracticeAnswer(opt));
                });
            }

            // Bind Miller interactive elements if on Module 11 Learn or Math Tab
            if (this.currentModuleId === 11 && (tab === 'learn' || tab === 'math')) {
                this._setupMillerInteractions();
            }

            // Bind Coordination counting if on Module 9 Learn Tab
            if (this.currentModuleId === 9 && tab === 'learn') {
                this._setupCoordinationInteractions();
            }

            // Bind Layer Builder if on Modules 4, 5, 6 Learn Tab
            if ([4, 5, 6].includes(this.currentModuleId) && tab === 'learn') {
                this._setupBuilderInteractions();
            }

            // Bind Defects interactive selector if on Module 13 Learn Tab
            if (this.currentModuleId === 13 && tab === 'learn') {
                this._setupDefectsInteractions();
            }

            // Bind Density calculator if on Module 10 Learn Tab
            if (this.currentModuleId === 10 && tab === 'learn') {
                this._setupDensityInteractions();
            }

            // Bind Dislocations if on Module 14 Learn Tab
            if (this.currentModuleId === 14 && tab === 'learn') {
                this._setupDislocationsInteractions();
            }

            // Bind Slip Systems if on Module 15 Learn Tab
            if (this.currentModuleId === 15 && tab === 'learn') {
                this._setupSlipInteractions();
            }
        }, 200);
    }

    _setupMillerInteractions() {
        if (this.crystalVis && this.crystalVis.millerPlanes && this.moduleScene) {
            this.crystalVis.millerPlanes.sm = this.moduleScene;
        }

        const updateDerivation = (h, k, l) => {
            const intercepts = [
                h !== 0 ? `a/${h}` : '∞',
                k !== 0 ? `a/${k}` : '∞',
                l !== 0 ? `a/${l}` : '∞'
            ];
            const recip = [
                h !== 0 ? `${h}/a` : '0',
                k !== 0 ? `${k}/a` : '0',
                l !== 0 ? `${l}/a` : '0'
            ];

            const liveContainer = document.getElementById('miller-derivation-live');
            if (liveContainer) {
                liveContainer.innerHTML = `
                    <div class="miller-derivation-card">
                        <div class="miller-derivation-title">
                            <span>Step-by-Step Derivation for (${h} ${k} ${l}) Plane</span>
                            <span class="miller-step-val">(${h} ${k} ${l})</span>
                        </div>
                        <div class="miller-step-list">
                            <div class="miller-step-item">
                                <div class="miller-step-label">1. Intercepts on Axes (x, y, z):</div>
                                <div class="miller-step-val">(${intercepts.join(', ')})</div>
                            </div>
                            <div class="miller-step-item">
                                <div class="miller-step-label">2. Take Reciprocals:</div>
                                <div class="miller-step-val">(${recip.join(', ')})</div>
                            </div>
                            <div class="miller-step-item">
                                <div class="miller-step-label">3. Clear Fractions & Simplify:</div>
                                <div class="miller-step-val">${h}, ${k}, ${l}</div>
                            </div>
                            <div class="miller-step-item">
                                <div class="miller-step-label">4. Final Miller Index Notation:</div>
                                <div class="miller-step-val"><strong>(${h} ${k} ${l})</strong></div>
                            </div>
                        </div>
                    </div>
                `;
            }

            // Also render in Math tab if StepAnimator container exists
            const stepContainer = document.getElementById('miller-step-animator');
            if (stepContainer) {
                const animator = new StepAnimator('miller-step-animator', `Derivation of Plane (${h} ${k} ${l})`);
                animator.setSteps([
                    { html: `<strong>Step 1: Intercepts</strong><br>Plane crosses axes at x = ${intercepts[0]}, y = ${intercepts[1]}, z = ${intercepts[2]}` },
                    { html: `<strong>Step 2: Reciprocals</strong><br>Invert intercepts: 1/x = ${recip[0]}, 1/y = ${recip[1]}, 1/z = ${recip[2]}` },
                    { html: `<strong>Step 3: Simplify</strong><br>Smallest integer ratio: h = ${h}, k = ${k}, l = ${l}` },
                    { html: `<strong>Step 4: Result</strong><br>Enclose in parentheses: <strong>(${h} ${k} ${l})</strong>` }
                ]).render();
            }
        };

        // Wire plane click in 3D scene
        if (this.crystalVis && this.crystalVis.millerPlanes) {
            this.crystalVis.millerPlanes.onPlaneClick = (h, k, l) => {
                const hEl = document.getElementById('miller-h');
                const kEl = document.getElementById('miller-k');
                const lEl = document.getElementById('miller-l');
                if (hEl) hEl.value = h;
                if (kEl) kEl.value = k;
                if (lEl) lEl.value = l;
                updateDerivation(h, k, l);
                this.crystalVis.millerPlanes.animatePlaneCreation(h, k, l);
            };
        }

        const animateBtn = document.getElementById('miller-animate-btn');
        if (animateBtn) {
            animateBtn.addEventListener('click', () => {
                const h = parseInt(document.getElementById('miller-h').value) || 0;
                const k = parseInt(document.getElementById('miller-k').value) || 0;
                const l = parseInt(document.getElementById('miller-l').value) || 0;
                
                if (h === 0 && k === 0 && l === 0) {
                    alert('Miller indices cannot be all zero.');
                    return;
                }

                updateDerivation(h, k, l);
                if (this.moduleScene && this.crystalVis.millerPlanes) {
                    this.crystalVis.millerPlanes.animatePlaneCreation(h, k, l);
                }
            });
        }

        // Preset buttons
        document.querySelectorAll('.miller-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const h = parseInt(btn.dataset.h);
                const k = parseInt(btn.dataset.k);
                const l = parseInt(btn.dataset.l);
                
                const hEl = document.getElementById('miller-h');
                const kEl = document.getElementById('miller-k');
                const lEl = document.getElementById('miller-l');
                if (hEl) hEl.value = h;
                if (kEl) kEl.value = k;
                if (lEl) lEl.value = l;
                
                updateDerivation(h, k, l);
                if (this.moduleScene && this.crystalVis.millerPlanes) {
                    this.crystalVis.millerPlanes.animatePlaneCreation(h, k, l);
                }
            });
        });

        // Trigger initial derivation for (1 1 1)
        updateDerivation(1, 1, 1);
    }

    _setupCoordinationInteractions() {
        const resetBtn = document.getElementById('coord-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (this.crystalVis && typeof this.crystalVis.resetCoordinationCount === 'function') {
                    this.crystalVis.resetCoordinationCount();
                }
            });
        }
    }

    _setupBuilderInteractions() {
        const buildFccBtn = document.getElementById('build-fcc-btn');
        const buildBccBtn = document.getElementById('build-bcc-btn');
        const buildHcpBtn = document.getElementById('build-hcp-btn');

        const handleBuild = (type) => {
            if (!this.moduleScene) return;
            const builder = new CrystalBuilder(this.moduleScene);
            if (type === 'fcc') builder.buildFCC();
            else if (type === 'bcc') builder.buildBCC();
            else if (type === 'hcp') builder.buildHCP();
        };

        if (buildFccBtn) buildFccBtn.addEventListener('click', () => handleBuild('fcc'));
        if (buildBccBtn) buildBccBtn.addEventListener('click', () => handleBuild('bcc'));
        if (buildHcpBtn) buildHcpBtn.addEventListener('click', () => handleBuild('hcp'));
    }

    _setupDefectsInteractions() {
        const updateDefectInfo = (type) => {
            const container = document.getElementById('defects-live-card');
            if (!container) return;

            const defectData = {
                vacancy: {
                    title: 'Vacancy Defect (Missing Atom)',
                    desc: 'An atom is missing from its normal lattice position. Vacancies are intrinsic thermodynamic defects formed at high temperatures.',
                    math: 'N_v / N = exp(-Q_v / k_B T)',
                    effect: 'Enables atomic self-diffusion & creep deformation.'
                },
                interstitial: {
                    title: 'Self-Interstitial Defect (Extra Atom)',
                    desc: 'An extra atom squeezes into an interstitial void between regular lattice sites. Causes high local lattice strain.',
                    math: 'N_i / N = exp(-Q_i / k_B T)',
                    effect: 'High formation energy (Q_i > Q_v); creates compressive strain fields.'
                },
                substitutional: {
                    title: 'Substitutional Impurity Defect',
                    desc: 'A solute/foreign atom replaces a host matrix atom (e.g. Zinc in Copper to form Brass).',
                    math: 'Hume-Rothery Rule: |r_solute - r_host| < 15%',
                    effect: 'Solid solution strengthening; impedes dislocation movement.'
                },
                frenkel: {
                    title: 'Frenkel Pair (Vacancy + Interstitial)',
                    desc: 'A cation leaves its lattice site and moves into a nearby interstitial position, creating a vacancy-interstitial pair.',
                    math: 'n = (N · N_i)^(1/2) · exp(-E_f / 2k_B T)',
                    effect: 'Maintains overall stoichiometry and electrical neutrality.'
                },
                schottky: {
                    title: 'Schottky Defect (Cation-Anion Vacancy Pair)',
                    desc: 'A pair of oppositely charged ions (cation + anion) leave the crystal to maintain charge balance.',
                    math: 'n = N · exp(-E_s / 2k_B T)',
                    effect: 'Common in alkali halides (e.g., NaCl, KCl); lowers density.'
                }
            };

            const data = defectData[type] || defectData['vacancy'];

            container.innerHTML = `
                <div class="miller-derivation-card">
                    <div class="miller-derivation-title">
                        <span>${data.title}</span>
                        <span class="miller-step-val" style="color:var(--accent);">${type.toUpperCase()}</span>
                    </div>
                    <div class="miller-step-list">
                        <div class="miller-step-item">
                            <div class="miller-step-label">Physical Mechanism:</div>
                            <div class="miller-step-val">${data.desc}</div>
                        </div>
                        <div class="miller-step-item">
                            <div class="miller-step-label">Thermodynamic / Rule Formula:</div>
                            <div class="miller-step-val"><strong>${data.math}</strong></div>
                        </div>
                        <div class="miller-step-item">
                            <div class="miller-step-label">Material Property Impact:</div>
                            <div class="miller-step-val">${data.effect}</div>
                        </div>
                    </div>
                </div>
            `;
        };

        // Wire defect selector buttons
        document.querySelectorAll('.defect-select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.defect-select-btn').forEach(b => b.classList.remove('active', 'btn-primary'));
                btn.classList.add('active', 'btn-primary');
                const type = btn.dataset.type;
                updateDefectInfo(type);
                if (this.moduleScene && this.crystalVis) {
                    this.crystalVis.createDefectsDemo(this.moduleScene, type);
                }
            });
        });

        // Trigger initial vacancy info
        updateDefectInfo('vacancy');
    }

    _setupDensityInteractions() {
        const updateDensityCalc = (elemKey) => {
            const container = document.getElementById('density-live-card');
            if (!container) return;

            const elements = {
                Cu: { name: 'Copper (Cu)', struct: 'FCC', n: 4, A: 63.55, a: 3.615, rhoLit: 8.94 },
                Fe: { name: 'Alpha-Iron (Fe)', struct: 'BCC', n: 2, A: 55.85, a: 2.866, rhoLit: 7.87 },
                Al: { name: 'Aluminum (Al)', struct: 'FCC', n: 4, A: 26.98, a: 4.049, rhoLit: 2.70 },
                Au: { name: 'Gold (Au)', struct: 'FCC', n: 4, A: 196.97, a: 4.078, rhoLit: 19.30 },
                W:  { name: 'Tungsten (W)', struct: 'BCC', n: 2, A: 183.84, a: 3.165, rhoLit: 19.25 }
            };

            const data = elements[elemKey] || elements['Cu'];
            const aCm = data.a * 1e-8;
            const Vc = Math.pow(aCm, 3);
            const massCell = (data.n * data.A) / 6.022e23;
            const rhoCalc = (massCell / Vc).toFixed(2);

            container.innerHTML = `
                <div class="miller-derivation-card">
                    <div class="miller-derivation-title">
                        <span>Theoretical Density Derivation — ${data.name}</span>
                        <span class="miller-step-val">${rhoCalc} g/cm³</span>
                    </div>
                    <div class="miller-step-list">
                        <div class="miller-step-item">
                            <div class="miller-step-label">1. Crystal Structure & Atoms per Cell (n):</div>
                            <div class="miller-step-val">${data.struct} structure &rarr; n = <strong>${data.n} atoms/cell</strong></div>
                        </div>
                        <div class="miller-step-item">
                            <div class="miller-step-label">2. Atomic Weight (A) & Unit Cell Edge (a):</div>
                            <div class="miller-step-val">A = ${data.A} g/mol, a = ${data.a} Å = ${data.a} &times; 10<sup>-8</sup> cm</div>
                        </div>
                        <div class="miller-step-item">
                            <div class="miller-step-label">3. Unit Cell Volume (V_c = a³):</div>
                            <div class="miller-step-val">V_c = (${data.a} &times; 10<sup>-8</sup> cm)³ = ${(Vc * 1e24).toFixed(2)} &times; 10<sup>-24</sup> cm³</div>
                        </div>
                        <div class="miller-step-item">
                            <div class="miller-step-label">4. Calculated Theoretical Density (&rho;):</div>
                            <div class="miller-step-val">&rho; = (${data.n} &times; ${data.A}) / [6.022 &times; 10<sup>23</sup> &times; ${(Vc * 1e24).toFixed(2)} &times; 10<sup>-24</sup>] = <strong style="color:var(--accent);">${rhoCalc} g/cm³</strong> (Lit: ${data.rhoLit} g/cm³)</div>
                        </div>
                    </div>
                </div>
            `;
        };

        const picker = document.getElementById('density-element-picker');
        if (picker) {
            picker.addEventListener('change', (e) => {
                updateDensityCalc(e.target.value);
            });
            updateDensityCalc(picker.value);
        }
    }

    _setupDislocationsInteractions() {
        const updateDislocationInfo = (type) => {
            const container = document.getElementById('dislocations-live-card');
            if (!container) return;

            const disData = {
                edge: {
                    title: 'Edge Dislocation Line Defect',
                    geometry: 'Burgers Vector b &perp; Dislocation Line t',
                    desc: 'Formed by inserting an extra half-plane of atoms into the crystal lattice. Atom positions above slip plane are compressed; below are in tension.',
                    math: '&tau;_P = [2G / (1-&nu;)] &middot; exp(-2&pi; w / b)'
                },
                screw: {
                    title: 'Screw Dislocation Line Defect',
                    geometry: 'Burgers Vector b &parallel; Dislocation Line t',
                    desc: 'Formed by shear stress cutting halfway through the crystal and shifting one half by 1 atomic distance, creating a continuous helical ramp.',
                    math: 'E_screw = (G &middot; b²) / (4&pi;) &middot; ln(R / r_0)'
                },
                mixed: {
                    title: 'Mixed Dislocation Line Defect',
                    geometry: 'Burgers Vector b at arbitrary angle to Line t',
                    desc: 'Exhibits both edge character (perpendicular component) and screw character (parallel component). Most real dislocations are mixed loops.',
                    math: 'E_total = E_edge &middot; sin²(&theta;) + E_screw &middot; cos²(&theta;)'
                }
            };

            const data = disData[type] || disData['edge'];

            container.innerHTML = `
                <div class="miller-derivation-card">
                    <div class="miller-derivation-title">
                        <span>${data.title}</span>
                        <span class="miller-step-val" style="color:var(--accent);">${type.toUpperCase()}</span>
                    </div>
                    <div class="miller-step-list">
                        <div class="miller-step-item">
                            <div class="miller-step-label">Burgers Vector & Line Orientation:</div>
                            <div class="miller-step-val"><strong>${data.geometry}</strong></div>
                        </div>
                        <div class="miller-step-item">
                            <div class="miller-step-label">Lattice Deformation Mechanism:</div>
                            <div class="miller-step-val">${data.desc}</div>
                        </div>
                        <div class="miller-step-item">
                            <div class="miller-step-label">Governing Physics / Stress Formula:</div>
                            <div class="miller-step-val"><strong>${data.math}</strong></div>
                        </div>
                    </div>
                </div>
            `;
        };

        document.querySelectorAll('.dislocation-select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.dislocation-select-btn').forEach(b => b.classList.remove('active', 'btn-primary'));
                btn.classList.add('active', 'btn-primary');
                const type = btn.dataset.type;
                updateDislocationInfo(type);
                if (this.moduleScene && this.crystalVis) {
                    this.crystalVis.createDislocationsDemo(this.moduleScene, type);
                }
            });
        });

        updateDislocationInfo('edge');
    }

    _setupSlipInteractions() {
        const updateSlipInfo = (type) => {
            const container = document.getElementById('slip-live-card');
            if (!container) return;

            const slipData = {
                fcc: {
                    title: 'FCC Slip System: {111} Planes, &lang;110&rang; Directions',
                    count: '12 Independent Slip Systems (4 {111} planes &times; 3 &lang;110&rang; directions)',
                    behavior: 'High ductility & formability (e.g. Copper, Aluminum, Gold). Von Mises criterion (&ge;5) easily satisfied.'
                },
                bcc: {
                    title: 'BCC Slip System: {110} Planes, &lang;111&rang; Directions',
                    count: '48 Possible Slip Systems ({110}, {112}, {123} planes &times; &lang;111&rang; directions)',
                    behavior: 'High strength, temperature-dependent plastic yield (Ductile-to-Brittle Transition Temperature).'
                },
                hcp: {
                    title: 'HCP Slip System: (0001) Basal Plane, &lang;11-20&rang; Directions',
                    count: '3 Primary Basal Slip Systems (1 (0001) plane &times; 3 directions)',
                    behavior: 'Limited room temperature ductility (e.g. Zinc, Titanium, Magnesium). Twinning required for strain accommodation.'
                }
            };

            const data = slipData[type] || slipData['fcc'];

            container.innerHTML = `
                <div class="miller-derivation-card">
                    <div class="miller-derivation-title">
                        <span>${data.title}</span>
                        <span class="miller-step-val" style="color:var(--accent);">${type.toUpperCase()}</span>
                    </div>
                    <div class="miller-step-list">
                        <div class="miller-step-item">
                            <div class="miller-step-label">Slip System Density & Multiplicity:</div>
                            <div class="miller-step-val"><strong>${data.count}</strong></div>
                        </div>
                        <div class="miller-step-item">
                            <div class="miller-step-label">Schmid Factor & Plastic Behavior:</div>
                            <div class="miller-step-val">${data.behavior}</div>
                        </div>
                        <div class="miller-step-item">
                            <div class="miller-step-label">Schmid&rsquo;s Law Equation:</div>
                            <div class="miller-step-val"><strong>&tau;<sub>RSS</sub> = &sigma; &middot; cos(&phi;) &middot; cos(&lambda;)</strong> (&tau;<sub>CRSS</sub> trigger)</div>
                        </div>
                    </div>
                </div>
            `;
        };

        document.querySelectorAll('.slip-select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.slip-select-btn').forEach(b => b.classList.remove('active', 'btn-primary'));
                btn.classList.add('active', 'btn-primary');
                const type = btn.dataset.type;
                updateSlipInfo(type);
                if (this.moduleScene && this.crystalVis) {
                    this.crystalVis.createSlipSystemsDemo(this.moduleScene, type);
                }
            });
        });

        updateSlipInfo('fcc');
    }

    _handlePracticeAnswer(optionEl) {
        const qIdx = parseInt(optionEl.dataset.q);
        const optIdx = parseInt(optionEl.dataset.opt);
        const content = this._getCurrentModuleContent();
        
        if (!content || !content.practice || !content.practice[qIdx]) return;

        const question = content.practice[qIdx];
        const isCorrect = optIdx === question.correct;
        const feedback = this.ui.get(`feedback-${qIdx}`);

        // Disable all options for this question
        document.querySelectorAll(`.practice-option[data-q="${qIdx}"]`).forEach(opt => {
            opt.disabled = true;
            const idx = parseInt(opt.dataset.opt);
            if (idx === question.correct) opt.classList.add('correct');
            if (idx === optIdx && !isCorrect) opt.classList.add('wrong');
            if (idx === optIdx) opt.classList.add('selected');
        });

        if (feedback) {
            feedback.className = `practice-feedback show ${isCorrect ? 'correct' : 'wrong'}`;
            feedback.innerHTML = isCorrect ? 
                '<strong>✓ Correct!</strong> Great understanding!' :
                '<strong>✗ Not quite.</strong> Review the concept and try again.';
        }

        // Update module progress
        this._updateModuleProgress();
    }

    _getCurrentModuleContent() {
        if (!this.currentModuleId) return null;
        return getModuleContent(this.currentModuleId);
    }

    _updateModuleProgress() {
        if (!this.currentModuleId) return;
        
        const total = document.querySelectorAll('.practice-question').length;
        const answered = document.querySelectorAll('.practice-option.correct, .practice-option.wrong').length;
        const totalOptions = document.querySelectorAll('.practice-option').length;

        if (total > 0 && totalOptions > 0) {
            const questionsCompleted = Math.floor(answered / (totalOptions / total));
            const progress = Math.round((questionsCompleted / total) * 100);
            this.moduleProgress[this.currentModuleId] = progress;
            this.ui.setModuleProgress(progress);
            this._updateOverallProgress();
        }
    }

    _updateOverallProgress() {
        const total = Object.keys(this.moduleProgress).length;
        const sum = Object.values(this.moduleProgress).reduce((a, b) => a + b, 0);
        const overall = total > 0 ? Math.round(sum / 20) : 0; // 20 modules
        this.ui.updateProgress(overall);
    }

    // === 3D Scene Management ===

    _initHeroScene() {
        try {
            this.heroScene = new SceneManager('hero-canvas', {
                backgroundColor: 0x0a0b14
            });
            if (this.heroScene.scene) {
                this.crystalVis.createCubicCrystal(this.heroScene, { size: 1.5, color: 0x00d4ff, opacity: 0.8 });
                this.heroScene.controls.autoRotate = true;
                this.heroScene.controls.autoRotateSpeed = 2;
            }
        } catch (e) {
            console.warn('Hero scene init failed:', e);
        }
    }

    _createModuleScene() {
        try {
            this.moduleScene = new SceneManager('three-canvas', {
                backgroundColor: 0x0a0b14
            });
            // Scene will be populated when a module is selected
        } catch (e) {
            console.warn('Module scene init failed:', e);
        }
    }

    _initLabScene() {
        try {
            const tryInit = () => {
                const canvas = document.getElementById('lab-canvas');
                if (!canvas || canvas.clientWidth === 0) {
                    // Try again in 100ms (view may not be visible yet)
                    setTimeout(tryInit, 100);
                    return;
                }
                this.labScene = new SceneManager('lab-canvas', {
                    backgroundColor: 0x0a0b14
                });
                if (this.labScene.scene) {
                    this._updateLabStructure('fcc');
                }
            };
            setTimeout(tryInit, 50);
        } catch (e) {
            console.warn('Lab scene init failed:', e);
        }
    }

    _renderModuleScene(moduleId) {
        if (!this.moduleScene || !this.moduleScene.scene) {
            this._createModuleScene();
        }
        if (!this.moduleScene || !this.moduleScene.scene) return;

        // Clear existing scene and release cached geometries/materials
        this.moduleScene.clearScene();
        this.crystalVis.clearCache();
        this.moduleScene.controls.autoRotate = true;
        this.moduleScene.controls.autoRotateSpeed = 2;
        this.moduleScene.resetCamera();
        window.dispatchEvent(new Event('resize'));

        // Add axes
        this.moduleScene.add('axes', this.moduleScene.createAxes(1.8));

        // Create visualization based on module
        switch (moduleId) {
            case 1: // Crystal Systems
                this.crystalVis.createSevenCrystalSystems(this.moduleScene);
                break;
            case 2: // Bravais Lattices
                this.crystalVis.createBravaisLatticesPreview(this.moduleScene);
                break;
            case 3: // Unit Cell
                this.crystalVis.createUnitCellDemo(this.moduleScene);
                break;
            case 4: // FCC
                this.crystalVis.createFCC(this.moduleScene);
                break;
            case 5: // BCC
                this.crystalVis.createBCC(this.moduleScene);
                break;
            case 6: // HCP
                this.crystalVis.createHCP(this.moduleScene);
                break;
            case 7: // Comparison
                this.crystalVis.createComparisonView(this.moduleScene);
                break;
            case 8: // APF
                this.crystalVis.createAPFDemo(this.moduleScene);
                break;
            case 9: // Coordination Number
                this.crystalVis.createCoordinationDemo(this.moduleScene);
                break;
            case 10: // Density
                this.crystalVis.createDensityDemo(this.moduleScene);
                break;
            case 11: // Miller Indices
                this.crystalVis.createMillerIndicesDemo(this.moduleScene);
                break;
            case 12: // Crystal Directions
                this.crystalVis.createDirectionsDemo(this.moduleScene);
                break;
            case 13: // Point Defects
                this.crystalVis.createDefectsDemo(this.moduleScene);
                break;
            case 14: // Dislocations
                this.crystalVis.createDislocationsDemo(this.moduleScene);
                break;
            case 15: // Slip Systems
                this.crystalVis.createSlipSystemsDemo(this.moduleScene);
                break;
            case 16: // XRD
                this.crystalVis.createXRDDemo(this.moduleScene);
                break;
            case 17: // Reciprocal Lattice
                this.crystalVis.createReciprocalDemo(this.moduleScene);
                break;
            default:
                this.crystalVis.createFCC(this.moduleScene);
        }

        this._applyTeachingMotion(this.moduleScene);
    }

    _openLab() {
        this.ui.navigate('lab');
        if (!this.labScene || !this.labScene.scene) {
            this._initLabScene();
        }
    }

    _openQuiz() {
        this.ui.navigate('quiz');
        
        if (this.currentModuleId) {
            this.quizEngine.loadModule(this.currentModuleId);
        } else {
            this.quizEngine.loadComprehensive(10);
        }

        const quizTitle = this.ui.get('quiz-title');
        if (quizTitle) {
            quizTitle.textContent = this.currentModuleId ? 
                `Module ${this.currentModuleId}: ${MODULES.find(m => m.id === this.currentModuleId)?.title} Quiz` :
                'Comprehensive Quiz';
        }

        // Initialize quiz display and progress
        this._onQuizUpdate(this.quizEngine);  // also calls _renderQuizQuestion inside
        
        const prevBtn = this.ui.get('quiz-prev');
        const nextBtn = this.ui.get('quiz-next');
        const submitBtn = this.ui.get('quiz-submit');
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.style.display = '';
        if (submitBtn) submitBtn.style.display = 'none';
    }

    _updateLabStructure(structure) {
        if (!this.labScene || !this.labScene.scene) return;
        this.labScene.clearScene();

        const repeatCount = parseInt(document.querySelector('.lab-repeat-btn.active')?.dataset.count || '2');

        switch (structure) {
            case 'fcc':
                this.crystalVis.createFCC(this.labScene, { repeat: repeatCount });
                break;
            case 'bcc':
                this.crystalVis.createBCC(this.labScene, { repeat: repeatCount });
                break;
            case 'hcp':
                this.crystalVis.createHCP(this.labScene, { repeat: repeatCount });
                break;
            case 'simple':
                this.crystalVis.createSimpleCubic(this.labScene, { repeat: repeatCount });
                break;
            case 'cscl':
                this.crystalVis.createCsCl(this.labScene, { repeat: repeatCount });
                break;
            case 'nacl':
                this.crystalVis.createNaCl(this.labScene, { repeat: repeatCount });
                break;
            case 'zincblende':
                this.crystalVis.createZincBlende(this.labScene, { repeat: repeatCount });
                break;
            case 'diamond':
                this.crystalVis.createDiamondCubic(this.labScene, { repeat: repeatCount });
                break;
        }

        this.labScene.add('axes', this.labScene.createAxes(1.5));
        this._applyTeachingMotion(this.labScene);
        this._updateLabVisuals();
    }

    _updateLabVisuals() {
        if (!this.labScene) return;

        const showAxes = this.ui.get('lab-axes')?.checked ?? true;
        const showUnitCell = this.ui.get('lab-unitcell')?.checked ?? true;
        const showBonds = this.ui.get('lab-bonds')?.checked ?? false;
        const transparentAtoms = this.ui.get('lab-transparent')?.checked ?? false;
        const exploded = this.ui.get('lab-exploded')?.checked ?? false;
        const crossSection = this.ui.get('lab-cross-section')?.checked ?? false;
        const sliceDepth = parseInt(this.ui.get('lab-slice')?.value || '50') / 100;

        this.labScene.objects.forEach((obj, key) => {
            obj.traverse?.((child) => {
                const role = child.userData?.role;
                if (key === 'axes' || role === 'axes') child.visible = showAxes;
                if (role === 'unit-cell') child.visible = showUnitCell;
                if (role === 'bond') child.visible = showBonds;
                if (role === 'atom' && child.material) {
                    child.material.transparent = transparentAtoms || crossSection;
                    child.material.opacity = crossSection && child.position.y > (sliceDepth - 0.5) * 3
                        ? 0.12
                        : transparentAtoms ? 0.45 : 1;
                }
            });
        });

        this._setExplodedState(this.labScene, exploded, 0.55);
    }

    _updateAtomSize(scale) {
        // Scale all atoms in the current scene
        if (!this.moduleScene) return;
        this.moduleScene.objects.forEach((obj) => {
            obj.traverse?.((child) => {
                if (child.userData?.role === 'atom') {
                    child.userData.atomScale = scale;
                    child.scale.set(scale, scale, scale);
                }
            });
        });
    }

    _updateTransparency(value) {
        if (!this.moduleScene) return;
        this.moduleScene.objects.forEach((obj) => {
            obj.traverse?.((child) => {
                if (child.userData?.role === 'atom' && child.material) {
                    child.material.transparent = value > 0;
                    child.material.opacity = 1 - value;
                }
            });
        });
    }

    _toggleExplodedView(exploded) {
        if (!this.moduleScene) return;
        this._setExplodedState(this.moduleScene, exploded, 0.65);
    }

    _setExplodedState(sceneManager, exploded, strength = 0.5) {
        const atoms = this._collectAtoms(sceneManager);
        atoms.forEach((atom, index) => {
            if (!atom.userData.basePosition) {
                atom.userData.basePosition = atom.position.clone();
            }
            const base = atom.userData.basePosition;
            const direction = base.lengthSq() > 0.0001
                ? base.clone().normalize()
                : new THREE.Vector3(
                    Math.sin(index * 12.9898),
                    Math.cos(index * 78.233),
                    Math.sin(index * 37.719)
                ).normalize();

            atom.userData.targetPosition = exploded
                ? base.clone().add(direction.multiplyScalar(strength))
                : base.clone();
        });

        sceneManager.addAnimation('exploded-transition', (delta) => {
            let moving = false;
            atoms.forEach((atom) => {
                const target = atom.userData.targetPosition;
                if (!target) return;
                atom.position.lerp(target, Math.min(delta * 7, 1));
                if (atom.position.distanceToSquared(target) > 0.0001) moving = true;
            });
            if (!moving) sceneManager.removeAnimation('exploded-transition');
        });
    }

    _applyTeachingMotion(sceneManager) {
        const atoms = this._collectAtoms(sceneManager);
        atoms.forEach((atom) => {
            atom.userData.baseScale = atom.userData.baseScale || atom.scale.clone();
            atom.userData.basePosition = atom.userData.basePosition || atom.position.clone();
        });

        sceneManager.addAnimation('teaching-motion', (delta, elapsed) => {
            atoms.forEach((atom, index) => {
                const baseScale = atom.userData.baseScale;
                const atomScale = atom.userData.atomScale || 1;
                const pulse = 1 + Math.sin(elapsed * 2.2 + index * 0.55) * 0.035;
                atom.scale.set(
                    baseScale.x * atomScale * pulse,
                    baseScale.y * atomScale * pulse,
                    baseScale.z * atomScale * pulse
                );
            });
        });
    }

    _collectAtoms(sceneManager) {
        const atoms = [];
        sceneManager.objects.forEach((obj) => {
            obj.traverse?.((child) => {
                if (child.userData?.role === 'atom') atoms.push(child);
            });
        });
        return atoms;
    }

    // === Quiz Engine Integration ===
    _onQuizUpdate(qe) {
        const progress = qe.getProgress();
        const fill = this.ui.get('quiz-progress-fill');
        const counter = this.ui.get('quiz-counter');
        
        if (fill) fill.style.width = `${progress}%`;
        if (counter) counter.textContent = `${qe.currentIndex + 1}/${qe.totalQuestions}`;

        // Update buttons
        const prevBtn = this.ui.get('quiz-prev');
        const nextBtn = this.ui.get('quiz-next');
        const submitBtn = this.ui.get('quiz-submit');

        if (prevBtn) prevBtn.disabled = !qe.canPrev;
        if (nextBtn) nextBtn.style.display = qe.canNext ? '' : 'none';
        if (submitBtn) submitBtn.style.display = qe.allAnswered && !qe.canNext ? '' : 'none';

        // Re-render current question
        this._renderQuizQuestion();
    }

    _renderQuizQuestion() {
        const container = this.ui.get('quiz-content');
        if (!container) return;
        container.innerHTML = this.quizEngine.render();
        
        // Update counter
        const counter = this.ui.get('quiz-counter');
        if (counter) counter.textContent = `${this.quizEngine.currentIndex + 1}/${this.quizEngine.totalQuestions}`;
    }

    _handleQuizAnswer(answer) {
        const result = this.quizEngine.submitAnswer(answer);
        if (result) {
            this._renderQuizQuestion();
            if (result.isCorrect) {
                this.ui.notify('Correct!', 'success', 1500);
            } else {
                this.ui.notify('Review the explanation', 'error', 3000);
            }
        }
    }

    _quizPrev() {
        if (this.quizEngine.prev()) {
            this._renderQuizQuestion();
        }
    }

    _quizNext() {
        if (this.quizEngine.next()) {
            this._renderQuizQuestion();
        }
    }

    _quizSubmit() {
        const results = this.quizEngine.getResults();
        const container = this.ui.get('quiz-content');
        if (!container) return;

        const pct = results.percentage.toFixed(0);
        const grade = pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F';
        
        container.innerHTML = `
            <div class="quiz-results">
                <h2>Quiz Complete!</h2>
                <div class="math-equation">Score: ${results.score} / ${results.total} (${pct}%)</div>
                <div class="math-equation">Grade: ${grade}</div>
                <div class="learn-note">
                    <p>${pct >= 70 ? 'Great job! You have a solid understanding of this material.' : 'Keep practicing! Review the concepts you missed and try again.'}</p>
                </div>
                <div class="hero-actions" style="margin-top:20px">
                    <button id="quiz-restart-btn" class="btn btn-primary">Restart Quiz</button>
                    ${this.currentModuleId ? '<button id="quiz-back-module-btn" class="btn btn-secondary">Back to Module</button>' : ''}
                </div>
            </div>
        `;

        // Wire up buttons after they're in the DOM
        const restartBtn = document.getElementById('quiz-restart-btn');
        if (restartBtn) restartBtn.addEventListener('click', () => this._openQuiz());
        
        const backBtn = document.getElementById('quiz-back-module-btn');
        if (backBtn && this.currentModuleId) {
            backBtn.addEventListener('click', () => this._openModule(this.currentModuleId));
        }
        
        this.ui.notify(`Quiz complete! Score: ${pct}%`, pct >= 70 ? 'success' : 'info', 4000);
    }

    // Timer
    _startTimer() {
        this.timerInterval = setInterval(() => {
            this.learningTime++;
            const minutes = Math.floor(this.learningTime / 60);
            const timeStr = `${minutes}m`;
            const statTime = this.ui.get('stat-time');
            if (statTime) statTime.textContent = timeStr;
        }, 60000);
    }

    _hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

// Initialize the app when DOM is ready
const app = new CrystalLensApp();
window.__crystallens = app;
