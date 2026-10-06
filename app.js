const form = document.querySelector('#form');
const result = document.querySelector('#result');
const list = document.querySelector('#list');
const itemFields = document.querySelector('#item-fields');
const addItemButton = document.querySelector('#add-item');
const formTotal = document.querySelector('#form-total');
const storageKey = 'docpronto-proposals';
const maxItems = 10;

const contactField = document.createElement('label');
contactField.className = 'field';
contactField.innerHTML = '<span>Telefone ou WhatsApp do negócio (opcional)</span><input name="businessPhone" type="tel" placeholder="(11) 99999-9999">';
form.querySelector('[name="business"]').closest('label').after(contactField);
const validityField = document.createElement('label');
validityField.className = 'field';
validityField.innerHTML = '<span>Proposta válida até</span><input name="validUntil" type="date" required>';
form.querySelector('button[type="submit"]').before(validityField);
const validityInput = validityField.querySelector('input');
const localDate = date => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const today = new Date();
validityInput.min = localDate(today);
validityInput.value = localDate(new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000));

const submitButton = form.querySelector('button[type="submit"]');
const cancelEditButton = document.createElement('button');
cancelEditButton.className = 'secondary cancel-edit';
cancelEditButton.type = 'button';
cancelEditButton.textContent = 'Cancelar edição';
cancelEditButton.hidden = true;
submitButton.before(cancelEditButton);
let editingId = null;

function defaultValidityDate() {
  return localDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000));
}

function resetComposer() {
  editingId = null;
  form.reset();
  itemFields.innerHTML = '';
  addItem();
  validityInput.min = localDate(new Date());
  validityInput.value = defaultValidityDate();
  submitButton.textContent = 'Gerar proposta';
  cancelEditButton.hidden = true;
}

function beginEditing(proposal) {
  editingId = proposal.id;
  form.querySelector('[name="business"]').value = proposal.business || '';
  form.querySelector('[name="businessPhone"]').value = proposal.businessPhone || '';
  form.querySelector('[name="client"]').value = proposal.client || '';
  form.querySelector('[name="deadline"]').value = proposal.deadline || '';
  form.querySelector('[name="terms"]').value = proposal.terms || '';

  const todayValue = localDate(new Date());
  validityInput.min = todayValue;
  validityInput.value = proposal.validUntil && proposal.validUntil >= todayValue
    ? proposal.validUntil
    : defaultValidityDate();

  const items = Array.isArray(proposal.items) && proposal.items.length
    ? proposal.items
    : [{ description: proposal.scope || 'Serviço', quantity: 1, unitPrice: proposal.amount || 0 }];
  itemFields.innerHTML = '';
  items.slice(0, maxItems).forEach(addItem);

  submitButton.textContent = 'Salvar alterações';
  cancelEditButton.hidden = false;
  form.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  form.querySelector('[name="business"]').focus();
  showToast('Editando a proposta ' + proposal.number + '.');
}

cancelEditButton.addEventListener('click', () => {
  resetComposer();
  showToast('Edição cancelada.');
});

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function readProposals() {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('on');
  window.setTimeout(() => toast.classList.remove('on'), 1800);
}

