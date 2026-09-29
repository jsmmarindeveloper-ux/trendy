import React from 'react';
import { Producto, CompetitorProductCache, TenantConfig } from '../../types';
import { formatCOP, formatPct } from '../../lib/formatters';
import { calcularSemaforo } from '../../lib/semaforo';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Package,
  Layers,
  ShoppingBag
} from 'lucide-react';

interface MetricsCardsProps {
  productos: Producto[];
  competitorCache: Record<string, CompetitorProductCache>;
  config?: Partial<TenantConfig>;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  productos,
  competitorCache,
  config,
}) => {
  // Calculations
  let totalCostCOP = 0;
  let totalRetailCOP = 0;
  let totalUnits = 0;
  let dangerAlerts = 0;
  let warnAlerts = 0;
  let highRotationCount = 0;
  let outOfStockCount = 0;

  let totalMarginSum = 0;
  let marginCount = 0;

  productos.forEach((p) => {
    const cost = p.precio_compra || 0;
    const sale = p.precio_venta || 0;
    const stock = p.stock || 0;
    const cache = competitorCache[p.referencia_competidor];
    const compPrice = cache?.precio_competidor || 0;

    totalCostCOP += cost * stock;
    totalRetailCOP += sale * stock;
    totalUnits += stock;

    if (stock <= 0) {
      outOfStockCount++;
    }

    if (p.rotacion_ia === 'alta') {
      highRotationCount++;
    }

    const semaforo = calcularSemaforo(cost, sale, compPrice, config);
    if (semaforo.status === 'DANGER') dangerAlerts++;
    if (semaforo.status === 'WARN') warnAlerts++;

    if (semaforo.marginPct) {
      totalMarginSum += semaforo.marginPct;
      marginCount++;
    }
  });

  const avgMargin = marginCount > 0 ? totalMarginSum / marginCount : 0;
  const projectedGrossProfit = totalRetailCOP - totalCostCOP;

  const cards = [
    {
      title: 'Valor Inventario (Costo)',
      value: formatCOP(totalCostCOP),
      subtitle: `${totalUnits} unidades en bodega`,
      icon: DollarSign,
      color: 'from-[#E8829A]/15 to-[#FCEEF2]',
      iconColor: 'text-[#C4607A]',
      borderColor: 'border-[#F2D6DF]',
    },
    {
      title: 'Margen Promedio vs Mercado',
      value: formatPct(avgMargin, true),
      subtitle: avgMargin >= 15 ? '✅ Margen saludable global' : '⚠️ Atención requerida en márgenes',
      icon: TrendingUp,
      color: avgMargin >= 15 ? 'from-[#EAFBF2] to-white' : 'from-[#FEF6EC] to-white',
      iconColor: avgMargin >= 15 ? 'text-[#27AE60]' : 'text-[#E67E22]',
      borderColor: avgMargin >= 15 ? 'border-[#27AE60]/30' : 'border-[#E67E22]/30',
    },
    {
      title: 'Semáforo de Alertas',
      value: `${dangerAlerts + warnAlerts}`,
      subtitle: `${dangerAlerts} críticas (🔴) • ${warnAlerts} preventivas (⚠️)`,
      icon: AlertTriangle,
      color: dangerAlerts > 0 ? 'from-[#FDEDEC] to-white' : 'from-[#FAF0F4] to-white',
      iconColor: dangerAlerts > 0 ? 'text-[#D63031]' : 'text-[#E67E22]',
      borderColor: dangerAlerts > 0 ? 'border-[#D63031]/30' : 'border-[#F2D6DF]',
    },
    {
      title: 'Productos en Catálogo',
      value: `${productos.filter(p => p.visible_catalogo).length}`,
      subtitle: `Visibles en tu enlace web`,
      icon: ShoppingBag,
      color: 'from-[#FDF6DC] to-white',
      iconColor: 'text-[#D4AF37]',
      borderColor: 'border-[#D4AF37]/30',
    },
    {
      title: 'Catálogo de SKUs',
      value: `${productos.length}`,
      subtitle: `${outOfStockCount} productos agotados`,
      icon: Layers,
      color: 'from-[#FAF0F4] to-white',
      iconColor: 'text-[#8E6B77]',
      borderColor: 'border-[#F2D6DF]',
    },
    {
      title: 'Utilidad Proyectada',
      value: formatCOP(projectedGrossProfit),
      subtitle: `Al vender el stock completo`,
      icon: Package,
      color: 'from-[#EAFBF2] to-white',
      iconColor: 'text-[#27AE60]',
      borderColor: 'border-[#27AE60]/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`luxury-card p-5 bg-gradient-to-br ${card.color} ${card.borderColor} flex flex-col justify-between`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-[#8E6B77] uppercase tracking-wider">
                  {card.title}
                </p>
                <h3 className="font-serif-luxury text-2xl font-bold text-[#2A1820] mt-1.5">
                  {card.value}
                </h3>
              </div>
              <div className={`p-2.5 rounded-xl bg-white/90 shadow-xs border border-white/60 ${card.iconColor}`}>
                <Icon size={20} />
              </div>
            </div>
            <p className="text-xs text-[#8E6B77] mt-3 font-medium border-t border-black/5 pt-2">
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
};
