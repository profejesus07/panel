create table public.behavior_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  type public.behavior_record_type not null,
  title text,
  description text not null,
  record_date date not null default current_date,
  status public.behavior_record_status not null default 'abierto',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.behavior_records is 'Convivencia: observaciones, reconocimientos, compromisos y seguimiento por estudiante.';

create index behavior_records_student_id_idx on public.behavior_records (student_id);
create index behavior_records_type_idx on public.behavior_records (type);

create trigger set_updated_at
  before update on public.behavior_records
  for each row execute function public.set_updated_at();
