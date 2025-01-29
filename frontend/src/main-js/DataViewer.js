import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import _ from 'lodash';
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
    const cameraRef = useRef(null); // Store the camera reference
  
    useEffect(() => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      cameraRef.current = camera; // Set the camera reference
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: false // Disable antialiasing for better performance
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(1); // Force 1:1 pixel ratio for better performance
  
      const controls = new OrbitControls(camera, renderer.domElement);
      camera.position.z = 5;
  
      sceneRef.current = scene;
  
      const clouds = pointCloudData.map((data, index) => {
        const positionsArray = new Float32Array(data.points.length * 3);
        const colors = new Float32Array(data.points.length * 3);
        let minZ = Infinity, maxZ = -Infinity;
  
        data.points.forEach((point, i) => {
          const baseIndex = i * 3;
          positionsArray[baseIndex] = point.x;
          positionsArray[baseIndex + 1] = point.y;
          positionsArray[baseIndex + 2] = point.z;
  
          minZ = Math.min(minZ, point.z);
          maxZ = Math.max(maxZ, point.z);
        });
  
        zRangeRef.current[index] = { minZ, maxZ };
  
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
  
      let frameId;
      const animate = () => {
        frameId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();
  
      const handleResize = _.debounce(() => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      }, 250);
  
      window.addEventListener('resize', handleResize);
  
      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(frameId);
      };
    }, [pointCloudData]);
  
    const handleCenterObject = () => {
        if (pointCloudsRef.current.length === 0) return;
    
        // Create a bounding box encompassing all point clouds
        const boundingBox = new THREE.Box3().setFromObject(pointCloudsRef.current[0]);
        pointCloudsRef.current.forEach(pointCloud => {
            boundingBox.expandByObject(pointCloud);
        });
    
        // Get center and size of the bounding box
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
        
        // Calculate distance dynamically
        const distance = maxDimension * 2; // Adjust factor for better framing
        const direction = new THREE.Vector3(0, 0, 1); // Default forward direction
        const cameraPosition = center.clone().addScaledVector(direction, distance);
    
        
    
        // Update camera projection
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
    };
    
      
  
    const handlePointSizeChange = useCallback((e) => {
      setPointSize(parseFloat(e.target.value));
    }, []);
  
    const toggleColorByAltitude = useCallback(() => {
      setColorByAltitude(prev => !prev);
    }, []);
  
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
                max="0.1"
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

