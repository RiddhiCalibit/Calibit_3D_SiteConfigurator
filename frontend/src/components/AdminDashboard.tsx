// // import React, { useState, useEffect, useCallback } from "react";
// // import { authFetch } from "../utils/api";
// // import {
// //   User,
// //   Tenant,
// //   EquipmentDef,
// //   DEFAULT_LIBRARY,
// // } from "../../../backend/types";
// // import {
// //   LayoutDashboard,
// //   Package,
// //   Users,
// //   Settings,
// //   User as UserIcon,
// //   Plus,
// //   Search,
// //   Box,
// //   TrendingUp,
// //   LogOut,
// //   ChevronRight,
// //   Pencil,
// //   Trash2,
// //   X,
// //   Moon,
// //   Sun,
// //   KeyRound,
// //   Upload,
// //   Activity,
// //   Clock,
// //   ShieldCheck,
// //   Eye,
// //   EyeOff,
// //   FolderOpen,
// //   ChevronDown,
// //   Lock,
// //   Archive,
// //   Share2,
// //   ShieldAlert,
// // } from "lucide-react";
// // import { motion } from "motion/react";
// // import { clsx } from "clsx";
// // import { v4 as uuidv4 } from "uuid";
// // import { useTheme } from "../contexts/ThemeContext";
// // import { LockedAccountsPanel } from "./LockedAccountsPanel";

// // const generateDefaultEquipmentImage = (item: EquipmentDef) => {
// //   const label = item.name
// //     .split(" ")
// //     .map((word) => word[0])
// //     .join("")
// //     .slice(0, 3)
// //     .toUpperCase();
// //   const fill = item.color || "#999";
// //   const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='100%' height='100%' fill='${fill}'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, system-ui, sans-serif' font-size='28' fill='#ffffff' opacity='0.85'>${label}</text></svg>`;
// //   return `data:image/svg+xml,${encodeURIComponent(svg)}`;
// // };

// // const resolveImageUrl = (imageUrl?: string | null) => {
// //   if (!imageUrl) return null;
// //   if (
// //     imageUrl.startsWith("data:") ||
// //     imageUrl.startsWith("http://") ||
// //     imageUrl.startsWith("https://")
// //   ) {
// //     return imageUrl;
// //   }
// //   return `${import.meta.env.VITE_API_URL}${imageUrl}`;
// // };

// // const getEquipmentThumbnail = (item: EquipmentDef) => {
// //   const imageUrl = resolveImageUrl(item.imageUrl);
// //   return imageUrl ? imageUrl : generateDefaultEquipmentImage(item);
// // };

// // const formatSnakeCaseToTitleCase = (str: string) => {
// //   return str
// //     .split("_")
// //     .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
// //     .join(" ");
// // };

// // const getEquipmentNameByIdFromList = (
// //   entityId: string,
// //   equipment: EquipmentDef[],
// // ): string => {
// //   const customEquip = equipment.find((e) => e.id === entityId);
// //   if (customEquip) return customEquip.name;

// //   const defaultEquip = DEFAULT_LIBRARY.find((e) => e.id === entityId);
// //   if (defaultEquip) return defaultEquip.name;

// //   return "";
// // };

// // const getLogEntityDisplayName = (
// //   log: any,
// //   equipment: EquipmentDef[],
// // ): string => {
// //   const lookupId = log.entity_id || log.entity_name;
// //   const equipmentName = lookupId
// //     ? getEquipmentNameByIdFromList(lookupId, equipment)
// //     : "";
// //   if (equipmentName) return equipmentName;

// //   if (log.entity_name) {
// //     return log.entity_name.includes("_")
// //       ? formatSnakeCaseToTitleCase(log.entity_name)
// //       : log.entity_name;
// //   }

// //   return log.details || log.action;
// // };

// // interface Props {
// //   user: User;
// //   tenant: Tenant;
// //   onLogout: () => void;
// //   onUserUpdate?: (user: User) => void;
// //   onShowToast?: (message: string, type?: "success" | "error") => void;
// // }

// // export function AdminDashboard({
// //   user,
// //   tenant,
// //   onLogout,
// //   onUserUpdate,
// //   onShowToast,
// // }: Props) {
// //   const { theme, setTheme } = useTheme();
// //   const [activeTab, setActiveTab] = useState<
// //     | "overview"
// //     | "equipment"
// //     | "users"
// //     | "settings"
// //     | "profile"
// //     | "resets"
// //     | "logs"
// //     | "projects"
// //     | "locked-accounts"
// //   >("overview");
// //   const [equipment, setEquipment] = useState<EquipmentDef[]>([]);
// //   const [isAddingEquipment, setIsAddingEquipment] = useState(false);
// //   const [editingEquipment, setEditingEquipment] = useState<EquipmentDef | null>(
// //     null,
// //   );
// //   const [searchQuery, setSearchQuery] = useState("");
// //   const [isAddingUser, setIsAddingUser] = useState(false);
// //   const [salesRepCount, setSalesRepCount] = useState(0);
// //   const [newEquipment, setNewEquipment] = useState<Partial<EquipmentDef>>({
// //     name: "",
// //     category: "slides",
// //     width: 5,
// //     depth: 5,
// //     height: 5,
// //     color: "#14b8a6",
// //   });

// //   const [resetRequests, setResetRequests] = useState<any[]>([]);
// //   const [tempPasswords, setTempPasswords] = useState<Record<string, string>>(
// //     {},
// //   );
// //   const [ResetCount, setResetCount] = useState(0);
// //   const [isFetchingResetRequests, setIsFetchingResetRequests] = useState(false);

// //   const [logs, setLogs] = useState<any[]>([]);
// //   const [logFilter, setLogFilter] = useState("all");
// //   const [logDateFilter, setLogDateFilter] = useState<{
// //     startDate: string;
// //     endDate: string;
// //   }>(() => {
// //     const today = new Date();
// //     const dateStr = today.toISOString().split("T")[0];
// //     return { startDate: dateStr, endDate: dateStr };
// //   });
// //   const overviewLogs = logs
// //     .filter(
// //       (log) =>
// //         log.action !== "LOGIN" &&
// //         log.entity_type !== "auth" &&
// //         log.entity_type !== "login",
// //     )
// //     .slice(0, 3);
// //   //const [disabledDefaults, setDisabledDefaults] = useState<string[]>([]);
// //   const [disabledDefaults, setDisabledDefaults] = useState<Set<string>>(
// //     new Set(),
// //   );

// //   const fetchLogs = async () => {
// //     const res = await authFetch(`/api/tenant/${tenant.id}/logs?limit=100`);
// //     if (res.ok) {
// //       const data = await res.json();
// //       setLogs(data);
// //     }
// //   };

// //   const getFilteredLogs = (logsToFilter: any[]) => {
// //     let filtered = logsToFilter;

// //     // Filter by entity type
// //     if (logFilter !== "all") {
// //       filtered = filtered.filter((l) => l.entity_type === logFilter);
// //     }

// //     // Filter by date range
// //     const startDate = new Date(`${logDateFilter.startDate}T00:00:00`).getTime();
// //     const endDate = new Date(`${logDateFilter.endDate}T23:59:59`).getTime();

// //     filtered = filtered.filter((log) => {
// //       const logTime = new Date(log.created_at).getTime();
// //       return logTime >= startDate && logTime <= endDate;
// //     });

// //     return filtered;
// //   };

// //   const filteredLogsForDisplay = getFilteredLogs(logs);

// //   const fetchResetRequests = useCallback(async () => {
// //     setIsFetchingResetRequests(true);
// //     try {
// //       const res = await authFetch(`/api/admin/reset-requests`);
// //       if (res.ok) {
// //         const data = await res.json();
// //         setResetRequests(data);
// //         setResetCount(data.length);
// //       }
// //     } finally {
// //       setIsFetchingResetRequests(false);
// //     }
// //   }, [tenant.id]);

// //   const fetchSalesRepCount = async () => {
// //     const res = await authFetch(`/api/tenant/${tenant.id}/users`);
// //     if (res.ok) {
// //       const data = await res.json();
// //       const count = data.filter(
// //         (u: any) => u.role === "sales_rep" && u.is_active !== false,
// //       ).length;
// //       setSalesRepCount(count);
// //     }
// //   };

// //   const fetchEquipment = async () => {
// //     const res = await authFetch(`/api/tenant/${tenant.id}/equipment`);
// //     if (res.ok) {
// //       const data = await res.json();
// //       const mapped = data.map((eq: any) => ({
// //         id: eq.id,
// //         name: eq.name,
// //         category: eq.category,
// //         width: eq.width,
// //         depth: eq.depth,
// //         height: eq.height,
// //         color: eq.color,
// //         modelUrl: eq.model_url,
// //         animationsEnabled: !!eq.animations_enabled,
// //         imageUrl: eq.image_url || null,
// //         isActive: Number(eq.is_active) !== 0,
// //       }));
// //       setEquipment(mapped);
// //     }
// //   };

// //   const getEquipmentNameById = (id: string) =>
// //     getEquipmentNameByIdFromList(id, equipment);

// //   // Add equipment stats state and fetch:
// //   const [equipmentStats, setEquipmentStats] = useState({
// //     total: 0,
// //     active: 0,
// //     inactive: 0,
// //   });

// //   const fetchEquipmentStats = async () => {
// //     const res = await authFetch(`/api/tenant/${tenant.id}/equipment/stats`);
// //     if (res.ok) {
// //       const data = await res.json();
// //       setEquipmentStats(data);
// //     }
// //   };

// //   const fetchDisabledDefaults = async () => {
// //     const res = await authFetch(`/api/tenant/${tenant.id}/disabled-defaults`);
// //     if (res.ok) {
// //       const ids: string[] = await res.json();
// //       setDisabledDefaults(new Set(ids));
// //     }
// //   };

// //   const fetchActiveProjects = async () => {
// //     const res = await authFetch(`/api/tenant/${tenant.id}/active-projects`);
// //     if (res.ok) {
// //       const data = await res.json();
// //       setActiveProjectCount(data.count);
// //     }
// //   };

// //   const fetchProjectStats = async () => {
// //     const res = await authFetch(`/api/tenant/${tenant.id}/project-stats`);
// //     if (res.ok) {
// //       const data = await res.json();
// //       setProjectStats(data);
// //     }
// //   };

// //   const [activeProjectCount, setActiveProjectCount] = useState(0);
// //   const [projectStats, setProjectStats] = useState<any[]>([]);

// //   useEffect(() => {
// //     fetchEquipment();
// //     fetchEquipmentStats();
// //     fetchDisabledDefaults();
// //     fetchLogs();
// //     fetchActiveProjects();
// //     fetchProjectStats();
// //   }, [tenant.id]);

// //   useEffect(() => {
// //     if (activeTab === "logs") {
// //       fetchLogs();
// //     }
// //   }, [activeTab, tenant.id]);

// //   // Add resolve handler
// //   const handleResolveReset = async (requestId: string) => {
// //     const tempPwd = tempPasswords[requestId];
// //     if (!tempPwd || tempPwd.length < 8) {
// //       return alert("Temp password must be at least 8 characters");
// //     }

// //     const res = await authFetch(
// //       `/api/admin/reset-requests/${requestId}/resolve`,
// //       {
// //         method: "POST",
// //         body: JSON.stringify({ temp_password: tempPwd }),
// //       },
// //     );

// //     if (res.ok) {
// //       alert("Temporary password set. Share it with the user.");
// //       fetchResetRequests();
// //     }
// //   };

// //   const handleAddEquipment = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     const id = uuidv4();
// //     const res = await authFetch(`/api/tenant/${tenant.id}/equipment`, {
// //       method: "POST",
// //       headers: { "Content-Type": "application/json" },
// //       body: JSON.stringify({
// //         id,
// //         name: newEquipment.name,
// //         category: newEquipment.category,
// //         width: newEquipment.width,
// //         depth: newEquipment.depth,
// //         height: newEquipment.height,
// //         color: newEquipment.color,
// //         model_url: newEquipment.modelUrl || null,
// //         image_url: newEquipment.imageUrl || null,
// //       }),
// //     });

// //     if (res.ok) {
// //       setIsAddingEquipment(false);
// //       setNewEquipment({
// //         name: "",
// //         category: "slides",
// //         width: 5,
// //         depth: 5,
// //         height: 5,
// //         color: "#14b8a6",
// //         imageUrl: "",
// //       });
// //       fetchEquipment();
// //     }
// //   };

// //   const handleUpdateEquipment = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     if (!editingEquipment) return;

// //     const res = await authFetch(
// //       `/api/tenant/${tenant.id}/equipment/${editingEquipment.id}`,
// //       {
// //         method: "PUT",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({
// //           id: editingEquipment.id,
// //           name: editingEquipment.name,
// //           category: editingEquipment.category,
// //           width: editingEquipment.width,
// //           depth: editingEquipment.depth,
// //           height: editingEquipment.height,
// //           color: editingEquipment.color,
// //           model_url: editingEquipment.modelUrl || null,
// //           image_url: editingEquipment.imageUrl || null,
// //         }),
// //       },
// //     );

// //     if (res.ok) {
// //       setEditingEquipment(null);
// //       fetchEquipment();
// //     }
// //   };

// //   const handleDeleteEquipment = async (id: string) => {
// //     if (!confirm("Are you sure you want to delete this equipment?")) return;

// //     const res = await authFetch(`/api/tenant/${tenant.id}/equipment/${id}`, {
// //       method: "DELETE",
// //     });

// //     if (res.ok) {
// //       fetchEquipment();
// //     }
// //   };

// //   const handleToggleActive = async (id: string, currentlyActive: boolean) => {
// //     // Optimistic UI: flip the equipment state immediately so counts and badges update
// //     setEquipment((prev) =>
// //       prev.map((eq) =>
// //         eq.id === id ? { ...eq, isActive: !currentlyActive } : eq,
// //       ),
// //     );

// //     // Optimistically adjust equipmentStats
// //     const prevStats = { ...equipmentStats };
// //     setEquipmentStats((s) => ({
// //       ...s,
// //       active: s.active + (currentlyActive ? -1 : 1),
// //       inactive: s.inactive + (currentlyActive ? 1 : -1),
// //     }));

// //     const res = await authFetch(
// //       `/api/tenant/${tenant.id}/equipment/${id}/toggle`,
// //       {
// //         method: "PATCH",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({ is_active: currentlyActive ? 0 : 1 }),
// //       },
// //     );

// //     if (res.ok) {
// //       // Confirm counts with server to avoid drift
// //       fetchEquipmentStats();
// //     } else {
// //       // Revert optimistic changes on failure
// //       setEquipment((prev) =>
// //         prev.map((eq) =>
// //           eq.id === id ? { ...eq, isActive: currentlyActive } : eq,
// //         ),
// //       );
// //       setEquipmentStats(prevStats);
// //     }
// //   };

// //   // Toggle a DEFAULT_LIBRARY item on/off for this tenant
// //   const handleToggleDefault = async (equipmentId: string) => {
// //     const isCurrentlyDisabled = disabledDefaults.has(equipmentId);
// //     console.log(
// //       `Toggling default equipment ${equipmentId}. Currently disabled: ${isCurrentlyDisabled}`,
// //     );
// //     // Optimistic update
// //     setDisabledDefaults((prev) => {
// //       const next = new Set(prev);
// //       isCurrentlyDisabled ? next.delete(equipmentId) : next.add(equipmentId);
// //       return next;
// //     });

// //     // Optimistically adjust equipmentStats (DEFAULT library counts are included)
// //     const prevStats = { ...equipmentStats };
// //     setEquipmentStats((s) => ({
// //       ...s,
// //       active: s.active + (isCurrentlyDisabled ? 1 : -1),
// //       inactive: s.inactive + (isCurrentlyDisabled ? -1 : 1),
// //     }));

// //     const res = await authFetch(
// //       `/api/tenant/${tenant.id}/disabled-defaults/${equipmentId}`,
// //       {
// //         method: "POST",
// //       },
// //     );

// //     if (res.ok) {
// //       // Refresh stats to ensure counts are accurate
// //       await fetchEquipmentStats();
// //     } else {
// //       // Revert both disabledDefaults and stats on failure
// //       setDisabledDefaults((prev) => {
// //         const next = new Set(prev);
// //         isCurrentlyDisabled ? next.add(equipmentId) : next.delete(equipmentId);
// //         return next;
// //       });
// //       setEquipmentStats(prevStats);
// //     }
// //   };

// //   return (
// //     <div className="flex h-screen w-screen bg-theme-bg text-theme-text overflow-auto transition-colors duration-300">
// //       {/* Sidebar */}
// //       {/* <aside className="w-64 border-r border-theme-border flex flex-col"> */}
// //       <aside className="w-48 lg:w-64 shrink-0 border-r border-theme-border flex flex-col overflow-y-auto">
// //         <div className="p-6 border-b border-theme-border">
// //           <div className="flex items-center justify-between mb-4">
// //             <div className="flex items-center gap-3">
// //               <img
// //                 src={tenant.logo_url}
// //                 alt="Logo"
// //                 className="w-8 h-8 rounded-lg object-cover"
// //               />
// //               <div>
// //                 <h1 className="text-sm font-bold truncate">{tenant.name}</h1>
// //                 <p className="text-[10px] opacity-40 uppercase tracking-widest">
// //                   Admin Portal
// //                 </p>
// //               </div>
// //             </div>
// //           </div>
// //           <button
// //             onClick={() => setActiveTab("profile")}
// //             className={clsx(
// //               "w-full flex items-center gap-3 p-2 rounded-lg transition-all text-xs font-bold uppercase tracking-widest group",
// //               activeTab === "profile"
// //                 ? "bg-brand-teal/10 text-brand-teal"
// //                 : "opacity-40 hover:opacity-100 hover:bg-white/5",
// //             )}
// //           >
// //             <UserIcon className="w-4 h-4" />
// //             View Profile
// //           </button>
// //         </div>

// //         <nav className="flex-1 p-4 space-y-2">
// //           <NavButton
// //             active={activeTab === "overview"}
// //             onClick={() => setActiveTab("overview")}
// //             icon={<LayoutDashboard className="w-4 h-4" />}
// //             label="Overview"
// //           />
// //           <NavButton
// //             active={activeTab === "resets"}
// //             onClick={() => {
// //               setActiveTab("resets");
// //               fetchResetRequests();
// //             }}
// //             icon={<KeyRound className="w-4 h-4" />}
// //             label="Password Resets"
// //             badge={ResetCount > 0 ? ResetCount : undefined}
// //           />
// //           <NavButton
// //             active={activeTab === "locked-accounts"}
// //             onClick={() => setActiveTab("locked-accounts")}
// //             icon={<Lock className="w-4 h-4" />}
// //             label="Locked Accounts"
// //           />
// //           <NavButton
// //             active={activeTab === "logs"}
// //             onClick={() => setActiveTab("logs")}
// //             icon={<Activity className="w-4 h-4" />}
// //             label="Activity Logs"
// //           />
// //           <NavButton
// //             active={activeTab === "equipment"}
// //             onClick={() => setActiveTab("equipment")}
// //             icon={<Package className="w-4 h-4" />}
// //             label="Equipment Repo"
// //           />
// //           <NavButton
// //             active={activeTab === "users"}
// //             onClick={() => setActiveTab("users")}
// //             icon={<Users className="w-4 h-4" />}
// //             label="Sales Team"
// //           />
// //           <NavButton
// //             active={activeTab === "projects"}
// //             onClick={() => setActiveTab("projects")}
// //             icon={<FolderOpen className="w-4 h-4" />}
// //             label="Project Stats"
// //           />
// //           <NavButton
// //             active={activeTab === "settings"}
// //             onClick={() => setActiveTab("settings")}
// //             icon={<Settings className="w-4 h-4" />}
// //             label="Settings"
// //           />
// //         </nav>

// //         <div className="p-4 border-t border-theme-border">
// //           <button
// //             onClick={onLogout}
// //             className="w-full flex items-center gap-3 p-3 opacity-40 hover:opacity-100 hover:bg-white/5 rounded-xl transition-all text-sm"
// //           >
// //             <LogOut className="w-4 h-4" />
// //             Sign Out
// //           </button>
// //         </div>
// //       </aside>

// //       {/* Main Content */}
// //       {/* <main className="flex-1 overflow-y-auto p-8 custom-scrollbar"> */}
// //       <main className="flex-1 overflow-auto p-4 lg:p-8 custom-scrollbar min-w-0">
// //         <header className="flex justify-between items-center mb-8">
// //           {/* <div>
// //             <h2 className="text-2xl font-bold tracking-tight"> */}
// //           <div className="min-w-0 flex-1 mr-4">
// //             <h2 className="text-lg lg:text-2xl font-bold tracking-tight truncate">
// //               {activeTab === "overview" && "Dashboard Overview"}
// //               {activeTab === "equipment" && "Equipment Repository"}
// //               {activeTab === "users" && "Sales Team Management"}
// //               {activeTab === "settings" && "Company Settings"}
// //               {activeTab === "profile" && "Profile"}
// //               {activeTab === "resets" && "Password Reset Requests"}
// //               {activeTab === "locked-accounts" && "Locked Accounts"}
// //               {activeTab === "logs" && "Activity Logs"}
// //               {activeTab === "projects" && "Project Statistics"}
// //             </h2>
// //             <p className="text-sm opacity-40">Welcome back, {user.name}</p>
// //           </div>

// //           {(activeTab === "equipment" || activeTab === "users") && (
// //             <div className="flex items-center gap-3 shrink-0">
// //               {/*  Show user count badge only on users tab */}
// //               {activeTab === "users" && (
// //                 <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-white/5 border border-theme-border rounded-lg">
// //                   {/* We need to pass the count down — see below */}
// //                   Sales Reps: {salesRepCount} / 10
// //                 </span>
// //               )}
// //               <button
// //                 onClick={() =>
// //                   activeTab === "equipment"
// //                     ? setIsAddingEquipment(true)
// //                     : setIsAddingUser(true)
// //                 }
// //                 disabled={activeTab === "users" && salesRepCount >= 10} // disable at limit
// //                 className={clsx(
// //                   "flex items-center gap-1 lg:gap-2 px-2 lg:px-4 py-2 text-[10px] lg:text-xs font-bold uppercase tracking-widest rounded-lg transition-all shadow-lg shrink-0",
// //                   activeTab === "users" && salesRepCount >= 10
// //                     ? "bg-white/10 text-white/30 cursor-not-allowed shadow-none" // greyed out
// //                     : "bg-brand-teal text-white hover:bg-brand-teal/90 shadow-brand-teal/20",
// //                 )}
// //               >
// //                 <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
// //                 <span className="hidden sm:inline">
// //                   {activeTab === "equipment"
// //                     ? "Add New Equipment"
// //                     : "Add Person"}
// //                 </span>
// //                 <span className="sm:hidden">
// //                   <Plus className="w-3 h-3" />
// //                 </span>
// //               </button>
// //             </div>
// //           )}
// //         </header>

// //         {activeTab === "overview" && (
// //           <OverviewTab
// //             tenant={tenant}
// //             equipmentStats={equipmentStats}
// //             activeProjectCount={activeProjectCount}
// //             projectStats={projectStats}
// //             recentLogs={overviewLogs}
// //             equipment={equipment}
// //             getEquipmentNameById={getEquipmentNameById}
// //           />
// //         )}
// //         {activeTab === "equipment" && (
// //           <div className="flex items-center gap-3 mb-6 flex-wrap">
// //             <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
// //               Active: {equipmentStats.active}
// //             </span>
// //             <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg">
// //               Inactive: {equipmentStats.inactive}
// //             </span>
// //             <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-white/5 border border-theme-border rounded-lg">
// //               Total: {equipmentStats.total}
// //             </span>
// //             <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg">
// //               Default Active: {DEFAULT_LIBRARY.length - disabledDefaults.size}
// //             </span>
// //           </div>
// //         )}
// //         {activeTab === "equipment" && (
// //           <EquipmentTab
// //             equipment={equipment}
// //             searchQuery={searchQuery}
// //             setSearchQuery={setSearchQuery}
// //             isAdding={isAddingEquipment}
// //             setIsAdding={setIsAddingEquipment}
// //             editingItem={editingEquipment}
// //             setEditingItem={setEditingEquipment}
// //             newEquipment={newEquipment}
// //             setNewEquipment={setNewEquipment}
// //             onAdd={handleAddEquipment}
// //             onUpdate={handleUpdateEquipment}
// //             onDelete={handleDeleteEquipment}
// //             onToggleActive={handleToggleActive}
// //             disabledDefaults={disabledDefaults}
// //             onToggleDefault={handleToggleDefault}
// //           />
// //         )}
// //         {activeTab === "users" && (
// //           <UsersTab
// //             tenant={tenant}
// //             isAdding={isAddingUser}
// //             setIsAdding={setIsAddingUser}
// //             salesRepCount={salesRepCount}
// //             setSalesRepCount={setSalesRepCount}
// //           />
// //         )}
// //         {activeTab === "projects" && (
// //           <ProjectStatsTab projectStats={projectStats} tenant={tenant} />
// //         )}
// //         {activeTab === "settings" && (
// //           <SettingsTab theme={theme} onThemeChange={setTheme} />
// //         )}
// //         {activeTab === "profile" && (
// //           <ProfileTab
// //             user={user}
// //             onUserUpdate={onUserUpdate}
// //             onProfileSaved={fetchLogs}
// //             onShowToast={onShowToast}
// //           />
// //         )}

// //         {activeTab === "locked-accounts" && (
// //           <LockedAccountsPanel userRole="tenant_admin" tenantId={tenant.id} />
// //         )}

// //         {activeTab === "logs" &&
// //           (() => {
// //             return (
// //               <div className="space-y-4">
// //                 {/* Date Range Filter */}
// //                 <div className="p-4 bg-theme-card border border-theme-border rounded-2xl space-y-3">
// //                   <h4 className="text-sm font-bold uppercase tracking-widest opacity-60">
// //                     Filter by Date
// //                   </h4>
// //                   <div className="grid grid-cols-2 gap-4">
// //                     <div>
// //                       <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-2">
// //                         From Date
// //                       </label>
// //                       <input
// //                         type="date"
// //                         value={logDateFilter.startDate}
// //                         onChange={(e) =>
// //                           setLogDateFilter((prev) => ({
// //                             ...prev,
// //                             startDate: e.target.value,
// //                           }))
// //                         }
// //                         className="w-full px-3 py-2 bg-white/5 border border-theme-border rounded-lg text-sm font-medium transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-teal"
// //                       />
// //                     </div>
// //                     <div>
// //                       <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-2">
// //                         To Date
// //                       </label>
// //                       <input
// //                         type="date"
// //                         value={logDateFilter.endDate}
// //                         onChange={(e) =>
// //                           setLogDateFilter((prev) => ({
// //                             ...prev,
// //                             endDate: e.target.value,
// //                           }))
// //                         }
// //                         className="w-full px-3 py-2 bg-white/5 border border-theme-border rounded-lg text-sm font-medium transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-teal"
// //                       />
// //                     </div>
// //                   </div>
// //                   <button
// //                     onClick={() => {
// //                       const today = new Date().toISOString().split("T")[0];
// //                       setLogDateFilter({ startDate: today, endDate: today });
// //                     }}
// //                     className="w-full py-2 bg-white/5 hover:bg-white/10 border border-theme-border rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors"
// //                   >
// //                     Reset to Today
// //                   </button>
// //                 </div>

// //                 {/* Type Filter bar */}
// //                 <div className="flex items-center gap-2 flex-wrap">
// //                   {[
// //                     "all",
// //                     "auth",
// //                     "sales_rep",
// //                     "equipment",
// //                     "project",
// //                     "password_reset",
// //                     "profile",
// //                   ].map((filter) => (
// //                     <button
// //                       key={filter}
// //                       onClick={() => setLogFilter(filter)}
// //                       className={clsx(
// //                         "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all border",
// //                         logFilter === filter
// //                           ? "bg-brand-teal text-white border-brand-teal"
// //                           : "bg-white/5 border-theme-border opacity-60 hover:opacity-100",
// //                       )}
// //                     >
// //                       {filter === "all"
// //                         ? "All Activity"
// //                         : filter.replace("_", " ")}
// //                     </button>
// //                   ))}
// //                 </div>

// //                 {/* Log entries */}
// //                 <div className="space-y-2">
// //                   {filteredLogsForDisplay.length === 0 ? (
// //                     <div className="py-20 text-center border border-dashed border-theme-border rounded-2xl">
// //                       <Activity className="w-12 h-12 opacity-10 mx-auto mb-4" />
// //                       <p className="text-sm opacity-40 italic">
// //                         No activity logs found for the selected date range.
// //                       </p>
// //                     </div>
// //                   ) : (
// //                     filteredLogsForDisplay.map((log) => (
// //                       <div
// //                         key={log.id}
// //                         className="flex items-start gap-4 p-4 bg-theme-card border border-theme-border rounded-xl hover:bg-white/5 transition-colors"
// //                       >
// //                         <div
// //                           className={clsx(
// //                             "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
// //                             log.action === "CREATE" &&
// //                               "bg-emerald-500/20 text-emerald-400",
// //                             log.action === "UPDATE" &&
// //                               !log.details
// //                                 ?.toLowerCase()
// //                                 .includes("archived") &&
// //                               "bg-blue-500/20 text-blue-400",
// //                             log.action === "UPDATE" &&
// //                               log.details?.toLowerCase().includes("archived") &&
// //                               "bg-amber-500/20 text-amber-400",
// //                             log.action === "DELETE" &&
// //                               "bg-red-500/20 text-red-400",
// //                             log.action === "LOGIN" &&
// //                               "bg-brand-teal/20 text-brand-teal",
// //                             log.action === "LOGIN_FAILED" &&
// //                               "bg-red-500/20 text-red-400",
// //                             log.action === "SAVE" &&
// //                               "bg-purple-500/20 text-purple-400",
// //                             log.action === "REQUEST" &&
// //                               "bg-amber-500/20 text-amber-400",
// //                             log.action === "RESOLVE" &&
// //                               "bg-emerald-500/20 text-emerald-400",
// //                             log.action === "SHARE" &&
// //                               "bg-sky-500/20 text-sky-400",
// //                           )}
// //                         >
// //                           {log.action === "CREATE" && (
// //                             <Plus className="w-4 h-4" />
// //                           )}
// //                           {log.action === "UPDATE" &&
// //                             !log.details
// //                               ?.toLowerCase()
// //                               .includes("archived") && (
// //                               <Pencil className="w-4 h-4" />
// //                             )}
// //                           {log.action === "UPDATE" &&
// //                             log.details?.toLowerCase().includes("archived") && (
// //                               <Archive className="w-4 h-4" />
// //                             )}
// //                           {log.action === "DELETE" && (
// //                             <Trash2 className="w-4 h-4" />
// //                           )}
// //                           {log.action === "LOGIN" && (
// //                             <UserIcon className="w-4 h-4" />
// //                           )}
// //                           {log.action === "LOGIN_FAILED" && (
// //                             <ShieldAlert className="w-4 h-4" />
// //                           )}
// //                           {log.action === "SAVE" && (
// //                             <ShieldCheck className="w-4 h-4" />
// //                           )}
// //                           {log.action === "REQUEST" && (
// //                             <KeyRound className="w-4 h-4" />
// //                           )}
// //                           {log.action === "RESOLVE" && (
// //                             <ShieldCheck className="w-4 h-4" />
// //                           )}
// //                           {log.action === "SHARE" && (
// //                             <Share2 className="w-4 h-4" />
// //                           )}
// //                         </div>

// //                         <div className="flex-1 min-w-0">
// //                           <div className="flex items-start justify-between gap-2 flex-wrap">
// //                             <div className="flex items-center gap-2 flex-wrap">
// //                               <span
// //                                 className={clsx(
// //                                   "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded",
// //                                   log.action === "CREATE" &&
// //                                     "bg-emerald-500/20 text-emerald-400",
// //                                   log.action === "UPDATE" &&
// //                                     !log.details
// //                                       ?.toLowerCase()
// //                                       .includes("archived") &&
// //                                     "bg-blue-500/20 text-blue-400",
// //                                   log.action === "UPDATE" &&
// //                                     log.details
// //                                       ?.toLowerCase()
// //                                       .includes("archived") &&
// //                                     "bg-amber-500/20 text-amber-400",
// //                                   log.action === "DELETE" &&
// //                                     "bg-red-500/20 text-red-400",
// //                                   log.action === "LOGIN" &&
// //                                     "bg-brand-teal/20 text-brand-teal",
// //                                   log.action === "LOGIN_FAILED" &&
// //                                     "bg-red-500/20 text-red-400",
// //                                   log.action === "SAVE" &&
// //                                     "bg-purple-500/20 text-purple-400",
// //                                   log.action === "REQUEST" &&
// //                                     "bg-amber-500/20 text-amber-400",
// //                                   log.action === "RESOLVE" &&
// //                                     "bg-emerald-500/20 text-emerald-400",
// //                                   log.action === "SHARE" &&
// //                                     "bg-sky-500/20 text-sky-400",
// //                                 )}
// //                               >
// //                                 {log.action === "UPDATE" &&
// //                                 log.details?.toLowerCase().includes("archived")
// //                                   ? "ARCHIVE"
// //                                   : log.action === "LOGIN_FAILED"
// //                                     ? "FAILED LOGIN"
// //                                     : log.action}
// //                               </span>
// //                               <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 text-white/40">
// //                                 {log.entity_type.replace("_", " ")}
// //                               </span>
// //                             </div>
// //                             <div className="flex items-center gap-1 text-[10px] opacity-30 shrink-0">
// //                               <Clock className="w-3 h-3" />
// //                               {/* {new Date(log.created_at + 'Z').toLocaleString()} */}
// //                               {new Date(log.created_at).toLocaleString()}
// //                             </div>
// //                           </div>
// //                           <p className="text-sm font-medium mt-1 truncate">
// //                             {getLogEntityDisplayName(log, equipment)}
// //                           </p>
// //                           <div className="flex items-center gap-3 mt-1 flex-wrap">
// //                             <span className="text-[10px] opacity-40">
// //                               by {log.user_name}
// //                             </span>
// //                             {log.details && (
// //                               <span className="text-[10px] opacity-30 truncate">
// //                                 {log.details}
// //                               </span>
// //                             )}
// //                           </div>
// //                         </div>
// //                       </div>
// //                     ))
// //                   )}
// //                 </div>
// //               </div>
// //             );
// //           })()}

// //         {activeTab === "resets" && (
// //           <div className="space-y-4">
// //             <div className="flex items-center justify-between gap-4">
// //               <h3 className="text-lg font-bold">Password Reset Requests</h3>
// //               <button
// //                 onClick={fetchResetRequests}
// //                 className="inline-flex items-center gap-2 rounded-full border border-theme-border bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest transition hover:bg-white/10"
// //                 disabled={isFetchingResetRequests}
// //               >
// //                 {isFetchingResetRequests ? "Refreshing..." : "Refresh"}
// //               </button>
// //             </div>
// //             {resetRequests.length === 0 ? (
// //               <div className="py-20 text-center border border-dashed border-theme-border rounded-2xl">
// //                 <p className="text-sm opacity-40 italic">
// //                   No pending password reset requests.
// //                 </p>
// //               </div>
// //             ) : (
// //               resetRequests.map((req) => (
// //                 <div
// //                   key={req.id}
// //                   className="p-6 bg-theme-card border border-theme-border rounded-2xl space-y-4"
// //                 >
// //                   <div className="flex items-center justify-between">
// //                     <div>
// //                       <p className="font-bold text-sm">{req.user_name}</p>
// //                       <p className="text-xs opacity-40">{req.email}</p>
// //                       <p className="text-[10px] opacity-30 mt-1">
// //                         Requested: {new Date(req.created_at).toLocaleString()}
// //                       </p>
// //                     </div>
// //                     <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-amber-500/20 text-amber-400 rounded">
// //                       Pending
// //                     </span>
// //                   </div>
// //                   <div className="flex gap-3">
// //                     <input
// //                       type="text"
// //                       placeholder="Set temporary password (min 8 chars)"
// //                       value={tempPasswords[req.id] || ""}
// //                       onChange={(e) =>
// //                         setTempPasswords({
// //                           ...tempPasswords,
// //                           [req.id]: e.target.value,
// //                         })
// //                       }
// //                       className="flex-1 bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
// //                     />
// //                     <button
// //                       onClick={() => handleResolveReset(req.id)}
// //                       className="px-4 py-2 bg-brand-teal text-white text-xs font-bold rounded-lg hover:bg-brand-teal/90 transition-all"
// //                     >
// //                       Set & Resolve
// //                     </button>
// //                   </div>
// //                 </div>
// //               ))
// //             )}
// //           </div>
// //         )}
// //       </main>
// //     </div>
// //   );
// // }

// // function NavButton({
// //   active,
// //   onClick,
// //   icon,
// //   label,
// //   badge,
// // }: {
// //   active: boolean;
// //   onClick: () => void;
// //   icon: React.ReactNode;
// //   label: string;
// //   badge?: number;
// // }) {
// //   return (
// //     <button
// //       onClick={onClick}
// //       className={clsx(
// //         "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm group",
// //         active
// //           ? "bg-brand-teal text-white shadow-lg shadow-brand-teal/10"
// //           : "opacity-60 hover:opacity-100 hover:bg-white/5",
// //       )}
// //     >
// //       <div
// //         className={clsx(
// //           active ? "text-white" : "opacity-40 group-hover:opacity-100",
// //         )}
// //       >
// //         {icon}
// //       </div>
// //       {label}

