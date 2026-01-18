import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rekalcula.app',
  appName: 'reKalcula',
  webDir: 'out',
  
  // ✅ RESTAURADO: server.url para cargar desde Vercel
  server: {
    url: 'https://rekalcula-99qi.vercel.app',    cleartext: false,
    androidScheme: 'https'
  },
  
  plugins: {
    // Configuración del plugin de Cámara
    Camera: {
      permissions: ['camera', 'photos']
    },
    // Configuración de Notificaciones Push
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    // Configuración del plugin de Sistema de Archivos
    Filesystem: {
      directory: 'Documents'
    },
    // Configuración de la Splash Screen
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#262626',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerStyle: 'large',
      spinnerColor: '#3B82F6',
      splashFullScreen: true,
      splashImmersive: true
    },
    // Configuración de la barra de estado
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#262626'
    }
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true
  }
};

export default config;