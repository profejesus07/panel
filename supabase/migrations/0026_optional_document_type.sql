-- El tipo de documento deja de ser obligatorio para estudiantes y
-- acudientes, igual que el número (0022): si la persona aún no tiene
-- documento no tiene sentido exigir su tipo. Los acudientes siguen
-- necesitando tipo y número para crear su usuario de acceso (CC43567890),
-- pero eso se valida en la aplicación.
alter table public.students alter column document_type drop not null;
alter table public.guardians alter column document_type drop not null;
