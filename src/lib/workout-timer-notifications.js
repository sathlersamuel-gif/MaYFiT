import { App as NativeApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

const TIMER_NOTIFICATION_ID = 81005;
const EXERCISE_CHANNEL_ID = "mayfit-workout-exercise-v2";
const REST_CHANNEL_ID = "mayfit-workout-rest-v2";
const EXERCISE_SOUND = "mayfit_timer.wav";
const REST_SOUND = "mayfit_rest.wav";
let channelsReady = false;
let exactAlarmEnabled = false;

export function hasNativeTimerNotifications() {
  return Capacitor.isNativePlatform();
}

async function createTimerChannels() {
  if (channelsReady || Capacitor.getPlatform() !== "android") return;
  await Promise.all([
    LocalNotifications.createChannel({
      id: EXERCISE_CHANNEL_ID,
      name: "Fim do exercício",
      description:
        "Som usado quando o tempo do exercício termina e a pausa começa.",
      sound: EXERCISE_SOUND,
      importance: 5,
      visibility: 1,
      lights: true,
      lightColor: "#9DF20F",
      vibration: true,
    }),
    LocalNotifications.createChannel({
      id: REST_CHANNEL_ID,
      name: "Fim do descanso",
      description:
        "Som diferente usado quando a pausa termina e o exercício recomeça.",
      sound: REST_SOUND,
      importance: 5,
      visibility: 1,
      lights: true,
      lightColor: "#9DF20F",
      vibration: true,
    }),
  ]);
  channelsReady = true;
}

async function readExactAlarmSetting() {
  if (Capacitor.getPlatform() !== "android") return true;
  try {
    const permission =
      await LocalNotifications.checkExactNotificationSetting();
    return permission.exact_alarm === "granted";
  } catch {
    return false;
  }
}

export async function prepareTimerNotifications({ request = false } = {}) {
  if (!hasNativeTimerNotifications()) return false;
  try {
    let permission = await LocalNotifications.checkPermissions();
    if (permission.display !== "granted" && request) {
      permission = await LocalNotifications.requestPermissions();
    }
    if (permission.display !== "granted") return false;

    // Apenas consulta o recurso. Nunca abre a tela de configurações do Android.
    exactAlarmEnabled = await readExactAlarmSetting();
    await createTimerChannels();
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

  const restFinished = phase === "pause";
  const channelId = restFinished ? REST_CHANNEL_ID : EXERCISE_CHANNEL_ID;
  const sound = restFinished ? REST_SOUND : EXERCISE_SOUND;

  try {
    await cancelTimerNotification({ delivered: true });
    await LocalNotifications.schedule({
      notifications: [
        {
          id: TIMER_NOTIFICATION_ID,
          title: restFinished
            ? "MaYFiT — descanso finalizado"
            : "MaYFiT — tempo finalizado",
          body: restFinished
            ? "O descanso terminou. Hora de voltar ao exercício."
            : `Contagem finalizada${exerciseName ? `: ${exerciseName}` : "."}`,
          schedule: {
            at,
            // Sem permissão de alarme exato, usa o agendamento normal sem
            // direcionar o aluno para outra tela.
            allowWhileIdle: exactAlarmEnabled,
          },
          channelId,
          sound,
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
