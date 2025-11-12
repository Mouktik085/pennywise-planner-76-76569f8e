import { CapacitorConfig } from '@capacitor/cli';

/**
 * PRODUCTION CONFIG
 * App works offline and loads instantly from local bundle.
 * All security fixes applied and ready for APK distribution.
 */

const config: CapacitorConfig = {
  appId: 'com.pennywise.planner',
  appName: 'Pennywise Planner',
  webDir: 'dist',
  // No server config = production mode (offline capable)
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false,
    },
  },
};

export default config;
