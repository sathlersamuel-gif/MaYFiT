-- MaYFiT — migração completa dos treinos antigos para o banco atual
-- Preserva a ordem dos treinos pelo created_at e a ordem dos exercícios no JSON.
-- Pode ser executado mais de uma vez sem duplicar os dados.

begin;

create table if not exists public.student_workouts (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  workout_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Cria uma cópia de segurança antes da migração.
create table if not exists public.workouts_migration_backup (
  backup_id uuid primary key default uuid_generate_v4(),
  student_id uuid not null,
  workout_data jsonb not null,
  backed_up_at timestamptz not null default now()
);

insert into public.workouts_migration_backup (student_id, workout_data)
select student_id, workout_data
from public.student_workouts sw
where not exists (
  select 1
  from public.workouts_migration_backup b
  where b.student_id = sw.student_id
);

-- Migra a tabela antiga public.workouts para public.student_workouts.
-- jsonb_agg mantém a ordem definida no ORDER BY.
insert into public.student_workouts (student_id, workout_data, updated_at)
select
  w.student_id,
  jsonb_build_object(
    'version', 9,
    'migratedFrom', 'public.workouts',
    'migratedAt', now(),
    'workouts', jsonb_agg(
      jsonb_build_object(
        'id', w.id,
        'name', w.name,
        'days', coalesce(to_jsonb(w.days), '[]'::jsonb),
        'exercises', coalesce(w.exercises, '[]'::jsonb),
        'createdBy', w.created_by,
        'createdAt', w.created_at,
        'updatedAt', w.updated_at,
        'order', w.workout_order
      )
      order by w.workout_order asc nulls last, w.created_at asc, w.id asc
    )
  ),
  now()
from (
  select
    wo.*,
    row_number() over (
      partition by wo.student_id
      order by wo.created_at asc, wo.id asc
    ) as workout_order
  from public.workouts wo
) w
group by w.student_id
on conflict (student_id) do update
set
  workout_data = excluded.workout_data,
  updated_at = now();

-- Garante acesso do aluno ao próprio treino e do administrador a todos.
alter table public.student_workouts enable row level security;

drop policy if exists "student reads own workout" on public.student_workouts;
create policy "student reads own workout"
on public.student_workouts for select
to authenticated
using (student_id = auth.uid());

drop policy if exists "student inserts own workout" on public.student_workouts;
create policy "student inserts own workout"
on public.student_workouts for insert
to authenticated
with check (student_id = auth.uid());

drop policy if exists "student updates own workout" on public.student_workouts;
create policy "student updates own workout"
on public.student_workouts for update
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

drop policy if exists "admin reads all student workouts" on public.student_workouts;
create policy "admin reads all student workouts"
on public.student_workouts for select
to authenticated
using (public.is_admin());

drop policy if exists "admin inserts student workouts" on public.student_workouts;
create policy "admin inserts student workouts"
on public.student_workouts for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admin updates student workouts" on public.student_workouts;
create policy "admin updates student workouts"
on public.student_workouts for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update on public.student_workouts to authenticated;

commit;

-- Conferência após executar:
-- select student_id, jsonb_array_length(workout_data->'workouts') as total_treinos
-- from public.student_workouts
-- order by updated_at desc;
