-- Fase 2: correção da fundação. A migration anterior revogou apenas
-- SELECT/INSERT/UPDATE/DELETE; os defaults do Supabase ainda concediam
-- TRUNCATE (ignora RLS), REFERENCES, TRIGGER e MAINTAIN em tabelas e UPDATE
-- em sequências futuras. Novos objetos em public nascem sem privilégios para
-- as roles da API; cada migration concede explicitamente o necessário.

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated, service_role;
