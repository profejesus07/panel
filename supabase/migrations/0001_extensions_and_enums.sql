-- Extensiones requeridas
create extension if not exists pgcrypto with schema extensions;

-- Tipos enumerados del dominio de Panel Escolar
create type public.user_role as enum ('admin', 'estudiante', 'padre');

create type public.document_type as enum ('RC', 'TI', 'CC', 'CE', 'PA');

create type public.student_status as enum ('activo', 'inactivo', 'retirado', 'graduado');

create type public.course_shift as enum ('manana', 'tarde', 'unica', 'fin_de_semana');

create type public.course_status as enum ('activo', 'inactivo');

create type public.guardian_relationship as enum ('padre', 'madre', 'tutor', 'acudiente', 'otro');

create type public.attendance_status as enum ('presente', 'ausente', 'tarde', 'justificado');

create type public.justification_status as enum ('pendiente', 'aprobada', 'rechazada');

create type public.grade_status as enum ('borrador', 'definitiva');

create type public.behavior_record_type as enum (
  'observacion',
  'reconocimiento',
  'compromiso',
  'situacion_convivencia'
);

create type public.behavior_record_status as enum ('abierto', 'en_seguimiento', 'cerrado');

create type public.official_record_type as enum (
  'reunion',
  'disciplinaria',
  'comite',
  'graduacion',
  'otro'
);

create type public.official_record_status as enum ('vigente', 'anulada');

create type public.announcement_status as enum ('borrador', 'publicado', 'archivado');

-- Compartido entre anuncios y actas: a quién está destinado el contenido
create type public.audience_scope as enum ('todos', 'estudiantes', 'padres', 'curso', 'estudiante');
