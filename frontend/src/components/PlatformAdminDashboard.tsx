
import React, { useState, useEffect } from 'react';
import { authFetch } from '../utils/api';
import { User, Tenant } from '../../../backend/types';
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
  Sun,
  X,
  Clock,
  Trash2,
  KeyRound,
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
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'users' | 'settings' | 'logs'| 'admin-resets'>('overview');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<PlatformStats>({ tenants: 0, users: 0, projects: 0 });
  const [isAddingTenant, setIsAddingTenant] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [newTenant, setNewTenant] = useState({ 
    name: '', 
    logo_url: '', 
    subscription_tier: 'basic' as 'basic' | 'pro',
    email: '',
    password: ''
  });
  const [createdTenant, setCreatedTenant] = useState<{name: string, email: string, password: string} | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [platformLogs, setPlatformLogs] = useState<any[]>([]);
const [platformLogFilter, setPlatformLogFilter] = useState('all');

const fetchPlatformLogs = async () => {
  const res = await authFetch('/api/admin/logs?limit=100');
  if (res.ok) {
    const data = await res.json();
    setPlatformLogs(data);
  }
};

 // Admin reset requests (tenant_admin resets)
  const [adminResetRequests, setAdminResetRequests] = useState<any[]>([]);
  const [adminTempPasswords, setAdminTempPasswords] = useState<Record<string, string>>({});
  const [adminResetCount, setAdminResetCount] = useState(0);

  const fetchAdminResetRequests = async () => {
    const res = await authFetch('/api/admin/tenant-admin-resets');
    if (res.ok) {
      const data = await res.json();
      setAdminResetRequests(data);
      setAdminResetCount(data.length);
    }
  };

  const handleResolveAdminReset = async (requestId: string) => {
    const tempPwd = adminTempPasswords[requestId];
    if (!tempPwd || tempPwd.length < 8) {
      return alert('Temporary password must be at least 8 characters.');
    }
    const res = await authFetch(`/api/admin/reset-requests/${requestId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ temp_password: tempPwd }),
    });
    if (res.ok) {
      alert('Temporary password set. Share it securely with the tenant admin.');
      fetchAdminResetRequests();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to resolve request.');
    }
  };

  useEffect(() => {
    fetchTenants();
    fetchUsers();
    fetchStats();
    fetchPlatformLogs();
    fetchAdminResetRequests();
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
      // Store created tenant credentials for display
      setCreatedTenant({
        name: newTenant.name,
        email: newTenant.email,
        password: newTenant.password
      });
      setShowSuccess(true);
      setIsAddingTenant(false);
      setNewTenant({ name: '', logo_url: '', subscription_tier: 'basic', email: '', password: '' });
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
          <NavButton
            active={activeTab === 'logs'}
            onClick={() => setActiveTab('logs')}
            icon={<Activity className="w-4 h-4" />}
            label="Activity Logs"
          />
          <NavButton
            active={activeTab === 'admin-resets'}
            onClick={() => setActiveTab('admin-resets')}
            icon={<KeyRound className="w-4 h-4" />}
            label="Admin Resets"
            badge={adminResetCount > 0 ? adminResetCount : undefined}
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
              {activeTab === 'logs' && 'Platform Activity Logs'}
              {activeTab === 'admin-resets' && 'Tenant Admin Reset Requests'}
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
            showSuccess={showSuccess}
            setShowSuccess={setShowSuccess}
            createdTenant={createdTenant}
          />
        )}
        {activeTab === 'users' && (
          <UsersTab tenants={tenants} users={users} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab theme={theme} onThemeChange={setTheme} />
        )}
        {activeTab === 'logs' && (
  <div className="space-y-4">
    <div className="flex items-center gap-2 flex-wrap">
      {['all', 'tenant', 'auth', 'password_reset', 'platform_admin_reset'].map(filter => (
        <button
          key={filter}
          onClick={() => setPlatformLogFilter(filter)}
          className={clsx(
            "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all border",
            platformLogFilter === filter
              ? "bg-brand-teal text-white border-brand-teal"
              : "bg-white/5 border-theme-border opacity-60 hover:opacity-100"
          )}
        >
          {filter === 'all' ? 'All Activity' 
            : filter === 'password_reset' ? 'Admin Resets'
            : filter === 'platform_admin_reset' ? 'Platform Resets'
            : filter}
        </button>
      ))}
    </div>
    <div className="space-y-2">
      {(platformLogFilter === 'all' ? platformLogs : platformLogs.filter(l => l.entity_type === platformLogFilter)).length === 0 ? (
        <div className="py-20 text-center border border-dashed border-theme-border rounded-2xl">
          <Activity className="w-12 h-12 opacity-10 mx-auto mb-4" />
          <p className="text-sm opacity-40 italic">No platform activity yet.</p>
        </div>
      ) : (
        (platformLogFilter === 'all' ? platformLogs : platformLogs.filter(l => l.entity_type === platformLogFilter)).map(log => (
          <div key={log.id} className="flex items-start gap-4 p-4 bg-theme-card border border-theme-border rounded-xl hover:bg-white/5 transition-colors">
            <div className={clsx(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
              log.action === 'CREATE' && "bg-emerald-500/20 text-emerald-400",
              log.action === 'UPDATE' && "bg-blue-500/20 text-blue-400",
              log.action === 'DELETE' && "bg-red-500/20 text-red-400",
              log.action === 'LOGIN' && "bg-brand-teal/20 text-brand-teal",
              log.action === 'REQUEST' && "bg-amber-500/20 text-amber-400",
              log.action === 'RESOLVE' && "bg-emerald-500/20 text-emerald-400",
              log.action === 'RESET' && "bg-purple-500/20 text-purple-400",
            )}>
              {log.action === 'CREATE' && <Plus className="w-4 h-4" />}
              {log.action === 'UPDATE' && <Pencil className="w-4 h-4" />}
              {log.action === 'DELETE' && <Trash2 className="w-4 h-4" />}
              {log.action === 'LOGIN' && <ShieldCheck className="w-4 h-4" />}
              {log.action === 'REQUEST' && <KeyRound className="w-4 h-4" />}
              {log.action === 'RESOLVE' && <ShieldCheck className="w-4 h-4" />}
              {log.action === 'RESET' && <KeyRound className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className={clsx(
                    "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded",
                    log.action === 'CREATE' && "bg-emerald-500/20 text-emerald-400",
                    log.action === 'UPDATE' && "bg-blue-500/20 text-blue-400",
                    log.action === 'DELETE' && "bg-red-500/20 text-red-400",
                    log.action === 'LOGIN' && "bg-brand-teal/20 text-brand-teal",
                    log.action === 'REQUEST' && "bg-amber-500/20 text-amber-400",
                    log.action === 'RESOLVE' && "bg-emerald-500/20 text-emerald-400",
                    log.action === 'RESET' && "bg-purple-500/20 text-purple-400",
                  )}>
                    {log.action}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                    {/* {log.entity_type} */}
                    {log.entity_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] opacity-30 shrink-0">
                  <Clock className="w-3 h-3" />
                  {/* {new Date(log.created_at + 'Z').toLocaleString()} */}
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
              <p className="text-sm font-medium mt-1">{log.entity_name || '—'}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] opacity-40">by {log.user_name}</span>
                {log.details && <span className="text-[10px] opacity-30">{log.details}</span>}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
)}
    {activeTab === 'admin-resets' && (
  <div className="space-y-4">
    {/* Info banner */}
    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
      <KeyRound className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">Tenant Admin Password Resets</p>
        <p className="text-xs opacity-60 leading-relaxed">
          When a Tenant Admin forgets their password, the request is escalated here. Set a temporary password and share it securely — they will be forced to change it on next login.
        </p>
      </div>
    </div>

    {adminResetRequests.length === 0 ? (
      <div className="py-20 text-center border border-dashed border-theme-border rounded-2xl">
        <KeyRound className="w-12 h-12 opacity-10 mx-auto mb-4" />
        <p className="text-sm opacity-40 italic">No pending tenant admin reset requests.</p>
        <p className="text-xs opacity-20 mt-1">When a tenant admin requests a password reset, it will appear here.</p>
      </div>
    ) : (
      adminResetRequests.map(req => (
        <div key={req.id} className="p-6 bg-theme-card border border-theme-border rounded-2xl space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="font-bold text-sm">{req.user_name}</p>
                <p className="text-xs opacity-40">{req.email}</p>
                {req.tenant_name && (
                  <p className="text-[10px] opacity-30 mt-0.5 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {req.tenant_name}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-amber-500/20 text-amber-400 rounded">
                Pending
              </span>
              <p className="text-[10px] opacity-30 mt-1.5 flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3" />
                {new Date(req.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Set temporary password (min. 8 characters)"
              value={adminTempPasswords[req.id] || ''}
              onChange={e => setAdminTempPasswords({ ...adminTempPasswords, [req.id]: e.target.value })}
              className="flex-1 bg-white/5 border border-theme-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
            />
            <button
              onClick={() => handleResolveAdminReset(req.id)}
              className="px-5 py-2.5 bg-brand-teal text-white text-xs font-bold rounded-xl hover:bg-brand-teal/90 transition-all shadow-lg shadow-brand-teal/20 whitespace-nowrap"
            >
              Set & Resolve
            </button>
          </div>

          <p className="text-[10px] opacity-30 leading-relaxed">
            The tenant admin will be required to change this temporary password on their next login.
          </p>
        </div>
      ))
    )}
  </div>
)}
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label, badge }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: number  }) {
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
  
      <span className="flex-1 text-left">{label}</span>
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

function OverviewTab({ stats, tenants }: { stats: PlatformStats, tenants: Tenant[] }) {
  const recentTenants = tenants.slice(0, 5); // Get the 5 most recent tenants

  return (
    <div className="space-y-8">
      {/* <div className="grid grid-cols-3 gap-6"> */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <StatCard label="Total Organizations" value={stats.tenants.toString()} trend="+2 this month" icon={<Building2 className="w-5 h-5" />} />
        <StatCard label="Active Users" value={stats.users.toString()} trend="+14% vs LY" icon={<Users className="w-5 h-5" />} />
        <StatCard label="Global Projects" value={stats.projects.toString()} trend="+45 new" icon={<Activity className="w-5 h-5" />} />
      </div>

      {/* <div className="grid grid-cols-2 gap-6"> */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
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
  onUpdate,
  showSuccess,
  setShowSuccess,
  createdTenant
}: { 
  tenants: Tenant[], 
  isAdding: boolean, 
  onCloseAdd: () => void,
  onAdd: (e: React.FormEvent) => void,
  newTenant: any,
  setNewTenant: any,
  editingTenant: Tenant | null,
  setEditingTenant: (t: Tenant | null) => void,
  onUpdate: (e: React.FormEvent) => void,
  showSuccess: boolean,
  setShowSuccess: (show: boolean) => void,
  createdTenant: {name: string, email: string, password: string} | null
}) {
  return (
    <div className="space-y-6">
      {showSuccess && createdTenant && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-green-500/10 border border-green-500/30 rounded-2xl mb-6"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-green-500">Tenant Created Successfully!</h3>
              <p className="text-xs opacity-60 mt-1">Tenant admin credentials have been generated</p>
            </div>
            <button 
              onClick={() => setShowSuccess(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 opacity-40" />
            </button>
          </div>
          
          <div className="bg-white/5 border border-green-500/20 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Company Name</p>
                <p className="text-sm font-bold">{createdTenant.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Admin Email</p>
                <p className="text-sm font-bold text-green-400">{createdTenant.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Password</p>
                <p className="text-sm font-bold text-green-400">{createdTenant.password}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                const credentials = `Company: ${createdTenant.name}\nAdmin Email: ${createdTenant.email}\nPassword: ${createdTenant.password}`;
                navigator.clipboard.writeText(credentials);
                alert('Credentials copied to clipboard!');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-all"
            >
              Copy Credentials
            </button>
            <button
              onClick={() => {
                setShowSuccess(false);
                window.location.href = '/login';
              }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-teal hover:bg-brand-teal/90 text-white text-xs font-bold rounded-lg transition-all"
            >
              Login as Tenant Admin
            </button>
          </div>
        </motion.div>
      )}

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
            <div className="space-y-4">
              <div className="text-sm font-bold text-brand-teal mb-3">Company Details</div>
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
            </div>

            <div className="space-y-4 pt-2">
              <div className="text-sm font-bold text-brand-teal mb-3">Tenant Admin Credentials</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Admin Email</label>
                  <input 
                    required
                    type="email" 
                    value={newTenant.email}
                    onChange={e => setNewTenant({ ...newTenant, email: e.target.value })}
                    className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                    placeholder="admin@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Password</label>
                  <input 
                    required
                    type="password" 
                    value={newTenant.password}
                    onChange={e => setNewTenant({ ...newTenant, password: e.target.value })}
                    className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                    placeholder="Min 6 characters"
                    minLength={6}
                  />
                </div>
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
