import { App as NativeApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

const TIMER_NOTIFICATION_ID = 81005;
const TIMER_CHANNEL_ID = "mayfit-workout-timer-v1";
const TIMER_SOUND = "mayfit_timer.wav";
let channelReady = false;

export function hasNativeTimerNotifications() {
  return Capacitor.isNativePlatform();
}

async function createTimerChannel() {
  if (channelReady || Capacitor.getPlatform() !== "android") return;
  await LocalNotifications.createChannel({
    id: TIMER_CHANNEL_ID,
    name: "Cronômetro MaYFiT",
    description: "Sino e vibração ao finalizar cada cronômetro do treino.",
    sound: TIMER_SOUND,
    importance: 5,
    visibility: 1,
    lights: true,
    lightColor: "#9DF20F",
    vibration: true,
  });
  channelReady = true;
}

async function hasExactAlarmPermission({ request = false } = {}) {
  if (Capacitor.getPlatform() !== "android") return true;
  let permission = await LocalNotifications.checkExactNotificationSetting();
  if (permission.exact_alarm !== "granted" && request) {
    permission = await LocalNotifications.changeExactNotificationSetting();
  }
  return permission.exact_alarm === "granted";
}

export async function prepareTimerNotifications({ request = false } = {}) {
  if (!hasNativeTimerNotifications()) return false;
  try {
    let permission = await LocalNotifications.checkPermissions();
    if (permission.display !== "granted" && request) {
      permission = await LocalNotifications.requestPermissions();
    }
    if (permission.display !== "granted") return false;
    if (!(await hasExactAlarmPermission({ request }))) return false;
    await createTimerChannel();
    return true;
  } catch {
    return false;
  }
}

export async function cancelTimerNotification({ delivered = false } = {}) {
  if (!hasNativeTimerNotifications()) return;
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: TIMER_NOTIFICATION_ID }],
    });
    if (delivered) {
      await LocalNotifications.removeDeliveredNotifications({
        notifications: [{ id: TIMER_NOTIFICATION_ID }],
      });
    }
  } catch {}
}

export async function scheduleTimerNotification({
  deadline,
  phase,
  exerciseName,
}) {
  if (!(await prepareTimerNotifications())) return false;
  const at = new Date(Number(deadline));
  if (!Number.isFinite(at.getTime()) || at.getTime() <= Date.now()) return false;
  try {
    await cancelTimerNotification({ delivered: true });
    await LocalNotifications.schedule({
      notifications: [
        {
          id: TIMER_NOTIFICATION_ID,
          title: "MaYFiT — tempo finalizado",
          body:
            phase === "pause"
              ? "A pausa terminou. Continue o treino."
              : `Cronômetro finalizado${exerciseName ? `: ${exerciseName}` : "."}`,
          schedule: { at, allowWhileIdle: true },
          channelId: TIMER_CHANNEL_ID,
          sound: TIMER_SOUND,
          autoCancel: true,
          extra: { source: "mayfit-workout-timer", phase },
        },
      ],
    });
    return true;
  } catch {
    return false;
  }
}

export async function addTimerResumeListener(onResume) {
  return NativeApp.addListener("appStateChange", ({ isActive }) => {
    if (isActive) onResume();
  });
}
