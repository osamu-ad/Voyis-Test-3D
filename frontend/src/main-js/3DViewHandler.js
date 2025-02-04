import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";
import _ from "lodash";

/**
 * ThreeDViewHandler Class
 * Handles rendering and interaction for a 3D point cloud visualization using Three.js.
 * 
 * Functionalities:
 * - Initializes a Three.js scene, camera, renderer, and controls.
 * - Loads point cloud data and renders it as a set of points.
 * - Supports dynamic resizing and interactive camera controls.
 * - Allows toggling color by altitude and adjusting point sizes.
 * - Centers the object in the viewport smoothly using GSAP animations.
 */
export default class ThreeDViewHandler {
    
    constructor(canvas, pointCloudData) {
        this.canvas = canvas;
        this.pointCloudData = pointCloudData;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.pointClouds = [];
        this.zRange = [];
        this.init();
    }

    /**
     * Initializes the Three.js scene, camera, renderer, and controls.
     * Also sets up event listeners for window resizing.
     */
    init() {
        if (!this.canvas) return;

        // Create Scene
        this.scene = new THREE.Scene();

        // Create Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;

        // Create Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(1);

        // Create Orbit Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        // Load Point Cloud Data
        this.loadPointClouds();

        // Start Animation Loop
        this.animate();

        // Handle Resize
        this.handleResize = _.debounce(() => this.onResize(), 250);
        window.addEventListener("resize", this.handleResize);
    };

    loadPointClouds() {
        if (!this.pointCloudData) return;

        this.pointClouds = this.pointCloudData.map((data, index) => {
            const positions = new Float32Array(data.points.length * 3);
            const colors = new Float32Array(data.points.length * 3);
            let minZ = Infinity, maxZ = -Infinity;

            // Process each point and extract position data
            data.points.forEach((point, i) => {
                const baseIndex = i * 3;
                positions[baseIndex] = point.x;
                positions[baseIndex + 1] = point.y;
                positions[baseIndex + 2] = point.z;
                minZ = Math.min(minZ, point.z);
                maxZ = Math.max(maxZ, point.z);
            });

            this.zRange[index] = { minZ, maxZ };
            colors.fill(1);

            // Create a buffer geometry and assign position & color attributes
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
            geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

            // Create a material for the point cloud
            const material = new THREE.PointsMaterial({ size: 0.05, vertexColors: true, sizeAttenuation: true });
            const pointCloud = new THREE.Points(geometry, material);
            this.scene.add(pointCloud);

            return pointCloud;
        });
    };

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    };

    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    };

    updatePointSize(size) {
        this.pointClouds.forEach(pointCloud => {
            if (pointCloud.material.size !== size) {
                pointCloud.material.size = size;
                pointCloud.material.needsUpdate = true;
            }
        });
    };

    toggleColorByAltitude(enable) {
        this.pointClouds.forEach((pointCloud, index) => {
            const positions = pointCloud.geometry.attributes.position.array;
            const colors = pointCloud.geometry.attributes.color.array;
            const { minZ, maxZ } = this.zRange[index];
            const zRange = maxZ - minZ;
            const colorScale = new THREE.Color();

            for (let i = 0; i < positions.length; i += 3) {
                const z = positions[i + 2];
                const normalizedZ = zRange ? (z - minZ) / zRange : 0;
                if (enable) {
                    colorScale.setHSL(0.66 - normalizedZ * 0.66, 1.0, 0.5);
                    colors[i] = colorScale.r;
                    colors[i + 1] = colorScale.g;
                    colors[i + 2] = colorScale.b;
                } else {
                    colors[i] = 1;
                    colors[i + 1] = 1;
                    colors[i + 2] = 1;
                }
            }
            pointCloud.geometry.attributes.color.needsUpdate = true;
        });
    };

    centerObject() {
        console.trace("po");
        if (!this.pointClouds.length) {
            console.log("No point clouds found");  // Log this case
            return;
        }
        console.log("op");
        // Compute bounding box of all point clouds
        const boundingBox = new THREE.Box3().setFromObject(this.pointClouds[0]);
        this.pointClouds.forEach(pc => boundingBox.expandByObject(pc));
    
        // Get the center and size of the bounding box
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
    
        // Debugging log
        console.log('Center:', center);
        console.log('Bounding Box Size:', size);
        console.log('Max Dimension:', maxDimension);
    
        // Camera positioning logic
        const distance = maxDimension * 2;
        const cameraPosition = new THREE.Vector3(center.x, center.y, center.z + distance);
    
        // Dynamic offset based on size or other logic
        const offsetX = maxDimension * 1.5;  // Try smaller dynamic offset for closer zoom
    
        // Debugging the camera position
        console.log('Camera Position:', cameraPosition);
        console.log('Controls Target:', this.controls.target);
    
        // Animate controls target and camera position with GSAP
        gsap.to(this.controls.target, {
            x: center.x + offsetX,
            y: center.y,
            z: center.z,
            duration: 1.5,
            ease: "power2.inOut"
        });
    
        gsap.to(this.camera.position, {
            x: cameraPosition.x,
            y: cameraPosition.y,
            z: cameraPosition.z,
            duration: 1.5,
            ease: "power2.inOut",
            onUpdate: () => this.controls.update()  // Update controls during animation
        });
    }
    
    // Cleanup method for switching between views
    dispose() {
        // Remove all objects from the scene
        this.scene.children.forEach(child => {
            if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
                child.geometry.dispose();
                child.material.dispose();
            }
            this.scene.remove(child);
        });

        // Dispose of the renderer
        this.renderer.dispose();

        // Dispose of controls
        if (this.controls) {
            this.controls.dispose();
        }

        // Remove event listeners
        window.removeEventListener("resize", this.handleResize);
    }
}
