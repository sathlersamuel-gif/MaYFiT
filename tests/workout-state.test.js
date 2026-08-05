import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

class MemoryStorage {
  #data = new Map();

  getItem(key) {
    return this.#data.has(String(key)) ? this.#data.get(String(key)) : null;
  }

  setItem(key, value) {
    this.#data.set(String(key), String(value));
  }

  removeItem(key) {
    this.#data.delete(String(key));
  }

  clear() {
    this.#data.clear();
  }
}

globalThis.localStorage = new MemoryStorage();
globalThis.sessionStorage = new MemoryStorage();

const {
  currentWorkoutOwnerId,
  readWorkoutData,
  readWorkoutHistory,
  workoutStorageKey,
  writeWorkoutData,
  writeWorkoutHistory,
} = await import("../src/lib/workout-state.js");

function login(id, name) {
  sessionStorage.setItem(
    "mayfit_user",
    JSON.stringify({ id, name, role: "student" }),
  );
}

test("mantém treino e histórico isolados por aluno", () => {
  login("student-a", "Aluno A");
  writeWorkoutData(
    {
      exercises: [{ id: 1, type: "supino", name: "Supino A" }],
      sessions: [{ id: "session-a" }],
      workoutName: "Treino A",
    },
    { sync: false },
  );
  writeWorkoutHistory([{ id: "history-a", name: "Treino A" }], {
    sync: false,
  });

  login("student-b", "Aluno B");
  assert.equal(readWorkoutData(), null);
  assert.deepEqual(readWorkoutHistory(), []);
  writeWorkoutData(
    {
      exercises: [{ id: 2, type: "remada", name: "Remada B" }],
      sessions: [],
      workoutName: "Treino B",
    },
    { sync: false },
  );

  login("student-a", "Aluno A");
  assert.equal(currentWorkoutOwnerId(), "student-a");
  assert.equal(readWorkoutData().workoutName, "Treino A");
  assert.equal(readWorkoutData().exercises[0].name, "Supino A");
  assert.equal(readWorkoutHistory()[0].id, "history-a");

  login("student-b", "Aluno B");
  assert.equal(readWorkoutData().workoutName, "Treino B");
  assert.equal(readWorkoutData().exercises[0].name, "Remada B");
  assert.notEqual(workoutStorageKey("student-a"), workoutStorageKey("student-b"));
});

test("migra o armazenamento antigo somente para o primeiro aluno", () => {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem(
    "mayfit_v8",
    JSON.stringify({
      exercises: [{ id: 9, type: "legpress", name: "Legado" }],
      sessions: [],
      workoutName: "Treino antigo",
    }),
  );

  login("student-first", "Primeiro");
  assert.equal(readWorkoutData().workoutName, "Treino antigo");

  login("student-second", "Segundo");
  assert.equal(readWorkoutData(), null);
});

test("mantém uma única fonte de treino e as otimizações futuras", async () => {
  const files = [
    "src/main.jsx",
    "src/student-exercise-manager-fast.js",
    "src/student-exercise-access.js",
    "src/workout-live-sync-and-selection.js",
    "src/exercise-rename-translate.js",
    "src/workout-name-edit.js",
  ];
  const sources = await Promise.all(files.map((file) => readFile(file, "utf8")));
  sources.forEach((source, index) => {
    assert.match(source, /workout-state\.js/, `${files[index]} usa o estado por aluno`);
    assert.doesNotMatch(source, /const STORE\s*=\s*["']mayfit_v8/);
  });

  const evolution = await readFile("src/body-evolution.js", "utf8");
  assert.match(evolution, /createSignedUrls\(chunk, 3600\)/);
  assert.match(evolution, /Promise\.all/);

  const html = await readFile("index.html", "utf8");
  assert.doesNotMatch(html, /setInterval\(refreshDynamicUi/);

  const migration = await readFile(
    "supabase/004_student_state_and_admin_photos.sql",
    "utf8",
  );
  assert.match(migration, /create table if not exists public\.student_app_state/);
  assert.match(migration, /public\.is_admin\(\)/);
});

test("a rotina visual do aluno não remove componentes do administrador", async () => {
  const source = await readFile("src/student-performance-fix.js", "utf8");
  const restoreStart = source.indexOf("function restoreStudentHome()");
  const panelRemoval = source.indexOf("panel.remove()", restoreStart);
  const adminGuard = source.indexOf(
    "if(currentUser()?.role!=='student')return;",
    restoreStart,
  );
  assert.ok(restoreStart >= 0, "rotina de restauração encontrada");
  assert.ok(adminGuard > restoreStart, "proteção do perfil encontrada");
  assert.ok(adminGuard < panelRemoval, "proteção executa antes de remover o painel");
});

test("mantém o ícone do MayFit configurado no site e no Android", async () => {
  const manifest = JSON.parse(
    await readFile("public/manifest.webmanifest", "utf8"),
  );
  assert.equal(manifest.name, "MaYFiT");
  assert.deepEqual(
    manifest.icons.map(({ src, sizes }) => ({ src, sizes })),
    [
      { src: "/icons/mayfit-icon-192.png", sizes: "192x192" },
      { src: "/icons/mayfit-icon-512.png", sizes: "512x512" },
    ],
  );

  const capacitor = JSON.parse(
    await readFile("capacitor.config.json", "utf8"),
  );
  assert.equal(capacitor.appId, "com.mayfit.app");
  assert.equal(capacitor.appName, "MaYFiT");
  assert.equal(capacitor.webDir, "dist");

  const androidManifest = await readFile(
    "android/app/src/main/AndroidManifest.xml",
    "utf8",
  );
  assert.match(androidManifest, /android:icon="@mipmap\/ic_launcher"/);
  assert.match(androidManifest, /android:screenOrientation="portrait"/);
});
