/* ===== CrystalLens Reciprocal Lattice Visualizer ===== */
import * as THREE from 'three';

/**
 * Visualizes the relationship between real space and reciprocal space lattices.
 * Shows the Ewald sphere construction for diffraction.
 */
export class ReciprocalLatticeVisualizer {
    constructor(sceneManager) {
        this.sm = sceneManager;
        this.group = new THREE.Group();
        this.realGroup = new THREE.Group();
        this.recipGroup = new THREE.Group();
    }

    /**
     * Build complete reciprocal space visualization
     */
    build(a = 2, showEwald = true) {
        this.clear();

        const spacing = 3.5;

        // === Real space lattice (left side) ===
        const realR = 0.1;
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const atom = this.sm.createAtom(
                        new THREE.Vector3(x * 0.5, y * 0.5, z * 0.5),
                        realR, 0x00d4ff
                    );
                    this.realGroup.add(atom);
                }
            }
        }

        // Real cell
        const realCell = this.sm.createUnitCell(1, 0x00d4ff, 0.4);
        this.realGroup.add(realCell);

        // "Real Space" label marker
        const realLabel = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0x00d4ff })
        );
        realLabel.position.set(0, 0.8, 0);
        this.realGroup.add(realLabel);

        this.realGroup.position.x = -spacing;
        this.group.add(this.realGroup);

        // === Reciprocal space lattice (right side) ===
        const recipSpacing = Math.PI / 0.5; // 2π/a
        const recipR = 0.08;

        for (let h = -2; h <= 2; h++) {
            for (let k = -2; k <= 2; k++) {
                for (let l = -2; l <= 2; l++) {
                    if (h === 0 && k === 0 && l === 0) continue;
                    
                    const isVisible = (Math.abs(h) + Math.abs(k) + Math.abs(l)) <= 3;
                    if (!isVisible) continue;

                    const point = this.sm.createAtom(
                        new THREE.Vector3(
                            h * recipSpacing * 0.15,
                            k * recipSpacing * 0.15,
                            l * recipSpacing * 0.15
                        ),
                        recipR, 0xff6b9d, true
                    );
                    this.recipGroup.add(point);
                }
            }
        }

        // Origin (000)
        const origin = this.sm.createAtom(
            new THREE.Vector3(0, 0, 0),
            recipR * 1.5, 0xffffff, true
        );
        this.recipGroup.add(origin);

        this.recipGroup.position.x = spacing;
        this.group.add(this.recipGroup);

        // === Ewald Sphere ===
        if (showEwald) {
            const sphereGeo = new THREE.SphereGeometry(1.5, 32, 32);
            const sphereMat = new THREE.MeshPhysicalMaterial({
                color: 0x4488ff,
                transparent: true,
                opacity: 0.08,
                wireframe: false,
                roughness: 0.5,
                metalness: 0.0,
                side: THREE.DoubleSide
            });
            const ewald = new THREE.Mesh(sphereGeo, sphereMat);
            ewald.position.set(0, 0, 0);
            this.group.add(ewald);

            // Wireframe overlay
            const wireGeo = new THREE.SphereGeometry(1.5, 16, 16);
            const wireMat = new THREE.MeshBasicMaterial({
                color: 0x4488ff,
                transparent: true,
                opacity: 0.15,
                wireframe: true
            });
            const wireSphere = new THREE.Mesh(wireGeo, wireMat);
            wireSphere.position.set(0, 0, 0);
            this.group.add(wireSphere);
        }

        // === Connection arrow between real and reciprocal ===
        const arrowPoints = [
            new THREE.Vector3(-1.5, 0, 0),
            new THREE.Vector3(1.5, 0, 0)
        ];
        const arrowGeo = new THREE.BufferGeometry().setFromPoints(arrowPoints);
        const arrowMat = new THREE.LineDashedMaterial({
            color: 0xffffff,
            dashSize: 0.1,
            gapSize: 0.08,
            transparent: true,
            opacity: 0.3
        });
        const arrowLine = new THREE.Line(arrowGeo, arrowMat);
        arrowLine.computeLineDistances();
        this.group.add(arrowLine);

        // Center marker
        const centerMarker = new THREE.Mesh(
            new THREE.SphereGeometry(0.03, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        centerMarker.position.set(0, 0, 0);
        this.group.add(centerMarker);

        this.sm.scene.add(this.group);
        return this.group;
    }

    /**
     * Animate reciprocal lattice rotation
     */
    animate() {
        const speed = 0.005;
        this.sm.addAnimation('reciprocal-rotate', (delta) => {
            if (this.recipGroup) {
                this.recipGroup.rotation.y += delta * speed * 30;
            }
        });
    }

    clear() {
        this.sm.removeAnimation('reciprocal-rotate');
        this.sm.scene.remove(this.group);
        this.group.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
        this.group = new THREE.Group();
        this.realGroup = new THREE.Group();
        this.recipGroup = new THREE.Group();
    }
}
