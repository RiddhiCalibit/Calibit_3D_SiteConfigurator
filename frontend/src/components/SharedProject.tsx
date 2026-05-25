// // import React, { useEffect, useState } from "react";

// // const API_URL = import.meta.env.VITE_API_URL || "";

// // export default function SharedProject() {
// //   const [project, setProject] = useState<any>(null);
// //   const [error, setError] = useState("");
// //   const [loading, setLoading] = useState(true);

// //   useEffect(() => {
// //     // const token = window.location.pathname.split("/shared/")[1];

// //     const fullPath = window.location.pathname + window.location.href;
// //     const match = (
// //       window.location.pathname +
// //       window.location.search +
// //       window.location.hash
// //     ).match(/\/shared\/([a-f0-9]+)/);
// //     const token = match
// //       ? match[1]
// //       : window.location.href.match(/\/shared\/([a-f0-9]+)/)?.[1];

// //     if (!token) {
// //       setError("Invalid share link.");
// //       setLoading(false);
// //       return;
// //     }

// //     fetch(`${API_URL}/api/projects/shared/${token}`)
// //       .then((res) => res.json())
// //       .then((data) => {
// //         if (data.error) {
// //           setError(data.error);
// //         } else {
// //           setProject(data);
// //         }
// //         setLoading(false);
// //       })
// //       .catch(() => {
// //         setError("Failed to load shared project.");
// //         setLoading(false);
// //       });
// //   }, []);

// //   if (loading)
// //     return (
// //       <div className="flex items-center justify-center h-screen bg-[#0f1623] text-white">
// //         <p className="text-sm opacity-50">Loading shared project...</p>
// //       </div>
// //     );

// //   if (error)
// //     return (
// //       <div className="flex items-center justify-center h-screen bg-[#0f1623] text-white">
// //         <div className="text-center">
// //           <p className="text-lg font-bold text-red-400">Link not found</p>
// //           <p className="text-sm opacity-50 mt-2">{error}</p>
// //         </div>
// //       </div>
// //     );

// //   const objects = project?.data?.objects || [];
// //   const boundary = project?.data?.siteBoundary || [];

// //   return (
// //     <div className="min-h-screen bg-[#0f1623] text-white p-8">
// //       <div className="max-w-2xl mx-auto">
// //         {/* Header */}
// //         <div className="mb-8">
// //           <div className="flex items-center gap-3 mb-2">
// //             <div className="w-10 h-10 rounded-xl bg-brand-teal/20 flex items-center justify-center text-brand-teal font-bold">
// //               3D
// //             </div>
// //             <div>
// //               <h1 className="text-xl font-bold">{project.name}</h1>
// //               <p className="text-xs opacity-40">Shared Site Configuration</p>
// //             </div>
// //           </div>
// //           <p className="text-xs opacity-30 mt-3">
// //             Created{" "}
// //             {new Date(project.created_at).toLocaleDateString("en-IN", {
// //               day: "numeric",
// //               month: "long",
// //               year: "numeric",
// //             })}
// //             {project.updated_at &&
// //               ` · Updated ${new Date(project.updated_at).toLocaleDateString(
// //                 "en-IN",
// //                 {
// //                   day: "numeric",
// //                   month: "long",
// //                   year: "numeric",
// //                 },
// //               )}`}
// //           </p>
// //         </div>

// //         {/* Boundary info */}
// //         <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
// //           <p className="text-xs uppercase tracking-widest opacity-40 mb-2">
// //             Site Boundary
// //           </p>
// //           <p className="text-sm">
// //             {boundary.length > 0
// //               ? `${boundary.length} boundary points defined`
// //               : "No boundary set"}
// //           </p>
// //         </div>

// //         {/* Equipment list */}
// //         <div className="bg-white/5 border border-white/10 rounded-xl p-4">
// //           <p className="text-xs uppercase tracking-widest opacity-40 mb-4">
// //             Equipment Placed ({objects.length} items)
// //           </p>
// //           {objects.length === 0 ? (
// //             <p className="text-sm opacity-30">No equipment placed</p>
// //           ) : (
// //             <div className="space-y-2">
// //               {Object.entries(
// //                 objects.reduce((acc: any, obj: any) => {
// //                   acc[obj.type] = (acc[obj.type] || 0) + 1;
// //                   return acc;
// //                 }, {}),
// //               ).map(([type, count]) => (
// //                 <div
// //                   key={type}
// //                   className="flex items-center justify-between py-2 border-b border-white/5"
// //                 >
// //                   <span className="text-sm capitalize">
// //                     {type.replace(/_/g, " ")}
// //                   </span>
// //                   <span className="text-sm font-bold text-brand-teal">
// //                     ×{count as number}
// //                   </span>
// //                 </div>
// //               ))}
// //             </div>
// //           )}
// //         </div>

