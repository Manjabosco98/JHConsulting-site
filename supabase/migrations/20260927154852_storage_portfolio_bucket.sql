-- Fase 8: bucket de imagens do site (capas de projetos; foto na Fase 12).
-- Público para leitura por URL (/storage/v1/object/public/portfolio/...),
-- sem policy SELECT para anon: ninguém lista o bucket pela API.
-- Limites também no Storage (defesa em profundidade): 5 MiB e só imagens raster
-- (SVG fica de fora por poder conter script).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Escrita, leitura via API, substituição e remoção: somente admin ativo.
create policy portfolio_select_admin on storage.objects for select to authenticated
  using (bucket_id = 'portfolio' and (select private.is_admin()));
create policy portfolio_insert_admin on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio' and (select private.is_admin()));
create policy portfolio_update_admin on storage.objects for update to authenticated
  using (bucket_id = 'portfolio' and (select private.is_admin()))
  with check (bucket_id = 'portfolio' and (select private.is_admin()));
create policy portfolio_delete_admin on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio' and (select private.is_admin()));