// //       {badge !== undefined && (
// //         <span
// //           className={clsx(
// //             "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
// //             active
// //               ? "bg-white/20 text-white"
// //               : "bg-amber-500/20 text-amber-400",
// //           )}
// //         >
// //           {badge}
// //         </span>
// //       )}
// //     </button>
// //   );
// // }

// // function OverviewTab({
// //   tenant,
// //   equipmentStats,
// //   activeProjectCount,
// //   projectStats,
// //   recentLogs,
// //   equipment,
// //   getEquipmentNameById,
// // }: {
// //   tenant: Tenant;
// //   equipmentStats: { total: number; active: number; inactive: number };
// //   activeProjectCount: number;
// //   projectStats: any[];
// //   recentLogs: any[];
// //   equipment: EquipmentDef[];
// //   getEquipmentNameById: (id: string) => string;
// // }) {
// //   return (
// //     <div className="space-y-8">
// //       {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"> */}
// //       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
// //         <StatCard
// //           label="Active Projects"
// //           value={activeProjectCount.toString()}
// //           trend="last 5 days"
// //           icon={<LayoutDashboard className="w-5 h-5" />}
// //         />
// //         <StatCard
// //           label="Total Equipment"
// //           value={equipmentStats.total.toString()}
// //           trend={`${equipmentStats.active} active`}
// //           icon={<Package className="w-5 h-5" />}
// //         />
// //         {/* <StatCard
// //           label="Sales Activity"
// //           value="89%"
// //           trend="+2%"
// //           icon={<TrendingUp className="w-5 h-5" />}
// //         /> */}
// //       </div>

// //       <div className="p-6 bg-theme-card border border-theme-border rounded-2xl">
// //         <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">
// //           Recent Activity
// //         </h3>
// //         <div className="space-y-4">
// //           {recentLogs.length === 0 ? (
// //             <div className="py-20 text-center border border-dashed border-theme-border rounded-2xl">
// //               <p className="text-sm opacity-40 italic">
// //                 No recent activity yet.
// //               </p>
// //             </div>
// //           ) : (
// //             recentLogs.map((log) => {
// //               const isArchive =
// //                 log.action === "UPDATE" &&
// //                 log.details?.toLowerCase().includes("archived");
// //               const iconBg = clsx(
// //                 "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
// //                 log.action === "CREATE" && "bg-emerald-500/20 text-emerald-400",
// //                 log.action === "UPDATE" &&
// //                   !isArchive &&
// //                   "bg-blue-500/20 text-blue-400",
// //                 isArchive && "bg-amber-500/20 text-amber-400",
// //                 log.action === "DELETE" && "bg-red-500/20 text-red-400",
// //                 log.action === "LOGIN" && "bg-brand-teal/20 text-brand-teal",
// //                 log.action === "LOGIN_FAILED" && "bg-red-500/20 text-red-400",
// //                 log.action === "SAVE" && "bg-purple-500/20 text-purple-400",
// //                 log.action === "REQUEST" && "bg-amber-500/20 text-amber-400",
// //                 log.action === "RESOLVE" &&
// //                   "bg-emerald-500/20 text-emerald-400",
// //                 log.action === "SHARE" && "bg-sky-500/20 text-sky-400",
// //               );
// //               return (
// //                 <div
// //                   key={log.id}
// //                   className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-theme-border"
// //                 >
// //                   <div className="flex items-center gap-4">
// //                     <div className={iconBg}>
// //                       {log.action === "CREATE" && <Plus className="w-5 h-5" />}
// //                       {log.action === "UPDATE" && !isArchive && (
// //                         <Pencil className="w-5 h-5" />
// //                       )}
// //                       {isArchive && <Archive className="w-5 h-5" />}
// //                       {log.action === "DELETE" && (
// //                         <Trash2 className="w-5 h-5" />
// //                       )}
// //                       {log.action === "LOGIN" && (
// //                         <UserIcon className="w-5 h-5" />
// //                       )}
// //                       {log.action === "LOGIN_FAILED" && (
// //                         <ShieldAlert className="w-5 h-5" />
// //                       )}
// //                       {log.action === "SAVE" && (
// //                         <ShieldCheck className="w-5 h-5" />
// //                       )}
// //                       {log.action === "REQUEST" && (
// //                         <KeyRound className="w-5 h-5" />
// //                       )}
// //                       {log.action === "RESOLVE" && (
// //                         <ShieldCheck className="w-5 h-5" />
// //                       )}
// //                       {log.action === "SHARE" && <Share2 className="w-5 h-5" />}
// //                     </div>
// //                     <div>
// //                       <p className="text-sm font-medium">
// //                         {getLogEntityDisplayName(log, equipment)}
// //                       </p>
// //                       <p className="text-[10px] opacity-40 uppercase tracking-widest">
// //                         {isArchive
// //                           ? "ARCHIVE"
// //                           : log.action === "LOGIN_FAILED"
// //                             ? "FAILED LOGIN"
// //                             : log.entity_type
// //                               ? log.entity_type.replace("_", " ")
// //                               : log.action}
// //                         {log.user_name ? ` · by ${log.user_name}` : ""}
// //                       </p>
// //                     </div>
// //                   </div>
// //                   <ChevronRight className="w-4 h-4 opacity-20" />
// //                 </div>
// //               );
// //             })
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // // Custom-styled searchable combobox for the equipment category field.
// // // Native <select>/<datalist> can't be themed for dark mode, which is why
// // // the browser-native version looked washed out. This renders our own
// // // dropdown so every option is legible and hover state is obvious, while
// // // still letting the user type a brand new category.
// // function CategoryCombobox({
// //   value,
// //   onChange,
// //   options,
// // }: {
// //   value: string;
// //   onChange: (value: string) => void;
// //   options: string[];
// // }) {
// //   const [isOpen, setIsOpen] = useState(false);
// //   const containerRef = React.useRef<HTMLDivElement>(null);

// //   useEffect(() => {
// //     const handleClickOutside = (e: MouseEvent) => {
// //       if (
// //         containerRef.current &&
// //         !containerRef.current.contains(e.target as Node)
// //       ) {
// //         setIsOpen(false);
// //       }
// //     };
// //     document.addEventListener("mousedown", handleClickOutside);
// //     return () => document.removeEventListener("mousedown", handleClickOutside);
// //   }, []);

// //   const trimmedValue = value.trim();
// //   const exactMatch = options.some(
// //     (opt) => opt.toLowerCase() === trimmedValue.toLowerCase(),
// //   );
// //   // Show the full list when the field is empty or already holds a complete,
// //   // existing category (so the user can browse alternatives). Only filter
// //   // down while they're actively typing something that isn't a match yet.
// //   const showAllOptions = trimmedValue === "" || exactMatch;
// //   const visibleOptions = showAllOptions
// //     ? options
// //     : options.filter((opt) =>
// //         opt.toLowerCase().includes(trimmedValue.toLowerCase()),
// //       );

// //   return (
// //     <div className="relative" ref={containerRef}>
// //       <div className="relative">
// //         <input
// //           required
// //           type="text"
// //           autoComplete="off"
// //           value={value}
// //           onChange={(e) => {
// //             onChange(e.target.value);
// //             setIsOpen(true);
// //           }}
// //           onFocus={() => setIsOpen(true)}
// //           placeholder="Select existing or type a new category"
// //           className="w-full bg-white/5 border border-theme-border rounded-lg pl-4 pr-9 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
// //         />
// //         <button
// //           type="button"
// //           tabIndex={-1}
// //           onClick={() => setIsOpen((o) => !o)}
// //           className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-40 hover:opacity-100 transition-opacity"
// //         >
// //           <ChevronDown
// //             className={clsx(
// //               "w-4 h-4 transition-transform",
// //               isOpen && "rotate-180",
// //             )}
// //           />
// //         </button>
// //       </div>

// //       {isOpen && (visibleOptions.length > 0 || trimmedValue !== "") && (
// //         <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-theme-bg border border-theme-border rounded-lg shadow-2xl py-1">
// //           {visibleOptions.map((option) => (
// //             <button
// //               key={option}
// //               type="button"
// //               onMouseDown={(e) => e.preventDefault()}
// //               onClick={() => {
// //                 onChange(option);
// //                 setIsOpen(false);
// //               }}
// //               className={clsx(
// //                 "w-full text-left px-4 py-2 text-sm transition-colors hover:bg-brand-teal/20 hover:text-brand-teal",
// //                 option.toLowerCase() === trimmedValue.toLowerCase()
// //                   ? "bg-brand-teal/10 text-brand-teal"
// //                   : "text-theme-text",
// //               )}
// //             >
// //               {option}
// //             </button>
// //           ))}
// //           {!exactMatch && trimmedValue !== "" && (
// //             <button
// //               type="button"
// //               onMouseDown={(e) => e.preventDefault()}
// //               onClick={() => {
// //                 onChange(trimmedValue);
// //                 setIsOpen(false);
// //               }}
// //               className={clsx(
// //                 "w-full text-left px-4 py-2 text-sm font-medium text-brand-teal hover:bg-brand-teal/20 transition-colors",
// //                 visibleOptions.length > 0 && "border-t border-theme-border",
// //               )}
// //             >
// //               + Create new category "{trimmedValue}"
// //             </button>
// //           )}
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // function EquipmentTab({
// //   equipment,
// //   searchQuery,
// //   setSearchQuery,
// //   isAdding,
// //   setIsAdding,
// //   editingItem,
// //   setEditingItem,
// //   newEquipment,
// //   setNewEquipment,
// //   onAdd,
// //   onUpdate,
// //   onDelete,
// //   onToggleActive,
// //   disabledDefaults,
// //   onToggleDefault,
// // }: {
// //   equipment: EquipmentDef[];
// //   searchQuery: string;
// //   setSearchQuery: (q: string) => void;
// //   isAdding: boolean;
// //   setIsAdding: (b: boolean) => void;
// //   editingItem: EquipmentDef | null;
// //   setEditingItem: (i: EquipmentDef | null) => void;
// //   newEquipment: Partial<EquipmentDef>;
// //   setNewEquipment: (e: Partial<EquipmentDef>) => void;
// //   onAdd: (e: React.FormEvent) => void;
// //   onUpdate: (e: React.FormEvent) => void;
// //   onDelete: (id: string) => void;
// //   onToggleActive: (id: string, currentlyActive: boolean) => void;
// //   disabledDefaults: Set<string>;
// //   onToggleDefault: (id: string) => void;
// // }) {
// //   const filteredEquipment = equipment.filter(
// //     (item) =>
// //       item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
// //       item.category.toLowerCase().includes(searchQuery.toLowerCase()),
// //   );

// //   // Categories offered in the add/edit combobox are derived from existing
// //   // equipment (default + tenant custom) rather than hardcoded, so a
// //   // category introduced anywhere shows up here automatically. Typing a
// //   // value not in this list simply creates a new category.
// //   const existingCategoryOptions = React.useMemo(() => {
// //     const seen = new Map<string, string>(); // lowercase key -> display label
// //     for (const item of [...DEFAULT_LIBRARY, ...equipment]) {
// //       const trimmed = item.category?.trim();
// //       if (!trimmed) continue;
// //       const key = trimmed.toLowerCase();
// //       if (!seen.has(key)) {
// //         const label = trimmed
// //           .split(/[\s_-]+/)
// //           .filter(Boolean)
// //           .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
// //           .join(" ");
// //         seen.set(key, label);
// //       }
// //     }
// //     return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
// //   }, [equipment]);

// //   return (
// //     <div className="space-y-6">
// //       {/* Search Bar */}
// //       <div className="relative">
// //         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
// //         <input
// //           type="text"
// //           value={searchQuery}
// //           onChange={(e) => setSearchQuery(e.target.value)}
// //           placeholder="Search equipments by name or category..."
// //           className="w-full bg-white/5 border border-theme-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
// //         />
// //       </div>
// //       {/* Add/Edit Form Overlay */}
// //       {(isAdding || editingItem) && (
// //         <motion.div
// //           initial={{ opacity: 0 }}
// //           animate={{ opacity: 1 }}
// //           className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
// //         >
// //           <motion.div
// //             initial={{ scale: 0.9, opacity: 0 }}
// //             animate={{ scale: 1, opacity: 1 }}
// //             className="bg-theme-bg border border-theme-border rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
// //           >
// //             <div className="p-6 border-b border-theme-border flex justify-between items-center">
// //               <h3 className="text-lg font-bold">
// //                 {isAdding ? "Add New Equipment" : `Edit ${editingItem?.name}`}
// //               </h3>
// //               <button
// //                 onClick={() => {
// //                   setIsAdding(false);
// //                   setEditingItem(null);
// //                   setNewEquipment({
// //                     name: "",
// //                     category: "slides",
// //                     width: 5,
// //                     depth: 5,
// //                     height: 5,
// //                     color: "#14b8a6",
// //                     imageUrl: "",
// //                   });
// //                 }}
// //                 className="p-2 hover:bg-white/5 rounded-lg transition-colors"
// //               >
// //                 <X className="w-5 h-5 opacity-40" />
// //               </button>
// //             </div>

// //             {/* <form onSubmit={isAdding ? onAdd : onUpdate} className="p-6 space-y-6"> */}
// //             {/* Make form scrollable */}
// //             <form
// //               onSubmit={isAdding ? onAdd : onUpdate}
// //               className="p-4 lg:p-6 space-y-4 lg:space-y-6 overflow-y-auto flex-1"
// //             >
// //               {/* <div className="grid grid-cols-2 gap-6"> */}
// //               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
// //                 {/* Image upload — square aspect ratio */}
// //                 <div className="space-y-2">
// //                   <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
// //                     Equipment Image
// //                   </label>
// //                   <div className="relative">
// //                     <div
// //                       className="aspect-square w-full bg-white/5 border-2 border-dashed border-theme-border rounded-xl overflow-hidden flex items-center justify-center cursor-pointer hover:border-brand-teal/50 transition-colors group"
// //                       onClick={() =>
// //                         document
// //                           .getElementById("equipment-image-upload")
// //                           ?.click()
// //                       }
// //                     >
// //                       {(
// //                         isAdding ? newEquipment.imageUrl : editingItem?.imageUrl
// //                       ) ? (
// //                         <img
// //                           //src={isAdding ? newEquipment.imageUrl ?? '' : editingItem?.imageUrl ?? ''}
// //                           src={
// //                             isAdding
// //                               ? newEquipment.imageUrl
// //                               : (editingItem?.imageUrl ?? "")
// //                           }
// //                           alt="Equipment"
// //                           className="w-full h-full object-cover"
// //                         />
// //                       ) : (
// //                         <div className="flex flex-col items-center gap-2 opacity-30 group-hover:opacity-60 transition-opacity">
// //                           <Upload className="w-8 h-8" />
// //                           <span className="text-[10px] uppercase tracking-widest">
// //                             Upload Image
// //                           </span>
// //                           <p className="text-[10px] opacity-30 text-center mt-1">
// //                             Max 1MB · Auto-compressed · Square crop
// //                           </p>
// //                         </div>
// //                       )}
// //                     </div>
// //                     <input
// //                       id="equipment-image-upload"
// //                       type="file"
// //                       accept="image/*"
// //                       className="hidden"
// //                       onChange={async (e) => {
// //                         const file = e.target.files?.[0];
// //                         if (!file) return;

// //                         const MAX_SIZE = 1 * 1024 * 1024; // 1MB

// //                         const compressImage = (
// //                           file: File,
// //                           quality: number,
// //                         ): Promise<string> => {
// //                           return new Promise((resolve) => {
// //                             const reader = new FileReader();
// //                             reader.onload = (re) => {
// //                               const img = new Image();
// //                               img.onload = () => {
// //                                 const canvas = document.createElement("canvas");

// //                                 // Maintain square aspect ratio — use the smaller dimension
// //                                 const size = Math.min(img.width, img.height);
// //                                 canvas.width = size;
// //                                 canvas.height = size;

// //                                 const ctx = canvas.getContext("2d")!;
// //                                 // Center crop to square
// //                                 const offsetX = (img.width - size) / 2;
// //                                 const offsetY = (img.height - size) / 2;
// //                                 ctx.drawImage(
// //                                   img,
// //                                   offsetX,
// //                                   offsetY,
// //                                   size,
// //                                   size,
// //                                   0,
// //                                   0,
// //                                   size,
// //                                   size,
// //                                 );

// //                                 resolve(
// //                                   canvas.toDataURL("image/jpeg", quality),
// //                                 );
// //                               };
// //                               img.src = re.target?.result as string;
// //                             };
// //                             reader.readAsDataURL(file);
// //                           });
// //                         };

// //                         // Check original size
// //                         if (file.size > MAX_SIZE) {
// //                           // Auto compress to fit under 1MB
// //                           const compressed = await compressImage(file, 0.7);

// //                           // Check if compression was enough
// //                           const compressedSize = Math.round(
// //                             (compressed.length * 3) / 4,
// //                           ); // base64 to bytes

// //                           if (compressedSize > MAX_SIZE) {
// //                             // Try harder compression
// //                             const moreCompressed = await compressImage(
// //                               file,
// //                               0.4,
// //                             );
// //                             const moreCompressedSize = Math.round(
// //                               (moreCompressed.length * 3) / 4,
// //                             );

// //                             if (moreCompressedSize > MAX_SIZE) {
// //                               alert(
// //                                 "Image is too large to compress under 1MB. Please use a smaller image.",
// //                               );
// //                               e.target.value = ""; // reset input
// //                               return;
// //                             }

// //                             alert(
// //                               "Image was automatically compressed to fit under 1MB.",
// //                             );
// //                             if (isAdding) {
// //                               setNewEquipment({
// //                                 ...newEquipment,
// //                                 imageUrl: moreCompressed,
// //                               });
// //                             } else {
// //                               setEditingItem({
// //                                 ...editingItem!,
// //                                 imageUrl: moreCompressed,
// //                               });
// //                             }
// //                             return;
// //                           }

// //                           alert(
// //                             "Image was automatically compressed to fit under 1MB.",
// //                           );
// //                           if (isAdding) {
// //                             setNewEquipment({
// //                               ...newEquipment,
// //                               imageUrl: compressed,
// //                             });
// //                           } else {
// //                             setEditingItem({
// //                               ...editingItem!,
// //                               imageUrl: compressed,
// //                             });
// //                           }
// //                           return;
// //                         }

// //                         // Image is within 1MB — still crop to square for consistency
// //                         const base64 = await compressImage(file, 0.9);
// //                         if (isAdding) {
// //                           setNewEquipment({
// //                             ...newEquipment,
// //                             imageUrl: base64,
// //                           });
// //                         } else {
// //                           setEditingItem({ ...editingItem!, imageUrl: base64 });
// //                         }
// //                       }}
// //                     />
// //                     {(isAdding
// //                       ? newEquipment.imageUrl
// //                       : editingItem?.imageUrl) && (
// //                       <button
// //                         type="button"
// //                         onClick={() =>
// //                           isAdding
// //                             ? setNewEquipment({ ...newEquipment, imageUrl: "" })
// //                             : setEditingItem({ ...editingItem!, imageUrl: "" })
// //                         }
// //                         className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
// //                       >
// //                         <X className="w-3 h-3" />
// //                       </button>
// //                     )}
// //                   </div>
// //                 </div>

// //                 {/* Name + Category stacked */}
// //                 <div className="md:col-span-2 space-y-4">
// //                   <div className="space-y-2">
// //                     <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
// //                       Equipment Name
// //                     </label>
// //                     <input
// //                       required
// //                       type="text"
// //                       value={isAdding ? newEquipment.name : editingItem?.name}
// //                       onChange={(e) =>
// //                         isAdding
// //                           ? setNewEquipment({
// //                               ...newEquipment,
// //                               name: e.target.value,
// //                             })
// //                           : setEditingItem({
// //                               ...editingItem!,
// //                               name: e.target.value,
// //                             })
// //                       }
// //                       className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
// //                       placeholder="e.g. Spiral Slide"
// //                     />
// //                   </div>
// //                   <div className="space-y-2">
// //                     <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
// //                       Category
// //                     </label>
// //                     <CategoryCombobox
// //                       value={
// //                         (isAdding
// //                           ? newEquipment.category
// //                           : editingItem?.category) || ""
// //                       }
// //                       onChange={(val) =>
// //                         isAdding
// //                           ? setNewEquipment({
// //                               ...newEquipment,
// //                               category: val,
// //                             })
// //                           : setEditingItem({
// //                               ...editingItem!,
// //                               category: val,
// //                             })
// //                       }
// //                       options={existingCategoryOptions}
// //                     />
// //                     <p className="text-[9px] opacity-30">
// //                       Click the field to browse existing categories, or type a
// //                       new one — it appears automatically in the Equipment
// //                       Library.
// //                     </p>
// //                   </div>
// //                 </div>
// //               </div>

// //               {/* Row 2 — Dimensions */}
// //               <div className="grid grid-cols-3 gap-4">
// //                 <div className="space-y-2">
// //                   <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
// //                     Width (m)
// //                   </label>
// //                   <input
// //                     required
// //                     type="number"
// //                     step="0.1"
// //                     value={isAdding ? newEquipment.width : editingItem?.width}
// //                     onChange={(e) =>
// //                       isAdding
// //                         ? setNewEquipment({
// //                             ...newEquipment,
// //                             width: parseFloat(e.target.value),
// //                           })
// //                         : setEditingItem({
// //                             ...editingItem!,
// //                             width: parseFloat(e.target.value),
// //                           })
// //                     }
// //                     className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
// //                   />
// //                 </div>
// //                 <div className="space-y-2">
// //                   <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
// //                     Depth (m)
// //                   </label>
// //                   <input
// //                     required
// //                     type="number"
// //                     step="0.1"
// //                     value={isAdding ? newEquipment.depth : editingItem?.depth}
// //                     onChange={(e) =>
// //                       isAdding
// //                         ? setNewEquipment({
// //                             ...newEquipment,
// //                             depth: parseFloat(e.target.value),
// //                           })
// //                         : setEditingItem({
// //                             ...editingItem!,
// //                             depth: parseFloat(e.target.value),
// //                           })
// //                     }
// //                     className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
// //                   />
// //                 </div>
// //                 <div className="space-y-2">
// //                   <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
// //                     Height (m)
// //                   </label>
// //                   <input
// //                     required
// //                     type="number"
// //                     step="0.1"
// //                     value={isAdding ? newEquipment.height : editingItem?.height}
// //                     onChange={(e) =>
// //                       isAdding
// //                         ? setNewEquipment({
// //                             ...newEquipment,
// //                             height: parseFloat(e.target.value),
// //                           })
// //                         : setEditingItem({
// //                             ...editingItem!,
// //                             height: parseFloat(e.target.value),
// //                           })
// //                     }
// //                     className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
// //                   />
// //                 </div>
// //               </div>

// //               {/* Row 3 — Color + Model URL */}
// //               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //                 <div className="space-y-2">
// //                   <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
// //                     Color (Hex)
// //                   </label>
// //                   <div className="flex gap-2">
// //                     <input
// //                       type="color"
// //                       value={isAdding ? newEquipment.color : editingItem?.color}
// //                       onChange={(e) =>
// //                         isAdding
// //                           ? setNewEquipment({
// //                               ...newEquipment,
// //                               color: e.target.value,
// //                             })
// //                           : setEditingItem({
// //                               ...editingItem!,
// //                               color: e.target.value,
// //                             })
// //                       }
// //                       className="w-10 h-10 bg-transparent border-none cursor-pointer shrink-0"
// //                     />
// //                     <input
// //                       type="text"
// //                       value={isAdding ? newEquipment.color : editingItem?.color}
// //                       onChange={(e) =>
// //                         isAdding
// //                           ? setNewEquipment({
// //                               ...newEquipment,
// //                               color: e.target.value,
// //                             })
// //                           : setEditingItem({
// //                               ...editingItem!,
// //                               color: e.target.value,
// //                             })
// //                       }
// //                       className="flex-1 bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
// //                     />
// //                   </div>
// //                 </div>

// //                 <div className="space-y-2">
// //                   <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
// //                     3D Model (.glb)
// //                   </label>

// //                   {/* Show current file status */}
// //                   {(
// //                     isAdding ? newEquipment.modelUrl : editingItem?.modelUrl
// //                   ) ? (
// //                     <div className="flex items-center justify-between bg-white/5 border border-theme-border rounded-lg px-4 py-2">
// //                       <div className="flex items-center gap-2 min-w-0">
// //                         <Box className="w-4 h-4 text-brand-teal shrink-0" />
// //                         <span className="text-xs text-brand-teal truncate">
// //                           GLB model loaded
// //                         </span>
// //                       </div>
// //                       <button
// //                         type="button"
// //                         onClick={() =>
// //                           isAdding
// //                             ? setNewEquipment({ ...newEquipment, modelUrl: "" })
// //                             : setEditingItem({ ...editingItem!, modelUrl: "" })
// //                         }
// //                         className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors shrink-0"
// //                       >
// //                         <X className="w-3 h-3" />
// //                       </button>
// //                     </div>
// //                   ) : (
// //                     <div
// //                       className="flex items-center justify-center gap-2 w-full border border-dashed border-theme-border rounded-lg px-4 py-3 cursor-pointer hover:border-brand-teal/50 transition-colors"
// //                       onClick={() =>
// //                         document.getElementById("glb-upload")?.click()
// //                       }
// //                     >
// //                       <Upload className="w-4 h-4 opacity-30" />
// //                       <span className="text-xs opacity-40">
// //                         Upload .glb file
// //                       </span>
// //                     </div>
// //                   )}

// //                   <input
// //                     id="glb-upload"
// //                     type="file"
// //                     accept=".glb"
// //                     className="hidden"
// //                     onChange={async (e) => {
// //                       const file = e.target.files?.[0];
// //                       if (!file) return;

// //                       const MAX_GLB_SIZE = 25 * 1024 * 1024; // 25MB
// //                       if (file.size > MAX_GLB_SIZE) {
// //                         alert("GLB file must be under 25MB.");
// //                         e.target.value = "";
// //                         return;
// //                       }

// //                       const formData = new FormData();
// //                       formData.append("file", file);

// //                       const token =
// //                         localStorage.getItem("auth_token") ||
// //                         sessionStorage.getItem("auth_token");

// //                       // Show uploading state
// //                       if (isAdding) {
// //                         setNewEquipment({
// //                           ...newEquipment,
// //                           modelUrl: "uploading...",
// //                         });
// //                       } else {
// //                         setEditingItem({
// //                           ...editingItem!,
// //                           modelUrl: "uploading...",
// //                         });
// //                       }
// //                       const res = await fetch(
// //                         `${import.meta.env.VITE_API_URL}/api/upload/model`,
// //                         {
// //                           method: "POST",
// //                           headers: { Authorization: `Bearer ${token}` },
// //                           body: formData,
// //                         },
// //                       );

// //                       if (res.ok) {
// //                         const { url } = await res.json();
// //                         if (isAdding) {
// //                           setNewEquipment({ ...newEquipment, modelUrl: url });
// //                         } else {
// //                           setEditingItem({ ...editingItem!, modelUrl: url });
// //                         }
// //                       } else {
// //                         alert("Failed to upload GLB file.");
// //                         if (isAdding) {
// //                           setNewEquipment({ ...newEquipment, modelUrl: "" });
// //                         } else {
// //                           setEditingItem({ ...editingItem!, modelUrl: "" });
// //                         }
// //                       }
// //                     }}
// //                   />
// //                   <p className="text-[10px] opacity-30">
// //                     Max 25MB · Used for 3D rendering
// //                   </p>
// //                 </div>
// //               </div>

// //               {/* Row 5 — Action buttons */}
// //               <div className="flex justify-end gap-3 pt-4 border-t border-theme-border">
// //                 <button
// //                   type="button"
// //                   onClick={() => {
// //                     setIsAdding(false);
// //                     setEditingItem(null);
// //                     setNewEquipment({
// //                       name: "",
// //                       category: "slides",
// //                       width: 5,
// //                       depth: 5,
// //                       height: 5,
// //                       color: "#14b8a6",
// //                       animationsEnabled: false,
// //                       imageUrl: "",
// //                     });
// //                   }}
// //                   className="px-6 py-2 text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-colors"
// //                 >
// //                   Cancel
// //                 </button>
// //                 <button
// //                   type="submit"
// //                   className="px-6 py-2 bg-brand-teal text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-brand-teal/90 transition-all shadow-lg shadow-brand-teal/20"
// //                 >
// //                   {isAdding ? "Add Equipment" : "Save Changes"}
// //                 </button>
// //               </div>
// //             </form>
// //           </motion.div>
// //         </motion.div>
// //       )}
// //       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
// //         {filteredEquipment.map((item) => (
// //           <div
// //             key={item.id}
// //             className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden group hover:border-brand-teal/50 transition-all relative"
// //           >
// //             {/* Status Badge */}
// //             <div
// //               className={clsx(
// //                 "absolute top-3 left-3 z-10 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
// //                 item.isActive !== false
// //                   ? "bg-emerald-500/20 text-emerald-400"
// //                   : "bg-red-500/20 text-red-400",
// //               )}
// //             >
// //               {item.isActive !== false ? "Active" : "Inactive"}
// //             </div>

// //             {/* Image */}
// //             <div
// //               className={clsx(
// //                 "aspect-square bg-black/40 flex items-center justify-center relative overflow-hidden",
// //                 item.isActive === false && "opacity-40",
// //               )}
// //             >
// //               <img
// //                 src={getEquipmentThumbnail(item)}
// //                 alt={item.name}
// //                 className="w-full h-full object-cover"
// //               />

// //               {/* Category */}
// //               <div className="absolute top-3 right-3 px-2 py-1 bg-brand-teal/20 text-brand-teal text-[8px] font-bold uppercase rounded">
// //                 {item.category}
// //               </div>

// //               {/* Actions Overlay */}
// //               <div className="absolute inset-0 bg-theme-bg/80 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
// //                 {/* Edit */}
// //                 <button
// //                   onClick={() => setEditingItem(item)}
// //                   className="p-3 bg-white/10 hover:bg-brand-teal hover:text-white rounded-xl transition-all"
// //                   title="Edit"
// //                 >
// //                   <Pencil className="w-4 h-4" />
// //                 </button>

// //                 {/* Toggle Active */}
// //                 <button
// //                   onClick={() =>
// //                     onToggleActive(item.id, item.isActive !== false)
// //                   }
// //                   className="p-3 bg-white/10 hover:bg-red-500 hover:text-white rounded-xl transition-all"
// //                   title={item.isActive !== false ? "Deactivate" : "Activate"}
// //                 >
// //                   {item.isActive !== false ? (
// //                     <EyeOff className="w-4 h-4" />
// //                   ) : (
// //                     <Eye className="w-4 h-4" />
// //                   )}
// //                 </button>

// //                 {/* Delete */}
// //                 <button
// //                   onClick={() => onDelete(item.id)}
// //                   className="p-3 bg-white/10 hover:bg-red-500 hover:text-white rounded-xl transition-all"
// //                   title="Delete"
// //                 >
// //                   <Trash2 className="w-4 h-4" />
// //                 </button>
// //               </div>
// //             </div>

// //             {/* Info */}
// //             <div className="p-4">
// //               <h4 className="text-sm font-bold truncate">{item.name}</h4>
// //               <p className="text-[10px] opacity-40 font-mono mt-1">
// //                 {item.width}x{item.depth}x{item.height}m
// //               </p>
// //             </div>
// //           </div>
// //         ))}

// //         {/* Empty State */}
// //         {filteredEquipment.length === 0 && (
// //           <div className="col-span-4 py-20 text-center">
// //             <Box className="w-12 h-12 opacity-10 mx-auto mb-4" />
// //             <p className="text-sm opacity-40 italic">
// //               No equipment found matching your search.
// //             </p>
// //           </div>
// //         )}
// //       </div>

// //       {/* ── Default Equipment Section ────────────────────────────────────── */}
// //       <div className="space-y-3 pt-2">
// //         <div className="flex items-center justify-between">
// //           <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold">
// //             DEFAULT EQUIPMENT (
// //             {DEFAULT_LIBRARY.filter((d) => !disabledDefaults.has(d.id)).length}{" "}
// //             ACTIVE)
// //           </label>
// //         </div>
// //         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
// //           {DEFAULT_LIBRARY.filter(
// //             (item) =>
// //               item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
// //               item.category.toLowerCase().includes(searchQuery.toLowerCase()),
// //           ).map((item) => {
// //             const isDisabled = disabledDefaults.has(item.id);
// //             return (
// //               <div
// //                 key={item.id}
// //                 className={clsx(
// //                   "flex items-center justify-between p-3 bg-theme-card border rounded-xl transition-all",
// //                   isDisabled
// //                     ? "border-red-500/20 opacity-50"
// //                     : "border-theme-border",
// //                 )}
// //               >
// //                 <div className="flex items-center gap-3 min-w-0">
// //                   <img
// //                     src={getEquipmentThumbnail(item)}
// //                     alt={item.name}
// //                     className="w-8 h-8 rounded-lg object-cover shrink-0"
// //                   />
// //                   <div className="min-w-0">
// //                     <p className="text-xs font-bold truncate">{item.name}</p>
// //                     <p className="text-[9px] opacity-40 uppercase">
// //                       {item.category}
// //                     </p>
// //                   </div>
// //                 </div>
// //                 <div className="flex items-center gap-3 ml-2">
// //                   <button
// //                     onClick={() => onToggleDefault(item.id)}
// //                     aria-pressed={!isDisabled}
// //                     aria-label={
// //                       !isDisabled
// //                         ? `Deactivate ${item.name}`
// //                         : `Activate ${item.name}`
// //                     }
// //                     className={clsx(
// //                       "w-10 h-5 rounded-full transition-colors relative shrink-0",
// //                       !isDisabled ? "bg-emerald-500" : "bg-white/20",
// //                     )}
// //                   >
// //                     <div
// //                       className={clsx(
// //                         "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
// //                         !isDisabled ? "left-6" : "left-1",
// //                       )}
// //                     />
// //                   </button>
// //                   <span className="text-xs font-semibold select-none">
// //                     {isDisabled ? "Activate" : "Deactivate"}
// //                   </span>
// //                 </div>
// //               </div>
// //             );
// //           })}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // // ─── Archive Modal ────────────────────────────────────────────────────────────
// // interface ArchiveModalProps {
// //   user: User;
// //   allReps: User[];
// //   onConfirm: (
// //     assignments: Record<string, string>,
// //     bulkTargetId?: string,
// //   ) => void;
// //   onCancel: () => void;
// // }

// // function ArchiveModal({
// //   user,
// //   allReps,
// //   onConfirm,
// //   onCancel,
// // }: ArchiveModalProps) {
// //   const [projects, setProjects] = React.useState<
// //     { id: string; name: string }[]
// //   >([]);
// //   const [loading, setLoading] = React.useState(true);
// //   const [bulkTargetId, setBulkTargetId] = React.useState("");
// //   const [perProjectAssign, setPerProjectAssign] = React.useState<
// //     Record<string, string>
// //   >({});
// //   const [mode, setMode] = React.useState<"bulk" | "individual">("bulk");

// //   const otherActiveReps = allReps.filter(
// //     (r) =>
// //       r.id !== user.id && r.role === "sales_rep" && r.status !== "archived",
// //   );

// //   React.useEffect(() => {
// //     authFetch(`/api/users/${user.id}/projects`)
// //       .then((r) => r.json())
// //       .then((data) => {
// //         setProjects(data);
// //         const init: Record<string, string> = {};
// //         data.forEach((p: any) => (init[p.id] = ""));
// //         setPerProjectAssign(init);
// //       })
// //       .finally(() => setLoading(false));
// //   }, [user.id]);

// //   const canConfirm =
// //     projects.length === 0 ||
// //     (mode === "bulk" && bulkTargetId !== "") ||
// //     (mode === "individual" &&
// //       Object.values(perProjectAssign).every((v) => v !== ""));

// //   const handleConfirm = () => {
// //     if (mode === "bulk") {
// //       const assignments: Record<string, string> = {};
// //       projects.forEach((p) => (assignments[p.id] = bulkTargetId));
// //       onConfirm(assignments, bulkTargetId);
// //     } else {
// //       onConfirm(perProjectAssign);
// //     }
// //   };

// //   return (
// //     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
// //       <div className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-lg shadow-2xl">
// //         {/* Header */}
// //         <div className="flex items-center justify-between p-6 border-b border-theme-border">
// //           <div className="flex items-center gap-3">
// //             <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
// //               <Archive className="w-5 h-5 text-amber-400" />
// //             </div>
// //             <div>
// //               <h2 className="font-bold text-base">Archive Sales Rep</h2>
// //               <p className="text-xs opacity-50">
// //                 {user.name} · {user.email}
// //               </p>
// //             </div>
// //           </div>
// //           <button
// //             onClick={onCancel}
// //             className="p-2 hover:bg-white/5 rounded-lg"
// //           >
// //             <X className="w-4 h-4 opacity-50" />
// //           </button>
// //         </div>

