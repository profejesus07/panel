create table public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete restrict,
  period_id uuid not null references public.academic_periods (id) on delete restrict,
  score numeric(5, 2) not null,
  scale text not null default '1.0 a 5.0',
  observation text,
  graded_at date not null default current_date,
  status public.grade_status not null default 'definitiva',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, subject_id, period_id)
);

comment on table public.grades is 'Una calificación consolidada por estudiante, asignatura y período académico.';

create index grades_student_id_idx on public.grades (student_id);
create index grades_subject_id_idx on public.grades (subject_id);
create index grades_period_id_idx on public.grades (period_id);

create trigger set_updated_at
  before update on public.grades
  for each row execute function public.set_updated_at();
