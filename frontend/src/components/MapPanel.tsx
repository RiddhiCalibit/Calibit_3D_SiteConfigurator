// // import React, { useEffect, useRef, useState, useCallback } from "react";
// // import mapboxgl from "mapbox-gl";
// // import "mapbox-gl/dist/mapbox-gl.css";
// // import MapboxDraw from "@mapbox/mapbox-gl-draw";
// // import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
// // import { AppState, DEFAULT_LIBRARY } from "../../../backend/types";
// // import * as turf from "@turf/turf";
// // import { metresToLngLat, lngLatToMetres } from "../utils/geo";
// // import { useTheme } from "../contexts/ThemeContext";

// // interface MapPanelProps {
// //   state: AppState;
// //   isMeasuring: boolean;
// //   onBoundaryChange: (coords: [number, number][]) => void;
// //   onMapMove: (e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent) => void;
// //   onMapClick: (e: mapboxgl.MapMouseEvent) => void;
// //   onObjectSelect: (id: string | null) => void;
// //   onObjectUpdate: (id: string, updates: any) => void;
// //   onSetBoundaryLock?: (locked: boolean) => void;
// //   drawTrigger: number;
// //   targetLocation?: { lng: number; lat: number; zoom?: number };
// // }

// // export const MapPanel: React.FC<MapPanelProps> = ({
// //   state,
// //   isMeasuring,
// //   onBoundaryChange,
// //   onMapMove,
// //   onMapClick,
// //   onObjectSelect,
// //   onObjectUpdate,
// //   onSetBoundaryLock,
// //   drawTrigger,
// //   targetLocation,
// // }) => {
// //   const mapContainerRef = useRef<HTMLDivElement>(null);
// //   const mapRef = useRef<mapboxgl.Map | null>(null);
// //   const drawRef = useRef<MapboxDraw | null>(null);
// //   const measureMarkersRef = useRef<mapboxgl.Marker[]>([]);
// //   const measureLineRef = useRef<mapboxgl.Marker | null>(null);
// //   const originMarkerRef = useRef<mapboxgl.Marker | null>(null);
// //   const [hoverCoords, setHoverCoords] = useState<[number, number] | null>(null);
// //   const draggingIdRef = useRef<string | null>(null);
// //   const { theme } = useTheme();

// //   // Use refs for callbacks to avoid stale closures in Mapbox event listeners
// //   const callbacks = useRef({
// //     onBoundaryChange,
// //     onMapMove,
// //     onMapClick,
// //     onObjectSelect,
// //     onObjectUpdate,
// //     onSetBoundaryLock: undefined as any as
// //       | ((locked: boolean) => void)
// //       | undefined,
// //     state,
// //   });

// //   // Build equipment features from app state (used on initial load and style reloads)
// //   const buildEquipmentFeatureCollection = (
// //     stateSnapshot: AppState,
// //     map: mapboxgl.Map,
// //   ) => {
// //     if (!stateSnapshot.originLngLat) {
// //       return { type: "FeatureCollection", features: [] } as any;
// //     }

// //     const features = stateSnapshot.objects
// //       .map((obj) => {
// //         const def =
// //           DEFAULT_LIBRARY.find((d) => d.id === obj.type) ??
// //           stateSnapshot.customLibrary.find((d) => d.id === obj.type);
// //         if (!def) return null;

// //         const lngLat = metresToLngLat(
// //           obj.x,
// //           obj.z,
// //           stateSnapshot.originLngLat!,
// //         );

// //         if (def.modelUrl) {
// //           if (!map.hasModel(def.modelUrl)) {
// //             map.addModel(def.modelUrl, def.modelUrl);
// //           }

// //           return {
// //             type: "Feature",
// //             id: obj.id,
// //             geometry: {
// //               type: "Point",
// //               coordinates: [lngLat[0], lngLat[1]],
// //             },
// //             properties: {
// //               id: obj.id,
// //               color: obj.color || def.color,
// //               height: def.height,
// //               "model-uri": def.modelUrl,
// //               rotation: (obj.rotationY * 180) / Math.PI,
// //               animations: def.animationsEnabled
// //                 ? [{ name: "*", state: "play" }]
// //                 : [],
// //             },
// //           };
// //         }

// //         const halfW = def.width / 2;
// //         const halfD = def.depth / 2;

// //         const cornersMetres = [
// //           { x: -halfW, z: -halfD },
// //           { x: halfW, z: -halfD },
// //           { x: halfW, z: halfD },
// //           { x: -halfW, z: halfD },
// //           { x: -halfW, z: -halfD },
// //         ];

// //         const rotatedCorners = cornersMetres.map((c) => {
// //           const rx =
// //             c.x * Math.cos(obj.rotationY) - c.z * Math.sin(obj.rotationY);
// //           const rz =
// //             c.x * Math.sin(obj.rotationY) + c.z * Math.cos(obj.rotationY);
// //           return metresToLngLat(
// //             obj.x + rx,
// //             obj.z + rz,
// //             stateSnapshot.originLngLat!,
// //           );
// //         });

// //         return {
// //           type: "Feature",
// //           id: obj.id,
// //           geometry: {
// //             type: "Polygon",
// //             coordinates: [rotatedCorners],
// //           },
// //           properties: {
// //             id: obj.id,
// //             color: obj.color || def.color,
// //             height: def.height,
// //           },
// //         };
// //       })
// //       .filter((f) => f !== null);

// //     const fc = {
// //       type: "FeatureCollection",
// //       features: features as any,
// //     };

// //     return fc as any;
// //   };

// //   // Build readonly boundary feature (used to repopulate after style reloads)
// //   const buildBoundaryFeature = (stateSnapshot: AppState) => {
// //     if (!stateSnapshot.originLngLat || stateSnapshot.siteBoundary.length < 3) {
// //       return { type: "FeatureCollection", features: [] } as any;
// //     }

// //     const coords = [...stateSnapshot.siteBoundary];
// //     if (
// //       coords[0][0] !== coords[coords.length - 1][0] ||
// //       coords[0][1] !== coords[coords.length - 1][1]
// //     ) {
// //       coords.push(coords[0]);
// //     }

// //     return {
// //       type: "Feature",
// //       geometry: { type: "Polygon", coordinates: [coords] },
// //       properties: {},
// //     } as any;
// //   };

// //   // Build midpoint label features for each boundary segment
// //   const buildSegmentLabels = (stateSnapshot: AppState) => {
// //     if (!stateSnapshot.siteBoundary || stateSnapshot.siteBoundary.length < 2) {
// //       return { type: "FeatureCollection", features: [] } as any;
// //     }
// //     const pts = stateSnapshot.siteBoundary;
// //     const imperial = stateSnapshot.unitSystem === "imperial";
// //     const features: any[] = [];

// //     for (let i = 0; i < pts.length; i++) {
// //       const a = pts[i];
// //       const b = pts[(i + 1) % pts.length];

// //       // Midpoint
// //       const midLng = (a[0] + b[0]) / 2;
// //       const midLat = (a[1] + b[1]) / 2;

// //       // Haversine distance in metres
// //       const R = 6371000;
// //       const dLat = ((b[1] - a[1]) * Math.PI) / 180;
// //       const dLng = ((b[0] - a[0]) * Math.PI) / 180;
// //       const sinA = Math.sin(dLat / 2);
// //       const sinB = Math.sin(dLng / 2);
// //       const haversin =
// //         sinA * sinA +
// //         Math.cos((a[1] * Math.PI) / 180) *
// //           Math.cos((b[1] * Math.PI) / 180) *
// //           sinB *
// //           sinB;
// //       const distM =
// //         R * 2 * Math.atan2(Math.sqrt(haversin), Math.sqrt(1 - haversin));

// //       const label = imperial
// //         ? `${(distM * 3.28084).toFixed(1)} ft`
// //         : `${distM.toFixed(1)} m`;

// //       features.push({
// //         type: "Feature",
// //         geometry: { type: "Point", coordinates: [midLng, midLat] },
// //         properties: { label },
// //       });
// //     }

// //     return { type: "FeatureCollection", features } as any;
// //   };

// //   useEffect(() => {
// //     callbacks.current = {
// //       onBoundaryChange,
// //       onMapMove,
// //       onMapClick,
// //       onObjectSelect,
// //       onObjectUpdate,
// //       onSetBoundaryLock: onSetBoundaryLock || undefined,
// //       state,
// //     };
// //   });

// //   const setupLayers = useCallback((map: mapboxgl.Map) => {
// //     if (!map.getSource("measure-line")) {
// //       map.addSource("measure-line", {
// //         type: "geojson",
// //         data: { type: "FeatureCollection", features: [] },
// //       });
// //       map.addLayer({
// //         id: "measure-line-layer",
// //         type: "line",
// //         source: "measure-line",
// //         layout: { "line-cap": "round", "line-join": "round" },
// //         paint: {
// //           "line-color": "#2E8B7A",
// //           "line-width": 3,
// //           "line-dasharray": [2, 1],
// //         },
// //       });
// //     }

// //     if (!map.getSource("boundary-readonly")) {
// //       map.addSource("boundary-readonly", {
// //         type: "geojson",
// //         data: { type: "FeatureCollection", features: [] },
// //       });
// //       map.addLayer({
// //         id: "boundary-readonly-fill",
// //         type: "fill",
// //         source: "boundary-readonly",
// //         paint: { "fill-color": "#2E8B7A", "fill-opacity": 0.1 },
// //       });
// //       map.addLayer({
// //         id: "boundary-readonly-stroke",
// //         type: "line",
// //         source: "boundary-readonly",
// //         paint: { "line-color": "#2E8B7A", "line-width": 2 },
// //       });

// //       // Populate readonly boundary immediately (useful after a style reload)
// //       try {
// //         const source = map.getSource(
// //           "boundary-readonly",
// //         ) as mapboxgl.GeoJSONSource;
// //         if (source) {
// //           const bf = buildBoundaryFeature(callbacks.current.state);
// //           if (bf && bf.geometry) {
// //             source.setData(bf as any);
// //           } else {
// //             source.setData({ type: "FeatureCollection", features: [] } as any);
// //           }

// //           // Also ensure Mapbox Draw has the polygon so it's selectable/visible
// //           const draw = drawRef.current;
// //           try {
// //             if (draw && callbacks.current.state.siteBoundary.length >= 3) {
// //               const currentFeatures = draw.getAll().features;
// //               const hasPolygon = currentFeatures.some(
// //                 (f) => f.geometry.type === "Polygon",
// //               );
// //               if (!hasPolygon) {
// //                 const coords = [...callbacks.current.state.siteBoundary];
// //                 if (
// //                   coords[0][0] !== coords[coords.length - 1][0] ||
// //                   coords[0][1] !== coords[coords.length - 1][1]
// //                 ) {
// //                   coords.push(coords[0]);
// //                 }
// //                 draw.add({
// //                   type: "Feature",
// //                   geometry: { type: "Polygon", coordinates: [coords] },
// //                   properties: {},
// //                 });
// //               }
// //             }
// //           } catch (err) {
// //             // ignore draw errors during style transitions
// //           }
// //         }
// //       } catch (err) {
// //         // Ignore errors during style transitions
// //       }
// //     }

// //     // Add 3D buildings layer
// //     if (
// //       !map.getLayer("3d-buildings") &&
// //       callbacks.current.state.mapStyle === "streets"
// //     ) {
// //       const layers = map.getStyle().layers;
// //       let labelLayerId;
// //       if (layers) {
// //         for (let i = 0; i < layers.length; i++) {
// //           if (
// //             layers[i].type === "symbol" &&
// //             (layers[i].layout as any)?.["text-field"]
// //           ) {
// //             labelLayerId = layers[i].id;
// //             break;
// //           }
// //         }
// //       }

// //       map.addLayer(
// //         {
// //           id: "3d-buildings",
// //           source: "composite",
// //           "source-layer": "building",
// //           filter: ["==", "extrude", "true"],
// //           type: "fill-extrusion",
// //           minzoom: 15,
// //           paint: {
// //             "fill-extrusion-color": "#aaa",
// //             "fill-extrusion-height": [
// //               "interpolate",
// //               ["linear"],
// //               ["zoom"],
// //               15,
// //               0,
// //               15.05,
// //               ["get", "height"],
// //             ],
// //             "fill-extrusion-base": [
// //               "interpolate",
// //               ["linear"],
// //               ["zoom"],
// //               15,
// //               0,
// //               15.05,
// //               ["get", "min_height"],
// //             ],
// //             "fill-extrusion-opacity": 0.6,
// //           },
// //         },
// //         labelLayerId,
// //       );
// //     }

// //     // Boundary segment distance labels
// //     if (!map.getSource("boundary-segment-labels")) {
// //       map.addSource("boundary-segment-labels", {
// //         type: "geojson",
// //         data: { type: "FeatureCollection", features: [] },
// //       });
// //       map.addLayer({
// //         id: "boundary-segment-labels-layer",
// //         type: "symbol",
// //         source: "boundary-segment-labels",
// //         layout: {
// //           "text-field": ["get", "label"],
// //           "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
// //           "text-size": 13,
// //           "text-anchor": "center",
// //           "text-allow-overlap": true,
// //           "text-ignore-placement": true,
// //           "symbol-placement": "point",
// //         },
// //         paint: {
// //           "text-color": "#ffffff",
// //           "text-halo-color": "#1a1a2e",
// //           "text-halo-width": 2,
// //         },
// //       });
// //     }

// //     if (!map.getSource("equipment")) {
// //       map.addSource("equipment", {
// //         type: "geojson",
// //         data: { type: "FeatureCollection", features: [] },
// //         promoteId: "id",
// //       });
// //       map.addLayer({
// //         id: "equipment-layer",
// //         type: "fill-extrusion",
// //         source: "equipment",
// //         filter: ["!", ["has", "model-uri"]],
// //         paint: {
// //           "fill-extrusion-color": [
// //             "case",
// //             ["boolean", ["feature-state", "selected"], false],
// //             "#ffffff",
// //             ["get", "color"],
// //           ],
// //           "fill-extrusion-height": ["get", "height"],
// //           "fill-extrusion-base": 0,
// //           "fill-extrusion-opacity": 0.8,
// //         },
// //       });

// //       // Model layer
// //       map.addLayer({
// //         id: "equipment-model-layer",
// //         type: "model",
// //         source: "equipment",
// //         filter: ["has", "model-uri"],
// //         layout: {
// //           "model-id": ["get", "model-uri"],
// //         },
// //         paint: {
// //           "model-rotation": [0, 0, ["get", "rotation"]],
// //           "model-scale": [1, 1, 1],
// //           "model-type": "common-3d",
// //           "model-animations": [
// //             "case",
// //             ["has", "animations"],
// //             ["get", "animations"],
// //             ["literal", []],
// //           ],
// //         } as any,
// //       });

// //       // Populate equipment source immediately (useful after a style reload)
// //       try {
// //         const source = map.getSource("equipment") as mapboxgl.GeoJSONSource;
// //         if (source) {
// //           const fc = buildEquipmentFeatureCollection(
// //             callbacks.current.state,
// //             map,
// //           );
// //           source.setData(fc as any);

// //           // Restore selection feature state
// //           callbacks.current.state.objects.forEach((obj) => {
// //             map.setFeatureState(
// //               { source: "equipment", id: obj.id },
// //               { selected: callbacks.current.state.selectedId === obj.id },
// //             );
// //           });
// //         }
// //       } catch (err) {
// //         // Ignore errors during style transitions
// //       }
// //     }

// //     if (!map.getSource("ghost-box")) {
// //       map.addSource("ghost-box", {
// //         type: "geojson",
// //         data: { type: "FeatureCollection", features: [] },
// //       });
// //       map.addLayer({
// //         id: "ghost-box-layer",
// //         type: "fill-extrusion",
// //         source: "ghost-box",
// //         filter: ["!", ["has", "model-uri"]],
// //         paint: {
// //           "fill-extrusion-color": ["get", "color"],
// //           "fill-extrusion-height": ["get", "height"],
// //           "fill-extrusion-base": 0,
// //           "fill-extrusion-opacity": 0.4,
// //         },
// //       });

// //       // Ghost model layer
// //       map.addLayer({
// //         id: "ghost-model-layer",
// //         type: "model",
// //         source: "ghost-box",
// //         filter: ["has", "model-uri"],
// //         layout: {
// //           "model-id": ["get", "model-uri"],
// //         },
// //         paint: {
// //           "model-rotation": [0, 0, 0],
// //           "model-scale": [1, 1, 1],
// //           "model-type": "common-3d",
// //           "model-opacity": 0.4,
// //           "model-animations": [
// //             "case",
// //             ["has", "animations"],
// //             ["get", "animations"],
// //             ["literal", []],
// //           ],
// //         } as any,
// //       });
// //     }

// //     // ── Safe zone layers (shown only while placing equipment) ──────────────
// //     if (!map.getSource("safe-zones")) {
// //       map.addSource("safe-zones", {
// //         type: "geojson",
// //         data: { type: "FeatureCollection", features: [] },
// //       });
// //       // Amber fill — safe zone area of each placed equipment
// //       map.addLayer({
// //         id: "safe-zone-fill",
// //         type: "fill",
// //         source: "safe-zones",
// //         paint: {
// //           "fill-color": "#f59e0b",
// //           "fill-opacity": 0.08,
// //         },
// //       });
// //       // Amber dashed outline
// //       map.addLayer({
// //         id: "safe-zone-outline",
// //         type: "line",
// //         source: "safe-zones",
// //         paint: {
// //           "line-color": "#f59e0b",
// //           "line-width": 1.5,
// //           "line-dasharray": [3, 2],
// //           "line-opacity": 0.6,
// //         },
// //       });
// //     }

// //     if (!map.getSource("safe-zone-violations")) {
// //       map.addSource("safe-zone-violations", {
// //         type: "geojson",
// //         data: { type: "FeatureCollection", features: [] },
// //       });
// //       // Red fill for violated safe zones
// //       map.addLayer({
// //         id: "safe-zone-violation-fill",
// //         type: "fill",
// //         source: "safe-zone-violations",
// //         paint: {
// //           "fill-color": "#ef4444",
// //           "fill-opacity": 0.18,
// //         },
// //       });
// //       // Bold red outline for violated safe zones
// //       map.addLayer({
// //         id: "safe-zone-violation-outline",
// //         type: "line",
// //         source: "safe-zone-violations",
// //         paint: {
// //           "line-color": "#ef4444",
// //           "line-width": 3,
// //           "line-opacity": 1,
// //         },
// //       });
// //     }
// //   }, []);

// //   useEffect(() => {
// //     if (mapRef.current && targetLocation) {
// //       mapRef.current.flyTo({
// //         center: [targetLocation.lng, targetLocation.lat],
// //         zoom: targetLocation.zoom || 18,
// //         essential: true,
// //       });
// //     }
// //   }, [targetLocation]);

// //   useEffect(() => {
// //     if (!mapContainerRef.current) return;

// //     const token = import.meta.env.VITE_MAPBOX_TOKEN;
// //     if (!token) {
// //       console.error("Mapbox token missing");
// //       return;
// //     }

// //     mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// //     const map = new mapboxgl.Map({
// //       container: mapContainerRef.current,
// //       style: "mapbox://styles/mapbox/streets-v12",
// //       center: [73.8567, 18.5204], // Pune, India
// //       zoom: 16,
// //       pitch: 0,
// //       bearing: 0,
// //       antialias: true,
// //       preserveDrawingBuffer: true,
// //     });

// //     const draw = new MapboxDraw({
// //       displayControlsDefault: false,
// //       controls: {
// //         polygon: true,
// //         trash: true,
// //       },
// //       defaultMode: "simple_select",
// //     });

// //     map.addControl(draw);
// //     map.addControl(new mapboxgl.NavigationControl(), "top-right");

// //     map.on("style.load", () => {
// //       setupLayers(map);
// //     });

// //     map.on("load", () => {
// //       mapRef.current = map;
// //       drawRef.current = draw;
// //       setupLayers(map);
// //     });

// //     map.on("draw.create", (e: any) => {
// //       const feature = e.features[0];
// //       if (feature.geometry.type === "Polygon") {
// //         callbacks.current.onBoundaryChange(
// //           feature.geometry.coordinates[0] as [number, number][],
// //         );
// //         // Update segment labels immediately on draw complete
// //         const segSrc = map.getSource(
// //           "boundary-segment-labels",
// //         ) as mapboxgl.GeoJSONSource;
// //         if (segSrc) segSrc.setData(buildSegmentLabels(callbacks.current.state));
// //       }
// //     });

// //     map.on("draw.update", (e: any) => {
// //       const feature = e.features[0];
// //       if (feature.geometry.type === "Polygon") {
// //         callbacks.current.onBoundaryChange(
// //           feature.geometry.coordinates[0] as [number, number][],
// //         );
// //         // Update segment labels on polygon vertex drag
// //         const segSrc = map.getSource(
// //           "boundary-segment-labels",
// //         ) as mapboxgl.GeoJSONSource;
// //         if (segSrc) segSrc.setData(buildSegmentLabels(callbacks.current.state));
// //       }
// //     });

// //     map.on("draw.delete", () => {
// //       callbacks.current.onBoundaryChange([]);
// //     });

// //     map.on("mousemove", (e) => {
// //       setHoverCoords([e.lngLat.lng, e.lngLat.lat]);
// //       callbacks.current.onMapMove(e);

// //       if (!map.getLayer("equipment-layer")) return;

// //       const features = map.queryRenderedFeatures(e.point, {
// //         layers: ["equipment-layer", "equipment-model-layer"],
// //       });
// //       map.getCanvas().style.cursor = features.length > 0 ? "pointer" : "";

// //       if (draggingIdRef.current && callbacks.current.state.originLngLat) {
// //         const { x, z } = lngLatToMetres(
// //           [e.lngLat.lng, e.lngLat.lat],
// //           callbacks.current.state.originLngLat,
// //         );
// //         const snappedX = Math.round(x * 2) / 2;
// //         const snappedZ = Math.round(z * 2) / 2;
// //         callbacks.current.onObjectUpdate(draggingIdRef.current, {
// //           x: snappedX,
// //           z: snappedZ,
// //         });
// //       }
// //     });

// //     // Use mousedown instead of click for more reliable placement and dragging
// //     map.on("mousedown", (e) => {
// //       if (!map.getLayer("equipment-layer")) {
// //         callbacks.current.onMapClick(e);
// //         return;
// //       }

// //       const features = map.queryRenderedFeatures(e.point, {
// //         layers: ["equipment-layer", "equipment-model-layer"],
// //       });
// //       if (features.length > 0) {
// //         const id = (features[0].id as string) || features[0].properties?.id;
// //         callbacks.current.onObjectSelect(id);
// //         draggingIdRef.current = id;
// //         // Lock the boundary while dragging an object so it remains fixed
// //         try {
// //           callbacks.current.onSetBoundaryLock?.(true);
// //         } catch {}
// //         map.dragPan.disable();
// //       } else {
// //         callbacks.current.onMapClick(e);
// //         if (!callbacks.current.state.pendingPlacement) {
// //           callbacks.current.onObjectSelect(null);
// //         }
// //       }
// //     });

// //     map.on("mouseup", () => {
// //       // Unlock boundary when drag ends
// //       try {
// //         callbacks.current.onSetBoundaryLock?.(false);
// //       } catch {}
// //       draggingIdRef.current = null;
// //       map.dragPan.enable();
// //     });

// //     const updateCamera = () => {
// //       if (!mapRef.current) return;
// //     };

// //     map.on("move", updateCamera);
// //     map.on("zoom", updateCamera);
// //     map.on("pitch", updateCamera);
// //     map.on("rotate", updateCamera);

// //     return () => {
// //       map.remove();
// //     };
// //   }, []);

// //   // Sync equipment visual
// //   useEffect(() => {
// //     if (!mapRef.current) return;
// //     const map = mapRef.current;
// //     const source = map.getSource("equipment") as mapboxgl.GeoJSONSource;
// //     if (!source) return;

// //     // If no originLngLat or no objects, clear the equipment layer
// //     if (!state.originLngLat || state.objects.length === 0) {
// //       source.setData({ type: "FeatureCollection", features: [] });
// //       return;
// //     }

// //     const features = state.objects
// //       .map((obj) => {
// //         const def =
// //           DEFAULT_LIBRARY.find((d) => d.id === obj.type) ??
// //           state.customLibrary.find((d) => d.id === obj.type);
// //         if (!def) return null;

// //         const lngLat = metresToLngLat(obj.x, obj.z, state.originLngLat!);

// //         // If model is available, use point geometry for model layer
// //         if (def.modelUrl) {
// //           // Register model if not already registered
// //           if (!map.hasModel(def.modelUrl)) {
// //             map.addModel(def.modelUrl, def.modelUrl);
// //           }

// //           return {
// //             type: "Feature",
// //             id: obj.id,
// //             geometry: {
// //               type: "Point",
// //               coordinates: [lngLat[0], lngLat[1]],
// //             },
// //             properties: {
// //               id: obj.id,
// //               color: obj.color || def.color,
// //               height: def.height,
// //               "model-uri": def.modelUrl,
// //               rotation: (obj.rotationY * 180) / Math.PI, // Mapbox model rotation is in degrees
// //               animations: def.animationsEnabled
// //                 ? [{ name: "*", state: "play" }]
// //                 : [],
// //             },
// //           };
// //         }

