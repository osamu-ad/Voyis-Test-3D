# Voyis-Test-3D

A lightweight web-based application for visualizing 3D point cloud data with integrated GIS viewing functionality. This application provides seamless handling of point cloud data (.xyz, .pcd) and GeoJSON files, offering both 3D and 2D visualization capabilities.

## Features

- **3D Point Cloud Visualization**
  - Interactive 3D viewer powered by Three.js
  - Dynamic point size adjustment
  - Color mapping based on altitude
  - Smooth camera controls with OrbitControls
  - GSAP-powered animations for view transitions
  - Altitude filtering: Filter point clouds by specified altitude range

- **2D GIS Integration**
  - Leaflet-based map visualization
  - GeoJSON data support
  - Custom marker icons
  - Interactive popups with metadata
  - Automatic view bounds adjustment
  - Playback functionality: Play through GeoJSON data over time
  - Tag filtering: Filter GeoJSON data by specific tags

- **File Management**
  - Support for multiple file formats (.xyz, .pcd, .geojson)
  - File metadata display
  - Drag-and-drop file upload
  - Validation for supported file types

## Project Structure

```
Voyis-Test-3D/
├── src/
│   ├── main-js/
│   │   ├── DataInput.js      # File upload and handling
│   │   ├── DataViewer.js     # Main viewer component
│   │   ├── 3DViewHandler.js  # Three.js visualization
│   │   └── 2DViewHandler.js  # Leaflet GIS visualization
│   └── main-css/
│       ├── DataInput.css
│       ├── DataViewer.css
│       ├── 2DViewHandler.css
│       └── MainPage.css
```

## Component Overview

### DataInput
Handles file upload operations and initial data processing:
- Validates file types and formats
- Processes point cloud and GeoJSON data
- Displays file metadata
- Passes processed data to the viewer components

### DataViewer
Main visualization controller that:
- Manages switching between 3D and 2D views
- Provides UI controls for visualization parameters
- Coordinates data flow between input and view handlers
- Includes tag filtering and playback of GeoJSON data
- Includes controls for altitude filtering and playback functionality

### 3DViewHandler
Three.js-based point cloud visualization:
- Initializes 3D scene, camera, and renderer
- Handles point cloud rendering and interactions
- Provides controls for point size and color modes
- Implements smooth camera transitions

### 2DViewHandler
Leaflet-based GIS visualization:
- Renders GeoJSON data on an interactive map
- Supports custom marker icons
- Provides popup information display
- Handles map view and zoom controls

## Dependencies

- React
- Three.js
- Leaflet
- GSAP
- Lodash
- GeoJSON Validation

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/Voyis-Test-3D.git

# Navigate to project directory
cd Voyis-Test-3D

# Install dependencies
npm install

# Start the development server
npm start
```

## Usage

1. Launch the application
2. Use the file upload interface to load point cloud (.xyz, .pcd) or GeoJSON files
3. Switch between 3D and 2D views using the view toggle controls
4. Adjust visualization parameters using the provided UI controls
5. Interact with the visualization using mouse controls:
   - Orbit: Left mouse button
   - Pan: Right mouse button
   - Zoom: Mouse wheel

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
