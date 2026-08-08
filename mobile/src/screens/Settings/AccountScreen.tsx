import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";
import { Button } from "@/components/Button";
import { TextField } from "@/components/FormField";
import { useAuthStore } from "@/state/useAuthStore";
import { isCloudConfigured } from "@/services/supabaseClient";
import { syncNow } from "@/services/syncService";
import { getSetting, setSetting } from "@/db/repositories/settingsRepo";

export function AccountScreen() {
  const { colors } = useThemeMode();
  const { session, loaded, init, signUp, signIn, signOut } = useAuthStore();

  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) init();
  }, [loaded, init]);

  useEffect(() => {
    (async () => {
      setLastSyncedAt(await getSetting("lastSyncedAt"));
    })();
  }, [session]);

  if (!isCloudConfigured) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Text style={[typography.subtitle, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
            Cloud sync isn't set up yet
          </Text>
          <Text style={{ color: colors.textSecondary }}>
            The app works fully offline right now. To enable optional cloud sync, backup, and multi-device support,
            follow docs/SUPABASE_SETUP.md in the project and add your Supabase URL and key to mobile/.env.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!loaded) {
    return (
      <SafeAreaView style={[styles.flex, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Missing information", "Enter both an email and a password.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signUp") {
        const { error, needsEmailConfirmation } = await signUp(email, password);
        if (error) {
          Alert.alert("Couldn't sign up", error);
        } else if (needsEmailConfirmation) {
          Alert.alert("Check your email", "Confirm your email address, then sign in.");
          setMode("signIn");
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) Alert.alert("Couldn't sign in", error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const result = await syncNow();
      if (result.ok) {
        const now = new Date().toISOString();
        await setSetting("lastSyncedAt", now);
        setLastSyncedAt(now);
        Alert.alert("Sync complete", `Pushed ${result.pushed}, pulled ${result.pulled} change(s).`);
      } else {
        Alert.alert("Sync failed", result.error ?? "Unknown error");
      }
    } finally {
      setSyncing(false);
    }
  };

  if (session) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[typography.label, { color: colors.textMuted }]}>SIGNED IN AS</Text>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: spacing.xs }]}>
              {session.user.email}
            </Text>
          </View>

          <View style={{ marginTop: spacing.lg }}>
            <Button label={syncing ? "Syncing…" : "Sync Now"} onPress={handleSyncNow} loading={syncing} fullWidth />
          </View>
          {lastSyncedAt && (
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, textAlign: "center" }]}>
              Last synced {new Date(lastSyncedAt).toLocaleString()}
            </Text>
          )}

          <View style={{ marginTop: spacing.xl }}>
            <Button label="Sign Out" variant="danger" onPress={signOut} fullWidth />
          </View>

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.lg }]}>
            Signing out only stops cloud sync — your local collection stays exactly as it is.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.subtitle, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
          {mode === "signIn" ? "Sign In" : "Create Account"}
        </Text>
        <Text style={{ color: colors.textSecondary, marginBottom: spacing.lg }}>
          Optional — enables cloud sync, cloud photo backup, and multi-device support. Your collection works fully
          offline either way.
        </Text>

        <TextField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" />
        <TextField label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" />

        <View style={{ marginTop: spacing.md }}>
          <Button
            label={submitting ? "Please wait…" : mode === "signIn" ? "Sign In" : "Sign Up"}
            onPress={handleSubmit}
            loading={submitting}
            fullWidth
          />
        </View>
        <View style={{ marginTop: spacing.sm }}>
          <Button
            label={mode === "signIn" ? "Need an account? Sign Up" : "Already have an account? Sign In"}
            variant="ghost"
            onPress={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.lg },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
});
