# 🛠️ Technical Implementation

Detailed technical documentation of the Site3D Enterprise architecture and core logic.

## 1. Architecture Overview
The application follows a full-stack architecture with a React frontend and an Express backend.

### 1.1. Frontend (React)
- **`src/App.tsx`**: The main entry point that orchestrates the UI, map, and high-level application logic.
- **`src/useAppState.ts`**: A custom hook that manages the `AppState` using React's `useState`. It provides actions to modify the state (e.g., `addObject`, `removeObject`, `setBoundary`).
- **`src/components/MapPanel.tsx`**: The core map component that integrates Mapbox GL JS. It handles 3D rendering, layer management, and user interactions on the map.
- **`src/components/CompliancePanel.tsx`**: A specialized UI for displaying AI-powered risk assessments.
- **`src/services/complianceService.ts`**: Handles communication with the Gemini AI API for site analysis.

### 1.2. Backend (Node.js/Express)
- **`server.ts`**: The main server entry point. It handles API routes, database operations, and serves the static frontend in production.
- **Database (SQLite)**: Uses `better-sqlite3` for persistent storage of tenants, users, equipment, and projects.
- **Vite Middleware**: Integrates Vite into Express for a seamless development experience with HMR.

## 2. Multi-Tenant Data Model
The application uses a relational schema to ensure secure data isolation:
- **Tenants**: Stores company-specific configuration (name, logo, branding).
- **Users**: Manages authentication and role-based access (Platform Admin, Tenant Admin, Sales Rep).
- **Equipment**: A private repository of 3D models and metadata for each tenant.
- **Projects**: Stores site configurations (JSON) linked to specific users and tenants.

## 3. AI Compliance Engine
The compliance engine uses Google's Gemini 3 Flash model to perform spatial reasoning on site layouts.
- **Input**: A structured JSON representation of the site boundary and placed equipment (names, categories, positions, dimensions).
- **Processing**: The model evaluates the layout against a set of safety and operational rules defined in the system prompt.
- **Output**: A structured JSON report containing an overall safety score, detailed checks, and actionable recommendations.

## 4. Mapbox GL JS Integration
The map is initialized using a `useRef` to maintain the `mapboxgl.Map` instance across renders.

### 3.1. 3D Terrain & Buildings
- **Terrain**: Enabled using `map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 })`.
- **Buildings**: Added as a `fill-extrusion` layer with a filter for `building` data from the Mapbox Streets source.

### 3.2. Layer Management
The map uses several layers for different types of data:
- **`equipment-layer`**: A `fill-extrusion` layer for simple box-shaped equipment.
- **`equipment-model-layer`**: A `model` layer for high-fidelity 3D GLB models.
- **`ghost-box-layer` / `ghost-model-layer`**: Temporary layers for previewing objects during placement.
- **`boundary-layer`**: A `fill` layer for the site boundary polygon.
- **`measure-layer`**: A `line` layer for distance measurements.

### 3.3. 3D Model Support (GLB)
- **Model Registration**: Models are registered using `map.addModel(id, url)`.
- **Animations**: Enabled using the `model-animations` paint property. The application uses a wildcard `[{ name: '*', state: 'play' }]` to play all animations in the GLB.

## 3. Spatial Calculations
Since Mapbox uses geographic coordinates (LngLat) and site planning often uses metric units (metres), the application performs conversions at the origin.

- **Origin**: The first point of the site boundary is used as the `originLngLat`.
- **Metre Conversion**: Uses a simplified projection at the origin to convert LngLat to metres (X, Z) and vice versa.
- **Snapping**: Snapping is performed in metre space before converting back to LngLat for map rendering.

## 4. State Persistence
The application state is serialized into a JSON object for export and import.

```typescript
interface SiteConfig {
  version: string;
  exportedAt: string;
  origin: [number, number] | null;
  siteBoundary: [number, number][];
  objects: EquipmentObject[];
}
```

## 5. Performance Optimizations
- **`useCallback` & `useMemo`**: Used extensively to prevent unnecessary re-renders of the map and sidebar.
- **GeoJSON Source Updates**: Instead of re-adding layers, the application updates the data of existing GeoJSON sources using `source.setData()`.
- **Debounced Search**: The location search uses a debounced fetch to minimize API calls to the Mapbox Geocoding API.
