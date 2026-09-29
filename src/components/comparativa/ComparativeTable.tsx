import React, { useState } from 'react';
import { Producto, CompetitorProductCache, TenantConfig } from '../../types';
import { formatCOP, formatPct, formatRelativeTime } from '../../lib/formatters';
import { calcularSemaforo } from '../../lib/semaforo';
import { BadgeSemaforo } from '../common/BadgeSemaforo';
import { CooldownButton } from '../common/CooldownButton';
import { obtenerProductoCompetidor } from '../../lib/vtex';
import {
  TrendingUp,
  Search,
  Filter,
  ExternalLink,
  Edit2,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';

interface ComparativeTableProps {
  productos: Producto[];
  competitorCache: Record<string, CompetitorProductCache>;
  tenantConfig?: Partial<TenantConfig>;
  onEditProduct: (p: Producto) => void;
  onRefreshSku: (sku: string) => Promise<void>;
  onOpenBulkSync: () => void;
}

export const ComparativeTable: React.FC<ComparativeTableProps> = ({
  productos,
  competitorCache,
  tenantConfig,
  onEditProduct,
  onRefreshSku,
  onOpenBulkSync,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OK' | 'WARN' | 'DANGER'>('ALL');
  const [sortBy, setSortBy] = useState<'margin' | 'diff' | 'price'>('margin');

  // Filter & search
  const filtered = productos.filter((p) => {
    const sku = p.referencia_competidor.toLowerCase();
    const name = p.nombre_personalizado.toLowerCase();
    const q = searchTerm.toLowerCase();
    const matchesSearch = sku.includes(q) || name.includes(q);

    if (!matchesSearch) return false;

    if (statusFilter !== 'ALL') {
      const comp = competitorCache[p.referencia_competidor];
      const semaforo = calcularSemaforo(
        p.precio_compra,
        p.precio_venta,
        comp?.precio_competidor || 0,
        tenantConfig
      );
      if (semaforo.status !== statusFilter) return false;
    }

    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const compA = competitorCache[a.referencia_competidor]?.precio_competidor || 0;
    const compB = competitorCache[b.referencia_competidor]?.precio_competidor || 0;
    const semA = calcularSemaforo(a.precio_compra, a.precio_venta, compA, tenantConfig);
    const semB = calcularSemaforo(b.precio_compra, b.precio_venta, compB, tenantConfig);

    if (sortBy === 'margin') {
      return semB.marginPct - semA.marginPct;
    }
    if (sortBy === 'diff') {
      return semA.priceDiffPct - semB.priceDiffPct;
    }
    return b.precio_venta - a.precio_venta;
  });

  return (
    <div className="space-y-4">
      
      {/* Top Banner / Explainer */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FFF9FB] via-white to-[#FDF6DC]/40 border border-[#F2D6DF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif-luxury text-xl font-bold text-[#2A1820]">
              Precios de Referencia del Mercado
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EAFBF2] text-[#27AE60] border border-[#27AE60]/30">
              Mayoristas Cosméticos
            </span>
          </div>
          <p className="text-xs text-[#8E6B77] mt-1">
            Monitorea los precios del mercado de cosméticos para asegurar que tus márgenes sean siempre competitivos y rentables.
          </p>
        </div>

        <button
          onClick={onOpenBulkSync}
          className="chic-gradient-btn px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
        >
          <RefreshCw size={14} />
          <span>Actualizar Precios del Mercado</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#F2D6DF] shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-2.5 text-[#8E6B77]" />
          <input
            type="text"
            placeholder="Buscar por SKU o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#F2D6DF] text-xs bg-[#FFF9FB] focus:outline-hidden focus:border-[#E8829A] text-[#2A1820]"
          />
        </div>

        {/* Status Filter Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              statusFilter === 'ALL'
                ? 'bg-[#2A1820] text-white'
                : 'bg-[#FAF0F4] text-[#8E6B77] hover:text-[#2A1820]'
            }`}
          >
            Todos ({productos.length})
          </button>
          <button
            onClick={() => setStatusFilter('OK')}
            className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1 ${
              statusFilter === 'OK'
                ? 'bg-[#27AE60] text-white'
                : 'bg-[#EAFBF2] text-[#27AE60] hover:bg-[#27AE60]/20'
            }`}
          >
            <span>Saludable</span>
          </button>
          <button
            onClick={() => setStatusFilter('WARN')}
            className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1 ${
              statusFilter === 'WARN'
                ? 'bg-[#E67E22] text-white'
                : 'bg-[#FEF6EC] text-[#E67E22] hover:bg-[#E67E22]/20'
            }`}
          >
            <span>Alerta</span>
          </button>
          <button
            onClick={() => setStatusFilter('DANGER')}
            className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1 ${
              statusFilter === 'DANGER'
                ? 'bg-[#D63031] text-white'
                : 'bg-[#FDEDEC] text-[#D63031] hover:bg-[#D63031]/20'
            }`}
          >
            <span>Retirar</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#F2D6DF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF0F4] text-[#8E6B77] font-semibold uppercase tracking-wider border-b border-[#F2D6DF] text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Producto & SKU</th>
                <th className="py-3.5 px-3">Costo Compra</th>
                <th className="py-3.5 px-3">Tu Precio Venta</th>
                <th className="py-3.5 px-3">Precio Mercado</th>
                <th className="py-3.5 px-3 text-center">Margen Estimado</th>
                <th className="py-3.5 px-3">Semáforo</th>
                <th className="py-3.5 px-3">Verificación</th>
                <th className="py-3.5 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2D6DF]/60">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    No se encontraron productos con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                sorted.map((prod) => {
                  const sku = prod.referencia_competidor;
                  const comp = competitorCache[sku];
                  const compPrice = comp?.precio_competidor || 0;
                  const semaforo = calcularSemaforo(
                    prod.precio_compra,
                    prod.precio_venta,
                    compPrice,
                    tenantConfig
                  );

                  return (
                    <tr key={prod.id} className="hover:bg-[#FFF9FB] transition-colors group">
                      {/* Product & Image */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={comp?.imagen_url || 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=100'}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-[#F2D6DF] shrink-0"
                          />
                          <div className="max-w-xs">
                            <span className="font-mono font-bold text-[11px] text-[#C4607A] block">
                              {sku}
                            </span>
                            <span className="font-medium text-[#2A1820] truncate block">
                              {prod.nombre_personalizado}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-[#8E6B77] bg-[#FAF0F4] px-1.5 py-0.5 rounded">
                                {prod.categoria}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-3 font-semibold text-[#8E6B77]">
                        {formatCOP(prod.precio_compra)}
                      </td>

                      {/* Your Sale Price */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#2A1820]">
                            {formatCOP(prod.precio_venta)}
                          </span>
                          <button
                            onClick={() => onEditProduct(prod)}
                            className="p-1 rounded text-[#8E6B77] hover:text-[#C4607A] hover:bg-[#FAF0F4] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Ajustar precio"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                        <span className="text-[10px] text-[#27AE60] font-medium block">
                          Ganancia: +{formatCOP(semaforo.profitCOP)}
                        </span>
                      </td>

                      {/* Competitor VTEX Price */}
                      <td className="py-3 px-3">
                        {compPrice > 0 ? (
                          <div>
                            <span className="font-bold text-[#2A1820] block">
                              {formatCOP(compPrice)}
                            </span>
                            {comp?.url_competidor && (
                              <a
                                href={comp.url_competidor}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-[#C4607A] hover:underline flex items-center gap-0.5"
                              >
                                Trendy Shop <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Sin datos</span>
                        )}
                      </td>

                      {/* Margin % vs VTEX */}
                      <td className="py-3 px-3 text-center">
                        <span className={`font-mono font-bold text-sm ${
                          semaforo.status === 'OK' ? 'text-[#27AE60]' : semaforo.status === 'WARN' ? 'text-[#E67E22]' : 'text-[#D63031]'
                        }`}>
                          {formatPct(semaforo.marginPct, true)}
                        </span>
                        <span className="text-[10px] text-[#8E6B77] block">
                          Propio: {semaforo.profitOwnPct.toFixed(0)}%
                        </span>
                      </td>

                      {/* Semáforo Badge */}
                      <td className="py-3 px-3">
                        <BadgeSemaforo status={semaforo.status} size="sm" />
                      </td>

                      {/* Sync timestamp */}
                      <td className="py-3 px-3 text-[#8E6B77] text-[11px]">
                        {formatRelativeTime(comp?.ultima_sync)}
                      </td>

                      {/* Cooldown Button (10 min anti-burst) */}
                      <td className="py-3 px-4 text-right">
                        <CooldownButton
                          sku={sku}
                          onSync={() => onRefreshSku(sku)}
                          size="sm"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
