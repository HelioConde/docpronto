<div align="center">
  <h1>📑 DocPronto</h1>
  <p><strong>Orçamentos e propostas profissionais, da elaboração ao acompanhamento do cliente.</strong></p>
  <p><img alt="Beta controlado" src="https://img.shields.io/badge/status-beta%20controlado-64748b"> <img alt="Exportação PDF" src="https://img.shields.io/badge/exporta%C3%A7%C3%A3o-PDF-2563eb"></p>
  <p><a href="RELEASE_V1.md"><strong>Relatório 1.0</strong></a> · <a href="FULLSTACK.md"><strong>Arquitetura</strong></a> · <a href="#executar-localmente"><strong>Executar</strong></a></p>
</div>

---

## Transforme um orçamento em uma proposta acompanhável

O **DocPronto** é uma ferramenta web para autônomos e prestadores de serviços que precisam **montar propostas, revisar valores, exportar documentos e acompanhar respostas**.

```text
Cliente e itens → Cálculo do orçamento → PDF / compartilhamento
                                          ↓
                              Enviada → Aprovada / Recusada
                                          ↓
                                Histórico e follow-up
```

O desenvolvimento principal da versão **1.0 está concluído para beta controlado**. A plataforma ainda exige validação humana e revisão das integrações antes de uma operação comercial ampla.

## Funcionalidades

| Área | O que já foi desenvolvido |
| --- | --- |
| **Propostas** | Até dez itens, descontos percentuais/fixos, observações e prazo de validade |
| **Identidade** | Ajustes de apresentação e branding |
| **Documentos** | Exportação em PDF e compartilhamento por WhatsApp |
| **Gestão** | Rascunho, enviada, aprovada e recusada; busca e ordenação |
| **Histórico** | Linha do tempo de status, CSV e avisos de vencimento |
| **Follow-up** | Fila de propostas enviadas sem resposta |
| **Cliente** | Link de proposta e resposta protegidos por token, quando o backend está configurado |
| **Dados** | Uso local e sincronização opcional via Supabase |

A visualização ou aprovação por um link público **precisa ser protegida no servidor**. O conteúdo exportado deve ser conferido pelo usuário antes de envio; o sistema não substitui assessoria fiscal ou jurídica.

## Executar localmente

O frontend é estático e pode ser visualizado sem um processo de build:

```bash
git clone https://github.com/HelioConde/docpronto.git
cd docpronto
python -m http.server 8000
```

Abra `http://localhost:8000`. Para os testes declarados no projeto:

```bash
npm install
npm test
npx playwright install
npm run test:e2e
```

O script `npm run screenshots` gera capturas quando o ambiente está preparado. **Esta revisão não executou nem aprovou os testes.**

## Arquitetura, persistência e segurança

A aplicação utiliza **HTML, CSS e JavaScript** no frontend, com fluxos locais e integrações Supabase para autenticação, compartilhamento, persistência e operações protegidas.

Antes de disponibilizar propostas reais:

- Reforce RLS e regras de autorização nas tabelas e Edge Functions.
- Não inclua `service_role`, segredos ou tokens privados no frontend.
- Valide o acesso aos links públicos e a expiração/revogação de permissões.
- Preserve privacidade dos dados de clientes e permita exclusão de informações quando aplicável.
- Não confunda a exportação de PDF com validade jurídica automática do documento.

## Estado do lançamento

**v1.0 — MVP tecnicamente concluído, aguardando homologação humana e configuração final de serviços externos.**

O repositório inclui documentação do QA histórico e das decisões de segurança. Consulte evidências e testes atuais antes de concluir que uma implantação está pronta.

[Relatório técnico](RELEASE_V1.md) · [Arquitetura](FULLSTACK.md) · [Pendências do beta](https://github.com/HelioConde/docpronto/issues/1) · [Histórico completo anterior](docs/README_HISTORY_2026-10-27.md)

---

<div align="center"><strong>Desenvolvido por <a href="https://github.com/HelioConde">Hélio Conde</a></strong></div>
