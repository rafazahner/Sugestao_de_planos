import { UserValidationResponse, MovideskUnit, TicketFormData } from '../types';

async function apiFetch<T>(input: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(input, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    let message = `API error: ${response.status}`;

    try {
      const body = await response.json();
      if (body?.message) {
        message = `${body.message} (${response.status})`;
      }
    } catch {
      // Keep the generic message when the response is not JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const checkUserRole = async (email: string): Promise<UserValidationResponse> => {
  try {
    const query = new URLSearchParams({ email });
    return await apiFetch<UserValidationResponse>(`/api/check-user-role?${query.toString()}`);
  } catch (error) {
    console.error('Error checking user role:', error);
    throw error;
  }
};

export const fetchUnits = async (): Promise<MovideskUnit[]> => {
  try {
    return await apiFetch<MovideskUnit[]>('/api/units');
  } catch (error) {
    console.error('Error fetching units:', error);
    return [];
  }
};

export const submitTicket = async (data: TicketFormData): Promise<string> => {
  await apiFetch<{ ok: boolean }>('/api/submit-ticket', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  return 'OK';
};
