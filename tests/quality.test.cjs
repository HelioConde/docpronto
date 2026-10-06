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
