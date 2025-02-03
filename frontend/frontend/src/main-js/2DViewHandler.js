import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
const GISViewer = ({ geoJsonData }) => {
    const mapRef = useRef(null);
  
    useEffect(() => {
      if (!mapRef.current) {
        mapRef.current = L.map("map").setView([0, 0], 2);
  
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapRef.current);
      }
  
      if (geoJsonData) {
        const geoJsonLayer = L.geoJSON(geoJsonData, {
          // Assigns a custom icon to markers if specified in GeoJSON properties
          pointToLayer: (feature, latlng) => {
            const iconUrl = feature.properties?.icon || "https://cdn-icons-png.flaticon.com/512/854/854878.png"; // Default icon if not provided
  
            const customIcon = L.icon({
              iconUrl: iconUrl,
              iconSize: [30, 30],
              iconAnchor: [15, 30],
              popupAnchor: [0, -30],
            });
  
            return L.marker(latlng, { icon: customIcon });
          },
          
          // Binds popups to each feature displaying its metadata
          onEachFeature: (feature, layer) => {
            if (feature.properties) {
              const properties = feature.properties;
              let popupContent = "<b>Coordinates:</b> " + feature.geometry.coordinates.join(", ") + "<br/>";
  
              Object.keys(properties).forEach(key => {
                popupContent += `<b>${key}:</b> ${properties[key]}<br/>`;
              });
  
              layer.bindPopup(popupContent);
            }
          },
        });
  
        geoJsonLayer.addTo(mapRef.current);
        mapRef.current.fitBounds(geoJsonLayer.getBounds());
      }
  
      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }, [geoJsonData]);
  
    return <div id="map" style={{ width: "100%", height: "500px" }}></div>;
  };
  

export default GISViewer;
