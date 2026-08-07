const ANDROID_USER_AGENT = /Android/i;
const IOS_USER_AGENT = /iPad|iPhone|iPod/i;
const SETTINGS_KEY = "mayfit_workout_sound_settings_v2";
const LEGACY_SETTINGS_KEY = "mayfit_workout_sound_settings_v1";

function isSupportedMobileDevice() {
  return (
    ANDROID_USER_AGENT.test(navigator.userAgent) ||
    IOS_USER_AGENT.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function normalizeText(value) {
  return String(value || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
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

function installAutomaticSeriesStartCue() {
  if (!isSupportedMobileDevice()) return;

  let lastPhase = "";
  let syncQueued = false;
  let audioContext = null;
  let keepAliveOscillator = null;
  let keepAliveGain = null;

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

  const holdAudio = async () => {
    if (keepAliveOscillator) return;
    const context = await ensureAudioReady();
    if (!context || keepAliveOscillator) return;
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 24;
      gain.gain.value = 0.00001;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      keepAliveOscillator = oscillator;
      keepAliveGain = gain;
    } catch {}
  };

  const releaseAudio = () => {
    try {
      keepAliveOscillator?.stop();
      keepAliveOscillator?.disconnect();
      keepAliveGain?.disconnect();
    } catch {}
    keepAliveOscillator = null;
    keepAliveGain = null;
  };

  const tone = (context, { frequency, start, duration, type = "sine", volume = 0.28 }) => {
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, context.currentTime + start);
      gain.gain.setValueAtTime(volume, context.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + start + duration,
      );
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(context.currentTime + start);
      oscillator.stop(context.currentTime + start + duration + 0.03);
    } catch {}
  };

  const playStartEffect = async () => {
    const selected = storedSettings().start || "voice";
    if (selected === "voice" || selected === "silent") return;
    const context = await ensureAudioReady();
    if (!context) return;

    if (selected === "beep") {
      [1040, 1180, 1320].forEach((frequency, index) =>
        tone(context, {
          frequency,
          start: index * 0.16,
          duration: 0.1,
          type: "square",
          volume: 0.22,
        }),
      );
      return;
    }

    if (selected === "bells") {
      [0, 0.2, 0.44].forEach((start, index) =>
        tone(context, {
          frequency: [620, 830, 1110][index],
          start,
          duration: 0.62,
          type: "sine",
          volume: 0.24,
        }),
      );
      return;
    }

    if (selected === "whistle") {
      [0, 0.24].forEach((start, index) =>
        tone(context, {
          frequency: index ? 1580 : 1360,
          start,
          duration: 0.19,
          type: "sine",
          volume: 0.2,
        }),
      );
      return;
    }

    [0, 0.13, 0.28].forEach((start, index) =>
      tone(context, {
        frequency: [540, 810, 1080][index],
        start,
        duration: 0.15,
        type: "triangle",
        volume: 0.2,
      }),
    );
  };

  const currentPhase = () =>
    normalizeText(
      document.querySelector(".workout-screen .time-strip span")?.textContent,
    );

  const sync = () => {
    syncQueued = false;
    if (document.hidden) return;
    const screen = document.querySelector(".workout-screen");
    if (!screen) {
      lastPhase = "";
      releaseAudio();
      return;
    }

    const phase = currentPhase();
    if (lastPhase === "PAUSA" && phase === "TEMPO") {
      void playStartEffect();
    }
    if (phase) lastPhase = phase;
  };

  const queueSync = () => {
    if (syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(sync);
  };

  const unlock = () => {
    if (document.querySelector(".workout-screen")) void holdAudio();
  };
  document.addEventListener("pointerdown", unlock, { capture: true, passive: true });
  document.addEventListener("touchstart", unlock, { capture: true, passive: true });

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
  window.addEventListener("pagehide", releaseAudio);

  queueSync();
}

installAutomaticSeriesStartCue();
