-- ===== Enums =====
create type public.app_role as enum ('CITIZEN','FIELD_WORKER','ADMIN');
create type public.issue_status as enum ('REPORTED','VERIFIED','ASSIGNED','IN_PROGRESS','COMPLETION_SUBMITTED','RESOLVED','REJECTED');
create type public.issue_priority as enum ('LOW','MEDIUM','HIGH','CRITICAL');
create type public.issue_category as enum ('Pothole','Streetlight','Garbage','Water Leakage','Drainage','Road Damage','Other');
create type public.completion_status as enum ('SUBMITTED','VERIFIED','REWORK_REQUESTED');

-- ===== Profiles =====
create table public.profiles (
  id uuid primary key,
  name text not null,
  email text,
  team text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable by everyone" on public.profiles for select using (true);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

-- ===== Roles =====
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant insert on public.user_roles to authenticated;
grant select on public.user_roles to anon;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "roles readable" on public.user_roles for select using (true);
-- users may only ever self-assign the CITIZEN role; privileged roles require an admin
create policy "self citizen role only" on public.user_roles for insert to authenticated
  with check ((auth.uid() = user_id and role = 'CITIZEN') or public.has_role(auth.uid(),'ADMIN'));
create policy "admins manage roles" on public.user_roles for update to authenticated
  using (public.has_role(auth.uid(),'ADMIN'));
create policy "admins delete roles" on public.user_roles for delete to authenticated
  using (public.has_role(auth.uid(),'ADMIN'));

-- ===== Priority scoring (deterministic, explainable) =====
create or replace function public.category_severity(_category public.issue_category)
returns int language sql immutable as $$
  select case _category
    when 'Water Leakage' then 8
    when 'Drainage' then 8
    when 'Pothole' then 6
    when 'Road Damage' then 6
    when 'Garbage' then 5
    when 'Streetlight' then 4
    else 3 end
$$;

create or replace function public.persistence_points(_created_at timestamptz)
returns int language sql stable as $$
  select least(10, greatest(0, case
    when _created_at > now() - interval '6 hours' then 0
    when _created_at > now() - interval '12 hours' then 1
    when _created_at > now() - interval '24 hours' then 2
    when _created_at > now() - interval '48 hours' then 3
    when _created_at > now() - interval '72 hours' then 4
    else 4 + floor(extract(epoch from (now() - _created_at - interval '72 hours')) / 86400)::int
  end))
$$;

create or replace function public.civic_priority_score(_category public.issue_category, _confirmations int, _created_at timestamptz)
returns int language sql stable as $$
  select public.category_severity(_category) + least(10, coalesce(_confirmations,0)) + public.persistence_points(_created_at)
$$;

create or replace function public.civic_priority(_score int)
returns public.issue_priority language sql immutable as $$
  select case
    when _score >= 21 then 'CRITICAL'::public.issue_priority
    when _score >= 15 then 'HIGH'::public.issue_priority
    when _score >= 8 then 'MEDIUM'::public.issue_priority
    else 'LOW'::public.issue_priority end
$$;

-- ===== Issues =====
create table public.issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category public.issue_category not null,
  latitude double precision not null,
  longitude double precision not null,
  address text,
  image_url text,
  status public.issue_status not null default 'REPORTED',
  priority public.issue_priority not null default 'LOW',
  priority_score int not null default 0,
  confirmation_count int not null default 0,
  reported_by uuid not null references public.profiles(id) on delete cascade,
  assigned_team text,
  assigned_worker_id uuid references public.profiles(id) on delete set null,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index issues_status_idx on public.issues(status);
create index issues_category_idx on public.issues(category);
create index issues_worker_idx on public.issues(assigned_worker_id);
grant select, insert, update on public.issues to authenticated;
grant select on public.issues to anon;
grant all on public.issues to service_role;
alter table public.issues enable row level security;

create policy "issues readable" on public.issues for select using (true);
create policy "citizens report issues" on public.issues for insert to authenticated
  with check (auth.uid() = reported_by);
create policy "admins update issues" on public.issues for update to authenticated
  using (public.has_role(auth.uid(),'ADMIN'));
create policy "workers update own assigned issues" on public.issues for update to authenticated
  using (public.has_role(auth.uid(),'FIELD_WORKER') and assigned_worker_id = auth.uid())
  with check (assigned_worker_id = auth.uid() and status in ('IN_PROGRESS','COMPLETION_SUBMITTED'));

create or replace function public.issues_set_priority()
returns trigger language plpgsql set search_path = public as $$
begin
  new.priority_score := public.civic_priority_score(new.category, new.confirmation_count, coalesce(new.created_at, now()));
  new.priority := public.civic_priority(new.priority_score);
  new.updated_at := now();
  return new;
end $$;
create trigger issues_priority_trg before insert or update on public.issues
  for each row execute function public.issues_set_priority();

-- ===== Community confirmations =====
create table public.issue_confirmations (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (issue_id, user_id)
);
grant select, insert on public.issue_confirmations to authenticated;
grant select on public.issue_confirmations to anon;
grant all on public.issue_confirmations to service_role;
alter table public.issue_confirmations enable row level security;
create policy "confirmations readable" on public.issue_confirmations for select using (true);
create policy "confirm as self" on public.issue_confirmations for insert to authenticated
  with check (auth.uid() = user_id);

create or replace function public.sync_confirmation_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.issues i
     set confirmation_count = (select count(*) from public.issue_confirmations c where c.issue_id = i.id)
   where i.id = coalesce(new.issue_id, old.issue_id);
  return null;
end $$;
create trigger confirmations_count_trg after insert or delete on public.issue_confirmations
  for each row execute function public.sync_confirmation_count();

-- ===== Assignments =====
create table public.issue_assignments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  worker_id uuid references public.profiles(id) on delete set null,
  team text,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now()
);
grant select, insert on public.issue_assignments to authenticated;
grant all on public.issue_assignments to service_role;
alter table public.issue_assignments enable row level security;
create policy "assignments readable" on public.issue_assignments for select to authenticated using (true);
create policy "admins assign" on public.issue_assignments for insert to authenticated
  with check (public.has_role(auth.uid(),'ADMIN'));

