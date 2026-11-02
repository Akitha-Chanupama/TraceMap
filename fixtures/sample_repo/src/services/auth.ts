import { getUserById } from './user';

export class AuthService {
  validateToken(token: string): boolean {
    return Boolean(token && token.length > 8);
  }

  authenticate(userId: string): boolean {
    const user = getUserById(userId);
    return Boolean(user);
  }
}

