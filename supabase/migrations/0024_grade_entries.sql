-- ============================================================================
-- Notas parciales (grade_entries)
-- ============================================================================
-- Cada estudiante puede tener varias notas por asignatura y período (talleres,
-- evaluaciones, exposiciones...), cada una con su concepto, observación, nota
-- y un porcentaje opcional. La calificación consolidada de public.grades (la
-- que usan boletines, estadísticas y portales) se recalcula sola con un
-- trigger cada vez que cambia una nota parcial:
--
--   - Si ninguna nota tiene porcentaje: promedio simple.
--   - Si todas tienen porcentaje: promedio ponderado por esos porcentajes.
--   - Si hay mezcla: las notas sin porcentaje se reparten en partes iguales
--     lo que falta para 100 %, y luego se pondera.
--
-- La suma de porcentajes de un mismo estudiante+asignatura+período no puede
-- superar 100.
-- ============================================================================

create table public.grade_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete restrict,
  period_id uuid not null references public.academic_periods (id) on delete restrict,
  concept text not null,
  observation text,
  score numeric(5, 2) not null check (score >= 0),
  weight numeric(5, 2) check (weight is null or (weight > 0 and weight <= 100)),
  graded_at date not null default current_date,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.grade_entries is 'Notas parciales por estudiante, asignatura y período; alimentan la calificación consolidada de grades.';
comment on column public.grade_entries.weight is 'Porcentaje opcional (0-100]. Si es nulo, la nota se promedia con las demás sin porcentaje.';

create index grade_entries_group_idx on public.grade_entries (student_id, subject_id, period_id);
create index grade_entries_subject_id_idx on public.grade_entries (subject_id);
create index grade_entries_period_id_idx on public.grade_entries (period_id);
create index grade_entries_created_by_idx on public.grade_entries (created_by);

create trigger set_updated_at
  before update on public.grade_entries
  for each row execute function public.set_updated_at();

-- Recalcula (o elimina, si ya no quedan notas) la calificación consolidada.
create or replace function public.recompute_grade(p_student uuid, p_subject uuid, p_period uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_count integer;
  v_weight_total numeric;
  v_weighted_sum numeric;
  v_unweighted_count integer;
  v_unweighted_sum numeric;
  v_share numeric;
  v_final numeric;
begin
  select
    count(*),
    coalesce(sum(weight), 0),
    coalesce(sum(score * weight) filter (where weight is not null), 0),
    count(*) filter (where weight is null),
    coalesce(sum(score) filter (where weight is null), 0)
  into v_count, v_weight_total, v_weighted_sum, v_unweighted_count, v_unweighted_sum
  from public.grade_entries
  where student_id = p_student and subject_id = p_subject and period_id = p_period;

  if v_count = 0 then
    delete from public.grades
    where student_id = p_student and subject_id = p_subject and period_id = p_period;
    return;
  end if;

  if v_weight_total > 100 then
    raise exception 'La suma de porcentajes no puede superar 100 %% (actualmente %).', v_weight_total
      using errcode = 'check_violation';
  end if;

  if v_weight_total = 0 then
    v_final := v_unweighted_sum / v_unweighted_count;
  elsif v_unweighted_count = 0 then
    v_final := v_weighted_sum / v_weight_total;
  else
    v_share := (100 - v_weight_total) / v_unweighted_count;
    if v_share = 0 then
      v_final := v_weighted_sum / v_weight_total;
    else
      v_final := (v_weighted_sum + v_share * v_unweighted_sum) / (v_weight_total + v_share * v_unweighted_count);
    end if;
  end if;

  insert into public.grades (student_id, subject_id, period_id, score, created_by)
  values (p_student, p_subject, p_period, round(v_final, 2), auth.uid())
  on conflict (student_id, subject_id, period_id)
  do update set score = excluded.score, graded_at = current_date;
end;
$$;

create or replace function public.grade_entries_after_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.recompute_grade(old.student_id, old.subject_id, old.period_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.recompute_grade(new.student_id, new.subject_id, new.period_id);
  end if;
  return null;
end;
$$;

create trigger recompute_grade_after_change
  after insert or update or delete on public.grade_entries
  for each row execute function public.grade_entries_after_change();

-- RLS: igual que grades — lectura para quien puede ver al estudiante,
-- escritura solo para admin.
alter table public.grade_entries enable row level security;

create policy "grade_entries_select" on public.grade_entries
  for select to authenticated using (public.can_access_student(student_id));
create policy "grade_entries_admin_insert" on public.grade_entries
  for insert to authenticated with check (public.is_admin());
create policy "grade_entries_admin_update" on public.grade_entries
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "grade_entries_admin_delete" on public.grade_entries
  for delete to authenticated using (public.is_admin());
