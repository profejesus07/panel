-- La fecha de nacimiento deja de ser obligatoria para estudiantes: no
-- siempre se conoce al momento de la matrícula o de la carga masiva desde
-- Excel. Ninguna funcionalidad del panel depende de este dato, así que
-- queda como opcional.
alter table public.students alter column birth_date drop not null;
