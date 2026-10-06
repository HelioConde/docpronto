const { test, expect } = require('@playwright/test');

async function localMode(page) {
  await page.route('https://cdn.jsdelivr.net/**', route => route.abort());
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Orçamento profissional/i })).toBeVisible();
  await expect(page.locator('#sync-status')).toContainText(/Modo local|Salvo neste dispositivo/);
}

async function fillBaseProposal(page, suffix = '') {
  await page.locator('[name="business"]').fill('Conde Elétrica');
  await page.locator('[name="client"]').fill('Cliente E2E' + suffix);
  const row = page.locator('.line-item').first();
  await row.locator('[data-description]').fill('Instalação elétrica');
  await row.locator('[data-quantity]').fill('2');
  await row.locator('[data-unit-price]').fill('150');
  await page.locator('[name="deadline"]').fill('2 dias úteis');
  await page.locator('[name="terms"]').fill('50% no início e 50% na entrega');
}

test('modo local cria, busca, edita, muda status e exporta proposta', async ({ page }) => {
  await localMode(page);
  await fillBaseProposal(page);

  await expect(page.locator('#form-total')).toContainText('300');
  await page.getByRole('button', { name: 'Gerar proposta' }).click();

  await expect(page.locator('#result')).toContainText('Cliente E2E');
  await expect(page.locator('#result')).toContainText('Instalação elétrica');
  await expect(page.locator('#list')).toContainText('Cliente E2E');

  await page.locator('#proposal-search').fill('Cliente E2E');
  await expect(page.locator('#list .item')).toHaveCount(1);

  await page.locator('#list .item').getByRole('button', { name: 'Editar' }).click();
  await expect(page.getByRole('button', { name: 'Salvar alterações' })).toBeVisible();
  await page.locator('[name="client"]').fill('Cliente E2E Atualizado');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();

  await page.locator('#proposal-search').fill('Atualizado');
  const item = page.locator('#list .item').first();
  await expect(item).toContainText('Cliente E2E Atualizado');

  await item.locator('[data-status-id]').selectOption('approved');
  await expect(item).toContainText('Aprovada');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^docpronto-propostas-.*\.csv$/);
});

test('rascunho do formulário sobrevive a recarregamento', async ({ page }) => {
  await localMode(page);
  await page.locator('[name="business"]').fill('Negócio Persistente');
  await page.locator('[name="client"]').fill('Cliente Rascunho');
  await page.locator('.line-item').first().locator('[data-description]').fill('Pintura');
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.locator('[name="business"]')).toHaveValue('Negócio Persistente');
  await expect(page.locator('[name="client"]')).toHaveValue('Cliente Rascunho');
  await expect(page.locator('.line-item').first().locator('[data-description]')).toHaveValue('Pintura');
});

test('página pública mostra proposta sanitizada e aceita aprovação', async ({ page }) => {
  const proposal = {
    id: '11111111-1111-4111-8111-111111111111',
    number: 'DP-2026-000001',
    business: 'Conde Elétrica',
    client: 'Cliente Público',
    total: 480,
    subtotal: 500,
    discountAmount: 20,
    status: 'sent',
    items: [{ description: 'Instalação de luminárias', quantity: 2, unitPrice: 250, subtotal: 500 }],
    deadline: '3 dias úteis',
    terms: 'À vista',
    notes: 'Garantia de 90 dias',
    validUntil: '2099-12-31',
    businessPhone: '(11) 99999-0000',
    brandColor: '#245d6c'
  };

  await page.addInitScript(value => {
    window.__DOC_E2E_PROPOSAL__ = value;
  }, proposal);

  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: `
      window.supabase = {
        createClient: () => ({
          auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } })
          },
          functions: {
            invoke: async (name, options = {}) => {
              if (name === 'proposal-public') {
                return { data: window.__DOC_E2E_PROPOSAL__, error: null };
              }
              if (name === 'proposal-response') {
                window.__DOC_E2E_PROPOSAL__.status = options.body.decision;
                return { data: { status: options.body.decision }, error: null };
              }
              return { data: null, error: null };
            }
          }
        })
      };
    `
  }));

  await page.goto('/#proposta=11111111-1111-4111-8111-111111111111&token=abcdefghijklmnopqrstuvwxyzABCDEF');
  await expect(page.getByRole('heading', { name: 'Conde Elétrica' })).toBeVisible();
  await expect(page.locator('#public-proposal-content')).toContainText('Cliente Público');
  await expect(page.locator('#public-proposal-content')).toContainText('Instalação de luminárias');
  await expect(page.getByRole('button', { name: 'Aprovar proposta' })).toBeVisible();

  await page.getByRole('button', { name: 'Aprovar proposta' }).click();
  await expect(page.locator('#public-proposal-content')).toContainText('Você aprovou esta proposta.');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow,noarchive');
  await expect(page.locator('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer');
});
