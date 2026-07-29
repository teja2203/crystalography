/* ===== CrystalLens Quiz Engine ===== */

/**
 * Complete quiz engine supporting multiple question types:
 * - Multiple choice with visual feedback
 * - Interactive ordering / drag and drop
 * - Visual identification (identify crystal structures from images)
 * - Calculation questions
 * - Concept questions with explanations
 */
export class QuizEngine {
    constructor() {
        this.questions = [];
        this.currentIndex = 0;
        this.answers = [];
        this.score = 0;
        this.totalQuestions = 0;
        this.isComplete = false;
        this.onUpdate = null;
    }

    /**
     * Load questions for a specific module
     */
    loadModule(moduleId) {
        const questions = this._getModuleQuestions(moduleId);
        this.questions = this._shuffle(questions);
        this.currentIndex = 0;
        this.answers = new Array(this.questions.length).fill(null);
        this.score = 0;
        this.totalQuestions = this.questions.length;
        this.isComplete = false;
        return this;
    }

    /**
     * Load comprehensive quiz across all modules
     */
    loadComprehensive(count = 20) {
        let allQuestions = [];
        for (let i = 1; i <= 20; i++) {
            allQuestions = allQuestions.concat(this._getModuleQuestions(i));
        }
        this.questions = this._shuffle(allQuestions).slice(0, count);
        this.currentIndex = 0;
        this.answers = new Array(this.questions.length).fill(null);
        this.score = 0;
        this.totalQuestions = this.questions.length;
        this.isComplete = false;
        return this;
    }

    /**
     * Get current question
     */
    getCurrent() {
        return this.questions[this.currentIndex] || null;
    }

    /**
     * Get question at index
     */
    get(index) {
        return this.questions[index] || null;
    }

    /**
     * Submit answer for current question
     */
    submitAnswer(answer) {
        const q = this.getCurrent();
        if (!q || this.answers[this.currentIndex] !== null) return null;

        const isCorrect = q.type === 'ordering'
            ? this._checkOrdering(answer, q.correct)
            : answer === q.correct;

        this.answers[this.currentIndex] = {
            answer,
            isCorrect,
            timestamp: Date.now()
        };

        if (isCorrect) this.score++;

        if (this.onUpdate) this.onUpdate(this);

        return {
            isCorrect,
            correctAnswer: q.correct,
            explanation: q.explanation || ''
        };
    }

    /**
     * Navigate to next question
     */
    next() {
        if (this.currentIndex < this.questions.length - 1) {
            this.currentIndex++;
            return true;
        }
        return false;
    }

