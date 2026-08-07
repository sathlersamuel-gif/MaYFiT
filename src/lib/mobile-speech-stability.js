const ANDROID_USER_AGENT = /Android/i;
const IOS_USER_AGENT = /iPad|iPhone|iPod/i;

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

function installMobileSpeechStability() {
  if (!isSupportedMobileDevice()) return;
  const synthesis = window.speechSynthesis;
  if (!synthesis || synthesis.__mayfitMobileSpeechStability) return;

  const originalSpeak = synthesis.speak.bind(synthesis);
  const originalCancel = synthesis.cancel.bind(synthesis);
  const activeUtterances = new Set();
  let deferredCancelTimer = null;
  let speechAudioContext = null;
  let keepAliveOscillator = null;
  let keepAliveGain = null;
  let releaseTimer = null;

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
    }, 700);
  };

  const clearDeferredCancel = () => {
    if (!deferredCancelTimer) return;
    clearTimeout(deferredCancelTimer);
    deferredCancelTimer = null;
  };

  // O motor de voz chama cancel() imediatamente antes de speak().
  // Em alguns WebViews/Safari isso pode cancelar a nova fala também.
  // Adiamos o cancelamento; se speak() vier logo depois, ele é descartado.
  const stableCancel = () => {
    clearDeferredCancel();
    deferredCancelTimer = setTimeout(() => {
      deferredCancelTimer = null;
      try {
        originalCancel();
      } catch {}
    }, 180);
  };

  const stableSpeak = (utterance) => {
    clearDeferredCancel();
    void holdSpeechAudio();
    activeUtterances.add(utterance);

    let cleaned = false;
    let watchdog = null;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      if (watchdog) clearTimeout(watchdog);
      activeUtterances.delete(utterance);
      releaseSpeechAudioSoon();
    };

    try {
      utterance.addEventListener?.("end", cleanup, { once: true });
      utterance.addEventListener?.("error", cleanup, { once: true });
      watchdog = setTimeout(cleanup, 5000);
      originalSpeak(utterance);
    } catch (error) {
      cleanup();
      throw error;
    }
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

  const unlock = () => void ensureSpeechAudio();
  document.addEventListener("pointerdown", unlock, { capture: true, passive: true });
  document.addEventListener("touchstart", unlock, { capture: true, passive: true });

  window.addEventListener("pagehide", () => {
    clearDeferredCancel();
    try {
      originalCancel();
    } catch {}
    activeUtterances.clear();
    releaseSpeechAudioSoon();
  });
}

installMobileSpeechStability();