// //         <div className="p-6 space-y-5">
// //           {loading ? (
// //             <div className="py-8 text-center text-sm opacity-40">
// //               Loading projects...
// //             </div>
// //           ) : projects.length === 0 ? (
// //             <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
// //               <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
// //               <div>
// //                 <p className="text-sm font-semibold text-emerald-400">
// //                   No projects assigned
// //                 </p>
// //                 <p className="text-xs opacity-60 mt-0.5">
// //                   This rep has no projects. You can archive them immediately.
// //                 </p>
// //               </div>
// //             </div>
// //           ) : (
// //             <>
// //               <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
// //                 <FolderOpen className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
// //                 <div>
// //                   <p className="text-sm font-semibold text-amber-400">
// //                     {projects.length} project{projects.length > 1 ? "s" : ""}{" "}
// //                     must be reassigned
// //                   </p>
// //                   <p className="text-xs opacity-60 mt-0.5">
// //                     Reassign all projects before archiving. Logs will be
// //                     preserved.
// //                   </p>
// //                 </div>
// //               </div>

// //               {/* Mode toggle */}
// //               <div className="flex rounded-xl border border-theme-border overflow-hidden text-xs font-bold uppercase tracking-widest">
// //                 <button
// //                   onClick={() => setMode("bulk")}
// //                   className={clsx(
// //                     "flex-1 py-2.5 transition-all",
// //                     mode === "bulk"
// //                       ? "bg-brand-teal text-white"
// //                       : "opacity-40 hover:opacity-70",
// //                   )}
// //                 >
// //                   Bulk — assign all to one rep
// //                 </button>
// //                 <button
// //                   onClick={() => setMode("individual")}
// //                   className={clsx(
// //                     "flex-1 py-2.5 transition-all",
// //                     mode === "individual"
// //                       ? "bg-brand-teal text-white"
// //                       : "opacity-40 hover:opacity-70",
// //                   )}
// //                 >
// //                   Individual — assign each
// //                 </button>
// //               </div>

// //               {mode === "bulk" ? (
// //                 <div className="space-y-2">
// //                   <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
// //                     Reassign all {projects.length} projects to
// //                   </label>
// //                   <select
// //                     value={bulkTargetId}
// //                     onChange={(e) => setBulkTargetId(e.target.value)}
// //                     className="w-full bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
// //                   >
// //                     <option value="">— Select a sales rep —</option>
// //                     {otherActiveReps.map((r) => (
// //                       <option key={r.id} value={r.id}>
// //                         {r.name} ({r.email})
// //                       </option>
// //                     ))}
// //                   </select>
// //                 </div>
// //               ) : (
// //                 <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
// //                   {projects.map((p) => (
// //                     <div key={p.id} className="flex items-center gap-3">
// //                       <div className="flex-1 min-w-0">
// //                         <p className="text-xs font-semibold truncate">
// //                           {p.name}
// //                         </p>
// //                       </div>
// //                       <select
// //                         value={perProjectAssign[p.id] || ""}
// //                         onChange={(e) =>
// //                           setPerProjectAssign((prev) => ({
// //                             ...prev,
// //                             [p.id]: e.target.value,
// //                           }))
// //                         }
// //                         className="w-48 bg-white/5 border border-theme-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
// //                       >
// //                         <option value="">— Select rep —</option>
// //                         {otherActiveReps.map((r) => (
// //                           <option key={r.id} value={r.id}>
// //                             {r.name}
// //                           </option>
// //                         ))}
// //                       </select>
// //                     </div>
// //                   ))}
// //                 </div>
// //               )}
// //             </>
// //           )}
// //         </div>

// //         {/* Footer */}
// //         <div className="flex items-center justify-end gap-3 p-6 border-t border-theme-border">
// //           <button
// //             onClick={onCancel}
// //             className="px-4 py-2.5 text-sm font-semibold opacity-50 hover:opacity-100 transition-opacity"
// //           >
// //             Cancel
// //           </button>
// //           <button
// //             onClick={handleConfirm}
// //             disabled={!canConfirm}
// //             className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-black font-bold text-sm rounded-xl transition-all flex items-center gap-2"
// //           >
// //             <Archive className="w-4 h-4" />
// //             {projects.length > 0 ? "Reassign & Archive" : "Archive Rep"}
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // function UsersTab({
// //   tenant,
// //   isAdding,
// //   setIsAdding,
// //   salesRepCount,
// //   setSalesRepCount,
// // }: {
// //   tenant: Tenant;
// //   isAdding: boolean;
// //   setIsAdding: (b: boolean) => void;
// //   salesRepCount: number;
// //   setSalesRepCount: (count: number) => void;
// // }) {
// //   const [users, setUsers] = React.useState<User[]>([]);
// //   const [editingUser, setEditingUser] = React.useState<User | null>(null);
// //   const [newUser, setNewUser] = React.useState({
// //     name: "",
// //     email: "",
// //     phone: "",
// //     password: "",
// //     companyName: tenant.name,
// //   });

// //   React.useEffect(() => {
// //     if (isAdding) {
// //       setNewUser({
// //         name: "",
// //         email: "",
// //         phone: "",
// //         password: "",
// //         companyName: tenant.name,
// //       });
// //     }
// //   }, [isAdding, tenant.name]);

// //   const [editFormData, setEditFormData] = React.useState({
// //     name: "",
// //     phone: "",
// //     password: "",
// //   });
// //   const [archiveTarget, setArchiveTarget] = React.useState<User | null>(null);
// //   const [showArchived, setShowArchived] = React.useState(false);

// //   const fetchSalesRepCount = async () => {
// //     const res = await authFetch(`/api/tenant/${tenant.id}/users`);
// //     if (res.ok) {
// //       const data = await res.json();
// //       const count = data.filter(
// //         (u: any) =>
// //           u.role === "sales_rep" &&
// //           u.status !== "archived" &&
// //           u.is_active !== false,
// //       ).length;
// //       setSalesRepCount(count);
// //     }
// //   };

// //   const fetchUsers = async () => {
// //     const res = await authFetch(`/api/tenant/${tenant.id}/users`);
// //     if (res.ok) {
// //       const data = await res.json();
// //       setUsers(data);
// //       setSalesRepCount(
// //         data.filter(
// //           (u: any) =>
// //             u.role === "sales_rep" &&
// //             u.status !== "archived" &&
// //             u.is_active !== false,
// //         ).length,
// //       );
// //     }
// //   };

// //   React.useEffect(() => {
// //     fetchUsers();
// //   }, [tenant.id]);

// //   const handleAddUser = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     const userId = uuidv4();
// //     const res = await authFetch(`/api/tenant/${tenant.id}/users`, {
// //       method: "POST",
// //       body: JSON.stringify({
// //         id: userId,
// //         email: newUser.email,
// //         password: newUser.password,
// //         role: "sales_rep",
// //         name: newUser.name,
// //         phone: newUser.phone,
// //       }),
// //     });
// //     if (res.ok) {
// //       setNewUser({
// //         name: "",
// //         email: "",
// //         phone: "",
// //         password: "",
// //         companyName: tenant.name,
// //       });
// //       setIsAdding(false);
// //       fetchUsers();
// //     } else {
// //       const data = await res.json().catch(() => ({}));
// //       alert(data.error || "Failed to add user");
// //     }
// //   };

// //   const handleEditUser = async () => {
// //     if (!editingUser) return;
// //     const res = await authFetch(`/api/users/${editingUser.id}`, {
// //       method: "PUT",
// //       body: JSON.stringify(editFormData),
// //     });
// //     if (res.ok) {
// //       setEditingUser(null);
// //       fetchUsers();
// //     } else {
// //       const data = await res.json().catch(() => ({}));
// //       alert(data.error || "Failed to update user");
// //     }
// //   };

// //   const handleToggleActive = async (u: User) => {
// //     const currentlyActive = u.status !== "inactive" && u.is_active !== false;
// //     const confirmMsg = currentlyActive
// //       ? `Deactivate ${u.name}? They will not be able to log in.`
// //       : `Activate ${u.name}? They will be able to log in again.`;
// //     if (!confirm(confirmMsg)) return;

// //     const originalCount = salesRepCount;
// //     setUsers((prev) =>
// //       prev.map((usr) =>
// //         usr.id === u.id
// //           ? {
// //               ...usr,
// //               is_active: !currentlyActive,
// //               status: currentlyActive ? "inactive" : "active",
// //             }
// //           : usr,
// //       ),
// //     );
// //     setSalesRepCount(salesRepCount + (currentlyActive ? -1 : 1));

// //     const res = await authFetch(`/api/users/${u.id}/toggle-active`, {
// //       method: "PATCH",
// //     });
// //     if (!res.ok) {
// //       setUsers((prev) =>
// //         prev.map((usr) =>
// //           usr.id === u.id
// //             ? {
// //                 ...usr,
// //                 is_active: currentlyActive,
// //                 status: currentlyActive ? "active" : "inactive",
// //               }
// //             : usr,
// //         ),
// //       );
// //       setSalesRepCount(originalCount);
// //       alert("Failed to update status");
// //     }
// //   };

// //   const handleArchive = async (assignments: Record<string, string>) => {
// //     if (!archiveTarget) return;
// //     try {
// //       // Reassign each project
// //       for (const [projectId, newUserId] of Object.entries(assignments)) {
// //         if (newUserId) {
// //           const r = await authFetch(`/api/projects/${projectId}/reassign`, {
// //             method: "PATCH",
// //             body: JSON.stringify({ newUserId }),
// //           });
// //           if (!r.ok) {
// //             const d = await r.json().catch(() => ({}));
// //             alert(
// //               `Failed to reassign a project: ${d.error || "Unknown error"}`,
// //             );
// //             return;
// //           }
// //         }
// //       }
// //       // Archive the user
// //       const res = await authFetch(`/api/users/${archiveTarget.id}/archive`, {
// //         method: "PATCH",
// //       });
// //       if (res.ok) {
// //         setArchiveTarget(null);
// //         fetchUsers();
// //       } else {
// //         const d = await res.json().catch(() => ({}));
// //         alert(d.error || "Failed to archive user");
// //       }
// //     } catch {
// //       alert("An error occurred");
// //     }
// //   };

// //   const startEditing = (user: User) => {
// //     setEditingUser(user);
// //     setEditFormData({ name: user.name, phone: user.phone || "", password: "" });
// //   };

// //   const activeReps = users.filter(
// //     (u) => u.role === "sales_rep" && u.status !== "archived",
// //   );
// //   const archivedReps = users.filter(
// //     (u) => u.role === "sales_rep" && u.status === "archived",
// //   );
// //   const admins = users.filter((u) => u.role !== "sales_rep");

// //   return (
// //     <div className="space-y-6">
// //       {/* Archive Modal */}
// //       {archiveTarget && (
// //         <ArchiveModal
// //           user={archiveTarget}
// //           allReps={users}
// //           onConfirm={handleArchive}
// //           onCancel={() => setArchiveTarget(null)}
// //         />
// //       )}

// //       {/* Edit Modal */}
// //       {editingUser && (
// //         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
// //           <div className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-md shadow-2xl">
// //             <div className="flex items-center justify-between p-6 border-b border-theme-border">
// //               <h2 className="font-bold text-base">Edit Sales Rep</h2>
// //               <button
// //                 onClick={() => setEditingUser(null)}
// //                 className="p-2 hover:bg-white/5 rounded-lg"
// //               >
// //                 <X className="w-4 h-4 opacity-50" />
// //               </button>
// //             </div>
// //             <div className="p-6 space-y-4">
// //               <div>
// //                 <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
// //                   Name
// //                 </label>
// //                 <input
// //                   className="w-full mt-1 bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
// //                   value={editFormData.name}
// //                   onChange={(e) =>
// //                     setEditFormData((p) => ({ ...p, name: e.target.value }))
// //                   }
// //                 />
// //               </div>
// //               <div>
// //                 <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
// //                   Phone
// //                   <span className="text-brand-teal/60 normal-case tracking-normal">
// //                     10 digits
// //                   </span>
// //                 </label>
// //                 <input
// //                   type="tel"
// //                   inputMode="numeric"
// //                   maxLength={10}
// //                   pattern="\d{10}"
// //                   placeholder="10-digit mobile number"
// //                   className="w-full mt-1 bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
// //                   value={editFormData.phone}
// //                   onChange={(e) => {
// //                     const val = e.target.value.replace(/\D/g, "").slice(0, 10);
// //                     setEditFormData((p) => ({ ...p, phone: val }));
// //                   }}
// //                 />
// //                 {editFormData.phone && editFormData.phone.length !== 10 && (
// //                   <p className="text-[10px] text-red-400 mt-1 ml-1">
// //                     Must be exactly 10 digits
// //                   </p>
// //                 )}
// //               </div>
// //               <div>
// //                 <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
// //                   New Password (optional)
// //                 </label>
// //                 <input
// //                   type="password"
// //                   className="w-full mt-1 bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
// //                   placeholder="Leave blank to keep current"
// //                   value={editFormData.password}
// //                   onChange={(e) =>
// //                     setEditFormData((p) => ({ ...p, password: e.target.value }))
// //                   }
// //                 />
// //               </div>
// //             </div>
// //             <div className="flex justify-end gap-3 p-6 border-t border-theme-border">
// //               <button
// //                 onClick={() => setEditingUser(null)}
// //                 className="px-4 py-2.5 text-sm font-semibold opacity-50 hover:opacity-100"
// //               >
// //                 Cancel
// //               </button>
// //               <button
// //                 onClick={handleEditUser}
// //                 className="px-5 py-2.5 bg-brand-teal text-white font-bold text-sm rounded-xl hover:bg-brand-teal/90 transition-all"
// //               >
// //                 Save Changes
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* Add New Rep Form */}
// //       {isAdding && (
// //         <div className="bg-theme-card border border-brand-teal/30 rounded-2xl p-6 space-y-4">
// //           <h3 className="font-bold text-sm">Add New Sales Rep</h3>
// //           <form
// //             onSubmit={handleAddUser}
// //             className="space-y-4"
// //             autoComplete="off"
// //           >
// //             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// //               <div>
// //                 <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
// //                   Name
// //                 </label>
// //                 <input
// //                   required
// //                   className="w-full mt-1 bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
// //                   value={newUser.name}
// //                   onChange={(e) =>
// //                     setNewUser((p) => ({ ...p, name: e.target.value }))
// //                   }
// //                 />
// //               </div>
// //               <div>
// //                 <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
// //                   Email
// //                 </label>
// //                 <input
// //                   required
// //                   type="email"
// //                   name="new-user-email"
// //                   autoComplete="off"
// //                   className="w-full mt-1 bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
// //                   value={newUser.email}
// //                   onChange={(e) =>
// //                     setNewUser((p) => ({ ...p, email: e.target.value }))
// //                   }
// //                 />
// //               </div>
// //               <div>
// //                 <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
// //                   Phone
// //                   <span className="text-brand-teal/60 normal-case tracking-normal">
// //                     10 digits
// //                   </span>
// //                 </label>
// //                 <input
// //                   type="tel"
// //                   inputMode="numeric"
// //                   maxLength={10}
// //                   pattern="\d{10}"
// //                   placeholder="10-digit mobile number"
// //                   className="w-full mt-1 bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
// //                   value={newUser.phone}
// //                   onChange={(e) => {
// //                     const val = e.target.value.replace(/\D/g, "").slice(0, 10);
// //                     setNewUser((p) => ({ ...p, phone: val }));
// //                   }}
// //                 />
// //                 {newUser.phone && newUser.phone.length !== 10 && (
// //                   <p className="text-[10px] text-red-400 mt-1 ml-1">
// //                     Must be exactly 10 digits
// //                   </p>
// //                 )}
// //               </div>
// //               <div>
// //                 <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
// //                   Password
// //                 </label>
// //                 <input
// //                   required
// //                   type="password"
// //                   name="new-user-password"
// //                   autoComplete="new-password"
// //                   className="w-full mt-1 bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
// //                   value={newUser.password}
// //                   onChange={(e) =>
// //                     setNewUser((p) => ({ ...p, password: e.target.value }))
// //                   }
// //                 />
// //               </div>
// //             </div>
// //             <div className="flex justify-end gap-3">
// //               <button
// //                 type="button"
// //                 onClick={() => setIsAdding(false)}
// //                 className="px-4 py-2.5 text-sm font-semibold opacity-50 hover:opacity-100"
// //               >
// //                 Cancel
// //               </button>
// //               <button
// //                 type="submit"
// //                 className="px-5 py-2.5 bg-brand-teal text-white font-bold text-sm rounded-xl hover:bg-brand-teal/90 transition-all"
// //               >
// //                 Add Rep
// //               </button>
// //             </div>
// //           </form>
// //         </div>
// //       )}

// //       {/* Active Reps */}
// //       <div className="space-y-3">
// //         <h3 className="text-xs font-bold opacity-40 uppercase tracking-widest">
// //           Sales Reps ({activeReps.length})
// //         </h3>
// //         <div className="grid grid-cols-1 gap-4">
// //           {activeReps.map((u) => {
// //             const isActive = u.status !== "inactive" && u.is_active !== false;
// //             return (
// //               <div
// //                 key={u.id}
// //                 className={clsx(
// //                   "p-3 lg:p-4 bg-theme-card border rounded-xl flex items-center justify-between gap-2 group transition-all",
// //                   isActive
// //                     ? "border-theme-border"
// //                     : "border-red-500/20 opacity-70",
// //                 )}
// //               >
// //                 <div className="flex items-center gap-3 min-w-0 flex-1">
// //                   <div
// //                     className={clsx(
// //                       "w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center font-bold shrink-0 text-white",
// //                       isActive
// //                         ? "bg-brand-teal/10 text-brand-teal"
// //                         : "bg-red-500/10 text-red-400",
// //                     )}
// //                   >
// //                     {u.name.charAt(0)}
// //                   </div>
// //                   <div className="min-w-0 flex-1">
// //                     <div className="flex items-center gap-2 flex-wrap">
// //                       <h4 className="font-bold text-sm truncate">{u.name}</h4>
// //                       <span
// //                         className={clsx(
// //                           "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
// //                           isActive
// //                             ? "bg-emerald-500/15 text-emerald-400"
// //                             : "bg-red-500/15 text-red-400",
// //                         )}
// //                       >
// //                         {isActive ? "Active" : "Inactive"}
// //                       </span>
// //                     </div>
// //                     <div className="flex items-center gap-1 lg:gap-3 mt-1 flex-wrap">
// //                       <span className="text-[10px] opacity-40 truncate max-w-[120px] lg:max-w-none">
// //                         {u.email}
// //                       </span>
// //                       <span className="text-[10px] opacity-40 hidden lg:inline">
// //                         ·
// //                       </span>
// //                       <span className="text-[10px] opacity-40 hidden lg:inline">
// //                         {u.phone || "No phone"}
// //                       </span>
// //                     </div>
// //                   </div>
// //                 </div>
// //                 <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
// //                   <button
// //                     onClick={() => handleToggleActive(u)}
// //                     className={clsx(
// //                       "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border",
// //                       isActive
// //                         ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
// //                         : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20",
// //                     )}
// //                     title={isActive ? "Deactivate" : "Activate"}
// //                   >
// //                     {isActive ? (
// //                       <EyeOff className="w-3.5 h-3.5" />
// //                     ) : (
// //                       <Eye className="w-3.5 h-3.5" />
// //                     )}
// //                     <span className="hidden sm:inline">
// //                       {isActive ? "Deactivate" : "Activate"}
// //                     </span>
// //                   </button>
// //                   <button
// //                     onClick={() => setArchiveTarget(u)}
// //                     className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all"
// //                     title="Archive rep"
// //                   >
// //                     <Archive className="w-3.5 h-3.5" />
// //                     <span className="hidden sm:inline">Archive</span>
// //                   </button>
// //                   <button
// //                     onClick={() => startEditing(u)}
// //                     className="p-2 hover:bg-brand-teal/10 text-brand-teal rounded-lg transition-colors"
// //                     title="Edit"
// //                   >
// //                     <Pencil className="w-4 h-4" />
// //                   </button>
// //                 </div>
// //               </div>
// //             );
// //           })}
// //           {activeReps.length === 0 && (
// //             <div className="py-16 text-center">
// //               <Users className="w-10 h-10 opacity-10 mx-auto mb-3" />
// //               <p className="text-sm opacity-40 italic">No active sales reps.</p>
// //             </div>
// //           )}
// //         </div>
// //       </div>

// //       {/* Archived Reps */}
// //       {archivedReps.length > 0 && (
// //         <div className="space-y-3">
// //           <button
// //             onClick={() => setShowArchived((v) => !v)}
// //             className="flex items-center gap-2 text-xs font-bold opacity-40 uppercase tracking-widest hover:opacity-70 transition-opacity"
// //           >
// //             <ChevronDown
// //               className={clsx(
// //                 "w-4 h-4 transition-transform",
// //                 showArchived && "rotate-180",
// //               )}
// //             />
// //             Archived ({archivedReps.length})
// //           </button>
// //           {showArchived && (
// //             <div className="grid grid-cols-1 gap-3">
// //               {archivedReps.map((u) => (
// //                 <div
// //                   key={u.id}
// //                   className="p-3 lg:p-4 bg-theme-card border border-dashed border-theme-border rounded-xl flex items-center gap-3 opacity-50"
// //                 >
// //                   <div className="w-8 h-8 bg-gray-500/10 rounded-full flex items-center justify-center text-gray-400 font-bold shrink-0">
// //                     {u.name.charAt(0)}
// //                   </div>
// //                   <div className="min-w-0 flex-1">
// //                     <div className="flex items-center gap-2">
// //                       <h4 className="font-bold text-sm truncate">{u.name}</h4>
// //                       <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-400">
// //                         Archived
// //                       </span>
// //                     </div>
// //                     <p className="text-[10px] opacity-40 truncate mt-0.5">
// //                       {u.email}
// //                     </p>
// //                   </div>
// //                 </div>
// //               ))}
// //             </div>
// //           )}
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // function StatCard({
// //   label,
// //   value,
// //   trend,
// //   icon,
// // }: {
// //   label: string;
// //   value: string;
// //   trend: string;
// //   icon: React.ReactNode;
// // }) {
// //   return (
// //     <div className="p-6 bg-theme-card border border-theme-border rounded-2xl space-y-4">
// //       <div className="flex justify-between items-start">
// //         <div className="p-2 bg-brand-teal/10 rounded-lg text-brand-teal">
// //           {icon}
// //         </div>
// //         <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
// //           {trend}
// //         </span>
// //       </div>
// //       <div>
// //         <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
// //           {label}
// //         </p>
// //         <p className="text-3xl font-bold mt-1">{value}</p>
// //       </div>
// //     </div>
// //   );
// // }

// // function SettingsTab({
// //   theme,
// //   onThemeChange,
// // }: {
// //   theme: "dark" | "light";
// //   onThemeChange: (t: "dark" | "light") => void;
// // }) {
// //   return (
// //     <div className="max-w-2xl space-y-8 overflow-y-auto">
// //       <div className="p-6 bg-theme-card border border-theme-border rounded-2xl">
// //         <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">
// //           Appearance
// //         </h3>
// //         {/* <div className="grid grid-cols-2 gap-4"> */}
// //         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
// //           <button
// //             onClick={() => onThemeChange("dark")}
// //             className={clsx(
// //               "p-4 rounded-xl border transition-all flex flex-col items-center gap-3",
// //               theme === "dark"
// //                 ? "bg-brand-teal/20 border-brand-teal text-brand-teal"
// //                 : "bg-white/5 border-theme-border opacity-40 hover:opacity-100 hover:bg-white/10",
// //             )}
// //           >
// //             <Moon className="w-6 h-6" />
// //             <span className="text-xs font-bold uppercase tracking-widest">
// //               Dark Mode
// //             </span>
// //           </button>
// //           <button
// //             onClick={() => onThemeChange("light")}
// //             className={clsx(
// //               "p-4 rounded-xl border transition-all flex flex-col items-center gap-3",
// //               theme === "light"
// //                 ? "bg-brand-teal/20 border-brand-teal text-brand-teal"
// //                 : "bg-white/5 border-theme-border opacity-40 hover:opacity-100 hover:bg-white/10",
// //             )}
// //           >
// //             <Sun className="w-6 h-6" />
// //             <span className="text-xs font-bold uppercase tracking-widest">
// //               Light Mode
// //             </span>
// //           </button>
// //         </div>
// //       </div>

// //       {/* <div className="p-6 bg-theme-card border border-theme-border rounded-2xl">
// //         <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">
// //           Account Notifications
// //         </h3>
// //         <div className="space-y-4">
// //           <div className="flex items-center justify-between">
// //             <div>
// //               <p className="text-sm font-bold">Email Alerts</p>
// //               <p className="text-[10px] opacity-40 uppercase tracking-widest">
// //                 Receive updates on project status
// //               </p>
// //             </div>
// //             <div className="w-10 h-5 bg-brand-teal rounded-full relative">
// //               <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
// //             </div>
// //           </div>
// //         </div>
// //       </div> */}
// //     </div>
// //   );
// // }

// // function ProjectStatsTab({
// //   projectStats,
// //   tenant,
// // }: {
// //   projectStats: any[];
// //   tenant: Tenant;
// // }) {
// //   const totalProjects = projectStats.reduce(
// //     (sum, s) => sum + parseInt(s.project_count),
// //     0,
// //   );

// //   const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
// //   const [userProjects, setUserProjects] = useState<Record<string, any[]>>({});
// //   const [expandedProjectId, setExpandedProjectId] = useState<string | null>(
// //     null,
// //   );
// //   const [projectData, setProjectData] = useState<Record<string, any>>({});

// //   const handleExpandUser = async (userId: string) => {
// //     if (expandedUserId === userId) {
// //       setExpandedUserId(null);
// //       return;
// //     }
// //     setExpandedUserId(userId);
// //     if (!userProjects[userId]) {
// //       const res = await authFetch(
// //         `/api/projects?tenantId=${tenant.id}&userId=${userId}`,
// //       );
// //       if (res.ok) {
// //         const data = await res.json();
// //         setUserProjects((prev) => ({ ...prev, [userId]: data }));
// //       }
// //     }
// //   };

// //   const handleExpandProject = async (projectId: string) => {
// //     if (expandedProjectId === projectId) {
// //       setExpandedProjectId(null);
// //       return;
// //     }
// //     setExpandedProjectId(projectId);
// //     if (!projectData[projectId]) {
// //       const res = await authFetch(`/api/projects/${projectId}`);
// //       if (res.ok) {
// //         const data = await res.json();
// //         setProjectData((prev) => ({ ...prev, [projectId]: data.data || data }));
// //       }
// //     }
// //   };

// //   const [customEquipment, setCustomEquipment] = useState<any[]>([]);

// //   useEffect(() => {
// //     const fetchCustomEquipment = async () => {
// //       const res = await authFetch(`/api/tenant/${tenant.id}/equipment`);
// //       if (res.ok) {
// //         const data = await res.json();
// //         setCustomEquipment(data);
// //       }
// //     };
// //     fetchCustomEquipment();
// //   }, [tenant.id]);

// //   const equipmentLookup = React.useMemo(() => {
// //     const lookup: Record<
// //       string,
// //       { name: string; width: number; depth: number; height: number }
// //     > = {
// //       slide_small: { name: "Small Slide", width: 4, depth: 2, height: 3 },
// //       slide_large: { name: "Large Slide", width: 8, depth: 3, height: 6 },
// //       tower_3d: { name: "Tower", width: 5, depth: 5, height: 10 },
// //       duck_3d: { name: "Duck", width: 2, depth: 2, height: 2 },
// //       wave_pool: { name: "Wave Pool", width: 20, depth: 15, height: 2 },
// //       lazy_river: { name: "Lazy River", width: 30, depth: 5, height: 1.5 },
// //       splash_pad: { name: "Splash Pad", width: 10, depth: 10, height: 0.5 },
// //       pump_station: { name: "Pump Station", width: 5, depth: 5, height: 4 },
// //       ticket_booth: { name: "Ticket Booth", width: 3, depth: 3, height: 3 },
// //       locker_block: { name: "Locker Block", width: 10, depth: 4, height: 3 },
// //       food_kiosk: { name: "Food Kiosk", width: 4, depth: 4, height: 3 },
// //       seating_area: { name: "Seating Area", width: 6, depth: 6, height: 1 },
// //     };
// //     // Merge custom equipment from DB
// //     (customEquipment || []).forEach((eq: any) => {
// //       lookup[eq.id] = {
// //         name: eq.name,
// //         width: eq.width,
// //         depth: eq.depth,
// //         height: eq.height,
// //       };
// //     });
// //     return lookup;
// //   }, [customEquipment]);

// //   const getEquipmentList = (pd: any) => {
// //     if (!pd?.objects) return [];
// //     const counts: Record<string, number> = {};
// //     pd.objects.forEach((obj: any) => {
// //       counts[obj.type] = (counts[obj.type] || 0) + 1;
// //     });
// //     return Object.entries(counts).map(([type, count]) => {
// //       const def = equipmentLookup[type];
// //       return {
// //         type,
// //         name: def?.name || type,
// //         count,
// //         width: def?.width || 0,
// //         depth: def?.depth || 0,
// //         height: def?.height || 0,
// //       };
// //     });
// //   };

// //   return (
// //     <div className="space-y-6">
// //       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// //         <StatCard
// //           label="Total Projects"
// //           value={totalProjects.toString()}
// //           trend="across all reps"
// //           icon={<FolderOpen className="w-5 h-5" />}
// //         />
// //         <StatCard
// //           label="Sales Reps"
// //           value={projectStats.length.toString()}
// //           trend="in your team"
// //           icon={<Users className="w-5 h-5" />}
// //         />
// //       </div>

// //       <div className="p-6 bg-theme-card border border-theme-border rounded-2xl">
// //         <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">
// //           Projects per Sales Rep
// //         </h3>
// //         {projectStats.length === 0 ? (
// //           <p className="text-sm opacity-30 text-center py-8">
// //             No sales reps found
// //           </p>
// //         ) : (
// //           <div className="space-y-3">
// //             {projectStats.map((rep) => (
// //               <div
// //                 key={rep.user_id}
// //                 className="bg-white/5 border border-theme-border rounded-xl overflow-hidden"
// //               >
// //                 {/* Rep row — clickable */}
// //                 <div
// //                   className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
// //                   onClick={() => handleExpandUser(rep.user_id)}
// //                 >
// //                   <div className="flex items-center gap-3">
// //                     <div className="w-9 h-9 rounded-lg bg-brand-teal/10 flex items-center justify-center text-brand-teal font-bold text-sm">
// //                       {rep.user_name?.charAt(0).toUpperCase()}
// //                     </div>
// //                     <div>
// //                       <p className="text-sm font-medium">{rep.user_name}</p>
// //                       <p className="text-[11px] opacity-30">{rep.email}</p>
// //                     </div>
// //                   </div>
// //                   <div className="flex items-center gap-3">
// //                     <div className="text-right">
// //                       <p className="text-lg font-bold text-brand-teal">
// //                         {rep.project_count}
// //                       </p>
// //                       <p className="text-[10px] opacity-30 uppercase tracking-wider">
// //                         projects
// //                       </p>
// //                     </div>
// //                     <ChevronDown
// //                       className={`w-4 h-4 opacity-30 transition-transform ${expandedUserId === rep.user_id ? "rotate-180" : ""}`}
// //                     />
// //                   </div>
// //                 </div>

// //                 {/* Expanded projects */}
// //                 {expandedUserId === rep.user_id && (
// //                   <div className="border-t border-white/10 px-4 pb-4">
// //                     <p className="text-[10px] uppercase tracking-widest opacity-30 mt-3 mb-3">
// //                       Projects
// //                     </p>
// //                     {!userProjects[rep.user_id] ? (
// //                       <p className="text-xs opacity-30">Loading...</p>
// //                     ) : userProjects[rep.user_id].length === 0 ? (
// //                       <p className="text-xs opacity-30 italic">
// //                         No projects yet.
// //                       </p>
// //                     ) : (
// //                       <div className="space-y-2">
// //                         {userProjects[rep.user_id].map((project: any) => (
// //                           <div
// //                             key={project.id}
// //                             className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
// //                           >
// //                             <div
// //                               className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
// //                               onClick={() => handleExpandProject(project.id)}
// //                             >
// //                               <div>
// //                                 <p className="text-xs font-semibold text-white">
// //                                   {project.name}
// //                                 </p>
// //                                 {project.client_name && (
// //                                   <p className="text-[10px] text-brand-teal/70 mt-0.5">
// //                                     {project.client_name}
// //                                   </p>
// //                                 )}
// //                                 <p className="text-[10px] opacity-30 mt-0.5">
// //                                   {project.updated_at
// //                                     ? `Updated ${new Date(project.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
// //                                     : `Created ${new Date(project.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
// //                                 </p>
// //                               </div>
// //                               <ChevronDown
// //                                 className={`w-3.5 h-3.5 opacity-30 transition-transform shrink-0 ${expandedProjectId === project.id ? "rotate-180" : ""}`}
// //                               />
// //                             </div>

// //                             {expandedProjectId === project.id && (
// //                               <div className="border-t border-white/10 px-3 pb-3">
// //                                 <p className="text-[10px] uppercase tracking-widest opacity-30 mt-2 mb-2">
// //                                   Equipment Used
// //                                 </p>
// //                                 {!projectData[project.id] ? (
// //                                   <p className="text-xs opacity-30">
// //                                     Loading...
// //                                   </p>
// //                                 ) : getEquipmentList(projectData[project.id])
// //                                     .length === 0 ? (
// //                                   <p className="text-xs opacity-30">
// //                                     No equipment placed.
// //                                   </p>
// //                                 ) : (
// //                                   <div className="space-y-1">
// //                                     {getEquipmentList(
// //                                       projectData[project.id],
// //                                     ).map((eq) => (
// //                                       <div
// //                                         key={eq.type}
// //                                         className="flex items-center justify-between bg-white/5 rounded px-2 py-1.5"
// //                                       >
// //                                         <div>
// //                                           <span className="text-xs font-medium text-white">
// //                                             {eq.name}
// //                                           </span>
// //                                           <span className="text-[10px] opacity-30 ml-1">
// //                                             ({eq.width}m×{eq.depth}m×{eq.height}
// //                                             m)
// //                                           </span>
// //                                         </div>
// //                                         <span className="text-xs font-bold text-brand-teal">
// //                                           ×{eq.count}
// //                                         </span>
// //                                       </div>
// //                                     ))}
// //                                   </div>
// //                                 )}
// //                               </div>
// //                             )}
// //                           </div>
// //                         ))}
// //                       </div>
// //                     )}
// //                   </div>
// //                 )}
// //               </div>
// //             ))}
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // }

// // function ProfileTab({
// //   user,
// //   onUserUpdate,
// //   onProfileSaved,
// //   onShowToast,
// // }: {
// //   user: User;
// //   onUserUpdate?: (user: User) => void;
// //   onProfileSaved?: () => void;
// //   onShowToast?: (message: string, type?: "success" | "error") => void;
// // }) {
// //   const [profileData, setProfileData] = useState({
// //     name: user.name,
// //     phone: user.phone || "",
// //     password: "",
// //   });
// //   const [isSaving, setIsSaving] = useState(false);

// //   const handleSaveProfile = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     setIsSaving(true);
// //     try {
// //       const res = await authFetch(`/api/users/${user.id}`, {
// //         method: "PUT",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({
// //           name: profileData.name,
// //           phone: profileData.phone,
// //           password: profileData.password || undefined,
// //         }),
// //       });
// //       if (res.ok) {
// //         const updatedUser: User = {
// //           ...user,
// //           name: profileData.name,
// //           phone: profileData.phone,
// //         };
// //         onUserUpdate?.(updatedUser);
// //         onProfileSaved?.();
// //         onShowToast?.("Profile updated successfully!");
// //       }
// //     } catch (err) {
// //       console.error(err);
// //     } finally {
// //       setIsSaving(false);
// //     }
// //   };

// //   return (
// //     <div className="max-w-2xl space-y-8 overflow-y-auto">
// //       <div className="p-6 bg-theme-card border border-theme-border rounded-2xl">
// //         <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">
// //           Profile Settings
// //         </h3>
// //         <form onSubmit={handleSaveProfile} className="space-y-4">
// //           {/* <div className="grid grid-cols-2 gap-4"> */}
// //           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
// //             <div className="space-y-2">
// //               <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
// //                 Full Name
// //               </label>
// //               <input
// //                 type="text"
// //                 value={profileData.name}
// //                 onChange={(e) =>
// //                   setProfileData({ ...profileData, name: e.target.value })
// //                 }
// //                 className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
// //               />
// //             </div>
// //             <div className="space-y-2">
// //               <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
// //                 Mobile Number
// //               </label>
// //               <input
// //                 inputMode="numeric"
// //                 maxLength={10}
// //                 placeholder="10-digit mobile number"
// //                 type="tel"
// //                 value={profileData.phone}
// //                 onChange={(e) => {
// //                   const val = e.target.value.replace(/\D/g, "").slice(0, 10);
// //                   setProfileData({ ...profileData, phone: val });
// //                 }}
// //                 className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
// //               />
// //             </div>
// //           </div>
// //           <div className="space-y-2">
// //             <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
// //               New Password (Optional)
// //             </label>
// //             <input
// //               type="password"
// //               value={profileData.password}
// //               onChange={(e) =>
// //                 setProfileData({ ...profileData, password: e.target.value })
// //               }
// //               className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
// //               placeholder="Leave blank to keep current"
// //             />
// //           </div>
// //           <button
// //             type="submit"
// //             disabled={isSaving}
// //             className="px-6 py-2 bg-brand-teal text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-brand-teal/90 transition-all disabled:opacity-50"
// //           >
// //             {isSaving ? "Saving..." : "Update Profile"}
// //           </button>
// //         </form>
// //       </div>
// //     </div>
// //   );
// // }

