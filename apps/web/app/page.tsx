'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getHomeRouteForRole, Role } from '@svcm/shared';

export default function RootHomePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        const home = getHomeRouteForRole(user.role as Role);
        router.replace(home);
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-3 border-red border-t-transparent animate-spin" />
        <p className="text-xs text-text-mute font-medium">กำลังเปลี่ยนเส้นทาง...</p>
      </div>
    </div>
  );
}
