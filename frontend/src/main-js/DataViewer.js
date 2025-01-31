import React, { useEffect, useRef, useState } from "react";
import ThreeDViewHandler from "./3DViewHandler";
import GISViewer from "./2DViewHandler";
import "../main-css/DataViewer.css";

/**
 * DataViewer Component
 * Handles visualization of point cloud data (3D) and GIS data (2D).
 * 
 * Functionalities:
 * - Displays point cloud data using a Three.js-based 3D viewer.
 * - Displays GIS data using a 2D map view with Leaflet.
 * - Allows switching between 3D and 2D views.
 * - Provides UI controls for point size, color mode, and centering the view.
 */
const DataViewer = ({ pointCloudData, geoJsonData }) => {
    const canvasRef = useRef(null);
    const [is3DView, setIs3DView] = useState(true);
    const [viewer, setViewer] = useState(null);
    const [pointSize, setPointSize] = useState(0.05);
    const [colorByAltitude, setColorByAltitude] = useState(false);

    useEffect(() => {
        if (canvasRef.current) {
            // Initialize 3D viewer when pointCloudData is available
            const newViewer = new ThreeDViewHandler(canvasRef.current, pointCloudData);
            setViewer(newViewer);
        }
    }, [pointCloudData]);

    // Updates the point size in the 3D viewer
    const handlePointSizeChange = (e) => {
        const newSize = parseFloat(e.target.value);
        setPointSize(newSize);
        viewer?.updatePointSize(newSize);
    };

    // Toggles altitude-based coloring in the 3D viewer
    const toggleColorByAltitude = () => {
        setColorByAltitude(prev => !prev);
        viewer?.toggleColorByAltitude(!colorByAltitude);
    };

    // Centers the object in the 3D viewer
    const handleCenterObject = () => {
        viewer?.centerObject();
    };

    // Toggles between 3D and 2D view modes
    const toggleViewMode = () => {
        setIs3DView((prevMode) => !prevMode);
    };

    return (
        <div className="app-container">
            <div className="data-viewer-container">
                <div className="control-panel">
                    {/* Toggle altitude-based coloring */}
                    <button onClick={toggleColorByAltitude}>
                        {colorByAltitude ? "Disable Color" : "Enable Color"}
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
                    <button onClick={handleCenterObject}>Center Object</button>
                    {/* Button to toggle between 3D and 2D view */}
                    <button onClick={toggleViewMode}>
                        {is3DView ? "Switch to 2D View" : "Switch to 3D View"}
                    </button>
                </div>
                {/* Render either the 3D viewer or the 2D GIS viewer based on state */}
                <div className="viewer-content">
                    {is3DView ? (
                        <canvas ref={canvasRef} />
                    ) : (
                        <div>            
                            <h3>2D Viewer (GeoJson Data)</h3>
                            <GISViewer geoJsonData={geoJsonData} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DataViewer;


