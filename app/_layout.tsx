import '../global.css';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    },
  },
});

function WebStyleInjector() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Inject Tailwind CSS
    if (!document.getElementById('tw-styles')) {
      const link = document.createElement('link');
      link.id = 'tw-styles';
      link.rel = 'stylesheet';
      link.href = '/tailwind.css';
      document.head.appendChild(link);
    }

    // Inject Mapbox GL CSS
    if (!document.getElementById('mapbox-styles')) {
      const link = document.createElement('link');
      link.id = 'mapbox-styles';
      link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      document.head.appendChild(link);
    }

    // Base page styles
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.backgroundColor = '#040d1a';
    document.body.style.height = '100%';
    document.documentElement.style.height = '100%';
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <WebStyleInjector />
        <StatusBar style="light" backgroundColor="#0c1a2e" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#040d1a' },
          }}
        />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
