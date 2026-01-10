import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rekalcula.app',
  appName: 'reKalcula',
  webDir: 'out',
  server: {
    // URL de producción - la app cargará desde tu servidor Vercel
    url: 'https://rekalcula-99qi-fskondp8u-rekalculas-projects.vercel.app',
    cleartext: false,
    // Permite que la app funcione como un navegador web apuntando a tu servidor
    androidScheme: 'https'
  },
  plugins: {
    // Configuración del plugin de Cámara
    Camera: {
      // Permisos de cámara
      permissions: ['camera', 'photos']
    },
    // Configuración de Notificaciones Push
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    // Configuración del plugin de Sistema de Archivos
    Filesystem: {
      // Directorio por defecto para guardar archivos
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
    // Permitir contenido mixto si es necesario
    allowMixedContent: false,
    // Usar la versión más reciente de WebView
    webContentsDebuggingEnabled: false
  },
  ios: {
    // Configuración específica de iOS
    contentInset: 'automatic',
    scrollEnabled: true
  }
};

export default config;