import { useState } from 'react';
import { loginUser, type LoginRequest, type LoginResponse } from './api';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../users/types';

export { useAuth };
export type { Role };

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();

  const submitLogin = async (credentials: LoginRequest): Promise<LoginResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await loginUser(credentials);
      login(response.token, response.user);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    submitLogin,
    isLoading,
    error,
  };
}
