const form = document.querySelector('#form');
const result = document.querySelector('#result');
const list = document.querySelector('#list');
const itemFields = document.querySelector('#item-fields');
const serviceSuggestions = document.querySelector('#service-suggestions');
const addItemButton = document.querySelector('#add-item');
const formSubtotal = document.querySelector('#form-subtotal');
const formDiscount = document.querySelector('#form-discount');
const formDiscountRow = document.querySelector('#form-discount-row');
const formTotal = document.querySelector('#form-total');
const discountTypeInput = document.querySelector('#discount-type');
const discountValueInput = document.querySelector('#discount-value');
const storageKey = 'docpronto-proposals';
const composerDraftKey = 'docpronto-composer-draft-v1';
const maxItems = 10;
const accountDialog = document.querySelector('#account-dialog');
const accountOpenButton = document.querySelector('#account-open');
const accountCloseButton = document.querySelector('#account-close');
const accountForm = document.querySelector('#auth-form');
const accountProfile = document.querySelector('#account-profile');
const passwordRecoveryForm = document.querySelector('#password-recovery-form');
const accountMessage = document.querySelector('#account-message');
const syncStatus = document.querySelector('#sync-status');
const localImportBanner = document.querySelector('#local-import-banner');
const localImportButton = document.querySelector('#local-import');
const proposalStatusFilter = document.querySelector('#proposal-status-filter');
const proposalSearch = document.querySelector('#proposal-search');
const proposalSort = document.querySelector('#proposal-sort');
const historySummary = document.querySelector('#history-summary');
const historyMoreButton = document.querySelector('#history-more');
const exportCsvButton = document.querySelector('#export-csv');
const clearComposerButton = document.querySelector('#clear-composer');
const businessProfileForm = document.querySelector('#business-profile-form');
const brandColorValue = document.querySelector('#brand-color-value');
const savedClientsList = document.querySelector('#saved-clients-list');
const savedClientsCount = document.querySelector('#saved-clients-count');
const supabaseClient = window.DOC_PRONTO_SUPABASE?.client || null;
const proposalTable = 'docpronto_proposals';
const pageParams = new URLSearchParams(location.search);
const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
const publicProposalId = (hashParams.get('proposta') || pageParams.get('proposta') || '').trim();
const publicProposalToken = (hashParams.get('token') || pageParams.get('token') || '').trim();
const publicProposalMode = Boolean(publicProposalId && publicProposalToken);
let currentUser = null;
let cloudProposals = [];
let cloudClients = [];
let cloudLoading = false;
let passwordRecovery = false;
let openedProposalId = null;
let lastCloudRefreshAt = 0;
let historyVisibleLimit = 10;

const contactField = document.createElement('label');
contactField.className = 'field';
contactField.innerHTML = '<span>Telefone ou WhatsApp do negócio (opcional)</span><input name="businessPhone" type="tel" maxlength="30" placeholder="(11) 99999-9999">';
form.querySelector('[name="business"]').closest('label').after(contactField);
const clientContactField = document.createElement('label');
clientContactField.className = 'field';
clientContactField.innerHTML = '<span>WhatsApp do cliente (opcional)</span><input name="clientPhone" type="tel" maxlength="30" inputmode="tel" placeholder="(11) 99999-9999"><small class="field-help">Usado apenas para facilitar o compartilhamento da proposta.</small>';
form.querySelector('[name="client"]').closest('label').after(clientContactField);
const validityField = document.createElement('label');
validityField.className = 'field';
validityField.innerHTML = '<span>Proposta válida até</span><input name="validUntil" type="date" required>';
const composerActions = form.querySelector('.composer-actions');
composerActions.before(validityField);
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
composerActions.before(cancelEditButton);
let editingId = null;

function defaultValidityDate() {
  return localDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000));
}

function readComposerDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(composerDraftKey) || 'null');
    return draft && typeof draft === 'object' ? draft : null;
  } catch {
    return null;
  }
}

function serializeComposerDraft() {
  return {
    business: form.querySelector('[name="business"]')?.value || '',
    businessPhone: form.querySelector('[name="businessPhone"]')?.value || '',
    client: form.querySelector('[name="client"]')?.value || '',
    clientPhone: form.querySelector('[name="clientPhone"]')?.value || '',
    clientEmail: form.querySelector('[name="clientEmail"]')?.value || '',
    clientDocument: form.querySelector('[name="clientDocument"]')?.value || '',
    clientAddress: form.querySelector('[name="clientAddress"]')?.value || '',
    deadline: form.querySelector('[name="deadline"]')?.value || '',
    terms: form.querySelector('[name="terms"]')?.value || '',
    notes: form.querySelector('[name="notes"]')?.value || '',
    validUntil: validityInput?.value || '',
    discountType: discountTypeInput?.value || 'none',
    discountValue: discountValueInput?.value || '0',
    items: Array.from(itemFields.querySelectorAll('.line-item')).map(row => ({
      description: row.querySelector('[data-description]')?.value || '',
      quantity: row.querySelector('[data-quantity]')?.value || '1',
      unitPrice: row.querySelector('[data-unit-price]')?.value || ''
    })),
    savedAt: Date.now()
  };
}

function saveComposerDraft() {
  if (editingId || publicProposalMode) return;
  const draft = serializeComposerDraft();
  const hasContent = [
    draft.business, draft.businessPhone, draft.client, draft.clientPhone,
    draft.clientEmail, draft.clientDocument, draft.clientAddress,
    draft.deadline, draft.terms, draft.notes
  ].some(value => String(value).trim()) ||
    draft.items.some(item => String(item.description).trim() || String(item.unitPrice).trim());
  if (!hasContent) {
    localStorage.removeItem(composerDraftKey);
    return;
  }
  localStorage.setItem(composerDraftKey, JSON.stringify(draft));
}

function clearComposerDraft() {
  localStorage.removeItem(composerDraftKey);
}

function restoreComposerDraft() {
  const draft = readComposerDraft();
  if (!draft) return false;
  const business = form.querySelector('[name="business"]');
  const businessPhone = form.querySelector('[name="businessPhone"]');
  const client = form.querySelector('[name="client"]');
  const clientPhone = form.querySelector('[name="clientPhone"]');
  const clientEmail = form.querySelector('[name="clientEmail"]');
  const clientDocument = form.querySelector('[name="clientDocument"]');
  const clientAddress = form.querySelector('[name="clientAddress"]');
  const deadline = form.querySelector('[name="deadline"]');
  const terms = form.querySelector('[name="terms"]');
  const notes = form.querySelector('[name="notes"]');

  if (business) business.value = draft.business || business.value;
  if (businessPhone) businessPhone.value = draft.businessPhone || '';
  if (client) client.value = draft.client || '';
  if (clientPhone) clientPhone.value = draft.clientPhone || '';
  if (clientEmail) clientEmail.value = draft.clientEmail || '';
  if (clientDocument) clientDocument.value = draft.clientDocument || '';
  if (clientAddress) clientAddress.value = draft.clientAddress || '';
  if (draft.clientEmail || draft.clientDocument || draft.clientAddress) document.querySelector('.client-extra')?.setAttribute('open', '');
  if (deadline) deadline.value = draft.deadline || '';
  if (terms) terms.value = draft.terms || '';
  if (notes) notes.value = draft.notes || '';
  if (draft.validUntil) validityInput.value = draft.validUntil;
  if (discountTypeInput) discountTypeInput.value = ['percent', 'fixed'].includes(draft.discountType) ? draft.discountType : 'none';
  if (discountValueInput) {
    discountValueInput.value = draft.discountValue || '0';
    discountValueInput.disabled = discountTypeInput?.value === 'none';
  }

  if (Array.isArray(draft.items) && draft.items.length) {
    itemFields.innerHTML = '';
    draft.items.slice(0, maxItems).forEach(item => addItem({
      description: item.description || '',
      quantity: item.quantity || '1',
      unitPrice: item.unitPrice || ''
    }));
  }
  updateTotal();
  return true;
}

let composerDraftTimer = null;
function scheduleComposerDraftSave() {
  if (editingId || publicProposalMode) return;
  window.clearTimeout(composerDraftTimer);
  composerDraftTimer = window.setTimeout(saveComposerDraft, 250);
}

function resetComposer() {
  editingId = null;
  clearComposerDraft();
  form.reset();
  itemFields.innerHTML = '';
  addItem();
  validityInput.min = localDate(new Date());
  validityInput.value = defaultValidityDate();
  document.querySelector('.client-extra')?.removeAttribute('open');
  if (discountTypeInput) discountTypeInput.value = 'none';
  if (discountValueInput) {
    discountValueInput.value = '0';
    discountValueInput.disabled = true;
  }
  updateTotal();
  prefillBusinessFields(visibleProposals());
  submitButton.textContent = 'Gerar proposta';
  cancelEditButton.hidden = true;
}

