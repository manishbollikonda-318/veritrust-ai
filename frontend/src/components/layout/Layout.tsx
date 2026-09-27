import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import CookieBanner from '../ui/CookieBanner';
import WelcomeBanner from '../ui/WelcomeBanner';
import DataSourceDisclosureModal from '../ui/DataSourceDisclosureModal';
import CreateWorkspaceModal from '../workspace/CreateWorkspaceModal';
import { useSidebar } from '../../context/SidebarContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-canvas flex text-slate-800 antialiased overflow-x-hidden">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col min-h-screen transition-[margin] duration-300 ease-in-out w-full
          ml-0 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}
        `}
      >
        <Header />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <WelcomeBanner />
          {children}
        </main>
        <CookieBanner />
        <DataSourceDisclosureModal />
        <CreateWorkspaceModal />
      </div>
    </div>
  );
}
