import React, { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { Sparkles, ShieldCheck, ArrowRight, Store, Database, Flame } from 'lucide-react';

interface LoginViewProps {
  onSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const { signInWithGoogle, loading } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setErrorMsg(null);
      await signInWithGoogle();
      onSuccess();
    } catch (err: any) {
      console.error('Error signing in:', err);
      setErrorMsg('No se pudo completar el inicio de sesión. Por favor intenta nuevamente.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9FB] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#F2D6DF] p-8 space-y-6 text-center animate-in fade-in zoom-in-95">
        
        {/* Logo and Icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#E8829A] via-[#C4607A] to-[#D4AF37] flex items-center justify-center text-white mx-auto shadow-lg shadow-[#E8829A]/30">
          <Sparkles size={32} className="text-[#FDF6DC]" />
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] bg-[#FDF6DC] px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
            SaaS B2B • Retail Cosmético
          </span>
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#2A1820] mt-3">
            OmniRetail Intelligence
          </h1>
          <p className="text-xs text-[#8E6B77] mt-1.5 leading-relaxed">
            Plataforma corporativa de inteligencia de precios, caché VTEX compartido y catálogos digitales para empresas de belleza.
          </p>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 gap-2 text-left text-xs bg-[#FAF0F4] p-3 rounded-2xl border border-[#F2D6DF]">
          <div className="flex items-center gap-2 text-[#2A1820]">
            <Database size={15} className="text-[#27AE60]" />
            <span>Caché VTEX TTL 24h</span>
          </div>
          <div className="flex items-center gap-2 text-[#2A1820]">
            <Flame size={15} className="text-[#E8829A]" />
            <span>Rotación IA Gemini</span>
          </div>
          <div className="flex items-center gap-2 text-[#2A1820]">
            <Store size={15} className="text-[#D4AF37]" />
            <span>Catálogo WhatsApp</span>
          </div>
          <div className="flex items-center gap-2 text-[#2A1820]">
            <ShieldCheck size={15} className="text-[#C4607A]" />
            <span>Semáforo de Margen</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-[#FDEDEC] text-[#D63031] text-xs font-medium border border-[#D63031]/30">
            {errorMsg}
          </div>
        )}

        {/* Google Sign In Button */}
        <div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-[#2A1820] font-semibold text-xs sm:text-sm py-3 px-4 rounded-2xl border border-gray-300 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Conectando con Google...' : 'Continuar con Google'}</span>
          </button>
        </div>

        <p className="text-[11px] text-[#8E6B77]">
          Acceso seguro mediante Firebase Authentication & Cloud Firestore.
        </p>
      </div>
    </div>
  );
};