// //         <p className="text-center text-xs opacity-20 mt-8 uppercase tracking-widest">
// //           Powered by Calibit 3D Site Configurator
// //         </p>
// //       </div>
// //     </div>
// //   );
// // }

// import React, { useEffect, useState, useRef } from "react";
// import mapboxgl from "mapbox-gl";
// import "mapbox-gl/dist/mapbox-gl.css";

// const API_URL = import.meta.env.VITE_API_URL || "";
// mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || "";

// export default function SharedProject() {
//   const [project, setProject] = useState<any>(null);
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(true);
//   const mapRef = useRef<HTMLDivElement>(null);
//   const mapInstanceRef = useRef<mapboxgl.Map | null>(null);

//   useEffect(() => {
//     const match = window.location.href.match(/\/shared\/([a-f0-9]+)/);
//     const token = match ? match[1] : null;

//     if (!token) {
//       setError("Invalid share link.");
//       setLoading(false);
//       return;
//     }

//     fetch(`${API_URL}/api/projects/shared/${token}`)
//       .then((res) => res.json())
//       .then((data) => {
//         if (data.error) setError(data.error);
//         else setProject(data);
//         setLoading(false);
//       })
//       .catch(() => {
//         setError("Failed to load shared project.");
//         setLoading(false);
//       });
//   }, []);

//   // Initialize map once project is loaded
//   useEffect(() => {
//     if (!project || !mapRef.current || mapInstanceRef.current) return;

//     const boundary = project.data?.siteBoundary || [];
//     const objects = project.data?.objects || [];
//     const origin = project.data?.origin;

//     // Center on first boundary point or origin
//     const center: [number, number] = origin
//       ? [origin[0], origin[1]]
//       : boundary.length > 0
//         ? [boundary[0][0], boundary[0][1]]
//         : [73.85, 18.52];

//     const map = new mapboxgl.Map({
//       container: mapRef.current,
//       style: "mapbox://styles/mapbox/streets-v12",
//       center,
//       zoom: 17,
//       interactive: true, // allow zoom/pan but no editing
//     });

//     mapInstanceRef.current = map;

//     map.on("load", () => {
//       // Draw boundary polygon
//       if (boundary.length > 2) {
//         map.addSource("boundary", {
//           type: "geojson",
//           data: {
//             type: "Feature",
//             geometry: {
//               type: "Polygon",
//               coordinates: [[...boundary, boundary[0]]],
//             },
//             properties: {},
//           },
//         });
//         map.addLayer({
//           id: "boundary-fill",
//           type: "fill",
//           source: "boundary",
//           paint: {
//             "fill-color": "#14b8a6",
//             "fill-opacity": 0.15,
//           },
//         });
//         map.addLayer({
//           id: "boundary-line",
//           type: "line",
//           source: "boundary",
//           paint: {
//             "line-color": "#14b8a6",
//             "line-width": 2,
//           },
//         });
//       }

//       // Add equipment markers
//       objects.forEach((obj: any) => {
//         if (!origin) return;
//         // Convert metres back to lngLat
//         const lng =
//           origin[0] + obj.x / (111320 * Math.cos((origin[1] * Math.PI) / 180));
//         const lat = origin[1] + obj.z / 110540;

//         const el = document.createElement("div");
//         el.style.width = "12px";
//         el.style.height = "12px";
//         el.style.borderRadius = "50%";
//         el.style.backgroundColor = obj.color || "#14b8a6";
//         el.style.border = "2px solid white";
//         el.style.boxShadow = "0 0 4px rgba(0,0,0,0.5)";

//         new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map);
//       });
//     });

//     return () => {
//       map.remove();
//       mapInstanceRef.current = null;
//     };
//   }, [project]);

//   if (loading)
//     return (
//       <div className="flex items-center justify-center h-screen bg-[#0f1623] text-white">
//         <p className="text-sm opacity-50">Loading shared project...</p>
//       </div>
//     );

//   if (error)
//     return (
//       <div className="flex items-center justify-center h-screen bg-[#0f1623] text-white">
//         <div className="text-center">
//           <p className="text-lg font-bold text-red-400">Link not found</p>
//           <p className="text-sm opacity-50 mt-2">{error}</p>
//         </div>
//       </div>
//     );

//   const objects = project?.data?.objects || [];
//   const boundary = project?.data?.siteBoundary || [];

//   // After project is loaded, build equipment name lookup:
//   const buildEquipmentLookup = (customEquipment: any[]) => {
//     const defaults: Record<string, string> = {
//       small_slide: "Small Slide",
//       large_slide: "Large Slide",
//       tower_3d: "Tower",
//       duck_3d: "Duck",
//       wave_pool: "Wave Pool",
//       lazy_river: "Lazy River",
//       splash_pad: "Splash Pad",
//       pump_station: "Pump Station",
//       ticket_booth: "Ticket Booth",
//       locker_block: "Locker Block",
//       food_kiosk: "Food Kiosk",
//       seating_area: "Seating Area",
//     };
//     // Add custom equipment by their UUID id
//     customEquipment.forEach((eq: any) => {
//       defaults[eq.id] = eq.name;
//     });
//     return defaults;
//   };

