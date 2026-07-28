-- MaYFiT — complementos finais do banco
-- Execute depois de supabase/schema.sql

create table if not exists public.goals (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null,
  target_value numeric(10,2),
  unit text,
  deadline date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  workout_reminders boolean not null default true,
  progress_reminders boolean not null default true,
  theme text not null default 'dark',
  updated_at timestamptz not null default now()
);

alter table public.goals enable row level security;
alter table public.notifications enable row level security;
alter table public.app_settings enable row level security;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    'student',
    'pending'
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.handle_profile_student()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'student' then
    insert into public.students (profile_id)
    values (new.id) on conflict (profile_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
after insert or update of role on public.profiles
for each row execute procedure public.handle_profile_student();

-- Planos, dias e exercícios: aluno lê o próprio; admin gerencia tudo.
create policy "plans own read" on public.workout_plans for select using (
  public.is_admin() or exists(select 1 from public.students s where s.id = student_id and s.profile_id = auth.uid())
);
create policy "plans admin write" on public.workout_plans for all using (public.is_admin()) with check (public.is_admin());

create policy "days own read" on public.workout_days for select using (
  public.is_admin() or exists(
    select 1 from public.workout_plans p join public.students s on s.id=p.student_id
    where p.id=workout_plan_id and s.profile_id=auth.uid()
  )
);
create policy "days admin write" on public.workout_days for all using (public.is_admin()) with check (public.is_admin());

create policy "day exercises own read" on public.workout_day_exercises for select using (
  public.is_admin() or exists(
    select 1 from public.workout_days d
    join public.workout_plans p on p.id=d.workout_plan_id
    join public.students s on s.id=p.student_id
    where d.id=workout_day_id and s.profile_id=auth.uid()
  )
);
create policy "day exercises admin write" on public.workout_day_exercises for all using (public.is_admin()) with check (public.is_admin());

create policy "sessions own or admin" on public.workout_sessions for all using (
  public.is_admin() or exists(select 1 from public.students s where s.id=student_id and s.profile_id=auth.uid())
) with check (
  public.is_admin() or exists(select 1 from public.students s where s.id=student_id and s.profile_id=auth.uid())
);

create policy "logs own or admin" on public.exercise_logs for all using (
  public.is_admin() or exists(
    select 1 from public.workout_sessions ws join public.students s on s.id=ws.student_id
    where ws.id=session_id and s.profile_id=auth.uid()
  )
) with check (
  public.is_admin() or exists(
    select 1 from public.workout_sessions ws join public.students s on s.id=ws.student_id
    where ws.id=session_id and s.profile_id=auth.uid()
  )
);

create policy "measurements own or admin" on public.measurements for all using (
  public.is_admin() or exists(select 1 from public.students s where s.id=student_id and s.profile_id=auth.uid())
) with check (
  public.is_admin() or exists(select 1 from public.students s where s.id=student_id and s.profile_id=auth.uid())
);

create policy "photos own or admin" on public.progress_photos for all using (
  public.is_admin() or exists(select 1 from public.students s where s.id=student_id and s.profile_id=auth.uid())
) with check (
  public.is_admin() or exists(select 1 from public.students s where s.id=student_id and s.profile_id=auth.uid())
);

create policy "goals own or admin" on public.goals for all using (
  public.is_admin() or exists(select 1 from public.students s where s.id=student_id and s.profile_id=auth.uid())
) with check (
  public.is_admin() or exists(select 1 from public.students s where s.id=student_id and s.profile_id=auth.uid())
);

create policy "notifications own" on public.notifications for select using (profile_id=auth.uid() or public.is_admin());
create policy "notifications own update" on public.notifications for update using (profile_id=auth.uid()) with check (profile_id=auth.uid());
create policy "notifications admin insert" on public.notifications for insert with check (public.is_admin());

create policy "settings own" on public.app_settings for all using (profile_id=auth.uid()) with check (profile_id=auth.uid());

-- Fotos privadas: caminho obrigatório profile_id/arquivo.ext
insert into storage.buckets (id, name, public)
values ('progress-photos','progress-photos',false)
on conflict (id) do nothing;

create policy "photo owner read" on storage.objects for select using (
  bucket_id='progress-photos' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
);
create policy "photo owner upload" on storage.objects for insert with check (
  bucket_id='progress-photos' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "photo owner change" on storage.objects for update using (
  bucket_id='progress-photos' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "photo owner delete" on storage.objects for delete using (
  bucket_id='progress-photos' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
);

-- Índices
create index if not exists idx_workout_plans_student on public.workout_plans(student_id);
create index if not exists idx_sessions_student_date on public.workout_sessions(student_id, started_at desc);
create index if not exists idx_measurements_student_date on public.measurements(student_id, measured_at desc);
create index if not exists idx_notifications_profile on public.notifications(profile_id, created_at desc);
