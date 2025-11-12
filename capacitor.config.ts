import { CapacitorConfig } from '@capacitor/cli';

/**
 * DEVELOPMENT CONFIG (Hot Reload)
 * The app loads from Lovable preview URL for instant updates during development.
 * 
 * FOR PRODUCTION APK: Remove the "server" section or use capacitor.config.production.ts
 * This will make your app work offline and load much faster!
 */

const config: CapacitorConfig = {
  appId: 'com.pennywise.planner',
  appName: 'Pennywise Planner',
  webDir: 'dist',
  server: {
    url: 'https://3bf4ca69-0cfa-4dc2-bd7f-59d22f33b091.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false,
    },
  },
};

export default config;
