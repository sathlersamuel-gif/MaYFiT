-- MaYFiT — banco completo para cadastro, aprovação e dados individuais
create extension if not exists "uuid-ossp";

do $$ begin
  create type public.user_role as enum ('admin', 'student');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.account_status as enum ('pending', 'approved', 'blocked', 'refused');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role public.user_role not null default 'student',
  status public.account_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workouts (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  days text[] not null default '{}',
  exercises jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_sessions (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete set null,
  workout_name text,
  exercises jsonb not null default '[]'::jsonb,
  completed_at timestamptz not null default now()
);

create table if not exists public.measurements (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  measured_at date not null default current_date,
  weight numeric(6,2),
  waist numeric(6,2),
  chest numeric(6,2),
  hip numeric(6,2),
  arm numeric(6,2),
  thigh numeric(6,2),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.progress_photos (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  photo_url text not null,
  caption text,
  taken_at date not null default current_date,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists workouts_updated_at on public.workouts;
create trigger workouts_updated_at before update on public.workouts
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email,''),'@',1), 'Aluno'),
    new.email,
    new.raw_user_meta_data->>'phone',
    'student',
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'approved'
  );
$$;

create or replace function public.account_is_approved()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved'
  );
$$;

alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.measurements enable row level security;
alter table public.progress_photos enable row level security;

drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles
for select to authenticated using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles update by admin" on public.profiles;
create policy "profiles update by admin" on public.profiles
for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "workouts read own or admin" on public.workouts;
create policy "workouts read own or admin" on public.workouts
for select to authenticated using ((student_id = auth.uid() and public.account_is_approved()) or public.is_admin());

drop policy if exists "workouts admin insert" on public.workouts;
create policy "workouts admin insert" on public.workouts
for insert to authenticated with check (public.is_admin());

drop policy if exists "workouts admin update" on public.workouts;
create policy "workouts admin update" on public.workouts
for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "workouts admin delete" on public.workouts;
create policy "workouts admin delete" on public.workouts
for delete to authenticated using (public.is_admin());

drop policy if exists "sessions own or admin read" on public.workout_sessions;
create policy "sessions own or admin read" on public.workout_sessions
for select to authenticated using ((student_id = auth.uid() and public.account_is_approved()) or public.is_admin());

drop policy if exists "sessions own insert" on public.workout_sessions;
create policy "sessions own insert" on public.workout_sessions
for insert to authenticated with check (student_id = auth.uid() and public.account_is_approved());

drop policy if exists "measurements own or admin read" on public.measurements;
create policy "measurements own or admin read" on public.measurements
for select to authenticated using ((student_id = auth.uid() and public.account_is_approved()) or public.is_admin());

drop policy if exists "measurements own insert" on public.measurements;
create policy "measurements own insert" on public.measurements
for insert to authenticated with check (student_id = auth.uid() and public.account_is_approved());

drop policy if exists "measurements own update" on public.measurements;
create policy "measurements own update" on public.measurements
for update to authenticated using (student_id = auth.uid() and public.account_is_approved())
with check (student_id = auth.uid() and public.account_is_approved());

drop policy if exists "photos own or admin read" on public.progress_photos;
create policy "photos own or admin read" on public.progress_photos
for select to authenticated using ((student_id = auth.uid() and public.account_is_approved()) or public.is_admin());

drop policy if exists "photos own insert" on public.progress_photos;
create policy "photos own insert" on public.progress_photos
for insert to authenticated with check (student_id = auth.uid() and public.account_is_approved());

drop policy if exists "photos own delete" on public.progress_photos;
create policy "photos own delete" on public.progress_photos
for delete to authenticated using (student_id = auth.uid() or public.is_admin());

insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

drop policy if exists "progress photos upload own folder" on storage.objects;
create policy "progress photos upload own folder" on storage.objects
for insert to authenticated
with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text and public.account_is_approved());

drop policy if exists "progress photos read own or admin" on storage.objects;
create policy "progress photos read own or admin" on storage.objects
for select to authenticated
using (bucket_id = 'progress-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

drop policy if exists "progress photos delete own or admin" on storage.objects;
create policy "progress photos delete own or admin" on storage.objects
for delete to authenticated
using (bucket_id = 'progress-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- Depois de criar sua conta, transforme-a em administrador executando:
-- update public.profiles
-- set role = 'admin', status = 'approved'
-- where email = 'SEU_EMAIL';
