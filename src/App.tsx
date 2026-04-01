import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MapPanel } from './components/MapPanel';
import { LocationSearch } from './components/LocationSearch';
import { Modal } from './components/Modal';
import { CompliancePanel } from './components/CompliancePanel';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { PlatformAdminDashboard } from './components/PlatformAdminDashboard';
import { useAppState } from './useAppState';
import { User, Tenant } from './types';
import { DEFAULT_LIBRARY } from './types';
import { v4 as uuidv4 } from 'uuid';
import { lngLatToMetres, isPointInBoundary } from './utils/geo';
import { clsx } from 'clsx';
import { AlertTriangle, Download, Trash2 } from 'lucide-react';

export default function App() {
  const {
    state,
    setBoundary,
    addObject,
    setObjects,
    updateObject,
    removeObject,
    selectObject,
    setMapStyle,
    toggleTerrain,
    toggleBuildings,
    toggleBoundaryLock,
    setPendingPlacement,
    setMeasurePoints,
    addCustomEquipment,
    setCustomLibrary,
    setUnitSystem,
  } = useAppState();

  const [drawTrigger, setDrawTrigger] = useState(0);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [targetLocation, setTargetLocation] = useState<{ lng: number; lat: number } | undefined>();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [complianceOpen, setComplianceOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<any>(null);

  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  const handleLogin = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      setTenant(data.tenant);
      
      if (data.tenant) {
        const eqRes = await fetch(`/api/tenant/${data.tenant.id}/equipment`);
        if (eqRes.ok) {
          const eqData = await eqRes.json();
          setCustomLibrary(eqData);
        }
      }
    } else {
      throw new Error('Login failed');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setTenant(null);
  };

  const handleMapClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    console.log("Map clicked at:", e.lngLat, "Pending:", state.pendingPlacement?.name);
    if (state.pendingPlacement && state.originLngLat) {
      const { x, z } = lngLatToMetres([e.lngLat.lng, e.lngLat.lat], state.originLngLat);
      // Snap to 0.5m
      const snappedX = Math.round(x * 2) / 2;
      const snappedZ = Math.round(z * 2) / 2;

      console.log("Calculated metres:", { x, z }, "Snapped:", { snappedX, snappedZ });

      if (isPointInBoundary(snappedX, snappedZ, state.originLngLat, state.siteBoundary)) {
        console.log("Inside boundary, adding object...");
        addObject(state.pendingPlacement.id, snappedX, snappedZ, state.pendingPlacement.color);
      } else {
        console.warn("Outside boundary check failed. Boundary size:", state.siteBoundary.length);
        alert("Please place equipment inside the boundary.");
      }
    } else {
      console.log("No pending placement or no origin set. Origin:", state.originLngLat);
    }
    
    if (isMeasuring) {
      if (state.measurePoints.length >= 2) {
        setMeasurePoints([[e.lngLat.lng, e.lngLat.lat]]);
      } else {
        setMeasurePoints([...state.measurePoints, [e.lngLat.lng, e.lngLat.lat]]);
      }
    }
  }, [state.pendingPlacement, state.originLngLat, state.siteBoundary, isMeasuring, state.measurePoints, addObject, setMeasurePoints]);

  const handleExport = () => {
    const data = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      origin: state.originLngLat,
      siteBoundary: state.siteBoundary,
      objects: state.objects,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `site-config-${new Date().getTime()}.json`;
    a.click();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (re: any) => {
        try {
          const data = JSON.parse(re.target.result as string);
          
          // Check if there's existing data
          if (state.objects.length > 0 || state.siteBoundary.length > 0) {
            setPendingImportData(data);
            setImportModalOpen(true);
          } else {
            applyImport(data);
          }
        } catch (err) {
          alert("Failed to parse JSON.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleSave = async () => {
    if (!user || !tenant) return;
    
    const projectName = prompt("Enter project name:", "New Project") || "Untitled Project";
    
    const data = {
      origin: state.originLngLat,
      siteBoundary: state.siteBoundary,
      objects: state.objects,
    };

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: uuidv4(),
        tenant_id: tenant.id,
        user_id: user.id,
        name: projectName,
        data
      })
    });

    if (res.ok) {
      alert("Project saved successfully!");
    } else {
      alert("Failed to save project.");
    }
  };

  const applyImport = (data: any) => {
    if (data.siteBoundary) setBoundary(data.siteBoundary);
    if (data.objects) setObjects(data.objects);
    alert("Imported site configuration.");
    setImportModalOpen(false);
    setPendingImportData(null);
  };

  const handleConfirmImport = () => {
    if (pendingImportData) {
      applyImport(pendingImportData);
    }
  };

  const handleExportAndImport = () => {
    handleExport();
    if (pendingImportData) {
      applyImport(pendingImportData);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedId) removeObject(state.selectedId);
      }
      if (e.key === 'Escape') {
        selectObject(null);
        setPendingPlacement(null);
        setIsMeasuring(false);
        setMeasurePoints([]);
      }
      if (e.key === 'r' || e.key === 'R') {
        if (state.selectedId) {
          const obj = state.objects.find(o => o.id === state.selectedId);
          if (obj) {
            updateObject(state.selectedId, { rotationY: obj.rotationY + (5 * Math.PI / 180) });
          }
        }
      }
      if (e.key === 'm' || e.key === 'M') {
        setIsMeasuring(prev => !prev);
        setMeasurePoints([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedId, state.objects, removeObject, selectObject, setPendingPlacement, updateObject, setMeasurePoints]);

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (user.role === 'platform_admin') {
    return <PlatformAdminDashboard user={user} onLogout={handleLogout} />;
  }

  if (user.role === 'tenant_admin' && !state.originLngLat) {
    return <AdminDashboard user={user} tenant={tenant!} onLogout={handleLogout} />;
  }

  return (
    <div className="flex h-screen w-screen bg-brand-navy overflow-hidden select-none">
      <Sidebar 
        state={state}
        onSetStyle={setMapStyle}
        onToggleTerrain={toggleTerrain}
        onToggleBuildings={toggleBuildings}
        onDrawBoundary={() => setDrawTrigger(t => t + 1)}
        onDeleteBoundary={() => setBoundary([])}
        onToggleMeasure={() => { setIsMeasuring(!isMeasuring); setMeasurePoints([]); }}
        onToggleBoundaryLock={toggleBoundaryLock}
        onSelectEquipment={setPendingPlacement}
        onDeleteSelected={() => state.selectedId && removeObject(state.selectedId)}
        onUpdateObject={updateObject}
        onExport={handleExport}
        onImport={handleImport}
        onSave={handleSave}
        onAddCustomEquipment={addCustomEquipment}
        onSetUnitSystem={setUnitSystem}
        onOpenCompliance={() => setComplianceOpen(true)}
        onLogout={handleLogout}
        user={user}
        tenant={tenant}
      />

      <main className="flex-1 flex relative">
        <div className="h-full w-full relative">
          <MapPanel 
            state={state}
            isMeasuring={isMeasuring}
            onBoundaryChange={setBoundary}
            onMapMove={() => {}}
            onMapClick={handleMapClick}
            onObjectSelect={selectObject}
            onObjectUpdate={updateObject}
            drawTrigger={drawTrigger}
            targetLocation={targetLocation}
          />

          <CompliancePanel 
            state={state}
            isOpen={complianceOpen}
            onClose={() => setComplianceOpen(false)}
          />
          
          {/* Top Overlays */}
          <div className="absolute top-4 left-4 right-4 flex items-start justify-end pointer-events-none">
            <div className="pointer-events-auto">
              <LocationSearch onSelectLocation={(lng, lat) => setTargetLocation({ lng, lat })} />
            </div>
          </div>
        </div>

        {/* Import Confirmation Modal */}
        <Modal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          title="Confirm Import"
          footer={
            <>
              <button
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExportAndImport}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg border border-white/10 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Export & Replace
              </button>
              <button
                onClick={handleConfirmImport}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-all shadow-lg shadow-red-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Replace Existing
              </button>
            </>
          }
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Replace existing design?</p>
              <p className="text-xs text-white/60 leading-relaxed">
                You already have a design in progress. Importing a new file will permanently replace your current site boundary and all placed equipment.
              </p>
            </div>
          </div>
        </Modal>

        {/* Status Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-brand-navy/90 border-t border-white/10 flex items-center px-4 justify-between text-[10px] text-white/40 font-mono z-50">
          <div className="flex gap-4">
            <span>MODE: {state.pendingPlacement ? 'PLACEMENT' : 'IDLE'}</span>
            <span>OBJECTS: {state.objects.length}</span>
            {state.selectedId && <span>SELECTED: {state.objects.find(o => o.id === state.selectedId)?.type}</span>}
          </div>
          <div className="flex gap-4">
            <span>3D VIEW ENABLED</span>
          </div>
        </div>
      </main>
    </div>
  );
}
