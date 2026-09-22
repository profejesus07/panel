-- Funciones auxiliares para las políticas RLS. Son SECURITY DEFINER y de
-- solo lectura, con search_path fijo, para evitar recursión de RLS entre
-- profiles/students/guardians y mantener las políticas simples y rápidas.

-- Postgres no garantiza el orden de evaluación de AND/OR, así que un
-- segmento de ruta de Storage inválido (p. ej. "institucional") podría
-- intentar convertirse a uuid antes de que un guard lo descarte. Esta
-- función evita ese error devolviendo NULL en vez de lanzar excepción.
create or replace function public.safe_uuid(value text)
returns uuid
language plpgsql
immutable
as $$
begin
  return value::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'admin';
$$;

-- Estudiante propio del usuario autenticado (si el usuario es un estudiante)
create or replace function public.my_student_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.students where user_id = auth.uid();
$$;

-- Estudiantes asociados al padre/acudiente autenticado
create or replace function public.my_student_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select sg.student_id
  from public.student_guardians sg
  join public.guardians g on g.id = sg.guardian_id
  where g.user_id = auth.uid();
$$;

-- Verdadero si el estudiante indicado es el propio (rol estudiante) o está
-- asociado al padre/acudiente autenticado (rol padre)
create or replace function public.can_access_student(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or target_student_id = public.my_student_id()
    or target_student_id in (select public.my_student_ids());
$$;

-- Regla de visibilidad compartida por anuncios y actas según su audiencia
create or replace function public.can_view_by_audience(
  p_audience public.audience_scope,
  p_course_id uuid,
  p_student_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or p_audience = 'todos'
    or (p_audience = 'estudiantes' and public.current_role() = 'estudiante')
    or (p_audience = 'padres' and public.current_role() = 'padre')
    or (p_audience = 'estudiante' and public.can_access_student(p_student_id))
    or (p_audience = 'curso' and p_course_id in (
          select s.course_id from public.students s
          where s.id = public.my_student_id() or s.id in (select public.my_student_ids())
        ));
$$;

revoke execute on function public.current_role() from public;
revoke execute on function public.is_admin() from public;
revoke execute on function public.my_student_id() from public;
revoke execute on function public.my_student_ids() from public;
revoke execute on function public.can_access_student(uuid) from public;
revoke execute on function public.can_view_by_audience(public.audience_scope, uuid, uuid) from public;

grant execute on function public.current_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.my_student_id() to authenticated;
grant execute on function public.my_student_ids() to authenticated;
grant execute on function public.can_access_student(uuid) to authenticated;
grant execute on function public.can_view_by_audience(public.audience_scope, uuid, uuid) to authenticated;
