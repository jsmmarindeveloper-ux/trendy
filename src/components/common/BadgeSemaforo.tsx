import React from 'react';
import { MarginStatus } from '../../types';
import { getStatusColor } from '../../lib/semaforo';
import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

interface BadgeSemaforoProps {
  status: MarginStatus;
  marginPct?: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const BadgeSemaforo: React.FC<BadgeSemaforoProps> = ({
  status,
  marginPct,
  showIcon = true,
  size = 'md',
}) => {
  const meta = getStatusColor(status);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs sm:text-sm px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-medium',
  }[size];

  const renderIcon = () => {
    if (!showIcon) return null;
    const iconSize = size === 'sm' ? 12 : 14;
    switch (status) {
      case 'OK':
        return <CheckCircle2 size={iconSize} className="text-[#27AE60]" />;
      case 'WARN':
        return <AlertTriangle size={iconSize} className="text-[#E67E22]" />;
      case 'DANGER':
      default:
        return <AlertOctagon size={iconSize} className="text-[#D63031]" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${meta.bg} ${meta.text} ${meta.border} ${sizeClasses} transition-all`}
    >
      {renderIcon()}
      <span>{meta.label}</span>
      {typeof marginPct === 'number' && (
        <span className="font-semibold opacity-90">({marginPct > 0 ? '+' : ''}{marginPct.toFixed(1)}%)</span>
      )}
    </span>
  );
};
