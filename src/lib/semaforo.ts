import { MarginCalculation, MarginStatus, TenantConfig } from '../types';

/**
 * Motor de Semáforo de Decisión Comercial y Márgenes
 * Margen de Referencia vs Competidor: ((precio_competidor - precio_compra) / precio_competidor) * 100
 */
export function calcularSemaforo(
  precioCompra: number,
  precioVenta: number,
  precioCompetidor: number,
  tenantConfig?: Partial<TenantConfig>
): MarginCalculation {
  const warnThreshold = tenantConfig?.margen_warn_pct ?? 15;
  const dangerThreshold = tenantConfig?.margen_danger_pct ?? 0;

  if (!precioCompetidor || precioCompetidor <= 0) {
    const profitCOP = precioVenta - precioCompra;
    const profitOwnPct = precioVenta > 0 ? (profitCOP / precioVenta) * 100 : 0;
    return {
      status: profitOwnPct >= 20 ? 'OK' : profitOwnPct > 5 ? 'WARN' : 'DANGER',
      marginPct: profitOwnPct,
      profitOwnPct,
      profitCOP,
      priceDiffPct: 0,
      recommendation: 'Sin precio de competidor para comparar. Monitorea tu margen interno.',
    };
  }

  // Margen vs Competencia (potencial de ganancia si vendes al precio del mercado Trendy)
  const marginPct = ((precioCompetidor - precioCompra) / precioCompetidor) * 100;
  
  // Margen Propio real
  const profitCOP = precioVenta - precioCompra;
  const profitOwnPct = precioVenta > 0 ? (profitCOP / precioVenta) * 100 : 0;

  // Diferencia de tu precio de venta respecto al competidor
  const priceDiffPct = ((precioVenta - precioCompetidor) / precioCompetidor) * 100;

  let status: MarginStatus = 'OK';
  let recommendation = '';

  if (marginPct <= dangerThreshold) {
    status = 'DANGER';
    recommendation = '🔴 Margen no rentable vs competidor. Evalúa retirar del catálogo o renegociar con proveedor.';
  } else if (marginPct < warnThreshold) {
    status = 'WARN';
    recommendation = '⚠️ Margen ajustado. Monitorea cambios de precio de Trendy y no apliques descuentos adicionales.';
  } else {
    status = 'OK';
    recommendation = '✅ Margen saludable. Excelente oportunidad para promocionar en catálogo y campañas de pauta.';
  }

  return {
    status,
    marginPct,
    profitOwnPct,
    profitCOP,
    priceDiffPct,
    recommendation,
  };
}

export function getStatusColor(status: MarginStatus) {
  switch (status) {
    case 'OK':
      return {
        bg: 'bg-[#EAFBF2]',
        border: 'border-[#27AE60]/30',
        text: 'text-[#27AE60]',
        badgeBg: 'bg-[#27AE60]/10',
        label: 'Margen Saludable',
        icon: 'check',
      };
    case 'WARN':
      return {
        bg: 'bg-[#FEF6EC]',
        border: 'border-[#E67E22]/30',
        text: 'text-[#E67E22]',
        badgeBg: 'bg-[#E67E22]/10',
        label: 'Alerta de Margen',
        icon: 'alert-triangle',
      };
    case 'DANGER':
    default:
      return {
        bg: 'bg-[#FDEDEC]',
        border: 'border-[#D63031]/30',
        text: 'text-[#D63031]',
        badgeBg: 'bg-[#D63031]/10',
        label: 'Retirar / No Competitivo',
        icon: 'x-circle',
      };
  }
}
