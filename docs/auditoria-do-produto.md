# Auditoria do produto — DocPronto

Atualizado em 6 de outubro de 2026 após homologação técnica do frontend, backend e fluxos públicos.

## UX/UI

**Avaliação: MVP tecnicamente maduro e pronto para beta controlado.**

- O gerador continua abrindo direto, sem forçar cadastro.
- O formulário suporta até 10 itens, desconto percentual/fixo, observações, validade, dados completos do cliente e identidade do negócio.
- Histórico, edição, duplicação, modelos rápidos, busca, filtros, ordenação, CSV e carregamento progressivo cobrem o uso recorrente.
- A fila **Sem resposta** destaca propostas enviadas há 3 dias ou mais e oferece follow-up por WhatsApp ou cópia de mensagem.
- A timeline registra mudanças de status com data/hora e origem.
- O cliente pode aprovar ou recusar sem conta e, na aprovação, informar opcionalmente o nome do responsável pelo aceite.
- Logo, cor e dados do prestador acompanham o documento e o link público.
- PWA, backup/restauração local e modo offline reduzem risco para quem usa sem conta.
- PT-BR é o idioma padrão e o inglês possui paridade nos fluxos principais.
- A revisão visual já cobre 360 px, 768 px e 1440 px por smoke automatizado; ainda é recomendada uma rodada visual humana antes de divulgação ampla.

## QA e segurança

**Avaliação: homologação técnica forte; pendências restantes dependem de contas e uso humano reais.**

Implementado e validado:

- testes Node para cálculo monetário, limites, validações e regressões;
- Static QA e Browser E2E em Chromium;
- PDF A4 longo com 10 itens, desconto e observações;
- PWA/offline, feedback beta, backup/restauração e calendário;
- isolamento RLS validado tecnicamente entre duas identidades autenticadas em transação com rollback;
- `docpronto_proposals` e `docpronto_clients` protegidas por RLS por proprietário;
- frontend usa apenas chave publishable;
- link público usa token bruto somente no cliente e armazena SHA-256 no banco;
- `proposal-public` ativa em produção e retorna somente payload sanitizado;
- `proposal-response` ativa em produção e registra resposta, aceite textual e timeline;
- fluxo público real homologado contra produção: abrir → aprovar → consultar novamente;
- `docpronto_beta_feedback` com RLS habilitado e sem acesso direto para `anon`; gravação acontece pela Edge Function validada `beta-feedback`;
- dados QA do smoke de produção foram removidos ao final.

Pendências que continuam humanas/externas:

- cadastro, confirmação de e-mail, login, recuperação e expiração/renovação de sessão com uma conta humana real;
- repetir o fluxo autenticado ponta a ponta com duas contas humanas reais;
- abrir o link público em outro navegador/dispositivo com uma pessoa real;
- validar configuração de e-mail transacional e Redirect URLs durante essa rodada humana.

Os findings de segurança restantes no projeto Supabase compartilhado pertencem majoritariamente a outros módulos do `pizzaria-db` e não devem ser alterados como parte do DocPronto sem uma auditoria específica desses produtos.

## Negócio / visão de produto

**Avaliação: proposta de valor clara; o próximo risco é de mercado, não de implementação básica.**

- Público inicial: prestadores autônomos e pequenos negócios que precisam criar, enviar e acompanhar orçamentos rapidamente.
- Valor central: sair de um formulário simples para uma proposta profissional, compartilhável e acompanhável com pouca fricção.
- O modo local sem conta reduz barreira de entrada; sincronização vira benefício para quem retorna.
- Monetização do portfólio está definida por anúncios. O DocPronto já possui slots responsivos preparados e desativados até existirem Publisher ID/slots aprovados.
- Checkout, assinatura e limites comerciais foram retirados do roadmap atual.
- A próxima validação deve medir primeira proposta criada, envio ao cliente, aprovação, retorno semanal e uso do follow-up.

## Design

**Avaliação: identidade consistente, com hierarquia adequada ao contexto comercial.**

- A paleta atual usa azul-petróleo, neutros frios e acento quente com contraste revisado.
- Formulário e acompanhamento comercial continuam sendo os elementos dominantes.
- Histórico não estica mais artificialmente até a altura do formulário.
- Estados vazios, validade, follow-up, timeline e aprovação possuem sinais visuais específicos.
- Foco visível, `prefers-reduced-motion` e skip link para o conteúdo principal estão implementados.
- O documento/PDF mantém aparência mais neutra que a interface para preservar legibilidade de impressão.

## SEO e descoberta

Implementado:

- title, description, canonical, Open Graph e `og:locale` PT-BR/EN;
- metadados Twitter/X;
- dados estruturados `WebApplication` com idiomas e recursos;
- `robots.txt` e `sitemap.xml`;
- metadados sociais atualizados conforme a troca PT-BR/EN;
- GitHub Pages como URL canônica atual.

Pendente fora do código:

- configurar/acompanhar Search Console;
- validar indexação depois da estabilização;
- produzir conteúdo editorial útil somente depois de confirmar quais categorias de prestadores realmente usam o produto.

## Estado de produção

O DocPronto está **tecnicamente homologado para beta controlado**. A próxima etapa não é ampliar o número de features: é executar a homologação humana restante e observar uso real.

## Próximas prioridades

1. Homologar cadastro/login/recuperação/sessão com uma conta humana real.
2. Repetir isolamento e sincronização em dois navegadores com duas contas humanas reais.
3. Fazer uma rodada visual final e abrir um link público em navegador/dispositivo separado.
4. Iniciar validação com prestadores reais antes de avançar para lembretes automáticos, push ou CRM.