-- ===== Completions =====
create table public.issue_completions (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  worker_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz,
  completed_at timestamptz,
  time_spent_minutes int,
  work_description text,
  before_image_url text,
  after_image_url text,
  completion_notes text,
  submitted_at timestamptz,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  status public.completion_status not null default 'SUBMITTED',
  created_at timestamptz not null default now()
);
create index completions_issue_idx on public.issue_completions(issue_id);
grant select, insert, update on public.issue_completions to authenticated;
grant select on public.issue_completions to anon;
grant all on public.issue_completions to service_role;
alter table public.issue_completions enable row level security;
create policy "completions readable" on public.issue_completions for select using (true);
create policy "worker inserts own completion" on public.issue_completions for insert to authenticated
  with check (auth.uid() = worker_id and exists (
    select 1 from public.issues i where i.id = issue_id and i.assigned_worker_id = auth.uid()));
create policy "worker updates own completion" on public.issue_completions for update to authenticated
  using (auth.uid() = worker_id);
create policy "admin verifies completion" on public.issue_completions for update to authenticated
  using (public.has_role(auth.uid(),'ADMIN'));

-- ===== Duplicate detection (approx 100m radius, same category, active issue) =====
create or replace function public.find_nearby_issues(
  _category public.issue_category, _lat double precision, _lng double precision, _radius_m double precision default 100
)
returns table (
  id uuid, title text, category public.issue_category, status public.issue_status,
  priority public.issue_priority, confirmation_count int, created_at timestamptz, distance_m double precision
)
language sql stable security definer set search_path = public as $$
  select i.id, i.title, i.category, i.status, i.priority, i.confirmation_count, i.created_at,
    (6371000 * acos(least(1, greatest(-1,
      cos(radians(_lat)) * cos(radians(i.latitude)) * cos(radians(i.longitude) - radians(_lng))
      + sin(radians(_lat)) * sin(radians(i.latitude)))))) as distance_m
  from public.issues i
  where i.category = _category
    and i.status not in ('RESOLVED','REJECTED')
  order by distance_m asc
  limit 5
$$;
