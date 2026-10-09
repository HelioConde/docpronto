# DocPronto — encerramento técnico do MVP 1.0

**Revisado em:** 09/10/2026  
**Estado:** funcionalidades principais concluídas; site publicado; pronto para **beta controlado**.  
**Distinção importante:** MVP técnico pronto não equivale a homologação de uso comercial em produção com usuários reais.

## Evidências técnicas

- [x] Frontend publicado: https://helioconde.github.io/docpronto/
- [x] Cálculo em centavos, limite de 10 itens, descontos, validade, histórico, aprovação/recusa, CSV, PDF A4, PT-BR e inglês implementados.
- [x] GitHub Actions: Static QA, Quality checks e Live Update QA aprovados após as correções de segurança.
- [x] Browser E2E em Chromium: **21 de 21 testes aprovados**. Incluem dois novos testes de PWA, cache compartilhado e modo local offline.
- [x] Service worker limitado aos arquivos públicos do próprio DocPronto; URLs privadas com query string não entram em Cache Storage.
- [x] O atualizador de versão não exclui caches nem atualiza service workers de outros produtos hospedados na mesma origem.
- [x] Funções de consulta pública, aprovação/recusa e feedback beta registradas como `ACTIVE` no Supabase.
- [x] Tabelas `docpronto_*` com RLS; tabelas de propostas e clientes bloqueiam SELECT anônimo.
- [x] Permissões legadas de `docpronto_documents` e `docpronto_items` para `anon` revogadas no banco, preservando acesso autenticado: migration `20261009094447_docpronto_revoke_legacy_anonymous_table_access.sql`.
- [x] SQL de verificação pós-migration confirmou `anon` sem SELECT/INSERT/UPDATE/DELETE nessas duas tabelas.
- [x] Suíte de qualidade ampliada para prevenir regressão no cache e grants.

### Evidências no GitHub

- [Browser E2E — 21 testes aprovados](https://github.com/HelioConde/docpronto/actions/runs/37913117881)
- [Static QA](https://github.com/HelioConde/docpronto/actions/runs/37913117879)
- [Quality checks](https://github.com/HelioConde/docpronto/actions/runs/37913117875)
- [Live Update QA](https://github.com/HelioConde/docpronto/actions/runs/37913117822)
- [GitHub Pages anterior aprovado](https://github.com/HelioConde/docpronto/actions/runs/37584578696)
- [Validação humana pendente — issue #1](https://github.com/HelioConde/docpronto/issues/1)

## Homologação externa pendente

- [ ] Realizar cadastro, login, confirmação/recuperação de e-mail e expiração/renovação de sessão com conta humana real.
- [ ] Abrir propostas em dois dispositivos reais, com o cliente aprovando e recusando por links seguros.
- [ ] Conferir isolamento de dados e histórico usando dois proprietários com contas distintas reais.
- [ ] Conferir o PDF A4 em impressora física, incluindo quebra de página e margens.
- [ ] Verificar WhatsApp e compartilhamento em aparelhos reais.
- [ ] Validar funil de uso e feedback de prestadores antes de divulgação ampla.
- [ ] Ativar anúncios **somente após aprovação** e preenchimento de Publisher ID, slots e configuração de consentimento aplicável.
- [ ] Confirmar o último workflow de GitHub Pages aprovado para os commits finais de encerramento.

## Regra de manutenção

**Congelar novas funcionalidades P2/CRM/assinaturas por enquanto.** Corrigir somente bugs críticos, acessibilidade, privacidade e problemas identificados durante a rodada com usuários reais.

O banco `pizzaria-db` também hospeda outros projetos. Avisos de segurança que pertencem a módulos externos ao DocPronto precisam ser tratados separadamente para não quebrar sistemas adjacentes.

Referência: [Row Level Security — Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).
