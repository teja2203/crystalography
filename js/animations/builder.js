/* ===== CrystalLens Builder Animation ===== */
import * as THREE from 'three';

/**
 * Layer-by-layer construction animation for crystal structures.
 * Builds up a crystal one layer at a time to teach the stacking sequence.
 */
export class CrystalBuilder {
    constructor(sceneManager) {
        this.sm = sceneManager;
        this.layers = [];
        this.currentLayer = 0;
        this.isPlaying = false;
        this.speed = 1;
        this.onLayerCallback = null;
    }

    /**
     * Build FCC layer by layer
     */
    buildFCC(callback) {
        this.clear();
        const layerData = this._generateFCCLayers();
        this._setupLayers(layerData, callback);
        return this;
    }

    /**
     * Build BCC layer by layer
     */
    buildBCC(callback) {
        this.clear();
        const layerData = this._generateBCCLayers();
        this._setupLayers(layerData, callback);
        return this;
    }

    /**
     * Build HCP layer by layer  
     */
    buildHCP(callback) {
        this.clear();
        const layerData = this._generateHCPLayers();
        this._setupLayers(layerData, callback);
        return this;
    }

    _generateFCCLayers() {
        const layers = [];
        const size = 2;
        const step = 1;

        // Layer A (bottom) - atoms at corners and face centers of bottom layer
        const layerA = [];
        for (let x = -size; x <= size; x += step) {
            for (let z = -size; z <= size; z += step) {
                layerA.push({ x, y: -size, z });
            }
        }
        layers.push({ atoms: layerA, label: 'Layer A (Bottom)' });

        // Layer B - intermediate layer offset
        const layerB = [];
        for (let x = -size + 0.5; x <= size; x += step) {
            for (let z = -size + 0.5; z <= size; z += step) {
                layerB.push({ x, y: -size + 0.5, z });
            }
        }
        layers.push({ atoms: layerB, label: 'Layer B (Middle-1)' });

        // Layer C - another offset layer
        const layerC = [];
        for (let x = -size; x <= size; x += step) {
            for (let z = -size; z <= size; z += step) {
                layerC.push({ x, y: size - 0.5, z });
            }
        }
        layers.push({ atoms: layerC, label: 'Layer C (Middle-2)' });

        // Layer D (top)
        const layerD = [];
        for (let x = -size + 0.5; x <= size; x += step) {
            for (let z = -size + 0.5; z <= size; z += step) {
                layerD.push({ x, y: size, z });
            }
        }
        layers.push({ atoms: layerD, label: 'Layer D (Top)' });

        return layers;
    }

    _generateBCCLayers() {
        const layers = [];
        const size = 2;

        // Bottom layer - corners
        const bottom = [];
        for (let x = -size; x <= size; x += 2) {
            for (let z = -size; z <= size; z += 2) {
                bottom.push({ x, y: -size, z });
            }
        }
        layers.push({ atoms: bottom, label: 'Bottom Corners' });

        // Middle layer - body centers + some corners
        const middle = [];
        middle.push({ x: 0, y: 0, z: 0 });
        for (let x = -size; x <= size; x += 2) {
            for (let z = -size; z <= size; z += 2) {
                if (x !== 0 || z !== 0) {
                    middle.push({ x, y: 0, z });
                }
            }
        }
        layers.push({ atoms: middle, label: 'Middle (Body Centers)' });

        // Top layer - corners
        const top = [];
        for (let x = -size; x <= size; x += 2) {
            for (let z = -size; z <= size; z += 2) {
                top.push({ x, y: size, z });
            }
        }
        layers.push({ atoms: top, label: 'Top Corners' });

        return layers;
    }

