const MOVIDESK_BASE_URL = 'https://api.movidesk.com/public/v1';

function createError(message, statusCode = 500, details) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw createError(`Missing required environment variable: ${name}`, 500);
  }
  return value;
}

export async function movideskFetch(resource, searchParams) {
  const token = requireEnv('MOVIDESK_TOKEN');

  const url = new URL(`${MOVIDESK_BASE_URL}/${resource}`);
  url.searchParams.set('token', token);

  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const details = await response.text();
    throw createError(`Movidesk request failed with status ${response.status}`, response.status, details);
  }

  return response.json();
}

export function buildTicketPayload(data) {
  const rawPhone = String(data.phone || '').replace(/\D/g, '');
  const phoneWithoutCountry = rawPhone.startsWith('55') ? rawPhone.slice(2) : rawPhone;

  return {
    type: 2,
    subject: 'Liberação Sugestão de Planos',
    urgency: 'Alta',
    category: 'Solicitação de serviço',
    origin: 9,
    serviceFirstLevelId: 1392257,
    createdBy: {
      id: data.personId
    },
    clients: [
      {
        id: data.personId
      }
    ],
    actions: [
      {
        type: 2,
        origin: 9,
        description: data.message
      }
    ],
    customFieldValues: [
      {
        customFieldId: 205660,
        customFieldRuleId: 106945,
        line: 1,
        value: null,
        items: [{ customFieldItem: data.unitName }]
      },
      {
        customFieldId: 205496,
        customFieldRuleId: 106882,
        line: 1,
        value: '12345678',
        items: []
      },
      {
        customFieldId: 217972,
        customFieldRuleId: 113942,
        line: 1,
        value: phoneWithoutCountry,
        items: []
      }
    ],
    webhook_metadata: {
      email: data.email,
      businessName: data.businessName,
      sent_at: new Date().toISOString()
    }
  };
}

export function sendError(res, error, fallbackMessage) {
  console.error(fallbackMessage, error);
  return res.status(error.statusCode || 500).json({
    message: fallbackMessage,
    details: error.details || error.message
  });
}
