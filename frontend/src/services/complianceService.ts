// // const DEFAULT_LIBRARY: any[] = [];

// // interface AppState {
// //   siteBoundary: any;
// //   objects: Array<{ id: string; type: string; x: number; z: number }>;
// //   customLibrary: any[];
// // }

// // export interface ComplianceResult {
// //   category: string;
// //   status: "pass" | "fail" | "warning";
// //   message: string;
// //   details?: string;
// // }

// // export interface ComplianceReport {
// //   overallScore: number;
// //   checks: ComplianceResult[];
// //   summary: string;
// //   recommendations: string[];
// // }

// // export async function runComplianceCheck(
// //   state: AppState,
// // ): Promise<ComplianceReport> {
// //   const siteData = {
// //     boundary: state.siteBoundary,
// //     objects: state.objects.map((obj) => {
// //       const def = [...DEFAULT_LIBRARY, ...state.customLibrary].find(
// //         (d) => d.id === obj.type,
// //       );
// //       return {
// //         id: obj.id,
// //         name: def?.name || obj.type,
// //         category: def?.category || "unknown",
// //         position: { x: obj.x, z: obj.z },
// //         dimensions: def ? { w: def.width, d: def.depth, h: def.height } : null,
// //       };
// //     }),
// //   };

// //   const token = localStorage.getItem("auth_token");
// //   if (!token) throw new Error("No token provided");

// //   const res = await fetch("/api/compliance/check", {
// //     method: "POST",
// //     headers: {
// //       "Content-Type": "application/json",
// //       Authorization: `Bearer ${token}`,
// //     },
// //     body: JSON.stringify(siteData),
// //   });

// //   if (!res.ok) {
// //     const err = await res.json().catch(() => ({}));
// //     throw new Error(err.error || "Compliance check failed");
// //   }

// //   return res.json();
// // }

// const DEFAULT_LIBRARY: any[] = [];

// interface AppState {
//   siteBoundary: any;
//   objects: Array<{ id: string; type: string; x: number; z: number }>;
//   customLibrary: any[];
// }

// export interface ComplianceResult {
//   category: string;
//   status: "pass" | "fail" | "warning";
//   message: string;
//   details?: string;
// }

// export interface ComplianceReport {
//   overallScore: number;
//   checks: ComplianceResult[];
//   summary: string;
//   recommendations: string[];
//   /** ISO timestamp set by the backend the moment this report was generated. */
//   generatedAt?: string;
// }

// export async function runComplianceCheck(
//   state: AppState,
//   projectId?: string | null,
// ): Promise<ComplianceReport> {
//   const siteData = {
//     boundary: state.siteBoundary,
//     objects: state.objects.map((obj) => {
//       const def = [...DEFAULT_LIBRARY, ...state.customLibrary].find(
//         (d) => d.id === obj.type,
//       );
//       return {
//         id: obj.id,
//         name: def?.name || obj.type,
//         category: def?.category || "unknown",
//         position: { x: obj.x, z: obj.z },
//         dimensions: def ? { w: def.width, d: def.depth, h: def.height } : null,
//       };
//     }),
//   };

//   const token = localStorage.getItem("auth_token");
//   if (!token) throw new Error("No token provided");

//   const res = await fetch("/api/compliance/check", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//     // projectId tells the backend which project to save this report
//     // against — the Compliance Engine is otherwise identical.
//     body: JSON.stringify({ ...siteData, projectId: projectId ?? null }),
//   });

//   if (!res.ok) {
//     const err = await res.json().catch(() => ({}));
//     throw new Error(err.error || "Compliance check failed");
//   }

//   return res.json();
// }

const DEFAULT_LIBRARY: any[] = [];

interface AppState {
  siteBoundary: any;
  objects: Array<{ id: string; type: string; x: number; z: number }>;
  customLibrary: any[];
}

export interface ComplianceResult {
  category: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: string;
}

export interface ComplianceReport {
  /** Present once the report has been saved against a project. */
  id?: string;
  /** 1, 2, 3, ... — increases with every Compliance Engine run for a project. */
  version?: number;
  overallScore: number;
  checks: ComplianceResult[];
  summary: string;
  recommendations: string[];
  /** ISO timestamp set by the backend the moment this report was generated. */
  generatedAt?: string;
  /** True only for the single most recent report of its project. */
  isLatest?: boolean;
}

export async function runComplianceCheck(
  state: AppState,
  projectId?: string | null,
): Promise<ComplianceReport> {
  const siteData = {
    boundary: state.siteBoundary,
    objects: state.objects.map((obj) => {
      const def = [...DEFAULT_LIBRARY, ...state.customLibrary].find(
        (d) => d.id === obj.type,
      );
      return {
        id: obj.id,
        name: def?.name || obj.type,
        category: def?.category || "unknown",
        position: { x: obj.x, z: obj.z },
        dimensions: def ? { w: def.width, d: def.depth, h: def.height } : null,
      };
    }),
  };

  const token = localStorage.getItem("auth_token");
  if (!token) throw new Error("No token provided");

  const res = await fetch("/api/compliance/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    // projectId tells the backend which project to save this new version
    // against — the Compliance Engine analysis itself is otherwise
    // identical. Every call creates a new version row; nothing is
    // overwritten.
    body: JSON.stringify({ ...siteData, projectId: projectId ?? null }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Compliance check failed");
  }

  return res.json();
}

/** Full version history for a project, newest first. Index 0 is the latest. */
export async function fetchComplianceHistory(
  projectId: string,
): Promise<ComplianceReport[]> {
  const token = localStorage.getItem("auth_token");
  if (!token) throw new Error("No token provided");

  const res = await fetch(`/api/projects/${projectId}/compliance-reports`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to load compliance report history");
  }
  return res.json();
}

/**
 * Only the latest report for a project — a lightweight, dedicated read used
 * by PDF/Excel export. Never regenerates anything; returns null if the
 * project has never been analyzed.
 */
export async function fetchLatestComplianceReport(
  projectId: string,
): Promise<ComplianceReport | null> {
  const token = localStorage.getItem("auth_token");
  if (!token) throw new Error("No token provided");

  const res = await fetch(
    `/api/projects/${projectId}/compliance-reports/latest`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to load compliance report");
  }
  return res.json();
}
