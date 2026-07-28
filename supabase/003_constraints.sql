-- Execute depois de 002_complete.sql
alter table public.exercise_logs
  add constraint exercise_logs_session_exercise_set_unique
  unique (session_id, exercise_id, set_number);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
for each row execute procedure public.touch_updated_at();
create trigger students_touch before update on public.students
for each row execute procedure public.touch_updated_at();
create trigger workout_plans_touch before update on public.workout_plans
for each row execute procedure public.touch_updated_at();
create trigger app_settings_touch before update on public.app_settings
for each row execute procedure public.touch_updated_at();
