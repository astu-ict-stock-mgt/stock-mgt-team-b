export interface User {
  id: string;
  name: string;
  role:
    | 'ADMINISTRATOR'
    | 'PAO'
    | 'STOREKEEPER'
    | 'STOCK_CLERK'
    | 'ACCOUNTANT'
    | 'DEPARTMENT_HEAD'
    | 'SECURITY_OFFICER';
}

export function useAuth() {
  // Mocked for now, as real Auth is tracked in Issue #6
  const user: User = {
    id: 'mock-user-1',
    name: 'Henok',
    role: 'PAO', // Change to 'STOREKEEPER' to test RBAC logic
  };

  return { user };
}
