const base = 'https://bnlvvsjgpywpbfhwdcan.supabase.co/functions/v1';
const key = process.env.SUPABASE_ANON_KEY;
const proposalId = process.env.QA_PROPOSAL_ID;
const token = process.env.QA_PROPOSAL_TOKEN;

if (!key || !proposalId || !token) {
  throw new Error('Missing QA environment variables');
}

async function call(name, body) {
  const response = await fetch(base + '/' + name, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      Origin: 'https://helioconde.github.io'
    },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(name + ' failed: ' + response.status + ' ' + JSON.stringify(data));
  }
  return data;
}

const opened = await call('proposal-public', { proposalId, token });
if (opened.status !== 'sent' || opened.number !== 'DP-QA-PUBLIC-001') {
  throw new Error('Unexpected public proposal payload: ' + JSON.stringify(opened));
}

const accepted = await call('proposal-response', {
  proposalId,
  token,
  decision: 'approved',
  acceptedBy: 'Maria QA'
});
if (accepted.status !== 'approved' || accepted.acceptedBy !== 'Maria QA') {
  throw new Error('Unexpected response payload: ' + JSON.stringify(accepted));
}

const reopened = await call('proposal-public', { proposalId, token });
if (reopened.status !== 'approved' || reopened.acceptedBy !== 'Maria QA') {
  throw new Error('Acceptance was not persisted: ' + JSON.stringify(reopened));
}

console.log('LIVE_EDGE_SMOKE_OK');
