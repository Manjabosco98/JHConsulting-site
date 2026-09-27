-- Fase 7: p_id vira o último parâmetro, opcional (default null = criar).
-- Mesmo corpo; a assinatura opcional gera tipos TypeScript fiéis (p_id?: string).
drop function public.admin_save_project(uuid, jsonb, uuid[]);

create function public.admin_save_project(p_project jsonb, p_technology_ids uuid[], p_id uuid default null)
returns uuid language plpgsql security invoker set search_path = ''
as $$
declare
  v_id uuid;
  v_visibility text := p_project->>'visibility';
  v_technology_ids uuid[] := coalesce(p_technology_ids, '{}');
begin
  if not (select private.is_admin()) then
    raise exception 'admin required' using errcode = '42501';
  end if;
  if v_visibility is null or v_visibility not in ('draft', 'published', 'archived') then
    raise exception 'invalid visibility' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.projects (
      title, slug, category, status, short_description, description, problem, solution,
      repository_url, demo_url, featured, display_order, published, archived_at
    ) values (
      p_project->>'title', p_project->>'slug', p_project->>'category', coalesce(p_project->>'status', ''),
      coalesce(p_project->>'short_description', ''), coalesce(p_project->>'description', ''),
      coalesce(p_project->>'problem', ''), coalesce(p_project->>'solution', ''),
      nullif(p_project->>'repository_url', ''), nullif(p_project->>'demo_url', ''),
      coalesce((p_project->>'featured')::boolean, false), coalesce((p_project->>'display_order')::integer, 0),
      v_visibility = 'published', case when v_visibility = 'archived' then now() end
    )
    returning id into v_id;
  else
    update public.projects set
      title = p_project->>'title',
      slug = p_project->>'slug',
      category = p_project->>'category',
      status = coalesce(p_project->>'status', ''),
      short_description = coalesce(p_project->>'short_description', ''),
      description = coalesce(p_project->>'description', ''),
      problem = coalesce(p_project->>'problem', ''),
      solution = coalesce(p_project->>'solution', ''),
      repository_url = nullif(p_project->>'repository_url', ''),
      demo_url = nullif(p_project->>'demo_url', ''),
      featured = coalesce((p_project->>'featured')::boolean, false),
      display_order = coalesce((p_project->>'display_order')::integer, 0),
      published = v_visibility = 'published',
      archived_at = case when v_visibility = 'archived' then coalesce(archived_at, now()) end
    where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'project not found' using errcode = 'P0002';
    end if;
  end if;

  delete from public.project_technologies
  where project_id = v_id and technology_id <> all (v_technology_ids);

  insert into public.project_technologies (project_id, technology_id, display_order)
  select v_id, t.id, t.ord::integer
  from unnest(v_technology_ids) with ordinality as t(id, ord)
  on conflict (project_id, technology_id) do update set display_order = excluded.display_order;

  return v_id;
end;
$$;
revoke all on function public.admin_save_project(jsonb, uuid[], uuid) from public, anon, authenticated, service_role;
grant execute on function public.admin_save_project(jsonb, uuid[], uuid) to authenticated;
comment on function public.admin_save_project(jsonb, uuid[], uuid) is 'Admin: cria (p_id nulo) ou atualiza projeto e substitui tecnologias vinculadas atomicamente.';
