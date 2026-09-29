import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Tenant } from '../types';

export const DEFAULT_SUPERADMIN_EMAIL = 'jsmmarindeveloper@gmail.com';
export const DEFAULT_SUPERADMIN_TENANT_ID = 'mi-tienda';

/**
 * Ensures the superadmin configuration document and the default clean tenant
 * for the superadmin exist in Firestore.
 * Does NOT generate mock products, keeping the inventory 100% clean for real testing.
 */
export async function ensureSuperAdminConfig(currentUser?: { uid: string; email: string | null; displayName?: string | null } | null): Promise<Tenant | null> {
  let defaultTenant: Tenant | null = null;

  try {
    // 1. Configuración global Super Admin
    const superAdminRef = doc(db, 'superadmin', 'config');
    const snap = await getDoc(superAdminRef);
    if (!snap.exists()) {
      await setDoc(superAdminRef, {
        super_admin_uid: currentUser?.uid || '',
        super_admin_email: DEFAULT_SUPERADMIN_EMAIL,
        created_at: new Date().toISOString(),
      });
    } else if (currentUser?.uid && !snap.data().super_admin_uid) {
      await setDoc(superAdminRef, {
        super_admin_uid: currentUser.uid,
        super_admin_email: DEFAULT_SUPERADMIN_EMAIL,
      }, { merge: true });
    }

    // 2. Crear la primera tienda limpia por defecto para el Super Admin si no existe
    const tenantRef = doc(db, 'tenants', DEFAULT_SUPERADMIN_TENANT_ID);
    const tenantSnap = await getDoc(tenantRef);

    if (!tenantSnap.exists()) {
      const newTenantData: Omit<Tenant, 'id'> = {
        nombre: 'Mi Tienda Cosméticos',
        slug: 'mi-tienda',
        activo: true,
        plan: 'pro',
        config: {
          nombre_tienda: 'Mi Tienda Cosméticos',
          margen_warn_pct: 15,
          margen_danger_pct: 0,
          catalogo_activo: true,
          whatsapp_contacto: '573105559876',
          mensaje_bienvenida: '¡Bienvenidas a Mi Tienda Cosméticos! Productos 100% originales con envíos a todo el país.',
        },
      };

      await setDoc(tenantRef, newTenantData);
      defaultTenant = { id: DEFAULT_SUPERADMIN_TENANT_ID, ...newTenantData };
    } else {
      defaultTenant = { id: tenantSnap.id, ...tenantSnap.data() } as Tenant;
    }

    // 3. Conceder membresía admin al Super Admin en esta tienda
    if (currentUser?.uid) {
      const membershipDocId = `${DEFAULT_SUPERADMIN_TENANT_ID}_${currentUser.uid}`;
      const memberRef = doc(db, 'tenant_usuarios', membershipDocId);
      const memberSnap = await getDoc(memberRef);

      if (!memberSnap.exists()) {
        await setDoc(memberRef, {
          tenant_id: DEFAULT_SUPERADMIN_TENANT_ID,
          uid: currentUser.uid,
          email: currentUser.email || DEFAULT_SUPERADMIN_EMAIL,
          nombre: currentUser.displayName || currentUser.email?.split('@')[0] || 'Super Admin',
          rol: 'admin',
          activo: true,
          creado_en: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    console.warn('Superadmin config check note:', error);
  }

  return defaultTenant;
}

/**
 * Completely cleans the Firestore collections, resetting inventory to 0 products
 * and preserving 1 clean default tenant for the superadmin to test from scratch.
 */
export async function cleanDatabaseToScratch(currentUser?: { uid: string; email: string | null; displayName?: string | null } | null): Promise<{ deletedTenants: number; deletedProducts: number }> {
  let deletedTenants = 0;
  let deletedProducts = 0;

  try {
    // 1. Delete all productos
    const prodsSnap = await getDocs(collection(db, 'productos'));
    for (const d of prodsSnap.docs) {
      await deleteDoc(doc(db, 'productos', d.id));
      deletedProducts++;
    }

    // 2. Delete all tenant_usuarios
    const membersSnap = await getDocs(collection(db, 'tenant_usuarios'));
    for (const d of membersSnap.docs) {
      await deleteDoc(doc(db, 'tenant_usuarios', d.id));
    }

    // 3. Delete all pending invites
    const pendingSnap = await getDocs(collection(db, 'tenant_usuarios_pendientes'));
    for (const d of pendingSnap.docs) {
      await deleteDoc(doc(db, 'tenant_usuarios_pendientes', d.id));
    }

    // 4. Delete all tenants except mi-tienda
    const tenantsSnap = await getDocs(collection(db, 'tenants'));
    for (const d of tenantsSnap.docs) {
      if (d.id !== DEFAULT_SUPERADMIN_TENANT_ID) {
        await deleteDoc(doc(db, 'tenants', d.id));
        deletedTenants++;
      }
    }

    // 5. Ensure superadmin document & default clean tenant for superadmin
    await ensureSuperAdminConfig(currentUser);

  } catch (error) {
    console.error('Error cleaning database:', error);
    throw error;
  }

  return { deletedTenants, deletedProducts };
}
