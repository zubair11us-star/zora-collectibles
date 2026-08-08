import React, { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  multiline?: boolean;
}

export function TextField({ label, value, onChangeText, placeholder, keyboardType, multiline }: TextFieldProps) {
  const { colors } = useThemeMode();
  return (
    <View style={styles.wrap}>
      <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.xs }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[
          styles.input,
          multiline && { height: 90, textAlignVertical: "top" },
          { color: colors.textPrimary, backgroundColor: colors.surfaceAlt, borderColor: colors.border },
        ]}
      />
    </View>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

// Short lists (theme, priority, ...) read better as a row of tap-to-select
// chips. Longer lists (category, currency, condition, storage boxes, ...)
// become an unwieldy wall of wrapping chips, so those open a proper modal
// picker instead — same props, so every existing call site upgrades for
// free.
const CHIP_THRESHOLD = 5;
const SEARCH_THRESHOLD = 8;

export function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  const { colors } = useThemeMode();

  if (options.length <= CHIP_THRESHOLD) {
    return (
      <View style={styles.wrap}>
        <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.xs }]}>{label}</Text>
        <View style={styles.chipRow}>
          {options.map((option) => {
            const selected = option === value;
            return (
              <Pressable
                key={option}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  onChange(option);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? colors.accent : colors.surfaceAlt,
                    borderColor: selected ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text style={{ color: selected ? "#FFFFFF" : colors.textPrimary, fontSize: 12, fontWeight: "600" }}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return <PickerField label={label} value={value} options={options} onChange={onChange} />;
}

function PickerField({ label, value, options, onChange }: SelectFieldProps) {
  const { colors } = useThemeMode();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.trim().toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, search]);

  const close = () => {
    setOpen(false);
    setSearch("");
  };

  return (
    <View style={styles.wrap}>
      <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing.xs }]}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.pickerRow, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
      >
        <Text style={{ color: colors.textPrimary, fontSize: 14, flex: 1 }} numberOfLines={1}>
          {value || "Select…"}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.md }]}>{label}</Text>

            {options.length > SEARCH_THRESHOLD && (
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search…"
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderColor: colors.border }]}
              />
            )}

            <FlatList
              data={filtered}
              keyExtractor={(o) => o}
              style={{ maxHeight: 360 }}
              renderItem={({ item: option }) => {
                const selected = option === value;
                return (
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      onChange(option);
                      close();
                    }}
                    style={[styles.optionRow, { borderColor: colors.border }]}
                  >
                    <Text style={{ color: selected ? colors.accent : colors.textPrimary, fontSize: 15, fontWeight: selected ? "700" : "400" }}>
                      {option}
                    </Text>
                    {selected && <Ionicons name="checkmark" size={18} color={colors.accent} />}
                  </Pressable>
                );
              }}
              ListEmptyComponent={<Text style={{ color: colors.textMuted, padding: spacing.md }}>No matches.</Text>}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: "75%",
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 40,
    marginBottom: spacing.sm,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
