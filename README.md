# DocPronto

Gerador de propostas e orçamentos profissionais para prestadores de serviço.

## Estado atual

- composição de orçamento com até 10 itens;
- desconto percentual ou fixo com subtotal e total final;
- observações opcionais para garantia, exclusões e condições especiais;
- cálculo de total e validade;
- edição, duplicação como modelo e exclusão;
- acompanhamento comercial por status: rascunho, enviada, aprovada e recusada;
- timeline de mudanças de status com data/hora e origem da alteração;
- filtro do histórico por status (incluindo vencidas), busca por cliente/empresa/número e ordenação por data, valor ou vencimento;
- resumo comercial com total de propostas, enviadas e valor aprovado;
- fila de follow-up para propostas enviadas há 3 dias ou mais sem resposta, com filtro e ação rápida de retorno;
- histórico progressivo em blocos de 10 e exportação do histórico em CSV compatível com Excel;
- aviso visual para propostas vencidas ou próximas da validade;
- compartilhamento de resumo por WhatsApp e cópia rápida;
- envio do link seguro direto pelo WhatsApp em uma única ação para usuários conectados;
- link público seguro para o cliente abrir a proposta;
- aprovação ou recusa da proposta sem conta, protegida por token;
- aceite textual opcional com nome do cliente registrado junto da aprovação;
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


## Monetização por anúncios

O DocPronto está preparado para permanecer gratuito e monetizar com anúncios responsivos em áreas não críticas. A integração fica desligada até existirem Publisher ID e slots reais. Consulte [ADS_SETUP.md](./ADS_SETUP.md).


## Feedback beta

O produto inclui feedback interno com nota de 1–5, categoria e comentário. O frontend não envia nome, telefone, e-mail, cliente nem conteúdo de proposta. Quando o backend estiver indisponível, os envios ficam em uma fila local de até 20 itens e são reenviados automaticamente quando o endpoint estiver disponível.

A migration e a Edge Function `beta-feedback` já estão versionadas; a publicação no Supabase real depende da restauração do acesso administrativo.


## Calendário

Propostas enviadas podem gerar um arquivo `.ics` de follow-up para três dias após o envio. O arquivo funciona com calendários compatíveis sem exigir integração externa.


## Backup local

Quem usa o DocPronto sem conta pode exportar e restaurar um backup JSON das propostas do navegador. A restauração valida o formato, limita a 100 propostas e 10 itens por proposta e substitui apenas os dados locais após confirmação. O arquivo de backup pode conter dados de clientes presentes nas propostas e deve ser armazenado com cuidado.
