import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId:   process.env.VITE_APP_ID    ?? 'com.dtschedule.app',
  appName: process.env.VITE_BRAND_NAME ?? 'Dynamic Team Schedule',
  webDir:  'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor:    '#0a0b10',
      showSpinner:        false,
    },
  },
}

export default config
