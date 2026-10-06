const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../proposal-core.js');

test('calcula subtotais e total em centavos sem erro de ponto flutuante', () => {
  const result = core.validateItems([
    { description: ' Instalação ', quantity: 2, unitPrice: 50.25 },
    { description: 'Material', quantity: 0.5, unitPrice: 19.99 }
  ], 10);
  assert.equal(result.ok, true);
  assert.deepEqual(result.items.map(item => item.description), ['Instalação', 'Material']);
  assert.equal(result.items[1].subtotal, 10);
  assert.equal(result.total, 110.5);
});

test('calcula desconto percentual e fixo em centavos', () => {
  const percent = core.calculateDiscount(250, 'percent', 10);
  assert.equal(percent.ok, true);
  assert.equal(percent.subtotal, 250);
  assert.equal(percent.discount, 25);
  assert.equal(percent.total, 225);

  const fixed = core.calculateDiscount(199.99, 'fixed', 19.99);
  assert.equal(fixed.ok, true);
  assert.equal(fixed.discount, 19.99);
  assert.equal(fixed.total, 180);
});

test('rejeita desconto negativo, acima de 100% ou maior que o subtotal', () => {
  assert.equal(core.calculateDiscount(100, 'percent', 101).ok, false);
  assert.equal(core.calculateDiscount(100, 'fixed', 100.01).ok, false);
  assert.equal(core.calculateDiscount(100, 'fixed', -1).ok, false);
});

test('rejeita descrição vazia, quantidade inválida e preço negativo', () => {
  assert.equal(core.validateItems([{ description: '', quantity: 1, unitPrice: 10 }], 10).ok, false);
  assert.equal(core.validateItems([{ description: 'Serviço', quantity: 0, unitPrice: 10 }], 10).ok, false);
  assert.equal(core.validateItems([{ description: 'Serviço', quantity: 1, unitPrice: -0.01 }], 10).ok, false);
});

test('limita a quantidade de itens e protege contra totais fora do limite', () => {
  const eleven = Array.from({ length: 11 }, (_, i) => ({
    description: 'Item ' + i, quantity: 1, unitPrice: 1
  }));
  assert.equal(core.validateItems(eleven, 10).ok, false);
  assert.equal(core.validateItems([{ description: 'Excesso', quantity: 1e20, unitPrice: 1e20 }], 10).ok, false);
});

test('marca a aplicação como acessível, sincronizável e com fallback local', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const config = fs.readFileSync(path.join(__dirname, '..', 'supabase-config.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'theme-v2.css'), 'utf8');
  assert.match(html, /name="viewport"/);
  assert.match(html, /id="account-dialog"/);
  assert.match(html, /id="local-import"/);
  assert.ok(html.indexOf('proposal-core.js') < html.indexOf('app.js'));
  assert.match(app, /signInWithPassword/);
  assert.match(app, /signUp\(/);
  assert.match(app, /\.upsert\(/);
  assert.match(app, /\.delete\(\)/);
  assert.match(app, /localStorage/);
  assert.match(app, /data-status-id/);
  assert.match(app, /share-whatsapp/);
  assert.match(config, /sb_publishable_/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /@media\(max-width:680px\)/);
});

test('layout principal evita painel de histórico esticado e mantém o card do hero legível', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'theme-v2.css'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  assert.match(css, /\.grid\{[^}]*align-items:start/);
  assert.match(css, /\.hero-card small\{display:block/);
  assert.match(css, /\.empty\{[^}]*text-align:center/);
  assert.match(app, /Sua primeira proposta começa aqui/);
});

test('design v3 mantém fluxo visual, histórico fixo no desktop e itens móveis legíveis', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'theme-v2.css'), 'utf8');
  assert.match(html, /panel-kicker">1 · CRIAR/);
  assert.match(html, /panel-kicker">2 · ACOMPANHAR/);
  assert.match(html, /Aprovação online/);
  assert.match(css, /\.history-panel\{position:sticky;top:18px/);
  assert.match(css, /\.line-item \.field:first-child\{grid-column:1\/-1/);
  assert.match(css, /\.hero-points/);
});

test('histórico permite buscar propostas sem consultar o banco a cada tecla', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  assert.match(html, /id="proposal-search"/);
  assert.match(app, /const proposalSearch/);
  assert.match(app, /proposalSearch\?\.addEventListener\('input', \(\) =>/);
  assert.match(app, /historyVisibleLimit = 10/);
  assert.match(app, /proposal\.client, proposal\.business, proposal\.number/);
});

test('histórico comercial mostra resumo, validade e carrega até 100 propostas', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'theme-v2.css'), 'utf8');
  assert.match(html, /id="history-summary"/);
  assert.match(app, /function renderHistorySummary/);
  assert.match(app, /function proposalValidityInfo/);
  assert.match(app, /Expira hoje/);
  assert.match(app, /\.limit\(100\)/);
  assert.match(app, /\.slice\(0, 100\)/);
  assert.match(app, /\.slice\(-100\)/);
  assert.match(css, /\.history-summary/);
  assert.match(css, /\.validity-expired/);
});

test('excluir uma proposta aberta também fecha a prévia', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  assert.ok((app.match(/if \(openedProposalId === id\)/g) || []).length >= 2);
  assert.match(app, /result\.classList\.remove\('show'\)/);
});

