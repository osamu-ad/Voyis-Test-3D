import React, { useState } from "react";
import "../main-css/DataInput.css";
import * as THREE from 'three';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';
import geojsonValidation from "geojson-validation";


/**
 * DataInput Component
 * Handles file uploads and displays metadata for the uploaded files.
 * 
 * Functionalities:
 * - Allows multiple file uploads.
 * - Accepts specific file types (.xyz, .pcd, .geojson).
 * - Displays details of uploaded files such as filename, size, and type.
 * - Returns Point Cloud Data for Data Viewer to Display
 */
const MAX_FILE_SIZE = 450 * 1024 * 1024; // 450 MB

const DataInput = ({ setPointCloudData }) => {
  // State to store uploaded files
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileMetadata, setFileMetadata] = useState({});
  const [loading, setLoading] = useState(false);
  
  //Parse Point Cloud Data
  const parsePointCloudFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        
        // Basic parsing for .xyz files
        if (file.name.endsWith('.xyz')) {
          const points = content.trim().split('\n').map(line => {
            const [x, y, z] = line.split(/\s+/).map(parseFloat);
            return new THREE.Vector3(x, y, z);
          });

          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          geometry.computeBoundingBox();
          
          resolve({
            points: points,
            pointCount: points.length,
            boundingBox: geometry.boundingBox
          });
        }
        // Basic parsing for .pcd files would require more complex parsing
        else if (file.name.endsWith('.pcd')) {
          // Handle .pcd files using three-pcd-loader
          const url = URL.createObjectURL(file); // Create a temporary URL for the file
          const loader = new PCDLoader();
    
          loader.load(
            url,
            (points) => {
              const geometry = points.geometry;
              geometry.computeBoundingBox();
    
              // Ensure the structure matches the expected format for pointCloudData
              const positions = geometry.attributes.position.array;
              const pointData = [];

              for (let i = 0; i < positions.length; i += 3) {
                pointData.push({
                  x: positions[i],
                  y: positions[i + 1],
                  z: positions[i + 2]
                });
              }

              resolve({
                points: pointData, // Reformat the points into the same structure as .xyz files
                pointCount: geometry.attributes.position.count,
                boundingBox: geometry.boundingBox
              });
    
              URL.revokeObjectURL(url); // Clean up the temporary URL
            },
            undefined,
            (error) => {
              reject(new Error(`Failed to parse PCD file: ${error.message}`));
            }
          );
        } else {
          resolve(null);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  //#region File Validation Checks
  //Validate GeoJSON
  const parseGeoJSON = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const geoJSON = JSON.parse(content);
  
          if (!geojsonValidation.valid(geoJSON)) {
            throw new Error("Invalid GeoJSON format");
          }
  
          resolve(true);
        } catch (error) {
          console.error("GeoJSON validation error:", error);
          alert(`Invalid GeoJSON file (${file.name}): ${error.message}`);
          resolve(false);
        }
      };
  
      reader.onerror = () => {
        alert(`Error reading file: ${file.name}`);
        resolve(false);
      };
  
      reader.readAsText(file);
    });
  };

  //Validate XYZ
  const validateXYZFile = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
  
      reader.onload = (event) => {
        const lines = event.target.result.split("\n").filter(line => line.trim());
  
        if (lines.length < 3) return resolve(false); // Must have some points
  
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
            return resolve(false);
          }
        }
        resolve(true);
      };
  
      reader.readAsText(file);
    });
  };

  //Validate PCD
  const validatePCDFile = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
  
      reader.onload = (event) => {
        const loader = new PCDLoader();
        try {
          loader.parse(event.target.result); // Throws error if invalid
          resolve(true);
        } catch (error) {
          console.error("Invalid PCD file:", error);
          alert(`Invalid PCD file: ${file.name}`);
          resolve(false);
        }
      };
  
      reader.readAsArrayBuffer(file);
    });
  };
  //#endregion
  
  //Handle file upload and parse details
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    setLoading(true);
    // Check for duplicates first
    const duplicateFiles = files.filter(file => 
      uploadedFiles.some(existingFile => existingFile.name === file.name)
    );

    if (duplicateFiles.length > 0) alert(`These files have already been uploaded: ${duplicateFiles.map(f => f.name).join(', ')}`);

    const newPointCloudData = [];
    const fileDetails = await Promise.all(files.map(async (file) => {
      const fileInfo = {
        name: file.name,
        size: (file.size / 1024).toFixed(2) + " KB", 
        type: file.name.split(".").pop(), 
      };
      
      try {
        //#region Basic Checks
        if (file.size === 0) {
          alert(`File is empty: ${fileInfo.name}.`);
          return false;
        }

        if (file.size > MAX_FILE_SIZE) {
          alert(`${file.name} exceeds the ${MAX_FILE_SIZE/1024/1024} MB size limit.`);
          return false;
        }

        // Handle Valid File Checks
        if (fileInfo.type === 'geojson') {
          const isValid = await parseGeoJSON(file);
          if (!isValid) return false;  
        }

        if (fileInfo.type === 'pcd') {
          const isValid = await validatePCDFile(file);
          if (!isValid) return false;  
        }

        if (fileInfo.type === 'xyz') {
          const isValid = await validateXYZFile(file);
          if (!isValid) {
            alert(`Invalid XYZ file: ${file.name}`);
            return false;
          } 
        }
        //#endregion

        // Parse point cloud files and store metadata
        if (fileInfo.type === 'xyz' || fileInfo.type === 'pcd') {
          const metadata = await parsePointCloudFile(file);
          if (metadata) {
            setFileMetadata(prev => ({
              ...prev,
              [file.name]: metadata
            }));
            console.log(metadata);
            newPointCloudData.push(metadata);
          }
        }    
      } catch (error) {
        console.error("Error parsing point cloud file:", error);
      }
      return fileInfo;
    }));
    
    setUploadedFiles(fileDetails);
    setPointCloudData(newPointCloudData);
    setLoading(false);
  };

  //Renders metadata for individual file
  const renderFileDetails = (file) => {
    if (!file) {
      console.error('Attempted to render details for undefined file');
      return null;
    }
    const metadata = fileMetadata?.[file.name];
    
    return (
      <div key={file.name} className="file-details p-2 border rounded mb-2">
        <p><strong>Filename:</strong> {file.name}</p>
        <p><strong>File size:</strong> {file.size}</p>
        <p><strong>Type:</strong> {file.type}</p>
        
        {/* Conditionally render point cloud metadata */}
        {(file.type === 'xyz' || file.type === 'pcd') && metadata && (
          <>
            <p><strong>Point Count:</strong> {metadata.pointCount}</p>
            <p><strong>Bounding Box:</strong>
                Min: ({metadata.boundingBox.min.x.toFixed(2)}, 
                {metadata.boundingBox.min.y.toFixed(2)}, 
                {metadata.boundingBox.min.z.toFixed(2)})
                Max: ({metadata.boundingBox.max.x.toFixed(2)}, 
                {metadata.boundingBox.max.y.toFixed(2)}, 
                {metadata.boundingBox.max.z.toFixed(2)})
            </p>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="data-input p-4">
      <div className="upload-section">
        <label className="custom-upload-button">
          Upload Files
          <input
            type="file"
            accept=".xyz,.pcd,.geojson"
            multiple
            onChange={handleFileUpload}
            className="hidden-file-input"
          />
        </label>
        <p>Files Must Be Under {MAX_FILE_SIZE/1024/1024} MB & .xyz, .pcd, or .geojson!</p>
      </div>
      <div className="uploaded-files">
        <h3 className="text-lg font-semibold">Uploaded Files:</h3>
        {loading ? (
          <p className="loading-ellipsis">Uploading<span>.</span><span>.</span><span>.</span></p>
        ) : uploadedFiles.length > 0 ? (
          uploadedFiles.map(renderFileDetails)
        ) : (
          <p>No files uploaded yet.</p>
        )}
      </div>
    </div>
  );
};

export default DataInput;
