# DocPronto

Gerador de propostas e orçamentos profissionais para prestadores de serviço.

## Estado atual

- composição de orçamento com até 10 itens;
- cálculo de total e validade;
- edição, duplicação como modelo e exclusão;
- impressão/salvamento em PDF pelo navegador;
- modo local sem conta;
- Supabase Auth;
- sincronização das propostas em `docpronto_proposals`;
- importação de histórico local;
- dados privados por RLS;
- GitHub Pages + CI;
- SEO básico.

## Backend

Tabelas:
- `docpronto_clients`
- `docpronto_documents`
- `docpronto_items`
- `docpronto_proposals`
- `product_subscriptions`

Veja `FULLSTACK.md` para arquitetura e próximos passos.
