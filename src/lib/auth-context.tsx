import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { Tenant, TenantUsuario, UserRole } from '../types';
import { ensureSuperAdminConfig, cleanDatabaseToScratch, DEFAULT_SUPERADMIN_EMAIL } from './seed-data';

export type AppPersonaProfile = 'super_admin' | 'tenant_admin' | 'tenant_editor';

interface UserTenantMembership {
  tenant: Tenant;
  rol: UserRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSuperAdmin: boolean;
  selectedProfile: AppPersonaProfile;
  setSelectedProfile: (profile: AppPersonaProfile) => void;
  userTenants: UserTenantMembership[];
  allTenantsList: Tenant[];
  activeTenant: Tenant | null;
  activeRole: UserRole | null;
  setActiveTenantBySlug: (slug: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  resetDatabaseFromScratch: () => Promise<{ deletedTenants: number; deletedProducts: number }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isSuperAdmin: false,
  selectedProfile: 'super_admin',
  setSelectedProfile: () => {},
  userTenants: [],
  allTenantsList: [],
  activeTenant: null,
  activeRole: null,
  setActiveTenantBySlug: async () => false,
  signInWithGoogle: async () => {},
  signOutUser: async () => {},
  refreshUserData: async () => {},
  resetDatabaseFromScratch: async () => ({ deletedTenants: 0, deletedProducts: 0 }),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<AppPersonaProfile>('super_admin');
  const [userTenants, setUserTenants] = useState<UserTenantMembership[]>([]);
  const [allTenantsList, setAllTenantsList] = useState<Tenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);

