/* ===== CrystalLens XRD Visualizer ===== */
import * as THREE from 'three';

/**
 * X-ray diffraction visualization with beam, crystal, and detector.
 */
export class XRDVisualizer {
    constructor(sceneManager) {
        this.sm = sceneManager;
        this.group = new THREE.Group();
        this.beamAngle = 0;
    }

    /**
     * Build the complete XRD setup
     */
    build(a = 2) {
        this.clear();

        // Crystal (small cluster of atoms)
        const crystalGroup = new THREE.Group();
        const r = 0.12;
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const atom = this.sm.createAtom(
                        new THREE.Vector3(x * 0.4, y * 0.4, z * 0.4),
                        r, 0x00d4ff
                    );
                    crystalGroup.add(atom);
                }
            }
        }
        crystalGroup.position.set(0, 0, 0);
        this.group.add(crystalGroup);

        // Crystal planes (horizontal lines)
        const planeMat = new THREE.LineBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.3
        });
        for (let i = -1; i <= 1; i++) {
            const points = [
                new THREE.Vector3(-0.8, i * 0.4, 0),
                new THREE.Vector3(0.8, i * 0.4, 0)
            ];
            const geo = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geo, planeMat);
            this.group.add(line);
        }

        // Incident beam
        const beamMat = new THREE.LineBasicMaterial({
            color: 0xffdd44,
            transparent: true,
            opacity: 0.7
        });
        const beamStart = new THREE.Vector3(-3, -0.2, 0);
        const beamEnd = new THREE.Vector3(0, 0, 0);
        const beamGeo = new THREE.BufferGeometry().setFromPoints([beamStart, beamEnd]);
        this.incidentBeam = new THREE.Line(beamGeo, beamMat);
        this.group.add(this.incidentBeam);

        // Beam arrow head
        const beamArrow = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0.1, 0).normalize(),
            beamStart, 0.3, 0xffdd44, 0.15, 0.08
        );
        this.group.add(beamArrow);

        // Diffracted beam
        const diffMat = new THREE.LineBasicMaterial({
            color: 0x44ff44,
            transparent: true,
            opacity: 0.7
        });
        this.diffEnd = new THREE.Vector3(2, 1.2, 0);
        const diffGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            this.diffEnd
        ]);
        this.diffractedBeam = new THREE.Line(diffGeo, diffMat);
        this.group.add(this.diffractedBeam);

        // Diffracted beam arrow
        const diffArrow = new THREE.ArrowHelper(
            new THREE.Vector3(0.8, 0.6, 0).normalize(),
            this.diffEnd, 0.3, 0x44ff44, 0.15, 0.08
        );
        this.group.add(diffArrow);

        // Detector
        const detectorMat = new THREE.MeshPhysicalMaterial({
            color: 0x446688,
            roughness: 0.7,
            metalness: 0.3
        });
        const detector = new THREE.Mesh(
            new THREE.BoxGeometry(0.03, 0.6, 0.4),
            detectorMat
        );
        detector.position.set(2.2, 0, 0);
        this.group.add(detector);

        // Angle indicator arc
        const arcPoints = [];
        const arcRadius = 0.8;
        for (let i = 0; i <= 20; i++) {
            const angle = (i / 20) * this.beamAngle;
            arcPoints.push(new THREE.Vector3(
                arcRadius * Math.cos(angle - Math.PI/4),
                arcRadius * Math.sin(angle - Math.PI/4) + 0.5,
                0
            ));
        }
        const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
        const arcMat = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3
        });
        this.angleArc = new THREE.Line(arcGeo, arcMat);
        this.group.add(this.angleArc);

        this.sm.scene.add(this.group);
        return this.group;
    }

    /**
     * Rotate the incident beam angle
     */
    setAngle(degrees) {
        const theta = degrees * Math.PI / 180;
        this.beamAngle = theta;

        if (this.incidentBeam) {
            const endX = -3 * Math.cos(theta);
            const endY = -3 * Math.sin(theta);
            const positions = this.incidentBeam.geometry.attributes.position;
            positions.setXYZ(0, -3, 0.5, 0);
            positions.setXYZ(1, endX, endY, 0);
            positions.needsUpdate = true;
        }

        if (this.diffractedBeam) {
            const dTheta = theta * 2;
            const positions = this.diffractedBeam.geometry.attributes.position;
            positions.setXYZ(0, 0, 0, 0);
            positions.setXYZ(1, 3 * Math.cos(dTheta), 3 * Math.sin(dTheta), 0);
            positions.needsUpdate = true;
        }

        // Update angle arc
        if (this.angleArc) {
            const arcPoints = [];
            const arcR = 0.8;
            for (let i = 0; i <= 20; i++) {
                const a = (i / 20) * theta;
                arcPoints.push(new THREE.Vector3(
                    arcR * Math.cos(a - theta/2),
                    arcR * Math.sin(a - theta/2) + 0.3,
                    0
                ));
            }
            const newGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
            this.angleArc.geometry.dispose();
            this.angleArc.geometry = newGeo;
        }
    }

    /**
     * Animate the beam sweeping through angles
     */
    animateSweep() {
        let angle = 10;
        const sweep = () => {
            this.setAngle(angle);
            angle += 0.5;
            if (angle < 80) {
                requestAnimationFrame(sweep);
            }
        };
        sweep();
    }

    clear() {
        this.sm.scene.remove(this.group);
        this.group.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
        this.group = new THREE.Group();
    }
}
