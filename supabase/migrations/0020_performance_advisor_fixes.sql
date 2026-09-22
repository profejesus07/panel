-- Corrige los avisos de rendimiento del linter de Supabase tras 0001-0019:
--   1) auth.uid() envuelto en (select auth.uid()) para que el planificador
--      lo evalúe una sola vez por consulta, no una vez por fila.
--   2) Las políticas "*_admin_write" se acotan a INSERT/UPDATE/DELETE: el
--      SELECT del admin ya lo concede la política "*_select" de cada tabla
--      (todas incluyen is_admin() o son abiertas a todo authenticated), así
--      que mantenerlas también en SELECT duplicaba política permisiva.
--   3) Índices en columnas de auditoría (created_by/recorded_by/reviewed_by/
--      submitted_by) que quedaron sin cobertura.

-- 1) auth.uid() -> (select auth.uid()) ----------------------------------
alter policy "profiles_select_own_or_admin" on public.profiles
  using (id = (select auth.uid()) or public.is_admin());

alter policy "guardians_select_own_or_admin" on public.guardians
  using (user_id = (select auth.uid()) or public.is_admin());

alter policy "student_guardians_select" on public.student_guardians
  using (
    public.is_admin()
    or student_id = public.my_student_id()
    or guardian_id in (select id from public.guardians where user_id = (select auth.uid()))
  );

alter policy "absence_justifications_insert" on public.absence_justifications
  with check (
    public.can_access_student(student_id)
    and submitted_by = (select auth.uid())
  );

-- 2) admin_write: acotar a INSERT/UPDATE/DELETE (SELECT ya cubierto) -----
drop policy "school_settings_admin_write" on public.school_settings;
create policy "school_settings_admin_write" on public.school_settings
  for insert to authenticated with check (public.is_admin());
create policy "school_settings_admin_update" on public.school_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "school_settings_admin_delete" on public.school_settings
  for delete to authenticated using (public.is_admin());

drop policy "profiles_admin_write" on public.profiles;
create policy "profiles_admin_insert" on public.profiles
  for insert to authenticated with check (public.is_admin());
create policy "profiles_admin_update" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "profiles_admin_delete" on public.profiles
  for delete to authenticated using (public.is_admin());

drop policy "courses_admin_write" on public.courses;
create policy "courses_admin_insert" on public.courses
  for insert to authenticated with check (public.is_admin());
create policy "courses_admin_update" on public.courses
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "courses_admin_delete" on public.courses
  for delete to authenticated using (public.is_admin());

drop policy "students_admin_write" on public.students;
create policy "students_admin_insert" on public.students
  for insert to authenticated with check (public.is_admin());
create policy "students_admin_update" on public.students
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "students_admin_delete" on public.students
  for delete to authenticated using (public.is_admin());

drop policy "guardians_admin_write" on public.guardians;
create policy "guardians_admin_insert" on public.guardians
  for insert to authenticated with check (public.is_admin());
create policy "guardians_admin_update" on public.guardians
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "guardians_admin_delete" on public.guardians
  for delete to authenticated using (public.is_admin());

drop policy "student_guardians_admin_write" on public.student_guardians;
create policy "student_guardians_admin_insert" on public.student_guardians
  for insert to authenticated with check (public.is_admin());
create policy "student_guardians_admin_update" on public.student_guardians
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "student_guardians_admin_delete" on public.student_guardians
  for delete to authenticated using (public.is_admin());

drop policy "subjects_admin_write" on public.subjects;
create policy "subjects_admin_insert" on public.subjects
  for insert to authenticated with check (public.is_admin());
create policy "subjects_admin_update" on public.subjects
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "subjects_admin_delete" on public.subjects
  for delete to authenticated using (public.is_admin());

drop policy "academic_periods_admin_write" on public.academic_periods;
create policy "academic_periods_admin_insert" on public.academic_periods
  for insert to authenticated with check (public.is_admin());
create policy "academic_periods_admin_update" on public.academic_periods
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "academic_periods_admin_delete" on public.academic_periods
  for delete to authenticated using (public.is_admin());

drop policy "grades_admin_write" on public.grades;
create policy "grades_admin_insert" on public.grades
  for insert to authenticated with check (public.is_admin());
create policy "grades_admin_update" on public.grades
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "grades_admin_delete" on public.grades
  for delete to authenticated using (public.is_admin());

drop policy "attendance_admin_write" on public.attendance;
create policy "attendance_admin_insert" on public.attendance
  for insert to authenticated with check (public.is_admin());
create policy "attendance_admin_update" on public.attendance
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "attendance_admin_delete" on public.attendance
  for delete to authenticated using (public.is_admin());

drop policy "behavior_records_admin_write" on public.behavior_records;
create policy "behavior_records_admin_insert" on public.behavior_records
  for insert to authenticated with check (public.is_admin());
create policy "behavior_records_admin_update" on public.behavior_records
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "behavior_records_admin_delete" on public.behavior_records
  for delete to authenticated using (public.is_admin());

drop policy "official_records_admin_write" on public.official_records;
create policy "official_records_admin_insert" on public.official_records
  for insert to authenticated with check (public.is_admin());
create policy "official_records_admin_update" on public.official_records
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "official_records_admin_delete" on public.official_records
  for delete to authenticated using (public.is_admin());

drop policy "announcements_admin_write" on public.announcements;
create policy "announcements_admin_insert" on public.announcements
  for insert to authenticated with check (public.is_admin());
create policy "announcements_admin_update" on public.announcements
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "announcements_admin_delete" on public.announcements
  for delete to authenticated using (public.is_admin());

-- 3) Índices faltantes en columnas de auditoría ---------------------------
create index absence_justifications_reviewed_by_idx on public.absence_justifications (reviewed_by);
create index absence_justifications_submitted_by_idx on public.absence_justifications (submitted_by);
create index announcements_created_by_idx on public.announcements (created_by);
create index attendance_recorded_by_idx on public.attendance (recorded_by);
create index behavior_records_created_by_idx on public.behavior_records (created_by);
create index grades_created_by_idx on public.grades (created_by);
create index official_records_created_by_idx on public.official_records (created_by);
