import { buildTicketPayload, requireEnv, sendError } from '../lib/backend.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const webhookUrl = requireEnv('BOTCONVERSA_WEBHOOK');
    const ticketPayload = buildTicketPayload(req.body || {});

    const response = await fetch(webhookUrl, {
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

    return res.status(200).json({ ok: true });
  } catch (error) {
    return sendError(res, error, 'Failed to submit ticket');
  }
}
