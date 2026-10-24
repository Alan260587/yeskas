import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';

export interface ConnectedUser {
  sessionId: string;
  userNumber: number;
  role: 'admin' | 'user';
  connectedAt: number;
}

export interface AdminLoginResult {
  ok: boolean;
  code: 'admin_granted' | 'invalid_password' | 'admin_already_connected' | 'error';
  message: string;
}

interface SessionContextValue {
  sessionId: string;
  myUserNumber: number;
  isAdmin: boolean;
  isAdminOccupiedByOther: boolean;
  activeAdminSessionId: string | null;
  activeAdminUserNumber: number | null;
  totalUsers: number;
  users: ConnectedUser[];
  loginAdmin: (password: string) => Promise<AdminLoginResult>;
  logoutAdmin: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

const ADMIN_PASS_FALLBACK = '1987';
const LEGACY_STORAGE_KEY = 'growth_viral_admin_pass_1987';

function createEphemeralSessionId(): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  const timePart = Date.now().toString(36);
  return `sess_${timePart}_${randomPart}`;
}

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Strictly in-memory sessionId: closing or reloading the page always creates a brand new normal user session
  const [sessionId] = useState<string>(() => createEphemeralSessionId());
  const [users, setUsers] = useState<ConnectedUser[]>([
    {
      sessionId,
      userNumber: 1,
      role: 'user',
      connectedAt: Date.now(),
    },
  ]);
  const [activeAdminSessionId, setActiveAdminSessionId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const localPeersRef = useRef<Map<string, ConnectedUser>>(new Map());
  const serverAvailableRef = useRef<boolean>(true);
  const activeAdminRef = useRef<string | null>(null);

  useEffect(() => {
    activeAdminRef.current = activeAdminSessionId;
  }, [activeAdminSessionId]);

  // Clear any legacy persistent storage keys so Admin never persists after closing page
  useEffect(() => {
    try {
      sessionStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const applyServerState = useCallback((data: any) => {
    if (!data || !Array.isArray(data.users)) return;
    serverAvailableRef.current = true;
    const nextAdminId = data.activeAdminSessionId ?? null;
    setActiveAdminSessionId((prev) => (prev === nextAdminId ? prev : nextAdminId));
    setUsers((prev) => {
      if (prev.length === data.users.length) {
        let same = true;
        for (let i = 0; i < prev.length; i++) {
          if (
            prev[i].sessionId !== data.users[i].sessionId ||
            prev[i].role !== data.users[i].role ||
            prev[i].userNumber !== data.users[i].userNumber
          ) {
            same = false;
            break;
          }
        }
        if (same) return prev;
      }
      return data.users;
    });
  }, []);

  const syncWithServer = useCallback(async () => {
    try {
      const res = await fetch('/api/session/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        const data = await res.json();
        applyServerState(data);
      }
    } catch {
      // Fallback handled by BroadcastChannel if offline
    }
  }, [sessionId, applyServerState]);

  useEffect(() => {
    // Initial HTTP sync
    syncWithServer();

    // Setup BroadcastChannel for instant zero-latency cross-tab sync
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('growth_viral_multiuser_sync_v1');
        bcRef.current = bc;

        bc.onmessage = (event) => {
          const msg = event.data;
          if (!msg || typeof msg !== 'object') return;

          if (msg.type === 'bc:refresh') {
            syncWithServer();
          } else if (msg.type === 'bc:admin_claimed' && msg.sessionId) {
            setActiveAdminSessionId(msg.sessionId);
            syncWithServer();
          } else if (msg.type === 'bc:admin_released') {
            setActiveAdminSessionId((prev) => (prev === msg.sessionId ? null : prev));
            syncWithServer();
          } else if (msg.type === 'bc:leave' && msg.sessionId) {
            setActiveAdminSessionId((prev) => (prev === msg.sessionId ? null : prev));
            setUsers((prev) => prev.filter((u) => u.sessionId !== msg.sessionId));
            syncWithServer();
          }
        };

        bc.postMessage({ type: 'bc:refresh', sessionId });
      } catch {
        // Ignore BroadcastChannel errors
      }
    }

    // Setup WebSocket connection for instant server-authoritative updates & disconnect detection
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isUnloading = false;

    const connectWs = () => {
      if (isUnloading) return;
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws-session?sessionId=${encodeURIComponent(sessionId)}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'session:init', sessionId }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'session:state') {
              applyServerState(data);
            } else if (data.type === 'admin:config_updated' || data.type === 'admin:orders_updated' || data.type === 'pdfs:updated') {
              window.dispatchEvent(new CustomEvent('growth-viral-ws-event', { detail: data }));
            }
          } catch {
            // Ignore parse errors
          }
        };

        ws.onclose = () => {
          if (!isUnloading) {
            reconnectTimer = setTimeout(connectWs, 3500);
          }
        };
      } catch {
        // Fallback to HTTP polling
      }
    };

    connectWs();

    // Heartbeat interval every 7 seconds
    const heartbeatInterval = setInterval(() => {
      if (isUnloading) return;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ type: 'session:heartbeat', sessionId }));
          return;
        } catch {
          // Fallback to HTTP sync
        }
      }
      syncWithServer();
    }, 7000);

    // Automatic session close on page close / reload / tab close
    const handlePageClose = () => {
      isUnloading = true;
      try {
        sessionStorage.removeItem(LEGACY_STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        // Ignore
      }

      try {
        if (bcRef.current) {
          bcRef.current.postMessage({ type: 'bc:leave', sessionId });
        }
      } catch {
        // Ignore
      }

      try {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'session:leave', sessionId }));
          wsRef.current.close();
        }
      } catch {
        // Ignore
      }

      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify({ sessionId })], { type: 'application/json' });
          navigator.sendBeacon('/api/session/leave', blob);
        } else {
          fetch('/api/session/leave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        // Ignore
      }
    };

    window.addEventListener('pagehide', handlePageClose);
    window.addEventListener('beforeunload', handlePageClose);
    window.addEventListener('unload', handlePageClose);

    return () => {
      isUnloading = true;
      clearInterval(heartbeatInterval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      window.removeEventListener('pagehide', handlePageClose);
      window.removeEventListener('beforeunload', handlePageClose);
      window.removeEventListener('unload', handlePageClose);
      handlePageClose();
      if (bc) {
        try {
          bc.close();
        } catch {
          // Ignore
        }
      }
    };
  }, [sessionId, applyServerState, syncWithServer]);

  const loginAdmin = useCallback(
    async (password: string): Promise<AdminLoginResult> => {
      const cleanPassword = password.trim();
      try {
        const res = await fetch('/api/session/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, password: cleanPassword }),
        });

        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
        }

        if (res.ok && data.ok) {
          if (bcRef.current) {
            bcRef.current.postMessage({ type: 'bc:admin_claimed', sessionId });
          }
          return {
            ok: true,
            code: 'admin_granted',
            message: data.message || 'Modo Administrador activado.',
          };
        }

        if (res.status === 409 || data.code === 'admin_already_connected') {
          return {
            ok: false,
            code: 'admin_already_connected',
            message:
              data.message ||
              'Ya hay un Administrador conectado en otra sesión. Solo se permite 1 Administrador a la vez.',
          };
        }

        return {
          ok: false,
          code: 'invalid_password',
          message: data.message || 'Contraseña incorrecta. Inténtalo de nuevo.',
        };
      } catch {
        // Fallback if server endpoint unreachable
        if (activeAdminRef.current && activeAdminRef.current !== sessionId) {
          return {
            ok: false,
            code: 'admin_already_connected',
            message: 'Ya hay un Administrador conectado en este momento. Solo se permite 1 a la vez.',
          };
        }
        if (cleanPassword === ADMIN_PASS_FALLBACK) {
          setActiveAdminSessionId(sessionId);
          setUsers((prev) =>
            prev.map((u) => ({
              ...u,
              role: u.sessionId === sessionId ? 'admin' : 'user',
            }))
          );
          if (bcRef.current) {
            bcRef.current.postMessage({ type: 'bc:admin_claimed', sessionId });
          }
          return {
            ok: true,
            code: 'admin_granted',
            message: 'Modo Administrador activado.',
          };
        }
        return {
          ok: false,
          code: 'invalid_password',
          message: 'Contraseña incorrecta. Inténtalo de nuevo.',
        };
      }
    },
    [sessionId, applyServerState]
  );

  const logoutAdmin = useCallback(async () => {
    try {
      sessionStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Ignore
    }

    setActiveAdminSessionId((prev) => (prev === sessionId ? null : prev));
    setUsers((prev) =>
      prev.map((u) => (u.sessionId === sessionId ? { ...u, role: 'user' } : u))
    );

    if (bcRef.current) {
      bcRef.current.postMessage({ type: 'bc:admin_released', sessionId });
    }

    try {
      const res = await fetch('/api/session/admin-logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          applyServerState(data.state);
        }
      }
    } catch {
      // Ignore network errors on logout
    }
  }, [sessionId, applyServerState]);

  const myUser = users.find((u) => u.sessionId === sessionId);
  const myUserNumber = myUser?.userNumber ?? 1;
  const isAdmin = activeAdminSessionId === sessionId;
  const isAdminOccupiedByOther = Boolean(activeAdminSessionId && activeAdminSessionId !== sessionId);
  const activeAdminUser = users.find((u) => u.sessionId === activeAdminSessionId);
  const activeAdminUserNumber = activeAdminUser?.userNumber ?? null;
  const totalUsers = Math.max(1, users.length);

  const contextValue = useMemo<SessionContextValue>(
    () => ({
      sessionId,
      myUserNumber,
      isAdmin,
      isAdminOccupiedByOther,
      activeAdminSessionId,
      activeAdminUserNumber,
      totalUsers,
      users,
      loginAdmin,
      logoutAdmin,
    }),
    [
      sessionId,
      myUserNumber,
      isAdmin,
      isAdminOccupiedByOther,
      activeAdminSessionId,
      activeAdminUserNumber,
      totalUsers,
      users,
      loginAdmin,
      logoutAdmin,
    ]
  );

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
}
