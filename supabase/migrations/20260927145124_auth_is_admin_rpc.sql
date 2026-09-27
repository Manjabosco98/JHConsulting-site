-- Fase 5: permite ao servidor Next.js verificar se o usuário da sessão é admin.
-- private.* não é exposto pela Data API; este wrapper só responde sobre o próprio
-- usuário (auth.uid()), sem parâmetros, e é executável apenas por authenticated.
create function public.is_admin()
returns boolean language sql stable security invoker set search_path = ''
as $$
  select private.is_admin();
$$;
revoke all on function public.is_admin() from public, anon, authenticated, service_role;
grant execute on function public.is_admin() to authenticated;
comment on function public.is_admin() is 'True se o usuário autenticado atual está ativo em private.admin_users.';
