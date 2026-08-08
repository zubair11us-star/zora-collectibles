import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";
import { Button } from "@/components/Button";
import { SelectField, TextField } from "@/components/FormField";
import { EmptyState } from "@/components/EmptyState";
import {
  createLocation,
  createStorageBox,
  deleteLocation,
  deleteStorageBox,
  listLocations,
  listStorageBoxes,
} from "@/db/repositories/locationsRepo";
import { Location, StorageBox } from "@/types/models";

export function LocationsScreen() {
  const { colors } = useThemeMode();
  const [locations, setLocations] = useState<Location[]>([]);
  const [boxes, setBoxes] = useState<StorageBox[]>([]);
  const [newLocationName, setNewLocationName] = useState("");
  const [newBoxName, setNewBoxName] = useState("");
  const [newBoxLocationId, setNewBoxLocationId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLocations(await listLocations());
    setBoxes(await listStorageBoxes());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const addLocation = async () => {
    if (!newLocationName.trim()) return;
    await createLocation(newLocationName.trim());
    setNewLocationName("");
    load();
  };

  const addBox = async () => {
    if (!newBoxName.trim()) return;
    await createStorageBox(newBoxName.trim(), newBoxLocationId ?? undefined);
    setNewBoxName("");
    load();
  };

  const removeLocation = (id: string, name: string) => {
    Alert.alert(`Remove "${name}"?`, "Storage boxes assigned to this location will remain, but unassigned.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => { await deleteLocation(id); load(); } },
    ]);
  };

  const removeBox = (id: string, name: string) => {
    Alert.alert(`Remove "${name}"?`, undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => { await deleteStorageBox(id); load(); } },
    ]);
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.subtitle, { color: colors.textPrimary, marginBottom: spacing.sm }]}>Locations</Text>
        {locations.length === 0 ? (
          <EmptyState icon="location-outline" title="No locations yet" />
        ) : (
          locations.map((loc) => (
            <View key={loc.id} style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text style={{ color: colors.textPrimary, flex: 1 }}>{loc.name}</Text>
              <Pressable onPress={() => removeLocation(loc.id, loc.name)}>
                <Text style={{ color: colors.danger }}>Remove</Text>
              </Pressable>
            </View>
          ))
        )}
        <View style={styles.addRow}>
          <View style={{ flex: 1 }}>
            <TextField label="New Location" value={newLocationName} onChangeText={setNewLocationName} placeholder="e.g. Home" />
          </View>
          <View style={{ width: spacing.md }} />
          <Button label="Add" onPress={addLocation} />
        </View>

        <Text style={[typography.subtitle, { color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
          Storage Boxes
        </Text>
        {boxes.length === 0 ? (
          <EmptyState icon="archive-outline" title="No storage boxes yet" />
        ) : (
          boxes.map((box) => (
            <View key={box.id} style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary }}>{box.name}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  {locations.find((l) => l.id === box.locationId)?.name ?? "Unassigned"}
                </Text>
              </View>
              <Pressable onPress={() => removeBox(box.id, box.name)}>
                <Text style={{ color: colors.danger }}>Remove</Text>
              </Pressable>
            </View>
          ))
        )}
        <TextField label="New Storage Box" value={newBoxName} onChangeText={setNewBoxName} placeholder="e.g. Pokemon Box 03" />
        <SelectField
          label="At Location"
          value={locations.find((l) => l.id === newBoxLocationId)?.name ?? "None"}
          options={["None", ...locations.map((l) => l.name)]}
          onChange={(name) => setNewBoxLocationId(name === "None" ? null : locations.find((l) => l.name === name)?.id ?? null)}
        />
        <Button label="Add Storage Box" onPress={addBox} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  addRow: { flexDirection: "row", alignItems: "flex-end" },
});
