import React, { useState } from 'react';
import { Producto, CompetitorProductCache } from '../../types';
import { formatCOP } from '../../lib/formatters';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Eye,
  EyeOff,
  Package,
  Layers,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface ProductTableProps {
  productos: Producto[];
  competitorCache: Record<string, CompetitorProductCache>;
  onAddProduct: () => void;
  onEditProduct: (p: Producto) => void;
  onDeleteProduct: (id: string) => Promise<void>;
  onToggleVisibility: (p: Producto) => Promise<void>;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  productos,
  competitorCache,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onToggleVisibility,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = Array.from(new Set(productos.map(p => p.categoria).filter(Boolean)));

  const filtered = productos.filter((p) => {
    const matchesSearch =
      p.referencia_competidor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nombre_personalizado.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat = selectedCategory === 'ALL' || p.categoria === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-luxury text-xl font-bold text-[#2A1820]">
            Inventario & Catálogo Maestro
          </h2>
          <p className="text-xs text-[#8E6B77]">
            Control de stock, asignación de costos y publicación para venta digital.
          </p>
        </div>

        <button
          onClick={onAddProduct}
          className="chic-gradient-btn px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} />
          <span>Agregar Producto</span>
        </button>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#F2D6DF] shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-2.5 text-[#8E6B77]" />
          <input
            type="text"
            placeholder="Buscar por referencia o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#F2D6DF] text-xs bg-[#FFF9FB] focus:outline-hidden focus:border-[#E8829A] text-[#2A1820]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-[#2A1820] text-white'
                : 'bg-[#FAF0F4] text-[#8E6B77] hover:text-[#2A1820]'
            }`}
          >
            Todas ({productos.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#E8829A] text-white'
                  : 'bg-[#FAF0F4] text-[#8E6B77] hover:text-[#2A1820]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-[#F2D6DF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF0F4] text-[#8E6B77] font-semibold uppercase tracking-wider border-b border-[#F2D6DF] text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Producto & SKU</th>
                <th className="py-3.5 px-3">Categoría</th>
                <th className="py-3.5 px-3">Costo Compra</th>
                <th className="py-3.5 px-3">Precio Venta</th>
                <th className="py-3.5 px-3">Stock Bodega</th>
                <th className="py-3.5 px-3">Margen Bruto</th>
                <th className="py-3.5 px-3 text-center">Catálogo Web</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2D6DF]/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    No se encontraron productos en inventario.
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const comp = competitorCache[prod.referencia_competidor];
                  const isOutOfStock = prod.stock <= 0;
                  const isLowStock = prod.stock > 0 && prod.stock <= 5;

                  return (
                    <tr key={prod.id} className="hover:bg-[#FFF9FB] transition-colors">
                      {/* Product */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={comp?.imagen_url || 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=100'}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-[#F2D6DF] shrink-0"
                          />
                          <div>
                            <span className="font-mono font-bold text-[11px] text-[#C4607A] block">
                              {prod.referencia_competidor}
                            </span>
                            <span className="font-medium text-[#2A1820] block max-w-xs truncate">
                              {prod.nombre_personalizado}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-[#8E6B77]">
                        <span className="bg-[#FAF0F4] px-2 py-0.5 rounded-md border border-[#F2D6DF] text-[11px]">
                          {prod.categoria}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-3 font-semibold text-[#8E6B77]">
                        {formatCOP(prod.precio_compra)}
                      </td>

                      {/* Sale Price */}
                      <td className="py-3 px-3 font-bold text-[#2A1820]">
                        {formatCOP(prod.precio_venta)}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold ${
                              isOutOfStock
                                ? 'text-[#D63031]'
                                : isLowStock
                                ? 'text-[#E67E22]'
                                : 'text-[#2A1820]'
                            }`}
                          >
                            {prod.stock} un.
                          </span>
                          {isOutOfStock && (
                            <span className="text-[10px] bg-[#FDEDEC] text-[#D63031] font-bold px-1.5 py-0.5 rounded">
                              Agotado
                            </span>
                          )}
                          {isLowStock && (
                            <span className="text-[10px] bg-[#FEF6EC] text-[#E67E22] font-bold px-1.5 py-0.5 rounded">
                              Bajo
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Margen Bruto */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-xs text-[#27AE60] bg-[#EAFBF2] px-2 py-0.5 rounded-lg border border-[#27AE60]/20">
                          {prod.precio_venta > 0
                            ? `+${(((prod.precio_venta - prod.precio_compra) / prod.precio_venta) * 100).toFixed(0)}%`
                            : '0%'}
                        </span>
                      </td>

                      {/* Visibility Toggle */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onToggleVisibility(prod)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            prod.visible_catalogo
                              ? 'bg-[#EAFBF2] text-[#27AE60] border-[#27AE60]/30'
                              : 'bg-gray-100 text-gray-400 border-gray-200'
                          }`}
                          title={prod.visible_catalogo ? 'Visible en catálogo' : 'Oculto en catálogo'}
                        >
                          {prod.visible_catalogo ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditProduct(prod)}
                            className="p-1.5 rounded-lg text-[#8E6B77] hover:text-[#C4607A] hover:bg-[#FAF0F4] transition-colors cursor-pointer"
                            title="Editar producto"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(prod.id)}
                            className="p-1.5 rounded-lg text-[#8E6B77] hover:text-[#D63031] hover:bg-[#FDEDEC] transition-colors cursor-pointer"
                            title="Eliminar producto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
