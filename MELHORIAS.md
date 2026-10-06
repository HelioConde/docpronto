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

- [x] Logo do prestador no documento/PDF com processamento local e snapshot por proposta, incluindo retorno sanitizado no link público com a Edge Function publicada.
- [x] Modelos rápidos de proposta por categoria (elétrica, hidráulica, pintura e serviço digital), sem preços pré-definidos.
- [x] Criar novo orçamento para cliente salvo em um clique, sempre saindo de eventual modo de edição.
- [x] Aceite textual opcional do cliente com nome registrado na aprovação e Edge Function publicada no Supabase.
- [x] Histórico de mudanças de status com timeline local/nuvem e respostas do cliente registradas pela Edge Function publicada.
- [x] Dashboard simples de conversão: aprovadas ÷ propostas que já entraram no funil de envio.
- [x] Fila visual de follow-up para propostas enviadas há 3 dias ou mais sem resposta, com ação rápida de WhatsApp/cópia.
- [x] PWA instalável com manifest, service worker e modo local disponível offline após a primeira abertura.
- [x] Feedback beta dentro do produto com nota, categoria e comentário; fila offline local e backend preparado sem coleta de dados pessoais.
- [x] Backup/restauração local em JSON para reduzir risco de perda de histórico no modo sem conta.

## P2 — depois da validação

- [ ] Lembretes de propostas sem resposta.
- [ ] Notificações push.
- [~] Integração com calendário/CRM: exportação .ics de follow-up concluída; integração com CRM fica para depois da validação.
- [x] Cobrança/limites comerciais removidos do roadmap atual; monetização definida por anúncios.
- [ ] Domínio personalizado/branding avançado.

## Regra de priorização

Não adicionar checkout, plano pago ou automações complexas antes de concluir P0 com usuários reais. O valor central do DocPronto continua sendo: criar, enviar e acompanhar uma proposta profissional com pouca fricção.


## Monetização

- [x] Estrutura de anúncios responsivos preparada e desativada por padrão.
- [ ] Ativar Publisher ID, slots e `ads.txt` somente após aprovação da rede de anúncios.
