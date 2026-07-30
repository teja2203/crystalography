/* ===== CrystalLens Navigation & Module System ===== */

export const MODULES = [
    { id: 1, title: 'Crystal Systems', icon: '◆', desc: 'Explore the 7 crystal systems based on symmetry, axes, and angles.', color: '#00d4ff' },
    { id: 2, title: 'Bravais Lattices', icon: '⬡', desc: 'All 14 Bravais lattices with interactive 3D visualization.', color: '#34d399' },
    { id: 3, title: 'Unit Cell', icon: '▣', desc: 'Primitive vs conventional cells, repeat patterns, infinite lattice.', color: '#ffb84d' },
    { id: 4, title: 'FCC Structure', icon: '●', desc: 'Face-centered cubic: construction, packing, properties.', color: '#ff6b9d' },
    { id: 5, title: 'BCC Structure', icon: '⏺', desc: 'Body-centered cubic: coordination, APF, density.', color: '#a78bfa' },
    { id: 6, title: 'HCP Structure', icon: '⬢', desc: 'Hexagonal close-packed: stacking, c/a ratio, applications.', color: '#f59e0b' },
    { id: 7, title: 'FCC vs BCC vs HCP', icon: '⇄', desc: 'Side-by-side comparison of the three main structures.', color: '#00d4ff' },
    { id: 8, title: 'Atomic Packing Factor', icon: 'π', desc: 'Visual derivation of APF for cubic and hexagonal systems.', color: '#34d399' },
    { id: 9, title: 'Coordination Number', icon: '⊕', desc: 'Interactive neighbor counting and coordination visualization.', color: '#ffb84d' },
    { id: 10, title: 'Density', icon: 'ρ', desc: 'Step-by-step density derivation from crystal parameters.', color: '#ff6b9d' },
    { id: 11, title: 'Miller Indices', icon: '∥', desc: 'Interactive Miller index generator with plane visualization.', color: '#a78bfa' },
    { id: 12, title: 'Crystal Directions', icon: '→', desc: 'Direction indices with interactive 3D vector display.', color: '#f59e0b' },
    { id: 13, title: 'Point Defects', icon: '⊙', desc: 'Vacancy, interstitial, substitution, Frenkel & Schottky defects.', color: '#00d4ff' },
    { id: 14, title: 'Dislocations', icon: '⊥', desc: 'Edge, screw & mixed dislocations with Burgers vector animation.', color: '#34d399' },
    { id: 15, title: 'Slip Systems', icon: '↗', desc: 'Slip planes and directions under applied stress.', color: '#ffb84d' },
    { id: 16, title: 'X-Ray Diffraction', icon: '◈', desc: 'Bragg\'s law, diffraction patterns, interactive XRD setup.', color: '#ff6b9d' },
    { id: 17, title: 'Reciprocal Lattice', icon: '⋆', desc: 'Real vs reciprocal space, Ewald sphere construction.', color: '#a78bfa' },
    { id: 18, title: 'Engineering Applications', icon: '⚙', desc: 'Semiconductors, MEMS, solar cells, aerospace, nanotechnology.', color: '#f59e0b' },
    { id: 19, title: 'Quiz Engine', icon: '?', desc: 'Interactive quizzes with visual questions and instant feedback.', color: '#00d4ff' },
    { id: 20, title: 'Final Revision', icon: '★', desc: 'Comprehensive review: formulas, charts, flashcards, and more.', color: '#ffb84d' }
];

export const MODULE_GROUPS = [
    { label: 'Fundamentals', ids: [1, 2, 3] },
    { label: 'Crystal Structures', ids: [4, 5, 6, 7] },
    { label: 'Properties', ids: [8, 9, 10] },
    { label: 'Crystallography', ids: [11, 12] },
    { label: 'Defects & Mechanics', ids: [13, 14, 15] },
    { label: 'Advanced Topics', ids: [16, 17] },
    { label: 'Applications & Review', ids: [18, 19, 20] }
];

/**
 * Build the sidebar module list
 */
export function buildModuleList(container, activeId = null, completed = {}) {
    if (!container) return;
    container.innerHTML = '';

    for (const group of MODULE_GROUPS) {
        const label = document.createElement('div');
        label.className = 'sidebar-section-label stagger-item';
        container.appendChild(label);

        for (const id of group.ids) {
            const mod = MODULES.find(m => m.id === id);
            if (!mod) continue;

            const item = document.createElement('button');
            item.className = 'module-item stagger-item';
            if (activeId === id) item.classList.add('active');
            if (completed[id]) item.classList.add('completed');

            item.dataset.moduleId = id;
            item.innerHTML = `
                <span class="module-icon-small" style="color:${mod.color}">${mod.icon}</span>
                <span>${mod.title}</span>
                ${completed[id] ? '<span class="module-check"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7L6 10L11 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' : ''}
            `;

            item.addEventListener('click', () => {
                document.querySelectorAll('.module-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                window.dispatchEvent(new CustomEvent('module-select', { detail: { moduleId: id } }));
            });

            container.appendChild(item);
        }
    }
    // Stagger animation plays automatically via .stagger-item class
}

/**
 * Build the roadmap on the dashboard
 */
export function buildRoadmap(container, completed = {}) {
    if (!container) return;
    container.innerHTML = '';

    MODULES.forEach((mod, idx) => {
        const item = document.createElement('div');
        item.className = 'roadmap-item stagger-item';
        item.style.animationDelay = `${idx * 0.04}s`;
        if (completed[mod.id]) item.classList.add('completed');
        if (idx === 0 && !Object.keys(completed).length) item.classList.add('active');

        item.innerHTML = `
            <div class="roadmap-item-header">
                <span class="roadmap-item-number">${String(mod.id).padStart(2, '0')}</span>
                <span class="roadmap-item-title">${mod.title}</span>
            </div>
            <div class="roadmap-item-desc">${mod.desc}</div>
        `;

        item.addEventListener('click', () => {
            item.classList.toggle('expanded');
            window.dispatchEvent(new CustomEvent('module-select', { detail: { moduleId: mod.id } }));
        });

        container.appendChild(item);
    });
    // Stagger animation plays automatically via .stagger-item class
}

/**
 * Build quick navigation grid
 */
export function buildQuickGrid(container) {
    if (!container) return;
    container.innerHTML = '';

    const quickModules = [1, 4, 5, 6, 8, 11, 13, 16];
    quickModules.forEach((id, idx) => {
        const mod = MODULES.find(m => m.id === id);
        if (!mod) return;

        const card = document.createElement('div');
        card.className = 'quick-card stagger-item';
        card.style.animationDelay = `${idx * 0.06}s`;
        card.innerHTML = `
            <div class="quick-card-icon">${mod.icon}</div>
            <div class="quick-card-title">${mod.title}</div>
            <div class="quick-card-desc">${mod.desc.slice(0, 40)}...</div>
        `;

        card.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('module-select', { detail: { moduleId: mod.id } }));
        });

        container.appendChild(card);
    });
    // Stagger animation plays automatically via .stagger-item class
}

/**
 * Update module content panels (Learn, Math, Practice, Summary)
 */
export function renderModuleContent(moduleId, tab = 'learn') {
    const content = getModuleContent(moduleId);
    if (!content) return '<p>Module content coming soon. This module includes interactive 3D visualization.</p>';

    switch (tab) {
        case 'learn': return renderLearnTab(content);
        case 'math': return renderMathTab(content);
        case 'practice': return renderPracticeTab(content);
        case 'summary': return renderSummaryTab(content);
        default: return '';
    }
}

function renderLearnTab(content) {
    if (!content.learn || !content.learn.length) return '<p>Learning content coming soon.</p>';

    const html = content.learn.map((section, si) => `
        <div class="learn-section stagger-item" style="animation-delay:${si * 0.08}s">
            <h3>${section.title}</h3>
            ${section.paragraphs.map(p => `<p class="learn-text">${p}</p>`).join('')}
            ${section.notes ? `<div class="learn-note"><p>${section.notes}</p></div>` : ''}
            ${section.list ? `<ul>${section.list.map(item => `<li>${item}</li>`).join('')}</ul>` : ''}
        </div>
    `).join('');
    return `<div class="stagger-children">${html}</div>`;
}

