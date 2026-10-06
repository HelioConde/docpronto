# DocPronto

Gerador de propostas e orçamentos profissionais para prestadores de serviço.

## Estado atual

- composição de orçamento com até 10 itens;
- cálculo de total e validade;
- edição, duplicação como modelo e exclusão;
- acompanhamento comercial por status: rascunho, enviada, aprovada e recusada;
- filtro do histórico por status;
- compartilhamento de resumo por WhatsApp e cópia rápida;
- link público seguro para o cliente abrir a proposta;
- aprovação ou recusa da proposta sem conta, protegida por token;
- impressão/salvamento em PDF pelo navegador;
- modo local sem conta;
- Supabase Auth;
- sincronização das propostas em `docpronto_proposals`;
- importação de histórico local;
- cadastro reutilizável de clientes na nuvem;
- preenchimento automático de nome e WhatsApp de clientes já usados;
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
