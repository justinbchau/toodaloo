// Dynamic Expo config.
//
// Both app.json and app.config.js are read by Expo: app.json is loaded first and
// passed in here as `config`, and the object returned below is the final merged
// config. We use this indirection so the known-good static iOS setup in app.json
// stays untouched, and we only *layer on* the Android platform config plus
// build-time values that need environment variables (e.g. the Google Maps key).

const LOCATION_PERMISSION =
  'Allow toodaloo to use your location to find bathrooms near you.';

module.exports = ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    infoPlist: {
      ...(config.ios && config.ios.infoPlist),
      NSLocationWhenInUseUsageDescription: LOCATION_PERMISSION,
    },
  },
  android: {
    ...config.android,
    package: 'com.jchau.toodaloo',
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
    config: {
      ...(config.android && config.android.config),
      googleMaps: {
        // react-native-maps needs a Google Maps API key on Android. Supply it via
        // the GOOGLE_MAPS_ANDROID_API_KEY env var (locally in .env, or as an EAS
        // secret). Without it the app still builds, but the Android map is blank.
        apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY || '',
      },
    },
  },
  plugins: [
    ...(config.plugins || []),
    // Declares foreground-location usage strings (iOS) and permissions (Android).
    ['expo-location', { locationWhenInUsePermission: LOCATION_PERMISSION }],
  ],
});
