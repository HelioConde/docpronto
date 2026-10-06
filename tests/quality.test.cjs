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
  assert.match(config, /sb_publishable_/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /@media\(max-width:680px\)/);
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
