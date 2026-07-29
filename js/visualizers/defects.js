/* ===== CrystalLens Point Defects Visualizer ===== */
import * as THREE from 'three';

/**
 * Visualizes point defects: vacancies, interstitials, substitutions, Frenkel & Schottky.
 */
export class DefectVisualizer {
    constructor(sceneManager) {
        this.sm = sceneManager;
        this.defectGroup = new THREE.Group();
    }

    /**
     * Create a perfect lattice reference
     */
    createPerfectLattice(size = 3, spacing = 1, color = 0x00d4ff) {
        const group = new THREE.Group();
        const r = 0.2;

        for (let x = -size; x <= size; x++) {
            for (let y = -size; y <= size; y++) {
                for (let z = -size; z <= size; z++) {
                    const atom = this.sm.createAtom(
                        new THREE.Vector3(x * spacing, y * spacing, z * spacing),
                        r, color
                    );
                    group.add(atom);
                }
            }
        }

        return group;
    }

    /**
     * Show vacancy defect (missing atom)
     */
    createVacancy(group, position, color = 0x00d4ff) {
        // Mark the position with a ring
        const ringGeo = new THREE.RingGeometry(0.15, 0.25, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xff4444,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(position);
        group.add(ring);

        // Add a dashed circle outline
        const points = [];
        for (let i = 0; i <= 24; i++) {
            const angle = (i / 24) * Math.PI * 2;
            points.push(new THREE.Vector3(
                position.x + 0.3 * Math.cos(angle),
                position.y + 0.3 * Math.sin(angle),
                position.z
            ));
        }
        const circleGeo = new THREE.BufferGeometry().setFromPoints(points);
        const circleMat = new THREE.LineBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.5 });
        const circle = new THREE.Line(circleGeo, circleMat);
        group.add(circle);
    }

    /**
     * Show interstitial defect (extra atom)
     */
    createInterstitial(group, position, color = 0xff6b9d) {
        const atom = this.sm.createAtom(position, 0.15, 0xff4444, true);
        group.add(atom);
    }

    /**
     * Show substitutional defect (different atom type)
     */
    createSubstitutional(group, position, color = 0x44ff44) {
        const atom = this.sm.createAtom(position, 0.22, 0x44ff44, true);
        group.add(atom);
    }

    /**
     * Create Frenkel defect demo (vacancy + interstitial pair)
     */
    createFrenkel(group, center, spacing = 1) {
        const vacPos = new THREE.Vector3(center.x, center.y, center.z);
        this.createVacancy(group, vacPos);

        const intPos = new THREE.Vector3(
            center.x + spacing * 0.5,
            center.y + spacing * 0.3,
            center.z + spacing * 0.4
        );
        this.createInterstitial(group, intPos);

        // Connect with dashed line
        const points = [vacPos, intPos];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineDashedMaterial({
            color: 0xffaa44,
            dashSize: 0.05,
            gapSize: 0.05,
            transparent: true,
            opacity: 0.6
        });
        const line = new THREE.Line(lineGeo, lineMat);
        line.computeLineDistances();
        group.add(line);
    }

    /**
     * Create Schottky defect demo (missing cation-anion pair)
     */
    createSchottky(group, center, spacing = 1) {
        // Remove both a cation and anion
        const cationPos = new THREE.Vector3(center.x, center.y, center.z);
        const anionPos = new THREE.Vector3(
            center.x + spacing * 0.5,
            center.y + spacing * 0.5,
            center.z
        );

        this.createVacancy(group, cationPos);
        this.createVacancy(group, anionPos);

        // Link with bracket
        const points = [cationPos, anionPos];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineDashedMaterial({
            color: 0x44ddff,
            dashSize: 0.05,
            gapSize: 0.05,
            transparent: true,
            opacity: 0.6
        });
        const line = new THREE.Line(lineGeo, lineMat);
        line.computeLineDistances();
        group.add(line);
    }

    /**
     * Build complete defect visualization
     */
    build() {
        this.sm.scene.add(this.defectGroup);
    }

    clear() {
        this.sm.scene.remove(this.defectGroup);
        this.defectGroup.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
        this.defectGroup = new THREE.Group();
    }
}
