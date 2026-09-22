-- RPCs para aprobar/rechazar justificaciones de inasistencia de forma atómica.
-- Se ejecutan con los privilegios del invocador (no SECURITY DEFINER): la
-- comprobación explícita de rol más las políticas RLS ya vigentes en
-- absence_justifications y attendance son suficientes, sin necesidad de
-- privilegios elevados.

create or replace function public.approve_justification(
  p_justification_id uuid,
  p_review_notes text default null
)
returns public.absence_justifications
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_justification public.absence_justifications;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede aprobar justificaciones';
  end if;

  update public.absence_justifications
  set status = 'aprobada',
      review_notes = p_review_notes,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_justification_id
  returning * into v_justification;

  if not found then
    raise exception 'Justificación % no encontrada', p_justification_id;
  end if;

  -- Refleja la aprobación en la asistencia del día, si el estudiante tiene curso asignado
  insert into public.attendance (student_id, course_id, date, status, notes, recorded_by)
  select
    v_justification.student_id,
    s.course_id,
    v_justification.absence_date,
    'justificado',
    'Generado automáticamente al aprobar la justificación.',
    auth.uid()
  from public.students s
  where s.id = v_justification.student_id
    and s.course_id is not null
  on conflict (student_id, date)
  do update set status = 'justificado', notes = excluded.notes;

  return v_justification;
end;
$$;

create or replace function public.reject_justification(
  p_justification_id uuid,
  p_review_notes text default null
)
returns public.absence_justifications
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_justification public.absence_justifications;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede rechazar justificaciones';
  end if;

  update public.absence_justifications
  set status = 'rechazada',
      review_notes = p_review_notes,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_justification_id
  returning * into v_justification;

  if not found then
    raise exception 'Justificación % no encontrada', p_justification_id;
  end if;

  return v_justification;
end;
$$;

revoke execute on function public.approve_justification(uuid, text) from public;
revoke execute on function public.reject_justification(uuid, text) from public;
grant execute on function public.approve_justification(uuid, text) to authenticated;
grant execute on function public.reject_justification(uuid, text) to authenticated;