function renderMathTab(content) {
    if (!content.math || !content.math.length) return '<p>Mathematical derivations coming soon.</p>';

    const html = content.math.map((step, si) => `
        <div class="math-step stagger-item" style="animation-delay:${si * 0.1}s">
            <div class="math-step-label">${step.label}</div>
            <div class="math-step-content">${step.content}</div>
        </div>
    `).join('');
    return `<div class="stagger-children">${html}</div>`;
}

function renderPracticeTab(content) {
    if (!content.practice || !content.practice.length) return '<p>Practice questions coming soon.</p>';

    const html = content.practice.map((q, i) => `
        <div class="practice-question stagger-item scale-in" style="animation-delay:${i * 0.1}s; animation-fill-mode:both" data-q="${i}">
            <h4>${i + 1}. ${q.question}</h4>
            <div class="practice-options">
                ${q.options.map((opt, j) => `
                    <button class="practice-option" data-q="${i}" data-opt="${j}">${opt}</button>
                `).join('')}
            </div>
            <div class="practice-feedback" id="feedback-${i}"></div>
        </div>
    `).join('');
    return `<div class="stagger-children">${html}</div>`;
}

function renderSummaryTab(content) {
    if (!content.summary || !content.summary.length) return '<p>Summary coming soon.</p>';

    const html = content.summary.map(s => `
        <div class="summary-section stagger-item" style="animation-delay:${0}s">
            <h3>${s.title}</h3>
            ${s.items.map((item, ii) => `
                <div class="summary-key stagger-item" style="animation-delay:${ii * 0.05}s">
                    <span class="summary-key-icon">✦</span>
                    <span class="summary-key-text">${item}</span>
                </div>
            `).join('')}
        </div>
    `).join('');
    return `<div class="stagger-children">${html}</div>`;
}

/**
 * Get content for each module
 */
let _contentCache = null;

export function getModuleContent(moduleId) {
    if (!_contentCache) {
        _contentCache = _buildAllContent();
    }
    return _contentCache[moduleId] || null;
}

