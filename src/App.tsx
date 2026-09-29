import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './lib/auth-context';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import {
  Producto,
  CompetitorProductCache,
  Tenant,
  TenantUsuario,
  TenantConfig,
  UserRole,
  RotationLevel,
} from './types';
import { obtenerProductoCompetidor } from './lib/vtex';

// Components
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { MetricsCards } from './components/dashboard/MetricsCards';
import { BulkSyncModal } from './components/dashboard/BulkSyncModal';
import { ProductTable } from './components/inventory/ProductTable';
import { ProductFormModal } from './components/inventory/ProductFormModal';
import { ComparativeTable } from './components/comparativa/ComparativeTable';
import { PublicCatalogView } from './components/catalog/PublicCatalogView';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { TenantSettingsView } from './components/settings/TenantSettingsView';
import { LoginView } from './components/auth/LoginView';
import { SinAccesoView } from './components/auth/SinAccesoView';

import { Sparkles, RefreshCw, CheckCircle2, AlertTriangle, AlertCircle, Crown, Store } from 'lucide-react';

function MainApp() {
  const {
    user,
    loading: authLoading,
    isSuperAdmin,
    selectedProfile,
    setSelectedProfile,
    userTenants,
    allTenantsList,
    activeTenant,
    activeRole,
    setActiveTenantBySlug,
    refreshUserData,
    resetDatabaseFromScratch,
  } = useAuth();

  // Navigation path state
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [productos, setProductos] = useState<Producto[]>([]);
  const [competitorCache, setCompetitorCache] = useState<Record<string, CompetitorProductCache>>({});
  const [tenantMembers, setTenantMembers] = useState<TenantUsuario[]>([]);
  const [publicTenant, setPublicTenant] = useState<Tenant | null>(null);

  // Modals state
  const [bulkSyncOpen, setBulkSyncOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Producto | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync route changes with browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
  };

  // Automatically initialize clean default tenant for superadmin on first load
  useEffect(() => {
    if (isSuperAdmin && !sessionStorage.getItem('omni_default_tenant_ready_v2')) {
      sessionStorage.setItem('omni_default_tenant_ready_v2', 'true');
      resetDatabaseFromScratch()
        .then(() => {
          showToast('Tu tienda "Mi Tienda Cosméticos" está lista y limpia para tus pruebas', 'success');
        })
        .catch(console.error);
    }
  }, [isSuperAdmin]);

  // 1. Listen to Competitor Products Cache globally (public + tenant view)
  useEffect(() => {
    const cachePath = 'competitor_products_cache';
    const unsub = onSnapshot(
      collection(db, cachePath),
      (snap) => {
        const cacheMap: Record<string, CompetitorProductCache> = {};
        snap.forEach((docSnap) => {
          cacheMap[docSnap.id] = docSnap.data() as CompetitorProductCache;
        });
        setCompetitorCache(cacheMap);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, cachePath);
      }
    );
    return () => unsub();
  }, []);

  // 2. Listen to Products of active tenant
  useEffect(() => {
    if (!activeTenant) {
      setProductos([]);
      return;
    }

    const productsPath = 'productos';
    const q = query(collection(db, productsPath), where('tenant_id', '==', activeTenant.id));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Producto[] = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setProductos(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, productsPath);
      }
    );

    return () => unsub();
  }, [activeTenant?.id]);

  // 3. Listen to Tenant Members if in active tenant
  useEffect(() => {
    if (!activeTenant || !user) {
      setTenantMembers([]);
      return;
    }

    const membersPath = 'tenant_usuarios';
    const q = query(collection(db, membersPath), where('tenant_id', '==', activeTenant.id));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: TenantUsuario[] = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setTenantMembers(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, membersPath);
      }
    );

    return () => unsub();
  }, [activeTenant?.id, user?.uid]);

  // 4. Handle initial route redirection
  useEffect(() => {
    if (authLoading) return;

    // Public catalog route check: /catalogo/:tenantSlug or /catalogo/:tenantSlug/:prodSlug
    if (currentPath.startsWith('/catalogo/')) {
      const parts = currentPath.split('/').filter(Boolean);
      const slug = parts[1];
      if (slug) {
        getDocs(query(collection(db, 'tenants'), where('slug', '==', slug))).then((snap) => {
          if (!snap.empty) {
            const docData = snap.docs[0];
            setPublicTenant({ id: docData.id, ...docData.data() } as Tenant);
          }
        });
      }
      return;
    }

    // If not logged in, go to /login
    if (!user) {
      if (currentPath !== '/login') {
        navigate('/login');
      }
      return;
    }

    // User is logged in
    if (userTenants.length === 0 && !isSuperAdmin) {
      if (currentPath !== '/sin-acceso') {
        navigate('/sin-acceso');
      }
      return;
    }

    // Default redirect depending on active profile
    if (currentPath === '/' || currentPath === '/login') {
      if (selectedProfile === 'super_admin' || !activeTenant) {
        navigate('/super-admin');
      } else {
        navigate(`/app/${activeTenant.slug}/dashboard`);
      }
    }
  }, [user, authLoading, userTenants, activeTenant, currentPath, isSuperAdmin, selectedProfile]);

  // CRUD Operations
  const handleSaveProduct = async (productData: Partial<Producto>) => {
    if (!activeTenant) return;
    const path = 'productos';
    try {
      if (productToEdit) {
        const docRef = doc(db, path, productToEdit.id);
        await setDoc(docRef, { ...productData, ultima_actualizacion: serverTimestamp() }, { merge: true });
        showToast('Producto actualizado correctamente', 'success');
      } else {
        const newId = `${activeTenant.id}_${Date.now()}`;
        const docRef = doc(db, path, newId);
        await setDoc(docRef, {
          ...productData,
          tenant_id: activeTenant.id,
          ultima_actualizacion: serverTimestamp(),
        });
        showToast('Nuevo producto añadido al inventario', 'success');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Estás segura de eliminar este producto del inventario?')) return;
    const path = `productos/${id}`;
    try {
      await deleteDoc(doc(db, 'productos', id));
      showToast('Producto eliminado del inventario', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleToggleVisibility = async (p: Producto) => {
    const path = `productos/${p.id}`;
    try {
      await setDoc(doc(db, 'productos', p.id), { visible_catalogo: !p.visible_catalogo }, { merge: true });
      showToast(
        !p.visible_catalogo ? 'Producto publicado en catálogo digital' : 'Producto oculto del catálogo',
        'info'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleRefreshSingleSku = async (sku: string) => {
    try {
      const res = await obtenerProductoCompetidor(sku, true);
      if (res) {
        showToast(`SKU ${sku} sincronizado con VTEX Trendy Shop`, 'success');
      }
    } catch (err) {
      showToast(`Error al sincronizar ${sku}`, 'error');
    }
  };

  // Settings operations
  const handleSaveTenantConfig = async (newConfig: TenantConfig) => {
    if (!activeTenant) return;
    const path = `tenants/${activeTenant.id}`;
    try {
      await setDoc(doc(db, 'tenants', activeTenant.id), { config: newConfig }, { merge: true });
      showToast('Configuración de la tienda guardada', 'success');
      await refreshUserData();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleInviteMember = async (email: string, rol: UserRole) => {
    if (!activeTenant) return;
    const path = `tenant_usuarios_pendientes/${email}`;
    try {
      await setDoc(doc(db, 'tenant_usuarios_pendientes', email), {
        tenant_id: activeTenant.id,
        rol,
        email,
      });
      showToast(`Invitación enviada a ${email}. Se activará al iniciar sesión.`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleRemoveMember = async (memberDocId: string) => {
    if (!confirm('¿Deseas revocar el acceso a este colaborador?')) return;
    const path = `tenant_usuarios/${memberDocId}`;
    try {
      await deleteDoc(doc(db, 'tenant_usuarios', memberDocId));
      showToast('Membresía revocada', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Super Admin operations
  const handleCreateTenant = async (tenantData: {
    nombre: string;
    slug: string;
    plan: 'free' | 'pro' | 'enterprise';
    adminEmail: string;
    whatsappContacto: string;
  }) => {
    const tenantId = tenantData.slug;
    const tenantRef = doc(db, 'tenants', tenantId);

    const newTenant = {
      nombre: tenantData.nombre,
      slug: tenantData.slug,
      activo: true,
      plan: tenantData.plan,
      creado_en: serverTimestamp(),
      config: {
        nombre_tienda: tenantData.nombre,
        margen_warn_pct: 15,
        margen_danger_pct: 0,
        catalogo_activo: true,
        whatsapp_contacto: tenantData.whatsappContacto,
        mensaje_bienvenida: `¡Bienvenidas a ${tenantData.nombre}! Cosméticos 100% originales.`,
      },
    };

    await setDoc(tenantRef, newTenant);

    // Assign current user membership or pending invite
    if (user && user.email?.toLowerCase() === tenantData.adminEmail.toLowerCase()) {
      await setDoc(doc(db, 'tenant_usuarios', `${tenantId}_${user.uid}`), {
        tenant_id: tenantId,
        uid: user.uid,
        email: user.email,
        nombre: user.displayName || user.email.split('@')[0],
        rol: 'admin',
        activo: true,
        creado_en: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'tenant_usuarios_pendientes', tenantData.adminEmail), {
        tenant_id: tenantId,
        rol: 'admin',
        email: tenantData.adminEmail,
      });
    }

    showToast(`Empresa ${tenantData.nombre} creada exitosamente`, 'success');
    await refreshUserData();
  };

  const handleToggleTenantStatus = async (tenantId: string, currentActive: boolean) => {
    await setDoc(doc(db, 'tenants', tenantId), { activo: !currentActive }, { merge: true });
    showToast(`Estado de la empresa actualizado`, 'info');
  };

  const handleResetDatabase = async () => {
    try {
      setResetting(true);
      const stats = await resetDatabaseFromScratch();
      showToast(`Base de datos limpiada con éxito (${stats.deletedTenants} empresas eliminadas)`, 'info');
      navigate('/super-admin');
    } catch (err) {
      showToast('Error al limpiar la base de datos', 'error');
    } finally {
      setResetting(false);
      setResetConfirmOpen(false);
    }
  };

  // Render Loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFF9FB] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#E8829A] to-[#D4AF37] flex items-center justify-center text-white animate-bounce shadow-lg shadow-[#E8829A]/30">
          <Sparkles size={28} className="text-[#FDF6DC]" />
        </div>
        <h2 className="font-serif-luxury text-xl font-bold text-[#2A1820] mt-4">
          OmniRetail Intelligence Suite
        </h2>
        <p className="text-xs text-[#8E6B77] mt-1 flex items-center gap-2">
          <RefreshCw size={13} className="animate-spin text-[#E8829A]" />
          Conectando con Firestore & Catálogo Maestro...
        </p>
      </div>
    );
  }

  // 1. Public Catalog Route: /catalogo/:tenantSlug (accessible without authentication)
  if (currentPath.startsWith('/catalogo/')) {
    const parts = currentPath.split('/').filter(Boolean);
    const tenantSlug = parts[1] || 'glow-beauty';
    const productSlug = parts[2] || null;

    const resolvedTenant =
      publicTenant ||
      (activeTenant?.slug === tenantSlug ? activeTenant : null) ||
      allTenantsList.find((t) => t.slug === tenantSlug) || {
        id: tenantSlug,
        nombre: tenantSlug.replace('-', ' ').toUpperCase(),
        slug: tenantSlug,
        activo: true,
        plan: 'pro' as const,
        config: {
          nombre_tienda: tenantSlug.replace('-', ' ').toUpperCase(),
          margen_warn_pct: 15,
          margen_danger_pct: 0,
          catalogo_activo: true,
          whatsapp_contacto: '573105559876',
        },
      };

    return (
      <PublicCatalogView
        tenantSlug={tenantSlug}
        tenant={resolvedTenant}
        productos={productos}
        competitorCache={competitorCache}
        onBackToApp={user ? () => navigate(activeTenant ? `/app/${activeTenant.slug}/dashboard` : '/super-admin') : undefined}
        productSlugToOpen={productSlug}
      />
    );
  }

  // 2. Login Route: /login
  if (currentPath === '/login' || !user) {
    return <LoginView onSuccess={() => navigate('/')} />;
  }

  // 3. Sin Acceso Route: /sin-acceso
  if (userTenants.length === 0 && !isSuperAdmin) {
    return <SinAccesoView onRetry={() => refreshUserData()} />;
  }

  // Main Authenticated SaaS Views
  return (
    <div className="min-h-screen bg-[#FFF9FB] flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-[#EAFBF2] text-[#27AE60] border-[#27AE60]/30'
                : toast.type === 'error'
                ? 'bg-[#FDEDEC] text-[#D63031] border-[#D63031]/30'
                : 'bg-white text-[#2A1820] border-[#F2D6DF]'
            }`}
          >
            <CheckCircle2 size={16} />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Corporate Header with Profile Switcher */}
      <Header
        currentPath={currentPath}
        onNavigate={navigate}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onResetDbRequested={() => setResetConfirmOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Navigation Sidebar */}
        <Sidebar
          currentPath={currentPath}
          onNavigate={navigate}
          mobileOpen={mobileMenuOpen}
          setMobileOpen={setMobileMenuOpen}
          onOpenCreateTenant={() => {
            navigate('/super-admin');
          }}
        />

        {/* Dynamic Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          
          {/* View 1: Super Admin Mode */}
          {selectedProfile === 'super_admin' && isSuperAdmin && (
            <SuperAdminDashboard
              tenants={allTenantsList}
              cachedProducts={Object.values(competitorCache)}
              onCreateTenant={handleCreateTenant}
              onToggleTenantStatus={handleToggleTenantStatus}
              onSelectTenant={(slug) => {
                setActiveTenantBySlug(slug);
                setSelectedProfile('tenant_admin');
                navigate(`/app/${slug}/dashboard`);
              }}
              onResetDatabase={handleResetDatabase}
            />
          )}

          {/* View 2: Tenant Admin Mode with NO Tenants in the system yet */}
          {selectedProfile !== 'super_admin' && allTenantsList.length === 0 && (
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#F2D6DF] text-center space-y-4 shadow-xs max-w-lg mx-auto my-8">
              <div className="w-16 h-16 rounded-3xl bg-[#FAF0F4] text-[#C4607A] flex items-center justify-center mx-auto border border-[#F2D6DF]">
                <Sparkles size={32} className="text-[#D4AF37]" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#27AE60] bg-[#EAFBF2] px-3 py-1 rounded-full border border-[#27AE60]/30">
                  Base de Datos Limpia
                </span>
                <h3 className="font-serif-luxury text-2xl font-bold text-[#2A1820] mt-2">
                  Aún No Hay Tiendas Creadas
                </h3>
                <p className="text-xs text-[#8E6B77] leading-relaxed">
                  Para operar y ver una tienda en el Modo Tenant Admin, primero debes crear al menos una empresa desde el modo Super Admin.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setSelectedProfile('super_admin');
                    navigate('/super-admin');
                  }}
                  className="chic-gradient-btn px-6 py-2.5 rounded-2xl text-xs font-semibold shadow-md inline-flex items-center gap-2 cursor-pointer hover:scale-102 transition-transform"
                >
                  <Crown size={15} />
                  <span>Ir a Super Admin y Crear Empresa</span>
                </button>
              </div>
            </div>
          )}

          {/* View 3: Tenant Operations (Dashboard, Inventario, Precios de Mercado, Configuración) */}
          {selectedProfile !== 'super_admin' && (activeTenant || allTenantsList[0]) && (() => {
            const currentTenant = activeTenant || allTenantsList[0];
            const isInventario = currentPath.includes('/inventario');
            const isComparativa = currentPath.includes('/comparativa');
            const isConfiguracion = currentPath.includes('/configuracion');

            if (isInventario) {
              return (
                <ProductTable
                  productos={productos}
                  competitorCache={competitorCache}
                  onAddProduct={() => {
                    setProductToEdit(null);
                    setProductModalOpen(true);
                  }}
                  onEditProduct={(p) => {
                    setProductToEdit(p);
                    setProductModalOpen(true);
                  }}
                  onDeleteProduct={handleDeleteProduct}
                  onToggleVisibility={handleToggleVisibility}
                />
              );
            }

            if (isComparativa) {
              return (
                <ComparativeTable
                  productos={productos}
                  competitorCache={competitorCache}
                  tenantConfig={currentTenant.config}
                  onEditProduct={(p) => {
                    setProductToEdit(p);
                    setProductModalOpen(true);
                  }}
                  onRefreshSku={handleRefreshSingleSku}
                  onOpenBulkSync={() => setBulkSyncOpen(true)}
                />
              );
            }

            if (isConfiguracion) {
              return (
                <TenantSettingsView
                  tenant={currentTenant}
                  members={tenantMembers}
                  onSaveConfig={handleSaveTenantConfig}
                  onInviteMember={handleInviteMember}
                  onRemoveMember={handleRemoveMember}
                />
              );
            }

            // Default to Dashboard
            return (
              <div className="space-y-6">
                {/* Welcome & Sync Action Banner */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-white via-[#FFF9FB] to-[#FCEEF2] border border-[#F2D6DF] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C4607A] bg-[#FCEEF2] px-2.5 py-0.5 rounded-full border border-[#F2D6DF]">
                        {selectedProfile === 'tenant_editor' ? 'Modo Colaborador' : 'Modo Tenant Admin'}
                      </span>
                      <span className="text-xs text-[#8E6B77]">
                        Tienda: <strong className="text-[#2A1820]">{currentTenant.nombre}</strong>
                      </span>
                    </div>
                    <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#2A1820] mt-1.5">
                      Panel de Gestión Comercial
                    </h1>
                    <p className="text-xs text-[#8E6B77] mt-1">
                      Control de márgenes comerciales, catálogo digital e inteligencia de precios del mercado.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBulkSyncOpen(true)}
                      className="chic-gradient-btn px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw size={14} />
                      <span>Actualizar Precios del Mercado</span>
                    </button>
                  </div>
                </div>

                {/* Metrics KPIs */}
                <MetricsCards
                  productos={productos}
                  competitorCache={competitorCache}
                  config={currentTenant.config}
                />

                {/* Quick Comparative Preview */}
                <div className="pt-2">
                  <ComparativeTable
                    productos={productos}
                    competitorCache={competitorCache}
                    tenantConfig={currentTenant.config}
                    onEditProduct={(p) => {
                      setProductToEdit(p);
                      setProductModalOpen(true);
                    }}
                    onRefreshSku={handleRefreshSingleSku}
                    onOpenBulkSync={() => setBulkSyncOpen(true)}
                  />
                </div>
              </div>
            );
          })()}
        </main>
      </div>

      {/* Modals */}
      {/* 1. Bulk Sync Modal */}
      <BulkSyncModal
        isOpen={bulkSyncOpen}
        onClose={() => setBulkSyncOpen(false)}
        productos={productos}
        competitorCache={competitorCache}
        onSyncComplete={async () => {
          showToast('Sincronización masiva finalizada', 'success');
        }}
      />

      {/* 2. Product Form Modal */}
      <ProductFormModal
        isOpen={productModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          setProductToEdit(null);
        }}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
        tenantId={activeTenant?.id || 'tienda'}
        cachedCompetitors={Object.values(competitorCache)}
        tenantConfig={activeTenant?.config}
      />

      {/* 4. Global Reset DB Confirmation Modal */}
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
                onClick={handleResetDatabase}
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
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