// //         // Fallback to box polygon for fill-extrusion
// //         const halfW = def.width / 2;
// //         const halfD = def.depth / 2;

// //         const cornersMetres = [
// //           { x: -halfW, z: -halfD },
// //           { x: halfW, z: -halfD },
// //           { x: halfW, z: halfD },
// //           { x: -halfW, z: halfD },
// //           { x: -halfW, z: -halfD },
// //         ];

// //         const rotatedCorners = cornersMetres.map((c) => {
// //           const rx =
// //             c.x * Math.cos(obj.rotationY) - c.z * Math.sin(obj.rotationY);
// //           const rz =
// //             c.x * Math.sin(obj.rotationY) + c.z * Math.cos(obj.rotationY);
// //           return metresToLngLat(obj.x + rx, obj.z + rz, state.originLngLat!);
// //         });

// //         return {
// //           type: "Feature",
// //           id: obj.id,
// //           geometry: {
// //             type: "Polygon",
// //             coordinates: [rotatedCorners],
// //           },
// //           properties: {
// //             id: obj.id,
// //             color: obj.color || def.color,
// //             height: def.height,
// //           },
// //         };
// //       })
// //       .filter((f) => f !== null);

// //     source.setData({
// //       type: "FeatureCollection",
// //       features: features as any,
// //     });

// //     // Update feature state for selection highlight
// //     state.objects.forEach((obj) => {
// //       map.setFeatureState(
// //         { source: "equipment", id: obj.id },
// //         { selected: state.selectedId === obj.id },
// //       );
// //     });
// //   }, [state.objects, state.originLngLat, state.selectedId, state.mapStyle]);

// //   // ── Helper: build a safe-zone polygon for an equipment at (cx, cz) ──────
// //   const buildSafeZonePolygon = (
// //     cx: number,
// //     cz: number,
// //     width: number,
// //     depth: number,
// //     rotationY: number,
// //     origin: [number, number],
// //   ) => {
// //     const SAFE = 1.5; // 1.5m each side = +3m total per dimension
// //     const hw = (width + SAFE * 2) / 2;
// //     const hd = (depth + SAFE * 2) / 2;
// //     const corners = [
// //       { x: -hw, z: -hd },
// //       { x: hw, z: -hd },
// //       { x: hw, z: hd },
// //       { x: -hw, z: hd },
// //       { x: -hw, z: -hd },
// //     ].map((c) => {
// //       const rx = c.x * Math.cos(rotationY) - c.z * Math.sin(rotationY);
// //       const rz = c.x * Math.sin(rotationY) + c.z * Math.cos(rotationY);
// //       return metresToLngLat(cx + rx, cz + rz, origin);
// //     });
// //     return corners;
// //   };

// //   // ── Sync safe-zone layers whenever pendingPlacement or hoverCoords changes ──
// //   useEffect(() => {
// //     if (!mapRef.current) return;
// //     const map = mapRef.current;
// //     const safeSource = map.getSource("safe-zones") as mapboxgl.GeoJSONSource;
// //     const violSource = map.getSource(
// //       "safe-zone-violations",
// //     ) as mapboxgl.GeoJSONSource;
// //     if (!safeSource || !violSource) return;

// //     // Clear both layers when nothing is being placed or dragged
// //     const isDragging = !!draggingIdRef.current;
// //     if (
// //       (!state.pendingPlacement && !isDragging) ||
// //       !state.originLngLat ||
// //       !hoverCoords
// //     ) {
// //       safeSource.setData({ type: "FeatureCollection", features: [] });
// //       violSource.setData({ type: "FeatureCollection", features: [] });
// //       return;
// //     }

// //     const origin = state.originLngLat;
// //     const allDefs = [...DEFAULT_LIBRARY, ...(state.customLibrary || [])];

// //     // Build safe-zone polygon for every already-placed equipment
// //     const safeFeatures = state.objects
// //       .map((obj) => {
// //         const def = allDefs.find((d) => d.id === obj.type);
// //         if (!def) return null;
// //         const ring = buildSafeZonePolygon(
// //           obj.x,
// //           obj.z,
// //           def.width,
// //           def.depth,
// //           obj.rotationY,
// //           origin,
// //         );
// //         return {
// //           type: "Feature" as const,
// //           geometry: { type: "Polygon" as const, coordinates: [ring] },
// //           properties: { id: obj.id },
// //         };
// //       })
// //       .filter(Boolean);

// //     safeSource.setData({
// //       type: "FeatureCollection",
// //       features: safeFeatures as any,
// //     });

// //     // Ghost footprint of the equipment being placed
// //     const { x, z } = lngLatToMetres(hoverCoords, origin);
// //     const ghostX = Math.round(x * 2) / 2;
// //     const ghostZ = Math.round(z * 2) / 2;
// //     // Determine the definition and rotation for the ghost footprint.
// //     // Use pendingPlacement when placing, or the dragged object's def when dragging.
// //     let def = state.pendingPlacement;
// //     let rotationY = 0;
// //     if (!def && draggingIdRef.current) {
// //       const draggingObj = state.objects.find(
// //         (o) => o.id === draggingIdRef.current,
// //       );
// //       if (draggingObj) {
// //         def =
// //           DEFAULT_LIBRARY.find((d) => d.id === draggingObj.type) ??
// //           (state.customLibrary || []).find((d) => d.id === draggingObj.type);
// //         rotationY = draggingObj.rotationY || 0;
// //       }
// //     }

// //     if (!def) {
// //       violSource.setData({ type: "FeatureCollection", features: [] });
// //       return;
// //     }

// //     const ghw = def.width / 2;
// //     const ghd = def.depth / 2;
// //     const ghostCorners = [
// //       { x: -ghw, z: -ghd },
// //       { x: ghw, z: -ghd },
// //       { x: ghw, z: ghd },
// //       { x: -ghw, z: ghd },
// //       { x: -ghw, z: -ghd },
// //     ].map((c) => {
// //       const rx = c.x * Math.cos(rotationY) - c.z * Math.sin(rotationY);
// //       const rz = c.x * Math.sin(rotationY) + c.z * Math.cos(rotationY);
// //       return metresToLngLat(ghostX + rx, ghostZ + rz, origin);
// //     });

// //     const ghostPolygon = turf.polygon([ghostCorners]);

// //     // Find any safe zone that the ghost footprint overlaps
// //     const violations = safeFeatures.filter((f) => {
// //       if (!f) return false;
// //       try {
// //         return turf.booleanIntersects(
// //           ghostPolygon,
// //           turf.polygon([(f as any).geometry.coordinates[0]]),
// //         );
// //       } catch {
// //         return false;
// //       }
// //     });

// //     violSource.setData({
// //       type: "FeatureCollection",
// //       features: violations as any,
// //     });
// //   }, [
// //     state.pendingPlacement,
// //     hoverCoords,
// //     state.originLngLat,
// //     state.objects,
// //     state.customLibrary,
// //   ]);

// //   // Sync ghost box
// //   useEffect(() => {
// //     if (
// //       !mapRef.current ||
// //       !state.originLngLat ||
// //       !state.pendingPlacement ||
// //       !hoverCoords
// //     ) {
// //       if (mapRef.current) {
// //         const source = mapRef.current.getSource(
// //           "ghost-box",
// //         ) as mapboxgl.GeoJSONSource;
// //         if (source) source.setData({ type: "FeatureCollection", features: [] });
// //       }
// //       return;
// //     }

// //     const map = mapRef.current;
// //     const source = map.getSource("ghost-box") as mapboxgl.GeoJSONSource;
// //     if (!source) return;

// //     const def = state.pendingPlacement;
// //     const { x, z } = lngLatToMetres(hoverCoords, state.originLngLat);
// //     const snappedX = Math.round(x * 2) / 2;
// //     const snappedZ = Math.round(z * 2) / 2;
// //     const lngLat = metresToLngLat(snappedX, snappedZ, state.originLngLat!);

// //     if (def.modelUrl) {
// //       if (!map.hasModel(def.modelUrl)) {
// //         map.addModel(def.modelUrl, def.modelUrl);
// //       }

// //       source.setData({
// //         type: "FeatureCollection",
// //         features: [
// //           {
// //             type: "Feature",
// //             geometry: {
// //               type: "Point",
// //               coordinates: [lngLat[0], lngLat[1]],
// //             },
// //             properties: {
// //               color: def.color,
// //               height: def.height,
// //               "model-uri": def.modelUrl,
// //               animations: def.animationsEnabled
// //                 ? [{ name: "*", state: "play" }]
// //                 : [],
// //             },
// //           },
// //         ] as any,
// //       });
// //       return;
// //     }

// //     const halfW = def.width / 2;
// //     const halfD = def.depth / 2;
// //     const cornersMetres = [
// //       { x: -halfW, z: -halfD },
// //       { x: halfW, z: -halfD },
// //       { x: halfW, z: halfD },
// //       { x: -halfW, z: halfD },
// //       { x: -halfW, z: -halfD },
// //     ];

// //     const cornersLngLat = cornersMetres.map((c) =>
// //       metresToLngLat(snappedX + c.x, snappedZ + c.z, state.originLngLat!),
// //     );

// //     source.setData({
// //       type: "FeatureCollection",
// //       features: [
// //         {
// //           type: "Feature",
// //           geometry: {
// //             type: "Polygon",
// //             coordinates: [cornersLngLat],
// //           },
// //           properties: {
// //             color: def.color,
// //             height: def.height,
// //           },
// //         },
// //       ] as any,
// //     });
// //   }, [state.pendingPlacement, hoverCoords, state.originLngLat, state.mapStyle]);

// //   // Sync measurement visual
// //   useEffect(() => {
// //     if (!mapRef.current) return;
// //     const map = mapRef.current;

// //     // Clear old markers
// //     measureMarkersRef.current.forEach((m) => m.remove());
// //     measureMarkersRef.current = [];
// //     if (measureLineRef.current) measureLineRef.current.remove();
// //     measureLineRef.current = null;

// //     if (state.measurePoints.length === 0) {
// //       const source = map.getSource("measure-line") as mapboxgl.GeoJSONSource;
// //       if (source) source.setData({ type: "FeatureCollection", features: [] });
// //       // Also clear segment labels
// //       const segSource = map.getSource(
// //         "boundary-segment-labels",
// //       ) as mapboxgl.GeoJSONSource;
// //       if (segSource)
// //         segSource.setData({ type: "FeatureCollection", features: [] });
// //       return;
// //     }

// //     state.measurePoints.forEach((pt, i) => {
// //       const el = document.createElement("div");
// //       const isPlainMode = state.mapStyle === "plain";
// //       const isLightTheme = theme === "light";

// //       // Adjust marker colors for plain mode
// //       let markerClass =
// //         "w-3 h-3 bg-brand-teal border-2 border-white rounded-full shadow-lg";
// //       if (isPlainMode) {
// //         if (isLightTheme) {
// //           markerClass =
// //             "w-4 h-4 bg-[#00FF00] border-2 border-white rounded-full shadow-lg";
// //         } else {
// //           markerClass =
// //             "w-4 h-4 bg-[#FFD700] border-2 border-black rounded-full shadow-lg";
// //         }
// //       }

// //       el.className = markerClass;
// //       const marker = new mapboxgl.Marker(el).setLngLat(pt).addTo(map);
// //       measureMarkersRef.current.push(marker);
// //     });

// //     if (state.measurePoints.length === 2) {
// //       const p1 = state.measurePoints[0];
// //       const p2 = state.measurePoints[1];
// //       const distMeters = turf.distance(turf.point(p1), turf.point(p2), {
// //         units: "meters",
// //       });
// //       const midpoint = turf.midpoint(turf.point(p1), turf.point(p2)).geometry
// //         .coordinates as [number, number];

// //       const source = map.getSource("measure-line") as mapboxgl.GeoJSONSource;
// //       if (source) {
// //         source.setData({
// //           type: "FeatureCollection",
// //           features: [
// //             {
// //               type: "Feature",
// //               geometry: { type: "LineString", coordinates: [p1, p2] },
// //               properties: {},
// //             },
// //           ],
// //         });
// //       }

// //       const label = document.createElement("div");
// //       const isPlainMode = state.mapStyle === "plain";
// //       const isLightTheme = theme === "light";

// //       // Adjust label colors for plain mode
// //       let labelClass =
// //         "bg-white text-brand-navy px-2 py-1 rounded shadow-lg text-[10px] font-bold border border-brand-teal";
// //       if (isPlainMode) {
// //         if (isLightTheme) {
// //           labelClass =
// //             "bg-[#00FF00] text-black px-2 py-1 rounded shadow-lg text-[10px] font-bold border-2 border-white";
// //         } else {
// //           labelClass =
// //             "bg-[#FFD700] text-black px-2 py-1 rounded shadow-lg text-[10px] font-bold border-2 border-black";
// //         }
// //       }

// //       label.className = labelClass;

// //       if (state.unitSystem === "imperial") {
// //         const distFeet = distMeters * 3.28084;
// //         label.innerText = distFeet.toFixed(1) + "ft";
// //       } else {
// //         label.innerText = distMeters.toFixed(1) + "m";
// //       }

// //       const labelMarker = new mapboxgl.Marker(label)
// //         .setLngLat(midpoint)
// //         .addTo(map);
// //       measureLineRef.current = labelMarker;
// //     }
// //   }, [state.measurePoints, state.unitSystem, theme, state.mapStyle]);

// //   // Sync style
// //   useEffect(() => {
// //     if (!mapRef.current) return;

// //     if (state.mapStyle === "plain") {
// //       const plainStyle = {
// //         version: 8,
// //         name: "plain",
// //         metadata: {},
// //         sources: {},
// //         layers: [
// //           {
// //             id: "plain-background",
// //             type: "background",
// //             paint: {
// //               "background-color": theme === "dark" ? "#ffffff" : "#000000",
// //             },
// //           },
// //         ],
// //       } as any;

// //       mapRef.current.setStyle(plainStyle);
// //       return;
// //     }

// //     const style =
// //       state.mapStyle === "satellite"
// //         ? "mapbox://styles/mapbox/satellite-v9"
// //         : "mapbox://styles/mapbox/streets-v12";

// //     mapRef.current.setStyle(style);
// //   }, [state.mapStyle, theme]);

// //   // Adjust visibility colors for plain mode
// //   useEffect(() => {
// //     if (!mapRef.current || state.mapStyle !== "plain") return;
// //     const map = mapRef.current;

// //     // In plain mode, increase opacity and contrast for boundary and measurements
// //     const isLightTheme = theme === "light";
// //     const boundaryColor = isLightTheme ? "#00FF00" : "#FFD700"; // Bright green for black bg, gold for white bg
// //     const boundaryOpacity = 0.3;
// //     const measureColor = isLightTheme ? "#00FF00" : "#FFD700";
// //     const measureWidth = isLightTheme ? 4 : 3;

// //     try {
// //       if (map.getLayer("boundary-readonly-fill")) {
// //         map.setPaintProperty(
// //           "boundary-readonly-fill",
// //           "fill-color",
// //           boundaryColor,
// //         );
// //         map.setPaintProperty(
// //           "boundary-readonly-fill",
// //           "fill-opacity",
// //           boundaryOpacity,
// //         );
// //       }
// //       if (map.getLayer("boundary-readonly-stroke")) {
// //         map.setPaintProperty(
// //           "boundary-readonly-stroke",
// //           "line-color",
// //           boundaryColor,
// //         );
// //         map.setPaintProperty("boundary-readonly-stroke", "line-width", 3);
// //       }
// //       if (map.getLayer("measure-line-layer")) {
// //         map.setPaintProperty("measure-line-layer", "line-color", measureColor);
// //         map.setPaintProperty("measure-line-layer", "line-width", measureWidth);
// //       }
// //     } catch (err) {
// //       // Layer not ready yet
// //     }
// //   }, [state.mapStyle, theme]);

// //   // Sync terrain and buildings
// //   useEffect(() => {
// //     if (!mapRef.current) return;
// //     const map = mapRef.current;

// //     const handleStyleLoad = () => {
// //       // Terrain
// //       if (state.terrainEnabled && state.mapStyle === "streets") {
// //         if (!map.getSource("mapbox-dem")) {
// //           map.addSource("mapbox-dem", {
// //             type: "raster-dem",
// //             url: "mapbox://mapbox.mapbox-terrain-dem-v1",
// //             tileSize: 512,
// //             maxzoom: 14,
// //           });
// //         }
// //         map.setTerrain({ source: "mapbox-dem", exaggeration: 1.2 });
// //         map.easeTo({ pitch: 60 });
// //       } else {
// //         map.setTerrain(null);
// //         map.easeTo({ pitch: 0 });
// //       }

// //       // Buildings
// //       if (map.getLayer("3d-buildings")) {
// //         map.setLayoutProperty(
// //           "3d-buildings",
// //           "visibility",
// //           state.buildingsEnabled ? "visible" : "none",
// //         );
// //       } else if (state.buildingsEnabled && state.mapStyle === "streets") {
// //         // If layer missing but enabled, re-run setup
// //         setupLayers(map);
// //       }
// //     };

// //     if (map.isStyleLoaded()) {
// //       handleStyleLoad();
// //     } else {
// //       map.once("style.load", handleStyleLoad);
// //     }
// //   }, [state.terrainEnabled, state.buildingsEnabled, state.mapStyle]);

// //   // Sync readonly boundary and origin marker
// //   useEffect(() => {
// //     if (!mapRef.current) return;
// //     const map = mapRef.current;

// //     // Origin Marker
// //     if (originMarkerRef.current) originMarkerRef.current.remove();
// //     if (state.originLngLat) {
// //       const el = document.createElement("div");
// //       const isPlainMode = state.mapStyle === "plain";
// //       const isLightTheme = theme === "light";

// //       // Adjust marker colors for plain mode: bright colors for visibility
// //       let bgColor = "bg-brand-teal";
// //       let innerColor = "bg-white";
// //       let borderColor = "border-white";

// //       if (isPlainMode) {
// //         if (isLightTheme) {
// //           // For black background in light theme mode
// //           bgColor = "bg-[#00FF00]"; // Bright green
// //           innerColor = "bg-white";
// //           borderColor = "border-white";
// //         } else {
// //           // For white background in dark theme mode
// //           bgColor = "bg-[#FFD700]"; // Gold
// //           innerColor = "bg-black";
// //           borderColor = "border-black";
// //         }
// //       }

// //       el.className = `w-6 h-6 flex items-center justify-center ${bgColor} rounded-full border-2 ${borderColor} shadow-xl animate-pulse`;
// //       el.innerHTML = `<div class="w-2 h-2 ${innerColor} rounded-full"></div>`;

// //       const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
// //         '<div class="text-[10px] font-bold text-brand-navy p-1">BENCHMARK ORIGIN</div>',
// //       );

// //       originMarkerRef.current = new mapboxgl.Marker(el)
// //         .setLngLat(state.originLngLat)
// //         .setPopup(popup)
// //         .addTo(map);
// //     }

// //     // Clear boundary if no origin or boundary too small
// //     if (!state.originLngLat || state.siteBoundary.length < 3) {
// //       const source = map.getSource(
// //         "boundary-readonly",
// //       ) as mapboxgl.GeoJSONSource;
// //       if (source) source.setData({ type: "FeatureCollection", features: [] });
// //       return;
// //     }

// //     const source = map.getSource("boundary-readonly") as mapboxgl.GeoJSONSource;
// //     if (!source) return;

// //     // Ensure closed
// //     const coords = [...state.siteBoundary];
// //     if (
// //       coords[0][0] !== coords[coords.length - 1][0] ||
// //       coords[0][1] !== coords[coords.length - 1][1]
// //     ) {
// //       coords.push(coords[0]);
// //     }

// //     source.setData({
// //       type: "Feature",
// //       geometry: {
// //         type: "Polygon",
// //         coordinates: [coords],
// //       },
// //       properties: {},
// //     } as any);

// //     // Update segment distance labels
// //     const segSource = map.getSource(
// //       "boundary-segment-labels",
// //     ) as mapboxgl.GeoJSONSource;
// //     if (segSource) {
// //       segSource.setData(buildSegmentLabels(state));
// //     }
// //   }, [
// //     state.siteBoundary,
// //     state.originLngLat,
// //     theme,
// //     state.mapStyle,
// //     state.unitSystem,
// //   ]);

// //   // Sync Mapbox Draw mode and visibility based on app state
// //   useEffect(() => {
// //     if (!mapRef.current || !drawRef.current) return;
// //     const map = mapRef.current;
// //     const isLocked =
// //       !!state.pendingPlacement || isMeasuring || state.isBoundaryLocked;

// //     if (isLocked) {
// //       drawRef.current.changeMode("simple_select");
// //     }

// //     // Toggle visibility of draw layers vs readonly boundary
// //     const layers = map.getStyle().layers;
// //     if (layers) {
// //       layers.forEach((layer) => {
// //         if (layer.id.startsWith("gl-draw-")) {
// //           map.setLayoutProperty(
// //             layer.id,
// //             "visibility",
// //             isLocked ? "none" : "visible",
// //           );
// //         }
// //       });
// //     }

// //     map.setLayoutProperty(
// //       "boundary-readonly-fill",
// //       "visibility",
// //       isLocked ? "visible" : "none",
// //     );
// //     map.setLayoutProperty(
// //       "boundary-readonly-stroke",
// //       "visibility",
// //       isLocked ? "visible" : "none",
// //     );
// //     // Show segment labels whenever boundary is visible
// //     if (map.getLayer("boundary-segment-labels-layer")) {
// //       map.setLayoutProperty(
// //         "boundary-segment-labels-layer",
// //         "visibility",
// //         state.siteBoundary.length >= 2 ? "visible" : "none",
// //       );
// //     }
// //   }, [
// //     state.pendingPlacement,
// //     isMeasuring,
// //     state.isBoundaryLocked,
// //     state.siteBoundary,
// //   ]);

// //   // Trigger draw mode
// //   useEffect(() => {
// //     if (drawTrigger > 0 && drawRef.current) {
// //       drawRef.current.changeMode("draw_polygon");
// //     }
// //   }, [drawTrigger]);

// //   // Center map when originLngLat changes (e.g. after import)
// //   useEffect(() => {
// //     if (mapRef.current && state.originLngLat) {
// //       mapRef.current.easeTo({
// //         center: state.originLngLat,
// //         zoom: 18,
// //         duration: 1000,
// //       });
// //     }
// //   }, [state.originLngLat]);

// //   // Sync boundary to Mapbox Draw (for import)
// //   useEffect(() => {
// //     if (!drawRef.current) return;

// //     const draw = drawRef.current;
// //     // If incoming boundary is too small, ensure draw is cleared
// //     if (state.siteBoundary.length < 3) {
// //       try {
// //         draw.deleteAll();
// //       } catch (err) {
// //         // ignore
// //       }
// //       return;
// //     }

// //     const coords = [...state.siteBoundary];
// //     if (
// //       coords[0][0] !== coords[coords.length - 1]?.[0] ||
// //       coords[0][1] !== coords[coords.length - 1]?.[1]
// //     ) {
// //       coords.push(coords[0]);
// //     }

// //     try {
// //       const currentFeatures = draw
// //         .getAll()
// //         .features.filter((f) => f.geometry.type === "Polygon");

// //       // If there's no polygon, simply add the new one
// //       if (currentFeatures.length === 0) {
// //         draw.add({
// //           type: "Feature",
// //           geometry: { type: "Polygon", coordinates: [coords] },
// //           properties: {},
// //         });
// //         return;
// //       }

// //       // Compare existing polygon coords with new coords; if different, replace
// //       // const existing = currentFeatures[0].geometry.coordinates[0];
// //       const polygonFeature = currentFeatures[0];

// //       if (polygonFeature.geometry.type !== "Polygon") {
// //         return;
// //       }

// //       const existing = polygonFeature.geometry.coordinates[0];

// //       const existingStr = JSON.stringify(
// //         existing.map((c: any) => [
// //           Number(c[0]).toFixed(6),
// //           Number(c[1]).toFixed(6),
// //         ]),
// //       );
// //       const newStr = JSON.stringify(
// //         coords.map((c) => [Number(c[0]).toFixed(6), Number(c[1]).toFixed(6)]),
// //       );

// //       if (existingStr !== newStr) {
// //         // replace: remove all polygons and add the new one
// //         draw.deleteAll();
// //         draw.add({
// //           type: "Feature",
// //           geometry: { type: "Polygon", coordinates: [coords] },
// //           properties: {},
// //         });
// //       }
// //     } catch (err) {
// //       // ignore errors (style transitions, etc.)
// //     }
// //   }, [state.siteBoundary]);

// //   // Clear boundary
// //   useEffect(() => {
// //     if (state.siteBoundary.length === 0 && drawRef.current) {
// //       drawRef.current.deleteAll();
// //     }
// //   }, [state.siteBoundary]);

// //   return <div ref={mapContainerRef} className="w-full h-full" />;
// // };

// import React, { useEffect, useRef, useState, useCallback } from "react";
// import mapboxgl from "mapbox-gl";
// import "mapbox-gl/dist/mapbox-gl.css";
// import MapboxDraw from "@mapbox/mapbox-gl-draw";
// import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
// import { AppState, DEFAULT_LIBRARY } from "../../../backend/types";
// import * as turf from "@turf/turf";
// import { metresToLngLat, lngLatToMetres } from "../utils/geo";
// import { useTheme } from "../contexts/ThemeContext";

