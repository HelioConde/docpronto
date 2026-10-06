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


test('mantém PT-BR como padrão e permite alternar para inglês com persistência', async ({ page }) => {
  await localMode(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');

  await page.locator('[data-language="en"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: /Professional quote/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Generate proposal' })).toBeVisible();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: /Professional quote/i })).toBeVisible();

  await page.locator('[data-language="pt-BR"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.getByRole('heading', { name: /Orçamento profissional/i })).toBeVisible();
});

test('fila de follow-up mostra somente propostas enviadas sem resposta', async ({ page }) => {
  await localMode(page);
  await page.evaluate(() => {
    const now = Date.now();
    localStorage.setItem('docpronto-proposals', JSON.stringify([
      {
        id: 'followup-due',
        number: 'DP-2026-100001',
        business: 'Conde Elétrica',
        client: 'Cliente Follow-up',
        clientPhone: '(11) 99999-8888',
        total: 500,
        amount: 500,
        status: 'sent',
        createdAt: now - 7 * 86400000,
        updatedAt: now - 4 * 86400000
      },
      {
        id: 'followup-fresh',
        number: 'DP-2026-100002',
        business: 'Conde Elétrica',
        client: 'Cliente Recente',
        clientPhone: '(11) 98888-7777',
        total: 250,
        amount: 250,
        status: 'sent',
        createdAt: now - 2 * 86400000,
        updatedAt: now - 1 * 86400000
      }
    ]));
  });
  await page.reload();

  await expect(page.locator('.summary-followup')).toContainText('1');
  await page.locator('.summary-followup').click();
  await expect(page.locator('#proposal-status-filter')).toHaveValue('followup');
  await expect(page.locator('#list .item')).toHaveCount(1);
  await expect(page.locator('#list')).toContainText('Cliente Follow-up');
  await expect(page.locator('#list')).toContainText(/Sem resposta há 4 dias/);
  await expect(page.getByRole('link', { name: 'Cobrar retorno' })).toHaveAttribute('href', /wa\.me\/5511999998888/);
});

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


