-- ============================================================================
-- Propaga cambios de una actividad (grading_concepts) a sus notas
-- ============================================================================
-- El trigger de la migración 0027 solo copia el nombre/porcentaje de la
-- actividad a la nota parcial cuando esa nota se inserta o se actualiza. Si
-- luego se edita la actividad (p. ej. se le sube el porcentaje de 20 % a
-- 30 %), las notas ya registradas se quedarían con el valor viejo. Este
-- trigger actualiza esas notas cuando cambia el nombre o el porcentaje de la
-- actividad, lo que a su vez dispara el trigger existente de grade_entries
-- que recalcula la nota final.
-- ============================================================================

create or replace function public.grading_concepts_propagate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.name is distinct from old.name or new.weight is distinct from old.weight then
    update public.grade_entries
    set concept = new.name, weight = new.weight
    where concept_id = new.id;
  end if;
  return new;
end;
$$;

create trigger propagate_after_update
  after update on public.grading_concepts
  for each row execute function public.grading_concepts_propagate();
