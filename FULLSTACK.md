# Fullstack architecture

Atualizado em 2026-10-06.

## Estado de produção

O DocPronto já possui um MVP fullstack funcional:

- frontend estático publicado no GitHub Pages;
- modo local sem conta via `localStorage`;
- Supabase Auth para sincronização entre dispositivos;
- propostas persistidas em `docpronto_proposals`;
- clientes reutilizáveis em `docpronto_clients`;
- status comercial: rascunho, enviada, aprovada e recusada;
- link público protegido por token para o cliente;
- aprovação/recusa sem conta através das Edge Functions `proposal-public` e `proposal-response`;
- impressão/salvamento em PDF pelo navegador;
- CI com Static QA e testes Node.

O backend compartilhado é o projeto Supabase `pizzaria-db`. O DocPronto usa apenas tabelas e funções com prefixo/escopo próprio.

## Segurança

`docpronto_proposals` e `docpronto_clients` possuem RLS por proprietário.

A tabela de propostas concede ao papel `authenticated` apenas SELECT, INSERT, UPDATE e DELETE. O frontend usa somente chave publishable.

Os links públicos não expõem acesso direto à tabela: o token bruto fica somente no link do cliente e o banco armazena apenas SHA-256. As Edge Functions usam credencial privilegiada apenas no servidor e retornam um payload sanitizado.

## Fluxo principal

1. Usuário monta o orçamento sem precisar criar conta.
2. O total é calculado em centavos pelo `proposal-core.js`.
3. A proposta é salva localmente ou na nuvem quando autenticado.
4. O usuário pode editar, duplicar como modelo, excluir e alterar status.
5. Com conta conectada, pode gerar um link seguro para o cliente.
6. O cliente abre a proposta e aprova ou recusa sem cadastro.
7. O status atualizado volta para o histórico do prestador.

## QA

Automatizado:

- sintaxe JavaScript;
- precisão monetária;
- limites e validação dos itens;
- presença de RLS/grants mínimos nas migrations;
- presença das funções públicas seguras;
- regressão do layout principal;
- arquivos e metadados essenciais;
- GitHub Actions em push e pull request.

Ainda exige homologação manual:

- cadastro, confirmação de e-mail, login e recuperação de senha;
- sincronização em duas contas diferentes para confirmar isolamento real;
- expiração de sessão e falha de rede;
- impressão/PDF com conteúdo longo;
- revisão visual em 360 px, 768 px e 1440 px;
- fluxo completo do link público em um navegador separado.

## UX/UI

A revisão visual de 2026-10-06 corrigiu:

- hero excessivamente alto;
- título quebrando em linhas demais no desktop;
- texto do card lateral sem separação entre título e descrição;
- painel de histórico sendo esticado até a altura do formulário e criando uma grande área vazia;
- estado vazio do histórico pouco orientativo.

## Próximas prioridades

1. Homologar autenticação e isolamento entre duas contas.
2. Validar o fluxo público completo de envio → abertura → aprovação/recusa.
3. Revisar mobile e impressão com propostas reais.
4. Adicionar identidade visual do prestador (logo/cores) depois da estabilidade do MVP.
5. Só então testar limites de plano, cobrança, lembretes e notificações.
