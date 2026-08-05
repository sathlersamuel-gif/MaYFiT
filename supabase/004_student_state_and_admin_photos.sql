-- MaYFiT — estado individual do treino e fotos gerenciadas pelo administrador.
-- Migração idempotente: pode ser executada novamente com segurança.

create table if not exists public.student_app_state (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  workout_data jsonb not null default '{}'::jsonb,
  workout_history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.student_app_state enable row level security;

drop policy if exists "student state own or admin" on public.student_app_state;
create policy "student state own or admin" on public.student_app_state
for all
using (profile_id = auth.uid() or public.is_admin())
with check (profile_id = auth.uid() or public.is_admin());

alter table public.body_progress enable row level security;

drop policy if exists "student inserts own body progress" on public.body_progress;
create policy "student inserts own body progress" on public.body_progress
for insert
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "student updates own body progress" on public.body_progress;
create policy "student updates own body progress" on public.body_progress
for update
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "body progress photo upload" on storage.objects;
create policy "body progress photo upload" on storage.objects
for insert
with check (
  bucket_id = 'body-progress'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_admin()
  )
);

drop policy if exists "body progress photo update" on storage.objects;
create policy "body progress photo update" on storage.objects
for update
using (
  bucket_id = 'body-progress'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_admin()
  )
)
with check (
  bucket_id = 'body-progress'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_admin()
  )
);

create index if not exists student_app_state_updated_idx
on public.student_app_state(updated_at desc);
