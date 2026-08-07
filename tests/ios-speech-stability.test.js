import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Android e iPhone estabilizam a voz sem alterar os efeitos do treino", async () => {
  const [stability, notifications, mobileSounds] = await Promise.all([
    readFile("src/lib/mobile-speech-stability.js", "utf8"),
    readFile("src/lib/workout-timer-notifications.js", "utf8"),
    readFile("src/mobile-workout-sounds.js", "utf8"),
  ]);

  assert.match(notifications, /import "\.\/mobile-speech-stability\.js"/);
  assert.match(stability, /Android/);
  assert.match(stability, /iPad\|iPhone\|iPod/);
  assert.match(stability, /isAndroidDevice/);
  assert.match(stability, /isIOSDevice/);
  assert.match(stability, /isSupportedMobileDevice/);
  assert.match(stability, /originalSpeak/);
  assert.match(stability, /originalCancel/);
  assert.match(stability, /deferredCancelTimer/);
  assert.match(stability, /180/);
  assert.match(stability, /clearDeferredCancel\(\)/);
  assert.match(stability, /activeUtterances/);
  assert.match(stability, /holdSpeechAudio/);
  assert.match(stability, /releaseSpeechAudioSoon/);
  assert.match(stability, /__mayfitMobileSpeechStability/);
  assert.match(stability, /pagehide/);

  // O motor existente continua responsável pelos mesmos gatilhos e efeitos.
  assert.match(mobileSounds, /playCue\("rest"\)/);
  assert.match(mobileSounds, /playCue\("finish"\)/);
  assert.match(mobileSounds, /Bip esportivo/);
  assert.match(mobileSounds, /Sinos/);
  assert.match(mobileSounds, /Apito/);
  assert.match(mobileSounds, /Alerta digital/);
});
