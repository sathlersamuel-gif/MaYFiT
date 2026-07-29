create or replace function public.delete_student_account(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Sessão inválida';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Somente o administrador pode excluir alunos';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'O administrador não pode excluir a própria conta';
  end if;

  if exists (
    select 1
    from public.profiles
    where id = target_user_id
      and role = 'admin'
  ) then
    raise exception 'Outra conta administrativa não pode ser excluída por esta função';
  end if;

  delete from public.profiles where id = target_user_id;
  delete from auth.users where id = target_user_id;
end;
$$;

revoke all on function public.delete_student_account(uuid) from public;
grant execute on function public.delete_student_account(uuid) to authenticated;
