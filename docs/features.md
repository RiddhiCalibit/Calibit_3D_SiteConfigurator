# 🌟 Feature Overview

Detailed documentation of each feature available in the 3D Site Configurator.

## 1. AI Compliance Engine
The application features a built-in AI risk assessment tool powered by Google Gemini.
- **Automated Safety Checks**: Verifies safety distances between equipment (e.g., slides and pools).
- **Operational Analysis**: Checks for capacity issues (e.g., attraction-to-facility ratios).
- **Risk Scoring**: Provides an overall safety score from 0-100 based on site configuration.
- **Actionable Advice**: Generates specific recommendations to improve site safety and efficiency.

## 2. Multi-Tenant Admin Portal
A dedicated dashboard for company administrators to manage their private workspace.
- **Equipment Repository**: Upload and manage company-specific 3D models (GLB).
- **Sales Analytics**: Monitor project activity and sales team performance.
- **Team Management**: Manage user access and roles within the company.
- **Company Branding**: Customize the workspace with company logos and colors.

## 3. 3D Map Visualization
The application uses Mapbox GL JS to provide a high-performance 3D map engine.
- **3D Terrain**: Real-world elevation data can be toggled to visualize site layouts on sloped or uneven ground.
- **3D Buildings**: Toggleable 3D building data for urban context.
- **Map Styles**: Switch between Satellite and Street views for different planning needs.

## 2. Equipment Placement & Library
A library of equipment types is provided for site planning.
- **Pre-defined Library**: Slides, towers, pools, and facilities.
- **Custom Equipment**: Users can define their own equipment with custom dimensions, colors, and 3D model URLs.
- **Snapping**: Objects snap to a 0.5m grid for precise alignment.
- **Boundary Check**: Equipment can only be placed within the defined site boundary.

## 3. 3D Model Support (GLB)
High-fidelity 3D models can be used for any equipment type.
- **GLB Support**: Load external `.glb` files for realistic visualization.
- **Animations**: Support for embedded GLB animations (e.g., moving parts, rotating fans).
- **Ghost Preview**: A transparent "ghost" model follows the cursor during placement to preview the final result.

## 4. Spatial Drawing Tools
Tools for defining the site and measuring distances.
- **Site Boundary**: Draw a polygon to define the project area.
- **Boundary Lock**: Lock the boundary to prevent accidental changes while placing equipment.
- **Measurement Tool**: Measure distances between any two points on the map.

## 5. Interactive Object Editing
Once placed, objects can be manipulated directly on the map.
- **Selection**: Click an object to select it.
- **Rotation**: Use the `R` key to rotate selected objects in 5-degree increments.
- **Deletion**: Use the `Delete` or `Backspace` keys to remove selected objects.
- **Properties**: Edit dimensions and colors of placed objects in real-time.

## 6. Location Search
Integrated geocoding search to quickly navigate to any project site worldwide.
- **Autocomplete**: Real-time suggestions as you type.
- **Fly-to Animation**: Smooth camera transition to the selected location.

## 7. Data Management (Import/Export)
Save and share site configurations using JSON files.
- **Export**: Download the current site configuration (boundary, objects, origin) as a `.json` file.
- **Import**: Load existing configurations.
- **Conflict Resolution**: A confirmation modal appears if you try to import while having an unsaved design, offering options to cancel, export first, or replace.
