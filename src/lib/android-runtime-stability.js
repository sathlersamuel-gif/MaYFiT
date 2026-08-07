import { Capacitor } from "@capacitor/core";

const SETTINGS_KEY = "mayfit_workout_sound_settings_v2";
const LEGACY_SETTINGS_KEY = "mayfit_workout_sound_settings_v1";
const ANDROID_USER_AGENT = /Android/i;
const VOICE_SOURCES = {
  start: "/audio/iniciando-treino.base64.txt?v=5",
  rest: "/audio/descanso.base64.txt?v=5",
  finish: "/audio/fim-treino.base64.txt?v=4",
};

function isNativeAndroid() {
  try {
    return ANDROID_USER_AGENT.test(navigator.userAgent);
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

function installEmbeddedWorkoutVoice() {
  if (window.__mayfitAndroidEmbeddedWorkoutVoiceInstalled) return;
  const originalSynthesis = window.speechSynthesis;
  if (!originalSynthesis) return;

  let players = null;
  let playersPromise = null;
  let activeAudio = null;

  const originalSpeak =
    typeof originalSynthesis.speak === "function"
      ? originalSynthesis.speak.bind(originalSynthesis)
      : null;
  const originalCancel =
    typeof originalSynthesis.cancel === "function"
      ? originalSynthesis.cancel.bind(originalSynthesis)
      : null;
  const originalPause =
    typeof originalSynthesis.pause === "function"
      ? originalSynthesis.pause.bind(originalSynthesis)
      : null;
  const originalResume =
    typeof originalSynthesis.resume === "function"
      ? originalSynthesis.resume.bind(originalSynthesis)
      : null;
  const originalGetVoices =
    typeof originalSynthesis.getVoices === "function"
      ? originalSynthesis.getVoices.bind(originalSynthesis)
      : null;

  const validBase64 = (value) => {
    const clean = String(value || "").trim();
    return /^[A-Za-z0-9+/]+={0,2}$/.test(clean) ? clean : "";
  };

  const loadVoice = async (source) => {
    const response = await fetch(source, { cache: "no-store" });
    if (!response.ok) throw new Error("Falha ao carregar voz do treino");
    const base64 = validBase64(await response.text());
    if (!base64) throw new Error("Arquivo de voz inválido");
    const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
    audio.preload = "auto";
    audio.volume = 1;
    audio.setAttribute("playsinline", "");
    audio.load?.();
    return audio;
  };

  const preparePlayers = () => {
    if (players) return Promise.resolve(players);
    if (playersPromise) return playersPromise;

    playersPromise = Promise.all([
      loadVoice(VOICE_SOURCES.start),
      loadVoice(VOICE_SOURCES.rest),
      loadVoice(VOICE_SOURCES.finish),
    ])
      .then(([start, rest, finish]) => {
        players = { start, rest, finish };
        return players;
      })
      .catch(() => null)
      .finally(() => {
        playersPromise = null;
      });

    return playersPromise;
  };

  const unlockPlayers = () => {
    if (!players) return;
    Object.values(players).forEach((audio) => {
      try {
        audio.muted = true;
        audio.currentTime = 0;
        const attempt = audio.play();
        Promise.resolve(attempt)
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.muted = false;
          })
          .catch(() => {
            audio.muted = false;
          });
      } catch {
        audio.muted = false;
      }
    });
  };

  const emitUtterance = (utterance, type, detail = {}) => {
    const event = new Event(type);
    Object.assign(event, detail);
    try {
      const handler = utterance?.[`on${type}`];
      if (typeof handler === "function") handler.call(utterance, event);
    } catch {}
    try {
      utterance?.dispatchEvent?.(event);
    } catch {}
  };

  const cueForText = (text) => {
    const normalized = normalizeText(text);
    if (normalized === "INICIANDO TREINO") return "start";
    if (normalized === "DESCANSO") return "rest";
    if (normalized === "FIM DE TREINO" || normalized === "FIM DO TREINO") return "finish";
    return "";
  };

  const synthesis = new EventTarget();
  Object.defineProperties(synthesis, {
    speaking: {
      configurable: true,
      get: () => Boolean(activeAudio && !activeAudio.paused),
    },
    pending: {
      configurable: true,
      get: () => false,
    },
    paused: {
      configurable: true,
      get: () => Boolean(originalSynthesis.paused),
    },
  });

  synthesis.getVoices = () => {
    try {
      return originalGetVoices?.() || [];
    } catch {
      return [];
    }
  };

  synthesis.pause = () => {
    try {
      activeAudio?.pause();
    } catch {}
    try {
      originalPause?.();
    } catch {}
  };

  synthesis.resume = () => {
    try {
      originalResume?.();
    } catch {}
  };

  synthesis.cancel = () => {
    try {
      if (activeAudio) {
        activeAudio.pause();
        activeAudio.currentTime = 0;
      }
    } catch {}
    activeAudio = null;
    try {
      originalCancel?.();
    } catch {}
  };

  synthesis.speak = (utterance) => {
    const cue = cueForText(utterance?.text);
    const selected = storedSettings()[cue] || "voice";
    if (!cue || selected !== "voice") {
      try {
        originalSpeak?.(utterance);
      } catch {
        emitUtterance(utterance, "error", { error: "original-tts-error" });
      }
      return;
    }

    void (async () => {
      const ready = players || (await preparePlayers());
      const audio = ready?.[cue];
      if (!audio) {
        try {
          originalSpeak?.(utterance);
        } catch {
          emitUtterance(utterance, "error", { error: "embedded-voice-unavailable" });
        }
        return;
      }

      try {
        if (activeAudio && activeAudio !== audio) {
          activeAudio.pause();
          activeAudio.currentTime = 0;
        }
        activeAudio = audio;
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
        audio.volume = 1;
        audio.onended = () => {
          if (activeAudio === audio) activeAudio = null;
          emitUtterance(utterance, "end");
        };
        audio.onerror = () =>
          emitUtterance(utterance, "error", { error: "embedded-audio-error" });
        const playAttempt = audio.play();
        emitUtterance(utterance, "start");
        await playAttempt;
      } catch (error) {
        try {
          originalSpeak?.(utterance);
        } catch {
          emitUtterance(utterance, "error", { error });
        }
      }
    })();
  };

  synthesis.__mayfitAndroidEmbeddedWorkoutVoice = true;

  try {
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: synthesis,
    });
  } catch {
    try {
      window.speechSynthesis = synthesis;
    } catch {
      return;
    }
  }

  window.__mayfitAndroidEmbeddedWorkoutVoiceInstalled = true;
  void preparePlayers();

  const unlock = () => {
    if (players) unlockPlayers();
    else void preparePlayers().then(() => unlockPlayers());
  };
  document.addEventListener("pointerdown", unlock, { capture: true, passive: true });
  document.addEventListener("touchstart", unlock, { capture: true, passive: true });
  document.addEventListener("click", unlock, { capture: true, passive: true });
}

if (isNativeAndroid()) {
  installHeaderStability();
  installEmbeddedWorkoutVoice();
}
