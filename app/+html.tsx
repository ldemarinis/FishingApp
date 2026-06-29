import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        {/* Mapbox GL JS */}
        <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet" />
        {/* Tailwind utility classes for NativeWind web */}
        <link href="/tailwind.css" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          html, body, #root { height: 100%; background: #040d1a; margin: 0; padding: 0; }
          * { box-sizing: border-box; }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
