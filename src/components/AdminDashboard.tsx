import React, { useState, useEffect } from 'react';
import { authFetch } from '../utils/api';
import { User, Tenant, EquipmentDef, DEFAULT_LIBRARY } from '../types';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings, 
  User as UserIcon,
  Plus, 
  Search, 
  Box, 
  TrendingUp,
  LogOut,
  ChevronRight,
  Pencil,
  Trash2,
  X,
  Moon,
  Sun,
  KeyRound,
  Upload,
  Activity,
  Clock,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { v4 as uuidv4 } from 'uuid';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  user: User;
  tenant: Tenant;
  onLogout: () => void;
}

export function AdminDashboard({ user, tenant, onLogout }: Props) {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'equipment' | 'users' | 'settings' | 'profile' | 'resets'| 'logs'>('overview');
  const [equipment, setEquipment] = useState<EquipmentDef[]>([]);
  const [isAddingEquipment, setIsAddingEquipment] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentDef | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [salesRepCount, setSalesRepCount] = useState(0);
  const [newEquipment, setNewEquipment] = useState<Partial<EquipmentDef>>({
    name: '',
    category: 'slides',
    width: 5,
    depth: 5,
    height: 5,
    color: '#14b8a6',
    animationsEnabled: false
  });

  const [resetRequests, setResetRequests] = useState<any[]>([]);
  const [tempPasswords, setTempPasswords] = useState<Record<string, string>>({});
  const [ResetCount, setResetCount] = useState(0);

  const [logs, setLogs] = useState<any[]>([]);
  const [logFilter, setLogFilter] = useState('all');
  //const [disabledDefaults, setDisabledDefaults] = useState<string[]>([]);
  const [disabledDefaults, setDisabledDefaults] = useState<Set<string>>(new Set());

  const fetchLogs = async () => {
  const res = await authFetch(`/api/tenant/${tenant.id}/logs?limit=100`);
  if (res.ok) {
    const data = await res.json();
    setLogs(data);
  }
};

  const fetchResetRequests = async () => {
  const res = await authFetch(`/api/admin/reset-requests`);
  if (res.ok) {
    const data = await res.json();
    setResetRequests(data);
    setResetCount(data.length);
  }
};

const fetchSalesRepCount = async () => {
  const res = await authFetch(`/api/tenant/${tenant.id}/users`);
  if (res.ok) {
    const data = await res.json();
    const count = data.filter((u: any) => u.role === 'sales_rep').length;
    setSalesRepCount(count);
  }
};

const fetchEquipment = async () => {
  const res = await authFetch(`/api/tenant/${tenant.id}/equipment`);
  if (res.ok) {
    const data = await res.json();
    const mapped = data.map((eq: any) => ({
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
    setEquipment(mapped);
  }
};

// Add equipment stats state and fetch:
const [equipmentStats, setEquipmentStats] = useState({ total: 0, active: 0, inactive: 0 });

const fetchEquipmentStats = async () => {
  const res = await authFetch(`/api/tenant/${tenant.id}/equipment/stats`);
  if (res.ok) {
    const data = await res.json();
    setEquipmentStats(data);
  }
};

  const fetchDisabledDefaults = async () => {
    const res = await authFetch(`/api/tenant/${tenant.id}/disabled-defaults`);
    if (res.ok) {
      const ids: string[] = await res.json();
      setDisabledDefaults(new Set(ids));
    }
  };

  useEffect(() => {
    fetchEquipment();
    fetchEquipmentStats();
    fetchDisabledDefaults();
    fetchSalesRepCount();
    fetchLogs();
    fetchResetRequests();
      const interval = setInterval(() => {
    fetchResetRequests();
  }, 5000);

  return () => clearInterval(interval);
  }, [tenant.id]);

//   // Toggle handler for active/inactive status
//   const handleToggleDefault = async (equipmentId: string, currentlyDisabled: boolean) => {
//   const res = await authFetch(`/api/tenant/${tenant.id}/disabled-defaults/${equipmentId}`, {
//     method: 'POST',
//     body: JSON.stringify({ disable: !currentlyDisabled })
//   });
//   if (res.ok) {
//     fetchDisabledDefaults();
//     fetchEquipmentStats();
//   }
// }; 

  // Add resolve handler
  const handleResolveReset = async (requestId: string) => {
  const tempPwd = tempPasswords[requestId];
  if (!tempPwd || tempPwd.length < 8) {
    return alert('Temp password must be at least 8 characters');
  }

  const res = await authFetch(`/api/admin/reset-requests/${requestId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ temp_password: tempPwd })
  });

  if (res.ok) {
    alert('Temporary password set. Share it with the user.');
    fetchResetRequests();
  }
};

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = uuidv4();
    const res = await authFetch(`/api/tenant/${tenant.id}/equipment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newEquipment, id, image_url: newEquipment.imageUrl || null, is_active: newEquipment.isActive !== false ? 1 : 0 })
    });

    if (res.ok) {
      setIsAddingEquipment(false);
      setNewEquipment({
        name: '',
        category: 'slides',
        width: 5,
        depth: 5,
        height: 5,
        color: '#14b8a6',
        animationsEnabled: false,
        imageUrl: ''
      });
      fetchEquipment();
    }
  };

  const handleUpdateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquipment) return;

    const res = await authFetch(`/api/tenant/${tenant.id}/equipment/${editingEquipment.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({...editingEquipment, image_url: editingEquipment.imageUrl || null, is_active: editingEquipment.isActive !== false ? 1 : 0})
    });

    if (res.ok) {
      setEditingEquipment(null);
      fetchEquipment();
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this equipment?')) return;

    const res = await authFetch(`/api/tenant/${tenant.id}/equipment/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      fetchEquipment();
    }
  };

  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    const res = await authFetch(`/api/tenant/${tenant.id}/equipment/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: currentlyActive ? 0 : 1 })
    });

  //   if (res.ok) {
  //     // Optimistically update the UI immediately
  //     setEquipment(equipment.map(eq => 
  //       eq.id === id ? { ...eq, isActive: !currentlyActive } : eq
  //     ));
  //     // Then fetch fresh data from server
  //     await fetchEquipment();
  //     await fetchEquipmentStats();
  //   }
  // };

  if (res.ok) {
      fetchEquipmentStats(); // just refresh counts, equipment list is already updated
    } else {
      // Revert on failure
      setEquipment(prev => prev.map(eq => eq.id === id ? { ...eq, isActive: currentlyActive } : eq));
    }
  };


//   const fetchDisabledDefaults = async () => {
//   const res = await authFetch(`/api/tenant/${tenant.id}/disabled-defaults`);
//   if (res.ok) {
//     const data = await res.json();
//     setDisabledDefaults(data);
//   }
// };

  // Toggle a DEFAULT_LIBRARY item on/off for this tenant
  const handleToggleDefault = async (equipmentId: string) => {
    const isCurrentlyDisabled = disabledDefaults.has(equipmentId);
    // Optimistic update
    setDisabledDefaults(prev => {
      const next = new Set(prev);
      isCurrentlyDisabled ? next.delete(equipmentId) : next.add(equipmentId);
      return next;
    });

    const res = await authFetch(`/api/tenant/${tenant.id}/disabled-defaults/${equipmentId}`, {
      method: 'POST',
    });

    if (!res.ok) {
      // Revert on failure
      setDisabledDefaults(prev => {
        const next = new Set(prev);
        isCurrentlyDisabled ? next.add(equipmentId) : next.delete(equipmentId);
        return next;
      });
    }
  };

  return (
    <div className="flex h-screen w-screen bg-theme-bg text-theme-text overflow-auto transition-colors duration-300">
      {/* Sidebar */}
      {/* <aside className="w-64 border-r border-theme-border flex flex-col"> */}
      <aside className="w-48 lg:w-64 shrink-0 border-r border-theme-border flex flex-col overflow-y-auto">
        <div className="p-6 border-b border-theme-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src={tenant.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
              <div>
                <h1 className="text-sm font-bold truncate">{tenant.name}</h1>
                <p className="text-[10px] opacity-40 uppercase tracking-widest">Admin Portal</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('profile')}
            className={clsx(
              "w-full flex items-center gap-3 p-2 rounded-lg transition-all text-xs font-bold uppercase tracking-widest group",
              activeTab === 'profile' ? "bg-brand-teal/10 text-brand-teal" : "opacity-40 hover:opacity-100 hover:bg-white/5"
            )}
          >
            <UserIcon className="w-4 h-4" />
            View Profile
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavButton 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')}
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Overview"
          />
          <NavButton
            active={activeTab === 'resets'}
            onClick={() => setActiveTab('resets')}
            icon={<KeyRound className="w-4 h-4" />}
            label="Password Resets"
            badge={ResetCount > 0 ? ResetCount : undefined}
          />
          <NavButton
            active={activeTab === 'logs'}
            onClick={() => setActiveTab('logs')}
            icon={<Activity className="w-4 h-4" />}
            label="Activity Logs"
          />
          <NavButton 
            active={activeTab === 'equipment'} 
            onClick={() => setActiveTab('equipment')}
            icon={<Package className="w-4 h-4" />}
            label="Equipment Repo"
          />
          <NavButton 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')}
            icon={<Users className="w-4 h-4" />}
            label="Sales Team"
          />
          <NavButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            icon={<Settings className="w-4 h-4" />}
            label="Settings"
          />
        </nav>

        <div className="p-4 border-t border-theme-border">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 p-3 opacity-40 hover:opacity-100 hover:bg-white/5 rounded-xl transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      {/* <main className="flex-1 overflow-y-auto p-8 custom-scrollbar"> */}
      <main className="flex-1 overflow-auto p-4 lg:p-8 custom-scrollbar min-w-0">
        <header className="flex justify-between items-center mb-8">
          {/* <div>
            <h2 className="text-2xl font-bold tracking-tight"> */}
            <div className="min-w-0 flex-1 mr-4">
              <h2 className="text-lg lg:text-2xl font-bold tracking-tight truncate">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'equipment' && 'Equipment Repository'}
              {activeTab === 'users' && 'Sales Team Management'}
              {activeTab === 'settings' && 'Company Settings'}
              {activeTab === 'profile' && 'Profile'}
              {activeTab === 'resets' && 'Password Reset Requests'}
              {activeTab === 'logs' && 'Activity Logs'}
            </h2>
            <p className="text-sm opacity-40">Welcome back, {user.name}</p>
          </div>
          
          {/* {(activeTab === 'equipment' || activeTab === 'users') && (
            // <button 
            //   onClick={() => activeTab === 'equipment' ? setIsAddingEquipment(true) : setIsAddingUser(true)}
            //   className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-brand-teal/90 transition-all shadow-lg shadow-brand-teal/20"
            // >
            //   <Plus className="w-4 h-4" />
            //   {activeTab === 'equipment' ? 'Add New Equipment' : 'Add Person'}
            // </button>
            <button 
            // onClick={() => activeTab === 'equipment' ? setIsAddingEquipment(true) : setIsAddingUser(true)}
            onClick={() => {
  if (activeTab === 'equipment') {
    setEditingEquipment(null); // clear edit mode
    setNewEquipment({
      name: '',
      category: 'slides',
      width: 5,
      depth: 5,
      height: 5,
      color: '#14b8a6',
      animationsEnabled: false,
      imageUrl: '' 
    });
    setIsAddingEquipment(true);
  } else {
    setIsAddingUser(true);
  }
}}
            className="flex items-center gap-1 lg:gap-2 px-2 lg:px-4 py-2 bg-brand-teal text-white text-[10px] lg:text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-brand-teal/90 transition-all shadow-lg shadow-brand-teal/20 shrink-0"
            > */}

        {(activeTab === 'equipment' || activeTab === 'users') && (
          <div className="flex items-center gap-3 shrink-0">
      {/*  Show user count badge only on users tab */}
      {activeTab === 'users' && (
        <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-white/5 border border-theme-border rounded-lg">
          {/* We need to pass the count down — see below */}
          Sales Reps: {salesRepCount} / 10
        </span>
      )}
  <button
    onClick={() => activeTab === 'equipment' ? setIsAddingEquipment(true) : setIsAddingUser(true)}
    disabled={activeTab === 'users' && salesRepCount >= 10} // disable at limit
      className={clsx(
    "flex items-center gap-1 lg:gap-2 px-2 lg:px-4 py-2 text-[10px] lg:text-xs font-bold uppercase tracking-widest rounded-lg transition-all shadow-lg shrink-0",
    activeTab === 'users' && salesRepCount >= 10
      ? "bg-white/10 text-white/30 cursor-not-allowed shadow-none" // greyed out
      : "bg-brand-teal text-white hover:bg-brand-teal/90 shadow-brand-teal/20"
  )}
>
            <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
            <span className="hidden sm:inline">{activeTab === 'equipment' ? 'Add New Equipment' : 'Add Person'}</span>
            <span className="sm:hidden"><Plus className="w-3 h-3" /></span>
            </button>
            </div>
           )}
        </header>

        {activeTab === 'overview' && <OverviewTab tenant={tenant} equipmentStats={equipmentStats} />}
        {activeTab === 'equipment' && (

            <div className="flex items-center gap-3 mb-6 flex-wrap">
    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
      Active: {equipmentStats.active}
    </span>
    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg">
      Inactive: {equipmentStats.inactive}
    </span>
    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-white/5 border border-theme-border rounded-lg">
      Total: {equipmentStats.total}
    </span>
  </div>
)}
        {activeTab === 'equipment' && (
          <EquipmentTab 
            equipment={equipment} 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isAdding={isAddingEquipment}
            setIsAdding={setIsAddingEquipment}
            editingItem={editingEquipment}
            setEditingItem={setEditingEquipment}
            newEquipment={newEquipment}
            setNewEquipment={setNewEquipment}
            onAdd={handleAddEquipment}
            onUpdate={handleUpdateEquipment}
            onDelete={handleDeleteEquipment}
            onToggleActive={handleToggleActive}
            disabledDefaults={disabledDefaults}
            onToggleDefault={handleToggleDefault}
          />
        )}
        {activeTab === 'users' && (
          <UsersTab 
            tenant={tenant}
            isAdding={isAddingUser}
            setIsAdding={setIsAddingUser}
            salesRepCount={salesRepCount}
            setSalesRepCount={setSalesRepCount}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab theme={theme} onThemeChange={setTheme} />
        )}
                {activeTab === 'profile' && (
                  <ProfileTab user={user} />
                )}
        
                {activeTab === 'logs' && (() => {
          const filteredLogs = logFilter === 'all'
            ? logs
            : logs.filter(l => l.entity_type === logFilter);
        
          return (
            <div className="space-y-4">
              {/* Filter bar */}
              <div className="flex items-center gap-2 flex-wrap">
                {['all', 'auth', 'sales_rep', 'equipment', 'project', 'password_reset', 'profile'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setLogFilter(filter)}
                    className={clsx(
                      "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all border",
                      logFilter === filter
                        ? "bg-brand-teal text-white border-brand-teal"
                        : "bg-white/5 border-theme-border opacity-60 hover:opacity-100"
                    )}
                  >
                    {filter === 'all' ? 'All Activity' : filter.replace('_', ' ')}
                  </button>
                ))}
              </div>
        
              {/* Log entries */}
              <div className="space-y-2">
                {filteredLogs.length === 0 ? (
                  <div className="py-20 text-center border border-dashed border-theme-border rounded-2xl">
                    <Activity className="w-12 h-12 opacity-10 mx-auto mb-4" />
                    <p className="text-sm opacity-40 italic">No activity logs found.</p>
                  </div>
                ) : (
                  filteredLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-4 p-4 bg-theme-card border border-theme-border rounded-xl hover:bg-white/5 transition-colors">
                      <div className={clsx(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                        log.action === 'CREATE' && "bg-emerald-500/20 text-emerald-400",
                        log.action === 'UPDATE' && "bg-blue-500/20 text-blue-400",
                        log.action === 'DELETE' && "bg-red-500/20 text-red-400",
                        log.action === 'LOGIN' && "bg-brand-teal/20 text-brand-teal",
                        log.action === 'SAVE' && "bg-purple-500/20 text-purple-400",
                        log.action === 'REQUEST' && "bg-amber-500/20 text-amber-400",
                        log.action === 'RESOLVE' && "bg-emerald-500/20 text-emerald-400",
                      )}>
                        {log.action === 'CREATE' && <Plus className="w-4 h-4" />}
                        {log.action === 'UPDATE' && <Pencil className="w-4 h-4" />}
                        {log.action === 'DELETE' && <Trash2 className="w-4 h-4" />}
                        {log.action === 'LOGIN' && <UserIcon className="w-4 h-4" />}
                        {log.action === 'SAVE' && <ShieldCheck className="w-4 h-4" />}
                        {log.action === 'REQUEST' && <KeyRound className="w-4 h-4" />}
                        {log.action === 'RESOLVE' && <ShieldCheck className="w-4 h-4" />}
                      </div>
        
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={clsx(
                              "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded",
                              log.action === 'CREATE' && "bg-emerald-500/20 text-emerald-400",
                              log.action === 'UPDATE' && "bg-blue-500/20 text-blue-400",
                              log.action === 'DELETE' && "bg-red-500/20 text-red-400",
                              log.action === 'LOGIN' && "bg-brand-teal/20 text-brand-teal",
                              log.action === 'SAVE' && "bg-purple-500/20 text-purple-400",
                              log.action === 'REQUEST' && "bg-amber-500/20 text-amber-400",
                              log.action === 'RESOLVE' && "bg-emerald-500/20 text-emerald-400",
                            )}>
                              {log.action}
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                              {log.entity_type.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] opacity-30 shrink-0">
                            <Clock className="w-3 h-3" />
                            {/* {new Date(log.created_at + 'Z').toLocaleString()} */}
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </div>
                        <p className="text-sm font-medium mt-1 truncate">{log.entity_name || '—'}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-[10px] opacity-40">by {log.user_name}</span>
                          {log.details && <span className="text-[10px] opacity-30 truncate">{log.details}</span>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })()}
        
      {activeTab === 'resets' && (
  <div className="space-y-4">
    {resetRequests.length === 0 ? (
      <div className="py-20 text-center border border-dashed border-theme-border rounded-2xl">
        <p className="text-sm opacity-40 italic">No pending password reset requests.</p>
      </div>
    ) : (
      resetRequests.map(req => (
        <div key={req.id} className="p-6 bg-theme-card border border-theme-border rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">{req.user_name}</p>
              <p className="text-xs opacity-40">{req.email}</p>
              <p className="text-[10px] opacity-30 mt-1">
                Requested: {new Date(req.created_at).toLocaleString()}
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-amber-500/20 text-amber-400 rounded">
              Pending
            </span>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Set temporary password (min 8 chars)"
              value={tempPasswords[req.id] || ''}
              onChange={e => setTempPasswords({ ...tempPasswords, [req.id]: e.target.value })}
              className="flex-1 bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
            />
            <button
              onClick={() => handleResolveReset(req.id)}
              className="px-4 py-2 bg-brand-teal text-white text-xs font-bold rounded-lg hover:bg-brand-teal/90 transition-all"
            >
              Set & Resolve
            </button>
          </div>
        </div>
      ))
    )}
  </div>
)}
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label, badge }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: number }) {
  return (
    <button 
      onClick={onClick}
      className={clsx(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm group",
        active ? "bg-brand-teal text-white shadow-lg shadow-brand-teal/10" : "opacity-60 hover:opacity-100 hover:bg-white/5"
      )}
    >
      <div className={clsx(active ? "text-white" : "opacity-40 group-hover:opacity-100")}>
        {icon}
      </div>
      {label}
      
              {badge !== undefined && (
                <span className={clsx(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                  active ? "bg-white/20 text-white" : "bg-amber-500/20 text-amber-400"
                )}>
                  {badge}
                </span>
              )}
    </button>
  );
}

function OverviewTab({ tenant, equipmentStats }: { tenant: Tenant, equipmentStats: { total: number, active: number, inactive: number } }) {
  return (
    <div className="space-y-8">
      {/* <div className="grid grid-cols-3 gap-6"> */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"> */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        <StatCard label="Active Projects" value="24" trend="+12%" icon={<LayoutDashboard className="w-5 h-5" />} />
        <StatCard label="Total Equipment" value={equipmentStats.total.toString()} trend={`${equipmentStats.active} active`} icon={<Package className="w-5 h-5" />} />
        <StatCard label="Sales Activity" value="89%" trend="+2%" icon={<TrendingUp className="w-5 h-5" />} />
      </div>

      <div className="p-6 bg-theme-card border border-theme-border rounded-2xl">
        <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-theme-border">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-teal/10 rounded-lg flex items-center justify-center">
                  <Box className="w-5 h-5 text-brand-teal" />
                </div>
                <div>
                  <p className="text-sm font-medium">New Project: "Waterfront Resort"</p>
                  <p className="text-[10px] opacity-40 uppercase tracking-widest">Created by John Sales · 2h ago</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 opacity-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EquipmentTab({ 
  equipment, 
  searchQuery, 
  setSearchQuery,
  isAdding,
  setIsAdding,
  editingItem,
  setEditingItem,
  newEquipment,
  setNewEquipment,
  onAdd,
  onUpdate,
  onDelete,
  onToggleActive,
  disabledDefaults,
  onToggleDefault
}: { 
  equipment: EquipmentDef[],
  searchQuery: string,
  setSearchQuery: (q: string) => void,
  isAdding: boolean,
  setIsAdding: (b: boolean) => void,
  editingItem: EquipmentDef | null,
  setEditingItem: (i: EquipmentDef | null) => void,
  newEquipment: Partial<EquipmentDef>,
  setNewEquipment: (e: Partial<EquipmentDef>) => void,
  onAdd: (e: React.FormEvent) => void,
  onUpdate: (e: React.FormEvent) => void,
  onDelete: (id: string) => void,
  onToggleActive: (id: string, currentlyActive: boolean) => void,
  //disabledDefaults: string[],
  //onToggleDefault: (id: string, currentlyDisabled: boolean) => void
  disabledDefaults: Set<string>,
  onToggleDefault: (id: string) => void;
}) {
  const filteredEquipment = equipment.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredDefaults = DEFAULT_LIBRARY.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

return (
  
  <div className="space-y-6">

    {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
        <input 
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search equipments by name or category..."
          className="w-full bg-white/5 border border-theme-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
        />
      </div>

      {/* Add/Edit Form Overlay */}
      {(isAdding || editingItem) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            //className="bg-theme-bg border border-theme-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
            // Add max-height and overflow scroll
            className="bg-theme-bg border border-theme-border rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
            >
            <div className="p-6 border-b border-theme-border flex justify-between items-center">
              <h3 className="text-lg font-bold">
                {isAdding ? 'Add New Equipment' : `Edit ${editingItem?.name}`}
              </h3>
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setEditingItem(null);
                    setNewEquipment({
    name: '',
    category: 'slides',
    width: 5,
    depth: 5,
    height: 5,
    color: '#14b8a6',
    animationsEnabled: false,
    imageUrl: ''
  });
                }}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 opacity-40" />
              </button>
            </div>

            {/* <form onSubmit={isAdding ? onAdd : onUpdate} className="p-6 space-y-6"> */}
             {/* Make form scrollable */}
            <form onSubmit={isAdding ? onAdd : onUpdate} className="p-4 lg:p-6 space-y-4 lg:space-y-6 overflow-y-auto flex-1">
              {/* <div className="grid grid-cols-2 gap-6"> */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">

  {/* Image upload — square aspect ratio */}
  <div className="space-y-2">
    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Equipment Image</label>
    <div className="relative">
      <div className="aspect-square w-full bg-white/5 border-2 border-dashed border-theme-border rounded-xl overflow-hidden flex items-center justify-center cursor-pointer hover:border-brand-teal/50 transition-colors group"
       onClick={() => document.getElementById('equipment-image-upload')?.click()}
      >
        {(isAdding ? newEquipment.imageUrl : editingItem?.imageUrl) ? (
          <img
            //src={isAdding ? newEquipment.imageUrl ?? '' : editingItem?.imageUrl ?? ''}
            src={isAdding ? newEquipment.imageUrl : editingItem?.imageUrl ?? ''}
            alt="Equipment"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-30 group-hover:opacity-60 transition-opacity">
            <Upload className="w-8 h-8" />
            <span className="text-[10px] uppercase tracking-widest">Upload Image</span>
            <p className="text-[10px] opacity-30 text-center mt-1">
  Max 1MB · Auto-compressed · Square crop
</p>
          </div>
          
        )}
      </div>
      <input
        id="equipment-image-upload"
        type="file"
        accept="image/*"
        className="hidden"

        onChange={async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const MAX_SIZE = 1 * 1024 * 1024; // 1MB

  const compressImage = (file: File, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (re) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          
          // Maintain square aspect ratio — use the smaller dimension
          const size = Math.min(img.width, img.height);
          canvas.width = size;
          canvas.height = size;
          
          const ctx = canvas.getContext('2d')!;
          // Center crop to square
          const offsetX = (img.width - size) / 2;
          const offsetY = (img.height - size) / 2;
          ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);
          
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = re.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Check original size
  if (file.size > MAX_SIZE) {
    // Auto compress to fit under 1MB
    const compressed = await compressImage(file, 0.7);
    
    // Check if compression was enough
    const compressedSize = Math.round((compressed.length * 3) / 4); // base64 to bytes
    
    if (compressedSize > MAX_SIZE) {
      // Try harder compression
      const moreCompressed = await compressImage(file, 0.4);
      const moreCompressedSize = Math.round((moreCompressed.length * 3) / 4);
      
      if (moreCompressedSize > MAX_SIZE) {
        alert('Image is too large to compress under 1MB. Please use a smaller image.');
        e.target.value = ''; // reset input
        return;
      }
      
      alert('Image was automatically compressed to fit under 1MB.');
      if (isAdding) {
        setNewEquipment({ ...newEquipment, imageUrl: moreCompressed });
      } else {
        setEditingItem({ ...editingItem!, imageUrl: moreCompressed });
      }
      return;
    }

    alert('Image was automatically compressed to fit under 1MB.');
    if (isAdding) {
      setNewEquipment({ ...newEquipment, imageUrl: compressed });
    } else {
      setEditingItem({ ...editingItem!, imageUrl: compressed });
    }
    return;
  }

  // Image is within 1MB — still crop to square for consistency
  const base64 = await compressImage(file, 0.9);
  if (isAdding) {
    setNewEquipment({ ...newEquipment, imageUrl: base64 });
  } else {
    setEditingItem({ ...editingItem!, imageUrl: base64 });
  }
}}
      />
      {(isAdding ? newEquipment.imageUrl : editingItem?.imageUrl) && (
        <button
          type="button"
          onClick={() => isAdding
            ? setNewEquipment({ ...newEquipment, imageUrl: '' })
            : setEditingItem({ ...editingItem!, imageUrl: '' })
          }
          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  </div>

  {/* Name + Category stacked */}
  <div className="md:col-span-2 space-y-4">
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Equipment Name</label>
      <input
        required
        type="text"
        value={isAdding ? newEquipment.name : editingItem?.name}
        onChange={e => isAdding ? setNewEquipment({ ...newEquipment, name: e.target.value }) : setEditingItem({ ...editingItem!, name: e.target.value })}
        className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
        placeholder="e.g. Spiral Slide"
      />
    </div>
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Category</label>
      <select
        value={isAdding ? newEquipment.category : editingItem?.category}
        onChange={e => isAdding ? setNewEquipment({ ...newEquipment, category: e.target.value }) : setEditingItem({ ...editingItem!, category: e.target.value })}
        className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
      >
        <option value="slides">Slides</option>
        <option value="pools">Pools</option>
        <option value="facilities">Facilities</option>
        <option value="amenities">Amenities</option>
      </select>
    </div>
  </div>
</div>

{/* Row 2 — Dimensions */}
<div className="grid grid-cols-3 gap-4">
  <div className="space-y-2">
    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Width (m)</label>
    <input required type="number" step="0.1"
      value={isAdding ? newEquipment.width : editingItem?.width}
      onChange={e => isAdding ? setNewEquipment({ ...newEquipment, width: parseFloat(e.target.value) }) : setEditingItem({ ...editingItem!, width: parseFloat(e.target.value) })}
      className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
    />
  </div>
  <div className="space-y-2">
    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Depth (m)</label>
    <input required type="number" step="0.1"
      value={isAdding ? newEquipment.depth : editingItem?.depth}
      onChange={e => isAdding ? setNewEquipment({ ...newEquipment, depth: parseFloat(e.target.value) }) : setEditingItem({ ...editingItem!, depth: parseFloat(e.target.value) })}
      className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
    />
  </div>
  <div className="space-y-2">
    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Height (m)</label>
    <input required type="number" step="0.1"
      value={isAdding ? newEquipment.height : editingItem?.height}
      onChange={e => isAdding ? setNewEquipment({ ...newEquipment, height: parseFloat(e.target.value) }) : setEditingItem({ ...editingItem!, height: parseFloat(e.target.value) })}
      className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
    />
  </div>
</div>

{/* Row 3 — Color + Model URL */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div className="space-y-2">
    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Color (Hex)</label>
    <div className="flex gap-2">
      <input type="color"
        value={isAdding ? newEquipment.color : editingItem?.color}
        onChange={e => isAdding ? setNewEquipment({ ...newEquipment, color: e.target.value }) : setEditingItem({ ...editingItem!, color: e.target.value })}
        className="w-10 h-10 bg-transparent border-none cursor-pointer shrink-0"
      />
      <input type="text"
        value={isAdding ? newEquipment.color : editingItem?.color}
        onChange={e => isAdding ? setNewEquipment({ ...newEquipment, color: e.target.value }) : setEditingItem({ ...editingItem!, color: e.target.value })}
        className="flex-1 bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
      />
    </div>
  </div>
  <div className="space-y-2">
    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Equipment URL (Optional)</label>
    <input type="text"
      value={isAdding ? newEquipment.modelUrl : editingItem?.modelUrl || ''}
      onChange={e => isAdding ? setNewEquipment({ ...newEquipment, modelUrl: e.target.value }) : setEditingItem({ ...editingItem!, modelUrl: e.target.value })}
      className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
      placeholder="/models/..."
    />
  </div>
</div>

{/* Row 4 — Animations checkbox */}
<div className="flex items-center gap-2">
  <input type="checkbox" id="animations"
    checked={isAdding ? newEquipment.animationsEnabled : editingItem?.animationsEnabled}
    onChange={e => isAdding ? setNewEquipment({ ...newEquipment, animationsEnabled: e.target.checked }) : setEditingItem({ ...editingItem!, animationsEnabled: e.target.checked })}
    className="accent-brand-teal"
  />
  <label htmlFor="animations" className="text-xs opacity-60">Enable Animations</label>
</div>

{/* Active/Inactive toggle in edit form */}
<div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-theme-border">
  <div>
    <p className="text-xs font-bold">Equipment Status</p>
    <p className="text-[10px] opacity-40 mt-0.5">Inactive equipment won't be visible to sales reps</p>
  </div>
  <button
    type="button"
    onClick={() => isAdding
      ? setNewEquipment({ ...newEquipment, isActive: !newEquipment.isActive })
      : setEditingItem({ ...editingItem!, isActive: !editingItem?.isActive })
    }
    className={clsx(
      "w-12 h-6 rounded-full transition-colors relative shrink-0",
      (isAdding ? newEquipment.isActive !== false : editingItem?.isActive !== false)
        ? "bg-emerald-500"
        : "bg-white/20"
    )}
  >
    <div className={clsx(
      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
      (isAdding ? newEquipment.isActive !== false : editingItem?.isActive !== false)
        ? "left-7" : "left-1"
    )} />
  </button>
</div>

{/* Row 5 — Action buttons */}
<div className="flex justify-end gap-3 pt-4 border-t border-theme-border">
  <button type="button"
    onClick={() => { setIsAdding(false); setEditingItem(null);   setNewEquipment({
    name: '',
    category: 'slides',
    width: 5,
    depth: 5,
    height: 5,
    color: '#14b8a6',
    animationsEnabled: false,
    imageUrl: ''
  });}}
    className="px-6 py-2 text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-colors"
  >
    Cancel
  </button>
  <button type="submit"
    className="px-6 py-2 bg-brand-teal text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-brand-teal/90 transition-all shadow-lg shadow-brand-teal/20"
  >
    {isAdding ? 'Add Equipment' : 'Save Changes'}
  </button>
</div>
</form>
          </motion.div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
  {filteredEquipment.map(item => (
    <div
      key={item.id}
      className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden group hover:border-brand-teal/50 transition-all relative"
    >
      {/* Status Badge */}
      <div
        className={clsx(
          "absolute top-3 left-3 z-10 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
          item.isActive !== false
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-red-500/20 text-red-400"
        )}
      >
        {item.isActive !== false ? "Active" : "Inactive"}
      </div>

      {/* Image */}
      <div
        className={clsx(
          "aspect-square bg-black/40 flex items-center justify-center relative overflow-hidden",
          item.isActive === false && "opacity-40"
        )}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Box className="w-12 h-12 opacity-10" />
        )}

        {/* Category */}
        <div className="absolute top-3 right-3 px-2 py-1 bg-brand-teal/20 text-brand-teal text-[8px] font-bold uppercase rounded">
          {item.category}
        </div>

        {/* Actions Overlay */}
        <div className="absolute inset-0 bg-theme-bg/80 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Edit */}
          <button
            onClick={() => setEditingItem(item)}
            className="p-3 bg-white/10 hover:bg-brand-teal hover:text-white rounded-xl transition-all"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>

          {/* Toggle Active */}
          <button
            onClick={() =>
              onToggleActive(item.id, item.isActive !== false)
            }
            className="p-3 bg-white/10 hover:bg-red-500 hover:text-white rounded-xl transition-all"
            title={
              item.isActive !== false ? "Deactivate" : "Activate"
            }
          >
            {item.isActive !== false ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(item.id)}
            className="p-3 bg-white/10 hover:bg-red-500 hover:text-white rounded-xl transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h4 className="text-sm font-bold truncate">
          {item.name}
        </h4>
        <p className="text-[10px] opacity-40 font-mono mt-1">
          {item.width}x{item.depth}x{item.height}m
        </p>
      </div>
    </div>
  ))}

  {/* Empty State */}
  {filteredEquipment.length === 0 && (
    <div className="col-span-4 py-20 text-center">
      <Box className="w-12 h-12 opacity-10 mx-auto mb-4" />
      <p className="text-sm opacity-40 italic">
        No equipment found matching your search.
      </p>
    </div>
  )}
</div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-theme-border" />
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">Default Library</span>
          <div className="flex-1 h-px bg-theme-border" />
        </div>
        <p className="text-[10px] opacity-30 text-center">
          Toggle visibility of built-in equipment for your sales reps. Disabled items won't appear in the configurator.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {filteredDefaults.map(item => {
            const isDisabled = disabledDefaults.has(item.id);
            return (
              <div
                key={item.id}
                className={clsx(
                  "bg-theme-card border rounded-2xl overflow-hidden group transition-all relative",
                  isDisabled ? "border-red-500/20 opacity-60" : "border-theme-border hover:border-brand-teal/50"
                )}
              >
                {/* Built-in badge */}
                <div className="absolute top-3 left-3 z-10 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                  Built-in
                </div>

                {/* Status badge */}
                <div
                  className={clsx(
                    "absolute top-3 right-3 z-10 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                    isDisabled ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                  )}
                >
                  {isDisabled ? "Hidden" : "Visible"}
                </div>

                {/* Visual block */}
                <div
                  className="aspect-square flex items-center justify-center relative overflow-hidden"
                  style={{ backgroundColor: item.color + '22' }}
                >
                  <div
                    className="w-12 h-12 rounded-xl"
                    style={{ backgroundColor: item.color, opacity: isDisabled ? 0.3 : 0.8 }}
                  />

                  {/* Hover overlay — toggle only */}
                  <div className="absolute inset-0 bg-theme-bg/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onToggleDefault(item.id)}
                      className={clsx(
                        "p-3 rounded-xl transition-all",
                        isDisabled
                          ? "bg-white/10 hover:bg-emerald-500 hover:text-white"
                          : "bg-white/10 hover:bg-red-500 hover:text-white"
                      )}
                      title={isDisabled ? "Show in configurator" : "Hide from configurator"}
                    >
                      {isDisabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h4 className="text-sm font-bold truncate">{item.name}</h4>
                  <p className="text-[10px] opacity-40 uppercase tracking-widest mt-0.5">{item.category}</p>
                  <p className="text-[10px] opacity-30 font-mono mt-1">
                    {item.width}x{item.depth}x{item.height}m
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
  
}

function UsersTab({ 
  tenant,
  isAdding,
  setIsAdding,
  salesRepCount,
  setSalesRepCount
}: { 
  tenant: Tenant,
  isAdding: boolean,
  setIsAdding: (b: boolean) => void,
  salesRepCount: number,
  setSalesRepCount: (count: number) => void
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    companyName: tenant.name
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    password: ''
  });

  // Add to fetchUsers equivalent — create a new function
const fetchSalesRepCount = async () => {
  const res = await authFetch(`/api/tenant/${tenant.id}/users`);
  if (res.ok) {
    const data = await res.json();
    const count = data.filter((u: any) => u.role === 'sales_rep').length;
    setSalesRepCount(count);
  }
};

  const fetchUsers = async () => {
    const res = await authFetch(`/api/tenant/${tenant.id}/users`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [tenant.id]);

const handleAddUser = async (e: React.FormEvent) => {
  e.preventDefault();
  const userId = uuidv4();

  const res = await authFetch(`/api/tenant/${tenant.id}/users`, {
    method: 'POST',
    body: JSON.stringify({
      id: userId,
      email: newUser.email,
      password: newUser.password, // server will hash this
      role: 'sales_rep',
      name: newUser.name,
      phone: newUser.phone
    })
  });

  if (res.ok) {
    setIsAdding(false);
    setNewUser({ name: '', email: '', password: '', phone: '', companyName: tenant.name });
    fetchUsers(); // refresh from DB
    fetchSalesRepCount(); 
  } else {
    const err = await res.json();
    alert(err.error || 'Failed to add user');
  }
};

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const res = await authFetch(`/api/users/${editingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editFormData.name,
        phone: editFormData.phone,
        password: editFormData.password || undefined
      })
    });

    if (res.ok) {
      setEditingUser(null);
      fetchUsers();
    } else {
      alert('Failed to update user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sales person?')) return;

    const res = await authFetch(`/api/users/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      fetchUsers();
      fetchSalesRepCount(); 
    } else {
      alert('Failed to delete user');
    }
  };

  const startEditing = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      phone: user.phone || '',
      password: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Add User Modal */}
      {isAdding && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-theme-bg border border-theme-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-theme-border flex justify-between items-center">
              <h3 className="text-lg font-bold">Add Sales Person</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-5 h-5 opacity-40" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Full Name</label>
                <input 
                  required
                  type="text"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Company Name</label>
                <input 
                  disabled
                  type="text"
                  value={newUser.companyName}
                  className="w-full bg-white/10 border border-theme-border rounded-lg px-4 py-2 text-sm opacity-60"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Email Address</label>
                <input 
                  required
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Mobile Number</label>
                <input 
                  required
                  type="tel"
                  value={newUser.phone}
                  onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                  placeholder="+1 234 567 890"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Password</label>
                <input 
                  required
                  type="password"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-theme-border">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-2 text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-brand-teal text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-brand-teal/90 transition-all shadow-lg shadow-brand-teal/20"
                >
                  Create Account
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-theme-bg border border-theme-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-theme-border flex justify-between items-center">
              <h3 className="text-lg font-bold">Edit Sales Person</h3>
              <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-5 h-5 opacity-40" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Full Name</label>
                <input 
                  required
                  type="text"
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Email Address</label>
                <input 
                  disabled
                  type="email"
                  value={editingUser.email}
                  className="w-full bg-white/10 border border-theme-border rounded-lg px-4 py-2 text-sm opacity-60"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Mobile Number</label>
                <input 
                  required
                  type="tel"
                  value={editFormData.phone}
                  onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">New Password (Optional)</label>
                <input 
                  type="password"
                  value={editFormData.password}
                  onChange={e => setEditFormData({ ...editFormData, password: e.target.value })}
                  className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                  placeholder="Leave blank to keep current"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-theme-border">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)}
                  className="px-6 py-2 text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-brand-teal text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-brand-teal/90 transition-all shadow-lg shadow-brand-teal/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {users.map(u => (
<div key={u.id} className="p-3 lg:p-4 bg-theme-card border border-theme-border rounded-xl flex items-center justify-between gap-2 group">
  <div className="flex items-center gap-3 min-w-0 flex-1">
    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-brand-teal/10 rounded-full flex items-center justify-center text-brand-teal font-bold shrink-0">
      {u.name.charAt(0)}
    </div>
    <div className="min-w-0 flex-1">
      <h4 className="font-bold text-sm truncate">Name: {u.name}</h4>
      <div className="flex items-center gap-1 lg:gap-3 mt-1 flex-wrap">
        <span className="text-[10px] opacity-40 truncate max-w-[120px] lg:max-w-none">Email: {u.email}</span>
        <span className="text-[10px] opacity-40 hidden lg:inline">·</span>
        <span className="text-[10px] opacity-40 hidden lg:inline">Phone: {u.phone || 'No phone'}</span>
      </div>
    </div>
  </div>
  <div className="flex items-center gap-2 shrink-0">
    <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 bg-brand-teal/10 text-brand-teal rounded whitespace-nowrap">
      {u.role}
    </span>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => startEditing(u)}
                  className="p-2 hover:bg-brand-teal/10 text-brand-teal rounded-lg transition-colors"
                  title="Edit User"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteUser(u.id)}
                  className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                  title="Delete User"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="py-20 text-center">
            <Users className="w-12 h-12 opacity-10 mx-auto mb-4" />
            <p className="text-sm opacity-40 italic">No sales team members added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, icon }: { label: string, value: string, trend: string, icon: React.ReactNode }) {
  return (
    <div className="p-6 bg-theme-card border border-theme-border rounded-2xl space-y-4">
      <div className="flex justify-between items-start">
        <div className="p-2 bg-brand-teal/10 rounded-lg text-brand-teal">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
          {trend}
        </span>
      </div>
      <div>
        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
    </div>
  );
}

function SettingsTab({ theme, onThemeChange }: { theme: 'dark' | 'light', onThemeChange: (t: 'dark' | 'light') => void }) {
  return (
    <div className="max-w-2xl space-y-8 overflow-y-auto">
      <div className="p-6 bg-theme-card border border-theme-border rounded-2xl">
        <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">Appearance</h3>
        {/* <div className="grid grid-cols-2 gap-4"> */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <button 
            onClick={() => onThemeChange('dark')}
            className={clsx(
              "p-4 rounded-xl border transition-all flex flex-col items-center gap-3",
              theme === 'dark' ? "bg-brand-teal/20 border-brand-teal text-brand-teal" : "bg-white/5 border-theme-border opacity-40 hover:opacity-100 hover:bg-white/10"
            )}
          >
            <Moon className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-widest">Dark Mode</span>
          </button>
          <button 
            onClick={() => onThemeChange('light')}
            className={clsx(
              "p-4 rounded-xl border transition-all flex flex-col items-center gap-3",
              theme === 'light' ? "bg-brand-teal/20 border-brand-teal text-brand-teal" : "bg-white/5 border-theme-border opacity-40 hover:opacity-100 hover:bg-white/10"
            )}
          >
            <Sun className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-widest">Light Mode</span>
          </button>
        </div>
      </div>

      <div className="p-6 bg-theme-card border border-theme-border rounded-2xl">
        <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">Account Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Email Alerts</p>
              <p className="text-[10px] opacity-40 uppercase tracking-widest">Receive updates on project status</p>
            </div>
            <div className="w-10 h-5 bg-brand-teal rounded-full relative">
              <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ user }: { user: User }) {
  const [profileData, setProfileData] = useState({
    name: user.name,
    phone: user.phone || '',
    password: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8 overflow-y-auto">
      <div className="p-6 bg-theme-card border border-theme-border rounded-2xl">
        <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">Profile Settings</h3>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* <div className="grid grid-cols-2 gap-4"> */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            disabled={isSaving}
            className="px-6 py-2 bg-brand-teal text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-brand-teal/90 transition-all disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}