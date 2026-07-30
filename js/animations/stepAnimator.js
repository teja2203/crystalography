/* ===== CrystalLens Step-by-Step Derivation Animator ===== */

export class StepAnimator {
    constructor(containerId, title = "Step-by-Step Derivation") {
        this.containerId = containerId;
        this.title = title;
        this.steps = [];
        this.currentStep = -1;
        this.isPlaying = false;
        this.delayMs = 2500; // default delay between steps
        this.timerId = null;
        this.onStepComplete = null;
        this.onPlayStateChange = null;
    }

    addStep(htmlContent, highlightVars = [], callback = null) {
        this.steps.push({
            html: htmlContent,
            vars: highlightVars,
            callback: callback
        });
        return this;
    }

    setSteps(steps) {
        this.steps = steps;
        return this;
    }

    setDelay(ms) {
        this.delayMs = ms;
        return this;
    }

    onStep(callback) {
        this.onStepComplete = callback;
        return this;
    }

    onStateChange(callback) {
        this.onPlayStateChange = callback;
        return this;
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        let html = `
            <div class="step-animator-container">
                <div class="step-animator-header">
                    <span class="step-animator-title">${this.title}</span>
                    <span class="progress-percent" id="${this.containerId}-progress">0 / ${this.steps.length}</span>
                </div>
                <div class="step-animator-content" id="${this.containerId}-content">
                    <!-- Steps injected here -->
                    <div style="text-align:center; padding:20px; color:var(--text-tertiary);" id="${this.containerId}-empty">
                        Click Play to start derivation
                    </div>
                </div>
                <div class="playback-controls">
                    <button class="playback-btn" id="${this.containerId}-reset" title="Reset">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2.5 8C2.5 4.96243 4.96243 2.5 8 2.5C11.0376 2.5 13.5 4.96243 13.5 8C13.5 11.0376 11.0376 13.5 8 13.5M8 13.5L10.5 11M8 13.5L5.5 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                    <button class="playback-btn" id="${this.containerId}-prev" title="Previous Step" disabled>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10.5 12L6.5 8L10.5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                    <button class="playback-btn play-primary" id="${this.containerId}-play" title="Play/Pause">
                        <svg class="icon-play" width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M7 5L14 10L7 15V5Z"/></svg>
                        <svg class="icon-pause" width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style="display:none"><path d="M6 5H8V15H6V5ZM12 5H14V15H12V5Z"/></svg>
                    </button>
                    <button class="playback-btn" id="${this.containerId}-next" title="Next Step">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5.5 4L9.5 8L5.5 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        this._attachListeners();
        return this;
    }

    _attachListeners() {
        document.getElementById(`${this.containerId}-play`)?.addEventListener('click', () => this.togglePlay());
        document.getElementById(`${this.containerId}-next`)?.addEventListener('click', () => { this.pause(); this.next(); });
        document.getElementById(`${this.containerId}-prev`)?.addEventListener('click', () => { this.pause(); this.prev(); });
        document.getElementById(`${this.containerId}-reset`)?.addEventListener('click', () => { this.pause(); this.reset(); });
    }

    _updateControls() {
        const prevBtn = document.getElementById(`${this.containerId}-prev`);
        const nextBtn = document.getElementById(`${this.containerId}-next`);
        const playBtn = document.getElementById(`${this.containerId}-play`);
        const progress = document.getElementById(`${this.containerId}-progress`);

        if (prevBtn) prevBtn.disabled = this.currentStep <= -1;
        if (nextBtn) nextBtn.disabled = this.currentStep >= this.steps.length - 1;
        
        if (playBtn) {
            const iconPlay = playBtn.querySelector('.icon-play');
            const iconPause = playBtn.querySelector('.icon-pause');
            if (this.currentStep >= this.steps.length - 1 && this.isPlaying) {
                this.pause();
            }
            if (iconPlay && iconPause) {
                iconPlay.style.display = this.isPlaying ? 'none' : 'block';
                iconPause.style.display = this.isPlaying ? 'block' : 'none';
            }
        }
        
        if (progress) {
            progress.textContent = `${Math.max(0, this.currentStep + 1)} / ${this.steps.length}`;
        }
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            if (this.currentStep >= this.steps.length - 1) {
                this.reset();
            }
            this.play();
        }
    }

    play() {
        this.isPlaying = true;
        if (this.onPlayStateChange) this.onPlayStateChange(true);
        this._updateControls();
        
        if (this.currentStep === -1) {
            // First step happens immediately
            this.next();
            // Schedule the subsequent step
            if (this.isPlaying) {
                this.timerId = setTimeout(() => this._autoNext(), this.delayMs);
            }
        } else {
            // Not the first step, so just schedule the next one
            this.timerId = setTimeout(() => this._autoNext(), Math.max(500, this.delayMs / 2));
        }
    }

    _autoNext() {
        if (!this.isPlaying) return;
        this.next();
        if (this.currentStep < this.steps.length - 1 && this.isPlaying) {
            this.timerId = setTimeout(() => this._autoNext(), this.delayMs);
        } else {
            this.pause();
        }
    }

    pause() {
        this.isPlaying = false;
        clearTimeout(this.timerId);
        if (this.onPlayStateChange) this.onPlayStateChange(false);
        this._updateControls();
    }

    next() {
        if (this.currentStep >= this.steps.length - 1) return;
        
        if (this.currentStep === -1) {
            const emptyMsg = document.getElementById(`${this.containerId}-empty`);
            if (emptyMsg) emptyMsg.style.display = 'none';
        }
        
        this.currentStep++;
        this._renderCurrentStep();
    }

    prev() {
        if (this.currentStep <= -1) return;
        
        // Remove the current step from DOM
        const stepEl = document.getElementById(`${this.containerId}-step-${this.currentStep}`);
        if (stepEl) stepEl.remove();
        
        this.currentStep--;
        
        if (this.currentStep === -1) {
            const emptyMsg = document.getElementById(`${this.containerId}-empty`);
            if (emptyMsg) emptyMsg.style.display = 'block';
        } else {
            // Scroll to previous step
            const prevEl = document.getElementById(`${this.containerId}-step-${this.currentStep}`);
            if (prevEl) prevEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        
        this._updateControls();
        
        // Callback for the new current step state (simulating "rewind" to the previous step's state)
        if (this.currentStep >= 0 && this.onStepComplete) {
            this.onStepComplete(this.currentStep, this.steps[this.currentStep]);
        }
    }

    reset() {
        this.currentStep = -1;
        const content = document.getElementById(`${this.containerId}-content`);
        if (content) {
            content.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-tertiary);" id="${this.containerId}-empty">Click Play to start derivation</div>`;
        }
        this._updateControls();
        if (this.onStepComplete) this.onStepComplete(-1, null);
    }

    _renderCurrentStep() {
        const contentDiv = document.getElementById(`${this.containerId}-content`);
        if (!contentDiv) return;
        
        const stepData = this.steps[this.currentStep];
        
        const stepEl = document.createElement('div');
        stepEl.id = `${this.containerId}-step-${this.currentStep}`;
        stepEl.className = 'math-step step-reveal';
        
        // Process highlighting if variables are provided
        let stepHtml = stepData.html;
        if (stepData.vars && stepData.vars.length > 0) {
            stepData.vars.forEach(v => {
                // simple replacement, assume it's wrapped in some class we can target
                // For a more robust approach we'd inject spans, but here we'll just add the var-highlight class
            });
        }
        
        stepEl.innerHTML = stepHtml;
        contentDiv.appendChild(stepEl);
        
        // Auto scroll to bottom
        contentDiv.scrollTop = contentDiv.scrollHeight;
        
        this._updateControls();
        
        if (stepData.callback) stepData.callback();
        if (this.onStepComplete) this.onStepComplete(this.currentStep, stepData);
    }
}