// interface MapPanelProps {
//   state: AppState;
//   isMeasuring: boolean;
//   onBoundaryChange: (coords: [number, number][]) => void;
//   onMapMove: (e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent) => void;
//   onMapClick: (e: mapboxgl.MapMouseEvent) => void;
//   onObjectSelect: (id: string | null) => void;
//   onObjectUpdate: (id: string, updates: any) => void;
//   onSetBoundaryLock?: (locked: boolean) => void;
//   drawTrigger: number;
//   targetLocation?: { lng: number; lat: number; zoom?: number };
//   /** Called once the Mapbox map instance is ready — lets the parent access camera controls */
//   onMapReady?: (map: mapboxgl.Map) => void;
// }

// export const MapPanel: React.FC<MapPanelProps> = ({
//   state,
//   isMeasuring,
//   onBoundaryChange,
//   onMapMove,
//   onMapClick,
//   onObjectSelect,
//   onObjectUpdate,
//   onSetBoundaryLock,
//   drawTrigger,
//   targetLocation,
//   onMapReady,
// }) => {
//   const mapContainerRef = useRef<HTMLDivElement>(null);
//   const mapRef = useRef<mapboxgl.Map | null>(null);
//   const drawRef = useRef<MapboxDraw | null>(null);
//   const measureMarkersRef = useRef<mapboxgl.Marker[]>([]);
//   const measureLineRef = useRef<mapboxgl.Marker | null>(null);
//   const originMarkerRef = useRef<mapboxgl.Marker | null>(null);
//   const [hoverCoords, setHoverCoords] = useState<[number, number] | null>(null);
//   const draggingIdRef = useRef<string | null>(null);
//   const { theme } = useTheme();

//   // Use refs for callbacks to avoid stale closures in Mapbox event listeners
//   const callbacks = useRef({
//     onBoundaryChange,
//     onMapMove,
//     onMapClick,
//     onObjectSelect,
//     onObjectUpdate,
//     onSetBoundaryLock: undefined as any as
//       | ((locked: boolean) => void)
//       | undefined,
//     state,
//   });

//   // Build equipment features from app state (used on initial load and style reloads)
//   const buildEquipmentFeatureCollection = (
//     stateSnapshot: AppState,
//     map: mapboxgl.Map,
//   ) => {
//     if (!stateSnapshot.originLngLat) {
//       return { type: "FeatureCollection", features: [] } as any;
//     }

//     const features = stateSnapshot.objects
//       .map((obj) => {
//         const def =
//           DEFAULT_LIBRARY.find((d) => d.id === obj.type) ??
//           stateSnapshot.customLibrary.find((d) => d.id === obj.type);
//         if (!def) return null;

//         const lngLat = metresToLngLat(
//           obj.x,
//           obj.z,
//           stateSnapshot.originLngLat!,
//         );

//         if (def.modelUrl) {
//           if (!map.hasModel(def.modelUrl)) {
//             map.addModel(def.modelUrl, def.modelUrl);
//           }

//           return {
//             type: "Feature",
//             id: obj.id,
//             geometry: {
//               type: "Point",
//               coordinates: [lngLat[0], lngLat[1]],
//             },
//             properties: {
//               id: obj.id,
//               color: obj.color || def.color,
//               height: def.height,
//               "model-uri": def.modelUrl,
//               rotation: (obj.rotationY * 180) / Math.PI,
//               animations: def.animationsEnabled
//                 ? [{ name: "*", state: "play" }]
//                 : [],
//             },
//           };
//         }

//         const halfW = def.width / 2;
//         const halfD = def.depth / 2;

//         const cornersMetres = [
//           { x: -halfW, z: -halfD },
//           { x: halfW, z: -halfD },
//           { x: halfW, z: halfD },
//           { x: -halfW, z: halfD },
//           { x: -halfW, z: -halfD },
//         ];

//         const rotatedCorners = cornersMetres.map((c) => {
//           const rx =
//             c.x * Math.cos(obj.rotationY) - c.z * Math.sin(obj.rotationY);
//           const rz =
//             c.x * Math.sin(obj.rotationY) + c.z * Math.cos(obj.rotationY);
//           return metresToLngLat(
//             obj.x + rx,
//             obj.z + rz,
//             stateSnapshot.originLngLat!,
//           );
//         });

//         return {
//           type: "Feature",
//           id: obj.id,
//           geometry: {
//             type: "Polygon",
//             coordinates: [rotatedCorners],
//           },
//           properties: {
//             id: obj.id,
//             color: obj.color || def.color,
//             height: def.height,
//           },
//         };
//       })
//       .filter((f) => f !== null);

//     const fc = {
//       type: "FeatureCollection",
//       features: features as any,
//     };

//     return fc as any;
//   };

//   // Build readonly boundary feature (used to repopulate after style reloads)
//   const buildBoundaryFeature = (stateSnapshot: AppState) => {
//     if (!stateSnapshot.originLngLat || stateSnapshot.siteBoundary.length < 3) {
//       return { type: "FeatureCollection", features: [] } as any;
//     }

//     const coords = [...stateSnapshot.siteBoundary];
//     if (
//       coords[0][0] !== coords[coords.length - 1][0] ||
//       coords[0][1] !== coords[coords.length - 1][1]
//     ) {
//       coords.push(coords[0]);
//     }

//     return {
//       type: "Feature",
//       geometry: { type: "Polygon", coordinates: [coords] },
//       properties: {},
//     } as any;
//   };

//   // Build midpoint label features for each boundary segment
//   const buildSegmentLabels = (stateSnapshot: AppState) => {
//     if (!stateSnapshot.siteBoundary || stateSnapshot.siteBoundary.length < 2) {
//       return { type: "FeatureCollection", features: [] } as any;
//     }
//     const pts = stateSnapshot.siteBoundary;
//     const imperial = stateSnapshot.unitSystem === "imperial";
//     const features: any[] = [];

//     for (let i = 0; i < pts.length; i++) {
//       const a = pts[i];
//       const b = pts[(i + 1) % pts.length];

//       // Midpoint
//       const midLng = (a[0] + b[0]) / 2;
//       const midLat = (a[1] + b[1]) / 2;

//       // Haversine distance in metres
//       const R = 6371000;
//       const dLat = ((b[1] - a[1]) * Math.PI) / 180;
//       const dLng = ((b[0] - a[0]) * Math.PI) / 180;
//       const sinA = Math.sin(dLat / 2);
//       const sinB = Math.sin(dLng / 2);
//       const haversin =
//         sinA * sinA +
//         Math.cos((a[1] * Math.PI) / 180) *
//           Math.cos((b[1] * Math.PI) / 180) *
//           sinB *
//           sinB;
//       const distM =
//         R * 2 * Math.atan2(Math.sqrt(haversin), Math.sqrt(1 - haversin));

//       const label = imperial
//         ? `${(distM * 3.28084).toFixed(1)} ft`
//         : `${distM.toFixed(1)} m`;

//       features.push({
//         type: "Feature",
//         geometry: { type: "Point", coordinates: [midLng, midLat] },
//         properties: { label },
//       });
//     }

//     return { type: "FeatureCollection", features } as any;
//   };

//   useEffect(() => {
//     callbacks.current = {
//       onBoundaryChange,
//       onMapMove,
//       onMapClick,
//       onObjectSelect,
//       onObjectUpdate,
//       onSetBoundaryLock: onSetBoundaryLock || undefined,
//       state,
//     };
//   });

//   const setupLayers = useCallback((map: mapboxgl.Map) => {
//     if (!map.getSource("measure-line")) {
//       map.addSource("measure-line", {
//         type: "geojson",
//         data: { type: "FeatureCollection", features: [] },
//       });
//       map.addLayer({
//         id: "measure-line-layer",
//         type: "line",
//         source: "measure-line",
//         layout: { "line-cap": "round", "line-join": "round" },
//         paint: {
//           "line-color": "#2E8B7A",
//           "line-width": 3,
//           "line-dasharray": [2, 1],
//         },
//       });
//     }

//     if (!map.getSource("boundary-readonly")) {
//       map.addSource("boundary-readonly", {
//         type: "geojson",
//         data: { type: "FeatureCollection", features: [] },
//       });
//       map.addLayer({
//         id: "boundary-readonly-fill",
//         type: "fill",
//         source: "boundary-readonly",
//         paint: { "fill-color": "#2E8B7A", "fill-opacity": 0.1 },
//       });
//       map.addLayer({
//         id: "boundary-readonly-stroke",
//         type: "line",
//         source: "boundary-readonly",
//         paint: { "line-color": "#2E8B7A", "line-width": 2 },
//       });

//       // Populate readonly boundary immediately (useful after a style reload)
//       try {
//         const source = map.getSource(
//           "boundary-readonly",
//         ) as mapboxgl.GeoJSONSource;
//         if (source) {
//           const bf = buildBoundaryFeature(callbacks.current.state);
//           if (bf && bf.geometry) {
//             source.setData(bf as any);
//           } else {
//             source.setData({ type: "FeatureCollection", features: [] } as any);
//           }

//           // Also ensure Mapbox Draw has the polygon so it's selectable/visible
//           const draw = drawRef.current;
//           try {
//             if (draw && callbacks.current.state.siteBoundary.length >= 3) {
//               const currentFeatures = draw.getAll().features;
//               const hasPolygon = currentFeatures.some(
//                 (f) => f.geometry.type === "Polygon",
//               );
//               if (!hasPolygon) {
//                 const coords = [...callbacks.current.state.siteBoundary];
//                 if (
//                   coords[0][0] !== coords[coords.length - 1][0] ||
//                   coords[0][1] !== coords[coords.length - 1][1]
//                 ) {
//                   coords.push(coords[0]);
//                 }
//                 draw.add({
//                   type: "Feature",
//                   geometry: { type: "Polygon", coordinates: [coords] },
//                   properties: {},
//                 });
//               }
//             }
//           } catch (err) {
//             // ignore draw errors during style transitions
//           }
//         }
//       } catch (err) {
//         // Ignore errors during style transitions
//       }
//     }

//     // Add 3D buildings layer
//     if (
//       !map.getLayer("3d-buildings") &&
//       callbacks.current.state.mapStyle === "streets"
//     ) {
//       const layers = map.getStyle().layers;
//       let labelLayerId;
//       if (layers) {
//         for (let i = 0; i < layers.length; i++) {
//           if (
//             layers[i].type === "symbol" &&
//             (layers[i].layout as any)?.["text-field"]
//           ) {
//             labelLayerId = layers[i].id;
//             break;
//           }
//         }
//       }

//       map.addLayer(
//         {
//           id: "3d-buildings",
//           source: "composite",
//           "source-layer": "building",
//           filter: ["==", "extrude", "true"],
//           type: "fill-extrusion",
//           minzoom: 15,
//           paint: {
//             "fill-extrusion-color": "#aaa",
//             "fill-extrusion-height": [
//               "interpolate",
//               ["linear"],
//               ["zoom"],
//               15,
//               0,
//               15.05,
//               ["get", "height"],
//             ],
//             "fill-extrusion-base": [
//               "interpolate",
//               ["linear"],
//               ["zoom"],
//               15,
//               0,
//               15.05,
//               ["get", "min_height"],
//             ],
//             "fill-extrusion-opacity": 0.6,
//           },
//         },
//         labelLayerId,
//       );
//     }

//     // Boundary segment distance labels
//     if (!map.getSource("boundary-segment-labels")) {
//       map.addSource("boundary-segment-labels", {
//         type: "geojson",
//         data: { type: "FeatureCollection", features: [] },
//       });
//       map.addLayer({
//         id: "boundary-segment-labels-layer",
//         type: "symbol",
//         source: "boundary-segment-labels",
//         layout: {
//           "text-field": ["get", "label"],
//           "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
//           "text-size": 13,
//           "text-anchor": "center",
//           "text-allow-overlap": true,
//           "text-ignore-placement": true,
//           "symbol-placement": "point",
//         },
//         paint: {
//           "text-color": "#ffffff",
//           "text-halo-color": "#1a1a2e",
//           "text-halo-width": 2,
//         },
//       });
//     }

//     if (!map.getSource("equipment")) {
//       map.addSource("equipment", {
//         type: "geojson",
//         data: { type: "FeatureCollection", features: [] },
//         promoteId: "id",
//       });
//       map.addLayer({
//         id: "equipment-layer",
//         type: "fill-extrusion",
//         source: "equipment",
//         filter: ["!", ["has", "model-uri"]],
//         paint: {
//           "fill-extrusion-color": [
//             "case",
//             ["boolean", ["feature-state", "selected"], false],
//             "#ffffff",
//             ["get", "color"],
//           ],
//           "fill-extrusion-height": ["get", "height"],
//           "fill-extrusion-base": 0,
//           "fill-extrusion-opacity": 0.8,
//         },
//       });

//       // Model layer
//       map.addLayer({
//         id: "equipment-model-layer",
//         type: "model",
//         source: "equipment",
//         filter: ["has", "model-uri"],
//         layout: {
//           "model-id": ["get", "model-uri"],
//         },
//         paint: {
//           "model-rotation": [0, 0, ["get", "rotation"]],
//           "model-scale": [1, 1, 1],
//           "model-type": "common-3d",
//           "model-animations": [
//             "case",
//             ["has", "animations"],
//             ["get", "animations"],
//             ["literal", []],
//           ],
//         } as any,
//       });

//       // Populate equipment source immediately (useful after a style reload)
//       try {
//         const source = map.getSource("equipment") as mapboxgl.GeoJSONSource;
//         if (source) {
//           const fc = buildEquipmentFeatureCollection(
//             callbacks.current.state,
//             map,
//           );
//           source.setData(fc as any);

//           // Restore selection feature state
//           callbacks.current.state.objects.forEach((obj) => {
//             map.setFeatureState(
//               { source: "equipment", id: obj.id },
//               { selected: callbacks.current.state.selectedId === obj.id },
//             );
//           });
//         }
//       } catch (err) {
//         // Ignore errors during style transitions
//       }
//     }

//     if (!map.getSource("ghost-box")) {
//       map.addSource("ghost-box", {
//         type: "geojson",
//         data: { type: "FeatureCollection", features: [] },
//       });
//       map.addLayer({
//         id: "ghost-box-layer",
//         type: "fill-extrusion",
//         source: "ghost-box",
//         filter: ["!", ["has", "model-uri"]],
//         paint: {
//           "fill-extrusion-color": ["get", "color"],
//           "fill-extrusion-height": ["get", "height"],
//           "fill-extrusion-base": 0,
//           "fill-extrusion-opacity": 0.4,
//         },
//       });

//       // Ghost model layer
//       map.addLayer({
//         id: "ghost-model-layer",
//         type: "model",
//         source: "ghost-box",
//         filter: ["has", "model-uri"],
//         layout: {
//           "model-id": ["get", "model-uri"],
//         },
//         paint: {
//           "model-rotation": [0, 0, 0],
//           "model-scale": [1, 1, 1],
//           "model-type": "common-3d",
//           "model-opacity": 0.4,
//           "model-animations": [
//             "case",
//             ["has", "animations"],
//             ["get", "animations"],
//             ["literal", []],
//           ],
//         } as any,
//       });
//     }

//     // ── Safe zone layers (shown only while placing equipment) ──────────────
//     if (!map.getSource("safe-zones")) {
//       map.addSource("safe-zones", {
//         type: "geojson",
//         data: { type: "FeatureCollection", features: [] },
//       });
//       // Amber fill — safe zone area of each placed equipment
//       map.addLayer({
//         id: "safe-zone-fill",
//         type: "fill",
//         source: "safe-zones",
//         paint: {
//           "fill-color": "#f59e0b",
//           "fill-opacity": 0.08,
//         },
//       });
//       // Amber dashed outline
//       map.addLayer({
//         id: "safe-zone-outline",
//         type: "line",
//         source: "safe-zones",
//         paint: {
//           "line-color": "#f59e0b",
//           "line-width": 1.5,
//           "line-dasharray": [3, 2],
//           "line-opacity": 0.6,
//         },
//       });
//     }

//     if (!map.getSource("safe-zone-violations")) {
//       map.addSource("safe-zone-violations", {
//         type: "geojson",
//         data: { type: "FeatureCollection", features: [] },
//       });
//       // Red fill for violated safe zones
//       map.addLayer({
//         id: "safe-zone-violation-fill",
//         type: "fill",
//         source: "safe-zone-violations",
//         paint: {
//           "fill-color": "#ef4444",
//           "fill-opacity": 0.18,
//         },
//       });
//       // Bold red outline for violated safe zones
//       map.addLayer({
//         id: "safe-zone-violation-outline",
//         type: "line",
//         source: "safe-zone-violations",
//         paint: {
//           "line-color": "#ef4444",
//           "line-width": 3,
//           "line-opacity": 1,
//         },
//       });
//     }
//   }, []);

//   useEffect(() => {
//     if (mapRef.current && targetLocation) {
//       mapRef.current.flyTo({
//         center: [targetLocation.lng, targetLocation.lat],
//         zoom: targetLocation.zoom || 18,
//         essential: true,
//       });
//     }
//   }, [targetLocation]);

//   useEffect(() => {
//     if (!mapContainerRef.current) return;

//     const token = import.meta.env.VITE_MAPBOX_TOKEN;
//     if (!token) {
//       console.error("Mapbox token missing");
//       return;
//     }

//     mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

//     const map = new mapboxgl.Map({
//       container: mapContainerRef.current,
//       style: "mapbox://styles/mapbox/streets-v12",
//       center: [73.8567, 18.5204], // Pune, India
//       zoom: 16,
//       pitch: 0,
//       bearing: 0,
//       antialias: true,
//       preserveDrawingBuffer: true,
//     });

//     const draw = new MapboxDraw({
//       displayControlsDefault: false,
//       controls: {
//         polygon: true,
//         trash: true,
//       },
//       defaultMode: "simple_select",
//     });

//     map.addControl(draw);
//     map.addControl(new mapboxgl.NavigationControl(), "top-right");

//     map.on("style.load", () => {
//       setupLayers(map);
//     });

//     map.on("load", () => {
//       mapRef.current = map;
//       drawRef.current = draw;
//       setupLayers(map);
//       // Expose the map instance to the parent so it can control the camera
//       onMapReady?.(map);
//     });

//     map.on("draw.create", (e: any) => {
//       const feature = e.features[0];
//       if (feature.geometry.type === "Polygon") {
//         callbacks.current.onBoundaryChange(
//           feature.geometry.coordinates[0] as [number, number][],
//         );
//         // Update segment labels immediately on draw complete
//         const segSrc = map.getSource(
//           "boundary-segment-labels",
//         ) as mapboxgl.GeoJSONSource;
//         if (segSrc) segSrc.setData(buildSegmentLabels(callbacks.current.state));
//       }
//     });

//     map.on("draw.update", (e: any) => {
//       const feature = e.features[0];
//       if (feature.geometry.type === "Polygon") {
//         callbacks.current.onBoundaryChange(
//           feature.geometry.coordinates[0] as [number, number][],
//         );
//         // Update segment labels on polygon vertex drag
//         const segSrc = map.getSource(
//           "boundary-segment-labels",
//         ) as mapboxgl.GeoJSONSource;
//         if (segSrc) segSrc.setData(buildSegmentLabels(callbacks.current.state));
//       }
//     });

//     map.on("draw.delete", () => {
//       callbacks.current.onBoundaryChange([]);
//       // Clear segment labels on delete
//       const segSrc = map.getSource(
//         "boundary-segment-labels",
//       ) as mapboxgl.GeoJSONSource;
//       if (segSrc) segSrc.setData({ type: "FeatureCollection", features: [] });
//     });

//     // draw.render fires on EVERY change — vertex add, drag, hover
//     // This gives LIVE distance labels while the user is still drawing
//     map.on("draw.render", () => {
//       const draw = drawRef.current;
//       if (!draw) return;
//       const all = draw.getAll();
//       const polygon = all.features.find(
//         (f: any) => f.geometry.type === "Polygon",
//       );
//       if (!polygon) return;

//       const coords: [number, number][] = (polygon.geometry as any)
//         .coordinates[0];
//       // Need at least 2 real points (excluding closing duplicate)
//       if (coords.length < 3) return;

//       // Build a temporary state snapshot using live draw coords (not yet in state)
//       const liveState = {
//         ...callbacks.current.state,
//         siteBoundary: coords.slice(0, -1), // remove closing duplicate
//       };
//       const segSrc = map.getSource(
//         "boundary-segment-labels",
//       ) as mapboxgl.GeoJSONSource;
//       if (segSrc) segSrc.setData(buildSegmentLabels(liveState));
//     });

//     map.on("mousemove", (e) => {
//       setHoverCoords([e.lngLat.lng, e.lngLat.lat]);
//       callbacks.current.onMapMove(e);

//       if (!map.getLayer("equipment-layer")) return;

//       const features = map.queryRenderedFeatures(e.point, {
//         layers: ["equipment-layer", "equipment-model-layer"],
//       });
//       map.getCanvas().style.cursor = features.length > 0 ? "pointer" : "";

//       if (draggingIdRef.current && callbacks.current.state.originLngLat) {
//         const { x, z } = lngLatToMetres(
//           [e.lngLat.lng, e.lngLat.lat],
//           callbacks.current.state.originLngLat,
//         );
//         const snappedX = Math.round(x * 2) / 2;
//         const snappedZ = Math.round(z * 2) / 2;
//         callbacks.current.onObjectUpdate(draggingIdRef.current, {
//           x: snappedX,
//           z: snappedZ,
//         });
//       }
//     });

//     // Use mousedown instead of click for more reliable placement and dragging
//     map.on("mousedown", (e) => {
//       if (!map.getLayer("equipment-layer")) {
//         callbacks.current.onMapClick(e);
//         return;
//       }

//       const features = map.queryRenderedFeatures(e.point, {
//         layers: ["equipment-layer", "equipment-model-layer"],
//       });
//       if (features.length > 0) {
//         const id = (features[0].id as string) || features[0].properties?.id;
//         callbacks.current.onObjectSelect(id);
//         draggingIdRef.current = id;
//         // Lock the boundary while dragging an object so it remains fixed
//         try {
//           callbacks.current.onSetBoundaryLock?.(true);
//         } catch {}
//         map.dragPan.disable();
//       } else {
//         callbacks.current.onMapClick(e);
//         if (!callbacks.current.state.pendingPlacement) {
//           callbacks.current.onObjectSelect(null);
//         }
//       }
//     });

//     map.on("mouseup", () => {
//       // Unlock boundary when drag ends
//       try {
//         callbacks.current.onSetBoundaryLock?.(false);
//       } catch {}
//       draggingIdRef.current = null;
//       map.dragPan.enable();
//     });

//     const updateCamera = () => {
//       if (!mapRef.current) return;
//     };

//     map.on("move", updateCamera);
//     map.on("zoom", updateCamera);
//     map.on("pitch", updateCamera);
//     map.on("rotate", updateCamera);

//     return () => {
//       map.remove();
//     };
//   }, []);

//   // Sync equipment visual
//   useEffect(() => {
//     if (!mapRef.current) return;
//     const map = mapRef.current;
//     const source = map.getSource("equipment") as mapboxgl.GeoJSONSource;
//     if (!source) return;

//     // If no originLngLat or no objects, clear the equipment layer
//     if (!state.originLngLat || state.objects.length === 0) {
//       source.setData({ type: "FeatureCollection", features: [] });
//       return;
//     }

//     const features = state.objects
//       .map((obj) => {
//         const def =
//           DEFAULT_LIBRARY.find((d) => d.id === obj.type) ??
//           state.customLibrary.find((d) => d.id === obj.type);
//         if (!def) return null;

//         const lngLat = metresToLngLat(obj.x, obj.z, state.originLngLat!);

//         // If model is available, use point geometry for model layer
//         if (def.modelUrl) {
//           // Register model if not already registered
//           if (!map.hasModel(def.modelUrl)) {
//             map.addModel(def.modelUrl, def.modelUrl);
//           }

//           return {
//             type: "Feature",
//             id: obj.id,
//             geometry: {
//               type: "Point",
//               coordinates: [lngLat[0], lngLat[1]],
//             },
//             properties: {
//               id: obj.id,
//               color: obj.color || def.color,
//               height: def.height,
//               "model-uri": def.modelUrl,
//               rotation: (obj.rotationY * 180) / Math.PI, // Mapbox model rotation is in degrees
//               animations: def.animationsEnabled
//                 ? [{ name: "*", state: "play" }]
//                 : [],
//             },
//           };
//         }

//         // Fallback to box polygon for fill-extrusion
//         const halfW = def.width / 2;
//         const halfD = def.depth / 2;

//         const cornersMetres = [
//           { x: -halfW, z: -halfD },
//           { x: halfW, z: -halfD },
//           { x: halfW, z: halfD },
//           { x: -halfW, z: halfD },
//           { x: -halfW, z: -halfD },
//         ];

//         const rotatedCorners = cornersMetres.map((c) => {
//           const rx =
//             c.x * Math.cos(obj.rotationY) - c.z * Math.sin(obj.rotationY);
//           const rz =
//             c.x * Math.sin(obj.rotationY) + c.z * Math.cos(obj.rotationY);
//           return metresToLngLat(obj.x + rx, obj.z + rz, state.originLngLat!);
//         });

