import React from 'react';
import { authFetch } from '../utils/api';
import { EquipmentDef, DEFAULT_LIBRARY, AppState, User, Tenant } from '../../../backend/types';
import { 
  Map as MapIcon, 
  Layers, 
  Mountain, 
  Square, 
  Trash2, 
  Ruler, 
  Download, 
  Upload, 
  Info,
  Box,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  ShieldCheck,
  SaveIcon,
  LogOut,
  Settings,
  User as UserIcon,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  state: AppState;
  onSetStyle: (style: 'streets' | 'satellite') => void;
  onToggleTerrain: () => void;
  onToggleBuildings: () => void;
  onDrawBoundary: () => void;
  onDeleteBoundary: () => void;
  onToggleMeasure: () => void;
  onToggleBoundaryLock: () => void;
  onSelectEquipment: (def: EquipmentDef) => void;
  onDeleteSelected: () => void;
  onUpdateObject: (id: string, updates: any) => void;
  onExport: () => void;
  onImport: () => void;
  onSave: () => void;
  onAddCustomEquipment: (def: EquipmentDef) => void;
  onOpenCompliance: () => void;
  onSetUnitSystem: (unit: 'metric' | 'imperial') => void;
  onLogout: () => void;
  onLoadProject: (boundary: [number,number][], objects: any[]) => void;
  user: User | null;
  tenant: Tenant | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  state,
  onSetStyle,
  onToggleTerrain,
  onToggleBuildings,
  onDrawBoundary,
  onDeleteBoundary,
  onToggleMeasure,
  onToggleBoundaryLock,
  onSelectEquipment,
  onDeleteSelected,
  onUpdateObject,
  onExport,
  onImport,
  onSave,
  onAddCustomEquipment,
  onOpenCompliance,
  onSetUnitSystem,
  onLogout,
  onLoadProject,
  user,
  tenant,
}) => {
  const { theme, setTheme } = useTheme();
  const [modalMode, setModalMode] = React.useState<'none' | 'settings' | 'profile'>('none');
   const [disabledDefaults, setDisabledDefaults] = React.useState<Set<string>>(new Set());

  // Fetch which DEFAULT_LIBRARY items this tenant has hidden
  React.useEffect(() => {
    if (!tenant) return;
    authFetch(`/api/tenant/${tenant.id}/disabled-defaults`)
      .then(r => r.ok ? r.json() : [])
      .then((ids: string[]) => setDisabledDefaults(new Set(ids)))
      .catch(() => {});
  }, [tenant?.id]);

  const [profileData, setProfileData] = React.useState({
    name: user?.name || '',
    phone: user?.phone || '',
    password: ''
  });
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name,
        phone: user.phone || '',
        password: ''
      });
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSavingProfile(true);
    try {
      const res = await authFetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileData.name,
          phone: profileData.phone,
          password: profileData.password || undefined
        })
      });

      if (res.ok) {
        alert('Profile updated successfully! Please refresh to see changes.');
        // In a real app, we'd update the global user state here
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSavingProfile(false);
    }
  };
  const selectedObject = state.objects.find(o => o.id === state.selectedId);
  //const fullLibrary = [...DEFAULT_LIBRARY, ...state.customLibrary] 
  //.filter(item => item.isActive !== false);
  const fullLibrary = [
  ...DEFAULT_LIBRARY.filter(item => !disabledDefaults.has(item.id)),
  ...state.customLibrary.filter(item => item.isActive !== false)
];

  const selectedDef = selectedObject ? fullLibrary.find(d => d.id === selectedObject.type) : null;

  const handleManualMove = (dx: number, dz: number) => {
    if (selectedObject) {
      onUpdateObject(selectedObject.id, { 
        x: selectedObject.x + dx, 
        z: selectedObject.z + dz 
      });
    }
  };

  const handleManualRotate = (deg: number) => {
    if (selectedObject) {
      onUpdateObject(selectedObject.id, { 
        rotationY: selectedObject.rotationY + (deg * Math.PI / 180) 
      });
    }
  };

  const formatUnit = (meters: number) => {
    if (state.unitSystem === 'imperial') {
      return `${(meters * 3.28084).toFixed(1)}ft`;
    }
    return `${meters.toFixed(1)}m`;
  };

  const formatDimensions = (w: number, d: number, h: number) => {
    if (state.unitSystem === 'imperial') {
      return `${(w * 3.28084).toFixed(1)}x${(d * 3.28084).toFixed(1)}x${(h * 3.28084).toFixed(1)}ft`;
    }
    return `${w}x${d}x${h}m`;
  };

  const handleAddCustomEquipment = async (def: EquipmentDef) => {
  // Save to DB if user belongs to a tenant
  if (tenant) {
    const res = await authFetch(`/api/tenant/${tenant.id}/equipment`, {
      method: 'POST',
      body: JSON.stringify({
        id: def.id,
        name: def.name,
        category: def.category,
        width: def.width,
        depth: def.depth,
        height: def.height,
        color: def.color,
        model_url: def.modelUrl || null,
        animations_enabled: def.animationsEnabled || false
      })
    });

    if (res.ok) {
      onAddCustomEquipment(def); // update React state after DB save
    } else {
      alert('Failed to save equipment to database');
    }
  } else {
    // Platform admin has no tenant — just update state
    onAddCustomEquipment(def);
  }
};

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const name = file.name.replace('.glb', '');

    // Now calls the DB-saving version above
    handleAddCustomEquipment({
    id: `custom_${Date.now()}`,
    name: `${name} (Custom)`,
    width: 2,
    depth: 2,
    height: 2,
    color: '#9B59B6',
    category: 'custom',
    modelUrl: url
  });
  };

  const handleLoadProject = (project: any) => {
  const data = typeof project.data === 'string' 
    ? JSON.parse(project.data)  // DB stores it as JSON string
    : project.data;
    
  // if (data.siteBoundary) onSetBoundary(data.siteBoundary);
  // if (data.objects) onSetObjects(data.objects);

  // if (data.siteBoundary) onDeleteBoundary();  // clear first
  // // Note: to properly load, we need to pass data up to App.tsx
  // // For now alert the user — full load needs App.tsx wiring
  // alert(`Project "${project.name}" loaded. Boundary and objects restored.`);

  if (data.siteBoundary) onLoadProject(data.siteBoundary, data.objects || []);
};

  return (
    // <aside className="w-[280px] h-full bg-theme-bg text-theme-text flex flex-col shrink-0 overflow-y-auto border-r border-theme-border transition-colors duration-300">
    <aside className="w-[200px] lg:w-[280px] h-full bg-theme-bg text-theme-text flex flex-col shrink-0 overflow-y-auto border-r border-theme-border transition-colors duration-300">
      {/* Header */}
      <div className="p-6 border-b border-theme-border">
        <div className="flex items-center gap-2 mb-1">
          {tenant?.logo_url ? (
            <img src={tenant.logo_url} alt="Logo" className="w-6 h-6 rounded-sm object-cover" />
          ) : (
            <Box className="w-6 h-6 text-brand-teal" />
          )}
          <h1 className="text-base font-bold tracking-tight uppercase">{tenant?.name || 'EQUIPMENTSCO'}</h1>
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-[10px] opacity-30 uppercase tracking-widest font-mono">3D Site Configurator</p>
          {user && (
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-brand-teal rounded-full animate-pulse" />
                <p className="text-[11px] opacity-60 font-medium">{user.name}</p>
              </div>
              <button 
                onClick={() => setModalMode('profile')}
                className="text-[9px] text-brand-teal hover:underline font-bold uppercase tracking-tighter"
              >
                View Profile
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 space-y-6">
        {/* Map Style */}
        <section className="space-y-3">
          <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Map Style</label>
          <div className="flex p-1 bg-white/5 rounded-lg">
            <button 
              onClick={() => onSetStyle('streets')}
              className={cn(
                "flex-1 py-1.5 text-xs rounded-md transition-all",
                state.mapStyle === 'streets' ? "bg-brand-teal text-white shadow-lg" : "opacity-60 hover:opacity-100"
              )}
            >
              Streets
            </button>
            <button 
              onClick={() => onSetStyle('satellite')}
              className={cn(
                "flex-1 py-1.5 text-xs rounded-md transition-all",
                state.mapStyle === 'satellite' ? "bg-brand-teal text-white shadow-lg" : "opacity-60 hover:opacity-100"
              )}
            >
              Satellite
            </button>
          </div>
        </section>

        {/* Terrain */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mountain className="w-4 h-4 opacity-60" />
              <span className="text-sm">3D Terrain</span>
            </div>
            <button 
              onClick={onToggleTerrain}
              className={cn(
                "w-10 h-5 rounded-full transition-colors relative",
                state.terrainEnabled ? "bg-brand-teal" : "bg-white/20"
              )}
            >
              <div className={cn(
                "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                state.terrainEnabled ? "left-6" : "left-1"
              )} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 opacity-60" />
              <span className="text-sm">3D Buildings</span>
            </div>
            <button 
              onClick={onToggleBuildings}
              className={cn(
                "w-10 h-5 rounded-full transition-colors relative",
                state.buildingsEnabled ? "bg-brand-teal" : "bg-white/20"
              )}
            >
              <div className={cn(
                "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                state.buildingsEnabled ? "left-6" : "left-1"
              )} />
            </button>
          </div>
        </section>

        {/* Draw Tools */}
        <section className="space-y-3">
          <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Draw Tools</label>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={onDrawBoundary}
              disabled={state.isBoundaryLocked}
              className={cn(
                "flex items-center justify-center gap-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-colors",
                state.isBoundaryLocked && "opacity-30 cursor-not-allowed"
              )}
            >
              <Square className="w-4 h-4" />
              Boundary
            </button>
            <button 
              onClick={onDeleteBoundary}
              disabled={state.isBoundaryLocked}
              className={cn(
                "flex items-center justify-center gap-2 p-2 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition-colors",
                state.isBoundaryLocked && "opacity-30 cursor-not-allowed"
              )}
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
          <button 
            onClick={onToggleBoundaryLock}
            className={cn(
              "w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs transition-all border",
              state.isBoundaryLocked ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "bg-white/5 border-transparent hover:bg-white/10 opacity-60"
            )}
          >
            {state.isBoundaryLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            {state.isBoundaryLocked ? 'Boundary Locked' : 'Lock Boundary'}
          </button>
        </section>

        {/* Measure Tool */}
        <section className="space-y-2">
          <button 
            onClick={onToggleMeasure}
            className={cn(
              "w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs transition-all border",
              state.measurePoints.length > 0 ? "bg-brand-teal border-brand-teal text-white" : "bg-white/5 border-transparent hover:bg-white/10"
            )}
          >
            <Ruler className="w-4 h-4" />
            Measure Tool
          </button>

          <button 
            onClick={onOpenCompliance}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs transition-all border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
          >
            <ShieldCheck className="w-4 h-4" />
            Compliance Engine
          </button>
        </section>

        {/* Equipment Library */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Equipment Library Active: {fullLibrary.length}</label>
            <label className="cursor-pointer group">
              <input type="file" accept=".glb" className="hidden" onChange={handleModelUpload} />
              <div className="flex items-center gap-1 text-[10px] text-brand-teal hover:text-brand-teal/80 transition-colors">
                <Upload className="w-3 h-3" />
                <span>Add GLB</span>
              </div>
            </label>
          </div>
          <div className={cn(
            "space-y-2 max-h-[300px] overflow-y-auto pr-2",
            state.siteBoundary.length === 0 && "opacity-30 pointer-events-none"
          )}>
            {state.siteBoundary.length === 0 && (
              <p className="text-[10px] opacity-40 italic mb-2">Draw a site boundary first</p>
            )}
            {fullLibrary.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectEquipment(item)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-left transition-all group",
                  state.pendingPlacement?.id === item.id && "ring-1 ring-brand-teal bg-brand-teal/10"
                )}
              >
                <div 
                  className="w-8 h-8 rounded shrink-0 shadow-inner flex items-center justify-center overflow-hidden" 
                  style={{ backgroundColor: item.color }}
                >
                  {item.modelUrl && <Box className="w-4 h-4 text-white/20" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.name}</p>
                  <p className="text-[10px] opacity-40 font-mono">{formatDimensions(item.width, item.depth, item.height)}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Selected Object Inspector */}
        {selectedObject && (
          <section className="p-4 bg-brand-teal/10 border border-brand-teal/20 rounded-xl space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-brand-teal uppercase tracking-wider">Inspector</h3>
              <button onClick={onDeleteSelected} className="text-red-400 hover:text-red-300">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{selectedDef?.name}</p>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono opacity-60">
                <div>X: {formatUnit(selectedObject.x)}</div>
                <div>Z: {formatUnit(selectedObject.z)}</div>
                <div>Rot: {(selectedObject.rotationY * 180 / Math.PI).toFixed(0)}°</div>
              </div>
            </div>

            {/* Color Picker */}
            <div className="pt-2 border-t border-white/10">
              <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2 block">Appearance</label>
              <div className="flex flex-wrap gap-2">
                {['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#8E24AA', '#F06292', '#00ACC1', '#795548', '#455A64'].map((color) => (
                  <button
                    key={color}
                    onClick={() => onUpdateObject(selectedObject.id, { color })}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all",
                      (selectedObject.color || selectedDef?.color) === color ? "border-white scale-110 shadow-lg" : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input 
                  type="color" 
                  value={selectedObject.color || selectedDef?.color || '#4285F4'}
                  onChange={(e) => onUpdateObject(selectedObject.id, { color: e.target.value })}
                  className="w-6 h-6 rounded-full bg-transparent border-none cursor-pointer overflow-hidden"
                />
              </div>
            </div>

            {/* Manual Controls */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <div className="flex flex-col items-center gap-1">
                <button 
                  onClick={() => handleManualMove(0, -0.5)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleManualMove(-0.5, 0)}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleManualMove(0, 0.5)}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleManualMove(0.5, 0)}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => handleManualRotate(-5)}
                  className="flex flex-col items-center gap-1 p-2 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors group"
                >
                  <RotateCcw className="w-4 h-4 opacity-40 group-hover:text-brand-teal" />
                  <span className="text-[8px] uppercase tracking-tighter">-5°</span>
                </button>
                <button 
                  onClick={() => handleManualRotate(5)}
                  className="flex flex-col items-center gap-1 p-2 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors group"
                >
                  <RotateCw className="w-4 h-4 opacity-40 group-hover:text-brand-teal" />
                  <span className="text-[8px] uppercase tracking-tighter">+5°</span>
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-theme-border bg-black/20">
        <button 
          onClick={onSave}
          className="w-full flex items-center justify-center gap-2 py-2 mb-2 bg-brand-teal text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-brand-teal/20 hover:bg-brand-teal/90"
        >
          <SaveIcon className="w-4 h-4" />
          Save Project
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={onExport}
            className="flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-colors"
          >
            <Upload className="w-3 h-3" />
            Export
          </button>
          <button 
            onClick={onImport}
            className="flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-colors"
          >
            <Download className="w-3 h-3" />
            Import
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => setModalMode('settings')}
            className="flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-colors"
          >
            <Settings className="w-3 h-3" />
            Settings
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-red-500/20 opacity-60 hover:opacity-100 hover:text-red-400 rounded-lg text-xs transition-colors border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-3 h-3" />
            Logout
          </button>
        </div>
        <div className="mt-4 flex justify-between text-[9px] opacity-30 font-mono uppercase tracking-tighter">
          <span>Del · Esc · R · M · G</span>
          <span>v1.0</span>
        </div>
      </div>

      {/* Settings/Profile Modal */}
      <AnimatePresence>
        {modalMode !== 'none' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-theme-bg border border-theme-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-theme-border flex justify-between items-center">
                <h3 className="text-lg font-bold">{modalMode === 'profile' ? 'Profile' : 'Settings'}</h3>
                <button 
                  onClick={() => setModalMode('none')}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 opacity-40" />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {modalMode === 'profile' && (
                  <section className="space-y-4">
                    <h4 className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Profile Settings</h4>
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Full Name</label>
                        <input 
                          type="text"
                          value={profileData.name}
                          onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                          className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Mobile Number</label>
                        <input 
                          type="tel"
                          value={profileData.phone}
                          onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                          className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">New Password (Optional)</label>
                        <input 
                          type="password"
                          value={profileData.password}
                          onChange={e => setProfileData({ ...profileData, password: e.target.value })}
                          className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                          placeholder="Leave blank to keep current"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={isSavingProfile}
                        className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                      >
                        {isSavingProfile ? 'Saving...' : 'Update Profile'}
                      </button>
                    </form>
                  </section>
                )}

                {modalMode === 'settings' && (
                  <>
                    <section className="space-y-4">
                      <h4 className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Appearance</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => setTheme('dark')}
                          className={cn(
                            "p-4 rounded-xl border transition-all flex flex-col items-center gap-3",
                            theme === 'dark' ? "bg-brand-teal/20 border-brand-teal text-brand-teal" : "bg-white/5 border-theme-border opacity-40 hover:opacity-100 hover:bg-white/10"
                          )}
                        >
                          <Moon className="w-6 h-6" />
                          <span className="text-xs font-bold uppercase tracking-widest">Dark Mode</span>
                        </button>
                        <button 
                          onClick={() => setTheme('light')}
                          className={cn(
                            "p-4 rounded-xl border transition-all flex flex-col items-center gap-3",
                            theme === 'light' ? "bg-brand-teal/20 border-brand-teal text-brand-teal" : "bg-white/5 border-theme-border opacity-40 hover:opacity-100 hover:bg-white/10"
                          )}
                        >
                          <Sun className="w-6 h-6" />
                          <span className="text-xs font-bold uppercase tracking-widest">Light Mode</span>
                        </button>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h4 className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Unit System</h4>
                      <div className="flex p-1 bg-white/5 rounded-lg">
                        <button 
                          onClick={() => onSetUnitSystem('metric')}
                          className={cn(
                            "flex-1 py-1.5 text-xs rounded-md transition-all",
                            state.unitSystem === 'metric' ? "bg-brand-teal text-white shadow-lg" : "opacity-60 hover:opacity-100"
                          )}
                        >
                          Metric (m)
                        </button>
                        <button 
                          onClick={() => onSetUnitSystem('imperial')}
                          className={cn(
                            "flex-1 py-1.5 text-xs rounded-md transition-all",
                            state.unitSystem === 'imperial' ? "bg-brand-teal text-white shadow-lg" : "opacity-60 hover:opacity-100"
                          )}
                        >
                          Imperial (ft)
                        </button>
                      </div>
                    </section>
                  </>
                )}
              </div>

              <div className="p-6 border-t border-theme-border flex justify-end">
                <button 
                  onClick={() => setModalMode('none')}
                  className="px-6 py-2 bg-brand-teal text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-brand-teal/90 transition-all shadow-lg shadow-brand-teal/20"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};