  const fetchUserData = async (currentUser: User | null) => {
    if (!currentUser) {
      setUser(null);
      setIsSuperAdmin(false);
      setUserTenants([]);
      setAllTenantsList([]);
      setActiveTenant(null);
      setActiveRole(null);
      setLoading(false);
      return;
    }

    try {
      // 1. Verificar si es Super Administrador
      const isEmailSuperAdmin = currentUser.email?.toLowerCase() === DEFAULT_SUPERADMIN_EMAIL.toLowerCase();
      let isDocSuperAdmin = false;

      try {
        const superDoc = await getDoc(doc(db, 'superadmin', 'config'));
        if (superDoc.exists()) {
          const sData = superDoc.data();
          if (sData.super_admin_uid === currentUser.uid || sData.super_admin_email?.toLowerCase() === currentUser.email?.toLowerCase()) {
            isDocSuperAdmin = true;
          }
        }
      } catch (e) {
        // Continue
      }

      const superAdminStatus = isEmailSuperAdmin || isDocSuperAdmin;
      setIsSuperAdmin(superAdminStatus);

      // Asegurar que la configuración de SuperAdmin exista sin inyectar datos falsos
      await ensureSuperAdminConfig(currentUser);

      // 2. Procesar invitaciones pendientes para este email
      if (currentUser.email) {
        try {
          const pendingRef = doc(db, 'tenant_usuarios_pendientes', currentUser.email.toLowerCase());
          const pendingSnap = await getDoc(pendingRef);
          if (pendingSnap.exists()) {
            const pendingData = pendingSnap.data();
            const memberDocId = `${pendingData.tenant_id}_${currentUser.uid}`;
            await setDoc(doc(db, 'tenant_usuarios', memberDocId), {
              tenant_id: pendingData.tenant_id,
              uid: currentUser.uid,
              email: currentUser.email,
              nombre: currentUser.displayName || currentUser.email.split('@')[0],
              rol: pendingData.rol,
              activo: true,
              creado_en: serverTimestamp(),
            });
            await deleteDoc(pendingRef);
          }
        } catch (e) {
          console.warn('Pending invites processing note:', e);
        }
      }

      // 3. Buscar membresías de tenants para el usuario
      const membershipsQuery = query(
        collection(db, 'tenant_usuarios'),
        where('uid', '==', currentUser.uid),
        where('activo', '==', true)
      );

      const membershipsSnap = await getDocs(membershipsQuery);
      const tenantList: UserTenantMembership[] = [];

      for (const mDoc of membershipsSnap.docs) {
        const mData = mDoc.data() as TenantUsuario;
        const tenantSnap = await getDoc(doc(db, 'tenants', mData.tenant_id));
        if (tenantSnap.exists()) {
          tenantList.push({
            tenant: { id: tenantSnap.id, ...(tenantSnap.data() as any) },
            rol: mData.rol,
          });
        }
      }

      // 4. Si es SuperAdmin, consultar todos los tenants existentes para supervisión global
      const allTenantsSnap = await getDocs(collection(db, 'tenants'));
      const allTenants: Tenant[] = [];
      for (const tDoc of allTenantsSnap.docs) {
        const tData = { id: tDoc.id, ...tDoc.data() } as Tenant;
        allTenants.push(tData);
        // El superadmin puede administrar cualquier tenant
        if (superAdminStatus && !tenantList.some(item => item.tenant.id === tDoc.id)) {
          tenantList.push({
            tenant: tData,
            rol: 'admin',
          });
        }
      }
      setAllTenantsList(allTenants);
      setUserTenants(tenantList);

      // 5. Configurar tenant activo y perfil inicial
      if (superAdminStatus) {
        // Si no hay tenants, perfil fijo en 'super_admin'
        if (allTenants.length === 0) {
          setSelectedProfile('super_admin');
          setActiveTenant(null);
          setActiveRole(null);
        } else {
          // Si hay tenants y el perfil es 'super_admin', no forzar tenant
          const currentSelected = activeTenant
            ? tenantList.find(t => t.tenant.id === activeTenant.id)
            : null;

          if (currentSelected) {
            setActiveTenant(currentSelected.tenant);
            setActiveRole(currentSelected.rol);
          } else {
            setActiveTenant(tenantList[0].tenant);
            setActiveRole(tenantList[0].rol);
          }
        }
      } else {
        // Usuario estándar (no superadmin)
        if (tenantList.length > 0) {
          const first = tenantList[0];
          setActiveTenant(first.tenant);
          setActiveRole(first.rol);
          setSelectedProfile(first.rol === 'admin' ? 'tenant_admin' : 'tenant_editor');
        } else {
          setActiveTenant(null);
          setActiveRole(null);
        }
      }

    } catch (error) {
      console.error('Error fetching user tenant memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      await fetchUserData(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  const setActiveTenantBySlug = async (slug: string): Promise<boolean> => {
    const found = userTenants.find(t => t.tenant.slug === slug || t.tenant.id === slug);
    if (found) {
      setActiveTenant(found.tenant);
      setActiveRole(selectedProfile === 'tenant_editor' ? 'editor' : 'admin');
      return true;
    }

    if (isSuperAdmin) {
      try {
        const q = query(collection(db, 'tenants'), where('slug', '==', slug));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docData = snap.docs[0];
          const tenant = { id: docData.id, ...docData.data() } as Tenant;
          setActiveTenant(tenant);
          setActiveRole('admin');
          return true;
        }
      } catch (err) {
        console.error('Error switching tenant by slug:', err);
      }
    }
    return false;
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsSuperAdmin(false);
      setUserTenants([]);
      setAllTenantsList([]);
      setActiveTenant(null);
      setActiveRole(null);
      setSelectedProfile('super_admin');
    } catch (error) {
      console.error('Sign Out Error:', error);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  const resetDatabaseFromScratch = async () => {
    const stats = await cleanDatabaseToScratch(user);
    await refreshUserData();
    return stats;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSuperAdmin,
        selectedProfile,
        setSelectedProfile,
        userTenants,
        allTenantsList,
        activeTenant,
        activeRole,
        setActiveTenantBySlug,
        signInWithGoogle,
        signOutUser,
        refreshUserData,
        resetDatabaseFromScratch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
