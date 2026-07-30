/* ===== CrystalLens Crystal Visualizer ===== */
import * as THREE from 'three';
import { MillerPlaneVisualizer } from '../visualizers/millerPlanes.js';
import { DefectVisualizer } from '../visualizers/defects.js';

/**
 * CrystalVisualizer — generates all 3D crystal structure visualizations.
 * Each method creates the appropriate atoms, bonds, unit cells, and labels
 * for a module's learning content.
 */
export class CrystalVisualizer {
    constructor() {
        // Geometry cache for performance optimization
        this._geoCache = new Map();
        this._matCache = new Map();
        this.millerPlanes = new MillerPlaneVisualizer();
        this.defectVisualizer = new DefectVisualizer();
    }

    _getCachedGeo(type, params) {
        const key = `${type}-${JSON.stringify(params)}`;
        if (!this._geoCache.has(key)) {
            this._geoCache.set(key, this._createGeo(type, params));
        }
        return this._geoCache.get(key);
    }

    _createGeo(type, params) {
        switch (type) {
            case 'sphere': return new THREE.SphereGeometry(params.r, 24, 24);
            case 'sphere-small': return new THREE.SphereGeometry(params.r, 16, 16);
            case 'sphere-tiny': return new THREE.SphereGeometry(params.r, 12, 12);
            default: return new THREE.SphereGeometry(0.2, 16, 16);
        }
    }

    _getCachedMat(params) {
        const key = `${params.color}-${params.emissive}-${params.opacity || 1}`;
        if (!this._matCache.has(key)) {
            const mat = new THREE.MeshPhysicalMaterial({
                color: params.color,
                metalness: params.metalness || 0.1,
                roughness: params.roughness || 0.3,
                clearcoat: params.clearcoat || 0.1,
                clearcoatRoughness: params.clearcoatRoughness || 0.4,
                emissive: params.emissive ? params.color : 0x000000,
                emissiveIntensity: params.emissive ? 0.2 : 0,
                transparent: params.opacity !== undefined && params.opacity < 1,
                opacity: params.opacity !== undefined ? params.opacity : 1
            });
            this._matCache.set(key, mat);
        }
        return this._matCache.get(key);
    }

    // ==================== CORE STRUCTURES ====================

    /**
     * Face-Centered Cubic (FCC)
     */
    createFCC(sm, options = {}) {
        const { repeat = 1, color = 0x00d4ff, atomRadius = 0.3, showCell = true } = options;
        const group = new THREE.Group();
        const a = 1;
        const r = atomRadius;
        const offset = (repeat - 1) * a / 2 * (-1);

        // Corner atoms: 8 corners per cell, shared by 8 cells
        for (let rx = 0; rx < repeat; rx++) {
            for (let ry = 0; ry < repeat; ry++) {
                for (let rz = 0; rz < repeat; rz++) {
                    const baseX = rx * a + offset;
                    const baseY = ry * a + offset;
                    const baseZ = rz * a + offset;

                    // 8 corners
                    const corners = [
                        [0,0,0],[1,0,0],[0,1,0],[0,0,1],
                        [1,1,0],[1,0,1],[0,1,1],[1,1,1]
                    ];
                    corners.forEach(([cx, cy, cz]) => {
                        const atom = sm.createAtom(
                            new THREE.Vector3(baseX + cx * a, baseY + cy * a, baseZ + cz * a),
                            r, color
                        );
                        group.add(atom);
                    });

                    // 6 face centers
                    const faces = [
                        [0.5,0.5,0],[0.5,0,0.5],[0,0.5,0.5],
                        [0.5,0.5,1],[0.5,1,0.5],[1,0.5,0.5]
                    ];
                    faces.forEach(([fx, fy, fz]) => {
                        const atom = sm.createAtom(
                            new THREE.Vector3(baseX + fx * a, baseY + fy * a, baseZ + fz * a),
                            r, color
                        );
                        group.add(atom);
                    });

                    // Unit cell wireframe
                    if (showCell) {
                        const cell = sm.createUnitCell(a, 0x4488aa, 0.5);
                        cell.position.set(baseX + a/2, baseY + a/2, baseZ + a/2);
                        group.add(cell);
                    }
                }
            }
        }

        sm.add('fcc', group);
        sm.controls.autoRotate = true;
        return group;
    }

    /**
     * Body-Centered Cubic (BCC)
     */
    createBCC(sm, options = {}) {
        const { repeat = 1, color = 0x34d399, atomRadius = 0.3, showCell = true } = options;
        const group = new THREE.Group();
        const a = 1;
        const r = atomRadius;
        const offset = (repeat - 1) * a / 2 * (-1);

        for (let rx = 0; rx < repeat; rx++) {
            for (let ry = 0; ry < repeat; ry++) {
                for (let rz = 0; rz < repeat; rz++) {
                    const baseX = rx * a + offset;
                    const baseY = ry * a + offset;
                    const baseZ = rz * a + offset;

                    // 8 corners
                    const corners = [
                        [0,0,0],[1,0,0],[0,1,0],[0,0,1],
                        [1,1,0],[1,0,1],[0,1,1],[1,1,1]
                    ];
                    corners.forEach(([cx, cy, cz]) => {
                        const atom = sm.createAtom(
                            new THREE.Vector3(baseX + cx * a, baseY + cy * a, baseZ + cz * a),
                            r, color
                        );
                        group.add(atom);
                    });

                    // Body center
                    const centerAtom = sm.createAtom(
                        new THREE.Vector3(baseX + a/2, baseY + a/2, baseZ + a/2),
                        r, color, true
                    );
                    group.add(centerAtom);

                    if (showCell) {
                        const cell = sm.createUnitCell(a, 0x4488aa, 0.5);
                        cell.position.set(baseX + a/2, baseY + a/2, baseZ + a/2);
                        group.add(cell);
                    }
                }
            }
        }

        sm.add('bcc', group);
        sm.controls.autoRotate = true;
        return group;
    }

