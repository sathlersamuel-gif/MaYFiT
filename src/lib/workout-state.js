import { supabase } from "./supabase.js";

export const LEGACY_WORKOUT_KEY = "mayfit_v8";
export const WORKOUT_UPDATED_EVENT = "mayfit-store-updated";

const DATA_PREFIX = "mayfit_workout_state_v2_";
const META_PREFIX = "mayfit_workout_state_meta_v2_";
const HISTORY_PREFIX = "mayfit_workout_history_v2_";
const LEGACY_HISTORY_PREFIX = "mayfit_workout_history_";
const MIGRATION_OWNER_KEY = "mayfit_v8_migration_owner";
const CLOUD_MARKER_START = "[[MAYFIT_STATE_V2]]";
const CLOUD_MARKER_END = "[[/MAYFIT_STATE_V2]]";
const CLOUD_TABLE = "student_app_state";
const syncStates = new Map();

function currentUser() {
  try {
    return JSON.parse(sessionStorage.getItem("mayfit_user") || "null");
  } catch {
    return null;
  }
}

export function currentWorkoutOwnerId() {
  const user = currentUser();
  if (user?.role === "student" && user.id) return String(user.id);
  const selected = sessionStorage.getItem("mayfit_selected_student_id");
  if (user?.role === "admin" && selected) return selected;
  return user?.id ? `local-${user.id}` : "guest";
}

export function workoutStorageKey(ownerId = currentWorkoutOwnerId()) {
  return `${DATA_PREFIX}${ownerId}`;
}

export function workoutHistoryKey(ownerId = currentWorkoutOwnerId()) {
  return `${HISTORY_PREFIX}${ownerId}`;
}

function metaKey(ownerId) {
  return `${META_PREFIX}${ownerId}`;
}

function isProfileId(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || ""),
  );
}

function parse(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function cleanWorkoutData(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    exercises: Array.isArray(source.exercises)
      ? source.exercises.slice(0, 500)
      : [],
    sessions: Array.isArray(source.sessions) ? source.sessions.slice(-500) : [],
    workoutName:
      String(source.workoutName || "Treino A").trim().slice(0, 120) ||
      "Treino A",
  };
}

function cleanHistory(value) {
  return Array.isArray(value) ? value.slice(0, 250) : [];
}

function localUpdatedAt(ownerId) {
  return Number(localStorage.getItem(metaKey(ownerId)) || 0);
}

function setLocalUpdatedAt(ownerId, value = Date.now()) {
  localStorage.setItem(metaKey(ownerId), String(Number(value) || Date.now()));
}

function migrateLegacyData(ownerId) {
  if (localStorage.getItem(workoutStorageKey(ownerId))) return;
  const user = currentUser();
  if (user?.role !== "student") return;
  const legacy = parse(localStorage.getItem(LEGACY_WORKOUT_KEY));
  if (!legacy || typeof legacy !== "object") return;
  const claimedBy = localStorage.getItem(MIGRATION_OWNER_KEY);
  if (claimedBy && claimedBy !== ownerId) return;
  localStorage.setItem(MIGRATION_OWNER_KEY, ownerId);
  localStorage.setItem(
    workoutStorageKey(ownerId),
    JSON.stringify(cleanWorkoutData(legacy)),
  );
  setLocalUpdatedAt(ownerId);
}

function migrateLegacyHistory(ownerId) {
  const key = workoutHistoryKey(ownerId);
  if (localStorage.getItem(key)) return;
  const legacy = parse(
    localStorage.getItem(`${LEGACY_HISTORY_PREFIX}${ownerId}`),
  );
  if (!Array.isArray(legacy)) return;
  localStorage.setItem(key, JSON.stringify(cleanHistory(legacy)));
}

export function readWorkoutData(ownerId = currentWorkoutOwnerId()) {
  migrateLegacyData(ownerId);
  const value = parse(localStorage.getItem(workoutStorageKey(ownerId)));
  return value && typeof value === "object" ? cleanWorkoutData(value) : null;
}

export function readWorkoutHistory(ownerId = currentWorkoutOwnerId()) {
  migrateLegacyHistory(ownerId);
  return cleanHistory(
    parse(localStorage.getItem(workoutHistoryKey(ownerId)), []),
  );
}

