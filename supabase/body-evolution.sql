-- Evolução corporal do MaYFiT
create table if not exists public.body_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  measured_at date not null default current_date,
  weight_kg numeric(6,2), height_cm numeric(6,2), body_fat_pct numeric(5,2), muscle_mass_kg numeric(6,2), visceral_fat numeric(5,2), metabolic_age integer,
  neck_cm numeric(6,2), shoulders_cm numeric(6,2), chest_cm numeric(6,2), waist_cm numeric(6,2), abdomen_cm numeric(6,2), hips_cm numeric(6,2),
  arm_left_cm numeric(6,2), arm_right_cm numeric(6,2), thigh_left_cm numeric(6,2), thigh_right_cm numeric(6,2), calf_left_cm numeric(6,2), calf_right_cm numeric(6,2),
  photo_front text, photo_side text, photo_back text, notes text,
  created_at timestamptz not null default now()
);

alter table public.body_progress enable row level security;

drop policy if exists "student reads own body progress" on public.body_progress;
create policy "student reads own body progress" on public.body_progress for select using (auth.uid() = user_id or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
drop policy if exists "student inserts own body progress" on public.body_progress;
create policy "student inserts own body progress" on public.body_progress for insert with check (auth.uid() = user_id);
drop policy if exists "student updates own body progress" on public.body_progress;
create policy "student updates own body progress" on public.body_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "student deletes own body progress" on public.body_progress;
create policy "student deletes own body progress" on public.body_progress for delete using (auth.uid() = user_id or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

insert into storage.buckets (id,name,public) values ('body-progress','body-progress',false) on conflict (id) do nothing;

drop policy if exists "body progress photo read" on storage.objects;
create policy "body progress photo read" on storage.objects for select using (bucket_id='body-progress' and (auth.uid()::text=(storage.foldername(name))[1] or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')));
drop policy if exists "body progress photo upload" on storage.objects;
create policy "body progress photo upload" on storage.objects for insert with check (bucket_id='body-progress' and auth.uid()::text=(storage.foldername(name))[1]);
drop policy if exists "body progress photo update" on storage.objects;
create policy "body progress photo update" on storage.objects for update using (bucket_id='body-progress' and auth.uid()::text=(storage.foldername(name))[1]);
drop policy if exists "body progress photo delete" on storage.objects;
create policy "body progress photo delete" on storage.objects for delete using (bucket_id='body-progress' and (auth.uid()::text=(storage.foldername(name))[1] or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')));

create index if not exists body_progress_user_date_idx on public.body_progress(user_id, measured_at desc);