//         return {
//           type: "Feature",
//           id: obj.id,
//           geometry: {
//             type: "Polygon",
//             coordinates: [rotatedCorners],
//           },
//           properties: {
//             id: obj.id,
//             color: obj.color || def.color,
//             height: def.height,
//           },
//         };
//       })
//       .filter((f) => f !== null);

//     source.setData({
//       type: "FeatureCollection",
//       features: features as any,
//     });

//     // Update feature state for selection highlight
//     state.objects.forEach((obj) => {
//       map.setFeatureState(
//         { source: "equipment", id: obj.id },
//         { selected: state.selectedId === obj.id },
//       );
//     });
//   }, [state.objects, state.originLngLat, state.selectedId, state.mapStyle]);

//   // ── Helper: build a safe-zone polygon for an equipment at (cx, cz) ──────
//   const buildSafeZonePolygon = (
//     cx: number,
//     cz: number,
//     width: number,
//     depth: number,
//     rotationY: number,
//     origin: [number, number],
//   ) => {
//     const SAFE = 1.5; // 1.5m each side = +3m total per dimension
//     const hw = (width + SAFE * 2) / 2;
//     const hd = (depth + SAFE * 2) / 2;
//     const corners = [
//       { x: -hw, z: -hd },
//       { x: hw, z: -hd },
//       { x: hw, z: hd },
//       { x: -hw, z: hd },
//       { x: -hw, z: -hd },
//     ].map((c) => {
//       const rx = c.x * Math.cos(rotationY) - c.z * Math.sin(rotationY);
//       const rz = c.x * Math.sin(rotationY) + c.z * Math.cos(rotationY);
//       return metresToLngLat(cx + rx, cz + rz, origin);
//     });
//     return corners;
//   };

//   // ── Sync safe-zone layers whenever pendingPlacement or hoverCoords changes ──
//   useEffect(() => {
//     if (!mapRef.current) return;
//     const map = mapRef.current;
//     const safeSource = map.getSource("safe-zones") as mapboxgl.GeoJSONSource;
//     const violSource = map.getSource(
//       "safe-zone-violations",
//     ) as mapboxgl.GeoJSONSource;
//     if (!safeSource || !violSource) return;

//     // Clear both layers when nothing is being placed or dragged
//     const isDragging = !!draggingIdRef.current;
//     if (
//       (!state.pendingPlacement && !isDragging) ||
//       !state.originLngLat ||
//       !hoverCoords
//     ) {
//       safeSource.setData({ type: "FeatureCollection", features: [] });
//       violSource.setData({ type: "FeatureCollection", features: [] });
//       return;
//     }

//     const origin = state.originLngLat;
//     const allDefs = [...DEFAULT_LIBRARY, ...(state.customLibrary || [])];

//     // Build safe-zone polygon for every already-placed equipment
//     const safeFeatures = state.objects
//       .map((obj) => {
//         const def = allDefs.find((d) => d.id === obj.type);
//         if (!def) return null;
//         const ring = buildSafeZonePolygon(
//           obj.x,
//           obj.z,
//           def.width,
//           def.depth,
//           obj.rotationY,
//           origin,
//         );
//         return {
//           type: "Feature" as const,
//           geometry: { type: "Polygon" as const, coordinates: [ring] },
//           properties: { id: obj.id },
//         };
//       })
//       .filter(Boolean);

//     safeSource.setData({
//       type: "FeatureCollection",
//       features: safeFeatures as any,
//     });

//     // Ghost footprint of the equipment being placed
//     const { x, z } = lngLatToMetres(hoverCoords, origin);
//     const ghostX = Math.round(x * 2) / 2;
//     const ghostZ = Math.round(z * 2) / 2;
//     // Determine the definition and rotation for the ghost footprint.
//     // Use pendingPlacement when placing, or the dragged object's def when dragging.
//     let def = state.pendingPlacement;
//     let rotationY = 0;
//     if (!def && draggingIdRef.current) {
//       const draggingObj = state.objects.find(
//         (o) => o.id === draggingIdRef.current,
//       );
//       if (draggingObj) {
//         def =
//           DEFAULT_LIBRARY.find((d) => d.id === draggingObj.type) ??
//           (state.customLibrary || []).find((d) => d.id === draggingObj.type);
//         rotationY = draggingObj.rotationY || 0;
//       }
//     }

//     if (!def) {
//       violSource.setData({ type: "FeatureCollection", features: [] });
//       return;
//     }

//     const ghw = def.width / 2;
//     const ghd = def.depth / 2;
//     const ghostCorners = [
//       { x: -ghw, z: -ghd },
//       { x: ghw, z: -ghd },
//       { x: ghw, z: ghd },
//       { x: -ghw, z: ghd },
//       { x: -ghw, z: -ghd },
//     ].map((c) => {
//       const rx = c.x * Math.cos(rotationY) - c.z * Math.sin(rotationY);
//       const rz = c.x * Math.sin(rotationY) + c.z * Math.cos(rotationY);
//       return metresToLngLat(ghostX + rx, ghostZ + rz, origin);
//     });

//     const ghostPolygon = turf.polygon([ghostCorners]);

//     // Find any safe zone that the ghost footprint overlaps
//     const violations = safeFeatures.filter((f) => {
//       if (!f) return false;
//       try {
//         return turf.booleanIntersects(
//           ghostPolygon,
//           turf.polygon([(f as any).geometry.coordinates[0]]),
//         );
//       } catch {
//         return false;
//       }
//     });

//     violSource.setData({
//       type: "FeatureCollection",
//       features: violations as any,
//     });
//   }, [
//     state.pendingPlacement,
//     hoverCoords,
//     state.originLngLat,
//     state.objects,
//     state.customLibrary,
//   ]);

//   // Sync ghost box
//   useEffect(() => {
//     if (
//       !mapRef.current ||
//       !state.originLngLat ||
//       !state.pendingPlacement ||
//       !hoverCoords
//     ) {
//       if (mapRef.current) {
//         const source = mapRef.current.getSource(
//           "ghost-box",
//         ) as mapboxgl.GeoJSONSource;
//         if (source) source.setData({ type: "FeatureCollection", features: [] });
//       }
//       return;
//     }

//     const map = mapRef.current;
//     const source = map.getSource("ghost-box") as mapboxgl.GeoJSONSource;
//     if (!source) return;

//     const def = state.pendingPlacement;
//     const { x, z } = lngLatToMetres(hoverCoords, state.originLngLat);
//     const snappedX = Math.round(x * 2) / 2;
//     const snappedZ = Math.round(z * 2) / 2;
//     const lngLat = metresToLngLat(snappedX, snappedZ, state.originLngLat!);

//     if (def.modelUrl) {
//       if (!map.hasModel(def.modelUrl)) {
//         map.addModel(def.modelUrl, def.modelUrl);
//       }

//       source.setData({
//         type: "FeatureCollection",
//         features: [
//           {
//             type: "Feature",
//             geometry: {
//               type: "Point",
//               coordinates: [lngLat[0], lngLat[1]],
//             },
//             properties: {
//               color: def.color,
//               height: def.height,
//               "model-uri": def.modelUrl,
//               animations: def.animationsEnabled
//                 ? [{ name: "*", state: "play" }]
//                 : [],
//             },
//           },
//         ] as any,
//       });
//       return;
//     }

//     const halfW = def.width / 2;
//     const halfD = def.depth / 2;
//     const cornersMetres = [
//       { x: -halfW, z: -halfD },
//       { x: halfW, z: -halfD },
//       { x: halfW, z: halfD },
//       { x: -halfW, z: halfD },
//       { x: -halfW, z: -halfD },
//     ];

//     const cornersLngLat = cornersMetres.map((c) =>
//       metresToLngLat(snappedX + c.x, snappedZ + c.z, state.originLngLat!),
//     );

//     source.setData({
//       type: "FeatureCollection",
//       features: [
//         {
//           type: "Feature",
//           geometry: {
//             type: "Polygon",
//             coordinates: [cornersLngLat],
//           },
//           properties: {
//             color: def.color,
//             height: def.height,
//           },
//         },
//       ] as any,
//     });
//   }, [state.pendingPlacement, hoverCoords, state.originLngLat, state.mapStyle]);

//   // Sync measurement visual
//   useEffect(() => {
//     if (!mapRef.current) return;
//     const map = mapRef.current;

//     // Clear old markers
//     measureMarkersRef.current.forEach((m) => m.remove());
//     measureMarkersRef.current = [];
//     if (measureLineRef.current) measureLineRef.current.remove();
//     measureLineRef.current = null;

//     if (state.measurePoints.length === 0) {
//       const source = map.getSource("measure-line") as mapboxgl.GeoJSONSource;
//       if (source) source.setData({ type: "FeatureCollection", features: [] });
//       // Also clear segment labels
//       const segSource = map.getSource(
//         "boundary-segment-labels",
//       ) as mapboxgl.GeoJSONSource;
//       if (segSource)
//         segSource.setData({ type: "FeatureCollection", features: [] });
//       return;
//     }

//     state.measurePoints.forEach((pt, i) => {
//       const el = document.createElement("div");
//       const isPlainMode = state.mapStyle === "plain";
//       const isLightTheme = theme === "light";

//       // Adjust marker colors for plain mode
//       let markerClass =
//         "w-3 h-3 bg-brand-teal border-2 border-white rounded-full shadow-lg";
//       if (isPlainMode) {
//         if (isLightTheme) {
//           markerClass =
//             "w-4 h-4 bg-[#00FF00] border-2 border-white rounded-full shadow-lg";
//         } else {
//           markerClass =
//             "w-4 h-4 bg-[#FFD700] border-2 border-black rounded-full shadow-lg";
//         }
//       }

//       el.className = markerClass;
//       const marker = new mapboxgl.Marker(el).setLngLat(pt).addTo(map);
//       measureMarkersRef.current.push(marker);
//     });

//     if (state.measurePoints.length === 2) {
//       const p1 = state.measurePoints[0];
//       const p2 = state.measurePoints[1];
//       const distMeters = turf.distance(turf.point(p1), turf.point(p2), {
//         units: "meters",
//       });
//       const midpoint = turf.midpoint(turf.point(p1), turf.point(p2)).geometry
//         .coordinates as [number, number];

//       const source = map.getSource("measure-line") as mapboxgl.GeoJSONSource;
//       if (source) {
//         source.setData({
//           type: "FeatureCollection",
//           features: [
//             {
//               type: "Feature",
//               geometry: { type: "LineString", coordinates: [p1, p2] },
//               properties: {},
//             },
//           ],
//         });
//       }

//       const label = document.createElement("div");
//       const isPlainMode = state.mapStyle === "plain";
//       const isLightTheme = theme === "light";

//       // Adjust label colors for plain mode
//       let labelClass =
//         "bg-white text-brand-navy px-2 py-1 rounded shadow-lg text-[10px] font-bold border border-brand-teal";
//       if (isPlainMode) {
//         if (isLightTheme) {
//           labelClass =
//             "bg-[#00FF00] text-black px-2 py-1 rounded shadow-lg text-[10px] font-bold border-2 border-white";
//         } else {
//           labelClass =
//             "bg-[#FFD700] text-black px-2 py-1 rounded shadow-lg text-[10px] font-bold border-2 border-black";
//         }
//       }

//       label.className = labelClass;

//       if (state.unitSystem === "imperial") {
//         const distFeet = distMeters * 3.28084;
//         label.innerText = distFeet.toFixed(1) + "ft";
//       } else {
//         label.innerText = distMeters.toFixed(1) + "m";
//       }

//       const labelMarker = new mapboxgl.Marker(label)
//         .setLngLat(midpoint)
//         .addTo(map);
//       measureLineRef.current = labelMarker;
//     }
//   }, [state.measurePoints, state.unitSystem, theme, state.mapStyle]);

//   // Sync style — runs ONLY when the map style (streets/satellite/plain) changes.
//   // theme is intentionally NOT in the dependency array: toggling dark↔light must
//   // not call setStyle(), which wipes every custom source & layer (boundary, equipment, etc.)
//   useEffect(() => {
//     if (!mapRef.current) return;

//     if (state.mapStyle === "plain") {
//       const plainStyle = {
//         version: 8,
//         name: "plain",
//         metadata: {},
//         glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
//         sources: {},
//         layers: [
//           {
//             id: "plain-background",
//             type: "background",
//             paint: {
//               // Use current theme value captured via ref so this closure doesn't
//               // need `theme` as a dep (and therefore doesn't re-run on theme change).
//               "background-color": callbacks.current.state.mapStyle === "plain"
//                 ? (document.documentElement.classList.contains("light") ? "#000000" : "#ffffff")
//                 : "#ffffff",
//             },
//           },
//         ],
//       } as any;

//       mapRef.current.setStyle(plainStyle);
//       return;
//     }

//     const style =
//       state.mapStyle === "satellite"
//         ? "mapbox://styles/mapbox/satellite-v9"
//         : "mapbox://styles/mapbox/streets-v12";

//     // After setStyle, all sources/layers are wiped — re-add segment labels on style.load.
//     // The global style.load handler (set during map init) calls setupLayers() which
//     // re-adds boundary, equipment, and all other custom layers automatically.
//     mapRef.current.once("style.load", () => {
//       const map = mapRef.current;
//       if (!map) return;
//       if (!map.getSource("boundary-segment-labels")) {
//         map.addSource("boundary-segment-labels", {
//           type: "geojson",
//           data: { type: "FeatureCollection", features: [] },
//         });
//       }
//       if (!map.getLayer("boundary-segment-labels-layer")) {
//         map.addLayer({
//           id: "boundary-segment-labels-layer",
//           type: "symbol",
//           source: "boundary-segment-labels",
//           layout: {
//             "text-field": ["get", "label"],
//             "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
//             "text-size": 13,
//             "text-anchor": "center",
//             "text-allow-overlap": true,
//             "text-ignore-placement": true,
//           },
//           paint: {
//             "text-color": "#ffffff",
//             "text-halo-color": "#1a1a2e",
//             "text-halo-width": 2,
//           },
//         });
//       }
//       // Restore labels from current state
//       const segSrc = map.getSource(
//         "boundary-segment-labels",
//       ) as mapboxgl.GeoJSONSource;
//       if (segSrc) segSrc.setData(buildSegmentLabels(state));
//     });

//     mapRef.current.setStyle(style);
//   }, [state.mapStyle]); // ← theme deliberately omitted — see comment above

//   // Update plain-mode background color when theme changes WITHOUT reloading style.
//   // This uses setPaintProperty (non-destructive) so all layers remain intact.
//   useEffect(() => {
//     const map = mapRef.current;
//     if (!map || state.mapStyle !== "plain") return;

//     const applyBackground = () => {
//       try {
//         if (map.getLayer("plain-background")) {
//           map.setPaintProperty(
//             "plain-background",
//             "background-color",
//             theme === "light" ? "#000000" : "#ffffff",
//           );
//         }
//       } catch (_) {
//         // Layer not ready yet — safe to ignore
//       }
//     };

//     if (map.isStyleLoaded()) {
//       applyBackground();
//     } else {
//       map.once("style.load", applyBackground);
//     }
//   }, [theme, state.mapStyle]);

//   // Adjust visibility colors for plain mode
//   useEffect(() => {
//     if (!mapRef.current || state.mapStyle !== "plain") return;
//     const map = mapRef.current;

//     // // In plain mode, increase opacity and contrast for boundary and measurements
//     // const isLightTheme = theme === "light";
//     // const boundaryColor = isLightTheme ? "#00FF00" : "#FFD700"; // Bright green for black bg, gold for white bg
//     // const boundaryOpacity = 0.3;
//     // const measureColor = isLightTheme ? "#00FF00" : "#FFD700";
//     // const measureWidth = isLightTheme ? 4 : 3;

//     // // Re-add segment labels source+layer if wiped by setStyle
//     // if (!map.getSource("boundary-segment-labels")) {
//     //   map.addSource("boundary-segment-labels", {
//     //     type: "geojson",
//     //     data: { type: "FeatureCollection", features: [] },
//     //   });
//     // }
//     // if (!map.getLayer("boundary-segment-labels-layer")) {
//     //   map.addLayer({
//     //     id: "boundary-segment-labels-layer",
//     //     type: "symbol",
//     //     source: "boundary-segment-labels",
//     //     layout: {
//     //       "text-field": ["get", "label"],
//     //       "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
//     //       "text-size": 13,
//     //       "text-anchor": "center",
//     //       "text-allow-overlap": true,
//     //       "text-ignore-placement": true,
//     //       "symbol-placement": "point",
//     //     },
//     //     paint: {
//     //       "text-color": theme === "light" ? "#000000" : "#ffffff",
//     //       "text-halo-color": theme === "light" ? "#ffffff" : "#1a1a2e",
//     //       "text-halo-width": 2,
//     //     },
//     //   });
//     // }
//     // // Repopulate with current boundary data
//     // const segSrcPlain = map.getSource(
//     //   "boundary-segment-labels",
//     // ) as mapboxgl.GeoJSONSource;
//     // if (segSrcPlain) segSrcPlain.setData(buildSegmentLabels(state));

//     // try {
//     //   if (map.getLayer("boundary-readonly-fill")) {
//     //     map.setPaintProperty(
//     //       "boundary-readonly-fill",
//     //       "fill-color",
//     //       boundaryColor,
//     //     );
//     //     map.setPaintProperty(
//     //       "boundary-readonly-fill",
//     //       "fill-opacity",
//     //       boundaryOpacity,
//     //     );
//     //   }
//     //   if (map.getLayer("boundary-readonly-stroke")) {
//     //     map.setPaintProperty(
//     //       "boundary-readonly-stroke",
//     //       "line-color",
//     //       boundaryColor,
//     //     );
//     //     map.setPaintProperty("boundary-readonly-stroke", "line-width", 3);
//     //   }
//     //   if (map.getLayer("measure-line-layer")) {
//     //     map.setPaintProperty("measure-line-layer", "line-color", measureColor);
//     //     map.setPaintProperty("measure-line-layer", "line-width", measureWidth);
//     //   }
//     // } catch (err) {
//     //   // Layer not ready yet
//     // }
//     const applyPlainStyling = () => {
//       const map = mapRef.current;
//       if (!map) return;

//       const isLightTheme = theme === "light";
//       const boundaryColor = isLightTheme ? "#00FF00" : "#FFD700";
//       const boundaryOpacity = 0.3;
//       const measureColor = isLightTheme ? "#00FF00" : "#FFD700";
//       const measureWidth = isLightTheme ? 4 : 3;

//       // Defensive fallback — setupLayers() already re-adds this on style.load,
//       // this just guards against ordering surprises.
//       if (!map.getSource("boundary-segment-labels")) {
//         map.addSource("boundary-segment-labels", {
//           type: "geojson",
//           data: { type: "FeatureCollection", features: [] },
//         });
//       }
//       if (!map.getLayer("boundary-segment-labels-layer")) {
//         map.addLayer({
//           id: "boundary-segment-labels-layer",
//           type: "symbol",
//           source: "boundary-segment-labels",
//           layout: {
//             "text-field": ["get", "label"],
//             "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
//             "text-size": 13,
//             "text-anchor": "center",
//             "text-allow-overlap": true,
//             "text-ignore-placement": true,
//             "symbol-placement": "point",
//           },
//           paint: {
//             "text-color": theme === "light" ? "#000000" : "#ffffff",
//             "text-halo-color": theme === "light" ? "#ffffff" : "#1a1a2e",
//             "text-halo-width": 2,
//           },
//         });
//       }

//       const segSrcPlain = map.getSource(
//         "boundary-segment-labels",
//       ) as mapboxgl.GeoJSONSource;
//       if (segSrcPlain) segSrcPlain.setData(buildSegmentLabels(state));

//       try {
//         if (map.getLayer("boundary-readonly-fill")) {
//           map.setPaintProperty(
//             "boundary-readonly-fill",
//             "fill-color",
//             boundaryColor,
//           );
//           map.setPaintProperty(
//             "boundary-readonly-fill",
//             "fill-opacity",
//             boundaryOpacity,
//           );
//         }
//         if (map.getLayer("boundary-readonly-stroke")) {
//           map.setPaintProperty(
//             "boundary-readonly-stroke",
//             "line-color",
//             boundaryColor,
//           );
//           map.setPaintProperty("boundary-readonly-stroke", "line-width", 3);
//         }
//         if (map.getLayer("measure-line-layer")) {
//           map.setPaintProperty(
//             "measure-line-layer",
//             "line-color",
//             measureColor,
//           );
//           map.setPaintProperty(
//             "measure-line-layer",
//             "line-width",
//             measureWidth,
//           );
//         }
//       } catch (err) {
//         // Layer not ready yet
//       }
//     };

//     // CRITICAL: setStyle() was just called in the effect above. At this point
//     // in the same commit, map.isStyleLoaded() is false — calling addSource/
//     // addLayer/getLayer synchronously here throws "Style is not done loading".
//     if (map.isStyleLoaded()) {
//       applyPlainStyling();
//     } else {
//       map.once("style.load", applyPlainStyling);
//     }
//   }, [state.mapStyle, theme]);

//   // Sync terrain and buildings
//   useEffect(() => {
//     if (!mapRef.current) return;
//     const map = mapRef.current;

//     const handleStyleLoad = () => {
//       // Terrain
//       if (state.terrainEnabled && state.mapStyle === "streets") {
//         if (!map.getSource("mapbox-dem")) {
//           map.addSource("mapbox-dem", {
//             type: "raster-dem",
//             url: "mapbox://mapbox.mapbox-terrain-dem-v1",
//             tileSize: 512,
//             maxzoom: 14,
//           });
//         }
//         map.setTerrain({ source: "mapbox-dem", exaggeration: 1.2 });
//         map.easeTo({ pitch: 60 });
//       } else {
//         map.setTerrain(null);
//         map.easeTo({ pitch: 0 });
//       }

//       // Buildings
//       if (map.getLayer("3d-buildings")) {
//         map.setLayoutProperty(
//           "3d-buildings",
//           "visibility",
//           state.buildingsEnabled ? "visible" : "none",
//         );
//       } else if (state.buildingsEnabled && state.mapStyle === "streets") {
//         // If layer missing but enabled, re-run setup
//         setupLayers(map);
//       }
//     };

//     if (map.isStyleLoaded()) {
//       handleStyleLoad();
//     } else {
//       map.once("style.load", handleStyleLoad);
//     }
//   }, [state.terrainEnabled, state.buildingsEnabled, state.mapStyle]);

//   // Sync readonly boundary and origin marker
//   useEffect(() => {
//     if (!mapRef.current) return;
//     const map = mapRef.current;

//     // Origin Marker
//     if (originMarkerRef.current) originMarkerRef.current.remove();
//     if (state.originLngLat) {
//       const el = document.createElement("div");
//       const isPlainMode = state.mapStyle === "plain";
//       const isLightTheme = theme === "light";

//       // Adjust marker colors for plain mode: bright colors for visibility
//       let bgColor = "bg-brand-teal";
//       let innerColor = "bg-white";
//       let borderColor = "border-white";

//       if (isPlainMode) {
//         if (isLightTheme) {
//           // For black background in light theme mode
//           bgColor = "bg-[#00FF00]"; // Bright green
//           innerColor = "bg-white";
//           borderColor = "border-white";
//         } else {
//           // For white background in dark theme mode
//           bgColor = "bg-[#FFD700]"; // Gold
//           innerColor = "bg-black";
//           borderColor = "border-black";
//         }
//       }

//       el.className = `w-6 h-6 flex items-center justify-center ${bgColor} rounded-full border-2 ${borderColor} shadow-xl animate-pulse`;
//       el.innerHTML = `<div class="w-2 h-2 ${innerColor} rounded-full"></div>`;

//       const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
//         '<div class="text-[10px] font-bold text-brand-navy p-1">BENCHMARK ORIGIN</div>',
//       );

//       originMarkerRef.current = new mapboxgl.Marker(el)
//         .setLngLat(state.originLngLat)
//         .setPopup(popup)
//         .addTo(map);
//     }

//     // Clear boundary if no origin or boundary too small
//     if (!state.originLngLat || state.siteBoundary.length < 3) {
//       const source = map.getSource(
//         "boundary-readonly",
//       ) as mapboxgl.GeoJSONSource;
//       if (source) source.setData({ type: "FeatureCollection", features: [] });
//       return;
//     }

//     const source = map.getSource("boundary-readonly") as mapboxgl.GeoJSONSource;
//     if (!source) return;

//     // Ensure closed
//     const coords = [...state.siteBoundary];
//     if (
//       coords[0][0] !== coords[coords.length - 1][0] ||
//       coords[0][1] !== coords[coords.length - 1][1]
//     ) {
//       coords.push(coords[0]);
//     }

//     source.setData({
//       type: "Feature",
//       geometry: {
//         type: "Polygon",
//         coordinates: [coords],
//       },
//       properties: {},
//     } as any);

//     // Update segment distance labels
//     const segSource = map.getSource(
//       "boundary-segment-labels",
//     ) as mapboxgl.GeoJSONSource;
//     if (segSource) {
//       segSource.setData(buildSegmentLabels(state));
//     }
//   }, [
//     state.siteBoundary,
//     state.originLngLat,
//     theme,
//     state.mapStyle,
//     state.unitSystem,
//   ]);