function writeLocalEnvelope(ownerId, envelope, notify = true) {
  if (envelope.data)
    localStorage.setItem(
      workoutStorageKey(ownerId),
      JSON.stringify(cleanWorkoutData(envelope.data)),
    );
  if (Array.isArray(envelope.history))
    localStorage.setItem(
      workoutHistoryKey(ownerId),
      JSON.stringify(cleanHistory(envelope.history)),
    );
  setLocalUpdatedAt(ownerId, envelope.updatedAt);
  if (notify && typeof window !== "undefined") {
    window.dispatchEvent(new Event(WORKOUT_UPDATED_EVENT));
    window.dispatchEvent(
      new CustomEvent("mayfit-workout-hydrated", { detail: { ownerId } }),
    );
  }
}

function localEnvelope(ownerId) {
  return {
    version: 2,
    ownerId,
    updatedAt: localUpdatedAt(ownerId),
    data: readWorkoutData(ownerId),
    history: readWorkoutHistory(ownerId),
  };
}

export function writeWorkoutData(
  data,
  { notify = true, sync = true } = {},
) {
  const ownerId = currentWorkoutOwnerId();
  const updatedAt = Date.now();
  localStorage.setItem(
    workoutStorageKey(ownerId),
    JSON.stringify(cleanWorkoutData(data)),
  );
  setLocalUpdatedAt(ownerId, updatedAt);
  if (notify && typeof window !== "undefined")
    window.dispatchEvent(new Event(WORKOUT_UPDATED_EVENT));
  if (sync) scheduleWorkoutCloudSync(ownerId);
  return cleanWorkoutData(data);
}

export function writeWorkoutHistory(history, { sync = true } = {}) {
  const ownerId = currentWorkoutOwnerId();
  const cleaned = cleanHistory(history);
  localStorage.setItem(workoutHistoryKey(ownerId), JSON.stringify(cleaned));
  setLocalUpdatedAt(ownerId);
  if (typeof window !== "undefined")
    window.dispatchEvent(
      new CustomEvent("mayfit-workout-history-updated", {
        detail: { ownerId },
      }),
    );
  if (sync) scheduleWorkoutCloudSync(ownerId);
  return cleaned;
}

function extractMarkedEnvelope(notes) {
  const text = String(notes || "");
  const start = text.lastIndexOf(CLOUD_MARKER_START);
  if (start < 0) return null;
  const contentStart = start + CLOUD_MARKER_START.length;
  const end = text.indexOf(CLOUD_MARKER_END, contentStart);
  if (end < 0) return null;
  const value = parse(text.slice(contentStart, end).trim());
  return value && value.version === 2 ? value : null;
}

function mergeMarkedEnvelope(notes, envelope) {
  const text = String(notes || "");
  const start = text.lastIndexOf(CLOUD_MARKER_START);
  const end =
    start >= 0 ? text.indexOf(CLOUD_MARKER_END, start) : -1;
  const before = start >= 0 ? text.slice(0, start).trimEnd() : text.trimEnd();
  const after =
    end >= 0 ? text.slice(end + CLOUD_MARKER_END.length).trimStart() : "";
  const preserved = [before, after].filter(Boolean).join("\n");
  const marker = `${CLOUD_MARKER_START}\n${JSON.stringify(envelope)}\n${CLOUD_MARKER_END}`;
  return preserved ? `${preserved}\n\n${marker}` : marker;
}

async function readDedicatedCloudState(ownerId) {
  const { data, error } = await supabase
    .from(CLOUD_TABLE)
    .select("profile_id,workout_data,workout_history,updated_at")
    .eq("profile_id", ownerId)
    .maybeSingle();
  if (error) {
    if (error.code === "PGRST205" || /student_app_state/i.test(error.message))
      return { unavailable: true };
    throw error;
  }
  if (!data) return { available: true, envelope: null };
  return {
    available: true,
    envelope: {
      version: 2,
      ownerId,
      updatedAt: Date.parse(data.updated_at || "") || 0,
      data: cleanWorkoutData(data.workout_data),
      history: cleanHistory(data.workout_history),
    },
  };
}

async function readNotesCloudState(ownerId) {
  const { data, error } = await supabase
    .from("students")
    .select("id,profile_id,notes,updated_at")
    .eq("profile_id", ownerId)
    .maybeSingle();
  if (error) throw error;
  return {
    student: data,
    envelope: data ? extractMarkedEnvelope(data.notes) : null,
  };
}

async function readCloudState(ownerId) {
  const dedicated = await readDedicatedCloudState(ownerId);
  if (!dedicated.unavailable) return { adapter: "table", ...dedicated };
  const notes = await readNotesCloudState(ownerId);
  return { adapter: "notes", ...notes };
}

