(function (root) {
  'use strict';

  function calculateDiscount(subtotal, type, value) {
    const subtotalNumber = Number(subtotal);
    const subtotalCents = Math.round((Number.isFinite(subtotalNumber) ? subtotalNumber : 0) * 100);
    const discountType = type === 'percent' || type === 'fixed' ? type : 'none';
    const rawValue = Number(value || 0);

    if (!Number.isSafeInteger(subtotalCents) || subtotalCents < 0) {
      return { ok: false, error: 'Subtotal inválido.', subtotal: 0, discount: 0, total: 0 };
    }
    if (discountType === 'none') {
      return { ok: true, error: '', subtotal: subtotalCents / 100, discount: 0, total: subtotalCents / 100 };
    }
    if (!Number.isFinite(rawValue) || rawValue < 0) {
      return { ok: false, error: 'Informe um desconto válido.', subtotal: subtotalCents / 100, discount: 0, total: subtotalCents / 100 };
    }

    let discountCents = 0;
    if (discountType === 'percent') {
      if (rawValue > 100) {
        return { ok: false, error: 'O desconto percentual não pode passar de 100%.', subtotal: subtotalCents / 100, discount: 0, total: subtotalCents / 100 };
      }
      discountCents = Math.round(subtotalCents * rawValue / 100);
    } else {
      discountCents = Math.round((rawValue + 1e-9) * 100);
      if (!Number.isSafeInteger(discountCents)) {
        return { ok: false, error: 'O desconto informado é muito alto.', subtotal: subtotalCents / 100, discount: 0, total: subtotalCents / 100 };
      }
    }

    if (discountCents > subtotalCents) {
      return { ok: false, error: 'O desconto não pode ser maior que o subtotal.', subtotal: subtotalCents / 100, discount: 0, total: subtotalCents / 100 };
    }

    return {
      ok: true,
      error: '',
      subtotal: subtotalCents / 100,
      discount: discountCents / 100,
      total: (subtotalCents - discountCents) / 100
    };
  }

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

  const api = Object.freeze({ validateItems, calculateDiscount });
  root.DocProntoCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis === 'object' ? globalThis : this);
