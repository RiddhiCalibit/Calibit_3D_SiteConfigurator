
import React, { useState, useEffect } from 'react';
import { authFetch } from '../utils/api';
import { User, Tenant } from '../types';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings, 
  Plus, 
  Search, 
  TrendingUp,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Activity,
  CreditCard,
  Pencil,
  Moon,
  Sun
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { v4 as uuidv4 } from 'uuid';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  user: User;
  onLogout: () => void;
}

interface PlatformStats {
  tenants: number;
  users: number;
  projects: number;
}

export function PlatformAdminDashboard({ user, onLogout }: Props) {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'users' | 'settings'>('overview');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<PlatformStats>({ tenants: 0, users: 0, projects: 0 });
  const [isAddingTenant, setIsAddingTenant] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [newTenant, setNewTenant] = useState({ name: '', logo_url: '', subscription_tier: 'basic' as 'basic' | 'pro' });

  useEffect(() => {
    fetchTenants();
    fetchUsers();
    fetchStats();
  }, []);

  const fetchTenants = async () => {
    const res = await authFetch('/api/admin/tenants');
    if (res.ok) {
      const data = await res.json();
      setTenants(data);
    }
  };

  const fetchUsers = async () => {
    const res = await authFetch('/api/admin/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
  };

  const fetchStats = async () => {
    const res = await authFetch('/api/admin/stats');
    if (res.ok) {
      const data = await res.json();
      setStats(data);
    }
  };

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    const tenantId = uuidv4();
    const res = await authFetch('/api/admin/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tenantId, ...newTenant })
    });

    if (res.ok) {
      setIsAddingTenant(false);
      setNewTenant({ name: '', logo_url: '', subscription_tier: 'basic' });
      fetchTenants();
      fetchStats();
    }
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;

    const res = await authFetch(`/api/admin/tenants/${editingTenant.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingTenant)
    });

    if (res.ok) {
      setEditingTenant(null);
      fetchTenants();
    }
  };

  return (
    <div className="flex h-screen w-screen bg-theme-bg text-theme-text overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 border-r border-theme-border flex flex-col">
        <div className="p-6 border-b border-theme-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-teal rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold truncate">Platform Admin</h1>
              <p className="text-[10px] opacity-40 uppercase tracking-widest">Superuser Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavButton 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')}
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Global Overview"
          />
          <NavButton 
            active={activeTab === 'tenants'} 
            onClick={() => setActiveTab('tenants')}
            icon={<Building2 className="w-4 h-4" />}
            label="Manage Tenants"
          />
          <NavButton 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')}
            icon={<Users className="w-4 h-4" />}
            label="System Users"
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
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {activeTab === 'overview' && 'Platform Health'}
              {activeTab === 'tenants' && 'Tenant Management'}
              {activeTab === 'users' && 'Global User Directory'}
              {activeTab === 'settings' && 'Platform Settings'}
            </h2>
            <p className="text-sm opacity-40">Super Admin: {user.name}</p>
          </div>
          
          {activeTab === 'tenants' && (
            <button 
              onClick={() => setIsAddingTenant(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-brand-teal/90 transition-all shadow-lg shadow-brand-teal/20"
            >
              <Plus className="w-4 h-4" />
              Onboard New Tenant
            </button>
          )}
        </header>

        {activeTab === 'overview' && <OverviewTab stats={stats} tenants={tenants} />}
        {activeTab === 'tenants' && (
          <TenantsTab 
            tenants={tenants} 
            isAdding={isAddingTenant} 
            onCloseAdd={() => setIsAddingTenant(false)}
            onAdd={handleAddTenant}
            newTenant={newTenant}
            setNewTenant={setNewTenant}
            editingTenant={editingTenant}
            setEditingTenant={setEditingTenant}
            onUpdate={handleUpdateTenant}
          />
        )}
        {activeTab === 'users' && (
          <UsersTab tenants={tenants} users={users} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab theme={theme} onThemeChange={setTheme} />
        )}
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
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
    </button>
  );
}

function OverviewTab({ stats, tenants }: { stats: PlatformStats, tenants: Tenant[] }) {
  const recentTenants = tenants.slice(0, 5); // Get the 5 most recent tenants

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-6">
        <StatCard label="Total Organizations" value={stats.tenants.toString()} trend="+2 this month" icon={<Building2 className="w-5 h-5" />} />
        <StatCard label="Active Users" value={stats.users.toString()} trend="+14% vs LY" icon={<Users className="w-5 h-5" />} />
        <StatCard label="Global Projects" value={stats.projects.toString()} trend="+45 new" icon={<Activity className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="p-6 bg-theme-card border border-theme-border rounded-2xl">
          <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">System Status</h3>
          <div className="space-y-4">
            <StatusItem label="API Gateway" status="Operational" />
            <StatusItem label="3D Rendering Engine" status="Operational" />
            <StatusItem label="Compliance AI (Gemini)" status="Operational" />
            <StatusItem label="Database Cluster" status="Operational" />
          </div>
        </div>
        
        <div className="p-6 bg-theme-card border border-theme-border rounded-2xl">
          <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">Recent Onboarding</h3>
          <div className="space-y-4">
            {recentTenants.length > 0 ? (
              recentTenants.map(tenant => (
                <div key={tenant.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-theme-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                      {tenant.logo_url ? (
                        <img src={tenant.logo_url} alt={tenant.name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-4 h-4 opacity-20" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold">{tenant.name}</p>
                      <p className="text-[8px] opacity-40 uppercase tracking-widest">{tenant.subscription_tier} Plan</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] opacity-40 uppercase tracking-widest">
                      {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : 'Just now'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs opacity-20 italic">No recent tenant activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TenantsTab({ 
  tenants, 
  isAdding, 
  onCloseAdd, 
  onAdd, 
  newTenant, 
  setNewTenant,
  editingTenant,
  setEditingTenant,
  onUpdate
}: { 
  tenants: Tenant[], 
  isAdding: boolean, 
  onCloseAdd: () => void,
  onAdd: (e: React.FormEvent) => void,
  newTenant: any,
  setNewTenant: any,
  editingTenant: Tenant | null,
  setEditingTenant: (t: Tenant | null) => void,
  onUpdate: (e: React.FormEvent) => void
}) {
  return (
    <div className="space-y-6">
      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-theme-card border border-brand-teal/30 rounded-2xl"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-brand-teal">Onboard New Tenant</h3>
          </div>
          <form onSubmit={onAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Company Name</label>
                <input 
                  required
                  type="text" 
                  value={newTenant.name}
                  onChange={e => setNewTenant({ ...newTenant, name: e.target.value })}
                  className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Logo URL</label>
                <input 
                  type="text" 
                  value={newTenant.logo_url}
                  onChange={e => setNewTenant({ ...newTenant, logo_url: e.target.value })}
                  className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    checked={newTenant.subscription_tier === 'basic'} 
                    onChange={() => setNewTenant({ ...newTenant, subscription_tier: 'basic' })}
                    className="accent-brand-teal"
                  />
                  <span className="text-xs">Basic</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    checked={newTenant.subscription_tier === 'pro'} 
                    onChange={() => setNewTenant({ ...newTenant, subscription_tier: 'pro' })}
                    className="accent-brand-teal"
                  />
                  <span className="text-xs">Pro</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={onCloseAdd} className="px-4 py-2 text-xs opacity-40 hover:opacity-100">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-teal text-white text-xs font-bold rounded-lg">Create Tenant</button>
              </div>
            </div>
          </form>
        </motion.div>
      )}

      {editingTenant && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white/5 border border-brand-teal/30 rounded-2xl"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-brand-teal">Edit Tenant: {editingTenant.name}</h3>
          </div>
          <form onSubmit={onUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Company Name</label>
                <input 
                  required
                  type="text" 
                  value={editingTenant.name}
                  onChange={e => setEditingTenant({ ...editingTenant, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Logo URL</label>
                <input 
                  type="text" 
                  value={editingTenant.logo_url || ''}
                  onChange={e => setEditingTenant({ ...editingTenant, logo_url: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                />
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    checked={editingTenant.subscription_tier === 'basic'} 
                    onChange={() => setEditingTenant({ ...editingTenant, subscription_tier: 'basic' })}
                    className="accent-brand-teal"
                  />
                  <span className="text-xs">Basic</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    checked={editingTenant.subscription_tier === 'pro'} 
                    onChange={() => setEditingTenant({ ...editingTenant, subscription_tier: 'pro' })}
                    className="accent-brand-teal"
                  />
                  <span className="text-xs">Pro</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditingTenant(null)} className="px-4 py-2 text-xs opacity-40 hover:opacity-100">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-teal text-white text-xs font-bold rounded-lg">Update Tenant</button>
              </div>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {tenants.map(tenant => (
          <div key={tenant.id} className="p-4 bg-theme-card border border-theme-border rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                {tenant.logo_url ? (
                  <img src={tenant.logo_url} alt={tenant.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-6 h-6 opacity-20" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm">{tenant.name}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 bg-white/10 rounded opacity-40">ID: {tenant.id.slice(0, 8)}...</span>
                  <span className={clsx(
                    "text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded",
                    tenant.subscription_tier === 'pro' ? "bg-brand-teal/20 text-brand-teal" : "bg-white/10 opacity-40"
                  )}>
                    {tenant.subscription_tier}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] opacity-40 uppercase tracking-widest">Projects</p>
                <p className="text-sm font-bold">--</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setEditingTenant(tenant)}
                  className="p-2 hover:bg-brand-teal/20 hover:text-brand-teal rounded-lg transition-colors opacity-20 hover:opacity-100"
                >
                <p className="text-[10px] uppercase tracking-widest">Edit</p>
                  <Pencil className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <ChevronRight className="w-4 h-4 opacity-20" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersTab({ tenants, users }: { tenants: Tenant[], users: any[] }) {
  return (
    <div className="space-y-8">
      {tenants.map(tenant => {
        const tenantUsers = users.filter(u => u.tenant_id === tenant.id);
        return (
          <div key={tenant.id} className="p-6 bg-theme-card border border-theme-border rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                  {tenant.logo_url ? (
                    <img src={tenant.logo_url} alt={tenant.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-5 h-5 opacity-20" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{tenant.name}</h3>
                  <p className="text-[10px] opacity-40 uppercase tracking-widest">{tenantUsers.length} Users Assigned</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active Tenant</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {tenantUsers.length > 0 ? (
                tenantUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-theme-border hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-brand-teal/10 rounded-full flex items-center justify-center text-brand-teal font-bold">
                        {u.name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{u.name || 'Unnamed User'}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] opacity-40">{u.email}</span>
                          <span className="text-[10px] opacity-40">·</span>
                          <span className="text-[10px] opacity-40 uppercase tracking-widest font-bold">{u.role}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[8px] font-bold uppercase tracking-widest">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                        Active
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center border border-dashed border-theme-border rounded-xl">
                  <Users className="w-8 h-8 opacity-10 mx-auto mb-2" />
                  <p className="text-xs opacity-40 italic">No users found for this tenant.</p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Platform Admins Section */}
      <div className="p-6 bg-theme-card border border-theme-border rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-teal/10 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-brand-teal" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Platform Administrators</h3>
              <p className="text-[10px] opacity-40 uppercase tracking-widest">Global System Access</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {users.filter(u => u.role === 'platform_admin').map(u => (
            <div key={u.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-theme-border hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-teal/10 rounded-full flex items-center justify-center text-brand-teal font-bold">
                  {u.name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold">{u.name || 'Unnamed User'}</p>
                  <p className="text-[10px] opacity-40 mt-1">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-brand-teal/10 text-brand-teal rounded text-[8px] font-bold uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" />
                Superuser
              </div>
            </div>
          ))}
        </div>
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

function StatusItem({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-theme-border">
      <span className="text-xs opacity-60">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{status}</span>
      </div>
    </div>
  );
}

function SettingsTab({ theme, onThemeChange }: { theme: 'dark' | 'light', onThemeChange: (t: 'dark' | 'light') => void }) {
  return (
    <div className="max-w-2xl space-y-8">
      <div className="p-6 bg-theme-card border border-theme-border rounded-2xl">
        <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">Appearance</h3>
        <div className="grid grid-cols-2 gap-4">
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
        <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">Platform Security</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Two-Factor Authentication</p>
              <p className="text-[10px] opacity-40 uppercase tracking-widest">Enforce 2FA for all system admins</p>
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