// import React, { useState, useEffect, useCallback } from "react";
// import { authFetch } from "../utils/api";
// import {
//   User,
//   Tenant,
//   EquipmentDef,
//   DEFAULT_LIBRARY,
// } from "../../../backend/types";
// import {
//   LayoutDashboard,
//   Package,
//   Users,
//   Settings,
//   User as UserIcon,
//   Plus,
//   Search,
//   Box,
//   TrendingUp,
//   LogOut,
//   ChevronRight,
//   Pencil,
//   Trash2,
//   X,
//   Moon,
//   Sun,
//   KeyRound,
//   Upload,
//   Activity,
//   Clock,
//   ShieldCheck,
//   Eye,
//   EyeOff,
//   FolderOpen,
//   ChevronDown,
//   Lock,
//   Archive,
//   Share2,
//   ShieldAlert,
// } from "lucide-react";
// import { motion } from "motion/react";
// import { clsx } from "clsx";
// import { v4 as uuidv4 } from "uuid";
// import { useTheme } from "../contexts/ThemeContext";
// import { LockedAccountsPanel } from "./LockedAccountsPanel";

// const generateDefaultEquipmentImage = (item: EquipmentDef) => {
//   const label = item.name
//     .split(" ")
//     .map((word) => word[0])
//     .join("")
//     .slice(0, 3)
//     .toUpperCase();
//   const fill = item.color || "#999";
//   const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='100%' height='100%' fill='${fill}'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, system-ui, sans-serif' font-size='28' fill='#ffffff' opacity='0.85'>${label}</text></svg>`;
//   return `data:image/svg+xml,${encodeURIComponent(svg)}`;
// };

// const resolveImageUrl = (imageUrl?: string | null) => {
//   if (!imageUrl) return null;
//   if (
//     imageUrl.startsWith("data:") ||
//     imageUrl.startsWith("http://") ||
//     imageUrl.startsWith("https://")
//   ) {
//     return imageUrl;
//   }
//   return `${import.meta.env.VITE_API_URL}${imageUrl}`;
// };

// const getEquipmentThumbnail = (item: EquipmentDef) => {
//   const imageUrl = resolveImageUrl(item.imageUrl);
//   return imageUrl ? imageUrl : generateDefaultEquipmentImage(item);
// };

// const formatSnakeCaseToTitleCase = (str: string) => {
//   return str
//     .split("_")
//     .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//     .join(" ");
// };

// const getEquipmentNameByIdFromList = (
//   entityId: string,
//   equipment: EquipmentDef[],
// ): string => {
//   const customEquip = equipment.find((e) => e.id === entityId);
//   if (customEquip) return customEquip.name;

//   const defaultEquip = DEFAULT_LIBRARY.find((e) => e.id === entityId);
//   if (defaultEquip) return defaultEquip.name;

//   return "";
// };

// const getLogEntityDisplayName = (
//   log: any,
//   equipment: EquipmentDef[],
// ): string => {
//   const lookupId = log.entity_id || log.entity_name;
//   const equipmentName = lookupId
//     ? getEquipmentNameByIdFromList(lookupId, equipment)
//     : "";
//   if (equipmentName) return equipmentName;

//   if (log.entity_name) {
//     return log.entity_name.includes("_")
//       ? formatSnakeCaseToTitleCase(log.entity_name)
//       : log.entity_name;
//   }

//   return log.details || log.action;
// };

// interface Props {
//   user: User;
//   tenant: Tenant;
//   onLogout: () => void;
//   onUserUpdate?: (user: User) => void;
//   onShowToast?: (message: string, type?: "success" | "error") => void;
// }

// export function AdminDashboard({
//   user,
//   tenant,
//   onLogout,
//   onUserUpdate,
//   onShowToast,
// }: Props) {
//   const { theme, setTheme } = useTheme();
//   const [activeTab, setActiveTab] = useState<
//     | "overview"
//     | "equipment"
//     | "users"
//     | "settings"
//     | "profile"
//     | "resets"
//     | "logs"
//     | "projects"
//     | "locked-accounts"
//   >("overview");
//   const [equipment, setEquipment] = useState<EquipmentDef[]>([]);
//   const [isAddingEquipment, setIsAddingEquipment] = useState(false);
//   const [editingEquipment, setEditingEquipment] = useState<EquipmentDef | null>(
//     null,
//   );
//   const [searchQuery, setSearchQuery] = useState("");
//   const [isAddingUser, setIsAddingUser] = useState(false);
//   const [salesRepCount, setSalesRepCount] = useState(0);
//   const [newEquipment, setNewEquipment] = useState<Partial<EquipmentDef>>({
//     name: "",
//     category: "slides",
//     width: 5,
//     depth: 5,
//     height: 5,
//     color: "#14b8a6",
//   });

//   const [resetRequests, setResetRequests] = useState<any[]>([]);
//   const [tempPasswords, setTempPasswords] = useState<Record<string, string>>(
//     {},
//   );
//   const [ResetCount, setResetCount] = useState(0);
//   const [isFetchingResetRequests, setIsFetchingResetRequests] = useState(false);

//   const [logs, setLogs] = useState<any[]>([]);
//   const [logFilter, setLogFilter] = useState("all");
//   const [logDateFilter, setLogDateFilter] = useState<{
//     startDate: string;
//     endDate: string;
//   }>(() => {
//     const today = new Date();
//     const dateStr = today.toISOString().split("T")[0];
//     return { startDate: dateStr, endDate: dateStr };
//   });
//   const overviewLogs = logs
//     .filter(
//       (log) =>
//         log.action !== "LOGIN" &&
//         log.entity_type !== "auth" &&
//         log.entity_type !== "login",
//     )
//     .slice(0, 3);
//   //const [disabledDefaults, setDisabledDefaults] = useState<string[]>([]);
//   const [disabledDefaults, setDisabledDefaults] = useState<Set<string>>(
//     new Set(),
//   );

//   const fetchLogs = async () => {
//     const res = await authFetch(`/api/tenant/${tenant.id}/logs?limit=100`);
//     if (res.ok) {
//       const data = await res.json();
//       setLogs(data);
//     }
//   };

//   const getFilteredLogs = (logsToFilter: any[]) => {
//     let filtered = logsToFilter;

//     // Filter by entity type
//     if (logFilter !== "all") {
//       filtered = filtered.filter((l) => l.entity_type === logFilter);
//     }

//     // Filter by date range
//     const startDate = new Date(`${logDateFilter.startDate}T00:00:00`).getTime();
//     const endDate = new Date(`${logDateFilter.endDate}T23:59:59`).getTime();

//     filtered = filtered.filter((log) => {
//       const logTime = new Date(log.created_at).getTime();
//       return logTime >= startDate && logTime <= endDate;
//     });

//     return filtered;
//   };

//   const filteredLogsForDisplay = getFilteredLogs(logs);

//   const fetchResetRequests = useCallback(async () => {
//     setIsFetchingResetRequests(true);
//     try {
//       const res = await authFetch(`/api/admin/reset-requests`);
//       if (res.ok) {
//         const data = await res.json();
//         setResetRequests(data);
//         setResetCount(data.length);
//       }
//     } finally {
//       setIsFetchingResetRequests(false);
//     }
//   }, [tenant.id]);

//   const fetchSalesRepCount = async () => {
//     const res = await authFetch(`/api/tenant/${tenant.id}/users`);
//     if (res.ok) {
//       const data = await res.json();
//       const count = data.filter(
//         (u: any) => u.role === "sales_rep" && u.is_active !== false,
//       ).length;
//       setSalesRepCount(count);
//     }
//   };

//   const fetchEquipment = async () => {
//     const res = await authFetch(`/api/tenant/${tenant.id}/equipment`);
//     if (res.ok) {
//       const data = await res.json();
//       const mapped = data.map((eq: any) => ({
//         id: eq.id,
//         name: eq.name,
//         category: eq.category,
//         width: eq.width,
//         depth: eq.depth,
//         height: eq.height,
//         color: eq.color,
//         modelUrl: eq.model_url,
//         animationsEnabled: !!eq.animations_enabled,
//         imageUrl: eq.image_url || null,
//         isActive: Number(eq.is_active) !== 0,
//       }));
//       setEquipment(mapped);
//     }
//   };

//   const getEquipmentNameById = (id: string) =>
//     getEquipmentNameByIdFromList(id, equipment);

//   // Add equipment stats state and fetch:
//   const [equipmentStats, setEquipmentStats] = useState({
//     total: 0,
//     active: 0,
//     inactive: 0,
//   });

//   const fetchEquipmentStats = async () => {
//     const res = await authFetch(`/api/tenant/${tenant.id}/equipment/stats`);
//     if (res.ok) {
//       const data = await res.json();
//       setEquipmentStats(data);
//     }
//   };

//   const fetchDisabledDefaults = async () => {
//     const res = await authFetch(`/api/tenant/${tenant.id}/disabled-defaults`);
//     if (res.ok) {
//       const ids: string[] = await res.json();
//       setDisabledDefaults(new Set(ids));
//     }
//   };

//   const fetchActiveProjects = async () => {
//     const res = await authFetch(`/api/tenant/${tenant.id}/active-projects`);
//     if (res.ok) {
//       const data = await res.json();
//       setActiveProjectCount(data.count);
//     }
//   };

//   const fetchProjectStats = async () => {
//     const res = await authFetch(`/api/tenant/${tenant.id}/project-stats`);
//     if (res.ok) {
//       const data = await res.json();
//       setProjectStats(data);
//     }
//   };

//   const [activeProjectCount, setActiveProjectCount] = useState(0);
//   const [projectStats, setProjectStats] = useState<any[]>([]);

//   useEffect(() => {
//     fetchEquipment();
//     fetchEquipmentStats();
//     fetchDisabledDefaults();
//     fetchLogs();
//     fetchActiveProjects();
//     fetchProjectStats();
//   }, [tenant.id]);

//   useEffect(() => {
//     if (activeTab === "logs") {
//       fetchLogs();
//     }
//   }, [activeTab, tenant.id]);

//   // Add resolve handler
//   const handleResolveReset = async (requestId: string) => {
//     const tempPwd = tempPasswords[requestId];
//     if (!tempPwd || tempPwd.length < 8) {
//       return alert("Temp password must be at least 8 characters");
//     }

//     const res = await authFetch(
//       `/api/admin/reset-requests/${requestId}/resolve`,
//       {
//         method: "POST",
//         body: JSON.stringify({ temp_password: tempPwd }),
//       },
//     );

//     if (res.ok) {
//       alert("Temporary password set. Share it with the user.");
//       fetchResetRequests();
//     }
//   };

//   const handleAddEquipment = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (newEquipment.modelUrl === "uploading...") {
//       alert("Please wait for the 3D model upload to finish before saving.");
//       return;
//     }
//     const id = uuidv4();
//     const res = await authFetch(`/api/tenant/${tenant.id}/equipment`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         id,
//         name: newEquipment.name,
//         category: newEquipment.category,
//         width: newEquipment.width,
//         depth: newEquipment.depth,
//         height: newEquipment.height,
//         color: newEquipment.color,
//         model_url: newEquipment.modelUrl || null,
//         image_url: newEquipment.imageUrl || null,
//       }),
//     });

//     if (res.ok) {
//       setIsAddingEquipment(false);
//       setNewEquipment({
//         name: "",
//         category: "slides",
//         width: 5,
//         depth: 5,
//         height: 5,
//         color: "#14b8a6",
//         imageUrl: "",
//       });
//       fetchEquipment();
//     }
//   };

//   const handleUpdateEquipment = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!editingEquipment) return;
//     if (editingEquipment.modelUrl === "uploading...") {
//       alert("Please wait for the 3D model upload to finish before saving.");
//       return;
//     }

//     const res = await authFetch(
//       `/api/tenant/${tenant.id}/equipment/${editingEquipment.id}`,
//       {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           id: editingEquipment.id,
//           name: editingEquipment.name,
//           category: editingEquipment.category,
//           width: editingEquipment.width,
//           depth: editingEquipment.depth,
//           height: editingEquipment.height,
//           color: editingEquipment.color,
//           model_url: editingEquipment.modelUrl || null,
//           image_url: editingEquipment.imageUrl || null,
//         }),
//       },
//     );

//     if (res.ok) {
//       setEditingEquipment(null);
//       fetchEquipment();
//     }
//   };

//   const handleDeleteEquipment = async (id: string) => {
//     if (!confirm("Are you sure you want to delete this equipment?")) return;

//     const res = await authFetch(`/api/tenant/${tenant.id}/equipment/${id}`, {
//       method: "DELETE",
//     });

//     if (res.ok) {
//       fetchEquipment();
//     }
//   };

//   const handleToggleActive = async (id: string, currentlyActive: boolean) => {
//     // Optimistic UI: flip the equipment state immediately so counts and badges update
//     setEquipment((prev) =>
//       prev.map((eq) =>
//         eq.id === id ? { ...eq, isActive: !currentlyActive } : eq,
//       ),
//     );

//     // Optimistically adjust equipmentStats
//     const prevStats = { ...equipmentStats };
//     setEquipmentStats((s) => ({
//       ...s,
//       active: s.active + (currentlyActive ? -1 : 1),
//       inactive: s.inactive + (currentlyActive ? 1 : -1),
//     }));

//     const res = await authFetch(
//       `/api/tenant/${tenant.id}/equipment/${id}/toggle`,
//       {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ is_active: currentlyActive ? 0 : 1 }),
//       },
//     );

//     if (res.ok) {
//       // Confirm counts with server to avoid drift
//       fetchEquipmentStats();
//     } else {
//       // Revert optimistic changes on failure
//       setEquipment((prev) =>
//         prev.map((eq) =>
//           eq.id === id ? { ...eq, isActive: currentlyActive } : eq,
//         ),
//       );
//       setEquipmentStats(prevStats);
//     }
//   };

//   // Toggle a DEFAULT_LIBRARY item on/off for this tenant
//   const handleToggleDefault = async (equipmentId: string) => {
//     const isCurrentlyDisabled = disabledDefaults.has(equipmentId);
//     console.log(
//       `Toggling default equipment ${equipmentId}. Currently disabled: ${isCurrentlyDisabled}`,
//     );
//     // Optimistic update
//     setDisabledDefaults((prev) => {
//       const next = new Set(prev);
//       isCurrentlyDisabled ? next.delete(equipmentId) : next.add(equipmentId);
//       return next;
//     });

//     // Optimistically adjust equipmentStats (DEFAULT library counts are included)
//     const prevStats = { ...equipmentStats };
//     setEquipmentStats((s) => ({
//       ...s,
//       active: s.active + (isCurrentlyDisabled ? 1 : -1),
//       inactive: s.inactive + (isCurrentlyDisabled ? -1 : 1),
//     }));

//     const res = await authFetch(
//       `/api/tenant/${tenant.id}/disabled-defaults/${equipmentId}`,
//       {
//         method: "POST",
//       },
//     );

//     if (res.ok) {
//       // Refresh stats to ensure counts are accurate
//       await fetchEquipmentStats();
//     } else {
//       // Revert both disabledDefaults and stats on failure
//       setDisabledDefaults((prev) => {
//         const next = new Set(prev);
//         isCurrentlyDisabled ? next.add(equipmentId) : next.delete(equipmentId);
//         return next;
//       });
//       setEquipmentStats(prevStats);
//     }
//   };

//   return (
//     <div className="flex h-screen w-screen bg-theme-bg text-theme-text overflow-auto transition-colors duration-300">
//       {/* Sidebar */}
//       {/* <aside className="w-64 border-r border-theme-border flex flex-col"> */}
//       <aside className="w-48 lg:w-64 shrink-0 border-r border-theme-border flex flex-col overflow-y-auto">
//         <div className="p-6 border-b border-theme-border">
//           <div className="flex items-center justify-between mb-4">
//             <div className="flex items-center gap-3">
//               <img
//                 src={tenant.logo_url}
//                 alt="Logo"
//                 className="w-8 h-8 rounded-lg object-cover"
//               />
//               <div>
//                 <h1 className="text-sm font-bold truncate">{tenant.name}</h1>
//                 <p className="text-[10px] opacity-40 uppercase tracking-widest">
//                   Admin Portal
//                 </p>
//               </div>
//             </div>
//           </div>
//           <button
//             onClick={() => setActiveTab("profile")}
//             className={clsx(
//               "w-full flex items-center gap-3 p-2 rounded-lg transition-all text-xs font-bold uppercase tracking-widest group",
//               activeTab === "profile"
//                 ? "bg-brand-teal/10 text-brand-teal"
//                 : "opacity-40 hover:opacity-100 hover:bg-white/5",
//             )}
//           >
//             <UserIcon className="w-4 h-4" />
//             View Profile
//           </button>
//         </div>

//         <nav className="flex-1 p-4 space-y-2">
//           <NavButton
//             active={activeTab === "overview"}
//             onClick={() => setActiveTab("overview")}
//             icon={<LayoutDashboard className="w-4 h-4" />}
//             label="Overview"
//           />
//           <NavButton
//             active={activeTab === "resets"}
//             onClick={() => {
//               setActiveTab("resets");
//               fetchResetRequests();
//             }}
//             icon={<KeyRound className="w-4 h-4" />}
//             label="Password Resets"
//             badge={ResetCount > 0 ? ResetCount : undefined}
//           />
//           <NavButton
//             active={activeTab === "locked-accounts"}
//             onClick={() => setActiveTab("locked-accounts")}
//             icon={<Lock className="w-4 h-4" />}
//             label="Locked Accounts"
//           />
//           <NavButton
//             active={activeTab === "logs"}
//             onClick={() => setActiveTab("logs")}
//             icon={<Activity className="w-4 h-4" />}
//             label="Activity Logs"
//           />
//           <NavButton
//             active={activeTab === "equipment"}
//             onClick={() => setActiveTab("equipment")}
//             icon={<Package className="w-4 h-4" />}
//             label="Equipment Repo"
//           />
//           <NavButton
//             active={activeTab === "users"}
//             onClick={() => setActiveTab("users")}
//             icon={<Users className="w-4 h-4" />}
//             label="Sales Team"
//           />
//           <NavButton
//             active={activeTab === "projects"}
//             onClick={() => setActiveTab("projects")}
//             icon={<FolderOpen className="w-4 h-4" />}
//             label="Project Stats"
//           />
//           <NavButton
//             active={activeTab === "settings"}
//             onClick={() => setActiveTab("settings")}
//             icon={<Settings className="w-4 h-4" />}
//             label="Settings"
//           />
//         </nav>

//         <div className="p-4 border-t border-theme-border">
//           <button
//             onClick={onLogout}
//             className="w-full flex items-center gap-3 p-3 opacity-40 hover:opacity-100 hover:bg-white/5 rounded-xl transition-all text-sm"
//           >
//             <LogOut className="w-4 h-4" />
//             Sign Out
//           </button>
//         </div>
//       </aside>

//       {/* Main Content */}
//       {/* <main className="flex-1 overflow-y-auto p-8 custom-scrollbar"> */}
//       <main className="flex-1 overflow-auto p-4 lg:p-8 custom-scrollbar min-w-0">
//         <header className="flex justify-between items-center mb-8">
//           {/* <div>
//             <h2 className="text-2xl font-bold tracking-tight"> */}
//           <div className="min-w-0 flex-1 mr-4">
//             <h2 className="text-lg lg:text-2xl font-bold tracking-tight truncate">
//               {activeTab === "overview" && "Dashboard Overview"}
//               {activeTab === "equipment" && "Equipment Repository"}
//               {activeTab === "users" && "Sales Team Management"}
//               {activeTab === "settings" && "Company Settings"}
//               {activeTab === "profile" && "Profile"}
//               {activeTab === "resets" && "Password Reset Requests"}
//               {activeTab === "locked-accounts" && "Locked Accounts"}
//               {activeTab === "logs" && "Activity Logs"}
//               {activeTab === "projects" && "Project Statistics"}
//             </h2>
//             <p className="text-sm opacity-40">Welcome back, {user.name}</p>
//           </div>

//           {(activeTab === "equipment" || activeTab === "users") && (
//             <div className="flex items-center gap-3 shrink-0">
//               {/*  Show user count badge only on users tab */}
//               {activeTab === "users" && (
//                 <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-white/5 border border-theme-border rounded-lg">
//                   {/* We need to pass the count down — see below */}
//                   Sales Reps: {salesRepCount} / 10
//                 </span>
//               )}
//               <button
//                 onClick={() =>
//                   activeTab === "equipment"
//                     ? setIsAddingEquipment(true)
//                     : setIsAddingUser(true)
//                 }
//                 disabled={activeTab === "users" && salesRepCount >= 10} // disable at limit
//                 className={clsx(
//                   "flex items-center gap-1 lg:gap-2 px-2 lg:px-4 py-2 text-[10px] lg:text-xs font-bold uppercase tracking-widest rounded-lg transition-all shadow-lg shrink-0",
//                   activeTab === "users" && salesRepCount >= 10
//                     ? "bg-white/10 text-white/30 cursor-not-allowed shadow-none" // greyed out
//                     : "bg-brand-teal text-white hover:bg-brand-teal/90 shadow-brand-teal/20",
//                 )}
//               >
//                 <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
//                 <span className="hidden sm:inline">
//                   {activeTab === "equipment"
//                     ? "Add New Equipment"
//                     : "Add Person"}
//                 </span>
//                 <span className="sm:hidden">
//                   <Plus className="w-3 h-3" />
//                 </span>
//               </button>
//             </div>
//           )}
//         </header>

//         {activeTab === "overview" && (
//           <OverviewTab
//             tenant={tenant}
//             equipmentStats={equipmentStats}
//             activeProjectCount={activeProjectCount}
//             projectStats={projectStats}
//             recentLogs={overviewLogs}
//             equipment={equipment}
//             getEquipmentNameById={getEquipmentNameById}
//           />
//         )}
//         {activeTab === "equipment" && (
//           <div className="flex items-center gap-3 mb-6 flex-wrap">
//             <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
//               Active: {equipmentStats.active}
//             </span>
//             <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg">
//               Inactive: {equipmentStats.inactive}
//             </span>
//             <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-white/5 border border-theme-border rounded-lg">
//               Total: {equipmentStats.total}
//             </span>
//             <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg">
//               Default Active: {DEFAULT_LIBRARY.length - disabledDefaults.size}
//             </span>
//           </div>
//         )}
//         {activeTab === "equipment" && (
//           <EquipmentTab
//             equipment={equipment}
//             searchQuery={searchQuery}
//             setSearchQuery={setSearchQuery}
//             isAdding={isAddingEquipment}
//             setIsAdding={setIsAddingEquipment}
//             editingItem={editingEquipment}
//             setEditingItem={setEditingEquipment}
//             newEquipment={newEquipment}
//             setNewEquipment={setNewEquipment}
//             onAdd={handleAddEquipment}
//             onUpdate={handleUpdateEquipment}
//             onDelete={handleDeleteEquipment}
//             onToggleActive={handleToggleActive}
//             disabledDefaults={disabledDefaults}
//             onToggleDefault={handleToggleDefault}
//           />
//         )}
//         {activeTab === "users" && (
//           <UsersTab
//             tenant={tenant}
//             isAdding={isAddingUser}
//             setIsAdding={setIsAddingUser}
//             salesRepCount={salesRepCount}
//             setSalesRepCount={setSalesRepCount}
//           />
//         )}
//         {activeTab === "projects" && (
//           <ProjectStatsTab projectStats={projectStats} tenant={tenant} />
//         )}
//         {activeTab === "settings" && (
//           <SettingsTab theme={theme} onThemeChange={setTheme} />
//         )}
//         {activeTab === "profile" && (
//           <ProfileTab
//             user={user}
//             onUserUpdate={onUserUpdate}
//             onProfileSaved={fetchLogs}
//             onShowToast={onShowToast}
//           />
//         )}

//         {activeTab === "locked-accounts" && (
//           <LockedAccountsPanel userRole="tenant_admin" tenantId={tenant.id} />
//         )}

//         {activeTab === "logs" &&
//           (() => {
//             return (
//               <div className="space-y-4">
//                 {/* Date Range Filter */}
//                 <div className="p-4 bg-theme-card border border-theme-border rounded-2xl space-y-3">
//                   <h4 className="text-sm font-bold uppercase tracking-widest opacity-60">
//                     Filter by Date
//                   </h4>
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-2">
//                         From Date
//                       </label>
//                       <input
//                         type="date"
//                         value={logDateFilter.startDate}
//                         onChange={(e) =>
//                           setLogDateFilter((prev) => ({
//                             ...prev,
//                             startDate: e.target.value,
//                           }))
//                         }
//                         className="w-full px-3 py-2 bg-white/5 border border-theme-border rounded-lg text-sm font-medium transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-teal"
//                       />
//                     </div>
//                     <div>
//                       <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-2">
//                         To Date
//                       </label>
//                       <input
//                         type="date"
//                         value={logDateFilter.endDate}
//                         onChange={(e) =>
//                           setLogDateFilter((prev) => ({
//                             ...prev,
//                             endDate: e.target.value,
//                           }))
//                         }
//                         className="w-full px-3 py-2 bg-white/5 border border-theme-border rounded-lg text-sm font-medium transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-teal"
//                       />
//                     </div>
//                   </div>
//                   <button
//                     onClick={() => {
//                       const today = new Date().toISOString().split("T")[0];
//                       setLogDateFilter({ startDate: today, endDate: today });
//                     }}
//                     className="w-full py-2 bg-white/5 hover:bg-white/10 border border-theme-border rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors"
//                   >
//                     Reset to Today
//                   </button>
//                 </div>

//                 {/* Type Filter bar */}
//                 <div className="flex items-center gap-2 flex-wrap">
//                   {[
//                     "all",
//                     "auth",
//                     "sales_rep",
//                     "equipment",
//                     "project",
//                     "password_reset",
//                     "profile",
//                   ].map((filter) => (
//                     <button
//                       key={filter}
//                       onClick={() => setLogFilter(filter)}
//                       className={clsx(
//                         "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all border",
//                         logFilter === filter
//                           ? "bg-brand-teal text-white border-brand-teal"
//                           : "bg-white/5 border-theme-border opacity-60 hover:opacity-100",
//                       )}
//                     >
//                       {filter === "all"
//                         ? "All Activity"
//                         : filter.replace("_", " ")}
//                     </button>
//                   ))}
//                 </div>

//                 {/* Log entries */}
//                 <div className="space-y-2">
//                   {filteredLogsForDisplay.length === 0 ? (
//                     <div className="py-20 text-center border border-dashed border-theme-border rounded-2xl">
//                       <Activity className="w-12 h-12 opacity-10 mx-auto mb-4" />
//                       <p className="text-sm opacity-40 italic">
//                         No activity logs found for the selected date range.
//                       </p>
//                     </div>
//                   ) : (
//                     filteredLogsForDisplay.map((log) => (
//                       <div
//                         key={log.id}
//                         className="flex items-start gap-4 p-4 bg-theme-card border border-theme-border rounded-xl hover:bg-white/5 transition-colors"
//                       >
//                         <div
//                           className={clsx(
//                             "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
//                             log.action === "CREATE" &&
//                               "bg-emerald-500/20 text-emerald-400",
//                             log.action === "UPDATE" &&
//                               !log.details
//                                 ?.toLowerCase()
//                                 .includes("archived") &&
//                               "bg-blue-500/20 text-blue-400",
//                             log.action === "UPDATE" &&
//                               log.details?.toLowerCase().includes("archived") &&
//                               "bg-amber-500/20 text-amber-400",
//                             log.action === "DELETE" &&
//                               "bg-red-500/20 text-red-400",
//                             log.action === "LOGIN" &&
//                               "bg-brand-teal/20 text-brand-teal",
//                             log.action === "LOGIN_FAILED" &&
//                               "bg-red-500/20 text-red-400",
//                             log.action === "SAVE" &&
//                               "bg-purple-500/20 text-purple-400",
//                             log.action === "REQUEST" &&
//                               "bg-amber-500/20 text-amber-400",
//                             log.action === "RESOLVE" &&
//                               "bg-emerald-500/20 text-emerald-400",
//                             log.action === "SHARE" &&
//                               "bg-sky-500/20 text-sky-400",
//                           )}
//                         >
//                           {log.action === "CREATE" && (
//                             <Plus className="w-4 h-4" />
//                           )}
//                           {log.action === "UPDATE" &&
//                             !log.details
//                               ?.toLowerCase()
//                               .includes("archived") && (
//                               <Pencil className="w-4 h-4" />
//                             )}
//                           {log.action === "UPDATE" &&
//                             log.details?.toLowerCase().includes("archived") && (
//                               <Archive className="w-4 h-4" />
//                             )}
//                           {log.action === "DELETE" && (
//                             <Trash2 className="w-4 h-4" />
//                           )}
//                           {log.action === "LOGIN" && (
//                             <UserIcon className="w-4 h-4" />
//                           )}
//                           {log.action === "LOGIN_FAILED" && (
//                             <ShieldAlert className="w-4 h-4" />
//                           )}
//                           {log.action === "SAVE" && (
//                             <ShieldCheck className="w-4 h-4" />
//                           )}
//                           {log.action === "REQUEST" && (
//                             <KeyRound className="w-4 h-4" />
//                           )}
//                           {log.action === "RESOLVE" && (
//                             <ShieldCheck className="w-4 h-4" />
//                           )}
//                           {log.action === "SHARE" && (
//                             <Share2 className="w-4 h-4" />
//                           )}
//                         </div>

//                         <div className="flex-1 min-w-0">
//                           <div className="flex items-start justify-between gap-2 flex-wrap">
//                             <div className="flex items-center gap-2 flex-wrap">
//                               <span
//                                 className={clsx(
//                                   "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded",
//                                   log.action === "CREATE" &&
//                                     "bg-emerald-500/20 text-emerald-400",
//                                   log.action === "UPDATE" &&
//                                     !log.details
//                                       ?.toLowerCase()
//                                       .includes("archived") &&
//                                     "bg-blue-500/20 text-blue-400",
//                                   log.action === "UPDATE" &&
//                                     log.details
//                                       ?.toLowerCase()
//                                       .includes("archived") &&
//                                     "bg-amber-500/20 text-amber-400",
//                                   log.action === "DELETE" &&
//                                     "bg-red-500/20 text-red-400",
//                                   log.action === "LOGIN" &&
//                                     "bg-brand-teal/20 text-brand-teal",
//                                   log.action === "LOGIN_FAILED" &&
//                                     "bg-red-500/20 text-red-400",
//                                   log.action === "SAVE" &&
//                                     "bg-purple-500/20 text-purple-400",
//                                   log.action === "REQUEST" &&
//                                     "bg-amber-500/20 text-amber-400",
//                                   log.action === "RESOLVE" &&
//                                     "bg-emerald-500/20 text-emerald-400",
//                                   log.action === "SHARE" &&
//                                     "bg-sky-500/20 text-sky-400",
//                                 )}
//                               >
//                                 {log.action === "UPDATE" &&
//                                 log.details?.toLowerCase().includes("archived")
//                                   ? "ARCHIVE"
//                                   : log.action === "LOGIN_FAILED"
//                                     ? "FAILED LOGIN"
//                                     : log.action}
//                               </span>
//                               <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 text-white/40">
//                                 {log.entity_type.replace("_", " ")}
//                               </span>
//                             </div>
//                             <div className="flex items-center gap-1 text-[10px] opacity-30 shrink-0">
//                               <Clock className="w-3 h-3" />
//                               {/* {new Date(log.created_at + 'Z').toLocaleString()} */}
//                               {new Date(log.created_at).toLocaleString()}
//                             </div>
//                           </div>
//                           <p className="text-sm font-medium mt-1 truncate">
//                             {getLogEntityDisplayName(log, equipment)}
//                           </p>
//                           <div className="flex items-center gap-3 mt-1 flex-wrap">
//                             <span className="text-[10px] opacity-40">
//                               by {log.user_name}
//                             </span>
//                             {log.details && (
//                               <span className="text-[10px] opacity-30 truncate">
//                                 {log.details}
//                               </span>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               </div>
//             );
//           })()}

//         {activeTab === "resets" && (
//           <div className="space-y-4">
//             <div className="flex items-center justify-between gap-4">
//               <h3 className="text-lg font-bold">Password Reset Requests</h3>
//               <button
//                 onClick={fetchResetRequests}
//                 className="inline-flex items-center gap-2 rounded-full border border-theme-border bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest transition hover:bg-white/10"
//                 disabled={isFetchingResetRequests}
//               >
//                 {isFetchingResetRequests ? "Refreshing..." : "Refresh"}
//               </button>
//             </div>
//             {resetRequests.length === 0 ? (
//               <div className="py-20 text-center border border-dashed border-theme-border rounded-2xl">
//                 <p className="text-sm opacity-40 italic">
//                   No pending password reset requests.
//                 </p>
//               </div>
//             ) : (
//               resetRequests.map((req) => (
//                 <div
//                   key={req.id}
//                   className="p-6 bg-theme-card border border-theme-border rounded-2xl space-y-4"
//                 >
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="font-bold text-sm">{req.user_name}</p>
//                       <p className="text-xs opacity-40">{req.email}</p>
//                       <p className="text-[10px] opacity-30 mt-1">
//                         Requested: {new Date(req.created_at).toLocaleString()}
//                       </p>
//                     </div>
//                     <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-amber-500/20 text-amber-400 rounded">
//                       Pending
//                     </span>
//                   </div>
//                   <div className="flex gap-3">
//                     <input
//                       type="text"
//                       placeholder="Set temporary password (min 8 chars)"
//                       value={tempPasswords[req.id] || ""}
//                       onChange={(e) =>
//                         setTempPasswords({
//                           ...tempPasswords,
//                           [req.id]: e.target.value,
//                         })
//                       }
//                       className="flex-1 bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
//                     />
//                     <button
//                       onClick={() => handleResolveReset(req.id)}
//                       className="px-4 py-2 bg-brand-teal text-white text-xs font-bold rounded-lg hover:bg-brand-teal/90 transition-all"
//                     >
//                       Set & Resolve
//                     </button>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }

// function NavButton({
//   active,
//   onClick,
//   icon,
//   label,
//   badge,
// }: {
//   active: boolean;
//   onClick: () => void;
//   icon: React.ReactNode;
//   label: string;
//   badge?: number;
// }) {
//   return (
//     <button
//       onClick={onClick}
//       className={clsx(
//         "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm group",
//         active
//           ? "bg-brand-teal text-white shadow-lg shadow-brand-teal/10"
//           : "opacity-60 hover:opacity-100 hover:bg-white/5",
//       )}
//     >
//       <div
//         className={clsx(
//           active ? "text-white" : "opacity-40 group-hover:opacity-100",
//         )}
//       >
//         {icon}
//       </div>
//       {label}

//       {badge !== undefined && (
//         <span
//           className={clsx(
//             "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
//             active
//               ? "bg-white/20 text-white"
//               : "bg-amber-500/20 text-amber-400",
//           )}
//         >
//           {badge}
//         </span>
//       )}
//     </button>
//   );
// }

// function OverviewTab({
//   tenant,
//   equipmentStats,
//   activeProjectCount,
//   projectStats,
//   recentLogs,
//   equipment,
//   getEquipmentNameById,
// }: {
//   tenant: Tenant;
//   equipmentStats: { total: number; active: number; inactive: number };
//   activeProjectCount: number;
//   projectStats: any[];
//   recentLogs: any[];
//   equipment: EquipmentDef[];
//   getEquipmentNameById: (id: string) => string;
// }) {
//   return (
//     <div className="space-y-8">
//       {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"> */}
//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
//         <StatCard
//           label="Active Projects"
//           value={activeProjectCount.toString()}
//           trend="last 5 days"
//           icon={<LayoutDashboard className="w-5 h-5" />}
//         />
//         <StatCard
//           label="Total Equipment"
//           value={equipmentStats.total.toString()}
//           trend={`${equipmentStats.active} active`}
//           icon={<Package className="w-5 h-5" />}
//         />
//         {/* <StatCard
//           label="Sales Activity"
//           value="89%"
//           trend="+2%"
//           icon={<TrendingUp className="w-5 h-5" />}
//         /> */}
//       </div>

