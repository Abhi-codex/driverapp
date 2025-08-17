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
      bundleIdentifier: "com.dhruva12.instaaid.driver",
      googleServicesFile: "./GoogleService-Info.plist",
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "This app uses location to show your position on the map and to help you find rides nearby.",
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      package: "com.dhruva12.instaaid.driver",
      googleServicesFile: "./google-services.json",
      edgeToEdgeEnabled: true,
      permissions: [
        "android.permission.RECEIVE_SMS",
        "android.permission.READ_SMS",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.CALL_PHONE"
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
      "@react-native-firebase/app",
      [
        "@react-native-firebase/auth",
        {
          "android": {
            "requestVerificationCodeAutomatically": true,
            "forceRecaptchaFlowForTesting": __DEV__ ? true : false
          },
          "ios": {
            "requestVerificationCodeAutomatically": true
          }
        }
      ],
      "expo-location"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        "projectId": "3e15ce98-13c4-412b-b8a8-69a46ff33a7a"
      },
      EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
    }
  }
};
