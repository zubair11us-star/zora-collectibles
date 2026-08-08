import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const BACKUP_REMINDER_ID = "zora-backup-reminder";
const WISHLIST_REMINDER_ID = "zora-wishlist-reminder";

export async function requestNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Enables local reminders (backup + wishlist). Safe to call repeatedly — reschedules rather than duplicating. */
export async function enableReminders(): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) throw new Error("Notification permission was not granted.");

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Zora reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.cancelScheduledNotificationAsync(BACKUP_REMINDER_ID).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(WISHLIST_REMINDER_ID).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: BACKUP_REMINDER_ID,
    content: {
      title: "Back up your collection",
      body: "It's been a while — open Zora → Settings → Backup Now to protect your collection.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 30 * 24 * 60 * 60,
      repeats: true,
    },
  });

  await Notifications.scheduleNotificationAsync({
    identifier: WISHLIST_REMINDER_ID,
    content: {
      title: "Check your wishlist",
      body: "See if anything on your wishlist has turned up.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 7 * 24 * 60 * 60,
      repeats: true,
    },
  });
}

export async function disableReminders(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(BACKUP_REMINDER_ID).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(WISHLIST_REMINDER_ID).catch(() => {});
}

export async function sendTestNotification(): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) throw new Error("Notification permission was not granted.");
  await Notifications.scheduleNotificationAsync({
    content: { title: "Zora", body: "Notifications are working." },
    trigger: null,
  });
}
