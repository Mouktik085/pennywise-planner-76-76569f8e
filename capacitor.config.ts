import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pennywise.planner',
  appName: 'Pennywise Planner',
  webDir: 'dist',
  server: {
    url: 'https://3bf4ca69-0cfa-4dc2-bd7f-59d22f33b091.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
