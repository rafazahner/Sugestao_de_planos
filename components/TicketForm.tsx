
import React, { useState, useEffect } from 'react';
import { FormStatus, TicketFormData, MovideskUnit } from '../types';
import { checkUserRole, submitTicket, fetchUnits } from '../services/movideskService';
import { AlertCircle, CheckCircle2, XCircle, Loader2, Send, Eraser, Phone, Building2, ChevronDown, MessageCircle } from 'lucide-react';

const TicketForm: React.FC = () => {
  const [formData, setFormData] = useState<TicketFormData>({ 
    personId: '',
    businessName: '',
    email: '', 
    phone: '55', 
    unitId: '', 
    unitName: '', 
    message: '' 
  });
  const [units, setUnits] = useState<MovideskUnit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [status, setStatus] = useState<FormStatus>(FormStatus.IDLE);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  useEffect(() => {
    const loadUnits = async () => {
      setIsLoadingUnits(true);
      try {
        const data = await fetchUnits();
        const sorted = data.sort((a, b) => (a.businessName || '').localeCompare(b.businessName || ''));
        setUnits(sorted);
      } catch (err) {
        console.error('Failed to load units', err);
      } finally {
        setIsLoadingUnits(false);
      }
    };
    loadUnits();
  }, []);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailBlur = async () => {
    const email = formData.email.trim();
    if (!email || !validateEmail(email)) {
      setIsAuthorized(null);
      return;
    }

    setIsValidating(true);
    try {
      const { isFranchisee, phone, id, businessName } = await checkUserRole(email);
      
      if (!isFranchisee) {
        setIsAuthorized(false);
        setStatus(FormStatus.UNAUTHORIZED);
        setFormData(prev => ({ ...prev, personId: '', businessName: '' }));
      } else if (!phone) {
        setIsAuthorized(false);
        setStatus(FormStatus.INCOMPLETE);
        setFormData(prev => ({ ...prev, personId: '', businessName: businessName || '', phone: '55' }));
      } else {
        setIsAuthorized(true);
        setStatus(FormStatus.IDLE);
        let sanitizedPhone = phone.replace(/\D/g, '');
        setFormData(prev => ({ 
          ...prev, 
          personId: id || '', 
          businessName: businessName || '',
          phone: sanitizedPhone.startsWith('55') ? sanitizedPhone : '55' + sanitizedPhone 
        }));
      }
    } catch (err) {
      console.error('Validation error:', err);
      setStatus(FormStatus.ERROR);
    } finally {
      setIsValidating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'unitId') {
      const selectedUnit = units.find(u => u.id === value);
      setFormData(prev => ({ ...prev, unitId: value, unitName: selectedUnit ? selectedUnit.businessName : '' }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    if (status !== FormStatus.IDLE) setStatus(FormStatus.IDLE);
  };

  const handleReset = () => {
    setFormData({ personId: '', businessName: '', email: '', phone: '55', unitId: '', unitName: '', message: '' });
    setStatus(FormStatus.IDLE);
    setIsAuthorized(null);
    setTicketId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === FormStatus.SENDING) return;
    if (!isAuthorized || !formData.personId) {
      if (status === FormStatus.INCOMPLETE) return; 
      setStatus(FormStatus.UNAUTHORIZED);
      return;
    }

    setStatus(FormStatus.SENDING);
    try {
      await submitTicket(formData);
      setStatus(FormStatus.SUCCESS);
      setFormData({ personId: '', businessName: '', email: '', phone: '55', unitId: '', unitName: '', message: '' });
      setIsAuthorized(null);
    } catch (err) {
      setStatus(FormStatus.ERROR);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {status === FormStatus.SUCCESS && (
        <div className="p-4 bg-emerald-50 border border-[#2fabab] rounded-lg animate-in fade-in zoom-in duration-300">
          <div className="flex items-center gap-3 text-emerald-700">
            <CheckCircle2 size={20} className="shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-bold uppercase tracking-tight">Solicitação Recebida!</p>
              <p className="text-[11px] leading-relaxed font-medium">
                Sua solicitação foi processada com sucesso. Uma confirmação foi encaminhada agora mesmo via WhatsApp.
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[#2fabab] bg-emerald-100/50 py-1.5 px-3 rounded text-[10px] font-bold uppercase">
            <MessageCircle size={14} />
            Verifique seu celular
          </div>
        </div>
      )}

      {status === FormStatus.ERROR && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
          <XCircle size={18} className="mt-0.5 shrink-0" />
          <p className="text-xs font-medium">Ocorreu um erro ao processar seu envio. Por favor, tente novamente.</p>
        </div>
      )}

      {status === FormStatus.UNAUTHORIZED && (
        <div className="p-4 bg-orange-50 border border-[#f08228] rounded-lg flex items-start gap-3 text-[#f08228]">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="text-xs font-bold">Acesso restrito: Perfil de Franqueado não identificado.</p>
        </div>
      )}

      {status === FormStatus.INCOMPLETE && (
        <div className="p-4 bg-orange-50 border border-[#f08228] rounded-lg flex items-start gap-3 text-[#f08228] animate-in slide-in-from-top-1 duration-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-tight">Cadastro Incompleto</p>
            <p className="text-[11px] leading-relaxed">
              O seu cadastro está incompleto no sistema (telefone não encontrado). 
              Sendo assim, você deve abrir um chamado para atualizar seus dados antes de prosseguir.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">E-mail Corporativo</label>
          <div className="relative">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleEmailBlur}
              placeholder="exemplo@unidade.com.br"
              className={`w-full px-4 py-2.5 bg-gray-50 border rounded-lg text-sm transition-all outline-none
                ${isAuthorized === true ? 'border-[#2fabab] ring-1 ring-[#2fabab]' : 
                  isAuthorized === false ? 'border-[#f08228] ring-1 ring-[#f08228]' : 
                  'border-gray-200 focus:border-[#2fabab]'}`}
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isValidating && <Loader2 size={16} className="text-[#2fabab] animate-spin" />}
              {isAuthorized === true && <CheckCircle2 size={16} className="text-[#2fabab]" />}
              {isAuthorized === false && <AlertCircle size={16} className="text-[#f08228]" />}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sua Unidade</label>
          <div className="relative">
            <select
              name="unitId"
              value={formData.unitId}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm appearance-none focus:border-[#2fabab] outline-none"
              required
            >
              <option value="">Selecione...</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.businessName}</option>)}
            </select>
            <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">WhatsApp</label>
          <div className="relative">
            <input
              type="text"
              name="phone"
              value={formData.phone}
              readOnly
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 outline-none cursor-not-allowed"
              required
            />
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sua Solicitação</label>
          <textarea
            name="message"
            rows={3}
            value={formData.message}
            onChange={handleInputChange}
            placeholder="Detalhes sobre a liberação..."
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-[#2fabab] outline-none resize-none transition-colors"
            required
          ></textarea>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <button
          type="submit"
          disabled={!isAuthorized || isValidating || status === FormStatus.SENDING}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-xs uppercase tracking-widest bg-[#2fabab] text-white hover:brightness-95 active:scale-[0.98] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {status === FormStatus.SENDING ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> Enviar Solicitação</>}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-xs uppercase tracking-widest bg-[#f08228] text-white hover:brightness-95 active:scale-[0.98]"
        >
          <Eraser size={14} /> Limpar campos
        </button>
      </div>
    </form>
  );
};

export default TicketForm;
