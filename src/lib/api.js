import { supabase } from './supabase';

function client() {
  if (!supabase) throw new Error('Supabase ainda não configurado.');
  return supabase;
}

export async function getMyProfile(userId) {
  const { data, error } = await client().from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

export async function updateMyProfile(userId, values) {
  const safe = { full_name: values.full_name, phone: values.phone, avatar_url: values.avatar_url, updated_at: new Date().toISOString() };
  const { data, error } = await client().from('profiles').update(safe).eq('id', userId).select().single();
  if (error) throw error;
  return data;
}

export async function listStudents(search = '') {
  let query = client().from('profiles').select('id,full_name,phone,status,role,created_at,students(id,current_weight_kg,goal)').eq('role', 'student').order('created_at', { ascending: false });
  if (search.trim()) query = query.ilike('full_name', `%${search.trim()}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function setStudentStatus(profileId, status) {
  const { data, error } = await client().from('profiles').update({ status, updated_at: new Date().toISOString() }).eq('id', profileId).select().single();
  if (error) throw error;
  await client().from('notifications').insert({ profile_id: profileId, title: status === 'active' ? 'Cadastro aprovado' : 'Situação da conta alterada', message: status === 'active' ? 'Seu acesso ao MaYFiT foi liberado.' : `Sua conta agora está ${status}.` });
  return data;
}

export async function getStudentByProfile(profileId) {
  const { data, error } = await client().from('students').select('*').eq('profile_id', profileId).single();
  if (error) throw error;
  return data;
}

export async function saveStudentDetails(profileId, values) {
  const { data, error } = await client().from('students').update({ ...values, updated_at: new Date().toISOString() }).eq('profile_id', profileId).select().single();
  if (error) throw error;
  return data;
}

export async function listExercises() {
  const { data, error } = await client().from('exercises').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function saveExercise(values, id) {
  const query = id ? client().from('exercises').update(values).eq('id', id) : client().from('exercises').insert(values);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function deleteExercise(id) {
  const { error } = await client().from('exercises').delete().eq('id', id);
  if (error) throw error;
}

export async function createWorkoutPlan({ studentId, name, description, createdBy, days }) {
  const { data: plan, error } = await client().from('workout_plans').insert({ student_id: studentId, name, description, created_by: createdBy }).select().single();
  if (error) throw error;
  for (let dayIndex = 0; dayIndex < days.length; dayIndex += 1) {
    const day = days[dayIndex];
    const { data: savedDay, error: dayError } = await client().from('workout_days').insert({ workout_plan_id: plan.id, name: day.name, muscle_groups: day.muscle_groups || [], position: dayIndex }).select().single();
    if (dayError) throw dayError;
    if (day.exercises?.length) {
      const rows = day.exercises.map((item, index) => ({ workout_day_id: savedDay.id, exercise_id: item.exercise_id, sets: Number(item.sets || 3), reps: String(item.reps || 12), planned_load_kg: item.planned_load_kg || null, rest_seconds: Number(item.rest_seconds || 60), notes: item.notes || null, position: index }));
      const { error: exerciseError } = await client().from('workout_day_exercises').insert(rows);
      if (exerciseError) throw exerciseError;
    }
  }
  return plan;
}

export async function getActiveWorkout(studentId) {
  const { data, error } = await client().from('workout_plans').select('*,workout_days(*,workout_day_exercises(*,exercises(*)))').eq('student_id', studentId).eq('active', true).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function startWorkout(studentId, workoutDayId) {
  const { data, error } = await client().from('workout_sessions').insert({ student_id: studentId, workout_day_id: workoutDayId }).select().single();
  if (error) throw error;
  return data;
}

export async function logSet(values) {
  const { data, error } = await client().from('exercise_logs').upsert(values, { onConflict: 'session_id,exercise_id,set_number' }).select().single();
  if (error) throw error;
  return data;
}

export async function finishWorkout(sessionId, startedAt, notes = '') {
  const finishedAt = new Date();
  const seconds = Math.max(0, Math.round((finishedAt.getTime() - new Date(startedAt).getTime()) / 1000));
  const { data, error } = await client().from('workout_sessions').update({ finished_at: finishedAt.toISOString(), duration_seconds: seconds, notes }).eq('id', sessionId).select().single();
  if (error) throw error;
  return data;
}

export async function listWorkoutHistory(studentId) {
  const { data, error } = await client().from('workout_sessions').select('*,workout_days(name),exercise_logs(*)').eq('student_id', studentId).not('finished_at', 'is', null).order('started_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addMeasurement(values) {
  const { data, error } = await client().from('measurements').insert(values).select().single();
  if (error) throw error;
  if (values.weight_kg) await client().from('students').update({ current_weight_kg: values.weight_kg, updated_at: new Date().toISOString() }).eq('id', values.student_id);
  return data;
}

export async function listMeasurements(studentId) {
  const { data, error } = await client().from('measurements').select('*').eq('student_id', studentId).order('measured_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function uploadProgressPhoto({ userId, studentId, file, type }) {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await client().storage.from('progress-photos').upload(path, file, { upsert: false });
  if (uploadError) throw uploadError;
  const { data: signed, error: signedError } = await client().storage.from('progress-photos').createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signedError) throw signedError;
  const { data, error } = await client().from('progress_photos').insert({ student_id: studentId, photo_url: path, photo_type: type }).select().single();
  if (error) throw error;
  return { ...data, signed_url: signed.signedUrl };
}

export async function listNotifications(profileId) {
  const { data, error } = await client().from('notifications').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return data || [];
}

export async function markNotificationRead(id) {
  const { error } = await client().from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}
