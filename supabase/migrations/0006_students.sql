create table public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  first_name text not null,
  last_name text not null,
  document_type public.document_type not null,
  document_number text not null,
  birth_date date not null,
  gender text check (gender in ('masculino', 'femenino', 'otro')),
  address text,
  phone text,
  email text,
  student_code text not null,
  status public.student_status not null default 'activo',
  course_id uuid references public.courses (id) on delete set null,
  enrollment_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_type, document_number),
  unique (student_code)
);

comment on table public.students is 'Estudiantes matriculados. user_id puede ser nulo mientras no se le crea cuenta de acceso.';

create index students_user_id_idx on public.students (user_id);
create index students_course_id_idx on public.students (course_id);
create index students_status_idx on public.students (status);

create trigger set_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();
