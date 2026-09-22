create table public.courses (
  id uuid primary key default gen_random_uuid(),
  grade text not null,
  group_name text not null,
  shift public.course_shift not null default 'unica',
  academic_year text not null,
  status public.course_status not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (grade, group_name, shift, academic_year)
);

comment on table public.courses is 'Cursos/grupos por grado, jornada y año lectivo. No existe asignación de docentes.';

create index courses_academic_year_idx on public.courses (academic_year);

create trigger set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();
