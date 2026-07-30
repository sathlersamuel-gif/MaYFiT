import { supabase } from './lib/supabase.js';

const STORE_KEY = 'mayfit_v8';
const USER_KEY = 'mayfit_user';
const ADMIN_RETURN_KEY = 'mayfit_admin_return';
const VIEW_STUDENT_KEY = 'mayfit_view_student';
const TABLE = 'student_workouts';

let applyingRemote = false;
let saveTimer = null;
let activeStudentId = null;
let lastRemoteUpdatedAt = '';
let channel = null;

function readJson(storage, key) {
  try { return JSON.parse(storage.getItem(key) || 'null'); } catch { return null; }
}

function targetStudentId() {
  const current = readJson(sessionStorage, USER_KEY);
  const admin = readJson(sessionStorage, ADMIN_RETURN_KEY);
  const viewed = readJson(sessionStorage, VIEW_STUDENT_KEY);

  if (admin?.role === 'admin' && viewed?.id) return viewed.id;
  if (current?.role === 'admin' && viewed?.id) return viewed.id;
  if (current?.role === 'student' && current?.id && current.id !== 'aluno') return current.id;
  return null;
}

function currentPayload() {
  const value = readJson(localStorage, STORE_KEY);
  return value && typeof value === 'object' ? value : null;
}

function emptyPayload() {
  const local = currentPayload() || {};
  return {
    ...local,
    exercises: [],
    sessions: Array.isArray(local.sessions) ? local.sessions : []
  };
}

function samePayload(a, b) {
  try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
}

async function saveCloud() {
  const studentId = targetStudentId();
  const payload = currentPayload();
  if (!studentId || !payload || applyingRemote || !supabase) return;

  const { error } = await supabase.from(TABLE).upsert({
    student_id: studentId,
    workout_data: payload,
    updated_at: new Date().toISOString()
  }, { onConflict: 'student_id' });

  if (error) console.error('MaYFiT: falha ao sincronizar treino:', error.message);
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveCloud, 500);
}

function applyRemote(row, reload = true) {
  if (!row?.workout_data) return false;
  const local = currentPayload();
  if (samePayload(local, row.workout_data)) {
    lastRemoteUpdatedAt = row.updated_at || lastRemoteUpdatedAt;
    return false;
  }

  applyingRemote = true;
  localStorage.setItem(STORE_KEY, JSON.stringify(row.workout_data));
  applyingRemote = false;
  lastRemoteUpdatedAt = row.updated_at || '';

  if (reload && !document.querySelector('.workout-screen')) location.reload();
  else sessionStorage.setItem('mayfit_cloud_update_pending', 'true');
  return true;
}

function clearLegacyLocalWorkout(reload = true) {
  const cleared = emptyPayload();
  if (samePayload(currentPayload(), cleared)) return false;
  applyingRemote = true;
  localStorage.setItem(STORE_KEY, JSON.stringify(cleared));
  applyingRemote = false;
  if (reload && !document.querySelector('.workout-screen')) location.reload();
  else sessionStorage.setItem('mayfit_cloud_update_pending', 'true');
  return true;
}

async function loadCloud({ reload = false } = {}) {
  const studentId = targetStudentId();
  if (!studentId || !supabase) return;
  activeStudentId = studentId;

  const { data, error } = await supabase
    .from(TABLE)
    .select('student_id,workout_data,updated_at')
    .eq('student_id', studentId)
    .maybeSingle();

  if (error) {
    console.error('MaYFiT: falha ao buscar treino sincronizado:', error.message);
    return;
  }

  if (data) {
    applyRemote(data, reload);
    return;
  }

  clearLegacyLocalWorkout(reload);
}

function subscribe(studentId) {
  if (!supabase || !studentId) return;
  if (channel) supabase.removeChannel(channel);
  channel = supabase
    .channel(`mayfit-workout-${studentId}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: TABLE, filter: `student_id=eq.${studentId}`
    }, payload => {
      const row = payload.new;
      if (!row || row.updated_at === lastRemoteUpdatedAt) return;
      applyRemote(row, true);
    })
    .subscribe();
}

function installStorageHook() {
  const original = Storage.prototype.setItem;
  if (original.__mayfitCloudHook) return;

  function hookedSetItem(key, value) {
    original.call(this, key, value);
    if (this === localStorage && key === STORE_KEY && !applyingRemote) scheduleSave();
  }
  hookedSetItem.__mayfitCloudHook = true;
  Storage.prototype.setItem = hookedSetItem;
}

function watchTargetChanges() {
  setInterval(async () => {
    const next = targetStudentId();
    if (!next || next === activeStudentId) {
      if (sessionStorage.getItem('mayfit_cloud_update_pending') === 'true' && !document.querySelector('.workout-screen')) {
        sessionStorage.removeItem('mayfit_cloud_update_pending');
        location.reload();
      }
      return;
    }
    activeStudentId = next;
    await loadCloud({ reload: true });
    subscribe(next);
  }, 1500);

  const refresh = () => loadCloud({ reload: true });
  window.addEventListener('focus', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
}

export async function initializeWorkoutCloudSync() {
  installStorageHook();
  await loadCloud({ reload: false });
  const studentId = targetStudentId();
  if (studentId) subscribe(studentId);
  watchTargetChanges();
}