    /**
     * Hexagonal Close-Packed (HCP)
     */
    createHCP(sm, options = {}) {
        const { repeat = 1, color = 0xffb84d, atomRadius = 0.3, showCell = true } = options;
        const group = new THREE.Group();
        const a = 1;
        const c = Math.sqrt(8/3) * a; // Ideal c/a ratio
        const r = atomRadius;

        // Generate hexagonal layers
        for (let layer = 0; layer < repeat * 2; layer++) {
            const isB = layer % 2 === 1;
            const yOffset = layer * c / (repeat * 2) - (repeat - 1) * c / 2;

            for (let i = -repeat; i <= repeat; i++) {
                for (let j = -repeat; j <= repeat; j++) {
                    const xOffset = isB ? a / 2 : 0;
                    const zOffset = isB ? a * Math.sqrt(3) / 6 : 0;
                    const x = i * a + (j % 2) * a / 2 + xOffset;
                    const z = j * a * Math.sqrt(3) / 2 + zOffset;

                    // Keep within bounds
                    if (Math.abs(x) > repeat * a || Math.abs(z) > repeat * a * 0.9) continue;

                    const atom = sm.createAtom(
                        new THREE.Vector3(x, yOffset, z),
                        r, color
                    );
                    group.add(atom);
                }
            }
        }

        // Hexagonal cell
        if (showCell) {
            const cellGroup = new THREE.Group();
            const halfA = repeat * a;
            const halfC = repeat * c / 2;

            // Draw hexagonal prism edges
            for (let i = 0; i < 6; i++) {
                const angle1 = i * Math.PI / 3;
                const angle2 = (i + 1) * Math.PI / 3;
                const x1 = halfA * Math.cos(angle1);
                const z1 = halfA * Math.sin(angle1);
                const x2 = halfA * Math.cos(angle2);
                const z2 = halfA * Math.sin(angle2);

                // Bottom edges
                const p1 = new THREE.Vector3(x1, -halfC, z1);
                const p2 = new THREE.Vector3(x2, -halfC, z2);
                const geo1 = new THREE.BufferGeometry().setFromPoints([p1, p2]);
                const line1 = new THREE.Line(geo1, new THREE.LineBasicMaterial({ color: 0x6688aa, transparent: true, opacity: 0.4 }));
                cellGroup.add(line1);

                // Top edges
                const p3 = new THREE.Vector3(x1, halfC, z1);
                const p4 = new THREE.Vector3(x2, halfC, z2);
                const geo2 = new THREE.BufferGeometry().setFromPoints([p3, p4]);
                const line2 = new THREE.Line(geo2, new THREE.LineBasicMaterial({ color: 0x6688aa, transparent: true, opacity: 0.4 }));
                cellGroup.add(line2);

                // Vertical edges
                const geo3 = new THREE.BufferGeometry().setFromPoints([p1, p3]);
                const line3 = new THREE.Line(geo3, new THREE.LineBasicMaterial({ color: 0x6688aa, transparent: true, opacity: 0.4 }));
                cellGroup.add(line3);
            }
            group.add(cellGroup);
        }

        sm.add('hcp', group);
        sm.controls.autoRotate = true;
        return group;
    }

    /**
     * Simple Cubic
     */
    createSimpleCubic(sm, options = {}) {
        const { repeat = 1, color = 0x8888ff, atomRadius = 0.25 } = options;
        const group = new THREE.Group();
        const a = 1;

        for (let rx = 0; rx < repeat; rx++) {
            for (let ry = 0; ry < repeat; ry++) {
                for (let rz = 0; rz < repeat; rz++) {
                    const corners = [
                        [0,0,0],[1,0,0],[0,1,0],[0,0,1],
                        [1,1,0],[1,0,1],[0,1,1],[1,1,1]
                    ];
                    corners.forEach(([cx, cy, cz]) => {
                        const atom = sm.createAtom(
                            new THREE.Vector3(rx + cx, ry + cy, rz + cz),
                            atomRadius, color
                        );
                        group.add(atom);
                    });

                    const cell = sm.createUnitCell(a, 0x6688aa, 0.5);
                    cell.position.set(rx + 0.5, ry + 0.5, rz + 0.5);
                    group.add(cell);
                }
            }
        }

        sm.add('simple', group);
        return group;
    }

    // ==================== COMPLEX STRUCTURES ====================

