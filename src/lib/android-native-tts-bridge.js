import { Capacitor, registerPlugin } from "@capacitor/core";

const ANDROID_USER_AGENT = /Android/i;
const NativeTts = registerPlugin("NativeTts");

function isAndroidDevice() {
  return ANDROID_USER_AGENT.test(navigator.userAgent);
}

function canUseNativeTts() {
  try {
    return (
      isAndroidDevice() &&
      Capacitor.isNativePlatform() &&
      Capacitor.getPlatform() === "android" &&
      Capacitor.isPluginAvailable("NativeTts")
    );
  } catch {
    return false;
  }
}

class NativeSpeechSynthesisUtterance extends EventTarget {
  constructor(text = "") {
    super();
    this.text = String(text || "");
    this.lang = "pt-BR";
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
    this.voice = null;
    this.onstart = null;
    this.onend = null;
    this.onerror = null;
  }
}

function emitUtterance(utterance, type, detail = {}) {
  const event = new Event(type);
  Object.assign(event, detail);
  try {
    const handler = utterance?.[`on${type}`];
    if (typeof handler === "function") handler.call(utterance, event);
  } catch {}
  try {
    utterance?.dispatchEvent?.(event);
  } catch {}
}

function installAndroidNativeSpeechBridge() {
  if (!canUseNativeTts()) return;
  if (window.__mayfitAndroidNativeSpeechBridge) return;

  const active = new Map();
  let sequence = 0;
  let paused = false;

  const nativeVoice = {
    default: true,
    lang: "pt-BR",
    localService: true,
    name: "Android — Português (Brasil)",
    voiceURI: "mayfit-native-android-pt-BR",
  };

  const synthesis = new EventTarget();
  Object.defineProperties(synthesis, {
    speaking: { get: () => active.size > 0 },
    pending: { get: () => false },
    paused: { get: () => paused },
  });

  synthesis.getVoices = () => [nativeVoice];
  synthesis.pause = () => {
    paused = true;
  };
  synthesis.resume = () => {
    paused = false;
  };
  synthesis.cancel = () => {
    active.clear();
    void NativeTts.stop().catch(() => {});
  };
  synthesis.speak = (utterance) => {
    if (!utterance) return;
    const id = `mayfit-tts-${Date.now()}-${++sequence}`;
    active.set(id, utterance);
    void NativeTts.speak({
      id,
      text: String(utterance.text || ""),
      lang: String(utterance.lang || "pt-BR"),
    }).catch((error) => {
      active.delete(id);
      emitUtterance(utterance, "error", { error });
    });
  };

  void NativeTts.addListener("ttsStart", ({ id }) => {
    const utterance = active.get(String(id || ""));
    if (utterance) emitUtterance(utterance, "start");
  });
  void NativeTts.addListener("ttsDone", ({ id }) => {
    const key = String(id || "");
    const utterance = active.get(key);
    if (!utterance) return;
    active.delete(key);
    emitUtterance(utterance, "end");
  });
  void NativeTts.addListener("ttsError", ({ id, errorCode }) => {
    const key = String(id || "");
    const utterance = active.get(key);
    if (!utterance) return;
    active.delete(key);
    emitUtterance(utterance, "error", { error: errorCode });
  });

  try {
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: synthesis,
    });
  } catch {
    window.speechSynthesis = synthesis;
  }

  if (!("SpeechSynthesisUtterance" in window)) {
    window.SpeechSynthesisUtterance = NativeSpeechSynthesisUtterance;
  }

  window.__mayfitAndroidNativeSpeechBridge = true;
}

installAndroidNativeSpeechBridge();
