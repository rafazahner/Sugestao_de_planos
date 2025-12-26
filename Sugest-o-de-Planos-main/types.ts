
export interface MovideskContact {
  contactType: number;
  contact: string;
  isMain: boolean;
}

export interface MovideskUnit {
  id: string;
  businessName: string;
}

export interface MovideskPerson {
  id: string;
  businessName: string;
  role: string;
  contacts?: MovideskContact[];
}

export enum FormStatus {
  IDLE = 'IDLE',
  VALIDATING = 'VALIDATING',
  SENDING = 'SENDING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED'
}

export interface TicketFormData {
  personId: string;
  email: string;
  phone: string;
  unitId: string;
  unitName: string;
  message: string;
}

export interface UserValidationResponse {
  isFranchisee: boolean;
  phone?: string;
  id?: string;
}
