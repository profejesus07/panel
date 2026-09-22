-- Corrige los avisos del linter de seguridad de Supabase tras 0001-0018:
--   1) search_path mutable en funciones sin SECURITY DEFINER.
--   2) el rol anon no necesita ejecutar los helpers de RLS: ninguna política
--      "to anon" los invoca (solo se usan en policies "to authenticated").
--      El rol authenticated sí debe conservarlos: las políticas RLS llaman
--      estas funciones dentro de su USING/WITH CHECK, así que authenticated
--      necesita EXECUTE para que esas políticas funcionen en absoluto.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.safe_uuid(value text)
returns uuid
language plpgsql
immutable
set search_path = public
as $$
begin
  return value::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

revoke execute on function public.current_role() from anon;
revoke execute on function public.is_admin() from anon;
revoke execute on function public.my_student_id() from anon;
revoke execute on function public.my_student_ids() from anon;
revoke execute on function public.can_access_student(uuid) from anon;
revoke execute on function public.can_view_by_audience(public.audience_scope, uuid, uuid) from anon;
