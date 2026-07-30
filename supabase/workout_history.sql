create table if not exists public.workout_history (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  workout_name text not null default 'Treino',
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workout_history enable row level security;

create policy "students read own workout history"
on public.workout_history for select
to authenticated
using (student_id = auth.uid());

create policy "students insert own workout history"
on public.workout_history for insert
to authenticated
with check (student_id = auth.uid());

create policy "students update own workout history"
on public.workout_history for update
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

create policy "students delete own workout history"
on public.workout_history for delete
to authenticated
using (student_id = auth.uid());

create policy "admins read all workout history"
on public.workout_history for select
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "admins update all workout history"
on public.workout_history for update
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "admins delete all workout history"
on public.workout_history for delete
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
