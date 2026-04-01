# 🚀 Getting Started

A step-by-step guide to setting up and using the 3D Site Configurator.

## 1. Prerequisites
- **Node.js**: Version 16 or higher.
- **NPM**: Version 7 or higher.
- **Mapbox Account**: You'll need a Mapbox Access Token to use the map engine. Get one at [mapbox.com](https://www.mapbox.com/).

## 2. Configuration
1.  **Environment Variables**:
    Create a `.env` file in the root and add your tokens:
    ```env
    VITE_MAPBOX_TOKEN=pk.your_mapbox_public_token_here
    GEMINI_API_KEY=your_gemini_api_key_here
    ```
2.  **Database**:
    The application uses SQLite. The `enterprise.db` file will be automatically created and seeded with demo data on the first run.

## 3. Authentication
To access the platform, sign in with one of the following demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Platform Admin | `platform@admin.com` | `password` |
| Tenant Admin | `admin@equipmentco.com` | `password` |
| Sales Rep | `sales@equipmentco.com` | `password` |

## 4. Usage Guide

### 4.1. Admin Dashboard (Tenant Admin)
If you log in as a Tenant Admin, you'll be taken to the company dashboard:
- **Equipment Repo**: View and manage your company's 3D model library.
- **Sales Team**: Monitor activity from your sales representatives.
- **Launch Configurator**: To start a new 3D design, click the "Launch Configurator" button (or navigate to a project).

### 4.2. 3D Configurator (Sales Rep)
Sales reps start directly in the 3D map environment:
- **Company Library**: The equipment library is automatically populated with your company's approved models.
- **AI Compliance**: Use the "Compliance Engine" in the sidebar to verify your design against safety standards.

### 4.3. Navigating the Map
- **Pan**: Click and drag with the left mouse button.
- **Rotate/Tilt**: Click and drag with the right mouse button (or Ctrl + left click).
- **Zoom**: Use the mouse wheel or pinch on a trackpad.

### 4.2. Setting Up a Site
1.  **Search for a Location**: Use the search bar at the top to find your project site.
2.  **Draw a Boundary**: Click the "Draw Boundary" button in the sidebar and click on the map to define the project area. Double-click to finish.
3.  **Lock the Boundary**: Once defined, click the "Lock Boundary" icon to prevent accidental changes.

### 4.3. Placing Equipment
1.  **Select Equipment**: Choose an item from the library in the sidebar.
2.  **Place on Map**: Hover over the map (within the boundary) to see a preview. Click to place the item.
3.  **Rotate**: Select a placed item and press the `R` key to rotate it.
4.  **Delete**: Select an item and press `Delete` or `Backspace` to remove it.

### 4.4. Managing Data
- **Export**: Click the "Export JSON" button to save your current layout.
- **Import**: Click the "Import JSON" button to load a previously saved layout.

## 5. Troubleshooting
- **Map not loading**: Check your `VITE_MAPBOX_TOKEN` in the `.env` file.
- **3D Terrain not visible**: Ensure "3D Terrain" is toggled on in the settings panel.
- **Models not appearing**: Verify the `modelUrl` in your custom equipment definition is correct and the GLB file is accessible.
