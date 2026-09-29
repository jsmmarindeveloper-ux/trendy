import React, { useState } from 'react';
import { Producto, CompetitorProductCache } from '../../types';
import { obtenerProductoCompetidor, CACHE_TTL_MS } from '../../lib/vtex';
import { RefreshCw, CheckCircle, Database, X, ShieldAlert } from 'lucide-react';

interface BulkSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  productos: Producto[];
  competitorCache: Record<string, CompetitorProductCache>;
  onSyncComplete: () => Promise<void>;
}

export const BulkSyncModal: React.FC<BulkSyncModalProps> = ({
  isOpen,
  onClose,
  productos,
  competitorCache,
  onSyncComplete,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSku, setCurrentSku] = useState('');
  const [results, setResults] = useState<{
    cacheHits: number;
    syncedNew: number;
    failed: number;
  } | null>(null);

  if (!isOpen) return null;

  const startSync = async (forceAll = false) => {
    setIsRunning(true);
    setProgress(0);
    setResults(null);

    let cacheHits = 0;
    let syncedNew = 0;
    let failed = 0;

    const total = productos.length;
    const now = Date.now();

    for (let i = 0; i < total; i++) {
      const p = productos[i];
      const sku = p.referencia_competidor;
      setCurrentSku(sku);

      // Check if cache is fresh
      const existing = competitorCache[sku];
      const syncTime = existing?.ultima_sync?.toMillis
        ? existing.ultima_sync.toMillis()
        : 0;

      if (!forceAll && syncTime > 0 && now - syncTime < CACHE_TTL_MS) {
        cacheHits++;
      } else {
        try {
          const res = await obtenerProductoCompetidor(sku, forceAll);
          if (res) {
            syncedNew++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }

      setProgress(Math.round(((i + 1) / total) * 100));
      // Brief pause to allow UI render
      await new Promise(r => setTimeout(r, 120));
    }

    setResults({ cacheHits, syncedNew, failed });
    setIsRunning(false);
    await onSyncComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[#F2D6DF] p-6 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F2D6DF]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FCEEF2] text-[#C4607A]">
              <RefreshCw size={20} />
            </div>
            <div>
              <h3 className="font-serif-luxury text-lg font-bold text-[#2A1820]">
                Actualizar Precios del Mercado
              </h3>
              <p className="text-xs text-[#8E6B77]">
                Verificación automática con catálogos de referencia
              </p>
            </div>
          </div>
          {!isRunning && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8E6B77] hover:bg-[#FAF0F4] hover:text-[#2A1820]"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="py-5 space-y-4">
          <p className="text-xs text-[#8E6B77] leading-relaxed">
            Se verificarán los precios de <strong className="text-[#2A1820]">{productos.length} referencias</strong> para mantener calculados tus márgenes de ganancia y alertarte de cambios en el mercado.
          </p>

          {/* Progress Section */}
          {isRunning && (
            <div className="space-y-2 bg-[#FFF9FB] p-4 rounded-xl border border-[#F2D6DF]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#2A1820] flex items-center gap-1.5">
                  <RefreshCw size={13} className="animate-spin text-[#E8829A]" />
                  Consultando referencia: <strong className="text-[#C4607A]">{currentSku}</strong>
                </span>
                <span className="font-bold text-[#C4607A]">{progress}%</span>
              </div>
              <div className="w-full bg-[#FAF0F4] rounded-full h-2 overflow-hidden border border-[#F2D6DF]/60">
                <div
                  className="bg-gradient-to-r from-[#E8829A] to-[#C4607A] h-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Results Summary */}
          {results && (
            <div className="bg-[#EAFBF2] border border-[#27AE60]/30 rounded-xl p-4 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-sm font-bold text-[#27AE60]">
                <CheckCircle size={18} />
                <span>Precios Verificados Exitosamente</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                <div className="bg-white/80 p-2 rounded-lg border border-[#27AE60]/20">
                  <span className="block font-bold text-sm text-[#27AE60]">{results.cacheHits}</span>
                  <span className="text-[10px] text-[#8E6B77]">Al Día</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-[#27AE60]/20">
                  <span className="block font-bold text-sm text-[#C4607A]">{results.syncedNew}</span>
                  <span className="text-[10px] text-[#8E6B77]">Actualizados</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-[#27AE60]/20">
                  <span className="block font-bold text-sm text-[#8E6B77]">{results.failed}</span>
                  <span className="text-[10px] text-[#8E6B77]">Sin Cambios</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F2D6DF]">
          <button
            onClick={onClose}
            disabled={isRunning}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#8E6B77] hover:bg-[#FAF0F4] transition-colors cursor-pointer"
          >
            {results ? 'Cerrar' : 'Cancelar'}
          </button>
          {!results && (
            <button
              onClick={() => startSync(false)}
              disabled={isRunning || productos.length === 0}
              className="chic-gradient-btn px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={isRunning ? 'animate-spin' : ''} />
              <span>{isRunning ? 'Actualizando...' : 'Actualizar Precios Ahora'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
