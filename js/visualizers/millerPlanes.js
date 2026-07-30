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
     * Animate plane creation step by step
     */
    animatePlaneCreation(h, k, l, a = 2, onComplete = null) {
        this.clear();
        
        // 1. Show intercepts
        this._showIntercepts(h, k, l, a);
        
        // 2. Draw lines to intercepts
        setTimeout(() => {
            this._drawInterceptLines(h, k, l, a);
        }, 1000);

        // 3. Fade in plane
        setTimeout(() => {
            this.generatePlane(h, k, l, a, false);
            // Start at 0 opacity and fade in
            this.planeGroup.children[0].material.opacity = 0;
            this.planeGroup.children[1].material.opacity = 0;
            
            let opacity = 0;
            const fadeIn = () => {
                opacity += 0.02;
                if (opacity <= 0.35) {
                    this.planeGroup.children[0].material.opacity = opacity;
                    this.planeGroup.children[1].material.opacity = opacity * 2.2;
                    requestAnimationFrame(fadeIn);
                } else if (onComplete) {
                    onComplete();
                }
            };
            fadeIn();
        }, 2000);
    }

    _showIntercepts(h, k, l, a) {
        this.interceptMarkers = new THREE.Group();
        
        const intercepts = [
            h !== 0 ? a / (2 * Math.abs(h)) : Infinity,
            k !== 0 ? a / (2 * Math.abs(k)) : Infinity,
            l !== 0 ? a / (2 * Math.abs(l)) : Infinity
        ];

        const signs = [h >= 0 ? 1 : -1, k >= 0 ? 1 : -1, l >= 0 ? 1 : -1];
        const colors = [0xff4444, 0x44ff44, 0x4444ff]; // x, y, z

        for (let i = 0; i < 3; i++) {
            if (intercepts[i] !== Infinity) {
                const markerGeo = new THREE.SphereGeometry(0.12, 16, 16);
                const markerMat = new THREE.MeshBasicMaterial({ color: colors[i] });
                const marker = new THREE.Mesh(markerGeo, markerMat);
                
                const pos = [0, 0, 0];
                pos[i] = intercepts[i] * signs[i];
                marker.position.set(pos[0], pos[1], pos[2]);
                
                // Add pulse animation
                let scale = 0;
                const animateMarker = () => {
                    scale += (1 - scale) * 0.1;
                    marker.scale.set(scale, scale, scale);
                    if (scale < 0.99) requestAnimationFrame(animateMarker);
                };
                animateMarker();
                
                this.interceptMarkers.add(marker);
            }
        }
        
        this.sm.scene.add(this.interceptMarkers);
    }

    _drawInterceptLines(h, k, l, a) {
        this.interceptLines = new THREE.Group();
        
        const intercepts = [
            h !== 0 ? a / (2 * Math.abs(h)) : Infinity,
            k !== 0 ? a / (2 * Math.abs(k)) : Infinity,
            l !== 0 ? a / (2 * Math.abs(l)) : Infinity
        ];

        const signs = [h >= 0 ? 1 : -1, k >= 0 ? 1 : -1, l >= 0 ? 1 : -1];
        
        // Find valid intercept points
        const points = [];
        for (let i = 0; i < 3; i++) {
            if (intercepts[i] !== Infinity) {
                const pos = [0, 0, 0];
                pos[i] = intercepts[i] * signs[i];
                points.push(new THREE.Vector3(pos[0], pos[1], pos[2]));
            }
        }
        
        // Draw dashed lines from origin to intercepts
        const lineMat = new THREE.LineDashedMaterial({
            color: 0xffdd44,
            dashSize: 0.1,
            gapSize: 0.05,
            transparent: true,
            opacity: 0.8
        });
        
        points.forEach(p => {
            const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), p]);
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
