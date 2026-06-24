import React, { useState, useRef, useCallback, useEffect } from "react";
import { authFetch } from "./utils/api";
import { Sidebar } from "./components/Sidebar";
import { MapPanel } from "./components/MapPanel";
import { LocationSearch } from "./components/LocationSearch";
import { Modal } from "./components/Modal";
import { CompliancePanel } from "./components/CompliancePanel";
import { Login } from "./components/Login";
import { AdminDashboard } from "./components/AdminDashboard";
import { PlatformAdminDashboard } from "./components/PlatformAdminDashboard";
import { useAppState } from "./useAppState";
import { User, Tenant, EquipmentObject } from "../../backend/types";
import { DEFAULT_LIBRARY } from "../../backend/types";
import { v4 as uuidv4 } from "uuid";
import * as turf from "@turf/turf";
import { lngLatToMetres, isPointInBoundary, metresToLngLat } from "./utils/geo";
import { clsx } from "clsx";
import { AlertTriangle, Download, Trash2 } from "lucide-react";
import { ForgotPassword } from "./components/ForgotPassword";
import { ForcePasswordChange } from "./components/ForcePasswordChange";
import { ContactAdmin } from "./components/ContactAdmin";
import { ProjectsPanel } from "./components/ProjectsPanel";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function App() {
  // useEffect(() => {
  //  console.log("API URL:", import.meta.env.VITE_API_URL);
  //  console.log("ENV CHECK:", import.meta.env);
  //  }, []);

  const {
    state,
    setBoundary,
    addObject,
    setObjects,
    updateObject,
    removeObject,
    selectObject,
    setMapStyle,
    toggleTerrain,
    toggleBuildings,
    toggleBoundaryLock,
    setBoundaryLock,
    setPendingPlacement,
    setMeasurePoints,
    addCustomEquipment,
    setCustomLibrary,
    setUnitSystem,
  } = useAppState();

  const API_URL = import.meta.env.VITE_API_URL;

  const [drawTrigger, setDrawTrigger] = useState(0);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [targetLocation, setTargetLocation] = useState<
    { lng: number; lat: number } | undefined
  >();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [complianceOpen, setComplianceOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<any>(null);

  // const [user, setUser] = useState<User | null>(null);
  // const [tenant, setTenant] = useState<Tenant | null>(null);
  // const [token, setToken] = useState(null);

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("auth_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("auth_token") || null;
  });

  const [tenant, setTenant] = useState<Tenant | null>(() => {
    const saved = localStorage.getItem("auth_tenant");
    return saved ? JSON.parse(saved) : null;
  });

  const [projects, setProjects] = useState<any[]>([]);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showContactAdmin, setShowContactAdmin] = useState(false);
  const [disabledDefaults, setDisabledDefaults] = useState<string[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [projectsPanelOpen, setProjectsPanelOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(
    null,
  );
  const [currentClientName, setCurrentClientName] = useState<string | null>(
    null,
  );
  const [currentProjectCreatedAt, setCurrentProjectCreatedAt] = useState<
    string | null
  >(null);
  const [currentProjectUpdatedAt, setCurrentProjectUpdatedAt] = useState<
    string | null
  >(null);
  const [customEquipment, setCustomEquipment] = useState<any[]>([]);
  const boundaryViolationRef = useRef<string | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3800);
  };

  // Helper: build a Turf polygon (lng/lat) for an equipment defined by centre metres (x,z), width, depth and rotation
  const buildEquipmentPolygon = (
    cx: number,
    cz: number,
    width: number,
    depth: number,
    rotationY: number,
    origin: [number, number],
  ) => {
    const halfW = width / 2;
    const halfD = depth / 2;
    const cornersMetres = [
      { x: -halfW, z: -halfD },
      { x: halfW, z: -halfD },
      { x: halfW, z: halfD },
      { x: -halfW, z: halfD },
      { x: -halfW, z: -halfD },
    ];

    const cornersLngLat = cornersMetres.map((c) => {
      const rx = c.x * Math.cos(rotationY) - c.z * Math.sin(rotationY);
      const rz = c.x * Math.sin(rotationY) + c.z * Math.cos(rotationY);
      return metresToLngLat(cx + rx, cz + rz, origin);
    });

    return turf.polygon([cornersLngLat]);
  };

  // Add this useEffect after your useState declarations
  useEffect(() => {
    if (!user || !tenant) return;

    // Re-fetch equipment and disabled defaults on page load/refresh
    const restoreSession = async () => {
      // Fetch disabled defaults
      const ddRes = await authFetch(
        `/api/tenant/${tenant.id}/disabled-defaults`,
      );
      if (ddRes.ok) {
        const disabledIds = await ddRes.json();
        setDisabledDefaults(disabledIds);
      }

      // Fetch custom equipment
      const eqRes = await authFetch(`/api/tenant/${tenant.id}/equipment`);
      if (eqRes.ok) {
        const eqData = await eqRes.json();
        const mapped = eqData.map((eq: any) => ({
          id: eq.id,
          name: eq.name,
          category: eq.category,
          width: eq.width,
          depth: eq.depth,
          height: eq.height,
          color: eq.color,
          modelUrl: eq.model_url,
          animationsEnabled: !!eq.animations_enabled,
          imageUrl: eq.image_url || null,
          isActive: Number(eq.is_active) !== 0,
        }));
        const filtered =
          user.role === "sales_rep"
            ? mapped.filter((eq: any) => eq.isActive !== false)
            : mapped;
        setCustomLibrary(filtered);
      }

      // Fetch projects
      fetchProjects(tenant);
    };

    restoreSession();
  }, []); // ← empty array = runs once on mount

  const handleLogin = async (email: string, password: string) => {
    // const res = await fetch('/api/auth/login', {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await res.json();
      console.log("LOGIN RESPONSE:", data);

      if (!res.ok) {
        // Handle account deactivated (HTTP 403)
        if (res.status === 403 && data.accountDeactivated) {
          const error: any = new Error(data.error);
          error.accountDeactivated = true;
          throw error;
        }
        // Handle account locked (HTTP 423)
        if (res.status === 423 && data.accountLocked) {
          const error: any = new Error(data.error);
          error.accountLocked = true;
          error.canUnlockByRoles = data.canUnlockByRoles;
          error.userRole = data.userRole;
          throw error;
        }
        // Handle failed login with attempt count
        if (data.failedAttempts) {
          const error: any = new Error(data.error);
          error.failedAttempts = data.failedAttempts;
          throw error;
        }
        throw new Error(data.error || "Login failed");
      }

      // if (res.ok) {
      //   const data = await res.json();
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      localStorage.setItem("auth_tenant", JSON.stringify(data.tenant));
      setUser(data.user);
      setTenant(data.tenant);
      // setToken(data.token);

      //  Pass tenant directly — don't rely on state being updated yet
      fetchProjects(data.tenant);

      if (data.tenant) {
        // Fetch disabled defaults for tenant
        const ddRes = await authFetch(
          `/api/tenant/${data.tenant.id}/disabled-defaults`,
        );
        //     { headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${data.token}`
        //   }
        // });
        if (ddRes.ok) {
          const disabledIds = await ddRes.json();
          // Store in state — add this state at the top of App component
          setDisabledDefaults(disabledIds);
        }

        // Fetch equipment for tenant
        const eqRes = await authFetch(
          `/api/tenant/${data.tenant.id}/equipment`,
        );
        //    {
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${data.token}`
        //   }
        // });
        if (eqRes.ok) {
          const eqData = await eqRes.json();
          const mapped = eqData.map((eq: any) => ({
            id: eq.id,
            name: eq.name,
            category: eq.category,
            width: eq.width,
            depth: eq.depth,
            height: eq.height,
            color: eq.color,
            modelUrl: eq.model_url,
            animationsEnabled: !!eq.animations_enabled,
            imageUrl: eq.image_url || null,
            isActive: Number(eq.is_active) !== 0,
          }));
          //  Filter out inactive for sales reps
          const filtered =
            data.user?.role === "sales_rep"
              ? mapped.filter((eq: any) => eq.isActive !== false)
              : mapped;

          setCustomLibrary(filtered);

          // setCustomLibrary(mapped);
        }
      } else {
        setCustomLibrary([]);
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      throw err;
    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("auth_user", JSON.stringify(updatedUser));
  };

  const handleLogout = async () => {
    // call logout endpoint to clear httpOnly cookie server-side
    const API_URL = import.meta.env.VITE_API_URL || "";
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_tenant");
    setUser(null);
    setTenant(null);
    setToken(null);
  };

  const handleMapClick = useCallback(
    (e: mapboxgl.MapMouseEvent) => {
      console.log(
        "Map clicked at:",
        e.lngLat,
        "Pending:",
        state.pendingPlacement?.name,
      );
      if (state.pendingPlacement && state.originLngLat) {
        const { x, z } = lngLatToMetres(
          [e.lngLat.lng, e.lngLat.lat],
          state.originLngLat,
        );
        // Snap to 0.5m
        const snappedX = Math.round(x * 2) / 2;
        const snappedZ = Math.round(z * 2) / 2;

        console.log("Calculated metres:", { x, z }, "Snapped:", {
          snappedX,
          snappedZ,
        });

        if (
          isPointInBoundary(
            snappedX,
            snappedZ,
            state.originLngLat,
            state.siteBoundary,
          )
        ) {
          console.log("Inside boundary, adding object...");

          // Collision check: ensure ghost footprint doesn't intersect existing objects
          const def = state.pendingPlacement;
          const ghostPoly = buildEquipmentPolygon(
            snappedX,
            snappedZ,
            def.width,
            def.depth,
            0,
            state.originLngLat,
          );

          const collisions = state.objects.some((obj) => {
            const objDef =
              DEFAULT_LIBRARY.find((d) => d.id === obj.type) ??
              (state.customLibrary || []).find((d) => d.id === obj.type);
            if (!objDef) return false;
            const objPoly = buildEquipmentPolygon(
              obj.x,
              obj.z,
              objDef.width,
              objDef.depth,
              obj.rotationY || 0,
              state.originLngLat!,
            );
            try {
              return turf.booleanIntersects(ghostPoly, objPoly);
            } catch {
              return false;
            }
          });

          if (collisions) {
            showToast(
              "Cannot place equipment on top of another object.",
              "error",
            );
            return;
          }

          addObject(
            state.pendingPlacement.id,
            snappedX,
            snappedZ,
            state.pendingPlacement.color,
          );
        } else {
          console.warn(
            "Outside boundary check failed. Boundary size:",
            state.siteBoundary.length,
          );
          alert("Please place equipment inside the boundary.");
        }
      } else {
        console.log(
          "No pending placement or no origin set. Origin:",
          state.originLngLat,
        );
      }

      if (isMeasuring) {
        if (state.measurePoints.length >= 2) {
          setMeasurePoints([[e.lngLat.lng, e.lngLat.lat]]);
        } else {
          setMeasurePoints([
            ...state.measurePoints,
            [e.lngLat.lng, e.lngLat.lat],
          ]);
        }
      }
    },
    [
      state.pendingPlacement,
      state.originLngLat,
      state.siteBoundary,
      isMeasuring,
      state.measurePoints,
      addObject,
      setMeasurePoints,
    ],
  );

  const handleObjectUpdate = useCallback(
    (id: string, updates: Partial<EquipmentObject>) => {
      const object = state.objects.find((obj) => obj.id === id);
      if (!object) return;

      const isPositionUpdate =
        updates.x !== undefined || updates.z !== undefined;
      if (!isPositionUpdate) {
        updateObject(id, updates);
        return;
      }

      if (!state.originLngLat || state.siteBoundary.length < 3) {
        if (boundaryViolationRef.current !== id) {
          boundaryViolationRef.current = id;
          showToast("Move equipment inside boundary only.", "error");
        }
        return;
      }

      const newX = updates.x ?? object.x;
      const newZ = updates.z ?? object.z;

      if (
        isPointInBoundary(newX, newZ, state.originLngLat, state.siteBoundary)
      ) {
        // Collision check against other objects
        const def =
          DEFAULT_LIBRARY.find((d) => d.id === object.type) ??
          (state.customLibrary || []).find((d) => d.id === object.type);
        if (!def) return;

        const rot = updates.rotationY ?? object.rotationY ?? 0;
        const ghostPoly = buildEquipmentPolygon(
          newX,
          newZ,
          def.width,
          def.depth,
          rot,
          state.originLngLat!,
        );

        const collides = state.objects.some((o) => {
          if (o.id === id) return false;
          const oDef =
            DEFAULT_LIBRARY.find((d) => d.id === o.type) ??
            (state.customLibrary || []).find((d) => d.id === o.type);
          if (!oDef) return false;
          const oPoly = buildEquipmentPolygon(
            o.x,
            o.z,
            oDef.width,
            oDef.depth,
            o.rotationY || 0,
            state.originLngLat!,
          );
          try {
            return turf.booleanIntersects(ghostPoly, oPoly);
          } catch {
            return false;
          }
        });

        if (collides) {
          if (boundaryViolationRef.current !== id) {
            boundaryViolationRef.current = id;
            showToast(
              "Cannot place equipment on top of another object.",
              "error",
            );
          }
          return;
        }

        boundaryViolationRef.current = null;
        updateObject(id, updates);
      } else if (boundaryViolationRef.current !== id) {
        boundaryViolationRef.current = id;
        showToast("Move equipment inside boundary only.", "error");
      }
    },
    [
      state.originLngLat,
      state.siteBoundary,
      state.objects,
      showToast,
      updateObject,
    ],
  );

  // const handleExport = (format: "json" | "pdf" | "dwg" | "excel" = "json") => {
  //   const data = {
  //     version: "1.0",
  //     exportedAt: new Date().toISOString(),
  //     origin: state.originLngLat,
  //     siteBoundary: state.siteBoundary,
  //     objects: state.objects,
  //   };

  //   let content: string;
  //   let mimeType = "application/json";
  //   let extension = "json";

  //   if (format === "excel") {
  //     extension = "xls";
  //     mimeType = "application/vnd.ms-excel";
  //     const headers = [
  //       "ID",
  //       "Name",
  //       "Category",
  //       "Width",
  //       "Depth",
  //       "Height",
  //       "Color",
  //     ];
  //     const tableRows = state.objects
  //       .map(
  //         (obj: any) =>
  //           `<tr><td>${obj.id ?? ""}</td><td>${obj.name ?? ""}</td><td>${obj.category ?? ""}</td><td>${obj.width ?? ""}</td><td>${obj.depth ?? ""}</td><td>${obj.height ?? ""}</td><td>${obj.color ?? ""}</td></tr>`,
  //       )
  //       .join("");
  //     const projectJson = JSON.stringify(data);
  //     content = `<!DOCTYPE html><html><head><meta charset="UTF-8" /></head><body><table border="1"><thead><tr>${headers
  //       .map((header) => `<th>${header}</th>`)
  //       .join(
  //         "",
  //       )}</tr></thead><tbody>${tableRows}</tbody></table><script type="application/json" id="project-data">${projectJson}</script></body></html>`;
  //   } else if (format === "pdf") {
  //     extension = "pdf";
  //     mimeType = "application/pdf";
  //     content = JSON.stringify(data, null, 2);
  //   } else if (format === "dwg") {
  //     extension = "dwg";
  //     mimeType = "application/octet-stream";
  //     content = JSON.stringify(data, null, 2);
  //   } else {
  //     content = JSON.stringify(data, null, 2);
  //   }

  //   const blob = new Blob([content], {
  //     type: mimeType,
  //   });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = `site-config-${new Date().getTime()}.${extension}`;
  //   a.click();
  // };

  // const handleExport = (format: "json" | "pdf" | "dwg" | "excel" = "json") => {
  //   const data = {
  //     version: "1.0",
  //     exportedAt: new Date().toISOString(),
  //     projectName: currentProjectName || "Untitled Project",
  //     clientName: currentClientName || "",
  //     origin: state.originLngLat,
  //     siteBoundary: state.siteBoundary,
  //     objects: state.objects,
  //   };

  //   const exportDate = new Date().toLocaleDateString();
  //   const timestamp = new Date().getTime();

  //   if (format === "excel") {
  //     // Build a real .xlsx workbook with two sheets: project info + equipment list
  //     const infoSheetData = [
  //       ["Project Name", data.projectName],
  //       ["Client Name", data.clientName],
  //       ["Export Date", exportDate],
  //       ["Origin Longitude", data.origin?.[0] ?? ""],
  //       ["Origin Latitude", data.origin?.[1] ?? ""],
  //     ];
  //     const infoSheet = XLSX.utils.aoa_to_sheet(infoSheetData);

  //     const equipmentHeaders = [
  //       "ID",
  //       "Name",
  //       "Category",
  //       "X",
  //       "Y",
  //       "RotationY",
  //       "Width",
  //       "Depth",
  //       "Height",
  //       "ModelType",
  //     ];
  //     const equipmentRows = state.objects.map((obj: any) => [
  //       obj.id ?? "",
  //       obj.name ?? obj.type ?? "",
  //       obj.category ?? "",
  //       obj.x ?? "",
  //       obj.y ?? "",
  //       obj.rotationY ?? 0,
  //       obj.width ?? "",
  //       obj.depth ?? "",
  //       obj.height ?? "",
  //       obj.type ?? "",
  //     ]);
  //     const equipmentSheet = XLSX.utils.aoa_to_sheet([
  //       equipmentHeaders,
  //       ...equipmentRows,
  //     ]);

  //     // Hidden raw-data sheet so re-import can reconstruct the project exactly
  //     const rawSheet = XLSX.utils.aoa_to_sheet([
  //       ["RawProjectData"],
  //       [JSON.stringify(data)],
  //     ]);

  //     const workbook = XLSX.utils.book_new();
  //     XLSX.utils.book_append_sheet(workbook, infoSheet, "Project Info");
  //     XLSX.utils.book_append_sheet(workbook, equipmentSheet, "Equipment");
  //     XLSX.utils.book_append_sheet(workbook, rawSheet, "RawData");

  //     XLSX.writeFile(workbook, `site-config-${timestamp}.xlsx`);
  //     return;
  //   }

  //   if (format === "pdf") {
  //     // Build Mapbox static image URL centered on the site boundary
  //     const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  //     const origin = state.originLngLat;
  //     const lng = origin?.[0] ?? 73.856;
  //     const lat = origin?.[1] ?? 18.523;

  //     // Draw equipment pins as Mapbox overlay markers
  //     const markers = state.objects
  //       .slice(0, 10) // Mapbox static API limit
  //       .map((obj: any) => {
  //         const objLng = lng + (obj.x ?? 0) * 0.000009;
  //         const objLat = lat + (obj.z ?? 0) * 0.000009;
  //         return `pin-s+14b8a6(${objLng.toFixed(5)},${objLat.toFixed(5)})`;
  //       })
  //       .join(",");

  //     const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${markers}/${lng},${lat},16,0/600x300@2x?access_token=${mapboxToken}`;

  //     const generatePDF = (mapImageDataUrl?: string) => {
  //       const doc = new jsPDF({
  //         orientation: "portrait",
  //         unit: "mm",
  //         format: "a4",
  //       });
  //       const teal: [number, number, number] = [20, 184, 166];
  //       const dark: [number, number, number] = [15, 23, 42];

  //       // Header bar
  //       doc.setFillColor(...dark);
  //       doc.rect(0, 0, 210, 22, "F");
  //       doc.setFontSize(14);
  //       doc.setTextColor(255, 255, 255);
  //       doc.text("3D Site Configuration Report", 14, 14);

  //       // Project info section
  //       doc.setFontSize(10);
  //       doc.setTextColor(...dark);

  //       const formatDate = (iso: string | null) =>
  //         iso ? new Date(iso).toLocaleString() : "N/A";

  //       const infoRows = [
  //         ["Project Name", currentProjectName || "Untitled Project"],
  //         ["Client Name", currentClientName || "N/A"],
  //         ["Export Date", new Date().toLocaleDateString()],
  //         ["Created At", formatDate(currentProjectCreatedAt)],
  //         ["Last Updated", formatDate(currentProjectUpdatedAt)],
  //         ["Total Equipment", String(state.objects.length)],
  //       ];

  //       let y = 30;
  //       infoRows.forEach(([label, value]) => {
  //         doc.setFont("helvetica", "bold");
  //         doc.setTextColor(100, 100, 100);
  //         doc.text(label + ":", 14, y);
  //         doc.setFont("helvetica", "normal");
  //         doc.setTextColor(...dark);
  //         doc.text(value, 60, y);
  //         y += 7;
  //       });

  //       // Map image
  //       if (mapImageDataUrl) {
  //         doc.setFontSize(9);
  //         doc.setTextColor(...teal);
  //         doc.setFont("helvetica", "bold");
  //         doc.text("SITE MAP", 14, y + 4);
  //         y += 8;
  //         try {
  //           doc.addImage(mapImageDataUrl, "PNG", 14, y, 182, 65);
  //           y += 70;
  //         } catch {
  //           // skip image if it fails
  //         }
  //       }

  //       // Equipment table
  //       doc.setFontSize(9);
  //       doc.setTextColor(...teal);
  //       doc.setFont("helvetica", "bold");
  //       doc.text("EQUIPMENT LIST", 14, y + 4);
  //       y += 6;

  //       autoTable(doc, {
  //         startY: y,
  //         head: [["Name", "Category", "X (m)", "Z (m)", "W×D×H"]],
  //         body: state.objects.map((obj: any) => [
  //           obj.name ?? obj.type ?? "",
  //           obj.category ?? "",
  //           String(obj.x ?? ""),
  //           String(obj.z ?? ""),
  //           `${obj.width ?? "?"}×${obj.depth ?? "?"}×${obj.height ?? "?"}`,
  //           obj.color ?? "",
  //         ]),
  //         headStyles: {
  //           fillColor: teal,
  //           textColor: [255, 255, 255],
  //           fontStyle: "bold",
  //         },
  //         alternateRowStyles: { fillColor: [245, 250, 250] },
  //         styles: { fontSize: 8 },
  //       });

  //       doc.save(`site-config-${new Date().getTime()}.pdf`);
  //     };

  //     // Fetch the map image, fall back to no image if it fails (e.g. token missing)
  //     if (mapboxToken) {
  //       const img = new Image();
  //       img.crossOrigin = "anonymous";
  //       img.onload = () => {
  //         const canvas = document.createElement("canvas");
  //         canvas.width = img.width;
  //         canvas.height = img.height;
  //         canvas.getContext("2d")!.drawImage(img, 0, 0);
  //         generatePDF(canvas.toDataURL("image/png"));
  //       };
  //       img.onerror = () => generatePDF(); // generate without map if fetch fails
  //       img.src = staticMapUrl;
  //     } else {
  //       generatePDF();
  //     }
  //     return;
  //   }

  const handleExport = (format: "json" | "pdf" | "dwg" | "excel" = "json") => {
    const timestamp = new Date().getTime();
    const exportDate = new Date().toLocaleDateString();
    const projectName = currentProjectName || "Untitled Project";
    const clientName = currentClientName || "N/A";
    const excelCellTextLimit = 32767;
    const excelRawChunkSize = 30000;
    const formatDate = (iso: string | null) =>
      iso ? new Date(iso).toLocaleString() : "N/A";

    // ── EXCEL ──────────────────────────────────────────────────────────────
    if (format === "excel") {
      const wb = XLSX.utils.book_new();
      const allDefs = [...DEFAULT_LIBRARY, ...(state.customLibrary || [])];
      const rawSheetName = "_ProjectData";
      const rawProjectData = JSON.stringify({
        version: "1.0",
        exportedAt: new Date().toISOString(),
        projectName,
        clientName,
        origin: state.originLngLat,
        siteBoundary: state.siteBoundary,
        objects: state.objects,
        customLibrary: state.customLibrary || [],
      });
      const rawDataRows = [];

      for (let i = 0; i < rawProjectData.length; i += excelRawChunkSize) {
        rawDataRows.push([
          `Chunk ${Math.floor(i / excelRawChunkSize) + 1}`,
          rawProjectData.slice(i, i + excelRawChunkSize),
        ]);
      }

      // Section 1: Project Info rows
      const infoRows = [
        ["PROJECT INFORMATION"],
        ["Project Name", projectName],
        ["Client Name", clientName],
        ["Export Date", exportDate],
        ["Created At", formatDate(currentProjectCreatedAt)],
        ["Last Updated", formatDate(currentProjectUpdatedAt)],
        ["Total Equipment", state.objects.length],
        [],
        // Section 2: Equipment header + rows in same sheet
        ["EQUIPMENT LIST"],
        [
          "Name",
          "Category",
          "X (m)",
          "Y (m)",
          "RotationY",
          "Width (m)",
          "Depth (m)",
          "Height (m)",
        ],
        ...state.objects.map((obj: any) => {
          const def = allDefs.find((d: any) => d.id === obj.type);
          return [
            obj.name ?? def?.name ?? obj.type ?? "",
            obj.category ?? def?.category ?? "",
            obj.x ?? "",
            obj.z ?? "",
            obj.rotationY ?? 0,
            def?.width ?? obj.width ?? "",
            def?.depth ?? obj.depth ?? "",
            def?.height ?? obj.height ?? "",
          ];
        }),
      ];

      const ws = XLSX.utils.aoa_to_sheet(infoRows);
      ws["!cols"] = [
        { wch: 26 },
        { wch: 18 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
      ];
      const rawWs = XLSX.utils.aoa_to_sheet([
        ["RAW DATA (do not edit)"],
        ...rawDataRows,
      ]);
      XLSX.utils.book_append_sheet(wb, ws, "Site Configuration");
      XLSX.utils.book_append_sheet(wb, rawWs, rawSheetName);
      if (!wb.Workbook) {
        wb.Workbook = { Sheets: [] };
      }
      wb.Workbook.Sheets = wb.SheetNames.map((name) => ({
        name,
        Hidden: name === rawSheetName ? 1 : 0,
      }));
      XLSX.writeFile(wb, `site-config-${timestamp}.xlsx`);
      return;
    }

    // ── PDF ────────────────────────────────────────────────────────────────
    if (format === "pdf") {
      const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
      const origin = state.originLngLat;
      const lng = origin?.[0] ?? 0;
      const lat = origin?.[1] ?? 0;
      const boundary = state.siteBoundary;
      const allDefs = [...DEFAULT_LIBRARY, ...(state.customLibrary || [])];
      const mapPadding = { top: 36, right: 24, bottom: 24, left: 24 };
      const equipmentMapItems = origin
        ? state.objects.map((obj: any) => {
            const def = allDefs.find((d: any) => d.id === obj.type);
            const [objLng, objLat] = metresToLngLat(
              obj.x ?? 0,
              obj.z ?? 0,
              origin,
            );
            return {
              lng: objLng,
              lat: objLat,
              name: obj.name ?? def?.name ?? obj.type ?? "Equipment",
            };
          })
        : [];
      const mapPoints: [number, number][] = [
        ...boundary,
        ...equipmentMapItems.map(
          (item) => [item.lng, item.lat] as [number, number],
        ),
      ];

      const buildMapBbox = (points: [number, number][]) => {
        if (points.length === 0) return null;

        let minLng = Math.min(...points.map((pt) => pt[0]));
        let maxLng = Math.max(...points.map((pt) => pt[0]));
        let minLat = Math.min(...points.map((pt) => pt[1]));
        let maxLat = Math.max(...points.map((pt) => pt[1]));

        if (minLng === maxLng) {
          minLng -= 0.003;
          maxLng += 0.003;
        }
        if (minLat === maxLat) {
          minLat -= 0.003;
          maxLat += 0.003;
        }

        const lngPad = Math.max((maxLng - minLng) * 0.15, 0.0008);
        const latPad = Math.max((maxLat - minLat) * 0.15, 0.0008);

        return {
          minLng: minLng - lngPad,
          minLat: minLat - latPad,
          maxLng: maxLng + lngPad,
          maxLat: maxLat + latPad,
        };
      };

      const mapBbox = buildMapBbox(mapPoints);
      const mapPosition = mapBbox
        ? `[${mapBbox.minLng},${mapBbox.minLat},${mapBbox.maxLng},${mapBbox.maxLat}]`
        : `${lng},${lat},16,0`;
      const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${mapPosition}/600x300@2x?padding=${mapPadding.top},${mapPadding.right},${mapPadding.bottom},${mapPadding.left}&access_token=${mapboxToken}`;

      const generatePDF = (mapImageDataUrl?: string) => {
        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });
        const teal: [number, number, number] = [20, 184, 166];
        const dark: [number, number, number] = [15, 23, 42];
        const white: [number, number, number] = [255, 255, 255];
        const lightGray: [number, number, number] = [245, 250, 250];

        // ── Header bar ──────────────────────────────────────────────────────
        doc.setFillColor(...dark);
        doc.rect(0, 0, 210, 24, "F");
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...white);
        doc.text("3D Site Configuration Report", 14, 16);

        // ── Project info grid (2 columns) ───────────────────────────────────
        let y = 32;
        const infoRows = [
          ["Project Name:", projectName],
          ["Client Name:", clientName],
          ["Export Date:", exportDate],
          ["Created At:", formatDate(currentProjectCreatedAt)],
          ["Last Updated:", formatDate(currentProjectUpdatedAt)],
          ["Total Equipment:", String(state.objects.length)],
        ];

        // Draw a subtle info box background
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(220, 220, 220);
        doc.roundedRect(10, y - 4, 190, infoRows.length * 7 + 6, 2, 2, "FD");

        infoRows.forEach(([label, value]) => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(80, 80, 80);
          doc.text(label, 16, y);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...dark);
          doc.text(value, 65, y);
          y += 7;
        });
        y += 4;

        // ── Site Map ────────────────────────────────────────────────────────
        if (mapImageDataUrl) {
          doc.setFontSize(9);
          doc.setTextColor(...teal);
          doc.setFont("helvetica", "bold");
          doc.text("SITE MAP", 14, y);
          y += 4;
          try {
            doc.addImage(mapImageDataUrl, "PNG", 14, y, 182, 70);
            y += 74;
          } catch {
            /* skip map if image fails */
          }
        }

        // ── Equipment List ──────────────────────────────────────────────────
        y += 2;
        doc.setFontSize(9);
        doc.setTextColor(...teal);
        doc.setFont("helvetica", "bold");
        doc.text("EQUIPMENT LIST", 14, y);
        y += 4;

        autoTable(doc, {
          startY: y,
          head: [["Name", "Category", "X (m)", "Y (m)", "W×D×H"]],
          body: state.objects.map((obj: any) => {
            const def = allDefs.find((d: any) => d.id === obj.type);
            const w = def?.width ?? obj.width ?? "?";
            const d2 = def?.depth ?? obj.depth ?? "?";
            const h = def?.height ?? obj.height ?? "?";
            return [
              obj.name ?? def?.name ?? obj.type ?? "",
              obj.category ?? def?.category ?? "",
              typeof obj.x === "number"
                ? obj.x.toFixed(1)
                : String(obj.x ?? ""),
              typeof obj.z === "number"
                ? obj.z.toFixed(1)
                : String(obj.z ?? ""),
              `${w}×${d2}×${h}`,
            ];
          }),
          headStyles: {
            fillColor: teal,
            textColor: white,
            fontStyle: "bold",
            fontSize: 9,
          },
          alternateRowStyles: { fillColor: lightGray },
          styles: { fontSize: 8.5, cellPadding: 2.5 },
          columnStyles: {
            0: { cellWidth: 55 }, // Name
            1: { cellWidth: 35 }, // Category
            2: { cellWidth: 22, halign: "right" }, // X
            3: { cellWidth: 22, halign: "right" }, // Z
            4: { cellWidth: 36, halign: "center" }, // W×D×H
          },
        });

        // ── Embed raw project data for re-import ────────────────────────────
        const rawData = JSON.stringify({
          version: "1.0",
          exportedAt: new Date().toISOString(),
          projectName,
          clientName,
          origin: state.originLngLat,
          siteBoundary: state.siteBoundary,
          objects: state.objects,
          customLibrary: state.customLibrary || [],
        });
        const encoded = btoa(unescape(encodeURIComponent(rawData)));

        // Method 1: PDF subject metadata (most reliable for re-import)
        doc.setProperties({
          title: `3D Site Configuration — ${projectName}`,
          subject: `CALIBIT_DATA_START:${encoded}:CALIBIT_DATA_END`,
          author: "Calibit 3D SiteConfigurator",
          creator: "Calibit v1.3.0",
        });

        // Method 2: Hidden text on page 2 as one single string
        // IMPORTANT: must be written as ONE doc.text() call — multiple calls
        // inject PDF binary operators (Tj/ET/BT/Tf) between chunks which corrupt the base64
        doc.addPage();
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(1);
        doc.text(`CALIBIT_DATA_START:${encoded}:CALIBIT_DATA_END`, 1, 5, {
          maxWidth: 200,
        });

        doc.save(`site-config-${timestamp}.pdf`);
      };

      if (mapboxToken && lng !== 0) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            generatePDF();
            return;
          }

          const mercatorX = (value: number) => (value + 180) / 360;
          const mercatorY = (value: number) => {
            const rad = (value * Math.PI) / 180;
            return (
              (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2
            );
          };

          ctx.drawImage(img, 0, 0);

          if (mapBbox) {
            const minX = mercatorX(mapBbox.minLng);
            const maxX = mercatorX(mapBbox.maxLng);
            const minY = mercatorY(mapBbox.maxLat);
            const maxY = mercatorY(mapBbox.minLat);
            const spanX = Math.max(maxX - minX, 0.000001);
            const spanY = Math.max(maxY - minY, 0.000001);
            const innerWidth =
              canvas.width - mapPadding.left - mapPadding.right;
            const innerHeight =
              canvas.height - mapPadding.top - mapPadding.bottom;
            const scale = Math.min(innerWidth / spanX, innerHeight / spanY);
            const offsetX = mapPadding.left + (innerWidth - spanX * scale) / 2;
            const offsetY = mapPadding.top + (innerHeight - spanY * scale) / 2;
            const projectPoint = (point: [number, number]) => {
              const px = offsetX + (mercatorX(point[0]) - minX) * scale;
              const py = offsetY + (mercatorY(point[1]) - minY) * scale;
              return { x: px, y: py };
            };

            if (boundary.length > 1) {
              ctx.save();
              ctx.beginPath();
              boundary.forEach((point: [number, number], index: number) => {
                const projected = projectPoint(point);
                if (index === 0) {
                  ctx.moveTo(projected.x, projected.y);
                } else {
                  ctx.lineTo(projected.x, projected.y);
                }
              });
              ctx.closePath();
              ctx.fillStyle = "rgba(20, 184, 166, 0.16)";
              ctx.strokeStyle = "#22c55e";
              ctx.lineWidth = 6;
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            }

            ctx.textBaseline = "middle";
            ctx.font = "bold 24px Arial";

            equipmentMapItems.forEach((item, index) => {
              const { x, y } = projectPoint([item.lng, item.lat]);
              const labelOffsetY = index % 2 === 0 ? -24 : 26;
              const labelX = Math.min(x + 14, canvas.width - 220);
              const labelY = Math.max(
                20,
                Math.min(y + labelOffsetY, canvas.height - 20),
              );
              const labelText = item.name;
              const textWidth = ctx.measureText(labelText).width;
              const labelWidth = Math.min(textWidth + 18, 220);

              ctx.save();
              ctx.fillStyle = "#14b8a6";
              ctx.beginPath();
              ctx.arc(x, y, 12, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = "#ecfeff";
              ctx.beginPath();
              ctx.arc(x, y, 4, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
              ctx.fillRect(labelX - 6, labelY - 14, labelWidth, 28);
              ctx.fillStyle = "#67e8f9";
              ctx.fillText(labelText, labelX, labelY);
              ctx.restore();
            });
          }

          generatePDF(canvas.toDataURL("image/png"));
        };
        img.onerror = () => generatePDF();
        img.src = staticMapUrl;
      } else {
        generatePDF();
      }
      return;
    }
    // JSON / DWG fallback (kept as plain JSON, since DWG generation needs a CAD library)
    // ── JSON / DWG fallback ────────────────────────────────────────────────
    const data = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      projectName,
      clientName,
      origin: state.originLngLat,
      siteBoundary: state.siteBoundary,
      objects: state.objects,
    };
    const extension = format === "dwg" ? "dwg" : "json";
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `site-config-${timestamp}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.dwg,.xlsx,.xls,.pdf";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const fileName = file.name.toLowerCase();

      const handleParsedData = (data: any) => {
        if (!data.objects && !data.siteBoundary) {
          alert("No valid project data found in this file.");
          return;
        }
        if (state.objects.length > 0 || state.siteBoundary.length > 0) {
          setPendingImportData(data);
          setImportModalOpen(true);
        } else {
          applyImport(data);
        }
      };

      if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        const reader = new FileReader();
        reader.onload = (re: any) => {
          try {
            const wb = XLSX.read(re.target.result, { type: "array" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, {
              header: 1,
              raw: false, // read everything as strings to avoid truncation
            }) as any[][];
            const rawSheet = wb.SheetNames.map(
              (sheetName) => wb.Sheets[sheetName],
            ).find((sheet) => {
              const marker = sheet?.["A1"];
              return (
                marker && String(marker.v).trim() === "RAW DATA (do not edit)"
              );
            });
            const rawRowsSource = rawSheet
              ? (XLSX.utils.sheet_to_json(rawSheet, {
                  header: 1,
                  raw: false,
                }) as any[][])
              : rows;

            // Strategy 1: Find RAW DATA row — most reliable, full round-trip
            const rawIdx = rawRowsSource.findIndex(
              (r) => String(r[0]).trim() === "RAW DATA (do not edit)",
            );
            if (rawIdx !== -1 && rawRowsSource[rawIdx + 1]) {
              try {
                const rawRows = [];
                for (let i = rawIdx + 1; i < rawRowsSource.length; i += 1) {
                  const row = rawRowsSource[i];
                  const firstCell = String(row?.[0] ?? "").trim();

                  if (!firstCell) {
                    break;
                  }

                  rawRows.push(row);
                }

                const rawText =
                  rawRows.length === 1 && rawRows[0]?.length === 1
                    ? String(rawRows[0][0] ?? "")
                    : rawRows
                        .map((row) =>
                          row.length > 1 ? String(row[1] ?? "") : "",
                        )
                        .join("");

                const parsed = JSON.parse(rawText);
                handleParsedData(parsed);
                return;
              } catch {
                // RAW DATA row corrupted, fall through to Equipment strategy
              }
            }

            // Strategy 2: Rebuild from EQUIPMENT LIST rows
            const equipIdx = rows.findIndex(
              (r) => String(r[0]).trim() === "EQUIPMENT LIST",
            );
            if (equipIdx !== -1) {
              // Skip the header row (equipIdx+1), read data rows until empty
              const dataRows = rows
                .slice(equipIdx + 2)
                .filter(
                  (r) =>
                    r[0] &&
                    String(r[0]).trim() !== "" &&
                    String(r[0]).trim() !== "RAW DATA (do not edit)",
                );

              if (dataRows.length === 0) {
                alert("Equipment list is empty in this file.");
                return;
              }

              const equipmentHeader = rows[equipIdx + 1] ?? [];
              const hasIdColumn =
                String(equipmentHeader[0] ?? "").trim() === "ID";
              const objects = dataRows.map((r: any) => ({
                id: hasIdColumn ? String(r[0] || uuidv4()) : uuidv4(),
                name: String(r[hasIdColumn ? 1 : 0] || ""),
                category: String(r[hasIdColumn ? 2 : 1] || ""),
                x: parseFloat(r[hasIdColumn ? 3 : 2]) || 0,
                z: parseFloat(r[hasIdColumn ? 4 : 3]) || 0,
                rotationY: parseFloat(r[hasIdColumn ? 5 : 4]) || 0,
                width: r[hasIdColumn ? 6 : 5]
                  ? parseFloat(r[hasIdColumn ? 6 : 5])
                  : undefined,
                depth: r[hasIdColumn ? 7 : 6]
                  ? parseFloat(r[hasIdColumn ? 7 : 6])
                  : undefined,
                height: r[hasIdColumn ? 8 : 7]
                  ? parseFloat(r[hasIdColumn ? 8 : 7])
                  : undefined,
                type: String(r[hasIdColumn ? 1 : 0] || ""),
                color: "#14b8a6",
              }));

              // Try to get boundary from Project Info section
              let siteBoundary = state.siteBoundary;
              handleParsedData({ objects, siteBoundary, version: "1.0" });
              return;
            }

            alert(
              "Could not find project data in this Excel file.\n\nMake sure the file was exported from this app and has not been edited.",
            );
          } catch (err) {
            console.error("Excel import error:", err);
            alert(
              "Failed to read Excel file: " +
                (err instanceof Error ? err.message : String(err)),
            );
          }
        };
        reader.readAsArrayBuffer(file);
        return;
      }

      // PDF — extract embedded JSON from metadata subject field
      // if (fileName.endsWith(".pdf")) {
      //   const reader = new FileReader();
      //   reader.onload = (re: any) => {
      //     try {
      //       const text = re.target.result as string;
      //       // jsPDF embeds subject as: /Subject (...)
      //       const match = text.match(/\/Subject\s*\(([^)]+(?:\)[^)]*)*)\)/);
      //       if (!match) {
      //         alert(
      //           "This PDF was not exported from this app or has no embedded project data.",
      //         );
      //         return;
      //       }
      //       // Unescape PDF string encoding
      //       const raw = match[1]
      //         .replace(/\\\(/g, "(")
      //         .replace(/\\\)/g, ")")
      //         .replace(/\\\\/g, "\\");
      //       handleParsedData(JSON.parse(raw));
      //     } catch (err) {
      //       console.error("PDF import error:", err);
      //       alert(
      //         "Failed to extract project data from PDF. Make sure it was exported from this app.",
      //       );
      //     }
      //   };
      //   reader.readAsText(file, "latin1"); // latin1 to preserve binary chars
      //   return;
      // }
      // PDF — extract embedded project data
      if (fileName.endsWith(".pdf")) {
        const extractEmbeddedBase64 = (text: string) => {
          const hiddenMatch =
            /CALIBIT_DATA_START:([A-Za-z0-9+/=\s\r\n]+?):CALIBIT_DATA_END/.exec(
              text,
            );
          if (hiddenMatch?.[1]) return hiddenMatch[1];

          const subjectMatch = /\/Subject\s*\((.*?)\)/s.exec(text);
          if (subjectMatch?.[1]) {
            const subject = subjectMatch[1]
              .replace(/\\\(/g, "(")
              .replace(/\\\)/g, ")")
              .replace(/\\\\/g, "\\");
            const subjectDataMatch =
              /CALIBIT_DATA_START:([A-Za-z0-9+/=\s\r\n]+?):CALIBIT_DATA_END/.exec(
                subject,
              );
            return subjectDataMatch?.[1] ?? null;
          }

          return null;
        };

        const reader = new FileReader();
        reader.onload = (re: any) => {
          try {
            const buffer = re.target.result as ArrayBuffer;
            const bytes = new Uint8Array(buffer);

            let text = "";
            for (let i = 0; i < bytes.length; i++) {
              text += String.fromCharCode(bytes[i]);
            }

            const raw = extractEmbeddedBase64(text);
            if (!raw) {
              alert(
                "This PDF has no embedded project data.\n\nOnly PDFs exported from this app can be re-imported.\n\nPlease export as PDF from this app first.",
              );
              return;
            }

            const base64 = raw.replace(/[^A-Za-z0-9+/=]/g, "");
            const json = decodeURIComponent(escape(atob(base64)));
            const parsed = JSON.parse(json);
            handleParsedData(parsed);
          } catch (err) {
            console.error("PDF import error:", err);
            alert(
              "Failed to read project data from this PDF.\n\nMake sure it was exported from this app and has not been modified.",
            );
          }
        };
        reader.readAsArrayBuffer(file);
        return;
      }

      // JSON / DWG — plain text
      const reader = new FileReader();
      reader.onload = (re: any) => {
        try {
          const data = JSON.parse(re.target.result as string);
          handleParsedData(data);
        } catch (err) {
          console.error("JSON import error:", err);
          alert(
            "Failed to parse file. Make sure it is a valid JSON or DWG export from this app.",
          );
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // const handleSave = async () => {
  //   if (!user || !tenant) return;

  //   const projectName = prompt("Enter project name:", "New Project") || "Untitled Project";

  //   const data = {
  //     origin: state.originLngLat,
  //     siteBoundary: state.siteBoundary,
  //     objects: state.objects,
  //   };

  //   const res = await authFetch('/api/projects', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //       id: uuidv4(),
  //       tenant_id: tenant.id,
  //       user_id: user.id,
  //       name: projectName,
  //       data
  //     })
  //   });

  //   if (res.ok) {
  //     alert("Project saved successfully!");
  //   } else {
  //     alert("Failed to save project.");
  //   }
  // };
  const handleSave = async () => {
    if (!user || !tenant) return;

    const data = {
      origin: state.originLngLat,
      siteBoundary: state.siteBoundary,
      objects: state.objects,
    };

    if (currentProjectId) {
      // Re-save existing project
      const res = await authFetch(`/api/projects/${currentProjectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (res.ok) {
        if (!currentProjectName) {
          const savedProject = projects.find((p) => p.id === currentProjectId);
          if (savedProject?.name) setCurrentProjectName(savedProject.name);
        }
        alert("Project updated successfully!");
        fetchProjects(tenant);
      } else {
        alert("Failed to update project.");
      }
    } else {
      // Create new project — require both project name and client/company name
      const projectName = prompt("Enter project name:", "New Project");
      if (!projectName || !projectName.trim()) {
        alert("Project name is required. Project not saved.");
        return;
      }
      const clientName = prompt("Enter company/client name:", "");
      if (!clientName || !clientName.trim()) {
        alert("Client/company name is required. Project not saved.");
        return;
      }
      const newId = uuidv4();
      const res = await authFetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newId,
          tenant_id: tenant.id,
          user_id: user.id,
          name: projectName,
          client_name: clientName,
          data,
        }),
      });
      if (res.ok) {
        setCurrentProjectId(newId);
        setCurrentProjectName(projectName);
        setCurrentClientName(clientName);
        setCurrentProjectCreatedAt(new Date().toISOString());
        setCurrentProjectUpdatedAt(new Date().toISOString());
        alert("Project saved successfully!");
        fetchProjects(tenant);
      } else {
        alert("Failed to save project.");
      }
    }
  };

  // ─── Add handleOpenProject function (after handleSave) ───
  const handleOpenProject = async (projectId: string) => {
    try {
      const res = await authFetch(`/api/projects/${projectId}`);
      if (!res.ok) {
        alert("Failed to load project.");
        return;
      }
      const project = await res.json();
      const data =
        typeof project.data === "string"
          ? JSON.parse(project.data)
          : project.data;

      if (data.siteBoundary) setBoundary(data.siteBoundary);
      if (data.objects) setObjects(data.objects);

      setCurrentProjectId(projectId);
      setCurrentProjectName(project.name || projectId);
      setCurrentClientName(project.client_name || null);
      setCurrentProjectCreatedAt(project.created_at || null);
      setCurrentProjectUpdatedAt(project.updated_at || null);
    } catch {
      alert("Failed to load project.");
    }
  };

  // ───  Add handleDeleteProject function (after handleOpenProject) ───
  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    // If currently editing this project, clear it
    if (currentProjectId === projectId) {
      setCurrentProjectId(null);
      setCurrentProjectName(null);
      setCurrentClientName(null);
    }
  };

  const applyImport = (data: any) => {
    if (data.siteBoundary) setBoundary(data.siteBoundary);
    if (data.objects) setObjects(data.objects);
    alert("Imported site configuration.");
    setImportModalOpen(false);
    setPendingImportData(null);
  };

  const handleConfirmImport = () => {
    if (pendingImportData) {
      applyImport(pendingImportData);
    }
  };

  const handleExportAndImport = () => {
    handleExport();
    if (pendingImportData) {
      applyImport(pendingImportData);
    }
  };

  const handleNewProject = () => {
    setCurrentProjectId(null);
    setCurrentProjectName(null);
    setCurrentClientName(null);
    setBoundary([]);
    setObjects([]);
  };

  const fetchProjects = async (tenantData: Tenant | null) => {
    if (!tenantData) return;
    const res = await authFetch(`/api/projects?tenantId=${tenantData.id}`);
    if (res.ok) {
      // const contentType = res.headers.get("content-type");

      // if (!contentType || !contentType.includes("application/json")) {
      //   const text = await res.text();
      //   console.error("❌ BROKEN API:", res.url);
      //   console.error("❌ RESPONSE:", text);
      //   throw new Error("Invalid JSON response");
      // }

      const data = await res.json();
      setProjects(data);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (state.selectedId) removeObject(state.selectedId);
      }
      if (e.key === "Escape") {
        selectObject(null);
        setPendingPlacement(null);
        setIsMeasuring(false);
        setMeasurePoints([]);
      }
      if (e.key === "r" || e.key === "R") {
        if (state.selectedId) {
          const obj = state.objects.find((o) => o.id === state.selectedId);
          if (obj) {
            updateObject(state.selectedId, {
              rotationY: obj.rotationY + (5 * Math.PI) / 180,
            });
          }
        }
      }
      if (e.key === "m" || e.key === "M") {
        setIsMeasuring((prev) => !prev);
        setMeasurePoints([]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    state.selectedId,
    state.objects,
    removeObject,
    selectObject,
    setPendingPlacement,
    updateObject,
    setMeasurePoints,
  ]);

  // if (!user) {
  //   return <Login onLogin={handleLogin} />;
  // }

  if (!user) {
    if (showForgotPassword) {
      return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
    }
    if (showContactAdmin) {
      return <ContactAdmin onBack={() => setShowContactAdmin(false)} />;
    }
    return (
      <Login
        onLogin={handleLogin}
        onForgotPassword={() => setShowForgotPassword(true)}
        onContactAdmin={() => setShowContactAdmin(true)}
      />
    );
  }

  // Force password change if user logged in with temp password
  if (user.force_password_change) {
    return (
      <ForcePasswordChange
        user={user}
        onPasswordChanged={() => setUser({ ...user, force_password_change: 0 })}
      />
    );
  }

  if (user.role === "platform_admin") {
    return (
      <div className="relative h-screen">
        <PlatformAdminDashboard
          user={user}
          onLogout={handleLogout}
          onUserUpdate={handleUserUpdate}
          onShowToast={showToast}
        />
        {toast && (
          <div
            className={`fixed right-6 top-6 z-50 rounded-2xl px-5 py-3 text-sm font-semibold shadow-xl shadow-black/10 transition-all ${
              toast.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-rose-500 text-white"
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    );
  }

  if (user.role === "tenant_admin" && !state.originLngLat) {
    return (
      <div className="relative h-screen">
        <AdminDashboard
          user={user}
          tenant={tenant!}
          onLogout={handleLogout}
          onUserUpdate={handleUserUpdate}
          onShowToast={showToast}
        />
        {toast && (
          <div
            className={`fixed right-6 top-6 z-50 rounded-2xl px-5 py-3 text-sm font-semibold shadow-xl shadow-black/10 transition-all ${
              toast.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-rose-500 text-white"
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-brand-navy select-none">
      <Sidebar
        state={state}
        onSetStyle={setMapStyle}
        onToggleTerrain={toggleTerrain}
        onToggleBuildings={toggleBuildings}
        onDrawBoundary={() => setDrawTrigger((t) => t + 1)}
        onDeleteBoundary={() => setBoundary([])}
        onToggleMeasure={() => {
          setIsMeasuring(!isMeasuring);
          setMeasurePoints([]);
        }}
        onToggleBoundaryLock={toggleBoundaryLock}
        onSelectEquipment={setPendingPlacement}
        onDeleteSelected={() =>
          state.selectedId && removeObject(state.selectedId)
        }
        onUpdateObject={updateObject}
        onExport={handleExport}
        onImport={handleImport}
        onSave={handleSave}
        onAddCustomEquipment={addCustomEquipment}
        onSetUnitSystem={setUnitSystem}
        onOpenCompliance={() => setComplianceOpen(true)}
        onLogout={handleLogout}
        onOpenProjects={() => setProjectsPanelOpen(true)}
        onLoadProject={(boundary, objects) => {
          setBoundary(boundary);
          setObjects(objects);
        }}
        projects={projects}
        user={user}
        tenant={tenant}
        currentProjectId={currentProjectId}
        currentProjectName={currentProjectName}
        onUserUpdate={handleUserUpdate}
        onShowToast={showToast}
        // disabledDefaults={disabledDefaults}
      />
      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 rounded-2xl px-5 py-3 text-sm font-semibold shadow-xl shadow-black/10 transition-all ${
            toast.type === "success"
              ? "bg-emerald-500 text-white"
              : "bg-rose-500 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <main className="flex-1 flex relative h-screen overflow-hidden">
        <div className="h-full w-full relative">
          <MapPanel
            state={state}
            isMeasuring={isMeasuring}
            onBoundaryChange={setBoundary}
            onMapMove={() => {}}
            onMapClick={handleMapClick}
            onObjectSelect={selectObject}
            onObjectUpdate={handleObjectUpdate}
            onSetBoundaryLock={setBoundaryLock}
            drawTrigger={drawTrigger}
            targetLocation={targetLocation}
          />

          <CompliancePanel
            state={state}
            isOpen={complianceOpen}
            onClose={() => setComplianceOpen(false)}
          />

          <ProjectsPanel
            isOpen={projectsPanelOpen}
            onClose={() => setProjectsPanelOpen(false)}
            projects={projects}
            user={user}
            tenant={tenant}
            onOpenProject={handleOpenProject}
            onDeleteProject={handleDeleteProject}
            onRefresh={() => fetchProjects(tenant)}
            currentProjectId={currentProjectId}
            onNewProject={handleNewProject}
            customEquipment={state.customLibrary || []}
          />

          {/* Top Overlays */}
          <div className="absolute top-4 left-4 right-4 flex items-start justify-end pointer-events-none">
            <div className="pointer-events-auto">
              <LocationSearch
                onSelectLocation={(lng, lat) => setTargetLocation({ lng, lat })}
              />
            </div>
          </div>
        </div>

        {/* Import Confirmation Modal */}
        <Modal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          title="Confirm Import"
          footer={
            <>
              <button
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExportAndImport}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg border border-white/10 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Export & Replace
              </button>
              <button
                onClick={handleConfirmImport}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-all shadow-lg shadow-red-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Replace Existing
              </button>
            </>
          }
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">
                Replace existing design?
              </p>
              <p className="text-xs text-white/60 leading-relaxed">
                You already have a design in progress. Importing a new file will
                permanently replace your current site boundary and all placed
                equipment.
              </p>
            </div>
          </div>
        </Modal>

        {/* Status Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-brand-navy/90 border-t border-white/10 flex items-center px-4 justify-between text-[10px] text-white/40 font-mono z-50">
          {/* <div className="flex gap-4">
            <span>MODE: {state.pendingPlacement ? 'PLACEMENT' : 'IDLE'}</span>
            <span>OBJECTS: {state.objects.length}</span>
            {state.selectedId && <span>SELECTED: {state.objects.find(o => o.id === state.selectedId)?.type}</span>}
          </div> */}
          {/* <div className="flex gap-4"> */}
          {/* <div className="flex h-screen overflow-hidden">
            <span>3D VIEW ENABLED</span>
          </div> */}
        </div>
      </main>
    </div>
  );
}