function beginEditing(proposal) {
  clearComposerDraft();
  editingId = proposal.id;
  form.querySelector('[name="business"]').value = proposal.business || '';
  form.querySelector('[name="businessPhone"]').value = proposal.businessPhone || '';
  form.querySelector('[name="client"]').value = proposal.client || '';
  form.querySelector('[name="clientPhone"]').value = proposal.clientPhone || '';
  form.querySelector('[name="clientEmail"]').value = proposal.clientEmail || '';
  form.querySelector('[name="clientDocument"]').value = proposal.clientDocument || '';
  form.querySelector('[name="clientAddress"]').value = proposal.clientAddress || '';
  if (proposal.clientEmail || proposal.clientDocument || proposal.clientAddress) document.querySelector('.client-extra')?.setAttribute('open', '');
  form.querySelector('[name="deadline"]').value = proposal.deadline || '';
  form.querySelector('[name="terms"]').value = proposal.terms || '';
  form.querySelector('[name="notes"]').value = proposal.notes || '';
  if (discountTypeInput) discountTypeInput.value = ['percent', 'fixed'].includes(proposal.discountType) ? proposal.discountType : 'none';
  if (discountValueInput) {
    discountValueInput.value = Number(proposal.discountValue || 0);
    discountValueInput.disabled = discountTypeInput?.value === 'none';
  }

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

clearComposerButton?.addEventListener('click', () => {
  if (!window.confirm('Limpar o formulário e apagar o rascunho salvo neste dispositivo?')) return;
  resetComposer();
  showToast('Formulário limpo.');
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

function visibleProposals() {
  return currentUser ? cloudProposals : readProposals();
}

const defaultBrandColor = '#245d6c';

function normalizeBrandColor(value) {
  const color = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : defaultBrandColor;
}

function accountBusinessProfile() {
  const metadata = currentUser?.user_metadata || {};
  return {
    businessName: String(metadata.docpronto_business_name || '').trim(),
    businessPhone: String(metadata.docpronto_business_phone || '').trim(),
    brandColor: normalizeBrandColor(metadata.docpronto_brand_color)
  };
}

function renderBusinessProfileForm() {
  if (!businessProfileForm || !currentUser) return;
  if (businessProfileForm.contains(document.activeElement)) return;
  const profile = accountBusinessProfile();
  businessProfileForm.elements.businessName.value = profile.businessName;
  businessProfileForm.elements.businessPhone.value = profile.businessPhone;
  businessProfileForm.elements.brandColor.value = profile.brandColor;
  if (brandColorValue) brandColorValue.textContent = profile.brandColor.toUpperCase();
}


function prefillBusinessFields(proposals) {
  if (editingId) return;
  const businessInput = form.querySelector('[name="business"]');
  const phoneInput = form.querySelector('[name="businessPhone"]');
  if (!businessInput || businessInput.value.trim()) return;

  const profile = accountBusinessProfile();
  if (profile.businessName) {
    businessInput.value = profile.businessName;
    if (phoneInput && !phoneInput.value.trim()) phoneInput.value = profile.businessPhone;
    return;
  }

  if (!Array.isArray(proposals) || proposals.length === 0) return;
  const recent = proposals
    .slice()
    .sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0))
    .find(item => String(item.business || '').trim());
  if (!recent) return;

  businessInput.value = recent.business || '';
  if (phoneInput && !phoneInput.value.trim()) phoneInput.value = recent.businessPhone || '';
}


function generateShareToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function makeUuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
    .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
}

function renderClientSuggestions() {
  const dataList = document.querySelector('#client-suggestions');
  if (!dataList) return;
  dataList.innerHTML = cloudClients
    .slice()
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR'))
    .map(client => '<option value="' + escapeHtml(client.name) + '"></option>')
    .join('');
}

function renderSavedClients() {
  if (!savedClientsList || !savedClientsCount) return;
  savedClientsCount.textContent = String(cloudClients.length);
  if (!currentUser) {
    savedClientsList.innerHTML = '';
    return;
  }
  if (!cloudClients.length) {
    savedClientsList.innerHTML = '<div class="saved-client-empty">Os clientes aparecem aqui conforme você salva propostas.</div>';
    return;
  }

  savedClientsList.innerHTML = cloudClients
    .slice()
    .sort((a, b) => Date.parse(b.updated_at || 0) - Date.parse(a.updated_at || 0))
    .slice(0, 12)
    .map(client => {
      const detail = [client.phone, client.email].filter(Boolean).map(escapeHtml).join(' · ');
      return '<article class="saved-client-item">' +
        '<div class="saved-client-copy"><strong>' + escapeHtml(client.name) + '</strong>' +
          (detail ? '<span>' + detail + '</span>' : '<span>Sem contato adicional</span>') +
        '</div>' +
        '<div class="saved-client-actions">' +
          '<button class="secondary" type="button" data-client-use="' + escapeHtml(client.id) + '">Usar</button>' +
          '<button class="secondary" type="button" data-client-delete="' + escapeHtml(client.id) + '">Excluir</button>' +
        '</div>' +
      '</article>';
    }).join('');
}

function fillClientFromRecord(client) {
  if (!client) return;
  form.querySelector('[name="client"]').value = client.name || '';
  form.querySelector('[name="clientPhone"]').value = client.phone || '';
  form.querySelector('[name="clientEmail"]').value = client.email || '';
  form.querySelector('[name="clientDocument"]').value = client.document || '';
  form.querySelector('[name="clientAddress"]').value = client.address || '';
  if (client.email || client.document || client.address) document.querySelector('.client-extra')?.setAttribute('open', '');
  scheduleComposerDraftSave();
}


async function loadCloudClients() {
  if (!supabaseClient || !currentUser) return;
  const ownerId = currentUser.id;
  const { data, error } = await supabaseClient
    .from('docpronto_clients')
    .select('id,name,name_key,phone,email,document,address,updated_at')
    .order('updated_at', { ascending: false })
    .limit(100);
  if (currentUser?.id !== ownerId) return;
  if (error) {
    console.warn('DocPronto clientes não puderam ser carregados:', error.message);
    return;
  }
  cloudClients = data || [];
  renderClientSuggestions();
  renderSavedClients();
}

