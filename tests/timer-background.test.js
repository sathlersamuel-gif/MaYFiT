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

test("mantém os alarmes nativos sem abrir configurações do Android", async () => {
  const [
    main,
    notifications,
    androidRuntimeFix,
    studentEntry,
    manifest,
    exerciseSound,
    restSound,
  ] = await Promise.all([
    readFile("src/main.jsx", "utf8"),
    readFile("src/lib/workout-timer-notifications.js", "utf8"),
    readFile("src/android-timer-runtime-fix.js", "utf8"),
    readFile("src/student-area-entry.js", "utf8"),
    readFile("android/app/src/main/AndroidManifest.xml", "utf8"),
    readFile("android/app/src/main/res/raw/mayfit_timer.wav"),
    readFile("android/app/src/main/res/raw/mayfit_rest.wav"),
  ]);
  const capacitor = JSON.parse(
    await readFile("capacitor.config.json", "utf8"),
  );

  assert.match(main, /timerSecondsRemaining\(deadline\)/);
  assert.match(main, /addTimerResumeListener/);
  assert.match(main, /scheduleTimerNotification/);
  assert.doesNotMatch(main, /setSeconds\(\(s\) => Math\.max\(0, s - 1\)\)/);

  assert.match(notifications, /LocalNotifications\.schedule/);
  assert.match(notifications, /checkExactNotificationSetting/);
  assert.doesNotMatch(notifications, /changeExactNotificationSetting/);
  assert.match(notifications, /mayfit-workout-exercise-v2/);
  assert.match(notifications, /mayfit-workout-rest-v2/);
  assert.match(notifications, /mayfit_timer\.wav/);
  assert.match(notifications, /mayfit_rest\.wav/);
  assert.match(notifications, /allowWhileIdle: exactAlarmEnabled/);

  assert.match(studentEntry, /android-timer-runtime-fix\.js\?v=1/);
  assert.match(androidRuntimeFix, /BLOCKED_WARNING/);
  assert.match(androidRuntimeFix, /EXERCISE_TONES/);
  assert.match(androidRuntimeFix, /REST_TONES/);
  assert.match(androidRuntimeFix, /currentTimerPhase\(\) === "PAUSA"/);

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
