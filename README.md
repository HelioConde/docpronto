# DocPronto

Gerador de propostas e orçamentos profissionais para prestadores de serviço.

## Estado atual

- composição de orçamento com até 10 itens;
- desconto percentual ou fixo com subtotal e total final;
- observações opcionais para garantia, exclusões e condições especiais;
- cálculo de total e validade;
- edição, duplicação como modelo e exclusão;
- acompanhamento comercial por status: rascunho, enviada, aprovada e recusada;
- filtro do histórico por status (incluindo vencidas), busca por cliente/empresa/número e ordenação por data, valor ou vencimento;
- resumo comercial com total de propostas, enviadas e valor aprovado;
- histórico progressivo em blocos de 10 e exportação do histórico em CSV compatível com Excel;
- aviso visual para propostas vencidas ou próximas da validade;
- compartilhamento de resumo por WhatsApp e cópia rápida;
- envio do link seguro direto pelo WhatsApp em uma única ação para usuários conectados;
- link público seguro para o cliente abrir a proposta;
- aprovação ou recusa da proposta sem conta, protegida por token;
- atualização automática das respostas do cliente ao voltar para a aba, com data/hora da resposta;
- novos links públicos mantêm o token no fragmento da URL e usam noindex/no-referrer;
- impressão/salvamento em PDF A4 pelo navegador, inclusive na proposta compartilhada;
- modo local sem conta;
- Supabase Auth;
- sincronização das propostas em `docpronto_proposals`;
- importação de histórico local;
- cadastro reutilizável de clientes na nuvem, incluindo telefone, e-mail, documento e endereço;
- gerenciamento de clientes salvos pela conta, com ações de usar e excluir;
- identidade do negócio sincronizada na conta, com nome, telefone e cor da proposta;
- preenchimento automático de dados de clientes já usados;
- sugestões de serviços e materiais já utilizados, com reaproveitamento do último preço unitário;
- dados privados por RLS;
- GitHub Pages + CI;
- SEO básico.

## Idiomas

- **PT-BR** é o idioma principal, padrão e fallback.
- **English (EN)** está disponível pelo seletor no topo.
- A preferência fica salva no navegador.
- Fluxos principais, mensagens, estados dinâmicos, datas e valores acompanham o idioma ativo.
- Conteúdo cadastrado pelo usuário, como nomes de clientes, serviços e negócios, não é traduzido automaticamente.

## Backend

Tabelas:
- `docpronto_clients`
- `docpronto_documents`
- `docpronto_items`
- `docpronto_proposals`
- `product_subscriptions`

Veja `FULLSTACK.md` para arquitetura e próximos passos.


## QA no navegador

Além dos testes unitários/integração Node, o DocPronto agora usa **Playwright + Chromium** para cobrir:

- criação local completa de proposta;
- persistência de rascunho após recarregar;
- busca, edição, mudança de status e exportação CSV;
- página pública sanitizada;
- aprovação de proposta pelo cliente.

Execute com `npm install` e `npm run test:e2e`.


## Roadmap

O backlog priorizado de homologação e evolução fica em [MELHORIAS.md](./MELHORIAS.md).


## PWA / modo offline

O DocPronto pode ser instalado como aplicativo em navegadores compatíveis. Depois da primeira abertura, o shell principal fica em cache e o modo local continua disponível sem conexão. Recursos de nuvem, login e sincronização continuam exigindo internet.
