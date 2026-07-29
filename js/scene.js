/* ===== CrystalLens Scene Manager ===== */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Manages the Three.js scene, camera, renderer, lighting, and controls.
 * Provides a clean API for creating visualizations across all modules.
 */
export class SceneManager {
    constructor(canvasId, options = {}) {
        this.canvasId = canvasId;
        this.options = {
            antialias: true,
            alpha: false,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
            backgroundColor: 0x0a0b14,
            ...options
        };

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();

        this.animations = new Map();
        this.objects = new Map();
        this.meshes = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.clickables = [];

        this._init();
    }

    _init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.options.backgroundColor);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            45,
            this._aspect(),
            0.1,
            100
        );
        this.camera.position.set(4, 3, 5);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        const canvas = document.getElementById(this.canvasId);
        if (!canvas) {
            throw new Error(`Canvas #${this.canvasId} not found`);
        }
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: this.options.antialias,
            alpha: this.options.alpha
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(this._width(), this._height());
        this.renderer.toneMapping = this.options.toneMapping;
        this.renderer.toneMappingExposure = this.options.toneMappingExposure;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Controls
        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 20;
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 2.0;
        this.controls.target.set(0, 0, 0);

        // Lighting
        this._setupLighting();

        // Resize handler
        this._resizeHandler = this._onResize.bind(this);
        window.addEventListener('resize', this._resizeHandler);

        // Mouse handler for click events
        canvas.addEventListener('mousemove', this._onMouseMove.bind(this));
        canvas.addEventListener('click', this._onClick.bind(this));

        // Start render loop
        this._running = true;
        this._renderLoop();
    }

    _setupLighting() {
        // Ambient light (base illumination)
        const ambient = new THREE.AmbientLight(0x404060, 0.5);
        this.scene.add(ambient);
        this._ambientLight = ambient;

        // Hemisphere light for natural fill
        const hemi = new THREE.HemisphereLight(
            0x8888ff, // sky color
            0x443322, // ground color
            0.6
        );
        this.scene.add(hemi);
        this._hemiLight = hemi;

        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xffeedd, 2.0);
        mainLight.position.set(5, 10, 7);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        this.scene.add(mainLight);
        this._mainLight = mainLight;

        // Fill light
        const fillLight = new THREE.DirectionalLight(0x4488ff, 0.8);
        fillLight.position.set(-5, 3, -5);
        this.scene.add(fillLight);
        this._fillLight = fillLight;

        // Back rim light
        const rimLight = new THREE.DirectionalLight(0x00ddff, 0.5);
        rimLight.position.set(0, -3, -8);
        this.scene.add(rimLight);
        this._rimLight = rimLight;

        // Point light for accent
        const accentLight = new THREE.PointLight(0x00ddff, 0.3, 10);
        accentLight.position.set(0, 3, 0);
        this.scene.add(accentLight);
        this._accentLight = accentLight;
    }

    _onResize() {
        const w = this._width();
        const h = this._height();
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    _width() {
        const el = document.getElementById(this.canvasId);
        return el ? el.clientWidth : window.innerWidth;
    }

    _height() {
        const el = document.getElementById(this.canvasId);
        return el ? el.clientHeight : window.innerHeight;
    }

    _aspect() {
        return this._width() / this._height() || 1;
    }

    _onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    _onClick(event) {
        if (this.clickables.length === 0) return;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.clickables, true);

        if (intersects.length > 0) {
            const hit = intersects[0];
            let obj = hit.object;
            // Walk up to find clickable parent
            while (obj && !obj.userData.clickable) {
                obj = obj.parent;
            }
            if (obj && obj.userData.onClick) {
                obj.userData.onClick(obj, hit);
            }
        }
    }

    _renderLoop() {
        if (!this._running) return;
        requestAnimationFrame(this._renderLoop.bind(this));

        const delta = this.clock.getDelta();

        // Update animations
        for (const [key, animFn] of this.animations) {
            animFn(delta, this.clock.elapsedTime);
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Add an animation function that runs every frame
     */
    addAnimation(key, fn) {
        this.animations.set(key, fn);
    }

    /**
     * Remove an animation
     */
    removeAnimation(key) {
        this.animations.delete(key);
    }

    /**
     * Add an object to the scene and track it
     */
    add(name, object) {
        if (this.objects.has(name)) {
            this.scene.remove(this.objects.get(name));
        }
        this.objects.set(name, object);
        this.scene.add(object);
        return object;
    }

    /**
     * Get a tracked object
     */
    get(name) {
        return this.objects.get(name);
    }

    /**
     * Remove an object from the scene
     */
    remove(name) {
        const obj = this.objects.get(name);
        if (obj) {
            this.scene.remove(obj);
            this.objects.delete(name);
            this._disposeObject(obj);
        }
    }

    /**
     * Add a clickable mesh
     */
    addClickable(mesh, onClick, hoverColor = null) {
        mesh.userData.clickable = true;
        mesh.userData.onClick = onClick;
        mesh.userData.originalColor = mesh.material.color.clone();
        mesh.userData.hoverColor = hoverColor;
        this.clickables.push(mesh);
        return mesh;
    }

    /**
     * Clear all clickables
     */
    clearClickables() {
        this.clickables = [];
    }

    /**
     * Get intersection with clickables (for hover effects)
     */
    getIntersection() {
        if (this.clickables.length === 0) return null;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.clickables, true);
        return intersects.length > 0 ? intersects[0] : null;
    }

    /**
     * Create a standard atom mesh (sphere)
     */
    createAtom(position, radius = 0.35, color = 0x00d4ff, emissive = false) {
        const geo = new THREE.SphereGeometry(radius, 32, 32);
        const mat = new THREE.MeshPhysicalMaterial({
            color,
            metalness: 0.1,
            roughness: 0.3,
            clearcoat: 0.1,
            clearcoatRoughness: 0.4,
            emissive: emissive ? color : 0x000000,
            emissiveIntensity: emissive ? 0.15 : 0,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(position.x, position.y, position.z);
        mesh.userData.role = 'atom';
        mesh.userData.basePosition = mesh.position.clone();
        mesh.userData.baseScale = mesh.scale.clone();
        mesh.castShadow = true;
        return mesh;
    }

    /**
     * Create a bond (cylinder between two points)
     */
    createBond(p1, p2, radius = 0.04, color = 0x446688) {
        const start = new THREE.Vector3(p1.x, p1.y, p1.z);
        const end = new THREE.Vector3(p2.x, p2.y, p2.z);
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();

        const geo = new THREE.CylinderGeometry(radius, radius, length, 6, 1);
        const mat = new THREE.MeshPhysicalMaterial({
            color,
            metalness: 0.2,
            roughness: 0.5,
            transparent: true,
            opacity: 0.6,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.userData.role = 'bond';

        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mesh.position.copy(mid);

        const up = new THREE.Vector3(0, 1, 0);
        const quat = new THREE.Quaternion().setFromUnitVectors(up, direction.clone().normalize());
        mesh.quaternion.copy(quat);

        return mesh;
    }

    /**
     * Create a unit cell box
     */
    createUnitCell(size = 1, color = 0x446688, opacity = 0.6) {
        const geo = new THREE.BoxGeometry(size, size, size);
        const edges = new THREE.EdgesGeometry(geo);
        const mat = new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity,
            linewidth: 1
        });
        const line = new THREE.LineSegments(edges, mat);
        line.userData.role = 'unit-cell';
        return line;
    }

    /**
     * Create a wireframe unit cell from corners
     */
    createUnitCellWire(corners, color = 0x6699bb, opacity = 0.7) {
        const points = [];
        const edges = [
            [0, 1], [1, 2], [2, 3], [3, 0], // bottom
            [4, 5], [5, 6], [6, 7], [7, 4], // top
            [0, 4], [1, 5], [2, 6], [3, 7]  // verticals
        ];

        for (const [i, j] of edges) {
            points.push(corners[i], corners[j]);
        }

        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity
        });
        const wire = new THREE.LineSegments(geo, mat);
        wire.userData.role = 'unit-cell';
        return wire;
    }

    /**
     * Create axis helper with labels
     */
    createAxes(length = 1.5) {
        const group = new THREE.Group();
        group.userData.role = 'axes';

        // Arrow helpers
        const arrowLength = length;
        const headLength = 0.15;
        const headWidth = 0.08;

        const xAxis = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 0, 0),
            arrowLength, 0xff4444, headLength, headWidth
        );
        const yAxis = new THREE.ArrowHelper(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, 0, 0),
            arrowLength, 0x44ff44, headLength, headWidth
        );
        const zAxis = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, 0),
            arrowLength, 0x4488ff, headLength, headWidth
        );

        group.add(xAxis, yAxis, zAxis);

        // Grid helper
        const grid = new THREE.GridHelper(length * 2, 20, 0x446688, 0x223355);
        grid.position.y = -length;
        group.add(grid);

        return group;
    }

    /**
     * Set camera to a specific view
     */
    setView(view) {
        const views = {
            orbit: { pos: [4, 3, 5], target: [0, 0, 0] },
            top: { pos: [0, 5, 0.001], target: [0, 0, 0] },
            side: { pos: [5, 0, 0], target: [0, 0, 0] },
            front: { pos: [0, 0, 5], target: [0, 0, 0] }
        };

        const v = views[view] || views.orbit;
        this.camera.position.set(v.pos[0], v.pos[1], v.pos[2]);
        this.controls.target.set(v.target[0], v.target[1], v.target[2]);
        this.controls.update();
    }

    /**
     * Reset camera to default
     */
    resetCamera() {
        this.camera.position.set(4, 3, 5);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    /**
     * Set auto-rotation
     */
    setAutoRotate(enabled) {
        this.controls.autoRotate = enabled;
    }

    /**
     * Clear all objects from scene (except lights, helpers)
     */
    clearScene() {
        const keep = ['ambient', 'hemi', 'mainLight', 'fillLight', 'rimLight', 'accentLight'];
        for (const [key, obj] of this.objects) {
            if (!keep.includes(key)) {
                this.scene.remove(obj);
                this._disposeObject(obj);
            }
        }
        this.objects.clear();
        this.clickables = [];
        this.animations.clear();
    }

    /**
     * Dispose of Three.js objects properly
     */
    _disposeObject(obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(m => m.dispose());
            } else {
                obj.material.dispose();
            }
        }
        if (obj.children) {
            obj.children.forEach(c => this._disposeObject(c));
        }
    }

    /**
     * Clean up resources
     */
    dispose() {
        this._running = false;
        window.removeEventListener('resize', this._resizeHandler);
        this.clearScene();
        this.renderer.dispose();
        this.controls.dispose();
    }

    /**
     * Take a screenshot
     */
    screenshot() {
        this.renderer.render(this.scene, this.camera);
        return this.renderer.domElement.toDataURL('image/png');
    }

    /**
     * Create a lattice point helper (small sphere)
     */
    createLatticePoint(position, color = 0x00ddff, radius = 0.06) {
        const geo = new THREE.SphereGeometry(radius, 12, 12);
        const mat = new THREE.MeshBasicMaterial({ color });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(position.x, position.y, position.z);
        mesh.userData.role = 'lattice-point';
        return mesh;
    }

    /**
     * Create a plane representation (semi-transparent)
     */
    createPlane(width, height, position, rotation, color = 0x00ddff, opacity = 0.3) {
        const geo = new THREE.PlaneGeometry(width, height);
        const mat = new THREE.MeshPhysicalMaterial({
            color,
            transparent: true,
            opacity,
            side: THREE.DoubleSide,
            roughness: 0.5,
            metalness: 0.0
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position);
        mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
        mesh.userData.role = 'plane';
        return mesh;
    }
}
