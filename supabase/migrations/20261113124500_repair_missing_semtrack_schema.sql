-- Forward repair for existing installs, also safe as a complete SQL Editor setup.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_name text not null,
  total_units integer not null check (total_units between 1 and 20),
  created_at timestamptz not null default now(),
  unique (user_id, subject_name),
  unique (id, user_id)
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  unit_number integer not null check (unit_number > 0),
  is_completed boolean not null default false,
  completed_at timestamptz,
  unique (subject_id, unit_number)
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid not null unique,
  exam_date date,
  exam_time time,
  updated_at timestamptz not null default now(),
  foreign key (subject_id, user_id)
    references public.subjects (id, user_id) on delete cascade
);

create index if not exists subjects_user_id_idx
  on public.subjects (user_id);
create index if not exists units_subject_id_idx
  on public.units (subject_id);
create index if not exists exams_user_id_exam_date_idx
  on public.exams (user_id, exam_date);

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.units enable row level security;
alter table public.exams enable row level security;

drop policy if exists "Users can read their profile" on public.profiles;
drop policy if exists "Users can update their profile" on public.profiles;
create policy "Users can read their profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "Users can update their profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "Users can read their subjects" on public.subjects;
drop policy if exists "Users can update their subjects" on public.subjects;
create policy "Users can read their subjects"
  on public.subjects for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Users can update their subjects"
  on public.subjects for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can read their units" on public.units;
drop policy if exists "Users can update their units" on public.units;
create policy "Users can read their units"
  on public.units for select to authenticated
  using (
    exists (
      select 1 from public.subjects
      where subjects.id = units.subject_id
        and subjects.user_id = (select auth.uid())
    )
  );
create policy "Users can update their units"
  on public.units for update to authenticated
  using (
    exists (
      select 1 from public.subjects
      where subjects.id = units.subject_id
        and subjects.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.subjects
      where subjects.id = units.subject_id
        and subjects.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can read their exams" on public.exams;
drop policy if exists "Users can update their exams" on public.exams;
drop policy if exists "Users can insert their exams" on public.exams;
create policy "Users can read their exams"
  on public.exams for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Users can update their exams"
  on public.exams for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Users can insert their exams"
  on public.exams for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.subjects
      where subjects.id = exams.subject_id
        and subjects.user_id = (select auth.uid())
    )
  );

create or replace function public.provision_user_study_data(
  p_user_id uuid,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  subject_row record;
  new_subject_id uuid;
begin
  insert into public.profiles (id, email)
  values (p_user_id, p_email)
  on conflict (id) do update
    set email = excluded.email;

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
    values (p_user_id, subject_row.subject_name, subject_row.total_units)
    on conflict (user_id, subject_name) do update
      set total_units = excluded.total_units
    returning id into new_subject_id;

    delete from public.units
    where subject_id = new_subject_id
      and unit_number > subject_row.total_units;

    insert into public.units (subject_id, unit_number)
    select new_subject_id, generated.unit_number
    from pg_catalog.generate_series(1, subject_row.total_units) as generated(unit_number)
    on conflict (subject_id, unit_number) do nothing;

    insert into public.exams (user_id, subject_id)
    values (p_user_id, new_subject_id)
    on conflict (subject_id) do nothing;
  end loop;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.provision_user_study_data(new.id, new.email);
  return new;
end;
$$;

revoke all on function public.provision_user_study_data(uuid, text)
  from public, anon, authenticated;
revoke all on function public.handle_new_user()
  from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_exam_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists exams_updated_at on public.exams;
create trigger exams_updated_at
  before update on public.exams
  for each row execute procedure public.set_exam_updated_at();

grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, update on public.subjects to authenticated;
grant select, update on public.units to authenticated;
grant select, insert, update on public.exams to authenticated;

-- Repair accounts that were created before the schema was installed.
do $$
declare
  existing_user record;
begin
  for existing_user in
    select id, email from auth.users
  loop
    perform public.provision_user_study_data(existing_user.id, existing_user.email);
  end loop;
end;
$$;

notify pgrst, 'reload schema';

-- Verify the seeded totals for every account in this Supabase project.
with per_user_subject as (
  select
    subject.user_id,
    subject.id as subject_id,
    subject.subject_name,
    count(unit.id)::integer as unit_count,
    count(distinct exam.id)::integer as exam_count
  from public.subjects as subject
  left join public.units as unit on unit.subject_id = subject.id
  left join public.exams as exam on exam.subject_id = subject.id
  group by subject.user_id, subject.id, subject.subject_name
),
account_summary as (
  select
    profile.id as user_id,
    count(subject.subject_id)::integer as subject_count,
    coalesce(sum(subject.unit_count), 0)::integer as unit_count,
    coalesce(sum(subject.exam_count), 0)::integer as exam_count,
    coalesce(
      jsonb_object_agg(subject.subject_name, subject.unit_count)
        filter (where subject.subject_id is not null),
      '{}'::jsonb
    ) as subject_units
  from public.profiles as profile
  left join per_user_subject as subject on subject.user_id = profile.id
  group by profile.id
)
select
  user_id,
  subject_count,
  unit_count,
  exam_count,
  subject_units,
  case
    when subject_count = 5
      and unit_count = 24
      and exam_count = 5
      and subject_units = '{
        "Theory of Computation (TOC)": 5,
        "Artificial Intelligence (AI)": 5,
        "Computer Networks (CN)": 5,
        "Cloud Computing": 5,
        "IPR and Cyber Laws": 4
      }'::jsonb
    then 'PASS'
    else 'CHECK'
  end as setup_status
from account_summary
order by user_id;
