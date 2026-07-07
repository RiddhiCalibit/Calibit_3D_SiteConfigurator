// import { SchemaType } from "@google/generative-ai";

export interface Tenant {
  id: string;
  name: string;
  logo_url?: string;
  primary_color: string;
  subscription_tier: "basic" | "pro";
  created_at?: string;
  project_count?: number;
}

export interface User {
  id: string;
  tenant_id: string | null;
  email: string;
  role: "platform_admin" | "tenant_admin" | "sales_rep";
  name: string;
  phone?: string;
  force_password_change?: number;
  is_active?: boolean;
  status?: "active" | "inactive" | "archived";
}

export interface Project {
  id: string;
  tenant_id: string;
  user_id: string | null;
  name: string;
  created_at?: string;
}

export interface EquipmentDef {
  id: string;
  name: string;
  width: number;
  depth: number;
  height: number;
  color: string;
  category: string;
  modelUrl?: string;
  animationsEnabled?: boolean;
  imageUrl?: string;
  isActive?: boolean;
}

export interface EquipmentObject {
  id: string;
  type: string;
  x: number; // metres east of origin
  z: number; // metres south of origin
  rotationY: number; // radians
  color?: string;
}

export interface AppState {
  siteBoundary: [number, number][]; // [lng, lat]
  originLngLat: [number, number] | null;
  objects: EquipmentObject[];
  selectedId: string | null;
  terrainEnabled: boolean;
  buildingsEnabled: boolean;
  mapStyle: "streets" | "satellite" | "plain";
  pendingPlacement: EquipmentDef | null;
  measurePoints: [number, number][];
  isBoundaryLocked: boolean;
  customLibrary: EquipmentDef[];
  unitSystem: "metric" | "imperial";
}

export const DEFAULT_LIBRARY: EquipmentDef[] = [
  {
    id: "slide_small",
    name: "Small Slide",
    width: 4,
    depth: 2,
    height: 3,
    color: "#FF5733",
    category: "slides",
    //modelUrl: "/models/small_slide.glb",
    modelUrl:
      "https://res.cloudinary.com/dlft8pqu7/raw/upload/v1781090100/calibit-models/defaults/small_slide.glb",
    isActive: true,
  },
  {
    id: "slide_large",
    name: "Large Slide",
    width: 8,
    depth: 3,
    height: 6,
    color: "#C70039",
    category: "slides",
    //modelUrl: "/models/slide_large.glb",
    modelUrl:
      "https://res.cloudinary.com/dlft8pqu7/raw/upload/v1781090104/calibit-models/defaults/slide_large.glb",
    isActive: true,
  },
  {
    id: "tower_3d",
    name: "Tower",
    width: 5,
    depth: 5,
    height: 10,
    color: "#34495E",
    category: "facilities",
    //modelUrl: "/models/tower.glb",
    modelUrl:
      "https://res.cloudinary.com/dlft8pqu7/raw/upload/v1781090110/calibit-models/defaults/tower.glb",
    animationsEnabled: true,
    isActive: true,
  },
  {
    id: "duck_3d",
    name: "Duck",
    width: 2,
    depth: 2,
    height: 2,
    color: "#F1C40F",
    category: "amenities",
    //modelUrl: "/models/duck.glb",
    modelUrl:
      "https://res.cloudinary.com/dlft8pqu7/raw/upload/v1781090113/calibit-models/defaults/duck.glb",
    // imageUrl: "/images/duck.png",
    animationsEnabled: true,
    isActive: true,
  },
  {
    id: "wave_pool",
    name: "Wave Pool",
    width: 20,
    depth: 15,
    height: 2,
    color: "#3498DB",
    category: "pools",
    //modelUrl: "/models/wave_pool.glb",
    modelUrl:
      //"https://res.cloudinary.com/dlft8pqu7/raw/upload/v1781090118/calibit-models/defaults/wave_pool.glb",
      "https://res.cloudinary.com/dlft8pqu7/image/upload/v1781594825/wave_pool_nf7z9g.glb",
    isActive: true,
  },
  {
    id: "lazy_river",
    name: "Lazy River",
    width: 30,
    depth: 5,
    height: 1.5,
    color: "#2980B9",
    category: "pools",
    //modelUrl: "/models/lazy_river.glb",
    modelUrl:
      "https://res.cloudinary.com/dlft8pqu7/raw/upload/v1781090121/calibit-models/defaults/lazy_river.glb",
    isActive: true,
  },
  {
    id: "splash_pad",
    name: "Splash Pad",
    width: 10,
    depth: 10,
    height: 0.5,
    color: "#1ABC9C",
    category: "pools",
    modelUrl:
      // "https://res.cloudinary.com/dlft8pqu7/raw/upload/v1781090100/calibit-models/defaults/splash_pad.glb",
      "https://res.cloudinary.com/dlft8pqu7/image/upload/v1782210489/splashpad_ls7m5k.glb",
    isActive: true,
  },
  {
    id: "pump_station",
    name: "Pump Station",
    width: 5,
    depth: 5,
    height: 4,
    color: "#7F8C8D",
    category: "facilities",
    //modelUrl: "/models/pump_station.glb",
    modelUrl:
      "https://res.cloudinary.com/dlft8pqu7/raw/upload/v1781090137/calibit-models/defaults/pump_station.glb",
    isActive: true,
  },
  {
    id: "ticket_booth",
    name: "Ticket Booth",
    width: 3,
    depth: 3,
    height: 3,
    color: "#F1C40F",
    category: "facilities",
    //modelUrl: "/models/ticket_booth.glb",
    modelUrl:
      "https://res.cloudinary.com/dlft8pqu7/raw/upload/v1781090138/calibit-models/defaults/ticket_booth.glb",
    isActive: true,
  },
  {
    id: "locker_block",
    name: "Locker Block",
    width: 10,
    depth: 4,
    height: 3,
    color: "#9B59B6",
    category: "facilities",
    //modelUrl: "/models/locker_block.glb",
    modelUrl:
      "https://res.cloudinary.com/dlft8pqu7/raw/upload/v1781090152/calibit-models/defaults/locker_block.glb",
    isActive: true,
  },
  {
    id: "food_kiosk",
    name: "Food Kiosk",
    width: 4,
    depth: 4,
    height: 3,
    color: "#E67E22",
    category: "facilities",
    //modelUrl: "/models/food_kiosk.glb",
    modelUrl:
      "https://res.cloudinary.com/dlft8pqu7/raw/upload/v1781090155/calibit-models/defaults/food_kiosk.glb",
    isActive: true,
  },
  {
    id: "seating_area",
    name: "Seating Area",
    width: 6,
    depth: 6,
    height: 1,
    color: "#2ECC71",
    category: "amenities",
    //modelUrl: "/models/seating area.glb",
    modelUrl:
      "https://res.cloudinary.com/dlft8pqu7/raw/upload/v1781090160/calibit-models/defaults/seating_area.glb",
    isActive: true,
  },
];