//   // Sync Mapbox Draw mode and visibility based on app state
//   useEffect(() => {
//     if (!mapRef.current || !drawRef.current) return;
//     const map = mapRef.current;
//     const isLocked =
//       !!state.pendingPlacement || isMeasuring || state.isBoundaryLocked;

//     if (isLocked) {
//       drawRef.current.changeMode("simple_select");
//     }

//     // Toggle visibility of draw layers vs readonly boundary
//     const layers = map.getStyle().layers;
//     if (layers) {
//       layers.forEach((layer) => {
//         if (layer.id.startsWith("gl-draw-")) {
//           map.setLayoutProperty(
//             layer.id,
//             "visibility",
//             isLocked ? "none" : "visible",
//           );
//         }
//       });
//     }

//     map.setLayoutProperty(
//       "boundary-readonly-fill",
//       "visibility",
//       isLocked ? "visible" : "none",
//     );
//     map.setLayoutProperty(
//       "boundary-readonly-stroke",
//       "visibility",
//       isLocked ? "visible" : "none",
//     );
//     // Show segment labels whenever boundary is visible
//     if (map.getLayer("boundary-segment-labels-layer")) {
//       map.setLayoutProperty(
//         "boundary-segment-labels-layer",
//         "visibility",
//         state.siteBoundary.length >= 2 ? "visible" : "none",
//       );
//     }
//   }, [
//     state.pendingPlacement,
//     isMeasuring,
//     state.isBoundaryLocked,
//     state.siteBoundary,
//   ]);

//   // Trigger draw mode
//   useEffect(() => {
//     if (drawTrigger > 0 && drawRef.current) {
//       drawRef.current.changeMode("draw_polygon");
//     }
//   }, [drawTrigger]);

//   // Center map when originLngLat changes (e.g. after import)
//   useEffect(() => {
//     if (mapRef.current && state.originLngLat) {
//       mapRef.current.easeTo({
//         center: state.originLngLat,
//         zoom: 18,
//         duration: 1000,
//       });
//     }
//   }, [state.originLngLat]);

//   // Sync boundary to Mapbox Draw (for import)
//   useEffect(() => {
//     if (!drawRef.current) return;

//     const draw = drawRef.current;
//     // If incoming boundary is too small, ensure draw is cleared
//     if (state.siteBoundary.length < 3) {
//       try {
//         draw.deleteAll();
//       } catch (err) {
//         // ignore
//       }
//       return;
//     }

//     const coords = [...state.siteBoundary];
//     if (
//       coords[0][0] !== coords[coords.length - 1]?.[0] ||
//       coords[0][1] !== coords[coords.length - 1]?.[1]
//     ) {
//       coords.push(coords[0]);
//     }

//     try {
//       const currentFeatures = draw
//         .getAll()
//         .features.filter((f) => f.geometry.type === "Polygon");

//       // If there's no polygon, simply add the new one
//       if (currentFeatures.length === 0) {
//         draw.add({
//           type: "Feature",
//           geometry: { type: "Polygon", coordinates: [coords] },
//           properties: {},
//         });
//         return;
//       }

//       // Compare existing polygon coords with new coords; if different, replace
//       // const existing = currentFeatures[0].geometry.coordinates[0];
//       const polygonFeature = currentFeatures[0];

//       if (polygonFeature.geometry.type !== "Polygon") {
//         return;
//       }

//       const existing = polygonFeature.geometry.coordinates[0];

//       const existingStr = JSON.stringify(
//         existing.map((c: any) => [
//           Number(c[0]).toFixed(6),
//           Number(c[1]).toFixed(6),
//         ]),
//       );
//       const newStr = JSON.stringify(
//         coords.map((c) => [Number(c[0]).toFixed(6), Number(c[1]).toFixed(6)]),
//       );

//       if (existingStr !== newStr) {
//         // replace: remove all polygons and add the new one
//         draw.deleteAll();
//         draw.add({
//           type: "Feature",
//           geometry: { type: "Polygon", coordinates: [coords] },
//           properties: {},
//         });
//       }
//     } catch (err) {
//       // ignore errors (style transitions, etc.)
//     }
//   }, [state.siteBoundary]);

//   // Clear boundary
//   useEffect(() => {
//     if (state.siteBoundary.length === 0 && drawRef.current) {
//       drawRef.current.deleteAll();
//     }
//   }, [state.siteBoundary]);

//   return <div ref={mapContainerRef} className="w-full h-full" />;
// };

// import React, { useEffect, useRef, useState, useCallback } from "react";
// import mapboxgl from "mapbox-gl";
// import "mapbox-gl/dist/mapbox-gl.css";
// import MapboxDraw from "@mapbox/mapbox-gl-draw";
// import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
// import { AppState, DEFAULT_LIBRARY } from "../../../backend/types";
// import * as turf from "@turf/turf";
// import { metresToLngLat, lngLatToMetres } from "../utils/geo";
// import { useTheme } from "../contexts/ThemeContext";

// interface MapPanelProps {
//   state: AppState;
//   isMeasuring: boolean;
//   onBoundaryChange: (coords: [number, number][]) => void;
//   onMapMove: (e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent) => void;
//   onMapClick: (e: mapboxgl.MapMouseEvent) => void;
//   onObjectSelect: (id: string | null) => void;
//   onObjectUpdate: (id: string, updates: any) => void;
//   onSetBoundaryLock?: (locked: boolean) => void;
//   drawTrigger: number;
//   targetLocation?: { lng: number; lat: number; zoom?: number };
// }

// export const MapPanel: React.FC<MapPanelProps> = ({
//   state,
//   isMeasuring,
//   onBoundaryChange,
//   onMapMove,
//   onMapClick,
//   onObjectSelect,
//   onObjectUpdate,
//   onSetBoundaryLock,
//   drawTrigger,
//   targetLocation,
// }) => {
//   const mapContainerRef = useRef<HTMLDivElement>(null);
//   const mapRef = useRef<mapboxgl.Map | null>(null);
//   const drawRef = useRef<MapboxDraw | null>(null);
//   const measureMarkersRef = useRef<mapboxgl.Marker[]>([]);
//   const measureLineRef = useRef<mapboxgl.Marker | null>(null);
//   const originMarkerRef = useRef<mapboxgl.Marker | null>(null);
//   const [hoverCoords, setHoverCoords] = useState<[number, number] | null>(null);
//   const draggingIdRef = useRef<string | null>(null);
//   const { theme } = useTheme();

//   // Use refs for callbacks to avoid stale closures in Mapbox event listeners
//   const callbacks = useRef({
//     onBoundaryChange,
//     onMapMove,
//     onMapClick,
//     onObjectSelect,
//     onObjectUpdate,
//     onSetBoundaryLock: undefined as any as
//       | ((locked: boolean) => void)
//       | undefined,
//     state,
//   });

//   // Build equipment features from app state (used on initial load and style reloads)
//   const buildEquipmentFeatureCollection = (
//     stateSnapshot: AppState,
//     map: mapboxgl.Map,
//   ) => {
//     if (!stateSnapshot.originLngLat) {
//       return { type: "FeatureCollection", features: [] } as any;
//     }

//     const features = stateSnapshot.objects
//       .map((obj) => {
//         const def =
//           DEFAULT_LIBRARY.find((d) => d.id === obj.type) ??
//           stateSnapshot.customLibrary.find((d) => d.id === obj.type);
//         if (!def) return null;

//         const lngLat = metresToLngLat(
//           obj.x,
//           obj.z,
//           stateSnapshot.originLngLat!,
//         );

//         if (def.modelUrl) {
//           if (!map.hasModel(def.modelUrl)) {
//             map.addModel(def.modelUrl, def.modelUrl);
//           }

//           return {
//             type: "Feature",
//             id: obj.id,
//             geometry: {
//               type: "Point",
//               coordinates: [lngLat[0], lngLat[1]],
//             },
//             properties: {
//               id: obj.id,
//               color: obj.color || def.color,
//               height: def.height,
//               "model-uri": def.modelUrl,
//               rotation: (obj.rotationY * 180) / Math.PI,
//               animations: def.animationsEnabled
//                 ? [{ name: "*", state: "play" }]
//                 : [],
//             },
//           };
//         }

//         const halfW = def.width / 2;
//         const halfD = def.depth / 2;

//         const cornersMetres = [
//           { x: -halfW, z: -halfD },
//           { x: halfW, z: -halfD },
//           { x: halfW, z: halfD },
//           { x: -halfW, z: halfD },
//           { x: -halfW, z: -halfD },
//         ];

//         const rotatedCorners = cornersMetres.map((c) => {
//           const rx =
//             c.x * Math.cos(obj.rotationY) - c.z * Math.sin(obj.rotationY);
//           const rz =
//             c.x * Math.sin(obj.rotationY) + c.z * Math.cos(obj.rotationY);
//           return metresToLngLat(
//             obj.x + rx,
//             obj.z + rz,
//             stateSnapshot.originLngLat!,
//           );
//         });

//         return {
//           type: "Feature",
//           id: obj.id,
//           geometry: {
//             type: "Polygon",
//             coordinates: [rotatedCorners],
//           },
//           properties: {
//             id: obj.id,
//             color: obj.color || def.color,
//             height: def.height,
//           },
//         };
//       })
//       .filter((f) => f !== null);

//     const fc = {
//       type: "FeatureCollection",
//       features: features as any,
//     };

//     return fc as any;
//   };

//   // Build readonly boundary feature (used to repopulate after style reloads)
//   const buildBoundaryFeature = (stateSnapshot: AppState) => {
//     if (!stateSnapshot.originLngLat || stateSnapshot.siteBoundary.length < 3) {
//       return { type: "FeatureCollection", features: [] } as any;
//     }

//     const coords = [...stateSnapshot.siteBoundary];
//     if (
//       coords[0][0] !== coords[coords.length - 1][0] ||
//       coords[0][1] !== coords[coords.length - 1][1]
//     ) {
//       coords.push(coords[0]);
//     }

//     return {
//       type: "Feature",
//       geometry: { type: "Polygon", coordinates: [coords] },
//       properties: {},
//     } as any;
//   };

//   // Build midpoint label features for each boundary segment
//   const buildSegmentLabels = (stateSnapshot: AppState) => {
//     if (!stateSnapshot.siteBoundary || stateSnapshot.siteBoundary.length < 2) {
//       return { type: "FeatureCollection", features: [] } as any;
//     }
//     const pts = stateSnapshot.siteBoundary;
//     const imperial = stateSnapshot.unitSystem === "imperial";
//     const features: any[] = [];

//     for (let i = 0; i < pts.length; i++) {
//       const a = pts[i];
//       const b = pts[(i + 1) % pts.length];

//       // Midpoint
//       const midLng = (a[0] + b[0]) / 2;
//       const midLat = (a[1] + b[1]) / 2;

//       // Haversine distance in metres
//       const R = 6371000;
//       const dLat = ((b[1] - a[1]) * Math.PI) / 180;
//       const dLng = ((b[0] - a[0]) * Math.PI) / 180;
//       const sinA = Math.sin(dLat / 2);
//       const sinB = Math.sin(dLng / 2);
//       const haversin =
//         sinA * sinA +
//         Math.cos((a[1] * Math.PI) / 180) *
//           Math.cos((b[1] * Math.PI) / 180) *
//           sinB *
//           sinB;
//       const distM =
//         R * 2 * Math.atan2(Math.sqrt(haversin), Math.sqrt(1 - haversin));

//       const label = imperial
//         ? `${(distM * 3.28084).toFixed(1)} ft`
//         : `${distM.toFixed(1)} m`;

//       features.push({
//         type: "Feature",
//         geometry: { type: "Point", coordinates: [midLng, midLat] },
//         properties: { label },
//       });
//     }

//     return { type: "FeatureCollection", features } as any;
//   };

//   useEffect(() => {
//     callbacks.current = {
//       onBoundaryChange,
//       onMapMove,
//       onMapClick,
//       onObjectSelect,
//       onObjectUpdate,
//       onSetBoundaryLock: onSetBoundaryLock || undefined,
//       state,
//     };
//   });

//   const setupLayers = useCallback((map: mapboxgl.Map) => {
//     if (!map.getSource("measure-line")) {
//       map.addSource("measure-line", {
//         type: "geojson",
//         data: { type: "FeatureCollection", features: [] },
//       });
//       map.addLayer({
//         id: "measure-line-layer",
//         type: "line",
//         source: "measure-line",
//         layout: { "line-cap": "round", "line-join": "round" },
//         paint: {
//           "line-color": "#2E8B7A",
//           "line-width": 3,
//           "line-dasharray": [2, 1],
//         },
//       });
//     }

//     if (!map.getSource("boundary-readonly")) {
//       map.addSource("boundary-readonly", {
//         type: "geojson",
//         data: { type: "FeatureCollection", features: [] },
//       });
//       map.addLayer({
//         id: "boundary-readonly-fill",
//         type: "fill",
//         source: "boundary-readonly",
//         paint: { "fill-color": "#2E8B7A", "fill-opacity": 0.1 },
//       });
//       map.addLayer({
//         id: "boundary-readonly-stroke",
//         type: "line",
//         source: "boundary-readonly",
//         paint: { "line-color": "#2E8B7A", "line-width": 2 },
//       });

//       // Populate readonly boundary immediately (useful after a style reload)
//       try {
//         const source = map.getSource(
//           "boundary-readonly",
//         ) as mapboxgl.GeoJSONSource;
//         if (source) {
//           const bf = buildBoundaryFeature(callbacks.current.state);
//           if (bf && bf.geometry) {
//             source.setData(bf as any);
//           } else {
//             source.setData({ type: "FeatureCollection", features: [] } as any);
//           }

//           // Also ensure Mapbox Draw has the polygon so it's selectable/visible
//           const draw = drawRef.current;
//           try {
//             if (draw && callbacks.current.state.siteBoundary.length >= 3) {
//               const currentFeatures = draw.getAll().features;
//               const hasPolygon = currentFeatures.some(
//                 (f) => f.geometry.type === "Polygon",
//               );
//               if (!hasPolygon) {
//                 const coords = [...callbacks.current.state.siteBoundary];
//                 if (
//                   coords[0][0] !== coords[coords.length - 1][0] ||
//                   coords[0][1] !== coords[coords.length - 1][1]
//                 ) {
//                   coords.push(coords[0]);
//                 }
//                 draw.add({
//                   type: "Feature",
//                   geometry: { type: "Polygon", coordinates: [coords] },
//                   properties: {},
//                 });
//               }
//             }
//           } catch (err) {
//             // ignore draw errors during style transitions
//           }
//         }
//       } catch (err) {
//         // Ignore errors during style transitions
//       }
//     }

//     // Add 3D buildings layer
//     if (
//       !map.getLayer("3d-buildings") &&
//       callbacks.current.state.mapStyle === "streets"
//     ) {
//       const layers = map.getStyle().layers;
//       let labelLayerId;
//       if (layers) {
//         for (let i = 0; i < layers.length; i++) {
//           if (
//             layers[i].type === "symbol" &&
//             (layers[i].layout as any)?.["text-field"]
//           ) {
//             labelLayerId = layers[i].id;
//             break;
//           }
//         }
//       }

//       map.addLayer(
//         {
//           id: "3d-buildings",
//           source: "composite",
//           "source-layer": "building",
//           filter: ["==", "extrude", "true"],
//           type: "fill-extrusion",
//           minzoom: 15,
//           paint: {
//             "fill-extrusion-color": "#aaa",
//             "fill-extrusion-height": [
//               "interpolate",
//               ["linear"],
//               ["zoom"],
//               15,
//               0,
//               15.05,
//               ["get", "height"],
//             ],
//             "fill-extrusion-base": [
//               "interpolate",
//               ["linear"],
//               ["zoom"],
//               15,
//               0,
//               15.05,
//               ["get", "min_height"],
//             ],
//             "fill-extrusion-opacity": 0.6,
//           },
//         },
//         labelLayerId,
//       );
//     }

//     // Boundary segment distance labels
//     if (!map.getSource("boundary-segment-labels")) {
//       map.addSource("boundary-segment-labels", {
//         type: "geojson",
//         data: { type: "FeatureCollection", features: [] },
//       });
//       map.addLayer({
//         id: "boundary-segment-labels-layer",
//         type: "symbol",
//         source: "boundary-segment-labels",
//         layout: {
//           "text-field": ["get", "label"],
//           "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
//           "text-size": 13,
//           "text-anchor": "center",
//           "text-allow-overlap": true,
//           "text-ignore-placement": true,
//           "symbol-placement": "point",
//         },
//         paint: {
//           "text-color": "#ffffff",
//           "text-halo-color": "#1a1a2e",
//           "text-halo-width": 2,
//         },
//       });
//     }

//     if (!map.getSource("equipment")) {
//       map.addSource("equipment", {
//         type: "geojson",
//         data: { type: "FeatureCollection", features: [] },
//         promoteId: "id",
//       });
//       map.addLayer({
//         id: "equipment-layer",
//         type: "fill-extrusion",
//         source: "equipment",
//         filter: ["!", ["has", "model-uri"]],
//         paint: {
//           "fill-extrusion-color": [
//             "case",
//             ["boolean", ["feature-state", "selected"], false],
//             "#ffffff",
//             ["get", "color"],
//           ],
//           "fill-extrusion-height": ["get", "height"],
//           "fill-extrusion-base": 0,
//           "fill-extrusion-opacity": 0.8,
//         },
//       });

//       // Model layer
//       map.addLayer({
//         id: "equipment-model-layer",
//         type: "model",
//         source: "equipment",
//         filter: ["has", "model-uri"],
//         layout: {
//           "model-id": ["get", "model-uri"],
//         },
//         paint: {
//           "model-rotation": [0, 0, ["get", "rotation"]],
//           "model-scale": [1, 1, 1],
//           "model-type": "common-3d",
//           "model-animations": [
//             "case",
//             ["has", "animations"],
//             ["get", "animations"],
//             ["literal", []],
//           ],
//         } as any,
//       });

//       // Populate equipment source immediately (useful after a style reload)
//       try {
//         const source = map.getSource("equipment") as mapboxgl.GeoJSONSource;
//         if (source) {
//           const fc = buildEquipmentFeatureCollection(
//             callbacks.current.state,
//             map,
//           );
//           source.setData(fc as any);

//           // Restore selection feature state
//           callbacks.current.state.objects.forEach((obj) => {
//             map.setFeatureState(
//               { source: "equipment", id: obj.id },
//               { selected: callbacks.current.state.selectedId === obj.id },
//             );
//           });
//         }
//       } catch (err) {
//         // Ignore errors during style transitions
//       }
//     }

//     if (!map.getSource("ghost-box")) {
//       map.addSource("ghost-box", {
//         type: "geojson",
//         data: { type: "FeatureCollection", features: [] },
//       });
//       map.addLayer({
//         id: "ghost-box-layer",
//         type: "fill-extrusion",
//         source: "ghost-box",
//         filter: ["!", ["has", "model-uri"]],
//         paint: {
//           "fill-extrusion-color": ["get", "color"],
//           "fill-extrusion-height": ["get", "height"],
//           "fill-extrusion-base": 0,
//           "fill-extrusion-opacity": 0.4,
//         },
//       });

//       // Ghost model layer
//       map.addLayer({
//         id: "ghost-model-layer",
//         type: "model",
//         source: "ghost-box",
//         filter: ["has", "model-uri"],
//         layout: {
//           "model-id": ["get", "model-uri"],
//         },
//         paint: {
//           "model-rotation": [0, 0, 0],
//           "model-scale": [1, 1, 1],
//           "model-type": "common-3d",
//           "model-opacity": 0.4,
//           "model-animations": [
//             "case",
//             ["has", "animations"],
//             ["get", "animations"],
//             ["literal", []],
//           ],
//         } as any,
//       });
//     }

//     // ── Safe zone layers (shown only while placing equipment) ──────────────
//     if (!map.getSource("safe-zones")) {
//       map.addSource("safe-zones", {
//         type: "geojson",
//         data: { type: "FeatureCollection", features: [] },
//       });
//       // Amber fill — safe zone area of each placed equipment
//       map.addLayer({
//         id: "safe-zone-fill",
//         type: "fill",
//         source: "safe-zones",
//         paint: {
//           "fill-color": "#f59e0b",
//           "fill-opacity": 0.08,
//         },
//       });
//       // Amber dashed outline
//       map.addLayer({
//         id: "safe-zone-outline",
//         type: "line",
//         source: "safe-zones",
//         paint: {
//           "line-color": "#f59e0b",
//           "line-width": 1.5,
//           "line-dasharray": [3, 2],
//           "line-opacity": 0.6,
//         },
//       });
//     }

//     if (!map.getSource("safe-zone-violations")) {
//       map.addSource("safe-zone-violations", {
//         type: "geojson",
//         data: { type: "FeatureCollection", features: [] },
//       });
//       // Red fill for violated safe zones
//       map.addLayer({
//         id: "safe-zone-violation-fill",
//         type: "fill",
//         source: "safe-zone-violations",
//         paint: {
//           "fill-color": "#ef4444",
//           "fill-opacity": 0.18,
//         },
//       });
//       // Bold red outline for violated safe zones
//       map.addLayer({
//         id: "safe-zone-violation-outline",
//         type: "line",
//         source: "safe-zone-violations",
//         paint: {
//           "line-color": "#ef4444",
//           "line-width": 3,
//           "line-opacity": 1,
//         },
//       });
//     }
//   }, []);

//   useEffect(() => {
//     if (mapRef.current && targetLocation) {
//       mapRef.current.flyTo({
//         center: [targetLocation.lng, targetLocation.lat],
//         zoom: targetLocation.zoom || 18,
//         essential: true,
//       });
//     }
//   }, [targetLocation]);

//   useEffect(() => {
//     if (!mapContainerRef.current) return;

//     const token = import.meta.env.VITE_MAPBOX_TOKEN;
//     if (!token) {
//       console.error("Mapbox token missing");
//       return;
//     }

//     mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

//     const map = new mapboxgl.Map({
//       container: mapContainerRef.current,
//       style: "mapbox://styles/mapbox/streets-v12",
//       center: [73.8567, 18.5204], // Pune, India
//       zoom: 16,
//       pitch: 0,
//       bearing: 0,
//       antialias: true,
//       preserveDrawingBuffer: true,
//     });

//     const draw = new MapboxDraw({
//       displayControlsDefault: false,
//       controls: {
//         polygon: true,
//         trash: true,
//       },
//       defaultMode: "simple_select",
//     });

//     map.addControl(draw);
//     map.addControl(new mapboxgl.NavigationControl(), "top-right");

//     map.on("style.load", () => {
//       setupLayers(map);
//     });

//     map.on("load", () => {
//       mapRef.current = map;
//       drawRef.current = draw;
//       setupLayers(map);
//     });

//     map.on("draw.create", (e: any) => {
//       const feature = e.features[0];
//       if (feature.geometry.type === "Polygon") {
//         callbacks.current.onBoundaryChange(
//           feature.geometry.coordinates[0] as [number, number][],
//         );
//         // Update segment labels immediately on draw complete
//         const segSrc = map.getSource(
//           "boundary-segment-labels",
//         ) as mapboxgl.GeoJSONSource;
//         if (segSrc) segSrc.setData(buildSegmentLabels(callbacks.current.state));
//       }
//     });

//     map.on("draw.update", (e: any) => {
//       const feature = e.features[0];
//       if (feature.geometry.type === "Polygon") {
//         callbacks.current.onBoundaryChange(
//           feature.geometry.coordinates[0] as [number, number][],
//         );
//         // Update segment labels on polygon vertex drag
//         const segSrc = map.getSource(
//           "boundary-segment-labels",
//         ) as mapboxgl.GeoJSONSource;
//         if (segSrc) segSrc.setData(buildSegmentLabels(callbacks.current.state));
//       }
//     });

//     map.on("draw.delete", () => {
//       callbacks.current.onBoundaryChange([]);
//     });

//     map.on("mousemove", (e) => {
//       setHoverCoords([e.lngLat.lng, e.lngLat.lat]);
//       callbacks.current.onMapMove(e);

//       if (!map.getLayer("equipment-layer")) return;

//       const features = map.queryRenderedFeatures(e.point, {
//         layers: ["equipment-layer", "equipment-model-layer"],
//       });
//       map.getCanvas().style.cursor = features.length > 0 ? "pointer" : "";

//       if (draggingIdRef.current && callbacks.current.state.originLngLat) {
//         const { x, z } = lngLatToMetres(
//           [e.lngLat.lng, e.lngLat.lat],
//           callbacks.current.state.originLngLat,
//         );
//         const snappedX = Math.round(x * 2) / 2;
//         const snappedZ = Math.round(z * 2) / 2;
//         callbacks.current.onObjectUpdate(draggingIdRef.current, {
//           x: snappedX,
//           z: snappedZ,
//         });
//       }
//     });

//     // Use mousedown instead of click for more reliable placement and dragging
//     map.on("mousedown", (e) => {
//       if (!map.getLayer("equipment-layer")) {
//         callbacks.current.onMapClick(e);
//         return;
//       }

//       const features = map.queryRenderedFeatures(e.point, {
//         layers: ["equipment-layer", "equipment-model-layer"],
//       });
//       if (features.length > 0) {
//         const id = (features[0].id as string) || features[0].properties?.id;
//         callbacks.current.onObjectSelect(id);
//         draggingIdRef.current = id;
//         // Lock the boundary while dragging an object so it remains fixed
//         try {
//           callbacks.current.onSetBoundaryLock?.(true);
//         } catch {}
//         map.dragPan.disable();
//       } else {
//         callbacks.current.onMapClick(e);
//         if (!callbacks.current.state.pendingPlacement) {
//           callbacks.current.onObjectSelect(null);
//         }
//       }
//     });

