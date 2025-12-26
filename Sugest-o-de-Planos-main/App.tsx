
import React, { useEffect } from 'react';
import TicketForm from './components/TicketForm';
import Swal from 'sweetalert2';

const App: React.FC = () => {
  useEffect(() => {
    // Alerta inicial com a cor Laranja da marca
    Swal.fire({
      title: 'ATENÇÃO',
      text: 'SOMENTE FRANQUEADOS PODEM SOLICITAR A LIBERAÇÃO DESTE ACESSO.',
      icon: 'warning',
      iconColor: '#f08228', 
      confirmButtonColor: '#2fabab',
      confirmButtonText: 'ENTENDI',
      customClass: {
        icon: 'pulse-red'
      }
    });
  }, []);

  const backgroundUrl = "https://i.postimg.cc/Ls5qsRK4/CARDIO-800x600.jpg";
  const logoFooterUrl = "https://i.postimg.cc/JhL6wT9b/Gemini-Generated-Image-cbvbcbvbcbvbcbvb.png";

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 md:p-8 relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      {/* Overlay sólido para foco no formulário */}
      <div className="absolute inset-0 bg-slate-900/60 z-0"></div>

      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden relative z-10">
        {/* Barra superior sólida em Turquesa (fixa) */}
        <div className="h-1.5 w-full bg-[#2fabab]"></div>
        
        <header className="bg-white border-b border-gray-100 py-8 px-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Inclusão de Acesso
          </h1>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.15em] mt-1">
            Sugestão de Planos
          </p>
        </header>

        <main className="p-8 bg-white">
          <TicketForm />
        </main>

        <footer className="px-8 pb-8 text-center bg-white">
          <div className="flex justify-center mb-4">
             {/* Logo atualizado integrado ao fundo branco do card */}
             <img 
               src={logoFooterUrl} 
               alt="Brand Logo" 
               className="h-16 w-auto object-contain"
             />
          </div>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Suporte ao Franqueado
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
