const form = document.querySelector('#form');
const result = document.querySelector('#result');
const list = document.querySelector('#list');
const itemFields = document.querySelector('#item-fields');
const addItemButton = document.querySelector('#add-item');
const formTotal = document.querySelector('#form-total');
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
const historySummary = document.querySelector('#history-summary');
const supabaseClient = window.DOC_PRONTO_SUPABASE?.client || null;
const proposalTable = 'docpronto_proposals';
const pageParams = new URLSearchParams(location.search);
const publicProposalId = pageParams.get('proposta')?.trim() || '';
const publicProposalToken = pageParams.get('token')?.trim() || '';
const publicProposalMode = Boolean(publicProposalId && publicProposalToken);
let currentUser = null;
let cloudProposals = [];
let cloudClients = [];
let cloudLoading = false;
let passwordRecovery = false;
let openedProposalId = null;

const contactField = document.createElement('label');
contactField.className = 'field';
contactField.innerHTML = '<span>Telefone ou WhatsApp do negócio (opcional)</span><input name="businessPhone" type="tel" placeholder="(11) 99999-9999">';
form.querySelector('[name="business"]').closest('label').after(contactField);
const clientContactField = document.createElement('label');
clientContactField.className = 'field';
clientContactField.innerHTML = '<span>WhatsApp do cliente (opcional)</span><input name="clientPhone" type="tel" inputmode="tel" placeholder="(11) 99999-9999"><small class="field-help">Usado apenas para facilitar o compartilhamento da proposta.</small>';
form.querySelector('[name="client"]').closest('label').after(clientContactField);
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
    deadline: form.querySelector('[name="deadline"]')?.value || '',
    terms: form.querySelector('[name="terms"]')?.value || '',
    validUntil: validityInput?.value || '',
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
    draft.deadline, draft.terms
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
  const deadline = form.querySelector('[name="deadline"]');
  const terms = form.querySelector('[name="terms"]');

  if (business) business.value = draft.business || business.value;
  if (businessPhone) businessPhone.value = draft.businessPhone || '';
  if (client) client.value = draft.client || '';
  if (clientPhone) clientPhone.value = draft.clientPhone || '';
  if (deadline) deadline.value = draft.deadline || '';
  if (terms) terms.value = draft.terms || '';
  if (draft.validUntil) validityInput.value = draft.validUntil;

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

function visibleProposals() {
  return currentUser ? cloudProposals : readProposals();
}

