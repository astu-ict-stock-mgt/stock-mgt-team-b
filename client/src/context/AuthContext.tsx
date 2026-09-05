import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { SessionExpiredModal } from '../components/SessionExpiredModal';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string | null;
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload) as { exp?: number };
    if (!parsed.exp) return false;
    // Expired if current time is within 10 seconds of exp timestamp
    return Date.now() >= parsed.exp * 1000 - 10000;
  } catch {
    return true;
  }
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  sessionExpiredMessage: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  handleSessionExpired: (message?: string) => void;
  clearSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const initialExpired = useMemo(() => {
    const stored = localStorage.getItem('auth_token');
    return Boolean(stored && isTokenExpired(stored));
  }, []);

  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem('auth_token');
    if (!stored) return null;
    if (isTokenExpired(stored)) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      return null;
    }
    return stored;
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    if (initialExpired) return null;
    try {
      const saved = localStorage.getItem('auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isSessionExpired, setIsSessionExpired] = useState(initialExpired);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);

  const handleSessionExpired = useCallback((message?: string) => {
    setIsSessionExpired(true);
    if (message) {
      setSessionExpiredMessage(message);
    }
  }, []);

  const clearSessionExpired = useCallback(() => {
    setIsSessionExpired(false);
    setSessionExpiredMessage(null);
  }, []);

  const login = useCallback(
    (newToken: string, newUser: AuthUser) => {
      setToken(newToken);
      setUser(newUser);
      clearSessionExpired();
      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('auth_user', JSON.stringify(newUser));
    },
    [clearSessionExpired]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }, []);

  const handleModalLoginAgain = useCallback(() => {
    logout();
    clearSessionExpired();
    window.location.href = '/login?reason=session_expired';
  }, [logout, clearSessionExpired]);

  // Listen for global session expiration events broadcasted by API client
  useEffect(() => {
    const handleExpiredEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      handleSessionExpired(customEvent.detail?.message);
    };

    window.addEventListener('auth:session-expired', handleExpiredEvent);
    return () => {
      window.removeEventListener('auth:session-expired', handleExpiredEvent);
    };
  }, [handleSessionExpired]);

  // Periodic and focus-based token expiration check
  useEffect(() => {
    if (!token) return;

    const checkToken = () => {
      if (token && isTokenExpired(token)) {
        handleSessionExpired();
      }
    };

    const interval = setInterval(checkToken, 30000);
    window.addEventListener('focus', checkToken);
    document.addEventListener('visibilitychange', checkToken);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkToken);
      document.removeEventListener('visibilitychange', checkToken);
    };
  }, [token, handleSessionExpired]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isSessionExpired,
      sessionExpiredMessage,
      login,
      logout,
      handleSessionExpired,
      clearSessionExpired,
    }),
    [
      token,
      user,
      isSessionExpired,
      sessionExpiredMessage,
      login,
      logout,
      handleSessionExpired,
      clearSessionExpired,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionExpiredModal
        isOpen={isSessionExpired}
        message={sessionExpiredMessage}
        onLoginAgain={handleModalLoginAgain}
      />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
}