    createCsCl(sm, options = {}) {
        const { repeat = 1 } = options;
        const group = new THREE.Group();
        const a = 1;

        for (let rx = 0; rx < repeat; rx++) {
            for (let ry = 0; ry < repeat; ry++) {
                for (let rz = 0; rz < repeat; rz++) {
                    const corners = [
                        [0,0,0],[1,0,0],[0,1,0],[0,0,1],
                        [1,1,0],[1,0,1],[0,1,1],[1,1,1]
                    ];
                    corners.forEach(([cx, cy, cz]) => {
                        // Cl- ions (green) at corners
                        const atom = sm.createAtom(
                            new THREE.Vector3(rx + cx, ry + cy, rz + cz),
                            0.35, 0x44cc44
                        );
                        group.add(atom);
                    });

                    // Cs+ ion (gold) at body center
                    const center = sm.createAtom(
                        new THREE.Vector3(rx + 0.5, ry + 0.5, rz + 0.5),
                        0.3, 0xffaa44, true
                    );
                    group.add(center);

                    const cell = sm.createUnitCell(a, 0x6688aa, 0.4);
                    cell.position.set(rx + 0.5, ry + 0.5, rz + 0.5);
                    group.add(cell);
                }
            }
        }

        sm.add('cscl', group);
        return group;
    }

    createNaCl(sm, options = {}) {
        const { repeat = 1 } = options;
        const group = new THREE.Group();
        const a = 1;

        for (let rx = 0; rx < repeat; rx++) {
            for (let ry = 0; ry < repeat; ry++) {
                for (let rz = 0; rz < repeat; rz++) {
                    // Na+ (blue) at corners and face centers
                    const corners = [
                        [0,0,0],[1,0,0],[0,1,0],[0,0,1],
                        [1,1,0],[1,0,1],[0,1,1],[1,1,1]
                    ];
                    corners.forEach(([cx, cy, cz]) => {
                        const atom = sm.createAtom(
                            new THREE.Vector3(rx + cx, ry + cy, rz + cz),
                            0.2, 0x4488ff
                        );
                        group.add(atom);
                    });

                    // Cl- (green) at edge centers and body center
                    const edges = [
                        [0.5,0,0],[0,0.5,0],[0,0,0.5],
                        [0.5,1,0],[0,0.5,1],[0,0,0.5],
                        [1,0.5,0],[1,0,0.5],[0.5,0,1],
                        [0.5,1,1],[1,0.5,1],[1,1,0.5]
                    ];
                    edges.forEach(([ex, ey, ez]) => {
                        const atom = sm.createAtom(
                            new THREE.Vector3(rx + ex, ry + ey, rz + ez),
                            0.25, 0x44dd44
                        );
                        group.add(atom);
                    });

                    const cell = sm.createUnitCell(a, 0x6688aa, 0.4);
                    cell.position.set(rx + 0.5, ry + 0.5, rz + 0.5);
                    group.add(cell);
                }
            }
        }

        sm.add('nacl', group);
        return group;
    }

    createZincBlende(sm, options = {}) {
        const { repeat = 1 } = options;
        const group = new THREE.Group();
        const a = 1;

        for (let rx = 0; rx < repeat; rx++) {
            for (let ry = 0; ry < repeat; ry++) {
                for (let rz = 0; rz < repeat; rz++) {
                    // S (yellow) at FCC positions
                    const corners = [
                        [0,0,0],[1,0,0],[0,1,0],[0,0,1],
                        [1,1,0],[1,0,1],[0,1,1],[1,1,1]
                    ];
                    corners.forEach(([cx, cy, cz]) => {
                        const atom = sm.createAtom(
                            new THREE.Vector3(rx + cx, ry + cy, rz + cz),
                            0.3, 0xffee44
                        );
                        group.add(atom);
                    });
                    const faceCenters = [
                        [0.5,0.5,0],[0.5,0,0.5],[0,0.5,0.5],
                        [0.5,0.5,1],[0.5,1,0.5],[1,0.5,0.5]
                    ];
                    faceCenters.forEach(([fx, fy, fz]) => {
                        const atom = sm.createAtom(
                            new THREE.Vector3(rx + fx, ry + fy, rz + fz),
                            0.3, 0xffee44
                        );
                        group.add(atom);
                    });

                    // Zn (gray) at tetrahedral sites
                    const tetrahedral = [
                        [0.25,0.25,0.25],[0.75,0.75,0.25],
                        [0.75,0.25,0.75],[0.25,0.75,0.75]
                    ];
                    tetrahedral.forEach(([tx, ty, tz]) => {
                        const atom = sm.createAtom(
                            new THREE.Vector3(rx + tx, ry + ty, rz + tz),
                            0.2, 0x888888
                        );
                        group.add(atom);
                    });

                    const cell = sm.createUnitCell(a, 0x6688aa, 0.4);
                    cell.position.set(rx + 0.5, ry + 0.5, rz + 0.5);
                    group.add(cell);
                }
            }
        }

        sm.add('zincblende', group);
        return group;
    }