//   return (
//     <div className="min-h-screen bg-[#0f1623] text-white">
//       {/* Header */}
//       <div className="p-6 border-b border-white/10">
//         <div className="max-w-6xl mx-auto flex items-center gap-3">
//           <div className="w-10 h-10 rounded-xl bg-brand-teal/20 flex items-center justify-center text-brand-teal font-bold">
//             3D
//           </div>
//           <div>
//             <h1 className="text-xl font-bold">{project.name}</h1>
//             {project.client_name && (
//               <p className="text-sm text-brand-teal/80 mt-0.5">
//                 🏢 {project.client_name}
//               </p>
//             )}
//             <p className="text-xs opacity-40">
//               Shared Site Configuration · Created{" "}
//               {new Date(project.created_at).toLocaleDateString("en-IN", {
//                 day: "numeric",
//                 month: "long",
//                 year: "numeric",
//               })}
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Main content - map + details side by side */}
//       <div className="max-w-6xl mx-auto p-6 flex gap-6">
//         {/* Map - takes most of the width */}
//         <div className="flex-1">
//           <div
//             ref={mapRef}
//             className="w-full rounded-xl overflow-hidden border border-white/10"
//             style={{ height: "500px" }}
//           />
//         </div>

//         {/* Details panel */}
//         <div className="w-72 space-y-4 flex-shrink-0">
//           {/* Boundary info */}
//           <div className="bg-white/5 border border-white/10 rounded-xl p-4">
//             <p className="text-xs uppercase tracking-widest opacity-40 mb-2">
//               Site Boundary
//             </p>
//             <p className="text-sm">
//               {boundary.length > 0
//                 ? `${boundary.length} boundary points`
//                 : "No boundary set"}
//             </p>
//           </div>

//           const equipmentNames = buildEquipmentLookup(project.customEquipment || []);

// objects.forEach((obj: any) => {
//   // ... lng/lat calculation ...

//   const el = document.createElement("div");
//   el.style.cssText = `
//     background: ${obj.color || '#14b8a6'};
//     border: 2px solid white;
//     border-radius: 6px;
//     padding: 3px 6px;
//     font-size: 10px;
//     font-weight: bold;
//     color: white;
//     white-space: nowrap;
//     box-shadow: 0 2px 6px rgba(0,0,0,0.4);
//   `;
//   el.textContent = equipmentNames[obj.type] || obj.type.replace(/_/g, ' ');

//   new mapboxgl.Marker({ element: el, anchor: 'center' })
//     .setLngLat([lng, lat])
//     .addTo(map);
// });

//           {/* Equipment list */}
//           <div className="bg-white/5 border border-white/10 rounded-xl p-4">
//             <p className="text-xs uppercase tracking-widest opacity-40 mb-4">
//               Equipment ({objects.length} items)
//             </p>
//             {objects.length === 0 ? (
//               <p className="text-sm opacity-30">No equipment placed</p>
//             ) : (
//               <div className="space-y-2">
//                 {Object.entries(
//                   objects.reduce((acc: any, obj: any) => {
//                     acc[obj.type] = (acc[obj.type] || 0) + 1;
//                     return acc;
//                   }, {}),
//                 ).map(([type, count]) => (
//                   <div
//                     key={type}
//                     className="flex items-center justify-between py-1.5 border-b border-white/5"
//                   >
//                     <span className="text-sm capitalize">
//                       {/* {type.replace(/_/g, " ")} */}
//                       {equipmentNames[type] ||
//                         (type as string).replace(/_/g, " ")}
//                     </span>
//                     <span className="text-sm font-bold text-brand-teal">
//                       ×{count as number}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       <p className="text-center text-xs opacity-20 pb-8 uppercase tracking-widest">
//         Powered by Calibit 3D Site Configurator
//       </p>
//     </div>
//   );
// }

