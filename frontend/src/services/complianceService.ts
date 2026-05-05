const DEFAULT_LIBRARY: any[] = [];

interface AppState {
  siteBoundary: any;
  objects: Array<{ id: string; type: string; x: number; z: number }>;
  customLibrary: any[];
}

export interface ComplianceResult {
  category: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

export interface ComplianceReport {
  overallScore: number;
  checks: ComplianceResult[];
  summary: string;
  recommendations: string[];
}

export async function runComplianceCheck(state: AppState): Promise<ComplianceReport> {
  const siteData = {
    boundary: state.siteBoundary,
    objects: state.objects.map(obj => {
      const def = [...DEFAULT_LIBRARY, ...state.customLibrary].find(d => d.id === obj.type);
      return {
        id: obj.id,
        name: def?.name || obj.type,
        category: def?.category || 'unknown',
        position: { x: obj.x, z: obj.z },
        dimensions: def ? { w: def.width, d: def.depth, h: def.height } : null
      };
    })
  };

  const res = await fetch('/api/compliance/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(siteData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Compliance check failed');
  }

  return res.json();
}