    createDiamondCubic(sm, options = {}) {
        const { repeat = 1 } = options;
        const group = new THREE.Group();
        const a = 1;
        const color = 0x88ddff;

        for (let rx = 0; rx < repeat; rx++) {
            for (let ry = 0; ry < repeat; ry++) {
                for (let rz = 0; rz < repeat; rz++) {
                    // FCC positions
                    const corners = [
                        [0,0,0],[1,0,0],[0,1,0],[0,0,1],
                        [1,1,0],[1,0,1],[0,1,1],[1,1,1]
                    ];
                    corners.forEach(([cx, cy, cz]) => {
                        const atom = sm.createAtom(
                            new THREE.Vector3(rx + cx, ry + cy, rz + cz),
                            0.25, color
                        );
                        group.add(atom);
                    });
                    const faceCenters = [
                        [0.5,0.5,0],[0.5,0,0.5],[0,0.5,0.5],
                        [0.5,0.5,1],[0.5,1,0.5],[1,0.5,0.5]
                    ];
                    faceCenters.forEach(([fx, fy, fz]) => {
                        const atom = sm.createAtom(
                            new THREE.Vector3(rx + fx, ry + fy, rz + fz),
                            0.25, color
                        );
                        group.add(atom);
                    });

                    // Tetrahedral sites
                    const tetra = [
                        [0.25,0.25,0.25],[0.75,0.75,0.25],
                        [0.75,0.25,0.75],[0.25,0.75,0.75]
                    ];
                    tetra.forEach(([tx, ty, tz]) => {
                        const atom = sm.createAtom(
                            new THREE.Vector3(rx + tx, ry + ty, rz + tz),
                            0.25, color
                        );
                        group.add(atom);
                    });

                    const cell = sm.createUnitCell(a, 0x6688aa, 0.3);
                    cell.position.set(rx + 0.5, ry + 0.5, rz + 0.5);
                    group.add(cell);
                }
            }
        }

        sm.add('diamond', group);
        return group;
    }

    // ==================== DEMO / MODULE VISUALIZATIONS ====================

    /**
     * Seven crystal systems preview
     */
    createSevenCrystalSystems(sm) {
        const group = new THREE.Group();
        const systems = [
            { name: 'Cubic', a: 1, b: 1, c: 1, alpha: 90, beta: 90, gamma: 90, color: 0x00d4ff },
            { name: 'Tetragonal', a: 0.8, b: 0.8, c: 1.4, alpha: 90, beta: 90, gamma: 90, color: 0x34d399 },
            { name: 'Orthorhombic', a: 0.7, b: 1, c: 1.3, alpha: 90, beta: 90, gamma: 90, color: 0xffb84d },
            { name: 'Hexagonal', a: 1, b: 1, c: 1.2, alpha: 90, beta: 90, gamma: 120, color: 0xff6b9d },
            { name: 'Monoclinic', a: 1, b: 0.8, c: 1.2, alpha: 90, beta: 110, gamma: 90, color: 0xa78bfa },
            { name: 'Trigonal', a: 0.9, b: 0.9, c: 0.9, alpha: 80, beta: 80, gamma: 80, color: 0xf59e0b },
            { name: 'Triclinic', a: 0.8, b: 1, c: 1.1, alpha: 75, beta: 100, gamma: 85, color: 0xec4899 }
        ];

        const spacing = 2.2;
        const startX = -(systems.length - 1) * spacing / 2;

        systems.forEach((sys, i) => {
            const sysGroup = new THREE.Group();
            const x = startX + i * spacing;

            // Create unit cell box
            const cellGeo = new THREE.BoxGeometry(sys.a, sys.c, sys.b);
            const edges = new THREE.EdgesGeometry(cellGeo);
            const cellMat = new THREE.LineBasicMaterial({ 
                color: sys.color, 
                transparent: true, 
                opacity: 0.8 
            });
            const cell = new THREE.LineSegments(edges, cellMat);
            sysGroup.add(cell);

            // Atoms at corners
            const r = 0.12;
            const corners = [
                [-sys.a/2, -sys.c/2, -sys.b/2], [sys.a/2, -sys.c/2, -sys.b/2],
                [-sys.a/2, sys.c/2, -sys.b/2], [-sys.a/2, -sys.c/2, sys.b/2],
                [sys.a/2, sys.c/2, -sys.b/2], [sys.a/2, -sys.c/2, sys.b/2],
                [-sys.a/2, sys.c/2, sys.b/2], [sys.a/2, sys.c/2, sys.b/2]
            ];
            corners.forEach(pos => {
                const atom = sm.createAtom(
                    new THREE.Vector3(pos[0], pos[1], pos[2]),
                    r, sys.color, true
                );
                sysGroup.add(atom);
            });

            // Apply non-90° angles for non-cubic systems
            if (sys.gamma !== 90) {
                // For hexagonal/trigonal, adjust the geometry
            }

            sysGroup.position.x = x;
            group.add(sysGroup);
        });

        sm.add('crystal-systems', group);
        sm.camera.position.set(0, 4, 8);
        sm.controls.target.set(0, 0, 0);
        sm.controls.autoRotate = true;
        sm.controls.autoRotateSpeed = 1.5;
        return group;
    }

    /**
     * Bravais lattices preview
     */
    createBravaisLatticesPreview(sm) {
        const group = new THREE.Group();
        const cells = [
            { name: 'Cubic P', type: 'cubic-p', color: 0x00d4ff },
            { name: 'Cubic I', type: 'cubic-i', color: 0x34d399 },
            { name: 'Cubic F', type: 'cubic-f', color: 0xffb84d },
        ];

        const spacing = 2.5;
        const startX = -(cells.length - 1) * spacing / 2;

        cells.forEach((cell, i) => {
            const cellGroup = new THREE.Group();
            const x = startX + i * spacing;
            const a = 1;
            const r = 0.15;

            // 8 corners
            const corners = [
                [-a/2,-a/2,-a/2],[a/2,-a/2,-a/2],[-a/2,a/2,-a/2],[-a/2,-a/2,a/2],
                [a/2,a/2,-a/2],[a/2,-a/2,a/2],[-a/2,a/2,a/2],[a/2,a/2,a/2]
            ];
            corners.forEach(pos => {
                const atom = sm.createAtom(new THREE.Vector3(pos[0], pos[1], pos[2]), r, cell.color);
                cellGroup.add(atom);
            });

            if (cell.type === 'cubic-i') {
                const center = sm.createAtom(new THREE.Vector3(0, 0, 0), r, cell.color, true);
                cellGroup.add(center);
            }

            if (cell.type === 'cubic-f') {
                const faces = [[0,0,-a/2],[0,-a/2,0],[-a/2,0,0],[0,0,a/2],[0,a/2,0],[a/2,0,0]];
                faces.forEach(pos => {
                    const atom = sm.createAtom(new THREE.Vector3(pos[0], pos[1], pos[2]), r, cell.color);
                    cellGroup.add(atom);
                });
            }

            const cellLine = sm.createUnitCell(a, cell.color, 0.6);
            cellGroup.add(cellLine);
            cellGroup.position.x = x;
            group.add(cellGroup);
        });

        sm.add('bravais', group);
        sm.camera.position.set(0, 3, 6);
        sm.controls.autoRotate = true;
        return group;
    }

