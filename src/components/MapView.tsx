import React, { useRef, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { getNOAATileUrl } from '../services/noaa';

// Mapbox is native-only; on web we render a placeholder map
// On native, we use @rnmapbox/maps
let MapboxGL: typeof import('@rnmapbox/maps') | null = null;
if (Platform.OS !== 'web') {
  try {
    MapboxGL = require('@rnmapbox/maps');
  } catch {
    MapboxGL = null;
  }
}

interface MapViewComponentProps {
  style?: object;
}

export function MapViewComponent({ style }: MapViewComponentProps) {
  const { location, mapboxToken } = useAppStore();
  const lat = location?.lat ?? 27.7676;
  const lon = location?.lon ?? -82.6403;

  // Initialize Mapbox token
  useEffect(() => {
    if (MapboxGL && mapboxToken) {
      MapboxGL.setAccessToken(mapboxToken);
    }
  }, [mapboxToken]);

  if (Platform.OS === 'web') {
    return (
      <View
        className="bg-ocean-900 items-center justify-center"
        style={[{ flex: 1 }, style]}
      >
        <Text className="text-ocean-300 text-sm">
          Map view available on iOS/Android
        </Text>
        <Text className="text-ocean-400 text-xs mt-1">
          {lat.toFixed(4)}°N, {Math.abs(lon).toFixed(4)}°W
        </Text>
      </View>
    );
  }

  if (!MapboxGL) {
    return (
      <View
        className="bg-ocean-900 items-center justify-center"
        style={[{ flex: 1 }, style]}
      >
        <Text className="text-ocean-300 text-sm">Mapbox not configured</Text>
      </View>
    );
  }

  if (!mapboxToken) {
    return (
      <View
        className="bg-ocean-900 items-center justify-center"
        style={[{ flex: 1 }, style]}
      >
        <Text className="text-ocean-300 text-sm">
          Set your Mapbox token in Settings
        </Text>
      </View>
    );
  }

  const { MapView, Camera, RasterLayer, RasterSource, UserLocation } = MapboxGL;

  return (
    <MapView
      style={[{ flex: 1 }, style]}
      styleURL={MapboxGL.StyleURL.Dark}
      compassEnabled
      scaleBarEnabled={false}
    >
      <Camera
        centerCoordinate={[lon, lat]}
        zoomLevel={10}
        animationMode="flyTo"
        animationDuration={1500}
      />

      {/* NOAA Raster Nautical Chart overlay */}
      <RasterSource
        id="noaa-rnc"
        tileUrlTemplates={[getNOAATileUrl()]}
        tileSize={256}
        minZoomLevel={4}
        maxZoomLevel={16}
      >
        <RasterLayer
          id="noaa-rnc-layer"
          sourceID="noaa-rnc"
          style={{ rasterOpacity: 0.85 }}
          belowLayerID="waterway-label"
        />
      </RasterSource>

      {/* User location dot */}
      <UserLocation
        visible
        showsUserHeadingIndicator
        renderMode="native"
      />
    </MapView>
  );
}