//     map.on("mouseup", () => {
//       // Unlock boundary when drag ends
//       try {
//         callbacks.current.onSetBoundaryLock?.(false);
//       } catch {}
//       draggingIdRef.current = null;
//       map.dragPan.enable();
//     });

//     const updateCamera = () => {
//       if (!mapRef.current) return;
//     };

//     map.on("move", updateCamera);
//     map.on("zoom", updateCamera);
//     map.on("pitch", updateCamera);
//     map.on("rotate", updateCamera);

//     return () => {
//       map.remove();
//     };
//   }, []);

//   // Sync equipment visual
//   useEffect(() => {
//     if (!mapRef.current) return;
//     const map = mapRef.current;
//     const source = map.getSource("equipment") as mapboxgl.GeoJSONSource;
//     if (!source) return;

//     // If no originLngLat or no objects, clear the equipment layer
//     if (!state.originLngLat || state.objects.length === 0) {
//       source.setData({ type: "FeatureCollection", features: [] });
//       return;
//     }

//     const features = state.objects
//       .map((obj) => {
//         const def =
//           DEFAULT_LIBRARY.find((d) => d.id === obj.type) ??
//           state.customLibrary.find((d) => d.id === obj.type);
//         if (!def) return null;

//         const lngLat = metresToLngLat(obj.x, obj.z, state.originLngLat!);

//         // If model is available, use point geometry for model layer
//         if (def.modelUrl) {
//           // Register model if not already registered
//           if (!map.hasModel(def.modelUrl)) {
//             map.addModel(def.modelUrl, def.modelUrl);
//           }

//           return {
//             type: "Feature",
//             id: obj.id,
//             geometry: {
//               type: "Point",
//               coordinates: [lngLat[0], lngLat[1]],
//             },
//             properties: {
//               id: obj.id,
//               color: obj.color || def.color,
//               height: def.height,
//               "model-uri": def.modelUrl,
//               rotation: (obj.rotationY * 180) / Math.PI, // Mapbox model rotation is in degrees
//               animations: def.animationsEnabled
//                 ? [{ name: "*", state: "play" }]
//                 : [],
//             },
//           };
//         }

//         // Fallback to box polygon for fill-extrusion
//         const halfW = def.width / 2;
//         const halfD = def.depth / 2;

//         const cornersMetres = [
//           { x: -halfW, z: -halfD },
//           { x: halfW, z: -halfD },
//           { x: halfW, z: halfD },
//           { x: -halfW, z: halfD },
//           { x: -halfW, z: -halfD },
//         ];

//         const rotatedCorners = cornersMetres.map((c) => {
//           const rx =
//             c.x * Math.cos(obj.rotationY) - c.z * Math.sin(obj.rotationY);
//           const rz =
//             c.x * Math.sin(obj.rotationY) + c.z * Math.cos(obj.rotationY);
//           return metresToLngLat(obj.x + rx, obj.z + rz, state.originLngLat!);
//         });

//         return {
//           type: "Feature",
//           id: obj.id,
//           geometry: {
//             type: "Polygon",
//             coordinates: [rotatedCorners],
//           },
//           properties: {
//             id: obj.id,
//             color: obj.color || def.color,
//             height: def.height,
//           },
//         };
//       })
//       .filter((f) => f !== null);

//     source.setData({
//       type: "FeatureCollection",
//       features: features as any,
//     });

//     // Update feature state for selection highlight
//     state.objects.forEach((obj) => {
//       map.setFeatureState(
//         { source: "equipment", id: obj.id },
//         { selected: state.selectedId === obj.id },
//       );
//     });
//   }, [state.objects, state.originLngLat, state.selectedId, state.mapStyle]);

//   // ── Helper: build a safe-zone polygon for an equipment at (cx, cz) ──────
//   const buildSafeZonePolygon = (
//     cx: number,
//     cz: number,
//     width: number,
//     depth: number,
//     rotationY: number,
//     origin: [number, number],
//   ) => {
//     const SAFE = 1.5; // 1.5m each side = +3m total per dimension
//     const hw = (width + SAFE * 2) / 2;
//     const hd = (depth + SAFE * 2) / 2;
//     const corners = [
//       { x: -hw, z: -hd },
//       { x: hw, z: -hd },
//       { x: hw, z: hd },
//       { x: -hw, z: hd },
//       { x: -hw, z: -hd },
//     ].map((c) => {
//       const rx = c.x * Math.cos(rotationY) - c.z * Math.sin(rotationY);
//       const rz = c.x * Math.sin(rotationY) + c.z * Math.cos(rotationY);
//       return metresToLngLat(cx + rx, cz + rz, origin);
//     });
//     return corners;
//   };

//   // ── Sync safe-zone layers whenever pendingPlacement or hoverCoords changes ──
//   useEffect(() => {
//     if (!mapRef.current) return;
//     const map = mapRef.current;
//     const safeSource = map.getSource("safe-zones") as mapboxgl.GeoJSONSource;
//     const violSource = map.getSource(
//       "safe-zone-violations",
//     ) as mapboxgl.GeoJSONSource;
//     if (!safeSource || !violSource) return;

//     // Clear both layers when nothing is being placed or dragged
//     const isDragging = !!draggingIdRef.current;
//     if (
//       (!state.pendingPlacement && !isDragging) ||
//       !state.originLngLat ||
//       !hoverCoords
//     ) {
//       safeSource.setData({ type: "FeatureCollection", features: [] });
//       violSource.setData({ type: "FeatureCollection", features: [] });
//       return;
//     }

//     const origin = state.originLngLat;
//     const allDefs = [...DEFAULT_LIBRARY, ...(state.customLibrary || [])];

//     // Build safe-zone polygon for every already-placed equipment
//     const safeFeatures = state.objects
//       .map((obj) => {
//         const def = allDefs.find((d) => d.id === obj.type);
//         if (!def) return null;
//         const ring = buildSafeZonePolygon(
//           obj.x,
//           obj.z,
//           def.width,
//           def.depth,
//           obj.rotationY,
//           origin,
//         );
//         return {
//           type: "Feature" as const,
//           geometry: { type: "Polygon" as const, coordinates: [ring] },
//           properties: { id: obj.id },
//         };
//       })
//       .filter(Boolean);

//     safeSource.setData({
//       type: "FeatureCollection",
//       features: safeFeatures as any,
//     });

//     // Ghost footprint of the equipment being placed
//     const { x, z } = lngLatToMetres(hoverCoords, origin);
//     const ghostX = Math.round(x * 2) / 2;
//     const ghostZ = Math.round(z * 2) / 2;
//     // Determine the definition and rotation for the ghost footprint.
//     // Use pendingPlacement when placing, or the dragged object's def when dragging.
//     let def = state.pendingPlacement;
//     let rotationY = 0;
//     if (!def && draggingIdRef.current) {
//       const draggingObj = state.objects.find(
//         (o) => o.id === draggingIdRef.current,
//       );
//       if (draggingObj) {
//         def =
//           DEFAULT_LIBRARY.find((d) => d.id === draggingObj.type) ??
//           (state.customLibrary || []).find((d) => d.id === draggingObj.type);
//         rotationY = draggingObj.rotationY || 0;
//       }
//     }

//     if (!def) {
//       violSource.setData({ type: "FeatureCollection", features: [] });
//       return;
//     }

//     const ghw = def.width / 2;
//     const ghd = def.depth / 2;
//     const ghostCorners = [
//       { x: -ghw, z: -ghd },
//       { x: ghw, z: -ghd },
//       { x: ghw, z: ghd },
//       { x: -ghw, z: ghd },
//       { x: -ghw, z: -ghd },
//     ].map((c) => {
//       const rx = c.x * Math.cos(rotationY) - c.z * Math.sin(rotationY);
//       const rz = c.x * Math.sin(rotationY) + c.z * Math.cos(rotationY);
//       return metresToLngLat(ghostX + rx, ghostZ + rz, origin);
//     });

//     const ghostPolygon = turf.polygon([ghostCorners]);

//     // Find any safe zone that the ghost footprint overlaps
//     const violations = safeFeatures.filter((f) => {
//       if (!f) return false;
//       try {
//         return turf.booleanIntersects(
//           ghostPolygon,
//           turf.polygon([(f as any).geometry.coordinates[0]]),
//         );
//       } catch {
//         return false;
//       }
//     });

//     violSource.setData({
//       type: "FeatureCollection",
//       features: violations as any,
//     });
//   }, [
//     state.pendingPlacement,
//     hoverCoords,
//     state.originLngLat,
//     state.objects,
//     state.customLibrary,
//   ]);

//   // Sync ghost box
//   useEffect(() => {
//     if (
//       !mapRef.current ||
//       !state.originLngLat ||
//       !state.pendingPlacement ||
//       !hoverCoords
//     ) {
//       if (mapRef.current) {
//         const source = mapRef.current.getSource(
//           "ghost-box",
//         ) as mapboxgl.GeoJSONSource;
//         if (source) source.setData({ type: "FeatureCollection", features: [] });
//       }
//       return;
//     }

//     const map = mapRef.current;
//     const source = map.getSource("ghost-box") as mapboxgl.GeoJSONSource;
//     if (!source) return;

//     const def = state.pendingPlacement;
//     const { x, z } = lngLatToMetres(hoverCoords, state.originLngLat);
//     const snappedX = Math.round(x * 2) / 2;
//     const snappedZ = Math.round(z * 2) / 2;
//     const lngLat = metresToLngLat(snappedX, snappedZ, state.originLngLat!);

//     if (def.modelUrl) {
//       if (!map.hasModel(def.modelUrl)) {
//         map.addModel(def.modelUrl, def.modelUrl);
//       }

//       source.setData({
//         type: "FeatureCollection",
//         features: [
//           {
//             type: "Feature",
//             geometry: {
//               type: "Point",
//               coordinates: [lngLat[0], lngLat[1]],
//             },
//             properties: {
//               color: def.color,
//               height: def.height,
//               "model-uri": def.modelUrl,
//               animations: def.animationsEnabled
//                 ? [{ name: "*", state: "play" }]
//                 : [],
//             },
//           },
//         ] as any,
//       });
//       return;
//     }

//     const halfW = def.width / 2;
//     const halfD = def.depth / 2;
//     const cornersMetres = [
//       { x: -halfW, z: -halfD },
//       { x: halfW, z: -halfD },
//       { x: halfW, z: halfD },
//       { x: -halfW, z: halfD },
//       { x: -halfW, z: -halfD },
//     ];

//     const cornersLngLat = cornersMetres.map((c) =>
//       metresToLngLat(snappedX + c.x, snappedZ + c.z, state.originLngLat!),
//     );

//     source.setData({
//       type: "FeatureCollection",
//       features: [
//         {
//           type: "Feature",
//           geometry: {
//             type: "Polygon",
//             coordinates: [cornersLngLat],
//           },
//           properties: {
//             color: def.color,
//             height: def.height,
//           },
//         },
//       ] as any,
//     });
//   }, [state.pendingPlacement, hoverCoords, state.originLngLat, state.mapStyle]);

//   // Sync measurement visual
//   useEffect(() => {
//     if (!mapRef.current) return;
//     const map = mapRef.current;

//     // Clear old markers
//     measureMarkersRef.current.forEach((m) => m.remove());
//     measureMarkersRef.current = [];
//     if (measureLineRef.current) measureLineRef.current.remove();
//     measureLineRef.current = null;

//     if (state.measurePoints.length === 0) {
//       const source = map.getSource("measure-line") as mapboxgl.GeoJSONSource;
//       if (source) source.setData({ type: "FeatureCollection", features: [] });
//       // Also clear segment labels
//       const segSource = map.getSource(
//         "boundary-segment-labels",
//       ) as mapboxgl.GeoJSONSource;
//       if (segSource)
//         segSource.setData({ type: "FeatureCollection", features: [] });
//       return;
//     }

//     state.measurePoints.forEach((pt, i) => {
//       const el = document.createElement("div");
//       const isPlainMode = state.mapStyle === "plain";
//       const isLightTheme = theme === "light";

//       // Adjust marker colors for plain mode
//       let markerClass =
//         "w-3 h-3 bg-brand-teal border-2 border-white rounded-full shadow-lg";
//       if (isPlainMode) {
//         if (isLightTheme) {
//           markerClass =
//             "w-4 h-4 bg-[#00FF00] border-2 border-white rounded-full shadow-lg";
//         } else {
//           markerClass =
//             "w-4 h-4 bg-[#FFD700] border-2 border-black rounded-full shadow-lg";
//         }
//       }

//       el.className = markerClass;
//       const marker = new mapboxgl.Marker(el).setLngLat(pt).addTo(map);
//       measureMarkersRef.current.push(marker);
//     });

//     if (state.measurePoints.length === 2) {
//       const p1 = state.measurePoints[0];
//       const p2 = state.measurePoints[1];
//       const distMeters = turf.distance(turf.point(p1), turf.point(p2), {
//         units: "meters",
//       });
//       const midpoint = turf.midpoint(turf.point(p1), turf.point(p2)).geometry
//         .coordinates as [number, number];

//       const source = map.getSource("measure-line") as mapboxgl.GeoJSONSource;
//       if (source) {
//         source.setData({
//           type: "FeatureCollection",
//           features: [
//             {
//               type: "Feature",
//               geometry: { type: "LineString", coordinates: [p1, p2] },
//               properties: {},
//             },
//           ],
//         });
//       }

//       const label = document.createElement("div");
//       const isPlainMode = state.mapStyle === "plain";
//       const isLightTheme = theme === "light";

//       // Adjust label colors for plain mode
//       let labelClass =
//         "bg-white text-brand-navy px-2 py-1 rounded shadow-lg text-[10px] font-bold border border-brand-teal";
//       if (isPlainMode) {
//         if (isLightTheme) {
//           labelClass =
//             "bg-[#00FF00] text-black px-2 py-1 rounded shadow-lg text-[10px] font-bold border-2 border-white";
//         } else {
//           labelClass =
//             "bg-[#FFD700] text-black px-2 py-1 rounded shadow-lg text-[10px] font-bold border-2 border-black";
//         }
//       }

//       label.className = labelClass;

//       if (state.unitSystem === "imperial") {
//         const distFeet = distMeters * 3.28084;
//         label.innerText = distFeet.toFixed(1) + "ft";
//       } else {
//         label.innerText = distMeters.toFixed(1) + "m";
//       }

//       const labelMarker = new mapboxgl.Marker(label)
//         .setLngLat(midpoint)
//         .addTo(map);
//       measureLineRef.current = labelMarker;
//     }
//   }, [state.measurePoints, state.unitSystem, theme, state.mapStyle]);

//   // Sync style
//   useEffect(() => {
//     if (!mapRef.current) return;

//     if (state.mapStyle === "plain") {
//       const plainStyle = {
//         version: 8,
//         name: "plain",
//         metadata: {},
//         sources: {},
//         layers: [
//           {
//             id: "plain-background",
//             type: "background",
//             paint: {
//               "background-color": theme === "dark" ? "#ffffff" : "#000000",
//             },
//           },
//         ],
//       } as any;

//       mapRef.current.setStyle(plainStyle);
//       return;
//     }

//     const style =
//       state.mapStyle === "satellite"
//         ? "mapbox://styles/mapbox/satellite-v9"
//         : "mapbox://styles/mapbox/streets-v12";

//     mapRef.current.setStyle(style);
//   }, [state.mapStyle, theme]);

//   // Adjust visibility colors for plain mode
//   useEffect(() => {
//     if (!mapRef.current || state.mapStyle !== "plain") return;
//     const map = mapRef.current;

//     // In plain mode, increase opacity and contrast for boundary and measurements
//     const isLightTheme = theme === "light";
//     const boundaryColor = isLightTheme ? "#00FF00" : "#FFD700"; // Bright green for black bg, gold for white bg
//     const boundaryOpacity = 0.3;
//     const measureColor = isLightTheme ? "#00FF00" : "#FFD700";
//     const measureWidth = isLightTheme ? 4 : 3;

//     try {
//       if (map.getLayer("boundary-readonly-fill")) {
//         map.setPaintProperty(
//           "boundary-readonly-fill",
//           "fill-color",
//           boundaryColor,
//         );
//         map.setPaintProperty(
//           "boundary-readonly-fill",
//           "fill-opacity",
//           boundaryOpacity,
//         );
//       }
//       if (map.getLayer("boundary-readonly-stroke")) {
//         map.setPaintProperty(
//           "boundary-readonly-stroke",
//           "line-color",
//           boundaryColor,
//         );
//         map.setPaintProperty("boundary-readonly-stroke", "line-width", 3);
//       }
//       if (map.getLayer("measure-line-layer")) {
//         map.setPaintProperty("measure-line-layer", "line-color", measureColor);
//         map.setPaintProperty("measure-line-layer", "line-width", measureWidth);
//       }
//     } catch (err) {
//       // Layer not ready yet
//     }
//   }, [state.mapStyle, theme]);

//   // Sync terrain and buildings
//   useEffect(() => {
//     if (!mapRef.current) return;
//     const map = mapRef.current;

//     const handleStyleLoad = () => {
//       // Terrain
//       if (state.terrainEnabled && state.mapStyle === "streets") {
//         if (!map.getSource("mapbox-dem")) {
//           map.addSource("mapbox-dem", {
//             type: "raster-dem",
//             url: "mapbox://mapbox.mapbox-terrain-dem-v1",
//             tileSize: 512,
//             maxzoom: 14,
//           });
//         }
//         map.setTerrain({ source: "mapbox-dem", exaggeration: 1.2 });
//         map.easeTo({ pitch: 60 });
//       } else {
//         map.setTerrain(null);
//         map.easeTo({ pitch: 0 });
//       }

//       // Buildings
//       if (map.getLayer("3d-buildings")) {
//         map.setLayoutProperty(
//           "3d-buildings",
//           "visibility",
//           state.buildingsEnabled ? "visible" : "none",
//         );
//       } else if (state.buildingsEnabled && state.mapStyle === "streets") {
//         // If layer missing but enabled, re-run setup
//         setupLayers(map);
//       }
//     };

//     if (map.isStyleLoaded()) {
//       handleStyleLoad();
//     } else {
//       map.once("style.load", handleStyleLoad);
//     }
//   }, [state.terrainEnabled, state.buildingsEnabled, state.mapStyle]);

//   // Sync readonly boundary and origin marker
//   useEffect(() => {
//     if (!mapRef.current) return;
//     const map = mapRef.current;

//     // Origin Marker
//     if (originMarkerRef.current) originMarkerRef.current.remove();
//     if (state.originLngLat) {
//       const el = document.createElement("div");
//       const isPlainMode = state.mapStyle === "plain";
//       const isLightTheme = theme === "light";

//       // Adjust marker colors for plain mode: bright colors for visibility
//       let bgColor = "bg-brand-teal";
//       let innerColor = "bg-white";
//       let borderColor = "border-white";

//       if (isPlainMode) {
//         if (isLightTheme) {
//           // For black background in light theme mode
//           bgColor = "bg-[#00FF00]"; // Bright green
//           innerColor = "bg-white";
//           borderColor = "border-white";
//         } else {
//           // For white background in dark theme mode
//           bgColor = "bg-[#FFD700]"; // Gold
//           innerColor = "bg-black";
//           borderColor = "border-black";
//         }
//       }

//       el.className = `w-6 h-6 flex items-center justify-center ${bgColor} rounded-full border-2 ${borderColor} shadow-xl animate-pulse`;
//       el.innerHTML = `<div class="w-2 h-2 ${innerColor} rounded-full"></div>`;

//       const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
//         '<div class="text-[10px] font-bold text-brand-navy p-1">BENCHMARK ORIGIN</div>',
//       );

//       originMarkerRef.current = new mapboxgl.Marker(el)
//         .setLngLat(state.originLngLat)
//         .setPopup(popup)
//         .addTo(map);
//     }

//     // Clear boundary if no origin or boundary too small
//     if (!state.originLngLat || state.siteBoundary.length < 3) {
//       const source = map.getSource(
//         "boundary-readonly",
//       ) as mapboxgl.GeoJSONSource;
//       if (source) source.setData({ type: "FeatureCollection", features: [] });
//       return;
//     }

//     const source = map.getSource("boundary-readonly") as mapboxgl.GeoJSONSource;
//     if (!source) return;

//     // Ensure closed
//     const coords = [...state.siteBoundary];
//     if (
//       coords[0][0] !== coords[coords.length - 1][0] ||
//       coords[0][1] !== coords[coords.length - 1][1]
//     ) {
//       coords.push(coords[0]);
//     }

//     source.setData({
//       type: "Feature",
//       geometry: {
//         type: "Polygon",
//         coordinates: [coords],
//       },
//       properties: {},
//     } as any);

//     // Update segment distance labels
//     const segSource = map.getSource(
//       "boundary-segment-labels",
//     ) as mapboxgl.GeoJSONSource;
//     if (segSource) {
//       segSource.setData(buildSegmentLabels(state));
//     }
//   }, [
//     state.siteBoundary,
//     state.originLngLat,
//     theme,
//     state.mapStyle,
//     state.unitSystem,
//   ]);

//   // Sync Mapbox Draw mode and visibility based on app state
//   useEffect(() => {
//     if (!mapRef.current || !drawRef.current) return;
//     const map = mapRef.current;
//     const isLocked =
//       !!state.pendingPlacement || isMeasuring || state.isBoundaryLocked;

//     if (isLocked) {
//       drawRef.current.changeMode("simple_select");
//     }

//     // Toggle visibility of draw layers vs readonly boundary
//     const layers = map.getStyle().layers;
//     if (layers) {
//       layers.forEach((layer) => {
//         if (layer.id.startsWith("gl-draw-")) {
//           map.setLayoutProperty(
//             layer.id,
//             "visibility",
//             isLocked ? "none" : "visible",
//           );
//         }
//       });
//     }

//     map.setLayoutProperty(
//       "boundary-readonly-fill",
//       "visibility",
//       isLocked ? "visible" : "none",
//     );
//     map.setLayoutProperty(
//       "boundary-readonly-stroke",
//       "visibility",
//       isLocked ? "visible" : "none",
//     );
//     // Show segment labels whenever boundary is visible
//     if (map.getLayer("boundary-segment-labels-layer")) {
//       map.setLayoutProperty(
//         "boundary-segment-labels-layer",
//         "visibility",
//         state.siteBoundary.length >= 2 ? "visible" : "none",
//       );
//     }
//   }, [
//     state.pendingPlacement,
//     isMeasuring,
//     state.isBoundaryLocked,
//     state.siteBoundary,
//   ]);

//   // Trigger draw mode
//   useEffect(() => {
//     if (drawTrigger > 0 && drawRef.current) {
//       drawRef.current.changeMode("draw_polygon");
//     }
//   }, [drawTrigger]);

//   // Center map when originLngLat changes (e.g. after import)
//   useEffect(() => {
//     if (mapRef.current && state.originLngLat) {
//       mapRef.current.easeTo({
//         center: state.originLngLat,
//         zoom: 18,
//         duration: 1000,
//       });
//     }
//   }, [state.originLngLat]);

//   // Sync boundary to Mapbox Draw (for import)
//   useEffect(() => {
//     if (!drawRef.current) return;

//     const draw = drawRef.current;
//     // If incoming boundary is too small, ensure draw is cleared
//     if (state.siteBoundary.length < 3) {
//       try {
//         draw.deleteAll();
//       } catch (err) {
//         // ignore
//       }
//       return;
//     }

//     const coords = [...state.siteBoundary];
//     if (
//       coords[0][0] !== coords[coords.length - 1]?.[0] ||
//       coords[0][1] !== coords[coords.length - 1]?.[1]
//     ) {
//       coords.push(coords[0]);
//     }

//     try {
//       const currentFeatures = draw
//         .getAll()
//         .features.filter((f) => f.geometry.type === "Polygon");

//       // If there's no polygon, simply add the new one
//       if (currentFeatures.length === 0) {
//         draw.add({
//           type: "Feature",
//           geometry: { type: "Polygon", coordinates: [coords] },
//           properties: {},
//         });
//         return;
//       }

//       // Compare existing polygon coords with new coords; if different, replace
//       // const existing = currentFeatures[0].geometry.coordinates[0];
//       const polygonFeature = currentFeatures[0];

//       if (polygonFeature.geometry.type !== "Polygon") {
//         return;
//       }

//       const existing = polygonFeature.geometry.coordinates[0];

//       const existingStr = JSON.stringify(
//         existing.map((c: any) => [
//           Number(c[0]).toFixed(6),
//           Number(c[1]).toFixed(6),
//         ]),
//       );
//       const newStr = JSON.stringify(
//         coords.map((c) => [Number(c[0]).toFixed(6), Number(c[1]).toFixed(6)]),
//       );

//       if (existingStr !== newStr) {
//         // replace: remove all polygons and add the new one
//         draw.deleteAll();
//         draw.add({
//           type: "Feature",
//           geometry: { type: "Polygon", coordinates: [coords] },
//           properties: {},
//         });
//       }
//     } catch (err) {
//       // ignore errors (style transitions, etc.)
//     }
//   }, [state.siteBoundary]);

