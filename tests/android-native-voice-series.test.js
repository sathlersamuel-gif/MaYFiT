import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Android mantém TTS nativo e usa voz embutida confiável no treino", async () => {
  const [
    bridge,
    seriesCue,
    runtimeStability,
    notifications,
    mainActivity,
    plugin,
    manifest,
    gradle,
  ] = await Promise.all([
    readFile("src/lib/android-native-tts-bridge.js", "utf8"),
    readFile("src/lib/mobile-series-start-cue.js", "utf8"),
    readFile("src/lib/android-runtime-stability.js", "utf8"),
    readFile("src/lib/workout-timer-notifications.js", "utf8"),
    readFile("android/app/src/main/java/com/mayfit/app/MainActivity.java", "utf8"),
    readFile("android/app/src/main/java/com/mayfit/app/NativeTtsPlugin.java", "utf8"),
    readFile("android/app/src/main/AndroidManifest.xml", "utf8"),
    readFile("android/app/build.gradle", "utf8"),
  ]);

  assert.match(notifications, /import "\.\/android-native-tts-bridge\.js"/);
  assert.match(notifications, /import "\.\/android-runtime-stability\.js"/);
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
  const registerAt = mainActivity.indexOf("registerPlugin(NativeTtsPlugin.class)");
  const superAt = mainActivity.indexOf("super.onCreate(savedInstanceState)");
  assert.ok(registerAt >= 0, "plugin nativo registrado");
  assert.ok(superAt >= 0, "BridgeActivity inicializada");
  assert.ok(registerAt < superAt, "TTS registrado antes de super.onCreate");
  assert.match(manifest, /android\.intent\.action\.TTS_SERVICE/);

  assert.match(seriesCue, /lastPhase === "PAUSA" && phase === "TEMPO"/);
  assert.match(seriesCue, /selected === "voice" \|\| selected === "silent"/);
  assert.match(seriesCue, /selected === "beep"/);
  assert.match(seriesCue, /selected === "bells"/);
  assert.match(seriesCue, /selected === "whistle"/);
  assert.match(seriesCue, /holdAudio/);

  assert.match(runtimeStability, /iniciando-treino\.base64\.txt/);
  assert.match(runtimeStability, /descanso\.base64\.txt/);
  assert.match(runtimeStability, /fim-treino\.base64\.txt/);
  assert.match(runtimeStability, /installEmbeddedWorkoutVoice/);
  assert.match(runtimeStability, /__mayfitAndroidEmbeddedWorkoutVoice/);
  assert.match(runtimeStability, /synthesis\.speak/);
  assert.match(runtimeStability, /Object\.defineProperty\(window, "speechSynthesis"/);
  assert.match(runtimeStability, /await audio\.play\(\)/);
  assert.match(runtimeStability, /INICIANDO TREINO/);
  assert.match(runtimeStability, /DESCANSO/);
  assert.match(runtimeStability, /FIM DE TREINO/);
  assert.match(runtimeStability, /\.app>header>\.icon/);
  assert.match(runtimeStability, /margin-left:auto/);

  assert.match(gradle, /versionCode 7/);
  assert.match(gradle, /versionName "1\.3\.2"/);
});
