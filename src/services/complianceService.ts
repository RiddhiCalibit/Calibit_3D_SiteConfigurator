import { GoogleGenAI, Type } from "@google/genai";
import { AppState, EquipmentDef, DEFAULT_LIBRARY } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
  const model = "gemini-3-flash-preview";
  
  // Prepare data for the model
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

  const prompt = `
    Analyze the following 3D site configuration for compliance with safety and operational standards.
    The site is a water park / recreational facility.
    
    Rules to check:
    1. Safety Distances: Pools (category 'pools') should have at least 5m clearance from facilities (category 'facilities').
    2. Capacity: If there are more than 5 major attractions (slides/pools) but only 1 ticket booth or food kiosk, flag as a capacity warning.
    3. Accessibility: Seating areas should be distributed near pools.
    4. Safety: Slides should not be placed too close to each other (min 3m).
    
    Site Data:
    ${JSON.stringify(siteData, null, 2)}
    
    Return a structured JSON report.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.NUMBER, description: "Score from 0 to 100" },
          summary: { type: Type.STRING },
          checks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                status: { type: Type.STRING, enum: ["pass", "fail", "warning"] },
                message: { type: Type.STRING },
                details: { type: Type.STRING }
              },
              required: ["category", "status", "message"]
            }
          },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["overallScore", "summary", "checks", "recommendations"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse compliance report", e);
    throw new Error("Invalid report format received from AI");
  }
}
