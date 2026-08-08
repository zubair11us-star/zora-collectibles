import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { BarChart, LineChart } from "react-native-gifted-charts";

import { useThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography } from "@/theme/typography";

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

function ChartCard({ title, children }: ChartCardProps) {
  const { colors } = useThemeMode();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[typography.subtitle, { color: colors.textPrimary, marginBottom: spacing.md }]}>{title}</Text>
      {children}
    </View>
  );
}

export function CategoryValueBarChart({
  data,
}: {
  data: { label: string; value: number; color?: string }[];
}) {
  const { colors } = useThemeMode();
  if (data.length === 0) {
    return (
      <ChartCard title="Value by Category">
        <Text style={{ color: colors.textMuted }}>No items yet.</Text>
      </ChartCard>
    );
  }
  return (
    <ChartCard title="Value by Category">
      <BarChart
        data={data.map((d) => ({ value: d.value, label: d.label, frontColor: d.color ?? colors.accent }))}
        barWidth={22}
        spacing={20}
        roundedTop
        hideRules
        yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        noOfSections={4}
      />
    </ChartCard>
  );
}

export function CategoryCountBarChart({
  data,
}: {
  data: { label: string; value: number; color?: string }[];
}) {
  const { colors } = useThemeMode();
  if (data.length === 0) return null;
  return (
    <ChartCard title="Items by Category">
      <BarChart
        data={data.map((d) => ({ value: d.value, label: d.label, frontColor: d.color ?? colors.info }))}
        barWidth={22}
        spacing={20}
        roundedTop
        hideRules
        yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        noOfSections={4}
      />
    </ChartCard>
  );
}

export function CountryDistributionChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const { colors } = useThemeMode();
  if (data.length === 0) return null;
  return (
    <ChartCard title="Items by Country">
      <BarChart
        data={data.map((d) => ({ value: d.value, label: d.label, frontColor: colors.success }))}
        barWidth={22}
        spacing={20}
        roundedTop
        hideRules
        yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
        noOfSections={4}
      />
    </ChartCard>
  );
}

export function PurchaseVsCurrentChart({
  purchase,
  current,
}: {
  purchase: number;
  current: number;
}) {
  const { colors } = useThemeMode();
  return (
    <ChartCard title="Purchase vs Current Value">
      <BarChart
        data={[
          { value: purchase, label: "Purchase", frontColor: colors.textMuted },
          { value: current, label: "Current", frontColor: colors.success },
        ]}
        barWidth={40}
        spacing={40}
        roundedTop
        hideRules
        yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        noOfSections={4}
      />
    </ChartCard>
  );
}

export function GrowthLineChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const { colors } = useThemeMode();
  if (data.length < 2) {
    return (
      <ChartCard title="Collection Growth">
        <Text style={{ color: colors.textMuted }}>Add more items over time to see growth trends.</Text>
      </ChartCard>
    );
  }
  return (
    <ChartCard title="Collection Growth">
      <LineChart
        data={data.map((d) => ({ value: d.value, label: d.label }))}
        color={colors.accent}
        thickness={2}
        hideRules
        yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        areaChart
        startFillColor={colors.accent}
        endFillColor={colors.accent}
        startOpacity={0.25}
        endOpacity={0.02}
      />
    </ChartCard>
  );
}

export function ValueHistoryChart({
  data,
  currency,
}: {
  data: { label: string; value: number }[];
  currency: string;
}) {
  const { colors } = useThemeMode();
  if (data.length === 0) {
    return (
      <ChartCard title={`Value History (${currency})`}>
        <Text style={{ color: colors.textMuted }}>No valuation history recorded yet.</Text>
      </ChartCard>
    );
  }
  return (
    <ChartCard title={`Value History (${currency})`}>
      <LineChart
        data={data.map((d) => ({ value: d.value, label: d.label }))}
        color={colors.success}
        thickness={2}
        hideRules
        yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
      />
    </ChartCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
});