    /**
     * Unit cell demo
     */
    createUnitCellDemo(sm) {
        const group = new THREE.Group();
        const a = 1.5;

        // Unit cell
        const cell = sm.createUnitCell(a, 0x00d4ff, 0.8);
        group.add(cell);

        // 8 corner atoms
        const corners = [
            [-a/2,-a/2,-a/2],[a/2,-a/2,-a/2],[-a/2,a/2,-a/2],[-a/2,-a/2,a/2],
            [a/2,a/2,-a/2],[a/2,-a/2,a/2],[-a/2,a/2,a/2],[a/2,a/2,a/2]
        ];
        corners.forEach(pos => {
            const atom = sm.createAtom(new THREE.Vector3(pos[0], pos[1], pos[2]), 0.2, 0x00d4ff, true);
            group.add(atom);
        });

        // Label with text sprite would go here

        sm.add('unitcell', group);
        sm.controls.autoRotate = true;
        return group;
    }

    /**
     * Comparison view (FCC, BCC, HCP side-by-side)
     */
    createComparisonView(sm) {
        const group = new THREE.Group();
        const spacing = 2.8;

        // FCC
        const fccGroup = new THREE.Group();
        this._addComparisonCell(sm, fccGroup, 'fcc', -spacing, 0x00d4ff);
        group.add(fccGroup);

        // BCC
        const bccGroup = new THREE.Group();
        this._addComparisonCell(sm, bccGroup, 'bcc', 0, 0x34d399);
        group.add(bccGroup);

        // HCP
        const hcpGroup = new THREE.Group();
        this._addComparisonCell(sm, hcpGroup, 'hcp', spacing, 0xffb84d);
        group.add(hcpGroup);

        sm.add('comparison', group);
        sm.camera.position.set(0, 2.5, 6);
        sm.controls.autoRotate = true;
        sm.controls.autoRotateSpeed = 1.5;
        return group;
    }

    _addComparisonCell(sm, group, type, xOffset, color) {
        const a = 1;
        const r = 0.25;

        // Corners
        const corners = [
            [-a/2,-a/2,-a/2],[a/2,-a/2,-a/2],[-a/2,a/2,-a/2],[-a/2,-a/2,a/2],
            [a/2,a/2,-a/2],[a/2,-a/2,a/2],[-a/2,a/2,a/2],[a/2,a/2,a/2]
        ];
        corners.forEach(pos => {
            const atom = this._quickAtom(new THREE.Vector3(pos[0], pos[1], pos[2]), r, color);
            group.add(atom);
        });

        if (type === 'fcc') {
            const faces = [[0,0,-a/2],[0,-a/2,0],[-a/2,0,0],[0,0,a/2],[0,a/2,0],[a/2,0,0]];
            faces.forEach(pos => group.add(this._quickAtom(new THREE.Vector3(pos[0], pos[1], pos[2]), r, color)));
        } else if (type === 'bcc') {
            group.add(this._quickAtom(new THREE.Vector3(0, 0, 0), r, color, true));
        } else if (type === 'hcp') {
            // Additional HCP atoms
            const hcpPositions = [
                [0, 0.5, 0.5*a], [0, -0.5, -0.5*a],
                [0.5*a, 0.5, 0], [-0.5*a, -0.5, 0],
                [0, 0.5, -0.5*a], [0, -0.5, 0.5*a]
            ];
            hcpPositions.forEach(pos => group.add(this._quickAtom(new THREE.Vector3(pos[0], pos[1], pos[2]), r, color)));
        }

        const cell = sm.createUnitCell(a, color, 0.4);
        group.add(cell);
        group.position.x = xOffset;
    }

    _quickAtom(pos, r, color, emissive = false) {
        const geoType = r > 0.2 ? 'sphere' : r > 0.1 ? 'sphere-small' : 'sphere-tiny';
        const geo = this._getCachedGeo(geoType, { r });
        // Clone material so per-atom mutations (opacity, color) don't leak to siblings
        const baseMat = this._getCachedMat({ color, emissive, metalness: 0.1, roughness: 0.3 });
        const mat = baseMat.clone();
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        mesh.userData.role = 'atom';
        mesh.userData.basePosition = mesh.position.clone();
        mesh.userData.baseScale = mesh.scale.clone();
        return mesh;
    }

