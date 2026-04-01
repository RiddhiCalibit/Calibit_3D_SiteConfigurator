# Site3D Enterprise - 3D Site Planning & Compliance

A comprehensive, multi-tenant 3D layout planning and compliance platform built with React, Express, and Mapbox GL JS. This application enables enterprises to manage site designs with real-world spatial data, 3D terrain, and AI-powered risk assessment.

## 🚀 Quick Start

1. **Set up Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_MAPBOX_TOKEN=your_mapbox_token_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 🌟 Enterprise Features

- **Multi-Tenant SaaS Architecture**: Secure workspace isolation for different companies.
- **AI Compliance Engine**: Automated safety and operational risk assessment using Gemini AI.
- **Role-Based Access Control (RBAC)**:
  - **Platform Admin**: Global system management.
  - **Tenant Admin**: Company-specific dashboard for equipment repo and team management.
  - **Sales Rep**: Map-based 3D configurator for client projects.
- **Private Equipment Repository**: Manage company-specific 3D models (GLB) and inventory.
- **3D Visualization**: Real-world 3D terrain and building data integration.
- **Spatial Tools**: Draw site boundaries and measure distances in real-time.

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Platform Admin | `platform@admin.com` | `password` |
| Tenant Admin | `admin@equipmentco.com` | `password` |
| Sales Rep | `sales@equipmentco.com` | `password` |

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Framer Motion, Recharts
- **Backend**: Node.js, Express, Better-SQLite3
- **AI**: Google Gemini AI (via @google/genai)
- **Map Engine**: Mapbox GL JS v3+
- **Spatial Analysis**: Turf.js

## 🤝 Contributing

This project uses a modular component architecture. Please ensure all new features are documented in the `docs/` directory.
