-- Panel Escolar — datos de referencia
--
-- Solo catálogo genérico (asignaturas), no información de personas ni de
-- la institución: eso lo configura el administrador desde la aplicación
-- una vez tenga su cuenta (school_settings, cursos, estudiantes, etc.).
-- Seguro de ejecutar más de una vez gracias a "on conflict do nothing".

insert into public.subjects (name) values
  ('Matemáticas'),
  ('Español y Literatura'),
  ('Ciencias Naturales'),
  ('Ciencias Sociales'),
  ('Inglés'),
  ('Educación Física'),
  ('Educación Artística'),
  ('Tecnología e Informática'),
  ('Ética y Valores'),
  ('Educación Religiosa')
on conflict (name) do nothing;