test('resumo comercial atua como filtro ativo e limpa a busca', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'theme-v2.css'), 'utf8');
  assert.match(app, /aria-pressed/);
  assert.match(app, /proposalSearch\.value = ''/);
  assert.match(css, /\.summary-card\.is-active/);
});

test('proposta compartilhada e impressão usam layout de documento A4', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'theme-v2.css'), 'utf8');
  assert.match(app, /proposal-document-brand/);
  assert.match(app, /id="public-print"/);
  assert.match(app, /Proposta ' \+ proposal\.number \+ ' - ' \+ proposal\.client/);
  assert.match(css, /@page\{size:A4;margin:14mm\}/);
  assert.match(css, /\.proposal-document-head/);
  assert.match(css, /\.public-document-actions/);
});

test('novas propostas reaproveitam dados do negócio sem criar outra tabela', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  assert.match(app, /function prefillBusinessFields/);
  assert.match(app, /prefillBusinessFields\(cloudProposals\)/);
  assert.match(app, /prefillBusinessFields\(readProposals\(\)\)/);
  assert.match(app, /document\.title = 'Proposta ' \+ proposal\.number \+ ' · ' \+ proposal\.business/);
});

test('formulário salva e recupera rascunho local automaticamente', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  assert.match(html, /autosave-note/);
  assert.match(app, /composerDraftKey/);
  assert.match(app, /function saveComposerDraft/);
  assert.match(app, /function restoreComposerDraft/);
  assert.match(app, /Rascunho recuperado/);
  assert.match(app, /form\.addEventListener\('input', scheduleComposerDraftSave\)/);
  assert.match(app, /clearComposerDraft\(\)/);
});

test('propostas encerradas não podem ser reabertas silenciosamente por novo link', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'theme-v2.css'), 'utf8');
  assert.match(app, /status === 'draft' \|\| status === 'sent'/);
  assert.match(app, /Gerar um novo link invalida o link anterior/);
  assert.match(app, /proposal-closed-note/);
  assert.match(css, /\.proposal-closed-note/);
});

test('proposta pública usa expiração do servidor e respostas sem cache', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const publicFn = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'functions', 'proposal-public', 'index.ts'), 'utf8');
  const responseFn = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'functions', 'proposal-response', 'index.ts'), 'utf8');
  assert.match(publicFn, /Cache-Control": "no-store, max-age=0/);
  assert.match(responseFn, /Cache-Control": "no-store, max-age=0/);
  assert.match(publicFn, /timeZone: "America\/Sao_Paulo"/);
  assert.match(responseFn, /timeZone: "America\/Sao_Paulo"/);
  assert.match(publicFn, /expired: Boolean/);
  assert.match(app, /typeof proposal\.expired === 'boolean'/);
});

test('campos de proposta têm limites para proteger layout e PDF', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'theme-v2.css'), 'utf8');
  assert.match(html, /name="business"[^>]*maxlength="80"/);
  assert.match(html, /name="client"[^>]*maxlength="100"/);
  assert.match(html, /name="deadline"[^>]*maxlength="120"/);
  assert.match(html, /name="terms"[^>]*maxlength="200"/);
  assert.match(app, /data-description[^>]*maxlength="160"/);
  assert.match(app, /name="businessPhone"[^>]*maxlength="30"/);
  assert.match(css, /overflow-wrap:anywhere/);
});

test('identidade do negócio sincroniza por user_metadata e acompanha a proposta pública', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'theme-v2.css'), 'utf8');
  const publicFn = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'functions', 'proposal-public', 'index.ts'), 'utf8');
  assert.match(html, /id="business-profile-form"/);
  assert.match(html, /name="brandColor" type="color"/);
  assert.match(app, /docpronto_business_name/);
  assert.match(app, /docpronto_business_phone/);
  assert.match(app, /docpronto_brand_color/);
  assert.match(app, /function normalizeBrandColor/);
  assert.match(app, /brandColor: existing\?\.brandColor \|\| accountBusinessProfile\(\)\.brandColor/);
  assert.match(css, /--proposal-accent/);
  assert.match(publicFn, /const brandColor/);
  assert.match(publicFn, /brandColor,/);
});

