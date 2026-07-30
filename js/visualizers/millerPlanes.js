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
        this.interceptMarkers = new THREE.Group();
        this.interceptLines = new THREE.Group();
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
     * Generate a plane from Miller indices instantly
     */
    generatePlane(h, k, l, a = 2, clearAll = true) {
        if (clearAll) {
            this.clear();
        } else {
            if (this.planeGroup) {
                this.sm.scene.remove(this.planeGroup);
                this.planeGroup.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
            }
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
        const planeSize = a * 1.5;
        const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);

        // Color based on indices
        const hue = (Math.abs(h) * 30 + Math.abs(k) * 60 + Math.abs(l) * 90) % 360;
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
            plane.position.set(0, 0, intercepts[2] * signs[2]);
        } else if (h !== 0 && k === 0 && l === 0) {
            plane.position.set(intercepts[0] * signs[0], 0, 0);
            plane.rotation.y = Math.PI / 2;
        } else if (h === 0 && k !== 0 && l === 0) {
            plane.position.set(0, intercepts[1] * signs[1], 0);
            plane.rotation.x = Math.PI / 2;
        } else {
            const normal = new THREE.Vector3(h, k, l).normalize();
            const d = a / (2 * Math.sqrt(h * h + k * k + l * l));
            plane.position.copy(normal.clone().multiplyScalar(d * signs[0]));
            plane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        }

        this.planeGroup.add(plane);

        // Add plane border
        const borderMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 });
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

        // Make plane clickable
        plane.userData = { isMillerPlane: true, h, k, l };
        this.sm.addClickable(plane, () => {
            if (this.onPlaneClick) this.onPlaneClick(h, k, l);
        });

        this.sm.scene.add(this.planeGroup);
        this.currentPlane = { h, k, l, plane, color };

        return this.planeGroup;
    }

    /**
     * Animate plane creation step by step smoothly using the render loop
     */
    animatePlaneCreation(h, k, l, a = 2, onComplete = null) {
        this.clear();

        // Prepare elements but hide them initially
        this._prepareInterceptMarkers(h, k, l, a);
        this._prepareInterceptLines(h, k, l, a);
        this.generatePlane(h, k, l, a, false);
        
        // Set initial states
        this.interceptMarkers.children.forEach(m => m.scale.set(0.001, 0.001, 0.001));
        
        // Lines: we'll animate their drawing by changing their geometry dynamically
        const lineTargets = [];
        this.interceptLines.children.forEach(line => {
            const positions = line.geometry.attributes.position.array;
            const targetPos = new THREE.Vector3(positions[3], positions[4], positions[5]);
            lineTargets.push(targetPos);
            // reset to origin
            positions[3] = 0; positions[4] = 0; positions[5] = 0;
            line.geometry.attributes.position.needsUpdate = true;
            line.computeLineDistances();
        });

        // Plane
        const planeMesh = this.planeGroup.children[0];
        const planeBorder = this.planeGroup.children[1];
        if (planeMesh && planeBorder) {
            planeMesh.material.opacity = 0;
            planeBorder.material.opacity = 0;
        }

        // Animation state
        let time = 0;
        
        this.sm.addAnimation('millerAnim', (delta) => {
            time += delta;
            
            // Phase 1: 0 - 0.5s -> Grow markers
            if (time < 0.8) {
                const progress = Math.min(time / 0.5, 1.0);
                const easeOutBack = t => {
                    const c1 = 1.70158;
                    const c3 = c1 + 1;
                    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
                };
                const scale = Math.max(0.001, easeOutBack(progress));
                this.interceptMarkers.children.forEach(m => m.scale.set(scale, scale, scale));
            }

            // Phase 2: 0.8 - 1.5s -> Draw lines
            if (time > 0.8 && time < 1.8) {
                const progress = Math.min((time - 0.8) / 0.7, 1.0);
                const easeOutQuad = t => t * (2 - t);
                const p = easeOutQuad(progress);
                
                this.interceptLines.children.forEach((line, i) => {
                    const target = lineTargets[i];
                    const positions = line.geometry.attributes.position.array;
                    positions[3] = target.x * p;
                    positions[4] = target.y * p;
                    positions[5] = target.z * p;
                    line.geometry.attributes.position.needsUpdate = true;
                    line.computeLineDistances();
                });
            }

            // Phase 3: 1.8 - 2.8s -> Fade in plane
            if (time > 1.8) {
                const progress = Math.min((time - 1.8) / 1.0, 1.0);
                if (planeMesh && planeBorder) {
                    planeMesh.material.opacity = progress * 0.35;
                    planeBorder.material.opacity = progress * 0.8;
                }
            }

            // Completion
            if (time > 2.8) {
                this.sm.removeAnimation('millerAnim');
                if (onComplete) onComplete();
            }
        });
    }

    _prepareInterceptMarkers(h, k, l, a) {
        this.interceptMarkers = new THREE.Group();
        
        const intercepts = [
            h !== 0 ? a / (2 * Math.abs(h)) : Infinity,
            k !== 0 ? a / (2 * Math.abs(k)) : Infinity,
            l !== 0 ? a / (2 * Math.abs(l)) : Infinity
        ];
        const signs = [h >= 0 ? 1 : -1, k >= 0 ? 1 : -1, l >= 0 ? 1 : -1];
        const colors = [0xff4444, 0x44ff44, 0x4444ff];

        for (let i = 0; i < 3; i++) {
            if (intercepts[i] !== Infinity) {
                const marker = new THREE.Mesh(
                    new THREE.SphereGeometry(0.12, 16, 16),
                    new THREE.MeshBasicMaterial({ color: colors[i] })
                );
                const pos = [0, 0, 0];
                pos[i] = intercepts[i] * signs[i];
                marker.position.set(...pos);
                this.interceptMarkers.add(marker);
            }
        }
        this.sm.scene.add(this.interceptMarkers);
    }

    _prepareInterceptLines(h, k, l, a) {
        this.interceptLines = new THREE.Group();
        
        const intercepts = [
            h !== 0 ? a / (2 * Math.abs(h)) : Infinity,
            k !== 0 ? a / (2 * Math.abs(k)) : Infinity,
            l !== 0 ? a / (2 * Math.abs(l)) : Infinity
        ];
        const signs = [h >= 0 ? 1 : -1, k >= 0 ? 1 : -1, l >= 0 ? 1 : -1];
        
        const points = [];
        for (let i = 0; i < 3; i++) {
            if (intercepts[i] !== Infinity) {
                const pos = [0, 0, 0];
                pos[i] = intercepts[i] * signs[i];
                points.push(new THREE.Vector3(...pos));
            }
        }
        
        const lineMat = new THREE.LineDashedMaterial({
            color: 0xffdd44,
            dashSize: 0.1,
            gapSize: 0.05,
            transparent: true,
            opacity: 0.8
        });
        
        points.forEach(p => {
            const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), p.clone()]);
            const line = new THREE.Line(geo, lineMat);
            line.computeLineDistances();
            this.interceptLines.add(line);
        });
        this.sm.scene.add(this.interceptLines);
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
        if (this.interceptMarkers) {
            this.sm.scene.remove(this.interceptMarkers);
            this.interceptMarkers.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        if (this.interceptLines) {
            this.sm.scene.remove(this.interceptLines);
            this.interceptLines.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        this.currentPlane = null;
    }
}
