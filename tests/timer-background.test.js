import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  timerDeadline,
  timerSecondsRemaining,
} from "../src/lib/timer-clock.js";

test("calcula o cronometro pelo horario real apos suspensao da tela", () => {
  const deadline = timerDeadline(45, 1_000);
  assert.equal(deadline, 46_000);
  assert.equal(timerSecondsRemaining(deadline, 2_000), 44);
  assert.equal(timerSecondsRemaining(deadline, 45_500), 1);
  assert.equal(timerSecondsRemaining(deadline, 46_000), 0);
  assert.equal(timerSecondsRemaining(deadline, 90_000), 0);
});

test("mantem Android e iPhone com motor unico e configuracoes reais", async () => {
  const [
    main,
    notifications,
    mobileSounds,
    studentEntry,
    index,
    manifest,
    exerciseSound,
    restSound,
  ] = await Promise.all([
    readFile("src/main.jsx", "utf8"),
    readFile("src/lib/workout-timer-notifications.js", "utf8"),
    readFile("src/mobile-workout-sounds.js", "utf8"),
    readFile("src/student-area-entry.js", "utf8"),
    readFile("index.html", "utf8"),
    readFile("android/app/src/main/AndroidManifest.xml", "utf8"),
    readFile("android/app/src/main/res/raw/mayfit_timer.wav"),
    readFile("android/app/src/main/res/raw/mayfit_rest.wav"),
  ]);
  const capacitor = JSON.parse(await readFile("capacitor.config.json", "utf8"));

  assert.match(main, /timerSecondsRemaining\(deadline\)/);
  assert.match(main, /scheduleTimerNotification/);
  assert.doesNotMatch(main, /setSeconds\(\(s\) => Math\.max\(0, s - 1\)\)/);

  assert.match(notifications, /LocalNotifications\.schedule/);
  assert.match(notifications, /checkExactNotificationSetting/);
  assert.doesNotMatch(notifications, /changeExactNotificationSetting/);
  assert.match(notifications, /mayfit-workout-exercise-v3/);
  assert.match(notifications, /mayfit-workout-rest-v3/);
  assert.match(notifications, /allowWhileIdle: exactAlarmEnabled/);

  assert.match(index, /mobile-workout-sounds\.js\?v=3/);
  assert.match(index, /sw\.js\?v=44/);
  assert.doesNotMatch(studentEntry, /mobile-workout-sounds/);

  for (const removed of [
    "src/ios-timer-sounds.js",
    "src/android-workout-sounds.js",
    "src/android-workout-voice.js",
    "src/android-timer-runtime-fix.js",
  ]) {
    await assert.rejects(
      () => readFile(removed, "utf8"),
      (error) => error?.code === "ENOENT",
    );
  }

  assert.match(mobileSounds, /ANDROID_USER_AGENT/);
  assert.match(mobileSounds, /IOS_USER_AGENT/);
  assert.match(mobileSounds, /isSupportedMobileDevice/);
  assert.match(mobileSounds, /mayfit_workout_sound_settings_v2/);

  assert.match(mobileSounds, /normalizeText\(button\.textContent\) === "START"/);
  assert.match(mobileSounds, /armPendingTimerStart/);
  assert.match(mobileSounds, /confirmPendingTimerStart/);
  assert.match(mobileSounds, /button\.classList\.contains\("running"\)/);
  assert.equal((mobileSounds.match(/playCue\("start"\)/g) || []).length, 1);
  assert.doesNotMatch(mobileSounds, /closest\("\.hero"\)/);
  assert.doesNotMatch(mobileSounds, /complete-button/);

  assert.match(mobileSounds, /lastPhase === "TEMPO" && phase === "PAUSA"/);
  assert.match(mobileSounds, /playCue\("rest"\)/);
  assert.match(mobileSounds, /allWorkoutRowsDone/);
  assert.match(mobileSounds, /playCue\("finish"\)/);
  assert.doesNotMatch(mobileSounds, /lastPhase === "PAUSA" && phase === "TEMPO"/);

  assert.match(mobileSounds, /SpeechSynthesisUtterance/);
  assert.match(mobileSounds, /preferredPortugueseVoice/);
  assert.match(mobileSounds, /data-voice-select/);
  assert.match(mobileSounds, /voiceschanged/);
  assert.doesNotMatch(mobileSounds, /VOICE_SOURCES/);
  assert.doesNotMatch(mobileSounds, /base64\.txt/);
  assert.doesNotMatch(mobileSounds, /playEmbeddedVoice/);

  for (const label of [
    "Voz natural do aparelho",
    "Bip esportivo",
    "Sinos",
    "Apito",
    "Alerta digital",
    "Sem som",
  ]) {
    assert.match(mobileSounds, new RegExp(label));
  }
  assert.match(mobileSounds, /mayfit-profile-sounds/);
  assert.match(mobileSounds, /Sons do treino/);
  assert.match(mobileSounds, /data-sound-preset/);
  assert.match(mobileSounds, /data-sound-select/);
  assert.match(mobileSounds, /MutationObserver/);
  assert.doesNotMatch(mobileSounds, /setInterval/);
  assert.match(mobileSounds, /legacyTimerTone \? 0 : value/);

  assert.match(mobileSounds, /if \(!isAndroidDevice\(\) \|\| document\.hidden\) return;/);
  assert.match(mobileSounds, /cancelTimerNotification/);
  assert.match(mobileSounds, /scheduleNativeAlertForBackground/);
  assert.match(mobileSounds, /scheduleTimerNotification/);

  assert.match(manifest, /android\.permission\.USE_EXACT_ALARM/);
  assert.equal(capacitor.plugins.LocalNotifications.smallIcon, "ic_stat_mayfit_timer");
  assert.equal(capacitor.plugins.LocalNotifications.sound, "mayfit_timer.wav");
  for (const sound of [exerciseSound, restSound]) {
    assert.equal(sound.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(sound.subarray(8, 12).toString("ascii"), "WAVE");
  }
  assert.notDeepEqual(exerciseSound, restSound);
});

test("gera o Android 1.3.0 autoatualizavel e um APK instalavel", async () => {
  const [gradle, packageJson, workflow, manifest] = await Promise.all([
    readFile("android/app/build.gradle", "utf8"),
    readFile("package.json", "utf8").then(JSON.parse),
    readFile(".github/workflows/build-android-apk.yml", "utf8"),
    readFile("android/app/src/main/AndroidManifest.xml", "utf8"),
  ]);
  const capacitor = JSON.parse(await readFile("capacitor.config.json", "utf8"));

  assert.match(gradle, /versionCode 5/);
  assert.match(gradle, /versionName "1\.3\.0"/);
  assert.match(packageJson.scripts["android:apk"], /assembleRelease/);
  assert.match(workflow, /assembleDebug/);
  assert.match(workflow, /MaYFiT-Android-Instalavel-1\.3\.0-AutoUpdate/);

  assert.equal(capacitor.server.url, "https://ma-y-fi-t.vercel.app");
  assert.equal(capacitor.server.cleartext, false);
  assert.deepEqual(capacitor.server.allowNavigation, ["ma-y-fi-t.vercel.app"]);
  assert.match(manifest, /android\.permission\.INTERNET/);

  assert.equal(packageJson.dependencies["@capacitor/app"], "^8.1.1");
  assert.equal(packageJson.dependencies["@capacitor/local-notifications"], "^8.2.1");
});
