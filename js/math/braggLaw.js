/* ===== CrystalLens Bragg's Law & XRD Calculator ===== */

/**
 * Bragg's Law calculator and XRD simulation engine.
 * Provides step-by-step derivations and interactive calculations.
 */
export class BraggLawCalculator {
    /**
     * Calculate Bragg angle for given d-spacing and wavelength
     * @param {number} d - interplanar spacing in Ångströms
     * @param {number} lambda - X-ray wavelength in Ångströms
     * @param {number} n - order of reflection (default: 1)
     */
    static calculate(d, lambda, n = 1) {
        if (d === 0) return null;
        const sinTheta = (n * lambda) / (2 * d);
        
        if (Math.abs(sinTheta) > 1) {
            return {
                error: 'No solution — sin θ > 1. Choose a different d, λ, or n.',
                sinTheta,
                theta: null,
                thetaDeg: null
            };
        }

        const theta = Math.asin(sinTheta);
        const thetaDeg = theta * 180 / Math.PI;

        return {
            theta,
            thetaDeg,
            sinTheta,
            n,
            lambda,
            d,
            twoTheta: thetaDeg * 2,
            formula: `nλ = 2d sin θ`
        };
    }

    /**
     * Calculate d-spacing from Bragg angle
     */
    static dFromAngle(thetaDeg, lambda, n = 1) {
        const theta = thetaDeg * Math.PI / 180;
        const sinTheta = Math.sin(theta);
        if (sinTheta === 0) return null;
        const d = (n * lambda) / (2 * sinTheta);
        return { d, thetaDeg, lambda, n };
    }

    /**
     * Calculate lattice parameter from d-spacing for cubic crystal
     */
    static latticeParam(d, h, k, l) {
        const a = d * Math.sqrt(h * h + k * k + l * l);
        return a;
    }

    /**
     * Generate diffraction peaks for a given crystal structure
     */
    static generateDiffractionPattern(structure, lambda = 1.54) {
        const peaks = [];
        let planes = [];

        switch (structure) {
            case 'fcc':
                // FCC: h,k,l all even or all odd
                planes = [
                    [1,1,1], [2,0,0], [2,2,0], [3,1,1], [2,2,2],
                    [4,0,0], [3,3,1], [4,2,0], [4,2,2], [3,3,3]
                ];
                break;
            case 'bcc':
                // BCC: h+k+l = even
                planes = [
                    [1,1,0], [2,0,0], [2,1,1], [2,2,0], [3,1,0],
                    [2,2,2], [3,2,1], [4,0,0], [4,1,1], [3,3,0]
                ];
                break;
            case 'simple':
                // Any h,k,l
                planes = [
                    [1,0,0], [1,1,0], [1,1,1], [2,0,0], [2,1,0],
                    [2,1,1], [2,2,0], [2,2,1], [3,0,0], [3,1,0]
                ];
                break;
            default:
                planes = [[1,1,1], [2,0,0], [2,2,0], [3,1,1]];
        }

        const a = 4; // Å, typical lattice parameter for demo

        planes.forEach(([h, k, l]) => {
            const d = a / Math.sqrt(h * h + k * k + l * l);
            const result = this.calculate(d, lambda, 1);
            if (result && result.theta) {
                peaks.push({
                    h, k, l,
                    d: d.toFixed(3),
                    twoTheta: (result.twoTheta).toFixed(2),
                    intensity: this._relativeIntensity(h, k, l, structure),
                    theta: result.thetaDeg
                });
            }
        });

        // Sort by 2θ
        peaks.sort((a, b) => parseFloat(a.twoTheta) - parseFloat(b.twoTheta));

        return peaks;
    }

    /**
     * Calculate relative intensity (simplified model)
     */
    static _relativeIntensity(h, k, l, structure) {
        // Simplified intensity based on multiplicity
        let multiplicity = 0;
        
        if (h === 0 && k === 0 && l === 0) multiplicity = 0;
        else if (h === 0 && k === 0) multiplicity = 6;
        else if (h === k && k === l) multiplicity = 8;
        else if (h === k || k === l || h === l) multiplicity = 12;
        else if (h === 0 || k === 0 || l === 0) multiplicity = 12;
        else multiplicity = 24;

        // Structure factor effects
        let sf = 1;
        if (structure === 'fcc') {
            const sum = h + k + l;
            if (h % 2 === 0 && k % 2 === 0 && l % 2 === 0) sf = 1;
            else if (h % 2 === 1 && k % 2 === 1 && l % 2 === 1) sf = 1;
            else sf = 0;
        } else if (structure === 'bcc') {
            if ((h + k + l) % 2 === 0) sf = 1;
            else sf = 0;
        }

        // Lorentz-polarization factor (simplified)
        const theta = Math.asin(1.54 / (2 * a / Math.sqrt(h*h + k*k + l*l)));
        const lp = (1 + Math.cos(2*theta)**2) / (Math.sin(theta)**2 * Math.cos(theta));

        const intensity = multiplicity * sf * lp;
        return Math.max(intensity, 0);
    }

    /**
     * Get step-by-step derivation of Bragg's Law
     */
    static getDerivation() {
        return [
            { label: '1. Path difference', content: 'Consider two parallel X-ray beams reflecting from adjacent crystal planes with spacing d.' },
            { label: '2. Constructive interference condition', content: 'For constructive interference, the path difference must equal nλ.' },
            { label: '3. Path difference geometry', content: 'Extra distance = AB + BC = d sin θ + d sin θ = 2d sin θ' },
            { label: '4. Bragg\'s Law', content: '<span class="math-inline">nλ = 2d sin θ</span>' },
            { label: '5. Variables', content: '<strong>n</strong> = order of reflection (integer)<br><strong>λ</strong> = wavelength of X-rays<br><strong>d</strong> = interplanar spacing<br><strong>θ</strong> = angle of incidence (Bragg angle)' },
            { label: '6. Significance', content: 'Bragg\'s Law is the fundamental equation of X-ray crystallography. It relates the diffraction pattern to the crystal structure.' }
        ];
    }

    /**
     * Example calculation
     */
    static getExample() {
        return {
            title: 'Example: NaCl (200) peak with Cu Kα radiation',
            steps: [
                { label: 'Known values', content: 'λ = 1.54 Å (Cu Kα), d₂₀₀ = 2.82 Å for NaCl, n = 1' },
                { label: 'Bragg\'s Law', content: 'sin θ = nλ / (2d) = 1 × 1.54 / (2 × 2.82) = 0.273' },
                { label: 'Bragg angle', content: 'θ = sin⁻¹(0.273) = <strong>15.84°</strong>' },
                { label: '2θ value', content: '2θ = <strong>31.68°</strong> — this is the peak position in the diffraction pattern' }
            ]
        };
    }
}


