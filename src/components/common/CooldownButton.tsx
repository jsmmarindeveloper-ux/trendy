import React, { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { getUserCooldownRemaining, setUserCooldown } from '../../lib/vtex';

interface CooldownButtonProps {
  sku: string;
  onSync: () => Promise<void>;
  size?: 'sm' | 'md';
  className?: string;
}

export const CooldownButton: React.FC<CooldownButtonProps> = ({
  sku,
  onSync,
  size = 'md',
  className = '',
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => getUserCooldownRemaining(sku));
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setSecondsRemaining(getUserCooldownRemaining(sku));

    const interval = setInterval(() => {
      const remaining = getUserCooldownRemaining(sku);
      setSecondsRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [sku]);

  const handleSyncClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (secondsRemaining > 0 || syncing) return;

    try {
      setSyncing(true);
      await onSync();
      setUserCooldown(sku);
      setSecondsRemaining(getUserCooldownRemaining(sku));
    } catch (err) {
      console.error('Error in manual price update:', err);
    } finally {
      setSyncing(false);
    }
  };

  const isSent = secondsRemaining > 0;
  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-xs sm:text-sm px-3 py-1.5';

  if (isSent) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 font-medium rounded-xl bg-[#EAFBF2] text-[#27AE60] border border-[#27AE60]/30 select-none shadow-2xs ${sizeClasses} ${className}`}
        title="Solicitud de actualización enviada. El sistema validará el nuevo precio con distribuidores."
      >
        <CheckCircle2 size={13} className="text-[#27AE60] shrink-0" />
        <span className="truncate">Se envió a validar, en unos minutos se actualizará</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleSyncClick}
      disabled={syncing}
      className={`inline-flex items-center gap-1.5 font-semibold rounded-xl bg-white hover:bg-[#FCEEF2] text-[#C4607A] border border-[#F2D6DF] hover:border-[#E8829A] transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 ${sizeClasses} ${className}`}
      title="Consultar y actualizar el precio de este producto con los distribuidores"
    >
      <RefreshCw size={13} className={syncing ? 'animate-spin text-[#E8829A]' : 'text-[#C4607A]'} />
      <span>{syncing ? 'Enviando...' : 'Actualizar Precio'}</span>
    </button>
  );
};
