# Melhorias — DocPronto

Atualizado em 2026-10-06.

Este é o backlog oficial do produto. A prioridade é homologar o que já existe antes de ampliar o escopo.

## P0 — homologação

- [x] Criar propostas no modo local sem cadastro.
- [x] Editar, duplicar, excluir e alterar status.
- [x] Busca, filtros, ordenação e exportação CSV.
- [x] Link público seguro com aprovação/recusa.
- [x] Clientes reutilizáveis e identidade do negócio.
- [x] Browser E2E em Chromium para o fluxo local e proposta pública.
- [x] Smoke responsivo automatizado em 360 px, 768 px e 1440 px.
- [ ] Homologar cadastro, login, recuperação de senha e sessão expirada com conta real.
- [ ] Homologar isolamento entre duas contas reais.
- [ ] Testar envio real de link público em navegador separado contra o backend de produção.
- [x] Revisar PDF A4 automaticamente com 10 itens, desconto, observações e dados completos; geração real via Chromium coberta no E2E.

## P1 — produto

- [ ] Logo do prestador no documento.
- [ ] Modelos de proposta reutilizáveis por categoria.
- [x] Criar novo orçamento para cliente salvo em um clique, sempre saindo de eventual modo de edição.
- [ ] Campo opcional de assinatura/aceite textual do cliente.
- [ ] Histórico de mudanças de status.
- [x] Dashboard simples de conversão: aprovadas ÷ propostas que já entraram no funil de envio.
- [x] PWA instalável com manifest, service worker e modo local disponível offline após a primeira abertura.
- [ ] Feedback beta dentro do produto.

## P2 — depois da validação

- [ ] Lembretes de propostas sem resposta.
- [ ] Notificações push.
- [ ] Integração com calendário/CRM.
- [ ] Cobrança e limites comerciais somente se a recorrência justificar.
- [ ] Domínio personalizado/branding avançado.

## Regra de priorização

Não adicionar checkout, plano pago ou automações complexas antes de concluir P0 com usuários reais. O valor central do DocPronto continua sendo: criar, enviar e acompanhar uma proposta profissional com pouca fricção.
