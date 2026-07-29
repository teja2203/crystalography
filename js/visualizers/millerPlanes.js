/* ===== CrystalLens Miller Planes Visualizer ===== */
import * as THREE from 'three';

/**
 * Interactive Miller indices plane generator.
 * Allows input of (hkl) values and visualizes the corresponding crystal plane.
 */
export class MillerPlaneVisualizer {
    constructor(sceneManager) {
        this.sm = sceneManager;
        this.currentPlane = null;
        this.planeGroup = new THREE.Group();
    }

    /**
     * Create the base unit cell for plane visualization
     */
    createBaseCell(a = 2) {
        const group = new THREE.Group();

        // Unit cell
        const cell = this.sm.createUnitCell(a, 0x4488aa, 0.3);
        cell.position.set(0, 0, 0);
        group.add(cell);

        // Corner atoms
        const r = 0.08;
        const corners = [
            [-a/2,-a/2,-a/2],[a/2,-a/2,-a/2],[-a/2,a/2,-a/2],[-a/2,-a/2,a/2],
            [a/2,a/2,-a/2],[a/2,-a/2,a/2],[-a/2,a/2,a/2],[a/2,a/2,a/2]
        ];
        corners.forEach(pos => {
            const mat = new THREE.MeshPhysicalMaterial({
                color: 0x4488aa, metalness: 0.1, roughness: 0.3
            });
            const sphere = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 12), mat);
            sphere.position.set(pos[0], pos[1], pos[2]);
            group.add(sphere);
        });

        // Axes
        const axes = this.sm.createAxes(1.5);
        group.add(axes);

        this.sm.add('base-cell', group);
        return group;
    }

    /**
     * Generate a plane from Miller indices
     */
    generatePlane(h, k, l, a = 2) {
        // Remove previous plane
        if (this.planeGroup) {
            this.sm.scene.remove(this.planeGroup);
            this.planeGroup.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }

        this.planeGroup = new THREE.Group();

        // Calculate intercepts
        const intercepts = [
            h !== 0 ? a / (2 * Math.abs(h)) : Infinity,
            k !== 0 ? a / (2 * Math.abs(k)) : Infinity,
            l !== 0 ? a / (2 * Math.abs(l)) : Infinity
        ];

        const signs = [
            h >= 0 ? 1 : -1,
            k >= 0 ? 1 : -1,
            l >= 0 ? 1 : -1
        ];

        // Create plane geometry
        const planeSize = a * 1.2;
        const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);

        // Color based on indices
        const hue = (h * 30 + k * 60 + l * 90) % 360;
        const color = new THREE.Color(`hsl(${hue}, 80%, 60%)`);

        const planeMat = new THREE.MeshPhysicalMaterial({
            color,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide,
            roughness: 0.4,
            metalness: 0.0
        });

        const plane = new THREE.Mesh(planeGeo, planeMat);

        // Position and orient the plane
        if (h === 0 && k === 0 && l !== 0) {
            // (001) plane - perpendicular to z
            plane.position.set(0, 0, intercepts[2] * signs[2]);
        } else if (h !== 0 && k === 0 && l === 0) {
            // (100) plane - perpendicular to x
            plane.position.set(intercepts[0] * signs[0], 0, 0);
            plane.rotation.y = Math.PI / 2;
        } else if (h === 0 && k !== 0 && l === 0) {
            // (010) plane - perpendicular to y
            plane.position.set(0, intercepts[1] * signs[1], 0);
            plane.rotation.x = Math.PI / 2;
        } else {
            // General (hkl) plane
            const normal = new THREE.Vector3(h, k, l).normalize();
            const d = a / (2 * Math.sqrt(h * h + k * k + l * l));
            plane.position.copy(normal.clone().multiplyScalar(d * signs[0]));
            plane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        }

        this.planeGroup.add(plane);

        // Draw intercept lines along axes
        const lineMat = new THREE.LineBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.6 });
        
        for (let i = 0; i < 3; i++) {
            if (intercepts[i] !== Infinity && intercepts[i] > 0) {
                const start = [0, 0, 0];
                const end = [0, 0, 0];
                end[i] = intercepts[i] * signs[i];
                const points = [
                    new THREE.Vector3(start[0], start[1], start[2]),
                    new THREE.Vector3(end[0], end[1], end[2])
                ];
                const geo = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geo, lineMat);
                this.planeGroup.add(line);
            }
        }

        // Add plane border
        const borderMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 });
        const borderPoints = [
            new THREE.Vector3(-planeSize/2, -planeSize/2, 0),
            new THREE.Vector3(planeSize/2, -planeSize/2, 0),
            new THREE.Vector3(planeSize/2, planeSize/2, 0),
            new THREE.Vector3(-planeSize/2, planeSize/2, 0),
            new THREE.Vector3(-planeSize/2, -planeSize/2, 0)
        ];
        const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPoints);
        const borderLine = new THREE.Line(borderGeo, borderMat);
        borderLine.position.copy(plane.position);
        borderLine.quaternion.copy(plane.quaternion);
        this.planeGroup.add(borderLine);

        // Add label text (simplified as a small sphere)
        const labelSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 8, 8),
            new THREE.MeshBasicMaterial({ color })
        );
        const labelOffset = plane.position.clone().add(
            new THREE.Vector3(0.3, 0.3, 0.3)
        );
        labelSphere.position.copy(labelOffset);
        this.planeGroup.add(labelSphere);

        this.sm.scene.add(this.planeGroup);
        this.currentPlane = { h, k, l, plane };

        return this.planeGroup;
    }

    /**
     * Generate all standard planes for demonstration
     */
    generateStandardPlanes() {
        const planes = [
            { h: 1, k: 0, l: 0, label: '(100)' },
            { h: 1, k: 1, l: 0, label: '(110)' },
            { h: 1, k: 1, l: 1, label: '(111)' },
            { h: 2, k: 1, l: 0, label: '(210)' }
        ];

        return planes;
    }

    /**
     * Animate plane creation step by step
     */
    animatePlaneCreation(h, k, l, onStep) {
        const steps = [
            { text: 'Find intercepts on axes', action: () => this._showIntercepts(h, k, l) },
            { text: 'Take reciprocals', action: () => this._showReciprocals(h, k, l) },
            { text: 'Clear fractions', action: () => this._showCleared(h, k, l) },
            { text: 'Enclose in parentheses', action: () => this.generatePlane(h, k, l) }
        ];

        if (onStep) {
            steps.forEach((step, i) => setTimeout(() => onStep(step, i), i * 1000));
        }
    }

    _showIntercepts(h, k, l) {
        // Visual indicator for intercepts
    }

    _showReciprocals(h, k, l) {
        // Visual indicator for reciprocals
    }

    _showCleared(h, k, l) {
        // Visual indicator for cleared fractions
    }

    /**
     * Clear the visualization
     */
    clear() {
        if (this.planeGroup) {
            this.sm.scene.remove(this.planeGroup);
            this.planeGroup.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        this.sm.remove('base-cell');
        this.currentPlane = null;
    }
}
