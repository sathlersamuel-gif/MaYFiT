import "./mobile-speech-stability.js";
import { App as NativeApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

const TIMER_NOTIFICATION_ID = 81005;
// IDs novos: o Android memoriza as configuracoes do canal antigo, inclusive som/silencio.
// Criar canais novos garante que a versao AutoUpdate use os sons definidos abaixo.
const EXERCISE_CHANNEL_ID = "mayfit-workout-exercise-v3";
const REST_CHANNEL_ID = "mayfit-workout-rest-v3";
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
      name: "Inicio do descanso",
      description:
        "Som usado quando o exercicio termina e o tempo de descanso comeca.",
      sound: EXERCISE_SOUND,
      importance: 5,
      visibility: 1,
      lights: true,
      lightColor: "#9DF20F",
      vibration: true,
    }),
    LocalNotifications.createChannel({
      id: REST_CHANNEL_ID,
      name: "Inicio do exercicio",
      description:
        "Som diferente usado quando o descanso termina e o exercicio recomeca.",
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

    // Apenas consulta o recurso. Nunca abre a tela de configuracoes do Android.
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

  // phase === exercise: ao zerar, inicia o descanso -> som 1.
  // phase === pause: ao zerar, volta ao exercicio -> som 2.
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
            ? "MaYFiT — hora do exercicio"
            : "MaYFiT — hora do descanso",
          body: restFinished
            ? "O descanso terminou. Hora de voltar ao exercicio."
            : `Exercicio finalizado${exerciseName ? `: ${exerciseName}.` : "."} Inicie o descanso.`,
          schedule: {
            at,
            // Sem permissao de alarme exato, usa o agendamento normal sem
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
