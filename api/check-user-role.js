import { movideskFetch, sendError } from '../lib/backend.mjs';

export default async function handler(req, res) {
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

      return res.status(200).json({
        isFranchisee: person.role === 'FRANQUEADO',
        phone: phoneContact?.contact,
        id: person.id,
        businessName: person.businessName
      });
    }

    return res.status(200).json({ isFranchisee: false });
  } catch (error) {
    return sendError(res, error, 'Failed to validate user');
  }
}