test('desconto aparece no formulário, documento e proposta pública', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'theme-v2.css'), 'utf8');
  const publicFn = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'functions', 'proposal-public', 'index.ts'), 'utf8');
  assert.match(html, /id="discount-type"/);
  assert.match(html, /id="discount-value"/);
  assert.match(html, /id="form-subtotal"/);
  assert.match(app, /function currentPricing/);
  assert.match(app, /DocProntoCore\.calculateDiscount/);
  assert.match(app, /discountAmount/);
  assert.match(app, /document-totals/);
  assert.match(css, /\.discount-controls/);
  assert.match(css, /\.document-totals/);
  assert.match(publicFn, /discountAmount/);
  assert.match(publicFn, /discountType/);
});

test('observações opcionais acompanham rascunho, PDF e proposta pública', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'theme-v2.css'), 'utf8');
  const publicFn = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'functions', 'proposal-public', 'index.ts'), 'utf8');
  assert.match(html, /name="notes"[^>]*maxlength="600"/);
  assert.match(app, /draft\.notes/);
  assert.match(app, /proposal\.notes/);
  assert.match(app, /proposal-notes/);
  assert.match(css, /\.proposal-notes/);
  assert.match(publicFn, /notes: typeof p\.notes === "string"/);
  assert.match(publicFn, /slice\(0, 600\)/);
});

test('dados opcionais do cliente são reutilizados e aparecem na proposta', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'theme-v2.css'), 'utf8');
  const publicFn = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'functions', 'proposal-public', 'index.ts'), 'utf8');
  assert.match(html, /name="clientEmail"/);
  assert.match(html, /name="clientDocument"/);
  assert.match(html, /name="clientAddress"/);
  assert.match(app, /client\.document/);
  assert.match(app, /client\.address/);
  assert.match(app, /proposal-client-details/);
  assert.match(css, /\.client-extra/);
  assert.match(css, /\.proposal-client-details/);
  assert.match(publicFn, /clientEmail:/);
  assert.match(publicFn, /clientDocument:/);
  assert.match(publicFn, /clientAddress:/);
});

test('novos links públicos escondem o token no fragmento e bloqueiam indexação', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  assert.match(html, /meta name="robots" content="index,follow"/);
  assert.match(html, /meta name="referrer" content="strict-origin-when-cross-origin"/);
  assert.match(app, /new URLSearchParams\(location\.hash\.replace/);
  assert.match(app, /hashParams\.get\('token'\)/);
  assert.match(app, /url\.hash = shareParams\.toString\(\)/);
  assert.match(app, /noindex,nofollow,noarchive/);
  assert.match(app, /no-referrer/);
});

test('respostas do cliente atualizam ao voltar para a aba e guardam data da resposta', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'theme-v2.css'), 'utf8');
  assert.match(app, /respondedAt: row\.responded_at/);
  assert.match(app, /window\.addEventListener\('focus', refreshCloudIfStale\)/);
  assert.match(app, /document\.visibilityState === 'visible'/);
  assert.match(app, /Respondida em/);
  assert.match(css, /\.response-time/);
});

test('reabrir proposta encerrada invalida o link público anterior', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'theme-v2.css'), 'utf8');
  assert.match(app, /data-reopen/);
  assert.match(app, /share_token_hash: null/);
  assert.match(app, /O link público anterior será invalidado/);
  assert.match(app, /proposal-status-select[^\n]+disabled/);
  assert.match(css, /\[data-reopen\]/);
});

test('histórico permite revelar propostas antigas em blocos de 10', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'theme-v2.css'), 'utf8');
  assert.match(html, /id="history-more"/);
  assert.match(app, /let historyVisibleLimit = 10/);
  assert.match(app, /filteredProposals\.slice\(0, historyVisibleLimit\)/);
  assert.match(app, /historyVisibleLimit \+= 10/);
  assert.match(app, /Mostrar mais \('/);
  assert.match(css, /\.history-more/);
});

test('usuário pode limpar o rascunho sem deslocar campos dinâmicos', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'theme-v2.css'), 'utf8');
  assert.match(html, /id="clear-composer"/);
  assert.match(html, /class="composer-actions"/);
  assert.match(app, /composerActions\.before\(validityField\)/);
  assert.match(app, /composerActions\.before\(cancelEditButton\)/);
  assert.match(app, /apagar o rascunho salvo neste dispositivo/);
  assert.match(css, /\.composer-actions/);
});

