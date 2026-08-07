import { Capacitor } from "@capacitor/core";

const SETTINGS_KEY = "mayfit_workout_sound_settings_v2";
const LEGACY_SETTINGS_KEY = "mayfit_workout_sound_settings_v1";
const ANDROID_USER_AGENT = /Android/i;

function isNativeAndroid() {
  try {
    return (
      ANDROID_USER_AGENT.test(navigator.userAgent) &&
      Capacitor.isNativePlatform() &&
      Capacitor.getPlatform() === "android"
    );
  } catch {
    return false;
  }
}

function storedSettings() {
  for (const key of [SETTINGS_KEY, LEGACY_SETTINGS_KEY]) {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      if (saved && typeof saved === "object") return saved;
    } catch {}
  }
  return {};
}

function normalizeText(value) {
  return String(value || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function installHeaderStability() {
  if (document.getElementById("mayfit-android-header-stability")) return;
  const style = document.createElement("style");
  style.id = "mayfit-android-header-stability";
  style.textContent = `
    .app>header>.icon{margin-left:auto!important;flex:0 0 42px!important}
    .app>header>.mayfit-sound-settings-trigger{flex:0 0 42px!important;margin-left:6px!important}
    .app>header>.mayfit-header-actions{margin-left:auto!important;flex:0 0 auto!important}
    .app>header>.mayfit-header-actions>.mayfit-sound-settings-trigger{margin-left:0!important}
  `;
  document.head.appendChild(style);

  const syncHeaderActions = () => {
    const header = document.querySelector(".app > header");
    const actions = header?.querySelector(".mayfit-header-actions");
    const sound = header?.querySelector(".mayfit-sound-settings-trigger");
    if (!header || !actions || !sound) return;

    const gear = actions.querySelector("[data-mayfit-settings]");
    if (sound.parentElement !== actions) {
      actions.insertBefore(sound, gear || null);
      return;
    }
    if (gear && sound.nextElementSibling !== gear) {
      actions.insertBefore(sound, gear);
    }
  };

  const observer = new MutationObserver(syncHeaderActions);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
  });
  window.addEventListener("pageshow", syncHeaderActions);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) syncHeaderActions();
  });
  requestAnimationFrame(syncHeaderActions);
}

function installSeriesVoiceFallback() {
  let audioContext = null;
  let lastPhase = "";
  let syncQueued = false;
  let lastSeriesStartAt = 0;
  let lastFallbackAt = 0;

  const getAudioContext = () => {
    try {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) return null;
      audioContext = audioContext || new AudioContextCtor();
      return audioContext;
    } catch {
      return null;
    }
  };

  const ensureAudioReady = async () => {
    const context = getAudioContext();
    if (!context) return null;
    try {
      if (context.state === "suspended") await context.resume();
    } catch {}
    return context.state === "closed" ? null : context;
  };

  const tone = (context, frequency, start) => {
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, context.currentTime + start);
      gain.gain.setValueAtTime(0.2, context.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + start + 0.15,
      );
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(context.currentTime + start);
      oscillator.stop(context.currentTime + start + 0.18);
    } catch {}
  };

  const playFallback = async () => {
    const now = Date.now();
    if (now - lastFallbackAt < 900) return;
    lastFallbackAt = now;
    const context = await ensureAudioReady();
    if (!context) return;
    [540, 810, 1080].forEach((frequency, index) =>
      tone(context, frequency, index * 0.13),
    );
  };

  const phaseNow = () =>
    normalizeText(
      document.querySelector(".workout-screen .time-strip span")?.textContent,
    );

  const sync = () => {
    syncQueued = false;
    if (document.hidden) return;
    const phase = phaseNow();
    if (!phase) {
      lastPhase = "";
      return;
    }

    if (lastPhase === "PAUSA" && phase === "TEMPO") {
      lastSeriesStartAt = Date.now();
      const startSound = storedSettings().start || "voice";
      if (startSound === "voice" && !window.__mayfitAndroidNativeSpeechBridge) {
        void playFallback();
      }
    }
    lastPhase = phase;
  };

  const queueSync = () => {
    if (syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(sync);
  };

  const unlock = () => void ensureAudioReady();
  document.addEventListener("pointerdown", unlock, { capture: true, passive: true });
  document.addEventListener("touchstart", unlock, { capture: true, passive: true });

  window.addEventListener("mayfit-native-tts-error", (event) => {
    const text = normalizeText(event?.detail?.text);
    if (text !== "INICIANDO TREINO") return;
    if (Date.now() - lastSeriesStartAt > 1800) return;
    if ((storedSettings().start || "voice") !== "voice") return;
    void playFallback();
  });

  const observer = new MutationObserver(queueSync);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
  });
  window.addEventListener("pageshow", queueSync);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) queueSync();
  });

  queueSync();
}

if (isNativeAndroid()) {
  installHeaderStability();
  installSeriesVoiceFallback();
}
