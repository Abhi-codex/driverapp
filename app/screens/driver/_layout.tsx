import { Stack } from "expo-router";

export default function DriverLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false, title: "Driver Login" }} />
      <Stack.Screen name="profile" options={{ headerShown: false, title: "Profile Setup" }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false, title: "Driver Dashboard" }}/>
      <Stack.Screen name="map" options={{ headerShown: false, title: "Driver Map" }}/>
    </Stack>
  );
}
