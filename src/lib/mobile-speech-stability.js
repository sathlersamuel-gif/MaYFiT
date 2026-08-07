const ANDROID_USER_AGENT = /Android/i;
const IOS_USER_AGENT = /iPad|iPhone|iPod/i;
const SETTINGS_KEY = "mayfit_workout_sound_settings_v2";
const LEGACY_SETTINGS_KEY = "mayfit_workout_sound_settings_v1";

function isIOSDevice() {
  return (
    IOS_USER_AGENT.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isAndroidDevice() {
  return ANDROID_USER_AGENT.test(navigator.userAgent);
}

function isSupportedMobileDevice() {
  return isIOSDevice() || isAndroidDevice();
}

function normalizedText(value) {
  return String(value || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function storedSoundSettings() {
  for (const key of [SETTINGS_KEY, LEGACY_SETTINGS_KEY]) {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      if (saved && typeof saved === "object") return saved;
    } catch {}
  }
  return {};
}

function installMobileSpeechStability() {
  if (!isSupportedMobileDevice()) return;
  const synthesis = window.speechSynthesis;
  if (!synthesis || synthesis.__mayfitMobileSpeechStability) return;

  const originalSpeak = synthesis.speak.bind(synthesis);
  const originalCancel = synthesis.cancel.bind(synthesis);
  const speechQueue = [];
  const activeUtterances = new Set();
  let currentUtterance = null;
  let deferredCancelTimer = null;
  let speechAudioContext = null;
  let keepAliveOscillator = null;
  let keepAliveGain = null;
  let releaseTimer = null;
  let lastPhase = "";
  let phaseSyncQueued = false;

  const ensureSpeechAudio = async () => {
    try {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) return null;
      speechAudioContext = speechAudioContext || new AudioContextCtor();
      if (speechAudioContext.state === "suspended") {
        await speechAudioContext.resume();
      }
      return speechAudioContext.state === "closed" ? null : speechAudioContext;
    } catch {
      return null;
    }
  };

  const holdSpeechAudio = async () => {
    if (releaseTimer) {
      clearTimeout(releaseTimer);
      releaseTimer = null;
    }
    if (keepAliveOscillator) return;
    const context = await ensureSpeechAudio();
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

  const releaseSpeechAudioSoon = () => {
    if (releaseTimer) clearTimeout(releaseTimer);
    releaseTimer = setTimeout(() => {
      try {
        keepAliveOscillator?.stop();
        keepAliveOscillator?.disconnect();
        keepAliveGain?.disconnect();
      } catch {}
      keepAliveOscillator = null;
      keepAliveGain = null;
      releaseTimer = null;
    }, 900);
  };

  const clearDeferredCancel = () => {
    if (!deferredCancelTimer) return;
    clearTimeout(deferredCancelTimer);
    deferredCancelTimer = null;
  };

  const processSpeechQueue = () => {
    if (currentUtterance || !speechQueue.length) return;
    const utterance = speechQueue.shift();
    if (!utterance) return;

    currentUtterance = utterance;
    activeUtterances.add(utterance);
    void holdSpeechAudio();

    let finished = false;
    let watchdog = null;
    const finishCurrent = () => {
      if (finished) return;
      finished = true;
      if (watchdog) clearTimeout(watchdog);
      activeUtterances.delete(utterance);
      if (currentUtterance === utterance) currentUtterance = null;
      if (speechQueue.length) {
        setTimeout(processSpeechQueue, 90);
      } else {
        releaseSpeechAudioSoon();
      }
    };

    try {
      utterance.addEventListener?.("end", finishCurrent, { once: true });
      utterance.addEventListener?.("error", finishCurrent, { once: true });
      watchdog = setTimeout(finishCurrent, 6000);
      synthesis.resume?.();
      originalSpeak(utterance);
    } catch (error) {
      finishCurrent();
      throw error;
    }
  };

  // O motor chama cancel() logo antes de speak(). Em iOS e alguns WebViews
  // Android isso pode eliminar a fala seguinte. Adiamos o cancelamento e,
  // quando speak() chega em seguida, preservamos a fila em vez de interromper.
  const stableCancel = () => {
    clearDeferredCancel();
    deferredCancelTimer = setTimeout(() => {
      deferredCancelTimer = null;
      speechQueue.length = 0;
      currentUtterance = null;
      activeUtterances.clear();
      try {
        originalCancel();
      } catch {}
      releaseSpeechAudioSoon();
    }, 220);
  };

  const stableSpeak = (utterance) => {
    clearDeferredCancel();
    speechQueue.push(utterance);
    processSpeechQueue();
  };

  try {
    Object.defineProperty(synthesis, "cancel", {
      configurable: true,
      value: stableCancel,
    });
    Object.defineProperty(synthesis, "speak", {
      configurable: true,
      value: stableSpeak,
    });
  } catch {
    try {
      synthesis.cancel = stableCancel;
      synthesis.speak = stableSpeak;
    } catch {
      return;
    }
  }

  try {
    Object.defineProperty(synthesis, "__mayfitMobileSpeechStability", {
      configurable: false,
      value: true,
    });
  } catch {}

  const portugueseVoices = () => {
    try {
      return (synthesis.getVoices?.() || []).filter((voice) =>
        /^pt(?:-|_)/i.test(String(voice.lang || "")),
      );
    } catch {
      return [];
    }
  };

  const preferredVoice = () => {
    const voices = portugueseVoices();
    if (!voices.length) return null;
    const wanted = storedSoundSettings().voiceName;
    if (wanted && wanted !== "auto") {
      const selected = voices.find((voice) => voice.name === wanted);
      if (selected) return selected;
    }
    return (
      voices.find((voice) => /^pt-BR$/i.test(String(voice.lang || ""))) ||
      voices[0]
    );
  };

  const speakAutomaticSeriesStart = () => {
    const settings = storedSoundSettings();
    if ((settings.start || "voice") !== "voice") return;
    try {
      const utterance = new SpeechSynthesisUtterance("Iniciando treino");
      utterance.lang = "pt-BR";
      utterance.rate = 0.98;
      utterance.pitch = 1.02;
      utterance.volume = 1;
      const voice = preferredVoice();
      if (voice) utterance.voice = voice;
      synthesis.speak(utterance);
    } catch {}
  };

  const currentPhase = () =>
    normalizedText(
      document.querySelector(".workout-screen .time-strip span")?.textContent,
    );

  const syncSeriesPhase = () => {
    phaseSyncQueued = false;
    if (document.hidden) return;
    const phase = currentPhase();
    if (!phase) {
      lastPhase = "";
      return;
    }
    if (lastPhase === "PAUSA" && phase === "TEMPO") {
      speakAutomaticSeriesStart();
    }
    lastPhase = phase;
  };

  const queueSeriesPhaseSync = () => {
    if (phaseSyncQueued) return;
    phaseSyncQueued = true;
    requestAnimationFrame(syncSeriesPhase);
  };

  const observer = new MutationObserver(queueSeriesPhaseSync);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
  });

  const unlock = () => void ensureSpeechAudio();
  document.addEventListener("pointerdown", unlock, { capture: true, passive: true });
  document.addEventListener("touchstart", unlock, { capture: true, passive: true });
  document.addEventListener("visibilitychange", queueSeriesPhaseSync);
  window.addEventListener("pageshow", queueSeriesPhaseSync);

  window.addEventListener("pagehide", () => {
    clearDeferredCancel();
    speechQueue.length = 0;
    currentUtterance = null;
    try {
      originalCancel();
    } catch {}
    activeUtterances.clear();
    releaseSpeechAudioSoon();
  });

  queueSeriesPhaseSync();
}

installMobileSpeechStability();
