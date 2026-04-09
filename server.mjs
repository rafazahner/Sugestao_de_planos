import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.argv.includes('--production');
const port = Number(process.env.PORT || 3000);

const MOVIDESK_TOKEN = process.env.MOVIDESK_TOKEN;
const BOTCONVERSA_WEBHOOK = process.env.BOTCONVERSA_WEBHOOK;
const MOVIDESK_BASE_URL = 'https://api.movidesk.com/public/v1';

app.use(express.json());

function requireEnv(name, value) {
  if (!value) {
    const error = new Error(`Missing required environment variable: ${name}`);
    error.statusCode = 500;
    throw error;
  }
}

async function movideskFetch(resource, searchParams) {
  requireEnv('MOVIDESK_TOKEN', MOVIDESK_TOKEN);

  const url = new URL(`${MOVIDESK_BASE_URL}/${resource}`);
  url.searchParams.set('token', MOVIDESK_TOKEN);

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
    const error = new Error(`Movidesk request failed with status ${response.status}`);
    error.statusCode = response.status;
    error.details = details;
    throw error;
  }

  return response.json();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/units', async (_req, res) => {
  try {
    const data = await movideskFetch('persons', {
      '$filter': 'personType eq 2 and isActive eq true',
      '$select': 'id,businessName'
    });

    res.json(data);
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(error.statusCode || 500).json({
      message: 'Failed to fetch units',
      details: error.details || error.message
    });
  }
});

app.get('/api/check-user-role', async (req, res) => {
  const email = String(req.query.email || '').trim();

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const data = await movideskFetch('persons', {
      '$filter': `emails/any(d:d/email eq '${email}')`,
      '$select': 'id,businessName,role',
      '$expand': 'contacts'
    });

    if (Array.isArray(data) && data.length > 0) {
      const person = data[0];
      const phoneContact = person.contacts?.find(contact => contact.contactType === 1) || person.contacts?.[0];

      return res.json({
        isFranchisee: person.role === 'FRANQUEADO',
        phone: phoneContact?.contact,
        id: person.id,
        businessName: person.businessName
      });
    }

    return res.json({ isFranchisee: false });
  } catch (error) {
    console.error('Error checking user role:', error);
    return res.status(error.statusCode || 500).json({
      message: 'Failed to validate user',
      details: error.details || error.message
    });
  }
});

app.post('/api/submit-ticket', async (req, res) => {
  try {
    requireEnv('BOTCONVERSA_WEBHOOK', BOTCONVERSA_WEBHOOK);

    const data = req.body;
    const rawPhone = String(data.phone || '').replace(/\D/g, '');
    const phoneWithoutCountry = rawPhone.startsWith('55') ? rawPhone.slice(2) : rawPhone;

    const ticketPayload = {
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

    const response = await fetch(BOTCONVERSA_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(ticketPayload)
    });

    if (!response.ok) {
      const details = await response.text();
      return res.status(response.status).json({
        message: 'Failed to send data to webhook',
        details
      });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error('Error submitting ticket:', error);
    return res.status(error.statusCode || 500).json({
      message: 'Failed to submit ticket',
      details: error.details || error.message
    });
  }
});

if (!isProduction) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: {
      middlewareMode: true
    },
    appType: 'spa'
  });

  app.use(vite.middlewares);
} else {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((error, _req, res, _next) => {
  console.error('Unhandled server error:', error);
  res.status(error.statusCode || 500).json({
    message: error.message || 'Internal server error'
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