    /**
     * APF demonstration
     */
    createAPFDemo(sm) {
        const group = new THREE.Group();
        const structures = [
            { name: 'SC', apf: 0.52, color: 0x8888ff, y: 1.5 },
            { name: 'BCC', apf: 0.68, color: 0x34d399, y: 0 },
            { name: 'FCC', apf: 0.74, color: 0x00d4ff, y: -1.5 }
        ];

        structures.forEach(s => {
            const subGroup = new THREE.Group();
            const a = 1;
            const r = a * (s.name === 'FCC' ? Math.sqrt(2)/4 : s.name === 'BCC' ? Math.sqrt(3)/4 : 0.5) * 0.9;

            // Atoms
            const corners = [
                [-a/2,-a/2,-a/2],[a/2,-a/2,-a/2],[-a/2,a/2,-a/2],[-a/2,-a/2,a/2],
                [a/2,a/2,-a/2],[a/2,-a/2,a/2],[-a/2,a/2,a/2],[a/2,a/2,a/2]
            ];
            corners.forEach(pos => subGroup.add(this._quickAtom(new THREE.Vector3(pos[0], pos[1], pos[2]), r, s.color)));

            if (s.name === 'FCC') {
                const faces = [[0,0,-a/2],[0,-a/2,0],[-a/2,0,0],[0,0,a/2],[0,a/2,0],[a/2,0,0]];
                faces.forEach(pos => subGroup.add(this._quickAtom(new THREE.Vector3(pos[0], pos[1], pos[2]), r, s.color)));
            } else if (s.name === 'BCC') {
                subGroup.add(this._quickAtom(new THREE.Vector3(0, 0, 0), r, s.color));
            }

            const cell = sm.createUnitCell(a, s.color, 0.3);
            subGroup.add(cell);
            subGroup.position.y = s.y;
            group.add(subGroup);
        });

        sm.add('apf', group);
        sm.camera.position.set(3, 2, 5);
        sm.controls.autoRotate = true;
        return group;
    }

    /**
     * Coordination number demo
     */
    createCoordinationDemo(sm) {
        const group = new THREE.Group();
        const a = 1;
        const r = 0.25;
        const color = 0x555555; // default uncounted color
        const nnColor = 0xff6b9d; // counted color

        // State for tracking
        this._coordCount = 0;
        this._coordMax = 12;
        this._coordAtoms = [];
        this._coordBonds = [];

        // Central atom
        const center = this._quickAtom(new THREE.Vector3(0, 0, 0), r * 1.3, 0xff4444, true);
        group.add(center);

        // 12 nearest neighbors for FCC
        const nnPositions = [
            [a/2, a/2, 0], [-a/2, a/2, 0], [a/2, -a/2, 0], [-a/2, -a/2, 0],
            [a/2, 0, a/2], [-a/2, 0, a/2], [a/2, 0, -a/2], [-a/2, 0, -a/2],
            [0, a/2, a/2], [0, -a/2, a/2], [0, a/2, -a/2], [0, -a/2, -a/2]
        ];

        nnPositions.forEach((pos, idx) => {
            const atom = this._quickAtom(new THREE.Vector3(pos[0], pos[1], pos[2]), r, color);
            // Setup click interaction
            sm.addClickable(atom, (clickedMesh) => {
                if (clickedMesh.userData.counted) return; // already counted
                
                clickedMesh.userData.counted = true;
                clickedMesh.material.color.setHex(nnColor);
                
                // Light up the corresponding bond
                const bond = this._coordBonds[idx];
                if (bond) {
                    bond.material.color.setHex(nnColor);
                    bond.material.opacity = 0.8;
                }

                // Animate pop
                const popAnimId = 'pop_' + Math.random();
                let pt = 0;
                sm.addAnimation(popAnimId, (delta) => {
                    pt += delta * 4;
                    if (pt <= 1) {
                        const s = 1 + 0.3 * Math.sin(pt * Math.PI);
                        clickedMesh.scale.setScalar(s);
                    } else {
                        clickedMesh.scale.setScalar(1);
                        sm.removeAnimation(popAnimId);
                    }
                });

                this._coordCount++;
                this._updateCoordinationUI();
            });
            this._coordAtoms.push(atom);
            group.add(atom);

            // Bond from center to neighbor
            const bond = sm.createBond(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(pos[0], pos[1], pos[2]),
                0.03, color
            );
            bond.material.transparent = true;
            bond.material.opacity = 0.2; // Dim until clicked
            this._coordBonds.push(bond);
            group.add(bond);
        });

        const cell = sm.createUnitCell(a, 0x4488aa, 0.2);
        group.add(cell);

        sm.add('coordination', group);
        sm.camera.position.set(3, 2, 4);
        sm.controls.autoRotate = false; // Easier to click when not rotating

        // Reset UI initially
        this._updateCoordinationUI();

        return group;
    }

    resetCoordinationCount() {
        this._coordCount = 0;
        const color = 0x555555;
        this._coordAtoms.forEach(atom => {
            atom.userData.counted = false;
            atom.material.color.setHex(color);
        });
        this._coordBonds.forEach(bond => {
            bond.material.color.setHex(color);
            bond.material.opacity = 0.2;
        });
        this._updateCoordinationUI();
    }

    _updateCoordinationUI() {
        const countEl = document.getElementById('coord-count');
        const fillEl = document.getElementById('coord-progress-fill');
        if (countEl) {
            countEl.textContent = this._coordCount;
        }
        if (fillEl) {
            const pct = (this._coordCount / this._coordMax) * 100;
            fillEl.style.width = pct + '%';
            if (this._coordCount === this._coordMax) {
                fillEl.style.background = 'var(--success)';
            } else {
                fillEl.style.background = 'var(--accent-primary)';
            }
        }
    }