function prefillBusinessFields(proposals) {
  if (editingId || !Array.isArray(proposals) || proposals.length === 0) return;
  const businessInput = form.querySelector('[name="business"]');
  const phoneInput = form.querySelector('[name="businessPhone"]');
  if (!businessInput || businessInput.value.trim()) return;

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

async function loadCloudClients() {
  if (!supabaseClient || !currentUser) return;
  const ownerId = currentUser.id;
  const { data, error } = await supabaseClient
    .from('docpronto_clients')
    .select('id,name,name_key,phone,email,updated_at')
    .order('updated_at', { ascending: false })
    .limit(100);
  if (currentUser?.id !== ownerId) return;
  if (error) {
    console.warn('DocPronto clientes não puderam ser carregados:', error.message);
    return;
  }
  cloudClients = data || [];
  renderClientSuggestions();
}

async function syncClientRecord(proposal) {
  if (!supabaseClient || !currentUser) return;
  const name = String(proposal.client || '').trim();
  if (!name) return;
  const nameKey = name.toLocaleLowerCase('pt-BR');
  const phone = String(proposal.clientPhone || '').trim() || null;
  const existing = cloudClients.find(client => client.name_key === nameKey);

  if (existing) {
    const { data, error } = await supabaseClient
      .from('docpronto_clients')
      .update({ name, phone, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('id,name,name_key,phone,email,updated_at')
      .single();
    if (error) throw error;
    cloudClients = [data, ...cloudClients.filter(client => client.id !== data.id)];
  } else {
    const { data, error } = await supabaseClient
      .from('docpronto_clients')
      .insert({ user_id: currentUser.id, name, phone })
      .select('id,name,name_key,phone,email,updated_at')
      .single();
    if (error) throw error;
    cloudClients = [data, ...cloudClients];
  }
  renderClientSuggestions();
}

function applySavedClient() {
  if (!currentUser) return;
  const input = form.querySelector('[name="client"]');
  const key = String(input.value || '').trim().toLocaleLowerCase('pt-BR');
  const client = cloudClients.find(item => item.name_key === key);
  if (!client) return;
  form.querySelector('[name="clientPhone"]').value = client.phone || '';
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
  prefillBusinessFields(cloudProposals);
  renderHistory();
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
  accountOpenButton.addEventListener('click', () => accountDialog.showModal());
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
    if (user?.id === activeUserId) {
      updateAccountUi();
      return;
    }
    activeUserId = user?.id || null;
    currentUser = user;
    cloudProposals = [];
    cloudClients = [];
    renderClientSuggestions();
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
  const validation = DocProntoCore.validateItems(readFormItems(), maxItems);
  formTotal.textContent = formatCurrency(validation.total);
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

function proposalStatusLabel(status) {
  return ({
    draft: 'Rascunho',
    sent: 'Enviada',
    approved: 'Aprovada',
    rejected: 'Recusada'
  })[status] || 'Rascunho';
}

function proposalValidityInfo(proposal) {
  if (!proposal?.validUntil) return { label: '', tone: '' };
  const end = new Date(proposal.validUntil + 'T23:59:59');
  if (Number.isNaN(end.getTime())) return { label: '', tone: '' };
  const today = new Date();
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / 86400000);
  const status = proposal.status || 'draft';
  if (status === 'approved' || status === 'rejected') return { label: '', tone: '' };
  if (diffDays < 0) return { label: 'Expirada', tone: 'expired' };
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

  openedProposalId = proposal.id;
  const status = proposal.status || 'draft';
  const shareText = proposalShareText(proposal);
  const whatsappPhone = normalizeWhatsAppPhone(proposal.clientPhone);
  result.innerHTML =
    '<article class="proposal" id="proposal">' +
      '<header class="proposal-document-head">' +
        '<div><span class="proposal-document-brand">DocPronto.</span><small>PROPOSTA ' + escapeHtml(proposal.number) + '</small></div>' +
        '<span class="proposal-status status-' + escapeHtml(status) + '">' + proposalStatusLabel(status) + '</span>' +
      '</header>' +
      '<div class="proposal-heading">' +
        '<div><span class="proposal-label">EMPRESA</span><h3>' + escapeHtml(proposal.business) + '</h3>' + (proposal.businessPhone ? '<p>' + escapeHtml(proposal.businessPhone) + '</p>' : '') + '</div>' +
        '<div class="proposal-client-block"><span class="proposal-label">CLIENTE</span><strong>' + escapeHtml(proposal.client) + '</strong></div>' +
      '</div>' +
      '<div class="proposal-meta">Emitida em ' + new Date(proposal.createdAt).toLocaleDateString('pt-BR') + ' · válida até ' + (proposal.validUntil ? new Date(proposal.validUntil + 'T00:00:00').toLocaleDateString('pt-BR') : 'não informada') + '</div>' +
      '<div class="proposal-table-wrap"><table class="proposal-table">' +
        '<thead><tr><th>Serviço ou material</th><th class="number">Qtd.</th><th class="number">Unitário</th><th class="number">Subtotal</th></tr></thead>' +
        '<tbody>' + itemRows + '</tbody>' +
      '</table></div>' +
      '<div class="amount-line"><span>Total do orçamento</span><strong class="amount">' + formatCurrency(total) + '</strong></div>' +
      '<p><b>Prazo:</b> ' + escapeHtml(proposal.deadline) + '</p>' +
      '<p><b>Condições de pagamento:</b> ' + escapeHtml(proposal.terms) + '</p>' +
      '<div class="proposal-actions">' +
        '<button class="secondary" id="print" type="button">Imprimir / salvar PDF</button>' +
        '<button class="secondary" id="copy-proposal-summary" type="button">Copiar resumo</button>' +
        '<a class="secondary" id="share-whatsapp" target="_blank" rel="noopener">Enviar no WhatsApp</a>' +
        (currentUser ? '<button class="secondary" id="create-client-link" type="button">Criar link para cliente</button>' : '') +
      '</div>' +
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
    const token = generateShareToken();
    clientLinkButton.disabled = true;
    try {
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

      const url = new URL(location.href);
      url.search = '';
      url.hash = '';
      url.searchParams.set('proposta', proposal.id);
      url.searchParams.set('token', token);
      await navigator.clipboard.writeText(url.toString());

      const updated = { ...proposal, status: 'sent', updatedAt: Date.now() };
      cloudProposals = cloudProposals.map(item => item.id === proposal.id ? updated : item);
      renderHistory();
      renderProposal(updated);
      showToast('Link do cliente copiado. A proposta foi marcada como enviada.');
    } catch (error) {
      console.error(error);
      clientLinkButton.disabled = false;
      showToast('Não foi possível criar o link do cliente.');
    }
  });
}

function renderHistory() {
  const selectedStatus = proposalStatusFilter?.value || 'all';
  const searchTerm = String(proposalSearch?.value || '').trim().toLocaleLowerCase('pt-BR');
  const source = currentUser ? cloudProposals : readProposals().slice().reverse();
  renderHistorySummary(source, selectedStatus);
  const proposals = source
    .filter(proposal => selectedStatus === 'all' || (proposal.status || 'draft') === selectedStatus)
    .filter(proposal => {
      if (!searchTerm) return true;
      return [proposal.client, proposal.business, proposal.number]
        .some(value => String(value || '').toLocaleLowerCase('pt-BR').includes(searchTerm));
    })
    .slice(0, 10);
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
        '<small>' + escapeHtml(proposal.number) + ' · ' + formatCurrency(total) + '</small>' + validityBadge + '</div>' +
        '<div class="item-actions">' +
          '<select class="proposal-status-select" data-status-id="' + escapeHtml(proposal.id) + '" aria-label="Status da proposta">' +
            '<option value="draft"' + (status === 'draft' ? ' selected' : '') + '>Rascunho</option>' +
            '<option value="sent"' + (status === 'sent' ? ' selected' : '') + '>Enviada</option>' +
            '<option value="approved"' + (status === 'approved' ? ' selected' : '') + '>Aprovada</option>' +
            '<option value="rejected"' + (status === 'rejected' ? ' selected' : '') + '>Recusada</option>' +
          '</select>' +
          '<button class="secondary" type="button" data-proposal="' + escapeHtml(proposal.id) + '">Abrir</button>' +
          '<button class="secondary" type="button" data-template="' + escapeHtml(proposal.id) + '">Usar como modelo</button>' +
          '<button class="secondary" type="button" data-edit="' + escapeHtml(proposal.id) + '">Editar</button>' +
          '<button class="secondary" type="button" data-delete="' + escapeHtml(proposal.id) + '" aria-label="Excluir proposta">Excluir</button>' +
        '</div></div>';
    }).join('')
    : '<div class="empty"><span class="empty-icon" aria-hidden="true">＋</span><strong>' + emptyTitle + '</strong><span>' + emptyText + '</span></div>';
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const values = Object.fromEntries(new FormData(form));
  const validation = DocProntoCore.validateItems(readFormItems(), maxItems);
  if (!validation.ok) {
    showToast(validation.error);
    return;
  }
  const items = validation.items;
  const total = validation.total;

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
    items: items,
    total: total,
    amount: total,
    scope: items.map(item => item.description).join(', '),
    deadline: String(values.deadline || '').trim(),
    terms: String(values.terms || '').trim(),
    businessPhone: String(values.businessPhone || '').trim(),
    validUntil: values.validUntil,
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
form.addEventListener('input', scheduleComposerDraftSave);
form.addEventListener('change', scheduleComposerDraftSave);
itemFields.addEventListener('click', event => {
  const removeButton = event.target.closest('.remove-item');
  if (!removeButton || itemFields.querySelectorAll('.line-item').length <= 1) return;
  removeButton.closest('.line-item').remove();
  updateItemControls();
  updateTotal();
});
addItemButton.addEventListener('click', () => addItem());
proposalStatusFilter?.addEventListener('change', renderHistory);
proposalSearch?.addEventListener('input', renderHistory);
historySummary?.addEventListener('click', event => {
  const button = event.target.closest('[data-summary-status]');
  if (!button || !proposalStatusFilter) return;
  proposalStatusFilter.value = button.dataset.summaryStatus || 'all';
  if (proposalSearch) proposalSearch.value = '';
  renderHistory();
});

