# Publicidade — DocPronto

O DocPronto está preparado para ser gratuito e monetizado por anúncios responsivos.

## Posições

- `app-footer`: final da experiência principal, abaixo dos benefícios.
- `public-footer`: final da proposta pública, depois do documento e das ações do cliente.

Não colocar anúncios:

- dentro do formulário;
- entre itens e total;
- dentro do documento/PDF;
- ao lado de Aprovar/Recusar;
- simulando botões ou avisos do produto.

## Ativação

A integração fica desativada por padrão em `ads-config.js`.

Quando houver aprovação da rede de anúncios:

1. informe o `publisherId` real (`ca-pub-...`);
2. crie unidades responsivas;
3. informe `appFooter` e `publicFooter`;
4. altere `enabled` para `true`;
5. publique o `ads.txt` correspondente na raiz do site.

Enquanto `enabled: false`, nenhum script do Google Ads é carregado e os slots permanecem ocultos.

## Privacidade

Antes de ativar anúncios personalizados, revisar consentimento/cookies e a política de privacidade aplicável. O carregamento está isolado em `ads.js` para permitir colocar uma camada de consentimento antes da inicialização.
