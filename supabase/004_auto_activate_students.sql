-- MaYFiT — cadastro de aluno com acesso imediato
-- Remove a necessidade de aprovação manual do administrador.

alter table public.profiles
  alter column status set default 'active';

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    'student',
    'active'
  ) on conflict (id) do nothing;
  return new;
end;
$$;

update public.profiles
set status = 'active'
where role = 'student' and status = 'pending';
