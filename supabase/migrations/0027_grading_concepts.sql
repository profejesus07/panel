-- ============================================================================
-- Actividades de calificación configurables por curso (grading_concepts)
-- ============================================================================
-- Antes, cada nota parcial (grade_entries) llevaba su "concepto" como texto
-- libre por estudiante: el mismo taller podía quedar escrito distinto para
-- cada uno y no había forma de ver qué actividades se han definido para un
-- curso. Esta migración agrega una tabla de plantillas de actividades por
-- curso + asignatura + período (p. ej. "Taller 1" 20 %, "Examen final" 30 %),
-- y liga cada nota parcial a la actividad de la que proviene mediante
-- concept_id. Un trigger mantiene grade_entries.concept y .weight
-- sincronizados con la actividad elegida, así que el cálculo de la nota
-- final (public.recompute_grade, migración 0024) no necesita cambios.
-- ============================================================================

create table public.grading_concepts (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  period_id uuid not null references public.academic_periods (id) on delete cascade,
  name text not null,
  weight numeric(5, 2) check (weight is null or (weight > 0 and weight <= 100)),
  position integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, subject_id, period_id, name)
);

comment on table public.grading_concepts is 'Actividades de evaluación configuradas por curso, asignatura y período (p. ej. Taller 1, Examen final), con porcentaje opcional. Plantilla sobre la que se registran las notas individuales de grade_entries.';
comment on column public.grading_concepts.weight is 'Porcentaje opcional (0-100]. La suma de las actividades de un mismo curso+asignatura+período no puede superar 100.';
comment on column public.grading_concepts.position is 'Orden de presentación dentro del curso+asignatura+período.';

create index grading_concepts_group_idx on public.grading_concepts (course_id, subject_id, period_id);
create index grading_concepts_created_by_idx on public.grading_concepts (created_by);

create trigger set_updated_at
  before update on public.grading_concepts
  for each row execute function public.set_updated_at();

-- La suma de porcentajes configurados en un mismo curso+asignatura+período
-- no puede superar 100 (igual que la regla ya existente para grade_entries).
create or replace function public.check_grading_concepts_weight()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_total numeric;
begin
  select coalesce(sum(weight), 0) into v_total
  from public.grading_concepts
  where course_id = new.course_id and subject_id = new.subject_id and period_id = new.period_id
    and id <> new.id;
  v_total := v_total + coalesce(new.weight, 0);
  if v_total > 100 then
    raise exception 'La suma de porcentajes de las actividades no puede superar 100 %% (actualmente %).', v_total
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger check_weight_before_change
  before insert or update on public.grading_concepts
  for each row execute function public.check_grading_concepts_weight();

alter table public.grading_concepts enable row level security;

create policy "grading_concepts_authenticated_select" on public.grading_concepts
  for select to authenticated using (true);
create policy "grading_concepts_admin_write" on public.grading_concepts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Enlazar grade_entries con la actividad de la que proviene.
-- ----------------------------------------------------------------------------
alter table public.grade_entries
  add column concept_id uuid references public.grading_concepts (id) on delete set null;

comment on column public.grade_entries.concept_id is 'Actividad configurada (grading_concepts) de la que proviene esta nota. Nulo para notas libres registradas sin actividad configurada.';

create index grade_entries_concept_id_idx on public.grade_entries (concept_id);

-- Si la nota viene de una actividad configurada, su texto y porcentaje se
-- toman siempre de la actividad (así se evita que queden desincronizados si
-- luego se renombra o se le cambia el porcentaje).
create or replace function public.grade_entries_sync_concept()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_name text;
  v_weight numeric;
begin
  if new.concept_id is not null then
    select name, weight into v_name, v_weight
    from public.grading_concepts
    where id = new.concept_id;

    if v_name is null then
      raise exception 'La actividad seleccionada no existe.' using errcode = 'foreign_key_violation';
    end if;

    new.concept := v_name;
    new.weight := v_weight;
  end if;
  return new;
end;
$$;

create trigger sync_concept_before_change
  before insert or update on public.grade_entries
  for each row execute function public.grade_entries_sync_concept();
