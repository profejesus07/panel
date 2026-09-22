create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.subjects is 'Catálogo de asignaturas.';

create table public.academic_periods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  academic_year text not null,
  start_date date not null,
  end_date date not null,
  status public.course_status not null default 'activo',
  created_at timestamptz not null default now(),
  unique (name, academic_year),
  check (end_date >= start_date)
);

comment on table public.academic_periods is 'Períodos académicos (bimestres/trimestres) por año lectivo.';

create index academic_periods_academic_year_idx on public.academic_periods (academic_year);
