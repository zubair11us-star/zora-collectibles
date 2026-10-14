import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { ThemeProvider, useThemeMode } from "@/theme/ThemeProvider";
import { RootNavigator } from "@/navigation/RootNavigator";
import { initDatabase } from "@/db/client";
import { ensureDemoDataSeeded } from "@/services/seedDemoData";
import { useAuthStore } from "@/state/useAuthStore";
import { syncNow } from "@/services/syncService";

function AppShell() {
  const { scheme } = useThemeMode();
  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        await ensureDemoDataSeeded();
        setReady(true);
      } catch (e) {
        console.error("Failed to initialize app", e);
        setError(e instanceof Error ? e.message : "Unknown startup error");
        return;
      }

      // Best-effort, silent auto-sync on launch when already signed in.
      // Deliberately outside the block above and its own try/catch — auth/
      // sync failures (bad Supabase config, no network) must never block
      // the app from starting. Account screen surfaces sync failures
      // explicitly when the user taps "Sync Now" themselves.
      try {
        await useAuthStore.getState().init();
        if (useAuthStore.getState().session) {
          syncNow().catch(() => {});
        }
      } catch (e) {
        console.error("Auth init failed (non-fatal)", e);
      }
    })();
  }, []);

  if (error) {
    return (
      <GestureHandlerRootView style={styles.flexFill}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Zora failed to start</Text>
          <Text style={styles.errorBody}>{error}</Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  if (!ready) {
    return (
      <GestureHandlerRootView style={styles.flexFill}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flexFill}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flexFill: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F172A",
    padding: 24,
  },
  errorTitle: {
    color: "#F87171",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  errorBody: {
    color: "#CBD5E1",
    fontSize: 14,
    textAlign: "center",
  },
});
