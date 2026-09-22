create table public.official_records (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  number text,
  record_date date not null default current_date,
  type public.official_record_type not null default 'otro',
  description text,
  document_url text,
  status public.official_record_status not null default 'vigente',
  audience public.audience_scope not null default 'todos',
  course_id uuid references public.courses (id) on delete set null,
  student_id uuid references public.students (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (audience <> 'curso' or course_id is not null),
  check (audience <> 'estudiante' or student_id is not null)
);

comment on table public.official_records is 'Actas institucionales. La audiencia determina quién puede consultarlas además del admin.';

create index official_records_course_id_idx on public.official_records (course_id);
create index official_records_student_id_idx on public.official_records (student_id);
create index official_records_audience_idx on public.official_records (audience);

create trigger set_updated_at
  before update on public.official_records
  for each row execute function public.set_updated_at();
