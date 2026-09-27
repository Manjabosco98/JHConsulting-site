-- Fase 11: grupos de tecnologias (N:N) e exclusão segura de tecnologia.
-- Ambas SECURITY INVOKER: grants e RLS do chamador continuam valendo; a checagem
-- explícita de admin apenas antecipa um erro claro (42501).

-- Cria (p_id nulo) ou atualiza um grupo e substitui seus membros na mesma
-- transação. A ordem de p_technology_ids vira o display_order na seção pública.
-- p_group (jsonb): name, slug, display_order, active.
create function public.admin_save_technology_group(p_group jsonb, p_technology_ids uuid[], p_id uuid default null)
returns uuid language plpgsql security invoker set search_path = ''
as $$
declare
  v_id uuid;
  v_technology_ids uuid[] := coalesce(p_technology_ids, '{}');
begin
  if not (select private.is_admin()) then
    raise exception 'admin required' using errcode = '42501';
  end if;

  if p_id is null then
    insert into public.technology_groups (name, slug, display_order, active)
    values (
      p_group->>'name', p_group->>'slug',
      coalesce((p_group->>'display_order')::integer, 0),
      coalesce((p_group->>'active')::boolean, true)
    )
    returning id into v_id;
  else
    update public.technology_groups set
      name = p_group->>'name',
      slug = p_group->>'slug',
      display_order = coalesce((p_group->>'display_order')::integer, 0),
      active = coalesce((p_group->>'active')::boolean, true)
    where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'group not found' using errcode = 'P0002';
    end if;
  end if;

  delete from public.technology_group_members
  where group_id = v_id and technology_id <> all (v_technology_ids);

  insert into public.technology_group_members (group_id, technology_id, display_order)
  select v_id, t.id, t.ord::integer
  from unnest(v_technology_ids) with ordinality as t(id, ord)
  on conflict (group_id, technology_id) do update set display_order = excluded.display_order;

  return v_id;
end;
$$;
revoke all on function public.admin_save_technology_group(jsonb, uuid[], uuid) from public, anon, authenticated, service_role;
grant execute on function public.admin_save_technology_group(jsonb, uuid[], uuid) to authenticated;
comment on function public.admin_save_technology_group(jsonb, uuid[], uuid) is 'Admin: cria/atualiza grupo de tecnologias e substitui seus membros atomicamente.';

-- Exclui uma tecnologia removendo antes os vínculos de grupo (o FK é RESTRICT,
-- então sem isso a exclusão falharia). Vínculo com projeto bloqueia: o histórico
-- do portfólio não pode perder a tecnologia sem decisão editorial.
create function public.admin_delete_technology(p_id uuid)
returns void language plpgsql security invoker set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise exception 'admin required' using errcode = '42501';
  end if;
  if exists (select 1 from public.project_technologies where technology_id = p_id) then
    raise exception 'technology linked to projects' using errcode = '23503';
  end if;

  delete from public.technology_group_members where technology_id = p_id;
  delete from public.technologies where id = p_id;
  if not found then
    raise exception 'technology not found' using errcode = 'P0002';
  end if;
end;
$$;
revoke all on function public.admin_delete_technology(uuid) from public, anon, authenticated, service_role;
grant execute on function public.admin_delete_technology(uuid) to authenticated;
comment on function public.admin_delete_technology(uuid) is 'Admin: remove vínculos de grupo e exclui a tecnologia; bloqueia se houver projeto vinculado.';
