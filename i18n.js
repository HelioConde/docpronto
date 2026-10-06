(() => {
  const storageKey = 'docpronto-language';
  const translations = {
  "Salvo neste dispositivo": "Saved on this device",
  "Instalar app": "Install app",
  "DocPronto instalado.": "DocPronto installed.",
  "Instalação disponível no menu do navegador.": "Installation is available from your browser menu.",
  "Entrar / sincronizar": "Sign in / sync",
  "SUA CONTA DOC PRONTO": "YOUR DOC PRONTO ACCOUNT",
  "Acesse de qualquer dispositivo": "Access from any device",
  "Entre para salvar suas propostas com segurança na nuvem. Sem conta, você continua usando o DocPronto neste dispositivo.": "Sign in to securely save your proposals in the cloud. Without an account, you can keep using DocPronto on this device.",
  "E-mail": "Email",
  "Senha": "Password",
  "Entrar": "Sign in",
  "Criar conta": "Create account",
  "Esqueci a senha": "Forgot password",
  "Nova senha": "New password",
  "Atualizar senha": "Update password",
  "Conectado como": "Signed in as",
  "Suas propostas ficam privadas na sua conta.": "Your proposals stay private in your account.",
  "IDENTIDADE": "BRANDING",
  "Dados do seu negócio": "Your business details",
  "Sincronizado": "Synced",
  "Esses dados preenchem novas propostas e a cor aparece como detalhe no documento.": "These details prefill new proposals and the color is used as an accent in the document.",
  "Nome do negócio": "Business name",
  "Telefone ou WhatsApp": "Phone or WhatsApp",
  "Cor da proposta": "Proposal color",
  "Salvar identidade": "Save branding",
  "CLIENTES": "CLIENTS",
  "Clientes salvos": "Saved clients",
  "Novo orçamento": "New quote",
  "Novo orçamento para": "New quote for",
  "Novo orçamento iniciado para o cliente.": "New quote started for the client.",
  "Use novamente os dados de clientes frequentes ou remova cadastros que não precisa mais.": "Reuse frequent client details or remove records you no longer need.",
  "Sair da conta": "Sign out",
  "propostas salvas neste dispositivo.": "proposals saved on this device.",
  "Importar para minha conta": "Import to my account",
  "PROPOSTAS E ORÇAMENTOS PARA PRESTADORES": "PROPOSALS AND QUOTES FOR SERVICE PROVIDERS",
  "Orçamento profissional.": "Professional quote.",
  "Sem perder a tarde.": "Without losing your afternoon.",
  "Monte uma proposta clara para seu cliente, detalhe serviços e materiais e gere uma versão pronta para imprimir ou salvar em PDF.": "Build a clear proposal for your client, detail services and materials, and generate a version ready to print or save as PDF.",
  "Propostas que passam confiança": "Proposals that inspire confidence",
  "Apresente seu trabalho e seus valores com clareza.": "Present your work and pricing clearly.",
  "Aprovação online": "Online approval",
  "PROPOSTA COMPARTILHADA": "SHARED PROPOSAL",
  "Carregando proposta…": "Loading proposal…",
  "1 · CRIAR": "1 · CREATE",
  "Dados do orçamento": "Quote details",
  "Descreva o trabalho e separe cada serviço ou material para deixar o valor transparente.": "Describe the work and separate each service or material so pricing stays transparent.",
  "Nome do seu negócio": "Your business name",
  "IDENTIDADE VISUAL": "VISUAL IDENTITY",
  "Logo do negócio (opcional)": "Business logo (optional)",
  "PNG, JPG ou WebP até 2 MB. A imagem é reduzida no seu navegador.": "PNG, JPG, or WebP up to 2 MB. The image is resized in your browser.",
  "Adicionar logo": "Add logo",
  "Trocar logo": "Change logo",
  "Remover": "Remove",
  "Logo do negócio": "Business logo",
  "Logo pronta para as próximas propostas.": "Logo ready for new proposals.",
  "A logo deve ter no máximo 2 MB.": "The logo must be no larger than 2 MB.",
  "Use uma imagem PNG, JPG ou WebP válida.": "Use a valid PNG, JPG, or WebP image.",
  "Logo removida das próximas propostas.": "Logo removed from new proposals.",
  "Cliente": "Client",
  "Ao entrar na conta, clientes usados antes aparecem como sugestão.": "When signed in, previously used clients appear as suggestions.",
  "Adicionar dados do cliente": "Add client details",
  "CPF / CNPJ / documento": "Tax ID / document",
  "Endereço": "Address",
  "Serviços e materiais": "Services and materials",
  "MODELO RÁPIDO": "QUICK TEMPLATE",
  "Comece com uma estrutura pronta": "Start with a ready-made structure",
  "O modelo preenche serviços, prazo e pagamento. Você define os valores.": "The template fills services, timeline, and payment terms. You set the prices.",
  "Modelo de proposta": "Proposal template",
  "Escolher modelo": "Choose template",
  "Elétrica": "Electrical",
  "Hidráulica": "Plumbing",
  "Pintura": "Painting",
  "Serviço digital": "Digital service",
  "Aplicar": "Apply",
  "Aplicar este modelo substituirá serviços, prazo, pagamento e observações atuais. Continuar?": "Applying this template will replace the current services, timeline, payment terms, and notes. Continue?",
  "Modelo aplicado. Preencha os valores e revise antes de gerar.": "Template applied. Enter the prices and review before generating.",
  "Adicione até 10 itens. O total é atualizado automaticamente. Serviços usados antes aparecem como sugestão.": "Add up to 10 items. The total updates automatically. Previously used services appear as suggestions.",
  "+ Adicionar serviço ou material": "+ Add service or material",
  "Desconto": "Discount",
  "Sem desconto": "No discount",
  "Percentual (%)": "Percentage (%)",
  "Valor fixo (R$)": "Fixed amount (R$)",
  "Valor": "Amount",
  "Subtotal": "Subtotal",
  "Total do orçamento": "Quote total",
  "Prazo de execução": "Delivery time",
  "Condições de pagamento": "Payment terms",
  "Observações (opcional)": "Notes (optional)",
  "Use para garantia, exclusões ou condições especiais.": "Use for warranty, exclusions, or special terms.",
  "Gerar proposta": "Generate proposal",
  "Limpar formulário": "Clear form",
  "Seu preenchimento é salvo automaticamente neste dispositivo até você gerar a proposta.": "Your draft is automatically saved on this device until you generate the proposal.",
  "2 · ACOMPANHAR": "2 · TRACK",
  "Histórico e prévia": "History and preview",
  "Abra uma proposta, acompanhe o andamento comercial e compartilhe com o cliente.": "Open a proposal, track its commercial status, and share it with the client.",
  "Buscar": "Search",
  "Status": "Status",
  "Histórico de status": "Status history",
  "Você": "You",
  "Todas": "All",
  "Rascunho": "Draft",
  "Enviadas": "Sent",
  "Conversão": "Conversion",
  "aprovadas / enviadas": "approved / sent",
  "Aprovadas": "Approved",
  "Recusadas": "Rejected",
  "Vencidas": "Expired",
  "Ordenar": "Sort",
  "Mais recentes": "Newest",
  "Mais antigas": "Oldest",
  "Maior valor": "Highest value",
  "Vencimento próximo": "Nearest expiry",
  "Exportar CSV": "Export CSV",
  "Mostrar mais": "Show more",
  "Da proposta ao PDF, sem complicação": "From proposal to PDF, without hassle",
  "Valores transparentes": "Transparent pricing",
  "Detalhe até 10 serviços ou materiais por proposta.": "Detail up to 10 services or materials per proposal.",
  "Seu histórico com você": "Your history, always with you",
  "Use o dispositivo atual ou entre para sincronizar na nuvem.": "Use this device or sign in to sync to the cloud.",
  "Pronto para enviar": "Ready to send",
  "Imprima ou salve em PDF com um clique.": "Print or save as PDF in one click.",
  "Sem conta, suas propostas ficam neste dispositivo. Ao entrar, você pode sincronizar e acessar de outros aparelhos.": "Without an account, proposals stay on this device. Sign in to sync and access them from other devices.",
  "Salvo neste navegador": "Saved in this browser",
  "Fechar": "Close",
  "Recursos principais": "Main features",
  "Opcional": "Optional",
  "Resumo comercial": "Commercial summary",
  "Cliente ou proposta": "Client or proposal",
  "Ex.: Conde Elétrica": "E.g. Conde Electric",
  "Ex.: João Silva": "E.g. John Smith",
  "Rua, número, bairro, cidade": "Street, number, district, city",
  "Ex.: 2 dias úteis": "E.g. 2 business days",
  "Ex.: 50% no início e 50% na entrega": "E.g. 50% upfront and 50% on delivery",
  "Ex.: Materiais elétricos não inclusos. Garantia de 90 dias sobre a instalação.": "E.g. Electrical materials not included. 90-day installation warranty.",
  "Descrição": "Description",
  "Preço unitário": "Unit price",
  "Quantidade": "Quantity",
  "Qtd.": "Qty.",
  "Unitário": "Unit price",
  "Serviço ou material": "Service or material",
  "Proposta válida até": "Proposal valid until",
  "Telefone ou WhatsApp do negócio (opcional)": "Business phone or WhatsApp (optional)",
  "WhatsApp do cliente (opcional)": "Client WhatsApp (optional)",
  "Usado apenas para facilitar o compartilhamento da proposta.": "Used only to make sharing the proposal easier.",
  "Imprimir / salvar PDF": "Print / save PDF",
  "Copiar resumo": "Copy summary",
  "Enviar no WhatsApp": "Send on WhatsApp",
  "Enviar resumo": "Send summary",
  "Enviar proposta no WhatsApp": "Send proposal on WhatsApp",
  "Copiar link do cliente": "Copy client link",
  "Gerar novo link": "Generate new link",
  "Usar como modelo": "Use as template",
  "Editar": "Edit",
  "Excluir": "Delete",
  "Abrir": "Open",
  "Reabrir": "Reopen",
  "Sua primeira proposta começa aqui": "Your first proposal starts here",
  "Nenhuma proposta encontrada": "No proposals found",
  "Nenhuma proposta disponível": "No proposals available",
  "Crie um orçamento ao lado. Ele será salvo na sua conta e aparecerá aqui.": "Create a quote beside this panel. It will be saved to your account and appear here.",
  "Preencha o orçamento ao lado. Depois de gerar, ele fica salvo neste navegador e aparece aqui.": "Fill in the quote beside this panel. After generating it, it will be saved in this browser and appear here.",
  "Tente outro termo de busca ou ajuste o filtro de status.": "Try another search term or adjust the status filter.",
  "Expirada": "Expired",
  "Expira hoje": "Expires today",
  "Esta proposta expirou.": "This proposal has expired.",
  "Esta proposta não está disponível para resposta.": "This proposal is not available for a response.",
  "Você aprovou esta proposta.": "You approved this proposal.",
  "Você recusou esta proposta.": "You rejected this proposal.",
  "Proposta indisponível": "Proposal unavailable",
  "Não foi possível conectar ao serviço.": "Could not connect to the service.",
  "O link pode ter expirado ou sido substituído por um novo.": "The link may have expired or been replaced by a new one.",
  "Prazo:": "Delivery:",
  "Pagamento:": "Payment:",
  "Validade:": "Validity:",
  "Contato:": "Contact:",
  "Documento:": "Document:",
  "Endereço:": "Address:",
  "OBSERVAÇÕES": "NOTES",
  "EMPRESA": "BUSINESS",
  "CLIENTE": "CLIENT",
  "PREPARADA PARA": "PREPARED FOR",
  "Total da proposta": "Proposal total",
  "Total": "Total",
  "Número": "Number",
  "Proposta": "Proposal",
  "Cancelar edição": "Cancel editing",
  "Salvar alterações": "Save changes",
  "Gerar nova proposta": "Generate new proposal",
  "Formulário limpo.": "Form cleared.",
  "Dar feedback": "Give feedback",
  "aguardando envio": "waiting to send",
  "Como está o DocPronto?": "How is DocPronto?",
  "Sua opinião ajuda a decidir o que corrigir e desenvolver primeiro.": "Your feedback helps decide what to fix and build first.",
  "Nota geral": "Overall rating",
  "Sobre o quê?": "About what?",
  "Facilidade de uso": "Ease of use",
  "Algo não funcionou": "Something did not work",
  "Velocidade": "Speed",
  "Ideia ou recurso": "Idea or feature",
  "Outro": "Other",
  "Comentário": "Comment",
  "O que funcionou bem ou o que deveríamos melhorar?": "What worked well or what should we improve?",
  "Não envie nome, telefone, e-mail ou dados de clientes.": "Do not send names, phone numbers, email addresses, or client data.",
  "Enviar feedback": "Send feedback",
  "Agora não": "Not now",
  "Confira a nota e o comentário.": "Check the rating and comment.",
  "Enviando feedback…": "Sending feedback…",
  "Feedback enviado. Obrigado!": "Feedback sent. Thank you!",
  "Feedback salvo. Vamos enviar automaticamente quando o serviço estiver disponível.": "Feedback saved. We will send it automatically when the service is available.",
  "Edição cancelada.": "Editing canceled.",
  "Rascunho recuperado.": "Draft restored.",
  "Resumo da proposta copiado.": "Proposal summary copied.",
  "Último preço deste item preenchido.": "Last price for this item filled in.",
  "Ainda não há propostas para exportar.": "There are no proposals to export yet.",
  "CSV exportado.": "CSV exported.",
  "Cliente selecionado.": "Client selected.",
  "Cliente removido.": "Client removed.",
  "Dados do cliente preenchidos.": "Client details filled in.",
  "Identidade do negócio atualizada.": "Business branding updated.",
  "Proposta salva na nuvem.": "Proposal saved to the cloud.",
  "Proposta salva neste navegador.": "Proposal saved in this browser.",
  "Proposta atualizada na nuvem.": "Proposal updated in the cloud.",
  "Proposta atualizada neste navegador.": "Proposal updated in this browser.",
  "Proposta removida da nuvem.": "Proposal removed from the cloud.",
  "Proposta removida deste navegador.": "Proposal removed from this browser.",
  "Proposta reaberta como rascunho.": "Proposal reopened as a draft.",
  "Link do cliente copiado. A proposta foi marcada como enviada.": "Client link copied. The proposal was marked as sent.",
  "Modelo carregado. Revise os dados e gere uma nova proposta.": "Template loaded. Review the details and generate a new proposal.",
  "Não foi possível atualizar o status.": "Could not update the status.",
  "Não foi possível copiar o resumo.": "Could not copy the summary.",
  "Não foi possível criar ou copiar o link do cliente.": "Could not create or copy the client link.",
  "Não foi possível excluir a proposta.": "Could not delete the proposal.",
  "Não foi possível preparar o envio da proposta.": "Could not prepare the proposal for sending.",
  "Não foi possível reabrir a proposta.": "Could not reopen the proposal.",
  "Não foi possível registrar a resposta.": "Could not register the response.",
  "Não foi possível sincronizar a proposta.": "Could not sync the proposal.",
  "Falha ao salvar na nuvem. Confira a conexão; os dados continuam no formulário.": "Could not save to the cloud. Check your connection; the data remains in the form.",
  "Entre na sua conta para criar um link.": "Sign in to create a link.",
  "Você pode adicionar até 10 itens.": "You can add up to 10 items.",
  "não informada": "not provided",
  "Não informada": "Not provided",
  "Não informado": "Not provided",
  "Indisponível": "Unavailable",
  "Esta proposta está encerrada. Para alterar valores ou condições, use-a como modelo e gere uma nova proposta.": "This proposal is closed. To change values or terms, use it as a template and generate a new proposal.",
  "Limpar o formulário e apagar o rascunho salvo neste dispositivo?": "Clear the form and delete the draft saved on this device?",
  "Gerar um novo link invalida o link anterior. Continuar?": "Generating a new link invalidates the previous one. Continue?",
  "Reabrir esta proposta como rascunho? O link público anterior será invalidado.": "Reopen this proposal as a draft? The previous public link will be invalidated.",
  "Excluir esta proposta da sua conta?": "Delete this proposal from your account?",
  "Excluir esta proposta deste navegador?": "Delete this proposal from this browser?",
  "Mostrar todas as propostas": "Show all proposals",
  "Mostrar propostas enviadas": "Show sent proposals",
  "Mostrar propostas aprovadas": "Show approved proposals",
  "DocPronto, página inicial": "DocPronto, home page",
  "Remover item": "Remove item",
  "Status da proposta": "Proposal status"
};
  Object.assign(translations, {
  "Minha conta": "My account",
  "Carregando propostas…": "Loading proposals…",
  "Modo local": "Local mode",
  "Conta conectada.": "Account connected.",
  "Conta conectada": "Connected account",
  "Entrando…": "Signing in…",
  "Criando conta…": "Creating account…",
  "Salvando identidade do negócio…": "Saving business branding…",
  "Identidade salva. Ela será usada nas novas propostas.": "Branding saved. It will be used in new proposals.",
  "A sincronização está indisponível. Você ainda pode criar propostas salvas neste navegador.": "Sync is unavailable. You can still create proposals saved in this browser.",
  "Confirme seu e-mail antes de entrar.": "Confirm your email before signing in.",
  "E-mail ou senha incorretos.": "Incorrect email or password.",
  "Este e-mail já tem conta. Tente entrar.": "This email already has an account. Try signing in.",
  "Use uma senha com pelo menos 8 caracteres.": "Use a password with at least 8 characters.",
  "Não foi possível concluir. Confira os dados e tente novamente.": "Could not complete the action. Check the details and try again.",
  "O endereço de retorno do DocPronto precisa ser liberado nas configurações de Auth do Supabase.": "The DocPronto return URL must be allowed in the Supabase Auth settings.",
  "Informe seu e-mail e uma senha com pelo menos 8 caracteres.": "Enter your email and a password with at least 8 characters.",
  "Informe seu e-mail para receber o link de redefinição.": "Enter your email to receive the reset link.",
  "Se esse e-mail estiver cadastrado, você receberá um link para redefinir a senha.": "If this email is registered, you will receive a password reset link.",
  "Senha atualizada. Você já pode continuar usando sua conta.": "Password updated. You can keep using your account.",
  "Não foi possível sair da conta.": "Could not sign out.",
  "Você saiu. As propostas locais continuam neste dispositivo.": "You signed out. Local proposals remain on this device.",
  "Não foi possível verificar a sessão. O modo local continua disponível.": "Could not verify the session. Local mode remains available.",
  "Importando propostas deste dispositivo…": "Importing proposals from this device…",
  "Importação concluída. Suas propostas estão na nuvem.": "Import complete. Your proposals are in the cloud.",
  "Parte da importação pode ter sido concluída. Tente novamente; os registros não serão duplicados.": "Part of the import may have completed. Try again; records will not be duplicated.",
  "Não foi possível carregar suas propostas. Tente novamente.": "Could not load your proposals. Try again.",
  "Falha ao carregar a nuvem": "Failed to load cloud data",
  "Não foi possível remover o cliente.": "Could not remove the client.",
  "Essa proposta não está mais no histórico. Crie uma nova proposta.": "This proposal is no longer in history. Create a new proposal.",
  "Proposta salva na nuvem.": "Proposal saved to the cloud.",
  "Proposta salva neste navegador.": "Proposal saved in this browser.",
  "Proposta atualizada na nuvem.": "Proposal updated in the cloud.",
  "Proposta atualizada neste navegador.": "Proposal updated in this browser.",
  "Salvar alterações": "Save changes",
  "Gerar nova proposta": "Generate new proposal",
  "Cancelar edição": "Cancel editing",
  "Editando a proposta": "Editing proposal",
  "Todas": "All",
  "Enviada": "Sent",
  "Aprovada": "Approved",
  "Recusada": "Rejected",
  "Rascunho": "Draft",
  "Respondida em": "Responded at",
  "Criada em": "Created at",
  "Empresa": "Business",
  "Validade": "Validity"
});
  Object.assign(translations, {
  "Aguardando resposta": "Awaiting response",
  "Aprovar proposta": "Approve proposal",
  "Nome para aceite (opcional)": "Name for acceptance (optional)",
  "Se preenchido, o nome ficará registrado junto da aprovação.": "If provided, the name will be recorded with the approval.",
  "Aceite registrado por": "Accepted by",
  "Ex.: João Silva": "Ex.: John Smith",
  "Recusar": "Reject",
  "Emitida em": "Issued on",
  "válida até": "valid until",
  "respondida em": "responded on",
  "Condições de pagamento:": "Payment terms:"
});
  Object.assign(translations, {
  "Sem resposta": "No response",
  "enviadas há 3 dias ou mais": "sent 3 or more days ago",
  "Mostrar propostas sem resposta": "Show proposals awaiting response",
  "Cobrar retorno": "Follow up",
  "Copiar lembrete": "Copy follow-up",
  "Adicionar ao calendário": "Add to calendar",
  "Lembrete adicionado ao calendário.": "Reminder added to calendar.",
  "Lembrete de follow-up copiado.": "Follow-up message copied.",
  "Não foi possível copiar o lembrete.": "Could not copy the follow-up message."
});
  const reverse = Object.fromEntries(Object.entries(translations).map(([pt, en]) => [en, pt]));
  let activeLocale = localStorage.getItem(storageKey) === 'en' ? 'en' : 'pt-BR';
  let applying = false;
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();

  function dynamicTranslate(value, target) {
    if (target === 'en') {
      let match = value.match(/^Expira em (\d+) dias?$/);
      if (match) return `Expires in ${match[1]} day${match[1] === '1' ? '' : 's'}`;
      match = value.match(/^Mostrar mais \((\d+)\)$/);
      if (match) return `Show more (${match[1]})`;
      match = value.match(/^Status atualizado para (.+)\.$/);
      if (match) return `Status updated to ${translations[match[1]] || match[1]}.`;
      match = value.match(/^Respondida em (.+) às (.+)$/);
      if (match) return `Responded on ${match[1]} at ${match[2]}`;
      match = value.match(/^Respondida em (.+)$/);
      if (match) return `Responded on ${match[1]}`;
      match = value.match(/^Encontramos (\d+) propostas salvas neste dispositivo\.$/);
      if (match) return `We found ${match[1]} proposals saved on this device.`;
      match = value.match(/^Nuvem · (.+)$/);
      if (match) return `Cloud · ${match[1]}`;
      match = value.match(/^PROPOSTA (.+)$/);
      if (match) return `PROPOSAL ${match[1]}`;
      return value;
    }
    let match = value.match(/^Expires in (\d+) days?$/);
    if (match) return `Expira em ${match[1]} dia${match[1] === '1' ? '' : 's'}`;
    match = value.match(/^No response for (\d+) days?$/);
    if (match) return `Sem resposta há ${match[1]} dia${match[1] === '1' ? '' : 's'}`;
    match = value.match(/^Show more \((\d+)\)$/);
    if (match) return `Mostrar mais (${match[1]})`;
    match = value.match(/^Cloud · (.+)$/);
    if (match) return `Nuvem · ${match[1]}`;
    match = value.match(/^PROPOSAL (.+)$/);
    if (match) return `PROPOSTA ${match[1]}`;
    return value;
  }

  function translateValue(value, target = activeLocale) {
    if (typeof value !== 'string') return value;
    const leading = value.match(/^\s*/)?.[0] || '';
    const trailing = value.match(/\s*$/)?.[0] || '';
    const core = value.trim();
    if (!core) return value;
    let translated = target === 'en' ? translations[core] : reverse[core];
    if (!translated) translated = dynamicTranslate(core, target);
    return translated === core ? value : leading + translated + trailing;
  }

  function translateElement(root) {
    if (!root || applying) return;
    applying = true;
    try {
      if (root.nodeType === Node.TEXT_NODE) {
        const parent = root.parentElement;
        if (!parent || ['SCRIPT','STYLE','NOSCRIPT'].includes(parent.tagName)) return;
        if (activeLocale === 'pt-BR' && originalText.has(root)) {
          const original = originalText.get(root);
          if (root.nodeValue !== original) root.nodeValue = original;
        } else {
          const next = translateValue(root.nodeValue);
          if (next !== root.nodeValue) {
            if (!originalText.has(root)) originalText.set(root, root.nodeValue);
            root.nodeValue = next;
          }
        }
        return;
      }
      if (root.nodeType !== Node.ELEMENT_NODE && root !== document) return;
      const element = root === document ? document.documentElement : root;
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        if (!parent || ['SCRIPT','STYLE','NOSCRIPT'].includes(parent.tagName)) continue;
        if (activeLocale === 'pt-BR' && originalText.has(node)) {
          const original = originalText.get(node);
          if (node.nodeValue !== original) node.nodeValue = original;
        } else {
          const next = translateValue(node.nodeValue);
          if (next !== node.nodeValue) {
            if (!originalText.has(node)) originalText.set(node, node.nodeValue);
            node.nodeValue = next;
          }
        }
      }
      const attrElements = [element, ...element.querySelectorAll?.('[placeholder],[aria-label],[title]') || []];
      attrElements.forEach(el => {
        ['placeholder','aria-label','title'].forEach(attr => {
          if (!el?.hasAttribute?.(attr)) return;
          const before = el.getAttribute(attr);
          let saved = originalAttributes.get(el);
          if (!saved) {
            saved = {};
            originalAttributes.set(el, saved);
          }
          if (activeLocale === 'pt-BR' && saved[attr] != null) {
            if (el.getAttribute(attr) !== saved[attr]) el.setAttribute(attr, saved[attr]);
          } else {
            const after = translateValue(before);
            if (after !== before) {
              if (saved[attr] == null) saved[attr] = before;
              el.setAttribute(attr, after);
            }
          }
        });
      });
    } finally {
      applying = false;
    }
  }

  function updateMeta() {
    const english = activeLocale === 'en';
    document.documentElement.lang = english ? 'en' : 'pt-BR';
    document.title = english
      ? 'DocPronto — Professional proposals without the hassle'
      : 'DocPronto — Propostas profissionais sem complicação';
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = english
      ? 'Create professional quotes and proposals, share them with clients, and track approvals online.'
      : 'Crie propostas e orçamentos profissionais, compartilhe com clientes e acompanhe aprovações online.';
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = document.title;
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.content = description?.content || '';
  }

  function updateControls() {
    document.querySelectorAll('[data-language]').forEach(button => {
      const selected = button.dataset.language === activeLocale;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function setLocale(locale) {
    activeLocale = locale === 'en' ? 'en' : 'pt-BR';
    localStorage.setItem(storageKey, activeLocale);
    updateMeta();
    translateElement(document.body);
    updateControls();
    window.dispatchEvent(new CustomEvent('app-language-change', { detail: { locale: activeLocale } }));
  }

  function locale() { return activeLocale; }
  function t(value) { return translateValue(value, activeLocale); }

  function init() {
    document.querySelectorAll('[data-language]').forEach(button => {
      button.addEventListener('click', () => setLocale(button.dataset.language));
    });
    setLocale(activeLocale);
    const observer = new MutationObserver(mutations => {
      if (applying) return;
      mutations.forEach(mutation => {
        if (mutation.type === 'characterData') translateElement(mutation.target);
        mutation.addedNodes.forEach(node => translateElement(node));
      });
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  }

  window.AppI18n = Object.freeze({ setLocale, locale, t, apply: translateElement });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();