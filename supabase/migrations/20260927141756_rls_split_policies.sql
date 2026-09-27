-- Fase 3: uma única policy permissiva por (tabela, role, ação).
-- Antes: "<t>_public_read" (anon+authenticated, SELECT) + "<t>_admin" (authenticated, ALL)
-- geravam duas policies SELECT para authenticated (advisor multiple_permissive_policies).
-- Agora: leitura anon; leitura authenticated = pública OU admin; escrita admin por ação.
-- Semântica preservada; validada por supabase/tests/rls_matrix.sql antes e depois.

-- projects
drop policy projects_public_read on public.projects;
drop policy projects_admin on public.projects;
create policy projects_select_anon on public.projects for select to anon
  using (published and archived_at is null);
create policy projects_select_authenticated on public.projects for select to authenticated
  using ((published and archived_at is null) or (select private.is_admin()));
create policy projects_insert_admin on public.projects for insert to authenticated
  with check ((select private.is_admin()));
create policy projects_update_admin on public.projects for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy projects_delete_admin on public.projects for delete to authenticated
  using ((select private.is_admin()));

-- services
drop policy services_public_read on public.services;
drop policy services_admin on public.services;
create policy services_select_anon on public.services for select to anon
  using (active);
create policy services_select_authenticated on public.services for select to authenticated
  using (active or (select private.is_admin()));
create policy services_insert_admin on public.services for insert to authenticated
  with check ((select private.is_admin()));
create policy services_update_admin on public.services for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy services_delete_admin on public.services for delete to authenticated
  using ((select private.is_admin()));

-- technologies
drop policy technologies_public_read on public.technologies;
drop policy technologies_admin on public.technologies;
create policy technologies_select_anon on public.technologies for select to anon
  using (active);
create policy technologies_select_authenticated on public.technologies for select to authenticated
  using (active or (select private.is_admin()));
create policy technologies_insert_admin on public.technologies for insert to authenticated
  with check ((select private.is_admin()));
create policy technologies_update_admin on public.technologies for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy technologies_delete_admin on public.technologies for delete to authenticated
  using ((select private.is_admin()));

-- technology_groups
drop policy technology_groups_public_read on public.technology_groups;
drop policy technology_groups_admin on public.technology_groups;
create policy technology_groups_select_anon on public.technology_groups for select to anon
  using (active);
create policy technology_groups_select_authenticated on public.technology_groups for select to authenticated
  using (active or (select private.is_admin()));
create policy technology_groups_insert_admin on public.technology_groups for insert to authenticated
  with check ((select private.is_admin()));
create policy technology_groups_update_admin on public.technology_groups for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy technology_groups_delete_admin on public.technology_groups for delete to authenticated
  using ((select private.is_admin()));

-- project_technologies: visível quando projeto e tecnologia são públicos
drop policy project_technologies_public_read on public.project_technologies;
drop policy project_technologies_admin on public.project_technologies;
create policy project_technologies_select_anon on public.project_technologies for select to anon
  using (
    exists (select 1 from public.projects p where p.id = project_id and p.published and p.archived_at is null)
    and exists (select 1 from public.technologies t where t.id = technology_id and t.active)
  );
create policy project_technologies_select_authenticated on public.project_technologies for select to authenticated
  using (
    (select private.is_admin())
    or (
      exists (select 1 from public.projects p where p.id = project_id and p.published and p.archived_at is null)
      and exists (select 1 from public.technologies t where t.id = technology_id and t.active)
    )
  );
create policy project_technologies_insert_admin on public.project_technologies for insert to authenticated
  with check ((select private.is_admin()));
create policy project_technologies_update_admin on public.project_technologies for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy project_technologies_delete_admin on public.project_technologies for delete to authenticated
  using ((select private.is_admin()));

-- technology_group_members: visível quando grupo e tecnologia são ativos
drop policy technology_group_members_public_read on public.technology_group_members;
drop policy technology_group_members_admin on public.technology_group_members;
create policy technology_group_members_select_anon on public.technology_group_members for select to anon
  using (
    exists (select 1 from public.technology_groups g where g.id = group_id and g.active)
    and exists (select 1 from public.technologies t where t.id = technology_id and t.active)
  );
create policy technology_group_members_select_authenticated on public.technology_group_members for select to authenticated
  using (
    (select private.is_admin())
    or (
      exists (select 1 from public.technology_groups g where g.id = group_id and g.active)
      and exists (select 1 from public.technologies t where t.id = technology_id and t.active)
    )
  );
create policy technology_group_members_insert_admin on public.technology_group_members for insert to authenticated
  with check ((select private.is_admin()));
create policy technology_group_members_update_admin on public.technology_group_members for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy technology_group_members_delete_admin on public.technology_group_members for delete to authenticated
  using ((select private.is_admin()));

-- site_settings: singleton público; admin cria/edita; sem DELETE (sem grant)
drop policy settings_public_read on public.site_settings;
drop policy settings_admin on public.site_settings;
create policy site_settings_select_anon on public.site_settings for select to anon
  using (id = 1);
create policy site_settings_select_authenticated on public.site_settings for select to authenticated
  using (id = 1);
create policy site_settings_insert_admin on public.site_settings for insert to authenticated
  with check ((select private.is_admin()));
create policy site_settings_update_admin on public.site_settings for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- contacts: já era uma policy por ação (select/update admin); apenas padroniza nomes
alter policy contacts_admin_read on public.contacts rename to contacts_select_admin;
alter policy contacts_admin_status on public.contacts rename to contacts_update_admin;
