# DocPronto

Gerador de propostas e orçamentos profissionais para prestadores de serviço.

## Estado atual

- composição de orçamento com até 10 itens;
- cálculo de total e validade;
- edição, duplicação como modelo e exclusão;
- acompanhamento comercial por status: rascunho, enviada, aprovada e recusada;
- filtro do histórico por status e busca por cliente, empresa ou número;
- resumo comercial com total de propostas, enviadas e valor aprovado;
- aviso visual para propostas vencidas ou próximas da validade;
- compartilhamento de resumo por WhatsApp e cópia rápida;
- link público seguro para o cliente abrir a proposta;
- aprovação ou recusa da proposta sem conta, protegida por token;
- impressão/salvamento em PDF A4 pelo navegador, inclusive na proposta compartilhada;
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
