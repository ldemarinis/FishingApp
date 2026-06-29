import React, { useRef, useEffect } from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { getNOAATileUrl } from '../services/noaa';

// Native: @rnmapbox/maps (lazy-loaded to avoid web bundling issues)
let MapboxGL: typeof import('@rnmapbox/maps') | null = null;
if (Platform.OS !== 'web') {
  try { MapboxGL = require('@rnmapbox/maps'); } catch { MapboxGL = null; }
}

interface Props { style?: object }

// ─── Web map using Mapbox GL JS ───────────────────────────────────────────────
function WebMap({ lat, lon, token }: { lat: number; lon: number; token: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // mapbox-gl is available globally on web via the CDN link in +html.tsx,
    // but we can also require it directly since it's installed.
    let mapboxgl: any;
    try { mapboxgl = require('mapbox-gl'); } catch { return; }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [lon, lat],
      zoom: 10,
    });

    mapRef.current = map;

    map.on('load', () => {
      // NOAA Raster Nautical Chart overlay
      map.addSource('noaa-rnc', {
        type: 'raster',
        tiles: [getNOAATileUrl()],
        tileSize: 256,
        minzoom: 4,
        maxzoom: 16,
      });
      map.addLayer({
        id: 'noaa-rnc-layer',
        type: 'raster',
        source: 'noaa-rnc',
        paint: { 'raster-opacity': 0.85 },
      });

      // User location marker
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          new mapboxgl.Marker({ color: '#3a7fbe' })
            .setLngLat([pos.coords.longitude, pos.coords.latitude])
            .addTo(map);
          map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 11 });
        });
      }
    });

    return () => { map.remove(); mapRef.current = null; };
  }, [token, lat, lon]);

  // Update center when location changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [lon, lat], zoom: 11 });
    }
  }, [lat, lon]);

  return (
    // @ts-ignore – div is valid on web only
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
    />
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function MapViewComponent({ style }: Props) {
  const { location, mapboxToken } = useAppStore();
  const lat = location?.lat ?? 27.7676;
  const lon = location?.lon ?? -82.6403;
  const token = mapboxToken || process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';

  // ── Web ──
  if (Platform.OS === 'web') {
    if (!token) {
      return (
        <View style={[styles.fallback, style as any]}>
          <Text style={styles.fallbackText}>Set your Mapbox token in Settings to enable the chart</Text>
        </View>
      );
    }
    return (
      <View style={[{ flex: 1, position: 'relative' as any }, style]}>
        <WebMap lat={lat} lon={lon} token={token} />
      </View>
    );
  }

  // ── Native ──
  if (!MapboxGL) {
    return (
      <View style={[styles.fallback, style as any]}>
        <Text style={styles.fallbackText}>Mapbox unavailable</Text>
      </View>
    );
  }

  if (!token) {
    return (
      <View style={[styles.fallback, style as any]}>
        <Text style={styles.fallbackText}>Set your Mapbox token in Settings</Text>
      </View>
    );
  }

  MapboxGL.setAccessToken(token);
  const { MapView, Camera, RasterLayer, RasterSource, UserLocation } = MapboxGL;

  return (
    <MapView style={[{ flex: 1 }, style]} styleURL={MapboxGL.StyleURL.Dark} compassEnabled scaleBarEnabled={false}>
      <Camera centerCoordinate={[lon, lat]} zoomLevel={10} animationMode="flyTo" animationDuration={1500} />
      <RasterSource id="noaa-rnc" tileUrlTemplates={[getNOAATileUrl()]} tileSize={256} minZoomLevel={4} maxZoomLevel={16}>
        <RasterLayer id="noaa-rnc-layer" sourceID="noaa-rnc" style={{ rasterOpacity: 0.85 }} belowLayerID="waterway-label" />
      </RasterSource>
      <UserLocation visible showsUserHeadingIndicator renderMode="native" />
    </MapView>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: '#0c1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: '#5ba3e0',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
