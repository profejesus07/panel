-- ============================================================================
-- Fecha de la actividad (grading_concepts.date)
-- ============================================================================
-- Antes, la fecha de una nota se pedía cada vez que se calificaba a un
-- estudiante (grade_entries.graded_at), aunque en la práctica todos los
-- estudiantes de una misma actividad (p. ej. "Taller 1") se califican con la
-- misma fecha. Esta migración agrega esa fecha a la actividad misma, para
-- configurarla una sola vez al crearla; las notas que se registren para esa
-- actividad toman esta fecha automáticamente (ver upsertConceptGradeEntry).
-- ============================================================================

alter table public.grading_concepts
  add column date date not null default current_date;

comment on column public.grading_concepts.date is 'Fecha de la actividad, configurada al crearla o editarla. Las notas registradas para esta actividad usan esta fecha como graded_at.';
