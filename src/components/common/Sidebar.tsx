import React from 'react';
import { useAuth } from '../../lib/auth-context';
import {
  LayoutDashboard,
  Boxes,
  TrendingUp,
  Settings,
  ShoppingBag,
  ExternalLink,
  Crown,
  Database,
  Store,
  Users,
  Plus
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onOpenCreateTenant?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  mobileOpen,
  setMobileOpen,
  onOpenCreateTenant,
}) => {
  const {
    activeTenant,
    isSuperAdmin,
    selectedProfile,
    setSelectedProfile,
    allTenantsList,
    setActiveTenantBySlug,
    activeRole,
  } = useAuth();

  const slug = activeTenant?.slug || (allTenantsList[0]?.slug ?? 'tienda');

  const tenantNavItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: `/app/${slug}/dashboard`,
      badge: null,
    },
    {
      label: 'Inventario & SKUs',
      icon: Boxes,
      path: `/app/${slug}/inventario`,
      badge: null,
    },
    {
      label: 'Precios del Mercado',
      icon: TrendingUp,
      path: `/app/${slug}/comparativa`,
      badge: null,
    },
    {
      label: 'Configuración',
      icon: Settings,
      path: `/app/${slug}/configuracion`,
      badge: null,
    },
  ];

  const handleNav = (path: string) => {
    onNavigate(path);
    setMobileOpen(false);
  };

  const isSuperAdminMode = selectedProfile === 'super_admin';

  const content = (
    <aside className="w-64 bg-white h-full flex flex-col justify-between border-r border-[#F2D6DF] p-4 select-none">
      <div className="space-y-5">
        
        {/* Profile Mode Banner Card */}
        {isSuperAdminMode ? (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#FDF6DC] to-white border border-[#D4AF37]/40 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8861B] flex items-center gap-1">
                <Crown size={12} /> Super Admin
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#A8861B]">
                Global
              </span>
            </div>
            <p className="text-xs font-semibold text-[#2A1820]">
              Gestión de Organizaciones
            </p>
            <p className="text-[11px] text-[#8E6B77] leading-tight">
              Creación de tenants y asignación de usuarios.
            </p>
          </div>
        ) : (
          activeTenant && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#FFF9FB] to-[#FAF0F4] border border-[#F2D6DF] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C4607A]">
                  Tienda Activa
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EAFBF2] text-[#27AE60] border border-[#27AE60]/20">
                  {activeTenant.plan.toUpperCase()}
                </span>
              </div>
              <h4 className="font-serif-luxury font-bold text-sm text-[#2A1820] truncate mt-1">
                {activeTenant.nombre}
              </h4>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#8E6B77]">
                <span>Rol:</span>
                <span className="font-medium text-[#2A1820] capitalize bg-white px-1.5 py-0.5 rounded border border-[#F2D6DF] text-[11px]">
                  {selectedProfile === 'tenant_editor' ? 'editor' : 'admin'}
                </span>
              </div>
            </div>
          )
        )}

        {/* Super Admin Navigation Links */}
        {isSuperAdminMode ? (
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] mb-2">
              Panel Super Admin
            </p>
            <button
              onClick={() => handleNav('/super-admin')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                currentPath.startsWith('/super-admin')
                  ? 'bg-[#FDF6DC] text-[#A8861B] font-semibold border border-[#D4AF37]/40 shadow-xs'
                  : 'text-[#2A1820] hover:bg-[#FDF6DC]/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Crown size={18} className="text-[#D4AF37]" />
                <span>Empresas & Usuarios</span>
              </div>
            </button>

            {onOpenCreateTenant && (
              <button
                onClick={() => {
                  onOpenCreateTenant();
                  setMobileOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#A8861B] bg-[#FFF9FB] hover:bg-[#FDF6DC]/50 border border-dashed border-[#D4AF37]/50 transition-all cursor-pointer mt-2"
              >
                <Plus size={16} />
                <span>Crear Nueva Empresa</span>
              </button>
            )}

            {/* Quick jump to operate as tenant admin */}
            {allTenantsList.length > 0 && (
              <div className="pt-4 mt-2 border-t border-[#F2D6DF]/60">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#8E6B77] mb-2">
                  Operar como Tenant Admin:
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {allTenantsList.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedProfile('tenant_admin');
                        setActiveTenantBySlug(t.slug);
                        handleNav(`/app/${t.slug}/dashboard`);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-[#2A1820] hover:bg-[#FAF0F4] flex items-center justify-between group cursor-pointer"
                    >
                      <div className="truncate">
                        <span className="font-semibold block truncate group-hover:text-[#C4607A]">{t.nombre}</span>
                        <span className="text-[10px] text-[#8E6B77]">/{t.slug}</span>
                      </div>
                      <Store size={13} className="text-[#8E6B77] group-hover:text-[#C4607A] shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Tenant Navigation Links */
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#8E6B77] mb-2">
              Gestión Comercial
            </p>
            {tenantNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#FCEEF2] text-[#C4607A] font-semibold shadow-xs border border-[#F2D6DF]'
                      : 'text-[#2A1820] hover:bg-[#FAF0F4] hover:text-[#C4607A]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? 'text-[#C4607A]' : 'text-[#8E6B77]'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-[#FDF6DC] text-[#A8861B] border border-[#D4AF37]/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Public Catalog Action */}
            <div className="pt-3 border-t border-[#F2D6DF]/60">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#8E6B77] mb-2">
                Canales de Venta
              </p>
              <button
                onClick={() => handleNav(`/catalogo/${slug}`)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-[#2A1820] hover:bg-[#FAF0F4] border border-dashed border-[#F2D6DF] hover:border-[#E8829A] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag size={18} className="text-[#E8829A]" />
                  <span>Catálogo Web Público</span>
                </div>
                <ExternalLink size={14} className="text-[#8E6B77]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-[#F2D6DF] text-center text-[11px] text-[#8E6B77]">
        <p className="font-serif-luxury font-bold text-xs text-[#2A1820]">OmniRetail Suite</p>
        <p className="mt-0.5">Gestión Comercial y Catálogos Digitales</p>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden md:block w-64 shrink-0">
        <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          {content}
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-50">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
