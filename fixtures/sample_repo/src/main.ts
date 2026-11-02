import { formatDate } from './utils/formatter';
import { getUserById } from '@/services/user';

export function bootstrap() {
  const user = getUserById('1');
  const now = formatDate(new Date());
  console.log('App started at', now, 'with user', user?.name);
}
