import React, { useState } from 'react';
import { Tenant, CompetitorProductCache } from '../../types';
import { useAuth } from '../../lib/auth-context';
import {
  Crown,
  Plus,
  Store,
  CheckCircle,
  XCircle,
  ExternalLink,
  Users,
  Database,
  ArrowRight,
  TrendingUp,
  Search,
  Trash2,
  UserPlus,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  Globe
} from 'lucide-react';

interface SuperAdminDashboardProps {
  tenants: Tenant[];
  cachedProducts: CompetitorProductCache[];
  onCreateTenant: (tenantData: {
    nombre: string;
    slug: string;
    plan: 'free' | 'pro' | 'enterprise';
    adminEmail: string;
    whatsappContacto: string;
  }) => Promise<void>;
  onToggleTenantStatus: (tenantId: string, currentActive: boolean) => Promise<void>;
  onSelectTenant: (slug: string) => void;
  onResetDatabase?: () => Promise<void>;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  tenants,
  cachedProducts,
  onCreateTenant,
  onToggleTenantStatus,
  onSelectTenant,
  onResetDatabase,
}) => {
  const { setSelectedProfile, setActiveTenantBySlug } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [plan, setPlan] = useState<'free' | 'pro' | 'enterprise'>('pro');
  const [adminEmail, setAdminEmail] = useState('');
  const [whatsappDigits, setWhatsappDigits] = useState('3105559876');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showSlugHelp, setShowSlugHelp] = useState(true);

  // Auto-slugify utility
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9]+/g, '-')     // replace non-alphanumeric with -
      .replace(/^-+|-+$/g, '');        // trim leading/trailing dashes
  };

  const handleNombreChange = (val: string) => {
    setNombre(val);
    if (!isSlugManual) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setIsSlugManual(true);
    setSlug(slugify(val));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !slug || !adminEmail) return;

    // Normalize phone with fixed Colombian country code +57
    const cleanDigits = whatsappDigits.replace(/\D/g, '');
    const normalizedPhone = cleanDigits.startsWith('57') && cleanDigits.length === 12
      ? cleanDigits
      : `57${cleanDigits.slice(-10)}`;

    try {
      setLoading(true);
      await onCreateTenant({
        nombre: nombre.trim(),
        slug: slug.trim().toLowerCase(),
        plan,
        adminEmail: adminEmail.trim().toLowerCase(),
        whatsappContacto: normalizedPhone,
      });
      setIsModalOpen(false);
      setNombre('');
      setSlug('');
      setIsSlugManual(false);
      setAdminEmail('');
      setWhatsappDigits('3105559876');
    } catch (err) {
      console.error('Error creating tenant:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterAsTenantAdmin = (tenantSlug: string) => {
    setSelectedProfile('tenant_admin');
    setActiveTenantBySlug(tenantSlug);
    onSelectTenant(tenantSlug);
  };

  const handleExecuteReset = async () => {
    if (!onResetDatabase) return;
    try {
      setResetting(true);
      await onResetDatabase();
      setResetConfirmOpen(false);
    } catch (err) {
      console.error('Error resetting database:', err);
    } finally {
      setResetting(false);
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#2A1820] via-[#462332] to-[#2A1820] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#D4AF37] text-[#2A1820] shadow-xs">
                <Crown size={22} />
              </span>
              <h2 className="font-serif-luxury text-2xl font-bold tracking-tight">
                Panel Super Administrador Global
              </h2>
            </div>
            <p className="text-xs text-[#BF9FA9] max-w-xl">
              Crea nuevas empresas/distribuidoras y asigna sus administradores. Para operar directamente dentro de una tienda (inventario, comparativa VTEX y catálogo), pulsa en <strong>"Administrar Tienda"</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onResetDatabase && (
              <button
                onClick={() => setResetConfirmOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Borrar todos los tenants y productos para empezar limpio desde 0"
              >
                <Trash2 size={14} className="text-[#E8829A]" />
                <span className="hidden sm:inline">Limpiar BD (Modo 0)</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsSlugManual(false);
                setIsModalOpen(true);
              }}
              className="bg-gradient-to-r from-[#D4AF37] to-[#F5D77F] text-[#2A1820] px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg hover:scale-102 transition-transform flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>Crear Nueva Empresa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global SaaS Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="luxury-card p-5 bg-white border border-[#F2D6DF]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8E6B77] uppercase">Empresas / Tenants</span>
            <Store size={18} className="text-[#E8829A]" />
          </div>
          <h3 className="font-serif-luxury text-3xl font-bold text-[#2A1820] mt-2">
            {tenants.length}
          </h3>
          <p className="text-[11px] text-[#27AE60] mt-1 font-medium">
            {tenants.length === 0 ? 'Base de datos limpia desde cero' : `${tenants.filter(t => t.activo).length} activas`}
          </p>
        </div>

        <div className="luxury-card p-5 bg-white border border-[#F2D6DF]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8E6B77] uppercase">Caché Global VTEX</span>
            <Database size={18} className="text-[#27AE60]" />
          </div>
          <h3 className="font-serif-luxury text-3xl font-bold text-[#2A1820] mt-2">
            {cachedProducts.length}
          </h3>
          <p className="text-[11px] text-[#8E6B77] mt-1 font-medium">
            Productos con TTL de 24 horas
          </p>
        </div>

        <div className="luxury-card p-5 bg-white border border-[#F2D6DF]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8E6B77] uppercase">Tu Perfil Activo</span>
            <Crown size={18} className="text-[#D4AF37]" />
          </div>
          <h3 className="font-serif-luxury text-2xl font-bold text-[#D4AF37] mt-2">
            Super Admin
          </h3>
          <p className="text-[11px] text-[#8E6B77] mt-1 font-medium">
            Control global multitenant
          </p>
        </div>
      </div>

      {/* Empty State: Database is 100% Clean from Scratch */}
      {tenants.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#F2D6DF] p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-[#FAF0F4] text-[#C4607A] flex items-center justify-center mx-auto border border-[#F2D6DF]">
            <Sparkles size={32} className="text-[#D4AF37]" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#27AE60] bg-[#EAFBF2] px-3 py-1 rounded-full border border-[#27AE60]/30">
              Base de Datos Limpia • Modo Desde Cero
            </span>
            <h3 className="font-serif-luxury text-2xl font-bold text-[#2A1820] mt-2">
              Todo Listo para Tu Primera Empresa
            </h3>
            <p className="text-xs text-[#8E6B77] leading-relaxed">
              No hay tiendas ni productos registrados aún. Como Super Administrador, crea tu primer Tenant cosmético y asigna el email del administrador para comenzar la experiencia desde cero.
            </p>
          </div>
          <div>
            <button
              onClick={() => {
                setIsSlugManual(false);
                setIsModalOpen(true);
              }}
              className="chic-gradient-btn px-6 py-3 rounded-2xl text-xs sm:text-sm font-semibold shadow-md inline-flex items-center gap-2 cursor-pointer hover:scale-102 transition-transform"
            >
              <Plus size={18} />
              <span>Crear Mi Primer Tenant / Empresa</span>
            </button>
          </div>
        </div>
      ) : (
        /* Tenants Table */
        <div className="bg-white rounded-2xl border border-[#F2D6DF] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#F2D6DF] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3 top-2.5 text-[#8E6B77]" />
              <input
                type="text"
                placeholder="Buscar empresa por nombre o slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#F2D6DF] text-xs bg-[#FFF9FB] text-[#2A1820]"
              />
            </div>
            <span className="text-xs text-[#8E6B77]">
              Total: {filteredTenants.length} organizaciones registradas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF0F4] text-[#8E6B77] font-semibold uppercase tracking-wider border-b border-[#F2D6DF] text-[11px]">
                <tr>
                  <th className="py-3 px-4">Empresa / Tenant</th>
                  <th className="py-3 px-3">Enlace del Catálogo Público</th>
                  <th className="py-3 px-3">Plan</th>
                  <th className="py-3 px-3">WhatsApp Oficial</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-4 text-right">Acción Comercial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2D6DF]/60">
                {filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-[#FFF9FB] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-sm text-[#2A1820]">{t.nombre}</div>
                      <div className="text-[10px] text-[#8E6B77]">{t.config?.nombre_tienda}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[#C4607A]">
                      /catalogo/{t.slug}
                    </td>
                    <td className="py-3 px-3">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDF6DC] text-[#A8861B] border border-[#D4AF37]/30">
                        {t.plan}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#2A1820] font-medium">
                      🇨🇴 +{t.config?.whatsapp_contacto?.replace(/^57/, '57 ') || '57 3105559876'}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => onToggleTenantStatus(t.id, t.activo)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase cursor-pointer border ${
                          t.activo
                            ? 'bg-[#EAFBF2] text-[#27AE60] border-[#27AE60]/30'
                            : 'bg-[#FDEDEC] text-[#D63031] border-[#D63031]/30'
                        }`}
                      >
                        {t.activo ? <CheckCircle size={11} /> : <XCircle size={11} />}
                        <span>{t.activo ? 'Activa' : 'Suspendida'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleEnterAsTenantAdmin(t.slug)}
                        className="chic-gradient-btn px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Cambiar a Modo Tenant Admin y gestionar este inventario"
                      >
                        <Store size={13} />
                        <span>Administrar Tienda</span>
                        <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Tenant */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#F2D6DF] p-6 sm:p-7 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2D6DF]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FAF0F4] text-[#C4607A] flex items-center justify-center">
                  <Store size={18} />
                </div>
                <div>
                  <h3 className="font-serif-luxury text-lg font-bold text-[#2A1820]">
                    Crear Nueva Empresa (Tenant)
                  </h3>
                  <p className="text-[11px] text-[#8E6B77]">
                    Aprovisiona una tienda cosmética independiente
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 pt-4 text-xs sm:text-sm">
              {/* Nombre de la tienda / marca */}
              <div>
                <label className="block text-xs font-semibold text-[#2A1820] mb-1">
                  Nombre de la Tienda / Marca *
                </label>
                <input
                  type="text"
                  placeholder="ej. Trend Glam Colombia o Bella Boutique"
                  value={nombre}
                  onChange={(e) => handleNombreChange(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#F2D6DF] bg-[#FFF9FB] text-[#2A1820] focus:outline-hidden focus:border-[#E8829A] text-xs sm:text-sm font-medium"
                />
              </div>

              {/* Dirección web automática para clientes */}
              <div className="p-3.5 rounded-2xl bg-[#FAF0F4] border border-[#F2D6DF] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2A1820] flex items-center gap-1.5">
                    <Globe size={14} className="text-[#C4607A]" />
                    <span>Enlace Web del Catálogo para tus Clientes</span>
                  </span>
                  <span className="text-[10px] text-[#27AE60] font-bold bg-[#EAFBF2] px-2 py-0.5 rounded-full border border-[#27AE60]/30">
                    Automático
                  </span>
                </div>
                
                <p className="text-[11px] text-[#8E6B77]">
                  Este es el enlace que compartirás por WhatsApp y redes sociales para que tus clientes vean tus productos:
                </p>

                <div className="flex items-center gap-1 bg-white p-2 rounded-xl border border-[#F2D6DF] text-xs font-mono text-[#C4607A] truncate">
                  <span className="text-[#8E6B77] select-none">.../catalogo/</span>
                  <strong className="text-[#2A1820]">{slug || 'nombre-de-tu-tienda'}</strong>
                </div>
              </div>

              {/* Email del Administrador */}
              <div>
                <label className="block text-xs font-semibold text-[#2A1820] mb-1">
                  Email del Administrador de la Tienda *
                </label>
                <input
                  type="email"
                  placeholder="admin@mitienda.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#F2D6DF] bg-[#FFF9FB] text-[#2A1820] focus:outline-hidden focus:border-[#E8829A] text-xs sm:text-sm"
                />
                <span className="text-[10px] text-[#8E6B77] mt-1 block">
                  Cuando esta persona inicie sesión con Google, tendrá control administrativo de esta tienda.
                </span>
              </div>

              {/* Teléfono WhatsApp con indicativo fijo Colombia +57 */}
              <div>
                <label className="block text-xs font-semibold text-[#2A1820] mb-1">
                  WhatsApp Oficial para Pedidos (Colombia) *
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF0F4] border border-[#F2D6DF] rounded-xl text-xs font-bold text-[#2A1820] select-none shrink-0">
                    <span className="text-base leading-none">🇨🇴</span>
                    <span>+57</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="310 555 9876"
                    value={whatsappDigits}
                    onChange={(e) => setWhatsappDigits(e.target.value)}
                    required
                    className="flex-1 px-3.5 py-2 rounded-xl border border-[#F2D6DF] bg-[#FFF9FB] text-[#2A1820] focus:outline-hidden focus:border-[#E8829A] text-xs sm:text-sm font-semibold tracking-wide"
                  />
                </div>
                <span className="text-[10px] text-[#8E6B77] mt-1 block">
                  Indicador de país fijo en Colombia (+57). Digita únicamente los 10 números de tu celular.
                </span>
              </div>

              {/* Plan de suscripción */}
              <div>
                <label className="block text-xs font-semibold text-[#2A1820] mb-1">
                  Plan de Suscripción
                </label>
                <select
                  value={plan}
                  onChange={(e: any) => setPlan(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#F2D6DF] bg-[#FFF9FB] text-[#2A1820] text-xs sm:text-sm focus:outline-hidden focus:border-[#E8829A]"
                >
                  <option value="free">Free (Gratuito)</option>
                  <option value="pro">Pro (Recomendado para Distribuidores)</option>
                  <option value="enterprise">Enterprise (Múltiples sucursales)</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F2D6DF]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#8E6B77] hover:bg-[#FAF0F4] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="chic-gradient-btn px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Aprovisionando...' : 'Crear Empresa & Asignar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reset Database to Scratch */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-[#D63031]/30 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="p-3 rounded-full bg-[#FDEDEC] text-[#D63031] w-12 h-12 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center">
              <h4 className="font-serif-luxury text-lg font-bold text-[#2A1820]">
                ¿Limpiar Base de Datos?
              </h4>
              <p className="text-xs text-[#8E6B77] mt-1.5 leading-relaxed">
                Esta acción eliminará todas las empresas registradas y productos para dejar la base de datos limpia al 100% y poder vivir la experiencia desde cero.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setResetConfirmOpen(false)}
                disabled={resetting}
                className="px-3.5 py-2 rounded-xl text-xs text-[#8E6B77] hover:bg-[#FAF0F4] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteReset}
                disabled={resetting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#D63031] hover:bg-[#C0392B] text-white shadow-xs cursor-pointer disabled:opacity-50"
              >
                {resetting ? 'Limpiando...' : 'Sí, Limpiar Todo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
