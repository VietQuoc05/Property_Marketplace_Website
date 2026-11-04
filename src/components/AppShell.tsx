'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { SidebarNavigation } from './SidebarNavigation';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/login');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <SidebarNavigation />
      <div className="flex-1 w-full pl-16 md:pl-52 lg:pl-56 min-h-screen flex flex-col transition-all duration-200">
        {children}
      </div>
    </div>
  );
};
