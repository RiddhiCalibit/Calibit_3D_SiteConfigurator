import React, { useState } from 'react';
import { authFetch } from '../utils/api';
import { motion, AnimatePresence } from 'motion/react';
import { X, FolderOpen, Trash2, Share2, Clock, Plus, Check, Copy } from 'lucide-react';
import { User, Tenant } from '../types';

interface Project {
  id: string;
  name: string;
  tenant_id: string;
  user_id: string;
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
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareUrls, setShareUrls] = useState<Record<string, string>>({});

  const handleDelete = async (projectId: string, projectName: string) => {
    if (!confirm(`Delete "${projectName}"? This cannot be undone.`)) return;
    setDeletingId(projectId);
    try {
      const res = await authFetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      if (res.ok) {
        onDeleteProject(projectId);
        onRefresh();
      } else {
        alert('Failed to delete project.');
      }
    } catch {
      alert('Failed to delete project.');
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
      const res = await authFetch(`/api/projects/${projectId}/share`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setShareUrls(prev => ({ ...prev, [projectId]: data.shareUrl }));
      } else {
        alert('Failed to generate share link.');
        setSharingId(null);
      }
    } catch {
      alert('Failed to generate share link.');
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
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isActive = (project: Project) => {
    const lastDate = project.updated_at || project.created_at;
    if (!lastDate) return false;
    const diff = Date.now() - new Date(lastDate).getTime();
    return diff < 5 * 24 * 60 * 60 * 1000; // 5 days
  };

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
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0f1623] border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white">My Projects</h2>
                <p className="text-xs opacity-40 mt-0.5">{projects.length} saved project{projects.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Project list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                    <FolderOpen className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="text-sm opacity-40">No saved projects yet</p>
                  <p className="text-xs opacity-20 mt-1">Save your first project using the button below</p>
                </div>
              ) : (
                projects.map(project => (
                  <div
                    key={project.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
                  >
                    {/* Project name + active badge */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white truncate">{project.name}</h3>
                          {isActive(project) && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[11px] opacity-30">
                          <Clock className="w-3 h-3" />
                          <span>
                            {project.updated_at
                              ? `Updated ${formatDate(project.updated_at)}`
                              : `Created ${formatDate(project.created_at)}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Share URL input — shown when sharing */}
                    {sharingId === project.id && shareUrls[project.id] && (
                      <div className="mb-3 flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg p-2">
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
                            <><Check className="w-3 h-3" /> Copied</>
                          ) : (
                            <><Copy className="w-3 h-3" /> Copy</>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { onOpenProject(project.id); onClose(); }}
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