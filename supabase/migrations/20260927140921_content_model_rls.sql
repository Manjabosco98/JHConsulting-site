-- Fase 2: schema, grants e RLS (policies revisadas e testadas na Fase 3). Seed na Fase 4.
-- Preserve prior migration history; explicitly secure every object created here.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated, service_role;
grant usage on schema private to authenticated;

-- Schema-level REVOKE cannot cancel PostgreSQL's global default EXECUTE to PUBLIC.
alter default privileges for role postgres revoke execute on functions from public;

create table private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table private.admin_users enable row level security;
revoke all on table private.admin_users from public, anon, authenticated, service_role;

-- Controlled lookup only: users cannot read/edit the admin list or choose a subject.
create function private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from private.admin_users
    where user_id = (select auth.uid()) and active
  );
$$;
revoke all on function private.is_admin() from public, anon, authenticated, service_role;
grant execute on function private.is_admin() to authenticated;

create type public.contact_status as enum ('NEW', 'CONTACTED', 'NEGOTIATING', 'CONVERTED', 'ARCHIVED');

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  slug text not null unique check (char_length(slug) between 1 and 180 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_description text not null default '' check (char_length(short_description) <= 500),
  description text not null default '' check (char_length(description) <= 30000),
  problem text not null default '' check (char_length(problem) <= 15000),
  solution text not null default '' check (char_length(solution) <= 15000),
  category text not null check (char_length(btrim(category)) between 1 and 120),
  status text not null default '' check (char_length(status) <= 80),
  cover_image text check (char_length(cover_image) between 1 and 2048),
  repository_url text check (char_length(repository_url) <= 2048 and repository_url ~ '^https?://[^[:space:]]+$'),
  demo_url text check (char_length(demo_url) <= 2048 and demo_url ~ '^https?://[^[:space:]]+$'),
  featured boolean not null default false,
  display_order integer not null default 0 check (display_order >= 0),
  published boolean not null default false,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_publication_date check (not published or published_at is not null),
  constraint projects_archive_visibility check (archived_at is null or not published)
);
comment on column public.projects.status is 'Editorial label, e.g. Case técnico; independent of published/archived_at.';
comment on column public.projects.cover_image is 'Storage object path or image URL; upload policies are implemented in phase 8.';

