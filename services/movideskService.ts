
import { MovideskPerson, UserValidationResponse, MovideskUnit, TicketFormData } from '../types';

const MOVIDESK_TOKEN = 'fb6ad8cd-1026-40b2-8224-f2a8dad2c97d';
const BASE_URL = 'https://api.movidesk.com/public/v1';
const PROXY_URL = 'https://corsproxy.io/?';
const BOTCONVERSA_WEBHOOK = 'https://new-backend.botconversa.com.br/api/v1/webhooks-automation/catch/149802/lPuK3NUeCd35/';

async function proxiedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const proxiedUrl = `${PROXY_URL}${encodeURIComponent(url)}`;
  return fetch(proxiedUrl, options);
}

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
        id: person.id,
        businessName: person.businessName
      };
    }
    
    return { isFranchisee: false };
  } catch (error) {
    console.error('Error checking user role:', error);
    throw error;
  }
};

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
 * Envia o payload idêntico ao que era enviado ao Movidesk para o webhook do BotConversa.
 */
export const submitTicket = async (data: TicketFormData): Promise<string> => {
  // Limpeza do telefone: remove tudo que não é número e retira o prefixo 55 se existir
  const rawPhone = data.phone.replace(/\D/g, '');
  const phoneWithoutCountry = rawPhone.startsWith('55') ? rawPhone.substring(2) : rawPhone;

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
        value: phoneWithoutCountry,
        items: []
      }
    ],
    // Metadados extras incluídos no webhook
    webhook_metadata: {
      email: data.email,
      businessName: data.businessName,
      sent_at: new Date().toISOString()
    }
  };

  const response = await proxiedFetch(BOTCONVERSA_WEBHOOK, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(ticketPayload)
  });

  if (!response.ok) {
    throw new Error(`Failed to send data to webhook: ${response.status}`);
  }

  return "OK";
};