    /**
     * Navigate to previous question
     */
    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return true;
        }
        return false;
    }

    /**
     * Check if can go to next
     */
    get canNext() {
        return this.currentIndex < this.questions.length - 1;
    }

    /**
     * Check if can go to prev
     */
    get canPrev() {
        return this.currentIndex > 0;
    }

    /**
     * Check if all questions answered
     */
    get allAnswered() {
        return this.answers.every(a => a !== null);
    }

    /**
     * Get progress percentage
     */
    getProgress() {
        const answered = this.answers.filter(a => a !== null).length;
        return this.totalQuestions > 0 ? (answered / this.totalQuestions) * 100 : 0;
    }

    /**
     * Get final results
     */
    getResults() {
        return {
            score: this.score,
            total: this.totalQuestions,
            percentage: this.totalQuestions > 0 ? (this.score / this.totalQuestions) * 100 : 0,
            answers: this.answers,
            questions: this.questions,
            timeSpent: 0
        };
    }

    /**
     * Render current question to HTML
     */
    render() {
        const q = this.getCurrent();
        if (!q) return '<div class="quiz-empty">No questions available.</div>';

        const isAnswered = this.answers[this.currentIndex] !== null;
        const answerData = this.answers[this.currentIndex];

        let html = `<div class="quiz-question">
            <div class="question-number">Question ${this.currentIndex + 1} of ${this.totalQuestions}</div>
            <h3>${q.question}</h3>
        </div>`;

        switch (q.type) {
            case 'multiple':
                html += this._renderMultipleChoice(q, isAnswered, answerData);
                break;
            case 'ordering':
                html += this._renderOrdering(q, isAnswered, answerData);
                break;
            case 'visual':
                html += this._renderVisual(q, isAnswered, answerData);
                break;
            case 'calculation':
                html += this._renderCalculation(q, isAnswered, answerData);
                break;
            default:
                html += this._renderMultipleChoice(q, isAnswered, answerData);
        }

        if (isAnswered) {
            const feedbackClass = answerData.isCorrect ? 'correct' : 'wrong';
            html += `<div class="quiz-feedback show ${feedbackClass}">
                <h4>${answerData.isCorrect ? '✓ Correct!' : '✗ Incorrect'}</h4>
                <p>${q.explanation || (answerData.isCorrect ? 'Great job!' : 'Review the concept and try again.')}</p>
            </div>`;
        }

        return html;
    }

    _renderMultipleChoice(q, isAnswered, answerData) {
        let html = '<div class="quiz-options">';
        q.options.forEach((opt, i) => {
            let cls = 'quiz-option';
            if (isAnswered) {
                if (i === q.correct) cls += ' correct';
                if (i === answerData?.answer) cls += answerData.isCorrect ? ' correct' : ' wrong';
                if (i === answerData?.answer) cls += ' selected';
            }
            html += `<button class="${cls}" data-opt="${i}" ${isAnswered ? 'disabled' : ''}>
                <span class="quiz-option-indicator">${isAnswered && i === q.correct ? '✓' : isAnswered && i === answerData?.answer && !answerData.isCorrect ? '✗' : ''}</span>
                <span>${opt}</span>
            </button>`;
        });
        html += '</div>';
        return html;
    }

    _renderOrdering(q, isAnswered, answerData) {
        let html = '<div class="ordering-container"><p class="ordering-hint">Arrange the items in the correct order:</p><div class="ordering-list">';
        const items = isAnswered ? q.correct : this._shuffle([...q.options]);
        items.forEach((item, i) => {
            html += `<div class="ordering-item" data-idx="${i}">
                <span class="ordering-number">${i + 1}</span>
                <span>${item}</span>
            </div>`;
        });
        html += '</div></div>';
        return html;
    }

    _renderVisual(q, isAnswered, answerData) {
        let html = `<div class="quiz-image">
            <svg width="200" height="150" viewBox="0 0 200 150">
                ${q.visual || ''}
            </svg>
        </div>`;
        html += '<div class="quiz-options">';
        q.options.forEach((opt, i) => {
            let cls = 'quiz-option';
            if (isAnswered) {
                if (i === q.correct) cls += ' correct';
                if (i === answerData?.answer) cls += answerData.isCorrect ? ' correct' : ' wrong';
            }
            html += `<button class="${cls}" data-opt="${i}" ${isAnswered ? 'disabled' : ''}>
                <span class="quiz-option-indicator"></span>
                <span>${opt}</span>
            </button>`;
        });
        html += '</div>';
        return html;
    }

    _renderCalculation(q, isAnswered, answerData) {
        let html = `<div class="calculation-question">
            <div class="math-block">${q.formula || ''}</div>
            <p>${q.instruction || 'Calculate the answer:'}</p>
            <div class="calculation-input">
                <input type="text" class="calc-input" placeholder="Enter your answer..." ${isAnswered ? 'disabled' : ''} value="${isAnswered ? answerData?.answer : ''}">
                <span class="calc-unit">${q.unit || ''}</span>
            </div>
        </div>`;
        if (isAnswered) {
            html += `<div class="math-block">Correct answer: ${q.correct}</div>`;
        }
        return html;
    }

    _checkOrdering(userOrder, correct) {
        if (!Array.isArray(userOrder) || !Array.isArray(correct)) return false;
        if (userOrder.length !== correct.length) return false;
        return userOrder.every((item, i) => item === correct[i]);
    }

    _shuffle(arr) {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Get module-specific questions
     */
    _getModuleQuestions(moduleId) {
        const questionBank = {
            1: [ // Crystal Systems
                { question: 'How many crystal systems exist in three dimensions?', options: ['3', '7', '14', '32'], correct: 1, type: 'multiple', explanation: 'There are exactly 7 crystal systems in 3D: Cubic, Tetragonal, Orthorhombic, Hexagonal, Trigonal, Monoclinic, and Triclinic.' },
                { question: 'Which crystal system has all axes equal (a = b = c) and all angles 90°?', options: ['Tetragonal', 'Cubic', 'Orthorhombic', 'Hexagonal'], correct: 1, type: 'multiple', explanation: 'The cubic system has a = b = c and α = β = γ = 90°. It has the highest symmetry.' },
                { question: 'What is the value of the γ angle in the hexagonal system?', options: ['90°', '120°', '60°', '109.5°'], correct: 1, type: 'multiple', explanation: 'Hexagonal: a = b ≠ c, α = β = 90°, γ = 120°.' },
                { question: 'Which system has the LOWEST symmetry?', options: ['Monoclinic', 'Trigonal', 'Triclinic', 'Hexagonal'], correct: 2, type: 'multiple', explanation: 'Triclinic has a ≠ b ≠ c and α ≠ β ≠ γ ≠ 90° — the lowest symmetry.' },
                { question: 'The crystallographic restriction theorem limits rotation symmetry to which orders?', options: ['1,2,3,4,5', '1,2,3,4,6', '1,2,3,5,6', '2,3,4,5,6'], correct: 1, type: 'multiple', explanation: 'Only rotations of order 1, 2, 3, 4, and 6 are compatible with translational periodicity.' },
            ],
            2: [ // Bravais Lattices
                { question: 'How many Bravais lattices are there in 3D?', options: ['7', '14', '32', '230'], correct: 1, type: 'multiple', explanation: 'Auguste Bravais proved there are exactly 14 distinct Bravais lattices in 3D.' },
                { question: 'How many lattice points does a face-centered cubic (FCC) cell contain?', options: ['1', '2', '4', '8'], correct: 2, type: 'multiple', explanation: 'FCC: 8 corners × ⅛ + 6 faces × ½ = 1 + 3 = 4 points per cell.' },
                { question: 'Which centering type is NOT found in the cubic system?', options: ['Body-centered (I)', 'Face-centered (F)', 'Base-centered (C)', 'All are found'], correct: 2, type: 'multiple', explanation: 'Base-centered (C) cubic would violate cubic symmetry, so only P, I, and F exist for cubic.' },
                { question: 'How many Bravais lattices does the orthorhombic system have?', options: ['1', '2', '3', '4'], correct: 3, type: 'multiple', explanation: 'Orthorhombic has 4 Bravais lattices: P, I, F, C — the most of any system.' },
            ],
            4: [ // FCC
                { question: 'How many atoms are in an FCC unit cell?', options: ['2', '4', '6', '8'], correct: 1, type: 'multiple', explanation: 'FCC: 8 corners × ⅛ + 6 faces × ½ = 4 atoms per unit cell.' },
                { question: 'What is the coordination number of FCC?', options: ['8', '10', '12', '14'], correct: 2, type: 'multiple', explanation: 'Every atom in FCC has 12 nearest neighbors — the maximum possible for equal spheres.' },
                { question: 'What is the APF of FCC?', options: ['0.52', '0.68', '0.74', '0.86'], correct: 2, type: 'multiple', explanation: 'FCC has APF = π√2/6 ≈ 0.74, the maximum packing density for equal spheres.' },
                { question: 'Along which direction do atoms touch in FCC?', options: ['[100]', '[110]', '[111]', '[210]'], correct: 1, type: 'multiple', explanation: 'Atoms in FCC touch along the face diagonal <110>, giving 4r = a√2.' },
                { question: 'Which of these metals crystallizes in FCC?', options: ['Iron (room temp)', 'Tungsten', 'Aluminum', 'Magnesium'], correct: 2, type: 'multiple', explanation: 'Aluminum is FCC. Iron at room temp is BCC, Tungsten is BCC, Magnesium is HCP.' },
            ],
            5: [ // BCC
                { question: 'How many atoms are in a BCC unit cell?', options: ['1', '2', '4', '6'], correct: 1, type: 'multiple', explanation: 'BCC: 8 corners × ⅛ + 1 body center = 2 atoms per unit cell.' },
                { question: 'What is the coordination number of BCC?', options: ['6', '8', '10', '12'], correct: 1, type: 'multiple', explanation: 'BCC has CN = 8 — each atom has 8 nearest neighbors.' },
                { question: 'What is the APF of BCC?', options: ['0.52', '0.68', '0.74', '0.55'], correct: 1, type: 'multiple', explanation: 'BCC has APF = π√3/8 ≈ 0.68.' },
                { question: 'Atoms touch along which direction in BCC?', options: ['[100]', '[110]', '[111]', '[100]'], correct: 2, type: 'multiple', explanation: 'In BCC, atoms touch along the body diagonal <111>, giving 4r = a√3.' },
            ],
            6: [ // HCP
                { question: 'What is the ideal c/a ratio for HCP?', options: ['1.414', '1.633', '1.732', '1.500'], correct: 1, type: 'multiple', explanation: 'c/a = √(8/3) ≈ 1.633 for ideal hexagonal close-packing.' },
                { question: 'What is the stacking sequence of HCP?', options: ['ABCABC', 'ABABAB', 'AABBCC', 'ABAC'], correct: 1, type: 'multiple', explanation: 'HCP follows ABABAB stacking, while FCC follows ABCABC.' },
                { question: 'How many atoms per unit cell does HCP have?', options: ['2', '4', '6', '12'], correct: 2, type: 'multiple', explanation: 'HCP has 6 atoms per unit cell (12 corners × ⅙ + 2 face centers × ½ + 3 interior).' },
                { question: 'Which metal has HCP structure at room temperature?', options: ['Copper', 'Iron', 'Magnesium', 'Aluminum'], correct: 2, type: 'multiple', explanation: 'Mg is HCP. Cu is FCC, Fe is BCC, Al is FCC.' },
            ],
            8: [ // APF
                { question: 'What is the atomic packing factor (APF) of simple cubic?', options: ['0.52', '0.68', '0.74', '0.34'], correct: 0, type: 'multiple', explanation: 'Simple cubic APF = π/6 ≈ 0.52.' },
                { question: 'What is the maximum APF for packing equal spheres?', options: ['0.68', '0.74', '0.86', '1.00'], correct: 1, type: 'multiple', explanation: 'The maximum APF for equal spheres is π√2/6 ≈ 0.74 (FCC and HCP).' },
                { question: 'Which structure has the LOWEST APF?', options: ['BCC', 'FCC', 'Simple Cubic', 'HCP'], correct: 2, type: 'multiple', explanation: 'Simple cubic has APF = 0.52, lower than BCC (0.68) or FCC/HCP (0.74).' },
                { question: 'Does APF depend on atomic size?', options: ['Yes', 'No, only on structure type', 'Only for non-cubic', 'Inversely'], correct: 1, type: 'multiple', explanation: 'APF is dimensionless and depends only on the crystal structure, not on the actual atomic radius.' },
            ],
            9: [ // Coordination Number
                { question: 'What is the maximum coordination number for equal spheres?', options: ['8', '10', '12', '14'], correct: 2, type: 'multiple', explanation: 'The maximum CN for equal spheres is 12, achieved by both FCC and HCP.' },
                { question: 'What is the coordination number of diamond cubic?', options: ['4', '6', '8', '12'], correct: 0, type: 'multiple', explanation: 'Diamond cubic has CN = 4 (tetrahedral coordination).' },
                { question: 'How many nearest neighbors does an atom have in BCC?', options: ['6', '8', '10', '12'], correct: 1, type: 'multiple', explanation: 'BCC has 8 nearest neighbors — each atom is surrounded by 8 atoms at the corners of the cube.' },
            ],
            10: [ // Density
                { question: 'What is the theoretical density formula for a crystal?', options: ['ρ = nM/NₐV', 'ρ = nV/NₐM', 'ρ = NₐM/nV', 'ρ = nNₐ/MV'], correct: 0, type: 'multiple', explanation: 'Density ρ = n × M / (Nₐ × V_cell), where n = atoms/cell, M = atomic mass, Nₐ = Avogadro\'s number.' },
                { question: 'Copper (FCC) has a = 3.615 Å, M = 63.55 g/mol. What is its theoretical density?', options: ['7.89 g/cm³', '8.94 g/cm³', '9.82 g/cm³', '6.55 g/cm³'], correct: 1, type: 'multiple', explanation: 'Using ρ = 4 × 63.55 / (6.022×10²³ × (3.615×10⁻⁸)³) = 8.94 g/cm³.' },
            ],
            11: [ // Miller Indices
                { question: 'What does the Miller index (hkl) represent?', options: ['A direction', 'A plane', 'A point', 'A bond'], correct: 1, type: 'multiple', explanation: 'Miller indices (hkl) describe a set of parallel crystallographic planes.' },
                { question: 'What is the Miller index for the plane that intercepts at a, ∞, ∞?', options: ['(100)', '(110)', '(111)', '(001)'], correct: 0, type: 'multiple', explanation: 'The plane intercepts at x = a, y = ∞, z = ∞. Reciprocals: 1, 0, 0 → (100).' },
                { question: 'How are negative intercepts denoted in Miller indices?', options: ['With a minus sign', 'With a bar over the number', 'With parentheses', 'With a subscript'], correct: 1, type: 'multiple', explanation: 'Negative intercepts are denoted with a bar over the index, e.g., (1̄00).' },
            ],
            13: [ // Point Defects
                { question: 'What is a vacancy?', options: ['An extra atom in the lattice', 'A missing atom from a lattice site', 'An atom in the wrong position', 'A line defect'], correct: 1, type: 'multiple', explanation: 'A vacancy is simply a missing atom from a regular lattice site.' },
                { question: 'What is a Frenkel defect?', options: ['A missing atom + surface atom', 'An atom moved to interstitial site leaving a vacancy', 'A pair of missing atoms', 'An impurity atom'], correct: 1, type: 'multiple', explanation: 'A Frenkel defect consists of an atom displaced from its lattice site to an interstitial site, creating a vacancy-interstitial pair.' },
                { question: 'What distinguishes a Schottky defect from a Frenkel defect?', options: ['Schottky involves cations and anions', 'Schottky is only in metals', 'Schottky has no interstitial', 'Both A and C'], correct: 3, type: 'multiple', explanation: 'Schottky defects involve missing pairs of cations and anions, creating vacancies without interstitials.' },
            ],
            14: [ // Dislocations
                { question: 'What is an edge dislocation?', options: ['A line defect with an extra half-plane', 'A helical atomic arrangement', 'A point defect cluster', 'A grain boundary'], correct: 0, type: 'multiple', explanation: 'An edge dislocation is characterized by an extra half-plane of atoms inserted into the lattice.' },
                { question: 'What is the Burgers vector of an edge dislocation?', options: ['Parallel to the dislocation line', 'Perpendicular to the dislocation line', 'At 45° to the dislocation line', 'Variable'], correct: 1, type: 'multiple', explanation: 'For an edge dislocation, the Burgers vector is perpendicular to the dislocation line.' },
                { question: 'What is a screw dislocation?', options: ['A line defect with helical atomic planes', 'An extra half-plane', 'A point defect', 'A twin boundary'], correct: 0, type: 'multiple', explanation: 'A screw dislocation creates a helical ramp of atomic planes. The Burgers vector is parallel to the dislocation line.' },
            ],
            15: [ // Slip Systems
                { question: 'What is the slip system in FCC?', options: ['{110}<111>', '{111}<110>', '{112}<111>', '{001}<100>'], correct: 1, type: 'multiple', explanation: 'FCC slips on {111} planes in <110> directions. This gives 12 slip systems.' },
                { question: 'How many independent slip systems does FCC have?', options: ['5', '8', '12', '24'], correct: 2, type: 'multiple', explanation: 'FCC has 12 slip systems (4 {111} planes × 3 <110> directions per plane).' },
                { question: 'Why are HCP metals often brittle?', options: ['Low APF', 'Few slip systems', 'High CN', 'High c/a ratio'], correct: 1, type: 'multiple', explanation: 'HCP typically has only 3 slip systems, far fewer than FCC (12) or BCC (48), limiting plastic deformation.' },
            ],
            16: [ // XRD
                { question: 'What is Bragg\'s law?', options: ['nλ = d sin θ', 'nλ = 2d sin θ', 'nλ = d cos θ', 'nλ = 2d cos θ'], correct: 1, type: 'multiple', explanation: 'Bragg\'s law: nλ = 2d sin θ, where d is the interplanar spacing, θ is the incident angle, and λ is the wavelength.' },
                { question: 'What does d-spacing refer to in XRD?', options: ['Atomic diameter', 'Distance between crystal planes', 'Unit cell length', 'Detector distance'], correct: 1, type: 'multiple', explanation: 'd-spacing is the perpendicular distance between adjacent parallel crystal planes.' },
            ],
            17: [ // Reciprocal Lattice
                { question: 'The reciprocal lattice vector is related to: ', options: ['Atomic positions', 'Crystal planes', 'Atomic radii', 'Bond lengths'], correct: 1, type: 'multiple', explanation: 'Each reciprocal lattice point corresponds to a set of crystal planes (hkl).' },
                { question: 'The magnitude of a reciprocal lattice vector is: ', options: ['Proportional to d-spacing', 'Inversely proportional to d-spacing', 'Equal to d-spacing', 'Independent of d-spacing'], correct: 1, type: 'multiple', explanation: '|G| = 2π/d, so it is inversely proportional to the d-spacing.' },
            ],
            19: [ // Quiz Engine
                { question: 'The stacking sequence ABCABC corresponds to which structure?', options: ['HCP', 'FCC', 'BCC', 'Simple Cubic'], correct: 1, type: 'multiple', explanation: 'ABCABC stacking gives FCC (face-centered cubic). ABABAB gives HCP.' },
                { question: 'What is the APF of a structure with CN = 12?', options: ['0.52', '0.68', '0.74', 'Cannot determine'], correct: 2, type: 'multiple', explanation: 'CN = 12 corresponds to close-packed structures (FCC/HCP) with APF = 0.74.' },
            ]
        };

        return questionBank[moduleId] || [];
    }
}