//       <div className="p-6 bg-theme-card border border-theme-border rounded-2xl">
//         <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">
//           Recent Activity
//         </h3>
//         <div className="space-y-4">
//           {recentLogs.length === 0 ? (
//             <div className="py-20 text-center border border-dashed border-theme-border rounded-2xl">
//               <p className="text-sm opacity-40 italic">
//                 No recent activity yet.
//               </p>
//             </div>
//           ) : (
//             recentLogs.map((log) => {
//               const isArchive =
//                 log.action === "UPDATE" &&
//                 log.details?.toLowerCase().includes("archived");
//               const iconBg = clsx(
//                 "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
//                 log.action === "CREATE" && "bg-emerald-500/20 text-emerald-400",
//                 log.action === "UPDATE" &&
//                   !isArchive &&
//                   "bg-blue-500/20 text-blue-400",
//                 isArchive && "bg-amber-500/20 text-amber-400",
//                 log.action === "DELETE" && "bg-red-500/20 text-red-400",
//                 log.action === "LOGIN" && "bg-brand-teal/20 text-brand-teal",
//                 log.action === "LOGIN_FAILED" && "bg-red-500/20 text-red-400",
//                 log.action === "SAVE" && "bg-purple-500/20 text-purple-400",
//                 log.action === "REQUEST" && "bg-amber-500/20 text-amber-400",
//                 log.action === "RESOLVE" &&
//                   "bg-emerald-500/20 text-emerald-400",
//                 log.action === "SHARE" && "bg-sky-500/20 text-sky-400",
//               );
//               return (
//                 <div
//                   key={log.id}
//                   className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-theme-border"
//                 >
//                   <div className="flex items-center gap-4">
//                     <div className={iconBg}>
//                       {log.action === "CREATE" && <Plus className="w-5 h-5" />}
//                       {log.action === "UPDATE" && !isArchive && (
//                         <Pencil className="w-5 h-5" />
//                       )}
//                       {isArchive && <Archive className="w-5 h-5" />}
//                       {log.action === "DELETE" && (
//                         <Trash2 className="w-5 h-5" />
//                       )}
//                       {log.action === "LOGIN" && (
//                         <UserIcon className="w-5 h-5" />
//                       )}
//                       {log.action === "LOGIN_FAILED" && (
//                         <ShieldAlert className="w-5 h-5" />
//                       )}
//                       {log.action === "SAVE" && (
//                         <ShieldCheck className="w-5 h-5" />
//                       )}
//                       {log.action === "REQUEST" && (
//                         <KeyRound className="w-5 h-5" />
//                       )}
//                       {log.action === "RESOLVE" && (
//                         <ShieldCheck className="w-5 h-5" />
//                       )}
//                       {log.action === "SHARE" && <Share2 className="w-5 h-5" />}
//                     </div>
//                     <div>
//                       <p className="text-sm font-medium">
//                         {getLogEntityDisplayName(log, equipment)}
//                       </p>
//                       <p className="text-[10px] opacity-40 uppercase tracking-widest">
//                         {isArchive
//                           ? "ARCHIVE"
//                           : log.action === "LOGIN_FAILED"
//                             ? "FAILED LOGIN"
//                             : log.entity_type
//                               ? log.entity_type.replace("_", " ")
//                               : log.action}
//                         {log.user_name ? ` · by ${log.user_name}` : ""}
//                       </p>
//                     </div>
//                   </div>
//                   <ChevronRight className="w-4 h-4 opacity-20" />
//                 </div>
//               );
//             })
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // Custom-styled searchable combobox for the equipment category field.
// // Native <select>/<datalist> can't be themed for dark mode, which is why
// // the browser-native version looked washed out. This renders our own
// // dropdown so every option is legible and hover state is obvious, while
// // still letting the user type a brand new category.
// function CategoryCombobox({
//   value,
//   onChange,
//   options,
// }: {
//   value: string;
//   onChange: (value: string) => void;
//   options: string[];
// }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const containerRef = React.useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (
//         containerRef.current &&
//         !containerRef.current.contains(e.target as Node)
//       ) {
//         setIsOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const trimmedValue = value.trim();
//   const exactMatch = options.some(
//     (opt) => opt.toLowerCase() === trimmedValue.toLowerCase(),
//   );
//   // Show the full list when the field is empty or already holds a complete,
//   // existing category (so the user can browse alternatives). Only filter
//   // down while they're actively typing something that isn't a match yet.
//   const showAllOptions = trimmedValue === "" || exactMatch;
//   const visibleOptions = showAllOptions
//     ? options
//     : options.filter((opt) =>
//         opt.toLowerCase().includes(trimmedValue.toLowerCase()),
//       );

//   return (
//     <div className="relative" ref={containerRef}>
//       <div className="relative">
//         <input
//           required
//           type="text"
//           autoComplete="off"
//           value={value}
//           onChange={(e) => {
//             onChange(e.target.value);
//             setIsOpen(true);
//           }}
//           onFocus={() => setIsOpen(true)}
//           placeholder="Select existing or type a new category"
//           className="w-full bg-white/5 border border-theme-border rounded-lg pl-4 pr-9 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
//         />
//         <button
//           type="button"
//           tabIndex={-1}
//           onClick={() => setIsOpen((o) => !o)}
//           className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-40 hover:opacity-100 transition-opacity"
//         >
//           <ChevronDown
//             className={clsx(
//               "w-4 h-4 transition-transform",
//               isOpen && "rotate-180",
//             )}
//           />
//         </button>
//       </div>

//       {isOpen && (visibleOptions.length > 0 || trimmedValue !== "") && (
//         <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-theme-bg border border-theme-border rounded-lg shadow-2xl py-1">
//           {visibleOptions.map((option) => (
//             <button
//               key={option}
//               type="button"
//               onMouseDown={(e) => e.preventDefault()}
//               onClick={() => {
//                 onChange(option);
//                 setIsOpen(false);
//               }}
//               className={clsx(
//                 "w-full text-left px-4 py-2 text-sm transition-colors hover:bg-brand-teal/20 hover:text-brand-teal",
//                 option.toLowerCase() === trimmedValue.toLowerCase()
//                   ? "bg-brand-teal/10 text-brand-teal"
//                   : "text-theme-text",
//               )}
//             >
//               {option}
//             </button>
//           ))}
//           {!exactMatch && trimmedValue !== "" && (
//             <button
//               type="button"
//               onMouseDown={(e) => e.preventDefault()}
//               onClick={() => {
//                 onChange(trimmedValue);
//                 setIsOpen(false);
//               }}
//               className={clsx(
//                 "w-full text-left px-4 py-2 text-sm font-medium text-brand-teal hover:bg-brand-teal/20 transition-colors",
//                 visibleOptions.length > 0 && "border-t border-theme-border",
//               )}
//             >
//               + Create new category "{trimmedValue}"
//             </button>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// function EquipmentTab({
//   equipment,
//   searchQuery,
//   setSearchQuery,
//   isAdding,
//   setIsAdding,
//   editingItem,
//   setEditingItem,
//   newEquipment,
//   setNewEquipment,
//   onAdd,
//   onUpdate,
//   onDelete,
//   onToggleActive,
//   disabledDefaults,
//   onToggleDefault,
// }: {
//   equipment: EquipmentDef[];
//   searchQuery: string;
//   setSearchQuery: (q: string) => void;
//   isAdding: boolean;
//   setIsAdding: (b: boolean) => void;
//   editingItem: EquipmentDef | null;
//   setEditingItem: (i: EquipmentDef | null) => void;
//   newEquipment: Partial<EquipmentDef>;
//   setNewEquipment: (e: Partial<EquipmentDef>) => void;
//   onAdd: (e: React.FormEvent) => void;
//   onUpdate: (e: React.FormEvent) => void;
//   onDelete: (id: string) => void;
//   onToggleActive: (id: string, currentlyActive: boolean) => void;
//   disabledDefaults: Set<string>;
//   onToggleDefault: (id: string) => void;
// }) {
//   const filteredEquipment = equipment.filter(
//     (item) =>
//       item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       item.category.toLowerCase().includes(searchQuery.toLowerCase()),
//   );

//   // Categories offered in the add/edit combobox are derived from existing
//   // equipment (default + tenant custom) rather than hardcoded, so a
//   // category introduced anywhere shows up here automatically. Typing a
//   // value not in this list simply creates a new category.
//   const existingCategoryOptions = React.useMemo(() => {
//     const seen = new Map<string, string>(); // lowercase key -> display label
//     for (const item of [...DEFAULT_LIBRARY, ...equipment]) {
//       const trimmed = item.category?.trim();
//       if (!trimmed) continue;
//       const key = trimmed.toLowerCase();
//       if (!seen.has(key)) {
//         const label = trimmed
//           .split(/[\s_-]+/)
//           .filter(Boolean)
//           .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
//           .join(" ");
//         seen.set(key, label);
//       }
//     }
//     return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
//   }, [equipment]);

//   return (
//     <div className="space-y-6">
//       {/* Search Bar */}
//       <div className="relative">
//         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
//         <input
//           type="text"
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//           placeholder="Search equipments by name or category..."
//           className="w-full bg-white/5 border border-theme-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
//         />
//       </div>
//       {/* Add/Edit Form Overlay */}
//       {(isAdding || editingItem) && (
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
//         >
//           <motion.div
//             initial={{ scale: 0.9, opacity: 0 }}
//             animate={{ scale: 1, opacity: 1 }}
//             className="bg-theme-bg border border-theme-border rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
//           >
//             <div className="p-6 border-b border-theme-border flex justify-between items-center">
//               <h3 className="text-lg font-bold">
//                 {isAdding ? "Add New Equipment" : `Edit ${editingItem?.name}`}
//               </h3>
//               <button
//                 onClick={() => {
//                   setIsAdding(false);
//                   setEditingItem(null);
//                   setNewEquipment({
//                     name: "",
//                     category: "slides",
//                     width: 5,
//                     depth: 5,
//                     height: 5,
//                     color: "#14b8a6",
//                     imageUrl: "",
//                   });
//                 }}
//                 className="p-2 hover:bg-white/5 rounded-lg transition-colors"
//               >
//                 <X className="w-5 h-5 opacity-40" />
//               </button>
//             </div>

//             {/* <form onSubmit={isAdding ? onAdd : onUpdate} className="p-6 space-y-6"> */}
//             {/* Make form scrollable */}
//             <form
//               onSubmit={isAdding ? onAdd : onUpdate}
//               className="p-4 lg:p-6 space-y-4 lg:space-y-6 overflow-y-auto flex-1"
//             >
//               {/* <div className="grid grid-cols-2 gap-6"> */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
//                 {/* Image upload — square aspect ratio */}
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
//                     Equipment Image
//                   </label>
//                   <div className="relative">
//                     <div
//                       className="aspect-square w-full bg-white/5 border-2 border-dashed border-theme-border rounded-xl overflow-hidden flex items-center justify-center cursor-pointer hover:border-brand-teal/50 transition-colors group"
//                       onClick={() =>
//                         document
//                           .getElementById("equipment-image-upload")
//                           ?.click()
//                       }
//                     >
//                       {(
//                         isAdding ? newEquipment.imageUrl : editingItem?.imageUrl
//                       ) ? (
//                         <img
//                           //src={isAdding ? newEquipment.imageUrl ?? '' : editingItem?.imageUrl ?? ''}
//                           src={
//                             isAdding
//                               ? newEquipment.imageUrl
//                               : (editingItem?.imageUrl ?? "")
//                           }
//                           alt="Equipment"
//                           className="w-full h-full object-cover"
//                         />
//                       ) : (
//                         <div className="flex flex-col items-center gap-2 opacity-30 group-hover:opacity-60 transition-opacity">
//                           <Upload className="w-8 h-8" />
//                           <span className="text-[10px] uppercase tracking-widest">
//                             Upload Image
//                           </span>
//                           <p className="text-[10px] opacity-30 text-center mt-1">
//                             Max 1MB · Auto-compressed · Square crop
//                           </p>
//                         </div>
//                       )}
//                     </div>
//                     <input
//                       id="equipment-image-upload"
//                       type="file"
//                       accept="image/*"
//                       className="hidden"
//                       onChange={async (e) => {
//                         const file = e.target.files?.[0];
//                         if (!file) return;

//                         const MAX_SIZE = 1 * 1024 * 1024; // 1MB

//                         const compressImage = (
//                           file: File,
//                           quality: number,
//                         ): Promise<string> => {
//                           return new Promise((resolve) => {
//                             const reader = new FileReader();
//                             reader.onload = (re) => {
//                               const img = new Image();
//                               img.onload = () => {
//                                 const canvas = document.createElement("canvas");

//                                 // Maintain square aspect ratio — use the smaller dimension
//                                 const size = Math.min(img.width, img.height);
//                                 canvas.width = size;
//                                 canvas.height = size;

//                                 const ctx = canvas.getContext("2d")!;
//                                 // Center crop to square
//                                 const offsetX = (img.width - size) / 2;
//                                 const offsetY = (img.height - size) / 2;
//                                 ctx.drawImage(
//                                   img,
//                                   offsetX,
//                                   offsetY,
//                                   size,
//                                   size,
//                                   0,
//                                   0,
//                                   size,
//                                   size,
//                                 );

//                                 resolve(
//                                   canvas.toDataURL("image/jpeg", quality),
//                                 );
//                               };
//                               img.src = re.target?.result as string;
//                             };
//                             reader.readAsDataURL(file);
//                           });
//                         };

//                         // Check original size
//                         if (file.size > MAX_SIZE) {
//                           // Auto compress to fit under 1MB
//                           const compressed = await compressImage(file, 0.7);

//                           // Check if compression was enough
//                           const compressedSize = Math.round(
//                             (compressed.length * 3) / 4,
//                           ); // base64 to bytes

//                           if (compressedSize > MAX_SIZE) {
//                             // Try harder compression
//                             const moreCompressed = await compressImage(
//                               file,
//                               0.4,
//                             );
//                             const moreCompressedSize = Math.round(
//                               (moreCompressed.length * 3) / 4,
//                             );

//                             if (moreCompressedSize > MAX_SIZE) {
//                               alert(
//                                 "Image is too large to compress under 1MB. Please use a smaller image.",
//                               );
//                               e.target.value = ""; // reset input
//                               return;
//                             }

//                             alert(
//                               "Image was automatically compressed to fit under 1MB.",
//                             );
//                             if (isAdding) {
//                               setNewEquipment({
//                                 ...newEquipment,
//                                 imageUrl: moreCompressed,
//                               });
//                             } else {
//                               setEditingItem({
//                                 ...editingItem!,
//                                 imageUrl: moreCompressed,
//                               });
//                             }
//                             return;
//                           }

//                           alert(
//                             "Image was automatically compressed to fit under 1MB.",
//                           );
//                           if (isAdding) {
//                             setNewEquipment({
//                               ...newEquipment,
//                               imageUrl: compressed,
//                             });
//                           } else {
//                             setEditingItem({
//                               ...editingItem!,
//                               imageUrl: compressed,
//                             });
//                           }
//                           return;
//                         }

//                         // Image is within 1MB — still crop to square for consistency
//                         const base64 = await compressImage(file, 0.9);
//                         if (isAdding) {
//                           setNewEquipment({
//                             ...newEquipment,
//                             imageUrl: base64,
//                           });
//                         } else {
//                           setEditingItem({ ...editingItem!, imageUrl: base64 });
//                         }
//                       }}
//                     />
//                     {(isAdding
//                       ? newEquipment.imageUrl
//                       : editingItem?.imageUrl) && (
//                       <button
//                         type="button"
//                         onClick={() =>
//                           isAdding
//                             ? setNewEquipment({ ...newEquipment, imageUrl: "" })
//                             : setEditingItem({ ...editingItem!, imageUrl: "" })
//                         }
//                         className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
//                       >
//                         <X className="w-3 h-3" />
//                       </button>
//                     )}
//                   </div>
//                 </div>

//                 {/* Name + Category stacked */}
//                 <div className="md:col-span-2 space-y-4">
//                   <div className="space-y-2">
//                     <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
//                       Equipment Name
//                     </label>
//                     <input
//                       required
//                       type="text"
//                       value={isAdding ? newEquipment.name : editingItem?.name}
//                       onChange={(e) =>
//                         isAdding
//                           ? setNewEquipment({
//                               ...newEquipment,
//                               name: e.target.value,
//                             })
//                           : setEditingItem({
//                               ...editingItem!,
//                               name: e.target.value,
//                             })
//                       }
//                       className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
//                       placeholder="e.g. Spiral Slide"
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
//                       Category
//                     </label>
//                     <CategoryCombobox
//                       value={
//                         (isAdding
//                           ? newEquipment.category
//                           : editingItem?.category) || ""
//                       }
//                       onChange={(val) =>
//                         isAdding
//                           ? setNewEquipment({
//                               ...newEquipment,
//                               category: val,
//                             })
//                           : setEditingItem({
//                               ...editingItem!,
//                               category: val,
//                             })
//                       }
//                       options={existingCategoryOptions}
//                     />
//                     <p className="text-[9px] opacity-30">
//                       Click the field to browse existing categories, or type a
//                       new one — it appears automatically in the Equipment
//                       Library.
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* Row 2 — Dimensions */}
//               <div className="grid grid-cols-3 gap-4">
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
//                     Width (m)
//                   </label>
//                   <input
//                     required
//                     type="number"
//                     step="0.1"
//                     value={isAdding ? newEquipment.width : editingItem?.width}
//                     onChange={(e) =>
//                       isAdding
//                         ? setNewEquipment({
//                             ...newEquipment,
//                             width: parseFloat(e.target.value),
//                           })
//                         : setEditingItem({
//                             ...editingItem!,
//                             width: parseFloat(e.target.value),
//                           })
//                     }
//                     className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
//                     Depth (m)
//                   </label>
//                   <input
//                     required
//                     type="number"
//                     step="0.1"
//                     value={isAdding ? newEquipment.depth : editingItem?.depth}
//                     onChange={(e) =>
//                       isAdding
//                         ? setNewEquipment({
//                             ...newEquipment,
//                             depth: parseFloat(e.target.value),
//                           })
//                         : setEditingItem({
//                             ...editingItem!,
//                             depth: parseFloat(e.target.value),
//                           })
//                     }
//                     className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
//                     Height (m)
//                   </label>
//                   <input
//                     required
//                     type="number"
//                     step="0.1"
//                     value={isAdding ? newEquipment.height : editingItem?.height}
//                     onChange={(e) =>
//                       isAdding
//                         ? setNewEquipment({
//                             ...newEquipment,
//                             height: parseFloat(e.target.value),
//                           })
//                         : setEditingItem({
//                             ...editingItem!,
//                             height: parseFloat(e.target.value),
//                           })
//                     }
//                     className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
//                   />
//                 </div>
//               </div>

//               {/* Row 3 — Color + Model URL */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
//                     Color (Hex)
//                   </label>
//                   <div className="flex gap-2">
//                     <input
//                       type="color"
//                       value={isAdding ? newEquipment.color : editingItem?.color}
//                       onChange={(e) =>
//                         isAdding
//                           ? setNewEquipment({
//                               ...newEquipment,
//                               color: e.target.value,
//                             })
//                           : setEditingItem({
//                               ...editingItem!,
//                               color: e.target.value,
//                             })
//                       }
//                       className="w-10 h-10 bg-transparent border-none cursor-pointer shrink-0"
//                     />
//                     <input
//                       type="text"
//                       value={isAdding ? newEquipment.color : editingItem?.color}
//                       onChange={(e) =>
//                         isAdding
//                           ? setNewEquipment({
//                               ...newEquipment,
//                               color: e.target.value,
//                             })
//                           : setEditingItem({
//                               ...editingItem!,
//                               color: e.target.value,
//                             })
//                       }
//                       className="flex-1 bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
//                     3D Model (.glb)
//                   </label>

//                   {/* Show current file status */}
//                   {(
//                     isAdding ? newEquipment.modelUrl : editingItem?.modelUrl
//                   ) ? (
//                     <div className="flex items-center justify-between bg-white/5 border border-theme-border rounded-lg px-4 py-2">
//                       <div className="flex items-center gap-2 min-w-0">
//                         <Box className="w-4 h-4 text-brand-teal shrink-0" />
//                         <span className="text-xs text-brand-teal truncate">
//                           GLB model loaded
//                         </span>
//                       </div>
//                       <button
//                         type="button"
//                         onClick={() =>
//                           isAdding
//                             ? setNewEquipment({ ...newEquipment, modelUrl: "" })
//                             : setEditingItem({ ...editingItem!, modelUrl: "" })
//                         }
//                         className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors shrink-0"
//                       >
//                         <X className="w-3 h-3" />
//                       </button>
//                     </div>
//                   ) : (
//                     <div
//                       className="flex items-center justify-center gap-2 w-full border border-dashed border-theme-border rounded-lg px-4 py-3 cursor-pointer hover:border-brand-teal/50 transition-colors"
//                       onClick={() =>
//                         document.getElementById("glb-upload")?.click()
//                       }
//                     >
//                       <Upload className="w-4 h-4 opacity-30" />
//                       <span className="text-xs opacity-40">
//                         Upload .glb file
//                       </span>
//                     </div>
//                   )}

//                   <input
//                     id="glb-upload"
//                     type="file"
//                     accept=".glb"
//                     className="hidden"
//                     onChange={async (e) => {
//                       const file = e.target.files?.[0];
//                       if (!file) return;

//                       const MAX_GLB_SIZE = 25 * 1024 * 1024; // 25MB
//                       if (file.size > MAX_GLB_SIZE) {
//                         alert("GLB file must be under 25MB.");
//                         e.target.value = "";
//                         return;
//                       }

//                       const formData = new FormData();
//                       formData.append("file", file);

//                       const token =
//                         localStorage.getItem("auth_token") ||
//                         sessionStorage.getItem("auth_token");

//                       // Show uploading state
//                       if (isAdding) {
//                         setNewEquipment({
//                           ...newEquipment,
//                           modelUrl: "uploading...",
//                         });
//                       } else {
//                         setEditingItem({
//                           ...editingItem!,
//                           modelUrl: "uploading...",
//                         });
//                       }
//                       const res = await fetch(
//                         `${import.meta.env.VITE_API_URL}/api/upload/model`,
//                         {
//                           method: "POST",
//                           headers: { Authorization: `Bearer ${token}` },
//                           body: formData,
//                         },
//                       );

//                       if (res.ok) {
//                         const { url } = await res.json();
//                         if (isAdding) {
//                           setNewEquipment({ ...newEquipment, modelUrl: url });
//                         } else {
//                           setEditingItem({ ...editingItem!, modelUrl: url });
//                         }
//                       } else {
//                         alert("Failed to upload GLB file.");
//                         if (isAdding) {
//                           setNewEquipment({ ...newEquipment, modelUrl: "" });
//                         } else {
//                           setEditingItem({ ...editingItem!, modelUrl: "" });
//                         }
//                       }
//                     }}
//                   />
//                   <p className="text-[10px] opacity-30">
//                     Max 25MB · Used for 3D rendering
//                   </p>
//                 </div>
//               </div>

//               {/* Row 5 — Action buttons */}
//               <div className="flex justify-end gap-3 pt-4 border-t border-theme-border">
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setIsAdding(false);
//                     setEditingItem(null);
//                     setNewEquipment({
//                       name: "",
//                       category: "slides",
//                       width: 5,
//                       depth: 5,
//                       height: 5,
//                       color: "#14b8a6",
//                       animationsEnabled: false,
//                       imageUrl: "",
//                     });
//                   }}
//                   className="px-6 py-2 text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-6 py-2 bg-brand-teal text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-brand-teal/90 transition-all shadow-lg shadow-brand-teal/20"
//                 >
//                   {isAdding ? "Add Equipment" : "Save Changes"}
//                 </button>
//               </div>
//             </form>
//           </motion.div>
//         </motion.div>
//       )}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
//         {filteredEquipment.map((item) => (
//           <div
//             key={item.id}
//             className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden group hover:border-brand-teal/50 transition-all relative"
//           >
//             {/* Status Badge */}
//             <div
//               className={clsx(
//                 "absolute top-3 left-3 z-10 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
//                 item.isActive !== false
//                   ? "bg-emerald-500/20 text-emerald-400"
//                   : "bg-red-500/20 text-red-400",
//               )}
//             >
//               {item.isActive !== false ? "Active" : "Inactive"}
//             </div>

//             {/* Image */}
//             <div
//               className={clsx(
//                 "aspect-square bg-black/40 flex items-center justify-center relative overflow-hidden",
//                 item.isActive === false && "opacity-40",
//               )}
//             >
//               <img
//                 src={getEquipmentThumbnail(item)}
//                 alt={item.name}
//                 className="w-full h-full object-cover"
//               />

//               {/* Category */}
//               <div className="absolute top-3 right-3 px-2 py-1 bg-brand-teal/20 text-brand-teal text-[8px] font-bold uppercase rounded">
//                 {item.category}
//               </div>

//               {/* Actions Overlay */}
//               <div className="absolute inset-0 bg-theme-bg/80 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
//                 {/* Edit */}
//                 <button
//                   onClick={() => setEditingItem(item)}
//                   className="p-3 bg-white/10 hover:bg-brand-teal hover:text-white rounded-xl transition-all"
//                   title="Edit"
//                 >
//                   <Pencil className="w-4 h-4" />
//                 </button>

//                 {/* Toggle Active */}
//                 <button
//                   onClick={() =>
//                     onToggleActive(item.id, item.isActive !== false)
//                   }
//                   className="p-3 bg-white/10 hover:bg-red-500 hover:text-white rounded-xl transition-all"
//                   title={item.isActive !== false ? "Deactivate" : "Activate"}
//                 >
//                   {item.isActive !== false ? (
//                     <EyeOff className="w-4 h-4" />
//                   ) : (
//                     <Eye className="w-4 h-4" />
//                   )}
//                 </button>

//                 {/* Delete */}
//                 <button
//                   onClick={() => onDelete(item.id)}
//                   className="p-3 bg-white/10 hover:bg-red-500 hover:text-white rounded-xl transition-all"
//                   title="Delete"
//                 >
//                   <Trash2 className="w-4 h-4" />
//                 </button>
//               </div>
//             </div>

//             {/* Info */}
//             <div className="p-4">
//               <h4 className="text-sm font-bold truncate">{item.name}</h4>
//               <p className="text-[10px] opacity-40 font-mono mt-1">
//                 {item.width}x{item.depth}x{item.height}m
//               </p>
//             </div>
//           </div>
//         ))}

//         {/* Empty State */}
//         {filteredEquipment.length === 0 && (
//           <div className="col-span-4 py-20 text-center">
//             <Box className="w-12 h-12 opacity-10 mx-auto mb-4" />
//             <p className="text-sm opacity-40 italic">
//               No equipment found matching your search.
//             </p>
//           </div>
//         )}
//       </div>

//       {/* ── Default Equipment Section ────────────────────────────────────── */}
//       <div className="space-y-3 pt-2">
//         <div className="flex items-center justify-between">
//           <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold">
//             DEFAULT EQUIPMENT (
//             {DEFAULT_LIBRARY.filter((d) => !disabledDefaults.has(d.id)).length}{" "}
//             ACTIVE)
//           </label>
//         </div>
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
//           {DEFAULT_LIBRARY.filter(
//             (item) =>
//               item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//               item.category.toLowerCase().includes(searchQuery.toLowerCase()),
//           ).map((item) => {
//             const isDisabled = disabledDefaults.has(item.id);
//             return (
//               <div
//                 key={item.id}
//                 className={clsx(
//                   "flex items-center justify-between p-3 bg-theme-card border rounded-xl transition-all",
//                   isDisabled
//                     ? "border-red-500/20 opacity-50"
//                     : "border-theme-border",
//                 )}
//               >
//                 <div className="flex items-center gap-3 min-w-0">
//                   <img
//                     src={getEquipmentThumbnail(item)}
//                     alt={item.name}
//                     className="w-8 h-8 rounded-lg object-cover shrink-0"
//                   />
//                   <div className="min-w-0">
//                     <p className="text-xs font-bold truncate">{item.name}</p>
//                     <p className="text-[9px] opacity-40 uppercase">
//                       {item.category}
//                     </p>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-3 ml-2">
//                   <button
//                     onClick={() => onToggleDefault(item.id)}
//                     aria-pressed={!isDisabled}
//                     aria-label={
//                       !isDisabled
//                         ? `Deactivate ${item.name}`
//                         : `Activate ${item.name}`
//                     }
//                     className={clsx(
//                       "w-10 h-5 rounded-full transition-colors relative shrink-0",
//                       !isDisabled ? "bg-emerald-500" : "bg-white/20",
//                     )}
//                   >
//                     <div
//                       className={clsx(
//                         "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
//                         !isDisabled ? "left-6" : "left-1",
//                       )}
//                     />
//                   </button>
//                   <span className="text-xs font-semibold select-none">
//                     {isDisabled ? "Activate" : "Deactivate"}
//                   </span>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Archive Modal ────────────────────────────────────────────────────────────
// interface ArchiveModalProps {
//   user: User;
//   allReps: User[];
//   onConfirm: (
//     assignments: Record<string, string>,
//     bulkTargetId?: string,
//   ) => void;
//   onCancel: () => void;
// }

// function ArchiveModal({
//   user,
//   allReps,
//   onConfirm,
//   onCancel,
// }: ArchiveModalProps) {
//   const [projects, setProjects] = React.useState<
//     { id: string; name: string }[]
//   >([]);
//   const [loading, setLoading] = React.useState(true);
//   const [bulkTargetId, setBulkTargetId] = React.useState("");
//   const [perProjectAssign, setPerProjectAssign] = React.useState<
//     Record<string, string>
//   >({});
//   const [mode, setMode] = React.useState<"bulk" | "individual">("bulk");

//   const otherActiveReps = allReps.filter(
//     (r) =>
//       r.id !== user.id && r.role === "sales_rep" && r.status !== "archived",
//   );

//   React.useEffect(() => {
//     authFetch(`/api/users/${user.id}/projects`)
//       .then((r) => r.json())
//       .then((data) => {
//         setProjects(data);
//         const init: Record<string, string> = {};
//         data.forEach((p: any) => (init[p.id] = ""));
//         setPerProjectAssign(init);
//       })
//       .finally(() => setLoading(false));
//   }, [user.id]);

//   const canConfirm =
//     projects.length === 0 ||
//     (mode === "bulk" && bulkTargetId !== "") ||
//     (mode === "individual" &&
//       Object.values(perProjectAssign).every((v) => v !== ""));

//   const handleConfirm = () => {
//     if (mode === "bulk") {
//       const assignments: Record<string, string> = {};
//       projects.forEach((p) => (assignments[p.id] = bulkTargetId));
//       onConfirm(assignments, bulkTargetId);
//     } else {
//       onConfirm(perProjectAssign);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
//       <div className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-lg shadow-2xl">
//         {/* Header */}
//         <div className="flex items-center justify-between p-6 border-b border-theme-border">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
//               <Archive className="w-5 h-5 text-amber-400" />
//             </div>
//             <div>
//               <h2 className="font-bold text-base">Archive Sales Rep</h2>
//               <p className="text-xs opacity-50">
//                 {user.name} · {user.email}
//               </p>
//             </div>
//           </div>
//           <button
//             onClick={onCancel}
//             className="p-2 hover:bg-white/5 rounded-lg"
//           >
//             <X className="w-4 h-4 opacity-50" />
//           </button>
//         </div>

//         <div className="p-6 space-y-5">
//           {loading ? (
//             <div className="py-8 text-center text-sm opacity-40">
//               Loading projects...
//             </div>
//           ) : projects.length === 0 ? (
//             <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
//               <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
//               <div>
//                 <p className="text-sm font-semibold text-emerald-400">
//                   No projects assigned
//                 </p>
//                 <p className="text-xs opacity-60 mt-0.5">
//                   This rep has no projects. You can archive them immediately.
//                 </p>
//               </div>
//             </div>
//           ) : (
//             <>
//               <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
//                 <FolderOpen className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
//                 <div>
//                   <p className="text-sm font-semibold text-amber-400">
//                     {projects.length} project{projects.length > 1 ? "s" : ""}{" "}
//                     must be reassigned
//                   </p>
//                   <p className="text-xs opacity-60 mt-0.5">
//                     Reassign all projects before archiving. Logs will be
//                     preserved.
//                   </p>
//                 </div>
//               </div>

//               {/* Mode toggle */}
//               <div className="flex rounded-xl border border-theme-border overflow-hidden text-xs font-bold uppercase tracking-widest">
//                 <button
//                   onClick={() => setMode("bulk")}
//                   className={clsx(
//                     "flex-1 py-2.5 transition-all",
//                     mode === "bulk"
//                       ? "bg-brand-teal text-white"
//                       : "opacity-40 hover:opacity-70",
//                   )}
//                 >
//                   Bulk — assign all to one rep
//                 </button>
//                 <button
//                   onClick={() => setMode("individual")}
//                   className={clsx(
//                     "flex-1 py-2.5 transition-all",
//                     mode === "individual"
//                       ? "bg-brand-teal text-white"
//                       : "opacity-40 hover:opacity-70",
//                   )}
//                 >
//                   Individual — assign each
//                 </button>
//               </div>

