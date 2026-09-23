-- El documento de identidad deja de ser obligatorio para estudiantes y
-- acudientes: hay estudiantes (sobre todo en primera infancia) y acudientes
-- que aún no tienen documento al momento de la matrícula. El acceso al
-- panel no depende de este campo (los estudiantes usan su código
-- estudiantil y los acudientes requieren documento solo para crear su
-- usuario), así que queda como dato opcional.
alter table public.students alter column document_number drop not null;
alter table public.guardians alter column document_number drop not null;
