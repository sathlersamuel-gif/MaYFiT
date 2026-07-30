create table if not exists public.student_workouts (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  workout_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.student_workouts enable row level security;

drop policy if exists "student reads own workout" on public.student_workouts;
create policy "student reads own workout"
on public.student_workouts for select
to authenticated
using (student_id = auth.uid());

drop policy if exists "student updates own workout" on public.student_workouts;
create policy "student updates own workout"
on public.student_workouts for insert
to authenticated
with check (student_id = auth.uid());

drop policy if exists "student changes own workout" on public.student_workouts;
create policy "student changes own workout"
on public.student_workouts for update
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

drop policy if exists "admin reads all workouts" on public.student_workouts;
create policy "admin reads all workouts"
on public.student_workouts for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "admin inserts workouts" on public.student_workouts;
create policy "admin inserts workouts"
on public.student_workouts for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "admin updates workouts" on public.student_workouts;
create policy "admin updates workouts"
on public.student_workouts for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

grant select, insert, update on public.student_workouts to authenticated;

alter publication supabase_realtime add table public.student_workouts;
