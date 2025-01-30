import React, { useEffect, useRef, useState } from "react";
import ThreeDViewHandler from "./3DViewHandler";
import GISViewer from "./2DViewHandler";
import "../main-css/DataViewer.css";

const DataViewer = ({ pointCloudData, geoJsonData }) => {
    const canvasRef = useRef(null);
    const [is3DView, setIs3DView] = useState(true);
    const [viewer, setViewer] = useState(null);
    const [pointSize, setPointSize] = useState(0.05);
    const [colorByAltitude, setColorByAltitude] = useState(false);

    useEffect(() => {
        if (canvasRef.current) {
            const newViewer = new ThreeDViewHandler(canvasRef.current, pointCloudData);
            setViewer(newViewer);
        }
    }, [pointCloudData]);

    const handlePointSizeChange = (e) => {
        const newSize = parseFloat(e.target.value);
        setPointSize(newSize);
        viewer?.updatePointSize(newSize);
    };

    const toggleColorByAltitude = () => {
        setColorByAltitude(prev => !prev);
        viewer?.toggleColorByAltitude(!colorByAltitude);
    };

    const handleCenterObject = () => {
        viewer?.centerObject();
    };

    const toggleViewMode = () => {
        setIs3DView((prevMode) => !prevMode);
    };

    return (
        <div className="app-container">
            <div className="data-viewer-container">
                <div className="control-panel">
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
                <div className="viewer-content">
                    {is3DView ? (
                        <canvas ref={canvasRef} />
                    ) : (
                        <div>
                            {/* Your 2D viewer component goes here */}
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