    /**
     * Density demo
     */
    createDensityDemo(sm) {
        const group = new THREE.Group();
        const a = 1.2;

        // Show FCC unit cell with dimensions
        const cell = sm.createUnitCell(a, 0x00d4ff, 0.8);
        group.add(cell);

        // Atoms
        const corners = [
            [-a/2,-a/2,-a/2],[a/2,-a/2,-a/2],[-a/2,a/2,-a/2],[-a/2,-a/2,a/2],
            [a/2,a/2,-a/2],[a/2,-a/2,a/2],[-a/2,a/2,a/2],[a/2,a/2,a/2]
        ];
        corners.forEach(pos => group.add(this._quickAtom(new THREE.Vector3(pos[0], pos[1], pos[2]), 0.25, 0x00d4ff)));

        const faces = [[0,0,-a/2],[0,-a/2,0],[-a/2,0,0],[0,0,a/2],[0,a/2,0],[a/2,0,0]];
        faces.forEach(pos => group.add(this._quickAtom(new THREE.Vector3(pos[0], pos[1], pos[2]), 0.25, 0x00d4ff)));

        sm.add('density', group);
        sm.controls.autoRotate = true;
        return group;
    }

    /**
     * Miller indices demo
     */
    createMillerIndicesDemo(sm) {
        this.millerPlanes = new MillerPlaneVisualizer(sm);
        const group = new THREE.Group();
        const a = 2;

        // Base unit cell
        const cell = sm.createUnitCell(a, 0x4488aa, 0.4);
        group.add(cell);

        // Corner atoms for reference
        const corners = [
            [-a/2,-a/2,-a/2],[a/2,-a/2,-a/2],[-a/2,a/2,-a/2],[-a/2,-a/2,a/2],
            [a/2,a/2,-a/2],[a/2,-a/2,a/2],[-a/2,a/2,a/2],[a/2,a/2,a/2]
        ];
        corners.forEach(pos => {
            const atom = this._quickAtom(new THREE.Vector3(pos[0], pos[1], pos[2]), 0.08, 0x4488aa);
            group.add(atom);
        });

        sm.add('miller-base', group);
        sm.camera.position.set(3.5, 2.8, 4.5);
        sm.controls.target.set(0, 0, 0);
        sm.controls.autoRotate = false; // Easier to interact when not rotating

        // Start with default (1 0 0) plane animation
        setTimeout(() => {
            if (this.millerPlanes) {
                this.millerPlanes.animatePlaneCreation(1, 0, 0, a);
            }
        }, 300);

        return group;
    }

    /**
     * Directions demo
     */
    createDirectionsDemo(sm) {
        const group = new THREE.Group();
        const a = 1.5;

        const cell = sm.createUnitCell(a, 0x4488aa, 0.3);
        group.add(cell);

        // [100] direction
        const arrow100 = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(-a/2, 0, 0),
            a, 0x00d4ff, 0.2, 0.1
        );
        group.add(arrow100);

        // [110] direction
        const arrow110 = new THREE.ArrowHelper(
            new THREE.Vector3(1, 1, 0).normalize(),
            new THREE.Vector3(-a/2, -a/2, 0),
            a * Math.SQRT2 / 2, 0x34d399, 0.2, 0.1
        );
        group.add(arrow110);

        // [111] direction
        const arrow111 = new THREE.ArrowHelper(
            new THREE.Vector3(1, 1, 1).normalize(),
            new THREE.Vector3(-a/2, -a/2, -a/2),
            a * Math.sqrt(3) / 2, 0xff6b9d, 0.2, 0.1
        );
        group.add(arrow111);

