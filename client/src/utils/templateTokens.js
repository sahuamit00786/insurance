/** All template tokens, grouped by category. */
export const TOKEN_GROUPS = [
  {
    group: 'client',
    label: 'Client',
    tokens: [
      { token: 'client_name', label: 'Client Name' },
      { token: 'dob',         label: 'Date of Birth' },
      { token: 'phone',       label: 'Phone' },
      { token: 'email',       label: 'Email' },
      { token: 'address',     label: 'Address' },
    ],
  },
  {
    group: 'insurance',
    label: 'Insurance',
    tokens: [
      { token: 'policy_no',     label: 'Policy No' },
      { token: 'plan_code',     label: 'Plan Code' },
      { token: 'premium',       label: 'Premium (RM)' },
      { token: 'due_date',      label: 'Premium Due Date' },
      { token: 'maturity_date', label: 'Maturity Date' },
      { token: 'issued_date',   label: 'Issued Date' },
      { token: 'payment_mode',  label: 'Payment Mode' },
      { token: 'status',        label: 'Policy Status' },
    ],
  },
];

/** Set of token keys that belong to the insurance group. */
export const INSURANCE_TOKEN_KEYS = new Set(
  TOKEN_GROUPS.find(g => g.group === 'insurance').tokens.map(t => t.token)
);

/** Flat list of all tokens (for backwards compat). */
export const CLIENT_TOKENS = TOKEN_GROUPS.flatMap(g => g.tokens);
export const TOKENS = CLIENT_TOKENS;

const TOKEN_LABELS = Object.fromEntries(CLIENT_TOKENS.map(t => [t.token, t.label]));
const KNOWN_TOKEN_KEYS = new Set(CLIENT_TOKENS.map(t => t.token));

const TOKEN_ALIASES = {
  clientname:    'client_name',
  client:        'client_name',
  name:          'client_name',
  dateofbirth:   'dob',
  date_of_birth: 'dob',
  birthday:      'dob',
  mobileno:      'phone',
  mobile:        'phone',
  policyno:      'policy_no',
  plancode:      'plan_code',
  duedate:       'due_date',
  due:           'due_date',
  maturity:      'maturity_date',
  issued:        'issued_date',
  paymentmode:   'payment_mode',
  ins_status:    'status',
};

/** `{{client_name}}` and `{ client_name }` → `{client_name}` */
export function normalizeTemplateBody(body) {
  if (!body) return '';
  return String(body)
    .replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, '{$1}')
    .replace(/\{\s*([a-zA-Z0-9_]+)\s*\}/g, '{$1}');
}

export function canonicalizeToken(raw) {
  const key = String(raw || '')
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');
  return TOKEN_ALIASES[key] || key;
}

export function extractTemplateTokens(body) {
  if (!body) return [];
  const normalized = normalizeTemplateBody(body);
  const tokens = new Set();
  const re = /\{([a-zA-Z0-9_]+)\}/g;
  let match;
  while ((match = re.exec(normalized)) !== null) {
    const key = canonicalizeToken(match[1]);
    if (KNOWN_TOKEN_KEYS.has(key)) tokens.add(key);
  }
  return [...tokens];
}

export function isTokenValueMissing(val) {
  return val == null || String(val).trim() === '';
}

export function getValueForToken(token, values) {
  const key = canonicalizeToken(token);
  return values[key];
}

export function getMissingTokensForClient(body, client, formatDateFn, insurance = {}) {
  if (!body || !client) return [];
  const values = buildTokenValues(client, formatDateFn, insurance);
  // Only flag client fields as "missing" — insurance/general are optional
  const clientTokenKeys = new Set(TOKEN_GROUPS.find(g => g.group === 'client').tokens.map(t => t.token));
  return extractTemplateTokens(body)
    .filter(token => clientTokenKeys.has(token) && isTokenValueMissing(values[token]))
    .map(token => ({
      token,
      label: TOKEN_LABELS[token] || token.replace(/_/g, ' '),
    }));
}

/** Sample values for live template preview while editing. */
export const TEMPLATE_DUMMY_VALUES = {
  client_name:  'Ahmad bin Hassan',
  dob:          '15 Mar 1985',
  phone:        '+60 12-345 6789',
  email:        'ahmad.hassan@email.com',
  address:      '12, Jalan Merdeka, 50450 Kuala Lumpur',
  policy_no:    'POL-20241015',
  plan_code:    'LIFE-PLUS',
  premium:      'RM 250.00',
  due_date:     '15 Jun 2025',
  maturity_date:'15 Jun 2040',
  issued_date:  '15 Jun 2020',
  payment_mode: 'Annual',
  status:       'Active',
};

export function applyTemplateTokens(body, values = TEMPLATE_DUMMY_VALUES) {
  if (!body) return '';
  let out = normalizeTemplateBody(body);

  KNOWN_TOKEN_KEYS.forEach(token => {
    const display = isTokenValueMissing(values[token]) ? '' : String(values[token]);
    out = out.replace(new RegExp(`\\{${token}\\}`, 'gi'), display);
  });

  return out.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, raw) => {
    const key = canonicalizeToken(raw);
    const label = TOKEN_LABELS[key] || raw.replace(/_/g, ' ');
    const val = values[key];
    if (!isTokenValueMissing(val)) return String(val);
    return `[${label}]`;
  });
}

/** Build full token value map from client + insurance + general context. */
export function buildTokenValues(client, formatDateFn, insurance = {}) {
  const fmt = formatDateFn || (d => (d ? String(d) : ''));
  return {
    // Client
    client_name: client?.name ?? '',
    dob:         client?.date_of_birth ? fmt(client.date_of_birth) : '',
    phone:       client?.phone ?? '',
    email:       client?.email ?? '',
    address:     client?.address ?? '',
    // Insurance (most recent policy)
    policy_no:     insurance?.policy_no ?? '',
    plan_code:     insurance?.plan_code ?? '',
    premium:       insurance?.premium ? `RM ${parseFloat(insurance.premium).toFixed(2)}` : '',
    due_date:      insurance?.premium_due_date ? fmt(insurance.premium_due_date) : '',
    maturity_date: insurance?.maturity_date ? fmt(insurance.maturity_date) : '',
    issued_date:   insurance?.issued_date ? fmt(insurance.issued_date) : '',
    payment_mode:  insurance?.payment_mode ?? '',
    status:        insurance?.status ?? '',
  };
}

/** Legacy helper (still used in some places). */
export function clientToTokenValues(client, formatDateFn) {
  return buildTokenValues(client, formatDateFn, {}, {});
}
