create table if not exists public.workout_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_data jsonb not null default '{"exercises":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workout_plans enable row level security;

drop policy if exists "Students can read own workout plan" on public.workout_plans;
drop policy if exists "Students can create own workout plan" on public.workout_plans;
drop policy if exists "Students can update own workout plan" on public.workout_plans;
drop policy if exists "Admins can manage all workout plans" on public.workout_plans;

create policy "Students can read own workout plan"
on public.workout_plans
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Students can create own workout plan"
on public.workout_plans
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Students can update own workout plan"
on public.workout_plans
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Admins can manage all workout plans"
on public.workout_plans
for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

alter table public.workout_plans replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'workout_plans'
  ) then
    alter publication supabase_realtime add table public.workout_plans;
  end if;
end $$;
