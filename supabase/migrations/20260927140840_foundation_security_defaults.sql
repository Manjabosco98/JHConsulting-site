-- Fase 1: fundação de segurança.
--
-- Desde 2026, projetos novos do Supabase podem exigir GRANTs explícitos para
-- expor objetos pela Data API. Estas regras tornam esse comportamento
-- reproduzível também no ambiente local. Cada migration de domínio deverá
-- conceder somente os privilégios necessários e habilitar RLS no mesmo arquivo.

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables
  from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke usage, select on sequences
  from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke execute on functions
  from anon, authenticated, service_role;
