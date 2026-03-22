/**
 * 动态配置：在 Metro / EAS 执行时先加载 .env，再统一规范化 API 地址。
 * 这样 eas.json 注入的 EXPO_PUBLIC_API_BASE_URL 与本地 Expo Go 使用的 .env 语义一致，
 * 且打进 JS 包里的值与 extra.apiBaseUrl 同源（避免「Go 连 A、APK 连 B」）。
 */
require('dotenv').config();

const DEFAULT_API = 'http://8.162.9.49:3000';
const raw = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim().replace(/\/$/, '');
const apiBaseUrl = raw.length > 0 ? raw : DEFAULT_API;
process.env.EXPO_PUBLIC_API_BASE_URL = apiBaseUrl;

module.exports = {
  expo: {
    name: 'testapp',
    slug: 'testapp',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'testapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
        },
      },
    },
    android: {
      usesCleartextTraffic: true,
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.zmj66.testapp',
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-build-properties',
        {
          android: {
            usesCleartextTraffic: true,
          },
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
      'expo-secure-store',
    ],
    experiments: {
      typedRoutes: true,
      // 关闭 React Compiler：release 包与 Expo Go 的编译路径更一致，减少「仅在一端复现」的差异
      reactCompiler: false,
    },
    extra: {
      router: {},
      eas: {
        projectId: '2302c471-bdbf-40f4-b790-9203c331fbd2',
      },
      apiBaseUrl,
    },
  },
};
