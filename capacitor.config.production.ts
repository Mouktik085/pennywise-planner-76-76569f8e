import { CapacitorConfig } from '@capacitor/cli';

/**
 * PRODUCTION CONFIG
 * Use this config when building APK for distribution
 * 
 * To use this config:
 * 1. Rename this file to capacitor.config.ts
 * 2. Run: npm run build
 * 3. Run: npx cap sync
 * 4. Build your APK in Android Studio
 * 
 * This removes the dev server URL so your app works offline!
 */

const config: CapacitorConfig = {
  appId: 'com.pennywise.planner',
  appName: 'Pennywise Planner',
  webDir: 'dist',
  // No server config = production mode (works offline)
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false,
    },
  },
};

export default config;
