const form = document.querySelector('#form');
const result = document.querySelector('#result');
const list = document.querySelector('#list');
const storageKey = 'docpronto-proposals';

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
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function renderProposal(proposal) {
  result.innerHTML = `
    <article class="proposal" id="proposal">
      <small>PROPOSTA ${escapeHtml(proposal.number)}</small>
      <h3>${escapeHtml(proposal.business)}</h3>
      <div class="proposal-meta">Preparada em ${new Date(proposal.createdAt).toLocaleDateString('pt-BR')}</div>
      <p><b>Para:</b> ${escapeHtml(proposal.client)}</p>
      <p><b>Serviço / escopo:</b><br>${escapeHtml(proposal.scope).replace(/\n/g, '<br>')}</p>
      <div class="amount">${formatCurrency(proposal.amount)}</div>
      <p><b>Prazo:</b> ${escapeHtml(proposal.deadline)}</p>
      <p><b>Condições:</b> ${escapeHtml(proposal.terms)}</p>
      <button class="secondary" id="print" type="button">Imprimir / salvar PDF</button>
    </article>`;
  result.classList.add('show');
  document.querySelector('#print').addEventListener('click', () => window.print());
}

function renderHistory() {
  const proposals = readProposals().slice(-5).reverse();
  list.innerHTML = proposals.length
    ? proposals.map(proposal => `
      <div class="item"><div><strong>${escapeHtml(proposal.client)}</strong>
        <small>${escapeHtml(proposal.number)} · ${formatCurrency(proposal.amount)}</small></div>
        <button class="secondary" type="button" data-proposal="${escapeHtml(proposal.id)}">Abrir</button>
      </div>`).join('')
    : '<div class="empty">As propostas salvas neste navegador aparecem aqui.</div>';
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const values = Object.fromEntries(new FormData(form));
  const amount = Number(values.f3);
  if (!Number.isFinite(amount) || amount < 0) {
    showToast('Informe um valor válido para o orçamento.');
    return;
  }

  const createdAt = Date.now();
  const proposal = {
    id: crypto.randomUUID?.() || String(createdAt),
    number: `DP-${new Date(createdAt).getFullYear()}-${String(createdAt).slice(-6)}`,
    business: values.f0.trim(), client: values.f1.trim(), scope: values.f2.trim(), amount,
    deadline: values.f4.trim(), terms: values.f5.trim(), createdAt
  };
  const proposals = readProposals();
  proposals.push(proposal);
  localStorage.setItem(storageKey, JSON.stringify(proposals.slice(-20)));
  renderProposal(proposal);
  renderHistory();
  showToast('Proposta salva neste navegador.');
});

list.addEventListener('click', event => {
  const button = event.target.closest('[data-proposal]');
  if (!button) return;
  const proposal = readProposals().find(item => item.id === button.dataset.proposal);
  if (proposal) renderProposal(proposal);
});

renderHistory();
