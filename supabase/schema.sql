-- MaYFiT — estrutura inicial do banco de dados Supabase

create extension if not exists "uuid-ossp";

create type public.user_role as enum ('admin', 'student');
create type public.account_status as enum ('pending', 'active', 'blocked');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role public.user_role not null default 'student',
  status public.account_status not null default 'pending',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  birth_date date,
  height_cm numeric(5,2),
  current_weight_kg numeric(6,2),
  goal text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_plans (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  name text not null,
  description text,
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_days (
  id uuid primary key default uuid_generate_v4(),
  workout_plan_id uuid not null references public.workout_plans(id) on delete cascade,
  name text not null,
  muscle_groups text[],
  position integer not null default 0
);

create table public.exercises (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  muscle_group text,
  instructions text,
  video_url text,
  image_url text,
  created_at timestamptz not null default now()
);

create table public.workout_day_exercises (
  id uuid primary key default uuid_generate_v4(),
  workout_day_id uuid not null references public.workout_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  sets integer not null default 3,
  reps text not null default '12',
  planned_load_kg numeric(7,2),
  rest_seconds integer not null default 60,
  notes text,
  position integer not null default 0
);

create table public.workout_sessions (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  workout_day_id uuid references public.workout_days(id),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_seconds integer,
  notes text
);

create table public.exercise_logs (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  set_number integer not null,
  reps integer,
  load_kg numeric(7,2),
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.measurements (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  measured_at date not null default current_date,
  weight_kg numeric(6,2),
  body_fat_percent numeric(5,2),
  chest_cm numeric(6,2),
  waist_cm numeric(6,2),
  hip_cm numeric(6,2),
  arm_left_cm numeric(6,2),
  arm_right_cm numeric(6,2),
  thigh_left_cm numeric(6,2),
  thigh_right_cm numeric(6,2),
  notes text,
  created_at timestamptz not null default now()
);

create table public.progress_photos (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  photo_url text not null,
  photo_type text,
  taken_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_days enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_day_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.exercise_logs enable row level security;
alter table public.measurements enable row level security;
alter table public.progress_photos enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create policy "profiles own or admin read" on public.profiles
for select using (id = auth.uid() or public.is_admin());

create policy "profiles own update" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

create policy "admins manage profiles" on public.profiles
for all using (public.is_admin()) with check (public.is_admin());

create policy "students own or admin" on public.students
for all using (profile_id = auth.uid() or public.is_admin())
with check (profile_id = auth.uid() or public.is_admin());

create policy "exercise catalog authenticated read" on public.exercises
for select to authenticated using (true);

create policy "admins manage exercises" on public.exercises
for all using (public.is_admin()) with check (public.is_admin());

-- As demais políticas serão refinadas durante a integração funcional.
