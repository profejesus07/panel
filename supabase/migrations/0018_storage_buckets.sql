-- ============================================================================
-- Storage — Panel Escolar
-- ============================================================================
-- institucion / anuncios: buckets públicos de solo-lectura (logo, imágenes)
-- justificaciones / actas / boletines: privados, con acceso por carpeta
-- {student_id}/archivo (actas admite además la carpeta especial
-- "institucional" para actas dirigidas a toda la comunidad).
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('institucion', 'institucion', true, 5242880, array['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']),
  ('anuncios', 'anuncios', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('justificaciones', 'justificaciones', false, 10485760, array['application/pdf', 'image/png', 'image/jpeg']),
  ('actas', 'actas', false, 10485760, array['application/pdf']),
  ('boletines', 'boletines', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

-- storage.objects ya tiene RLS habilitado por Supabase; el rol de
-- migraciones no es su dueño y no puede (ni necesita) volver a habilitarlo.

-- institucion ---------------------------------------------------------------
create policy "institucion_public_select"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'institucion');

create policy "institucion_admin_write"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'institucion' and public.is_admin())
  with check (bucket_id = 'institucion' and public.is_admin());

-- anuncios --------------------------------------------------------------------
create policy "anuncios_public_select"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'anuncios');

create policy "anuncios_admin_write"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'anuncios' and public.is_admin())
  with check (bucket_id = 'anuncios' and public.is_admin());

-- justificaciones ---------------------------------------------------------
create policy "justificaciones_admin_all"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'justificaciones' and public.is_admin())
  with check (bucket_id = 'justificaciones' and public.is_admin());

create policy "justificaciones_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'justificaciones'
    and public.can_access_student(public.safe_uuid((storage.foldername(name))[1]))
  );

create policy "justificaciones_owner_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'justificaciones'
    and public.can_access_student(public.safe_uuid((storage.foldername(name))[1]))
  );

-- actas -----------------------------------------------------------------------
create policy "actas_admin_all"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'actas' and public.is_admin())
  with check (bucket_id = 'actas' and public.is_admin());

create policy "actas_read_institucional"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'actas' and (storage.foldername(name))[1] = 'institucional');

create policy "actas_owner_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'actas'
    and public.can_access_student(public.safe_uuid((storage.foldername(name))[1]))
  );

-- boletines -------------------------------------------------------------------
create policy "boletines_admin_all"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'boletines' and public.is_admin())
  with check (bucket_id = 'boletines' and public.is_admin());

create policy "boletines_owner_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'boletines'
    and public.can_access_student(public.safe_uuid((storage.foldername(name))[1]))
  );
