/* ===== CrystalLens Point Defects Visualizer ===== */
import * as THREE from 'three';

/**
 * Visualizes point defects: vacancies, interstitials, substitutions, Frenkel & Schottky.
 */
export class DefectVisualizer {
    constructor() {
        this.defectGroup = new THREE.Group();
        this.animations = [];
    }

    /**
     * Create a perfect lattice reference
     */
    createPerfectLattice(sm, size = 3, spacing = 1, color = 0x00d4ff) {
        const group = new THREE.Group();
        const r = 0.2;

        for (let x = -size; x <= size; x++) {
            for (let y = -size; y <= size; y++) {
                for (let z = -size; z <= size; z++) {
                    const atom = sm.createAtom(
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
     * Show vacancy defect (missing atom) with animation
     */
    animateVacancy(sm, group, position, color = 0x00d4ff) {
        // Atom that will "leave"
        const atom = sm.createAtom(position.clone(), 0.2, color);
        group.add(atom);

        // Mark the position with a ring
        const ringGeo = new THREE.RingGeometry(0.15, 0.25, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xff4444,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(position);
        group.add(ring);

        // Animation: atom fades and scales down, ring fades in
        const animId = 'vacancy_' + Math.random();
        let t = 0;
        sm.addAnimation(animId, (delta) => {
            t += delta * 1.5; // Speed
            if (t <= 1) {
                // Easing out
                const e = 1 - Math.pow(1 - t, 3);
                atom.scale.setScalar(1 - e);
                atom.material.opacity = 1 - e;
                ring.material.opacity = e * 0.8;
            } else {
                group.remove(atom);
                sm.removeAnimation(animId);
            }
        });
        this.animations.push(animId);
    }

    /**
     * Show interstitial defect (extra atom) with animation
     */
    animateInterstitial(sm, group, position, color = 0xff6b9d) {
        const atom = sm.createAtom(position.clone().add(new THREE.Vector3(0, 2, 0)), 0.15, 0xff4444, true);
        atom.material.transparent = true;
        atom.material.opacity = 0;
        group.add(atom);

        const animId = 'interstitial_' + Math.random();
        let t = 0;
        sm.addAnimation(animId, (delta) => {
            t += delta * 1.5;
            if (t <= 1) {
                const e = 1 - Math.pow(1 - t, 3); // ease out cubic
                atom.position.copy(position.clone().add(new THREE.Vector3(0, 2 * (1 - e), 0)));
                atom.material.opacity = e;
            } else {
                atom.position.copy(position);
                atom.material.opacity = 1;
                sm.removeAnimation(animId);
            }
        });
        this.animations.push(animId);
    }

    /**
     * Show substitutional defect (different atom type)
     */
    animateSubstitutional(sm, group, position, color = 0x44ff44) {
        const atom = sm.createAtom(position.clone(), 0.22, color, true);
        atom.scale.setScalar(0.1);
        group.add(atom);

        const animId = 'sub_' + Math.random();
        let t = 0;
        sm.addAnimation(animId, (delta) => {
            t += delta * 2.0;
            if (t <= 1) {
                // Elastic ease out
                const c4 = (2 * Math.PI) / 3;
                const e = t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
                atom.scale.setScalar(0.1 + 0.9 * e);
            } else {
                atom.scale.setScalar(1);
                sm.removeAnimation(animId);
            }
        });
        this.animations.push(animId);
    }

    /**
     * Create Frenkel defect demo (vacancy + interstitial pair) animated
     */
    animateFrenkel(sm, group, center, spacing = 1) {
        const vacPos = new THREE.Vector3(center.x, center.y, center.z);
        const intPos = new THREE.Vector3(
            center.x + spacing * 0.5,
            center.y + spacing * 0.3,
            center.z + spacing * 0.4
        );

        // Atom at vacPos
        const atom = sm.createAtom(vacPos.clone(), 0.2, 0x00d4ff);
        group.add(atom);

        // Dashed line
        const points = [vacPos, intPos];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineDashedMaterial({
            color: 0xffaa44,
            dashSize: 0.05,
            gapSize: 0.05,
            transparent: true,
            opacity: 0
        });
        const line = new THREE.Line(lineGeo, lineMat);
        line.computeLineDistances();
        group.add(line);

        // Mark the position with a ring
        const ringGeo = new THREE.RingGeometry(0.15, 0.25, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xff4444, side: THREE.DoubleSide, transparent: true, opacity: 0 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(vacPos);
        group.add(ring);

        const animId = 'frenkel_' + Math.random();
        let t = 0;
        sm.addAnimation(animId, (delta) => {
            t += delta; // 1 second animation
            if (t <= 1) {
                const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // ease in out
                atom.position.lerpVectors(vacPos, intPos, e);
                atom.material.color.setHex(0x00d4ff).lerp(new THREE.Color(0xffaa44), e);
                atom.scale.setScalar(1 - 0.25 * e); // shrink slightly to become interstitial
                ring.material.opacity = e * 0.8;
                lineMat.opacity = e * 0.6;
            } else {
                sm.removeAnimation(animId);
            }
        });
        this.animations.push(animId);
    }

    /**
     * Create Schottky defect demo (missing cation-anion pair)
     */
    animateSchottky(sm, group, center, spacing = 1) {
        const cationPos = new THREE.Vector3(center.x, center.y, center.z);
        const anionPos = new THREE.Vector3(
            center.x + spacing * 0.5,
            center.y + spacing * 0.5,
            center.z
        );

        const cation = sm.createAtom(cationPos.clone(), 0.15, 0xff4444);
        const anion = sm.createAtom(anionPos.clone(), 0.25, 0x4488ff);
        group.add(cation);
        group.add(anion);

        const animId = 'schottky_' + Math.random();
        let t = 0;
        sm.addAnimation(animId, (delta) => {
            t += delta * 1.2;
            if (t <= 1) {
                const e = 1 - Math.pow(1 - t, 3);
                cation.position.y = cationPos.y + e;
                anion.position.y = anionPos.y + e;
                cation.material.opacity = 1 - e;
                anion.material.opacity = 1 - e;
            } else {
                group.remove(cation);
                group.remove(anion);
                this.animateVacancy(sm, group, cationPos, 0xff4444);
                this.animateVacancy(sm, group, anionPos, 0x4488ff);
                sm.removeAnimation(animId);
            }
        });
        this.animations.push(animId);
    }

    clear(sm) {
        this.animations.forEach(id => sm.removeAnimation(id));
        this.animations = [];
    }
}