async function writeDedicatedCloudState(ownerId, envelope) {
  const { error } = await supabase.from(CLOUD_TABLE).upsert(
    {
      profile_id: ownerId,
      workout_data: envelope.data,
      workout_history: envelope.history,
      updated_at: new Date(envelope.updatedAt).toISOString(),
    },
    { onConflict: "profile_id" },
  );
  if (error) throw error;
}

async function writeNotesCloudState(ownerId, envelope) {
  const current = await readNotesCloudState(ownerId);
  if (!current.student?.id)
    throw new Error("Perfil de aluno ainda não está disponível para sincronizar.");
  const notes = mergeMarkedEnvelope(current.student.notes, envelope);
  const { error } = await supabase
    .from("students")
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", current.student.id);
  if (error) throw error;
}

function syncState(ownerId) {
  if (!syncStates.has(ownerId))
    syncStates.set(ownerId, {
      hydrated: false,
      pending: false,
      inFlight: false,
      timer: null,
      adapter: null,
      retries: 0,
    });
  return syncStates.get(ownerId);
}

async function flushWorkoutCloudSync(ownerId) {
  const state = syncState(ownerId);
  if (!state.hydrated || state.inFlight || !state.pending) return;
  state.inFlight = true;
  state.pending = false;
  try {
    const envelope = localEnvelope(ownerId);
    if (!envelope.data) return;
    const cloud = await readCloudState(ownerId);
    state.adapter = cloud.adapter;
    if (cloud.envelope?.updatedAt > envelope.updatedAt) {
      writeLocalEnvelope(ownerId, cloud.envelope);
      state.retries = 0;
      return;
    }
    if (state.adapter === "table")
      await writeDedicatedCloudState(ownerId, envelope);
    else await writeNotesCloudState(ownerId, envelope);
    state.retries = 0;
    if (typeof window !== "undefined")
      window.dispatchEvent(
        new CustomEvent("mayfit-cloud-sync-state", {
          detail: { ownerId, status: "saved" },
        }),
      );
  } catch (error) {
    state.pending = true;
    state.retries += 1;
    if (typeof window !== "undefined")
      window.dispatchEvent(
        new CustomEvent("mayfit-cloud-sync-state", {
          detail: {
            ownerId,
            status: "offline",
            message: error?.message || "Falha de sincronização",
          },
        }),
      );
  } finally {
    state.inFlight = false;
    if (
      state.pending &&
      typeof navigator !== "undefined" &&
      navigator.onLine &&
      state.retries <= 2
    )
      state.timer = window.setTimeout(
        () => flushWorkoutCloudSync(ownerId),
        4000 * state.retries,
      );
  }
}

export function scheduleWorkoutCloudSync(
  ownerId = currentWorkoutOwnerId(),
  delay = 700,
) {
  if (!supabase || !isProfileId(ownerId)) return;
  const state = syncState(ownerId);
  state.pending = true;
  state.retries = 0;
  if (!state.hydrated) return;
  if (state.timer) clearTimeout(state.timer);
  state.timer = window.setTimeout(
    () => flushWorkoutCloudSync(ownerId),
    delay,
  );
}

export async function hydrateWorkoutState(
  ownerId = currentWorkoutOwnerId(),
) {
  const local = localEnvelope(ownerId);
  if (!supabase || !isProfileId(ownerId)) return local.data;
  const state = syncState(ownerId);
  try {
    const cloud = await readCloudState(ownerId);
    state.adapter = cloud.adapter;
    const remote = cloud.envelope;
    if (remote && (!local.data || remote.updatedAt > local.updatedAt)) {
      writeLocalEnvelope(ownerId, remote);
      state.hydrated = true;
      return remote.data;
    }
    state.hydrated = true;
    if (local.data && (!remote || local.updatedAt > remote.updatedAt))
      scheduleWorkoutCloudSync(ownerId, 80);
    return local.data;
  } catch (error) {
    state.hydrated = true;
    state.pending = Boolean(local.data);
    if (typeof window !== "undefined")
      window.dispatchEvent(
        new CustomEvent("mayfit-cloud-sync-state", {
          detail: {
            ownerId,
            status: "offline",
            message: error?.message || "Falha de sincronização",
          },
        }),
      );
    return local.data;
  }
}

if (typeof window !== "undefined") {
  const reconcile = (delay) => {
    const ownerId = currentWorkoutOwnerId();
    hydrateWorkoutState(ownerId).then(() =>
      scheduleWorkoutCloudSync(ownerId, delay),
    );
  };
  window.addEventListener("online", () => reconcile(50));
  window.addEventListener("pageshow", () => reconcile(250));
}
