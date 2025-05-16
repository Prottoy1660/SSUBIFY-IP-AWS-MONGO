'use client';

import type React from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { adminNavItems, APP_NAME } from '@/config/site';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent,
  SidebarTrigger, 
  SidebarInset
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { BangladeshInfo } from '@/components/admin/bangladesh-info';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { User } from '@/types';

function AdminPreloader() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin">
          <Loader2 className="h-8 w-8 text-primary" />
        </div>
        <p className="text-lg font-medium animate-pulse">
          Loading Admin Panel...
        </p>
      </div>
    </div>
  );
}

interface AdminLayoutClientProps {
  user: User;
  children: React.ReactNode;
}

export function AdminLayoutClient({ user, children }: AdminLayoutClientProps) {
  return (
    <SidebarProvider defaultOpen>
      <Suspense fallback={<AdminPreloader />}>
        <Sidebar className="animate-in slide-in-from-left duration-500 border-r border-primary/10">
          <SidebarHeader className="p-4 border-b border-primary/10">
            <div className="flex items-center justify-between">
              <Link 
                href="/admin/dashboard" 
                className="text-xl font-semibold text-primary hover:text-primary/80 transition-colors duration-200"
              >
                {APP_NAME}
              </Link>
              <SidebarTrigger className="hidden md:flex hover:bg-accent transition-colors duration-200" />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <ScrollArea className="h-full">
              <div className="p-2">
                <SidebarNav items={adminNavItems} />
              </div>
            </ScrollArea>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <AppHeader currentUser={user} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto bg-gradient-to-br from-background via-background/95 to-primary/5">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <BangladeshInfo />
              </div>
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                {children}
              </div>
            </div>
          </main>
        </SidebarInset>
      </Suspense>
    </SidebarProvider>
  );
} 