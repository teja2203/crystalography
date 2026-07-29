/* ===== CrystalLens Crystal Directions Visualizer ===== */
import * as THREE from 'three';

/**
 * Visualizes crystal direction indices [uvw] with 3D arrows
 */
export class DirectionVisualizer {
    constructor(sceneManager) {
        this.sm = sceneManager;
        this.arrows = [];
    }

    /**
     * Create direction arrow
     */
    createDirection(u, v, w, a = 2, color = 0x00d4ff) {
        const direction = new THREE.Vector3(u, v, w);
        const length = direction.length() * a / 2;
        if (length === 0) return null;

        direction.normalize();

        const origin = new THREE.Vector3(0, 0, 0);
        const arrow = new THREE.ArrowHelper(
            direction,
            origin,
            Math.max(length, 0.5),
            color,
            0.2,
            0.1
        );

        // Add label sphere at tip
        const tip = direction.clone().multiplyScalar(Math.max(length, 0.5));
        const label = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 8, 8),
            new THREE.MeshBasicMaterial({ color })
        );
        label.position.copy(tip);
        arrow.add(label);

        this.arrows.push(arrow);
        return arrow;
    }

    /**
     * Generate standard directions
     */
    generateStandard() {
        const dirs = [
            { u: 1, v: 0, w: 0, label: '[100]', color: 0x00d4ff },
            { u: 0, v: 1, w: 0, label: '[010]', color: 0x34d399 },
            { u: 0, v: 0, w: 1, label: '[001]', color: 0xffb84d },
            { u: 1, v: 1, w: 0, label: '[110]', color: 0xff6b9d },
            { u: 1, v: 1, w: 1, label: '[111]', color: 0xa78bfa },
            { u: 2, v: 1, w: 0, label: '[210]', color: 0xf59e0b },
            { u: 1, v: 1, w: -1, label: '[111]', color: 0xec4899 },
        ];

        const group = new THREE.Group();
        dirs.forEach(d => {
            const arrow = this.createDirection(d.u, d.v, d.w, 2, d.color);
            if (arrow) group.add(arrow);
        });

        return group;
    }

    /**
     * Create unit cell for direction reference
     */
    createReferenceCell(a = 2) {
        const cell = this.sm.createUnitCell(a, 0x446688, 0.3);
        return cell;
    }

    /**
     * Clear all directions
     */
    clear() {
        this.arrows.forEach(arrow => {
            if (arrow.parent) arrow.parent.remove(arrow);
            arrow.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        });
        this.arrows = [];
    }
}