//   // Clear boundary
//   useEffect(() => {
//     if (state.siteBoundary.length === 0 && drawRef.current) {
//       drawRef.current.deleteAll();
//     }
//   }, [state.siteBoundary]);

//   return <div ref={mapContainerRef} className="w-full h-full" />;
// };

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { AppState, DEFAULT_LIBRARY } from "../../../backend/types";
import * as turf from "@turf/turf";
import { metresToLngLat, lngLatToMetres } from "../utils/geo";
import { useTheme } from "../contexts/ThemeContext";

interface MapPanelProps {
  state: AppState;
  isMeasuring: boolean;
  onBoundaryChange: (coords: [number, number][]) => void;
  onMapMove: (e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent) => void;
  onMapClick: (e: mapboxgl.MapMouseEvent) => void;
  onObjectSelect: (id: string | null) => void;
  onObjectUpdate: (id: string, updates: any) => void;
  onSetBoundaryLock?: (locked: boolean) => void;
  drawTrigger: number;
  targetLocation?: { lng: number; lat: number; zoom?: number };
  /** Called once the Mapbox map instance is ready — lets the parent access camera controls */
  onMapReady?: (map: mapboxgl.Map) => void;
}

// Guards against placeholder/invalid model URLs (e.g. "uploading..." left
// over from an in-progress or interrupted GLB upload) ever being handed to
// Mapbox's addModel — Mapbox will try to fetch whatever string it's given,
// and a non-URL placeholder resolves to the dev server's SPA fallback page,
// producing a confusing "Unexpected token '<'" parse error.
const isValidModelUrl = (url: unknown): url is string =>
  typeof url === "string" && /^https?:\/\//i.test(url);

