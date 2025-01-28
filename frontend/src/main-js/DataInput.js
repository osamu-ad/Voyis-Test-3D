import React, { useState } from "react";
import "../main-css/DataInput.css";
import * as THREE from 'three';
import geojsonValidation from "geojson-validation";


/**
 * DataInput Component
 * Handles file uploads and displays metadata for the uploaded files.
 * 
 * Functionalities:
 * - Allows multiple file uploads.
 * - Accepts specific file types (.xyz, .pcd, .geojson).
 * - Displays details of uploaded files such as filename, size, and type.
 */
const MAX_FILE_SIZE = 450 * 1024 * 1024; // 450 MB

const DataInput = () => {
  // State to store uploaded files
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileMetadata, setFileMetadata] = useState({});
  
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
            pointCount: points.length,
            boundingBox: geometry.boundingBox
          });
        }
        // Basic parsing for .pcd files would require more complex parsing
        else if (file.name.endsWith('.pcd')) {
          try {
            const lines = content.split('\n');
            const header = {};
            let headerLength = 0;
            
            // Parse header
            while (headerLength < lines.length) {
              const line = lines[headerLength].trim();
              if (line === 'DATA ascii') {
                headerLength++;
                break;
              }
              
              const [key, ...valueParts] = line.split(/\s+/);
              header[key] = valueParts.join(' ');
              headerLength++;
            }
            
            // Validate required header fields
            const requiredFields = ['VERSION', 'FIELDS', 'SIZE', 'TYPE', 'COUNT', 'WIDTH', 'HEIGHT', 'VIEWPOINT', 'POINTS'];
            for (const field of requiredFields) {
              if (!(field in header)) {
                throw new Error(`Missing required PCD header field: ${field}`);
              }
            }
            
            // Parse point data
            const fields = header.FIELDS.split(/\s+/);
            const points = [];
            
            for (let i = headerLength; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;
              
              const values = line.split(/\s+/).map(parseFloat);
              
              // Find x, y, z indices in fields
              const xIndex = fields.indexOf('x');
              const yIndex = fields.indexOf('y');
              const zIndex = fields.indexOf('z');
              
              if (xIndex !== -1 && yIndex !== -1 && zIndex !== -1) {
                points.push(new THREE.Vector3(
                  values[xIndex],
                  values[yIndex],
                  values[zIndex]
                ));
              }
            }
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            geometry.computeBoundingBox();
            
            resolve({
              pointCount: points.length,
              boundingBox: geometry.boundingBox,
              header: header
            });
          } catch (error) {
            reject(new Error(`PCD parsing failed: ${error.message}`));
          }
        }
        else {
          resolve(null);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

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

  //Handle file upload and parse details
  const handleFileUpload = async (event) => {
    let files = Array.from(event.target.files);
    // Check for duplicates first
    const duplicateFiles = files.filter(file => 
      uploadedFiles.some(existingFile => existingFile.name === file.name)
    );

    if (duplicateFiles.length > 0) alert(`These files have already been uploaded: ${duplicateFiles.map(f => f.name).join(', ')}`);

    const fileDetails = await Promise.all(files.map(async (file) => {
      const fileInfo = {
        name: file.name,
        size: (file.size / 1024).toFixed(2) + " KB", 
        type: file.name.split(".").pop(), 
      };
      
      try {
        if (!fileInfo && fileInfo.size === 0) {
          alert(`File is empty: ${fileInfo.name}.`);
          return false;
        }

        if (fileInfo.size > MAX_FILE_SIZE) {
          alert(`${file.name} exceeds the 450 MB size limit.`);
          return false;
        }

        // Parse point cloud files and store metadata
        if (fileInfo.type === 'xyz' || fileInfo.type === 'pcd') {
          const metadata = await parsePointCloudFile(file);
          if (metadata) {
            setFileMetadata(prev => ({
              ...prev,
              [file.name]: metadata
            }));
          }
        }
        
        // Handle GeoJSON files
        if (fileInfo.type === 'geojson') {
          const isValid = await parseGeoJSON(file);
          if (!isValid) return false;  
        }

        return fileInfo;
      } catch (error) {
        console.error("Error parsing point cloud file:", error);
      }
      return fileInfo;
    }));
    
    setUploadedFiles(fileDetails);
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
    <p>Files Must Be .xyz, .pcd, or .geojson!</p>
  </div>
  <div className="uploaded-files">
    <h3 className="text-lg font-semibold">Uploaded Files:</h3>
    {uploadedFiles.length > 0 ? (
      uploadedFiles.map(renderFileDetails)
    ) : (
      <p>No files uploaded yet.</p>
    )}
  </div>
</div>
  );
};

export default DataInput;
