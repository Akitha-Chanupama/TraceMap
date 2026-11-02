import React from 'react';
import { getUserById, User } from '../services/user';

export const ProfileView = ({ userId }: { userId: string }) => {
  const user = getUserById(userId);
  return <div>Profile: {user ? user.name : 'Unknown'}</div>;
};
