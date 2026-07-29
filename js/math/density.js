/* ===== CrystalLens Density Calculator ===== */

/**
 * Theoretical density calculation engine with full step-by-step derivations.
 */
export class DensityCalculator {
    static N_A = 6.02214076e23; // Avogadro's number

    /**
     * Calculate theoretical density
     * @param {number} n - atoms per unit cell
     * @param {number} M - atomic mass (g/mol)
     * @param {number} a - lattice parameter (Angstroms)
     * @param {string} structure - crystal structure name
     * @param {object} extra - extra params (c for hexagonal, etc.)
     */
    static calculate(n, M, a, structure = 'cubic', extra = {}) {
        let V_cell;

        switch (structure) {
            case 'cubic':
            case 'fcc':
            case 'bcc':
            case 'simple':
            case 'diamond':
                V_cell = a * a * a;
                break;
            case 'hexagonal':
            case 'hcp':
                const c = extra.c || a * Math.sqrt(8 / 3);
                V_cell = (3 * Math.sqrt(3) / 2) * a * a * c;
                break;
            default:
                V_cell = a * a * a;
        }

        // Convert a from Angstroms to cm
        const a_cm = a * 1e-8;
        let V_cell_cm3;
        if (structure === 'hexagonal' || structure === 'hcp') {
            const c_cm = (extra.c || a * Math.sqrt(8/3)) * 1e-8;
            V_cell_cm3 = (3 * Math.sqrt(3) / 2) * a_cm * a_cm * c_cm;
        } else {
            V_cell_cm3 = a_cm * a_cm * a_cm;
        }

        const density = (n * M) / (this.N_A * V_cell_cm3);

        return {
            density, // g/cm³
            n,
            M,
            a,
            V_cell,
            V_cell_cm3,
            structure,
            densityRounded: Math.round(density * 100) / 100
        };
    }

    /**
     * Get step-by-step derivation
     */
    static getDerivation(n, M, a, structure = 'cubic', extra = {}) {
        let steps = [];

        const result = this.calculate(n, M, a, structure, extra);
        const a_cm = a * 1e-8;

        steps.push({
            label: 'Formula',
            content: '<span class="math-inline">ρ = n × M / (N<sub>A</sub> × V<sub>cell</sub>)</span>'
        });

        steps.push({
            label: 'Identify variables',
            content: `n = ${n} atoms/cell<br>M = ${M} g/mol<br>a = ${a} Å = ${a_cm.toExponential(3)} cm<br>N<sub>A</sub> = 6.022 × 10²³ mol⁻¹`
        });

        if (structure === 'hexagonal' || structure === 'hcp') {
            const c = extra.c || a * Math.sqrt(8/3);
            const c_cm = c * 1e-8;
            steps.push({
                label: 'Cell volume (hexagonal)',
                content: `V<sub>cell</sub> = 3√3/2 × a²c<br>= 3√3/2 × (${a})² × (${c.toFixed(3)})<br>= ${result.V_cell.toFixed(4)} Å³<br>= ${result.V_cell_cm3.toExponential(4)} cm³`
            });
        } else {
            steps.push({
                label: 'Cell volume',
                content: `V<sub>cell</sub> = a³ = (${a})³ = ${result.V_cell.toFixed(4)} Å³<br>= ${result.V_cell_cm3.toExponential(4)} cm³`
            });
        }

        steps.push({
            label: 'Substitute values',
            content: `ρ = ${n} × ${M} / (6.022 × 10²³ × ${result.V_cell_cm3.toExponential(4)})`
        });

        steps.push({
            label: 'Calculate',
            content: `ρ = ${result.densityRounded} g/cm³`
        });

        return steps;
    }

    /**
     * Common materials database
     */
    static getMaterialData() {
        return [
            { name: 'Aluminum', structure: 'fcc', n: 4, M: 26.98, a: 4.049, density: 2.70 },
            { name: 'Copper', structure: 'fcc', n: 4, M: 63.55, a: 3.615, density: 8.94 },
            { name: 'Gold', structure: 'fcc', n: 4, M: 196.97, a: 4.078, density: 19.32 },
            { name: 'Silver', structure: 'fcc', n: 4, M: 107.87, a: 4.085, density: 10.49 },
            { name: 'Nickel', structure: 'fcc', n: 4, M: 58.69, a: 3.524, density: 8.91 },
            { name: 'Iron (α)', structure: 'bcc', n: 2, M: 55.85, a: 2.866, density: 7.87 },
            { name: 'Tungsten', structure: 'bcc', n: 2, M: 183.84, a: 3.165, density: 19.25 },
            { name: 'Chromium', structure: 'bcc', n: 2, M: 52.00, a: 2.884, density: 7.19 },
            { name: 'Molybdenum', structure: 'bcc', n: 2, M: 95.94, a: 3.147, density: 10.22 },
            { name: 'Magnesium', structure: 'hcp', n: 6, M: 24.31, a: 3.209, density: 1.74, c: 5.210 },
            { name: 'Titanium (α)', structure: 'hcp', n: 6, M: 47.88, a: 2.951, density: 4.51, c: 4.683 },
            { name: 'Zinc', structure: 'hcp', n: 6, M: 65.38, a: 2.665, density: 7.14, c: 4.947 },
        ];
    }

    /**
     * Calculate density from material name
     */
    static calculateMaterial(name) {
        const materials = this.getMaterialData();
        const mat = materials.find(m => m.name.toLowerCase() === name.toLowerCase());
        if (!mat) return null;

        const result = this.calculate(mat.n, mat.M, mat.a, mat.structure, { c: mat.c });
        result.name = mat.name;
        result.expectedDensity = mat.density;
        result.error = Math.abs(result.density - mat.density) / mat.density * 100;
        return result;
    }
}