//               {mode === "bulk" ? (
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
//                     Reassign all {projects.length} projects to
//                   </label>
//                   <select
//                     value={bulkTargetId}
//                     onChange={(e) => setBulkTargetId(e.target.value)}
//                     className="w-full bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
//                   >
//                     <option value="">— Select a sales rep —</option>
//                     {otherActiveReps.map((r) => (
//                       <option key={r.id} value={r.id}>
//                         {r.name} ({r.email})
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               ) : (
//                 <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
//                   {projects.map((p) => (
//                     <div key={p.id} className="flex items-center gap-3">
//                       <div className="flex-1 min-w-0">
//                         <p className="text-xs font-semibold truncate">
//                           {p.name}
//                         </p>
//                       </div>
//                       <select
//                         value={perProjectAssign[p.id] || ""}
//                         onChange={(e) =>
//                           setPerProjectAssign((prev) => ({
//                             ...prev,
//                             [p.id]: e.target.value,
//                           }))
//                         }
//                         className="w-48 bg-white/5 border border-theme-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
//                       >
//                         <option value="">— Select rep —</option>
//                         {otherActiveReps.map((r) => (
//                           <option key={r.id} value={r.id}>
//                             {r.name}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </>
//           )}
//         </div>

//         {/* Footer */}
//         <div className="flex items-center justify-end gap-3 p-6 border-t border-theme-border">
//           <button
//             onClick={onCancel}
//             className="px-4 py-2.5 text-sm font-semibold opacity-50 hover:opacity-100 transition-opacity"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleConfirm}
//             disabled={!canConfirm}
//             className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-black font-bold text-sm rounded-xl transition-all flex items-center gap-2"
//           >
//             <Archive className="w-4 h-4" />
//             {projects.length > 0 ? "Reassign & Archive" : "Archive Rep"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// function UsersTab({
//   tenant,
//   isAdding,
//   setIsAdding,
//   salesRepCount,
//   setSalesRepCount,
// }: {
//   tenant: Tenant;
//   isAdding: boolean;
//   setIsAdding: (b: boolean) => void;
//   salesRepCount: number;
//   setSalesRepCount: (count: number) => void;
// }) {
//   const [users, setUsers] = React.useState<User[]>([]);
//   const [editingUser, setEditingUser] = React.useState<User | null>(null);
//   const [newUser, setNewUser] = React.useState({
//     name: "",
//     email: "",
//     phone: "",
//     password: "",
//     companyName: tenant.name,
//   });

//   React.useEffect(() => {
//     if (isAdding) {
//       setNewUser({
//         name: "",
//         email: "",
//         phone: "",
//         password: "",
//         companyName: tenant.name,
//       });
//     }
//   }, [isAdding, tenant.name]);

//   const [editFormData, setEditFormData] = React.useState({
//     name: "",
//     phone: "",
//     password: "",
//   });
//   const [archiveTarget, setArchiveTarget] = React.useState<User | null>(null);
//   const [showArchived, setShowArchived] = React.useState(false);

//   const fetchSalesRepCount = async () => {
//     const res = await authFetch(`/api/tenant/${tenant.id}/users`);
//     if (res.ok) {
//       const data = await res.json();
//       const count = data.filter(
//         (u: any) =>
//           u.role === "sales_rep" &&
//           u.status !== "archived" &&
//           u.is_active !== false,
//       ).length;
//       setSalesRepCount(count);
//     }
//   };

//   const fetchUsers = async () => {
//     const res = await authFetch(`/api/tenant/${tenant.id}/users`);
//     if (res.ok) {
//       const data = await res.json();
//       setUsers(data);
//       setSalesRepCount(
//         data.filter(
//           (u: any) =>
//             u.role === "sales_rep" &&
//             u.status !== "archived" &&
//             u.is_active !== false,
//         ).length,
//       );
//     }
//   };

//   React.useEffect(() => {
//     fetchUsers();
//   }, [tenant.id]);

//   const handleAddUser = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const userId = uuidv4();
//     const res = await authFetch(`/api/tenant/${tenant.id}/users`, {
//       method: "POST",
//       body: JSON.stringify({
//         id: userId,
//         email: newUser.email,
//         password: newUser.password,
//         role: "sales_rep",
//         name: newUser.name,
//         phone: newUser.phone,
//       }),
//     });
//     if (res.ok) {
//       setNewUser({
//         name: "",
//         email: "",
//         phone: "",
//         password: "",
//         companyName: tenant.name,
//       });
//       setIsAdding(false);
//       fetchUsers();
//     } else {
//       const data = await res.json().catch(() => ({}));
//       alert(data.error || "Failed to add user");
//     }
//   };

//   const handleEditUser = async () => {
//     if (!editingUser) return;
//     const res = await authFetch(`/api/users/${editingUser.id}`, {
//       method: "PUT",
//       body: JSON.stringify(editFormData),
//     });
//     if (res.ok) {
//       setEditingUser(null);
//       fetchUsers();
//     } else {
//       const data = await res.json().catch(() => ({}));
//       alert(data.error || "Failed to update user");
//     }
//   };

//   const handleToggleActive = async (u: User) => {
//     const currentlyActive = u.status !== "inactive" && u.is_active !== false;
//     const confirmMsg = currentlyActive
//       ? `Deactivate ${u.name}? They will not be able to log in.`
//       : `Activate ${u.name}? They will be able to log in again.`;
//     if (!confirm(confirmMsg)) return;

//     const originalCount = salesRepCount;
//     setUsers((prev) =>
//       prev.map((usr) =>
//         usr.id === u.id
//           ? {
//               ...usr,
//               is_active: !currentlyActive,
//               status: currentlyActive ? "inactive" : "active",
//             }
//           : usr,
//       ),
//     );
//     setSalesRepCount(salesRepCount + (currentlyActive ? -1 : 1));

//     const res = await authFetch(`/api/users/${u.id}/toggle-active`, {
//       method: "PATCH",
//     });
//     if (!res.ok) {
//       setUsers((prev) =>
//         prev.map((usr) =>
//           usr.id === u.id
//             ? {
//                 ...usr,
//                 is_active: currentlyActive,
//                 status: currentlyActive ? "active" : "inactive",
//               }
//             : usr,
//         ),
//       );
//       setSalesRepCount(originalCount);
//       alert("Failed to update status");
//     }
//   };

//   const handleArchive = async (assignments: Record<string, string>) => {
//     if (!archiveTarget) return;
//     try {
//       // Reassign each project
//       for (const [projectId, newUserId] of Object.entries(assignments)) {
//         if (newUserId) {
//           const r = await authFetch(`/api/projects/${projectId}/reassign`, {
//             method: "PATCH",
//             body: JSON.stringify({ newUserId }),
//           });
//           if (!r.ok) {
//             const d = await r.json().catch(() => ({}));
//             alert(
//               `Failed to reassign a project: ${d.error || "Unknown error"}`,
//             );
//             return;
//           }
//         }
//       }
//       // Archive the user
//       const res = await authFetch(`/api/users/${archiveTarget.id}/archive`, {
//         method: "PATCH",
//       });
//       if (res.ok) {
//         setArchiveTarget(null);
//         fetchUsers();
//       } else {
//         const d = await res.json().catch(() => ({}));
//         alert(d.error || "Failed to archive user");
//       }
//     } catch {
//       alert("An error occurred");
//     }
//   };

//   const startEditing = (user: User) => {
//     setEditingUser(user);
//     setEditFormData({ name: user.name, phone: user.phone || "", password: "" });
//   };

//   const activeReps = users.filter(
//     (u) => u.role === "sales_rep" && u.status !== "archived",
//   );
//   const archivedReps = users.filter(
//     (u) => u.role === "sales_rep" && u.status === "archived",
//   );
//   const admins = users.filter((u) => u.role !== "sales_rep");

//   return (
//     <div className="space-y-6">
//       {/* Archive Modal */}
//       {archiveTarget && (
//         <ArchiveModal
//           user={archiveTarget}
//           allReps={users}
//           onConfirm={handleArchive}
//           onCancel={() => setArchiveTarget(null)}
//         />
//       )}

//       {/* Edit Modal */}
//       {editingUser && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
//           <div className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-md shadow-2xl">
//             <div className="flex items-center justify-between p-6 border-b border-theme-border">
//               <h2 className="font-bold text-base">Edit Sales Rep</h2>
//               <button
//                 onClick={() => setEditingUser(null)}
//                 className="p-2 hover:bg-white/5 rounded-lg"
//               >
//                 <X className="w-4 h-4 opacity-50" />
//               </button>
//             </div>
//             <div className="p-6 space-y-4">
//               <div>
//                 <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
//                   Name
//                 </label>
//                 <input
//                   className="w-full mt-1 bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
//                   value={editFormData.name}
//                   onChange={(e) =>
//                     setEditFormData((p) => ({ ...p, name: e.target.value }))
//                   }
//                 />
//               </div>
//               <div>
//                 <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
//                   Phone
//                   <span className="text-brand-teal/60 normal-case tracking-normal">
//                     10 digits
//                   </span>
//                 </label>
//                 <input
//                   type="tel"
//                   inputMode="numeric"
//                   maxLength={10}
//                   pattern="\d{10}"
//                   placeholder="10-digit mobile number"
//                   className="w-full mt-1 bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
//                   value={editFormData.phone}
//                   onChange={(e) => {
//                     const val = e.target.value.replace(/\D/g, "").slice(0, 10);
//                     setEditFormData((p) => ({ ...p, phone: val }));
//                   }}
//                 />
//                 {editFormData.phone && editFormData.phone.length !== 10 && (
//                   <p className="text-[10px] text-red-400 mt-1 ml-1">
//                     Must be exactly 10 digits
//                   </p>
//                 )}
//               </div>
//               <div>
//                 <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
//                   New Password (optional)
//                 </label>
//                 <input
//                   type="password"
//                   className="w-full mt-1 bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
//                   placeholder="Leave blank to keep current"
//                   value={editFormData.password}
//                   onChange={(e) =>
//                     setEditFormData((p) => ({ ...p, password: e.target.value }))
//                   }
//                 />
//               </div>
//             </div>
//             <div className="flex justify-end gap-3 p-6 border-t border-theme-border">
//               <button
//                 onClick={() => setEditingUser(null)}
//                 className="px-4 py-2.5 text-sm font-semibold opacity-50 hover:opacity-100"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleEditUser}
//                 className="px-5 py-2.5 bg-brand-teal text-white font-bold text-sm rounded-xl hover:bg-brand-teal/90 transition-all"
//               >
//                 Save Changes
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Add New Rep Form */}
//       {isAdding && (
//         <div className="bg-theme-card border border-brand-teal/30 rounded-2xl p-6 space-y-4">
//           <h3 className="font-bold text-sm">Add New Sales Rep</h3>
//           <form
//             onSubmit={handleAddUser}
//             className="space-y-4"
//             autoComplete="off"
//           >
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               <div>
//                 <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
//                   Name
//                 </label>
//                 <input
//                   required
//                   className="w-full mt-1 bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
//                   value={newUser.name}
//                   onChange={(e) =>
//                     setNewUser((p) => ({ ...p, name: e.target.value }))
//                   }
//                 />
//               </div>
//               <div>
//                 <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
//                   Email
//                 </label>
//                 <input
//                   required
//                   type="email"
//                   name="new-user-email"
//                   autoComplete="off"
//                   className="w-full mt-1 bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
//                   value={newUser.email}
//                   onChange={(e) =>
//                     setNewUser((p) => ({ ...p, email: e.target.value }))
//                   }
//                 />
//               </div>
//               <div>
//                 <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
//                   Phone
//                   <span className="text-brand-teal/60 normal-case tracking-normal">
//                     10 digits
//                   </span>
//                 </label>
//                 <input
//                   type="tel"
//                   inputMode="numeric"
//                   maxLength={10}
//                   pattern="\d{10}"
//                   placeholder="10-digit mobile number"
//                   className="w-full mt-1 bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
//                   value={newUser.phone}
//                   onChange={(e) => {
//                     const val = e.target.value.replace(/\D/g, "").slice(0, 10);
//                     setNewUser((p) => ({ ...p, phone: val }));
//                   }}
//                 />
//                 {newUser.phone && newUser.phone.length !== 10 && (
//                   <p className="text-[10px] text-red-400 mt-1 ml-1">
//                     Must be exactly 10 digits
//                   </p>
//                 )}
//               </div>
//               <div>
//                 <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
//                   Password
//                 </label>
//                 <input
//                   required
//                   type="password"
//                   name="new-user-password"
//                   autoComplete="new-password"
//                   className="w-full mt-1 bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
//                   value={newUser.password}
//                   onChange={(e) =>
//                     setNewUser((p) => ({ ...p, password: e.target.value }))
//                   }
//                 />
//               </div>
//             </div>
//             <div className="flex justify-end gap-3">
//               <button
//                 type="button"
//                 onClick={() => setIsAdding(false)}
//                 className="px-4 py-2.5 text-sm font-semibold opacity-50 hover:opacity-100"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 className="px-5 py-2.5 bg-brand-teal text-white font-bold text-sm rounded-xl hover:bg-brand-teal/90 transition-all"
//               >
//                 Add Rep
//               </button>
//             </div>
//           </form>
//         </div>
//       )}

//       {/* Active Reps */}
//       <div className="space-y-3">
//         <h3 className="text-xs font-bold opacity-40 uppercase tracking-widest">
//           Sales Reps ({activeReps.length})
//         </h3>
//         <div className="grid grid-cols-1 gap-4">
//           {activeReps.map((u) => {
//             const isActive = u.status !== "inactive" && u.is_active !== false;
//             return (
//               <div
//                 key={u.id}
//                 className={clsx(
//                   "p-3 lg:p-4 bg-theme-card border rounded-xl flex items-center justify-between gap-2 group transition-all",
//                   isActive
//                     ? "border-theme-border"
//                     : "border-red-500/20 opacity-70",
//                 )}
//               >
//                 <div className="flex items-center gap-3 min-w-0 flex-1">
//                   <div
//                     className={clsx(
//                       "w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center font-bold shrink-0 text-white",
//                       isActive
//                         ? "bg-brand-teal/10 text-brand-teal"
//                         : "bg-red-500/10 text-red-400",
//                     )}
//                   >
//                     {u.name.charAt(0)}
//                   </div>
//                   <div className="min-w-0 flex-1">
//                     <div className="flex items-center gap-2 flex-wrap">
//                       <h4 className="font-bold text-sm truncate">{u.name}</h4>
//                       <span
//                         className={clsx(
//                           "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
//                           isActive
//                             ? "bg-emerald-500/15 text-emerald-400"
//                             : "bg-red-500/15 text-red-400",
//                         )}
//                       >
//                         {isActive ? "Active" : "Inactive"}
//                       </span>
//                     </div>
//                     <div className="flex items-center gap-1 lg:gap-3 mt-1 flex-wrap">
//                       <span className="text-[10px] opacity-40 truncate max-w-[120px] lg:max-w-none">
//                         {u.email}
//                       </span>
//                       <span className="text-[10px] opacity-40 hidden lg:inline">
//                         ·
//                       </span>
//                       <span className="text-[10px] opacity-40 hidden lg:inline">
//                         {u.phone || "No phone"}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
//                   <button
//                     onClick={() => handleToggleActive(u)}
//                     className={clsx(
//                       "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border",
//                       isActive
//                         ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
//                         : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20",
//                     )}
//                     title={isActive ? "Deactivate" : "Activate"}
//                   >
//                     {isActive ? (
//                       <EyeOff className="w-3.5 h-3.5" />
//                     ) : (
//                       <Eye className="w-3.5 h-3.5" />
//                     )}
//                     <span className="hidden sm:inline">
//                       {isActive ? "Deactivate" : "Activate"}
//                     </span>
//                   </button>
//                   <button
//                     onClick={() => setArchiveTarget(u)}
//                     className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all"
//                     title="Archive rep"
//                   >
//                     <Archive className="w-3.5 h-3.5" />
//                     <span className="hidden sm:inline">Archive</span>
//                   </button>
//                   <button
//                     onClick={() => startEditing(u)}
//                     className="p-2 hover:bg-brand-teal/10 text-brand-teal rounded-lg transition-colors"
//                     title="Edit"
//                   >
//                     <Pencil className="w-4 h-4" />
//                   </button>
//                 </div>
//               </div>
//             );
//           })}
//           {activeReps.length === 0 && (
//             <div className="py-16 text-center">
//               <Users className="w-10 h-10 opacity-10 mx-auto mb-3" />
//               <p className="text-sm opacity-40 italic">No active sales reps.</p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Archived Reps */}
//       {archivedReps.length > 0 && (
//         <div className="space-y-3">
//           <button
//             onClick={() => setShowArchived((v) => !v)}
//             className="flex items-center gap-2 text-xs font-bold opacity-40 uppercase tracking-widest hover:opacity-70 transition-opacity"
//           >
//             <ChevronDown
//               className={clsx(
//                 "w-4 h-4 transition-transform",
//                 showArchived && "rotate-180",
//               )}
//             />
//             Archived ({archivedReps.length})
//           </button>
//           {showArchived && (
//             <div className="grid grid-cols-1 gap-3">
//               {archivedReps.map((u) => (
//                 <div
//                   key={u.id}
//                   className="p-3 lg:p-4 bg-theme-card border border-dashed border-theme-border rounded-xl flex items-center gap-3 opacity-50"
//                 >
//                   <div className="w-8 h-8 bg-gray-500/10 rounded-full flex items-center justify-center text-gray-400 font-bold shrink-0">
//                     {u.name.charAt(0)}
//                   </div>
//                   <div className="min-w-0 flex-1">
//                     <div className="flex items-center gap-2">
//                       <h4 className="font-bold text-sm truncate">{u.name}</h4>
//                       <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-400">
//                         Archived
//                       </span>
//                     </div>
//                     <p className="text-[10px] opacity-40 truncate mt-0.5">
//                       {u.email}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// function StatCard({
//   label,
//   value,
//   trend,
//   icon,
// }: {
//   label: string;
//   value: string;
//   trend: string;
//   icon: React.ReactNode;
// }) {
//   return (
//     <div className="p-6 bg-theme-card border border-theme-border rounded-2xl space-y-4">
//       <div className="flex justify-between items-start">
//         <div className="p-2 bg-brand-teal/10 rounded-lg text-brand-teal">
//           {icon}
//         </div>
//         <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
//           {trend}
//         </span>
//       </div>
//       <div>
//         <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
//           {label}
//         </p>
//         <p className="text-3xl font-bold mt-1">{value}</p>
//       </div>
//     </div>
//   );
// }

// function SettingsTab({
//   theme,
//   onThemeChange,
// }: {
//   theme: "dark" | "light";
//   onThemeChange: (t: "dark" | "light") => void;
// }) {
//   return (
//     <div className="max-w-2xl space-y-8 overflow-y-auto">
//       <div className="p-6 bg-theme-card border border-theme-border rounded-2xl">
//         <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">
//           Appearance
//         </h3>
//         {/* <div className="grid grid-cols-2 gap-4"> */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//           <button
//             onClick={() => onThemeChange("dark")}
//             className={clsx(
//               "p-4 rounded-xl border transition-all flex flex-col items-center gap-3",
//               theme === "dark"
//                 ? "bg-brand-teal/20 border-brand-teal text-brand-teal"
//                 : "bg-white/5 border-theme-border opacity-40 hover:opacity-100 hover:bg-white/10",
//             )}
//           >
//             <Moon className="w-6 h-6" />
//             <span className="text-xs font-bold uppercase tracking-widest">
//               Dark Mode
//             </span>
//           </button>
//           <button
//             onClick={() => onThemeChange("light")}
//             className={clsx(
//               "p-4 rounded-xl border transition-all flex flex-col items-center gap-3",
//               theme === "light"
//                 ? "bg-brand-teal/20 border-brand-teal text-brand-teal"
//                 : "bg-white/5 border-theme-border opacity-40 hover:opacity-100 hover:bg-white/10",
//             )}
//           >
//             <Sun className="w-6 h-6" />
//             <span className="text-xs font-bold uppercase tracking-widest">
//               Light Mode
//             </span>
//           </button>
//         </div>
//       </div>

//       {/* <div className="p-6 bg-theme-card border border-theme-border rounded-2xl">
//         <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">
//           Account Notifications
//         </h3>
//         <div className="space-y-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-bold">Email Alerts</p>
//               <p className="text-[10px] opacity-40 uppercase tracking-widest">
//                 Receive updates on project status
//               </p>
//             </div>
//             <div className="w-10 h-5 bg-brand-teal rounded-full relative">
//               <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
//             </div>
//           </div>
//         </div>
//       </div> */}
//     </div>
//   );
// }

// function ProjectStatsTab({
//   projectStats,
//   tenant,
// }: {
//   projectStats: any[];
//   tenant: Tenant;
// }) {
//   const totalProjects = projectStats.reduce(
//     (sum, s) => sum + parseInt(s.project_count),
//     0,
//   );

//   const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
//   const [userProjects, setUserProjects] = useState<Record<string, any[]>>({});
//   const [expandedProjectId, setExpandedProjectId] = useState<string | null>(
//     null,
//   );
//   const [projectData, setProjectData] = useState<Record<string, any>>({});

//   const handleExpandUser = async (userId: string) => {
//     if (expandedUserId === userId) {
//       setExpandedUserId(null);
//       return;
//     }
//     setExpandedUserId(userId);
//     if (!userProjects[userId]) {
//       const res = await authFetch(
//         `/api/projects?tenantId=${tenant.id}&userId=${userId}`,
//       );
//       if (res.ok) {
//         const data = await res.json();
//         setUserProjects((prev) => ({ ...prev, [userId]: data }));
//       }
//     }
//   };

//   const handleExpandProject = async (projectId: string) => {
//     if (expandedProjectId === projectId) {
//       setExpandedProjectId(null);
//       return;
//     }
//     setExpandedProjectId(projectId);
//     if (!projectData[projectId]) {
//       const res = await authFetch(`/api/projects/${projectId}`);
//       if (res.ok) {
//         const data = await res.json();
//         setProjectData((prev) => ({ ...prev, [projectId]: data.data || data }));
//       }
//     }
//   };

//   const [customEquipment, setCustomEquipment] = useState<any[]>([]);

//   useEffect(() => {
//     const fetchCustomEquipment = async () => {
//       const res = await authFetch(`/api/tenant/${tenant.id}/equipment`);
//       if (res.ok) {
//         const data = await res.json();
//         setCustomEquipment(data);
//       }
//     };
//     fetchCustomEquipment();
//   }, [tenant.id]);

//   const equipmentLookup = React.useMemo(() => {
//     const lookup: Record<
//       string,
//       { name: string; width: number; depth: number; height: number }
//     > = {
//       slide_small: { name: "Small Slide", width: 4, depth: 2, height: 3 },
//       slide_large: { name: "Large Slide", width: 8, depth: 3, height: 6 },
//       tower_3d: { name: "Tower", width: 5, depth: 5, height: 10 },
//       duck_3d: { name: "Duck", width: 2, depth: 2, height: 2 },
//       wave_pool: { name: "Wave Pool", width: 20, depth: 15, height: 2 },
//       lazy_river: { name: "Lazy River", width: 30, depth: 5, height: 1.5 },
//       splash_pad: { name: "Splash Pad", width: 10, depth: 10, height: 0.5 },
//       pump_station: { name: "Pump Station", width: 5, depth: 5, height: 4 },
//       ticket_booth: { name: "Ticket Booth", width: 3, depth: 3, height: 3 },
//       locker_block: { name: "Locker Block", width: 10, depth: 4, height: 3 },
//       food_kiosk: { name: "Food Kiosk", width: 4, depth: 4, height: 3 },
//       seating_area: { name: "Seating Area", width: 6, depth: 6, height: 1 },
//     };
//     // Merge custom equipment from DB
//     (customEquipment || []).forEach((eq: any) => {
//       lookup[eq.id] = {
//         name: eq.name,
//         width: eq.width,
//         depth: eq.depth,
//         height: eq.height,
//       };
//     });
//     return lookup;
//   }, [customEquipment]);

//   const getEquipmentList = (pd: any) => {
//     if (!pd?.objects) return [];
//     const counts: Record<string, number> = {};
//     pd.objects.forEach((obj: any) => {
//       counts[obj.type] = (counts[obj.type] || 0) + 1;
//     });
//     return Object.entries(counts).map(([type, count]) => {
//       const def = equipmentLookup[type];
//       return {
//         type,
//         name: def?.name || type,
//         count,
//         width: def?.width || 0,
//         depth: def?.depth || 0,
//         height: def?.height || 0,
//       };
//     });
//   };

//   return (
//     <div className="space-y-6">
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//         <StatCard
//           label="Total Projects"
//           value={totalProjects.toString()}
//           trend="across all reps"
//           icon={<FolderOpen className="w-5 h-5" />}
//         />
//         <StatCard
//           label="Sales Reps"
//           value={projectStats.length.toString()}
//           trend="in your team"
//           icon={<Users className="w-5 h-5" />}
//         />
//       </div>

//       <div className="p-6 bg-theme-card border border-theme-border rounded-2xl">
//         <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">
//           Projects per Sales Rep
//         </h3>
//         {projectStats.length === 0 ? (
//           <p className="text-sm opacity-30 text-center py-8">
//             No sales reps found
//           </p>
//         ) : (
//           <div className="space-y-3">
//             {projectStats.map((rep) => (
//               <div
//                 key={rep.user_id}
//                 className="bg-white/5 border border-theme-border rounded-xl overflow-hidden"
//               >
//                 {/* Rep row — clickable */}
//                 <div
//                   className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
//                   onClick={() => handleExpandUser(rep.user_id)}
//                 >
//                   <div className="flex items-center gap-3">
//                     <div className="w-9 h-9 rounded-lg bg-brand-teal/10 flex items-center justify-center text-brand-teal font-bold text-sm">
//                       {rep.user_name?.charAt(0).toUpperCase()}
//                     </div>
//                     <div>
//                       <p className="text-sm font-medium">{rep.user_name}</p>
//                       <p className="text-[11px] opacity-30">{rep.email}</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-3">
//                     <div className="text-right">
//                       <p className="text-lg font-bold text-brand-teal">
//                         {rep.project_count}
//                       </p>
//                       <p className="text-[10px] opacity-30 uppercase tracking-wider">
//                         projects
//                       </p>
//                     </div>
//                     <ChevronDown
//                       className={`w-4 h-4 opacity-30 transition-transform ${expandedUserId === rep.user_id ? "rotate-180" : ""}`}
//                     />
//                   </div>
//                 </div>

//                 {/* Expanded projects */}
//                 {expandedUserId === rep.user_id && (
//                   <div className="border-t border-white/10 px-4 pb-4">
//                     <p className="text-[10px] uppercase tracking-widest opacity-30 mt-3 mb-3">
//                       Projects
//                     </p>
//                     {!userProjects[rep.user_id] ? (
//                       <p className="text-xs opacity-30">Loading...</p>
//                     ) : userProjects[rep.user_id].length === 0 ? (
//                       <p className="text-xs opacity-30 italic">
//                         No projects yet.
//                       </p>
//                     ) : (
//                       <div className="space-y-2">
//                         {userProjects[rep.user_id].map((project: any) => (
//                           <div
//                             key={project.id}
//                             className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
//                           >
//                             <div
//                               className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
//                               onClick={() => handleExpandProject(project.id)}
//                             >
//                               <div>
//                                 <p className="text-xs font-semibold text-white">
//                                   {project.name}
//                                 </p>
//                                 {project.client_name && (
//                                   <p className="text-[10px] text-brand-teal/70 mt-0.5">
//                                     {project.client_name}
//                                   </p>
//                                 )}
//                                 <p className="text-[10px] opacity-30 mt-0.5">
//                                   {project.updated_at
//                                     ? `Updated ${new Date(project.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
//                                     : `Created ${new Date(project.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
//                                 </p>
//                               </div>
//                               <ChevronDown
//                                 className={`w-3.5 h-3.5 opacity-30 transition-transform shrink-0 ${expandedProjectId === project.id ? "rotate-180" : ""}`}
//                               />
//                             </div>

//                             {expandedProjectId === project.id && (
//                               <div className="border-t border-white/10 px-3 pb-3">
//                                 <p className="text-[10px] uppercase tracking-widest opacity-30 mt-2 mb-2">
//                                   Equipment Used
//                                 </p>
//                                 {!projectData[project.id] ? (
//                                   <p className="text-xs opacity-30">
//                                     Loading...
//                                   </p>
//                                 ) : getEquipmentList(projectData[project.id])
//                                     .length === 0 ? (
//                                   <p className="text-xs opacity-30">
//                                     No equipment placed.
//                                   </p>
//                                 ) : (
//                                   <div className="space-y-1">
//                                     {getEquipmentList(
//                                       projectData[project.id],
//                                     ).map((eq) => (
//                                       <div
//                                         key={eq.type}
//                                         className="flex items-center justify-between bg-white/5 rounded px-2 py-1.5"
//                                       >
//                                         <div>
//                                           <span className="text-xs font-medium text-white">
//                                             {eq.name}
//                                           </span>
//                                           <span className="text-[10px] opacity-30 ml-1">
//                                             ({eq.width}m×{eq.depth}m×{eq.height}
//                                             m)
//                                           </span>
//                                         </div>
//                                         <span className="text-xs font-bold text-brand-teal">
//                                           ×{eq.count}
//                                         </span>
//                                       </div>
//                                     ))}
//                                   </div>
//                                 )}
//                               </div>
//                             )}
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// function ProfileTab({
//   user,
//   onUserUpdate,
//   onProfileSaved,
//   onShowToast,
// }: {
//   user: User;
//   onUserUpdate?: (user: User) => void;
//   onProfileSaved?: () => void;
//   onShowToast?: (message: string, type?: "success" | "error") => void;
// }) {
//   const [profileData, setProfileData] = useState({
//     name: user.name,
//     phone: user.phone || "",
//     password: "",
//   });
//   const [isSaving, setIsSaving] = useState(false);

//   const handleSaveProfile = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSaving(true);
//     try {
//       const res = await authFetch(`/api/users/${user.id}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           name: profileData.name,
//           phone: profileData.phone,
//           password: profileData.password || undefined,
//         }),
//       });
//       if (res.ok) {
//         const updatedUser: User = {
//           ...user,
//           name: profileData.name,
//           phone: profileData.phone,
//         };
//         onUserUpdate?.(updatedUser);
//         onProfileSaved?.();
//         onShowToast?.("Profile updated successfully!");
//       }
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="max-w-2xl space-y-8 overflow-y-auto">
//       <div className="p-6 bg-theme-card border border-theme-border rounded-2xl">
//         <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">
//           Profile Settings
//         </h3>
//         <form onSubmit={handleSaveProfile} className="space-y-4">
//           {/* <div className="grid grid-cols-2 gap-4"> */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
//                 Full Name
//               </label>
//               <input
//                 type="text"
//                 value={profileData.name}
//                 onChange={(e) =>
//                   setProfileData({ ...profileData, name: e.target.value })
//                 }
//                 className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
//               />
//             </div>
//             <div className="space-y-2">
//               <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
//                 Mobile Number
//               </label>
//               <input
//                 inputMode="numeric"
//                 maxLength={10}
//                 placeholder="10-digit mobile number"
//                 type="tel"
//                 value={profileData.phone}
//                 onChange={(e) => {
//                   const val = e.target.value.replace(/\D/g, "").slice(0, 10);
//                   setProfileData({ ...profileData, phone: val });
//                 }}
//                 className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
//               />
//             </div>
//           </div>
//           <div className="space-y-2">
//             <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
//               New Password (Optional)
//             </label>
//             <input
//               type="password"
//               value={profileData.password}
//               onChange={(e) =>
//                 setProfileData({ ...profileData, password: e.target.value })
//               }
//               className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
//               placeholder="Leave blank to keep current"
//             />
//           </div>
//           <button
//             type="submit"
//             disabled={isSaving}
//             className="px-6 py-2 bg-brand-teal text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-brand-teal/90 transition-all disabled:opacity-50"
//           >
//             {isSaving ? "Saving..." : "Update Profile"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from "../utils/api";
import {
  User,
  Tenant,
  EquipmentDef,
  DEFAULT_LIBRARY,
} from "../../../backend/types";
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
  FolderOpen,
  ChevronDown,
  Lock,
  Archive,
  Share2,
  ShieldAlert,
  Cloud,
  HardDrive,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { motion } from "motion/react";
import { clsx } from "clsx";
import { v4 as uuidv4 } from "uuid";
import { useTheme } from "../contexts/ThemeContext";
import { LockedAccountsPanel } from "./LockedAccountsPanel";

const generateDefaultEquipmentImage = (item: EquipmentDef) => {
  const label = item.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
  const fill = item.color || "#999";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='100%' height='100%' fill='${fill}'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, system-ui, sans-serif' font-size='28' fill='#ffffff' opacity='0.85'>${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const resolveImageUrl = (imageUrl?: string | null) => {
  if (!imageUrl) return null;
  if (
    imageUrl.startsWith("data:") ||
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://")
  ) {
    return imageUrl;
  }
  return `${import.meta.env.VITE_API_URL}${imageUrl}`;
};

const getEquipmentThumbnail = (item: EquipmentDef) => {
  const imageUrl = resolveImageUrl(item.imageUrl);
  return imageUrl ? imageUrl : generateDefaultEquipmentImage(item);
};

