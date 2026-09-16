'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { MenuKey } from '@svcm/shared';
import Forbidden403Page from '@/app/(staff)/403/page';

export interface MenuGuardProps {
  menuKey: MenuKey;
  children: React.ReactNode;
}

export const MenuGuard: React.FC<MenuGuardProps> = ({ menuKey, children }) => {
  const { user, isLoading, hasMenu } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user || !hasMenu(menuKey)) {
    return <Forbidden403Page />;
  }

  return <>{children}</>;
};
