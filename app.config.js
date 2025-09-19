import 'dotenv/config';

export default {
  expo: {
    name: "InstaAid Driver",
    slug: "driverapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logo.png",
    scheme: "acme",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    developmentClient: {
      silentLaunch: true
    },
    splash: {
      image: "./assets/images/logo.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    platforms: [
      "ios",
      "android"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.instaaid.driver",
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "This app uses location to show your position on the map and to help you find rides nearby.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "This app needs background location access to notify you of nearby emergency requests even when the app is closed.",
        NSLocationAlwaysUsageDescription: "This app needs background location access to notify you of nearby emergency requests even when the app is closed.",
        UIBackgroundModes: ["location", "background-fetch", "remote-notification"],
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      package: "com.instaaid.driver",
      edgeToEdgeEnabled: true,
      permissions: [
        "android.permission.RECEIVE_SMS",
        "android.permission.READ_SMS",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_BACKGROUND_LOCATION",
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.CALL_PHONE",
        "android.permission.VIBRATE",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.WAKE_LOCK"
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      },
      compileSdkVersion: 34,
      targetSdkVersion: 34,
      adaptiveIcon: {
        foregroundImage: "./assets/images/logo.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/logo.png"
    },
    plugins: [
      "expo-location",
      "expo-router",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          icon: "./assets/images/logo.png",
          color: "#0066CC",
          sounds: ["./assets/sounds/notification.wav"],
          mode: "development"
        }
      ],
      [
        "expo-background-fetch",
        {
          backgroundFetchInterval: 60
        }
      ],
      "expo-task-manager"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        "projectId": "a5dae13a-8828-49d1-8f21-d8d13037fd49"
      },
      EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
    }
  }
};