export const MapPanel: React.FC<MapPanelProps> = ({
  state,
  isMeasuring,
  onBoundaryChange,
  onMapMove,
  onMapClick,
  onObjectSelect,
  onObjectUpdate,
  onSetBoundaryLock,
  drawTrigger,
  targetLocation,
  onMapReady,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const measureMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const measureLineRef = useRef<mapboxgl.Marker | null>(null);
  const originMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [hoverCoords, setHoverCoords] = useState<[number, number] | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const hoveredIdRef = useRef<string | null>(null);
  const { theme } = useTheme();

  // Use refs for callbacks to avoid stale closures in Mapbox event listeners
  const callbacks = useRef({
    onBoundaryChange,
    onMapMove,
    onMapClick,
    onObjectSelect,
    onObjectUpdate,
    onSetBoundaryLock: undefined as any as
      | ((locked: boolean) => void)
      | undefined,
    state,
  });

  // Build equipment features from app state (used on initial load and style reloads)
  const buildEquipmentFeatureCollection = (
    stateSnapshot: AppState,
    map: mapboxgl.Map,
  ) => {
    if (!stateSnapshot.originLngLat) {
      return { type: "FeatureCollection", features: [] } as any;
    }

    const features = stateSnapshot.objects
      .map((obj) => {
        const def =
          DEFAULT_LIBRARY.find((d) => d.id === obj.type) ??
          stateSnapshot.customLibrary.find((d) => d.id === obj.type);
        if (!def) return null;

        const lngLat = metresToLngLat(
          obj.x,
          obj.z,
          stateSnapshot.originLngLat!,
        );

        if (isValidModelUrl(def.modelUrl)) {
          if (!map.hasModel(def.modelUrl)) {
            map.addModel(def.modelUrl, def.modelUrl);
          }

          return {
            type: "Feature",
            id: obj.id,
            geometry: {
              type: "Point",
              coordinates: [lngLat[0], lngLat[1]],
            },
            properties: {
              id: obj.id,
              color: obj.color || def.color,
              height: def.height,
              "model-uri": def.modelUrl,
              rotation: (obj.rotationY * 180) / Math.PI,
              animations: def.animationsEnabled
                ? [{ name: "*", state: "play" }]
                : [],
            },
          };
        }

        const halfW = def.width / 2;
        const halfD = def.depth / 2;

        const cornersMetres = [
          { x: -halfW, z: -halfD },
          { x: halfW, z: -halfD },
          { x: halfW, z: halfD },
          { x: -halfW, z: halfD },
          { x: -halfW, z: -halfD },
        ];

        const rotatedCorners = cornersMetres.map((c) => {
          const rx =
            c.x * Math.cos(obj.rotationY) - c.z * Math.sin(obj.rotationY);
          const rz =
            c.x * Math.sin(obj.rotationY) + c.z * Math.cos(obj.rotationY);
          return metresToLngLat(
            obj.x + rx,
            obj.z + rz,
            stateSnapshot.originLngLat!,
          );
        });

        return {
          type: "Feature",
          id: obj.id,
          geometry: {
            type: "Polygon",
            coordinates: [rotatedCorners],
          },
          properties: {
            id: obj.id,
            color: obj.color || def.color,
            height: def.height,
          },
        };
      })
      .filter((f) => f !== null);

    const fc = {
      type: "FeatureCollection",
      features: features as any,
    };

    return fc as any;
  };

  // Build readonly boundary feature (used to repopulate after style reloads)
  const buildBoundaryFeature = (stateSnapshot: AppState) => {
    if (!stateSnapshot.originLngLat || stateSnapshot.siteBoundary.length < 3) {
      return { type: "FeatureCollection", features: [] } as any;
    }

    const coords = [...stateSnapshot.siteBoundary];
    if (
      coords[0][0] !== coords[coords.length - 1][0] ||
      coords[0][1] !== coords[coords.length - 1][1]
    ) {
      coords.push(coords[0]);
    }

    return {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [coords] },
      properties: {},
    } as any;
  };

  // Build midpoint label features for each boundary segment
  const buildSegmentLabels = (stateSnapshot: AppState) => {
    if (!stateSnapshot.siteBoundary || stateSnapshot.siteBoundary.length < 2) {
      return { type: "FeatureCollection", features: [] } as any;
    }
    const pts = stateSnapshot.siteBoundary;
    const imperial = stateSnapshot.unitSystem === "imperial";
    const features: any[] = [];

    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];

      // Midpoint
      const midLng = (a[0] + b[0]) / 2;
      const midLat = (a[1] + b[1]) / 2;

      // Haversine distance in metres
      const R = 6371000;
      const dLat = ((b[1] - a[1]) * Math.PI) / 180;
      const dLng = ((b[0] - a[0]) * Math.PI) / 180;
      const sinA = Math.sin(dLat / 2);
      const sinB = Math.sin(dLng / 2);
      const haversin =
        sinA * sinA +
        Math.cos((a[1] * Math.PI) / 180) *
          Math.cos((b[1] * Math.PI) / 180) *
          sinB *
          sinB;
      const distM =
        R * 2 * Math.atan2(Math.sqrt(haversin), Math.sqrt(1 - haversin));

      const label = imperial
        ? `${(distM * 3.28084).toFixed(1)} ft`
        : `${distM.toFixed(1)} m`;

      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [midLng, midLat] },
        properties: { label },
      });
    }

    return { type: "FeatureCollection", features } as any;
  };

  useEffect(() => {
    callbacks.current = {
      onBoundaryChange,
      onMapMove,
      onMapClick,
      onObjectSelect,
      onObjectUpdate,
      onSetBoundaryLock: onSetBoundaryLock || undefined,
      state,
    };
  });

  const setupLayers = useCallback((map: mapboxgl.Map) => {
    if (!map.getSource("measure-line")) {
      map.addSource("measure-line", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "measure-line-layer",
        type: "line",
        source: "measure-line",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#2E8B7A",
          "line-width": 3,
          "line-dasharray": [2, 1],
        },
      });
    }

    if (!map.getSource("boundary-readonly")) {
      map.addSource("boundary-readonly", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "boundary-readonly-fill",
        type: "fill",
        source: "boundary-readonly",
        paint: { "fill-color": "#2E8B7A", "fill-opacity": 0.1 },
      });
      map.addLayer({
        id: "boundary-readonly-stroke",
        type: "line",
        source: "boundary-readonly",
        paint: { "line-color": "#2E8B7A", "line-width": 2 },
      });

      // Populate readonly boundary immediately (useful after a style reload)
      try {
        const source = map.getSource(
          "boundary-readonly",
        ) as mapboxgl.GeoJSONSource;
        if (source) {
          const bf = buildBoundaryFeature(callbacks.current.state);
          if (bf && bf.geometry) {
            source.setData(bf as any);
          } else {
            source.setData({ type: "FeatureCollection", features: [] } as any);
          }

          // Also ensure Mapbox Draw has the polygon so it's selectable/visible
          const draw = drawRef.current;
          try {
            if (draw && callbacks.current.state.siteBoundary.length >= 3) {
              const currentFeatures = draw.getAll().features;
              const hasPolygon = currentFeatures.some(
                (f) => f.geometry.type === "Polygon",
              );
              if (!hasPolygon) {
                const coords = [...callbacks.current.state.siteBoundary];
                if (
                  coords[0][0] !== coords[coords.length - 1][0] ||
                  coords[0][1] !== coords[coords.length - 1][1]
                ) {
                  coords.push(coords[0]);
                }
                draw.add({
                  type: "Feature",
                  geometry: { type: "Polygon", coordinates: [coords] },
                  properties: {},
                });
              }
            }
          } catch (err) {
            // ignore draw errors during style transitions
          }
        }
      } catch (err) {
        // Ignore errors during style transitions
      }
    }

    // Add 3D buildings layer
    if (
      !map.getLayer("3d-buildings") &&
      callbacks.current.state.mapStyle === "streets"
    ) {
      const layers = map.getStyle().layers;
      let labelLayerId;
      if (layers) {
        for (let i = 0; i < layers.length; i++) {
          if (
            layers[i].type === "symbol" &&
            (layers[i].layout as any)?.["text-field"]
          ) {
            labelLayerId = layers[i].id;
            break;
          }
        }
      }

      map.addLayer(
        {
          id: "3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 15,
          paint: {
            "fill-extrusion-color": "#aaa",
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "height"],
            ],
            "fill-extrusion-base": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "min_height"],
            ],
            "fill-extrusion-opacity": 0.6,
          },
        },
        labelLayerId,
      );
    }

    // Boundary segment distance labels
    if (!map.getSource("boundary-segment-labels")) {
      map.addSource("boundary-segment-labels", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "boundary-segment-labels-layer",
        type: "symbol",
        source: "boundary-segment-labels",
        layout: {
          "text-field": ["get", "label"],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 13,
          "text-anchor": "center",
          "text-allow-overlap": true,
          "text-ignore-placement": true,
          "symbol-placement": "point",
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#1a1a2e",
          "text-halo-width": 2,
        },
      });
    }

    if (!map.getSource("equipment")) {
      map.addSource("equipment", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        promoteId: "id",
      });
      map.addLayer({
        id: "equipment-layer",
        type: "fill-extrusion",
        source: "equipment",
        filter: ["!", ["has", "model-uri"]],
        paint: {
          "fill-extrusion-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#ff0055", // Bright Pinkish-Red for selection
            ["boolean", ["feature-state", "hover"], false],
            "#ffaa00", // Bright Orange for hover
            ["get", "color"],
          ],
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": 0,
          "fill-extrusion-opacity": 0.8,
        },
      });

      // Model layer
      map.addLayer({
        id: "equipment-model-layer",
        type: "model",
        source: "equipment",
        filter: ["has", "model-uri"],
        layout: {
          "model-id": ["get", "model-uri"],
        },
        paint: {
          "model-rotation": [0, 0, ["get", "rotation"]],
          "model-scale": [1, 1, 1],
          "model-type": "common-3d",
          "model-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#ff0055",
            ["boolean", ["feature-state", "hover"], false],
            "#ffaa00",
            "#ffffff"
          ],
          "model-color-mix-intensity": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            0.85,
            ["boolean", ["feature-state", "hover"], false],
            0.5,
            0
          ],
          "model-animations": [
            "case",
            ["has", "animations"],
            ["get", "animations"],
            ["literal", []],
          ],
        } as any,
      });

      // Populate equipment source immediately (useful after a style reload)
      try {
        const source = map.getSource("equipment") as mapboxgl.GeoJSONSource;
        if (source) {
          const fc = buildEquipmentFeatureCollection(
            callbacks.current.state,
            map,
          );
          source.setData(fc as any);

          // Restore selection feature state
          callbacks.current.state.objects.forEach((obj) => {
            map.setFeatureState(
              { source: "equipment", id: obj.id },
              { selected: callbacks.current.state.selectedId === obj.id },
            );
          });
        }
      } catch (err) {
        // Ignore errors during style transitions
      }
    }

    if (!map.getSource("ghost-box")) {
      map.addSource("ghost-box", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "ghost-box-layer",
        type: "fill-extrusion",
        source: "ghost-box",
        filter: ["!", ["has", "model-uri"]],
        paint: {
          "fill-extrusion-color": ["get", "color"],
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": 0,
          "fill-extrusion-opacity": 0.4,
        },
      });

      // Ghost model layer
      map.addLayer({
        id: "ghost-model-layer",
        type: "model",
        source: "ghost-box",
        filter: ["has", "model-uri"],
        layout: {
          "model-id": ["get", "model-uri"],
        },
        paint: {
          "model-rotation": [0, 0, 0],
          "model-scale": [1, 1, 1],
          "model-type": "common-3d",
          "model-opacity": 0.4,
          "model-animations": [
            "case",
            ["has", "animations"],
            ["get", "animations"],
            ["literal", []],
          ],
        } as any,
      });
    }

    // ── Safe zone layers (shown only while placing equipment) ──────────────
    if (!map.getSource("safe-zones")) {
      map.addSource("safe-zones", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      // Amber fill — safe zone area of each placed equipment
      map.addLayer({
        id: "safe-zone-fill",
        type: "fill",
        source: "safe-zones",
        paint: {
          "fill-color": "#f59e0b",
          "fill-opacity": 0.08,
        },
      });
      // Amber dashed outline
      map.addLayer({
        id: "safe-zone-outline",
        type: "line",
        source: "safe-zones",
        paint: {
          "line-color": "#f59e0b",
          "line-width": 1.5,
          "line-dasharray": [3, 2],
          "line-opacity": 0.6,
        },
      });
    }

    if (!map.getSource("safe-zone-violations")) {
      map.addSource("safe-zone-violations", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      // Red fill for violated safe zones
      map.addLayer({
        id: "safe-zone-violation-fill",
        type: "fill",
        source: "safe-zone-violations",
        paint: {
          "fill-color": "#ef4444",
          "fill-opacity": 0.18,
        },
      });
      // Bold red outline for violated safe zones
      map.addLayer({
        id: "safe-zone-violation-outline",
        type: "line",
        source: "safe-zone-violations",
        paint: {
          "line-color": "#ef4444",
          "line-width": 3,
          "line-opacity": 1,
        },
      });
    }
  }, []);

  useEffect(() => {
    if (mapRef.current && targetLocation) {
      mapRef.current.flyTo({
        center: [targetLocation.lng, targetLocation.lat],
        zoom: targetLocation.zoom || 18,
        essential: true,
      });
    }
  }, [targetLocation]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token) {
      console.error("Mapbox token missing");
      return;
    }

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [73.8567, 18.5204], // Pune, India
      zoom: 16,
      pitch: 0,
      bearing: 0,
      antialias: true,
      preserveDrawingBuffer: true,
    });

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: "simple_select",
    });

    map.addControl(draw);
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("style.load", () => {
      setupLayers(map);
    });

    map.on("load", () => {
      mapRef.current = map;
      drawRef.current = draw;
      setupLayers(map);
      // Expose the map instance to the parent so it can control the camera
      onMapReady?.(map);
    });

    map.on("draw.create", (e: any) => {
      const feature = e.features[0];
      if (feature.geometry.type === "Polygon") {
        const coords = feature.geometry.coordinates[0] as [number, number][];
        callbacks.current.onBoundaryChange(coords);

        // Update segment labels immediately on draw complete
        const segSrc = map.getSource(
          "boundary-segment-labels",
        ) as mapboxgl.GeoJSONSource;
        if (segSrc) segSrc.setData(buildSegmentLabels(callbacks.current.state));

        // Auto-zoom to fit the boundary in plain mode
        if (callbacks.current.state.mapStyle === "plain" && coords.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          coords.forEach((coord) => bounds.extend(coord));
          map.fitBounds(bounds, {
            padding: 50,
            duration: 800,
            maxZoom: 20,
          });
        }
      }
    });

    map.on("draw.update", (e: any) => {
      const feature = e.features[0];
      if (feature.geometry.type === "Polygon") {
        callbacks.current.onBoundaryChange(
          feature.geometry.coordinates[0] as [number, number][],
        );
        // Update segment labels on polygon vertex drag
        const segSrc = map.getSource(
          "boundary-segment-labels",
        ) as mapboxgl.GeoJSONSource;
        if (segSrc) segSrc.setData(buildSegmentLabels(callbacks.current.state));
      }
    });

    map.on("draw.delete", () => {
      callbacks.current.onBoundaryChange([]);
      // Clear segment labels on delete
      const segSrc = map.getSource(
        "boundary-segment-labels",
      ) as mapboxgl.GeoJSONSource;
      if (segSrc) segSrc.setData({ type: "FeatureCollection", features: [] });
    });

    // draw.render fires on EVERY change — vertex add, drag, hover.
    // This gives LIVE distance labels while the user is still drawing.
    // During draw_polygon mode, MapboxDraw stores the in-progress shape as
    // a LineString (not yet closed as a Polygon), so we check both types.
    map.on("draw.render", () => {
      const draw = drawRef.current;
      if (!draw) return;

      const segSrc = map.getSource(
        "boundary-segment-labels",
      ) as mapboxgl.GeoJSONSource;
      if (!segSrc) return;

      const all = draw.getAll();

      // ── Case 1: Polygon already completed (e.g. after drag/edit) ──────
      const polygon = all.features.find(
        (f: any) => f.geometry.type === "Polygon",
      );
      if (polygon) {
        const coords: [number, number][] = (polygon.geometry as any)
          .coordinates[0];
        if (coords.length >= 3) {
          const liveState = {
            ...callbacks.current.state,
            siteBoundary: coords.slice(0, -1),
          };
          segSrc.setData(buildSegmentLabels(liveState));

          // Ensure labels layer is visible
          if (map.getLayer("boundary-segment-labels-layer")) {
            map.setLayoutProperty(
              "boundary-segment-labels-layer",
              "visibility",
              "visible",
            );
          }
        }
        return;
      }

      // ── Case 2: Still drawing — in-progress LineString ───────────────
      // MapboxDraw represents the active polygon-in-progress as a LineString.
      // We read its coordinates to show live segment labels before the
      // polygon is closed (this is the state after Clear + re-draw).
      const lineString = all.features.find(
        (f: any) => f.geometry.type === "LineString",
      );
      if (lineString) {
        const coords: [number, number][] = (lineString.geometry as any)
          .coordinates;
        // Need at least 2 placed points to show a measurement
        if (coords.length >= 2) {
          const liveState = {
            ...callbacks.current.state,
            siteBoundary: coords,
          };
          segSrc.setData(buildSegmentLabels(liveState));

          // Make sure labels layer is visible during drawing
          if (map.getLayer("boundary-segment-labels-layer")) {
            map.setLayoutProperty(
              "boundary-segment-labels-layer",
              "visibility",
              "visible",
            );
          }
        }
        return;
      }
    });

    map.on("mousemove", (e) => {
      setHoverCoords([e.lngLat.lng, e.lngLat.lat]);
      callbacks.current.onMapMove(e);

      if (!map.getLayer("equipment-layer")) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: ["equipment-layer", "equipment-model-layer"],
      });
      map.getCanvas().style.cursor = features.length > 0 ? "pointer" : "";

      let hoveredId: string | null = null;
      if (features.length > 0) {
        hoveredId = (features[0].id as string) || (features[0].properties?.id as string);
      }
      
      if (hoveredId !== hoveredIdRef.current) {
        if (hoveredIdRef.current) {
          map.setFeatureState(
            { source: "equipment", id: hoveredIdRef.current },
            { hover: false }
          );
        }
        if (hoveredId) {
          map.setFeatureState(
            { source: "equipment", id: hoveredId },
            { hover: true }
          );
        }
        hoveredIdRef.current = hoveredId;
      }

      if (draggingIdRef.current && callbacks.current.state.originLngLat) {
        const { x, z } = lngLatToMetres(
          [e.lngLat.lng, e.lngLat.lat],
          callbacks.current.state.originLngLat,
        );
        const snappedX = Math.round(x * 2) / 2;
        const snappedZ = Math.round(z * 2) / 2;
        callbacks.current.onObjectUpdate(draggingIdRef.current, {
          x: snappedX,
          z: snappedZ,
        });
      }
    });

    map.on("mouseout", () => {
      if (hoveredIdRef.current) {
        map.setFeatureState(
          { source: "equipment", id: hoveredIdRef.current },
          { hover: false }
        );
        hoveredIdRef.current = null;
      }
    });

    // Use mousedown instead of click for more reliable placement and dragging
    map.on("mousedown", (e) => {
      if (!map.getLayer("equipment-layer")) {
        callbacks.current.onMapClick(e);
        return;
      }

      const features = map.queryRenderedFeatures(e.point, {
        layers: ["equipment-layer", "equipment-model-layer"],
      });
      if (features.length > 0) {
        const id = (features[0].id as string) || features[0].properties?.id;
        callbacks.current.onObjectSelect(id);
        draggingIdRef.current = id;
        // Lock the boundary while dragging an object so it remains fixed
        try {
          callbacks.current.onSetBoundaryLock?.(true);
        } catch {}
        map.dragPan.disable();
      } else {
        callbacks.current.onMapClick(e);
        if (!callbacks.current.state.pendingPlacement) {
          callbacks.current.onObjectSelect(null);
        }
      }
    });

    map.on("mouseup", () => {
      // Unlock boundary when drag ends
      try {
        callbacks.current.onSetBoundaryLock?.(false);
      } catch {}
      draggingIdRef.current = null;
      map.dragPan.enable();
    });

    const updateCamera = () => {
      if (!mapRef.current) return;
    };

    map.on("move", updateCamera);
    map.on("zoom", updateCamera);
    map.on("pitch", updateCamera);
    map.on("rotate", updateCamera);

    return () => {
      map.remove();
    };
  }, []);

  // Sync equipment visual
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const source = map.getSource("equipment") as mapboxgl.GeoJSONSource;
    if (!source) return;

    // If no originLngLat or no objects, clear the equipment layer
    if (!state.originLngLat || state.objects.length === 0) {
      source.setData({ type: "FeatureCollection", features: [] });
      return;
    }

    const features = state.objects
      .map((obj) => {
        const def =
          DEFAULT_LIBRARY.find((d) => d.id === obj.type) ??
          state.customLibrary.find((d) => d.id === obj.type);
        if (!def) return null;

        const lngLat = metresToLngLat(obj.x, obj.z, state.originLngLat!);

        // If model is available, use point geometry for model layer
        if (isValidModelUrl(def.modelUrl)) {
          // Register model if not already registered
          if (!map.hasModel(def.modelUrl)) {
            map.addModel(def.modelUrl, def.modelUrl);
          }

          return {
            type: "Feature",
            id: obj.id,
            geometry: {
              type: "Point",
              coordinates: [lngLat[0], lngLat[1]],
            },
            properties: {
              id: obj.id,
              color: obj.color || def.color,
              height: def.height,
              "model-uri": def.modelUrl,
              rotation: (obj.rotationY * 180) / Math.PI, // Mapbox model rotation is in degrees
              animations: def.animationsEnabled
                ? [{ name: "*", state: "play" }]
                : [],
            },
          };
        }

        // Fallback to box polygon for fill-extrusion
        const halfW = def.width / 2;
        const halfD = def.depth / 2;

        const cornersMetres = [
          { x: -halfW, z: -halfD },
          { x: halfW, z: -halfD },
          { x: halfW, z: halfD },
          { x: -halfW, z: halfD },
          { x: -halfW, z: -halfD },
        ];

        const rotatedCorners = cornersMetres.map((c) => {
          const rx =
            c.x * Math.cos(obj.rotationY) - c.z * Math.sin(obj.rotationY);
          const rz =
            c.x * Math.sin(obj.rotationY) + c.z * Math.cos(obj.rotationY);
          return metresToLngLat(obj.x + rx, obj.z + rz, state.originLngLat!);
        });

        return {
          type: "Feature",
          id: obj.id,
          geometry: {
            type: "Polygon",
            coordinates: [rotatedCorners],
          },
          properties: {
            id: obj.id,
            color: obj.color || def.color,
            height: def.height,
          },
        };
      })
      .filter((f) => f !== null);

    source.setData({
      type: "FeatureCollection",
      features: features as any,
    });

    // Update feature state for selection highlight
    state.objects.forEach((obj) => {
      map.setFeatureState(
        { source: "equipment", id: obj.id },
        { selected: state.selectedId === obj.id },
      );
    });
  }, [state.objects, state.originLngLat, state.selectedId, state.mapStyle]);

  // ── Helper: build a safe-zone polygon for an equipment at (cx, cz) ──────
  const buildSafeZonePolygon = (
    cx: number,
    cz: number,
    width: number,
    depth: number,
    rotationY: number,
    origin: [number, number],
  ) => {
    const SAFE = 1.5; // 1.5m each side = +3m total per dimension
    const hw = (width + SAFE * 2) / 2;
    const hd = (depth + SAFE * 2) / 2;
    const corners = [
      { x: -hw, z: -hd },
      { x: hw, z: -hd },
      { x: hw, z: hd },
      { x: -hw, z: hd },
      { x: -hw, z: -hd },
    ].map((c) => {
      const rx = c.x * Math.cos(rotationY) - c.z * Math.sin(rotationY);
      const rz = c.x * Math.sin(rotationY) + c.z * Math.cos(rotationY);
      return metresToLngLat(cx + rx, cz + rz, origin);
    });
    return corners;
  };

  // ── Sync safe-zone layers whenever pendingPlacement or hoverCoords changes ──
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const safeSource = map.getSource("safe-zones") as mapboxgl.GeoJSONSource;
    const violSource = map.getSource(
      "safe-zone-violations",
    ) as mapboxgl.GeoJSONSource;
    if (!safeSource || !violSource) return;

    // Clear both layers when nothing is being placed or dragged
    const isDragging = !!draggingIdRef.current;
    if (
      (!state.pendingPlacement && !isDragging) ||
      !state.originLngLat ||
      !hoverCoords
    ) {
      safeSource.setData({ type: "FeatureCollection", features: [] });
      violSource.setData({ type: "FeatureCollection", features: [] });
      return;
    }

    const origin = state.originLngLat;
    const allDefs = [...DEFAULT_LIBRARY, ...(state.customLibrary || [])];

    // Build safe-zone polygon for every already-placed equipment
    const safeFeatures = state.objects
      .map((obj) => {
        const def = allDefs.find((d) => d.id === obj.type);
        if (!def) return null;
        const ring = buildSafeZonePolygon(
          obj.x,
          obj.z,
          def.width,
          def.depth,
          obj.rotationY,
          origin,
        );
        return {
          type: "Feature" as const,
          geometry: { type: "Polygon" as const, coordinates: [ring] },
          properties: { id: obj.id },
        };
      })
      .filter(Boolean);

    safeSource.setData({
      type: "FeatureCollection",
      features: safeFeatures as any,
    });

    // Ghost footprint of the equipment being placed
    const { x, z } = lngLatToMetres(hoverCoords, origin);
    const ghostX = Math.round(x * 2) / 2;
    const ghostZ = Math.round(z * 2) / 2;
    // Determine the definition and rotation for the ghost footprint.
    // Use pendingPlacement when placing, or the dragged object's def when dragging.
    let def = state.pendingPlacement;
    let rotationY = 0;
    if (!def && draggingIdRef.current) {
      const draggingObj = state.objects.find(
        (o) => o.id === draggingIdRef.current,
      );
      if (draggingObj) {
        def =
          DEFAULT_LIBRARY.find((d) => d.id === draggingObj.type) ??
          (state.customLibrary || []).find((d) => d.id === draggingObj.type);
        rotationY = draggingObj.rotationY || 0;
      }
    }

    if (!def) {
      violSource.setData({ type: "FeatureCollection", features: [] });
      return;
    }

    const ghw = def.width / 2;
    const ghd = def.depth / 2;
    const ghostCorners = [
      { x: -ghw, z: -ghd },
      { x: ghw, z: -ghd },
      { x: ghw, z: ghd },
      { x: -ghw, z: ghd },
      { x: -ghw, z: -ghd },
    ].map((c) => {
      const rx = c.x * Math.cos(rotationY) - c.z * Math.sin(rotationY);
      const rz = c.x * Math.sin(rotationY) + c.z * Math.cos(rotationY);
      return metresToLngLat(ghostX + rx, ghostZ + rz, origin);
    });

    const ghostPolygon = turf.polygon([ghostCorners]);

    // Find any safe zone that the ghost footprint overlaps
    const violations = safeFeatures.filter((f) => {
      if (!f) return false;
      try {
        return turf.booleanIntersects(
          ghostPolygon,
          turf.polygon([(f as any).geometry.coordinates[0]]),
        );
      } catch {
        return false;
      }
    });

    violSource.setData({
      type: "FeatureCollection",
      features: violations as any,
    });
  }, [
    state.pendingPlacement,
    hoverCoords,
    state.originLngLat,
    state.objects,
    state.customLibrary,
  ]);

  // Sync ghost box
  useEffect(() => {
    if (
      !mapRef.current ||
      !state.originLngLat ||
      !state.pendingPlacement ||
      !hoverCoords
    ) {
      if (mapRef.current) {
        const source = mapRef.current.getSource(
          "ghost-box",
        ) as mapboxgl.GeoJSONSource;
        if (source) source.setData({ type: "FeatureCollection", features: [] });
      }
      return;
    }

    const map = mapRef.current;
    const source = map.getSource("ghost-box") as mapboxgl.GeoJSONSource;
    if (!source) return;

    const def = state.pendingPlacement;
    const { x, z } = lngLatToMetres(hoverCoords, state.originLngLat);
    const snappedX = Math.round(x * 2) / 2;
    const snappedZ = Math.round(z * 2) / 2;
    const lngLat = metresToLngLat(snappedX, snappedZ, state.originLngLat!);

    if (isValidModelUrl(def.modelUrl)) {
      if (!map.hasModel(def.modelUrl)) {
        map.addModel(def.modelUrl, def.modelUrl);
      }

      source.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [lngLat[0], lngLat[1]],
            },
            properties: {
              color: def.color,
              height: def.height,
              "model-uri": def.modelUrl,
              animations: def.animationsEnabled
                ? [{ name: "*", state: "play" }]
                : [],
            },
          },
        ] as any,
      });
      return;
    }

    const halfW = def.width / 2;
    const halfD = def.depth / 2;
    const cornersMetres = [
      { x: -halfW, z: -halfD },
      { x: halfW, z: -halfD },
      { x: halfW, z: halfD },
      { x: -halfW, z: halfD },
      { x: -halfW, z: -halfD },
    ];

    const cornersLngLat = cornersMetres.map((c) =>
      metresToLngLat(snappedX + c.x, snappedZ + c.z, state.originLngLat!),
    );

    source.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [cornersLngLat],
          },
          properties: {
            color: def.color,
            height: def.height,
          },
        },
      ] as any,
    });
  }, [state.pendingPlacement, hoverCoords, state.originLngLat, state.mapStyle]);

  // Sync measurement visual
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clear old markers
    measureMarkersRef.current.forEach((m) => m.remove());
    measureMarkersRef.current = [];
    if (measureLineRef.current) measureLineRef.current.remove();
    measureLineRef.current = null;

    if (state.measurePoints.length === 0) {
      const source = map.getSource("measure-line") as mapboxgl.GeoJSONSource;
      if (source) source.setData({ type: "FeatureCollection", features: [] });
      // Also clear segment labels
      const segSource = map.getSource(
        "boundary-segment-labels",
      ) as mapboxgl.GeoJSONSource;
      if (segSource)
        segSource.setData({ type: "FeatureCollection", features: [] });
      return;
    }

    state.measurePoints.forEach((pt, i) => {
      const el = document.createElement("div");
      const isPlainMode = state.mapStyle === "plain";
      const isLightTheme = theme === "light";

      // Adjust marker colors for plain mode
      let markerClass =
        "w-3 h-3 bg-brand-teal border-2 border-white rounded-full shadow-lg";
      if (isPlainMode) {
        if (isLightTheme) {
          markerClass =
            "w-4 h-4 bg-[#00FF00] border-2 border-white rounded-full shadow-lg";
        } else {
          markerClass =
            "w-4 h-4 bg-[#FFD700] border-2 border-black rounded-full shadow-lg";
        }
      }

      el.className = markerClass;
      const marker = new mapboxgl.Marker(el).setLngLat(pt).addTo(map);
      measureMarkersRef.current.push(marker);
    });

    if (state.measurePoints.length === 2) {
      const p1 = state.measurePoints[0];
      const p2 = state.measurePoints[1];
      const distMeters = turf.distance(turf.point(p1), turf.point(p2), {
        units: "meters",
      });
      const midpoint = turf.midpoint(turf.point(p1), turf.point(p2)).geometry
        .coordinates as [number, number];

      const source = map.getSource("measure-line") as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "LineString", coordinates: [p1, p2] },
              properties: {},
            },
          ],
        });
      }

      const label = document.createElement("div");
      const isPlainMode = state.mapStyle === "plain";
      const isLightTheme = theme === "light";

      // Adjust label colors for plain mode
      let labelClass =
        "bg-white text-brand-navy px-2 py-1 rounded shadow-lg text-[10px] font-bold border border-brand-teal";
      if (isPlainMode) {
        if (isLightTheme) {
          labelClass =
            "bg-[#00FF00] text-black px-2 py-1 rounded shadow-lg text-[10px] font-bold border-2 border-white";
        } else {
          labelClass =
            "bg-[#FFD700] text-black px-2 py-1 rounded shadow-lg text-[10px] font-bold border-2 border-black";
        }
      }

      label.className = labelClass;

      if (state.unitSystem === "imperial") {
        const distFeet = distMeters * 3.28084;
        label.innerText = distFeet.toFixed(1) + "ft";
      } else {
        label.innerText = distMeters.toFixed(1) + "m";
      }

      const labelMarker = new mapboxgl.Marker(label)
        .setLngLat(midpoint)
        .addTo(map);
      measureLineRef.current = labelMarker;
    }
  }, [state.measurePoints, state.unitSystem, theme, state.mapStyle]);

  // Sync style — runs ONLY when the map style (streets/satellite/plain) changes.
  // theme is intentionally NOT in the dependency array: toggling dark↔light must
  // not call setStyle(), which wipes every custom source & layer (boundary, equipment, etc.)
  useEffect(() => {
    if (!mapRef.current) return;

    if (state.mapStyle === "plain") {
      const plainStyle = {
        version: 8,
        name: "plain",
        metadata: {},
        glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
        sources: {},
        layers: [
          {
            id: "plain-background",
            type: "background",
            paint: {
              // Use current theme value captured via ref so this closure doesn't
              // need `theme` as a dep (and therefore doesn't re-run on theme change).
              "background-color":
                callbacks.current.state.mapStyle === "plain"
                  ? document.documentElement.classList.contains("light")
                    ? "#000000"
                    : "#ffffff"
                  : "#ffffff",
            },
          },
        ],
      } as any;

      mapRef.current.setStyle(plainStyle);
      return;
    }

    const style =
      state.mapStyle === "satellite"
        ? "mapbox://styles/mapbox/satellite-v9"
        : "mapbox://styles/mapbox/streets-v12";

    // After setStyle, all sources/layers are wiped — re-add segment labels on style.load.
    // The global style.load handler (set during map init) calls setupLayers() which
    // re-adds boundary, equipment, and all other custom layers automatically.
    mapRef.current.once("style.load", () => {
      const map = mapRef.current;
      if (!map) return;
      if (!map.getSource("boundary-segment-labels")) {
        map.addSource("boundary-segment-labels", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }
      if (!map.getLayer("boundary-segment-labels-layer")) {
        map.addLayer({
          id: "boundary-segment-labels-layer",
          type: "symbol",
          source: "boundary-segment-labels",
          layout: {
            "text-field": ["get", "label"],
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": 13,
            "text-anchor": "center",
            "text-allow-overlap": true,
            "text-ignore-placement": true,
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "#1a1a2e",
            "text-halo-width": 2,
          },
        });
      }
      // Restore labels from current state
      const segSrc = map.getSource(
        "boundary-segment-labels",
      ) as mapboxgl.GeoJSONSource;
      if (segSrc) segSrc.setData(buildSegmentLabels(state));
    });

    mapRef.current.setStyle(style);
  }, [state.mapStyle]); // ← theme deliberately omitted — see comment above

  // Update plain-mode background color when theme changes WITHOUT reloading style.
  // This uses setPaintProperty (non-destructive) so all layers remain intact.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || state.mapStyle !== "plain") return;

    const applyBackground = () => {
      try {
        if (map.getLayer("plain-background")) {
          map.setPaintProperty(
            "plain-background",
            "background-color",
            theme === "light" ? "#000000" : "#ffffff",
          );
        }
      } catch (_) {
        // Layer not ready yet — safe to ignore
      }
    };

    if (map.isStyleLoaded()) {
      applyBackground();
    } else {
      map.once("style.load", applyBackground);
    }
  }, [theme, state.mapStyle]);

  // Adjust visibility colors for plain mode
  useEffect(() => {
    if (!mapRef.current || state.mapStyle !== "plain") return;
    const map = mapRef.current;

    // // In plain mode, increase opacity and contrast for boundary and measurements
    // const isLightTheme = theme === "light";
    // const boundaryColor = isLightTheme ? "#00FF00" : "#FFD700"; // Bright green for black bg, gold for white bg
    // const boundaryOpacity = 0.3;
    // const measureColor = isLightTheme ? "#00FF00" : "#FFD700";
    // const measureWidth = isLightTheme ? 4 : 3;

    // // Re-add segment labels source+layer if wiped by setStyle
    // if (!map.getSource("boundary-segment-labels")) {
    //   map.addSource("boundary-segment-labels", {
    //     type: "geojson",
    //     data: { type: "FeatureCollection", features: [] },
    //   });
    // }
    // if (!map.getLayer("boundary-segment-labels-layer")) {
    //   map.addLayer({
    //     id: "boundary-segment-labels-layer",
    //     type: "symbol",
    //     source: "boundary-segment-labels",
    //     layout: {
    //       "text-field": ["get", "label"],
    //       "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
    //       "text-size": 13,
    //       "text-anchor": "center",
    //       "text-allow-overlap": true,
    //       "text-ignore-placement": true,
    //       "symbol-placement": "point",
    //     },
    //     paint: {
    //       "text-color": theme === "light" ? "#000000" : "#ffffff",
    //       "text-halo-color": theme === "light" ? "#ffffff" : "#1a1a2e",
    //       "text-halo-width": 2,
    //     },
    //   });
    // }
    // // Repopulate with current boundary data
    // const segSrcPlain = map.getSource(
    //   "boundary-segment-labels",
    // ) as mapboxgl.GeoJSONSource;
    // if (segSrcPlain) segSrcPlain.setData(buildSegmentLabels(state));

    // try {
    //   if (map.getLayer("boundary-readonly-fill")) {
    //     map.setPaintProperty(
    //       "boundary-readonly-fill",
    //       "fill-color",
    //       boundaryColor,
    //     );
    //     map.setPaintProperty(
    //       "boundary-readonly-fill",
    //       "fill-opacity",
    //       boundaryOpacity,
    //     );
    //   }
    //   if (map.getLayer("boundary-readonly-stroke")) {
    //     map.setPaintProperty(
    //       "boundary-readonly-stroke",
    //       "line-color",
    //       boundaryColor,
    //     );
    //     map.setPaintProperty("boundary-readonly-stroke", "line-width", 3);
    //   }
    //   if (map.getLayer("measure-line-layer")) {
    //     map.setPaintProperty("measure-line-layer", "line-color", measureColor);
    //     map.setPaintProperty("measure-line-layer", "line-width", measureWidth);
    //   }
    // } catch (err) {
    //   // Layer not ready yet
    // }
    const applyPlainStyling = () => {
      const map = mapRef.current;
      if (!map) return;

      const isLightTheme = theme === "light";
      const boundaryColor = isLightTheme ? "#00FF00" : "#FFD700";
      const boundaryOpacity = 0.3;
      const measureColor = isLightTheme ? "#00FF00" : "#FFD700";
      const measureWidth = isLightTheme ? 4 : 3;

      // Defensive fallback — setupLayers() already re-adds this on style.load,
      // this just guards against ordering surprises.
      if (!map.getSource("boundary-segment-labels")) {
        map.addSource("boundary-segment-labels", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }
      if (!map.getLayer("boundary-segment-labels-layer")) {
        map.addLayer({
          id: "boundary-segment-labels-layer",
          type: "symbol",
          source: "boundary-segment-labels",
          layout: {
            "text-field": ["get", "label"],
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": 13,
            "text-anchor": "center",
            "text-allow-overlap": true,
            "text-ignore-placement": true,
            "symbol-placement": "point",
          },
          paint: {
            "text-color": theme === "light" ? "#000000" : "#ffffff",
            "text-halo-color": theme === "light" ? "#ffffff" : "#1a1a2e",
            "text-halo-width": 2,
          },
        });
      }

      const segSrcPlain = map.getSource(
        "boundary-segment-labels",
      ) as mapboxgl.GeoJSONSource;
      if (segSrcPlain) segSrcPlain.setData(buildSegmentLabels(state));

      try {
        if (map.getLayer("boundary-readonly-fill")) {
          map.setPaintProperty(
            "boundary-readonly-fill",
            "fill-color",
            boundaryColor,
          );
          map.setPaintProperty(
            "boundary-readonly-fill",
            "fill-opacity",
            boundaryOpacity,
          );
        }
        if (map.getLayer("boundary-readonly-stroke")) {
          map.setPaintProperty(
            "boundary-readonly-stroke",
            "line-color",
            boundaryColor,
          );
          map.setPaintProperty("boundary-readonly-stroke", "line-width", 3);
        }
        if (map.getLayer("measure-line-layer")) {
          map.setPaintProperty(
            "measure-line-layer",
            "line-color",
            measureColor,
          );
          map.setPaintProperty(
            "measure-line-layer",
            "line-width",
            measureWidth,
          );
        }
      } catch (err) {
        // Layer not ready yet
      }
    };

    // CRITICAL: setStyle() was just called in the effect above. At this point
    // in the same commit, map.isStyleLoaded() is false — calling addSource/
    // addLayer/getLayer synchronously here throws "Style is not done loading".
    if (map.isStyleLoaded()) {
      applyPlainStyling();
    } else {
      map.once("style.load", applyPlainStyling);
    }
  }, [state.mapStyle, theme]);

  // Sync terrain and buildings
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const handleStyleLoad = () => {
      // Terrain
      if (state.terrainEnabled && state.mapStyle === "streets") {
        if (!map.getSource("mapbox-dem")) {
          map.addSource("mapbox-dem", {
            type: "raster-dem",
            url: "mapbox://mapbox.mapbox-terrain-dem-v1",
            tileSize: 512,
            maxzoom: 14,
          });
        }
        map.setTerrain({ source: "mapbox-dem", exaggeration: 1.2 });
        map.easeTo({ pitch: 60 });
      } else {
        map.setTerrain(null);
        map.easeTo({ pitch: 0 });
      }

      // Buildings
      if (map.getLayer("3d-buildings")) {
        map.setLayoutProperty(
          "3d-buildings",
          "visibility",
          state.buildingsEnabled ? "visible" : "none",
        );
      } else if (state.buildingsEnabled && state.mapStyle === "streets") {
        // If layer missing but enabled, re-run setup
        setupLayers(map);
      }
    };

    if (map.isStyleLoaded()) {
      handleStyleLoad();
    } else {
      map.once("style.load", handleStyleLoad);
    }
  }, [state.terrainEnabled, state.buildingsEnabled, state.mapStyle]);

  // Sync readonly boundary and origin marker
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Origin Marker
    if (originMarkerRef.current) originMarkerRef.current.remove();
    if (state.originLngLat) {
      const el = document.createElement("div");
      const isPlainMode = state.mapStyle === "plain";
      const isLightTheme = theme === "light";

      // Adjust marker colors for plain mode: bright colors for visibility
      let bgColor = "bg-brand-teal";
      let innerColor = "bg-white";
      let borderColor = "border-white";

      if (isPlainMode) {
        if (isLightTheme) {
          // For black background in light theme mode
          bgColor = "bg-[#00FF00]"; // Bright green
          innerColor = "bg-white";
          borderColor = "border-white";
        } else {
          // For white background in dark theme mode
          bgColor = "bg-[#FFD700]"; // Gold
          innerColor = "bg-black";
          borderColor = "border-black";
        }
      }

      el.className = `w-6 h-6 flex items-center justify-center ${bgColor} rounded-full border-2 ${borderColor} shadow-xl animate-pulse`;
      el.innerHTML = `<div class="w-2 h-2 ${innerColor} rounded-full"></div>`;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        '<div class="text-[10px] font-bold text-brand-navy p-1">BENCHMARK ORIGIN</div>',
      );

      originMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat(state.originLngLat)
        .setPopup(popup)
        .addTo(map);
    }

    // Clear boundary if no origin or boundary too small
    if (!state.originLngLat || state.siteBoundary.length < 3) {
      const source = map.getSource(
        "boundary-readonly",
      ) as mapboxgl.GeoJSONSource;
      if (source) source.setData({ type: "FeatureCollection", features: [] });
      return;
    }

    const source = map.getSource("boundary-readonly") as mapboxgl.GeoJSONSource;
    if (!source) return;

    // Ensure closed
    const coords = [...state.siteBoundary];
    if (
      coords[0][0] !== coords[coords.length - 1][0] ||
      coords[0][1] !== coords[coords.length - 1][1]
    ) {
      coords.push(coords[0]);
    }

    source.setData({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [coords],
      },
      properties: {},
    } as any);

    // Update segment distance labels
    const segSource = map.getSource(
      "boundary-segment-labels",
    ) as mapboxgl.GeoJSONSource;
    if (segSource) {
      segSource.setData(buildSegmentLabels(state));
    }
  }, [
    state.siteBoundary,
    state.originLngLat,
    theme,
    state.mapStyle,
    state.unitSystem,
  ]);

  // Sync Mapbox Draw mode and visibility based on app state
  useEffect(() => {
    if (!mapRef.current || !drawRef.current) return;
    const map = mapRef.current;
    const isLocked =
      !!state.pendingPlacement || isMeasuring || state.isBoundaryLocked;

    if (isLocked) {
      drawRef.current.changeMode("simple_select");
    }

    // Toggle visibility of draw layers vs readonly boundary
    const layers = map.getStyle().layers;
    if (layers) {
      layers.forEach((layer) => {
        if (layer.id.startsWith("gl-draw-")) {
          map.setLayoutProperty(
            layer.id,
            "visibility",
            isLocked ? "none" : "visible",
          );
        }
      });
    }

    map.setLayoutProperty(
      "boundary-readonly-fill",
      "visibility",
      isLocked ? "visible" : "none",
    );
    map.setLayoutProperty(
      "boundary-readonly-stroke",
      "visibility",
      isLocked ? "visible" : "none",
    );
    // Show segment labels whenever boundary is visible OR actively drawing
    if (map.getLayer("boundary-segment-labels-layer")) {
      const isDrawing = drawRef.current?.getMode() === "draw_polygon";
      map.setLayoutProperty(
        "boundary-segment-labels-layer",
        "visibility",
        state.siteBoundary.length >= 2 || isDrawing ? "visible" : "none",
      );
    }
  }, [
    state.pendingPlacement,
    isMeasuring,
    state.isBoundaryLocked,
    state.siteBoundary,
  ]);

  // Trigger draw mode
  useEffect(() => {
    if (drawTrigger > 0 && drawRef.current) {
      drawRef.current.changeMode("draw_polygon");
    }
  }, [drawTrigger]);

  // Center map when originLngLat changes (e.g. after import)
  useEffect(() => {
    if (mapRef.current && state.originLngLat) {
      mapRef.current.easeTo({
        center: state.originLngLat,
        zoom: 18,
        duration: 1000,
      });
    }
  }, [state.originLngLat]);

  // Sync boundary to Mapbox Draw (for import)
  useEffect(() => {
    if (!drawRef.current) return;

    const draw = drawRef.current;
    // If incoming boundary is too small, ensure draw is cleared
    if (state.siteBoundary.length < 3) {
      try {
        draw.deleteAll();
      } catch (err) {
        // ignore
      }
      return;
    }

    const coords = [...state.siteBoundary];
    if (
      coords[0][0] !== coords[coords.length - 1]?.[0] ||
      coords[0][1] !== coords[coords.length - 1]?.[1]
    ) {
      coords.push(coords[0]);
    }

    try {
      const currentFeatures = draw
        .getAll()
        .features.filter((f) => f.geometry.type === "Polygon");

      // If there's no polygon, simply add the new one
      if (currentFeatures.length === 0) {
        draw.add({
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [coords] },
          properties: {},
        });
        return;
      }

      // Compare existing polygon coords with new coords; if different, replace
      // const existing = currentFeatures[0].geometry.coordinates[0];
      const polygonFeature = currentFeatures[0];

      if (polygonFeature.geometry.type !== "Polygon") {
        return;
      }

      const existing = polygonFeature.geometry.coordinates[0];

      const existingStr = JSON.stringify(
        existing.map((c: any) => [
          Number(c[0]).toFixed(6),
          Number(c[1]).toFixed(6),
        ]),
      );
      const newStr = JSON.stringify(
        coords.map((c) => [Number(c[0]).toFixed(6), Number(c[1]).toFixed(6)]),
      );

      if (existingStr !== newStr) {
        // replace: remove all polygons and add the new one
        draw.deleteAll();
        draw.add({
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [coords] },
          properties: {},
        });
      }
    } catch (err) {
      // ignore errors (style transitions, etc.)
    }
  }, [state.siteBoundary]);

  // Clear boundary
  useEffect(() => {
    if (state.siteBoundary.length === 0 && drawRef.current) {
      drawRef.current.deleteAll();
    }
  }, [state.siteBoundary]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
};
