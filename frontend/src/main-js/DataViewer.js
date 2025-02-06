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
 * - Displays log of user actions.
 */
const DataViewer = ({ pointCloudData, geoJsonData }) => {
    const canvasRef = useRef(null);
    const [is3DView, setIs3DView] = useState(false);
    const [viewer, setViewer] = useState(null);
    const [pointSize, setPointSize] = useState(0.05);
    const [colorByAltitude, setColorByAltitude] = useState(false);
    const [logMessages, setLogMessages] = useState([]);
    const [minAltitude, setMinAltitude] = useState(-100); 
    const [maxAltitude, setMaxAltitude] = useState(100);

    // Adds a message to the log
    const addLog = (message) => {
        setLogMessages(prevLogs => [{ message, timestamp: new Date().toLocaleTimeString() }, ...prevLogs]);
    };

    useEffect(() => {
        // Only initialize the viewer if we're in 3D view and there's no existing viewer
        if (canvasRef.current && is3DView && pointCloudData) {
            viewer?.dispose();
            setViewer(null);
            const newViewer = new ThreeDViewHandler(canvasRef.current, pointCloudData);
            newViewer.setAltitudeRange(minAltitude, maxAltitude);
            setViewer(newViewer);
            addLog("Initialized 3D Viewer.");
        } 
        // If switching to 2D, clean up the viewer
        else if (!is3DView && viewer) {
            viewer.dispose();
            setViewer(null);
            addLog("Switched to 2D View.");
        }
    
        // Cleanup the viewer when the component unmounts
        return () => {
            if (viewer) {
                viewer.dispose();
                addLog("3D Viewer Disposed.");
            }
        };
    }, [is3DView, pointCloudData, minAltitude, maxAltitude]); // Only trigger when the view mode or point cloud data changes

    // Updates the point size in the 3D viewer
    const handlePointSizeChange = (e) => {
        const newSize = parseFloat(e.target.value);
        setPointSize(newSize);
        viewer?.updatePointSize(newSize);
        addLog(`Point size changed to ${newSize}`);
    };

    // Toggles altitude-based coloring in the 3D viewer
    const toggleColorByAltitude = () => {
        setColorByAltitude(prev => !prev);
        viewer?.toggleColorByAltitude(!colorByAltitude);
        addLog(`Altitude coloring ${!colorByAltitude ? "enabled" : "disabled"}`);
    };

    // Centers the object in the 3D viewer
    const handleCenterObject = () => {
        viewer?.centerObject();
        addLog("Centered object in 3D Viewer.");
    };

    // Handle altitude range change
    const handleAltitudeRangeChange = (e) => {
        const { name, value } = e.target;
        if(value < -150 || value > 150) return alert('Please keep the value between -150 and 150');
        if (name === "minAltitude") {
            setMinAltitude(parseFloat(value));
            addLog(`Min Altitude Changed to ${value}`);
        } else if (name === "maxAltitude") {
            setMaxAltitude(parseFloat(value));
            addLog(`Max Altitude Changed to ${value}`);
        }
        
    };

    // Toggles between 3D and 2D view modes
    const toggleViewMode = () => {
        setIs3DView((prevMode) => !prevMode);
        addLog(`Switched to ${!is3DView ? "3D" : "2D"} View.`);
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
                    <label>
                        Min Altitude:
                        <input
                            type="number"
                            name="minAltitude"
                            value={minAltitude}
                            onChange={handleAltitudeRangeChange}
                            style={{ width: '60px' }}
                        />
                    </label>
                    <label>
                        Max Altitude:
                        <input
                            type="number"
                            name="maxAltitude"
                            value={maxAltitude}
                            onChange={handleAltitudeRangeChange}
                            style={{ width: '60px' }}
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
                            <GISViewer geoJsonData={geoJsonData} addLog={addLog} />
                        </div>
                    )}
                </div>
                {/* Action Log */}
                <div className="log-container">
                    <h4>Action Log</h4>
                    <div className="log-messages">
                        {logMessages.map((log, index) => (
                            <div key={index} className="log-entry">
                                <span className="log-time">[{log.timestamp}]</span> {log.message}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataViewer;


