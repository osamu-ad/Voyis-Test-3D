/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../main-css/2DViewHandler.css";

/**
 * GISViewer Component
 * Renders a 2D map using Leaflet.js to visualize GeoJSON data.
 *
 * Functionalities:
 * - Initializes a Leaflet map centered at a default world view.
 * - Loads and displays GeoJSON data as markers on the map.
 * - Supports custom icons from GeoJSON properties (defaults to a generic icon if not provided).
 * - Displays metadata in popups when markers are clicked.
 * - Adjusts the map view to fit the bounds of the loaded data.
 */
const GISViewer = ({ geoJsonData, addLog }) => {
  const mapRef = useRef(null);
  const layerRef = useRef(null); 
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedTag, setSelectedTag] = useState("All");
    
  // Initialize Leaflet map when component is mounted
  useEffect(() => {
      // Initialize map with world view
      if (!mapRef.current) {
          mapRef.current = L.map("map").setView([0, 0], 2);

          // Set up OpenStreetMap tile layer
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(mapRef.current);
      };

      // Cleanup map on component unmount
      return () => {
          if (mapRef.current) {
              mapRef.current.remove();
              mapRef.current = null;
          }
      };
  }, []);

  // Update filtered data whenever geoJsonData or selectedTag changes
  useEffect(() => {
      if (!geoJsonData) return;

      // Filter features based on the selected tag
      const dataToDisplay = selectedTag === "All" ? geoJsonData.features : 
          geoJsonData.features.filter(feature => feature.properties.tag === selectedTag);

      setFilteredData(dataToDisplay);
      setCurrentTimeIndex(0); // Reset time index when the data changes
      renderMarkers([]); // Clear the map markers
      addLog(`Filter changed: ${selectedTag}`);
  }, [geoJsonData, selectedTag]);

  // Playback functionality: Display data sequentially when playing
  useEffect(() => {
      if (!isPlaying || currentTimeIndex >= filteredData.length) return;

      const interval = setInterval(() => {
          setCurrentTimeIndex((prevIndex) => {
              if (prevIndex + 1 < filteredData.length) {
                  renderMarkers(filteredData.slice(0, prevIndex + 1)); // Render markers up to the current index
                  return prevIndex + 1;
              } else {
                  clearInterval(interval); // Stop playback when all data is displayed
                  setIsPlaying(false);
                  addLog("Playback finished");
                  return prevIndex;
              }
          });
      }, 1000); // Interval for 1 second between each data point

      // Cleanup interval on component unmount or when playback stops
      return () => clearInterval(interval);
  }, [isPlaying, currentTimeIndex, filteredData]);

  // Function to render markers on the map
  const renderMarkers = (features) => {
    // Remove previous markers if any
    if (layerRef.current) {
        mapRef.current.removeLayer(layerRef.current);
    }

    // Add new GeoJSON layer with features
    layerRef.current = L.geoJSON({ type: "FeatureCollection", features }, {
        pointToLayer: (feature, latlng) => {
            const iconUrl = feature.properties?.icon || "https://cdn-icons-png.flaticon.com/512/854/854878.png";

            const customIcon = L.icon({
                iconUrl: iconUrl,
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -30],
            });

            // Create marker with custom icon
            return L.marker(latlng, { icon: customIcon });
        },
        onEachFeature: (feature, layer) => {
            if (feature.properties) {
              // Construct popup content with feature properties
                let popupContent = `<b>Coordinates:</b> ${feature.geometry.coordinates.join(", ")}<br/>`;
                Object.keys(feature.properties).forEach(key => {
                    popupContent += `<b>${key}:</b> ${feature.properties[key]}<br/>`;
                });
                // Bind popup to the marker
                layer.bindPopup(popupContent);
            };
        }
    });

    // Add layer to the map
    layerRef.current.addTo(mapRef.current);
    if (features.length > 0) {
      // Adjust map view to fit the loaded markers
      mapRef.current.fitBounds(layerRef.current.getBounds());
    };
  };

  return (
    <div>
        <div className="controls">
           {/* Dropdown to filter markers by tag */}
            <label>Filter by Tag:</label>
            <select onChange={(e) => setSelectedTag(e.target.value)}>
                <option value="All">All</option>
                {geoJsonData &&
                    [...new Set(geoJsonData.features.map((f) => f.properties.tag))].map((tag) => (
                        <option key={tag} value={tag}>{tag}</option>
                    ))}
            </select>
            {/* Play button to start playback */}
            <button 
                onClick={() => { 
                  setIsPlaying(true);
                  addLog("Playback started");
                }}  
                disabled={isPlaying}
                className="custom-button"
            >
                ▶ Play
            </button>
            {/* Pause button to pause playback */}
            <button 
                onClick={() => { 
                        setIsPlaying(false);
                        addLog("Playback paused");
                    }} 
                    className="custom-button">
                ⏸ Pause
            </button>
            {/* Reset button to reset the playback */}
            <button 
                onClick={() => { 
                  setCurrentTimeIndex(0); 
                  setIsPlaying(false); 
                  renderMarkers([]); 
                  addLog("Playback reset");
                }}  
                className="custom-button"
            >
                🔄 Reset
            </button>
            {/* Show all button to display all markers */}
            <button 
                onClick={() => { 
                  setIsPlaying(false); 
                  setCurrentTimeIndex(filteredData.length); 
                  renderMarkers(filteredData); 
                  addLog("All points displayed");
                }} 
                className="custom-button"
            >
                📍 Show All
            </button>
        </div>
        {/* Map container */}
        <div id="map"></div>
    </div>
);
};

export default GISViewer;
