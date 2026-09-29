import React, { useState } from 'react';
import { useAuth, AppPersonaProfile } from '../../lib/auth-context';
import {
  Sparkles,
  Store,
  ChevronDown,
  ShieldCheck,
  ExternalLink,
  LogOut,
  User as UserIcon,
  Crown,
  Menu,
  X,
  Trash2,
  Users,
  Check,
  Sliders
} from 'lucide-react';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onResetDbRequested?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  onNavigate,
  mobileMenuOpen,
  setMobileMenuOpen,
  onResetDbRequested,
}) => {
  const {
    user,
    isSuperAdmin,
    selectedProfile,
    setSelectedProfile,
    userTenants,
    allTenantsList,
    activeTenant,
    activeRole,
    setActiveTenantBySlug,
    signOutUser,
  } = useAuth();

  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleProfileChange = (profile: AppPersonaProfile) => {
    setSelectedProfile(profile);
    setProfileDropdownOpen(false);

    if (profile === 'super_admin') {
      onNavigate('/super-admin');
    } else {
      if (activeTenant) {
        onNavigate(`/app/${activeTenant.slug}/dashboard`);
      } else if (allTenantsList.length > 0) {
        setActiveTenantBySlug(allTenantsList[0].slug);
        onNavigate(`/app/${allTenantsList[0].slug}/dashboard`);
      } else {
        onNavigate('/super-admin');
      }
    }
  };

  const getProfileMeta = (p: AppPersonaProfile) => {
    switch (p) {
      case 'super_admin':
        return {
          label: 'Super Admin',
          sub: 'Crear empresas y usuarios',
          badgeBg: 'bg-[#FDF6DC] text-[#A8861B] border-[#D4AF37]/30',
          icon: Crown,
        };
      case 'tenant_admin':
        return {
          label: 'Tenant Admin',
          sub: 'Ver y ser un tenant más',
          badgeBg: 'bg-[#EAFBF2] text-[#27AE60] border-[#27AE60]/30',
          icon: Store,
        };
      case 'tenant_editor':
      default:
        return {
          label: 'Colaborador Editor',
          sub: 'Permisos de edición de stock',
          badgeBg: 'bg-[#FAF0F4] text-[#8E6B77] border-[#F2D6DF]',
          icon: Users,
        };
    }
  };

  const currentProfileMeta = getProfileMeta(selectedProfile);
  const CurrentProfileIcon = currentProfileMeta.icon;

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#F2D6DF] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Mobile hamburger + Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#8E6B77] hover:bg-[#FAF0F4] hover:text-[#2A1820]"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div
            onClick={() => {
              if (selectedProfile === 'super_admin') {
                onNavigate('/super-admin');
              } else if (activeTenant) {
                onNavigate(`/app/${activeTenant.slug}/dashboard`);
              } else {
                onNavigate('/login');
              }
            }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E8829A] to-[#C4607A] flex items-center justify-center text-white shadow-md shadow-[#E8829A]/20 group-hover:scale-105 transition-transform">
              <Sparkles size={20} className="text-[#FDF6DC]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif-luxury text-lg font-bold text-[#2A1820] tracking-tight">
                  OmniRetail
                </span>
                <span className="text-xs uppercase tracking-wider font-semibold text-[#D4AF37] bg-[#FDF6DC] px-1.5 py-0.5 rounded-sm">
                  Suite
                </span>
              </div>
              <p className="text-[10px] text-[#8E6B77] hidden sm:block">
                Intelligence & Catalog Management
              </p>
            </div>
          </div>
        </div>

        {/* Center: Profile Selector (Exclusivo para Super Admin o Admin) */}
        {isSuperAdmin && (
          <div className="relative">
            <button
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setTenantDropdownOpen(false);
                setUserMenuOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-xs cursor-pointer ${currentProfileMeta.badgeBg}`}
              title="Cambiar perfil de usuario para pruebas"
            >
              <CurrentProfileIcon size={14} />
              <div className="text-left">
                <span className="block leading-none">{currentProfileMeta.label}</span>
                <span className="text-[9px] opacity-80 font-normal hidden lg:inline-block leading-tight">
                  {selectedProfile === 'super_admin' ? 'Crear usuarios/tenants' : 'Operando como tienda'}
                </span>
              </div>
              <ChevronDown size={12} className="opacity-70" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 rounded-2xl bg-white border border-[#F2D6DF] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3.5 py-1.5 text-[10px] font-bold text-[#8E6B77] uppercase tracking-wider border-b border-[#F2D6DF]/60">
                  Seleccionar Perfil Activo (Super Admin)
                </div>

                <div className="p-1 space-y-1">
                  {/* Option 1: Super Admin */}
                  <button
                    onClick={() => handleProfileChange('super_admin')}
                    className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      selectedProfile === 'super_admin' ? 'bg-[#FDF6DC] text-[#A8861B] font-bold' : 'hover:bg-[#FAF0F4] text-[#2A1820]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-[#D4AF37]/20 text-[#A8861B]">
                        <Crown size={15} />
                      </div>
                      <div>
                        <span className="block font-semibold">Modo Super Admin</span>
                        <span className="text-[10px] text-[#8E6B77] block">Solo crear empresas y usuarios</span>
                      </div>
                    </div>
                    {selectedProfile === 'super_admin' && <Check size={14} className="text-[#A8861B]" />}
                  </button>

                  {/* Option 2: Tenant Admin */}
                  <button
                    onClick={() => handleProfileChange('tenant_admin')}
                    className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      selectedProfile === 'tenant_admin' ? 'bg-[#EAFBF2] text-[#27AE60] font-bold' : 'hover:bg-[#FAF0F4] text-[#2A1820]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-[#27AE60]/20 text-[#27AE60]">
                        <Store size={15} />
                      </div>
                      <div>
                        <span className="block font-semibold">Modo Tenant Admin</span>
                        <span className="text-[10px] text-[#8E6B77] block">Ver y operar como un tenant más</span>
                      </div>
                    </div>
                    {selectedProfile === 'tenant_admin' && <Check size={14} className="text-[#27AE60]" />}
                  </button>

                  {/* Option 3: Tenant Editor */}
                  <button
                    onClick={() => handleProfileChange('tenant_editor')}
                    className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      selectedProfile === 'tenant_editor' ? 'bg-[#FCEEF2] text-[#C4607A] font-bold' : 'hover:bg-[#FAF0F4] text-[#2A1820]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-[#E8829A]/20 text-[#C4607A]">
                        <Users size={15} />
                      </div>
                      <div>
                        <span className="block font-semibold">Modo Editor / Colaborador</span>
                        <span className="text-[10px] text-[#8E6B77] block">Simular permisos restringidos</span>
                      </div>
                    </div>
                    {selectedProfile === 'tenant_editor' && <Check size={14} className="text-[#C4607A]" />}
                  </button>
                </div>

                {onResetDbRequested && (
                  <div className="border-t border-[#F2D6DF]/60 p-2 mt-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onResetDbRequested();
                      }}
                      className="w-full text-left p-2 rounded-xl text-xs text-[#D63031] hover:bg-[#FDEDEC] flex items-center gap-2 font-medium"
                    >
                      <Trash2 size={13} />
                      <span>Limpiar BD (Empezar desde 0)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Center-Right: Tenant Switcher (visible in tenant mode) */}
        {selectedProfile !== 'super_admin' && activeTenant && (
          <div className="relative hidden md:block">
            <button
              onClick={() => {
                setTenantDropdownOpen(!tenantDropdownOpen);
                setProfileDropdownOpen(false);
                setUserMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#F2D6DF] bg-[#FFF9FB] hover:bg-[#FAF0F4] text-[#2A1820] text-xs font-medium transition-all shadow-xs cursor-pointer"
            >
              <Store size={14} className="text-[#E8829A]" />
              <span className="max-w-[130px] truncate">{activeTenant.nombre}</span>
              <ChevronDown size={13} className="text-[#8E6B77]" />
            </button>

            {tenantDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl bg-white border border-[#F2D6DF] shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-[#8E6B77] uppercase tracking-wider border-b border-[#F2D6DF]/60">
                  Cambiar de Tienda
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {userTenants.map((item) => (
                    <button
                      key={item.tenant.id}
                      onClick={() => {
                        setActiveTenantBySlug(item.tenant.slug);
                        onNavigate(`/app/${item.tenant.slug}/dashboard`);
                        setTenantDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-[#FAF0F4] transition-colors ${
                        activeTenant.id === item.tenant.id ? 'bg-[#FCEEF2] font-semibold text-[#C4607A]' : 'text-[#2A1820]'
                      }`}
                    >
                      <div className="truncate">
                        <div className="truncate">{item.tenant.nombre}</div>
                        <div className="text-[10px] text-[#8E6B77]">/{item.tenant.slug}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right: Quick Actions, Role & User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick link to public white-label catalog */}
          {activeTenant && selectedProfile !== 'super_admin' && (
            <button
              onClick={() => onNavigate(`/catalogo/${activeTenant.slug}`)}
              className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-[#C4607A] bg-[#FCEEF2] hover:bg-[#F2D6DF] px-3 py-1.5 rounded-lg border border-[#F2D6DF] transition-colors cursor-pointer"
            >
              <ExternalLink size={13} />
              <span>Ver Catálogo</span>
            </button>
          )}

          {/* User profile dropdown */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setTenantDropdownOpen(false);
                  setProfileDropdownOpen(false);
                }}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-[#FAF0F4] border border-transparent hover:border-[#F2D6DF] transition-all cursor-pointer"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Usuario'}
                    className="w-8 h-8 rounded-full border border-[#E8829A] object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#E8829A] text-white flex items-center justify-center font-bold text-xs">
                    {(user.email?.[0] || 'U').toUpperCase()}
                  </div>
                )}
                <ChevronDown size={14} className="text-[#8E6B77] hidden sm:block" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-[#F2D6DF] shadow-lg py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-[#F2D6DF]/60">
                    <p className="text-xs font-semibold text-[#2A1820] truncate">
                      {user.displayName || 'Usuario'}
                    </p>
                    <p className="text-[11px] text-[#8E6B77] truncate">{user.email}</p>
                    {isSuperAdmin && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-[#A8861B] font-semibold bg-[#FDF6DC] px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
                        <ShieldCheck size={11} /> Super Admin Global
                      </span>
                    )}
                  </div>

                  <div className="py-1">
                    {isSuperAdmin && (
                      <button
                        onClick={() => {
                          handleProfileChange('super_admin');
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-[#A8861B] hover:bg-[#FDF6DC]/50 flex items-center gap-2"
                      >
                        <Crown size={14} />
                        <span>Panel Super Admin</span>
                      </button>
                    )}
                    {activeTenant && (
                      <button
                        onClick={() => {
                          onNavigate(`/app/${activeTenant.slug}/configuracion`);
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-[#2A1820] hover:bg-[#FAF0F4] flex items-center gap-2"
                      >
                        <UserIcon size={14} className="text-[#8E6B77]" />
                        <span>Configuración de Tienda</span>
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        await signOutUser();
                        setUserMenuOpen(false);
                        onNavigate('/login');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-[#D63031] hover:bg-[#FDEDEC] flex items-center gap-2"
                    >
                      <LogOut size={14} />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onNavigate('/login')}
              className="chic-gradient-btn px-4 py-1.5 rounded-xl text-xs font-semibold shadow-xs"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