test('histórico exporta CSV compatível com Excel e mantém todos os registros carregados', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'theme-v2.css'), 'utf8');
  assert.match(html, /id="export-csv"/);
  assert.match(app, /function exportProposalsCsv/);
  assert.match(app, /\\uFEFF/);
  assert.match(app, /join\(';\'\)/);
  assert.match(app, /new Blob\(\[csv\]/);
  assert.match(app, /docpronto-propostas-/);
  assert.match(app, /exportCsvButton\?\.addEventListener\('click', exportProposalsCsv\)/);
  assert.match(css, /\.history-export/);
});

test('usuário autenticado pode gerar e enviar o link seguro direto no WhatsApp', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'theme-v2.css'), 'utf8');
  assert.match(app, /function buildClientShareUrl/);
  assert.match(app, /async function publishClientProposal/);
  assert.match(app, /id="send-client-link-whatsapp"/);
  assert.match(app, /Abra a proposta para ver os detalhes e responder:/);
  assert.match(app, /window\.open\('about:blank', '_blank'\)/);
  assert.match(app, /publishClientProposal\(proposal\)/);
  assert.match(css, /#send-client-link-whatsapp/);
});

test('conta permite usar e excluir clientes salvos sem alterar propostas existentes', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'theme-v2.css'), 'utf8');
  assert.match(html, /id="saved-clients-list"/);
  assert.match(html, /id="saved-clients-count"/);
  assert.match(app, /function renderSavedClients/);
  assert.match(app, /function fillClientFromRecord/);
  assert.match(app, /data-client-use/);
  assert.match(app, /data-client-delete/);
  assert.match(app, /savedClientsList\?\.addEventListener\('click'/);
  assert.match(app, /\.from\('docpronto_clients'\)[\s\S]*\.delete\(\)/);
  assert.match(app, /As propostas existentes não serão alteradas/);
  assert.match(css, /\.saved-clients/);
});

test('a tabela concede apenas as operações necessárias ao usuário autenticado', () => {
  const grantsPath = path.join(__dirname, '..', 'supabase', 'migrations', '20261006024300_docpronto_minimal_grants.sql');
  const sql = fs.readFileSync(grantsPath, 'utf8');
  assert.match(sql, /revoke all privileges on table public\.docpronto_proposals from public, anon, authenticated/i);
  assert.match(sql, /grant select, insert, update, delete on table public\.docpronto_proposals to authenticated/i);
  assert.doesNotMatch(sql, /grant[^;]*\btruncate\b/i);
});

test('a migração restringe os dados a usuários autenticados e ao proprietário', () => {
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20261006021632_docpronto_proposals.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /revoke all on table public\.docpronto_proposals from anon/i);
  assert.match(sql, /to authenticated/i);
  assert.match(sql, /auth\.uid\(\).*owner_id/s);
  assert.equal((sql.match(/create policy/gi) || []).length, 4);
});


test('status comercial é persistido com valores restritos no banco', () => {
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20261006052000_proposal_status.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  assert.match(sql, /add column if not exists status text not null default 'draft'/i);
  assert.match(sql, /status in \('draft', 'sent', 'approved', 'rejected'\)/i);
  assert.match(sql, /docpronto_proposals_owner_status_updated_idx/i);
});


test('aceite público usa token hash e Edge Functions sem expor a tabela diretamente', () => {
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20261006054500_public_proposal_response.sql');
  const migration = fs.readFileSync(migrationPath, 'utf8');
  const publicFn = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'functions', 'proposal-public', 'index.ts'), 'utf8');
  const responseFn = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'functions', 'proposal-response', 'index.ts'), 'utf8');
  assert.match(migration, /share_token_hash text/i);
  assert.match(migration, /responded_at timestamptz/i);
  assert.match(publicFn, /share_token_hash/);
  assert.doesNotMatch(publicFn, /clientPhone/);
  assert.match(responseFn, /status: decision/);
  assert.match(responseFn, /\.eq\("status", "sent"\)/);
});


test('clientes reutilizáveis têm grant mínimo, chave normalizada e UI de sugestão', () => {
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20261006063000_reusable_clients.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  assert.match(sql, /generated always as \(lower\(trim\(name\)\)\) stored/i);
  assert.match(sql, /revoke all privileges on table public\.docpronto_clients from public, anon, authenticated/i);
  assert.match(sql, /grant select, insert, update, delete on table public\.docpronto_clients to authenticated/i);
  assert.match(html, /client-suggestions/);
  assert.match(app, /syncClientRecord/);
  assert.match(app, /loadCloudClients/);
});
