import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";
import { Button } from "@/components/Button";
import { SelectField } from "@/components/FormField";
import {
  EXPORT_FIELDS,
  exportCollectionAsCsv,
  exportCollectionAsJson,
  importRows,
  pickImportFile,
  PickedImportFile,
} from "@/services/collectionExportService";

const MAPPING_OPTIONS = ["Skip", ...EXPORT_FIELDS];

function guessMapping(header: string): string {
  const normalized = header.trim().toLowerCase().replace(/[\s_-]/g, "");
  const match = EXPORT_FIELDS.find((f) => f.toLowerCase() === normalized);
  return match ?? "Skip";
}

export function ImportExportScreen() {
  const { colors } = useThemeMode();
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<PickedImportFile | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const runExport = async (fn: () => Promise<string>) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      Alert.alert("Export failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  const handlePickFile = async () => {
    setBusy(true);
    try {
      const result = await pickImportFile();
      if (!result) return;
      setPicked(result);
      if (result.isCsv && result.csvHeaders) {
        const initialMapping: Record<string, string> = {};
        for (const header of result.csvHeaders) initialMapping[header] = guessMapping(header);
        setMapping(initialMapping);
      }
    } catch (err) {
      Alert.alert("Couldn't read file", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  const handleImportJson = async () => {
    if (!picked?.jsonRows) return;
    setBusy(true);
    try {
      const count = await importRows(picked.jsonRows as Record<string, string>[]);
      Alert.alert("Import complete", `Added ${count} item(s) to your collection.`);
      setPicked(null);
    } catch (err) {
      Alert.alert("Import failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  const handleImportCsv = async () => {
    if (!picked?.csvRows) return;
    const mappedFields = Object.values(mapping).filter((v) => v !== "Skip");
    if (!mappedFields.includes("name")) {
      Alert.alert("Missing mapping", 'At least one column must be mapped to "name".');
      return;
    }
    setBusy(true);
    try {
      const remapped = picked.csvRows.map((row) => {
        const out: Record<string, string> = {};
        for (const [header, target] of Object.entries(mapping)) {
          if (target !== "Skip") out[target] = row[header];
        }
        return out;
      });
      const count = await importRows(remapped);
      Alert.alert("Import complete", `Added ${count} item(s) to your collection.`);
      setPicked(null);
    } catch (err) {
      Alert.alert("Import failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.sm }]}>EXPORT</Text>
        <Text style={{ color: colors.textSecondary, marginBottom: spacing.md }}>
          Exports the common fields for every item (category-specific details like a card's rarity are only in the
          JSON format). For a full-fidelity backup including every field, use Settings → Backup Now instead.
        </Text>
        <View style={styles.row2}>
          <View style={styles.col}>
            <Button label="Export as CSV" variant="secondary" onPress={() => runExport(exportCollectionAsCsv)} loading={busy} fullWidth />
          </View>
          <View style={{ width: spacing.md }} />
          <View style={styles.col}>
            <Button label="Export as JSON" variant="secondary" onPress={() => runExport(exportCollectionAsJson)} loading={busy} fullWidth />
          </View>
        </View>

        <Text style={[typography.label, { color: colors.textMuted, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
          IMPORT
        </Text>
        <Text style={{ color: colors.textSecondary, marginBottom: spacing.md }}>
          Import from a CSV or JSON file. Each row becomes a new item — this adds to your collection, it doesn't
          replace it.
        </Text>
        <Button label="Choose File to Import" onPress={handlePickFile} loading={busy} fullWidth />

        {picked && !picked.isCsv && picked.jsonRows && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: spacing.md }]}>
            <Text style={{ color: colors.textPrimary, marginBottom: spacing.sm }}>
              {picked.fileName}: {picked.jsonRows.length} row(s) found.
            </Text>
            <Button label={`Import ${picked.jsonRows.length} Item(s)`} onPress={handleImportJson} loading={busy} fullWidth />
          </View>
        )}

        {picked && picked.isCsv && picked.csvHeaders && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: spacing.md }]}>
            <Text style={{ color: colors.textPrimary, marginBottom: spacing.md }}>
              {picked.fileName}: {picked.csvRows?.length ?? 0} row(s). Map each column to a Zora field:
            </Text>
            {picked.csvHeaders.map((header) => (
              <SelectField
                key={header}
                label={header}
                value={mapping[header] ?? "Skip"}
                options={MAPPING_OPTIONS}
                onChange={(value) => setMapping((m) => ({ ...m, [header]: value }))}
              />
            ))}
            <Button
              label={`Import ${picked.csvRows?.length ?? 0} Item(s)`}
              onPress={handleImportCsv}
              loading={busy}
              fullWidth
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  row2: { flexDirection: "row" },
  col: { flex: 1 },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
});
