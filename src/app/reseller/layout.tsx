import type React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { resellerNavItems, APP_NAME } from '@/config/site';
import { LOGIN_PATH } from '@/lib/constants';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PanelLeft } from 'lucide-react';

export default async function ResellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'reseller') {
    redirect(LOGIN_PATH); 
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-between">
            <Link href="/reseller/dashboard" className="text-xl font-semibold text-primary">
              {APP_NAME}
            </Link>
            <SidebarTrigger className="hidden md:flex" /> 
          </div>
        </SidebarHeader>
        <SidebarContent>
          <ScrollArea className="h-full">
            <div className="p-2">
              <SidebarNav items={resellerNavItems} />
            </div>
          </ScrollArea>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <AppHeader currentUser={user} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

