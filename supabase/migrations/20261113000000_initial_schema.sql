create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_name text not null,
  total_units integer not null check (total_units between 1 and 20),
  created_at timestamptz not null default now(),
  unique (user_id, subject_name),
  unique (id, user_id)
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  unit_number integer not null check (unit_number > 0),
  is_completed boolean not null default false,
  completed_at timestamptz,
  unique (subject_id, unit_number)
);

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid not null unique,
  exam_date date,
  exam_time time,
  updated_at timestamptz not null default now(),
  foreign key (subject_id, user_id)
    references public.subjects (id, user_id) on delete cascade
);

create index subjects_user_id_idx on public.subjects (user_id);
create index exams_user_id_exam_date_idx on public.exams (user_id, exam_date);

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.units enable row level security;
alter table public.exams enable row level security;

create policy "Users can read their profile"
  on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "Users can update their profile"
  on public.profiles for update to authenticated using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Users can read their subjects"
  on public.subjects for select to authenticated using (user_id = (select auth.uid()));
create policy "Users can update their subjects"
  on public.subjects for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can read their units"
  on public.units for select to authenticated using (
    exists (
      select 1 from public.subjects
      where subjects.id = units.subject_id and subjects.user_id = (select auth.uid())
    )
  );
create policy "Users can update their units"
  on public.units for update to authenticated using (
    exists (
      select 1 from public.subjects
      where subjects.id = units.subject_id and subjects.user_id = (select auth.uid())
    )
  ) with check (
    exists (
      select 1 from public.subjects
      where subjects.id = units.subject_id and subjects.user_id = (select auth.uid())
    )
  );

create policy "Users can read their exams"
  on public.exams for select to authenticated using (user_id = (select auth.uid()));
create policy "Users can update their exams"
  on public.exams for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  subject_row record;
  new_subject_id uuid;
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  for subject_row in
    select * from (values
      ('Theory of Computation (TOC)', 5),
      ('Artificial Intelligence (AI)', 5),
      ('Computer Networks (CN)', 5),
      ('Cloud Computing', 5),
      ('IPR and Cyber Laws', 4)
    ) as syllabus(subject_name, total_units)
  loop
    insert into public.subjects (user_id, subject_name, total_units)
    values (new.id, subject_row.subject_name, subject_row.total_units)
    returning id into new_subject_id;

    insert into public.units (subject_id, unit_number)
    select new_subject_id, generate_series(1, subject_row.total_units);

    insert into public.exams (user_id, subject_id)
    values (new.id, new_subject_id);
  end loop;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;

create function public.set_exam_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger exams_updated_at
  before update on public.exams
  for each row execute procedure public.set_exam_updated_at();

grant select, update on public.profiles to authenticated;
grant select, update on public.subjects to authenticated;
grant select, update on public.units to authenticated;
grant select, update on public.exams to authenticated;
