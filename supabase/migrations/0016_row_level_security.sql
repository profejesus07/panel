-- ============================================================================
-- Row Level Security — Panel Escolar
-- ============================================================================
-- Principio: admin tiene acceso total. estudiante solo ve su propia
-- información. padre solo ve la de los estudiantes que tiene asociados.
-- Todas las políticas se apoyan en las funciones de 0015_auth_helper_functions.
-- ============================================================================

-- school_settings ------------------------------------------------------------
alter table public.school_settings enable row level security;

create policy "school_settings_public_select"
  on public.school_settings for select
  to anon, authenticated
  using (true);

create policy "school_settings_admin_write"
  on public.school_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- profiles --------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profiles_admin_write"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- courses -----------------------------------------------------------------
alter table public.courses enable row level security;

create policy "courses_authenticated_select"
  on public.courses for select
  to authenticated
  using (true);

create policy "courses_admin_write"
  on public.courses for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- students ----------------------------------------------------------------
alter table public.students enable row level security;

create policy "students_select_own_or_linked_or_admin"
  on public.students for select
  to authenticated
  using (public.can_access_student(id));

create policy "students_admin_write"
  on public.students for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- guardians -----------------------------------------------------------------
alter table public.guardians enable row level security;

create policy "guardians_select_own_or_admin"
  on public.guardians for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "guardians_admin_write"
  on public.guardians for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- student_guardians -----------------------------------------------------------
alter table public.student_guardians enable row level security;

create policy "student_guardians_select"
  on public.student_guardians for select
  to authenticated
  using (
    public.is_admin()
    or student_id = public.my_student_id()
    or guardian_id in (select id from public.guardians where user_id = auth.uid())
  );

create policy "student_guardians_admin_write"
  on public.student_guardians for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- subjects ------------------------------------------------------------------
alter table public.subjects enable row level security;

create policy "subjects_authenticated_select"
  on public.subjects for select
  to authenticated
  using (true);

create policy "subjects_admin_write"
  on public.subjects for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- academic_periods ------------------------------------------------------------
alter table public.academic_periods enable row level security;

create policy "academic_periods_authenticated_select"
  on public.academic_periods for select
  to authenticated
  using (true);

create policy "academic_periods_admin_write"
  on public.academic_periods for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- grades ------------------------------------------------------------------
alter table public.grades enable row level security;

create policy "grades_select"
  on public.grades for select
  to authenticated
  using (public.can_access_student(student_id));

create policy "grades_admin_write"
  on public.grades for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- attendance ----------------------------------------------------------------
alter table public.attendance enable row level security;

create policy "attendance_select"
  on public.attendance for select
  to authenticated
  using (public.can_access_student(student_id));

create policy "attendance_admin_write"
  on public.attendance for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- absence_justifications --------------------------------------------------
alter table public.absence_justifications enable row level security;

create policy "absence_justifications_select"
  on public.absence_justifications for select
  to authenticated
  using (public.can_access_student(student_id));

create policy "absence_justifications_insert"
  on public.absence_justifications for insert
  to authenticated
  with check (
    public.can_access_student(student_id)
    and submitted_by = auth.uid()
  );

create policy "absence_justifications_admin_update"
  on public.absence_justifications for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "absence_justifications_admin_delete"
  on public.absence_justifications for delete
  to authenticated
  using (public.is_admin());

-- behavior_records ------------------------------------------------------------
alter table public.behavior_records enable row level security;

create policy "behavior_records_select"
  on public.behavior_records for select
  to authenticated
  using (public.can_access_student(student_id));

create policy "behavior_records_admin_write"
  on public.behavior_records for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- official_records (actas) -----------------------------------------------
alter table public.official_records enable row level security;

create policy "official_records_select"
  on public.official_records for select
  to authenticated
  using (public.can_view_by_audience(audience, course_id, student_id));

create policy "official_records_admin_write"
  on public.official_records for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- announcements ---------------------------------------------------------------
alter table public.announcements enable row level security;

create policy "announcements_select"
  on public.announcements for select
  to authenticated
  using (public.can_view_by_audience(audience, course_id, student_id));

create policy "announcements_admin_write"
  on public.announcements for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
