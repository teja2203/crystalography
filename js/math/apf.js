/* ===== CrystalLens APF (Atomic Packing Factor) Calculator ===== */

/**
 * APF calculation engine with step-by-step derivations.
 * All formulas assume equal spheres at atomic positions.
 */
export class APFCalculator {
    /**
     * Calculate APF for a given crystal structure
     */
    static calculate(structure, a, r = null) {
        switch (structure) {
            case 'simple-cubic': return this._simpleCubic(a, r);
            case 'bcc': return this._bcc(a, r);
            case 'fcc': return this._fcc(a, r);
            case 'hcp': return this._hcp(a);
            case 'diamond': return this._diamond(a, r);
            default: return { apf: 0, steps: [] };
        }
    }

    /**
     * Get step-by-step derivation for display
     */
    static getDerivation(structure) {
        switch (structure) {
            case 'simple-cubic': return this._scDerivation();
            case 'bcc': return this._bccDerivation();
            case 'fcc': return this._fccDerivation();
            case 'hcp': return this._hcpDerivation();
            case 'diamond': return this._diamondDerivation();
            default: return [];
        }
    }

    static _simpleCubic(a, r) {
        if (!r) r = a / 2;
        const n = 1; // atoms per cell
        const vAtom = (4 / 3) * Math.PI * r * r * r;
        const vCell = a * a * a;
        const apf = (n * vAtom) / vCell;
        return { apf, n, vAtom, vCell, r, a, structure: 'Simple Cubic' };
    }

    static _bcc(a, r) {
        if (!r) r = a * Math.sqrt(3) / 4;
        const n = 2;
        const vAtom = (4 / 3) * Math.PI * r * r * r;
        const vCell = a * a * a;
        const apf = (n * vAtom) / vCell;
        return { apf, n, vAtom, vCell, r, a, structure: 'BCC' };
    }

    static _fcc(a, r) {
        if (!r) r = a * Math.sqrt(2) / 4;
        const n = 4;
        const vAtom = (4 / 3) * Math.PI * r * r * r;
        const vCell = a * a * a;
        const apf = (n * vAtom) / vCell;
        return { apf, n, vAtom, vCell, r, a, structure: 'FCC' };
    }

    static _hcp(a) {
        const r = a / 2;
        const c = Math.sqrt(8 / 3) * a;
        const n = 6;
        const vAtom = (4 / 3) * Math.PI * r * r * r;
        const vCell = (3 * Math.sqrt(3) / 2) * a * a * c;
        const apf = (n * vAtom) / vCell;
        return { apf, n, vAtom, vCell, r, a, c, structure: 'HCP' };
    }

    static _diamond(a, r) {
        if (!r) r = a * Math.sqrt(3) / 8;
        const n = 8;
        const vAtom = (4 / 3) * Math.PI * r * r * r;
        const vCell = a * a * a;
        const apf = (n * vAtom) / vCell;
        return { apf, n, vAtom, vCell, r, a, structure: 'Diamond Cubic' };
    }

    static _scDerivation() {
        return [
            { label: 'Atoms per cell', content: 'n = 8 corners × ⅛ = <strong>1 atom</strong>' },
            { label: 'Atomic radius', content: 'r = a / 2 (atoms touch along cube edge)' },
            { label: 'Atom volume', content: 'V<sub>atom</sub> = 4πr³/3 = 4π(a/2)³/3 = πa³/6' },
            { label: 'Cell volume', content: 'V<sub>cell</sub> = a³' },
            { label: 'APF', content: 'APF = (1 × πa³/6) / a³ = <strong>π/6 ≈ 0.5236</strong>' }
        ];
    }

    static _bccDerivation() {
        return [
            { label: 'Atoms per cell', content: 'n = 8 corners × ⅛ + 1 body center = <strong>2 atoms</strong>' },
            { label: 'Atomic radius', content: 'Body diagonal = 4r = a√3 <br>r = a√3/4' },
            { label: 'Atom volume', content: 'V<sub>atom</sub> = 4πr³/3 = 4π(a√3/4)³/3 = πa³√3/16' },
            { label: 'Total atom volume', content: 'n × V<sub>atom</sub> = 2 × πa³√3/16 = πa³√3/8' },
            { label: 'APF', content: 'APF = (πa³√3/8) / a³ = <strong>π√3/8 ≈ 0.6802</strong>' }
        ];
    }

    static _fccDerivation() {
        return [
            { label: 'Atoms per cell', content: 'n = 8 corners × ⅛ + 6 faces × ½ = <strong>4 atoms</strong>' },
            { label: 'Atomic radius', content: 'Face diagonal = 4r = a√2 <br>r = a√2/4 = a/(2√2)' },
            { label: 'Atom volume', content: 'V<sub>atom</sub> = 4πr³/3 = 4π(a√2/4)³/3 = πa³√2/24' },
            { label: 'Total atom volume', content: 'n × V<sub>atom</sub> = 4 × πa³√2/24 = πa³√2/6' },
            { label: 'APF', content: 'APF = (πa³√2/6) / a³ = <strong>π√2/6 ≈ 0.7405</strong>' }
        ];
    }

    static _hcpDerivation() {
        return [
            { label: 'Atoms per cell', content: 'n = 12 corners × ⅙ + 2 face centers × ½ + 3 interior = <strong>6 atoms</strong>' },
            { label: 'Atomic radius', content: 'r = a / 2 (atoms touch in basal plane)' },
            { label: 'c/a ratio', content: 'c/a = √(8/3) ≈ 1.633 (ideal close-packing)' },
            { label: 'Cell volume', content: 'V<sub>cell</sub> = 3√3/2 × a²c = 3√3/2 × a² × a√(8/3) = 3√2 a³' },
            { label: 'APF', content: 'APF = (6 × 4π(a/2)³/3) / (3√2 a³) = <strong>π√2/6 ≈ 0.7405</strong>' }
        ];
    }

    static _diamondDerivation() {
        return [
            { label: 'Atoms per cell', content: 'n = 8 (FCC positions) + 4 (tetrahedral sites) = <strong>8 atoms</strong>' },
            { label: 'Atomic radius', content: 'Body diagonal = 8r = a√3 <br>r = a√3/8' },
            { label: 'APF', content: 'APF = (8 × 4π(a√3/8)³/3) / a³ = <strong>π√3/16 ≈ 0.3401</strong>' }
        ];
    }

    /**
     * Compare APF across structures
     */
    static compare() {
        const structures = ['simple-cubic', 'bcc', 'fcc', 'hcp', 'diamond'];
        const labels = ['Simple Cubic', 'BCC', 'FCC', 'HCP', 'Diamond Cubic'];
        const a = 1;

        return structures.map((s, i) => {
            const result = this.calculate(s, a);
            return { name: labels[i], apf: result.apf, n: result.n };
        });
    }
}