        sm.add('directions', group);
        sm.controls.autoRotate = true;
        return group;
    }

    /**
     * Defects demo
     */
    createDefectsDemo(sm) {
        const group = new THREE.Group();
        
        // Ensure old animations are cleared
        if (this.defectVisualizer) {
            this.defectVisualizer.clear(sm);
        }

        const spacing = 4.0; // Distance between lattices

        // 1. Vacancy (Left)
        const lattice1 = this.defectVisualizer.createPerfectLattice(sm, 1, 1, 0x00d4ff);
        lattice1.position.x = -spacing;
        group.add(lattice1);
        setTimeout(() => {
            this.defectVisualizer.animateVacancy(sm, lattice1, new THREE.Vector3(0, 0, 0), 0x00d4ff);
        }, 1000);

        // 2. Interstitial (Center)
        const lattice2 = this.defectVisualizer.createPerfectLattice(sm, 1, 1, 0x00d4ff);
        lattice2.position.x = 0;
        group.add(lattice2);
        setTimeout(() => {
            this.defectVisualizer.animateInterstitial(sm, lattice2, new THREE.Vector3(0.5, 0.5, 0.5), 0xff6b9d);
        }, 1500);

        // 3. Frenkel Defect (Right)
        const lattice3 = this.defectVisualizer.createPerfectLattice(sm, 1, 1, 0x00d4ff);
        lattice3.position.x = spacing;
        group.add(lattice3);
        setTimeout(() => {
            this.defectVisualizer.animateFrenkel(sm, lattice3, new THREE.Vector3(0, 0, 0), 1.5);
        }, 2000);

        sm.add('defects', group);
        sm.camera.position.set(0, 3, 10);
        sm.controls.target.set(0, 0, 0);
        sm.controls.autoRotate = true;
        sm.controls.autoRotateSpeed = 1.0;
        return group;
    }

    /**
     * Dislocations demo
     */
    createDislocationsDemo(sm) {
        const group = new THREE.Group();
        const rows = 5;
        const cols = 5;
        const a = 0.6;
        const r = 0.15;

        // Create atomic planes with an extra half-plane (edge dislocation)
        for (let row = 0; row < rows; row++) {
            const offsetX = row < 2 ? 0.3 : 0;
            for (let col = 0; col < cols; col++) {
                const x = (col - cols/2) * a + offsetX;
                const z = (row - rows/2) * a;
                const color = row === 2 ? 0xff4444 : 0x00d4ff;
                const atom = this._quickAtom(new THREE.Vector3(x, 0, z), r, color);
                group.add(atom);
            }
        }

        // Burgers vector indicator
        const arrow = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(-1.5, 0, 0),
            1, 0xff4444, 0.2, 0.1
        );
        group.add(arrow);

        // Label
        sm.add('dislocations', group);
        sm.camera.position.set(0, 3, 4);
        sm.controls.autoRotate = true;
        return group;
    }

    /**
     * Slip systems demo
     */
    createSlipSystemsDemo(sm) {
        const group = new THREE.Group();

        // FCC slip system: {111}<110>
        const fccGroup = new THREE.Group();
        this._addComparisonCell(sm, fccGroup, 'fcc', 0, 0x00d4ff);

        // Add slip plane indication
        const slipPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(1.8, 1.8),
            new THREE.MeshPhysicalMaterial({
                color: 0xff4444, transparent: true, opacity: 0.2, side: THREE.DoubleSide
            })
        );
        const normal = new THREE.Vector3(1, 1, 1).normalize();
        slipPlane.position.set(0.2, 0.2, 0.2);
        slipPlane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        fccGroup.add(slipPlane);

        group.add(fccGroup);

        sm.add('slip', group);
        sm.camera.position.set(2, 2, 4);
        sm.controls.autoRotate = true;
        return group;
    }

    /**
     * XRD demo
     */
    createXRDDemo(sm) {
        const group = new THREE.Group();

        // Crystal (small set of atoms)
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const atom = this._quickAtom(new THREE.Vector3(x * 0.5, y * 0.5, z * 0.5), 0.1, 0x00d4ff);
                    group.add(atom);
                }
            }
        }

        // Incident beam
        const beamMat = new THREE.LineBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.6 });
        const beamGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-3, 0, 0),
            new THREE.Vector3(-1, 0, 0)
        ]);
        const beam = new THREE.Line(beamGeo, beamMat);
        group.add(beam);

        // Diffracted beam
        const diffGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(2, 1.5, 1)
        ]);
        const diff = new THREE.Line(diffGeo, new THREE.LineBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0.6 }));
        group.add(diff);

        sm.add('xrd', group);
        sm.camera.position.set(3, 2, 5);
        sm.controls.autoRotate = true;
        return group;
    }

    /**
     * Reciprocal lattice demo
     */
    createReciprocalDemo(sm) {
        const group = new THREE.Group();

        // Real space lattice (left)
        const realGroup = new THREE.Group();
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const atom = this._quickAtom(new THREE.Vector3(x * 0.6, y * 0.6, z * 0.6), 0.08, 0x00d4ff);
                    realGroup.add(atom);
                }
            }
        }
        realGroup.position.x = -1.5;
        group.add(realGroup);

        // Reciprocal space lattice (right)
        const recipGroup = new THREE.Group();
        const spacing = 2 * Math.PI / 0.6;
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const point = this._quickAtom(
                        new THREE.Vector3(x * spacing * 0.1, y * spacing * 0.1, z * spacing * 0.1),
                        0.06, 0xff6b9d, true
                    );
                    recipGroup.add(point);
                }
            }
        }
        recipGroup.position.x = 1.5;
        group.add(recipGroup);

        sm.add('reciprocal', group);
        sm.camera.position.set(1, 1.5, 4);
        sm.controls.autoRotate = true;
        return group;
    }

    /**
     * Cubic crystal for hero scene
     */
    /**
     * Clear the geometry and material caches to free memory
     * Call this when switching modules or cleaning up scenes
     */
    clearCache() {
        // Dispose cached geometries
        for (const geo of this._geoCache.values()) {
            geo.dispose();
        }
        // Dispose cached base materials
        for (const mat of this._matCache.values()) {
            mat.dispose();
        }
        this._geoCache.clear();
        this._matCache.clear();
    }

    createCubicCrystal(sm, options = {}) {
        const { size = 1.5, color = 0x00d4ff, opacity = 0.8 } = options;
        const group = new THREE.Group();
        const a = size;
        const r = 0.15;

        const corners = [
            [-a/2,-a/2,-a/2],[a/2,-a/2,-a/2],[-a/2,a/2,-a/2],[-a/2,-a/2,a/2],
            [a/2,a/2,-a/2],[a/2,-a/2,a/2],[-a/2,a/2,a/2],[a/2,a/2,a/2]
        ];
        corners.forEach(pos => group.add(this._quickAtom(new THREE.Vector3(pos[0], pos[1], pos[2]), r, color)));

        const cell = sm.createUnitCell(a, color, opacity);
        group.add(cell);

        sm.add('hero-crystal', group);
        return group;
    }
}