list.addEventListener('change', async event => {
  const select = event.target.closest('[data-status-id]');
  if (!select) return;
  const proposal = visibleProposals().find(item => item.id === select.dataset.statusId);
  if (!proposal) return;
  const status = select.value;
  if (!['draft', 'sent', 'approved', 'rejected'].includes(status)) return;

  const updated = { ...proposal, status, updatedAt: Date.now() };
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
  document.title = 'Proposta ' + proposal.number + ' · ' + proposal.business;
  const items = Array.isArray(proposal.items) ? proposal.items : [];
  const rows = items.map(item =>
    '<tr><td>' + escapeHtml(item.description || '') + '</td>' +
    '<td class="number">' + Number(item.quantity || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '</td>' +
    '<td class="number">' + formatCurrency(item.unitPrice) + '</td>' +
    '<td class="number">' + formatCurrency(item.subtotal) + '</td></tr>'
  ).join('');
  const expired = proposal.validUntil && proposal.validUntil < localDate(new Date());
  const canRespond = proposal.status === 'sent' && !expired;
  container.innerHTML =
    '<div class="public-proposal-head"><div><span class="proposal-document-brand">DocPronto.</span><p class="eyebrow">PROPOSTA ' + escapeHtml(proposal.number) + '</p><h2>' + escapeHtml(proposal.business) + '</h2></div>' +
    '<span class="proposal-status status-' + escapeHtml(proposal.status) + '">' + publicStatusText(proposal.status) + '</span></div>' +
    '<div class="public-client"><span class="proposal-label">PREPARADA PARA</span><strong>' + escapeHtml(proposal.client) + '</strong></div>' +
    '<div class="proposal-table-wrap"><table class="proposal-table"><thead><tr><th>Serviço ou material</th><th class="number">Qtd.</th><th class="number">Unitário</th><th class="number">Subtotal</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<div class="amount-line"><span>Total da proposta</span><strong class="amount">' + formatCurrency(proposal.total) + '</strong></div>' +
    '<div class="public-details"><p><b>Prazo:</b> ' + escapeHtml(proposal.deadline || 'Não informado') + '</p><p><b>Pagamento:</b> ' + escapeHtml(proposal.terms || 'Não informado') + '</p><p><b>Validade:</b> ' + (proposal.validUntil ? new Date(proposal.validUntil + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informada') + '</p>' +
    (proposal.businessPhone ? '<p><b>Contato:</b> ' + escapeHtml(proposal.businessPhone) + '</p>' : '') + '</div>' +
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
