/* ===== CrystalLens Miller Indices Math Engine ===== */

/**
 * Miller indices calculation engine.
 * Handles plane indexing, direction indexing, d-spacing, and angle calculations.
 */
export class MillerMath {
    /**
     * Calculate d-spacing for a given (hkl) plane and lattice parameters
     */
    static dSpacing(h, k, l, a, b = null, c = null, alpha = 90, beta = 90, gamma = 90) {
        b = b || a;
        c = c || (a !== b ? (c || a) : a);

        const alphaRad = alpha * Math.PI / 180;
        const betaRad = beta * Math.PI / 180;
        const gammaRad = gamma * Math.PI / 180;

        // For cubic systems (simplified)
        if (a === b && b === c && alpha === 90 && beta === 90 && gamma === 90) {
            const d = a / Math.sqrt(h * h + k * k + l * l);
            return {
                d,
                formula: 'd = a / √(h² + k² + l²)',
                value: d.toFixed(4) + ' Å'
            };
        }

        // General formula
        const cosAlpha = Math.cos(alphaRad);
        const cosBeta = Math.cos(betaRad);
        const cosGamma = Math.cos(gammaRad);

        const S11 = (b * c * Math.sin(alphaRad)) ** 2;
        const S22 = (a * c * Math.sin(betaRad)) ** 2;
        const S33 = (a * b * Math.sin(gammaRad)) ** 2;
        const S12 = a * b * c * c * (cosAlpha * cosBeta - cosGamma);
        const S23 = a * a * b * c * (cosBeta * cosGamma - cosAlpha);
        const S13 = a * b * b * c * (cosAlpha * cosGamma - cosBeta);

        const V = a * b * c * Math.sqrt(
            1 - cosAlpha * cosAlpha - cosBeta * cosBeta - cosGamma * cosGamma +
            2 * cosAlpha * cosBeta * cosGamma
        );

        const d = V / Math.sqrt(
            S11 * h * h + S22 * k * k + S33 * l * l +
            2 * S12 * h * k + 2 * S23 * k * l + 2 * S13 * h * l
        );

        return {
            d,
            formula: 'General formula (triclinic)',
            value: d.toFixed(4) + ' Å'
        };
    }

    /**
     * Calculate angle between two planes
     */
    static angleBetweenPlanes(h1, k1, l1, h2, k2, l2, system = 'cubic', a = 1) {
        if (system === 'cubic') {
            const dot = h1 * h2 + k1 * k2 + l1 * l2;
            const mag1 = Math.sqrt(h1 * h1 + k1 * k1 + l1 * l1);
            const mag2 = Math.sqrt(h2 * h2 + k2 * k2 + l2 * l2);
            if (mag1 === 0 || mag2 === 0) return null;
            const cosTheta = dot / (mag1 * mag2);
            const theta = Math.acos(Math.min(Math.max(cosTheta, -1), 1));
            return {
                degrees: theta * 180 / Math.PI,
                radians: theta,
                cos: cosTheta
            };
        }
        return null;
    }

    /**
     * Calculate angle between two directions
     */
    static angleBetweenDirections(u1, v1, w1, u2, v2, w2) {
        const dot = u1 * u2 + v1 * v2 + w1 * w2;
        const mag1 = Math.sqrt(u1 * u1 + v1 * v1 + w1 * w1);
        const mag2 = Math.sqrt(u2 * u2 + v2 * v2 + w2 * w2);
        if (mag1 === 0 || mag2 === 0) return null;
        const cosTheta = dot / (mag1 * mag2);
        const theta = Math.acos(Math.min(Math.max(cosTheta, -1), 1));
        return {
            degrees: theta * 180 / Math.PI,
            radians: theta,
            cos: cosTheta
        };
    }

    /**
     * Determine if plane and direction are perpendicular
     */
    static isPerpendicular(h, k, l, u, v, w) {
        return (h * u + k * v + l * w) === 0;
    }

    /**
     * Get the zone axis of two planes (cross product)
     */
    static zoneAxis(h1, k1, l1, h2, k2, l2) {
        return {
            u: k1 * l2 - l1 * k2,
            v: l1 * h2 - h1 * l2,
            w: h1 * k2 - k1 * h2
        };
    }

    /**
     * Check if a direction lies in a plane
     */
    static directionInPlane(h, k, l, u, v, w) {
        return (h * u + k * v + l * w) === 0;
    }

    /**
     * Generate all planes in a family
     */
    static familyPlanes(h, k, l) {
        const permutations = [
            [h, k, l], [h, l, k], [k, h, l], [k, l, h], [l, h, k], [l, k, h],
            [-h, k, l], [h, -k, l], [h, k, -l], [-h, -k, l], [-h, k, -l], [h, -k, -l],
            [-h, -k, -l]
        ];

        // Remove duplicates
        const seen = new Set();
        const unique = [];
        permutations.forEach(p => {
            const key = p.sort().join(',');
            if (!seen.has(key)) {
                seen.add(key);
                unique.push({ h: p[0], k: p[1], l: p[2] });
            }
        });

        return unique;
    }

    /**
     * Calculate interplanar angle for cubic system
     */
    static cubicInterplanarAngle(h1, k1, l1, h2, k2, l2) {
        return this.angleBetweenPlanes(h1, k1, l1, h2, k2, l2, 'cubic');
    }

    /**
     * Get step-by-step derivation for finding Miller indices from intercepts
     */
    static getIndexDerivation(intercepts) {
        const [x, y, z] = intercepts;
        const steps = [
            { label: '1. Identify intercepts', content: `Plane intercepts axes at: x = ${x === Infinity ? '∞' : x}, y = ${y === Infinity ? '∞' : y}, z = ${z === Infinity ? '∞' : z}` },
            { label: '2. Take reciprocals', content: `Reciprocals: ${x === Infinity ? '0' : `1/${x}`}, ${y === Infinity ? '0' : `1/${y}`}, ${z === Infinity ? '0' : `1/${z}`}` },
            { label: '3. Clear fractions', content: this._clearFractions([x, y, z]) },
            { label: '4. Enclose in parentheses', content: `Miller indices: <strong>(${this._getMillerString(intercepts)})</strong>` }
        ];
        return steps;
    }

    static _getMillerString(intercepts) {
        const [x, y, z] = intercepts;
        const recip = [x === Infinity ? 0 : 1/x, y === Infinity ? 0 : 1/y, z === Infinity ? 0 : 1/z];
        const lcm = this._lcmArray(recip.map(r => r === 0 ? 1 : r));
        const miller = recip.map(r => r === 0 ? 0 : Math.round(r * lcm));
        return miller.join('');
    }

    static _clearFractions(intercepts) {
        const [x, y, z] = intercepts;
        const recip = [x === Infinity ? 0 : 1/x, y === Infinity ? 0 : 1/y, z === Infinity ? 0 : 1/z];
        const lcm = this._lcmArray(recip.map(r => r === 0 ? 1 : Math.abs(r)));
        const miller = recip.map(r => r === 0 ? 0 : Math.round(r * lcm));
        return `Multiply by ${lcm}: ${miller.join(',')}`;
    }

    static _gcd(a, b) {
        a = Math.abs(a);
        b = Math.abs(b);
        while (b) { [a, b] = [b, a % b]; }
        return a;
    }

    static _lcmArray(arr) {
        // For fractional values, find denominator
        const denominators = arr.map(v => {
            if (v === 0) return 1;
            const str = v.toString();
            if (str.includes('.')) {
                return Math.pow(10, str.split('.')[1].length);
            }
            return 1;
        });
        return Math.max(...denominators);
    }
}
