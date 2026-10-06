# Fullstack architecture

Atualizado em 2026-10-06.

## Estado de produção

O DocPronto já possui um MVP fullstack funcional:

- frontend estático publicado no GitHub Pages;
- modo local sem conta via `localStorage`;
- Supabase Auth para sincronização entre dispositivos;
- propostas persistidas em `docpronto_proposals`;
- clientes reutilizáveis em `docpronto_clients`, com gerenciamento dos clientes salvos pela própria conta;
- identidade do negócio sincronizada em `user_metadata` do Supabase Auth, sem tabela adicional;
- status comercial: rascunho, enviada, aprovada e recusada;
- desconto percentual ou fixo, observações e dados opcionais do cliente;
- catálogo leve derivado do histórico para sugerir serviços/materiais e último preço sem nova tabela;
- busca no histórico, filtro de vencidas, ordenação por data/valor/vencimento, resumo comercial, carregamento progressivo e exportação CSV;
- sinalização de propostas expiradas ou próximas do vencimento;
- link público protegido por token para o cliente;
- aprovação/recusa sem conta através das Edge Functions `proposal-public` e `proposal-response`;
- impressão/salvamento em PDF A4 pelo navegador, tanto pelo prestador quanto pelo cliente;
- CI com Static QA, testes Node e Browser E2E em Chromium;
- PWA instalável e modo local offline;
- backup/restauração local validado;
- feedback beta com fila offline e endpoint publicado;
- follow-up com exportação de calendário `.ics`;
- monetização por anúncios preparada e desativada até existirem IDs reais.

O backend compartilhado é o projeto Supabase `pizzaria-db`. O DocPronto usa apenas tabelas e funções com prefixo/escopo próprio.

## Internacionalização

O produto usa uma camada de i18n no frontend com:

- PT-BR como locale padrão e fallback;
- inglês como segundo idioma obrigatório;
- seletor PT/EN acessível;
- preferência persistida em `localStorage`;
- tradução também de conteúdo dinâmico gerado pelo JavaScript;
- formatação localizada de datas, números e moeda;
- atualização de `lang`, title, description e Open Graph conforme o idioma ativo;
- preservação do texto original em PT-BR ao alternar entre os idiomas.

## Segurança

`docpronto_proposals` e `docpronto_clients` possuem RLS por proprietário.

A tabela de propostas concede ao papel `authenticated` apenas SELECT, INSERT, UPDATE e DELETE. O frontend usa somente chave publishable.

Os links públicos não expõem acesso direto à tabela: o token bruto fica somente no link do cliente e o banco armazena apenas SHA-256. Novos links usam o fragmento `#` para evitar enviar o token ao GitHub Pages; links antigos em query string continuam compatíveis. As Edge Functions usam credencial privilegiada apenas no servidor e retornam um payload sanitizado.

## Fluxo principal

1. Usuário monta o orçamento sem precisar criar conta.
2. O total é calculado em centavos pelo `proposal-core.js`.
3. A proposta é salva localmente ou na nuvem quando autenticado.
4. O usuário pode editar, duplicar como modelo, excluir e alterar status.
5. Com conta conectada, pode gerar ou enviar direto pelo WhatsApp um link seguro para o cliente. Reabrir uma proposta encerrada invalida explicitamente o link antigo.
6. O cliente abre a proposta e aprova ou recusa sem cadastro.
7. O status atualizado volta para o histórico do prestador; ao retornar à aba, o DocPronto atualiza as propostas automaticamente e mostra a data da resposta.

## QA

Automatizado e homologado tecnicamente:

- sintaxe JavaScript, precisão monetária, limites e validação dos itens;
- Static QA, testes Node e Browser E2E em Chromium;
- criação/edição/status/CSV, templates, logo, timeline e aceite textual;
- PWA offline, feedback beta, backup/restauração e exportação de calendário;
- PDF A4 longo com 10 itens, desconto e observações;
- smoke responsivo em 360 px, 768 px e 1440 px;
- smoke básico de acessibilidade;
- isolamento RLS de clientes/propostas em duas identidades autenticadas simuladas, executado em transação com rollback;
- fluxo público ao vivo contra produção: `proposal-public` → `proposal-response` → `proposal-public`, incluindo `acceptedBy` e timeline persistidos;
- limpeza dos usuários/dados QA após o teste live.

Ainda exige homologação humana:

- cadastro, confirmação de e-mail, login, recuperação de senha e expiração/renovação de sessão;
- repetição ponta a ponta com duas contas humanas reais;
- rodada visual final no GitHub Pages e link público em navegador separado.

## UX/UI

A revisão visual de 2026-10-06 corrigiu:

- hero excessivamente alto;
- título quebrando em linhas demais no desktop;
- texto do card lateral sem separação entre título e descrição;
- painel de histórico sendo esticado até a altura do formulário e criando uma grande área vazia;
- estado vazio do histórico pouco orientativo.

## Próximas prioridades

O backlog oficial está em `MELHORIAS.md`. O produto está tecnicamente homologado para beta. A ordem imediata agora é:

1. homologar cadastro/login/recuperação e sessão com uma conta humana real;
2. repetir o fluxo autenticado com duas contas humanas reais no navegador;
3. fazer uma rodada visual final no GitHub Pages;
4. iniciar validação com usuários antes de ampliar P2.
