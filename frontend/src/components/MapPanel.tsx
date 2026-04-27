import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { AppState, DEFAULT_LIBRARY } from '../../../backend/types';
import * as turf from '@turf/turf';
import { metresToLngLat, lngLatToMetres } from '../utils/geo';

interface MapPanelProps {
  state: AppState;
  isMeasuring: boolean;
  onBoundaryChange: (coords: [number, number][]) => void;
  onMapMove: (e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent) => void;
  onMapClick: (e: mapboxgl.MapMouseEvent) => void;
  onObjectSelect: (id: string | null) => void;
  onObjectUpdate: (id: string, updates: any) => void;
  drawTrigger: number;
  targetLocation?: { lng: number; lat: number; zoom?: number };
}

export const MapPanel: React.FC<MapPanelProps> = ({
  state,
  isMeasuring,
  onBoundaryChange,
  onMapMove,
  onMapClick,
  onObjectSelect,
  onObjectUpdate,
  drawTrigger,
  targetLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const measureMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const measureLineRef = useRef<mapboxgl.Marker | null>(null);
  const originMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [hoverCoords, setHoverCoords] = useState<[number, number] | null>(null);
  const draggingIdRef = useRef<string | null>(null);

  // Use refs for callbacks to avoid stale closures in Mapbox event listeners
  const callbacks = useRef({
    onBoundaryChange,
    onMapMove,
    onMapClick,
    onObjectSelect,
    onObjectUpdate,
    state,
  });

  useEffect(() => {
    callbacks.current = {
      onBoundaryChange,
      onMapMove,
      onMapClick,
      onObjectSelect,
      onObjectUpdate,
      state,
    };
  });

  const setupLayers = useCallback((map: mapboxgl.Map) => {
    if (!map.getSource('measure-line')) {
      map.addSource('measure-line', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      map.addLayer({
        id: 'measure-line-layer',
        type: 'line',
        source: 'measure-line',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#2E8B7A', 'line-width': 3, 'line-dasharray': [2, 1] }
      });
    }

    if (!map.getSource('boundary-readonly')) {
      map.addSource('boundary-readonly', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      map.addLayer({
        id: 'boundary-readonly-fill',
        type: 'fill',
        source: 'boundary-readonly',
        paint: { 'fill-color': '#2E8B7A', 'fill-opacity': 0.1 }
      });
      map.addLayer({
        id: 'boundary-readonly-stroke',
        type: 'line',
        source: 'boundary-readonly',
        paint: { 'line-color': '#2E8B7A', 'line-width': 2 }
      });
    }

    // Add 3D buildings layer
    if (!map.getLayer('3d-buildings') && callbacks.current.state.mapStyle === 'streets') {
      const layers = map.getStyle().layers;
      let labelLayerId;
      if (layers) {
        for (let i = 0; i < layers.length; i++) {
          if (layers[i].type === 'symbol' && (layers[i].layout as any)?.['text-field']) {
            labelLayerId = layers[i].id;
            break;
          }
        }
      }

      map.addLayer(
        {
          'id': '3d-buildings',
          'source': 'composite',
          'source-layer': 'building',
          'filter': ['==', 'extrude', 'true'],
          'type': 'fill-extrusion',
          'minzoom': 15,
          'paint': {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.6
          }
        },
        labelLayerId
      );
    }

    if (!map.getSource('equipment')) {
      map.addSource('equipment', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        promoteId: 'id'
      });
      map.addLayer({
        id: 'equipment-layer',
        type: 'fill-extrusion',
        source: 'equipment',
        filter: ['!', ['has', 'model-uri']],
        paint: {
          'fill-extrusion-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#ffffff',
            ['get', 'color']
          ],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.8
        }
      });

      // Model layer
      map.addLayer({
        id: 'equipment-model-layer',
        type: 'model',
        source: 'equipment',
        filter: ['has', 'model-uri'],
        layout: {
          'model-id': ['get', 'model-uri']
        },
        paint: {
          'model-rotation': [0, 0, ['get', 'rotation']],
          'model-scale': [1, 1, 1],
          'model-type': 'common-3d',
          'model-animations': [
            'case',
            ['has', 'animations'],
            ['get', 'animations'],
            ['literal', []]
          ]
        } as any
      });
    }

    if (!map.getSource('ghost-box')) {
      map.addSource('ghost-box', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      map.addLayer({
        id: 'ghost-box-layer',
        type: 'fill-extrusion',
        source: 'ghost-box',
        filter: ['!', ['has', 'model-uri']],
        paint: {
          'fill-extrusion-color': ['get', 'color'],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.4
        }
      });

      // Ghost model layer
      map.addLayer({
        id: 'ghost-model-layer',
        type: 'model',
        source: 'ghost-box',
        filter: ['has', 'model-uri'],
        layout: {
          'model-id': ['get', 'model-uri']
        },
        paint: {
          'model-rotation': [0, 0, 0],
          'model-scale': [1, 1, 1],
          'model-type': 'common-3d',
          'model-opacity': 0.4,
          'model-animations': [
            'case',
            ['has', 'animations'],
            ['get', 'animations'],
            ['literal', []]
          ]
        } as any
      });
    }
  }, []);

  useEffect(() => {
    if (mapRef.current && targetLocation) {
      mapRef.current.flyTo({
        center: [targetLocation.lng, targetLocation.lat],
        zoom: targetLocation.zoom || 18,
        essential: true
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

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [73.8567, 18.5204], // Pune, India
      zoom: 16,
      pitch: 0,
      bearing: 0,
      antialias: true,
    });

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      },
      defaultMode: 'simple_select'
    });

    map.addControl(draw);
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('style.load', () => {
      setupLayers(map);
    });

    map.on('load', () => {
      mapRef.current = map;
      drawRef.current = draw;
      setupLayers(map);
    });

    map.on('draw.create', (e: any) => {
      const feature = e.features[0];
      if (feature.geometry.type === 'Polygon') {
        callbacks.current.onBoundaryChange(feature.geometry.coordinates[0] as [number, number][]);
      }
    });

    map.on('draw.update', (e: any) => {
      const feature = e.features[0];
      if (feature.geometry.type === 'Polygon') {
        callbacks.current.onBoundaryChange(feature.geometry.coordinates[0] as [number, number][]);
      }
    });

    map.on('draw.delete', () => {
      callbacks.current.onBoundaryChange([]);
    });

    map.on('mousemove', (e) => {
      setHoverCoords([e.lngLat.lng, e.lngLat.lat]);
      callbacks.current.onMapMove(e);
      
      if (!map.getLayer('equipment-layer')) return;

      const features = map.queryRenderedFeatures(e.point, { layers: ['equipment-layer', 'equipment-model-layer'] });
      map.getCanvas().style.cursor = features.length > 0 ? 'pointer' : '';

      if (draggingIdRef.current && callbacks.current.state.originLngLat) {
        const { x, z } = lngLatToMetres([e.lngLat.lng, e.lngLat.lat], callbacks.current.state.originLngLat);
        const snappedX = Math.round(x * 2) / 2;
        const snappedZ = Math.round(z * 2) / 2;
        callbacks.current.onObjectUpdate(draggingIdRef.current, { x: snappedX, z: snappedZ });
      }
    });
    
    // Use mousedown instead of click for more reliable placement and dragging
    map.on('mousedown', (e) => {
      if (!map.getLayer('equipment-layer')) {
        callbacks.current.onMapClick(e);
        return;
      }

      const features = map.queryRenderedFeatures(e.point, { layers: ['equipment-layer', 'equipment-model-layer'] });
      if (features.length > 0) {
        const id = features[0].id as string || features[0].properties?.id;
        callbacks.current.onObjectSelect(id);
        draggingIdRef.current = id;
        map.dragPan.disable();
      } else {
        callbacks.current.onMapClick(e);
        if (!callbacks.current.state.pendingPlacement) {
          callbacks.current.onObjectSelect(null);
        }
      }
    });

    map.on('mouseup', () => {
      draggingIdRef.current = null;
      map.dragPan.enable();
    });
    
    const updateCamera = () => {
      if (!mapRef.current) return;
    };

    map.on('move', updateCamera);
    map.on('zoom', updateCamera);
    map.on('pitch', updateCamera);
    map.on('rotate', updateCamera);

    return () => {
      map.remove();
    };
  }, []);

  // Sync equipment visual
  useEffect(() => {
    if (!mapRef.current || !state.originLngLat) return;
    const map = mapRef.current;
    const source = map.getSource('equipment') as mapboxgl.GeoJSONSource;
    if (!source) return;

    const features = state.objects.map(obj => {
      const def = DEFAULT_LIBRARY.find(d => d.id === obj.type) ?? state.customLibrary.find(d => d.id === obj.type);
      if (!def) return null;

      const lngLat = metresToLngLat(obj.x, obj.z, state.originLngLat!);

      // If model is available, use point geometry for model layer
      if (def.modelUrl) {
        // Register model if not already registered
        if (!map.hasModel(def.modelUrl)) {
          map.addModel(def.modelUrl, def.modelUrl);
        }

        return {
          type: 'Feature',
          id: obj.id,
          geometry: {
            type: 'Point',
            coordinates: [lngLat[0], lngLat[1]]
          },
          properties: {
            id: obj.id,
            color: obj.color || def.color,
            height: def.height,
            'model-uri': def.modelUrl,
            rotation: (obj.rotationY * 180 / Math.PI), // Mapbox model rotation is in degrees
            animations: def.animationsEnabled ? [{ name: '*', state: 'play' }] : []
          }
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
        { x: -halfW, z: -halfD }
      ];

      const rotatedCorners = cornersMetres.map(c => {
        const rx = c.x * Math.cos(obj.rotationY) - c.z * Math.sin(obj.rotationY);
        const rz = c.x * Math.sin(obj.rotationY) + c.z * Math.cos(obj.rotationY);
        return metresToLngLat(obj.x + rx, obj.z + rz, state.originLngLat!);
      });

      return {
        type: 'Feature',
        id: obj.id,
        geometry: {
          type: 'Polygon',
          coordinates: [rotatedCorners]
        },
        properties: {
          id: obj.id,
          color: obj.color || def.color,
          height: def.height
        }
      };
    }).filter(f => f !== null);

    source.setData({
      type: 'FeatureCollection',
      features: features as any
    });

    // Update feature state for selection highlight
    state.objects.forEach(obj => {
      map.setFeatureState(
        { source: 'equipment', id: obj.id },
        { selected: state.selectedId === obj.id }
      );
    });
  }, [state.objects, state.originLngLat, state.selectedId, state.mapStyle]);

  // Sync ghost box
  useEffect(() => {
    if (!mapRef.current || !state.originLngLat || !state.pendingPlacement || !hoverCoords) {
      if (mapRef.current) {
        const source = mapRef.current.getSource('ghost-box') as mapboxgl.GeoJSONSource;
        if (source) source.setData({ type: 'FeatureCollection', features: [] });
      }
      return;
    }

    const map = mapRef.current;
    const source = map.getSource('ghost-box') as mapboxgl.GeoJSONSource;
    if (!source) return;

    const def = state.pendingPlacement;
    const { x, z } = lngLatToMetres(hoverCoords, state.originLngLat);
    const snappedX = Math.round(x * 2) / 2;
    const snappedZ = Math.round(z * 2) / 2;
    const lngLat = metresToLngLat(snappedX, snappedZ, state.originLngLat!);

    if (def.modelUrl) {
      if (!map.hasModel(def.modelUrl)) {
        map.addModel(def.modelUrl, def.modelUrl);
      }

      source.setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lngLat[0], lngLat[1]]
          },
          properties: {
            color: def.color,
            height: def.height,
            'model-uri': def.modelUrl,
            animations: def.animationsEnabled ? [{ name: '*', state: 'play' }] : []
          }
        }] as any
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
      { x: -halfW, z: -halfD }
    ];

    const cornersLngLat = cornersMetres.map(c => metresToLngLat(snappedX + c.x, snappedZ + c.z, state.originLngLat!));

    source.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [cornersLngLat]
        },
        properties: {
          color: def.color,
          height: def.height
        }
      }] as any
    });
  }, [state.pendingPlacement, hoverCoords, state.originLngLat, state.mapStyle]);

  // Sync measurement visual
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clear old markers
    measureMarkersRef.current.forEach(m => m.remove());
    measureMarkersRef.current = [];
    if (measureLineRef.current) measureLineRef.current.remove();
    measureLineRef.current = null;

    if (state.measurePoints.length === 0) {
      const source = map.getSource('measure-line') as mapboxgl.GeoJSONSource;
      if (source) source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    state.measurePoints.forEach((pt, i) => {
      const el = document.createElement('div');
      el.className = 'w-3 h-3 bg-brand-teal border-2 border-white rounded-full shadow-lg';
      const marker = new mapboxgl.Marker(el).setLngLat(pt).addTo(map);
      measureMarkersRef.current.push(marker);
    });

    if (state.measurePoints.length === 2) {
      const p1 = state.measurePoints[0];
      const p2 = state.measurePoints[1];
      const distMeters = turf.distance(turf.point(p1), turf.point(p2), { units: 'meters' });
      const midpoint = turf.midpoint(turf.point(p1), turf.point(p2)).geometry.coordinates as [number, number];

      const source = map.getSource('measure-line') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [p1, p2] },
            properties: {}
          }]
        });
      }

      const label = document.createElement('div');
      label.className = 'bg-white text-brand-navy px-2 py-1 rounded shadow-lg text-[10px] font-bold border border-brand-teal';
      
      if (state.unitSystem === 'imperial') {
        const distFeet = distMeters * 3.28084;
        label.innerText = distFeet.toFixed(1) + 'ft';
      } else {
        label.innerText = distMeters.toFixed(1) + 'm';
      }
      
      const labelMarker = new mapboxgl.Marker(label).setLngLat(midpoint).addTo(map);
      measureLineRef.current = labelMarker;
    }
  }, [state.measurePoints, state.unitSystem]);

  // Sync style
  useEffect(() => {
    if (!mapRef.current) return;
    const style = state.mapStyle === 'streets' ? 'mapbox://styles/mapbox/streets-v12' : 'mapbox://styles/mapbox/satellite-v9';
    mapRef.current.setStyle(style);
  }, [state.mapStyle]);

  // Sync terrain and buildings
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const handleStyleLoad = () => {
      // Terrain
      if (state.terrainEnabled) {
        if (!map.getSource('mapbox-dem')) {
          map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14
          });
        }
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.2 });
        map.easeTo({ pitch: 60 });
      } else {
        map.setTerrain(null);
        map.easeTo({ pitch: 0 });
      }

      // Buildings
      if (map.getLayer('3d-buildings')) {
        map.setLayoutProperty('3d-buildings', 'visibility', state.buildingsEnabled ? 'visible' : 'none');
      } else if (state.buildingsEnabled && state.mapStyle === 'streets') {
        // If layer missing but enabled, re-run setup
        setupLayers(map);
      }
    };

    if (map.isStyleLoaded()) {
      handleStyleLoad();
    } else {
      map.once('style.load', handleStyleLoad);
    }
  }, [state.terrainEnabled, state.buildingsEnabled, state.mapStyle]);

  // Sync readonly boundary and origin marker
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Origin Marker
    if (originMarkerRef.current) originMarkerRef.current.remove();
    if (state.originLngLat) {
      const el = document.createElement('div');
      el.className = 'w-6 h-6 flex items-center justify-center bg-brand-teal rounded-full border-2 border-white shadow-xl animate-pulse';
      el.innerHTML = '<div class="w-2 h-2 bg-white rounded-full"></div>';
      
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML('<div class="text-[10px] font-bold text-brand-navy p-1">BENCHMARK ORIGIN</div>');

      originMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat(state.originLngLat)
        .setPopup(popup)
        .addTo(map);
    }

    if (state.siteBoundary.length < 3) {
      const source = map.getSource('boundary-readonly') as mapboxgl.GeoJSONSource;
      if (source) source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }
    
    const source = map.getSource('boundary-readonly') as mapboxgl.GeoJSONSource;
    if (!source) return;

    // Ensure closed
    const coords = [...state.siteBoundary];
    if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
      coords.push(coords[0]);
    }

    source.setData({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coords]
      },
      properties: {}
    } as any);
  }, [state.siteBoundary, state.originLngLat]);

  // Sync Mapbox Draw mode and visibility based on app state
  useEffect(() => {
    if (!mapRef.current || !drawRef.current) return;
    const map = mapRef.current;
    const isLocked = !!state.pendingPlacement || isMeasuring || state.isBoundaryLocked;

    if (isLocked) {
      drawRef.current.changeMode('simple_select');
    }

    // Toggle visibility of draw layers vs readonly boundary
    const layers = map.getStyle().layers;
    if (layers) {
      layers.forEach(layer => {
        if (layer.id.startsWith('gl-draw-')) {
          map.setLayoutProperty(layer.id, 'visibility', isLocked ? 'none' : 'visible');
        }
      });
    }

    map.setLayoutProperty('boundary-readonly-fill', 'visibility', isLocked ? 'visible' : 'none');
    map.setLayoutProperty('boundary-readonly-stroke', 'visibility', isLocked ? 'visible' : 'none');

  }, [state.pendingPlacement, isMeasuring, state.isBoundaryLocked, state.siteBoundary]);

  // Trigger draw mode
  useEffect(() => {
    if (drawTrigger > 0 && drawRef.current) {
      drawRef.current.changeMode('draw_polygon');
    }
  }, [drawTrigger]);

  // Center map when originLngLat changes (e.g. after import)
  useEffect(() => {
    if (mapRef.current && state.originLngLat) {
      mapRef.current.easeTo({
        center: state.originLngLat,
        zoom: 18,
        duration: 1000
      });
    }
  }, [state.originLngLat]);

  // Sync boundary to Mapbox Draw (for import)
  useEffect(() => {
    if (!drawRef.current || state.siteBoundary.length < 3) return;
    
    const currentFeatures = drawRef.current.getAll().features;
    const hasPolygon = currentFeatures.some(f => f.geometry.type === 'Polygon');
    
    // Only update if draw tool doesn't have the polygon (e.g. after import)
    if (!hasPolygon) {
      const coords = [...state.siteBoundary];
      if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
        coords.push(coords[0]);
      }

      drawRef.current.add({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coords]
        },
        properties: {}
      });
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
