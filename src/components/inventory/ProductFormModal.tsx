import React, { useState, useEffect } from 'react';
import { Producto, CompetitorProductCache, TenantConfig } from '../../types';
import { obtenerProductoCompetidor } from '../../lib/vtex';
import { calcularSemaforo } from '../../lib/semaforo';
import { BadgeSemaforo } from '../common/BadgeSemaforo';
import { formatCOP } from '../../lib/formatters';
import {
  X,
  Search,
  Sparkles,
  ShoppingBag,
  DollarSign,
  Layers,
  Check,
  AlertCircle
} from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Producto>) => Promise<void>;
  productToEdit?: Producto | null;
  tenantId: string;
  cachedCompetitors: CompetitorProductCache[];
  tenantConfig?: Partial<TenantConfig>;
}

const CATEGORIAS = [
  'Rostro',
  'Labios',
  'Ojos',
  'Skincare',
  'Brochas & Accesorios',
  'Uñas',
  'Kits & Promociones',
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  tenantId,
  cachedCompetitors,
  tenantConfig,
}) => {
  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Rostro');
  const [precioCompra, setPrecioCompra] = useState<number>(0);
  const [precioVenta, setPrecioVenta] = useState<number>(0);
  const [stock, setStock] = useState<number>(10);
  const [notas, setNotas] = useState('');
  const [visibleCatalogo, setVisibleCatalogo] = useState(true);

  // Autocomplete & VTEX search states
  const [skuSuggestions, setSkuSuggestions] = useState<CompetitorProductCache[]>([]);
  const [isSearchingVtex, setIsSearchingVtex] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorProductCache | null>(null);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setSku(productToEdit.referencia_competidor || '');
      setNombre(productToEdit.nombre_personalizado || '');
      setCategoria(productToEdit.categoria || 'Rostro');
      setPrecioCompra(productToEdit.precio_compra || 0);
      setPrecioVenta(productToEdit.precio_venta || 0);
      setStock(productToEdit.stock ?? 10);
      setNotas(productToEdit.notas || '');
      setVisibleCatalogo(productToEdit.visible_catalogo ?? true);

      // Find matching cached competitor
      const comp = cachedCompetitors.find(
        c => c.referencia.toUpperCase() === productToEdit.referencia_competidor.toUpperCase()
      );
      if (comp) setSelectedCompetitor(comp);
    } else {
      // Reset form
      setSku('');
      setNombre('');
      setCategoria('Rostro');
      setPrecioCompra(0);
      setPrecioVenta(0);
      setStock(12);
      setNotas('');
      setVisibleCatalogo(true);
      setSelectedCompetitor(null);
      setSearchFeedback(null);
    }
  }, [productToEdit, isOpen, cachedCompetitors]);

  // Handle SKU typing and autocomplete suggestions
  const handleSkuChange = (val: string) => {
    const raw = val.toUpperCase().trim();
    setSku(raw);
    setSearchFeedback(null);

    if (raw.length >= 2) {
      const matches = cachedCompetitors.filter(c =>
        c.referencia.toUpperCase().includes(raw) || c.nombre.toUpperCase().includes(raw)
      );
      setSkuSuggestions(matches.slice(0, 5));
    } else {
      setSkuSuggestions([]);
    }
  };

  const selectSuggestion = (item: CompetitorProductCache) => {
    setSku(item.referencia);
    setSelectedCompetitor(item);
    setSkuSuggestions([]);
    if (!nombre) {
      setNombre(item.nombre);
    }
    if (precioVenta === 0) {
      // Default to slightly competitive or matching price
      setPrecioVenta(item.precio_competidor);
    }
  };

  const queryVtexDirectly = async () => {
    if (!sku) return;
    setIsSearchingVtex(true);
    setSearchFeedback(null);
    try {
      const data = await obtenerProductoCompetidor(sku, false);
      if (data) {
        setSelectedCompetitor(data);
        if (!nombre) setNombre(data.nombre);
        if (precioVenta === 0) setPrecioVenta(data.precio_competidor);
        setSearchFeedback(`✅ Información de VTEX encontrada para ${sku}`);
      } else {
        setSearchFeedback('⚠️ No se encontró en Trendy Shop. Puedes crearlo manualmente.');
      }
    } catch {
      setSearchFeedback('⚠️ Error al conectar con VTEX.');
    } finally {
      setIsSearchingVtex(false);
      setSkuSuggestions([]);
    }
  };

  const semaforo = calcularSemaforo(
    precioCompra,
    precioVenta,
    selectedCompetitor?.precio_competidor || 0,
    tenantConfig
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !nombre.trim()) return;

    try {
      setSaving(true);
      const slug = nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      await onSave({
        tenant_id: tenantId,
        referencia_competidor: sku.trim().toUpperCase(),
        nombre_personalizado: nombre.trim(),
        slug: slug || `prod-${Date.now()}`,
        precio_compra: Number(precioCompra),
        precio_venta: Number(precioVenta),
        stock: Number(stock),
        categoria,
        notas,
        visible_catalogo: visibleCatalogo,
      });
      onClose();
    } catch (err) {
      console.error('Error saving product:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#F2D6DF] p-6 my-8 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F2D6DF]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C4607A]">
              Gestión de Catálogo
            </span>
            <h3 className="font-serif-luxury text-xl font-bold text-[#2A1820]">
              {productToEdit ? 'Editar Producto' : 'Agregar Nuevo Producto'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8E6B77] hover:bg-[#FAF0F4] hover:text-[#2A1820] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="py-4 space-y-4 text-xs sm:text-sm">
          
          {/* SKU / Referencia with Autocomplete */}
          <div className="relative">
            <label className="block text-xs font-semibold text-[#2A1820] mb-1">
              Referencia / SKU Competidor (ej. DY2075, BT098, TR1024) *
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => handleSkuChange(e.target.value)}
                  placeholder="Escribe el código SKU..."
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#F2D6DF] focus:outline-hidden focus:border-[#E8829A] focus:ring-2 focus:ring-[#E8829A]/20 bg-[#FFF9FB] text-[#2A1820] font-mono uppercase"
                />
                {skuSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-[#F2D6DF] rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-[#8E6B77] uppercase bg-[#FAF0F4]">
                      Encontrados en Caché Global Maestro:
                    </div>
                    {skuSuggestions.map((item) => (
                      <div
                        key={item.referencia}
                        onClick={() => selectSuggestion(item)}
                        className="p-2.5 hover:bg-[#FCEEF2] cursor-pointer flex items-center justify-between border-b border-[#F2D6DF]/40 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={item.imagen_url || 'https://via.placeholder.com/40'}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover border border-[#F2D6DF]"
                          />
                          <div>
                            <span className="font-bold text-[#C4607A] block">{item.referencia}</span>
                            <span className="text-[11px] text-[#2A1820] truncate block max-w-xs">{item.nombre}</span>
                          </div>
                        </div>
                        <span className="font-bold text-xs text-[#27AE60]">{formatCOP(item.precio_competidor)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={queryVtexDirectly}
                disabled={isSearchingVtex || !sku}
                className="px-3 py-2 rounded-xl bg-[#FAF0F4] hover:bg-[#FCEEF2] text-[#C4607A] border border-[#F2D6DF] font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Consultar precio y foto en VTEX Trendy Shop"
              >
                <Search size={14} className={isSearchingVtex ? 'animate-spin' : ''} />
                <span>{isSearchingVtex ? 'Consultando...' : 'Consultar VTEX'}</span>
              </button>
            </div>

            {searchFeedback && (
              <p className="text-xs text-[#8E6B77] mt-1.5 flex items-center gap-1">
                {searchFeedback}
              </p>
            )}

            {/* Display matched competitor preview card */}
            {selectedCompetitor && (
              <div className="mt-2.5 p-3 rounded-xl bg-[#FAF0F4] border border-[#F2D6DF] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedCompetitor.imagen_url || 'https://via.placeholder.com/50'}
                    alt={selectedCompetitor.nombre}
                    className="w-12 h-12 rounded-lg object-cover border border-white shadow-xs"
                  />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8E6B77]">
                      Vendido por Trendy Shop en:
                    </span>
                    <p className="font-bold text-sm text-[#2A1820]">
                      {formatCOP(selectedCompetitor.precio_competidor)}
                    </p>
                    <span className="text-[11px] text-[#27AE60] flex items-center gap-1">
                      <Check size={12} /> {selectedCompetitor.disponible ? 'Disponible en bodega oficial' : 'Agotado en competidor'}
                    </span>
                  </div>
                </div>
                <a
                  href={selectedCompetitor.url_competidor}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#C4607A] underline hover:text-[#2A1820]"
                >
                  Ver en Trendy
                </a>
              </div>
            )}
          </div>

          {/* Nombre personalizado */}
          <div>
            <label className="block text-xs font-semibold text-[#2A1820] mb-1">
              Nombre Comercial en Tu Tienda *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre visible para tus clientes"
              required
              className="w-full px-3.5 py-2 rounded-xl border border-[#F2D6DF] focus:outline-hidden focus:border-[#E8829A] focus:ring-2 focus:ring-[#E8829A]/20 bg-[#FFF9FB] text-[#2A1820]"
            />
          </div>

          {/* Categoría & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#2A1820] mb-1">
                Categoría Cosmética
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#F2D6DF] focus:outline-hidden focus:border-[#E8829A] bg-[#FFF9FB] text-[#2A1820]"
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2A1820] mb-1">
                Stock en Bodega (Unidades)
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2 rounded-xl border border-[#F2D6DF] focus:outline-hidden focus:border-[#E8829A] bg-[#FFF9FB] text-[#2A1820]"
              />
            </div>
          </div>

          {/* Precios: Costo de Compra y Precio de Venta (en COP) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FFF9FB] p-3.5 rounded-xl border border-[#F2D6DF]">
            <div>
              <label className="block text-xs font-semibold text-[#2A1820] mb-1">
                Costo de Compra (COP) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-[#8E6B77] font-semibold">$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={precioCompra || ''}
                  onChange={(e) => setPrecioCompra(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="ej. 12500"
                  required
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-[#F2D6DF] focus:outline-hidden focus:border-[#E8829A] bg-white text-[#2A1820] font-semibold"
                />
              </div>
              <span className="text-[10px] text-[#8E6B77] mt-1 block">
                Precio que pagas al mayorista
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2A1820] mb-1">
                Precio de Venta al Público (COP) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-[#8E6B77] font-semibold">$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={precioVenta || ''}
                  onChange={(e) => setPrecioVenta(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="ej. 20000"
                  required
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-[#F2D6DF] focus:outline-hidden focus:border-[#E8829A] bg-white text-[#2A1820] font-semibold"
                />
              </div>
              <span className="text-[10px] text-[#8E6B77] mt-1 block">
                Precio final en tu catálogo
              </span>
            </div>
          </div>

          {/* Live Semáforo & Margin Preview */}
          <div className="p-3.5 rounded-xl border border-[#F2D6DF] bg-gradient-to-r from-[#FAF0F4] to-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2A1820]">
                Análisis de Margen Comercial:
              </span>
              <BadgeSemaforo status={semaforo.status} marginPct={semaforo.marginPct} />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-lg border border-[#F2D6DF]">
                <span className="text-[10px] text-[#8E6B77] block">Ganancia Neta</span>
                <span className="font-bold text-[#27AE60]">{formatCOP(semaforo.profitCOP)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-[#F2D6DF]">
                <span className="text-[10px] text-[#8E6B77] block">Margen Propio</span>
                <span className="font-bold text-[#2A1820]">{semaforo.profitOwnPct.toFixed(1)}%</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-[#F2D6DF]">
                <span className="text-[10px] text-[#8E6B77] block">vs Competidor</span>
                <span className={`font-bold ${semaforo.priceDiffPct <= 0 ? 'text-[#27AE60]' : 'text-[#D63031]'}`}>
                  {semaforo.priceDiffPct > 0 ? '+' : ''}{semaforo.priceDiffPct.toFixed(1)}%
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#8E6B77] italic">
              {semaforo.recommendation}
            </p>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-[#2A1820] mb-1">
              Notas Internas de Proveedor / Bodega
            </label>
            <textarea
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Detalles de proveedor, lote o tonalidades..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#F2D6DF] focus:outline-hidden focus:border-[#E8829A] bg-[#FFF9FB] text-[#2A1820]"
            />
          </div>

          {/* Toggle Public Catalog */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-[#F2D6DF] bg-[#FFF9FB]">
            <div>
              <span className="font-semibold text-xs text-[#2A1820] block">
                Publicar en Catálogo Web Público
              </span>
              <span className="text-[11px] text-[#8E6B77]">
                Visible para clientes con botón de compra por WhatsApp
              </span>
            </div>
            <button
              type="button"
              onClick={() => setVisibleCatalogo(!visibleCatalogo)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                visibleCatalogo ? 'bg-[#27AE60]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  visibleCatalogo ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F2D6DF]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#8E6B77] hover:bg-[#FAF0F4] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="chic-gradient-btn px-6 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{saving ? 'Guardando...' : productToEdit ? 'Actualizar Producto' : 'Guardar en Catálogo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
