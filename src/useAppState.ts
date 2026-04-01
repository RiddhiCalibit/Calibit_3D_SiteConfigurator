import { useState, useEffect, useCallback } from 'react';
import { AppState, EquipmentDef, EquipmentObject, DEFAULT_LIBRARY } from './types';
import { v4 as uuidv4 } from 'uuid';

export function useAppState() {
  const [state, setState] = useState<AppState>({
    siteBoundary: [],
    originLngLat: null,
    objects: [],
    selectedId: null,
    terrainEnabled: false,
    buildingsEnabled: false,
    mapStyle: 'streets',
    pendingPlacement: null,
    measurePoints: [],
    isBoundaryLocked: false,
    customLibrary: [],
    unitSystem: 'metric',
  });

  const setBoundary = useCallback((coords: [number, number][]) => {
    setState(prev => ({
      ...prev,
      siteBoundary: coords,
      originLngLat: coords.length > 0 ? coords[0] : null,
      // Do not clear objects, they move relative to the origin (first point)
    }));
  }, []);

  const toggleBoundaryLock = useCallback(() => {
    setState(prev => ({ ...prev, isBoundaryLocked: !prev.isBoundaryLocked }));
  }, []);

  const addObject = useCallback((type: string, x: number, z: number, color?: string) => {
    const newObject: EquipmentObject = {
      id: uuidv4(),
      type,
      x,
      z,
      rotationY: 0,
      color,
    };
    setState(prev => ({
      ...prev,
      objects: [...prev.objects, newObject],
      pendingPlacement: null,
    }));
  }, []);

  const updateObject = useCallback((id: string, updates: Partial<EquipmentObject>) => {
    setState(prev => ({
      ...prev,
      objects: prev.objects.map(obj => obj.id === id ? { ...obj, ...updates } : obj),
    }));
  }, []);

  const removeObject = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      objects: prev.objects.filter(obj => obj.id !== id),
      selectedId: prev.selectedId === id ? null : prev.selectedId,
    }));
  }, []);

  const selectObject = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedId: id }));
  }, []);

  const setMapStyle = useCallback((style: 'streets' | 'satellite') => {
    setState(prev => ({ ...prev, mapStyle: style }));
  }, []);

  const toggleTerrain = useCallback(() => {
    setState(prev => ({ ...prev, terrainEnabled: !prev.terrainEnabled }));
  }, []);

  const toggleBuildings = useCallback(() => {
    setState(prev => ({ ...prev, buildingsEnabled: !prev.buildingsEnabled }));
  }, []);

  const setPendingPlacement = useCallback((def: EquipmentDef | null) => {
    setState(prev => ({ ...prev, pendingPlacement: def }));
  }, []);

  const setObjects = useCallback((objects: EquipmentObject[]) => {
    setState(prev => ({ ...prev, objects }));
  }, []);

  const setMeasurePoints = useCallback((points: [number, number][]) => {
    setState(prev => ({ ...prev, measurePoints: points }));
  }, []);

  const addCustomEquipment = useCallback((def: EquipmentDef) => {
    setState(prev => ({
      ...prev,
      customLibrary: [...prev.customLibrary, def]
    }));
  }, []);

  const setCustomLibrary = useCallback((library: EquipmentDef[]) => {
    setState(prev => ({ ...prev, customLibrary: library }));
  }, []);

  const setUnitSystem = useCallback((unit: 'metric' | 'imperial') => {
    setState(prev => ({ ...prev, unitSystem: unit }));
  }, []);

  return {
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
    setPendingPlacement,
    setMeasurePoints,
    addCustomEquipment,
    setCustomLibrary,
    setUnitSystem,
  };
}
