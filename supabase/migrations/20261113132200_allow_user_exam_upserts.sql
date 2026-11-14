-- Allow a signed-in user to create or update an exam only for their own subject.
drop policy if exists "Users can insert their exams" on public.exams;
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

grant insert on public.exams to authenticated;
notify pgrst, 'reload schema';
