import React, { useState, useEffect } from 'react';
import { Tenant, TenantUsuario, TenantConfig, UserRole } from '../../types';
import {
  Settings,
  Users,
  MessageCircle,
  Percent,
  UserPlus,
  ShieldCheck,
  Trash2,
  Save,
  CheckCircle,
  Store,
  ExternalLink
} from 'lucide-react';

interface TenantSettingsViewProps {
  tenant: Tenant;
  members: TenantUsuario[];
  onSaveConfig: (newConfig: TenantConfig) => Promise<void>;
  onInviteMember: (email: string, rol: UserRole) => Promise<void>;
  onRemoveMember: (memberDocId: string) => Promise<void>;
}

export const TenantSettingsView: React.FC<TenantSettingsViewProps> = ({
  tenant,
  members,
  onSaveConfig,
  onInviteMember,
  onRemoveMember,
}) => {
  const [nombreTienda, setNombreTienda] = useState(tenant.config?.nombre_tienda || tenant.nombre);
  const [whatsapp, setWhatsapp] = useState(tenant.config?.whatsapp_contacto || '573105559876');
  const [margenWarn, setMargenWarn] = useState(tenant.config?.margen_warn_pct ?? 15);
  const [margenDanger, setMargenDanger] = useState(tenant.config?.margen_danger_pct ?? 0);
  const [catalogoActivo, setCatalogoActivo] = useState(tenant.config?.catalogo_activo ?? true);
  const [mensajeBienvenida, setMensajeBienvenida] = useState(
    tenant.config?.mensaje_bienvenida || '¡Bienvenidas a nuestra tienda de cosméticos!'
  );

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('editor');
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (tenant.config) {
      setNombreTienda(tenant.config.nombre_tienda || tenant.nombre);
      setWhatsapp(tenant.config.whatsapp_contacto || '573105559876');
      setMargenWarn(tenant.config.margen_warn_pct ?? 15);
      setMargenDanger(tenant.config.margen_danger_pct ?? 0);
      setCatalogoActivo(tenant.config.catalogo_activo ?? true);
      setMensajeBienvenida(tenant.config.mensaje_bienvenida || '');
    }
  }, [tenant]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSaveConfig({
        nombre_tienda: nombreTienda.trim(),
        whatsapp_contacto: whatsapp.trim(),
        margen_warn_pct: Number(margenWarn),
        margen_danger_pct: Number(margenDanger),
        catalogo_activo: catalogoActivo,
        mensaje_bienvenida: mensajeBienvenida.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);
      await onInviteMember(inviteEmail.trim().toLowerCase(), inviteRole);
      setInviteEmail('');
    } catch (err) {
      console.error('Error inviting member:', err);
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div>
        <h2 className="font-serif-luxury text-2xl font-bold text-[#2A1820]">
          Configuración de Tienda & Equipo
        </h2>
        <p className="text-xs text-[#8E6B77]">
          Administra la identidad comercial, umbrales del semáforo de margen y acceso de colaboradoras.
        </p>
      </div>

      {/* Store & Margin Settings Form */}
      <div className="bg-white rounded-2xl border border-[#F2D6DF] shadow-xs p-6 space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#F2D6DF]">
          <div className="p-2 rounded-xl bg-[#FCEEF2] text-[#C4607A]">
            <Store size={20} />
          </div>
          <div>
            <h3 className="font-serif-luxury text-base font-bold text-[#2A1820]">
              Identidad de Tienda & Parámetros Comerciales
            </h3>
            <p className="text-xs text-[#8E6B77]">
              Parámetros de cálculo y catálogo digital público para {tenant.nombre}
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2A1820] mb-1">
                Nombre Comercial de la Tienda
              </label>
              <input
                type="text"
                value={nombreTienda}
                onChange={(e) => setNombreTienda(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#F2D6DF] bg-[#FFF9FB] text-[#2A1820]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2A1820] mb-1">
                WhatsApp Oficial de Ventas (Colombia) *
              </label>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF0F4] border border-[#F2D6DF] rounded-xl text-xs font-bold text-[#2A1820] select-none shrink-0">
                  <span className="text-base leading-none">🇨🇴</span>
                  <span>+57</span>
                </div>
                <input
                  type="tel"
                  value={whatsapp.replace(/^57/, '')}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    setWhatsapp(`57${clean}`);
                  }}
                  placeholder="310 555 9876"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-[#F2D6DF] bg-[#FFF9FB] text-[#2A1820] font-semibold"
                  required
                />
              </div>
              <span className="text-[10px] text-[#8E6B77] mt-1 block">
                Indicador fijado en Colombia (+57). Digita los 10 números de tu celular para recibir pedidos.
              </span>
            </div>
          </div>

          {/* Margins Thresholds */}
          <div className="p-4 rounded-xl bg-[#FAF0F4] border border-[#F2D6DF] space-y-3">
            <h4 className="font-bold text-xs text-[#2A1820] flex items-center gap-1.5">
              <Percent size={14} className="text-[#C4607A]" />
              Umbrales del Semáforo de Decisión Comercial:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#8E6B77] mb-1">
                  Umbral Alerta Preventiva ⚠️ (Margen inferior a %)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={margenWarn}
                    onChange={(e) => setMargenWarn(parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-1.5 rounded-lg border border-[#F2D6DF] bg-white text-[#2A1820] font-bold"
                  />
                  <span className="text-xs text-[#8E6B77]">% (Por defecto 15%)</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#8E6B77] mb-1">
                  Umbral Alerta Crítica 🔴 (Margen no competitivo menor o igual a %)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={margenDanger}
                    onChange={(e) => setMargenDanger(parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-1.5 rounded-lg border border-[#F2D6DF] bg-white text-[#2A1820] font-bold"
                  />
                  <span className="text-xs text-[#8E6B77]">% (Por defecto 0%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Message */}
          <div>
            <label className="block text-xs font-semibold text-[#2A1820] mb-1">
              Mensaje de Bienvenida del Catálogo Digital
            </label>
            <textarea
              rows={2}
              value={mensajeBienvenida}
              onChange={(e) => setMensajeBienvenida(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#F2D6DF] bg-[#FFF9FB] text-[#2A1820]"
            />
          </div>

          {/* Toggle Public Catalog */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#F2D6DF] bg-[#FFF9FB]">
            <div>
              <span className="font-semibold text-xs text-[#2A1820] block">
                Catálogo Web Público Activo
              </span>
              <span className="text-[11px] text-[#8E6B77]">
                URL pública disponible en: <code className="font-mono text-[#C4607A]">/catalogo/{tenant.slug}</code>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCatalogoActivo(!catalogoActivo)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                catalogoActivo ? 'bg-[#27AE60]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  catalogoActivo ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            {savedSuccess && (
              <span className="text-xs text-[#27AE60] font-bold flex items-center gap-1 animate-in fade-in">
                <CheckCircle size={14} /> ¡Ajustes guardados con éxito!
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="chic-gradient-btn px-6 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save size={14} />
              <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Team Members Management */}
      <div className="bg-white rounded-2xl border border-[#F2D6DF] shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#F2D6DF]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FAF0F4] text-[#8E6B77]">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-serif-luxury text-base font-bold text-[#2A1820]">
                Equipo & Permisos de Acceso
              </h3>
              <p className="text-xs text-[#8E6B77]">
                Colaboradoras con permisos de edición o administración en {tenant.nombre}
              </p>
            </div>
          </div>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row items-center gap-2.5 bg-[#FFF9FB] p-3 rounded-xl border border-[#F2D6DF]">
          <input
            type="email"
            placeholder="correo@colaboradora.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            className="flex-1 px-3.5 py-1.5 text-xs rounded-lg border border-[#F2D6DF] bg-white text-[#2A1820] w-full sm:w-auto"
          />
          <select
            value={inviteRole}
            onChange={(e: any) => setInviteRole(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-[#F2D6DF] bg-white text-[#2A1820] w-full sm:w-auto"
          >
            <option value="editor">Rol: Editora (Inventario)</option>
            <option value="admin">Rol: Administradora (Total)</option>
          </select>
          <button
            type="submit"
            disabled={inviting || !inviteEmail}
            className="chic-gradient-btn px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap w-full sm:w-auto justify-center"
          >
            <UserPlus size={14} />
            <span>{inviting ? 'Invitando...' : 'Invitar Usuario'}</span>
          </button>
        </form>

        {/* Members List */}
        <div className="space-y-2">
          {members.length === 0 ? (
            <p className="text-xs text-gray-400 py-3 text-center">
              No hay otros miembros registrados en esta tienda.
            </p>
          ) : (
            members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#F2D6DF] hover:bg-[#FAF0F4] transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#E8829A] text-white flex items-center justify-center font-bold text-xs">
                    {(m.email?.[0] || 'U').toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-[#2A1820] block">
                      {m.nombre || m.email}
                    </span>
                    <span className="text-[11px] text-[#8E6B77] block">{m.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#FAF0F4] text-[#8E6B77] border border-[#F2D6DF]">
                    {m.rol}
                  </span>
                  <button
                    onClick={() => onRemoveMember(m.id)}
                    className="p-1 rounded text-[#8E6B77] hover:text-[#D63031] cursor-pointer"
                    title="Remover acceso"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
