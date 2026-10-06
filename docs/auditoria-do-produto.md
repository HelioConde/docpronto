# Auditoria do produto — DocPronto

Revisão de código e da captura enviada em 6 de outubro de 2026. Os pontos abaixo distinguem o que foi implementado do que ainda depende de validação no navegador e no painel Supabase.

## UX/UI

**Avaliação: boa base de MVP, com uma dependência de configuração para sincronização.**

- O gerador abre direto, sem forçar cadastro; isso preserva o fluxo rápido para quem só quer montar um orçamento.
- O formulário aceita itens, calcula totais, gera prévia e imprime/salva PDF.
- Histórico, edição e uso como modelo cobrem os casos mais repetidos.
- Desconto percentual/fixo, observações, identidade do negócio e dados reutilizáveis de clientes aproximam o produto de uso comercial real.
- As respostas do cliente são atualizadas ao voltar para a aba e propostas encerradas só podem ser reabertas com invalidação explícita do link anterior.
- A conta é opcional. A sincronização separa propostas por usuário no banco.
- A imagem anexada mostrava a página sem CSS. Foi criado um caminho de stylesheet novo para contornar o cache do Pages.
- O histórico carrega até 100 propostas, exibe 10 inicialmente e permite revelar as demais em blocos de 10. Possui busca por cliente/empresa/número, filtros de status, resumo comercial e exportação CSV.
- A sincronização exige redirect URL e entrega de e-mail válidos no Supabase; a interface informa erros de configuração.

## QA e segurança

**Avaliação: validações automatizadas iniciais adicionadas; falta o teste E2E autenticado.**

Implementado:

- Testes Node para quantidades, limites, campos inválidos, arredondamento monetário e valores fora do limite.
- Verificação de sintaxe JS.
- Workflow GitHub Actions para executar as verificações em push e pull request.
- Nova tabela `docpronto_proposals`, separada das tabelas da pizzaria e do AgendaLeve.
- RLS habilitado; usuários só acessam linhas com `owner_id = auth.uid()`. `anon` e `PUBLIC` não têm acesso à tabela, e `authenticated` recebeu apenas SELECT, INSERT, UPDATE e DELETE — sem TRUNCATE.
- A chave do frontend é publishable; nenhuma chave privilegiada é necessária ou incluída.

Pendente para homologação:

- Criar uma conta de teste, confirmar o e-mail, entrar, importar propostas, editar, excluir e repetir em outra conta.
- Testar falha de rede, sessão expirada e redirecionamento de redefinição de senha.
- Rever visualmente desktop e mobile após a publicação do novo fluxo.
- Confirmar a lista de Redirect URLs e o provedor de e-mail do projeto compartilhado.

A auditoria automática do Supabase também reportou alertas em objetos preexistentes do pizzaria-db ligados ao AgendaLeve e às rotinas da pizzaria. Eles não foram alterados nesta entrega, pois estão fora das tabelas do DocPronto.

## Negócio / visão de CEO

**Avaliação: proposta clara; monetização ainda não validada.**

- Público inicial: prestadores autônomos que precisam apresentar orçamento sem montar documento manualmente.
- Valor principal: transformar descrição, itens e preço em uma proposta imprimível com pouca fricção.
- Manter uso local sem conta reduz barreira; sincronizar passa a ser um benefício para quem retorna.
- Os preços ilustrativos foram removidos porque não havia checkout ou cobrança. Isso evita prometer uma oferta que ainda não existe.
- Próxima validação: observar criação da primeira proposta, exportação em PDF e retorno semanal com um grupo pequeno de prestadores.
- Só depois de validar recorrência faz sentido testar recursos pagos, como identidade visual própria, modelos reutilizáveis e maior histórico. Pagamentos continuam fora do escopo.

## Design

**Avaliação: linguagem visual consistente e adequada ao público.**

- A paleta foi migrada para azul-petróleo com neutros frios e cobre como detalhe, reforçando confiança e hierarquia sem competir com o documento.
- A hierarquia coloca formulário, total e prévia na frente.
- O diálogo de conta e a faixa de importação usam os mesmos tokens visuais; foco de teclado e movimento reduzido foram considerados.
- Próxima checagem visual: larguras de 360 px, 768 px e 1440 px, incluindo formulário de itens, diálogo e tabela de impressão.

## SEO e descoberta

- Título, descrição, canonical e Open Graph foram definidos para o endereço do GitHub Pages.
- Para crescer organicamente, criar páginas úteis (ex.: como montar orçamento de elétrica, pintura ou manutenção), com exemplos reais e links para o gerador.
- Ainda faltam Search Console, sitemap e uma revisão de indexação após estabilizar o domínio. Não há dados para afirmar tráfego ou conversão.

## Próximas prioridades

1. Adicionar a URL do GitHub Pages aos Redirect URLs do Supabase e configurar e-mail transacional, sem substituir configurações dos outros apps.
2. Executar o fluxo autenticado em duas contas para confirmar isolamento e sincronização.
3. Rodar a revisão visual em mobile e desktop com a versão publicada.
4. Validar uso recorrente antes de criar preços, checkout ou limites comerciais.