function _buildAllContent() {
    const C = {};

    // Module 1: Crystal Systems
    C[1] = {
        learn: [
            { title: 'Why Crystal Systems?',
              paragraphs: ['Crystals are defined by their repeating atomic patterns in 3D space. A crystal system is a classification based on the symmetry of the unit cell — specifically its axis lengths and interaxial angles.',
              'There are exactly 7 crystal systems in 3D: Cubic, Tetragonal, Orthorhombic, Hexagonal, Trigonal, Monoclinic, and Triclinic. Each represents a unique combination of symmetry operations.',
              'The fundamental principle: symmetry constrains the lattice parameters. For example, in a cubic system, all sides are equal (a = b = c) and all angles are 90°, giving the highest symmetry.'],
              notes: 'Think of crystal systems as the families of crystals. Just as triangles are classified by sides and angles, crystals are classified by unit cell dimensions and angles.' },
            { title: 'The 7 Crystal Systems',
              paragraphs: ['<strong>Cubic:</strong> a = b = c, alpha = beta = gamma = 90°. Highest symmetry. Includes FCC, BCC, simple cubic.',
              '<strong>Tetragonal:</strong> a = b != c, alpha = beta = gamma = 90°. Like a stretched cube.',
              '<strong>Orthorhombic:</strong> a != b != c, alpha = beta = gamma = 90°. Three unequal perpendicular axes.',
              '<strong>Hexagonal:</strong> a = b != c, alpha = beta = 90°, gamma = 120°. Six-fold symmetry.',
              '<strong>Trigonal (Rhombohedral):</strong> a = b = c, alpha = beta = gamma != 90°. Distorted cube.',
              '<strong>Monoclinic:</strong> a != b != c, alpha = gamma = 90°, beta != 90°. One tilted axis.',
              '<strong>Triclinic:</strong> a != b != c, alpha != beta != gamma != 90°. Lowest symmetry. No right angles.'],
              list: ['Cubic - Most symmetric (3 four-fold axes)', 'Tetragonal - One 4-fold axis', 'Orthorhombic - Three 2-fold axes', 'Hexagonal - One 6-fold axis', 'Trigonal - One 3-fold axis', 'Monoclinic - One 2-fold axis', 'Triclinic - No symmetry axes'] }
        ],
        math: [
            { label: 'Why only 7 systems?', content: 'The 7 crystal systems arise from the mathematical constraint that symmetry operations in a periodic lattice can only be of orders 1, 2, 3, 4, or 6. This is known as the <strong>crystallographic restriction theorem</strong>.' },
            { label: 'Lattice Parameter Constraints', content: 'Each system imposes constraints:<br><span class="math-inline">Cubic: a = b = c, alpha = beta = gamma = 90 deg</span><br><span class="math-inline">Tetragonal: a = b != c, alpha = beta = gamma = 90 deg</span><br><span class="math-inline">Orthorhombic: a != b != c, alpha = beta = gamma = 90 deg</span>' },
            { label: 'Volume Formulas', content: 'Unit cell volume depends on system:<br><span class="math-inline">Cubic: V = a^3</span><br><span class="math-inline">Hexagonal: V = (sqrt3/2) a^2 c</span>' }
        ],
        practice: [
            { question: 'How many crystal systems exist in 3D?', options: ['3', '7', '14', '6'], correct: 1 },
            { question: 'Which crystal system has the highest symmetry?', options: ['Tetragonal', 'Hexagonal', 'Cubic', 'Orthorhombic'], correct: 2 },
            { question: 'In the hexagonal system, what is the value of the gamma angle?', options: ['90 deg', '120 deg', '60 deg', '109.5 deg'], correct: 1 }
        ],
        summary: [
            { title: 'Key Concepts', items: ['Crystal systems classify crystals by symmetry of the unit cell', '7 systems exist: Cubic, Tetragonal, Orthorhombic, Hexagonal, Trigonal, Monoclinic, Triclinic', 'Symmetry decreases from Cubic (highest) to Triclinic (lowest)', 'Lattice parameters (a, b, c, alpha, beta, gamma) define each system', 'The crystallographic restriction theorem limits rotation symmetry to orders 1, 2, 3, 4, and 6'] }
        ]
    };

    // Module 2: Bravais Lattices
    C[2] = {
        learn: [
            { title: 'The 14 Bravais Lattices',
              paragraphs: ['Auguste Bravais proved in 1850 that there are exactly 14 distinct ways to arrange points in 3D space such that every point has the same environment.',
              'These 14 lattices are built from the 7 crystal systems by adding centering operations: Primitive (P), Body-centered (I), Face-centered (F), and Base-centered (C/A).',
              '<strong>Primitive (P):</strong> One lattice point per unit cell at corners only.<br><strong>Body-centered (I):</strong> One additional point at the center of the cell.<br><strong>Face-centered (F):</strong> Additional points at centers of all faces.<br><strong>Base-centered (C):</strong> Additional points at centers of one pair of faces.'],
              notes: 'Key insight: Bravais lattices describe the translational symmetry of crystals. Every lattice point sees the same arrangement of neighboring points.' }
        ],
        math: [
            { label: 'Counting Lattice Points', content: '<strong>Primitive (P):</strong> 1 point per cell (8 corners x 1/8)<br><strong>Body-centered (I):</strong> 2 points per cell (8 corners x 1/8 + 1 center)<br><strong>Face-centered (F):</strong> 4 points per cell (8 corners x 1/8 + 6 faces x 1/2)<br><strong>Base-centered (C):</strong> 2 points per cell (8 corners x 1/8 + 2 base faces x 1/2)' },
            { label: 'Distribution by System', content: '<strong>Cubic:</strong> 3 lattices (P, I, F)<br><strong>Tetragonal:</strong> 2 lattices (P, I)<br><strong>Orthorhombic:</strong> 4 lattices (P, I, F, C)<br><strong>Hexagonal:</strong> 1 lattice (P)<br><strong>Trigonal:</strong> 1 lattice (P)<br><strong>Monoclinic:</strong> 2 lattices (P, C)<br><strong>Triclinic:</strong> 1 lattice (P)<br><br><strong>Total: 14 Bravais lattices</strong>' }
        ],
        practice: [
            { question: 'How many Bravais lattices exist in 3D?', options: ['7', '14', '32', '230'], correct: 1 },
            { question: 'Why is there no C-centered cubic Bravais lattice?', options: ['It would violate cubic symmetry', 'It is impossible mathematically', 'It would have too many points', 'It would be identical to FCC'], correct: 0 },
            { question: 'How many lattice points does an FCC cell contain?', options: ['1', '2', '4', '8'], correct: 2 }
        ],
        summary: [
            { title: 'Key Concepts', items: ['14 Bravais lattices in 3D, discovered by Auguste Bravais in 1850', 'Built from 7 crystal systems with centering operations (P, I, F, C)', 'Primitive (P): 1 point/cell | Body-centered (I): 2 points/cell | Face-centered (F): 4 points/cell | Base-centered (C): 2 points/cell', 'Each lattice point must have identical surroundings', 'Centering options are limited by symmetry constraints of each system'] }
        ]
    };

    // Module 3: Unit Cell
    C[3] = {
        learn: [
            { title: 'The Unit Cell',
              paragraphs: ['A unit cell is the smallest repeating unit of a crystal structure that shows the full symmetry of the crystal.',
              '<strong>Primitive Cell:</strong> Contains exactly one lattice point. The smallest possible cell.<br><strong>Conventional Cell:</strong> May contain multiple lattice points but better reflects the crystal symmetry.',
              'Example: For FCC, the primitive cell contains 1 atom, while the conventional cell contains 4 atoms. The conventional cubic cell better shows the cubic symmetry.',
              'By repeating the unit cell in all three dimensions, we generate the infinite crystal lattice. This is called translational periodicity.'],
              notes: 'The choice of unit cell is not unique. We always choose the cell that best represents the symmetry of the crystal.' }
        ],
        math: [
            { label: 'Primitive Cell Volume', content: 'For a general cell with vectors a, b, c:<br><span class="math-inline">V = a . (b x c)</span><br>This is the scalar triple product.' },
            { label: 'Conventional vs Primitive', content: '<strong>FCC:</strong> V_conv = 4 x V_prim<br><strong>BCC:</strong> V_conv = 2 x V_prim<br><strong>HCP:</strong> V_conv = 3 x V_prim' }
        ],
        practice: [
            { question: 'What is the smallest repeating unit of a crystal called?', options: ['Unit cell', 'Crystal system', 'Bravais lattice', 'Lattice parameter'], correct: 0 },
            { question: 'How many atoms does a primitive cell of FCC contain?', options: ['1', '2', '4', '8'], correct: 0 }
        ],
        summary: [
            { title: 'Key Concepts', items: ['Unit cell = smallest repeating unit showing full symmetry', 'Primitive cell: 1 lattice point (smallest possible)', 'Conventional cell: chosen to show symmetry', 'Repeating the unit cell in 3D generates the infinite crystal', 'The choice of unit cell is not unique'] }
        ]
    };

    // Module 4: FCC
    C[4] = {
        learn: [
            { title: 'Face-Centered Cubic (FCC)',
              paragraphs: ['The Face-Centered Cubic (FCC) structure has atoms at each corner and at the center of each face of the cube.',
              '<strong>Key Properties:</strong><br>\u2022 Atoms per unit cell: 4<br>\u2022 Coordination Number: 12<br>\u2022 APF: 0.74 (theoretical maximum for equal spheres)<br>\u2022 Nearest neighbor distance: a sqrt2 / 2<br>\u2022 Atomic radius: r = a sqrt2 / 4',
              'FCC is one of the most common crystal structures in metals: Al, Cu, Au, Ag, Ni, Pt, and many more.',
              'The close-packed planes are the {111} family, which are the slip planes in FCC metals. The stacking sequence is ABCABC...',
              '<button id="build-fcc-btn" class="btn btn-primary" style="margin-top:10px;"><i class="fas fa-layer-group"></i> Build Layer-by-Layer</button>'],
              notes: 'FCC achieves the maximum packing density possible for equal spheres. This is why it is called face-centered cubic close-packed.' }
        ],
        math: [
            { label: '1. Atoms per unit cell', content: 'n = 8 corners x 1/8 + 6 faces x 1/2 = 1 + 3 = <strong>4 atoms</strong>' },
            { label: '2. Atomic radius relation', content: 'Atoms touch along the face diagonal.<br>Face diagonal = 4r = a sqrt2<br>r = a sqrt2 / 4 = a / (2 sqrt2)' },
            { label: '3. Atomic Packing Factor', content: 'APF = n x (4/3)pi r^3 / a^3<br>= 4 x (4/3)pi (a sqrt2/4)^3 / a^3<br>= <strong>pi sqrt2 / 6 ~= 0.74</strong>' }
        ],
        practice: [
            { question: 'How many atoms are in an FCC unit cell?', options: ['1', '2', '4', '6'], correct: 2 },
            { question: 'What is the coordination number of FCC?', options: ['8', '10', '12', '14'], correct: 2 },
            { question: 'What is the APF of FCC?', options: ['0.68', '0.74', '0.52', '0.86'], correct: 1 },
            { question: 'Along which direction do atoms touch in FCC?', options: ['Cube edge [100]', 'Face diagonal [110]', 'Body diagonal [111]', 'None of these'], correct: 1 }
        ],
        summary: [
            { title: 'FCC Key Properties', items: ['Atoms per cell: 4 (8 corners x 1/8 + 6 faces x 1/2)', 'Coordination Number: 12', 'Atomic Packing Factor: 0.74 (maximum)', 'Atomic radius: r = a sqrt2 / 4', 'Stacking sequence: ABCABC...', 'Common in: Al, Cu, Au, Ag, Ni, Pt'] }
        ]
    };

    // Module 5: BCC
    C[5] = {
        learn: [
            { title: 'Body-Centered Cubic (BCC)',
              paragraphs: ['The Body-Centered Cubic (BCC) structure has atoms at each corner of the cube and one atom at the body center.',
              '<strong>Key Properties:</strong><br>\u2022 Atoms per unit cell: 2<br>\u2022 Coordination Number: 8<br>\u2022 APF: 0.68<br>\u2022 Nearest neighbor distance: a sqrt3 / 2<br>\u2022 Atomic radius: r = a sqrt3 / 4',
              'BCC is common in: Fe (at room temp), Cr, W, Mo, V, Nb, Ta, and alkali metals (Li, Na, K).',
              'Unlike FCC, BCC does NOT have close-packed planes. The closest packed planes are {110}, and the slip direction is [111].',
              '<button id="build-bcc-btn" class="btn btn-primary" style="margin-top:10px;"><i class="fas fa-layer-group"></i> Build Layer-by-Layer</button>'],
              notes: 'BCC is less densely packed than FCC (68% vs 74%). This gives BCC metals different mechanical properties.' }
        ],
        math: [
            { label: '1. Atoms per unit cell', content: 'n = 8 corners x 1/8 + 1 body center = <strong>2 atoms</strong>' },
            { label: '2. Atomic radius relation', content: 'Atoms touch along the body diagonal.<br>Body diagonal = 4r = a sqrt3<br>r = a sqrt3 / 4' },
            { label: '3. Atomic Packing Factor', content: 'APF = n x (4/3)pi r^3 / a^3<br>= 2 x (4/3)pi (a sqrt3/4)^3 / a^3<br>= <strong>pi sqrt3 / 8 ~= 0.68</strong>' }
        ],
        practice: [
            { question: 'How many atoms are in a BCC unit cell?', options: ['1', '2', '4', '3'], correct: 1 },
            { question: 'What is the coordination number of BCC?', options: ['6', '8', '10', '12'], correct: 1 },
            { question: 'What is the APF of BCC?', options: ['0.74', '0.68', '0.52', '0.86'], correct: 1 },
            { question: 'Which metal has BCC structure at room temperature?', options: ['Aluminum', 'Copper', 'Tungsten', 'Gold'], correct: 2 }
        ],
        summary: [
            { title: 'BCC Key Properties', items: ['Atoms per cell: 2 (8 corners x 1/8 + 1 body center)', 'Coordination Number: 8', 'Atomic Packing Factor: 0.68', 'Atomic radius: r = a sqrt3 / 4', 'Slip system: {110}[111]', 'Common in: alpha-Fe, Cr, W, Mo, V, Nb, Ta'] }
        ]
    };

    // Module 6: HCP
    C[6] = {
        learn: [
            { title: 'Hexagonal Close-Packed (HCP)',
              paragraphs: ['The Hexagonal Close-Packed (HCP) structure is the second close-packed structure (APF = 0.74), along with FCC.',
              '<strong>Key Properties:</strong><br>\u2022 Atoms per unit cell: 6<br>\u2022 Coordination Number: 12<br>\u2022 APF: 0.74<br>\u2022 Ideal c/a ratio: sqrt(8/3) ~= 1.633',
              'HCP is common in: Mg, Zn, Ti (at room T), Co, Zr, Be, and many rare-earth metals.',
              'The stacking sequence in HCP is ABABAB... The layers are close-packed hexagonally, with the third layer aligning directly above the first.',
              'The c/a ratio deviates from ideal in real materials. For example: Mg (1.624), Zn (1.861), Ti (1.587).',
              '<button id="build-hcp-btn" class="btn btn-primary" style="margin-top:10px;"><i class="fas fa-layer-group"></i> Build Layer-by-Layer</button>'],
              notes: 'HCP and FCC differ only in stacking sequence! Both have APF = 0.74 and CN = 12. FCC = ABCABC stacking, HCP = ABABAB stacking.' }
        ],
        math: [
            { label: '1. Atoms per unit cell', content: 'n = 12 corners x 1/6 + 2 face centers x 1/2 + 3 interior = <strong>6 atoms</strong>' },
            { label: '2. Ideal c/a ratio', content: 'In a close-packed hexagonal arrangement:<br>c = 2 x sqrt(2/3) x a = sqrt(8/3) x a<br>c/a = sqrt(8/3) ~= 1.633' },
            { label: '3. Atomic Packing Factor', content: 'APF = n x (4/3)pi r^3 / V_cell = <strong>pi sqrt2 / 6 ~= 0.74</strong><br>Same as FCC - both are close-packed structures.' }
        ],
        practice: [
            { question: 'What is the ideal c/a ratio for HCP?', options: ['1.414', '1.633', '1.732', '1.5'], correct: 1 },
            { question: 'What is the stacking sequence of HCP?', options: ['ABCABC', 'ABABAB', 'AABBCC', 'ABACABAC'], correct: 1 },
            { question: 'How many atoms per unit cell in HCP?', options: ['2', '4', '6', '8'], correct: 2 },
            { question: 'Which metal has HCP structure at room temperature?', options: ['Iron', 'Copper', 'Magnesium', 'Aluminum'], correct: 2 }
        ],
        summary: [
            { title: 'HCP Key Properties', items: ['Atoms per cell: 6', 'Coordination Number: 12', 'Atomic Packing Factor: 0.74 (close-packed)', 'Ideal c/a: sqrt(8/3) ~= 1.633', 'Stacking sequence: ABABAB...', 'Slip system: basal (0001)[11-20]', 'Common in: Mg, Zn, Ti, Co, Zr, Be'] }
        ]
    };

    // Module 7: Comparison (FCC vs BCC vs HCP)
    C[7] = {
        learn: [
            { title: 'FCC vs BCC vs HCP',
              paragraphs: ['Each of the three major crystal structures has unique characteristics that determine material properties.',
              '<strong>Packing Density:</strong><br>FCC: 0.74 (close-packed)<br>HCP: 0.74 (close-packed)<br>BCC: 0.68 (not close-packed)',
              '<strong>Coordination Number:</strong><br>FCC: 12<br>HCP: 12<br>BCC: 8',
              '<strong>Ductility:</strong><br>FCC: Highly ductile (12 slip systems)<br>BCC: Ductile at high T, brittle at low T (48 slip systems but only 5 independent)<br>HCP: Typically brittle (only 3-6 slip systems)',
              '<strong>Stacking Sequence:</strong><br>FCC: ABCABC<br>HCP: ABABAB<br>BCC: No close-packed layers'],
              notes: 'The number of slip systems directly correlates with ductility. More slip systems mean more ways for dislocations to move.' }
        ],
        math: [
            { label: 'Properties Comparison', content: '<strong>Property | FCC | BCC | HCP</strong><br>Atoms/cell | 4 | 2 | 6<br>CN | 12 | 8 | 12<br>APF | 0.74 | 0.68 | 0.74<br>r in terms of a | sqrt2/4 | sqrt3/4 | a/2<br>nn distance | a/sqrt2 | a sqrt3/2 | a' }
        ],
        practice: [
            { question: 'Which structures have APF = 0.74?', options: ['FCC only', 'HCP only', 'Both FCC and HCP', 'FCC, HCP, and BCC'], correct: 2 },
            { question: 'Why are FCC metals generally more ductile than HCP metals?', options: ['Higher APF', 'More slip systems', 'Lower CN', 'Smaller atoms'], correct: 1 },
            { question: 'What is common between FCC and HCP?', options: ['Same APF', 'Same stacking sequence', 'Same number of atoms/cell', 'Same mechanical properties'], correct: 0 }
        ],
        summary: [
            { title: 'Comparison Summary', items: ['FCC: 4 atoms/cell, CN=12, APF=0.74, ductile, ABCABC stacking', 'BCC: 2 atoms/cell, CN=8, APF=0.68, variable ductility, no close-packed layers', 'HCP: 6 atoms/cell, CN=12, APF=0.74, brittle, ABABAB stacking', 'Slip systems determine ductility: FCC (12) > BCC (48, 5 indep.) > HCP (3-6)'] }
        ]
    };

    // Module 8: APF
    C[8] = {
        learn: [
            { title: 'Atomic Packing Factor (APF)',
              paragraphs: ['Atomic Packing Factor (APF) is the fraction of volume in a unit cell occupied by atoms. It is a measure of how efficiently space is used.',
              '<strong>APF = Volume of atoms in cell / Volume of unit cell</strong>',
              'For equal spheres, the maximum possible APF is 0.74 (achieved by FCC and HCP). The minimum APF for a stable structure is around 0.52 (simple cubic).',
              'APF is dimensionless and independent of the size of atoms — it depends only on the type of crystal structure.',
              'Higher APF generally means: higher density, lower compressibility, and different mechanical properties.'],
              notes: 'Understanding APF helps explain why some materials are heavier or more compressible than others.' }
        ],
        math: [
            { label: '1. General Formula', content: 'APF = n x V_atom / V_cell<br>where n = atoms per cell, V_atom = (4/3)pi r^3' },
            { label: '2. Simple Cubic', content: 'r = a/2, n = 1<br>APF = (4/3)pi (a/2)^3 / a^3 = pi/6 ~= 0.52' },
            { label: '3. BCC', content: 'r = a sqrt3/4, n = 2<br>APF = pi sqrt3/8 ~= 0.68' },
            { label: '4. FCC / HCP', content: 'r = a sqrt2/4, n = 4 (FCC)<br>APF = pi sqrt2/6 ~= 0.74<br>This is the <strong>maximum APF</strong> for equal spheres.' },
            { label: '5. Summary Table', content: '<strong>Simple Cubic:</strong> 0.52<br><strong>BCC:</strong> 0.68<br><strong>FCC:</strong> 0.74 (maximum)<br><strong>HCP:</strong> 0.74 (maximum)<br><strong>Diamond Cubic:</strong> 0.34' }
        ],
        practice: [
            { question: 'What is the maximum possible APF for equal spheres?', options: ['0.68', '0.74', '0.86', '0.52'], correct: 1 },
            { question: 'What is the APF of BCC?', options: ['0.52', '0.68', '0.74', '0.62'], correct: 1 },
            { question: 'Which structure has the lowest APF among these?', options: ['FCC', 'BCC', 'Simple Cubic', 'HCP'], correct: 2 }
        ],
        summary: [
            { title: 'Key Concepts', items: ['APF = (atoms per cell x volume of one atom) / volume of unit cell', 'Simple Cubic: 0.52 | BCC: 0.68 | FCC: 0.74 | HCP: 0.74', 'Maximum APF for equal spheres: 0.74', 'Diamond cubic has very low APF (0.34) due to open structure'] }
        ]
    };

    // Module 9: Coordination Number
    C[9] = {
        learn: [
            { title: 'Interactive Coordination Counting',
              paragraphs: ['Coordination Number is the number of nearest neighbors surrounding an atom in a crystal structure.',
              'Click the atoms in the 3D view to count the nearest neighbors sequentially!',
              '<div class="coord-counter-ui"><div class="coord-count-display">Neighbors Found: <span id="coord-count">0</span> / 12</div><div class="coord-progress-bar"><div id="coord-progress-fill" style="width: 0%;"></div></div><button id="coord-reset-btn" class="btn btn-secondary" style="margin-top:10px;">Reset Count</button></div>',
              '<strong>CN by Structure:</strong><br>\u2022 Simple Cubic: 6<br>\u2022 BCC: 8<br>\u2022 FCC: 12<br>\u2022 HCP: 12',
              'CN = 12 is the maximum possible for equal spheres, achieved by both FCC and HCP.'],
              notes: 'To count CN in FCC: pick any atom. In the same close-packed plane it has 6 neighbors. Three neighbors in the plane above and three in the plane below = 6 + 3 + 3 = 12.' }
        ],
        math: [
            { label: 'Counting Neighbors', content: '<strong>Simple Cubic:</strong> 6 (4 in same plane + 1 above + 1 below)<br><strong>BCC:</strong> 8 (center atom has 8 corner neighbors)<br><strong>FCC:</strong> 12 (6 in same plane + 3 above + 3 below)<br><strong>HCP:</strong> 12 (6 in same plane + 3 above + 3 below)' },
            { label: 'Nearest Neighbor Distances', content: '<strong>SC:</strong> d = a<br><strong>BCC:</strong> d = a sqrt3/2 ~= 0.866a<br><strong>FCC:</strong> d = a sqrt2/2 ~= 0.707a<br><strong>HCP:</strong> d = a (within basal plane)' }
        ],
        practice: [
            { question: 'What is the maximum coordination number for equal spheres?', options: ['8', '10', '12', '14'], correct: 2 },
            { question: 'What is the CN of BCC?', options: ['6', '8', '12', '10'], correct: 1 },
            { question: 'Structures with CN = 12 have what APF?', options: ['0.52', '0.68', '0.74', '0.86'], correct: 2 }
        ],
        summary: [
            { title: 'Key Concepts', items: ['Coordination Number = number of nearest neighbors', 'SC: 6 | BCC: 8 | FCC: 12 | HCP: 12 | Diamond: 4', 'FCC and HCP both achieve CN = 12, the maximum for equal spheres', 'Higher CN - denser packing - higher melting point'] }
        ]
    };

    // Module 10: Density
    C[10] = {
        learn: [
            { title: 'Theoretical Density',
              paragraphs: ['The theoretical density of a crystal can be calculated from its unit cell parameters.',
              '<strong>rho = n x M / (N_A x V_cell)</strong>',
              'Where:<br>\u2022 n = number of atoms per unit cell<br>\u2022 M = atomic mass (g/mol)<br>\u2022 N_A = Avogadro number (6.022 x 10^23 mol^-1)<br>\u2022 V_cell = volume of unit cell',
              'This formula gives the maximum possible density (theoretical). Real density may be lower due to defects.',
              'Example: Copper (FCC, a = 3.615 Angstrom, M = 63.55 g/mol)'],
              notes: 'Density calculations are a powerful way to verify crystal structures experimentally.' }
        ],
        math: [
            { label: '1. Density Formula', content: 'rho = n x M / (N_A x a^3)' },
            { label: '2. Example: Copper (FCC)', content: 'M = 63.55 g/mol, a = 3.615 Angstrom = 3.615 x 10^-8 cm<br>n = 4 atoms (FCC)<br>V = a^3 = (3.615 x 10^-8)^3 = 4.72 x 10^-23 cm^3<br><br>rho = 4 x 63.55 / (6.022 x 10^23 x 4.72 x 10^-23)<br>= 254.2 / 28.42 = <strong>8.94 g/cm^3</strong>' },
            { label: '3. Example: Tungsten (BCC)', content: 'M = 183.84 g/mol, a = 3.165 Angstrom, n = 2<br>rho = 2 x 183.84 / (6.022 x 10^23 x 31.70 x 10^-24)<br>= <strong>19.25 g/cm^3</strong>' }
        ],
        practice: [
            { question: 'What is the theoretical density of FCC Copper?', options: ['7.89 g/cm^3', '8.94 g/cm^3', '9.82 g/cm^3', '10.21 g/cm^3'], correct: 1 },
            { question: 'How does density change with lattice parameter a?', options: ['Increases with a', 'Decreases with a^3', 'Decreases with a', 'No change'], correct: 1 }
        ],
        summary: [
            { title: 'Key Concepts', items: ['Theoretical density: rho = nM / (N_A V_cell)', 'Depends on: atoms per cell (n), atomic mass (M), cell volume (V)', 'More atoms per cell - higher density', 'Larger lattice parameter - lower density (inverse cubic)', 'Real density less than or equal to theoretical density'] }
        ]
    };

    // Module 11: Miller Indices
    C[11] = {
        learn: [
            { title: 'Interactive Miller Indices',
              paragraphs: ['Use the controls below to input Miller indices (h, k, l) and watch the plane construction step-by-step.',
              '<div class="miller-inputs"><div class="miller-input-group"><label>h:</label><input type="number" id="miller-h" class="miller-num-input" value="1" min="-5" max="5"></div><div class="miller-input-group"><label>k:</label><input type="number" id="miller-k" class="miller-num-input" value="1" min="-5" max="5"></div><div class="miller-input-group"><label>l:</label><input type="number" id="miller-l" class="miller-num-input" value="1" min="-5" max="5"></div><button id="miller-animate-btn" class="btn btn-primary" style="margin-left:auto;">Animate Plane</button></div>',
              '<div class="miller-presets"><button class="miller-preset-btn" data-h="1" data-k="0" data-l="0">(1 0 0)</button><button class="miller-preset-btn" data-h="1" data-k="1" data-l="0">(1 1 0)</button><button class="miller-preset-btn" data-h="1" data-k="1" data-l="1">(1 1 1)</button><button class="miller-preset-btn" data-h="2" data-k="1" data-l="0">(2 1 0)</button></div>',
              '<div id="miller-derivation-live"></div>',
              '<strong>Steps to find Miller indices:</strong><br>1. Find intercepts of the plane on the axes<br>2. Take reciprocals of the intercepts<br>3. Clear fractions (multiply by LCM)<br>4. Enclose in parentheses (hkl)',
              'Click the generated plane in the 3D view or use the controls above to animate & calculate step-by-step!'],
              notes: 'Miller indices are universally used in crystallography. Understanding them is essential for XRD analysis, slip systems, and crystal growth.' }
        ],
        math: [
            { label: 'Interactive Derivation', content: '<div id="miller-step-animator"></div><p style="text-align:center; margin-top:10px; font-size:0.9em; color:var(--text-tertiary);">Tip: Generate a plane in the Learn tab, then click on it to see its derivation here.</p>' }
        ],
        practice: [
            { question: 'What does the Miller index (hkl) represent?', options: ['A direction', 'A plane', 'A point', 'A bond'], correct: 1 },
            { question: 'What is the Miller index for the plane intercepting at a, infinity, infinity?', options: ['(100)', '(110)', '(111)', '(001)'], correct: 0 },
            { question: 'How are negative intercepts denoted in Miller indices?', options: ['With a minus sign', 'With a bar over the number', 'With parentheses', 'With a subscript'], correct: 1 }
        ],
        summary: [
            { title: 'Key Concepts', items: ['Miller indices (hkl) describe crystal planes', 'Find intercepts, take reciprocals, clear fractions, enclose in parentheses', 'Direction [hkl] is perpendicular to plane (hkl) in cubic systems', 'd-spacing: d = a / sqrt(h^2 + k^2 + l^2) for cubic', 'Negative intercepts have bars: (1-bar-00)'] }
        ]
    };

    // Module 12: Crystal Directions
    C[12] = {
        learn: [
            { title: 'Crystal Directions',
              paragraphs: ['Crystal directions are denoted by [uvw] in square brackets. They describe vectors in the crystal lattice.',
              '<strong>Rules:</strong><br>\u2022 Smallest integers: Always reduce to smallest integer set<br>\u2022 Negative indices: Bar over the number, e.g., [1-bar-1-bar-1] for [-1 -1 -1]<br>\u2022 Family of directions: Angle brackets <uvw> denote all equivalent directions',
              'Examples: <100> includes [100], [010], [001], [1-bar-00], [01-bar-0], [001-bar-]',
              'In cubic crystals, direction [hkl] is perpendicular to plane (hkl), but this is NOT true in other crystal systems.'],
              notes: 'Direction indices are essential for describing slip directions, crystal growth, and anisotropic properties.' }
        ],
        math: [
            { label: '1. Finding Direction Indices', content: 'Step 1: Find vector components along axes<br>Step 2: Clear fractions<br>Step 3: Reduce to smallest integers<br>Step 4: Enclose in [uvw]' },
            { label: '2. Angle between directions', content: 'cos theta = (u1u2 + v1v2 + w1w2) / (sqrt(u1^2+v1^2+w1^2) x sqrt(u2^2+v2^2+w2^2))' },
            { label: '3. Linear density', content: 'Linear density = number of atoms centered on direction vector / length of direction vector' }
        ],
        practice: [
            { question: 'How are crystal directions denoted?', options: ['(hkl)', '[uvw]', '{hkl}', '<uvw>'], correct: 1 },
            { question: 'What angle bracket symbol denotes a family of directions?', options: ['()', '[]', '{}', '<>'], correct: 3 },
            { question: 'In cubic crystals, direction [hkl] is _____ to plane (hkl).', options: ['Parallel', 'Perpendicular', 'At 45 degrees', 'Unrelated'], correct: 1 }
        ],
        summary: [
            { title: 'Key Concepts', items: ['Directions denoted [uvw] in square brackets', 'Always reduce to smallest integers', 'Angle brackets <uvw> denote families of directions', 'In cubic: direction [hkl] is perpendicular to plane (hkl)', 'Linear density = atoms centered on direction / vector length'] }
        ]
    };

    // Module 13: Point Defects
    C[13] = {
        learn: [
            { title: 'Point Defects',
              paragraphs: ['Point defects are zero-dimensional defects that involve one or two atomic positions.',
              '<strong>Types of Point Defects:</strong><br>\u2022 <strong>Vacancy:</strong> Missing atom from a regular lattice site<br>\u2022 <strong>Interstitial:</strong> Extra atom in a non-lattice position (interstice)<br>\u2022 <strong>Substitutional:</strong> Foreign atom replacing a host atom<br>\u2022 <strong>Frenkel Defect:</strong> Atom moved from lattice site to interstitial, creating a vacancy-interstitial pair<br>\u2022 <strong>Schottky Defect:</strong> Missing cation-anion pair (in ionic crystals)',
              'Vacancies are always present in crystals at thermodynamic equilibrium. The concentration increases exponentially with temperature.'],
              notes: 'Point defects dramatically affect material properties: electrical conductivity, diffusion rates, color, and mechanical strength.' }
        ],
        math: [
            { label: 'Equilibrium Vacancy Concentration', content: 'N_v / N = exp(-Q_v / kT)<br>where N_v = number of vacancies, N = total sites, Q_v = activation energy, k = Boltzmann constant, T = temperature' },
            { label: 'Frenkel Defect Concentration', content: 'n = sqrt(N N_i) exp(-E_f / 2kT)<br>where N = lattice sites, N_i = interstitial sites, E_f = formation energy' }
        ],
        practice: [
            { question: 'What is a vacancy?', options: ['An extra atom in the lattice', 'A missing atom from a lattice site', 'An atom in the wrong position', 'A line defect'], correct: 1 },
            { question: 'What is a Frenkel defect?', options: ['A missing atom + surface atom', 'An atom moved to interstitial leaving a vacancy', 'A pair of missing atoms', 'An impurity atom'], correct: 1 },
            { question: 'What distinguishes Schottky from Frenkel?', options: ['Schottky involves cations and anions', 'Schottky is only in metals', 'Schottky has no interstitial', 'Both A and C'], correct: 3 }
        ],
        summary: [
            { title: 'Key Concepts', items: ['Point defects: vacancy, interstitial, substitutional', 'Frenkel: vacancy-interstitial pair', 'Schottky: missing cation-anion pair (in ionic crystals)', 'Vacancy concentration: N_v/N = exp(-Q_v/kT)', 'Defects control diffusion, conductivity, and mechanical properties'] }
        ]
    };

    // Module 14: Dislocations
    C[14] = {
        learn: [
            { title: 'Dislocations',
              paragraphs: ['Dislocations are line defects in crystals that enable plastic deformation at stresses far below theoretical strength.',
              '<strong>Edge Dislocation:</strong> An extra half-plane of atoms inserted into the lattice. Characterized by a Burgers vector perpendicular to the dislocation line.',
              '<strong>Screw Dislocation:</strong> A helical ramp of atomic planes. Burgers vector is parallel to the dislocation line.',
              '<strong>Mixed Dislocation:</strong> Has both edge and screw components.',
              'The Burgers vector b describes the magnitude and direction of lattice distortion. The energy of a dislocation is proportional to |b|^2.'],
              notes: 'Dislocations explain why real crystals are 100-1000 times weaker than theoretically predicted. They are essential for understanding plasticity.' }
        ],
        math: [
            { label: 'Burgers Vector', content: 'The Burgers vector is determined by a Burgers circuit: a closed loop around the dislocation in the real crystal compared to a perfect crystal.' },
            { label: 'Dislocation Energy', content: 'E ~= (G b^2) / (4pi) x ln(R/r_0)<br>where G = shear modulus, b = Burgers vector magnitude, R = outer cutoff radius, r_0 = core radius' },
            { label: 'Peierls Stress', content: 'sigma_P = (2G / (1-nu)) exp(-2pi w / b)<br>Stress required to move a dislocation through the lattice.' }
        ],
        practice: [
            { question: 'What is an edge dislocation?', options: ['A line defect with an extra half-plane', 'A helical atomic arrangement', 'A point defect cluster', 'A grain boundary'], correct: 0 },
            { question: 'What is the Burgers vector of an edge dislocation?', options: ['Parallel to dislocation line', 'Perpendicular to dislocation line', 'At 45 degrees', 'Variable'], correct: 1 },
            { question: 'What is a screw dislocation?', options: ['A line defect with helical atomic planes', 'An extra half-plane', 'A point defect', 'A twin boundary'], correct: 0 }
        ],
        summary: [
            { title: 'Key Concepts', items: ['Dislocations enable plastic deformation at low stresses', 'Edge: extra half-plane, b perpendicular to line', 'Screw: helical ramp, b parallel to line', 'Mixed: both edge and screw components', 'Burgers vector b: magnitude and direction of distortion', 'Dislocation energy proportional to |b|^2'] }
        ]
    };

    // Module 15: Slip Systems
    C[15] = {
        learn: [
            { title: 'Slip Systems',
              paragraphs: ['A slip system is a combination of a slip plane and a slip direction within that plane along which dislocation motion occurs most easily.',
              '<strong>FCC:</strong> Slip plane {111}, slip direction <110>. 12 slip systems. Highly ductile.',
              '<strong>BCC:</strong> Slip plane {110}, {112}, {123}, slip direction <111>. 48 slip systems possible, but only 5 are usually independent.',
              '<strong>HCP:</strong> Slip plane (0001) basal, slip direction <11-20>. 3 slip systems. Limited ductility.',
              'The number of independent slip systems determines whether a polycrystalline material can undergo general plastic deformation (Von Mises criterion: 5 required).'],
              notes: 'FCC metals are ductile because they have 12 slip systems. HCP metals are often brittle because they have only 3-6.' }
        ],
        math: [
            { label: 'Schmid Law', content: 'tau_RSS = sigma cos phi cos lambda<br>where tau_RSS = resolved shear stress, sigma = applied stress, phi = angle between slip plane normal and stress axis, lambda = angle between slip direction and stress axis' },
            { label: 'Critical Resolved Shear Stress (CRSS)', content: 'Slip occurs when tau_RSS >= tau_CRSS<br>tau_CRSS is the minimum stress required to activate a slip system.' }
        ],
        practice: [
            { question: 'What is the slip system in FCC?', options: ['{110}[111]', '{111}[110]', '{112}[111]', '{001}[100]'], correct: 1 },
            { question: 'How many slip systems does FCC have?', options: ['5', '8', '12', '24'], correct: 2 },
            { question: 'Why are HCP metals often brittle?', options: ['Low APF', 'Few slip systems', 'High CN', 'High c/a ratio'], correct: 1 }
        ],
        summary: [
            { title: 'Key Concepts', items: ['Slip system = slip plane + slip direction', 'FCC: {111}<110>, 12 systems, ductile', 'BCC: {110}<111>, 48 systems (5 independent)', 'HCP: (0001)<11-20>, 3-6 systems, brittle', 'Schmid law: tau_RSS = sigma cos phi cos lambda', 'von Mises criterion: 5 independent slip systems for general plasticity'] }
        ]
    };

    // Module 16: XRD
    C[16] = {
        learn: [
            { title: 'X-Ray Diffraction (XRD)',
              paragraphs: ['X-ray diffraction is a powerful technique for determining crystal structures. When X-rays interact with a crystal, they produce diffraction patterns that reveal atomic arrangements.',
              '<strong>Bragg Law:</strong> n lambda = 2d sin theta<br>where n = order of reflection, lambda = wavelength, d = interplanar spacing, theta = Bragg angle',
              'Constructive interference occurs when the path difference between waves scattered from adjacent planes equals an integer number of wavelengths.',
              'XRD can determine: crystal structure, lattice parameters, phase identification, grain size, stress, and texture.'],
              notes: 'XRD is one of the most important tools in materials science. It was used to discover the structure of DNA (by Franklin) and countless other materials.' }
        ],
        math: [
            { label: '1. Bragg Law', content: 'n lambda = 2d sin theta' },
            { label: '2. d-spacing (Cubic)', content: 'd_hkl = a / sqrt(h^2 + k^2 + l^2)' },
            { label: '3. Example', content: 'NaCl (200) peak with Cu K-alpha (lambda = 1.54 Angstrom)<br>d_200 = 2.82 Angstrom<br>sin theta = 1 x 1.54 / (2 x 2.82) = 0.273<br>theta = sin^-1(0.273) = 15.84 deg<br>2-theta = <strong>31.68 deg</strong>' },
            { label: '4. Structure Factor', content: 'F_hkl = sum f_j exp(2pi i (hx_j + ky_j + lz_j))<br>Determines peak intensity. Systematic absences identify structure type.' }
        ],
        practice: [
            { question: 'What is Bragg law?', options: ['n lambda = d sin theta', 'n lambda = 2d sin theta', 'n lambda = d cos theta', 'n lambda = 2d cos theta'], correct: 1 },
            { question: 'What does d-spacing refer to in XRD?', options: ['Atomic diameter', 'Distance between crystal planes', 'Unit cell length', 'Detector distance'], correct: 1 },
            { question: 'What causes systematic absences in XRD patterns?', options: ['Poor sample preparation', 'Structure factor cancellation', 'Instrument error', 'Absorption effects'], correct: 1 }
        ],
        summary: [
            { title: 'Key Concepts', items: ['Bragg law: n lambda = 2d sin theta', 'XRD determines crystal structure and phase identification', 'd-spacing is distance between crystal planes', 'Structure factor determines peak intensities', 'Systematic absences identify Bravais lattice type', 'Peak width gives grain size information'] }
        ]
    };

    // Module 17: Reciprocal Lattice
    C[17] = {
        learn: [
            { title: 'Reciprocal Lattice',
              paragraphs: ['The reciprocal lattice is a mathematical construct where each point corresponds to a set of crystal planes in real space.',
              'If real space lattice vectors are a, b, c, then reciprocal space vectors are:', 'a* = (b x c) / V, b* = (c x a) / V, c* = (a x b) / V, where V = a . (b x c) is the unit cell volume.',
              'The Ewald sphere construction shows which reciprocal lattice points satisfy Bragg condition for a given X-ray wavelength.',
              'Key relationship: |G| = 2pi / d, where G is a reciprocal lattice vector and d is the d-spacing.'],
              notes: 'The reciprocal lattice is essential for understanding diffraction. Every diffraction spot corresponds to a reciprocal lattice point.' }
        ],
        math: [
            { label: '1. Reciprocal Lattice Vectors', content: 'a* = (b x c) / V<br>b* = (c x a) / V<br>c* = (a x b) / V<br>where V = a . (b x c)' },
            { label: '2. Relationship', content: 'G = h a* + k b* + l c*<br>|G| = 2pi / d_hkl' },
            { label: '3. Ewald Sphere', content: 'A sphere of radius 1/lambda centered on the crystal. Diffraction occurs when a reciprocal lattice point lies on the sphere surface.' }
        ],
        practice: [
            { question: 'A reciprocal lattice point corresponds to:', options: ['Atomic positions', 'Crystal planes (hkl)', 'Atomic radii', 'Bond lengths'], correct: 1 },
            { question: '|G| is proportional to:', options: ['d-spacing', '1/d-spacing', 'sqrt(d)', 'd^2'], correct: 1 },
            { question: 'The Ewald sphere radius is:', options: ['1/lambda', 'lambda', '2pi/lambda', '1/(2 lambda)'], correct: 0 }
        ],
        summary: [
            { title: 'Key Concepts', items: ['Reciprocal lattice: each point corresponds to a set of (hkl) planes', 'a* = (b x c)/V, etc.', '|G| = 2pi/d', 'Ewald sphere construction determines diffraction condition', 'Essential for XRD interpretation and solid-state physics'] }
        ]
    };

    // Module 18: Engineering Applications
    C[18] = {
        learn: [
            { title: 'Engineering Applications of Crystallography',
              paragraphs: ['Understanding crystal structures is fundamental to modern engineering and technology.',
              '<strong>Semiconductors:</strong> Silicon (diamond cubic), GaAs (zinc blende). Crystal structure determines band gap and electronic properties.',
              '<strong>IC Fabrication:</strong> Silicon wafers are cut along specific crystal planes ((100), (111)) for optimal device performance.',
              '<strong>Power Electronics:</strong> SiC (hexagonal), GaN (wurtzite) for high-power, high-temperature devices.',
              '<strong>MEMS:</strong> Silicon anisotropic etching depends on crystal orientation. Different planes etch at different rates.',
              '<strong>Solar Cells:</strong> Silicon (diamond cubic), perovskites, CIGS. Efficiency depends on crystal quality and defects.',
              '<strong>Lithium Batteries:</strong> Layered cathode materials (e.g., LiCoO2) rely on crystal structure for ion intercalation.',
              '<strong>Aerospace:</strong> Ti alloys (HCP alpha + BCC beta) for high-strength, lightweight components.',
              '<strong>Mechanical:</strong> Steel (BCC ferrite, FCC austenite). Phase transformations control strength.',
              '<strong>Ceramics:</strong> Al2O3 (corundum), ZrO2 (fluorite). Crystal structure determines hardness and toughness.',
              '<strong>Nanotechnology:</strong> Quantum dots, nanowires, 2D materials (graphene, MoS2). Properties depend on crystal structure and size.'],
              notes: 'Crystallography is the hidden foundation of modern technology. Every electronic device relies on precisely controlled crystal structures.' }
        ],
        math: [
            { label: 'Key Parameters', content: '<strong>Si:</strong> Diamond cubic, a = 5.43 Angstrom, band gap = 1.12 eV<br><strong>GaAs:</strong> Zinc blende, a = 5.65 Angstrom, band gap = 1.43 eV<br><strong>SiC:</strong> Hexagonal, a = 3.08 Angstrom, c = 15.12 Angstrom, band gap = 3.26 eV<br><strong>GaN:</strong> Wurtzite, a = 3.19 Angstrom, c = 5.19 Angstrom, band gap = 3.44 eV' }
        ],
        practice: [
            { question: 'What is the crystal structure of silicon?', options: ['FCC', 'BCC', 'Diamond cubic', 'HCP'], correct: 2 },
            { question: 'Why are Si wafers cut along specific crystal planes?', options: ['For appearance', 'For optimal electronic properties', 'To reduce cost', 'For mechanical strength only'], correct: 1 },
            { question: 'Which crystal structure does GaAs have?', options: ['Diamond cubic', 'Zinc blende', 'Wurtzite', 'Rock salt'], correct: 1 }
        ],
        summary: [
            { title: 'Key Applications', items: ['Semiconductors: Si (diamond), GaAs (zinc blende)', 'Power electronics: SiC, GaN (wide bandgap)', 'MEMS: Orientation-dependent etching of Si', 'Solar cells: Crystal quality determines efficiency', 'Batteries: Layered structures for ion intercalation', 'Aerospace: Ti alloys (HCP + BCC)', 'Steel: BCC (ferrite) / FCC (austenite) phase control', 'Ceramics: Structure determines hardness/toughness'] }
        ]
    };

    // Module 19: Quiz
    C[19] = {
        learn: [
            { title: 'Comprehensive Quiz',
              paragraphs: ['Test your understanding of crystallography with interactive quizzes covering all modules.',
              'Question types include:<br>\u2022 Multiple choice<br>\u2022 Visual identification<br>\u2022 Calculations<br>\u2022 Concept questions',
              'Each question includes immediate feedback with detailed explanations.',
              'Track your progress and revisit challenging topics.'],
              notes: 'Try the comprehensive quiz to test all your knowledge! Open it from the module view.' }
        ],
        math: [
            { label: 'Quiz Topics', content: '<strong>Fundamentals:</strong> Crystal systems, Bravais lattices, unit cells<br><strong>Structures:</strong> FCC, BCC, HCP properties<br><strong>Calculations:</strong> APF, density, d-spacing<br><strong>Advanced:</strong> Miller indices, defects, XRD' }
        ],
        practice: [
            { question: 'The stacking sequence ABCABC corresponds to which structure?', options: ['HCP', 'FCC', 'BCC', 'Simple Cubic'], correct: 1 },
            { question: 'What is the APF of a structure with CN = 12?', options: ['0.52', '0.68', '0.74', 'Cannot determine'], correct: 2 },
            { question: 'Which defect involves a vacancy-interstitial pair?', options: ['Schottky', 'Frenkel', 'Substitutional', 'Edge dislocation'], correct: 1 }
        ],
        summary: [
            { title: 'Ready for Testing?', items: ['20 modules of crystallography knowledge', '100+ practice questions with explanations', 'Visual 3D demonstrations for every concept', 'Track your progress across all modules', 'Focus on weak areas with targeted quizzes'] }
        ]
    };

    // Module 20: Final Revision
    C[20] = {
        learn: [
            { title: 'Final Revision Mode',
              paragraphs: ['This comprehensive review module covers everything you need for exams, interviews, and real-world applications.',
              '<strong>Topics Covered:</strong><br>\u2022 All 7 crystal systems and 14 Bravais lattices<br>\u2022 FCC, BCC, HCP structures and properties<br>\u2022 APF, density, and coordination number calculations<br>\u2022 Miller indices and crystal directions<br>\u2022 Defects, dislocations, and slip systems<br>\u2022 XRD, Bragg law, and reciprocal lattice<br>\u2022 Engineering applications'],
              notes: 'Use this module for last-minute revision before exams or interviews.' }
        ],
        math: [
            { label: 'Essential Formulas', content: '<strong>APF:</strong> SC=0.52, BCC=0.68, FCC=0.74, HCP=0.74<br><strong>Density:</strong> rho = n M / (N_A V)<br><strong>Bragg:</strong> n lambda = 2d sin theta<br><strong>d-spacing:</strong> d = a / sqrt(h^2 + k^2 + l^2) (cubic)<br><strong>Schmid:</strong> tau_RSS = sigma cos phi cos lambda' },
            { label: 'Common Mistakes', content: '\u2022 Confusing FCC and HCP (same APF, different stacking)<br>\u2022 Using cubic d-spacing formula for non-cubic crystals<br>\u2022 Forgetting to convert Angstrom to cm for density<br>\u2022 Mixing up direction [uvw] and plane (hkl) indices<br>\u2022 Assuming CN determines APF (FCC and HCP both have CN=12)',
              list: ['Always check units in calculations', 'Remember FCC and HCP have the same APF but different stacking', 'Miller indices: (, ) for planes, [] for directions, {} for families, <> for direction families'] }
        ],
        practice: [
            { question: 'What are the APF values for SC, BCC, FCC, HCP?', options: ['0.52, 0.74, 0.68, 0.74', '0.52, 0.68, 0.74, 0.74', '0.68, 0.52, 0.74, 0.74', '0.52, 0.68, 0.74, 0.68'], correct: 1 },
            { question: 'What is the Bragg law formula?', options: ['n lambda = d sin theta', 'n lambda = 2d sin theta', 'n lambda = d/sin theta', 'n lambda = 2d/sin theta'], correct: 1 },
            { question: 'Which structure has the highest APF?', options: ['Simple Cubic', 'BCC', 'Diamond Cubic', 'FCC'], correct: 3 }
        ],
        summary: [
            { title: 'Quick Reference', items: ['7 crystal systems, 14 Bravais lattices', 'FCC: 4 atoms/cell, CN=12, APF=0.74', 'BCC: 2 atoms/cell, CN=8, APF=0.68', 'HCP: 6 atoms/cell, CN=12, APF=0.74', 'Miller indices (, ) for planes, [] for directions', 'Bragg: n lambda = 2d sin theta', 'FCC slip: {111}<110> | BCC slip: {110}<111> | HCP slip: (0001)<11-20>', 'Schmid law: tau_RSS = sigma cos phi cos lambda'] }
        ]
    };

    return C;
}
