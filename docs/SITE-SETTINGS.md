# Configurações do site empresarial

A linha singleton `public.site_settings` (id = 1) mantém identidade, contatos, localização e dados anteriores do responsável.

## O que aparece no site

| Campo | Uso público |
|---|---|
| Nome da empresa | Títulos, metadados, imagem de compartilhamento, JSON-LD e copyright |
| Descrição curta | Descrição para buscadores e compartilhamento |
| E-mail e WhatsApp | Contatos comerciais e botões |
| Localização e área de atendimento | Apresentação da empresa e rodapé |
| Nome do responsável, cargo, biografia, retrato e redes pessoais | Não são exibidos no site empresarial |

O wordmark JHConsulting continua em markup. Os textos da apresentação, método, benefícios e FAQ são editoriais, mantidos nos componentes e em `src/constants/content.ts`. O catálogo de serviços continua administrável em `/admin/servicos`.

## Painel

`/admin/configuracoes` preserva os formulários e registros anteriores. As instruções deixam claro quais campos são internos. A ausência de redes pessoais ou de retrato não gera alerta de conteúdo público pendente; apenas e-mail e WhatsApp são sinalizados.

A gravação permanece um upsert da linha 1. Campos opcionais vazios são gravados como NULL. A lógica de autorização, upload, rollback e remoção de imagens foi preservada. Não houve alteração do schema ou das permissões.

## Leitura e cache

`getSiteSettings()` é memoizado por requisição. Em falha de consulta, devolve o objeto degradado com a marca e campos opcionais vazios. Os contatos não recebem valores fictícios nem fallback de variáveis de ambiente. As configurações públicas continuam revalidadas após edição pelo painel.

Os dados estruturados descrevem a empresa e seu catálogo de serviços. Biografia, retrato e perfis pessoais não alimentam o JSON-LD.

## Verificação

Os testes unitários cobrem validação, persistência, degradação, autenticação e ausência de exposição pessoal. A regressão pública é somente de leitura. `tests/e2e/admin-settings.e2e.mjs` teve as expectativas ajustadas ao site empresarial, mas continua exigindo ambiente de teste autorizado por modificar dados e arquivos reais.

Consulte [SITE-INSTITUCIONAL.md](SITE-INSTITUCIONAL.md).
