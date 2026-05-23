import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function SharedProject() {
  const [project, setProject] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // const token = window.location.pathname.split("/shared/")[1];

    const fullPath = window.location.pathname + window.location.href;
    const match = (
      window.location.pathname +
      window.location.search +
      window.location.hash
    ).match(/\/shared\/([a-f0-9]+)/);
    const token = match
      ? match[1]
      : window.location.href.match(/\/shared\/([a-f0-9]+)/)?.[1];

    if (!token) {
      setError("Invalid share link.");
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/api/projects/shared/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setProject(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load shared project.");
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f1623] text-white">
        <p className="text-sm opacity-50">Loading shared project...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f1623] text-white">
        <div className="text-center">
          <p className="text-lg font-bold text-red-400">Link not found</p>
          <p className="text-sm opacity-50 mt-2">{error}</p>
        </div>
      </div>
    );

  const objects = project?.data?.objects || [];
  const boundary = project?.data?.siteBoundary || [];

  return (
    <div className="min-h-screen bg-[#0f1623] text-white p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-teal/20 flex items-center justify-center text-brand-teal font-bold">
              3D
            </div>
            <div>
              <h1 className="text-xl font-bold">{project.name}</h1>
              <p className="text-xs opacity-40">Shared Site Configuration</p>
            </div>
          </div>
          <p className="text-xs opacity-30 mt-3">
            Created{" "}
            {new Date(project.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {project.updated_at &&
              ` · Updated ${new Date(project.updated_at).toLocaleDateString(
                "en-IN",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                },
              )}`}
          </p>
        </div>

        {/* Boundary info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
          <p className="text-xs uppercase tracking-widest opacity-40 mb-2">
            Site Boundary
          </p>
          <p className="text-sm">
            {boundary.length > 0
              ? `${boundary.length} boundary points defined`
              : "No boundary set"}
          </p>
        </div>

        {/* Equipment list */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs uppercase tracking-widest opacity-40 mb-4">
            Equipment Placed ({objects.length} items)
          </p>
          {objects.length === 0 ? (
            <p className="text-sm opacity-30">No equipment placed</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(
                objects.reduce((acc: any, obj: any) => {
                  acc[obj.type] = (acc[obj.type] || 0) + 1;
                  return acc;
                }, {}),
              ).map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between py-2 border-b border-white/5"
                >
                  <span className="text-sm capitalize">
                    {type.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm font-bold text-brand-teal">
                    ×{count as number}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs opacity-20 mt-8 uppercase tracking-widest">
          Powered by Calibit 3D Site Configurator
        </p>
      </div>
    </div>
  );
}
