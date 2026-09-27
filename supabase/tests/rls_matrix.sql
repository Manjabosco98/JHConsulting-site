-- Matriz de acesso (grants + RLS) — Fase 3.
-- Executar no Supabase Cloud pelo conector (execute_sql). Sem banco local.
--
-- Cria fixtures (usuários em auth.users, admin ativo/inativo, conteúdo publicado,
-- rascunho, arquivado, ativo/inativo), simula cada role com SET LOCAL ROLE +
-- request.jwt.claims e compara o resultado com o esperado.
-- Termina SEMPRE com RAISE EXCEPTION: a transação é desfeita e nada persiste.
-- Saída: "RLS_MATRIX pass=N fail=M" seguida das falhas (label: obtido != esperado).
--
-- Tipos de caso: value = valor da 1ª coluna; rows = linhas afetadas;
-- qualquer erro vira "ERR <sqlstate>" (42501 = privilégio/RLS negado).
do $$
declare
  admin_id uuid := gen_random_uuid();
  user_id uuid := gen_random_uuid();
  inactive_id uuid := gen_random_uuid();
  p_pub uuid; p_draft uuid; p_arch uuid;
  t_on uuid; t_off uuid; g_on uuid; g_off uuid;
  pids text; tids text; gids text;
  c record; v text; n bigint; got text;
  ok int := 0; bad int := 0; fails text := '';
