import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeMode } from "@/theme/ThemeProvider";
import { spacing, typography } from "@/theme/typography";
import { Button } from "@/components/Button";
import { SelectField, TextField } from "@/components/FormField";
import { addTransaction } from "@/db/repositories/transactionsRepo";
import { SUPPORTED_CURRENCIES, TransactionType } from "@/types/models";
import { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type AddTxRoute = RouteProp<RootStackParamList, "AddTransaction">;

const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: "purchase", label: "Purchase" },
  { value: "sale", label: "Sale" },
  { value: "trade", label: "Trade" },
  { value: "gift_received", label: "Gift Received" },
  { value: "gift_given", label: "Gift Given" },
  { value: "found", label: "Found" },
  { value: "lost", label: "Lost" },
  { value: "damaged", label: "Damaged" },
];

export function AddTransactionScreen() {
  const { colors } = useThemeMode();
  const navigation = useNavigation<Nav>();
  const route = useRoute<AddTxRoute>();

  const [type, setType] = useState<TransactionType>("purchase");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [counterparty, setCounterparty] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [quantity, setQuantity] = useState("1");
  const [fees, setFees] = useState("");
  const [shipping, setShipping] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const counterpartyLabel = type === "sale" ? "Buyer" : type === "purchase" ? "Seller" : "Counterparty";
  const priceLabel = type === "sale" ? "Selling Price" : "Price";

  const handleSave = async () => {
    setSaving(true);
    try {
      await addTransaction({
        itemId: route.params.itemId,
        type,
        date: new Date(date).toISOString(),
        counterparty: counterparty || undefined,
        price: price ? Number(price) : undefined,
        currency,
        quantity: quantity ? Number(quantity) : 1,
        fees: fees ? Number(fees) : undefined,
        shipping: shipping ? Number(shipping) : undefined,
        notes: notes || undefined,
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert("Couldn't save transaction", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing.md }]}>
          For {route.params.itemName}
        </Text>

        <SelectField
          label="Transaction Type"
          value={TRANSACTION_TYPES.find((t) => t.value === type)?.label ?? "Purchase"}
          options={TRANSACTION_TYPES.map((t) => t.label)}
          onChange={(label) => {
            const found = TRANSACTION_TYPES.find((t) => t.label === label);
            if (found) setType(found.value);
          }}
        />
        <TextField label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
        <TextField label={counterpartyLabel} value={counterparty} onChangeText={setCounterparty} />
        <TextField label={priceLabel} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
        <SelectField label="Currency" value={currency} options={[...SUPPORTED_CURRENCIES]} onChange={setCurrency} />
        <TextField label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
        <TextField label="Fees" value={fees} onChangeText={setFees} keyboardType="decimal-pad" />
        <TextField label="Shipping" value={shipping} onChangeText={setShipping} keyboardType="decimal-pad" />
        <TextField label="Notes" value={notes} onChangeText={setNotes} multiline />

        <Button label={saving ? "Saving…" : "Save Transaction"} onPress={handleSave} loading={saving} fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: 0 },
});
