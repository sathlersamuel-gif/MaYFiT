import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  timerDeadline,
  timerSecondsRemaining,
} from "../src/lib/timer-clock.js";

test("calcula o cronômetro pelo horário real após suspensão da tela", () => {
  const deadline = timerDeadline(45, 1_000);
  assert.equal(deadline, 46_000);
  assert.equal(timerSecondsRemaining(deadline, 2_000), 44);
  assert.equal(timerSecondsRemaining(deadline, 45_500), 1);
  assert.equal(timerSecondsRemaining(deadline, 46_000), 0);
  assert.equal(timerSecondsRemaining(deadline, 90_000), 0);
});

test("usa um único motor de sons configurável no Android", async () => {
  const [
    main,
    notifications,
    androidSounds,
    studentEntry,
    manifest,
    exerciseSound,
    restSound,
    descansoBase64,
    iniciandoBase64,
    fimBase64,
  ] = await Promise.all([
    readFile("src/main.jsx", "utf8"),
    readFile("src/lib/workout-timer-notifications.js", "utf8"),
    readFile("src/android-workout-sounds.js", "utf8"),
    readFile("src/student-area-entry.js", "utf8"),
    readFile("android/app/src/main/AndroidManifest.xml", "utf8"),
    readFile("android/app/src/main/res/raw/mayfit_timer.wav"),
    readFile("android/app/src/main/res/raw/mayfit_rest.wav"),
    readFile("public/audio/descanso.base64.txt", "utf8"),
    readFile("public/audio/iniciando-treino.base64.txt", "utf8"),
    readFile("public/audio/fim-treino.base64.txt", "utf8"),
  ]);
  const capacitor = JSON.parse(
    await readFile("capacitor.config.json", "utf8"),
  );

  assert.match(main, /timerSecondsRemaining\(deadline\)/);
  assert.match(main, /scheduleTimerNotification/);
  assert.doesNotMatch(main, /setSeconds\(\(s\) => Math\.max\(0, s - 1\)\)/);

  assert.match(notifications, /LocalNotifications\.schedule/);
  assert.match(notifications, /checkExactNotificationSetting/);
  assert.doesNotMatch(notifications, /changeExactNotificationSetting/);
  assert.match(notifications, /mayfit-workout-exercise-v3/);
  assert.match(notifications, /mayfit-workout-rest-v3/);
  assert.match(notifications, /mayfit_timer\.wav/);
  assert.match(notifications, /mayfit_rest\.wav/);
  assert.match(notifications, /allowWhileIdle: exactAlarmEnabled/);

  assert.match(studentEntry, /android-workout-sounds\.js\?v=1/);
  assert.doesNotMatch(studentEntry, /android-workout-voice/);
  assert.doesNotMatch(studentEntry, /android-timer-runtime-fix/);
  await assert.rejects(
    () => readFile("src/android-workout-voice.js", "utf8"),
    (error) => error?.code === "ENOENT",
  );
  await assert.rejects(
    () => readFile("src/android-timer-runtime-fix.js", "utf8"),
    (error) => error?.code === "ENOENT",
  );

  assert.match(androidSounds, /iniciando-treino\.base64\.txt/);
  assert.match(androidSounds, /descanso\.base64\.txt/);
  assert.match(androidSounds, /fim-treino\.base64\.txt/);
  assert.match(androidSounds, /SpeechSynthesisUtterance/);
  assert.match(androidSounds, /preferredPortugueseVoice/);
  assert.match(androidSounds, /playEmbeddedVoice/);
  assert.match(androidSounds, /decodeAudioData/);
  assert.match(androidSounds, /playCue\("start"\)/);
  assert.match(androidSounds, /playCue\("rest"\)/);
  assert.match(androidSounds, /playCue\("finish"\)/);
  assert.match(androidSounds, /INICIAR TREINO/);
  assert.match(androidSounds, /label === "START"/);
  assert.match(androidSounds, /allWorkoutRowsDone/);
  assert.match(androidSounds, /lastPhase === "TEMPO" && phase === "PAUSA"/);
  assert.match(androidSounds, /lastPhase === "PAUSA" &&/);
  assert.match(androidSounds, /Bip esportivo/);
  assert.match(androidSounds, /Sinos/);
  assert.match(androidSounds, /Apito/);
  assert.match(androidSounds, /Alerta digital/);
  assert.match(androidSounds, /Voz natural \(assistente\)/);
  assert.match(androidSounds, /mayfit_workout_sound_settings_v1/);
  assert.match(androidSounds, /Sons do treino/);
  assert.match(androidSounds, /data-sound-preset/);
  assert.match(androidSounds, /data-sound-select/);
  assert.match(androidSounds, /MutationObserver/);
  assert.doesNotMatch(androidSounds, /setInterval/);
  assert.match(androidSounds, /cancelTimerNotification/);
  assert.match(androidSounds, /scheduleNativeAlertForBackground/);
  assert.match(androidSounds, /scheduleTimerNotification/);
  assert.match(androidSounds, /legacyTimerTone \? 0 : value/);

  const descanso = Buffer.from(descansoBase64.trim(), "base64");
  const iniciando = Buffer.from(iniciandoBase64.trim(), "base64");
  const fim = Buffer.from(fimBase64.trim(), "base64");
  for (const voice of [descanso, iniciando, fim]) {
    assert.equal(voice.subarray(0, 3).toString("ascii"), "ID3");
    assert.ok(voice.length > 1000);
  }
  assert.notDeepEqual(descanso, iniciando);
  assert.notDeepEqual(iniciando, fim);

  assert.match(manifest, /android\.permission\.USE_EXACT_ALARM/);
  assert.equal(
    capacitor.plugins.LocalNotifications.smallIcon,
    "ic_stat_mayfit_timer",
  );
  assert.equal(
    capacitor.plugins.LocalNotifications.sound,
    "mayfit_timer.wav",
  );
  for (const sound of [exerciseSound, restSound]) {
    assert.equal(sound.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(sound.subarray(8, 12).toString("ascii"), "WAVE");
  }
  assert.notDeepEqual(exerciseSound, restSound);
});

test("gera o Android 1.3.0 autoatualizável e um APK instalável", async () => {
  const [gradle, packageJson, workflow, manifest] = await Promise.all([
    readFile("android/app/build.gradle", "utf8"),
    readFile("package.json", "utf8").then(JSON.parse),
    readFile(".github/workflows/build-android-apk.yml", "utf8"),
    readFile("android/app/src/main/AndroidManifest.xml", "utf8"),
  ]);
  const capacitor = JSON.parse(
    await readFile("capacitor.config.json", "utf8"),
  );

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
  assert.equal(
    packageJson.dependencies["@capacitor/local-notifications"],
    "^8.2.1",
  );
});
