import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import _ from 'lodash';
import gsap from "gsap";
import "../main-css/DataViewer.css";

/**
 * DataViewer Component
 * Renders 3D point cloud data and provides user interaction features.
 * 
 * Functionalities:
 * - Displays point cloud data in 3D using Three.js.
 * - Supports mouse/touch controls for pan, zoom, and rotate.
 * - Allows point size adjustment and colorization based on altitude (Z value).
 */
const DataViewer = ({ pointCloudData }) => {
    const canvasRef = useRef(null);
    const [pointSize, setPointSize] = useState(0.05);
    const [colorByAltitude, setColorByAltitude] = useState(false);
    const sceneRef = useRef(null);
    const pointCloudsRef = useRef([]);
    const zRangeRef = useRef([]);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
  
    // Scene initialization - only runs once
    useEffect(() => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      cameraRef.current = camera;
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: false // Disable antialiasing for better performance
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(1); // Force 1:1 pixel ratio for better performance
  
      const controls = new OrbitControls(camera, renderer.domElement);
      controlsRef.current = controls; 
      camera.position.z = 5;
  
      sceneRef.current = scene;
  
      // Process and store point cloud data
      const clouds = pointCloudData.map((data, index) => {
        const positionsArray = new Float32Array(data.points.length * 3);
        const colors = new Float32Array(data.points.length * 3);
        let minZ = Infinity, maxZ = -Infinity;
  
        // Process positions and find Z range in a single pass
        data.points.forEach((point, i) => {
          const baseIndex = i * 3;
          positionsArray[baseIndex] = point.x;
          positionsArray[baseIndex + 1] = point.y;
          positionsArray[baseIndex + 2] = point.z;
  
          minZ = Math.min(minZ, point.z);
          maxZ = Math.max(maxZ, point.z);
        });
  
        // Store Z range for later use
        zRangeRef.current[index] = { minZ, maxZ };
  
        // Set initial white colors
        colors.fill(1);
  
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionsArray, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  
        const material = new THREE.PointsMaterial({
          size: pointSize,
          vertexColors: true,
          sizeAttenuation: true
        });
  
        const pointCloud = new THREE.Points(geometry, material);
        scene.add(pointCloud);
        return pointCloud;
      });
  
      pointCloudsRef.current = clouds;
  
      // Optimized animation loop
      const animate = () => {
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      };
      animate();
  
      // Debounced resize handler
      const handleResize = _.debounce(() => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      }, 250);
  
      window.addEventListener('resize', handleResize);
  
      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animate); // Clean up animation frame
      };
    }, [pointCloudData]);
  
    // Optimized color update
    useEffect(() => {
      if (!pointCloudsRef.current || !zRangeRef.current) return;
  
      pointCloudsRef.current.forEach((pointCloud, cloudIndex) => {
        // Only update material size if it changed
        if (pointCloud.material.size !== pointSize) {
          pointCloud.material.size = pointSize;
          pointCloud.material.needsUpdate = true;
        }
  
        // Only update colors if colorByAltitude changed
        if (colorByAltitude || pointCloud.geometry.attributes.color.array[0] !== 1) {
          const positions = pointCloud.geometry.attributes.position.array;
          const colors = pointCloud.geometry.attributes.color.array;
          const { minZ, maxZ } = zRangeRef.current[cloudIndex];
          const zRange = maxZ - minZ;
  
          // Batch process colors
          const colorScale = new THREE.Color();
          for (let i = 0; i < positions.length; i += 3) {
            const z = positions[i + 2];
            const normalizedZ = zRange ? (z - minZ) / zRange : 0;
  
            if (colorByAltitude) {
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
        }
      });
    }, [pointSize, colorByAltitude]);
  
    const handlePointSizeChange = useCallback((e) => {
      setPointSize(parseFloat(e.target.value));
    }, []);
  
    const toggleColorByAltitude = useCallback(() => {
      setColorByAltitude(prev => !prev);
    }, []);

    const handleCenterObject = () => {
        if (!pointCloudsRef.current || pointCloudsRef.current.length === 0) {
            console.warn('No point clouds available to center');
            return;
        }
    
        const boundingBox = new THREE.Box3();
        
        // Initialize and expand bounding box
        pointCloudsRef.current.forEach(pointCloud => {
            if (pointCloud) {
                boundingBox.expandByObject(pointCloud);
            }
        });
    
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        boundingBox.getCenter(center);
        boundingBox.getSize(size);
    
        // Calculate camera distance based on object size
        const maxDimension = Math.max(size.x, size.y, size.z);
        const distance = maxDimension * 2;
        
        // Adjust center point to account for half-size viewer
        // Move the center point left by applying an offset
        const offsetX = +maxDimension * 2; // Adjust this multiplier as needed
        
        // Calculate new camera position with offset
        const cameraPosition = new THREE.Vector3(
            center.x + offsetX,
            center.y + (size.y / 4),
            center.z + distance
        );
    
        // Update the controls target with the same offset
        gsap.to(controlsRef.current.target, {
            x: center.x + offsetX,
            y: center.y,
            z: center.z,
            duration: 1.5,
            ease: "power2.inOut"
        });
    
        // Move the camera
        gsap.to(cameraRef.current.position, {
            x: cameraPosition.x,
            y: cameraPosition.y,
            z: cameraPosition.z,
            duration: 1.5,
            ease: "power2.inOut",
            onUpdate: () => {
                controlsRef.current.update();
            }
        });
    }
    
    
  
    return (
      <div className="app-container">
        <div className="data-viewer-container">
          <div className="control-panel">
            <button onClick={toggleColorByAltitude}>
              {colorByAltitude ? 'Disable Color' : 'Enable Color'}
            </button>
            <label>
              Point Size:
              <input
                type="range"
                min="0.01"
                max="0.3"
                step="0.01"
                value={pointSize}
                onChange={handlePointSizeChange}
              />
            </label>
            <button onClick={handleCenterObject}>
                Center Object
            </button>
          </div>
          <div className="viewer-content">
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>
    );
  };
  
  
export default DataViewer;

