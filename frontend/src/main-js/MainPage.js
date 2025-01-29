import React, { useState } from "react";
import DataInput from "./DataInput.js"; 
import DataViewer from "./DataViewer.js"; 
import "../main-css/MainPage.css";

/**
 * MainPage Component
 * The main entry point for the application UI, hosting other components like DataInput.
 */
const MainPage = () => {
  const [pointCloudData, setPointCloudData] = useState([]);


  return (
    <div className="main-wrapper">
      {/* Header Section */}
      <header className="header">
      <img src="./images/voyis-logo.png" alt="Voyis Logo" />
        <div className="header-text">
          <h1 className="tagline">Voyis 3D Viewer</h1>
          <h2 className="subtitle">3D Data Viewer with GIS Integration</h2>
        </div>
      </header>
  
      {/* Content Section */}
      <main className="content-wrapper">
        <div className="main-content">
          <DataViewer pointCloudData={pointCloudData} />
          <DataInput setPointCloudData={setPointCloudData} />
        </div>
      </main>
    </div>
  );
};

export default MainPage;
