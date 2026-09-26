import { useEffect, useState } from 'react';

export interface GpsFix { lat: number; lon: number; accuracy: number; at: string; }
export interface GpsState { status: 'locating' | 'live' | 'denied' | 'unavailable'; fix: GpsFix | null; }

const KEY = 'fieldguard_last_fix';

function lastKnownFix(): GpsFix | null {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}

/** Watches the device GPS. Keeps the last known fix on this device so reports still carry a position offline. */
export function useGeolocation(): GpsState {
  const [state, setState] = useState<GpsState>(() => ({ status: 'geolocation' in navigator ? 'locating' : 'unavailable', fix: lastKnownFix() }));
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      pos => {
        const fix = { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy, at: new Date(pos.timestamp).toISOString() };
        try { localStorage.setItem(KEY, JSON.stringify(fix)); } catch { /* storage blocked */ }
        setState({ status: 'live', fix });
      },
      err => setState(s => ({ ...s, status: err.code === err.PERMISSION_DENIED ? 'denied' : s.status === 'live' ? 'live' : 'unavailable' })),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);
  return state;
}

export function formatFix(fix: GpsFix): string {
  const lat = `${Math.abs(fix.lat).toFixed(5)}° ${fix.lat >= 0 ? 'N' : 'S'}`;
  const lon = `${Math.abs(fix.lon).toFixed(5)}° ${fix.lon >= 0 ? 'E' : 'W'}`;
  return `${lat}, ${lon} ±${Math.round(fix.accuracy)}m`;
}

export function describeGps(gps: GpsState): string {
  if (gps.fix) return gps.status === 'live' ? formatFix(gps.fix) : `${formatFix(gps.fix)} (last known)`;
  if (gps.status === 'denied') return 'GPS permission denied';
  if (gps.status === 'unavailable') return 'GPS unavailable';
  return 'Acquiring GPS…';
}

export function mapsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}