for (const width of [360, 768, 1440]) {
  test(`layout principal não estoura horizontalmente em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await localMode(page);
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 2);
    await expect(page.locator('#form')).toBeVisible();
    await expect(page.locator('#list')).toBeVisible();
  });
}


test('proposta longa gera PDF A4 sem estourar o documento', async ({ page }) => {
  await localMode(page);
  await page.setViewportSize({ width: 794, height: 1123 });

  await page.locator('[name="business"]').fill('Conde Manutenção e Instalações');
  const form = page.locator('#form');
  await form.locator('[name="businessPhone"]').fill('(11) 99999-0000');
  await form.locator('[name="client"]').fill('Empresa Cliente de Homologação');
  await form.locator('[name="clientPhone"]').fill('(11) 98888-0000');
  await page.locator('details.client-extra').evaluate(el => { el.open = true; });
  await form.locator('[name="clientEmail"]').fill('cliente@example.com');
  await form.locator('[name="clientDocument"]').fill('12.345.678/0001-90');
  await form.locator('[name="clientAddress"]').fill('Rua de Homologação, 123 - Centro - São Paulo/SP');

  const descriptions = [
    'Visita técnica e diagnóstico completo',
    'Instalação de quadro elétrico',
    'Passagem e organização de cabeamento',
    'Instalação de tomadas e interruptores',
    'Troca de luminárias e suportes',
    'Teste de carga e segurança',
    'Material elétrico complementar',
    'Acabamento e identificação dos circuitos',
    'Limpeza técnica após execução',
    'Relatório final do serviço'
  ];

  for (let i = 0; i < descriptions.length; i += 1) {
    if (i > 0) await page.getByRole('button', { name: /Adicionar serviço ou material/i }).click();
    const row = page.locator('.line-item').nth(i);
    await row.locator('[data-description]').fill(descriptions[i]);
    await row.locator('[data-quantity]').fill(i % 3 === 0 ? '2' : '1');
    await row.locator('[data-unit-price]').fill(String(85 + i * 37));
  }

  await page.locator('#discount-type').selectOption('percent');
  await page.locator('#discount-value').fill('7.5');
  await form.locator('[name="deadline"]').fill('Execução em até 7 dias úteis após aprovação e liberação do local');
  await form.locator('[name="terms"]').fill('40% na aprovação, 30% no início e 30% após a conclusão');
  await form.locator('[name="notes"]').fill(
    'Proposta de homologação com conteúdo longo. Inclui garantia de 90 dias sobre a instalação. ' +
    'Não inclui reparos civis, pintura, adequações estruturais ou serviços não descritos nos itens. ' +
    'Alterações solicitadas após aprovação poderão gerar revisão de prazo e valor. '.repeat(3)
  );

  await page.getByRole('button', { name: 'Gerar proposta' }).click();
  await expect(page.locator('#proposal')).toBeVisible();
  await expect(page.locator('#proposal .proposal-table tbody tr')).toHaveCount(10);

  await page.emulateMedia({ media: 'print' });
  const layout = await page.locator('#proposal').evaluate(el => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    tableScrollWidth: el.querySelector('.proposal-table-wrap')?.scrollWidth || 0,
    tableClientWidth: el.querySelector('.proposal-table-wrap')?.clientWidth || 0
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 2);
  expect(layout.tableScrollWidth).toBeLessThanOrEqual(layout.tableClientWidth + 2);

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '14mm', right: '14mm', bottom: '14mm', left: '14mm' }
  });
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdf.length).toBeGreaterThan(15000);
});


test('modo local continua utilizável offline após primeira abertura', async ({ page, context }) => {
  await localMode(page);
  await page.waitForFunction(() => navigator.serviceWorker?.controller || navigator.serviceWorker?.ready);
  await page.reload();
  await expect(page.getByRole('heading', { name: /Orçamento profissional/i })).toBeVisible();

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Orçamento profissional/i })).toBeVisible();
  await expect(page.locator('#form')).toBeVisible();

  await fillBaseProposal(page, ' Offline');
  await page.getByRole('button', { name: /Gerar proposta|Generate proposal/i }).click();
  await expect(page.locator('#result')).toContainText('Cliente E2E Offline');

  await context.setOffline(false);
});


test('dashboard calcula conversão comercial sem contar rascunhos', async ({ page }) => {
  await page.addInitScript(() => {
    const now = Date.now();
    const base = {
      business: 'Negócio QA',
      client: 'Cliente',
      total: 100,
      amount: 100,
      createdAt: now,
      items: [{ description: 'Serviço', quantity: 1, unitPrice: 100, subtotal: 100 }],
      deadline: '1 dia',
      terms: 'À vista'
    };
    localStorage.setItem('docpronto-proposals', JSON.stringify([
      { ...base, id: '00000000-0000-4000-8000-000000000001', number: 'DP-1', status: 'draft' },
      { ...base, id: '00000000-0000-4000-8000-000000000002', number: 'DP-2', status: 'sent' },
      { ...base, id: '00000000-0000-4000-8000-000000000003', number: 'DP-3', status: 'approved' },
      { ...base, id: '00000000-0000-4000-8000-000000000004', number: 'DP-4', status: 'approved' },
      { ...base, id: '00000000-0000-4000-8000-000000000005', number: 'DP-5', status: 'rejected' }
    ]));
  });

  await localMode(page);
  const card = page.locator('.summary-conversion');
  await expect(card).toContainText('Conversão');
  await expect(card).toContainText('50%');
  await expect(card).toContainText('2 / 4');
});


test('modelo rápido preenche estrutura sem alterar cliente ou negócio', async ({ page }) => {
  await localMode(page);
  await page.locator('[name="business"]').fill('Conde Elétrica');
  await page.locator('[name="client"]').fill('Cliente Modelo');

  await page.locator('#proposal-template').selectOption('electrical');
  await expect(page.locator('#apply-template')).toBeEnabled();
  await page.locator('#apply-template').click();

  await expect(page.locator('[name="business"]')).toHaveValue('Conde Elétrica');
  await expect(page.locator('[name="client"]')).toHaveValue('Cliente Modelo');
  await expect(page.locator('.line-item')).toHaveCount(3);
  await expect(page.locator('.line-item').nth(0).locator('[data-description]')).toHaveValue('Visita técnica e diagnóstico');
  await expect(page.locator('.line-item').nth(1).locator('[data-description]')).toHaveValue('Instalação ou manutenção elétrica');
  await expect(page.locator('[name="deadline"]')).toHaveValue('Até 3 dias úteis após aprovação');
  await expect(page.locator('[name="terms"]')).toHaveValue('50% no início e 50% na conclusão');
  await expect(page.locator('.line-item').first().locator('[data-unit-price]')).toBeFocused();
});


test('logo local aparece no documento gerado', async ({ page }) => {
  await localMode(page);
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64'
  );

  await page.locator('#business-logo-input').setInputFiles({
    name: 'logo.png',
    mimeType: 'image/png',
    buffer: png
  });
  await expect(page.locator('#business-logo-preview')).toBeVisible();
  await expect(page.locator('#business-logo-preview img')).toHaveAttribute('src', /^data:image\/(webp|png|jpeg);base64,/);

  await fillBaseProposal(page, ' Logo');
  await page.getByRole('button', { name: /Gerar proposta|Generate proposal/i }).click();

  const documentLogo = page.locator('#proposal .proposal-business-logo');
  await expect(documentLogo).toBeVisible();
  await expect(documentLogo).toHaveAttribute('src', /^data:image\/(webp|png|jpeg);base64,/);
});
