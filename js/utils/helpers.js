/* ===== CrystalLens Utility Helpers ===== */

/**
 * Generates unique IDs
 */
export function uid() {
    return `cl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Clamps a value between min and max
 */
export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

/**
 * Linear interpolation
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Smooth step interpolation
 */
export function smoothstep(t) {
    return t * t * (3 - 2 * t);
}

/**
 * Debounce function
 */
export function debounce(fn, ms = 150) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

/**
 * Throttle function
 */
export function throttle(fn, ms = 100) {
    let last = 0;
    return (...args) => {
        const now = Date.now();
        if (now - last >= ms) {
            last = now;
            fn(...args);
        }
    };
}

/**
 * Format number with significant figures
 */
export function toSigFigs(n, figs = 4) {
    if (n === 0) return '0';
    const d = Math.ceil(Math.log10(Math.abs(n)));
    const p = figs - d;
    const factor = Math.pow(10, p);
    return (Math.round(n * factor) / factor).toFixed(Math.max(0, p));
}

/**
 * Format as subscript/superscript HTML
 */
export function formatSubSuper(str) {
    return str
        .replace(/\^(\d+)/g, '<sup>$1</sup>')
        .replace(/_(\d+)/g, '<sub>$1</sub>');
}

/**
 * Parse a Miller index string like "(100)" or "[110]"
 * Returns { h, k, l } or null
 */
export function parseMillerIndex(str) {
    const cleaned = str.replace(/[()\[\]{}]/g, '').trim();
    const parts = cleaned.split(/[\s,]+/).filter(Boolean);
    if (parts.length !== 3) return null;
    const nums = parts.map(p => {
        if (p.startsWith('-') || p.startsWith('¯')) {
            return -parseInt(p.replace('¯', '-').replace('-', ''), 10);
        }
        return parseInt(p, 10);
    });
    if (nums.some(isNaN)) return null;
    return { h: nums[0], k: nums[1], l: nums[2] };
}

/**
 * Generate a random color
 */
export function randomColor(bright = true) {
    const hue = Math.random() * 360;
    const sat = bright ? 70 + Math.random() * 30 : 50 + Math.random() * 30;
    const lit = bright ? 50 + Math.random() * 20 : 35 + Math.random() * 20;
    return `hsl(${hue}, ${sat}%, ${lit}%)`;
}

/**
 * Create an SVG icon element
 */
export function createIcon(svgContent, size = 16) {
    const div = document.createElement('div');
    div.innerHTML = svgContent.trim();
    const svg = div.firstElementChild;
    if (svg) {
        svg.setAttribute('width', size.toString());
        svg.setAttribute('height', size.toString());
        svg.setAttribute('aria-hidden', 'true');
    }
    return svg;
}

/**
 * Deep merge objects
 */
export function deepMerge(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();
    if (source && typeof source === 'object') {
        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    target[key] = deepMerge(target[key] || {}, source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
    }
    return deepMerge(target, ...sources);
}

/**
 * Animate a value over time with requestAnimationFrame
 */
export function animateValue(from, to, duration, onUpdate, onComplete) {
    const start = performance.now();
    let cancelled = false;

    function tick(now) {
        if (cancelled) return;
        const elapsed = now - start;
        const t = Math.min(elapsed / duration, 1);
        const eased = smoothstep(t);
        const current = lerp(from, to, eased);
        onUpdate(current, t);
        if (t < 1) {
            requestAnimationFrame(tick);
        } else if (onComplete) {
            onComplete();
        }
    }

    requestAnimationFrame(tick);

    return () => { cancelled = true; };
}

/**
 * Easing functions
 */
export const easing = {
    linear: t => t,
    easeIn: t => t * t,
    easeOut: t => t * (2 - t),
    easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    bounce: t => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
    elastic: t => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1
            : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }
};

/**
 * Generate CSS gradient string from array of stops
 */
export function gradient(stops, angle = 135) {
    return `linear-gradient(${angle}deg, ${stops.join(', ')})`;
}

/**
 * Simple localStorage wrapper with error handling
 */
export const storage = {
    get(key, def = null) {
        try {
            const val = localStorage.getItem(`crystallens_${key}`);
            return val ? JSON.parse(val) : def;
        } catch { return def; }
    },
    set(key, value) {
        try {
            localStorage.setItem(`crystallens_${key}`, JSON.stringify(value));
            return true;
        } catch { return false; }
    },
    remove(key) {
        try {
            localStorage.removeItem(`crystallens_${key}`);
            return true;
        } catch { return false; }
    }
};

/**
 * Measure elapsed time
 */
export class Timer {
    constructor() {
        this.reset();
    }
    reset() { this.start = performance.now(); }
    elapsed() { return performance.now() - this.start; }
    log(label = 'Timer') {
        console.log(`[${label}] ${this.elapsed().toFixed(1)}ms`);
    }
}
