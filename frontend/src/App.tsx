import React, { useState, useCallback, useEffect } from 'react';
import { authFetch } from './utils/api';
import { Sidebar } from './components/Sidebar';
import { MapPanel } from './components/MapPanel';
import { LocationSearch } from './components/LocationSearch';
import { Modal } from './components/Modal';
import { CompliancePanel } from './components/CompliancePanel';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { PlatformAdminDashboard } from './components/PlatformAdminDashboard';
import { useAppState } from './useAppState';
import { User, Tenant } from '../../backend/types';
import { DEFAULT_LIBRARY } from '../../backend/types';
import { v4 as uuidv4 } from 'uuid';
import { lngLatToMetres, isPointInBoundary } from './utils/geo';
import { clsx } from 'clsx';
import { AlertTriangle, Download, Trash2 } from 'lucide-react';
import { ForgotPassword } from './components/ForgotPassword';
import { ForcePasswordChange } from './components/ForcePasswordChange';
import { ContactAdmin } from './components/ContactAdmin';

export default function App() {

  // useEffect(() => {
  //  console.log("API URL:", import.meta.env.VITE_API_URL);
  //  console.log("ENV CHECK:", import.meta.env);
  //  }, []);

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

  const API_URL = import.meta.env.VITE_API_URL;

  const [drawTrigger, setDrawTrigger] = useState(0);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [targetLocation, setTargetLocation] = useState<{ lng: number; lat: number } | undefined>();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [complianceOpen, setComplianceOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<any>(null);

  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showContactAdmin, setShowContactAdmin] = useState(false);
  const [disabledDefaults, setDisabledDefaults] = useState<string[]>([]);

const handleLogin = async (email: string, password: string) => {
  // const res = await fetch('/api/auth/login', {
  try {
     const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

// const contentType = res.headers.get("content-type");

// if (!contentType || !contentType.includes("application/json")) {
//   const text = await res.text();
//   console.error("❌ BROKEN API:", res.url);
//   console.error("❌ RESPONSE:", text);
//   throw new Error("Invalid JSON response");
// }

// const data = await res.json();
const data = await res.json();
   console.log("LOGIN RESPONSE:", data);

     if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }

  // if (res.ok) {
  //   const data = await res.json();
    localStorage.setItem('authToken', data.token);
    setUser(data.user);
    setTenant(data.tenant);

    //  Pass tenant directly — don't rely on state being updated yet
    fetchProjects(data.tenant);

    if (data.tenant) {

      // Fetch disabled defaults for tenant
    const ddRes = await authFetch(`/api/tenant/${data.tenant.id}/disabled-defaults`); 
  //     { headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${data.token}`
  //   }
  // });
  if (ddRes.ok) {
    const disabledIds = await ddRes.json();
    // Store in state — add this state at the top of App component
    setDisabledDefaults(disabledIds);
  }

  // Fetch equipment for tenant
      const eqRes = await authFetch(`/api/tenant/${data.tenant.id}/equipment`);
      //    {
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${data.token}`
      //   }
      // });
      if (eqRes.ok) {
        const eqData = await eqRes.json();
        const mapped = eqData.map((eq: any) => ({
          id: eq.id,
          name: eq.name,
          category: eq.category,
          width: eq.width,
          depth: eq.depth,
          height: eq.height,
          color: eq.color,
          modelUrl: eq.model_url,
          animationsEnabled: !!eq.animations_enabled,
          imageUrl: eq.image_url || null,
          isActive: eq.is_active !== 0,
        }));
        //  Filter out inactive for sales reps
const filtered = data.user?.role === 'sales_rep' 
  ? mapped.filter((eq: any) => eq.isActive !== false)
  : mapped;

setCustomLibrary(filtered);

        setCustomLibrary(mapped);
      }
    } else {
      setCustomLibrary([]);
    }
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    throw new Error('Login failed');
  }

};

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // clear token
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

    const res = await authFetch('/api/projects', {
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

  const fetchProjects = async (tenantData: Tenant | null) => {
    if (!tenantData) return;
    const res = await authFetch(`/api/projects?tenantId=${tenantData.id}`);
    if (res.ok) {

// const contentType = res.headers.get("content-type");

// if (!contentType || !contentType.includes("application/json")) {
//   const text = await res.text();
//   console.error("❌ BROKEN API:", res.url);
//   console.error("❌ RESPONSE:", text);
//   throw new Error("Invalid JSON response");
// }

const data = await res.json();
      setProjects(data);
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

  // if (!user) {
  //   return <Login onLogin={handleLogin} />;
  // }

  if (!user) {
  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }
  if (showContactAdmin) {
    return <ContactAdmin onBack={() => setShowContactAdmin(false)} />;
  }
  return (
    <Login
      onLogin={handleLogin}
      onForgotPassword={() => setShowForgotPassword(true)}
      onContactAdmin={() => setShowContactAdmin(true)}
    />
  );
}

// Force password change if user logged in with temp password
if (user.force_password_change) {
  return (
    <ForcePasswordChange
      user={user}
      onPasswordChanged={() => setUser({ ...user, force_password_change: 0 })}
    />
  );
}

  if (user.role === 'platform_admin') {
    return <PlatformAdminDashboard user={user} onLogout={handleLogout} />;
  }

  if (user.role === 'tenant_admin' && !state.originLngLat) {
    return <AdminDashboard user={user} tenant={tenant!} onLogout={handleLogout} />;
  }

  return (
    <div className="flex h-screen w-screen bg-brand-navy select-none">
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
        onLoadProject={(boundary, objects) => {
        setBoundary(boundary);
        setObjects(objects);
           }}
        user={user}
        tenant={tenant}
        // disabledDefaults={disabledDefaults}
      />

      <main className="flex-1 flex relative h-screen overflow-hidden">
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
          <div className="flex h-screen items-start gap-4 overflow-auto">
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
          {/* <div className="flex gap-4">
            <span>MODE: {state.pendingPlacement ? 'PLACEMENT' : 'IDLE'}</span>
            <span>OBJECTS: {state.objects.length}</span>
            {state.selectedId && <span>SELECTED: {state.objects.find(o => o.id === state.selectedId)?.type}</span>}
          </div> */}
          {/* <div className="flex gap-4"> */}
            {/* <div className="flex h-screen overflow-hidden">
            <span>3D VIEW ENABLED</span>
          </div> */}
        </div>
      </main>
    </div>
  );
}
