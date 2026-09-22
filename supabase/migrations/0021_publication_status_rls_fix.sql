-- Corrige un vacío de seguridad detectado al construir los portales: las
-- políticas de SELECT de announcements y official_records solo miraban la
-- audiencia, no el estado. Antes de este cambio, un estudiante/padre con la
-- audiencia correcta podía leer un anuncio en "borrador" o un acta
-- "anulada" (ninguno de los dos debe ser visible fuera de admin).

drop policy "announcements_select" on public.announcements;
create policy "announcements_select" on public.announcements
  for select
  to authenticated
  using (
    public.is_admin()
    or (status = 'publicado' and public.can_view_by_audience(audience, course_id, student_id))
  );

drop policy "official_records_select" on public.official_records;
create policy "official_records_select" on public.official_records
  for select
  to authenticated
  using (
    public.is_admin()
    or (status = 'vigente' and public.can_view_by_audience(audience, course_id, student_id))
  );
