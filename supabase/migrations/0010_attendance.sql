create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete restrict,
  date date not null,
  status public.attendance_status not null,
  notes text,
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (student_id, date)
);

comment on table public.attendance is 'Un registro de asistencia por estudiante y día. course_id conserva el curso vigente al momento del registro.';

create index attendance_student_id_idx on public.attendance (student_id);
create index attendance_course_id_idx on public.attendance (course_id);
create index attendance_date_idx on public.attendance (date);
