import React from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { RootStackParamList } from "./types";
import { BottomTabs } from "./BottomTabs";
import { useThemeMode } from "@/theme/ThemeProvider";

import { ItemDetailsScreen } from "@/screens/Collection/ItemDetailsScreen";
import { ItemEditScreen } from "@/screens/Collection/ItemEditScreen";
import { ScanOptionsScreen } from "@/screens/Scan/ScanOptionsScreen";
import { CameraScanScreen } from "@/screens/Scan/CameraScanScreen";
import { BarcodeScanScreen } from "@/screens/Scan/BarcodeScanScreen";
import { IdentificationResultScreen } from "@/screens/Scan/IdentificationResultScreen";
import { PhotoUploadScreen } from "@/screens/Scan/PhotoUploadScreen";
import { LocationsScreen } from "@/screens/Locations/LocationsScreen";
import { SettingsScreen } from "@/screens/Settings/SettingsScreen";
import { TransactionsListScreen } from "@/screens/Transactions/TransactionsListScreen";
import { AddTransactionScreen } from "@/screens/Transactions/AddTransactionScreen";
import { WishlistEditScreen } from "@/screens/Wishlist/WishlistEditScreen";
import { ReceiptScanScreen } from "@/screens/Scan/ReceiptScanScreen";
import { AccountScreen } from "@/screens/Settings/AccountScreen";
import { ImportExportScreen } from "@/screens/Settings/ImportExportScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { colors, scheme } = useThemeMode();

  const navTheme = {
    ...(scheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      border: colors.border,
      primary: colors.accent,
      text: colors.textPrimary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={BottomTabs} />
        <Stack.Screen
          name="ItemDetails"
          component={ItemDetailsScreen}
          options={{ headerShown: true, title: "Item Details" }}
        />
        <Stack.Screen
          name="ItemEdit"
          component={ItemEditScreen}
          options={{ headerShown: true, title: "Confirm Item", presentation: "modal" }}
        />
        <Stack.Screen
          name="ScanOptions"
          component={ScanOptionsScreen}
          options={{ presentation: "modal", headerShown: true, title: "Scan Item" }}
        />
        <Stack.Screen
          name="CameraScan"
          component={CameraScanScreen}
          options={{ headerShown: false, presentation: "fullScreenModal" }}
        />
        <Stack.Screen
          name="BarcodeScan"
          component={BarcodeScanScreen}
          options={{ headerShown: false, presentation: "fullScreenModal" }}
        />
        <Stack.Screen
          name="IdentificationResult"
          component={IdentificationResultScreen}
          options={{ headerShown: true, title: "Identification Result" }}
        />
        <Stack.Screen
          name="PhotoUpload"
          component={PhotoUploadScreen}
          options={{ headerShown: true, title: "Upload Photo" }}
        />
        <Stack.Screen
          name="Locations"
          component={LocationsScreen}
          options={{ headerShown: true, title: "Locations & Storage" }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ headerShown: true, title: "Settings" }}
        />
        <Stack.Screen
          name="Transactions"
          component={TransactionsListScreen}
          options={{ headerShown: true, title: "Transactions" }}
        />
        <Stack.Screen
          name="AddTransaction"
          component={AddTransactionScreen}
          options={{ headerShown: true, title: "Add Transaction", presentation: "modal" }}
        />
        <Stack.Screen
          name="WishlistEdit"
          component={WishlistEditScreen}
          options={{ headerShown: true, title: "Wishlist Item", presentation: "modal" }}
        />
        <Stack.Screen
          name="ReceiptScan"
          component={ReceiptScanScreen}
          options={{ headerShown: true, title: "Scan Receipt" }}
        />
        <Stack.Screen
          name="Account"
          component={AccountScreen}
          options={{ headerShown: true, title: "Account & Sync" }}
        />
        <Stack.Screen
          name="ImportExport"
          component={ImportExportScreen}
          options={{ headerShown: true, title: "Import / Export" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
