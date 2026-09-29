import React from 'react';
import { useAuth } from '../../lib/auth-context';
import { Lock, Mail, LogOut, Sparkles, Store } from 'lucide-react';
import { DEFAULT_SUPERADMIN_EMAIL } from '../../lib/seed-data';

interface SinAccesoViewProps {
  onRetry: () => void;
}

export const SinAccesoView: React.FC<SinAccesoViewProps> = ({ onRetry }) => {
  const { user, signOutUser, isSuperAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-[#FFF9FB] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#F2D6DF] p-8 space-y-6 text-center animate-in fade-in zoom-in-95">
        
        <div className="w-16 h-16 rounded-3xl bg-[#FAF0F4] text-[#C4607A] flex items-center justify-center mx-auto border border-[#F2D6DF]">
          <Lock size={30} />
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#E67E22] bg-[#FEF6EC] px-2.5 py-1 rounded-full border border-[#E67E22]/30">
            Membresía Pendiente
          </span>
          <h1 className="font-serif-luxury text-2xl font-bold text-[#2A1820] mt-3">
            Acceso en Espera
          </h1>
          <p className="text-xs text-[#8E6B77] mt-2 leading-relaxed">
            Hola <strong className="text-[#2A1820]">{user?.email}</strong>. Tu cuenta aún no tiene una empresa o tienda asignada en OmniRetail Suite.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFF9FB] border border-[#F2D6DF] text-xs text-[#8E6B77] space-y-2 text-left">
          <p className="font-semibold text-[#2A1820]">¿Qué puedes hacer?</p>
          <ul className="list-disc list-inside space-y-1 text-[11px]">
            <li>Pide a la administradora de tu tienda que te envíe una invitación con tu correo.</li>
            <li>O contacta al Super Administrador en <span className="font-mono text-[#C4607A]">{DEFAULT_SUPERADMIN_EMAIL}</span>.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <button
            onClick={onRetry}
            className="w-full chic-gradient-btn py-2.5 px-4 rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
          >
            Verificar Acceso Nuevamente
          </button>

          <button
            onClick={signOutUser}
            className="w-full py-2 px-4 rounded-xl text-xs font-medium text-[#8E6B77] hover:bg-[#FAF0F4] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut size={13} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};
