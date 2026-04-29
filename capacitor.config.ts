import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lavmee.app',
  appName: 'Lavmee',
  webDir: '.next',
  server: {
    androidScheme: 'https',
    url: 'http://localhost:9002'
  }
};

export default config;
