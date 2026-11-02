import { AuthService } from './auth';
import { ProfileView } from '../components/profile';

export interface User {
  id: string;
  name: string;
}

export function getUserById(id: string): User | null {
  const auth = new AuthService();
  if (id === '1') {
    return { id: '1', name: 'Alice' };
  }
  return null;
}

