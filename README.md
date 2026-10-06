# DocPronto

Gerador de propostas e orçamentos para prestadores de serviço.

## Recursos

- Propostas com até 10 itens, quantidades e cálculo em centavos.
- Histórico recente, edição, uso como modelo, exclusão e impressão/PDF.
- Uso sem conta com armazenamento local no navegador.
- Conta opcional com e-mail e senha para salvar propostas no Supabase e acessá-las em outros dispositivos.
- Importação explícita do histórico local para a conta.

## Arquitetura

- Frontend estático hospedado no GitHub Pages.
- Supabase Auth para contas.
- PostgreSQL na tabela isolada `public.docpronto_proposals`.
- RLS restringe leitura e alteração ao proprietário (`auth.uid() = owner_id`).
- O navegador usa somente a chave **publishable**. Nunca use `service_role` ou uma secret key no frontend.
- A criação de propostas continua disponível sem conta; sem login, os dados permanecem neste dispositivo.

## Configuração única de Auth

No projeto `pizzaria-db`, em **Authentication → URL Configuration**, adicione esta URL à lista de Redirect URLs sem remover as demais aplicações:

`https://helioconde.github.io/docpronto/`

Mantenha as configurações e os redirects dos outros projetos. O DocPronto usa confirmação de e-mail e links de redefinição de senha. Para uso público, configure um provedor de e-mail transacional do projeto Supabase.

## Desenvolvimento e QA

O site é servido estaticamente; não há etapa de compilação.

```sh
node --check app.js
node --check proposal-core.js
node --check supabase-config.js
node --test tests/quality.test.cjs
```

O GitHub Actions executa essas verificações em cada push para `main` e em pull requests.

## Cobranças

Não há pagamentos ativos. O produto não anuncia mais preços de planos que ainda não podem ser comprados. A estratégia de monetização deve ser validada antes de integrar checkout.

## Auditoria

Ver [docs/auditoria-do-produto.md](docs/auditoria-do-produto.md) para as avaliações de UX/UI, QA, negócio (CEO), design e SEO, além dos riscos e próximas prioridades.