create table public.technologies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  slug text not null unique check (char_length(slug) between 1 and 140 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  icon text check (char_length(icon) between 1 and 80),
  active boolean not null default true,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_technologies (
  project_id uuid not null references public.projects(id) on delete cascade,
  technology_id uuid not null references public.technologies(id) on delete restrict,
  display_order integer not null default 0 check (display_order >= 0),
  primary key (project_id, technology_id)
);

-- Python currently belongs to two groups; a single category column would lose data.
create table public.technology_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  slug text not null unique check (char_length(slug) between 1 and 140 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  display_order integer not null default 0 check (display_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.technology_group_members (
  group_id uuid not null references public.technology_groups(id) on delete cascade,
  technology_id uuid not null references public.technologies(id) on delete restrict,
  display_order integer not null default 0 check (display_order >= 0),
  primary key (group_id, technology_id)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  slug text not null unique check (char_length(slug) between 1 and 180 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null check (char_length(btrim(description)) between 1 and 5000),
  icon text not null check (char_length(btrim(icon)) between 1 and 80),
  tech text not null default '' check (char_length(tech) <= 500),
  display_order integer not null default 0 check (display_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.services.tech is 'Preserves the editorial technology/specialty line of the existing service cards.';

create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  company_name text not null check (char_length(btrim(company_name)) between 1 and 160),
  professional_name text not null check (char_length(btrim(professional_name)) between 1 and 160),
  role text not null check (char_length(btrim(role)) between 1 and 250),
  description text not null check (char_length(btrim(description)) between 1 and 4000),
  bio text not null default '' check (char_length(bio) <= 20000),
  email text check (char_length(email) <= 160 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  phone text check (char_length(phone) between 1 and 40),
  whatsapp text check (char_length(whatsapp) between 1 and 40),
  linkedin_url text check (char_length(linkedin_url) <= 2048 and linkedin_url ~ '^https?://[^[:space:]]+$'),
  github_url text check (char_length(github_url) <= 2048 and github_url ~ '^https?://[^[:space:]]+$'),
  instagram_url text check (char_length(instagram_url) <= 2048 and instagram_url ~ '^https?://[^[:space:]]+$'),
  location text not null check (char_length(btrim(location)) between 1 and 250),
  service_area text not null check (char_length(btrim(service_area)) between 1 and 500),
  profile_image text check (char_length(profile_image) between 1 and 2048),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.site_settings is 'Public institutional data only. Never store secrets or internal email delivery settings here.';

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 100),
  company text not null default '' check (char_length(company) <= 120),
  email text not null check (char_length(email) <= 160 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  whatsapp text not null default '' check (char_length(whatsapp) <= 40),
  project_type text not null check (char_length(btrim(project_type)) between 2 and 80),
  message text not null check (char_length(btrim(message)) between 20 and 4000),
  status public.contact_status not null default 'NEW',
  source text not null default 'SITE' check (char_length(btrim(source)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function private.touch_updated_at()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  new.created_at := old.created_at;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function private.touch_updated_at() from public, anon, authenticated, service_role;

create function private.prepare_project_publication()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if new.published and new.published_at is null then
    new.published_at := clock_timestamp();
  end if;
  return new;
end;
$$;
revoke all on function private.prepare_project_publication() from public, anon, authenticated, service_role;
create trigger prepare_project_publication before insert or update on public.projects
  for each row execute function private.prepare_project_publication();

create trigger touch_updated_at before update on public.projects for each row execute function private.touch_updated_at();
create trigger touch_updated_at before update on public.services for each row execute function private.touch_updated_at();
create trigger touch_updated_at before update on public.technologies for each row execute function private.touch_updated_at();
create trigger touch_updated_at before update on public.technology_groups for each row execute function private.touch_updated_at();
create trigger touch_updated_at before update on public.site_settings for each row execute function private.touch_updated_at();
create trigger touch_updated_at before update on public.contacts for each row execute function private.touch_updated_at();

create index projects_public_order_idx on public.projects(display_order, created_at desc, id) where published and archived_at is null;
create index projects_updated_idx on public.projects(updated_at desc);
create index services_active_order_idx on public.services(display_order, id) where active;
create index technologies_active_order_idx on public.technologies(display_order, name, id) where active;
create index technology_groups_active_order_idx on public.technology_groups(display_order, id) where active;
create index project_technologies_technology_idx on public.project_technologies(technology_id);
create index technology_group_members_technology_idx on public.technology_group_members(technology_id);
create index contacts_status_created_idx on public.contacts(status, created_at desc);
create index contacts_created_idx on public.contacts(created_at desc);

alter table public.projects enable row level security;
alter table public.services enable row level security;
alter table public.technologies enable row level security;
alter table public.project_technologies enable row level security;
alter table public.technology_groups enable row level security;
alter table public.technology_group_members enable row level security;
alter table public.site_settings enable row level security;
alter table public.contacts enable row level security;

-- Explicit grants even on installations that auto-expose public tables.
revoke all on public.projects, public.services, public.technologies,
  public.project_technologies, public.technology_groups, public.technology_group_members,
  public.site_settings, public.contacts from public, anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
grant select on public.projects, public.services, public.technologies,
  public.project_technologies, public.technology_groups, public.technology_group_members,
  public.site_settings to anon;
grant select, insert, update, delete on public.projects, public.services, public.technologies,
  public.project_technologies, public.technology_groups, public.technology_group_members to authenticated;
grant select, insert, update on public.site_settings to authenticated;
grant select, update(status) on public.contacts to authenticated;
-- The validated server-side contact endpoint will use this in phase 13.
grant insert(name, company, email, whatsapp, project_type, message, source), select(id)
  on public.contacts to service_role;
revoke all on type public.contact_status from public;
grant usage on type public.contact_status to authenticated, service_role;

create policy projects_public_read on public.projects for select to anon, authenticated
  using (published and archived_at is null);
create policy services_public_read on public.services for select to anon, authenticated using (active);
create policy technologies_public_read on public.technologies for select to anon, authenticated using (active);
create policy technology_groups_public_read on public.technology_groups for select to anon, authenticated using (active);
create policy settings_public_read on public.site_settings for select to anon, authenticated using (id = 1);
create policy project_technologies_public_read on public.project_technologies for select to anon, authenticated
  using (
    exists (select 1 from public.projects p where p.id = project_id and p.published and p.archived_at is null)
    and exists (select 1 from public.technologies t where t.id = technology_id and t.active)
  );
create policy technology_group_members_public_read on public.technology_group_members for select to anon, authenticated
  using (
    exists (select 1 from public.technology_groups g where g.id = group_id and g.active)
    and exists (select 1 from public.technologies t where t.id = technology_id and t.active)
  );

create policy projects_admin on public.projects for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy services_admin on public.services for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy technologies_admin on public.technologies for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy project_technologies_admin on public.project_technologies for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy technology_groups_admin on public.technology_groups for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy technology_group_members_admin on public.technology_group_members for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy settings_admin on public.site_settings for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy contacts_admin_read on public.contacts for select to authenticated
  using ((select private.is_admin()));
create policy contacts_admin_status on public.contacts for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

