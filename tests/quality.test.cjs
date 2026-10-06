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
  assert.match(app, /proposalSearch\?\.addEventListener\('input', renderHistory\)/);
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