const formatSnakeCaseToTitleCase = (str: string) => {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const getEquipmentNameByIdFromList = (
  entityId: string,
  equipment: EquipmentDef[],
): string => {
  const customEquip = equipment.find((e) => e.id === entityId);
  if (customEquip) return customEquip.name;

  const defaultEquip = DEFAULT_LIBRARY.find((e) => e.id === entityId);
  if (defaultEquip) return defaultEquip.name;

  return "";
};

const getLogEntityDisplayName = (
  log: any,
  equipment: EquipmentDef[],
): string => {
  const lookupId = log.entity_id || log.entity_name;
  const equipmentName = lookupId
    ? getEquipmentNameByIdFromList(lookupId, equipment)
    : "";
  if (equipmentName) return equipmentName;

  if (log.entity_name) {
    return log.entity_name.includes("_")
      ? formatSnakeCaseToTitleCase(log.entity_name)
      : log.entity_name;
  }

  return log.details || log.action;
};

interface Props {
  user: User;
  tenant: Tenant;
  onLogout: () => void;
  onUserUpdate?: (user: User) => void;
  onShowToast?: (message: string, type?: "success" | "error") => void;
}

export function AdminDashboard({
  user,
  tenant,
  onLogout,
  onUserUpdate,
  onShowToast,
}: Props) {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "equipment"
    | "users"
    | "settings"
    | "profile"
    | "resets"
    | "logs"
    | "projects"
    | "locked-accounts"
  >("overview");
  const [equipment, setEquipment] = useState<EquipmentDef[]>([]);
  const [isAddingEquipment, setIsAddingEquipment] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentDef | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [salesRepCount, setSalesRepCount] = useState(0);
  const [newEquipment, setNewEquipment] = useState<Partial<EquipmentDef>>({
    name: "",
    category: "slides",
    mainCategory: "Playarea",
    width: 5,
    depth: 5,
    height: 5,
    color: "#14b8a6",
  });

  const [resetRequests, setResetRequests] = useState<any[]>([]);
  const [tempPasswords, setTempPasswords] = useState<Record<string, string>>(
    {},
  );
  const [ResetCount, setResetCount] = useState(0);
  const [isFetchingResetRequests, setIsFetchingResetRequests] = useState(false);

  const [logs, setLogs] = useState<any[]>([]);
  const [logFilter, setLogFilter] = useState("all");
  const [logDateFilter, setLogDateFilter] = useState<{
    startDate: string;
    endDate: string;
  }>(() => {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    return { startDate: dateStr, endDate: dateStr };
  });
  const overviewLogs = logs
    .filter(
      (log) =>
        log.action !== "LOGIN" &&
        log.entity_type !== "auth" &&
        log.entity_type !== "login",
    )
    .slice(0, 3);
  //const [disabledDefaults, setDisabledDefaults] = useState<string[]>([]);
  const [disabledDefaults, setDisabledDefaults] = useState<Set<string>>(
    new Set(),
  );

  const fetchLogs = async () => {
    const res = await authFetch(`/api/tenant/${tenant.id}/logs?limit=100`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data);
    }
  };

  const getFilteredLogs = (logsToFilter: any[]) => {
    let filtered = logsToFilter;

    // Filter by entity type
    if (logFilter !== "all") {
      filtered = filtered.filter((l) => l.entity_type === logFilter);
    }

    // Filter by date range
    const startDate = new Date(`${logDateFilter.startDate}T00:00:00`).getTime();
    const endDate = new Date(`${logDateFilter.endDate}T23:59:59`).getTime();

    filtered = filtered.filter((log) => {
      const logTime = new Date(log.created_at).getTime();
      return logTime >= startDate && logTime <= endDate;
    });

    return filtered;
  };

  const filteredLogsForDisplay = getFilteredLogs(logs);

  const fetchResetRequests = useCallback(async () => {
    setIsFetchingResetRequests(true);
    try {
      const res = await authFetch(`/api/admin/reset-requests`);
      if (res.ok) {
        const data = await res.json();
        setResetRequests(data);
        setResetCount(data.length);
      }
    } finally {
      setIsFetchingResetRequests(false);
    }
  }, [tenant.id]);

  const fetchSalesRepCount = async () => {
    const res = await authFetch(`/api/tenant/${tenant.id}/users`);
    if (res.ok) {
      const data = await res.json();
      const count = data.filter(
        (u: any) => u.role === "sales_rep" && u.is_active !== false,
      ).length;
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
        mainCategory: eq.main_category || eq.mainCategory || undefined,
        width: eq.width,
        depth: eq.depth,
        height: eq.height,
        color: eq.color,
        modelUrl: eq.model_url,
        animationsEnabled: !!eq.animations_enabled,
        imageUrl: eq.image_url || null,
        isActive: Number(eq.is_active) !== 0,
      }));
      setEquipment(mapped);
    }
  };

  const getEquipmentNameById = (id: string) =>
    getEquipmentNameByIdFromList(id, equipment);

  // Add equipment stats state and fetch:
  const [equipmentStats, setEquipmentStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

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

  const fetchActiveProjects = async () => {
    const res = await authFetch(`/api/tenant/${tenant.id}/active-projects`);
    if (res.ok) {
      const data = await res.json();
      setActiveProjectCount(data.count);
    }
  };

  const fetchProjectStats = async () => {
    const res = await authFetch(`/api/tenant/${tenant.id}/project-stats`);
    if (res.ok) {
      const data = await res.json();
      setProjectStats(data);
    }
  };

  const [activeProjectCount, setActiveProjectCount] = useState(0);
  const [projectStats, setProjectStats] = useState<any[]>([]);

  useEffect(() => {
    fetchEquipment();
    fetchEquipmentStats();
    fetchDisabledDefaults();
    fetchLogs();
    fetchActiveProjects();
    fetchProjectStats();
  }, [tenant.id]);

  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs();
    }
  }, [activeTab, tenant.id]);

  // Add resolve handler
  const handleResolveReset = async (requestId: string) => {
    const tempPwd = tempPasswords[requestId];
    if (!tempPwd || tempPwd.length < 8) {
      return alert("Temp password must be at least 8 characters");
    }

    const res = await authFetch(
      `/api/admin/reset-requests/${requestId}/resolve`,
      {
        method: "POST",
        body: JSON.stringify({ temp_password: tempPwd }),
      },
    );

    if (res.ok) {
      alert("Temporary password set. Share it with the user.");
      fetchResetRequests();
    }
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEquipment.modelUrl === "uploading...") {
      alert("Please wait for the 3D model upload to finish before saving.");
      return;
    }
    try {
      const id = uuidv4();
      const res = await authFetch(`/api/tenant/${tenant.id}/equipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: newEquipment.name,
          category: newEquipment.category,
          main_category: newEquipment.mainCategory || "Playarea",
          mainCategory: newEquipment.mainCategory || "Playarea",
          width: newEquipment.width,
          depth: newEquipment.depth,
          height: newEquipment.height,
          color: newEquipment.color,
          model_url: newEquipment.modelUrl || null,
          image_url: newEquipment.imageUrl || null,
        }),
      });

      if (res.ok) {
        setIsAddingEquipment(false);
        setNewEquipment({
          name: "",
          category: "slides",
          mainCategory: "Playarea",
          width: 5,
          depth: 5,
          height: 5,
          color: "#14b8a6",
          imageUrl: "",
        });
        await fetchEquipment();
        await fetchEquipmentStats();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Failed to create equipment: ${data.error || "Please check required fields and try again."}`);
      }
    } catch (err: any) {
      console.error("Error creating equipment:", err);
      alert(`Failed to create equipment: ${err.message || "Network error"}`);
    }
  };

  const handleUpdateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquipment) return;
    if (editingEquipment.modelUrl === "uploading...") {
      alert("Please wait for the 3D model upload to finish before saving.");
      return;
    }

    try {
      const res = await authFetch(
        `/api/tenant/${tenant.id}/equipment/${editingEquipment.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingEquipment.id,
            name: editingEquipment.name,
            category: editingEquipment.category,
            main_category: editingEquipment.mainCategory || null,
            mainCategory: editingEquipment.mainCategory || null,
            width: editingEquipment.width,
            depth: editingEquipment.depth,
            height: editingEquipment.height,
            color: editingEquipment.color,
            model_url: editingEquipment.modelUrl || null,
            image_url: editingEquipment.imageUrl || null,
          }),
        },
      );

      if (res.ok) {
        setEditingEquipment(null);
        await fetchEquipment();
        await fetchEquipmentStats();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Failed to update equipment: ${data.error || "Please check required fields and try again."}`);
      }
    } catch (err: any) {
      console.error("Error updating equipment:", err);
      alert(`Failed to update equipment: ${err.message || "Network error"}`);
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this equipment?")) return;

    const res = await authFetch(`/api/tenant/${tenant.id}/equipment/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      fetchEquipment();
    }
  };

  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    // Optimistic UI: flip the equipment state immediately so counts and badges update
    setEquipment((prev) =>
      prev.map((eq) =>
        eq.id === id ? { ...eq, isActive: !currentlyActive } : eq,
      ),
    );

    // Optimistically adjust equipmentStats
    const prevStats = { ...equipmentStats };
    setEquipmentStats((s) => ({
      ...s,
      active: s.active + (currentlyActive ? -1 : 1),
      inactive: s.inactive + (currentlyActive ? 1 : -1),
    }));

    const res = await authFetch(
      `/api/tenant/${tenant.id}/equipment/${id}/toggle`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: currentlyActive ? 0 : 1 }),
      },
    );

    if (res.ok) {
      // Confirm counts with server to avoid drift
      fetchEquipmentStats();
    } else {
      // Revert optimistic changes on failure
      setEquipment((prev) =>
        prev.map((eq) =>
          eq.id === id ? { ...eq, isActive: currentlyActive } : eq,
        ),
      );
      setEquipmentStats(prevStats);
    }
  };

  // Toggle a DEFAULT_LIBRARY item on/off for this tenant
  const handleToggleDefault = async (equipmentId: string) => {
    const isCurrentlyDisabled = disabledDefaults.has(equipmentId);
    console.log(
      `Toggling default equipment ${equipmentId}. Currently disabled: ${isCurrentlyDisabled}`,
    );
    // Optimistic update
    setDisabledDefaults((prev) => {
      const next = new Set(prev);
      isCurrentlyDisabled ? next.delete(equipmentId) : next.add(equipmentId);
      return next;
    });

    // Optimistically adjust equipmentStats (DEFAULT library counts are included)
    const prevStats = { ...equipmentStats };
    setEquipmentStats((s) => ({
      ...s,
      active: s.active + (isCurrentlyDisabled ? 1 : -1),
      inactive: s.inactive + (isCurrentlyDisabled ? -1 : 1),
    }));

    const res = await authFetch(
      `/api/tenant/${tenant.id}/disabled-defaults/${equipmentId}`,
      {
        method: "POST",
      },
    );

    if (res.ok) {
      // Refresh stats to ensure counts are accurate
      await fetchEquipmentStats();
    } else {
      // Revert both disabledDefaults and stats on failure
      setDisabledDefaults((prev) => {
        const next = new Set(prev);
        isCurrentlyDisabled ? next.add(equipmentId) : next.delete(equipmentId);
        return next;
      });
      setEquipmentStats(prevStats);
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
              <img
                src={tenant.logo_url}
                alt="Logo"
                className="w-8 h-8 rounded-lg object-cover"
              />
              <div>
                <h1 className="text-sm font-bold truncate">{tenant.name}</h1>
                <p className="text-[10px] opacity-40 uppercase tracking-widest">
                  Admin Portal
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("profile")}
            className={clsx(
              "w-full flex items-center gap-3 p-2 rounded-lg transition-all text-xs font-bold uppercase tracking-widest group",
              activeTab === "profile"
                ? "bg-brand-teal/10 text-brand-teal"
                : "opacity-40 hover:opacity-100 hover:bg-white/5",
            )}
          >
            <UserIcon className="w-4 h-4" />
            View Profile
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavButton
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Overview"
          />
          <NavButton
            active={activeTab === "resets"}
            onClick={() => {
              setActiveTab("resets");
              fetchResetRequests();
            }}
            icon={<KeyRound className="w-4 h-4" />}
            label="Password Resets"
            badge={ResetCount > 0 ? ResetCount : undefined}
          />
          <NavButton
            active={activeTab === "locked-accounts"}
            onClick={() => setActiveTab("locked-accounts")}
            icon={<Lock className="w-4 h-4" />}
            label="Locked Accounts"
          />
          <NavButton
            active={activeTab === "logs"}
            onClick={() => setActiveTab("logs")}
            icon={<Activity className="w-4 h-4" />}
            label="Activity Logs"
          />
          <NavButton
            active={activeTab === "equipment"}
            onClick={() => setActiveTab("equipment")}
            icon={<Package className="w-4 h-4" />}
            label="Equipment Repo"
          />
          <NavButton
            active={activeTab === "users"}
            onClick={() => setActiveTab("users")}
            icon={<Users className="w-4 h-4" />}
            label="Sales Team"
          />
          <NavButton
            active={activeTab === "projects"}
            onClick={() => setActiveTab("projects")}
            icon={<FolderOpen className="w-4 h-4" />}
            label="Project Stats"
          />
          <NavButton
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
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
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "equipment" && "Equipment Repository"}
              {activeTab === "users" && "Sales Team Management"}
              {activeTab === "settings" && "Company Settings"}
              {activeTab === "profile" && "Profile"}
              {activeTab === "resets" && "Password Reset Requests"}
              {activeTab === "locked-accounts" && "Locked Accounts"}
              {activeTab === "logs" && "Activity Logs"}
              {activeTab === "projects" && "Project Statistics"}
            </h2>
            <p className="text-sm opacity-40">Welcome back, {user.name}</p>
          </div>

          {(activeTab === "equipment" || activeTab === "users") && (
            <div className="flex items-center gap-3 shrink-0">
              {/*  Show user count badge only on users tab */}
              {activeTab === "users" && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-white/5 border border-theme-border rounded-lg">
                  {/* We need to pass the count down — see below */}
                  Sales Reps: {salesRepCount} / 10
                </span>
              )}
              <button
                onClick={() =>
                  activeTab === "equipment"
                    ? setIsAddingEquipment(true)
                    : setIsAddingUser(true)
                }
                disabled={activeTab === "users" && salesRepCount >= 10} // disable at limit
                className={clsx(
                  "flex items-center gap-1 lg:gap-2 px-2 lg:px-4 py-2 text-[10px] lg:text-xs font-bold uppercase tracking-widest rounded-lg transition-all shadow-lg shrink-0",
                  activeTab === "users" && salesRepCount >= 10
                    ? "bg-white/10 text-white/30 cursor-not-allowed shadow-none" // greyed out
                    : "bg-brand-teal text-white hover:bg-brand-teal/90 shadow-brand-teal/20",
                )}
              >
                <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
                <span className="hidden sm:inline">
                  {activeTab === "equipment"
                    ? "Add New Equipment"
                    : "Add Person"}
                </span>
                <span className="sm:hidden">
                  <Plus className="w-3 h-3" />
                </span>
              </button>
            </div>
          )}
        </header>

        {activeTab === "overview" && (
          <OverviewTab
            tenant={tenant}
            equipmentStats={equipmentStats}
            activeProjectCount={activeProjectCount}
            projectStats={projectStats}
            recentLogs={overviewLogs}
            equipment={equipment}
            getEquipmentNameById={getEquipmentNameById}
          />
        )}
        {activeTab === "equipment" && (
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
            <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg">
              Default Active: {DEFAULT_LIBRARY.length - disabledDefaults.size}
            </span>
          </div>
        )}
        {activeTab === "equipment" && (
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
        {activeTab === "users" && (
          <UsersTab
            tenant={tenant}
            isAdding={isAddingUser}
            setIsAdding={setIsAddingUser}
            salesRepCount={salesRepCount}
            setSalesRepCount={setSalesRepCount}
          />
        )}
        {activeTab === "projects" && (
          <ProjectStatsTab projectStats={projectStats} tenant={tenant} />
        )}
        {activeTab === "settings" && (
          <SettingsTab theme={theme} onThemeChange={setTheme} />
        )}
        {activeTab === "profile" && (
          <ProfileTab
            user={user}
            onUserUpdate={onUserUpdate}
            onProfileSaved={fetchLogs}
            onShowToast={onShowToast}
          />
        )}

        {activeTab === "locked-accounts" && (
          <LockedAccountsPanel userRole="tenant_admin" tenantId={tenant.id} />
        )}

        {activeTab === "logs" &&
          (() => {
            return (
              <div className="space-y-4">
                {/* Date Range Filter */}
                <div className="p-4 bg-theme-card border border-theme-border rounded-2xl space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-widest opacity-60">
                    Filter by Date
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-2">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={logDateFilter.startDate}
                        onChange={(e) =>
                          setLogDateFilter((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 bg-white/5 border border-theme-border rounded-lg text-sm font-medium transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-2">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={logDateFilter.endDate}
                        onChange={(e) =>
                          setLogDateFilter((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 bg-white/5 border border-theme-border rounded-lg text-sm font-medium transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const today = new Date().toISOString().split("T")[0];
                      setLogDateFilter({ startDate: today, endDate: today });
                    }}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 border border-theme-border rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors"
                  >
                    Reset to Today
                  </button>
                </div>

                {/* Type Filter bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    "all",
                    "auth",
                    "sales_rep",
                    "equipment",
                    "project",
                    "password_reset",
                    "profile",
                  ].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setLogFilter(filter)}
                      className={clsx(
                        "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all border",
                        logFilter === filter
                          ? "bg-brand-teal text-white border-brand-teal"
                          : "bg-white/5 border-theme-border opacity-60 hover:opacity-100",
                      )}
                    >
                      {filter === "all"
                        ? "All Activity"
                        : filter.replace("_", " ")}
                    </button>
                  ))}
                </div>

                {/* Log entries */}
                <div className="space-y-2">
                  {filteredLogsForDisplay.length === 0 ? (
                    <div className="py-20 text-center border border-dashed border-theme-border rounded-2xl">
                      <Activity className="w-12 h-12 opacity-10 mx-auto mb-4" />
                      <p className="text-sm opacity-40 italic">
                        No activity logs found for the selected date range.
                      </p>
                    </div>
                  ) : (
                    filteredLogsForDisplay.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 p-4 bg-theme-card border border-theme-border rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <div
                          className={clsx(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                            log.action === "CREATE" &&
                              "bg-emerald-500/20 text-emerald-400",
                            log.action === "UPDATE" &&
                              !log.details
                                ?.toLowerCase()
                                .includes("archived") &&
                              "bg-blue-500/20 text-blue-400",
                            log.action === "UPDATE" &&
                              log.details?.toLowerCase().includes("archived") &&
                              "bg-amber-500/20 text-amber-400",
                            log.action === "DELETE" &&
                              "bg-red-500/20 text-red-400",
                            log.action === "LOGIN" &&
                              "bg-brand-teal/20 text-brand-teal",
                            log.action === "LOGIN_FAILED" &&
                              "bg-red-500/20 text-red-400",
                            log.action === "SAVE" &&
                              "bg-purple-500/20 text-purple-400",
                            log.action === "REQUEST" &&
                              "bg-amber-500/20 text-amber-400",
                            log.action === "RESOLVE" &&
                              "bg-emerald-500/20 text-emerald-400",
                            log.action === "SHARE" &&
                              "bg-sky-500/20 text-sky-400",
                          )}
                        >
                          {log.action === "CREATE" && (
                            <Plus className="w-4 h-4" />
                          )}
                          {log.action === "UPDATE" &&
                            !log.details
                              ?.toLowerCase()
                              .includes("archived") && (
                              <Pencil className="w-4 h-4" />
                            )}
                          {log.action === "UPDATE" &&
                            log.details?.toLowerCase().includes("archived") && (
                              <Archive className="w-4 h-4" />
                            )}
                          {log.action === "DELETE" && (
                            <Trash2 className="w-4 h-4" />
                          )}
                          {log.action === "LOGIN" && (
                            <UserIcon className="w-4 h-4" />
                          )}
                          {log.action === "LOGIN_FAILED" && (
                            <ShieldAlert className="w-4 h-4" />
                          )}
                          {log.action === "SAVE" && (
                            <ShieldCheck className="w-4 h-4" />
                          )}
                          {log.action === "REQUEST" && (
                            <KeyRound className="w-4 h-4" />
                          )}
                          {log.action === "RESOLVE" && (
                            <ShieldCheck className="w-4 h-4" />
                          )}
                          {log.action === "SHARE" && (
                            <Share2 className="w-4 h-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={clsx(
                                  "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded",
                                  log.action === "CREATE" &&
                                    "bg-emerald-500/20 text-emerald-400",
                                  log.action === "UPDATE" &&
                                    !log.details
                                      ?.toLowerCase()
                                      .includes("archived") &&
                                    "bg-blue-500/20 text-blue-400",
                                  log.action === "UPDATE" &&
                                    log.details
                                      ?.toLowerCase()
                                      .includes("archived") &&
                                    "bg-amber-500/20 text-amber-400",
                                  log.action === "DELETE" &&
                                    "bg-red-500/20 text-red-400",
                                  log.action === "LOGIN" &&
                                    "bg-brand-teal/20 text-brand-teal",
                                  log.action === "LOGIN_FAILED" &&
                                    "bg-red-500/20 text-red-400",
                                  log.action === "SAVE" &&
                                    "bg-purple-500/20 text-purple-400",
                                  log.action === "REQUEST" &&
                                    "bg-amber-500/20 text-amber-400",
                                  log.action === "RESOLVE" &&
                                    "bg-emerald-500/20 text-emerald-400",
                                  log.action === "SHARE" &&
                                    "bg-sky-500/20 text-sky-400",
                                )}
                              >
                                {log.action === "UPDATE" &&
                                log.details?.toLowerCase().includes("archived")
                                  ? "ARCHIVE"
                                  : log.action === "LOGIN_FAILED"
                                    ? "FAILED LOGIN"
                                    : log.action}
                              </span>
                              <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                                {log.entity_type.replace("_", " ")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] opacity-30 shrink-0">
                              <Clock className="w-3 h-3" />
                              {/* {new Date(log.created_at + 'Z').toLocaleString()} */}
                              {new Date(log.created_at).toLocaleString()}
                            </div>
                          </div>
                          <p className="text-sm font-medium mt-1 truncate">
                            {getLogEntityDisplayName(log, equipment)}
                          </p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-[10px] opacity-40">
                              by {log.user_name}
                            </span>
                            {log.details && (
                              <span className="text-[10px] opacity-30 truncate">
                                {log.details}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })()}

        {activeTab === "resets" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-bold">Password Reset Requests</h3>
              <button
                onClick={fetchResetRequests}
                className="inline-flex items-center gap-2 rounded-full border border-theme-border bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest transition hover:bg-white/10"
                disabled={isFetchingResetRequests}
              >
                {isFetchingResetRequests ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            {resetRequests.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-theme-border rounded-2xl">
                <p className="text-sm opacity-40 italic">
                  No pending password reset requests.
                </p>
              </div>
            ) : (
              resetRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-6 bg-theme-card border border-theme-border rounded-2xl space-y-4"
                >
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
                      value={tempPasswords[req.id] || ""}
                      onChange={(e) =>
                        setTempPasswords({
                          ...tempPasswords,
                          [req.id]: e.target.value,
                        })
                      }
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

function NavButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm group",
        active
          ? "bg-brand-teal text-white shadow-lg shadow-brand-teal/10"
          : "opacity-60 hover:opacity-100 hover:bg-white/5",
      )}
    >
      <div
        className={clsx(
          active ? "text-white" : "opacity-40 group-hover:opacity-100",
        )}
      >
        {icon}
      </div>
      {label}

      {badge !== undefined && (
        <span
          className={clsx(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
            active
              ? "bg-white/20 text-white"
              : "bg-amber-500/20 text-amber-400",
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function OverviewTab({
  tenant,
  equipmentStats,
  activeProjectCount,
  projectStats,
  recentLogs,
  equipment,
  getEquipmentNameById,
}: {
  tenant: Tenant;
  equipmentStats: { total: number; active: number; inactive: number };
  activeProjectCount: number;
  projectStats: any[];
  recentLogs: any[];
  equipment: EquipmentDef[];
  getEquipmentNameById: (id: string) => string;
}) {
  return (
    <div className="space-y-8">
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"> */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        <StatCard
          label="Active Projects"
          value={activeProjectCount.toString()}
          trend="last 5 days"
          icon={<LayoutDashboard className="w-5 h-5" />}
        />
        <StatCard
          label="Total Equipment"
          value={equipmentStats.total.toString()}
          trend={`${equipmentStats.active} active`}
          icon={<Package className="w-5 h-5" />}
        />
        {/* <StatCard
          label="Sales Activity"
          value="89%"
          trend="+2%"
          icon={<TrendingUp className="w-5 h-5" />}
        /> */}
      </div>

      <div className="p-6 bg-theme-card border border-theme-border rounded-2xl">
        <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {recentLogs.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-theme-border rounded-2xl">
              <p className="text-sm opacity-40 italic">
                No recent activity yet.
              </p>
            </div>
          ) : (
            recentLogs.map((log) => {
              const isArchive =
                log.action === "UPDATE" &&
                log.details?.toLowerCase().includes("archived");
              const iconBg = clsx(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                log.action === "CREATE" && "bg-emerald-500/20 text-emerald-400",
                log.action === "UPDATE" &&
                  !isArchive &&
                  "bg-blue-500/20 text-blue-400",
                isArchive && "bg-amber-500/20 text-amber-400",
                log.action === "DELETE" && "bg-red-500/20 text-red-400",
                log.action === "LOGIN" && "bg-brand-teal/20 text-brand-teal",
                log.action === "LOGIN_FAILED" && "bg-red-500/20 text-red-400",
                log.action === "SAVE" && "bg-purple-500/20 text-purple-400",
                log.action === "REQUEST" && "bg-amber-500/20 text-amber-400",
                log.action === "RESOLVE" &&
                  "bg-emerald-500/20 text-emerald-400",
                log.action === "SHARE" && "bg-sky-500/20 text-sky-400",
              );
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-theme-border"
                >
                  <div className="flex items-center gap-4">
                    <div className={iconBg}>
                      {log.action === "CREATE" && <Plus className="w-5 h-5" />}
                      {log.action === "UPDATE" && !isArchive && (
                        <Pencil className="w-5 h-5" />
                      )}
                      {isArchive && <Archive className="w-5 h-5" />}
                      {log.action === "DELETE" && (
                        <Trash2 className="w-5 h-5" />
                      )}
                      {log.action === "LOGIN" && (
                        <UserIcon className="w-5 h-5" />
                      )}
                      {log.action === "LOGIN_FAILED" && (
                        <ShieldAlert className="w-5 h-5" />
                      )}
                      {log.action === "SAVE" && (
                        <ShieldCheck className="w-5 h-5" />
                      )}
                      {log.action === "REQUEST" && (
                        <KeyRound className="w-5 h-5" />
                      )}
                      {log.action === "RESOLVE" && (
                        <ShieldCheck className="w-5 h-5" />
                      )}
                      {log.action === "SHARE" && <Share2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {getLogEntityDisplayName(log, equipment)}
                      </p>
                      <p className="text-[10px] opacity-40 uppercase tracking-widest">
                        {isArchive
                          ? "ARCHIVE"
                          : log.action === "LOGIN_FAILED"
                            ? "FAILED LOGIN"
                            : log.entity_type
                              ? log.entity_type.replace("_", " ")
                              : log.action}
                        {log.user_name ? ` · by ${log.user_name}` : ""}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-20" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// Custom-styled searchable combobox for the equipment category field.
// Native <select>/<datalist> can't be themed for dark mode, which is why
// the browser-native version looked washed out. This renders our own
// dropdown so every option is legible and hover state is obvious, while
// still letting the user type a brand new category.
function CategoryCombobox({
  value,
  onChange,
  options,
  placeholder = "Select existing or type a new category",
  createLabel = "Create new",
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  createLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trimmedValue = value.trim();
  const exactMatch = options.some(
    (opt) => opt.toLowerCase() === trimmedValue.toLowerCase(),
  );
  // Show the full list when the field is empty or already holds a complete,
  // existing category (so the user can browse alternatives). Only filter
  // down while they're actively typing something that isn't a match yet.
  const showAllOptions = trimmedValue === "" || exactMatch;
  const visibleOptions = showAllOptions
    ? options
    : options.filter((opt) =>
        opt.toLowerCase().includes(trimmedValue.toLowerCase()),
      );

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          required
          type="text"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-theme-border rounded-lg pl-4 pr-9 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen((o) => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-40 hover:opacity-100 transition-opacity"
        >
          <ChevronDown
            className={clsx(
              "w-4 h-4 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </button>
      </div>

      {isOpen && (visibleOptions.length > 0 || trimmedValue !== "") && (
        <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-theme-bg border border-theme-border rounded-lg shadow-2xl py-1">
          {visibleOptions.map((option) => (
            <button
              key={option}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={clsx(
                "w-full text-left px-4 py-2 text-sm transition-colors hover:bg-brand-teal/20 hover:text-brand-teal",
                option.toLowerCase() === trimmedValue.toLowerCase()
                  ? "bg-brand-teal/10 text-brand-teal"
                  : "text-theme-text",
              )}
            >
              {option}
            </button>
          ))}
          {!exactMatch && trimmedValue !== "" && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(trimmedValue);
                setIsOpen(false);
              }}
              className={clsx(
                "w-full text-left px-4 py-2 text-sm font-medium text-brand-teal hover:bg-brand-teal/20 transition-colors",
                visibleOptions.length > 0 && "border-t border-theme-border",
              )}
            >
              + {createLabel} "{trimmedValue}"
            </button>
          )}
        </div>
      )}
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
  onToggleDefault,
}: {
  equipment: EquipmentDef[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isAdding: boolean;
  setIsAdding: (b: boolean) => void;
  editingItem: EquipmentDef | null;
  setEditingItem: (i: EquipmentDef | null) => void;
  newEquipment: Partial<EquipmentDef>;
  setNewEquipment: (e: Partial<EquipmentDef>) => void;
  onAdd: (e: React.FormEvent) => void;
  onUpdate: (e: React.FormEvent) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, currentlyActive: boolean) => void;
  disabledDefaults: Set<string>;
  onToggleDefault: (id: string) => void;
}) {
  const filteredEquipment = equipment.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.mainCategory &&
        item.mainCategory.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Categories offered in the add/edit combobox are derived from existing
  // equipment (default + tenant custom) arranged in Major & Subcategory hierarchy.
  const { majorCategoryOptions, subcategoriesByMajor, allSubcategoryOptions } =
    React.useMemo(() => {
      const majorSet = new Set<string>(["Playarea", "Factory"]);
      const subByMaj = new Map<string, Set<string>>();
      const allSubs = new Set<string>();

      const formatLabel = (val?: string | null) => {
        const trimmed = val?.trim();
        if (!trimmed) return "";
        return trimmed
          .split(/[\s_-]+/)
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
      };

      // Seed defaults
      subByMaj.set(
        "Playarea",
        new Set(["Amenities", "Facilities", "Pools", "Slides"]),
      );
      subByMaj.set(
        "Factory",
        new Set(["Factory Equipment", "Warehouse", "Refinery"]),
      );

      for (const item of [...DEFAULT_LIBRARY, ...equipment]) {
        const subLabel = formatLabel(item.category);
        if (subLabel) allSubs.add(subLabel);

        let majorLabel = item.mainCategory
          ? formatLabel(item.mainCategory)
          : "";
        if (!majorLabel) {
          const rawSub = (item.category || "").toLowerCase().trim();
          if (
            [
              "slides",
              "pools",
              "facilities",
              "amenities",
              "playarea",
              "play area",
            ].includes(rawSub)
          ) {
            majorLabel = "Playarea";
          } else if (
            [
              "factory equipment",
              "warehouse",
              "refinery",
              "factory",
              "industrial",
            ].includes(rawSub)
          ) {
            majorLabel = "Factory";
          } else {
            majorLabel = "Playarea";
          }
        }

        majorSet.add(majorLabel);
        if (!subByMaj.has(majorLabel)) {
          subByMaj.set(majorLabel, new Set());
        }
        if (subLabel) {
          subByMaj.get(majorLabel)!.add(subLabel);
        }
      }

      const subMap: Record<string, string[]> = {};
      for (const [maj, subs] of subByMaj.entries()) {
        subMap[maj.toLowerCase()] = Array.from(subs).sort((a, b) =>
          a.localeCompare(b),
        );
      }

      return {
        majorCategoryOptions: Array.from(majorSet).sort((a, b) => {
          if (a === "Playarea") return -1;
          if (b === "Playarea") return 1;
          if (a === "Factory") return -1;
          if (b === "Factory") return 1;
          return a.localeCompare(b);
        }),
        subcategoriesByMajor: subMap,
        allSubcategoryOptions: Array.from(allSubs).sort((a, b) =>
          a.localeCompare(b),
        ),
      };
    }, [equipment]);

  // ─── Dual Storage GLB Upload State ──────────────────────────────────────────
  const [isGlbModalOpen, setIsGlbModalOpen] = useState(false);
  const [storageMode, setStorageMode] = useState<"cloud" | "local">("cloud");
  const [selectedGlbFile, setSelectedGlbFile] = useState<File | null>(null);
  const [isUploadingGlb, setIsUploadingGlb] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [storageToast, setStorageToast] = useState<{
    type: "success" | "error" | "warning";
    title: string;
    message: string;
    details?: string;
  } | null>(null);

  const getModelStorageInfo = (url?: string | null) => {
    if (!url || url === "uploading...") return null;
    if (url.includes("res.cloudinary.com")) {
      return { type: "cloud" as const, label: "Cloud Storage (Cloudinary)" };
    }
    if (url.startsWith("/uploads/") || url.includes("/uploads/")) {
      return { type: "local" as const, label: "Local Server Storage" };
    }
    if (url.startsWith("/models/") || url.includes("/models/")) {
      return { type: "local" as const, label: "Bundled Local Model" };
    }
    return { type: "remote" as const, label: "Remote 3D Model" };
  };

  const handlePerformUpload = async (targetMode?: "cloud" | "local") => {
    const mode = targetMode || storageMode;
    if (!selectedGlbFile) {
      alert("Please select a .glb file to upload.");
      return;
    }

    const sizeMB = selectedGlbFile.size / (1024 * 1024);

    // 10MB Cloud limit check
    if (mode === "cloud" && selectedGlbFile.size > 10 * 1024 * 1024) {
      setStorageToast({
        type: "warning",
        title: "Cloud Limit Exceeded (10MB)",
        message: `Your file is ${sizeMB.toFixed(1)} MB. Cloudinary only supports files up to 10 MB. Please switch to Local Storage or compress the model.`,
      });
      return;
    }

    if (mode === "local" && selectedGlbFile.size > 150 * 1024 * 1024) {
      alert(
        `File exceeds maximum Local Storage limit (150 MB). Current size: ${sizeMB.toFixed(1)} MB.`
      );
      return;
    }

    setIsUploadingGlb(true);
    setUploadProgressText(
      mode === "cloud"
        ? "Uploading to Cloudinary CDN..."
        : "Saving to Local Server Storage..."
    );

    try {
      const formData = new FormData();
      formData.append("file", selectedGlbFile);

      const token =
        localStorage.getItem("auth_token") ||
        sessionStorage.getItem("auth_token");

      const endpoint =
        mode === "cloud"
          ? `${import.meta.env.VITE_API_URL}/api/upload/model`
          : `${import.meta.env.VITE_API_URL}/api/upload/model/local`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.url) {
        const cleanName = selectedGlbFile.name
          .replace(/\.glb$/i, "")
          .replace(/[_-]+/g, " ")
          .split(" ")
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

        if (isAdding) {
          setNewEquipment({
            ...newEquipment,
            modelUrl: data.url,
            name: newEquipment.name?.trim() ? newEquipment.name : cleanName,
          });
        } else {
          setEditingItem({
            ...editingItem!,
            modelUrl: data.url,
            name: editingItem?.name?.trim() ? editingItem.name : cleanName,
          });
        }

        setIsGlbModalOpen(false);
        const fileName = selectedGlbFile.name;
        setSelectedGlbFile(null);

        setStorageToast({
          type: "success",
          title: "3D Model Saved Successfully!",
          message:
            data.storage === "local"
              ? "Model saved to Local Server Storage (/uploads/models). Visible to all sales reps & users."
              : "Model saved to Cloud Storage (Cloudinary CDN).",
          details: `${fileName} • ${sizeMB.toFixed(2)} MB`,
        });

        setTimeout(() => {
          setStorageToast(null);
        }, 8000);
      } else {
        const errMsg =
          data?.error ||
          `Failed to upload to ${mode === "cloud" ? "Cloud" : "Local Storage"}.`;

        if (mode === "cloud" && (errMsg.includes("10MB") || sizeMB > 10)) {
          setStorageToast({
            type: "warning",
            title: "File Exceeds 10MB Cloud Limit",
            message:
              "Cloud storage failed because the file exceeds 10MB. Would you like to save it to Local Storage instead?",
          });
          setStorageMode("local");
        } else {
          alert(`Upload Error: ${errMsg}`);
        }
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      alert(`Upload failed: ${err.message || "Network error"}`);
    } finally {
      setIsUploadingGlb(false);
      setUploadProgressText("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
            className="bg-theme-bg border border-theme-border rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-theme-border flex justify-between items-center">
              <h3 className="text-lg font-bold">
                {isAdding ? "Add New Equipment" : `Edit ${editingItem?.name}`}
              </h3>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingItem(null);
                  setNewEquipment({
                    name: "",
                    category: "slides",
                    width: 5,
                    depth: 5,
                    height: 5,
                    color: "#14b8a6",
                    imageUrl: "",
                  });
                }}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 opacity-40" />
              </button>
            </div>

            {/* <form onSubmit={isAdding ? onAdd : onUpdate} className="p-6 space-y-6"> */}
            {/* Make form scrollable */}
            <form
              onSubmit={isAdding ? onAdd : onUpdate}
              className="p-4 lg:p-6 space-y-4 lg:space-y-6 overflow-y-auto flex-1"
            >
              {/* <div className="grid grid-cols-2 gap-6"> */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {/* Image upload — square aspect ratio */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                    Equipment Image
                  </label>
                  <div className="relative">
                    <div
                      className="aspect-square w-full bg-white/5 border-2 border-dashed border-theme-border rounded-xl overflow-hidden flex items-center justify-center cursor-pointer hover:border-brand-teal/50 transition-colors group"
                      onClick={() =>
                        document
                          .getElementById("equipment-image-upload")
                          ?.click()
                      }
                    >
                      {(
                        isAdding ? newEquipment.imageUrl : editingItem?.imageUrl
                      ) ? (
                        <img
                          //src={isAdding ? newEquipment.imageUrl ?? '' : editingItem?.imageUrl ?? ''}
                          src={
                            isAdding
                              ? newEquipment.imageUrl
                              : (editingItem?.imageUrl ?? "")
                          }
                          alt="Equipment"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 opacity-30 group-hover:opacity-60 transition-opacity">
                          <Upload className="w-8 h-8" />
                          <span className="text-[10px] uppercase tracking-widest">
                            Upload Image
                          </span>
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

                        const compressImage = (
                          file: File,
                          quality: number,
                        ): Promise<string> => {
                          return new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onload = (re) => {
                              const img = new Image();
                              img.onload = () => {
                                const canvas = document.createElement("canvas");

                                // Maintain square aspect ratio — use the smaller dimension
                                const size = Math.min(img.width, img.height);
                                canvas.width = size;
                                canvas.height = size;

                                const ctx = canvas.getContext("2d")!;
                                // Center crop to square
                                const offsetX = (img.width - size) / 2;
                                const offsetY = (img.height - size) / 2;
                                ctx.drawImage(
                                  img,
                                  offsetX,
                                  offsetY,
                                  size,
                                  size,
                                  0,
                                  0,
                                  size,
                                  size,
                                );

                                resolve(
                                  canvas.toDataURL("image/jpeg", quality),
                                );
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
                          const compressedSize = Math.round(
                            (compressed.length * 3) / 4,
                          ); // base64 to bytes

                          if (compressedSize > MAX_SIZE) {
                            // Try harder compression
                            const moreCompressed = await compressImage(
                              file,
                              0.4,
                            );
                            const moreCompressedSize = Math.round(
                              (moreCompressed.length * 3) / 4,
                            );

                            if (moreCompressedSize > MAX_SIZE) {
                              alert(
                                "Image is too large to compress under 1MB. Please use a smaller image.",
                              );
                              e.target.value = ""; // reset input
                              return;
                            }

                            alert(
                              "Image was automatically compressed to fit under 1MB.",
                            );
                            if (isAdding) {
                              setNewEquipment({
                                ...newEquipment,
                                imageUrl: moreCompressed,
                              });
                            } else {
                              setEditingItem({
                                ...editingItem!,
                                imageUrl: moreCompressed,
                              });
                            }
                            return;
                          }

                          alert(
                            "Image was automatically compressed to fit under 1MB.",
                          );
                          if (isAdding) {
                            setNewEquipment({
                              ...newEquipment,
                              imageUrl: compressed,
                            });
                          } else {
                            setEditingItem({
                              ...editingItem!,
                              imageUrl: compressed,
                            });
                          }
                          return;
                        }

                        // Image is within 1MB — still crop to square for consistency
                        const base64 = await compressImage(file, 0.9);
                        if (isAdding) {
                          setNewEquipment({
                            ...newEquipment,
                            imageUrl: base64,
                          });
                        } else {
                          setEditingItem({ ...editingItem!, imageUrl: base64 });
                        }
                      }}
                    />
                    {(isAdding
                      ? newEquipment.imageUrl
                      : editingItem?.imageUrl) && (
                      <button
                        type="button"
                        onClick={() =>
                          isAdding
                            ? setNewEquipment({ ...newEquipment, imageUrl: "" })
                            : setEditingItem({ ...editingItem!, imageUrl: "" })
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
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                      Equipment Name
                    </label>
                    <input
                      required
                      type="text"
                      value={isAdding ? newEquipment.name : editingItem?.name}
                      onChange={(e) =>
                        isAdding
                          ? setNewEquipment({
                              ...newEquipment,
                              name: e.target.value,
                            })
                          : setEditingItem({
                              ...editingItem!,
                              name: e.target.value,
                            })
                      }
                      className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                      placeholder="e.g. Spiral Slide"
                    />
                  </div>
                  {/* Major Category */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                      Major Category
                    </label>
                    <CategoryCombobox
                      value={
                        (isAdding
                          ? newEquipment.mainCategory
                          : editingItem?.mainCategory) || ""
                      }
                      onChange={(val) =>
                        isAdding
                          ? setNewEquipment({
                              ...newEquipment,
                              mainCategory: val,
                            })
                          : setEditingItem({
                              ...editingItem!,
                              mainCategory: val,
                            })
                      }
                      options={majorCategoryOptions}
                      placeholder="Select or type Major Category (e.g. Playarea, Factory)"
                      createLabel="Create new major category"
                    />
                  </div>

                  {/* Subcategory */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                      Subcategory
                    </label>
                    <CategoryCombobox
                      value={
                        (isAdding
                          ? newEquipment.category
                          : editingItem?.category) || ""
                      }
                      onChange={(val) =>
                        isAdding
                          ? setNewEquipment({
                              ...newEquipment,
                              category: val,
                            })
                          : setEditingItem({
                              ...editingItem!,
                              category: val,
                            })
                      }
                      options={
                        (isAdding
                          ? newEquipment.mainCategory
                          : editingItem?.mainCategory)
                          ? subcategoriesByMajor[
                              (
                                (isAdding
                                  ? newEquipment.mainCategory
                                  : editingItem?.mainCategory) || ""
                              ).toLowerCase()
                            ] || allSubcategoryOptions
                          : allSubcategoryOptions
                      }
                      placeholder="Select or type Subcategory (e.g. Slides, Pools, Warehouse)"
                      createLabel="Create new subcategory"
                    />
                    <p className="text-[9px] opacity-30">
                      Select or type a subcategory. It will be nested under the
                      selected Major Category in the Equipment Library.
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 2 — Dimensions */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                    Width (m)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    value={isAdding ? newEquipment.width : editingItem?.width}
                    onChange={(e) =>
                      isAdding
                        ? setNewEquipment({
                            ...newEquipment,
                            width: parseFloat(e.target.value),
                          })
                        : setEditingItem({
                            ...editingItem!,
                            width: parseFloat(e.target.value),
                          })
                    }
                    className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                    Depth (m)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    value={isAdding ? newEquipment.depth : editingItem?.depth}
                    onChange={(e) =>
                      isAdding
                        ? setNewEquipment({
                            ...newEquipment,
                            depth: parseFloat(e.target.value),
                          })
                        : setEditingItem({
                            ...editingItem!,
                            depth: parseFloat(e.target.value),
                          })
                    }
                    className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                    Height (m)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    value={isAdding ? newEquipment.height : editingItem?.height}
                    onChange={(e) =>
                      isAdding
                        ? setNewEquipment({
                            ...newEquipment,
                            height: parseFloat(e.target.value),
                          })
                        : setEditingItem({
                            ...editingItem!,
                            height: parseFloat(e.target.value),
                          })
                    }
                    className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                  />
                </div>
              </div>

              {/* Row 3 — Color + Model URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                    Color (Hex)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={isAdding ? newEquipment.color : editingItem?.color}
                      onChange={(e) =>
                        isAdding
                          ? setNewEquipment({
                              ...newEquipment,
                              color: e.target.value,
                            })
                          : setEditingItem({
                              ...editingItem!,
                              color: e.target.value,
                            })
                      }
                      className="w-10 h-10 bg-transparent border-none cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={isAdding ? newEquipment.color : editingItem?.color}
                      onChange={(e) =>
                        isAdding
                          ? setNewEquipment({
                              ...newEquipment,
                              color: e.target.value,
                            })
                          : setEditingItem({
                              ...editingItem!,
                              color: e.target.value,
                            })
                      }
                      className="flex-1 bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                      3D Model (.glb)
                    </label>
                    <span className="text-[10px] opacity-40">
                      Cloud (≤10MB) or Local Server Disk
                    </span>
                  </div>

                  {/* Show current file status */}
                  {(
                    isAdding ? newEquipment.modelUrl : editingItem?.modelUrl
                  ) ? (
                    <div className="p-3 bg-white/5 border border-theme-border rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Box className="w-4 h-4 text-brand-teal shrink-0" />
                          <span className="text-xs text-brand-teal font-medium truncate">
                            3D Model Attached
                          </span>
                          {(() => {
                            const url = isAdding
                              ? newEquipment.modelUrl
                              : editingItem?.modelUrl;
                            const info = getModelStorageInfo(url);
                            if (!info) return null;
                            return (
                              <span
                                className={clsx(
                                  "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0",
                                  info.type === "cloud"
                                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
                                )}
                              >
                                {info.type === "cloud" ? (
                                  <Cloud className="w-3 h-3" />
                                ) : (
                                  <HardDrive className="w-3 h-3" />
                                )}
                                {info.type === "cloud"
                                  ? "Cloud (CDN)"
                                  : "Local Storage"}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedGlbFile(null);
                              setIsGlbModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-[10px] font-semibold bg-white/10 hover:bg-white/20 rounded text-white/80 transition-colors flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Change
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              isAdding
                                ? setNewEquipment({
                                    ...newEquipment,
                                    modelUrl: "",
                                  })
                                : setEditingItem({
                                    ...editingItem!,
                                    modelUrl: "",
                                  })
                            }
                            className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                            title="Remove 3D Model"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] opacity-40 truncate font-mono">
                        {isAdding
                          ? newEquipment.modelUrl
                          : editingItem?.modelUrl}
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGlbFile(null);
                        setIsGlbModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-2.5 w-full border border-dashed border-theme-border rounded-xl px-4 py-3.5 cursor-pointer hover:border-brand-teal/60 hover:bg-white/[0.03] transition-all group text-left"
                    >
                      <Upload className="w-4 h-4 text-brand-teal group-hover:scale-110 transition-transform shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white/90">
                          Upload .glb 3D Model
                        </p>
                        <p className="text-[10px] opacity-50">
                          Choose Cloud Storage (≤10MB) or Local Storage (&gt;10MB)
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-brand-teal/10 text-brand-teal border border-brand-teal/20 font-bold uppercase tracking-wider">
                        Select
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Row 5 — Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-theme-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingItem(null);
                    setNewEquipment({
                      name: "",
                      category: "slides",
                      width: 5,
                      depth: 5,
                      height: 5,
                      color: "#14b8a6",
                      animationsEnabled: false,
                      imageUrl: "",
                    });
                  }}
                  className="px-6 py-2 text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand-teal text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-brand-teal/90 transition-all shadow-lg shadow-brand-teal/20"
                >
                  {isAdding ? "Add Equipment" : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {filteredEquipment.map((item) => (
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
                  : "bg-red-500/20 text-red-400",
              )}
            >
              {item.isActive !== false ? "Active" : "Inactive"}
            </div>

            {/* Image */}
            <div
              className={clsx(
                "aspect-square bg-black/40 flex items-center justify-center relative overflow-hidden",
                item.isActive === false && "opacity-40",
              )}
            >
              <img
                src={getEquipmentThumbnail(item)}
                alt={item.name}
                className="w-full h-full object-cover"
              />

              {/* Category */}
              <div className="absolute top-3 right-3 px-2 py-1 bg-brand-teal/20 text-brand-teal text-[8px] font-bold uppercase rounded flex items-center gap-1 backdrop-blur-sm">
                <span>{item.mainCategory || "Playarea"}</span>
                <span className="opacity-50">•</span>
                <span>{item.category}</span>
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
                  title={item.isActive !== false ? "Deactivate" : "Activate"}
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
              <h4 className="text-sm font-bold truncate">{item.name}</h4>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] opacity-40 font-mono">
                  {item.width}x{item.depth}x{item.height}m
                </p>
                {(() => {
                  const url = item.modelUrl || (item as any).model_url;
                  const info = getModelStorageInfo(url);
                  if (!info) return null;
                  return (
                    <div className="flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-medium">
                      {info.type === "cloud" ? (
                        <>
                          <Cloud className="w-2.5 h-2.5 text-sky-400" />
                          <span className="text-sky-400">Cloud (CDN)</span>
                        </>
                      ) : (
                        <>
                          <HardDrive className="w-2.5 h-2.5 text-emerald-400" />
                          <span className="text-emerald-400">Local Disk</span>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
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

      {/* ── Default Equipment Section ────────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold">
            DEFAULT EQUIPMENT (
            {DEFAULT_LIBRARY.filter((d) => !disabledDefaults.has(d.id)).length}{" "}
            ACTIVE)
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {DEFAULT_LIBRARY.filter(
            (item) =>
              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (item.mainCategory &&
                item.mainCategory
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase())),
          ).map((item) => {
            const isDisabled = disabledDefaults.has(item.id);
            const rawSub = (item.category || "").toLowerCase().trim();
            const derivedMajor =
              item.mainCategory ||
              ([
                "slides",
                "pools",
                "facilities",
                "amenities",
                "playarea",
                "play area",
              ].includes(rawSub)
                ? "Playarea"
                : "Factory");
            return (
              <div
                key={item.id}
                className={clsx(
                  "flex items-center justify-between p-3 bg-theme-card border rounded-xl transition-all",
                  isDisabled
                    ? "border-red-500/20 opacity-50"
                    : "border-theme-border",
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={getEquipmentThumbnail(item)}
                    alt={item.name}
                    className="w-8 h-8 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[9px] opacity-40 uppercase">
                        {derivedMajor} • {item.category}
                      </p>
                      {item.modelUrl && (
                        <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                          3D
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-2">
                  <button
                    onClick={() => onToggleDefault(item.id)}
                    aria-pressed={!isDisabled}
                    aria-label={
                      !isDisabled
                        ? `Deactivate ${item.name}`
                        : `Activate ${item.name}`
                    }
                    className={clsx(
                      "w-10 h-5 rounded-full transition-colors relative shrink-0",
                      !isDisabled ? "bg-emerald-500" : "bg-white/20",
                    )}
                  >
                    <div
                      className={clsx(
                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                        !isDisabled ? "left-6" : "left-1",
                      )}
                    />
                  </button>
                  <span className="text-xs font-semibold select-none">
                    {isDisabled ? "Activate" : "Deactivate"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── GLB Dual Storage Upload Modal ────────────────────────────────────── */}
      {isGlbModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-theme-bg border border-theme-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-theme-border flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-teal/20 text-brand-teal">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Upload 3D Model (.GLB)
                  </h3>
                  <p className="text-[10px] opacity-50">
                    Select storage location & upload your 3D asset
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isUploadingGlb}
                onClick={() => {
                  setIsGlbModalOpen(false);
                  setSelectedGlbFile(null);
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto">
              {/* Step 1: Storage Destination Choice */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                  1. Choose Storage Location
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Cloud Storage Card */}
                  <div
                    onClick={() => !isUploadingGlb && setStorageMode("cloud")}
                    className={clsx(
                      "p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden",
                      storageMode === "cloud"
                        ? "border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/10"
                        : "border-theme-border bg-white/5 hover:border-sky-500/40",
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                          <Cloud className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-sky-400">
                            Cloud Storage
                          </h4>
                          <p className="text-[9px] opacity-60">
                            Cloudinary CDN
                          </p>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        Max 10 MB
                      </span>
                    </div>
                    <p className="text-[10px] opacity-70 mt-2.5 leading-snug">
                      Fast global CDN delivery.{" "}
                      <strong className="text-sky-300">Max 10 MB limit</strong>{" "}
                      per file.
                    </p>
                  </div>

                  {/* Local Storage Card */}
                  <div
                    onClick={() => !isUploadingGlb && setStorageMode("local")}
                    className={clsx(
                      "p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden",
                      storageMode === "local"
                        ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                        : "border-theme-border bg-white/5 hover:border-emerald-500/40",
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                          <HardDrive className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-emerald-400">
                            Local Storage
                          </h4>
                          <p className="text-[9px] opacity-60">
                            Server Disk Route
                          </p>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Up to 150 MB
                      </span>
                    </div>
                    <p className="text-[10px] opacity-70 mt-2.5 leading-snug">
                      Saved on server disk.{" "}
                      <strong className="text-emerald-300">
                        For large models (&gt;10 MB)
                      </strong>
                      . Visible to sales reps.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2: File Picker */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                  2. Select 3D Model File (.glb / .gltf)
                </label>

                <input
                  id="modal-glb-file-picker"
                  type="file"
                  accept=".glb,.gltf"
                  className="hidden"
                  disabled={isUploadingGlb}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedGlbFile(file);
                    }
                    e.target.value = "";
                  }}
                />

                {!selectedGlbFile ? (
                  <div
                    onClick={() =>
                      !isUploadingGlb &&
                      document.getElementById("modal-glb-file-picker")?.click()
                    }
                    className="border-2 border-dashed border-theme-border hover:border-brand-teal/60 rounded-xl p-6 text-center cursor-pointer transition-all bg-white/[0.02] hover:bg-white/[0.05]"
                  >
                    <Upload className="w-7 h-7 opacity-40 mx-auto mb-2 text-brand-teal" />
                    <p className="text-xs font-medium text-white/90">
                      Click to choose a .glb 3D model
                    </p>
                    <p className="text-[10px] opacity-40 mt-1">
                      {storageMode === "cloud"
                        ? "Selected destination: Cloud (Max 10MB)"
                        : "Selected destination: Local Server Storage (Up to 150MB)"}
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-white/5 border border-theme-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-brand-teal/20 text-brand-teal">
                          <Box className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-white">
                            {selectedGlbFile.name}
                          </p>
                          <p className="text-[10px] opacity-50 font-mono">
                            {(selectedGlbFile.size / (1024 * 1024)).toFixed(2)}{" "}
                            MB
                          </p>
                        </div>
                      </div>
                      {!isUploadingGlb && (
                        <button
                          type="button"
                          onClick={() => setSelectedGlbFile(null)}
                          className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                          title="Change file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* 10MB Warning alert if Cloud is chosen and file > 10MB */}
                    {storageMode === "cloud" &&
                      selectedGlbFile.size > 10 * 1024 * 1024 && (
                        <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 space-y-2">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div className="text-[11px] leading-relaxed">
                              <strong>
                                File size is{" "}
                                {(
                                  selectedGlbFile.size /
                                  (1024 * 1024)
                                ).toFixed(1)}{" "}
                                MB
                              </strong>{" "}
                              — exceeds Cloudinary's 10 MB limit. Cloud storage
                              will reject this file.
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setStorageMode("local")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shadow"
                            >
                              <HardDrive className="w-3.5 h-3.5" /> Switch to
                              Local Storage
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                document
                                  .getElementById("modal-glb-file-picker")
                                  ?.click()
                              }
                              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs rounded-lg text-white/80 transition-colors"
                            >
                              Choose Smaller File
                            </button>
                          </div>
                        </div>
                      )}

                    {/* Local Storage Confirmation notice */}
                    {storageMode === "local" && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          File will be stored in server disk storage
                          (/uploads/models) and rendered smoothly for sales reps.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-theme-border bg-white/[0.02] flex items-center justify-between">
              <button
                type="button"
                disabled={isUploadingGlb}
                onClick={() => {
                  setIsGlbModalOpen(false);
                  setSelectedGlbFile(null);
                }}
                className="px-4 py-2 text-xs font-semibold opacity-60 hover:opacity-100 transition-opacity"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  !selectedGlbFile ||
                  isUploadingGlb ||
                  (storageMode === "cloud" &&
                    selectedGlbFile.size > 10 * 1024 * 1024)
                }
                onClick={() => handlePerformUpload()}
                className={clsx(
                  "px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-2",
                  !selectedGlbFile ||
                    (storageMode === "cloud" &&
                      selectedGlbFile.size > 10 * 1024 * 1024)
                    ? "bg-white/10 text-white/40 cursor-not-allowed"
                    : storageMode === "cloud"
                      ? "bg-sky-500 text-white hover:bg-sky-400 shadow-sky-500/20"
                      : "bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-500/20",
                )}
              >
                {isUploadingGlb ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{uploadProgressText || "Uploading..."}</span>
                  </>
                ) : (
                  <>
                    {storageMode === "cloud" ? (
                      <Cloud className="w-3.5 h-3.5" />
                    ) : (
                      <HardDrive className="w-3.5 h-3.5" />
                    )}
                    <span>
                      Upload to{" "}
                      {storageMode === "cloud" ? "Cloud" : "Local Storage"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ─── Floating Toast Notification ──────────────────────────────────────── */}
      {storageToast && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={clsx(
            "fixed top-6 right-6 z-[70] p-4 rounded-2xl shadow-2xl border max-w-sm flex items-start gap-3 backdrop-blur-xl",
            storageToast.type === "success" &&
              "bg-emerald-950/90 border-emerald-500/40 text-emerald-100",
            storageToast.type === "warning" &&
              "bg-amber-950/90 border-amber-500/40 text-amber-100",
            storageToast.type === "error" &&
              "bg-red-950/90 border-red-500/40 text-red-100",
          )}
        >
          {storageToast.type === "success" && (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          {storageToast.type === "warning" && (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          {storageToast.type === "error" && (
            <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold leading-tight">
              {storageToast.title}
            </h4>
            <p className="text-[11px] opacity-80 mt-1 leading-snug">
              {storageToast.message}
            </p>
            {storageToast.details && (
              <p className="text-[9px] opacity-60 font-mono mt-1.5">
                {storageToast.details}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setStorageToast(null)}
            className="p-1 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ─── Archive Modal ────────────────────────────────────────────────────────────
interface ArchiveModalProps {
  user: User;
  allReps: User[];
  onConfirm: (
    assignments: Record<string, string>,
    bulkTargetId?: string,
  ) => void;
  onCancel: () => void;
}

function ArchiveModal({
  user,
  allReps,
  onConfirm,
  onCancel,
}: ArchiveModalProps) {
  const [projects, setProjects] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [bulkTargetId, setBulkTargetId] = React.useState("");
  const [perProjectAssign, setPerProjectAssign] = React.useState<
    Record<string, string>
  >({});
  const [mode, setMode] = React.useState<"bulk" | "individual">("bulk");

  const otherActiveReps = allReps.filter(
    (r) =>
      r.id !== user.id && r.role === "sales_rep" && r.status !== "archived",
  );

  React.useEffect(() => {
    authFetch(`/api/users/${user.id}/projects`)
      .then((r) => r.json())
      .then((data) => {
        setProjects(data);
        const init: Record<string, string> = {};
        data.forEach((p: any) => (init[p.id] = ""));
        setPerProjectAssign(init);
      })
      .finally(() => setLoading(false));
  }, [user.id]);

  const canConfirm =
    projects.length === 0 ||
    (mode === "bulk" && bulkTargetId !== "") ||
    (mode === "individual" &&
      Object.values(perProjectAssign).every((v) => v !== ""));

  const handleConfirm = () => {
    if (mode === "bulk") {
      const assignments: Record<string, string> = {};
      projects.forEach((p) => (assignments[p.id] = bulkTargetId));
      onConfirm(assignments, bulkTargetId);
    } else {
      onConfirm(perProjectAssign);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-theme-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
              <Archive className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-base">Archive Sales Rep</h2>
              <p className="text-xs opacity-50">
                {user.name} · {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/5 rounded-lg"
          >
            <X className="w-4 h-4 opacity-50" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <div className="py-8 text-center text-sm opacity-40">
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-400">
                  No projects assigned
                </p>
                <p className="text-xs opacity-60 mt-0.5">
                  This rep has no projects. You can archive them immediately.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <FolderOpen className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-400">
                    {projects.length} project{projects.length > 1 ? "s" : ""}{" "}
                    must be reassigned
                  </p>
                  <p className="text-xs opacity-60 mt-0.5">
                    Reassign all projects before archiving. Logs will be
                    preserved.
                  </p>
                </div>
              </div>

              {/* Mode toggle */}
              <div className="flex rounded-xl border border-theme-border overflow-hidden text-xs font-bold uppercase tracking-widest">
                <button
                  onClick={() => setMode("bulk")}
                  className={clsx(
                    "flex-1 py-2.5 transition-all",
                    mode === "bulk"
                      ? "bg-brand-teal text-white"
                      : "opacity-40 hover:opacity-70",
                  )}
                >
                  Bulk — assign all to one rep
                </button>
                <button
                  onClick={() => setMode("individual")}
                  className={clsx(
                    "flex-1 py-2.5 transition-all",
                    mode === "individual"
                      ? "bg-brand-teal text-white"
                      : "opacity-40 hover:opacity-70",
                  )}
                >
                  Individual — assign each
                </button>
              </div>

              {mode === "bulk" ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                    Reassign all {projects.length} projects to
                  </label>
                  <select
                    value={bulkTargetId}
                    onChange={(e) => setBulkTargetId(e.target.value)}
                    className="w-full bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
                  >
                    <option value="">— Select a sales rep —</option>
                    {otherActiveReps.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.email})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {projects.map((p) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">
                          {p.name}
                        </p>
                      </div>
                      <select
                        value={perProjectAssign[p.id] || ""}
                        onChange={(e) =>
                          setPerProjectAssign((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                        className="w-48 bg-white/5 border border-theme-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
                      >
                        <option value="">— Select rep —</option>
                        {otherActiveReps.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-theme-border">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-semibold opacity-50 hover:opacity-100 transition-opacity"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-black font-bold text-sm rounded-xl transition-all flex items-center gap-2"
          >
            <Archive className="w-4 h-4" />
            {projects.length > 0 ? "Reassign & Archive" : "Archive Rep"}
          </button>
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
  setSalesRepCount,
}: {
  tenant: Tenant;
  isAdding: boolean;
  setIsAdding: (b: boolean) => void;
  salesRepCount: number;
  setSalesRepCount: (count: number) => void;
}) {
  const [users, setUsers] = React.useState<User[]>([]);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [newUser, setNewUser] = React.useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    companyName: tenant.name,
  });

  React.useEffect(() => {
    if (isAdding) {
      setNewUser({
        name: "",
        email: "",
        phone: "",
        password: "",
        companyName: tenant.name,
      });
    }
  }, [isAdding, tenant.name]);

  const [editFormData, setEditFormData] = React.useState({
    name: "",
    phone: "",
    password: "",
  });
  const [archiveTarget, setArchiveTarget] = React.useState<User | null>(null);
  const [showArchived, setShowArchived] = React.useState(false);

  const fetchSalesRepCount = async () => {
    const res = await authFetch(`/api/tenant/${tenant.id}/users`);
    if (res.ok) {
      const data = await res.json();
      const count = data.filter(
        (u: any) =>
          u.role === "sales_rep" &&
          u.status !== "archived" &&
          u.is_active !== false,
      ).length;
      setSalesRepCount(count);
    }
  };

  const fetchUsers = async () => {
    const res = await authFetch(`/api/tenant/${tenant.id}/users`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
      setSalesRepCount(
        data.filter(
          (u: any) =>
            u.role === "sales_rep" &&
            u.status !== "archived" &&
            u.is_active !== false,
        ).length,
      );
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, [tenant.id]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = uuidv4();
    const res = await authFetch(`/api/tenant/${tenant.id}/users`, {
      method: "POST",
      body: JSON.stringify({
        id: userId,
        email: newUser.email,
        password: newUser.password,
        role: "sales_rep",
        name: newUser.name,
        phone: newUser.phone,
      }),
    });
    if (res.ok) {
      setNewUser({
        name: "",
        email: "",
        phone: "",
        password: "",
        companyName: tenant.name,
      });
      setIsAdding(false);
      fetchUsers();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to add user");
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    const res = await authFetch(`/api/users/${editingUser.id}`, {
      method: "PUT",
      body: JSON.stringify(editFormData),
    });
    if (res.ok) {
      setEditingUser(null);
      fetchUsers();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to update user");
    }
  };

  const handleToggleActive = async (u: User) => {
    const currentlyActive = u.status !== "inactive" && u.is_active !== false;
    const confirmMsg = currentlyActive
      ? `Deactivate ${u.name}? They will not be able to log in.`
      : `Activate ${u.name}? They will be able to log in again.`;
    if (!confirm(confirmMsg)) return;

    const originalCount = salesRepCount;
    setUsers((prev) =>
      prev.map((usr) =>
        usr.id === u.id
          ? {
              ...usr,
              is_active: !currentlyActive,
              status: currentlyActive ? "inactive" : "active",
            }
          : usr,
      ),
    );
    setSalesRepCount(salesRepCount + (currentlyActive ? -1 : 1));

    const res = await authFetch(`/api/users/${u.id}/toggle-active`, {
      method: "PATCH",
    });
    if (!res.ok) {
      setUsers((prev) =>
        prev.map((usr) =>
          usr.id === u.id
            ? {
                ...usr,
                is_active: currentlyActive,
                status: currentlyActive ? "active" : "inactive",
              }
            : usr,
        ),
      );
      setSalesRepCount(originalCount);
      alert("Failed to update status");
    }
  };

  const handleArchive = async (assignments: Record<string, string>) => {
    if (!archiveTarget) return;
    try {
      // Reassign each project
      for (const [projectId, newUserId] of Object.entries(assignments)) {
        if (newUserId) {
          const r = await authFetch(`/api/projects/${projectId}/reassign`, {
            method: "PATCH",
            body: JSON.stringify({ newUserId }),
          });
          if (!r.ok) {
            const d = await r.json().catch(() => ({}));
            alert(
              `Failed to reassign a project: ${d.error || "Unknown error"}`,
            );
            return;
          }
        }
      }
      // Archive the user
      const res = await authFetch(`/api/users/${archiveTarget.id}/archive`, {
        method: "PATCH",
      });
      if (res.ok) {
        setArchiveTarget(null);
        fetchUsers();
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Failed to archive user");
      }
    } catch {
      alert("An error occurred");
    }
  };

  const startEditing = (user: User) => {
    setEditingUser(user);
    setEditFormData({ name: user.name, phone: user.phone || "", password: "" });
  };

  const activeReps = users.filter(
    (u) => u.role === "sales_rep" && u.status !== "archived",
  );
  const archivedReps = users.filter(
    (u) => u.role === "sales_rep" && u.status === "archived",
  );
  const admins = users.filter((u) => u.role !== "sales_rep");

  return (
    <div className="space-y-6">
      {/* Archive Modal */}
      {archiveTarget && (
        <ArchiveModal
          user={archiveTarget}
          allReps={users}
          onConfirm={handleArchive}
          onCancel={() => setArchiveTarget(null)}
        />
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-theme-border">
              <h2 className="font-bold text-base">Edit Sales Rep</h2>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 hover:bg-white/5 rounded-lg"
              >
                <X className="w-4 h-4 opacity-50" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                  Name
                </label>
                <input
                  className="w-full mt-1 bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                  Phone
                  <span className="text-brand-teal/60 normal-case tracking-normal">
                    10 digits
                  </span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="\d{10}"
                  placeholder="10-digit mobile number"
                  className="w-full mt-1 bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
                  value={editFormData.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setEditFormData((p) => ({ ...p, phone: val }));
                  }}
                />
                {editFormData.phone && editFormData.phone.length !== 10 && (
                  <p className="text-[10px] text-red-400 mt-1 ml-1">
                    Must be exactly 10 digits
                  </p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                  New Password (optional)
                </label>
                <input
                  type="password"
                  className="w-full mt-1 bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
                  placeholder="Leave blank to keep current"
                  value={editFormData.password}
                  onChange={(e) =>
                    setEditFormData((p) => ({ ...p, password: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-theme-border">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2.5 text-sm font-semibold opacity-50 hover:opacity-100"
              >
                Cancel
              </button>
              <button
                onClick={handleEditUser}
                className="px-5 py-2.5 bg-brand-teal text-white font-bold text-sm rounded-xl hover:bg-brand-teal/90 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Rep Form */}
      {isAdding && (
        <div className="bg-theme-card border border-brand-teal/30 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-sm">Add New Sales Rep</h3>
          <form
            onSubmit={handleAddUser}
            className="space-y-4"
            autoComplete="off"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                  Name
                </label>
                <input
                  required
                  className="w-full mt-1 bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                  Email
                </label>
                <input
                  required
                  type="email"
                  name="new-user-email"
                  autoComplete="off"
                  className="w-full mt-1 bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                  Phone
                  <span className="text-brand-teal/60 normal-case tracking-normal">
                    10 digits
                  </span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="\d{10}"
                  placeholder="10-digit mobile number"
                  className="w-full mt-1 bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
                  value={newUser.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setNewUser((p) => ({ ...p, phone: val }));
                  }}
                />
                {newUser.phone && newUser.phone.length !== 10 && (
                  <p className="text-[10px] text-red-400 mt-1 ml-1">
                    Must be exactly 10 digits
                  </p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                  Password
                </label>
                <input
                  required
                  type="password"
                  name="new-user-password"
                  autoComplete="new-password"
                  className="w-full mt-1 bg-white/5 border border-theme-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser((p) => ({ ...p, password: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2.5 text-sm font-semibold opacity-50 hover:opacity-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-brand-teal text-white font-bold text-sm rounded-xl hover:bg-brand-teal/90 transition-all"
              >
                Add Rep
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Reps */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold opacity-40 uppercase tracking-widest">
          Sales Reps ({activeReps.length})
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {activeReps.map((u) => {
            const isActive = u.status !== "inactive" && u.is_active !== false;
            return (
              <div
                key={u.id}
                className={clsx(
                  "p-3 lg:p-4 bg-theme-card border rounded-xl flex items-center justify-between gap-2 group transition-all",
                  isActive
                    ? "border-theme-border"
                    : "border-red-500/20 opacity-70",
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={clsx(
                      "w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center font-bold shrink-0 text-white",
                      isActive
                        ? "bg-brand-teal/10 text-brand-teal"
                        : "bg-red-500/10 text-red-400",
                    )}
                  >
                    {u.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm truncate">{u.name}</h4>
                      <span
                        className={clsx(
                          "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                          isActive
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-red-500/15 text-red-400",
                        )}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 lg:gap-3 mt-1 flex-wrap">
                      <span className="text-[10px] opacity-40 truncate max-w-[120px] lg:max-w-none">
                        {u.email}
                      </span>
                      <span className="text-[10px] opacity-40 hidden lg:inline">
                        ·
                      </span>
                      <span className="text-[10px] opacity-40 hidden lg:inline">
                        {u.phone || "No phone"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => handleToggleActive(u)}
                    className={clsx(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border",
                      isActive
                        ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20",
                    )}
                    title={isActive ? "Deactivate" : "Activate"}
                  >
                    {isActive ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {isActive ? "Deactivate" : "Activate"}
                    </span>
                  </button>
                  <button
                    onClick={() => setArchiveTarget(u)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all"
                    title="Archive rep"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Archive</span>
                  </button>
                  <button
                    onClick={() => startEditing(u)}
                    className="p-2 hover:bg-brand-teal/10 text-brand-teal rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {activeReps.length === 0 && (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 opacity-10 mx-auto mb-3" />
              <p className="text-sm opacity-40 italic">No active sales reps.</p>
            </div>
          )}
        </div>
      </div>

      {/* Archived Reps */}
      {archivedReps.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="flex items-center gap-2 text-xs font-bold opacity-40 uppercase tracking-widest hover:opacity-70 transition-opacity"
          >
            <ChevronDown
              className={clsx(
                "w-4 h-4 transition-transform",
                showArchived && "rotate-180",
              )}
            />
            Archived ({archivedReps.length})
          </button>
          {showArchived && (
            <div className="grid grid-cols-1 gap-3">
              {archivedReps.map((u) => (
                <div
                  key={u.id}
                  className="p-3 lg:p-4 bg-theme-card border border-dashed border-theme-border rounded-xl flex items-center gap-3 opacity-50"
                >
                  <div className="w-8 h-8 bg-gray-500/10 rounded-full flex items-center justify-center text-gray-400 font-bold shrink-0">
                    {u.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm truncate">{u.name}</h4>
                      <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-400">
                        Archived
                      </span>
                    </div>
                    <p className="text-[10px] opacity-40 truncate mt-0.5">
                      {u.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  trend,
  icon,
}: {
  label: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
}) {
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
        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
          {label}
        </p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
    </div>
  );
}

function SettingsTab({
  theme,
  onThemeChange,
}: {
  theme: "dark" | "light";
  onThemeChange: (t: "dark" | "light") => void;
}) {
  return (
    <div className="max-w-2xl space-y-8 overflow-y-auto">
      <div className="p-6 bg-theme-card border border-theme-border rounded-2xl">
        <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">
          Appearance
        </h3>
        {/* <div className="grid grid-cols-2 gap-4"> */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <button
            onClick={() => onThemeChange("dark")}
            className={clsx(
              "p-4 rounded-xl border transition-all flex flex-col items-center gap-3",
              theme === "dark"
                ? "bg-brand-teal/20 border-brand-teal text-brand-teal"
                : "bg-white/5 border-theme-border opacity-40 hover:opacity-100 hover:bg-white/10",
            )}
          >
            <Moon className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Dark Mode
            </span>
          </button>
          <button
            onClick={() => onThemeChange("light")}
            className={clsx(
              "p-4 rounded-xl border transition-all flex flex-col items-center gap-3",
              theme === "light"
                ? "bg-brand-teal/20 border-brand-teal text-brand-teal"
                : "bg-white/5 border-theme-border opacity-40 hover:opacity-100 hover:bg-white/10",
            )}
          >
            <Sun className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Light Mode
            </span>
          </button>
        </div>
      </div>

      {/* <div className="p-6 bg-theme-card border border-theme-border rounded-2xl">
        <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">
          Account Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Email Alerts</p>
              <p className="text-[10px] opacity-40 uppercase tracking-widest">
                Receive updates on project status
              </p>
            </div>
            <div className="w-10 h-5 bg-brand-teal rounded-full relative">
              <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
}

function ProjectStatsTab({
  projectStats,
  tenant,
}: {
  projectStats: any[];
  tenant: Tenant;
}) {
  const totalProjects = projectStats.reduce(
    (sum, s) => sum + parseInt(s.project_count),
    0,
  );

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userProjects, setUserProjects] = useState<Record<string, any[]>>({});
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(
    null,
  );
  const [projectData, setProjectData] = useState<Record<string, any>>({});

  const handleExpandUser = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);
    if (!userProjects[userId]) {
      const res = await authFetch(
        `/api/projects?tenantId=${tenant.id}&userId=${userId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setUserProjects((prev) => ({ ...prev, [userId]: data }));
      }
    }
  };

  const handleExpandProject = async (projectId: string) => {
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null);
      return;
    }
    setExpandedProjectId(projectId);
    if (!projectData[projectId]) {
      const res = await authFetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProjectData((prev) => ({ ...prev, [projectId]: data.data || data }));
      }
    }
  };

  const [customEquipment, setCustomEquipment] = useState<any[]>([]);

  useEffect(() => {
    const fetchCustomEquipment = async () => {
      const res = await authFetch(`/api/tenant/${tenant.id}/equipment`);
      if (res.ok) {
        const data = await res.json();
        setCustomEquipment(data);
      }
    };
    fetchCustomEquipment();
  }, [tenant.id]);

  const equipmentLookup = React.useMemo(() => {
    const lookup: Record<
      string,
      { name: string; width: number; depth: number; height: number }
    > = {
      slide_small: { name: "Small Slide", width: 4, depth: 2, height: 3 },
      slide_large: { name: "Large Slide", width: 8, depth: 3, height: 6 },
      tower_3d: { name: "Tower", width: 5, depth: 5, height: 10 },
      duck_3d: { name: "Duck", width: 2, depth: 2, height: 2 },
      wave_pool: { name: "Wave Pool", width: 20, depth: 15, height: 2 },
      lazy_river: { name: "Lazy River", width: 30, depth: 5, height: 1.5 },
      splash_pad: { name: "Splash Pad", width: 10, depth: 10, height: 0.5 },
      pump_station: { name: "Pump Station", width: 5, depth: 5, height: 4 },
      ticket_booth: { name: "Ticket Booth", width: 3, depth: 3, height: 3 },
      locker_block: { name: "Locker Block", width: 10, depth: 4, height: 3 },
      food_kiosk: { name: "Food Kiosk", width: 4, depth: 4, height: 3 },
      seating_area: { name: "Seating Area", width: 6, depth: 6, height: 1 },
    };
    // Merge custom equipment from DB
    (customEquipment || []).forEach((eq: any) => {
      lookup[eq.id] = {
        name: eq.name,
        width: eq.width,
        depth: eq.depth,
        height: eq.height,
      };
    });
    return lookup;
  }, [customEquipment]);

  const getEquipmentList = (pd: any) => {
    if (!pd?.objects) return [];
    const counts: Record<string, number> = {};
    pd.objects.forEach((obj: any) => {
      counts[obj.type] = (counts[obj.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => {
      const def = equipmentLookup[type];
      return {
        type,
        name: def?.name || type,
        count,
        width: def?.width || 0,
        depth: def?.depth || 0,
        height: def?.height || 0,
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Total Projects"
          value={totalProjects.toString()}
          trend="across all reps"
          icon={<FolderOpen className="w-5 h-5" />}
        />
        <StatCard
          label="Sales Reps"
          value={projectStats.length.toString()}
          trend="in your team"
          icon={<Users className="w-5 h-5" />}
        />
      </div>

      <div className="p-6 bg-theme-card border border-theme-border rounded-2xl">
        <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">
          Projects per Sales Rep
        </h3>
        {projectStats.length === 0 ? (
          <p className="text-sm opacity-30 text-center py-8">
            No sales reps found
          </p>
        ) : (
          <div className="space-y-3">
            {projectStats.map((rep) => (
              <div
                key={rep.user_id}
                className="bg-white/5 border border-theme-border rounded-xl overflow-hidden"
              >
                {/* Rep row — clickable */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => handleExpandUser(rep.user_id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-teal/10 flex items-center justify-center text-brand-teal font-bold text-sm">
                      {rep.user_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{rep.user_name}</p>
                      <p className="text-[11px] opacity-30">{rep.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-brand-teal">
                        {rep.project_count}
                      </p>
                      <p className="text-[10px] opacity-30 uppercase tracking-wider">
                        projects
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 opacity-30 transition-transform ${expandedUserId === rep.user_id ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>

                {/* Expanded projects */}
                {expandedUserId === rep.user_id && (
                  <div className="border-t border-white/10 px-4 pb-4">
                    <p className="text-[10px] uppercase tracking-widest opacity-30 mt-3 mb-3">
                      Projects
                    </p>
                    {!userProjects[rep.user_id] ? (
                      <p className="text-xs opacity-30">Loading...</p>
                    ) : userProjects[rep.user_id].length === 0 ? (
                      <p className="text-xs opacity-30 italic">
                        No projects yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {userProjects[rep.user_id].map((project: any) => (
                          <div
                            key={project.id}
                            className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
                          >
                            <div
                              className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
                              onClick={() => handleExpandProject(project.id)}
                            >
                              <div>
                                <p className="text-xs font-semibold text-white">
                                  {project.name}
                                </p>
                                {project.client_name && (
                                  <p className="text-[10px] text-brand-teal/70 mt-0.5">
                                    {project.client_name}
                                  </p>
                                )}
                                <p className="text-[10px] opacity-30 mt-0.5">
                                  {project.updated_at
                                    ? `Updated ${new Date(project.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                                    : `Created ${new Date(project.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                                </p>
                              </div>
                              <ChevronDown
                                className={`w-3.5 h-3.5 opacity-30 transition-transform shrink-0 ${expandedProjectId === project.id ? "rotate-180" : ""}`}
                              />
                            </div>

                            {expandedProjectId === project.id && (
                              <div className="border-t border-white/10 px-3 pb-3">
                                <p className="text-[10px] uppercase tracking-widest opacity-30 mt-2 mb-2">
                                  Equipment Used
                                </p>
                                {!projectData[project.id] ? (
                                  <p className="text-xs opacity-30">
                                    Loading...
                                  </p>
                                ) : getEquipmentList(projectData[project.id])
                                    .length === 0 ? (
                                  <p className="text-xs opacity-30">
                                    No equipment placed.
                                  </p>
                                ) : (
                                  <div className="space-y-1">
                                    {getEquipmentList(
                                      projectData[project.id],
                                    ).map((eq) => (
                                      <div
                                        key={eq.type}
                                        className="flex items-center justify-between bg-white/5 rounded px-2 py-1.5"
                                      >
                                        <div>
                                          <span className="text-xs font-medium text-white">
                                            {eq.name}
                                          </span>
                                          <span className="text-[10px] opacity-30 ml-1">
                                            ({eq.width}m×{eq.depth}m×{eq.height}
                                            m)
                                          </span>
                                        </div>
                                        <span className="text-xs font-bold text-brand-teal">
                                          ×{eq.count}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileTab({
  user,
  onUserUpdate,
  onProfileSaved,
  onShowToast,
}: {
  user: User;
  onUserUpdate?: (user: User) => void;
  onProfileSaved?: () => void;
  onShowToast?: (message: string, type?: "success" | "error") => void;
}) {
  const [profileData, setProfileData] = useState({
    name: user.name,
    phone: user.phone || "",
    password: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await authFetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileData.name,
          phone: profileData.phone,
          password: profileData.password || undefined,
        }),
      });
      if (res.ok) {
        const updatedUser: User = {
          ...user,
          name: profileData.name,
          phone: profileData.phone,
        };
        onUserUpdate?.(updatedUser);
        onProfileSaved?.();
        onShowToast?.("Profile updated successfully!");
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
        <h3 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-6">
          Profile Settings
        </h3>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* <div className="grid grid-cols-2 gap-4"> */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                Full Name
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) =>
                  setProfileData({ ...profileData, name: e.target.value })
                }
                className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                Mobile Number
              </label>
              <input
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                type="tel"
                value={profileData.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setProfileData({ ...profileData, phone: val });
                }}
                className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
              New Password (Optional)
            </label>
            <input
              type="password"
              value={profileData.password}
              onChange={(e) =>
                setProfileData({ ...profileData, password: e.target.value })
              }
              className="w-full bg-white/5 border border-theme-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
              placeholder="Leave blank to keep current"
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-brand-teal text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-brand-teal/90 transition-all disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Update Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
