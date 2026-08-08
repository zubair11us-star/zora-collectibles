import React from "react";
import { StyleSheet, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { ComponentProps } from "react";

import { BottomTabParamList } from "./types";
import { useThemeMode } from "@/theme/ThemeProvider";
import { DashboardScreen } from "@/screens/Home/DashboardScreen";
import { CollectionListScreen } from "@/screens/Collection/CollectionListScreen";
import { WishlistScreen } from "@/screens/Wishlist/WishlistScreen";
import { MoreScreen } from "@/screens/Settings/MoreScreen";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const Tab = createBottomTabNavigator<BottomTabParamList>();

// Placeholder screen for the center tab slot — it's never actually rendered
// because the tabPress listener intercepts navigation and opens the Scan
// Options sheet on the root stack instead.
function ScanPlaceholder() {
  return <View />;
}

function TabIcon({
  focused,
  color,
  activeName,
  inactiveName,
}: {
  focused: boolean;
  color: string;
  activeName: IoniconName;
  inactiveName: IoniconName;
}) {
  return <Ionicons name={focused ? activeName : inactiveName} size={22} color={color} />;
}

function ScanButton() {
  const { colors } = useThemeMode();
  return (
    <View style={styles.scanButtonWrap}>
      <View style={[styles.scanButton, { backgroundColor: colors.accent }]}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </View>
    </View>
  );
}

export function BottomTabs() {
  const { colors } = useThemeMode();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.tabBarBackground, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} activeName="home" inactiveName="home-outline" />
          ),
        }}
      />
      <Tab.Screen
        name="Collection"
        component={CollectionListScreen}
        options={{
          tabBarLabel: "Collection",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} activeName="albums" inactiveName="albums-outline" />
          ),
        }}
      />
      <Tab.Screen
        name="ScanTab"
        component={ScanPlaceholder}
        options={{
          tabBarLabel: "",
          tabBarIcon: () => <ScanButton />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            navigation.getParent()?.navigate("ScanOptions");
          },
        })}
      />
      <Tab.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          tabBarLabel: "Wishlist",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} activeName="star" inactiveName="star-outline" />
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarLabel: "More",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} activeName="ellipsis-horizontal-circle" inactiveName="ellipsis-horizontal-circle-outline" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  scanButtonWrap: {
    top: -18,
    alignItems: "center",
    justifyContent: "center",
  },
  scanButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
