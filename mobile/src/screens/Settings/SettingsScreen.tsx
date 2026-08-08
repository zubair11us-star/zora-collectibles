import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeMode } from "@/theme/ThemeProvider";
import { spacing, typography } from "@/theme/typography";
import { SelectField, TextField } from "@/components/FormField";
import { Button } from "@/components/Button";
import { useSettingsStore } from "@/state/useSettingsStore";
import { SUPPORTED_CURRENCIES } from "@/types/models";
import { exportBackup, pickAndRestoreBackup } from "@/services/backupService";
import { getSetting, setSetting } from "@/db/repositories/settingsRepo";
import { disableReminders, enableReminders, sendTestNotification } from "@/services/notificationService";

export function SettingsScreen() {
  const { colors } = useThemeMode();
  const { settings, update, load } = useSettingsStore();
  const [name, setName] = useState(settings.name);
  const [aiServerUrl, setAiServerUrl] = useState(settings.aiServerUrl);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifBusy, setNotifBusy] = useState(false);

  useEffect(() => {
    load();
    (async () => {
      setNotificationsEnabled((await getSetting("notificationsEnabled")) === "true");
    })();
  }, []);

  useEffect(() => {
    setName(settings.name);
    setAiServerUrl(settings.aiServerUrl);
  }, [settings.name, settings.aiServerUrl]);

  const handleBackupNow = async () => {
    setBackingUp(true);
    try {
      await exportBackup();
    } catch (err) {
      Alert.alert("Backup failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = () => {
    Alert.alert(
      "Restore backup?",
      "This replaces everything currently in your collection with the contents of the backup file. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Choose Backup File",
          style: "destructive",
          onPress: async () => {
            setRestoring(true);
            try {
              const result = await pickAndRestoreBackup();
              if (result.ok) {
                Alert.alert("Restore complete", `Restored ${result.restoredCounts.items ?? 0} item(s).`);
              } else if (result.error !== "No file selected.") {
                Alert.alert("Restore failed", result.error ?? "Unknown error");
              }
            } finally {
              setRestoring(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setNotifBusy(true);
    try {
      if (enabled) {
        await enableReminders();
      } else {
        await disableReminders();
      }
      await setSetting("notificationsEnabled", enabled ? "true" : "false");
      setNotificationsEnabled(enabled);
    } catch (err) {
      Alert.alert("Couldn't update notifications", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setNotifBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.sm }]}>PROFILE</Text>
        <TextField label="Name" value={name} onChangeText={setName} placeholder="Collector" />
        <Button label="Save Name" variant="secondary" onPress={() => update("name", name)} />

        <Text style={[typography.label, { color: colors.textMuted, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
          CURRENCY
        </Text>
        <SelectField
          label="Base Currency"
          value={settings.baseCurrency}
          options={[...SUPPORTED_CURRENCIES]}
          onChange={(v) => update("baseCurrency", v)}
        />

        <Text style={[typography.label, { color: colors.textMuted, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
          APPEARANCE
        </Text>
        <SelectField
          label="Theme"
          value={settings.theme}
          options={["light", "dark", "system"]}
          onChange={(v) => update("theme", v)}
        />

        <Text style={[typography.label, { color: colors.textMuted, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
          AI IDENTIFICATION
        </Text>
        <TextField
          label="AI Server URL"
          value={aiServerUrl}
          onChangeText={setAiServerUrl}
          placeholder="http://192.168.1.42:4000"
        />
        <Button label="Save AI Server URL" variant="secondary" onPress={() => update("aiServerUrl", aiServerUrl)} />
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
          Use your computer's LAN IP address (not "localhost") so your phone can reach the AI proxy server while
          testing with Expo Go.
        </Text>

        <Text style={[typography.label, { color: colors.textMuted, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
          BACKUP
        </Text>
        <Text style={{ color: colors.textSecondary, marginBottom: spacing.sm }}>
          Exports your full inventory as a JSON file you can save anywhere. Protects your collection if you lose or
          replace your phone — independent of cloud sync.
        </Text>
        <Button label={backingUp ? "Preparing…" : "Backup Now"} variant="secondary" onPress={handleBackupNow} loading={backingUp} />
        <View style={{ height: spacing.sm }} />
        <Button label={restoring ? "Restoring…" : "Restore Backup"} variant="danger" onPress={handleRestore} loading={restoring} />

        <Text style={[typography.label, { color: colors.textMuted, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
          NOTIFICATIONS
        </Text>
        <Text style={{ color: colors.textSecondary, marginBottom: spacing.sm }}>
          Occasional local reminders — backup nudges and wishlist check-ins. Nothing is sent to a server.
        </Text>
        <SelectField
          label="Reminders"
          value={notificationsEnabled ? "On" : "Off"}
          options={["Off", "On"]}
          onChange={(v) => handleToggleNotifications(v === "On")}
        />
        {notificationsEnabled && (
          <Button
            label="Send Test Notification"
            variant="secondary"
            onPress={() => sendTestNotification().catch((err) => Alert.alert("Failed", err.message))}
            loading={notifBusy}
          />
        )}

        <View style={{ marginTop: spacing.xxl }}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            Zora — local-first collection management with optional cloud sync, backup, and notifications.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
});
