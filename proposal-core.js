(function (root) {
  'use strict';

  function validateItems(items, maxItems) {
    const limit = Number.isInteger(maxItems) && maxItems > 0 ? maxItems : 10;
    if (!Array.isArray(items) || items.length === 0) {
      return { ok: false, error: 'Adicione pelo menos um serviço ou material.', items: [], total: 0 };
    }
    if (items.length > limit) {
      return { ok: false, error: 'Você pode adicionar até ' + limit + ' itens.', items: [], total: 0 };
    }

    const normalized = [];
    let totalCents = 0;
    for (const item of items) {
      const description = String(item.description || '').trim();
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      if (!description) {
        return { ok: false, error: 'Preencha a descrição de cada item.', items: [], total: 0 };
      }
      if (description.length > 160) {
        return { ok: false, error: 'Cada descrição pode ter até 160 caracteres.', items: [], total: 0 };
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return { ok: false, error: 'A quantidade precisa ser maior que zero.', items: [], total: 0 };
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return { ok: false, error: 'Informe um preço unitário válido.', items: [], total: 0 };
      }
      const subtotalCents = Math.round((quantity * unitPrice + 1e-9) * 100);
      if (!Number.isSafeInteger(subtotalCents) || subtotalCents > 999999999999) {
        return { ok: false, error: 'O valor de um item excede o limite permitido.', items: [], total: 0 };
      }
      totalCents += subtotalCents;
      if (!Number.isSafeInteger(totalCents) || totalCents > 999999999999) {
        return { ok: false, error: 'O total excede o limite permitido.', items: [], total: 0 };
      }
      normalized.push({ description, quantity, unitPrice, subtotal: subtotalCents / 100 });
    }
    return { ok: true, error: '', items: normalized, total: totalCents / 100 };
  }

  const api = Object.freeze({ validateItems });
  root.DocProntoCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis === 'object' ? globalThis : this);
