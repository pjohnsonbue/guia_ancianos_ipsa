import React from "react";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
import HomeScreen from "../screens/HomeScreen";
import PracticeScreen from "../screens/PracticeScreen";
import ExamScreen from "../screens/ExamScreen";
import ExamResultScreen from "../screens/ExamResultScreen";
import SettingsScreen from "../screens/SettingsScreen";
import VideoScreen from "../screens/VideoScreen";
import ReadingScreen from "../screens/ReadingScreen";
import ReaderScreen from "../screens/ReaderScreen";
import { useAppState } from "../state/AppState";
import { theme } from "../theme/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { loading } = useAppState();

  // Wait for AppState's AsyncStorage read (a frame or two) so Home's
  // progress bars and the Simulacro best score don't flash in empty.
  if (loading) return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Practice" component={PracticeScreen} />
        {/* No swipe-back during an exam: leaving goes through the confirm
            dialog in ExamScreen so a stray gesture can't discard progress. */}
        <Stack.Screen name="Exam" component={ExamScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="ExamResult" component={ExamResultScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Reading" component={ReadingScreen} />
        <Stack.Screen name="Reader" component={ReaderScreen} />
        <Stack.Screen
          name="Video"
          component={VideoScreen}
          options={{ presentation: "fullScreenModal", animation: "slide_from_bottom", contentStyle: { backgroundColor: "#000" } }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