begin
  -- Fixtures (como postgres)
  insert into auth.users (id, email, aud, role) values
    (admin_id, 'rls-admin@test.invalid', 'authenticated', 'authenticated'),
    (user_id, 'rls-user@test.invalid', 'authenticated', 'authenticated'),
    (inactive_id, 'rls-inactive@test.invalid', 'authenticated', 'authenticated');
  insert into private.admin_users (user_id, active) values (admin_id, true), (inactive_id, false);

  insert into public.projects (title, slug, category, published) values ('Pub', 'rls-test-pub', 'T', true) returning id into p_pub;
  insert into public.projects (title, slug, category) values ('Draft', 'rls-test-draft', 'T') returning id into p_draft;
  insert into public.projects (title, slug, category, archived_at) values ('Arch', 'rls-test-arch', 'T', now()) returning id into p_arch;
  insert into public.technologies (name, slug) values ('On', 'rls-test-on') returning id into t_on;
  insert into public.technologies (name, slug, active) values ('Off', 'rls-test-off', false) returning id into t_off;
  insert into public.project_technologies (project_id, technology_id) values (p_pub, t_on), (p_pub, t_off), (p_draft, t_on);
  insert into public.technology_groups (name, slug) values ('G on', 'rls-test-g-on') returning id into g_on;
  insert into public.technology_groups (name, slug, active) values ('G off', 'rls-test-g-off', false) returning id into g_off;
  insert into public.technology_group_members (group_id, technology_id) values (g_on, t_on), (g_on, t_off), (g_off, t_on);
  insert into public.services (title, slug, description, icon) values ('S on', 'rls-test-s-on', 'd', 'Bot');
  insert into public.services (title, slug, description, icon, active) values ('S off', 'rls-test-s-off', 'd', 'Bot', false);
  insert into public.site_settings (id, company_name, professional_name, role, description, location, service_area)
    values (1, 'C', 'P', 'R', 'D', 'L', 'A') on conflict (id) do nothing;
  insert into public.contacts (name, email, project_type, message)
    values ('Teste', 'rls-test@test.invalid', 'Site', 'Mensagem de teste com mais de vinte caracteres');

  pids := format('(%L,%L,%L)', p_pub, p_draft, p_arch);
  tids := format('(%L,%L)', t_on, t_off);
  gids := format('(%L,%L)', g_on, g_off);

  for c in
    select * from (values
      -- ANON: lê só conteúdo público; nenhuma escrita; sem contatos/privado
      (1,  'anon', null::uuid, 'value', $q$select count(*) from public.projects where slug like 'rls-test-%'$q$, '1'),
      (2,  'anon', null, 'value', $q$select count(*) from public.services where slug like 'rls-test-%'$q$, '1'),
      (3,  'anon', null, 'value', $q$select count(*) from public.technologies where slug like 'rls-test-%'$q$, '1'),
      (4,  'anon', null, 'value', 'select count(*) from public.project_technologies where project_id in ' || pids, '1'),
      (5,  'anon', null, 'value', $q$select count(*) from public.technology_groups where slug like 'rls-test-%'$q$, '1'),
      (6,  'anon', null, 'value', 'select count(*) from public.technology_group_members where group_id in ' || gids, '1'),
      (7,  'anon', null, 'value', 'select count(*) from public.site_settings', '1'),
      (8,  'anon', null, 'value', 'select count(*) from public.contacts', 'ERR 42501'),
      (9,  'anon', null, 'rows',  $q$insert into public.projects (title, slug, category) values ('x', 'rls-test-x', 'x')$q$, 'ERR 42501'),
      (10, 'anon', null, 'rows',  $q$update public.projects set title = 'x' where slug like 'rls-test-%'$q$, 'ERR 42501'),
      (11, 'anon', null, 'rows',  $q$delete from public.projects where slug like 'rls-test-%'$q$, 'ERR 42501'),
      (12, 'anon', null, 'rows',  'truncate public.projects cascade', 'ERR 42501'),
      (13, 'anon', null, 'rows',  $q$insert into public.contacts (name, email, project_type, message) values ('Ana', 'a@b.co', 'Site', 'mensagem com mais de vinte caracteres')$q$, 'ERR 42501'),
      (14, 'anon', null, 'value', 'select private.is_admin()', 'ERR 42501'),
      (15, 'anon', null, 'value', 'select count(*) from private.admin_users', 'ERR 42501'),
      (16, 'anon', null, 'rows',  $q$update public.site_settings set role = 'x'$q$, 'ERR 42501'),
      (17, 'anon', null, 'rows',  'update public.technologies set active = true where id in ' || tids, 'ERR 42501'),

      -- USUÁRIO AUTENTICADO SEM ADMIN: igual ao público; escritas bloqueadas pelo RLS
      (20, 'authenticated', user_id, 'value', 'select private.is_admin()', 'false'),
      (21, 'authenticated', user_id, 'value', $q$select count(*) from public.projects where slug like 'rls-test-%'$q$, '1'),
      (22, 'authenticated', user_id, 'value', $q$select count(*) from public.services where slug like 'rls-test-%'$q$, '1'),
      (23, 'authenticated', user_id, 'value', $q$select count(*) from public.technologies where slug like 'rls-test-%'$q$, '1'),
      (24, 'authenticated', user_id, 'value', 'select count(*) from public.project_technologies where project_id in ' || pids, '1'),
      (25, 'authenticated', user_id, 'value', 'select count(*) from public.technology_group_members where group_id in ' || gids, '1'),
      (26, 'authenticated', user_id, 'value', 'select count(*) from public.contacts', '0'),
      (27, 'authenticated', user_id, 'rows',  $q$insert into public.projects (title, slug, category) values ('x', 'rls-test-x', 'x')$q$, 'ERR 42501'),
      (28, 'authenticated', user_id, 'rows',  $q$update public.projects set title = 'x' where slug like 'rls-test-%'$q$, 'rows=0'),
      (29, 'authenticated', user_id, 'rows',  $q$delete from public.projects where slug like 'rls-test-%'$q$, 'rows=0'),
      (30, 'authenticated', user_id, 'rows',  $q$insert into public.services (title, slug, description, icon) values ('x', 'rls-test-x', 'd', 'Bot')$q$, 'ERR 42501'),
      (31, 'authenticated', user_id, 'rows',  'insert into public.project_technologies (project_id, technology_id) values (' || quote_literal(p_draft) || ',' || quote_literal(t_off) || ')', 'ERR 42501'),
      (32, 'authenticated', user_id, 'rows',  $q$update public.site_settings set role = 'x'$q$, 'rows=0'),
      (33, 'authenticated', user_id, 'rows',  $q$insert into public.site_settings (id, company_name, professional_name, role, description, location, service_area) values (1,'a','b','c','d','e','f') on conflict (id) do update set role = 'x'$q$, 'ERR 42501'),
      (34, 'authenticated', user_id, 'rows',  $q$update public.contacts set status = 'ARCHIVED'$q$, 'rows=0'),
      (35, 'authenticated', user_id, 'rows',  $q$update public.contacts set message = 'alterada por usuario comum'$q$, 'ERR 42501'),
      (36, 'authenticated', user_id, 'rows',  'delete from public.contacts', 'ERR 42501'),
      (37, 'authenticated', user_id, 'rows',  'insert into private.admin_users (user_id) values (' || quote_literal(user_id) || ')', 'ERR 42501'),
      (38, 'authenticated', user_id, 'value', 'select count(*) from private.admin_users', 'ERR 42501'),
      (39, 'authenticated', user_id, 'rows',  'truncate public.projects cascade', 'ERR 42501'),

      -- ADMIN INATIVO: tratado como usuário comum
      (40, 'authenticated', inactive_id, 'value', 'select private.is_admin()', 'false'),
      (41, 'authenticated', inactive_id, 'value', $q$select count(*) from public.projects where slug like 'rls-test-%'$q$, '1'),
      (42, 'authenticated', inactive_id, 'rows',  $q$update public.projects set title = 'x' where slug like 'rls-test-%'$q$, 'rows=0'),

      -- ADMIN: vê e gerencia todo o conteúdo; contatos só leitura + status
      (50, 'authenticated', admin_id, 'value', 'select private.is_admin()', 'true'),
      (51, 'authenticated', admin_id, 'value', $q$select count(*) from public.projects where slug like 'rls-test-%'$q$, '3'),
      (52, 'authenticated', admin_id, 'value', $q$select count(*) from public.services where slug like 'rls-test-%'$q$, '2'),
      (53, 'authenticated', admin_id, 'value', $q$select count(*) from public.technologies where slug like 'rls-test-%'$q$, '2'),
      (54, 'authenticated', admin_id, 'value', 'select count(*) from public.project_technologies where project_id in ' || pids, '3'),
      (55, 'authenticated', admin_id, 'value', $q$select count(*) from public.technology_groups where slug like 'rls-test-%'$q$, '2'),
      (56, 'authenticated', admin_id, 'value', 'select count(*) from public.technology_group_members where group_id in ' || gids, '3'),
      (57, 'authenticated', admin_id, 'value', $q$select count(*) from public.contacts where email = 'rls-test@test.invalid'$q$, '1'),
      (58, 'authenticated', admin_id, 'rows',  $q$update public.contacts set status = 'CONTACTED' where email = 'rls-test@test.invalid'$q$, 'rows=1'),
      (59, 'authenticated', admin_id, 'rows',  $q$update public.contacts set message = 'alterada pelo administrador'$q$, 'ERR 42501'),
      (60, 'authenticated', admin_id, 'rows',  'delete from public.contacts', 'ERR 42501'),
      (61, 'authenticated', admin_id, 'rows',  $q$insert into public.contacts (name, email, project_type, message) values ('Ana', 'a@b.co', 'Site', 'mensagem com mais de vinte caracteres')$q$, 'ERR 42501'),
      (62, 'authenticated', admin_id, 'rows',  $q$update public.site_settings set role = 'Admin edit'$q$, 'rows=1'),
      (63, 'authenticated', admin_id, 'rows',  'delete from public.site_settings', 'ERR 42501'),
      (64, 'authenticated', admin_id, 'rows',  $q$insert into public.projects (title, slug, category) values ('Novo', 'rls-test-new', 'T')$q$, 'rows=1'),
      (65, 'authenticated', admin_id, 'rows',  $q$update public.projects set published = true where slug = 'rls-test-draft'$q$, 'rows=1'),
      (66, 'authenticated', admin_id, 'rows',  'insert into public.project_technologies (project_id, technology_id) values (' || quote_literal(p_draft) || ',' || quote_literal(t_off) || ')', 'rows=1'),
      (67, 'authenticated', admin_id, 'rows',  $q$insert into public.services (title, slug, description, icon) values ('Novo', 'rls-test-s-new', 'd', 'Bot')$q$, 'rows=1'),
      (68, 'authenticated', admin_id, 'rows',  'update public.technologies set active = true where id in ' || tids, 'rows=2'),
      (69, 'authenticated', admin_id, 'rows',  'delete from public.technology_group_members where group_id = ' || quote_literal(g_off), 'rows=1'),
      (70, 'authenticated', admin_id, 'rows',  $q$delete from public.projects where slug = 'rls-test-arch'$q$, 'rows=1'),
      (71, 'authenticated', admin_id, 'value', 'select count(*) from private.admin_users', 'ERR 42501'),
      (72, 'authenticated', admin_id, 'rows',  'truncate public.projects cascade', 'ERR 42501'),

      -- SERVICE ROLE (servidor): somente inserir contato com colunas do formulário
      (80, 'service_role', null, 'rows',  $q$insert into public.contacts (name, email, project_type, message) values ('Srv', 'srv@test.invalid', 'Site', 'mensagem com mais de vinte caracteres')$q$, 'rows=1'),
      (81, 'service_role', null, 'rows',  $q$insert into public.contacts (name, email, project_type, message, status) values ('Srv', 'srv@test.invalid', 'Site', 'mensagem com mais de vinte caracteres', 'CONVERTED')$q$, 'ERR 42501'),
      (82, 'service_role', null, 'value', 'select count(email) from public.contacts', 'ERR 42501'),
      (83, 'service_role', null, 'value', 'select count(*) from public.projects', 'ERR 42501')
    ) as t(id, role, uid, kind, sql, expected)
    order by id
  loop
    execute 'reset role';
    perform set_config('request.jwt.claims',
      case when c.uid is null then '' else json_build_object('sub', c.uid, 'role', c.role)::text end, true);
    execute format('set local role %I', c.role);
    begin
      if c.kind = 'value' then
        execute c.sql into v;
        got := coalesce(v, 'null');
      else
        execute c.sql;
        get diagnostics n = row_count;
        got := 'rows=' || n;
      end if;
    exception when others then
      got := 'ERR ' || sqlstate;
    end;
    execute 'reset role';
    if got = c.expected then
      ok := ok + 1;
    else
      bad := bad + 1;
      fails := fails || format(' | #%s %s: %s != %s', c.id, c.role, got, c.expected);
    end if;
  end loop;

  raise exception 'RLS_MATRIX pass=% fail=% %', ok, bad, fails;
end $$;
