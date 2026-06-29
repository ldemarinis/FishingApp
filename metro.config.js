const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Allow metro to resolve .css files (needed for mapbox-gl on web)
config.resolver.assetExts.push('css');

module.exports = withNativeWind(config, { input: './global.css' });
