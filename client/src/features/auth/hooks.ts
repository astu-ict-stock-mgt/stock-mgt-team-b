import { useState, useEffect } from 'react';

export type Role =
  | 'ADMINISTRATOR'
  | 'PAO'
  | 'STOREKEEPER'
  | 'STOCK_CLERK'
  | 'ACCOUNTANT'
  | 'DEPARTMENT_HEAD'
  | 'SECURITY_OFFICER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export function useAuth() {
  const [currentRole, setCurrentRole] = useState<Role>(() => {
    const saved = localStorage.getItem('sms_user_role');
    return (saved as Role) || 'ADMINISTRATOR';
  });

  useEffect(() => {
    localStorage.setItem('sms_user_role', currentRole);
  }, [currentRole]);

  const user: User = {
    id: 'usr-admin-01',
    name: 'Marcus Vance',
    email: 'admin@system.local',
    role: currentRole,
  };

  const setRole = (role: Role) => {
    setCurrentRole(role);
  };

  return { user, setRole };
}