async function syncClientRecord(proposal) {
  if (!supabaseClient || !currentUser) return;
  const name = String(proposal.client || '').trim();
  if (!name) return;
  const nameKey = name.toLocaleLowerCase('pt-BR');
  const phone = String(proposal.clientPhone || '').trim() || null;
  const email = String(proposal.clientEmail || '').trim() || null;
  const documentValue = String(proposal.clientDocument || '').trim() || null;
  const address = String(proposal.clientAddress || '').trim() || null;
  const existing = cloudClients.find(client => client.name_key === nameKey);

  if (existing) {
    const { data, error } = await supabaseClient
      .from('docpronto_clients')
      .update({ name, phone, email, document: documentValue, address, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('id,name,name_key,phone,email,document,address,updated_at')
      .single();
    if (error) throw error;
    cloudClients = [data, ...cloudClients.filter(client => client.id !== data.id)];
  } else {
    const { data, error } = await supabaseClient
      .from('docpronto_clients')
      .insert({ user_id: currentUser.id, name, phone, email, document: documentValue, address })
      .select('id,name,name_key,phone,email,document,address,updated_at')
      .single();
    if (error) throw error;
    cloudClients = [data, ...cloudClients];
  }
  renderClientSuggestions();
  renderSavedClients();
}

function applySavedClient() {
  if (!currentUser) return;
  const input = form.querySelector('[name="client"]');
  const key = String(input.value || '').trim().toLocaleLowerCase('pt-BR');
  const client = cloudClients.find(item => item.name_key === key);
  if (!client) return;
  fillClientFromRecord(client);
  showToast('Dados do cliente preenchidos.');
}

form.querySelector('[name="client"]').addEventListener('change', applySavedClient);

function mapCloudProposal(row) {
  return {
    ...row.proposal_data,
    id: row.id,
    number: row.proposal_number,
    business: row.business_name,
    client: row.client_name,
    total: Number(row.total),
    amount: Number(row.total),
    status: row.status || row.proposal_data?.status || 'draft',
    respondedAt: row.responded_at ? Date.parse(row.responded_at) : null,
    createdAt: Date.parse(row.created_at),
    updatedAt: Date.parse(row.updated_at)
  };
}

async function saveCloudProposal(proposal) {
  if (!supabaseClient || !currentUser) throw new Error('Entre na sua conta para sincronizar.');
  const now = new Date().toISOString();
  const row = {
    id: proposal.id,
    owner_id: currentUser.id,
    proposal_number: proposal.number,
    business_name: proposal.business,
    client_name: proposal.client,
    total: Number(proposal.total) || 0,
    status: proposal.status || 'draft',
    responded_at: proposal.respondedAt ? new Date(Number(proposal.respondedAt)).toISOString() : null,
    proposal_data: proposal,
    created_at: new Date(Number(proposal.createdAt) || Date.now()).toISOString(),
    updated_at: now
  };
  const { data, error } = await supabaseClient
    .from(proposalTable)
    .upsert(row, { onConflict: 'id' })
    .select('*')
    .single();
  if (error) throw error;
  try {
    await syncClientRecord(proposal);
  } catch (clientError) {
    console.warn('Proposta salva, mas o cliente não pôde ser atualizado:', clientError?.message || clientError);
  }
  return mapCloudProposal(data);
}

async function loadCloudProposals() {
  if (!supabaseClient || !currentUser) return;
  cloudLoading = true;
  updateAccountUi();
  const ownerId = currentUser.id;
  const { data, error } = await supabaseClient
    .from(proposalTable)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  cloudLoading = false;
  if (currentUser?.id !== ownerId) return;
  if (error) {
    showAccountMessage('Não foi possível carregar suas propostas. Tente novamente.');
    updateAccountUi();
    syncStatus.textContent = 'Falha ao carregar a nuvem';
    return;
  }
  cloudProposals = (data || []).map(mapCloudProposal);
  lastCloudRefreshAt = Date.now();
  prefillBusinessFields(cloudProposals);
  renderHistory();
  if (openedProposalId) {
    const opened = cloudProposals.find(item => item.id === openedProposalId);
    if (opened) renderProposal(opened);
  }
  updateAccountUi();
}

function showAccountMessage(message) {
  if (accountMessage) accountMessage.textContent = message;
}

function updateAccountUi() {
  const localCount = readProposals().length;
  accountOpenButton.textContent = currentUser ? 'Minha conta' : 'Entrar / sincronizar';
  accountOpenButton.disabled = false;
  syncStatus.textContent = currentUser
    ? (cloudLoading ? 'Carregando propostas…' : 'Nuvem · ' + currentUser.email)
    : (supabaseClient ? 'Salvo neste dispositivo' : 'Modo local');
  accountForm.hidden = !supabaseClient || Boolean(currentUser) || passwordRecovery;
  accountProfile.hidden = !currentUser || passwordRecovery;
  passwordRecoveryForm.hidden = !passwordRecovery;
  if (currentUser) {
    document.querySelector('#account-email').textContent = currentUser.email || 'Conta conectada';
    renderBusinessProfileForm();
    localImportBanner.hidden = localCount === 0;
    document.querySelector('#local-import-count').textContent = String(localCount);
  } else {
    localImportBanner.hidden = true;
  }
}

function authErrorText(error) {
  const message = String(error?.message || '').toLowerCase();
  if (message.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (message.includes('already registered')) return 'Este e-mail já tem conta. Tente entrar.';
  if (message.includes('password should be at least')) return 'Use uma senha com pelo menos 8 caracteres.';
  if (message.includes('redirect') || message.includes('url')) return 'O endereço de retorno do DocPronto precisa ser liberado nas configurações de Auth do Supabase.';
  return 'Não foi possível concluir. Confira os dados e tente novamente.';
}

async function importLocalProposals() {
  if (!currentUser) return;
  const button = localImportButton;
  const local = readProposals();
  if (!local.length) {
    updateAccountUi();
    return;
  }
  button.disabled = true;
  showAccountMessage('Importando propostas deste dispositivo…');
  try {
    const normalized = local.map(proposal => ({
      ...proposal,
      id: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(proposal.id)
        ? proposal.id
        : makeUuid()
    }));
    localStorage.setItem(storageKey, JSON.stringify(normalized));
    for (const proposal of normalized) {
      const saved = await saveCloudProposal(proposal);
      cloudProposals = [saved, ...cloudProposals.filter(item => item.id !== saved.id)]
        .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
        .slice(0, 100);
    }
    localStorage.setItem(storageKey, JSON.stringify(readProposals().filter(item =>
      !normalized.some(imported => imported.id === item.id)
    )));
    renderHistory();
    updateAccountUi();
    showAccountMessage('Importação concluída. Suas propostas estão na nuvem.');
  } catch {
    showAccountMessage('Parte da importação pode ter sido concluída. Tente novamente; os registros não serão duplicados.');
  } finally {
    button.disabled = false;
  }
}

function initAccount() {
  accountOpenButton.addEventListener('click', () => {
    renderSavedClients();
    accountDialog.showModal();
  });
  accountCloseButton.addEventListener('click', () => accountDialog.close());
  accountDialog.addEventListener('click', event => {
    if (event.target === accountDialog) accountDialog.close();
  });

  accountForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!supabaseClient) return;
    const submit = accountForm.querySelector('[type="submit"]');
    submit.disabled = true;
    showAccountMessage('Entrando…');
    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: accountForm.elements.email.value.trim(),
        password: accountForm.elements.password.value
      });
      if (error) throw error;
      showAccountMessage('Conta conectada.');
    } catch (error) {
      showAccountMessage(authErrorText(error));
    } finally {
      submit.disabled = false;
    }
  });

  document.querySelector('#sign-up').addEventListener('click', async () => {
    if (!supabaseClient) return;
    const email = accountForm.elements.email.value.trim();
    const password = accountForm.elements.password.value;
    if (!email || password.length < 8) {
      showAccountMessage('Informe seu e-mail e uma senha com pelo menos 8 caracteres.');
      return;
    }
    const button = document.querySelector('#sign-up');
    button.disabled = true;
    showAccountMessage('Criando conta…');
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: 'https://helioconde.github.io/docpronto/' }
      });
      if (error) throw error;
      showAccountMessage(data.session
        ? 'Conta criada e conectada.'
        : 'Conta criada. Confirme o endereço pelo link enviado ao seu e-mail e depois entre.');
    } catch (error) {
      showAccountMessage(authErrorText(error));
    } finally {
      button.disabled = false;
    }
  });

  document.querySelector('#reset-password').addEventListener('click', async () => {
    if (!supabaseClient) return;
    const email = accountForm.elements.email.value.trim();
    if (!email) {
      showAccountMessage('Informe seu e-mail para receber o link de redefinição.');
      return;
    }
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://helioconde.github.io/docpronto/'
      });
      if (error) throw error;
      showAccountMessage('Se esse e-mail estiver cadastrado, você receberá um link para redefinir a senha.');
    } catch (error) {
      showAccountMessage(authErrorText(error));
    }
  });

  passwordRecoveryForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!supabaseClient) return;
    const submit = passwordRecoveryForm.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: passwordRecoveryForm.elements['new-password'].value
      });
      if (error) throw error;
      passwordRecovery = false;
      passwordRecoveryForm.reset();
      updateAccountUi();
      showAccountMessage('Senha atualizada. Você já pode continuar usando sua conta.');
    } catch (error) {
      showAccountMessage(authErrorText(error));
    } finally {
      submit.disabled = false;
    }
  });

  businessProfileForm?.addEventListener('input', event => {
    if (event.target?.name === 'brandColor' && brandColorValue) {
      brandColorValue.textContent = normalizeBrandColor(event.target.value).toUpperCase();
    }
  });

  businessProfileForm?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!supabaseClient || !currentUser) return;
    const submit = businessProfileForm.querySelector('[type="submit"]');
    submit.disabled = true;
    showAccountMessage('Salvando identidade do negócio…');
    try {
      const businessName = businessProfileForm.elements.businessName.value.trim();
      const businessPhone = businessProfileForm.elements.businessPhone.value.trim();
      const brandColor = normalizeBrandColor(businessProfileForm.elements.brandColor.value);
      const { data, error } = await supabaseClient.auth.updateUser({
        data: {
          docpronto_business_name: businessName,
          docpronto_business_phone: businessPhone,
          docpronto_brand_color: brandColor
        }
      });
      if (error) throw error;
      if (data.user) currentUser = data.user;
      const businessInput = form.querySelector('[name="business"]');
      const phoneInput = form.querySelector('[name="businessPhone"]');
      if (businessInput && !businessInput.value.trim()) businessInput.value = businessName;
      if (phoneInput && !phoneInput.value.trim()) phoneInput.value = businessPhone;
      renderBusinessProfileForm();
      showAccountMessage('Identidade salva. Ela será usada nas novas propostas.');
      showToast('Identidade do negócio atualizada.');
    } catch (error) {
      showAccountMessage(authErrorText(error));
    } finally {
      submit.disabled = false;
    }
  });

  savedClientsList?.addEventListener('click', async event => {
    const useButton = event.target.closest('[data-client-use]');
    if (useButton) {
      const client = cloudClients.find(item => item.id === useButton.dataset.clientUse);
      if (!client) return;
      fillClientFromRecord(client);
      accountDialog.close();
      form.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      form.querySelector('[name="client"]').focus();
      showToast('Cliente selecionado.');
      return;
    }

    const deleteButton = event.target.closest('[data-client-delete]');
    if (!deleteButton || !currentUser || !supabaseClient) return;
    const client = cloudClients.find(item => item.id === deleteButton.dataset.clientDelete);
    if (!client) return;
    if (!window.confirm('Excluir o cliente ' + client.name + ' da sua lista salva? As propostas existentes não serão alteradas.')) return;

    deleteButton.disabled = true;
    try {
      const { error } = await supabaseClient
        .from('docpronto_clients')
        .delete()
        .eq('id', client.id);
      if (error) throw error;
      cloudClients = cloudClients.filter(item => item.id !== client.id);
      renderClientSuggestions();
      renderSavedClients();
      showToast('Cliente removido.');
    } catch (error) {
      console.error(error);
      deleteButton.disabled = false;
      showToast('Não foi possível remover o cliente.');
    }
  });

  document.querySelector('#sign-out').addEventListener('click', async () => {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.auth.signOut();
    if (error) showAccountMessage('Não foi possível sair da conta.');
    else showAccountMessage('Você saiu. As propostas locais continuam neste dispositivo.');
  });

  localImportButton.addEventListener('click', importLocalProposals);
  if (!supabaseClient) {
    showAccountMessage('A sincronização está indisponível. Você ainda pode criar propostas salvas neste navegador.');
    updateAccountUi();
    return;
  }

  let activeUserId = null;
  const setSession = (session, authEvent) => {
    if (authEvent === 'PASSWORD_RECOVERY') {
      passwordRecovery = true;
      currentUser = session?.user || null;
      updateAccountUi();
      return;
    }
    if (authEvent === 'USER_UPDATED') passwordRecovery = false;
    const user = session?.user || null;
    const sameUser = Boolean(user?.id && user.id === activeUserId);
    currentUser = user;
    if (sameUser) {
      updateAccountUi();
      prefillBusinessFields(cloudProposals);
      return;
    }
    activeUserId = user?.id || null;
    cloudProposals = [];
    cloudClients = [];
    renderClientSuggestions();
    renderSavedClients();
    updateAccountUi();
    if (user) {
      window.setTimeout(() => {
        loadCloudProposals();
        loadCloudClients();
      }, 0);
    } else {
      renderHistory();
    }
  };
  supabaseClient.auth.onAuthStateChange((authEvent, session) => {
    window.setTimeout(() => setSession(session, authEvent), 0);
  });
  supabaseClient.auth.getSession().then(({ data, error }) => {
    if (error) {
      showAccountMessage('Não foi possível verificar a sessão. O modo local continua disponível.');
      return;
    }
    setSession(data.session, 'INITIAL_SESSION');
  });

  const refreshCloudIfStale = () => {
    if (!currentUser || cloudLoading || Date.now() - lastCloudRefreshAt < 15000) return;
    loadCloudProposals();
  };
  window.addEventListener('focus', refreshCloudIfStale);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshCloudIfStale();
  });
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

