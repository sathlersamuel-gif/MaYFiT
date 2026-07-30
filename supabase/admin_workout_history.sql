-- Acesso administrativo seguro ao histórico de treinos.
-- Execute este arquivo uma vez no SQL Editor do Supabase.

create or replace function public.mayfit_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.mayfit_is_admin() from public;
grant execute on function public.mayfit_is_admin() to authenticated;

create or replace function public.admin_get_workout_history(target_user_id uuid)
returns table (
  id uuid,
  user_id uuid,
  workout_name text,
  workout_data jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.mayfit_is_admin() then
    raise exception 'Acesso permitido somente ao administrador';
  end if;

  return query
  select wh.id, wh.user_id, wh.workout_name, wh.workout_data, wh.created_at, wh.updated_at
  from public.workout_history wh
  where wh.user_id = target_user_id
  order by wh.created_at desc;
end;
$$;

revoke all on function public.admin_get_workout_history(uuid) from public;
grant execute on function public.admin_get_workout_history(uuid) to authenticated;

create or replace function public.admin_update_workout_history(
  target_history_id uuid,
  target_workout_data jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.mayfit_is_admin() then
    raise exception 'Acesso permitido somente ao administrador';
  end if;

  update public.workout_history
  set workout_data = target_workout_data,
      updated_at = now()
  where id = target_history_id;

  if not found then
    raise exception 'Histórico não encontrado';
  end if;
end;
$$;

revoke all on function public.admin_update_workout_history(uuid, jsonb) from public;
grant execute on function public.admin_update_workout_history(uuid, jsonb) to authenticated;

create or replace function public.admin_delete_workout_history(target_history_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.mayfit_is_admin() then
    raise exception 'Acesso permitido somente ao administrador';
  end if;

  delete from public.workout_history
  where id = target_history_id;

  if not found then
    raise exception 'Histórico não encontrado';
  end if;
end;
$$;

revoke all on function public.admin_delete_workout_history(uuid) from public;
grant execute on function public.admin_delete_workout_history(uuid) to authenticated;
