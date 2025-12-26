
import { MovideskPerson, UserValidationResponse, MovideskUnit, TicketFormData } from '../types';

const MOVIDESK_TOKEN = 'fb6ad8cd-1026-40b2-8224-f2a8dad2c97d';
const BASE_URL = 'https://api.movidesk.com/public/v1';
const PROXY_URL = 'https://corsproxy.io/?';

/**
 * Executes a fetch request through a CORS proxy to avoid preflight issues 
 * and prevent double-submission by ensuring only one request is ever made.
 */
async function proxiedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const proxiedUrl = `${PROXY_URL}${encodeURIComponent(url)}`;
  return fetch(proxiedUrl, options);
}

/**
 * Checks if a user with the given email has the role 'FRANQUEADO'.
 */
export const checkUserRole = async (email: string): Promise<UserValidationResponse> => {
  try {
    const filter = `emails/any(d:d/email eq '${email}')`;
    const select = `id,businessName,role`;
    const expand = `contacts`;
    const url = `${BASE_URL}/persons?token=${MOVIDESK_TOKEN}&$filter=${encodeURIComponent(filter)}&$select=${select}&$expand=${expand}`;
    
    const response = await proxiedFetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: MovideskPerson[] = await response.json();
    
    if (data && data.length > 0) {
      const person = data[0];
      const isFranchisee = person.role === 'FRANQUEADO';
      const phoneContact = person.contacts?.find(c => c.contactType === 1) || person.contacts?.[0];
      const phone = phoneContact?.contact;
      
      return { 
        isFranchisee, 
        phone,
        id: person.id
      };
    }
    
    return { isFranchisee: false };
  } catch (error) {
    console.error('Error checking user role:', error);
    throw error;
  }
};

/**
 * Fetches all active units (organizations) from Movidesk.
 */
export const fetchUnits = async (): Promise<MovideskUnit[]> => {
  try {
    const filter = `personType eq 2 and isActive eq true`;
    const select = `id,businessName`;
    const url = `${BASE_URL}/persons?token=${MOVIDESK_TOKEN}&$filter=${encodeURIComponent(filter)}&$select=${select}`;
    
    const response = await proxiedFetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching units:', error);
    return [];
  }
};

/**
 * Submits a real ticket to the Movidesk API and returns the ticket ID.
 */
export const submitTicket = async (data: TicketFormData): Promise<string> => {
  const url = `${BASE_URL}/tickets?token=${MOVIDESK_TOKEN}`;

  const ticketPayload = {
    type: 2,
    subject: "Liberação Sugestão de Planos",
    urgency: "Alta",
    category: "Solicitação de serviço",
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
        value: "12345678",
        items: []
      },
      {
        customFieldId: 217972,
        customFieldRuleId: 113942,
        line: 1,
        value: `+${data.phone.replace(/\D/g, '')}`,
        items: []
      }
    ]
  };

  // Using proxiedFetch directly for POST ensures NO retry and NO double ticket
  const response = await proxiedFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(ticketPayload)
  });

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('Movidesk API Detailed Error:', responseData);
    throw new Error(`Failed to create ticket: ${response.status}`);
  }

  return responseData.id?.toString() || "N/A";
};