function csvCell(value) {
  const text = String(value ?? '').replace(/"/g, '""');
  return '"' + text + '"';
}

function csvDate(value) {
  const date = new Date(Number(value) || value || '');
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('pt-BR');
}

function exportProposalsCsv() {
  const source = currentUser ? cloudProposals : readProposals().slice().reverse();
  if (!source.length) {
    showToast('Ainda não há propostas para exportar.');
    return;
  }

  const header = [
    'Número', 'Cliente', 'Empresa', 'Status', 'Subtotal', 'Desconto',
    'Total', 'Validade', 'Criada em', 'Respondida em'
  ];
  const rows = source.map(proposal => {
    const subtotal = Number.isFinite(Number(proposal.subtotal))
      ? Number(proposal.subtotal)
      : Number(proposal.total) || Number(proposal.amount) || 0;
    const discount = Number.isFinite(Number(proposal.discountAmount)) ? Number(proposal.discountAmount) : 0;
    const total = Number(proposal.total) || Number(proposal.amount) || 0;
    return [
      proposal.number || '',
      proposal.client || '',
      proposal.business || '',
      proposalStatusLabel(proposal.status || 'draft'),
      subtotal.toFixed(2).replace('.', ','),
      discount.toFixed(2).replace('.', ','),
      total.toFixed(2).replace('.', ','),
      proposal.validUntil || '',
      csvDate(proposal.createdAt),
      proposal.respondedAt ? csvDate(proposal.respondedAt) : ''
    ];
  });

  const csv = '\uFEFF' + [header, ...rows]
    .map(row => row.map(csvCell).join(';'))
    .join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'docpronto-propostas-' + localDate(new Date()) + '.csv';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showToast('CSV exportado.');
}

function recentServiceCatalog() {
  const source = currentUser ? cloudProposals : readProposals().slice().reverse();
  const catalog = new Map();
  source.forEach(proposal => {
    const items = Array.isArray(proposal.items) ? proposal.items : [];
    items.forEach(item => {
      const description = String(item.description || '').trim();
      const key = description.toLocaleLowerCase('pt-BR');
      if (!description || catalog.has(key)) return;
      const unitPrice = Number(item.unitPrice);
      catalog.set(key, {
        description,
        unitPrice: Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : 0
      });
    });
  });
  return catalog;
}

function renderServiceSuggestions() {
  if (!serviceSuggestions) return;
  serviceSuggestions.innerHTML = Array.from(recentServiceCatalog().values())
    .slice(0, 60)
    .map(item => '<option value="' + escapeHtml(item.description) + '" label="' + escapeHtml(formatCurrency(item.unitPrice)) + '"></option>')
    .join('');
}

function applySavedService(row) {
  const descriptionInput = row?.querySelector('[data-description]');
  const priceInput = row?.querySelector('[data-unit-price]');
  if (!descriptionInput || !priceInput) return;
  const key = String(descriptionInput.value || '').trim().toLocaleLowerCase('pt-BR');
  const saved = recentServiceCatalog().get(key);
  if (!saved) return;
  if (!String(priceInput.value || '').trim() || Number(priceInput.value) === 0) {
    priceInput.value = String(saved.unitPrice);
    updateTotal();
    scheduleComposerDraftSave();
    showToast('Último preço deste item preenchido.');
  }
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

function currentPricing() {
  const validation = DocProntoCore.validateItems(readFormItems(), maxItems);
  if (!validation.ok) {
    return { ok: false, error: validation.error, items: validation.items, subtotal: 0, discount: 0, total: 0 };
  }
  const pricing = DocProntoCore.calculateDiscount(
    validation.total,
    discountTypeInput?.value || 'none',
    discountValueInput?.value || 0
  );
  return { ...pricing, items: validation.items };
}

function updateTotal() {
  const pricing = currentPricing();
  const subtotal = pricing.ok ? pricing.subtotal : 0;
  const discount = pricing.ok ? pricing.discount : 0;
  const total = pricing.ok ? pricing.total : subtotal;
  if (formSubtotal) formSubtotal.textContent = formatCurrency(subtotal);
  if (formDiscount) formDiscount.textContent = '− ' + formatCurrency(discount);
  if (formDiscountRow) formDiscountRow.hidden = discount <= 0;
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
      '<input data-description type="text" maxlength="160" list="service-suggestions" placeholder="Ex.: Instalação de tomadas" required>' +
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

function proposalStatusLabel(status) {
  return ({
    draft: 'Rascunho',
    sent: 'Enviada',
    approved: 'Aprovada',
    rejected: 'Recusada'
  })[status] || 'Rascunho';
}

function proposalIsExpired(proposal) {
  const status = proposal?.status || 'draft';
  if (status === 'approved' || status === 'rejected' || !proposal?.validUntil) return false;
  const validUntil = String(proposal.validUntil);
  return /^\d{4}-\d{2}-\d{2}$/.test(validUntil) && validUntil < localDate(new Date());
}

function proposalValidityInfo(proposal) {
  if (!proposal?.validUntil) return { label: '', tone: '' };
  const end = new Date(proposal.validUntil + 'T23:59:59');
  if (Number.isNaN(end.getTime())) return { label: '', tone: '' };
  const today = new Date();
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / 86400000);
  const status = proposal.status || 'draft';
  if (status === 'approved' || status === 'rejected') return { label: '', tone: '' };
  if (proposalIsExpired(proposal)) return { label: 'Expirada', tone: 'expired' };
  if (diffDays === 0) return { label: 'Expira hoje', tone: 'warning' };
  if (diffDays <= 3) return { label: 'Expira em ' + diffDays + ' dia' + (diffDays === 1 ? '' : 's'), tone: 'warning' };
  return { label: '', tone: '' };
}

function renderHistorySummary(source, selectedStatus = 'all') {
  if (!historySummary) return;
  const total = source.length;
  const sent = source.filter(item => (item.status || 'draft') === 'sent').length;
  const approvedTotal = source
    .filter(item => (item.status || 'draft') === 'approved')
    .reduce((sum, item) => sum + (Number(item.total) || Number(item.amount) || 0), 0);

  const activeClass = status => selectedStatus === status ? ' is-active' : '';
  historySummary.innerHTML =
    '<button class="summary-card' + activeClass('all') + '" type="button" data-summary-status="all" aria-pressed="' + (selectedStatus === 'all') + '" aria-label="Mostrar todas as propostas">' +
      '<span>Todas</span><strong>' + total + '</strong>' +
    '</button>' +
    '<button class="summary-card' + activeClass('sent') + '" type="button" data-summary-status="sent" aria-pressed="' + (selectedStatus === 'sent') + '" aria-label="Mostrar propostas enviadas">' +
      '<span>Enviadas</span><strong>' + sent + '</strong>' +
    '</button>' +
    '<button class="summary-card summary-approved' + activeClass('approved') + '" type="button" data-summary-status="approved" aria-pressed="' + (selectedStatus === 'approved') + '" aria-label="Mostrar propostas aprovadas">' +
      '<span>Aprovadas</span><strong>' + formatCurrency(approvedTotal) + '</strong>' +
    '</button>';
}

function normalizeWhatsAppPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return '';
  return digits.startsWith('55') ? digits : '55' + digits;
}

function proposalShareText(proposal) {
  const total = Number.isFinite(Number(proposal.total)) ? Number(proposal.total) : Number(proposal.amount) || 0;
  const validUntil = proposal.validUntil
    ? new Date(proposal.validUntil + 'T00:00:00').toLocaleDateString('pt-BR')
    : 'não informada';
  return `Olá, ${proposal.client}! Segue a proposta ${proposal.number} da ${proposal.business}, no valor de ${formatCurrency(total)}. Validade: ${validUntil}. Posso te enviar o PDF por aqui.`;
}

function buildClientShareUrl(proposalId, token) {
  const url = new URL(location.href);
  url.search = '';
  const shareParams = new URLSearchParams();
  shareParams.set('proposta', proposalId);
  shareParams.set('token', token);
  url.hash = shareParams.toString();
  return url.toString();
}

async function publishClientProposal(proposal, { confirmReplacement = true } = {}) {
  if (!supabaseClient || !currentUser) throw new Error('Entre na sua conta para criar um link.');
  if (proposal.status === 'sent' && confirmReplacement &&
      !window.confirm('Gerar um novo link invalida o link anterior. Continuar?')) {
    return null;
  }

  const token = generateShareToken();
  const { error } = await supabaseClient
    .from(proposalTable)
    .update({
      share_token_hash: await sha256Hex(token),
      status: 'sent',
      responded_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', proposal.id);
  if (error) throw error;

  const updated = { ...proposal, status: 'sent', respondedAt: null, updatedAt: Date.now() };
  cloudProposals = cloudProposals.map(item => item.id === proposal.id ? updated : item);
  return { url: buildClientShareUrl(proposal.id, token), updated };
}


function renderProposal(proposal) {
  const items = Array.isArray(proposal.items) && proposal.items.length
    ? proposal.items
    : [{ description: proposal.scope || 'Serviço', quantity: 1, unitPrice: proposal.amount || 0, subtotal: proposal.amount || 0 }];
  const total = Number.isFinite(Number(proposal.total)) ? Number(proposal.total) : Number(proposal.amount) || 0;
  const subtotal = Number.isFinite(Number(proposal.subtotal)) ? Number(proposal.subtotal) : items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
  const discountAmount = Number.isFinite(Number(proposal.discountAmount)) ? Number(proposal.discountAmount) : Math.max(0, subtotal - total);
  const itemRows = items.map(item =>
    '<tr><td>' + escapeHtml(item.description) + '</td>' +
    '<td class="number">' + Number(item.quantity || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '</td>' +
    '<td class="number">' + formatCurrency(item.unitPrice) + '</td>' +
    '<td class="number">' + formatCurrency(item.subtotal) + '</td></tr>'
  ).join('');

  openedProposalId = proposal.id;
  const status = proposal.status || 'draft';
  const brandColor = normalizeBrandColor(proposal.brandColor);
  const clientDetails = [
    proposal.clientDocument ? '<span><b>Documento:</b> ' + escapeHtml(proposal.clientDocument) + '</span>' : '',
    proposal.clientEmail ? '<span><b>E-mail:</b> ' + escapeHtml(proposal.clientEmail) + '</span>' : '',
    proposal.clientAddress ? '<span class="client-address"><b>Endereço:</b> ' + escapeHtml(proposal.clientAddress) + '</span>' : ''
  ].filter(Boolean).join('');
  const shareText = proposalShareText(proposal);
  const whatsappPhone = normalizeWhatsAppPhone(proposal.clientPhone);
  result.innerHTML =
    '<article class="proposal" id="proposal" style="--proposal-accent:' + brandColor + '">' +
      '<header class="proposal-document-head">' +
        '<div><span class="proposal-document-brand">DocPronto.</span><small>PROPOSTA ' + escapeHtml(proposal.number) + '</small></div>' +
        '<span class="proposal-status status-' + escapeHtml(status) + '">' + proposalStatusLabel(status) + '</span>' +
      '</header>' +
      '<div class="proposal-heading">' +
        '<div><span class="proposal-label">EMPRESA</span><h3>' + escapeHtml(proposal.business) + '</h3>' + (proposal.businessPhone ? '<p>' + escapeHtml(proposal.businessPhone) + '</p>' : '') + '</div>' +
        '<div class="proposal-client-block"><span class="proposal-label">CLIENTE</span><strong>' + escapeHtml(proposal.client) + '</strong></div>' +
      '</div>' +
      '<div class="proposal-meta">Emitida em ' + new Date(proposal.createdAt).toLocaleDateString('pt-BR') + ' · válida até ' + (proposal.validUntil ? new Date(proposal.validUntil + 'T00:00:00').toLocaleDateString('pt-BR') : 'não informada') +
        (proposal.respondedAt && (status === 'approved' || status === 'rejected')
          ? ' · respondida em ' + new Date(proposal.respondedAt).toLocaleDateString('pt-BR')
          : '') + '</div>' +
      (clientDetails ? '<div class="proposal-client-details">' + clientDetails + '</div>' : '') +
      '<div class="proposal-table-wrap"><table class="proposal-table">' +
        '<thead><tr><th>Serviço ou material</th><th class="number">Qtd.</th><th class="number">Unitário</th><th class="number">Subtotal</th></tr></thead>' +
        '<tbody>' + itemRows + '</tbody>' +
      '</table></div>' +
      '<div class="document-totals">' +
        '<div><span>Subtotal</span><strong>' + formatCurrency(subtotal) + '</strong></div>' +
        (discountAmount > 0 ? '<div class="document-discount"><span>Desconto</span><strong>− ' + formatCurrency(discountAmount) + '</strong></div>' : '') +
        '<div class="amount-line"><span>Total do orçamento</span><strong class="amount">' + formatCurrency(total) + '</strong></div>' +
      '</div>' +
      '<p><b>Prazo:</b> ' + escapeHtml(proposal.deadline) + '</p>' +
      '<p><b>Condições de pagamento:</b> ' + escapeHtml(proposal.terms) + '</p>' +
      (proposal.notes ? '<section class="proposal-notes"><span class="proposal-label">OBSERVAÇÕES</span><p>' + escapeHtml(proposal.notes) + '</p></section>' : '') +
      '<div class="proposal-actions">' +
        '<button class="secondary" id="print" type="button">Imprimir / salvar PDF</button>' +
        '<button class="secondary" id="copy-proposal-summary" type="button">Copiar resumo</button>' +
        '<a class="secondary" id="share-whatsapp" target="_blank" rel="noopener">' + (currentUser ? 'Enviar resumo' : 'Enviar no WhatsApp') + '</a>' +
        (currentUser && (status === 'draft' || status === 'sent')
          ? '<button class="secondary" id="send-client-link-whatsapp" type="button">Enviar proposta no WhatsApp</button>' +
            '<button class="secondary" id="create-client-link" type="button">' + (status === 'sent' ? 'Gerar novo link' : 'Copiar link do cliente') + '</button>'
          : '') +
      '</div>' +
      ((status === 'approved' || status === 'rejected')
        ? '<p class="proposal-closed-note">Esta proposta está encerrada. Para alterar valores ou condições, use-a como modelo e gere uma nova proposta.</p>'
        : '') +
    '</article>';
  result.classList.add('show');
  document.querySelector('#print').addEventListener('click', () => {
    const previousTitle = document.title;
    document.title = 'Proposta ' + proposal.number + ' - ' + proposal.client;
    window.print();
    window.setTimeout(() => { document.title = previousTitle; }, 500);
  });
  document.querySelector('#copy-proposal-summary').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      showToast('Resumo da proposta copiado.');
    } catch {
      showToast('Não foi possível copiar o resumo.');
    }
  });
  document.querySelector('#share-whatsapp').href = 'https://wa.me/' + whatsappPhone + '?text=' + encodeURIComponent(shareText);
  const clientLinkButton = document.querySelector('#create-client-link');
  clientLinkButton?.addEventListener('click', async () => {
    clientLinkButton.disabled = true;
    try {
      const published = await publishClientProposal(proposal);
      if (!published) {
        clientLinkButton.disabled = false;
        return;
      }
      await navigator.clipboard.writeText(published.url);
      renderHistory();
      renderProposal(published.updated);
      showToast('Link do cliente copiado. A proposta foi marcada como enviada.');
    } catch (error) {
      console.error(error);
      clientLinkButton.disabled = false;
      showToast('Não foi possível criar ou copiar o link do cliente.');
    }
  });

  const sendClientLinkButton = document.querySelector('#send-client-link-whatsapp');
  sendClientLinkButton?.addEventListener('click', async () => {
    const whatsappWindow = window.open('about:blank', '_blank');
    if (whatsappWindow) whatsappWindow.opener = null;
    sendClientLinkButton.disabled = true;
    try {
      const published = await publishClientProposal(proposal);
      if (!published) {
        whatsappWindow?.close();
        sendClientLinkButton.disabled = false;
        return;
      }
      const message = proposalShareText(published.updated) +
        '\n\nAbra a proposta para ver os detalhes e responder: ' + published.url;
      const target = 'https://wa.me/' + whatsappPhone + '?text=' + encodeURIComponent(message);
      renderHistory();
      renderProposal(published.updated);
      if (whatsappWindow) whatsappWindow.location.href = target;
      else window.location.href = target;
    } catch (error) {
      console.error(error);
      whatsappWindow?.close();
      sendClientLinkButton.disabled = false;
      showToast('Não foi possível preparar o envio da proposta.');
    }
  });
}

function renderHistory() {
  renderServiceSuggestions();
  const selectedStatus = proposalStatusFilter?.value || 'all';
  const selectedSort = proposalSort?.value || 'recent';
  const searchTerm = String(proposalSearch?.value || '').trim().toLocaleLowerCase('pt-BR');
  const source = currentUser ? cloudProposals : readProposals().slice().reverse();
  renderHistorySummary(source, selectedStatus);
  const filteredProposals = source
    .filter(proposal => {
      if (selectedStatus === 'all') return true;
      if (selectedStatus === 'expired') return proposalIsExpired(proposal);
      return (proposal.status || 'draft') === selectedStatus;
    })
    .filter(proposal => {
      if (!searchTerm) return true;
      return [proposal.client, proposal.business, proposal.number]
        .some(value => String(value || '').toLocaleLowerCase('pt-BR').includes(searchTerm));
    })
    .sort((a, b) => {
      if (selectedSort === 'oldest') return Number(a.createdAt || 0) - Number(b.createdAt || 0);
      if (selectedSort === 'value-desc') {
        return (Number(b.total) || Number(b.amount) || 0) - (Number(a.total) || Number(a.amount) || 0);
      }
      if (selectedSort === 'expiry') {
        const aExpiry = a.validUntil || '9999-12-31';
        const bExpiry = b.validUntil || '9999-12-31';
        return aExpiry.localeCompare(bExpiry) || Number(b.createdAt || 0) - Number(a.createdAt || 0);
      }
      return Number(b.createdAt || 0) - Number(a.createdAt || 0);
    });
  const proposals = filteredProposals.slice(0, historyVisibleLimit);
  if (historyMoreButton) {
    const remaining = Math.max(0, filteredProposals.length - historyVisibleLimit);
    historyMoreButton.hidden = remaining === 0;
    historyMoreButton.textContent = remaining > 0 ? 'Mostrar mais (' + remaining + ')' : 'Mostrar mais';
  }
  const hasFilters = selectedStatus !== 'all' || Boolean(searchTerm);
  const emptyTitle = source.length
    ? (hasFilters ? 'Nenhuma proposta encontrada' : 'Nenhuma proposta disponível')
    : 'Sua primeira proposta começa aqui';
  const emptyText = source.length
    ? 'Tente outro termo de busca ou ajuste o filtro de status.'
    : currentUser
      ? 'Crie um orçamento ao lado. Ele será salvo na sua conta e aparecerá aqui.'
      : 'Preencha o orçamento ao lado. Depois de gerar, ele fica salvo neste navegador e aparece aqui.';
  list.innerHTML = proposals.length
    ? proposals.map(proposal => {
      const total = Number.isFinite(Number(proposal.total)) ? Number(proposal.total) : Number(proposal.amount) || 0;
      const status = proposal.status || 'draft';
      const validity = proposalValidityInfo(proposal);
      const validityBadge = validity.label
        ? '<span class="validity-badge validity-' + validity.tone + '">' + escapeHtml(validity.label) + '</span>'
        : '';
      return '<div class="item"><div class="item-summary"><div class="item-title-line"><strong>' + escapeHtml(proposal.client) + '</strong><span class="proposal-status status-' + escapeHtml(status) + '">' + proposalStatusLabel(status) + '</span></div>' +
        '<small>' + escapeHtml(proposal.number) + ' · ' + formatCurrency(total) + '</small>' +
        (proposal.respondedAt && (status === 'approved' || status === 'rejected')
          ? '<small class="response-time">Respondida em ' + new Date(proposal.respondedAt).toLocaleDateString('pt-BR') + ' às ' + new Date(proposal.respondedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + '</small>'
          : '') +
        validityBadge + '</div>' +
        '<div class="item-actions">' +
          '<select class="proposal-status-select" data-status-id="' + escapeHtml(proposal.id) + '" aria-label="Status da proposta"' + ((status === 'approved' || status === 'rejected') ? ' disabled' : '') + '>' +
            '<option value="draft"' + (status === 'draft' ? ' selected' : '') + '>Rascunho</option>' +
            '<option value="sent"' + (status === 'sent' ? ' selected' : '') + '>Enviada</option>' +
            '<option value="approved"' + (status === 'approved' ? ' selected' : '') + '>Aprovada</option>' +
            '<option value="rejected"' + (status === 'rejected' ? ' selected' : '') + '>Recusada</option>' +
          '</select>' +
          '<button class="secondary" type="button" data-proposal="' + escapeHtml(proposal.id) + '">Abrir</button>' +
          '<button class="secondary" type="button" data-template="' + escapeHtml(proposal.id) + '">Usar como modelo</button>' +
          ((status === 'approved' || status === 'rejected')
            ? '<button class="secondary" type="button" data-reopen="' + escapeHtml(proposal.id) + '">Reabrir</button>'
            : '<button class="secondary" type="button" data-edit="' + escapeHtml(proposal.id) + '">Editar</button>') +
          '<button class="secondary" type="button" data-delete="' + escapeHtml(proposal.id) + '" aria-label="Excluir proposta">Excluir</button>' +
        '</div></div>';
    }).join('')
    : '<div class="empty"><span class="empty-icon" aria-hidden="true">＋</span><strong>' + emptyTitle + '</strong><span>' + emptyText + '</span></div>';
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const values = Object.fromEntries(new FormData(form));
  const pricing = currentPricing();
  if (!pricing.ok) {
    showToast(pricing.error);
    return;
  }
  const items = pricing.items;
  const subtotal = pricing.subtotal;
  const discountAmount = pricing.discount;
  const total = pricing.total;

  const now = Date.now();
  const proposals = visibleProposals();
  const existing = editingId ? proposals.find(item => item.id === editingId) : null;
  if (editingId && !existing) {
    resetComposer();
    showToast('Essa proposta não está mais no histórico. Crie uma nova proposta.');
    return;
  }

  const fields = {
    business: String(values.business || '').trim(),
    client: String(values.client || '').trim(),
    clientPhone: String(values.clientPhone || '').trim(),
    clientEmail: String(values.clientEmail || '').trim(),
    clientDocument: String(values.clientDocument || '').trim(),
    clientAddress: String(values.clientAddress || '').trim(),
    items: items,
    subtotal: subtotal,
    discountType: ['percent', 'fixed'].includes(values.discountType) ? values.discountType : 'none',
    discountValue: Number(values.discountValue || 0),
    discountAmount: discountAmount,
    total: total,
    amount: total,
    scope: items.map(item => item.description).join(', '),
    deadline: String(values.deadline || '').trim(),
    terms: String(values.terms || '').trim(),
    notes: String(values.notes || '').trim(),
    businessPhone: String(values.businessPhone || '').trim(),
    validUntil: values.validUntil,
    brandColor: existing?.brandColor || accountBusinessProfile().brandColor,
    status: existing?.status || 'draft'
  };
  const proposal = existing
    ? { ...existing, ...fields, updatedAt: now }
    : {
        ...fields,
        id: makeUuid(),
        number: 'DP-' + new Date(now).getFullYear() + '-' + String(Math.floor(Math.random() * 1000000)).padStart(6, '0'),
        createdAt: now
      };
  if (currentUser) {
    submitButton.disabled = true;
    try {
      const saved = await saveCloudProposal(proposal);
      cloudProposals = [saved, ...cloudProposals.filter(item => item.id !== saved.id)]
        .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
        .slice(0, 100);
      renderProposal(saved);
      renderHistory();
      if (existing) resetComposer();
      else clearComposerDraft();
      showToast(existing ? 'Proposta atualizada na nuvem.' : 'Proposta salva na nuvem.');
    } catch {
      showAccountMessage('Falha ao salvar na nuvem. Confira a conexão; os dados continuam no formulário.');
      showToast('Não foi possível sincronizar a proposta.');
    } finally {
      submitButton.disabled = false;
    }
    return;
  }

  const nextProposals = existing
    ? proposals.map(item => item.id === existing.id ? proposal : item)
    : proposals.concat(proposal).slice(-100);
  localStorage.setItem(storageKey, JSON.stringify(nextProposals));
  renderProposal(proposal);
  renderHistory();
  if (existing) resetComposer();
  else clearComposerDraft();
  showToast(existing ? 'Proposta atualizada neste navegador.' : 'Proposta salva neste navegador.');
});

itemFields.addEventListener('input', updateTotal);
discountTypeInput?.addEventListener('change', () => {
  const enabled = discountTypeInput.value !== 'none';
  discountValueInput.disabled = !enabled;
  if (!enabled) discountValueInput.value = '0';
  if (enabled && Number(discountValueInput.value) === 0) discountValueInput.select?.();
  updateTotal();
});
discountValueInput?.addEventListener('input', updateTotal);
form.addEventListener('input', scheduleComposerDraftSave);
form.addEventListener('change', scheduleComposerDraftSave);
itemFields.addEventListener('change', event => {
  const descriptionInput = event.target.closest('[data-description]');
  if (descriptionInput) applySavedService(descriptionInput.closest('.line-item'));
});
itemFields.addEventListener('click', event => {
  const removeButton = event.target.closest('.remove-item');
  if (!removeButton || itemFields.querySelectorAll('.line-item').length <= 1) return;
  removeButton.closest('.line-item').remove();
  updateItemControls();
  updateTotal();
});
addItemButton.addEventListener('click', () => addItem());
proposalStatusFilter?.addEventListener('change', () => {
  historyVisibleLimit = 10;
  renderHistory();
});
proposalSearch?.addEventListener('input', () => {
  historyVisibleLimit = 10;
  renderHistory();
});
proposalSort?.addEventListener('change', () => {
  historyVisibleLimit = 10;
  renderHistory();
});
historyMoreButton?.addEventListener('click', () => {
  historyVisibleLimit += 10;
  renderHistory();
});
exportCsvButton?.addEventListener('click', exportProposalsCsv);
historySummary?.addEventListener('click', event => {
  const button = event.target.closest('[data-summary-status]');
  if (!button || !proposalStatusFilter) return;
  proposalStatusFilter.value = button.dataset.summaryStatus || 'all';
  if (proposalSearch) proposalSearch.value = '';
  historyVisibleLimit = 10;
  renderHistory();
});

list.addEventListener('change', async event => {
  const select = event.target.closest('[data-status-id]');
  if (!select) return;
  const proposal = visibleProposals().find(item => item.id === select.dataset.statusId);
  if (!proposal) return;
  const status = select.value;
  if (!['draft', 'sent', 'approved', 'rejected'].includes(status)) return;

  const terminalStatus = status === 'approved' || status === 'rejected';
  const updated = {
    ...proposal,
    status,
    respondedAt: terminalStatus ? (proposal.respondedAt || Date.now()) : null,
    updatedAt: Date.now()
  };
  select.disabled = true;
  try {
    if (currentUser) {
      const saved = await saveCloudProposal(updated);
      cloudProposals = [saved, ...cloudProposals.filter(item => item.id !== saved.id)]
        .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
        .slice(0, 100);
      if (openedProposalId === saved.id) renderProposal(saved);
    } else {
      const next = readProposals().map(item => item.id === updated.id ? updated : item);
      localStorage.setItem(storageKey, JSON.stringify(next));
      if (openedProposalId === updated.id) renderProposal(updated);
    }
    renderHistory();
    showToast('Status atualizado para ' + proposalStatusLabel(status) + '.');
  } catch {
    select.disabled = false;
    showToast('Não foi possível atualizar o status.');
  }
});

list.addEventListener('click', async event => {
  const reopenButton = event.target.closest('[data-reopen]');
  if (reopenButton) {
    if (!window.confirm('Reabrir esta proposta como rascunho? O link público anterior será invalidado.')) return;
    const id = reopenButton.dataset.reopen;
    const proposal = visibleProposals().find(item => item.id === id);
    if (!proposal) return;
    const updated = { ...proposal, status: 'draft', respondedAt: null, updatedAt: Date.now() };
    reopenButton.disabled = true;
    try {
      if (currentUser) {
        const { error } = await supabaseClient
          .from(proposalTable)
          .update({
            status: 'draft',
            responded_at: null,
            share_token_hash: null,
            proposal_data: updated,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
        if (error) throw error;
        cloudProposals = cloudProposals.map(item => item.id === id ? updated : item);
      } else {
        localStorage.setItem(storageKey, JSON.stringify(readProposals().map(item => item.id === id ? updated : item)));
      }
      if (openedProposalId === id) renderProposal(updated);
      renderHistory();
      showToast('Proposta reaberta como rascunho.');
    } catch (error) {
      console.error(error);
      reopenButton.disabled = false;
      showToast('Não foi possível reabrir a proposta.');
    }
    return;
  }

  const removeButton = event.target.closest('[data-delete]');
  if (removeButton) {
    if (!window.confirm(currentUser ? 'Excluir esta proposta da sua conta?' : 'Excluir esta proposta deste navegador?')) return;
    const id = removeButton.dataset.delete;
    if (currentUser) {
      const { error } = await supabaseClient.from(proposalTable).delete().eq('id', id);
      if (error) {
        showToast('Não foi possível excluir a proposta.');
        return;
      }
      cloudProposals = cloudProposals.filter(item => item.id !== id);
      if (openedProposalId === id) {
        openedProposalId = null;
        result.classList.remove('show');
        result.innerHTML = '';
      }
      renderHistory();
      showToast('Proposta removida da nuvem.');
    } else {
      localStorage.setItem(storageKey, JSON.stringify(readProposals().filter(item => item.id !== id)));
      if (openedProposalId === id) {
        openedProposalId = null;
        result.classList.remove('show');
        result.innerHTML = '';
      }
      renderHistory();
      showToast('Proposta removida deste navegador.');
    }
    return;
  }

  const templateButton = event.target.closest('[data-template]');
  if (templateButton) {
    const proposal = visibleProposals().find(item => item.id === templateButton.dataset.template);
    if (proposal) {
      beginEditing(proposal);
      editingId = null;
      submitButton.textContent = 'Gerar nova proposta';
      cancelEditButton.hidden = true;
      validityInput.value = defaultValidityDate();
      showToast('Modelo carregado. Revise os dados e gere uma nova proposta.');
    }
    return;
  }

  const editButton = event.target.closest('[data-edit]');
  if (editButton) {
    const proposal = visibleProposals().find(item => item.id === editButton.dataset.edit);
    if (proposal) beginEditing(proposal);
    return;
  }

  const button = event.target.closest('[data-proposal]');
  if (!button) return;
  const proposal = visibleProposals().find(item => item.id === button.dataset.proposal);
  if (proposal) renderProposal(proposal);
});


function publicStatusText(status) {
  return status === 'approved' ? 'Aprovada'
    : status === 'rejected' ? 'Recusada'
    : status === 'sent' ? 'Aguardando resposta'
    : 'Indisponível';
}

function renderPublicProposal(proposal) {
  const container = document.querySelector('#public-proposal-content');
  const brandColor = normalizeBrandColor(proposal.brandColor);
  const publicClientDetails = [
    proposal.clientDocument ? '<span><b>Documento:</b> ' + escapeHtml(proposal.clientDocument) + '</span>' : '',
    proposal.clientEmail ? '<span><b>E-mail:</b> ' + escapeHtml(proposal.clientEmail) + '</span>' : '',
    proposal.clientAddress ? '<span class="client-address"><b>Endereço:</b> ' + escapeHtml(proposal.clientAddress) + '</span>' : ''
  ].filter(Boolean).join('');
  container.style.setProperty('--proposal-accent', brandColor);
  document.title = 'Proposta ' + proposal.number + ' · ' + proposal.business;
  const items = Array.isArray(proposal.items) ? proposal.items : [];
  const subtotal = Number.isFinite(Number(proposal.subtotal)) ? Number(proposal.subtotal) : items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
  const discountAmount = Number.isFinite(Number(proposal.discountAmount)) ? Number(proposal.discountAmount) : Math.max(0, subtotal - Number(proposal.total || 0));
  const rows = items.map(item =>
    '<tr><td>' + escapeHtml(item.description || '') + '</td>' +
    '<td class="number">' + Number(item.quantity || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '</td>' +
    '<td class="number">' + formatCurrency(item.unitPrice) + '</td>' +
    '<td class="number">' + formatCurrency(item.subtotal) + '</td></tr>'
  ).join('');
  const expired = typeof proposal.expired === 'boolean'
    ? proposal.expired
    : Boolean(proposal.validUntil && proposal.validUntil < localDate(new Date()));
  const canRespond = proposal.status === 'sent' && !expired;
  container.innerHTML =
    '<div class="public-proposal-head"><div><span class="proposal-document-brand">DocPronto.</span><p class="eyebrow">PROPOSTA ' + escapeHtml(proposal.number) + '</p><h2>' + escapeHtml(proposal.business) + '</h2></div>' +
    '<span class="proposal-status status-' + escapeHtml(proposal.status) + '">' + publicStatusText(proposal.status) + '</span></div>' +
    '<div class="public-client"><span class="proposal-label">PREPARADA PARA</span><strong>' + escapeHtml(proposal.client) + '</strong></div>' +
    (publicClientDetails ? '<div class="proposal-client-details public-client-details">' + publicClientDetails + '</div>' : '') +
    '<div class="proposal-table-wrap"><table class="proposal-table"><thead><tr><th>Serviço ou material</th><th class="number">Qtd.</th><th class="number">Unitário</th><th class="number">Subtotal</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<div class="document-totals">' +
      '<div><span>Subtotal</span><strong>' + formatCurrency(subtotal) + '</strong></div>' +
      (discountAmount > 0 ? '<div class="document-discount"><span>Desconto</span><strong>− ' + formatCurrency(discountAmount) + '</strong></div>' : '') +
      '<div class="amount-line"><span>Total da proposta</span><strong class="amount">' + formatCurrency(proposal.total) + '</strong></div>' +
    '</div>' +
    '<div class="public-details"><p><b>Prazo:</b> ' + escapeHtml(proposal.deadline || 'Não informado') + '</p><p><b>Pagamento:</b> ' + escapeHtml(proposal.terms || 'Não informado') + '</p><p><b>Validade:</b> ' + (proposal.validUntil ? new Date(proposal.validUntil + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informada') + '</p>' +
    (proposal.businessPhone ? '<p><b>Contato:</b> ' + escapeHtml(proposal.businessPhone) + '</p>' : '') + '</div>' +
    (proposal.notes ? '<section class="proposal-notes public-notes"><span class="proposal-label">OBSERVAÇÕES</span><p>' + escapeHtml(proposal.notes) + '</p></section>' : '') +
    '<div class="public-document-actions"><button class="secondary" id="public-print" type="button">Imprimir / salvar PDF</button></div>' +
        (expired ? '<div class="public-response-note">Esta proposta expirou.</div>' :
      proposal.status === 'approved' ? '<div class="public-response-note success">Você aprovou esta proposta.</div>' :
      proposal.status === 'rejected' ? '<div class="public-response-note rejected">Você recusou esta proposta.</div>' :
      canRespond ? '<div class="public-response-actions"><button class="primary" id="public-approve" type="button">Aprovar proposta</button><button class="secondary public-reject" id="public-reject" type="button">Recusar</button></div>' :
      '<div class="public-response-note">Esta proposta não está disponível para resposta.</div>');

  document.querySelector('#public-print')?.addEventListener('click', () => {
    const previousTitle = document.title;
    document.title = 'Proposta ' + proposal.number + ' - ' + proposal.client;
    window.print();
    window.setTimeout(() => { document.title = previousTitle; }, 500);
  });

  if (canRespond) {
    document.querySelector('#public-approve').addEventListener('click', () => submitPublicResponse('approved'));
    document.querySelector('#public-reject').addEventListener('click', () => submitPublicResponse('rejected'));
  }
}

async function loadPublicProposal() {
  const container = document.querySelector('#public-proposal-content');
  if (!supabaseClient) {
    container.innerHTML = '<h2>Proposta indisponível</h2><p>Não foi possível conectar ao serviço.</p>';
    return;
  }
  try {
    const { data, error } = await supabaseClient.functions.invoke('proposal-public', {
      body: { proposalId: publicProposalId, token: publicProposalToken }
    });
    if (error) throw error;
    renderPublicProposal(data);
  } catch (error) {
    console.error(error);
    container.innerHTML = '<h2>Proposta indisponível</h2><p>O link pode ter expirado ou sido substituído por um novo.</p>';
  }
}

async function submitPublicResponse(decision) {
  const approve = document.querySelector('#public-approve');
  const reject = document.querySelector('#public-reject');
  if (approve) approve.disabled = true;
  if (reject) reject.disabled = true;
  try {
    const { data, error } = await supabaseClient.functions.invoke('proposal-response', {
      body: { proposalId: publicProposalId, token: publicProposalToken, decision }
    });
    if (error) throw error;
    const refreshed = await supabaseClient.functions.invoke('proposal-public', {
      body: { proposalId: publicProposalId, token: publicProposalToken }
    });
    if (refreshed.error) throw refreshed.error;
    renderPublicProposal(refreshed.data);
  } catch (error) {
    console.error(error);
    showToast('Não foi possível registrar a resposta.');
    if (approve) approve.disabled = false;
    if (reject) reject.disabled = false;
  }
}

function initPublicProposalMode() {
  document.querySelector('meta[name="robots"]')?.setAttribute('content', 'noindex,nofollow,noarchive');
  document.querySelector('meta[name="referrer"]')?.setAttribute('content', 'no-referrer');
  document.querySelector('.hero').hidden = true;
  document.querySelector('#app-grid').hidden = true;
  document.querySelector('#benefits-section').hidden = true;
  document.querySelector('#local-import-banner').hidden = true;
  document.querySelector('.nav-actions').hidden = true;
  document.querySelector('#public-proposal-view').hidden = false;
  loadPublicProposal();
}


if (publicProposalMode) {
  initPublicProposalMode();
} else {
  addItem();
  prefillBusinessFields(readProposals());
  const restoredDraft = restoreComposerDraft();
  renderHistory();
  initAccount();
  if (restoredDraft) window.setTimeout(() => showToast('Rascunho recuperado.'), 80);
}
