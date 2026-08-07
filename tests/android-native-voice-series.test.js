import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Android usa TTS nativo e todas as novas series recebem o aviso escolhido", async () => {
  const [bridge, seriesCue, notifications, mainActivity, plugin, manifest, gradle] =
    await Promise.all([
      readFile("src/lib/android-native-tts-bridge.js", "utf8"),
      readFile("src/lib/mobile-series-start-cue.js", "utf8"),
      readFile("src/lib/workout-timer-notifications.js", "utf8"),
      readFile("android/app/src/main/java/com/mayfit/app/MainActivity.java", "utf8"),
      readFile("android/app/src/main/java/com/mayfit/app/NativeTtsPlugin.java", "utf8"),
      readFile("android/app/src/main/AndroidManifest.xml", "utf8"),
      readFile("android/app/build.gradle", "utf8"),
    ]);

  assert.match(notifications, /import "\.\/android-native-tts-bridge\.js"/);
  assert.match(notifications, /import "\.\/mobile-series-start-cue\.js"/);

  assert.match(bridge, /Capacitor\.isNativePlatform\(\)/);
  assert.match(bridge, /Capacitor\.getPlatform\(\) === "android"/);
  assert.match(bridge, /Capacitor\.isPluginAvailable\("NativeTts"\)/);
  assert.match(bridge, /registerPlugin\("NativeTts"\)/);
  assert.match(bridge, /Android — Português \(Brasil\)/);
  assert.match(bridge, /SpeechSynthesisUtterance/);
  assert.match(bridge, /ttsStart/);
  assert.match(bridge, /ttsDone/);
  assert.match(bridge, /ttsError/);

  assert.match(plugin, /@CapacitorPlugin\(name = "NativeTts"\)/);
  assert.match(plugin, /new TextToSpeech/);
  assert.match(plugin, /new Locale\("pt", "BR"\)/);
  assert.match(plugin, /TextToSpeech\.QUEUE_ADD/);
  assert.match(mainActivity, /registerPlugin\(NativeTtsPlugin\.class\)/);
  assert.match(manifest, /android\.intent\.action\.TTS_SERVICE/);

  assert.match(seriesCue, /lastPhase === "PAUSA" && phase === "TEMPO"/);
  assert.match(seriesCue, /selected === "voice" \|\| selected === "silent"/);
  assert.match(seriesCue, /selected === "beep"/);
  assert.match(seriesCue, /selected === "bells"/);
  assert.match(seriesCue, /selected === "whistle"/);
  assert.match(seriesCue, /540, 810, 1080/);
  assert.match(seriesCue, /holdAudio/);

  assert.match(gradle, /versionCode 6/);
  assert.match(gradle, /versionName "1\.3\.1"/);
});
