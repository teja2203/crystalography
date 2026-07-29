/* ===== CrystalLens Coordination Number Calculator ===== */

/**
 * Coordination number analysis and nearest neighbor calculations.
 */
export class CoordinationCalculator {
    /**
     * Get coordination number for a structure
     */
    static getCN(structure) {
        const data = {
            'simple-cubic': { cn: 6, nnDistance: 'a', desc: '6 nearest neighbors (4 in-plane + 2 perpendicular)' },
            'bcc': { cn: 8, nnDistance: 'a√3/2 ≈ 0.866a', desc: '8 nearest neighbors at body centers relative to corners' },
            'fcc': { cn: 12, nnDistance: 'a√2/2 ≈ 0.707a', desc: '12 nearest neighbors (6 in-plane + 3 above + 3 below)' },
            'hcp': { cn: 12, nnDistance: 'a', desc: '12 nearest neighbors (6 in-plane + 3 above + 3 below)' },
            'diamond': { cn: 4, nnDistance: 'a√3/4 ≈ 0.433a', desc: '4 nearest neighbors in tetrahedral arrangement' },
            'cscl': { cn: 8, nnDistance: 'a√3/2 ≈ 0.866a', desc: 'Cs: 8 Cl neighbors | Cl: 8 Cs neighbors' },
            'nacl': { cn: 6, nnDistance: 'a/2', desc: 'Na: 6 Cl neighbors | Cl: 6 Na neighbors' },
        };
        return data[structure] || null;
    }

    /**
     * Generate nearest neighbor positions for a given structure
     */
    static getNeighborPositions(structure, a = 1) {
        switch (structure) {
            case 'simple-cubic':
                return [
                    [a, 0, 0], [-a, 0, 0], [0, a, 0],
                    [0, -a, 0], [0, 0, a], [0, 0, -a]
                ];
            case 'bcc':
                const half = a / 2;
                return [
                    [half, half, half], [half, half, -half], [half, -half, half], [half, -half, -half],
                    [-half, half, half], [-half, half, -half], [-half, -half, half], [-half, -half, -half]
                ];
            case 'fcc':
                return [
                    [a/2, a/2, 0], [-a/2, a/2, 0], [a/2, -a/2, 0], [-a/2, -a/2, 0],
                    [a/2, 0, a/2], [-a/2, 0, a/2], [a/2, 0, -a/2], [-a/2, 0, -a/2],
                    [0, a/2, a/2], [0, -a/2, a/2], [0, a/2, -a/2], [0, -a/2, -a/2]
                ];
            case 'diamond':
                const d = a / 4;
                return [
                    [d, d, d], [d, -d, -d], [-d, d, -d], [-d, -d, d]
                ];
            default:
                return [];
        }
    }

    /**
     * Get second nearest neighbor distances
     */
    static getSecondNN(structure, a = 1) {
        const data = {
            'simple-cubic': { distance: a * Math.SQRT2, count: 12 },
            'bcc': { distance: a, count: 6 },
            'fcc': { distance: a, count: 6 },
            'hcp': { distance: a * Math.sqrt(3), count: 6 },
        };
        return data[structure] || null;
    }

    // Step-by-step derivations for educational display
    static getDerivation(structure) {
        const steps = {
            'simple-cubic': [
                { label: 'Nearest neighbor distance', content: 'd = a (cube edge length)' },
                { label: 'Count neighbors', content: 'From a corner atom, count atoms at distance a along +x, -x, +y, -y, +z, -z' },
                { label: 'Coordination Number', content: 'CN = <strong>6</strong>' }
            ],
            'bcc': [
                { label: 'Nearest neighbor distance', content: 'd = a√3/2 (half of body diagonal from corner to center)' },
                { label: 'Count neighbors', content: 'A corner atom has 8 neighboring body centers (from 8 adjacent unit cells)' },
                { label: 'Coordination Number', content: 'CN = <strong>8</strong>' }
            ],
            'fcc': [
                { label: 'Nearest neighbor distance', content: 'd = a√2/2 (half of face diagonal)' },
                { label: 'Count in-plane', content: 'In the same close-packed plane, an atom has 6 nearest neighbors' },
                { label: 'Count out-of-plane', content: '3 neighbors in the plane above + 3 neighbors in the plane below' },
                { label: 'Coordination Number', content: 'CN = 6 + 3 + 3 = <strong>12</strong>' }
            ],
            'hcp': [
                { label: 'Nearest neighbor distance', content: 'd = a (atoms touch in basal plane)' },
                { label: 'Count in-plane', content: 'In the same basal plane, an atom has 6 nearest neighbors' },
                { label: 'Count out-of-plane', content: '3 neighbors in the plane above + 3 neighbors in the plane below' },
                { label: 'Coordination Number', content: 'CN = 6 + 3 + 3 = <strong>12</strong>' }
            ]
        };
        return steps[structure] || [{ label: 'Not available', content: 'Derivation not available for this structure.' }];
    }
}
