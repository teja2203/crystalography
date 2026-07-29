/* ===== CrystalLens Slip Systems Visualizer ===== */
import * as THREE from 'three';

/**
 * Visualizes slip systems in FCC, BCC, and HCP with applied stress animation.
 */
export class SlipSystemVisualizer {
    constructor(sceneManager) {
        this.sm = sceneManager;
        this.slipGroup = new THREE.Group();
        this.animating = false;
        this.stressLevel = 0;
    }

    /**
     * Create FCC slip system visualization
     */
    createFCCSlip(a = 2) {
        const group = new THREE.Group();
        const r = 0.22;
        const color = 0x00d4ff;
        const slipColor = 0xff4444;

        // Atoms in a 3x3x3 grid (simplified)
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const atom = this.sm.createAtom(
                        new THREE.Vector3(x * a/2, y * a/2, z * a/2),
                        r, color
                    );
                    group.add(atom);
                }
            }
        }

        // Slip plane {111}
        const planeMat = new THREE.MeshPhysicalMaterial({
            color: slipColor,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
            roughness: 0.5
        });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(a * 1.5, a * 1.5), planeMat);
        const normal = new THREE.Vector3(1, 1, 1).normalize();
        plane.position.set(0, 0, 0);
        plane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        group.add(plane);

        // Slip direction arrow <110>
        const slipDir = new THREE.Vector3(1, -1, 0).normalize();
        const arrow = new THREE.ArrowHelper(
            slipDir,
            new THREE.Vector3(-a/2, a/2, 0),
            a * 0.7,
            slipColor,
            0.2,
            0.1
        );
        group.add(arrow);

        // Label
        const labelMat = new THREE.SpriteMaterial({
            map: this._createTextTexture('{111}<110>', slipColor),
            transparent: true
        });
        // Skip sprite for simplicity, use sphere marker
        const marker = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 8, 8),
            new THREE.MeshBasicMaterial({ color: slipColor })
        );
        marker.position.set(0, a, 0);
        group.add(marker);

        return group;
    }

    /**
     * Create BCC slip system visualization  
     */
    createBCCSlip(a = 2) {
        const group = new THREE.Group();
        const r = 0.2;
        const color = 0x34d399;
        const slipColor = 0xff8844;

        // Atoms
        for (let x = -1; x <= 1; x += 2) {
            for (let y = -1; y <= 1; y += 2) {
                for (let z = -1; z <= 1; z += 2) {
                    const atom = this.sm.createAtom(
                        new THREE.Vector3(x * a/2, y * a/2, z * a/2),
                        r, color
                    );
                    group.add(atom);
                }
            }
        }
        // Body center
        const center = this.sm.createAtom(new THREE.Vector3(0, 0, 0), r, color, true);
        group.add(center);

        // Slip plane {110}
        const planeMat = new THREE.MeshPhysicalMaterial({
            color: slipColor,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(a * 1.3, a * 1.3), planeMat);
        plane.rotation.z = Math.PI / 4;
        plane.position.set(0, 0, 0);
        group.add(plane);

        // Slip direction <111>
        const slipDir = new THREE.Vector3(1, 1, 1).normalize();
        const arrow = new THREE.ArrowHelper(
            slipDir,
            new THREE.Vector3(-a/2, -a/2, -a/2),
            a * 0.8,
            slipColor,
            0.2,
            0.1
        );
        group.add(arrow);

        return group;
    }

    /**
     * Create HCP slip system visualization
     */
    createHCPSlip(a = 2) {
        const group = new THREE.Group();
        const r = 0.2;
        const color = 0xffb84d;
        const slipColor = 0xff4444;

        const c = a * Math.sqrt(8/3);

        // Two layers
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const x = i * a + (j % 2) * a/2;
                const z = j * a * Math.sqrt(3)/2;
                if (Math.abs(x) < a * 1.5 && Math.abs(z) < a * 1.5) {
                    const atom1 = this.sm.createAtom(new THREE.Vector3(x, -c/4, z), r, color);
                    group.add(atom1);
                    const atom2 = this.sm.createAtom(new THREE.Vector3(x + a/2, c/4, z + a*Math.sqrt(3)/6), r, color);
                    group.add(atom2);
                }
            }
        }

        // Basal slip plane (0001)
        const planeMat = new THREE.MeshPhysicalMaterial({
            color: slipColor,
            transparent: true,
            opacity: 0.12,
            side: THREE.DoubleSide
        });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(a * 2, a * 2), planeMat);
        plane.rotation.x = Math.PI / 2;
        plane.position.set(0, 0, 0);
        group.add(plane);

        return group;
    }

    /**
     * Apply stress deformation animation
     */
    animateStress(level, duration = 1000) {
        this.stressLevel = Math.max(0, Math.min(1, level));
        // Animation handled by main loop
    }

    _createTextTexture(text, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, 128, 64);
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.fillStyle = '#' + new THREE.Color(color).getHexString();
        ctx.textAlign = 'center';
        ctx.fillText(text, 64, 40);
        return new THREE.CanvasTexture(canvas);
    }

    clear() {
        this.sm.scene.remove(this.slipGroup);
        this.slipGroup.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
        this.slipGroup = new THREE.Group();
    }
}