function formatCurrency(value) {
  const amount = Number(value);
  return (Number.isFinite(amount) ? amount : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function readFormItems() {
  return Array.from(itemFields.querySelectorAll('.line-item')).map(row => {
    const description = row.querySelector('[data-description]').value.trim();
    const quantity = Number(row.querySelector('[data-quantity]').value);
    const unitPrice = Number(row.querySelector('[data-unit-price]').value);
    return {
      description: description,
      quantity: quantity,
      unitPrice: unitPrice,
      subtotal: quantity * unitPrice
    };
  });
}

function updateTotal() {
  const total = readFormItems().reduce((sum, item) => sum + item.subtotal, 0);
  formTotal.textContent = formatCurrency(total);
}

function updateItemControls() {
  const rows = itemFields.querySelectorAll('.line-item');
  const atLimit = rows.length >= maxItems;
  addItemButton.disabled = atLimit;
  addItemButton.setAttribute('aria-disabled', String(atLimit));
  rows.forEach(row => {
    const removeButton = row.querySelector('.remove-item');
    removeButton.disabled = rows.length === 1;
    removeButton.setAttribute('aria-disabled', String(rows.length === 1));
  });
}

function addItem(values = {}) {
  if (itemFields.querySelectorAll('.line-item').length >= maxItems) {
    showToast('Você pode adicionar até 10 itens.');
    return;
  }

  const row = document.createElement('div');
  row.className = 'line-item';
  row.innerHTML =
    '<label class="field item-description"><span>Descrição</span>' +
      '<input data-description type="text" placeholder="Ex.: Instalação de tomadas" required>' +
    '</label>' +
    '<label class="field item-quantity"><span>Qtd.</span>' +
      '<input data-quantity type="number" min="0.01" step="0.01" value="1" inputmode="decimal" required>' +
    '</label>' +
    '<label class="field item-price"><span>Preço unitário</span>' +
      '<input data-unit-price type="number" min="0" step="0.01" placeholder="0,00" inputmode="decimal" required>' +
    '</label>' +
    '<button class="remove-item" type="button" aria-label="Remover item">×</button>';

  row.querySelector('[data-description]').value = values.description || '';
  row.querySelector('[data-quantity]').value = values.quantity === undefined ? '1' : values.quantity;
  row.querySelector('[data-unit-price]').value = values.unitPrice === undefined ? '' : values.unitPrice;
  itemFields.append(row);
  updateItemControls();
  updateTotal();
}

function renderProposal(proposal) {
  const items = Array.isArray(proposal.items) && proposal.items.length
    ? proposal.items
    : [{ description: proposal.scope || 'Serviço', quantity: 1, unitPrice: proposal.amount || 0, subtotal: proposal.amount || 0 }];
  const total = Number.isFinite(Number(proposal.total)) ? Number(proposal.total) : Number(proposal.amount) || 0;
  const itemRows = items.map(item =>
    '<tr><td>' + escapeHtml(item.description) + '</td>' +
    '<td class="number">' + Number(item.quantity || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '</td>' +
    '<td class="number">' + formatCurrency(item.unitPrice) + '</td>' +
    '<td class="number">' + formatCurrency(item.subtotal) + '</td></tr>'
  ).join('');

  result.innerHTML =
    '<article class="proposal" id="proposal">' +
      '<small>PROPOSTA ' + escapeHtml(proposal.number) + '</small>' +
      '<h3>' + escapeHtml(proposal.business) + '</h3>' +
      '<div class="proposal-meta">Preparada em ' + new Date(proposal.createdAt).toLocaleDateString('pt-BR') + ' · válida até ' + (proposal.validUntil ? new Date(proposal.validUntil + 'T00:00:00').toLocaleDateString('pt-BR') : 'não informada') + '</div>' +
      (proposal.businessPhone ? '<p><b>Contato:</b> ' + escapeHtml(proposal.businessPhone) + '</p>' : '') +
      '<p><b>Para:</b> ' + escapeHtml(proposal.client) + '</p>' +
      '<div class="proposal-table-wrap"><table class="proposal-table">' +
        '<thead><tr><th>Serviço ou material</th><th class="number">Qtd.</th><th class="number">Unitário</th><th class="number">Subtotal</th></tr></thead>' +
        '<tbody>' + itemRows + '</tbody>' +
      '</table></div>' +
      '<div class="amount-line"><span>Total do orçamento</span><strong class="amount">' + formatCurrency(total) + '</strong></div>' +
      '<p><b>Prazo:</b> ' + escapeHtml(proposal.deadline) + '</p>' +
      '<p><b>Condições de pagamento:</b> ' + escapeHtml(proposal.terms) + '</p>' +
      '<button class="secondary" id="print" type="button">Imprimir / salvar PDF</button>' +
    '</article>';
  result.classList.add('show');
  document.querySelector('#print').addEventListener('click', () => window.print());
}

function renderHistory() {
  const proposals = readProposals().slice(-5).reverse();
  list.innerHTML = proposals.length
    ? proposals.map(proposal => {
      const total = Number.isFinite(Number(proposal.total)) ? Number(proposal.total) : Number(proposal.amount) || 0;
      return '<div class="item"><div class="item-summary"><strong>' + escapeHtml(proposal.client) + '</strong>' +
        '<small>' + escapeHtml(proposal.number) + ' · ' + formatCurrency(total) + '</small></div>' +
        '<div class="item-actions">' +
          '<button class="secondary" type="button" data-proposal="' + escapeHtml(proposal.id) + '">Abrir</button>' +
          '<button class="secondary" type="button" data-edit="' + escapeHtml(proposal.id) + '">Editar</button>' +
          '<button class="secondary" type="button" data-delete="' + escapeHtml(proposal.id) + '" aria-label="Excluir proposta">Excluir</button>' +
        '</div></div>';
    }).join('')
    : '<div class="empty">As propostas salvas neste navegador aparecem aqui.</div>';
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const values = Object.fromEntries(new FormData(form));
  const items = readFormItems();
  const invalidItem = items.some(item =>
    !item.description || !Number.isFinite(item.quantity) || item.quantity <= 0 ||
    !Number.isFinite(item.unitPrice) || item.unitPrice < 0
  );
  if (invalidItem) {
    showToast('Confira a descrição, a quantidade e o preço de cada item.');
    return;
  }

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  if (!Number.isFinite(total)) {
    showToast('Confira os valores informados no orçamento.');
    return;
  }

  const now = Date.now();
  const proposals = readProposals();
  const existing = editingId ? proposals.find(item => item.id === editingId) : null;
  if (editingId && !existing) {
    resetComposer();
    showToast('Essa proposta não está mais no histórico. Crie uma nova proposta.');
    return;
  }

  const fields = {
    business: String(values.business || '').trim(),
    client: String(values.client || '').trim(),
    items: items,
    total: total,
    amount: total,
    scope: items.map(item => item.description).join(', '),
    deadline: String(values.deadline || '').trim(),
    terms: String(values.terms || '').trim(),
    businessPhone: String(values.businessPhone || '').trim(),
    validUntil: values.validUntil
  };
  const proposal = existing
    ? { ...existing, ...fields, updatedAt: now }
    : {
        ...fields,
        id: crypto.randomUUID?.() || String(now),
        number: 'DP-' + new Date(now).getFullYear() + '-' + String(now).slice(-6),
        createdAt: now
      };
  const nextProposals = existing
    ? proposals.map(item => item.id === existing.id ? proposal : item)
    : proposals.concat(proposal).slice(-20);

  localStorage.setItem(storageKey, JSON.stringify(nextProposals));
  renderProposal(proposal);
  renderHistory();
  if (existing) resetComposer();
  showToast(existing ? 'Proposta atualizada no histórico.' : 'Proposta salva neste navegador.');
});

itemFields.addEventListener('input', updateTotal);
itemFields.addEventListener('click', event => {
  const removeButton = event.target.closest('.remove-item');
  if (!removeButton || itemFields.querySelectorAll('.line-item').length <= 1) return;
  removeButton.closest('.line-item').remove();
  updateItemControls();
  updateTotal();
});
addItemButton.addEventListener('click', () => addItem());
list.addEventListener('click', event => {
  const removeButton = event.target.closest('[data-delete]');
  if (removeButton) {
    if (!window.confirm('Excluir esta proposta do histórico salvo neste navegador?')) return;
    const id = removeButton.dataset.delete;
    localStorage.setItem(storageKey, JSON.stringify(readProposals().filter(item => item.id !== id)));
    renderHistory();
    showToast('Proposta removida do histórico.');
    return;
  }

  const editButton = event.target.closest('[data-edit]');
  if (editButton) {
    const proposal = readProposals().find(item => item.id === editButton.dataset.edit);
    if (proposal) beginEditing(proposal);
    return;
  }

  const button = event.target.closest('[data-proposal]');
  if (!button) return;
  const proposal = readProposals().find(item => item.id === button.dataset.proposal);
  if (proposal) renderProposal(proposal);
});

addItem();
renderHistory();
