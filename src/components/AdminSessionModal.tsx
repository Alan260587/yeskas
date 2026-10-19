import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Lock,
  Unlock,
  KeyRound,
  LogOut,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  User,
  FileText,
  Power,
} from 'lucide-react';
import { useSession } from '../context/SessionContext';

interface AdminSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInstructions: () => void;
}

export const AdminSessionModal: React.FC<AdminSessionModalProps> = ({
  isOpen,
  onClose,
  onOpenInstructions,
}) => {
  const {
    sessionId,
    myUserNumber,
    isAdmin,
    isAdminOccupiedByOther,
    activeAdminUserNumber,
    totalUsers,
    users,
    loginAdmin,
    logoutAdmin,
  } = useSession();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'invalid' | 'busy' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorType('invalid');
      setErrorMessage('Ingresa la contraseña de administrador (****).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setErrorType(null);

    const result = await loginAdmin(password);
    setIsSubmitting(false);

    if (result.ok) {
      setPassword('');
      setErrorMessage(null);
      setErrorType(null);
    } else {
      setErrorType(result.code === 'admin_already_connected' ? 'busy' : 'invalid');
      setErrorMessage(result.message);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setPassword('');
    setErrorMessage(null);
    setErrorType(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-900/90 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                isAdmin
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : isAdminOccupiedByOther
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
              }`}
            >
              {isAdmin ? (
                <ShieldCheck className="w-5 h-5" />
              ) : isAdminOccupiedByOther ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <KeyRound className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Control de Usuarios y Admin</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-cyan-400 border border-zinc-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {totalUsers} {totalUsers === 1 ? 'conectado' : 'conectados'}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Sesión actual: <strong className="text-zinc-200">Usuario #{myUserNumber}</strong> (
                {isAdmin ? 'Administrador Exclusivo' : 'Usuario Normal / Cliente'})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
            aria-label="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status Banner */}
          {isAdmin ? (
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-sm font-black text-emerald-300">
                      Sesión de Administrador Activa (1/1)
                    </h4>
                    <p className="text-xs text-zinc-300 mt-0.5">
                      Tienes el control exclusivo de Administrador. Los demás usuarios conectados están en modo normal y no pueden entrar a Admin mientras estés conectado.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950/70 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2.5 text-xs text-zinc-300">
                <Power className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong className="text-white">Cierre automático activo:</strong> Al cerrar o recargar la página, tu sesión de Administrador se cerrará automáticamente.
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    onOpenInstructions();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950/50 transition cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Abrir Instructivo y PDF (Desbloqueado)</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión Admin</span>
                </button>
              </div>
            </div>
          ) : isAdminOccupiedByOther ? (
            <div className="bg-rose-950/30 border border-rose-500/40 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-black text-rose-300">
                    Administrador Ocupado (1/1 en uso por Usuario #{activeAdminUserNumber ?? 1})
                  </h4>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    Actualmente ya hay <strong>1 Administrador conectado</strong> en otra sesión. Tu cuenta se mantiene en <strong>Modo Usuario Normal (Cliente)</strong>.
                  </p>
                  <p className="text-[11px] text-rose-300/90 mt-1.5 font-medium">
                    • Solo se permite 1 Administrador conectado a la vez. En cuanto el Administrador actual cierre su página o cierre sesión, se liberará automáticamente el acceso.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4">
              <div className="flex items-start gap-2.5">
                <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-black text-amber-300">
                    Estás en Modo Usuario Normal (Cliente)
                  </h4>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    El puesto de Administrador está disponible (0/1). Ingresa la clave secreta (<span className="font-mono text-amber-300">****</span>) para conectarte como único Administrador.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Admin Login Form for Normal Users */}
          {!isAdmin && (
            <form onSubmit={handleLogin} className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <label className="block text-xs font-bold text-zinc-300">
                Conectar como Administrador (Clave requerida: <span className="font-mono text-amber-400">****</span>)
              </label>

              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Ingresa la contraseña (****)"
                  disabled={isSubmitting}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-950 border ${
                    errorMessage
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-zinc-700 focus:border-amber-500'
                  } text-sm text-white font-mono tracking-widest focus:outline-none transition`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {errorMessage && (
                <div
                  className={`flex items-start gap-2 text-xs p-2.5 rounded-xl border ${
                    errorType === 'busy'
                      ? 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                      : 'bg-rose-950/30 border-rose-500/30 text-rose-400'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-zinc-950 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-950/30"
              >
                <Unlock className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Verificando disponibilidad...'
                    : 'Entrar en Modo Administrador (1 a la vez)'}
                </span>
              </button>
            </form>
          )}

          {/* Real-Time Connected Users List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Usuarios Conectados en Tiempo Real ({totalUsers})</span>
              </h4>
              <span className="text-[11px] text-zinc-500">
                Máximo 1 Admin activo
              </span>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl divide-y divide-zinc-800/80 max-h-48 overflow-y-auto">
              {users.map((u) => {
                const isMe = u.sessionId === sessionId;
                const isUserAdmin = u.role === 'admin';
                return (
                  <div
                    key={u.sessionId}
                    className="flex items-center justify-between px-4 py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isUserAdmin
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {isUserAdmin ? (
                          <UserCheck className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                          <span>Usuario #{u.userNumber}</span>
                          {isMe && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-extrabold">
                              TÚ
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500">
                          {isUserAdmin
                            ? 'Acceso total al manual, guiones y descarga PDF'
                            : 'Modo Normal (Catálogo, carrito y calculadora)'}
                        </p>
                      </div>
                    </div>

                    <div>
                      {isUserAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[11px]">
                          <ShieldCheck className="w-3 h-3" />
                          Admin Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-semibold text-[11px]">
                          Normal
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
