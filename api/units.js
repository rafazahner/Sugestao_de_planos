import { movideskFetch, sendError } from '../lib/backend.mjs';

export default async function handler(_req, res) {
  try {
    const data = await movideskFetch('persons', {
      '$filter': 'personType eq 2 and isActive eq true',
      '$select': 'id,businessName'
    });

    return res.status(200).json(data);
  } catch (error) {
    return sendError(res, error, 'Failed to fetch units');
  }
}