import React, { useEffect, useState, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const API_URL = import.meta.env.VITE_API_URL || "";
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || "";

const DEFAULT_EQUIPMENT_NAMES: Record<string, string> = {
  small_slide: "Small Slide",
  large_slide: "Large Slide",
  tower_3d: "Tower",
  duck_3d: "Duck",
  wave_pool: "Wave Pool",
  lazy_river: "Lazy River",
  splash_pad: "Splash Pad",
  pump_station: "Pump Station",
  ticket_booth: "Ticket Booth",
  locker_block: "Locker Block",
  food_kiosk: "Food Kiosk",
  seating_area: "Seating Area",
};

function buildEquipmentLookup(customEquipment: any[]): Record<string, string> {
  const lookup = { ...DEFAULT_EQUIPMENT_NAMES };
  customEquipment.forEach((eq: any) => {
    lookup[eq.id] = eq.name;
  });
  return lookup;
}

export default function SharedProject() {
  const [project, setProject] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const match = window.location.href.match(/\/shared\/([a-f0-9]+)/);
    const token = match ? match[1] : null;

    if (!token) {
      setError("Invalid share link.");
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/api/projects/shared/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setProject(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load shared project.");
        setLoading(false);
      });
  }, []);

  // Initialize map once project is loaded
  useEffect(() => {
    if (!project || !mapRef.current || mapInstanceRef.current) return;

    const boundary = project.data?.siteBoundary || [];
    const objects = project.data?.objects || [];
    const origin = project.data?.origin;

    const originalPath =
      sessionStorage.getItem("originalPath") || window.location.href;
    const match = originalPath.match(/\/shared\/([a-f0-9]+)/);
    const token = match ? match[1] : null;

    const center: [number, number] = origin
      ? [origin[0], origin[1]]
      : boundary.length > 0
        ? [boundary[0][0], boundary[0][1]]
        : [73.85, 18.52];

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center,
      zoom: 17,
      interactive: true,
    });

    mapInstanceRef.current = map;

    const equipmentNames = buildEquipmentLookup(project.customEquipment || []);

    map.on("load", () => {
      // Draw boundary polygon
      if (boundary.length > 2) {
        map.addSource("boundary", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[...boundary, boundary[0]]],
            },
            properties: {},
          },
        });
        map.addLayer({
          id: "boundary-fill",
          type: "fill",
          source: "boundary",
          paint: { "fill-color": "#14b8a6", "fill-opacity": 0.15 },
        });
        map.addLayer({
          id: "boundary-line",
          type: "line",
          source: "boundary",
          paint: { "line-color": "#14b8a6", "line-width": 2 },
        });
      }

      // Add equipment markers with labels
      objects.forEach((obj: any) => {
        if (!origin) return;

        const lng =
          origin[0] + obj.x / (111320 * Math.cos((origin[1] * Math.PI) / 180));
        const lat = origin[1] + obj.z / 110540;

        const label = equipmentNames[obj.type] || obj.type.replace(/_/g, " ");

        const el = document.createElement("div");
        el.style.cssText = `
          background: ${obj.color || "#14b8a6"};
          border: 2px solid white;
          border-radius: 6px;
          padding: 3px 6px;
          font-size: 10px;
          font-weight: bold;
          color: white;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          cursor: default;
          text-transform: capitalize;
        `;
        el.textContent = label;

        new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([lng, lat])
          .addTo(map);
      });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [project]);

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
  const equipmentNames = buildEquipmentLookup(project.customEquipment || []);

  return (
    <div className="min-h-screen overflow-y-auto bg-[#0f1623] text-white">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-teal/20 flex items-center justify-center text-brand-teal font-bold text-sm">
            3D
          </div>
          <div>
            <h1 className="text-xl font-bold">{project.name}</h1>
            {project.client_name && (
              <p className="text-sm text-brand-teal/80 mt-0.5">
                🏢 {project.client_name}
              </p>
            )}
            <p className="text-xs opacity-40 mt-0.5">
              Shared Site Configuration · Created{" "}
              {new Date(project.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      {/* <div className="max-w-6xl mx-auto p-6 flex gap-6"> */}
      <div className="max-w-6xl mx-auto p-6 flex gap-6 items-start overflow-y-auto items-start flex-wrap">
        {/* Map */}
        <div className="flex-1">
          <div
            ref={mapRef}
            className="w-full rounded-xl overflow-hidden border border-white/10"
            style={{ height: "500px" }}
          />
        </div>

        {/* Details panel */}
        <div className="w-72 space-y-4 flex-shrink-0">
          {/* Boundary info */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs uppercase tracking-widest opacity-40 mb-2">
              Site Boundary
            </p>
            <p className="text-sm">
              {boundary.length > 0
                ? `${boundary.length} boundary points`
                : "No boundary set"}
            </p>
          </div>

          {/* Equipment list */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs uppercase tracking-widest opacity-40 mb-4">
              Equipment ({objects.length} items)
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
                    className="flex items-center justify-between py-1.5 border-b border-white/5"
                  >
                    <span className="text-sm capitalize">
                      {equipmentNames[type] ||
                        (type as string).replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-bold text-brand-teal">
                      ×{count as number}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* <p className="text-center text-xs opacity-20 pb-8 uppercase tracking-widest"> */}
      <p className="text-center text-xs opacity-20 uppercase py-10">
        Powered by Calibit 3D Site Configurator
      </p>
    </div>
  );
}
