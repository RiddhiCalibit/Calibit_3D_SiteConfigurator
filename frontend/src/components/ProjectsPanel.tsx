import React, { useState } from "react";
import { authFetch } from "../utils/api";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  FolderOpen,
  Trash2,
  Share2,
  Clock,
  Plus,
  Check,
  Copy,
  ChevronDown,
  Building2,
} from "lucide-react";
import { User, Tenant } from "../types";

const DEFAULT_EQUIPMENT: Record<
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
const getEquipmentList = (
  projectData: any,
  equipmentLookup: Record<
    string,
    { name: string; width: number; depth: number; height: number }
  >,
) => {
  if (!projectData?.objects) return [];
  const counts: Record<string, number> = {};
  projectData.objects.forEach((obj: any) => {
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

// // All equipment definitions for lookup
// const ALL_EQUIPMENT: Record<
//   string,
//   { name: string; width: number; depth: number; height: number }
// > = {
//   slide_small: { name: "Small Slide", width: 4, depth: 2, height: 3 },
//   slide_large: { name: "Large Slide", width: 8, depth: 3, height: 6 },
//   tower_3d: { name: "Tower", width: 5, depth: 5, height: 10 },
//   duck_3d: { name: "Duck", width: 2, depth: 2, height: 2 },
//   wave_pool: { name: "Wave Pool", width: 20, depth: 15, height: 2 },
//   lazy_river: { name: "Lazy River", width: 30, depth: 5, height: 1.5 },
//   splash_pad: { name: "Splash Pad", width: 10, depth: 10, height: 0.5 },
//   pump_station: { name: "Pump Station", width: 5, depth: 5, height: 4 },
//   ticket_booth: { name: "Ticket Booth", width: 3, depth: 3, height: 3 },
//   locker_block: { name: "Locker Block", width: 10, depth: 4, height: 3 },
//   food_kiosk: { name: "Food Kiosk", width: 4, depth: 4, height: 3 },
//   seating_area: { name: "Seating Area", width: 6, depth: 6, height: 1 },
// };

// // Groups objects by type and returns counted equipment list
// function getEquipmentList(projectData: any): {
//   type: string;
//   name: string;
//   count: number;
//   width: number;
//   depth: number;
//   height: number;
// }[] {
//   if (!projectData?.objects) return [];
//   const counts: Record<string, number> = {};
//   projectData.objects.forEach((obj: any) => {
//     counts[obj.type] = (counts[obj.type] || 0) + 1;
//   });
//   return Object.entries(counts).map(([type, count]) => {
//     const def = ALL_EQUIPMENT[type];
//     return {
//       type,
//       name: def?.name || type,
//       count,
//       width: def?.width || 0,
//       depth: def?.depth || 0,
//       height: def?.height || 0,
//     };
//   });
// }
interface Project {
  id: string;
  name: string;
  tenant_id: string;
  user_id: string;
  client_name: string | null;
  created_at: string;
  updated_at: string | null;
}

interface ProjectsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  user: User | null;
  tenant: Tenant | null;
  onOpenProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onRefresh: () => void;
  currentProjectId: string | null;
  onNewProject: () => void;
  customEquipment: any[];
}

export const ProjectsPanel: React.FC<ProjectsPanelProps> = ({
  isOpen,
  onClose,
  projects,
  user,
  tenant,
  onOpenProject,
  onDeleteProject,
  onRefresh,
  currentProjectId,
  onNewProject,
  customEquipment = [],
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareUrls, setShareUrls] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<Record<string, any>>({});

  const handleExpand = async (projectId: string) => {
    if (expandedId === projectId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(projectId);
    // Only fetch if not already loaded
    if (!projectData[projectId]) {
      try {
        const res = await authFetch(`/api/projects/${projectId}`);
        if (res.ok) {
          const data = await res.json();
          setProjectData((prev) => ({ ...prev, [projectId]: data.data }));
        }
      } catch {
        console.error("Failed to load project data");
      }
    }
  };

  const handleDelete = async (projectId: string, projectName: string) => {
    if (!confirm(`Delete "${projectName}"? This cannot be undone.`)) return;
    setDeletingId(projectId);
    try {
      const res = await authFetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDeleteProject(projectId);
        onRefresh();
      } else {
        alert("Failed to delete project.");
      }
    } catch {
      alert("Failed to delete project.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleShare = async (projectId: string) => {
    // If already have the URL, just show it
    if (shareUrls[projectId]) {
      setSharingId(projectId);
      return;
    }
    setSharingId(projectId);
    try {
      const res = await authFetch(`/api/projects/${projectId}/share`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setShareUrls((prev) => ({ ...prev, [projectId]: data.shareUrl }));
      } else {
        alert("Failed to generate share link.");
        setSharingId(null);
      }
    } catch {
      alert("Failed to generate share link.");
      setSharingId(null);
    }
  };

  const handleCopy = async (projectId: string) => {
    const url = shareUrls[projectId];
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopiedId(projectId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isActive = (project: Project) => {
    const lastDate = project.updated_at || project.created_at;
    if (!lastDate) return false;
    const diff = Date.now() - new Date(lastDate).getTime();
    return diff < 5 * 24 * 60 * 60 * 1000; // 5 days
  };

  // Build merged equipment lookup — default + custom from DB
  const equipmentLookup = React.useMemo(() => {
    const lookup: Record<
      string,
      { name: string; width: number; depth: number; height: number }
    > = {
      ...DEFAULT_EQUIPMENT,
    };
    console.log("customEquipment received:", customEquipment);
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0f1623] border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white">
                  My Projects
                </h2>
                <p className="text-xs opacity-40 mt-0.5">
                  {projects.length} saved project
                  {projects.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {currentProjectId && (
                  <button
                    onClick={() => {
                      onNewProject();
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-teal hover:bg-brand-teal/20 text-white border border-brand-teal/20 rounded-lg text-xs font-semibold transition-colors"
                    title="Clear map and start a new project"
                  >
                    New Project
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Project list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                    <FolderOpen className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="text-sm opacity-40">No saved projects yet</p>
                  <p className="text-xs opacity-20 mt-1">
                    Save your first project using the button below
                  </p>
                </div>
              ) : (
                // projects.map((project) => (
                //   <div
                //     key={project.id}
                //     className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
                //   >
                //     {/* Project name + active badge */}
                //     <div className="flex items-start justify-between mb-3">
                //       <div className="flex-1 min-w-0">
                //         <div className="flex items-center gap-2">
                //           <h3 className="text-sm font-semibold text-white truncate">
                //             {project.name}
                //           </h3>
                //           {isActive(project) && (
                //             <span className="flex-shrink-0 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded">
                //               Active
                //             </span>
                //           )}
                //         </div>
                //         <div className="flex items-center gap-1 mt-1 text-[11px] opacity-30">
                //           <Clock className="w-3 h-3" />
                //           <span>
                //             {project.updated_at
                //               ? `Updated ${formatDate(project.updated_at)}`
                //               : `Created ${formatDate(project.created_at)}`}
                //           </span>
                //         </div>
                //       </div>
                //     </div>

                //     {/* Share URL input — shown when sharing */}
                //     {sharingId === project.id && shareUrls[project.id] && (
                //       <div className="mb-3 flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg p-2">
                //         <input
                //           type="text"
                //           readOnly
                //           value={shareUrls[project.id]}
                //           className="flex-1 bg-transparent text-xs text-white/60 outline-none truncate"
                //         />
                //         <button
                //           onClick={() => handleCopy(project.id)}
                //           className="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-brand-teal/20 hover:bg-brand-teal/30 text-brand-teal rounded text-[10px] font-bold transition-colors"
                //         >
                //           {copiedId === project.id ? (
                //             <>
                //               <Check className="w-3 h-3" /> Copied
                //             </>
                //           ) : (
                //             <>
                //               <Copy className="w-3 h-3" /> Copy
                //             </>
                //           )}
                //         </button>
                //       </div>
                //     )}

                //     {/* Action buttons */}
                //     <div className="flex items-center gap-2">
                //       <button
                //         onClick={() => {
                //           onOpenProject(project.id);
                //           onClose();
                //         }}
                //         className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal rounded-lg text-xs font-semibold transition-colors border border-brand-teal/20"
                //       >
                //         <FolderOpen className="w-3.5 h-3.5" />
                //         Open
                //       </button>
                //       <button
                //         onClick={() => handleShare(project.id)}
                //         className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-colors border border-white/10"
                //         title="Share project"
                //       >
                //         <Share2 className="w-3.5 h-3.5" />
                //         Share
                //       </button>
                //       <button
                //         onClick={() => handleDelete(project.id, project.name)}
                //         disabled={deletingId === project.id}
                //         className="flex items-center justify-center px-3 py-1.5 bg-white/5 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/20 rounded-lg text-xs transition-colors border border-white/10 disabled:opacity-40"
                //         title="Delete project"
                //       >
                //         <Trash2 className="w-3.5 h-3.5" />
                //       </button>
                //     </div>
                //   </div>
                // ))
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all"
                  >
                    {/* Card header — clickable to expand */}
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => handleExpand(project.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white truncate">
                              {project.name}
                            </h3>
                            {isActive(project) && (
                              <span className="flex-shrink-0 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded">
                                Active
                              </span>
                            )}
                          </div>
                          {/* Company name */}
                          {project.client_name && (
                            <div className="flex items-center gap-1 mt-1 text-[11px] text-brand-teal/70">
                              <Building2 className="w-3 h-3" />
                              <span>{project.client_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-1 text-[11px] opacity-30">
                            <Clock className="w-3 h-3" />
                            <span>
                              {project.updated_at
                                ? `Updated ${formatDate(project.updated_at)}`
                                : `Created ${formatDate(project.created_at)}`}
                            </span>
                          </div>
                        </div>
                        {/* Expand chevron */}
                        <ChevronDown
                          className={`w-4 h-4 opacity-40 transition-transform flex-shrink-0 ml-2 mt-0.5 ${expandedId === project.id ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>

                    {/* Expanded equipment list */}
                    {expandedId === project.id && (
                      <div className="border-t border-white/10 px-4 pb-4">
                        <p className="text-[10px] uppercase tracking-widest opacity-30 mt-3 mb-2">
                          Equipment Used
                        </p>
                        {!projectData[project.id] ? (
                          <p className="text-xs opacity-30">Loading...</p>
                        ) : getEquipmentList(
                            projectData[project.id],
                            equipmentLookup,
                          ).length === 0 ? (
                          <p className="text-xs opacity-30">
                            No equipment placed
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {getEquipmentList(
                              projectData[project.id],
                              equipmentLookup,
                            ).map((eq) => (
                              <div
                                key={eq.type}
                                className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
                              >
                                <div>
                                  <span className="text-xs font-medium text-white">
                                    {eq.name}
                                  </span>
                                  <span className="text-[10px] opacity-30 ml-1">
                                    ({eq.width}m×{eq.depth}m×{eq.height}m)
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

                    {/* Share URL input */}
                    {sharingId === project.id && shareUrls[project.id] && (
                      <div className="mx-4 mb-3 flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg p-2">
                        <input
                          type="text"
                          readOnly
                          value={shareUrls[project.id]}
                          className="flex-1 bg-transparent text-xs text-white/60 outline-none truncate"
                        />
                        <button
                          onClick={() => handleCopy(project.id)}
                          className="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-brand-teal/20 hover:bg-brand-teal/30 text-brand-teal rounded text-[10px] font-bold transition-colors"
                        >
                          {copiedId === project.id ? (
                            <>
                              <Check className="w-3 h-3" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 px-4 pb-4">
                      <button
                        onClick={() => {
                          onOpenProject(project.id);
                          onClose();
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal rounded-lg text-xs font-semibold transition-colors border border-brand-teal/20"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        Open
                      </button>
                      <button
                        onClick={() => handleShare(project.id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-colors border border-white/10"
                        title="Share project"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                      </button>
                      <button
                        onClick={() => handleDelete(project.id, project.name)}
                        disabled={deletingId === project.id}
                        className="flex items-center justify-center px-3 py-1.5 bg-white/5 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/20 rounded-lg text-xs transition-colors border border-white/10 disabled:opacity-40"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 text-[10px] opacity-20 text-center uppercase tracking-widest">
              Projects are auto-saved to the cloud
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