    _generateHCPLayers() {
        const layers = [];
        const size = 2;
        const a = 1;

        // Layer A - hexagonal arrangement
        const layerA = [];
        for (let i = -size; i <= size; i++) {
            for (let j = -size; j <= size; j++) {
                const x = i * a + (j % 2) * a / 2;
                const z = j * a * Math.sqrt(3) / 2;
                if (Math.abs(x) <= size * 1.5 && Math.abs(z) <= size * 1.5) {
                    layerA.push({ x, y: -size / 2, z });
                }
            }
        }
        layers.push({ atoms: layerA, label: 'Layer A (Bottom)' });

        // Layer B - offset half
        const layerB = [];
        for (let i = -size; i <= size; i++) {
            for (let j = -size; j <= size; j++) {
                const x = i * a + (j % 2) * a / 2 + a / 2;
                const z = j * a * Math.sqrt(3) / 2 + a * Math.sqrt(3) / 6;
                if (Math.abs(x) <= size * 1.5 && Math.abs(z) <= size * 1.5) {
                    layerB.push({ x, y: size / 2, z });
                }
            }
        }
        layers.push({ atoms: layerB, label: 'Layer B (Top)' });

        return layers;
    }

    _setupLayers(layerData, callback) {
        this.layers = layerData.map((layer, i) => {
            const group = new THREE.Group();
            const opacity = i === 0 ? 1.0 : 0.0;

            layer.atoms.forEach(pos => {
                const atom = this.sm.createAtom(
                    new THREE.Vector3(pos.x, pos.y, pos.z),
                    0.3,
                    0x00d4ff,
                    false
                );
                atom.material.transparent = true;
                atom.material.opacity = 0;
                group.add(atom);
            });

            this.sm.scene.add(group);
            return { group, atoms: layer.atoms, label: layer.label, targetOpacity: 1.0 };
        });

        this.onLayerCallback = callback;
        this.currentLayer = 0;
        this._showLayer(0);
    }

    _showLayer(index) {
        if (index >= this.layers.length) {
            if (this.onLayerCallback) this.onLayerCallback('complete');
            return;
        }

        const layer = this.layers[index];
        const duration = 500 / this.speed;

        // Animate atoms appearing
        let delay = 0;
        layer.group.children.forEach((child, i) => {
            setTimeout(() => {
                child.material.opacity = 1;
                child.scale.set(0, 0, 0);
                const targetScale = { x: 1, y: 1, z: 1 };
                const startTime = performance.now();
                
                const animate = (now) => {
                    const t = Math.min((now - startTime) / 300, 1);
                    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                    child.scale.set(eased, eased, eased);
                    if (t < 1) requestAnimationFrame(animate);
                };
                requestAnimationFrame(animate);
            }, delay);
            delay += 30 / this.speed;
        });

        if (this.onLayerCallback) {
            setTimeout(() => {
                this.onLayerCallback('layer', index, layer.label);
            }, delay + 400);
        }
    }

    nextLayer() {
        if (this.currentLayer < this.layers.length - 1) {
            this.currentLayer++;
            this._showLayer(this.currentLayer);
        } else {
            this.complete();
        }
    }

    play() {
        this.isPlaying = true;
        this.nextLayer();
    }

    pause() {
        this.isPlaying = false;
    }

    reset() {
        this.layers.forEach((layer, i) => {
            layer.group.children.forEach(child => {
                child.material.opacity = 0;
                child.scale.set(0, 0, 0);
            });
        });
        this.currentLayer = 0;
        this._showLayer(0);
    }

    complete() {
        this.isPlaying = false;
        // Show all layers fully
        this.layers.forEach(layer => {
            layer.group.children.forEach(child => {
                child.material.opacity = 1;
                child.scale.set(1, 1, 1);
            });
        });
        if (this.onLayerCallback) this.onLayerCallback('complete');
    }

    clear() {
        this.layers.forEach(layer => {
            this.sm.scene.remove(layer.group);
            layer.group.children.forEach(c => {
                if (c.geometry) c.geometry.dispose();
                if (c.material) c.material.dispose();
            });
        });
        this.layers = [];
        this.currentLayer = 0;
    }

    setSpeed(speed) {
        this.speed = speed;
    }
}
